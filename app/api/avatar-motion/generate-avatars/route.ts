/**
 * AI 아바타 생성 API
 *
 * POST: 1개의 AI 아바타를 생성
 * - Gemini로 아바타 프롬프트 생성
 * - z-image/turbo로 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import { submitToQueue } from '@/lib/fal/client'
import { buildAvatarGenerationPrompt } from '@/lib/prompts/avatar-motion'

interface GenerateAvatarsRequest {
  gender?: string
  ageRange?: string
  style?: string
  ethnicity?: string
  productInfo?: string
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

    const body: GenerateAvatarsRequest = await request.json()

    const {
      gender = 'female',
      ageRange = '20s-30s',
      style = 'casual, friendly, approachable influencer',
      ethnicity = 'East Asian',
      productInfo = 'A general consumer product',
    } = body

    // 1. Gemini로 3개의 아바타 프롬프트 생성
    const avatarPrompt = buildAvatarGenerationPrompt(
      gender,
      ageRange,
      style,
      ethnicity,
      productInfo
    )

    const geminiResponse = await generateText(avatarPrompt)

    // JSON 파싱
    let avatarPromptData: { prompt: string; koreanDescription: string }
    try {
      // JSON 블록 추출
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const parsed = JSON.parse(jsonMatch[0])
      avatarPromptData = parsed.avatar
    } catch {
      console.error('Failed to parse avatar prompt:', geminiResponse)
      // Fallback 프롬프트 사용
      avatarPromptData = {
        prompt: `A ${ageRange} ${ethnicity} ${gender} with natural makeup, warm smile, wearing casual comfortable clothing, natural lighting, photorealistic portrait, looking friendly and approachable, Hyperrealistic photograph, 8K RAW quality`,
        koreanDescription: '자연스러운 인플루언서',
      }
    }

    // 2. z-image/turbo로 1개 생성 요청
    const result = await submitToQueue(avatarPromptData.prompt)

    return NextResponse.json({
      success: true,
      avatar: {
        requestId: `fal:${result.request_id}`,
        description: avatarPromptData.koreanDescription,
      },
    })
  } catch (error) {
    console.error('아바타 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate avatars' },
      { status: 500 }
    )
  }
}
