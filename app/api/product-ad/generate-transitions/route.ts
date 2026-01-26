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

    // 크레딧 확인
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
    })

    if (!profile || (profile.credits ?? 0) < totalCreditCost) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: totalCreditCost, available: profile?.credits ?? 0 },
        { status: 402 }
      )
    }

    // 키프레임 인덱스 순으로 정렬
    const sortedKeyframes = [...keyframes].sort((a, b) => a.sceneIndex - b.sceneIndex)

    // 각 연속 키프레임 쌍에 대해 Kling O1 전환 영상 생성 요청
    const transitionRequests: TransitionRequest[] = []

    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const fromKeyframe = sortedKeyframes[i]
      const toKeyframe = sortedKeyframes[i + 1]

      // 전환 프롬프트 (없으면 기본값)
      const transitionPrompt = fromKeyframe.transitionPrompt ||
        `Smooth cinematic transition from scene ${i + 1} to scene ${i + 2}. The scene transforms naturally with professional camera movement.`

      // 전환 영상 길이 (기본 5초)
      const duration = String(Math.min(10, Math.max(3, fromKeyframe.duration || 5))) as KlingO1Duration

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
    }

    // 크레딧 차감
    await prisma.profiles.update({
      where: { id: user.id },
      data: { credits: { decrement: totalCreditCost } },
    })

    return NextResponse.json({
      transitions: transitionRequests,
      totalTransitions: transitionRequests.length,
      creditUsed: totalCreditCost,
    })
  } catch (error) {
    console.error('전환 영상 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate transition videos' },
      { status: 500 }
    )
  }
}
