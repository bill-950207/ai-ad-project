/**
 * AI 도구 - 이미지 생성 API
 *
 * POST /api/ai-tools/image/generate
 *
 * 지원 모델:
 * - seedream-4.5: Kie.ai Seedream 4.5 (이미지 편집/변환)
 * - z-image: Kie.ai Z-Image (텍스트 → 이미지)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { hasEnoughCredits, deductCredits, getUserCredits, refundCredits } from '@/lib/credits/utils'
import { recordCreditUse, recordCreditRefund } from '@/lib/credits/history'
import {
  IMAGE_AD_CREDIT_COST,
  Z_IMAGE_TOOL_CREDIT_COST,
  type ImageQuality,
} from '@/lib/credits/constants'
import { createEditTask, submitZImageToQueue, submitSeedreamV4ToQueue } from '@/lib/kie/client'
import type { EditAspectRatio, EditQuality, ZImageAspectRatio, SeedreamV4ImageSize } from '@/lib/kie/client'

// ============================================================
// 요청 타입
// ============================================================

interface SeedreamRequest {
  model: 'seedream-4.5'
  prompt: string
  imageUrl?: string // 있으면 Image Edit, 없으면 Text to Image
  aspectRatio?: EditAspectRatio
  quality?: EditQuality
}

// Aspect ratio → Seedream V4 image_size 매핑
const ASPECT_TO_V4_SIZE: Record<string, SeedreamV4ImageSize> = {
  '1:1': 'square_hd',
  '4:3': 'landscape_4_3',
  '3:4': 'portrait_4_3',
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_16_9',
  '2:3': 'portrait_3_2',
  '3:2': 'landscape_3_2',
  '21:9': 'landscape_21_9',
}

interface ZImageRequest {
  model: 'z-image'
  prompt: string
  aspectRatio?: ZImageAspectRatio
}

type ImageGenerateRequest = SeedreamRequest | ZImageRequest

// ============================================================
// 크레딧 계산
// ============================================================

function calculateCredits(req: ImageGenerateRequest): number {
  if (req.model === 'seedream-4.5') {
    const quality: ImageQuality = req.quality === 'high' ? 'high' : 'medium'
    return IMAGE_AD_CREDIT_COST[quality]
  }
  return Z_IMAGE_TOOL_CREDIT_COST
}

// ============================================================
// POST 핸들러
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청 파싱
    const body: ImageGenerateRequest = await request.json()

    // 유효성 검증
    if (!body.model || !body.prompt) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    // imageUrl이 있으면 Image Edit, 없으면 Text to Image

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
        featureType: 'TOOL_IMAGE',
        amount: creditsRequired,
        balanceAfter: profile?.credits ?? 0,
        description: `${body.model} 이미지 생성`,
      }, tx)

      return tx.tool_generations.create({
        data: {
          user_id: user.id,
          type: 'image',
          model: body.model,
          prompt: body.prompt,
          input_params: {
            ...(body.model === 'seedream-4.5' && {
              imageUrl: body.imageUrl,
              aspectRatio: body.aspectRatio,
              quality: body.quality,
            }),
            ...(body.model === 'z-image' && {
              aspectRatio: body.aspectRatio,
            }),
          },
          status: 'PENDING',
          credits_used: creditsRequired,
        },
      })
    })

    // Provider API 호출
    let providerTaskId: string

    try {
      if (body.model === 'seedream-4.5' && body.imageUrl) {
        // Image Edit 모드
        const result = await createEditTask({
          prompt: body.prompt,
          image_urls: [body.imageUrl],
          aspect_ratio: body.aspectRatio,
          quality: body.quality,
        })
        providerTaskId = `kie-edit:${result.taskId}`
      } else if (body.model === 'seedream-4.5' && !body.imageUrl) {
        // Text to Image 모드 (Seedream V4)
        const imageSize = ASPECT_TO_V4_SIZE[body.aspectRatio || '1:1'] || 'square_hd'
        const imageResolution = body.quality === 'high' ? '2K' : '1K'
        const result = await submitSeedreamV4ToQueue(body.prompt, {
          imageSize,
          imageResolution,
        })
        providerTaskId = `kie-seedream-v4:${result.request_id}`
      } else {
        const zBody = body as ZImageRequest
        const result = await submitZImageToQueue(zBody.prompt, zBody.aspectRatio)
        providerTaskId = `kie-zimage:${result.request_id}`
      }
    } catch (error) {
      // Provider 실패 시 크레딧 환불
      await refundCredits(user.id, creditsRequired)
      const currentCredits = await getUserCredits(user.id)
      await recordCreditRefund({
        userId: user.id,
        featureType: 'TOOL_IMAGE',
        amount: creditsRequired,
        balanceAfter: currentCredits,
        relatedEntityId: generation.id,
        description: `${body.model} 이미지 생성 실패 - 환불`,
      })

      await prisma.tool_generations.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error_message: error instanceof Error ? error.message : '이미지 생성 요청 실패',
        },
      })

      return NextResponse.json(
        { error: '이미지 생성 요청에 실패했습니다' },
        { status: 500 }
      )
    }

    // provider_task_id 업데이트
    await prisma.tool_generations.update({
      where: { id: generation.id },
      data: {
        provider_task_id: providerTaskId,
        status: 'IN_QUEUE',
      },
    })

    return NextResponse.json({
      id: generation.id,
      taskId: providerTaskId,
      creditsUsed: creditsRequired,
    })
  } catch (error) {
    console.error('[AI Tools Image Generate]', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
