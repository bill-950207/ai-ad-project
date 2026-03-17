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
  submitSeedreamEditToQueue,
  getSeedreamEditQueueStatus,
  getSeedreamEditQueueResponse,
} from '@/lib/fal/client'
import { trimVideo, extractFrame } from '@/lib/video/ffmpeg'
import { uploadBufferToR2 } from '@/lib/storage/r2'

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

    // 세그먼트 검증
    for (const seg of body.segments) {
      if (seg.endTime <= seg.startTime) {
        return NextResponse.json({ error: '종료 시간은 시작 시간보다 커야 합니다' }, { status: 400 })
      }
      if (seg.type === 'transform' && !seg.targetImageUrl) {
        return NextResponse.json({ error: '변환 구간에는 대상 이미지가 필요합니다' }, { status: 400 })
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

    // 각 변환 세그먼트에 대해 Kling MC 호출
    const segmentTasks: Array<{
      index: number
      type: 'original' | 'transform'
      startTime: number
      endTime: number
      providerTaskId?: string
      targetImageUrl?: string
    }> = []

    try {
      for (let i = 0; i < body.segments.length; i++) {
        const seg = body.segments[i]

        if (seg.type === 'original') {
          segmentTasks.push({
            index: i,
            type: 'original',
            startTime: seg.startTime,
            endTime: seg.endTime,
          })
          continue
        }

        // Transform 세그먼트:
        // 1) 프레임 추출 + 영상 트리밍 (병렬)
        // 2) Seedream Edit로 대상 인물을 영상 배경에 합성
        // 3) 합성 이미지 + 트림 영상 → Kling MC 호출
        const [frameBuffer, trimmedBuffer] = await Promise.all([
          extractFrame(body.sourceVideoUrl, seg.startTime),
          trimVideo(body.sourceVideoUrl, seg.startTime, seg.endTime),
        ])

        // 프레임 + 트림 영상 R2 업로드 (병렬)
        const timestamp = Date.now()
        const [frameUrl, trimmedUrl] = await Promise.all([
          uploadBufferToR2(
            frameBuffer,
            `trending/${user.id}/frame_${generation.id}_seg${i}_${timestamp}.jpg`,
            'image/jpeg'
          ),
          uploadBufferToR2(
            trimmedBuffer,
            `trending/${user.id}/trim_${generation.id}_seg${i}_${timestamp}.mp4`,
            'video/mp4'
          ),
        ])

        // Seedream Edit: 대상 인물 사진(image1) + 배경 프레임(image2) → 합성 이미지
        // image_urls 순서: [0]=대상 인물, [1]=배경 프레임
        const editResult = await submitSeedreamEditToQueue({
          prompt: 'Take the person from image 1 (the portrait/selfie photo) and place them into the scene shown in image 2 (the video frame background). Keep the exact background, lighting, and environment from image 2. The person from image 1 should appear naturally standing or posing in the scene of image 2. Do NOT change the background. Output a single photo of the person from image 1 in the environment of image 2.',
          image_urls: [seg.targetImageUrl!, frameUrl],
          aspect_ratio: '9:16',
          quality: 'basic',
        })

        // Seedream Edit 완료 대기 (폴링)
        let compositedImageUrl: string | undefined
        for (let attempt = 0; attempt < 60; attempt++) { // 최대 3분 대기
          await new Promise((resolve) => setTimeout(resolve, 3000))
          const editStatus = await getSeedreamEditQueueStatus(editResult.request_id)
          if (editStatus.status === 'COMPLETED') {
            const editResponse = await getSeedreamEditQueueResponse(editResult.request_id)
            compositedImageUrl = editResponse.images?.[0]?.url
            break
          }
        }

        if (!compositedImageUrl) {
          throw new Error(`세그먼트 ${i}: 배경 합성에 실패했습니다`)
        }

        // Kling MC: 합성된 이미지 + 트림 영상 → 변환 영상
        const result = await submitKling3McToQueue({
          prompt: body.prompt || '영상 속 인물을 변환합니다',
          image_url: compositedImageUrl,
          video_url: trimmedUrl,
          character_orientation: 'image',
          keep_original_sound: true,
          tier: body.tier,
        })

        const tierTag = body.tier === 'pro' ? 'kling3mcp' : 'kling3mcs'
        segmentTasks.push({
          index: i,
          type: 'transform',
          startTime: seg.startTime,
          endTime: seg.endTime,
          providerTaskId: `fal-${tierTag}:${result.request_id}`,
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
    }
  } catch (error) {
    console.error('[Trending Generate]', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
