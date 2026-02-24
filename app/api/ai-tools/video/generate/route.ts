/**
 * AI 도구 - 영상 생성 API
 *
 * POST /api/ai-tools/video/generate
 *
 * 지원 모델:
 * - seedance-1.5-pro: BytePlus (텍스트/이미지 → 영상)
 * - vidu-q3: WaveSpeed (이미지 → 영상)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { hasEnoughCredits, deductCredits, getUserCredits, refundCredits } from '@/lib/credits/utils'
import { recordCreditUse, recordCreditRefund } from '@/lib/credits/history'
import {
  SEEDANCE_CREDIT_COST_PER_SECOND,
  VIDU_CREDIT_COST_PER_SECOND,
  type SeedanceResolution,
  type ViduResolution,
} from '@/lib/credits/constants'
import { createVideoTask } from '@/lib/byteplus/client'
import type { BytePlusVideoInput } from '@/lib/byteplus/types'
import { submitViduImageToVideoTask } from '@/lib/wavespeed/client'
import type { ViduImageToVideoInput } from '@/lib/wavespeed/client'

// ============================================================
// 요청 타입
// ============================================================

interface SeedanceRequest {
  model: 'seedance-1.5-pro'
  prompt: string
  imageUrls?: string[]
  aspectRatio?: '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
  resolution: '480p' | '720p'
  duration: number
  generateAudio?: boolean
}

interface ViduQ3Request {
  model: 'vidu-q3'
  prompt: string
  image: string
  resolution: '540p' | '720p' | '1080p'
  duration: number
  generateAudio?: boolean
  movementAmplitude?: 'auto' | 'small' | 'medium' | 'large'
}

type VideoGenerateRequest = SeedanceRequest | ViduQ3Request

// ============================================================
// 크레딧 계산
// ============================================================

function calculateCredits(req: VideoGenerateRequest): number {
  if (req.model === 'seedance-1.5-pro') {
    const perSecond = SEEDANCE_CREDIT_COST_PER_SECOND[req.resolution as SeedanceResolution]
    return perSecond * req.duration
  }
  const perSecond = VIDU_CREDIT_COST_PER_SECOND[req.resolution as ViduResolution]
  return perSecond * req.duration
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
    const body: VideoGenerateRequest = await request.json()

    // 유효성 검증
    if (!body.model || !body.prompt || !body.duration || !body.resolution) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    if (body.model === 'vidu-q3' && !body.image) {
      return NextResponse.json({ error: 'Vidu Q3는 이미지가 필수입니다' }, { status: 400 })
    }

    if (body.duration < 1 || body.duration > 16) {
      return NextResponse.json({ error: '영상 길이는 1~16초입니다' }, { status: 400 })
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
        featureType: 'TOOL_VIDEO',
        amount: creditsRequired,
        balanceAfter: profile?.credits ?? 0,
        description: `${body.model} 영상 생성 (${body.resolution}, ${body.duration}초)`,
      }, tx)

      return tx.tool_generations.create({
        data: {
          user_id: user.id,
          type: 'video',
          model: body.model,
          prompt: body.prompt,
          input_params: {
            resolution: body.resolution,
            duration: body.duration,
            ...(body.model === 'seedance-1.5-pro' && {
              aspectRatio: body.aspectRatio,
              imageUrls: body.imageUrls,
              generateAudio: body.generateAudio,
            }),
            ...(body.model === 'vidu-q3' && {
              image: body.image,
              generateAudio: body.generateAudio,
              movementAmplitude: (body as ViduQ3Request).movementAmplitude,
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
      if (body.model === 'seedance-1.5-pro') {
        const input: BytePlusVideoInput = {
          prompt: body.prompt,
          imageUrls: body.imageUrls,
          aspectRatio: body.aspectRatio,
          resolution: body.resolution,
          duration: body.duration,
          generateAudio: body.generateAudio,
        }
        const result = await createVideoTask(input)
        providerTaskId = `byteplus:${result.taskId}`
      } else {
        const input: ViduImageToVideoInput = {
          prompt: body.prompt,
          image: body.image,
          duration: body.duration as ViduImageToVideoInput['duration'],
          resolution: body.resolution as ViduImageToVideoInput['resolution'],
          generate_audio: body.generateAudio,
          movement_amplitude: body.movementAmplitude,
        }
        const requestId = await submitViduImageToVideoTask(input)
        providerTaskId = `wavespeed-vidu:${requestId}`
      }
    } catch (error) {
      // Provider 실패 시 크레딧 환불
      await refundCredits(user.id, creditsRequired)
      const currentCredits = await getUserCredits(user.id)
      await recordCreditRefund({
        userId: user.id,
        featureType: 'TOOL_VIDEO',
        amount: creditsRequired,
        balanceAfter: currentCredits,
        relatedEntityId: generation.id,
        description: `${body.model} 영상 생성 실패 - 환불`,
      })

      await prisma.tool_generations.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error_message: error instanceof Error ? error.message : '영상 생성 요청 실패',
        },
      })

      return NextResponse.json(
        { error: '영상 생성 요청에 실패했습니다' },
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
    console.error('[AI Tools Video Generate]', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
