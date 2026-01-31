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

/**
 * 프롬프트에서 카메라/촬영장비 관련 금지 단어를 제거합니다.
 * Seedream 4.5 모델이 이 단어들을 보면 실제 카메라/장비를 생성합니다.
 */
const FORBIDDEN_WORDS = [
  // 카메라 관련
  'camera', 'Camera', 'CAMERA',
  'tripod', 'Tripod',
  'DSLR', 'dslr',
  'mirrorless', 'Mirrorless',
  // 촬영 관련
  'photographer', 'Photographer',
  'filming', 'Filming',
  'behind the scenes', 'Behind the scenes',
  'photo shoot', 'photoshoot',
  'studio setup', 'Studio setup',
  'production setup', 'Production setup',
  // 기타 장비
  'softbox', 'Softbox',
  'ring light', 'Ring light',
  'lighting rig', 'Lighting rig',
  'reflector', 'Reflector',
]

/**
 * 프롬프트를 정제하여 금지 단어를 제거합니다.
 */
function sanitizePrompt(prompt: string): string {
  let sanitized = prompt

  // 금지 단어 제거
  for (const word of FORBIDDEN_WORDS) {
    // 단어 경계를 고려하여 교체 (대소문자 구분)
    const regex = new RegExp(`\\b${word}\\b`, 'g')
    sanitized = sanitized.replace(regex, '')
  }

  // 연속된 공백 정리
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  // 연속된 쉼표/마침표 정리
  sanitized = sanitized.replace(/,\s*,/g, ',').replace(/\.\s*\./g, '.')
  sanitized = sanitized.replace(/,\s*\./g, '.').replace(/\.\s*,/g, ',')

  // 안전 키워드 추가 (프롬프트 끝에)
  if (!sanitized.toLowerCase().includes('no visible equipment')) {
    sanitized += ' No visible studio equipment or production setup.'
  }

  return sanitized
}

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

    // 각 씬에 대해 Seedream 4.5로 이미지 생성 요청
    const requests = await Promise.all(
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

    // 크레딧 차감
    await prisma.profiles.update({
      where: { id: user.id },
      data: { credits: { decrement: totalCreditCost } },
    })

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
