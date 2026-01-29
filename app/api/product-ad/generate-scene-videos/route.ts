/**
 * 멀티씬 영상 생성 API (Vidu Q2 Turbo)
 *
 * POST: 각 씬 키프레임 이미지로 개별 영상을 생성합니다.
 * - 씬1 이미지 → 씬1 영상
 * - 씬2 이미지 → 씬2 영상
 * - ...
 *
 * 지원 모델:
 * - vidu-q2: WaveSpeed Vidu Q2 Turbo (Primary)
 * - fallback: fal.ai Vidu Q2 (WaveSpeed 실패 시)
 *
 * 해상도: 540p, 720p, 1080p
 * 영상 길이: 1-8초
 *
 * 전환 방식: 컷 전환 (하드컷)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { getUserPlan } from '@/lib/subscription/queries'
import { plan_type } from '@/lib/generated/prisma/client'
import {
  submitViduToQueue,
  type ViduResolution,
  type ViduDuration,
} from '@/lib/wavespeed/client'
import {
  submitViduQ2ToQueue as submitFalViduQ2ToQueue,
} from '@/lib/fal/client'
import { VIDU_CREDIT_COST_PER_SECOND } from '@/lib/credits'

// FREE 사용자 제한
const FREE_USER_LIMITS = {
  maxResolution: '540p' as ViduResolution,
  maxDuration: 4,
  maxSceneCount: 3,
}

interface SceneKeyframe {
  sceneIndex: number
  imageUrl: string
  scenePrompt?: string  // 씬 영상 프롬프트
  duration?: number     // 씬별 영상 길이 (1-8초)
  movementAmplitude?: 'auto' | 'small' | 'medium' | 'large'  // 카메라/모션 강도
}

interface GenerateSceneVideosRequest {
  keyframes: SceneKeyframe[]
  duration?: number        // 씬당 영상 길이 (1-8초, 기본 4)
  resolution?: ViduResolution  // 해상도 (540p, 720p, 1080p, 기본 720p)
  audioEnabled?: boolean   // 배경 음악 (기본 false)
}

interface SceneVideoRequest {
  sceneIndex: number
  requestId: string
  prompt: string
  provider: 'wavespeed' | 'fal'
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

    const body: GenerateSceneVideosRequest = await request.json()
    const {
      keyframes,
      duration = 4,
      resolution = '720p',
      audioEnabled = false,
    } = body

    if (!keyframes || keyframes.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 keyframe is required' },
        { status: 400 }
      )
    }

    // 사용자 플랜 확인
    const userPlan = await getUserPlan(user.id)
    const isFreeUser = userPlan.planType === plan_type.FREE

    // FREE 사용자 제한 적용
    let effectiveResolution = resolution
    let effectiveDuration = duration
    let effectiveKeyframes = keyframes

    if (isFreeUser) {
      // 해상도 제한: 540p만 허용
      effectiveResolution = FREE_USER_LIMITS.maxResolution
      // 씬 영상 길이 제한: 최대 4초
      effectiveDuration = Math.min(duration, FREE_USER_LIMITS.maxDuration)
      // 씬 개수 제한: 최대 3개
      if (keyframes.length > FREE_USER_LIMITS.maxSceneCount) {
        effectiveKeyframes = keyframes.slice(0, FREE_USER_LIMITS.maxSceneCount)
      }
    }

    // 키프레임 인덱스 순으로 정렬
    const sortedKeyframes = [...effectiveKeyframes].sort((a, b) => a.sceneIndex - b.sceneIndex)

    // 총 크레딧 계산 (각 씬의 해상도 × 시간)
    const creditCostPerSecond = VIDU_CREDIT_COST_PER_SECOND[effectiveResolution] || VIDU_CREDIT_COST_PER_SECOND['720p']
    let totalCreditCost = 0
    for (const keyframe of sortedKeyframes) {
      const sceneDuration = keyframe.duration ?? effectiveDuration
      const adjustedDuration = isFreeUser ? Math.min(sceneDuration, FREE_USER_LIMITS.maxDuration) : sceneDuration
      totalCreditCost += Math.ceil(adjustedDuration * creditCostPerSecond)
    }

    // 크레딧 확인
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

    console.log(`Generating ${sortedKeyframes.length} scene videos @ ${effectiveResolution} (${totalCreditCost} credits)`)

    // 각 씬에 대해 영상 생성 요청
    const sceneVideoRequests: SceneVideoRequest[] = []

    for (const keyframe of sortedKeyframes) {
      // 씬 프롬프트 (없으면 기본값 - 모션 요소 포함)
      const scenePrompt = keyframe.scenePrompt ||
        `Product centered in frame. Camera slowly pushes in on the product. Soft lighting gently shifts creating subtle shadow movement. Premium advertisement aesthetic, photorealistic, 4K.`

      // 씬별 duration 사용 (없으면 글로벌 duration 사용)
      // FREE 사용자는 최대 4초로 제한
      let sceneDuration = keyframe.duration ?? effectiveDuration
      if (isFreeUser) {
        sceneDuration = Math.min(sceneDuration, FREE_USER_LIMITS.maxDuration)
      }
      // 씬별 movementAmplitude 사용 (없으면 'auto')
      const sceneMovementAmplitude = keyframe.movementAmplitude ?? 'auto'

      let requestId: string
      let provider: 'wavespeed' | 'fal' = 'wavespeed'

      try {
        // WaveSpeed Vidu Q2 Turbo (Primary)
        const result = await submitViduToQueue({
          prompt: scenePrompt,
          image: keyframe.imageUrl,
          duration: toViduDuration(sceneDuration),
          resolution: effectiveResolution,
          bgm: audioEnabled,
          movement_amplitude: sceneMovementAmplitude,
        })
        requestId = `wavespeed-vidu:${result.request_id}`
        provider = 'wavespeed'
      } catch (waveSpeedError) {
        // WaveSpeed 실패 시 fal.ai로 Fallback
        console.warn('WaveSpeed Vidu Q2 실패, fal.ai로 Fallback:', waveSpeedError)

        try {
          const falResult = await submitFalViduQ2ToQueue({
            prompt: scenePrompt,
            image_url: keyframe.imageUrl,
            duration: Math.min(Math.max(sceneDuration, 2), 8) as 2 | 3 | 4 | 5 | 6 | 7 | 8,
            resolution: effectiveResolution === '1080p' ? '1080p' : '720p',  // fal.ai는 720p, 1080p만 지원
            movement_amplitude: sceneMovementAmplitude,
          })
          requestId = `fal-vidu:${falResult.request_id}`
          provider = 'fal'
        } catch (falError) {
          console.error('fal.ai Vidu Q2도 실패:', falError)
          throw new Error('모든 비디오 생성 서비스가 실패했습니다')
        }
      }

      sceneVideoRequests.push({
        sceneIndex: keyframe.sceneIndex,
        requestId,
        prompt: scenePrompt,
        provider,
      })
    }

    return NextResponse.json({
      sceneVideos: sceneVideoRequests,
      totalScenes: sceneVideoRequests.length,
      resolution: effectiveResolution,
      duration: effectiveDuration,
      creditUsed: totalCreditCost,
      // FREE 사용자에게 제한 적용 여부 알림
      ...(isFreeUser && {
        appliedLimits: {
          resolution: FREE_USER_LIMITS.maxResolution,
          maxDuration: FREE_USER_LIMITS.maxDuration,
          maxSceneCount: FREE_USER_LIMITS.maxSceneCount,
        },
      }),
    })
  } catch (error) {
    console.error('씬 영상 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene videos' },
      { status: 500 }
    )
  }
}
