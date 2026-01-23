/**
 * 아바타 모션 시나리오 생성 API
 *
 * POST: AI가 제품과 아바타에 맞는 영화적 시나리오 3개 생성
 * - Gemini를 사용하여 시나리오 생성
 * - 제품이 자연스럽게 등장하는 씬 구성
 * - 멀티 씬 지원 (Vidu Q2용)
 * - 단일 씬 지원 (Legacy, kling-2.6용)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import {
  buildScenarioGenerationPrompt,
  buildMultiSceneScenarioPrompt,
  buildCompleteScenarioPrompt,
} from '@/lib/prompts/avatar-motion'

// 씬 정보 타입 (멀티 씬)
interface SceneInfo {
  sceneIndex: number
  title: string
  description: string
  firstFramePrompt: string
  motionPromptEN: string
  duration: number
  movementAmplitude: 'auto' | 'small' | 'medium' | 'large'
  location: string
  mood: string
}

// 추천 설정 타입 (완전 시나리오 생성용)
interface RecommendedSettings {
  aspectRatio: '16:9' | '9:16' | '1:1'
  sceneCount: number
  sceneDurations: number[]
  movementAmplitudes: ('auto' | 'small' | 'medium' | 'large')[]
}

// 시나리오 타입 (wizard-context.tsx의 Scenario와 동일)
interface Scenario {
  id: string
  title: string
  description: string
  concept: string
  productAppearance: string
  mood: string
  tags: string[]
  // 멀티 씬 지원
  scenes?: SceneInfo[]
  totalDuration?: number
  // Legacy (단일 씬)
  firstFramePrompt?: string
  motionPromptEN?: string
  location?: string
  // 완전 시나리오 생성 시 추천 설정
  recommendedSettings?: RecommendedSettings
}

interface GenerateStoryRequest {
  productName: string
  productDescription?: string
  productSellingPoints?: string[]
  avatarType: 'avatar' | 'ai-generated' | 'outfit'
  avatarDescription?: string
  // 멀티 씬 옵션
  multiScene?: boolean
  sceneCount?: number
  totalDuration?: number
  // AI 추천 모드: 시나리오와 함께 모든 설정 생성
  generateCompleteSettings?: boolean
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
      productName,
      productDescription = '',
      productSellingPoints = [],
      avatarType,
      avatarDescription = '',
      multiScene = false,
      sceneCount = 3,
      totalDuration = 15,
      generateCompleteSettings = false,
    } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    // 시나리오 생성 모드 분기
    let scenarios: Scenario[]

    // 완전 시나리오 생성 모드 (AI 추천 - 설정 포함)
    if (generateCompleteSettings) {
      const prompt = buildCompleteScenarioPrompt(
        productName,
        productDescription,
        productSellingPoints,
        avatarDescription || getDefaultAvatarDescription(avatarType),
        avatarType
      )

      const response = await generateText(prompt)

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No JSON found in response')
        }
        const parsed = JSON.parse(jsonMatch[0])
        scenarios = normalizeCompleteScenarios(parsed.scenarios)
      } catch (parseError) {
        console.error('Failed to parse complete scenario response:', response, parseError)
        scenarios = getFallbackCompleteScenarios(productName)
      }

      return NextResponse.json({
        success: true,
        scenarios,
        multiScene: true,
        generateCompleteSettings: true,
      })
    }

    // 멀티 씬 모드 (설정 별도)
    if (multiScene) {
      // 멀티 씬 프롬프트 생성
      const prompt = buildMultiSceneScenarioPrompt(
        productName,
        productDescription,
        productSellingPoints,
        avatarDescription || getDefaultAvatarDescription(avatarType),
        avatarType,
        sceneCount,
        totalDuration
      )

      // Gemini API 호출
      const response = await generateText(prompt)

      // JSON 파싱
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No JSON found in response')
        }
        const parsed = JSON.parse(jsonMatch[0])
        scenarios = normalizeMultiSceneScenarios(parsed.scenarios, sceneCount)
      } catch (parseError) {
        console.error('Failed to parse multi-scene response:', response, parseError)
        scenarios = getFallbackMultiSceneScenarios(productName, sceneCount, totalDuration)
      }
    } else {
      // 기존 단일 씬 프롬프트 생성
      const prompt = buildScenarioGenerationPrompt(
        productName,
        productDescription,
        productSellingPoints,
        avatarDescription || getDefaultAvatarDescription(avatarType),
        avatarType
      )

      // Gemini API 호출
      const response = await generateText(prompt)

      // JSON 파싱
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No JSON found in response')
        }
        const parsed = JSON.parse(jsonMatch[0])
        scenarios = normalizeSingleSceneScenarios(parsed.scenarios)
      } catch (parseError) {
        console.error('Failed to parse scenario response:', response, parseError)
        scenarios = getFallbackScenarios(productName)
      }
    }

    return NextResponse.json({
      success: true,
      scenarios,
      multiScene,
    })
  } catch (error) {
    console.error('시나리오 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scenarios' },
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

// 단일 씬 시나리오 정규화
function normalizeSingleSceneScenarios(rawScenarios: unknown[]): Scenario[] {
  return rawScenarios.map((s: unknown, i: number) => {
    const scenario = s as Record<string, unknown>
    return {
      id: (scenario.id as string) || String(i + 1),
      title: (scenario.title as string) || `시나리오 ${i + 1}`,
      description: (scenario.description as string) || '',
      concept: (scenario.concept as string) || '',
      productAppearance: (scenario.productAppearance as string) || '제품이 자연스럽게 등장',
      firstFramePrompt: (scenario.firstFramePrompt as string) || (scenario.startFrame as string) || '',
      motionPromptEN: (scenario.motionPromptEN as string) || '',
      mood: (scenario.mood as string) || '',
      location: (scenario.location as string) || (scenario.background as string) || '',
      tags: (scenario.tags as string[]) || [],
    }
  })
}

// 멀티 씬 시나리오 정규화
function normalizeMultiSceneScenarios(rawScenarios: unknown[], expectedSceneCount: number): Scenario[] {
  return rawScenarios.map((s: unknown, i: number) => {
    const scenario = s as Record<string, unknown>
    const rawScenes = (scenario.scenes as unknown[]) || []

    const scenes: SceneInfo[] = rawScenes.map((sc: unknown, j: number) => {
      const scene = sc as Record<string, unknown>
      return {
        sceneIndex: (scene.sceneIndex as number) ?? j,
        title: (scene.title as string) || `씬 ${j + 1}`,
        description: (scene.description as string) || '',
        firstFramePrompt: (scene.firstFramePrompt as string) || '',
        motionPromptEN: (scene.motionPromptEN as string) || '',
        duration: (scene.duration as number) || 5,
        movementAmplitude: (scene.movementAmplitude as SceneInfo['movementAmplitude']) || 'auto',
        location: (scene.location as string) || '',
        mood: (scene.mood as string) || '',
      }
    })

    // 씬 개수가 부족하면 채우기
    while (scenes.length < expectedSceneCount) {
      const idx = scenes.length
      scenes.push({
        sceneIndex: idx,
        title: `씬 ${idx + 1}`,
        description: '추가 씬',
        firstFramePrompt: '모델이 자연스럽게 제품을 들고 카메라를 바라보며 미소짓는 장면',
        motionPromptEN: 'The model smoothly presents the product while maintaining a warm natural smile.',
        duration: 5,
        movementAmplitude: 'auto',
        location: '',
        mood: '자연스러운',
      })
    }

    // 총 길이 계산
    const totalDuration = scenes.reduce((sum, sc) => sum + sc.duration, 0)

    return {
      id: (scenario.id as string) || String(i + 1),
      title: (scenario.title as string) || `시나리오 ${i + 1}`,
      description: (scenario.description as string) || '',
      concept: (scenario.concept as string) || '',
      productAppearance: (scenario.productAppearance as string) || '제품이 자연스럽게 등장',
      mood: (scenario.mood as string) || '',
      tags: (scenario.tags as string[]) || [],
      scenes,
      totalDuration,
    }
  })
}

// 단일 씬 Fallback 시나리오
function getFallbackScenarios(productName: string): Scenario[] {
  const product = productName || '제품'
  const productEN = productName || 'the product'

  return [
    {
      id: '1',
      title: '아침의 시작',
      description: '활기찬 아침, 제품과 함께 하루를 시작하는 순간',
      concept: '밝은 아침 햇살 속에서 하루를 준비하며 제품을 자연스럽게 사용하는 모습.',
      productAppearance: '모델이 한 손에 제품을 들고 창가에서 자연광을 받으며 사용하려는 순간',
      firstFramePrompt: `밝은 아침 햇살이 들어오는 창가에 서서 ${product}을(를) 한 손에 들고 있음. 상쾌한 미소를 지으며 카메라를 바라보고, 자연광이 얼굴과 제품을 부드럽게 비춤.`,
      motionPromptEN: `Person stands by bright window holding ${productEN}, slowly raises product toward face while expression brightens. Ending: Product held up proudly with genuine bright smile.`,
      mood: '상쾌하고 활기찬',
      location: '밝은 아침 햇살이 드는 침실 창가',
      tags: ['아침', '일상', '상쾌함'],
    },
    {
      id: '2',
      title: '편안한 휴식',
      description: '여유로운 오후, 소파에서 제품을 즐기는 순간',
      concept: '바쁜 일상 속 잠깐의 휴식 시간에 제품과 함께하는 편안한 모먼트.',
      productAppearance: '소파에 편하게 앉아 제품을 무릎 위에 두고 천천히 살펴보는 모습',
      firstFramePrompt: `따뜻한 오후 햇살이 들어오는 거실 소파에 편안하게 앉아 ${product}을(를) 무릎 위에 두고 양손으로 감싸 쥐고 있음.`,
      motionPromptEN: `Person sits comfortably on couch, holding ${productEN} on lap. Slowly lifts product to examine closely with pleasant satisfaction. Ending: Holds product at chest level with warm contented smile.`,
      mood: '따뜻하고 편안한',
      location: '오후 햇살이 드는 아늑한 거실 소파',
      tags: ['휴식', '편안함', '오후'],
    },
    {
      id: '3',
      title: '세련된 일상',
      description: '도시적인 카페에서 제품을 꺼내는 스타일리시한 순간',
      concept: '트렌디한 카페에서 제품을 자연스럽게 꺼내 사용하는 세련된 라이프스타일.',
      productAppearance: '카페 테이블 위에 제품을 올려두고 손을 뻗어 집으려는 순간',
      firstFramePrompt: `세련된 카페의 창가 자리에 앉아 원목 테이블 위에 놓인 ${product}을(를) 향해 한 손을 뻗고 있음.`,
      motionPromptEN: `Person sits at stylish cafe, reaching toward ${productEN} on table. Smoothly picks up product with confident expression. Ending: Holds product gracefully with poised confident smile.`,
      mood: '세련되고 도시적인',
      location: '트렌디한 감성 카페 창가 자리',
      tags: ['카페', '세련됨', '라이프스타일'],
    },
  ]
}

// 멀티 씬 Fallback 시나리오
function getFallbackMultiSceneScenarios(
  productName: string,
  sceneCount: number,
  totalDuration: number
): Scenario[] {
  const product = productName || '제품'
  const productEN = productName || 'the product'
  const durationPerScene = Math.floor(totalDuration / sceneCount)

  const createScenes = (titles: string[], descriptions: string[], frames: string[], motions: string[], locations: string[], moods: string[]): SceneInfo[] => {
    return Array.from({ length: sceneCount }, (_, i) => ({
      sceneIndex: i,
      title: titles[i] || `씬 ${i + 1}`,
      description: descriptions[i] || '',
      firstFramePrompt: frames[i] || '',
      motionPromptEN: motions[i] || '',
      duration: durationPerScene,
      movementAmplitude: 'auto' as const,
      location: locations[i] || '',
      mood: moods[i] || '',
    }))
  }

  return [
    {
      id: '1',
      title: '아침 루틴',
      description: '아침에 제품을 사용하는 일상 루틴',
      concept: '밝은 아침 햇살과 함께 시작하는 하루, 제품이 일상의 일부가 되는 순간',
      productAppearance: '자연스러운 아침 루틴 속에서 제품을 사용하는 모습',
      mood: '상쾌하고 활기찬',
      tags: ['아침', '루틴', '일상'],
      totalDuration,
      scenes: createScenes(
        ['기상 순간', '제품 발견', '사용 완료'],
        ['상쾌하게 일어나는 순간', `${product} 집어드는 순간`, '만족스러운 마무리'],
        [
          '밝은 아침 햇살이 들어오는 방에서 스트레칭하며 일어나는 모습, 상쾌한 표정',
          `${product}을(를) 손에 들고 기대감 있는 표정으로 바라보는 모습`,
          `${product}을(를) 카메라를 향해 들어올리며 환하게 미소짓는 모습`,
        ],
        [
          'Person stretches arms up with refreshed expression, turns toward the product direction.',
          `Reaches for ${productEN}, picks it up with anticipation, examines it closely.`,
          `Lifts ${productEN} toward camera with a bright satisfied smile, radiating morning energy.`,
        ],
        ['밝은 침실', '침실 창가', '밝은 침실'],
        ['상쾌한', '기대감', '만족스러운']
      ),
    },
    {
      id: '2',
      title: '휴식 시간',
      description: '편안한 공간에서 제품과 함께하는 휴식',
      concept: '바쁜 일상 속 나만의 휴식, 제품이 주는 편안함',
      productAppearance: '소파에서 편안하게 제품을 즐기는 모습',
      mood: '편안하고 따뜻한',
      tags: ['휴식', '편안함', '힐링'],
      totalDuration,
      scenes: createScenes(
        ['휴식 시작', '제품 사용', '만족의 순간'],
        ['소파에 앉는 순간', `${product} 사용하는 순간`, '편안한 미소'],
        [
          '아늑한 거실 소파에 편안하게 앉으며 긴 한숨을 쉬는 모습, 편안한 표정',
          `${product}을(를) 양손으로 감싸 쥐고 천천히 살펴보는 모습`,
          `${product}을(를) 가슴 앞에 들고 카메라를 향해 따뜻한 미소를 짓는 모습`,
        ],
        [
          'Person settles comfortably on couch, exhales relaxedly, shoulders dropping with relief.',
          `Holds ${productEN} with both hands, examines it gently, expression softens with contentment.`,
          `Cradles ${productEN} near chest, turns to camera with warm peaceful smile, fully relaxed.`,
        ],
        ['아늑한 거실', '거실 소파', '거실'],
        ['편안한', '차분한', '따뜻한']
      ),
    },
    {
      id: '3',
      title: '세련된 카페',
      description: '트렌디한 카페에서 제품을 즐기는 순간',
      concept: '도시적인 감성의 카페에서 보여주는 세련된 라이프스타일',
      productAppearance: '스타일리시하게 제품을 사용하는 모습',
      mood: '세련되고 도시적인',
      tags: ['카페', '세련됨', '라이프스타일'],
      totalDuration,
      scenes: createScenes(
        ['카페 도착', '제품 등장', '스타일리시한 마무리'],
        ['카페에 앉는 순간', `${product} 꺼내는 순간`, '자신감 있는 포즈'],
        [
          '세련된 카페 창가에 앉아 여유롭게 주변을 둘러보는 모습, 자신감 있는 표정',
          `가방에서 ${product}을(를) 꺼내 테이블 위에 올려두는 모습`,
          `${product}을(를) 한 손에 들고 카메라를 향해 자신감 있는 미소를 짓는 모습`,
        ],
        [
          'Person sits at stylish cafe window, glances around confidently, settles in with poise.',
          `Reaches into bag, pulls out ${productEN}, places it elegantly on table, admires it.`,
          `Picks up ${productEN} with one hand, poses confidently toward camera with sophisticated smile.`,
        ],
        ['세련된 카페', '카페 테이블', '카페 창가'],
        ['세련된', '우아한', '자신감']
      ),
    },
  ]
}

// 완전 시나리오 정규화 (설정 포함)
function normalizeCompleteScenarios(rawScenarios: unknown[]): Scenario[] {
  return rawScenarios.map((s: unknown, i: number) => {
    const scenario = s as Record<string, unknown>
    const rawScenes = (scenario.scenes as unknown[]) || []
    const rawSettings = (scenario.recommendedSettings as Record<string, unknown>) || {}

    // 씬 정규화
    const scenes: SceneInfo[] = rawScenes.map((sc: unknown, j: number) => {
      const scene = sc as Record<string, unknown>
      return {
        sceneIndex: (scene.sceneIndex as number) ?? j,
        title: (scene.title as string) || `씬 ${j + 1}`,
        description: (scene.description as string) || '',
        firstFramePrompt: (scene.firstFramePrompt as string) || '',
        motionPromptEN: (scene.motionPromptEN as string) || '',
        duration: (scene.duration as number) || (rawSettings.sceneDurations as number[])?.[j] || 5,
        movementAmplitude: (scene.movementAmplitude as SceneInfo['movementAmplitude']) ||
          (rawSettings.movementAmplitudes as string[])?.[j] as SceneInfo['movementAmplitude'] || 'auto',
        location: (scene.location as string) || '',
        mood: (scene.mood as string) || '',
      }
    })

    // 추천 설정 정규화
    const sceneCount = scenes.length || 3
    const recommendedSettings: RecommendedSettings = {
      aspectRatio: (rawSettings.aspectRatio as RecommendedSettings['aspectRatio']) || '9:16',
      sceneCount,
      sceneDurations: (rawSettings.sceneDurations as number[]) || scenes.map(s => s.duration),
      movementAmplitudes: (rawSettings.movementAmplitudes as RecommendedSettings['movementAmplitudes']) ||
        scenes.map(s => s.movementAmplitude),
    }

    // sceneDurations와 movementAmplitudes 길이 맞추기
    while (recommendedSettings.sceneDurations.length < sceneCount) {
      recommendedSettings.sceneDurations.push(5)
    }
    while (recommendedSettings.movementAmplitudes.length < sceneCount) {
      recommendedSettings.movementAmplitudes.push('auto')
    }

    // 총 길이 계산
    const totalDuration = scenes.reduce((sum, sc) => sum + sc.duration, 0)

    return {
      id: (scenario.id as string) || String(i + 1),
      title: (scenario.title as string) || `시나리오 ${i + 1}`,
      description: (scenario.description as string) || '',
      concept: (scenario.concept as string) || '',
      productAppearance: (scenario.productAppearance as string) || '제품이 자연스럽게 등장',
      mood: (scenario.mood as string) || '',
      location: (scenario.location as string) || '',
      tags: (scenario.tags as string[]) || [],
      scenes,
      totalDuration,
      recommendedSettings,
    }
  })
}

// 완전 시나리오 Fallback (설정 포함)
function getFallbackCompleteScenarios(productName: string): Scenario[] {
  const product = productName || '제품'
  const productEN = productName || 'the product'

  return [
    {
      id: '1',
      title: '아침 루틴',
      description: '상쾌한 아침, 제품과 시작하는 하루',
      concept: '밝은 아침 햇살이 들어오는 방에서 기상 후 제품을 사용하며 하루를 시작하는 자연스러운 모닝 루틴.',
      productAppearance: '침대에서 일어나 제품을 집어들고 사용하는 순간',
      mood: '상쾌하고 활기찬',
      location: '밝은 침실',
      tags: ['아침', '루틴', '상쾌함'],
      totalDuration: 15,
      recommendedSettings: {
        aspectRatio: '9:16',
        sceneCount: 3,
        sceneDurations: [4, 5, 6],
        movementAmplitudes: ['small', 'medium', 'small'],
      },
      scenes: [
        {
          sceneIndex: 0,
          title: '기상',
          description: '상쾌하게 일어남',
          firstFramePrompt: '밝은 아침 햇살이 창문으로 들어오는 깨끗한 침실에서, 모델이 이불 속에서 막 눈을 뜨며 기지개를 펴려는 순간. 부드러운 자연광이 얼굴을 비추고, 평화로운 표정.',
          motionPromptEN: `Person slowly wakes up, stretches arms above head with a peaceful expression. Eyes gradually open, looks toward window with gentle smile. Natural morning movements, relaxed and unhurried.`,
          duration: 4,
          movementAmplitude: 'small',
          location: '밝은 침실',
          mood: '평화로운',
        },
        {
          sceneIndex: 1,
          title: '제품 발견',
          description: `${product} 집어들기`,
          firstFramePrompt: `침대 옆 협탁 위에 놓인 ${product}을(를) 향해 손을 뻗는 모델. 기대감 어린 표정으로 제품을 바라보며, 아침 햇살이 제품과 손을 비춤.`,
          motionPromptEN: `Person reaches toward ${productEN} on bedside table. Picks it up gently, brings it closer to examine with anticipation. Expression brightens as they hold the product. Smooth deliberate movements.`,
          duration: 5,
          movementAmplitude: 'medium',
          location: '침실 침대 옆',
          mood: '기대감',
        },
        {
          sceneIndex: 2,
          title: '만족',
          description: '환한 미소로 마무리',
          firstFramePrompt: `${product}을(를) 양손으로 부드럽게 쥐고 가슴 앞에 들고 있는 모델. 밝은 미소를 지으며 카메라를 바라봄. 자연광이 얼굴과 제품을 따뜻하게 비춤.`,
          motionPromptEN: `Person holds ${productEN} at chest level with both hands. Slowly turns to camera with bright satisfied smile. Slight head tilt, warm genuine expression. Presents product naturally toward camera.`,
          duration: 6,
          movementAmplitude: 'small',
          location: '밝은 침실',
          mood: '만족스러운',
        },
      ],
    },
    {
      id: '2',
      title: '휴식 시간',
      description: '편안한 오후, 나만의 힐링 타임',
      concept: '아늑한 거실 소파에서 여유로운 오후 시간을 보내며 제품과 함께 휴식하는 편안한 순간.',
      productAppearance: '소파에 앉아 제품을 사용하며 휴식',
      mood: '편안하고 따뜻한',
      location: '아늑한 거실',
      tags: ['휴식', '힐링', '편안함'],
      totalDuration: 12,
      recommendedSettings: {
        aspectRatio: '1:1',
        sceneCount: 2,
        sceneDurations: [5, 7],
        movementAmplitudes: ['medium', 'small'],
      },
      scenes: [
        {
          sceneIndex: 0,
          title: '휴식 시작',
          description: '소파에 앉음',
          firstFramePrompt: `따뜻한 오후 햇살이 들어오는 거실, 부드러운 소파에 편안하게 앉으려는 모델. ${product}이(가) 테이블 위에 놓여있고, 편안한 캐주얼 복장, 여유로운 표정.`,
          motionPromptEN: `Person settles comfortably onto soft couch, exhales with relaxation. Shoulders drop, body relaxes into cushions. Reaches toward ${productEN} on coffee table. Natural settling movements.`,
          duration: 5,
          movementAmplitude: 'medium',
          location: '거실 소파',
          mood: '편안한',
        },
        {
          sceneIndex: 1,
          title: '만족의 순간',
          description: '제품과 함께 휴식',
          firstFramePrompt: `소파에 편안하게 앉아 ${product}을(를) 양손으로 감싸 쥔 모델. 눈을 살짝 감으며 만족스러운 표정. 부드러운 조명이 전체 장면을 따뜻하게 감쌈.`,
          motionPromptEN: `Person holds ${productEN} with both hands, eyes close briefly in contentment. Opens eyes with warm smile, gently caresses product. Peaceful satisfied expression, completely relaxed posture.`,
          duration: 7,
          movementAmplitude: 'small',
          location: '거실 소파',
          mood: '만족스러운',
        },
      ],
    },
    {
      id: '3',
      title: '도시의 순간',
      description: '세련된 카페에서의 스타일리시한 일상',
      concept: '트렌디한 도심 카페에서 여유롭게 시간을 보내며 제품을 자연스럽게 사용하는 세련된 라이프스타일.',
      productAppearance: '카페 테이블에서 제품을 꺼내 사용하는 모습',
      mood: '세련되고 도시적인',
      location: '트렌디한 카페',
      tags: ['카페', '라이프스타일', '세련됨'],
      totalDuration: 18,
      recommendedSettings: {
        aspectRatio: '16:9',
        sceneCount: 4,
        sceneDurations: [3, 5, 5, 5],
        movementAmplitudes: ['small', 'medium', 'small', 'small'],
      },
      scenes: [
        {
          sceneIndex: 0,
          title: '카페 도착',
          description: '창가 자리에 앉음',
          firstFramePrompt: '세련된 인테리어의 카페 창가 자리, 모델이 의자에 앉으며 주변을 둘러보는 순간. 자연광이 들어오고, 자신감 있는 표정.',
          motionPromptEN: 'Person settles into cafe window seat, glances around appreciating the atmosphere. Confident poised expression, adjusts posture elegantly. Quick establishing movement.',
          duration: 3,
          movementAmplitude: 'small',
          location: '카페 창가',
          mood: '여유로운',
        },
        {
          sceneIndex: 1,
          title: '제품 등장',
          description: `${product} 꺼내기`,
          firstFramePrompt: `카페 테이블 위에 가방이 놓여있고, 모델이 가방에서 ${product}을(를) 꺼내려 손을 뻗는 순간. 기대감 있는 표정.`,
          motionPromptEN: `Person reaches into bag on table, pulls out ${productEN} with smooth motion. Places it on table, admires it with pleased expression. Deliberate stylish movements.`,
          duration: 5,
          movementAmplitude: 'medium',
          location: '카페 테이블',
          mood: '기대감',
        },
        {
          sceneIndex: 2,
          title: '사용 순간',
          description: '제품 살펴보기',
          firstFramePrompt: `${product}을(를) 양손으로 들고 자세히 살펴보는 모델. 만족스러운 미소, 카페의 세련된 배경이 보임.`,
          motionPromptEN: `Person examines ${productEN} closely, turning it gently in hands. Expression shows satisfaction and appreciation. Elegant careful movements, sophisticated demeanor.`,
          duration: 5,
          movementAmplitude: 'small',
          location: '카페',
          mood: '만족스러운',
        },
        {
          sceneIndex: 3,
          title: '마무리',
          description: '자신감 있는 포즈',
          firstFramePrompt: `${product}을(를) 한 손에 들고 카메라를 향해 자신감 있게 미소짓는 모델. 카페 창문으로 들어오는 자연광이 얼굴을 비춤.`,
          motionPromptEN: `Person holds ${productEN} in one hand, turns confidently to camera. Bright sophisticated smile, slight head tilt. Presents product with natural elegance, poised final pose.`,
          duration: 5,
          movementAmplitude: 'small',
          location: '카페 창가',
          mood: '자신감',
        },
      ],
    },
  ]
}
