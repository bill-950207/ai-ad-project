/**
 * AI 아바타 생성 API
 *
 * POST: 1개의 AI 아바타를 생성
 * - Gemini로 영상 컨텍스트를 분석하여 최적의 아바타 프롬프트 생성
 * - z-image/turbo로 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import { submitToQueue } from '@/lib/fal/client'
import { buildContextAwareAvatarPrompt } from '@/lib/prompts/avatar-motion'

interface StoryInfo {
  title?: string
  description?: string
  startFrame: { description: string }
  endFrame: { description: string }
  mood?: string
  action?: string
  motionPromptEN?: string
}

interface GenerateAvatarsRequest {
  // 제품 정보
  productName?: string
  productDescription?: string
  productCategory?: string
  // 스토리 정보
  storyInfo?: StoryInfo
  // 배경/장소
  locationPrompt?: string
  // 기존 필드 (fallback용)
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
      productName,
      productDescription,
      productCategory,
      storyInfo,
      locationPrompt,
    } = body

    // 1. Gemini로 영상 컨텍스트를 분석하여 최적의 아바타 프롬프트 생성
    const avatarPrompt = buildContextAwareAvatarPrompt({
      productName: productName || '',
      productDescription: productDescription || '',
      productCategory: productCategory || '',
      storyTitle: storyInfo?.title || '',
      storyDescription: storyInfo?.description || '',
      startFrameDescription: storyInfo?.startFrame?.description || '',
      endFrameDescription: storyInfo?.endFrame?.description || '',
      mood: storyInfo?.mood || '',
      action: storyInfo?.action || '',
      locationPrompt: locationPrompt || '',
    })

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
        prompt: `A 20s-30s East Asian woman with natural makeup, warm smile, wearing casual comfortable clothing suitable for ${productName || 'product'} advertisement, natural lighting, photorealistic portrait, looking friendly and approachable, Hyperrealistic photograph, 8K RAW quality`,
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
