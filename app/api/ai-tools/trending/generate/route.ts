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
  submitQwenImage2EditToQueue,
  getFalQueueStatus,
  getFalQueueResult,
  QWEN_IMAGE2_EDIT_MODEL,
} from '@/lib/fal/client'
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

const MIN_SEGMENT_DURATION = 3 // Kling MC 최소 3초

function calculateCredits(req: FaceTransformRequest): number {
  const perSecond = req.tier === 'pro'
    ? KLING3_MC_PRO_CREDIT_PER_SECOND['720p']
    : KLING3_MC_STD_CREDIT_PER_SECOND['720p']

  const transformSegments = req.segments.filter((s) => s.type === 'transform')

  return transformSegments.reduce((total, seg) => {
    const duration = seg.endTime - seg.startTime
    const klingCost = perSecond * Math.max(MIN_SEGMENT_DURATION, duration)
    const editCost = IMAGE_EDIT_CREDIT_COST.medium // 배경 합성 비용 (세그먼트당)
    return total + klingCost + editCost
  }, 0)
}

// ============================================================
// 프레임에서 aspect ratio 추론
// ============================================================

async function detectImageSize(frameBuffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(frameBuffer).metadata()
    return {
      width: metadata.width || 1024,
      height: metadata.height || 1024,
    }
  } catch {
    return { width: 1024, height: 1024 }
  }
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
          const [frameBuffer, trimmedBuffer] = await Promise.all([
            extractFrameFromFile(sourceFilePath!, seg.startTime),
            trimVideoFromFile(sourceFilePath!, seg.startTime, seg.endTime),
          ])

          // 이미지 크기 감지
          const imageSize = await detectImageSize(frameBuffer)

          const ts = Date.now()
          const [frameUrl, trimmedUrl] = await Promise.all([
            uploadBufferToR2(frameBuffer, `trending/${user.id}/frame_${generation.id}_seg${i}_${ts}.jpg`, 'image/jpeg'),
            uploadBufferToR2(trimmedBuffer, `trending/${user.id}/trim_${generation.id}_seg${i}_${ts}.mp4`, 'video/mp4'),
          ])

          return { index: i, seg, frameUrl, trimmedUrl, imageSize }
        })
      )

      // ============================================================
      // Phase 2: 모든 Qwen Image 2 Edit 제출 (병렬)
      // ============================================================
      const editSubmissions = await Promise.all(
        prepResults.map(async ({ index, seg, frameUrl, trimmedUrl, imageSize }) => {
          console.log(`[Trending] Qwen Image 2 Edit submit seg${index}:`, { targetImage: seg.targetImageUrl, frameUrl, imageSize })
          const editResult = await submitQwenImage2EditToQueue({
            prompt: 'Take the person from image 1 (the portrait/selfie photo) and place them into the scene shown in image 2 (the video frame background). Keep the exact background, lighting, and environment from image 2. The person from image 1 should appear naturally standing or posing in the scene of image 2. Do NOT change the background. Output a single photo of the person from image 1 in the environment of image 2.',
            image_urls: [seg.targetImageUrl!, frameUrl],
            image_size: imageSize,
          })
          return { index, seg, trimmedUrl, editRequestId: editResult.request_id }
        })
      )

      // ============================================================
      // Phase 3: 모든 Qwen Image 2 Edit 완료 대기 (병렬 폴링)
      // ============================================================
      const editResults = await Promise.all(
        editSubmissions.map(async ({ index, seg, trimmedUrl, editRequestId }) => {
          for (let attempt = 0; attempt < 60; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 3000))
            const editStatus = await getFalQueueStatus(QWEN_IMAGE2_EDIT_MODEL, editRequestId)
            if (editStatus.status === 'COMPLETED') {
              const editResponse = await getFalQueueResult(QWEN_IMAGE2_EDIT_MODEL, editRequestId)
              const compositedImageUrl = editResponse.images?.[0]?.url
              if (compositedImageUrl) {
                console.log(`[Trending] Qwen Edit completed seg${index}:`, compositedImageUrl.substring(0, 80))
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
        segmentTasks.push({
          index,
          type: 'transform',
          startTime: seg.startTime,
          endTime: seg.endTime,
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
