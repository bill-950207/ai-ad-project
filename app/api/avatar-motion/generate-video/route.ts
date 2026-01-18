/**
 * 아바타 모션 영상 생성 API
 *
 * POST: 시작/끝 프레임 이미지를 사용하여 모션 영상 생성
 * - Seedance 1.5 Pro (kie.ai) 사용
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  submitSeedanceToQueue,
  type SeedanceAspectRatio,
  type SeedanceDuration,
} from '@/lib/kie/client'

interface GenerateVideoRequest {
  startFrameUrl: string          // 시작 프레임 이미지 URL
  endFrameUrl: string            // 끝 프레임 이미지 URL
  prompt: string                 // 영상 생성 프롬프트
  aspectRatio?: '9:16' | '16:9' | '1:1'
  duration?: number              // 영상 길이 (초): 4, 8, 12
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
      endFrameUrl,
      prompt,
      aspectRatio = '9:16',
      duration = 8,
      generateAudio = false,
    } = body

    if (!startFrameUrl || !endFrameUrl) {
      return NextResponse.json(
        { error: 'Start and end frame URLs are required' },
        { status: 400 }
      )
    }

    // Seedance aspect ratio 매핑
    const seedanceAspectRatio: SeedanceAspectRatio =
      aspectRatio === '1:1' ? '1:1' :
      aspectRatio === '16:9' ? '16:9' : '9:16'

    // Seedance duration 매핑
    const seedanceDuration: SeedanceDuration =
      duration <= 4 ? '4' :
      duration <= 8 ? '8' : '12'

    // Seedance 1.5 Pro로 영상 생성 요청
    const response = await submitSeedanceToQueue(
      startFrameUrl,
      endFrameUrl,
      prompt,
      {
        aspectRatio: seedanceAspectRatio,
        duration: seedanceDuration,
        resolution: '720p',
        fixedLens: false,
        generateAudio,
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
  // 기본: 4초 = 50 크레딧, 8초 = 60 크레딧, 12초 = 75 크레딧
  if (duration <= 4) return 50
  if (duration <= 8) return 60
  return 75
}
