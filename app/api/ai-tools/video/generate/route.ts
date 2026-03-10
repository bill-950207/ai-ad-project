/**
 * AI 도구 - 영상 생성 API
 *
 * POST /api/ai-tools/video/generate
 *
 * 지원 모델:
 * - seedance-1.5-pro: FAL.ai Seedance 1.5 Pro (텍스트/이미지 → 영상)
 * - vidu-q3: WaveSpeed (이미지 → 영상)
 * - veo-3.1: FAL.ai Veo 3.1 (텍스트/이미지 → 영상)
 * - hailuo-02: FAL.ai Hailuo-02 (텍스트/이미지 → 영상)
 * - ltx-2.3: FAL.ai LTX-2.3 (텍스트/이미지 → 영상)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { hasEnoughCredits, deductCredits, getUserCredits, refundCredits } from '@/lib/credits/utils'
import { recordCreditUse, recordCreditRefund } from '@/lib/credits/history'
import {
  SEEDANCE_CREDIT_COST_PER_SECOND,
  VIDU_CREDIT_COST_PER_SECOND,
  KLING3_STD_CREDIT_PER_SECOND,
  KLING3_PRO_CREDIT_PER_SECOND,
  GROK_VIDEO_CREDIT_PER_SECOND,
  WAN26_CREDIT_PER_SECOND,
  VEO31_CREDIT_PER_SECOND,
  HAILUO02_CREDIT_PER_SECOND,
  LTX23_CREDIT_PER_SECOND,
  type SeedanceResolution,
  type ViduResolution,
  type Kling3Resolution,
  type GrokVideoResolution,
  type Wan26Resolution,
  type Veo31Resolution,
  type Hailuo02Resolution,
  type Ltx23Resolution,
} from '@/lib/credits/constants'
import { submitSeedanceToQueue, submitSeedanceT2VToQueue, submitKling3ToQueue, submitGrokVideoToQueue, submitWan26ToQueue, submitVeo31ToQueue, submitHailuo02ToQueue, submitLtx23ToQueue } from '@/lib/fal/client'
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

interface Kling3Request {
  model: 'kling-3'
  prompt: string
  imageUrl?: string
  resolution: '720p'
  duration: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  tier?: 'standard' | 'pro'
}

interface GrokVideoRequest {
  model: 'grok-video'
  prompt: string
  imageUrl?: string
  resolution: '480p' | '720p'
  duration: number
}

interface Wan26Request {
  model: 'wan-2.6'
  prompt: string
  imageUrl?: string
  resolution: '720p' | '1080p'
  duration: number
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
}

interface Veo31Request {
  model: 'veo-3.1'
  prompt: string
  imageUrl?: string
  resolution: '720p' | '1080p'
  duration: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  generateAudio?: boolean
}

interface Hailuo02Request {
  model: 'hailuo-02'
  prompt: string
  imageUrl?: string
  resolution: '768p' | '1080p'
  duration: number
}

interface Ltx23Request {
  model: 'ltx-2.3'
  prompt: string
  imageUrl?: string
  resolution: '720p' | '1080p'
  duration: number
}

type VideoGenerateRequest = SeedanceRequest | ViduQ3Request | Kling3Request | GrokVideoRequest | Wan26Request | Veo31Request | Hailuo02Request | Ltx23Request

// ============================================================
// 크레딧 계산
// ============================================================

function calculateCredits(req: VideoGenerateRequest): number {
  if (req.model === 'seedance-1.5-pro') {
    const perSecond = SEEDANCE_CREDIT_COST_PER_SECOND[req.resolution as SeedanceResolution]
    return perSecond * req.duration
  }
  if (req.model === 'kling-3') {
    const creditTable = req.tier === 'pro' ? KLING3_PRO_CREDIT_PER_SECOND : KLING3_STD_CREDIT_PER_SECOND
    const perSecond = creditTable[req.resolution as Kling3Resolution]
    return perSecond * req.duration
  }
  if (req.model === 'grok-video') {
    const perSecond = GROK_VIDEO_CREDIT_PER_SECOND[req.resolution as GrokVideoResolution]
    return perSecond * req.duration
  }
  if (req.model === 'wan-2.6') {
    const perSecond = WAN26_CREDIT_PER_SECOND[req.resolution as Wan26Resolution]
    return perSecond * req.duration
  }
  if (req.model === 'veo-3.1') {
    const perSecond = VEO31_CREDIT_PER_SECOND[req.resolution as Veo31Resolution]
    return perSecond * req.duration
  }
  if (req.model === 'hailuo-02') {
    const perSecond = HAILUO02_CREDIT_PER_SECOND[req.resolution as Hailuo02Resolution]
    return perSecond * req.duration
  }
  if (req.model === 'ltx-2.3') {
    const perSecond = LTX23_CREDIT_PER_SECOND[req.resolution as Ltx23Resolution]
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

    // 모델별 duration 유효성 검증
    if (body.model === 'kling-3') {
      if (body.duration !== 5 && body.duration !== 10) {
        return NextResponse.json({ error: 'Kling 3.0은 5초 또는 10초만 지원합니다' }, { status: 400 })
      }
    } else {
      let maxDuration = 16 // default (vidu-q3)
      if (body.model === 'wan-2.6' || body.model === 'grok-video') maxDuration = 15
      else if (body.model === 'veo-3.1') maxDuration = 8
      else if (body.model === 'hailuo-02') maxDuration = 6
      else if (body.model === 'ltx-2.3') maxDuration = 20
      if (body.duration < 1 || body.duration > maxDuration) {
        return NextResponse.json({ error: `영상 길이는 1~${maxDuration}초입니다` }, { status: 400 })
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
            ...(body.model === 'kling-3' && {
              imageUrl: (body as Kling3Request).imageUrl,
              aspectRatio: (body as Kling3Request).aspectRatio,
              tier: (body as Kling3Request).tier || 'standard',
            }),
            ...(body.model === 'grok-video' && {
              imageUrl: (body as GrokVideoRequest).imageUrl,
            }),
            ...(body.model === 'wan-2.6' && {
              imageUrl: (body as Wan26Request).imageUrl,
              aspectRatio: (body as Wan26Request).aspectRatio,
            }),
            ...(body.model === 'veo-3.1' && {
              imageUrl: (body as Veo31Request).imageUrl,
              aspectRatio: (body as Veo31Request).aspectRatio,
              generateAudio: (body as Veo31Request).generateAudio,
            }),
            ...(body.model === 'hailuo-02' && {
              imageUrl: (body as Hailuo02Request).imageUrl,
            }),
            ...(body.model === 'ltx-2.3' && {
              imageUrl: (body as Ltx23Request).imageUrl,
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
        const imageUrl = body.imageUrls?.[0]

        if (imageUrl) {
          // Image-to-Video (FAL.ai Seedance 1.5 Pro)
          const result = await submitSeedanceToQueue({
            prompt: body.prompt,
            image_url: imageUrl,
            aspect_ratio: body.aspectRatio,
            resolution: body.resolution,
            duration: body.duration,
            generate_audio: body.generateAudio,
          })
          providerTaskId = `fal-seedance:${result.request_id}`
        } else {
          // Text-to-Video (FAL.ai Seedance 1.5 Pro)
          const result = await submitSeedanceT2VToQueue({
            prompt: body.prompt,
            aspect_ratio: body.aspectRatio,
            resolution: body.resolution,
            duration: body.duration,
            generate_audio: body.generateAudio,
          })
          providerTaskId = `fal-seedance-t2v:${result.request_id}`
        }
      } else if (body.model === 'kling-3') {
        // Kling 3.0 Standard/Pro (FAL.ai)
        const kling3Duration = body.duration === 10 ? '10' : '5'
        const kling3Tier = body.tier || 'standard'
        const result = await submitKling3ToQueue({
          prompt: body.prompt,
          image_url: body.imageUrl,
          duration: kling3Duration,
          aspect_ratio: body.aspectRatio,
          tier: kling3Tier,
        })
        const tierTag = kling3Tier === 'pro' ? 'kling3p' : 'kling3s'
        const modeTag = body.imageUrl ? 'i2v' : 't2v'
        providerTaskId = `fal-${tierTag}-${modeTag}:${result.request_id}`
      } else if (body.model === 'grok-video') {
        // Grok Imagine Video (xAI via FAL.ai)
        const result = await submitGrokVideoToQueue({
          prompt: body.prompt,
          image_url: body.imageUrl,
          duration: body.duration,
          resolution: body.resolution as '480p' | '720p',
        })
        const grokVidPrefix = body.imageUrl ? 'fal-grok-vid-i2v' : 'fal-grok-vid-t2v'
        providerTaskId = `${grokVidPrefix}:${result.request_id}`
      } else if (body.model === 'wan-2.6') {
        // Wan 2.6 (Alibaba via FAL.ai)
        const result = await submitWan26ToQueue({
          prompt: body.prompt,
          image_url: body.imageUrl,
          duration: body.duration as 5 | 10 | 15,
          resolution: body.resolution as '720p' | '1080p',
          aspect_ratio: body.aspectRatio,
        })
        const wan26Prefix = body.imageUrl ? 'fal-wan26-i2v' : 'fal-wan26-t2v'
        providerTaskId = `${wan26Prefix}:${result.request_id}`
      } else if (body.model === 'veo-3.1') {
        const result = await submitVeo31ToQueue({
          prompt: body.prompt,
          image_url: body.imageUrl,
          duration: body.duration,
          aspect_ratio: body.aspectRatio,
          generate_audio: body.generateAudio,
        })
        const veo31Prefix = body.imageUrl ? 'fal-veo31-i2v' : 'fal-veo31-t2v'
        providerTaskId = `${veo31Prefix}:${result.request_id}`
      } else if (body.model === 'hailuo-02') {
        const tier = body.resolution === '1080p' ? 'pro' : 'standard'
        const result = await submitHailuo02ToQueue({
          prompt: body.prompt,
          image_url: body.imageUrl,
          duration: body.duration,
          tier,
        })
        const hailuoPrefix = body.imageUrl
          ? (tier === 'pro' ? 'fal-hailuo02p-i2v' : 'fal-hailuo02s-i2v')
          : (tier === 'pro' ? 'fal-hailuo02p-t2v' : 'fal-hailuo02s-t2v')
        providerTaskId = `${hailuoPrefix}:${result.request_id}`
      } else if (body.model === 'ltx-2.3') {
        const result = await submitLtx23ToQueue({
          prompt: body.prompt,
          image_url: body.imageUrl,
          duration: body.duration,
          resolution: body.resolution,
        })
        const ltx23Prefix = body.imageUrl ? 'fal-ltx23-i2v' : 'fal-ltx23-t2v'
        providerTaskId = `${ltx23Prefix}:${result.request_id}`
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
