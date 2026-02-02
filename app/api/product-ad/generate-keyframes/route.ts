/**
 * 멀티씬 키프레임 이미지 생성 API
 *
 * POST: 각 씬의 프롬프트를 기반으로 키프레임 이미지들을 생성합니다.
 * Seedream 4.5 (kie.ai)를 사용하여 제품 이미지와 프롬프트로 씬 이미지 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import {
  createEditTask,
  type EditAspectRatio,
} from '@/lib/kie/client'
import { KEYFRAME_CREDIT_COST } from '@/lib/credits'
import { sanitizePrompt } from '@/lib/prompts/sanitize'

interface SceneInput {
  index: number
  scenePrompt: string
}

interface GenerateKeyframesRequest {
  productImageUrl: string
  scenes: SceneInput[]
  aspectRatio: '16:9' | '9:16' | '1:1'
}

// 비율 매핑 (Seedream 4.5용)
function mapAspectRatio(ratio: '16:9' | '9:16' | '1:1'): EditAspectRatio {
  const mapping: Record<string, EditAspectRatio> = {
    '16:9': '16:9',
    '9:16': '9:16',
    '1:1': '1:1',
  }
  return mapping[ratio] || '9:16'
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

    const body: GenerateKeyframesRequest = await request.json()
    const {
      productImageUrl,
      scenes,
      aspectRatio,
    } = body

    if (!productImageUrl || !scenes || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 크레딧 계산 (씬 개수 × 키프레임당 비용)
    const totalCreditCost = scenes.length * KEYFRAME_CREDIT_COST

    // 트랜잭션으로 크레딧 확인 및 차감 (원자적 처리)
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

    // 각 씬에 대해 Seedream 4.5로 이미지 생성 요청
    let requests: { sceneIndex: number; requestId: string; prompt: string }[] = []
    try {
      requests = await Promise.all(
        scenes.map(async (scene) => {
          // 프롬프트에서 금지 단어 제거 (카메라/촬영장비 등장 방지)
          const sanitizedPrompt = sanitizePrompt(scene.scenePrompt)

          const result = await createEditTask({
            prompt: sanitizedPrompt,
            image_urls: [productImageUrl],
            aspect_ratio: mapAspectRatio(aspectRatio),
            quality: 'high',
          })
          return {
            sceneIndex: scene.index,
            requestId: `kie:${result.taskId}`,
            prompt: sanitizedPrompt,  // 정제된 프롬프트 반환
          }
        })
      )
    } catch (requestError) {
      // 이미지 생성 요청 실패 시 크레딧 환불
      console.error('키프레임 생성 요청 실패, 크레딧 환불:', requestError)
      await prisma.profiles.update({
        where: { id: user.id },
        data: { credits: { increment: totalCreditCost } },
      })
      throw requestError
    }

    return NextResponse.json({
      requests,
      creditUsed: totalCreditCost,
    })
  } catch (error) {
    console.error('키프레임 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate keyframes' },
      { status: 500 }
    )
  }
}
