/**
 * AI 트렌딩 도구 - 생성 API
 *
 * POST /api/ai-tools/trending/generate
 *
 * 지원 모델:
 * - face-transform: Kling 3.0 Motion Control 기반 모션 컨트롤 (멀티 세그먼트)
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
import { downloadToTemp, extractFrameFromFile, trimVideoFromFile, getMediaDuration } from '@/lib/video/ffmpeg'
import { uploadBufferToR2 } from '@/lib/storage/r2'
import { getGenAI, MODEL_NAME, fetchImageAsBase64 } from '@/lib/gemini/shared'
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
  image_urls: string[]  // [0]=인물 사진, [1]=배경 프레임
  aspect_ratio?: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { request_id } = await fal.queue.submit(KLING_I2I_MODEL as any, {
    input: {
      prompt: input.prompt,
      image_urls: input.image_urls,
      resolution: '1K',
      result_type: 'single',
      num_images: 1,
      aspect_ratio: input.aspect_ratio || 'auto',
      output_format: 'png',
    },
  })
  return { request_id }
}

// @Image1 = 인물 사진, @Image2 = 배경 프레임 (Kling O3 참조 문법)
const COMPOSITE_PROMPT = 'Replace the person in @Image2 with the person from @Image1. The replacement must include the full appearance of the person from @Image1 — their face, body type, physique, clothing, and outfit. Do not keep the original person\'s body or clothes from @Image2. The person from @Image1 should appear exactly as they look in @Image1, placed in the same pose and position as the person in @Image2. Keep the background, margins, spacing, and all surroundings from @Image2 exactly the same. Match the output to the exact aspect ratio and composition of @Image2.'

// ============================================================
// LLM 이미지 검증 — 배경+인물이 올바르게 합성됐는지 확인
// ============================================================

const MAX_IMAGE_RETRIES = 2

async function verifyCompositeImage(
  personImageUrl: string,
  frameUrl: string,
  resultImageUrl: string,
): Promise<boolean> {
  try {
    const [personImg, frameImg, resultImg] = await Promise.all([
      fetchImageAsBase64(personImageUrl),
      fetchImageAsBase64(frameUrl),
      fetchImageAsBase64(resultImageUrl),
    ])

    if (!personImg || !frameImg || !resultImg) return true // 검증 불가 시 통과

    const genAI = getGenAI()
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: personImg.mimeType, data: personImg.base64 } },
          { inlineData: { mimeType: frameImg.mimeType, data: frameImg.base64 } },
          { inlineData: { mimeType: resultImg.mimeType, data: resultImg.base64 } },
          { text: `Image 1 is the target person reference photo. Image 2 is the background frame from a video. Image 3 is the generated result.

Strictly check ALL of the following:
1. The person in Image 3 must look like a COMPLETE, NATURAL person — not just a face swap onto someone else's body. The body, clothing, skin tone, and proportions must belong to the person from Image 1, NOT the original person in Image 2.
2. The background in Image 3 must match Image 2's background.
3. There must be NO grotesque artifacts — no mismatched body parts, no face pasted onto a wrong body, no unnatural skin boundaries.

Reply ONLY "PASS" or "FAIL".
FAIL if: only the face was swapped but the body/clothing still belongs to the original person in Image 2. This is the most common failure mode.
FAIL if: the result looks like a crude face-swap (face of person 1 on body of person 2).
PASS only if: the entire person (face + body + clothing) naturally represents the person from Image 1.` },
        ],
      }],
    })

    const text = response.text?.trim().toUpperCase() || ''
    const passed = text.includes('PASS')
    console.log(`[Trending] LLM verify: ${passed ? 'PASS' : 'FAIL'} (${text.substring(0, 30)})`)
    return passed
  } catch (err) {
    console.warn('[Trending] LLM verify failed, skipping:', (err as Error).message?.substring(0, 50))
    return true // 검증 실패 시 통과
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
        description: `모션 컨트롤 (${transformSegments.length}구간, ${body.tier})`,
      }, tx)

      return tx.tool_generations.create({
        data: {
          user_id: user.id,
          type: 'trending',
          model: 'face-transform',
          prompt: body.prompt || '모션 컨트롤',
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
      trimOffset?: number       // Kling 결과에서 건너뛸 시간 (startTime 앞당김 시)
      providerTaskId?: string
      targetImageUrl?: string
    }> = []

    // 소스 영상을 한 번만 다운로드
    let sourceFilePath: string | null = null
    let sourceTempDir: string | null = null

    try {
      // 소스 영상 다운로드 (1회) + 길이 감지
      const dl = await downloadToTemp(body.sourceVideoUrl, 'mp4')
      sourceFilePath = dl.filePath
      sourceTempDir = dl.tempDir

      let sourceDuration = 0
      try {
        sourceDuration = await getMediaDuration(sourceFilePath)
      } catch { /* 감지 실패 시 0 */ }
      console.log(`[Trending] Source: ${sourceFilePath}, duration: ${sourceDuration.toFixed(1)}s`)

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
          // Kling MC 최소 3.3초 보장
          // 소스 끝 부분이면 startTime을 앞당겨서 3.3초 확보
          const segDuration = seg.endTime - seg.startTime
          const klingDuration = Math.max(MIN_SEGMENT_DURATION, segDuration)
          let trimStart = seg.startTime
          let trimEnd = seg.startTime + klingDuration

          if (sourceDuration > 0 && trimEnd > sourceDuration) {
            // 소스 끝을 초과 → startTime을 앞당김
            trimStart = Math.max(0, sourceDuration - klingDuration)
            trimEnd = trimStart + klingDuration
          }

          console.log(`[Trending] Trim seg${i}: ${trimStart.toFixed(1)}s ~ ${trimEnd.toFixed(1)}s (user: ${segDuration.toFixed(1)}s, kling: ${klingDuration.toFixed(1)}s, src: ${sourceDuration.toFixed(1)}s)`)

          const [frameBuffer, trimmedBuffer] = await Promise.all([
            extractFrameFromFile(sourceFilePath!, seg.startTime),
            trimVideoFromFile(sourceFilePath!, trimStart, trimEnd, klingDuration),
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

          // 앞당긴 양 기록 (합성 시 Kling 결과에서 이만큼 건너뛰어야 함)
          const trimOffset = seg.startTime - trimStart

          return { index: i, seg, frameUrl, trimmedUrl, frameWidth, frameHeight, trimOffset }
        })
      )

      // ============================================================
      // Phase 2: 모든 Kling Image O3 I2I 제출 (병렬)
      // 프레임(image2)을 base로, 인물(image1)로 교체 요청
      // ============================================================
      const editSubmissions = await Promise.all(
        prepResults.map(async ({ index, seg, frameUrl, trimmedUrl, frameWidth, frameHeight, trimOffset }) => {
          console.log(`[Trending] Kling I2I submit seg${index}:`, { targetPerson: seg.targetImageUrl, frameUrl: frameUrl.substring(0, 60), frameSize: `${frameWidth}x${frameHeight}` })
          // image_urls: [0]=인물 사진(@Image1), [1]=배경 프레임(@Image2)
          const editResult = await submitKlingI2IToQueue({
            prompt: COMPOSITE_PROMPT,
            image_urls: [seg.targetImageUrl!, frameUrl],
          })
          return { index, seg, frameUrl, trimmedUrl, editRequestId: editResult.request_id, frameWidth, frameHeight, trimOffset }
        })
      )

      // ============================================================
      // Phase 3: 모든 Kling I2I 완료 대기 + LLM 검증 + 재시도 (병렬)
      // ============================================================
      const editResults = await Promise.all(
        editSubmissions.map(async ({ index, seg, frameUrl, trimmedUrl, editRequestId, frameWidth, frameHeight, trimOffset }) => {
          let currentRequestId = editRequestId
          let retryCount = 0

          while (retryCount <= MAX_IMAGE_RETRIES) {
            // 폴링 대기
            for (let attempt = 0; attempt < 60; attempt++) {
              await new Promise((resolve) => setTimeout(resolve, 3000))
              const editStatus = await getFalQueueStatus(KLING_I2I_MODEL, currentRequestId)
              if (editStatus.status === 'COMPLETED') {
                const editResponse = await getFalQueueResult(KLING_I2I_MODEL, currentRequestId)
                const rawImageUrl = editResponse.images?.[0]?.url
                if (rawImageUrl) {
                  console.log(`[Trending] I2I completed seg${index} (try ${retryCount + 1}):`, rawImageUrl.substring(0, 80))

                  // crop+resize
                  const imgRes = await fetch(rawImageUrl)
                  const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
                  const resizedBuffer = await sharp(imgBuffer)
                    .resize(frameWidth, frameHeight, { fit: 'cover', position: 'centre' })
                    .jpeg({ quality: 90 })
                    .toBuffer()

                  const resizedKey = `trending/${user.id}/edited_${generation.id}_seg${index}_${Date.now()}.jpg`
                  const compositedImageUrl = await uploadBufferToR2(resizedBuffer, resizedKey, 'image/jpeg')

                  // LLM 검증
                  if (retryCount < MAX_IMAGE_RETRIES) {
                    const passed = await verifyCompositeImage(seg.targetImageUrl!, frameUrl, compositedImageUrl)
                    if (!passed) {
                      console.log(`[Trending] seg${index}: LLM 검증 실패, 재시도 ${retryCount + 1}/${MAX_IMAGE_RETRIES}`)
                      retryCount++
                      // 재제출
                      const retryResult = await submitKlingI2IToQueue({
                        prompt: COMPOSITE_PROMPT,
                        image_urls: [seg.targetImageUrl!, frameUrl],
                      })
                      currentRequestId = retryResult.request_id
                      break // 내부 폴링 루프 탈출 → 외부 while에서 다시 폴링
                    }
                  }

                  return { index, seg, trimmedUrl, compositedImageUrl, trimOffset }
                }
              }
            }

            // 폴링 60회 초과 시
            if (retryCount >= MAX_IMAGE_RETRIES) break
          }

          throw new Error(`세그먼트 ${index}: 배경 합성에 실패했습니다`)
        })
      )

      // ============================================================
      // Phase 4: 모든 Kling MC 제출 (병렬)
      // ============================================================
      const klingResults = await Promise.all(
        editResults.map(async ({ index, seg, trimmedUrl, compositedImageUrl, trimOffset }) => {
          console.log(`[Trending] Kling MC submit seg${index}:`, { image_url: compositedImageUrl.substring(0, 80), video_url: trimmedUrl.substring(0, 80), tier: body.tier })
          const result = await submitKling3McToQueue({
            prompt: body.prompt || '영상 속 인물을 변환합니다',
            image_url: compositedImageUrl,
            video_url: trimmedUrl,
            character_orientation: 'video',
            keep_original_sound: true,
            tier: body.tier,
          })
          const tierTag = body.tier === 'pro' ? 'kling3mcp' : 'kling3mcs'
          return { index, seg, providerTaskId: `fal-${tierTag}:${result.request_id}`, trimOffset }
        })
      )

      // 결과를 segmentTasks에 추가
      for (const { index, seg, providerTaskId, trimOffset } of klingResults) {
        const segDuration = seg.endTime - seg.startTime
        segmentTasks.push({
          index,
          type: 'transform',
          startTime: seg.startTime,
          endTime: seg.endTime,
          originalDuration: segDuration < MIN_SEGMENT_DURATION ? segDuration : undefined,
          trimOffset: trimOffset > 0.01 ? trimOffset : undefined,
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
        description: `모션 컨트롤 실패 환불`,
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
