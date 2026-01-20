/**
 * 아바타 모션 영상 생성 API
 *
 * POST: 첫 프레임 이미지를 사용하여 모션 영상 생성
 * - Kling 2.6 Image-to-Video (kie.ai) 사용
 * - 첫 프레임 이미지만 필요 (끝 프레임 불필요)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  submitKling26ToQueue,
  type Kling26Duration,
} from '@/lib/kie/client'

interface GenerateVideoRequest {
  startFrameUrl: string          // 첫 프레임 이미지 URL (필수)
  prompt: string                 // 영상 생성 프롬프트 (영어, motionPromptEN 사용)
  duration?: number              // 영상 길이 (초): 5 또는 10
  generateAudio?: boolean        // 오디오 생성 여부
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

    const body: GenerateVideoRequest = await request.json()
    const {
      startFrameUrl,
      prompt,
      duration = 5,
      generateAudio = false,
    } = body

    if (!startFrameUrl) {
      return NextResponse.json(
        { error: 'Start frame URL is required' },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Kling 2.6 duration 매핑 (5초 또는 10초만 지원)
    const klingDuration: Kling26Duration = duration >= 10 ? '10' : '5'

    // Kling 2.6 Image-to-Video로 영상 생성 요청
    const response = await submitKling26ToQueue(
      startFrameUrl,
      prompt,
      {
        sound: generateAudio,
        duration: klingDuration,
      }
    )

    // 크레딧 차감
    const creditCost = calculateCreditCost(duration)

    const { error: creditError } = await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: creditCost,
      p_description: `아바타 모션 영상 생성 (${duration}초)`,
    })

    if (creditError) {
      console.error('크레딧 차감 오류:', creditError)
      // 크레딧 차감 실패해도 일단 진행 (로그만 남김)
    }

    return NextResponse.json({
      success: true,
      requestId: `kie:${response.request_id}`,
      creditCost,
    })
  } catch (error) {
    console.error('영상 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    )
  }
}

function calculateCreditCost(duration: number): number {
  // Kling 2.6: 5초 = 50 크레딧, 10초 = 70 크레딧
  if (duration <= 5) return 50
  return 70
}
