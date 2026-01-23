/**
 * 아바타 의상 변환 API
 *
 * POST: Z-Image Turbo를 사용해 아바타의 의상을 시나리오에 맞게 변환
 * - 얼굴과 체형 유지
 * - 의상만 변경
 * - 변환된 이미지를 이후 프레임 생성에 사용
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  submitAvatarOutfitTransformToQueue,
  getZImageI2IQueueStatus,
  getZImageI2IQueueResponse,
} from '@/lib/fal/client'
import { buildOutfitPromptFromScenario } from '@/lib/prompts/avatar-motion'

interface TransformOutfitRequest {
  avatarImageUrl: string       // 아바타 원본 이미지 URL
  scenario: {                  // 시나리오 정보
    mood: string
    visualStyle?: string
    concept?: string
    storyBeats?: {
      setup?: string
    }
  }
  productCategory?: string     // 제품 카테고리
  strength?: number            // 변환 강도 (0.0-1.0, 기본값: 0.55)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: TransformOutfitRequest = await request.json()
    const {
      avatarImageUrl,
      scenario,
      productCategory,
      strength,
    } = body

    // 필수 파라미터 검증
    if (!avatarImageUrl) {
      return NextResponse.json(
        { error: 'Missing required parameter: avatarImageUrl' },
        { status: 400 }
      )
    }

    if (!scenario || !scenario.mood) {
      return NextResponse.json(
        { error: 'Missing required parameter: scenario with mood' },
        { status: 400 }
      )
    }

    // 의상 변환 프롬프트 생성
    const outfitPrompt = buildOutfitPromptFromScenario(
      scenario,
      productCategory || '일반 소비재'
    )

    console.log('의상 변환 프롬프트:', outfitPrompt)

    // Z-Image Turbo 큐에 제출
    const queueResponse = await submitAvatarOutfitTransformToQueue(
      avatarImageUrl,
      outfitPrompt,
      strength || 0.55
    )

    console.log('의상 변환 요청 제출:', queueResponse.request_id)

    return NextResponse.json({
      success: true,
      requestId: queueResponse.request_id,
      statusUrl: queueResponse.status_url,
      prompt: outfitPrompt,
    })
  } catch (error) {
    console.error('의상 변환 요청 오류:', error)
    return NextResponse.json(
      { error: 'Failed to submit outfit transformation request' },
      { status: 500 }
    )
  }
}

/**
 * GET: 의상 변환 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing required parameter: requestId' },
        { status: 400 }
      )
    }

    // 상태 조회
    const status = await getZImageI2IQueueStatus(requestId)

    if (status.status === 'COMPLETED') {
      // 완료 시 결과 조회
      const result = await getZImageI2IQueueResponse(requestId)

      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        transformedImageUrl: result.images[0]?.url,
        seed: result.seed,
      })
    }

    return NextResponse.json({
      success: true,
      status: status.status,
      queuePosition: status.queue_position,
    })
  } catch (error) {
    console.error('의상 변환 상태 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to get outfit transformation status' },
      { status: 500 }
    )
  }
}
