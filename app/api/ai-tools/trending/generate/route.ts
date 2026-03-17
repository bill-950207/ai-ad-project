/**
 * AI 트렌딩 도구 - 생성 API
 *
 * POST /api/ai-tools/trending/generate
 *
 * 지원 모델:
 * - face-transform: Kling 3.0 Motion Control 기반 얼굴 변환 (멀티 세그먼트)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { hasEnoughCredits, deductCredits, refundCredits, getUserCredits } from '@/lib/credits/utils'
import { recordCreditUse, recordCreditRefund } from '@/lib/credits/history'
import {
  KLING3_MC_STD_CREDIT_PER_SECOND,
  KLING3_MC_PRO_CREDIT_PER_SECOND,
  IMAGE_EDIT_CREDIT_COST,
} from '@/lib/credits/constants'
import {
  submitKling3McToQueue,
  getFalQueueStatus,
  getFalQueueResult,
} from '@/lib/fal/client'
import { fal } from '@fal-ai/client'
import { downloadToTemp, extractFrameFromFile, trimVideoFromFile } from '@/lib/video/ffmpeg'
import { uploadBufferToR2 } from '@/lib/storage/r2'
import { promises as fs } from 'fs'
import sharp from 'sharp'

// ============================================================
// 요청 타입
// ============================================================

interface TransformSegment {
  type: 'original' | 'transform'
  startTime: number
  endTime: number
  targetImageUrl?: string
}

interface FaceTransformRequest {
  model: 'face-transform'
  sourceVideoUrl: string
  segments: TransformSegment[]
  tier: 'standard' | 'pro'
  prompt?: string
}

type TrendingGenerateRequest = FaceTransformRequest

// ============================================================
// 크레딧 계산
// ============================================================

const MIN_SEGMENT_DURATION = 3.3 // Kling MC 최소 3초 + 안전 마진

function calculateCredits(req: FaceTransformRequest): number {
  const perSecond = req.tier === 'pro'
    ? KLING3_MC_PRO_CREDIT_PER_SECOND['720p']
    : KLING3_MC_STD_CREDIT_PER_SECOND['720p']

  const transformSegments = req.segments.filter((s) => s.type === 'transform')

  return transformSegments.reduce((total, seg) => {
    const duration = seg.endTime - seg.startTime
    const klingCost = Math.ceil(perSecond * Math.max(MIN_SEGMENT_DURATION, duration))
    const editCost = IMAGE_EDIT_CREDIT_COST.medium // 배경 합성 비용 (세그먼트당)
    return total + klingCost + editCost
  }, 0)
}

// ============================================================
// Seedream 4.5 Edit (FAL.ai) — 모델 ID + 제출 함수
// ============================================================

const KLING_I2I_MODEL = 'fal-ai/kling-image/o3/image-to-image'

async function submitKlingI2IToQueue(input: {
  prompt: string
  image_url: string
  image_size: { width: number; height: number }
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { request_id } = await fal.queue.submit(KLING_I2I_MODEL as any, {
    input: {
      prompt: input.prompt,
      image_url: input.image_url,
      image_size: input.image_size,
    },
  })
  return { request_id }
}

// ============================================================
// API 핸들러
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: TrendingGenerateRequest = await request.json()

    // 유효성 검증
    if (body.model !== 'face-transform') {
      return NextResponse.json({ error: '지원하지 않는 모델입니다' }, { status: 400 })
    }
    if (!body.sourceVideoUrl) {
      return NextResponse.json({ error: '원본 영상이 필요합니다' }, { status: 400 })
    }
    if (!body.segments || body.segments.length === 0) {
      return NextResponse.json({ error: '세그먼트가 필요합니다' }, { status: 400 })
    }

    const transformSegments = body.segments.filter((s) => s.type === 'transform')
    if (transformSegments.length === 0) {
      return NextResponse.json({ error: '변환 구간이 최소 1개 필요합니다' }, { status: 400 })
    }

    // 세그먼트 검증 (강화)
    for (const seg of body.segments) {
      if (!Number.isFinite(seg.startTime) || !Number.isFinite(seg.endTime)) {
        return NextResponse.json({ error: '유효하지 않은 시간 값입니다' }, { status: 400 })
      }
      if (seg.startTime < 0) {
        return NextResponse.json({ error: '시작 시간은 0 이상이어야 합니다' }, { status: 400 })
      }
      if (seg.endTime <= seg.startTime) {
        return NextResponse.json({ error: '종료 시간은 시작 시간보다 커야 합니다' }, { status: 400 })
      }
      if (seg.endTime > 3600) {
        return NextResponse.json({ error: '영상 길이가 너무 깁니다 (최대 1시간)' }, { status: 400 })
      }
      if (seg.type === 'transform' && !seg.targetImageUrl) {
        return NextResponse.json({ error: '변환 구간에는 대상 이미지가 필요합니다' }, { status: 400 })
      }
    }

    // transform 세그먼트 간 겹침 검사
    const sorted = [...transformSegments].sort((a, b) => a.startTime - b.startTime)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startTime < sorted[i - 1].endTime) {
        return NextResponse.json({ error: '변환 구간이 서로 겹칩니다' }, { status: 400 })
      }
    }

    // 크레딧 계산 및 확인
    const creditsRequired = calculateCredits(body)
    const hasCredits = await hasEnoughCredits(user.id, creditsRequired)
    if (!hasCredits) {
      return NextResponse.json(
        { error: '크레딧이 부족합니다', required: creditsRequired },
        { status: 402 }
      )
    }

    // 크레딧 차감 + tool_generations 레코드 생성 (트랜잭션)
    const generation = await prisma.$transaction(async (tx) => {
      await deductCredits(tx, user.id, creditsRequired)

      const profile = await tx.profiles.findUnique({
        where: { id: user.id },
        select: { credits: true },
      })

      await recordCreditUse({
        userId: user.id,
        featureType: 'TOOL_TRENDING',
        amount: creditsRequired,
        balanceAfter: profile?.credits ?? 0,
        description: `얼굴 변환 (${transformSegments.length}구간, ${body.tier})`,
      }, tx)

      return tx.tool_generations.create({
        data: {
          user_id: user.id,
          type: 'trending',
          model: 'face-transform',
          prompt: body.prompt || '얼굴 변환',
          input_params: {
            sourceVideoUrl: body.sourceVideoUrl,
            segments: body.segments as unknown as Record<string, unknown>[],
            tier: body.tier,
          } as never,
          status: 'PENDING',
          credits_used: creditsRequired,
        },
      })
    })

    // 세그먼트 타입 분류
    const segmentTasks: Array<{
      index: number
      type: 'original' | 'transform'
      startTime: number
      endTime: number
      originalDuration?: number // 유저가 선택한 원래 구간 길이 (3초 미만일 때 트림용)
      providerTaskId?: string
      targetImageUrl?: string
    }> = []

    // 소스 영상을 한 번만 다운로드
    let sourceFilePath: string | null = null
    let sourceTempDir: string | null = null

    try {
      // 소스 영상 다운로드 (1회)
      const dl = await downloadToTemp(body.sourceVideoUrl, 'mp4')
      sourceFilePath = dl.filePath
      sourceTempDir = dl.tempDir
      console.log(`[Trending] Source video downloaded: ${sourceFilePath}`)

      // original 세그먼트는 즉시 등록
      for (let i = 0; i < body.segments.length; i++) {
        if (body.segments[i].type === 'original') {
          segmentTasks.push({
            index: i,
            type: 'original',
            startTime: body.segments[i].startTime,
            endTime: body.segments[i].endTime,
          })
        }
      }

      const transformSegs = body.segments
        .map((seg, i) => ({ seg, i }))
        .filter(({ seg }) => seg.type === 'transform')

      // ============================================================
      // Phase 1: 모든 세그먼트의 프레임 추출 + 영상 트리밍 + R2 업로드 (전체 병렬)
      // 로컬 파일 기반 — 소스 영상 재다운로드 없음
      // ============================================================
      const prepResults = await Promise.all(
        transformSegs.map(async ({ seg, i }) => {
          // Kling MC 최소 3초 → 3초 미만 구간은 3초로 확장하여 트리밍
          const segDuration = seg.endTime - seg.startTime
          const klingEndTime = segDuration < MIN_SEGMENT_DURATION
            ? seg.startTime + MIN_SEGMENT_DURATION
            : seg.endTime

          console.log(`[Trending] Trim seg${i}: ${seg.startTime}s ~ ${klingEndTime}s (original: ${segDuration}s, kling: ${klingEndTime - seg.startTime}s)`)

          const [frameBuffer, trimmedBuffer] = await Promise.all([
            extractFrameFromFile(sourceFilePath!, seg.startTime),
            trimVideoFromFile(sourceFilePath!, seg.startTime, klingEndTime, MIN_SEGMENT_DURATION),
          ])

          console.log(`[Trending] Trimmed seg${i} buffer size: ${trimmedBuffer.length} bytes`)

          const ts = Date.now()
          const [frameUrl, trimmedUrl] = await Promise.all([
            uploadBufferToR2(frameBuffer, `trending/${user.id}/frame_${generation.id}_seg${i}_${ts}.jpg`, 'image/jpeg'),
            uploadBufferToR2(trimmedBuffer, `trending/${user.id}/trim_${generation.id}_seg${i}_${ts}.mp4`, 'video/mp4'),
          ])

          // 프레임 실제 크기 저장 (후처리 crop용)
          const frameMeta = await sharp(frameBuffer).metadata()
          const frameWidth = frameMeta.width || 720
          const frameHeight = frameMeta.height || 1280

          return { index: i, seg, frameUrl, trimmedUrl, frameWidth, frameHeight }
        })
      )

      // ============================================================
      // Phase 2: 모든 Kling Image O3 I2I 제출 (병렬)
      // 인물 사진을 프레임 비율로 resize 후, Kling I2I로 배경 합성
      // ============================================================
      const editSubmissions = await Promise.all(
        prepResults.map(async ({ index, seg, frameUrl, trimmedUrl, frameWidth, frameHeight }) => {
          // 원본 인물 사진을 프레임 비율에 맞게 resize → R2 업로드
          const personImgRes = await fetch(seg.targetImageUrl!)
          const personImgBuffer = Buffer.from(await personImgRes.arrayBuffer())
          const resizedPersonBuffer = await sharp(personImgBuffer)
            .resize(frameWidth, frameHeight, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 90 })
            .toBuffer()
          const resizedPersonKey = `trending/${user.id}/person_${generation.id}_seg${index}_${Date.now()}.jpg`
          const resizedPersonUrl = await uploadBufferToR2(resizedPersonBuffer, resizedPersonKey, 'image/jpeg')

          console.log(`[Trending] Kling I2I submit seg${index}:`, { personUrl: resizedPersonUrl.substring(0, 60), frameSize: `${frameWidth}x${frameHeight}` })
          const editResult = await submitKlingI2IToQueue({
            prompt: `Transform this person's surroundings to match the background scene from the video frame. Keep the person's face, pose, and body exactly the same. Only change the background environment to match: ${frameUrl}`,
            image_url: resizedPersonUrl,
            image_size: { width: frameWidth, height: frameHeight },
          })
          return { index, seg, trimmedUrl, editRequestId: editResult.request_id, frameWidth, frameHeight }
        })
      )

      // ============================================================
      // Phase 3: 모든 Kling I2I 완료 대기 (병렬 폴링)
      // ============================================================
      const editResults = await Promise.all(
        editSubmissions.map(async ({ index, seg, trimmedUrl, editRequestId, frameWidth, frameHeight }) => {
          for (let attempt = 0; attempt < 60; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 3000))
            const editStatus = await getFalQueueStatus(KLING_I2I_MODEL, editRequestId)
            if (editStatus.status === 'COMPLETED') {
              const editResponse = await getFalQueueResult(KLING_I2I_MODEL, editRequestId)
              const rawImageUrl = editResponse.images?.[0]?.url
              if (rawImageUrl) {
                console.log(`[Trending] Seedream 4.5 Edit completed seg${index}:`, rawImageUrl.substring(0, 80))

                // 결과 이미지를 프레임과 동일 크기로 crop+resize (안전장치)
                const imgRes = await fetch(rawImageUrl)
                const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
                const resizedBuffer = await sharp(imgBuffer)
                  .resize(frameWidth, frameHeight, { fit: 'cover', position: 'centre' })
                  .jpeg({ quality: 90 })
                  .toBuffer()

                const resizedKey = `trending/${user.id}/edited_${generation.id}_seg${index}_${Date.now()}.jpg`
                const compositedImageUrl = await uploadBufferToR2(resizedBuffer, resizedKey, 'image/jpeg')

                return { index, seg, trimmedUrl, compositedImageUrl }
              }
            }
          }
          throw new Error(`세그먼트 ${index}: 배경 합성에 실패했습니다`)
        })
      )

      // ============================================================
      // Phase 4: 모든 Kling MC 제출 (병렬)
      // ============================================================
      const klingResults = await Promise.all(
        editResults.map(async ({ index, seg, trimmedUrl, compositedImageUrl }) => {
          console.log(`[Trending] Kling MC submit seg${index}:`, { image_url: compositedImageUrl.substring(0, 80), video_url: trimmedUrl.substring(0, 80), tier: body.tier })
          const result = await submitKling3McToQueue({
            prompt: body.prompt || '영상 속 인물을 변환합니다',
            image_url: compositedImageUrl,
            video_url: trimmedUrl,
            character_orientation: 'image',
            keep_original_sound: true,
            tier: body.tier,
          })
          const tierTag = body.tier === 'pro' ? 'kling3mcp' : 'kling3mcs'
          return { index, seg, providerTaskId: `fal-${tierTag}:${result.request_id}` }
        })
      )

      // 결과를 segmentTasks에 추가
      for (const { index, seg, providerTaskId } of klingResults) {
        const segDuration = seg.endTime - seg.startTime
        segmentTasks.push({
          index,
          type: 'transform',
          startTime: seg.startTime,
          endTime: seg.endTime,
          originalDuration: segDuration < MIN_SEGMENT_DURATION ? segDuration : undefined,
          providerTaskId,
          targetImageUrl: seg.targetImageUrl,
        })
      }

      // input_params에 segmentTasks 정보 업데이트
      await prisma.tool_generations.update({
        where: { id: generation.id },
        data: {
          status: 'IN_PROGRESS',
          input_params: {
            sourceVideoUrl: body.sourceVideoUrl,
            segments: body.segments,
            tier: body.tier,
            segmentTasks,
          } as never,
        },
      })

      return NextResponse.json({
        id: generation.id,
        creditsUsed: creditsRequired,
        totalSegments: body.segments.length,
        transformSegments: transformSegments.length,
      })
    } catch (providerError) {
      // 에러 body 상세 로깅
      const err = providerError as Record<string, unknown>
      if (err.body) {
        console.error('[Trending Generate] Error body:', JSON.stringify(err.body, null, 2))
      }
      console.error('[Trending Generate] Provider error:', providerError)

      // 크레딧 환불
      const currentCredits = await getUserCredits(user.id)
      await refundCredits(user.id, creditsRequired)
      await recordCreditRefund({
        userId: user.id,
        featureType: 'TOOL_TRENDING',
        amount: creditsRequired,
        balanceAfter: currentCredits + creditsRequired,
        description: `얼굴 변환 실패 환불`,
      })

      await prisma.tool_generations.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error_message: providerError instanceof Error ? providerError.message : '생성 실패',
        },
      })

      return NextResponse.json(
        { error: '생성에 실패했습니다. 크레딧이 환불되었습니다.' },
        { status: 500 }
      )
    } finally {
      // 임시 소스 파일 정리
      if (sourceTempDir) {
        try { await fs.rm(sourceTempDir, { recursive: true, force: true }) } catch { /* 무시 */ }
      }
    }
  } catch (error) {
    console.error('[Trending Generate]', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
