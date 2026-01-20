/**
 * 아바타 모션 스토리 생성 API
 *
 * POST: AI가 제품과 아바타에 맞는 모션 스토리를 생성
 * - Gemini를 사용하여 3개의 스토리 옵션 생성
 * - 컨셉, 배경/장소, 시작 프레임 설명 (한국어)
 * - 영상 생성용 영어 모션 프롬프트 (kling-2.6 모델용)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import { buildStoryGenerationPrompt } from '@/lib/prompts/avatar-motion'

interface StoryOption {
  id: string
  title: string
  description: string
  concept?: string           // 광고 컨셉 설명
  background?: string        // 배경/장소 상세 설명
  startFrame: string         // 시작 프레임 설명 (필수)
  endFrame?: string          // 끝 프레임 설명 (선택 - 호환성 유지)
  mood: string
  action: string
  emotionalArc?: string      // 감정의 흐름
  motionPromptEN?: string    // 영상 생성용 영어 모션 설명 (kling-2.6용)
}

interface GenerateStoryRequest {
  productName?: string
  productDescription?: string
  productCategory?: string
  avatarType: 'selected' | 'ai-generated' | 'outfit'
  avatarDescription?: string
  locationPrompt?: string  // 배경/장소 프롬프트 (빈 문자열이면 AI 자동 선택)
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
      locationPrompt,
    } = body

    // 프롬프트 생성
    const prompt = buildStoryGenerationPrompt(
      productName,
      productDescription,
      productCategory,
      avatarDescription || getDefaultAvatarDescription(avatarType),
      avatarType,
      locationPrompt
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
      title: '찐 추천',
      description: '친구에게 추천하듯 자연스러운 소개',
      concept: '마치 친한 친구에게 좋은 제품을 발견했다고 알려주는 듯한 자연스러운 추천 영상. 진정성 있는 표정과 제스처로 신뢰감을 전달한다.',
      background: '밝은 자연광이 들어오는 미니멀한 화이트톤 거실. 창가 근처에서 부드러운 역광이 들어오고, 뒤로는 심플한 소품들이 보이는 일상적인 공간',
      startFrame: `편안하게 서서 ${product}을(를) 양손으로 가슴 높이에 들고 있음. 카메라를 바라보며 '이거 진짜 좋아'라고 말하듯 기대감 어린 미소를 짓고 있음. 어깨는 자연스럽게 이완되어 있고, 제품이 잘 보이도록 살짝 앞으로 내밀고 있음`,
      mood: '친근하고 신뢰감 있는',
      action: '진심 추천',
      emotionalArc: '기대감 → 확신 → 추천',
      motionPromptEN: `Starting pose: Person stands comfortably, holding ${productEN} at chest level with both hands, soft anticipating smile, looking directly at camera. Motion sequence: Slowly leans upper body slightly forward toward camera while smoothly raising ${productEN} to face level with one hand. Expression transitions from gentle expectation to confident, bright smile. Free hand naturally moves to give thumbs up or OK gesture. Ending pose: Leaning forward slightly, product held proudly beside face, beaming genuine smile conveying strong recommendation.`,
    },
    {
      id: '2',
      title: '일상 속 발견',
      description: '자연스러운 일상에서 제품을 만나는 순간',
      concept: '일상적인 순간에 제품을 발견하고 사용해보는 라이프스타일 영상. 꾸밈없는 자연스러움이 진정성을 더한다.',
      background: '따뜻한 오후 햇살이 들어오는 아늑한 카페 창가 자리. 원목 테이블 위에 제품이 놓여있고, 뒤로는 블러 처리된 카페 인테리어가 보이는 감성적인 공간',
      startFrame: `카페 테이블에 앉아 ${product}을(를) 처음 본 듯 호기심 어린 눈으로 바라보고 있음. 한 손으로 턱을 괴고, 다른 손으로 제품을 살짝 만지며 관심을 보이는 자세. 눈썹이 살짝 올라가고 입꼬리가 미세하게 올라간 호기심 가득한 표정`,
      mood: '자연스럽고 일상적인',
      action: '발견의 기쁨',
      emotionalArc: '호기심 → 관심 → 만족',
      motionPromptEN: `Starting pose: Person sits at cafe table, one hand supporting chin, other hand gently touching ${productEN} on table, curious expression with raised eyebrows and slight smile. Motion sequence: Gradually picks up ${productEN} with both hands, expression brightens as they examine it, shoulders slightly lift with growing excitement. Lifts product to show camera while leaning back slightly. Ending pose: Holding ${productEN} with both hands at chest level, genuine bright smile with eyes curved like crescents, shoulders slightly raised showing delight.`,
    },
    {
      id: '3',
      title: '설레는 언박싱',
      description: '새 제품을 개봉하는 두근거리는 순간',
      concept: '새로운 제품이 도착한 설렘과 개봉하는 기대감을 담은 영상. ASMR처럼 천천히 진행되며 시청자의 호기심을 자극한다.',
      background: '깔끔하게 정돈된 침대 위 또는 미니멀한 책상. 부드러운 간접 조명이 제품 박스를 비추고, 뒤로는 심플한 인테리어가 보이는 아늑한 개인 공간',
      startFrame: `침대나 책상 앞에 앉아 포장된 ${product} 박스를 무릎 위에 올려두고 있음. 두 손으로 박스를 감싸 쥐고, 눈을 크게 뜬 채 기대감 가득한 표정으로 카메라를 바라봄. 입술을 살짝 깨물듯 설레는 모습`,
      mood: '설레고 기대되는',
      action: '언박싱',
      emotionalArc: '기대 → 설렘 → 기쁨',
      motionPromptEN: `Starting pose: Person sits comfortably, holding packaged ${productEN} box on lap with both hands, eyes wide with anticipation, slight lip bite showing excitement, looking at camera. Motion sequence: Carefully opens packaging with deliberate, excited movements. Eyes follow the product as it's revealed. Expression transforms from anticipation to delight. Lifts ${productEN} out of box and raises it beside face. Ending pose: Holding ${productEN} proudly beside face, bright open-mouthed smile, eyes sparkling with joy, empty box pushed aside, conveying successful unboxing moment.`,
    },
  ]
}
