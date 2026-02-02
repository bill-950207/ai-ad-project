/**
 * 멀티씬 영상 생성 API (Vidu Q3)
 *
 * POST: 각 씬 키프레임 이미지로 개별 영상을 생성합니다.
 * - 씬1 이미지 → 씬1 영상
 * - 씬2 이미지 → 씬2 영상
 * - ...
 *
 * 지원 모델:
 * - vidu: WaveSpeed Vidu Q3
 *
 * 해상도: 540p, 720p, 1080p
 * 영상 길이: 1-16초
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
import { VIDU_CREDIT_COST_PER_SECOND } from '@/lib/credits'
import { recordCreditUse, recordCreditRefund } from '@/lib/credits/history'

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
  duration?: number     // 씬별 영상 길이 (1-16초)
  movementAmplitude?: 'auto' | 'small' | 'medium' | 'large'  // 카메라/모션 강도
}

interface GenerateSceneVideosRequest {
  keyframes: SceneKeyframe[]
  duration?: number        // 씬당 영상 길이 (1-16초, 기본 4)
  resolution?: ViduResolution  // 해상도 (540p, 720p, 1080p, 기본 720p)
  audioEnabled?: boolean   // 배경 음악 (기본 false)
  generateAudio?: boolean  // 오디오 자동 생성 (Q3 신규)
}

interface SceneVideoRequest {
  sceneIndex: number
  requestId: string
  prompt: string
  provider: 'wavespeed' | 'fal'
}

/**
 * 안전하게 duration을 ViduDuration으로 변환 (1-16초)
 */
function toViduDuration(d: number): ViduDuration {
  const clamped = Math.min(Math.max(Math.round(d), 1), 16)
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

    // 총 크레딧 계산 (각 씬의 해상도 × 시간) + 씬별 크레딧 추적
    const creditCostPerSecond = VIDU_CREDIT_COST_PER_SECOND[effectiveResolution] || VIDU_CREDIT_COST_PER_SECOND['720p']
    let totalCreditCost = 0
    const sceneCreditCosts: Map<number, number> = new Map() // 씬별 크레딧 비용 추적

    for (const keyframe of sortedKeyframes) {
      const sceneDuration = keyframe.duration ?? effectiveDuration
      const adjustedDuration = isFreeUser ? Math.min(sceneDuration, FREE_USER_LIMITS.maxDuration) : sceneDuration
      const sceneCost = Math.ceil(adjustedDuration * creditCostPerSecond)
      sceneCreditCosts.set(keyframe.sceneIndex, sceneCost)
      totalCreditCost += sceneCost
    }

    // 트랜잭션으로 크레딧 확인 및 차감 (원자적 처리 + 히스토리 기록)
    try {
      await prisma.$transaction(async (tx) => {
        const profile = await tx.profiles.findUnique({
          where: { id: user.id },
          select: { credits: true },
        })

        if (!profile || (profile.credits ?? 0) < totalCreditCost) {
          throw new Error('INSUFFICIENT_CREDITS')
        }

        const balanceAfter = (profile.credits ?? 0) - totalCreditCost

        await tx.profiles.update({
          where: { id: user.id },
          data: { credits: { decrement: totalCreditCost } },
        })

        // 총 씬 영상 시간 계산
        let totalSeconds = 0
        for (const keyframe of sortedKeyframes) {
          const sceneDuration = keyframe.duration ?? effectiveDuration
          const adjustedDuration = isFreeUser ? Math.min(sceneDuration, FREE_USER_LIMITS.maxDuration) : sceneDuration
          totalSeconds += adjustedDuration
        }

        // 크레딧 사용 히스토리 기록
        await recordCreditUse({
          userId: user.id,
          featureType: 'VIDU_SCENE',
          amount: totalCreditCost,
          balanceAfter,
          description: `Vidu Q3 씬 영상 생성 (${sortedKeyframes.length}개 씬, ${totalSeconds}초, ${effectiveResolution})`,
        }, tx)
      }, { timeout: 10000 })
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
        const profile = await prisma.profiles.findUnique({
          where: { id: user.id },
          select: { credits: true },
        })
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: totalCreditCost,
            available: profile?.credits ?? 0,
          },
          { status: 402 }
        )
      }
      throw error
    }

    console.log(`Generating ${sortedKeyframes.length} scene videos @ ${effectiveResolution} (${totalCreditCost} credits)`)

    // 각 씬에 대해 영상 생성 요청 (부분 실패 처리)
    const sceneVideoRequests: SceneVideoRequest[] = []
    const failedSceneIndices: number[] = []

    for (const keyframe of sortedKeyframes) {
      // 씬 프롬프트 (없으면 기본값 - 안정적인 카메라 워크 강조)
      const scenePrompt = keyframe.scenePrompt ||
        `Product centered in frame with steady, stable framing. Gentle gimbal-stabilized motion slowly revealing product details. Soft even lighting, no camera shake. Premium commercial aesthetic, photorealistic, 4K.`

      // 씬별 duration 사용 (없으면 글로벌 duration 사용)
      // FREE 사용자는 최대 4초로 제한
      let sceneDuration = keyframe.duration ?? effectiveDuration
      if (isFreeUser) {
        sceneDuration = Math.min(sceneDuration, FREE_USER_LIMITS.maxDuration)
      }
      // 씬별 movementAmplitude 사용 (없으면 'auto' - AI가 콘텐츠에 맞게 자동 결정)
      const sceneMovementAmplitude = keyframe.movementAmplitude ?? 'auto'

      try {
        // WaveSpeed Vidu Q3
        const result = await submitViduToQueue({
          prompt: scenePrompt,
          image: keyframe.imageUrl,
          duration: toViduDuration(sceneDuration),
          resolution: effectiveResolution,
          bgm: audioEnabled,
          movement_amplitude: sceneMovementAmplitude,
          generate_audio: body.generateAudio ?? false,  // Q3 신규 파라미터
        })
        const requestId = `wavespeed-vidu:${result.request_id}`

        sceneVideoRequests.push({
          sceneIndex: keyframe.sceneIndex,
          requestId,
          prompt: scenePrompt,
          provider: 'wavespeed',
        })
      } catch (sceneError) {
        // 개별 씬 요청 실패 기록
        console.error(`씬 ${keyframe.sceneIndex} 영상 생성 요청 실패:`, sceneError)
        failedSceneIndices.push(keyframe.sceneIndex)
      }
    }

    // 실패한 씬이 있으면 해당 크레딧 환불 + 환불 히스토리 기록
    if (failedSceneIndices.length > 0) {
      const refundAmount = failedSceneIndices.reduce((sum, sceneIndex) => {
        return sum + (sceneCreditCosts.get(sceneIndex) ?? 0)
      }, 0)

      if (refundAmount > 0) {
        await prisma.$transaction(async (tx) => {
          const profile = await tx.profiles.findUnique({
            where: { id: user.id },
            select: { credits: true },
          })
          const balanceAfterRefund = (profile?.credits ?? 0) + refundAmount
          await tx.profiles.update({
            where: { id: user.id },
            data: { credits: { increment: refundAmount } },
          })
          await recordCreditRefund({
            userId: user.id,
            featureType: 'VIDU_SCENE',
            amount: refundAmount,
            balanceAfter: balanceAfterRefund,
            description: `Vidu Q3 씬 영상 생성 실패 환불 (${failedSceneIndices.length}개 씬)`,
          }, tx)
        })
        console.log(`${failedSceneIndices.length}개 씬 실패, ${refundAmount} 크레딧 환불`)
      }
    }

    // 모든 씬이 실패한 경우
    if (sceneVideoRequests.length === 0) {
      return NextResponse.json(
        { error: 'All scene video generation requests failed' },
        { status: 500 }
      )
    }

    // 실제 사용된 크레딧 계산 (성공한 씬만)
    const actualCreditUsed = totalCreditCost - failedSceneIndices.reduce((sum, sceneIndex) => {
      return sum + (sceneCreditCosts.get(sceneIndex) ?? 0)
    }, 0)

    return NextResponse.json({
      sceneVideos: sceneVideoRequests,
      totalScenes: sceneVideoRequests.length,
      resolution: effectiveResolution,
      duration: effectiveDuration,
      creditUsed: actualCreditUsed,
      // 부분 실패 정보
      ...(failedSceneIndices.length > 0 && {
        failedScenes: failedSceneIndices,
        refundedCredits: totalCreditCost - actualCreditUsed,
      }),
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
