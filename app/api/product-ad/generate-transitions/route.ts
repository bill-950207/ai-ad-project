/**
 * Kling O1 씬 전환 영상 생성 API
 *
 * POST: 연속된 키프레임 이미지들 사이의 전환 영상을 Kling O1로 생성합니다.
 * - 씬1 → 씬2 전환 영상
 * - 씬2 → 씬3 전환 영상
 * - ...
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import {
  submitKlingO1ToQueue,
  type KlingO1Duration,
} from '@/lib/fal/client'
import { TRANSITION_CREDIT_COST } from '@/lib/credits'
import { isAdminUser } from '@/lib/auth/admin'

interface SceneKeyframe {
  sceneIndex: number
  imageUrl: string
  transitionPrompt?: string  // 다음 씬으로의 전환 프롬프트
  duration?: number          // 전환 영상 길이 (3-10초)
}

interface GenerateTransitionsRequest {
  keyframes: SceneKeyframe[]
}

interface TransitionRequest {
  fromSceneIndex: number
  toSceneIndex: number
  requestId: string
  prompt: string
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

    const body: GenerateTransitionsRequest = await request.json()
    const { keyframes } = body

    if (!keyframes || keyframes.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 keyframes are required for transitions' },
        { status: 400 }
      )
    }

    // 전환 개수 계산 (키프레임 수 - 1)
    const transitionCount = keyframes.length - 1
    const totalCreditCost = transitionCount * TRANSITION_CREDIT_COST
    const isAdmin = await isAdminUser(user.id)

    // 트랜잭션으로 크레딧 확인 및 차감 (원자적 처리) - 어드민은 스킵
    if (!isAdmin) {
      try {
        await prisma.$transaction(async (tx) => {
          const profile = await tx.profiles.findUnique({
            where: { id: user.id },
            select: { credits: true },
          })

          if (!profile || (profile.credits ?? 0) < totalCreditCost) {
            throw new Error('INSUFFICIENT_CREDITS')
          }

          await tx.profiles.update({
            where: { id: user.id },
            data: { credits: { decrement: totalCreditCost } },
          })
        }, { timeout: 10000 })
      } catch (error) {
        if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
          const profile = await prisma.profiles.findUnique({
            where: { id: user.id },
            select: { credits: true },
          })
          return NextResponse.json(
            { error: 'Insufficient credits', required: totalCreditCost, available: profile?.credits ?? 0 },
            { status: 402 }
          )
        }
        throw error
      }
    }

    // 키프레임 인덱스 순으로 정렬
    const sortedKeyframes = [...keyframes].sort((a, b) => a.sceneIndex - b.sceneIndex)

    // 각 연속 키프레임 쌍에 대해 Kling O1 전환 영상 생성 요청 (부분 실패 처리)
    const transitionRequests: TransitionRequest[] = []
    let failedCount = 0

    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const fromKeyframe = sortedKeyframes[i]
      const toKeyframe = sortedKeyframes[i + 1]

      // 전환 프롬프트 (없으면 기본값)
      const transitionPrompt = fromKeyframe.transitionPrompt ||
        `Professional gimbal-stabilized smooth transition from scene ${i + 1} to scene ${i + 2}. Steady camera glide with no handheld shakiness. The scene transforms naturally with elegant, controlled motion. Soft professional lighting effect, broadcast quality stability.`

      // 전환 영상 길이 (기본 5초)
      const duration = String(Math.min(10, Math.max(3, fromKeyframe.duration || 5))) as KlingO1Duration

      try {
        // Kling O1 요청 제출
        const result = await submitKlingO1ToQueue({
          prompt: transitionPrompt,
          start_image_url: fromKeyframe.imageUrl,
          end_image_url: toKeyframe.imageUrl,
          duration,
        })

        transitionRequests.push({
          fromSceneIndex: fromKeyframe.sceneIndex,
          toSceneIndex: toKeyframe.sceneIndex,
          requestId: `fal:${result.request_id}`,
          prompt: transitionPrompt,
        })
      } catch (transitionError) {
        // 개별 전환 요청 실패 기록
        console.error(`전환 ${fromKeyframe.sceneIndex}→${toKeyframe.sceneIndex} 생성 요청 실패:`, transitionError)
        failedCount++
      }
    }

    // 실패한 전환이 있으면 해당 크레딧 환불 (어드민은 차감 안 했으므로 환불도 스킵)
    if (failedCount > 0 && !isAdmin) {
      const refundAmount = failedCount * TRANSITION_CREDIT_COST
      await prisma.profiles.update({
        where: { id: user.id },
        data: { credits: { increment: refundAmount } },
      })
      console.log(`${failedCount}개 전환 실패, ${refundAmount} 크레딧 환불`)
    }

    // 모든 전환이 실패한 경우
    if (transitionRequests.length === 0) {
      return NextResponse.json(
        { error: 'All transition video generation requests failed' },
        { status: 500 }
      )
    }

    // 실제 사용된 크레딧 계산 (성공한 전환만)
    const actualCreditUsed = transitionRequests.length * TRANSITION_CREDIT_COST

    return NextResponse.json({
      transitions: transitionRequests,
      totalTransitions: transitionRequests.length,
      creditUsed: actualCreditUsed,
      // 부분 실패 정보
      ...(failedCount > 0 && {
        failedCount,
        refundedCredits: failedCount * TRANSITION_CREDIT_COST,
      }),
    })
  } catch (error) {
    console.error('전환 영상 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate transition videos' },
      { status: 500 }
    )
  }
}
