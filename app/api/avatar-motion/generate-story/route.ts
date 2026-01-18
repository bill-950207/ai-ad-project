/**
 * 아바타 모션 스토리 생성 API
 *
 * POST: AI가 제품과 아바타에 맞는 모션 스토리를 생성
 * - Gemini를 사용하여 3개의 스토리 옵션 생성
 * - 시작 프레임과 끝 프레임 설명 (한국어)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import { buildStoryGenerationPrompt } from '@/lib/prompts/avatar-motion'

interface StoryOption {
  id: string
  title: string
  description: string
  startFrame: string
  endFrame: string
  mood: string
  action: string
  motionPromptEN?: string // 영상 생성용 영어 모션 설명
}

interface GenerateStoryRequest {
  productName?: string
  productDescription?: string
  productCategory?: string
  avatarType: 'selected' | 'ai-generated' | 'outfit'
  avatarDescription?: string
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

    const body: GenerateStoryRequest = await request.json()
    const {
      productName = '',
      productDescription = '',
      productCategory = '',
      avatarType,
      avatarDescription = '',
    } = body

    // 프롬프트 생성
    const prompt = buildStoryGenerationPrompt(
      productName,
      productDescription,
      productCategory,
      avatarDescription || getDefaultAvatarDescription(avatarType),
      avatarType
    )

    // Gemini API 호출
    const response = await generateText(prompt)

    // JSON 파싱
    let stories: StoryOption[]
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const parsed = JSON.parse(jsonMatch[0])
      stories = parsed.stories
    } catch {
      console.error('Failed to parse story response:', response)
      // Fallback 스토리 사용
      stories = getFallbackStories(productName)
    }

    return NextResponse.json({
      success: true,
      stories,
    })
  } catch (error) {
    console.error('스토리 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate story' },
      { status: 500 }
    )
  }
}

function getDefaultAvatarDescription(avatarType: string): string {
  switch (avatarType) {
    case 'ai-generated':
      return 'AI가 자동으로 생성할 친근한 인플루언서 스타일의 인물'
    case 'outfit':
      return '의상을 교체한 모델'
    default:
      return '사용자가 선택한 모델'
  }
}

function getFallbackStories(productName: string): StoryOption[] {
  const product = productName || '제품'
  const productEN = productName || 'the product'
  return [
    {
      id: '1',
      title: '제품 소개',
      description: '제품을 자연스럽게 보여주는 기본 모션',
      startFrame: `아바타가 ${product}을(를) 손에 들고 카메라를 향해 미소 짓고 있음`,
      endFrame: `아바타가 ${product}을(를) 카메라 가까이 들어 보여주며 엄지를 치켜세움`,
      mood: '밝고 친근한',
      action: '제품 들어보이기',
      motionPromptEN: `The person starts by holding ${productEN} at waist level with a warm smile, then smoothly lifts the product towards the camera while maintaining eye contact. The arm gradually rises from waist to chest level, and the facial expression transitions from a gentle smile to an enthusiastic grin. Finally, the person gives a thumbs up gesture while presenting the product prominently to the viewer.`,
    },
    {
      id: '2',
      title: '제품 사용',
      description: '제품을 사용하는 자연스러운 모습',
      startFrame: `아바타가 ${product}을(를) 손에 들고 사용하려는 자세`,
      endFrame: `아바타가 ${product}을(를) 사용한 후 만족스러운 표정을 짓고 있음`,
      mood: '자연스럽고 일상적인',
      action: '제품 사용하기',
      motionPromptEN: `The person holds ${productEN} in preparation to use it, with an anticipating expression. They then demonstrate the product usage with natural, authentic movements - bringing it closer and interacting with it. The expression gradually shifts from curiosity to satisfaction, ending with a pleased and content smile that conveys genuine approval of the product.`,
    },
    {
      id: '3',
      title: '언박싱',
      description: '제품을 개봉하는 설레는 순간',
      startFrame: `아바타가 포장된 ${product} 상자를 들고 기대하는 표정`,
      endFrame: `아바타가 상자에서 ${product}을(를) 꺼내 보여주며 기뻐하는 표정`,
      mood: '설레고 기대되는',
      action: '제품 개봉하기',
      motionPromptEN: `The person excitedly holds the packaged ${productEN} box with an eager, anticipating expression. They then open the packaging with enthusiastic movements, revealing the product inside. As they lift ${productEN} out of the box, their face lights up with genuine joy and excitement, showcasing the unboxing moment with an authentic reaction of delight.`,
    },
  ]
}
