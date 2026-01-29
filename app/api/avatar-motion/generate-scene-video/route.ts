/**
 * 아바타 모션 씬 영상 생성 API (Vidu Q2 Turbo)
 *
 * POST: 단일 씬의 키프레임 이미지로 영상을 생성합니다.
 * - 첫 프레임 이미지 + 모션 프롬프트 → 씬 영상
 *
 * 지원 모델:
 * - vidu-q2: WaveSpeed Vidu Q2 Turbo (Primary)
 * - fallback: fal.ai Vidu Q2 (WaveSpeed 실패 시)
 *
 * 해상도: 540p, 720p, 1080p
 * 영상 길이: 1-8초
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import {
  submitViduToQueue,
  type ViduResolution,
  type ViduDuration,
  type ViduMovementAmplitude,
} from '@/lib/wavespeed/client'
import {
  submitViduQ2ToQueue as submitFalViduQ2ToQueue,
} from '@/lib/fal/client'
import { VIDU_CREDIT_COST_PER_SECOND } from '@/lib/credits'

interface GenerateSceneVideoRequest {
  sceneIndex: number
  imageUrl: string
  prompt: string
  duration: number           // 1-8초
  resolution: ViduResolution // 540p, 720p, 1080p
  movementAmplitude?: ViduMovementAmplitude // auto, small, medium, large
  audioEnabled?: boolean
}

/**
 * 안전하게 duration을 ViduDuration으로 변환
 */
function toViduDuration(d: number): ViduDuration {
  const clamped = Math.min(Math.max(Math.round(d), 1), 8)
  return clamped as ViduDuration
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: GenerateSceneVideoRequest = await request.json()
    const {
      sceneIndex,
      imageUrl,
      prompt,
      duration,
      resolution = '720p',
      movementAmplitude = 'auto',
      audioEnabled = false,
    } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!duration || duration < 1 || duration > 8) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 8 seconds' },
        { status: 400 }
      )
    }

    // 크레딧 계산 (해상도 × 시간)
    const creditCostPerSecond = VIDU_CREDIT_COST_PER_SECOND[resolution] || VIDU_CREDIT_COST_PER_SECOND['720p']
    const totalCreditCost = Math.ceil(duration * creditCostPerSecond)

    // 크레딧 확인 및 차감 (트랜잭션)
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { credits: true },
    })

    if (!profile || (profile.credits ?? 0) < totalCreditCost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: totalCreditCost,
          available: profile?.credits ?? 0,
        },
        { status: 402 }
      )
    }

    // 크레딧 차감
    await prisma.profiles.update({
      where: { id: user.id },
      data: { credits: { decrement: totalCreditCost } },
    })

    console.log(`Generating scene ${sceneIndex} video: ${duration}s @ ${resolution} (${totalCreditCost} credits)`)

    let requestId: string
    let provider: 'wavespeed' | 'fal' = 'wavespeed'

    try {
      // WaveSpeed Vidu Q2 Turbo (Primary)
      const result = await submitViduToQueue({
        prompt,
        image: imageUrl,
        duration: toViduDuration(duration),
        resolution: resolution,
        bgm: audioEnabled,
        movement_amplitude: movementAmplitude,
      })
      requestId = `wavespeed-vidu:${result.request_id}`
      provider = 'wavespeed'
      console.log(`Scene ${sceneIndex} submitted to WaveSpeed: ${requestId}`)
    } catch (waveSpeedError) {
      // WaveSpeed 실패 시 fal.ai로 Fallback
      console.warn('WaveSpeed Vidu Q2 실패, fal.ai로 Fallback:', waveSpeedError)

      try {
        const falResult = await submitFalViduQ2ToQueue({
          prompt,
          image_url: imageUrl,
          duration: Math.min(Math.max(duration, 2), 8) as 2 | 3 | 4 | 5 | 6 | 7 | 8,
          resolution: resolution === '1080p' ? '1080p' : '720p',  // fal.ai는 720p, 1080p만 지원
          movement_amplitude: movementAmplitude,
        })
        requestId = `fal-vidu:${falResult.request_id}`
        provider = 'fal'
        console.log(`Scene ${sceneIndex} submitted to fal.ai: ${requestId}`)
      } catch (falError) {
        console.error('fal.ai Vidu Q2도 실패:', falError)
        throw new Error('모든 비디오 생성 서비스가 실패했습니다')
      }
    }

    return NextResponse.json({
      sceneIndex,
      requestId,
      provider,
      prompt,
      duration,
      resolution,
      creditUsed: totalCreditCost,
    })
  } catch (error) {
    console.error('씬 영상 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene video' },
      { status: 500 }
    )
  }
}
