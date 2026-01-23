/**
 * 배치 프레임 프롬프트 생성 API
 *
 * POST: 모든 씬의 프레임 프롬프트를 일괄 생성
 * - Gemini 1회 호출로 모든 씬 프롬프트 생성
 * - 씬 간 톤앤매너 일관성 유지
 * - 매우 구체적인 프롬프트로 현실성 확보
 */

import { generateText } from '@/lib/gemini/client'
import {
  AVATAR_MOTION_NEGATIVE_PROMPT,
  BatchFramePromptParams,
  BatchFramePromptResponse,
  buildBatchFramePrompt,
} from '@/lib/prompts/avatar-motion'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface GenerateBatchPromptsRequest {
  // 시나리오 정보
  scenarioTitle: string
  scenarioConcept: string
  scenarioMood: string
  scenarioVisualStyle?: string
  productAppearance?: string    // deprecated - use productRole
  productRole?: string          // 제품의 스토리 역할
  // 새로운 스토리 비트 필드
  storyType?: string            // discovery, problem-solution, ritual, transformation, surprise
  emotionalArc?: string         // 감정 변화 (예: "피곤함→상쾌함")
  storyBeats?: {
    setup?: string              // 시작 상황
    middle?: string             // 중간 전개
    payoff?: string             // 마무리
  }
  // 제품 정보
  productName: string
  productDescription?: string
  // 아바타 정보
  avatarDescription?: string
  // 영상 설정
  aspectRatio: '9:16' | '16:9' | '1:1'
  sceneCount: number
  sceneDurations: number[]
  movementAmplitudes: ('auto' | 'small' | 'medium' | 'large')[]
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

    const body: GenerateBatchPromptsRequest = await request.json()
    const {
      scenarioTitle,
      scenarioConcept,
      scenarioMood,
      scenarioVisualStyle,
      productAppearance,
      productRole,
      storyType,
      emotionalArc,
      storyBeats,
      productName,
      productDescription,
      avatarDescription,
      aspectRatio,
      sceneCount,
      sceneDurations,
      movementAmplitudes,
    } = body

    // 필수 파라미터 검증
    if (!scenarioTitle || !scenarioConcept || !productName) {
      return NextResponse.json(
        { error: 'Missing required parameters: scenarioTitle, scenarioConcept, productName' },
        { status: 400 }
      )
    }

    if (sceneCount < 2 || sceneCount > 10) {
      return NextResponse.json(
        { error: 'Scene count must be between 2 and 10' },
        { status: 400 }
      )
    }

    // 배치 프롬프트 생성 파라미터
    const params: BatchFramePromptParams = {
      scenarioTitle,
      scenarioConcept,
      scenarioMood: scenarioMood || '자연스럽고 친근한',
      scenarioVisualStyle: scenarioVisualStyle || '자연스러운 UGC 스타일',
      productAppearance: productAppearance,
      productRole: productRole || productAppearance,
      productName,
      productDescription: productDescription || '',
      avatarDescription: avatarDescription || 'AI가 생성한 친근한 인플루언서',
      aspectRatio,
      sceneCount,
      sceneDurations: sceneDurations.length === sceneCount ? sceneDurations : Array(sceneCount).fill(5),
      movementAmplitudes: movementAmplitudes.length === sceneCount ? movementAmplitudes : Array(sceneCount).fill('auto'),
      // 새로운 스토리 비트 필드
      storyType,
      emotionalArc,
      storyBeats,
    }

    // Gemini 프롬프트 빌드
    const prompt = buildBatchFramePrompt(params)

    // Gemini API 호출 (1회로 모든 씬 프롬프트 생성)
    console.log('배치 프레임 프롬프트 생성 시작...')
    const response = await generateText(prompt)

    // JSON 파싱
    let batchResponse: BatchFramePromptResponse
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const parsed = JSON.parse(jsonMatch[0])
      batchResponse = normalizeBatchResponse(parsed, sceneCount, sceneDurations)
    } catch (parseError) {
      console.error('Failed to parse batch prompt response:', response, parseError)
      // Fallback: 기본 프롬프트 생성
      batchResponse = generateFallbackPrompts(params)
    }

    console.log(`배치 프롬프트 생성 완료: ${batchResponse.scenePrompts.length}개 씬`)

    return NextResponse.json({
      success: true,
      ...batchResponse,
    })
  } catch (error) {
    console.error('배치 프롬프트 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate batch prompts' },
      { status: 500 }
    )
  }
}

/**
 * 응답 정규화
 */
function normalizeBatchResponse(
  raw: Record<string, unknown>,
  sceneCount: number,
  sceneDurations: number[]
): BatchFramePromptResponse {
  const visualConsistency = raw.visualConsistency as Record<string, string> || {}
  const rawPrompts = (raw.scenePrompts as unknown[]) || []

  const scenePrompts = rawPrompts.slice(0, sceneCount).map((p: unknown, i: number) => {
    const prompt = p as Record<string, unknown>
    const role = i === 0 ? 'opening' : i === sceneCount - 1 ? 'closing' : 'development'

    return {
      sceneIndex: i,
      role: (prompt.role as 'opening' | 'development' | 'closing') || role,
      duration: sceneDurations[i] || 5,
      connectionFromPrevious: (prompt.connectionFromPrevious as string) || getDefaultConnection(i),
      narrativeContext: (prompt.narrativeContext as string) || getDefaultNarrativeContext(i, sceneCount),
      prompt: (prompt.prompt as string) || '',
      motionPromptEN: (prompt.motionPromptEN as string) || getDefaultMotionPrompt(i, sceneCount),
      negativePrompt: (prompt.negativePrompt as string) || AVATAR_MOTION_NEGATIVE_PROMPT,
    }
  })

  // 부족한 씬 채우기
  while (scenePrompts.length < sceneCount) {
    const i = scenePrompts.length
    const role = i === 0 ? 'opening' : i === sceneCount - 1 ? 'closing' : 'development'
    scenePrompts.push({
      sceneIndex: i,
      role,
      duration: sceneDurations[i] || 5,
      connectionFromPrevious: getDefaultConnection(i),
      narrativeContext: getDefaultNarrativeContext(i, sceneCount),
      prompt: '',
      motionPromptEN: getDefaultMotionPrompt(i, sceneCount),
      negativePrompt: AVATAR_MOTION_NEGATIVE_PROMPT,
    })
  }

  return {
    visualConsistency: {
      outfit: visualConsistency.outfit || 'white casual t-shirt, light blue jeans',
      lighting: visualConsistency.lighting || 'soft natural light from left',
      colorGrading: visualConsistency.colorGrading || 'warm, natural tones',
      cameraStyle: visualConsistency.cameraStyle || 'shot on 85mm lens at f/2.8',
    },
    scenePrompts,
  }
}

/**
 * 기본 씬 연결 설명
 */
function getDefaultConnection(sceneIndex: number): string {
  if (sceneIndex === 0) {
    return '첫 장면'
  } else if (sceneIndex === 1) {
    return '오프닝에서 자연스럽게 이어지는 동작'
  } else {
    return `씬 ${sceneIndex}에서 이어지는 연속 동작`
  }
}

/**
 * 기본 내러티브 컨텍스트
 */
function getDefaultNarrativeContext(sceneIndex: number, sceneCount: number): string {
  if (sceneIndex === 0) {
    return '영상의 시작, 시청자의 시선을 끄는 인상적인 오프닝'
  } else if (sceneIndex === sceneCount - 1) {
    return '이전 씬에서 이어져 영상의 마무리, 제품을 강조하며 만족스러운 클로징'
  } else {
    return `이전 씬에서 자연스럽게 이어지는 ${sceneIndex + 1}번째 장면, 제품과 상호작용 발전`
  }
}

/**
 * 기본 모션 프롬프트 (영어) - 씬 간 연결성 강조
 */
function getDefaultMotionPrompt(sceneIndex: number, sceneCount: number): string {
  if (sceneIndex === 0) {
    return 'Starting from a calm and relaxed standing pose, the person slowly turns toward the camera with a warm, welcoming smile forming. Shoulders relax naturally as the head tilts slightly. Right hand begins to rise smoothly toward the product. Eyes brighten with genuine interest, creating an inviting opening moment.'
  } else if (sceneIndex === 1) {
    return 'Continuing the rising hand motion from the previous scene, fingers naturally wrap around the product. Lifting it smoothly while expression shifts to curious interest. Eyes focus on the product as head tilts slightly. The movement flows seamlessly from the opening.'
  } else if (sceneIndex === sceneCount - 1) {
    return 'Transitioning from examining the product, the person confidently presents it at chest level toward the camera. Expression shifts to satisfied pride with a subtle nod of approval. Eyes warmly connect between product and camera. The closing feels like a natural conclusion to the story.'
  } else {
    return 'Continuing seamlessly from the previous scene, the person interacts with the product in a genuine manner. Smooth hand movements explore the product naturally. Expression evolves from curiosity to pleasant appreciation. Maintains the same posture while subtly shifting weight.'
  }
}

/**
 * Fallback 프롬프트 생성
 */
function generateFallbackPrompts(params: BatchFramePromptParams): BatchFramePromptResponse {
  const scenePrompts = []

  for (let i = 0; i < params.sceneCount; i++) {
    const isFirst = i === 0
    const isLast = i === params.sceneCount - 1
    const role = isFirst ? 'opening' : isLast ? 'closing' : 'development'

    let poseDescription = ''
    let expressionDescription = ''

    if (isFirst) {
      poseDescription = 'standing relaxed with weight on left leg, right knee slightly bent, both arms at sides with hands gently resting on thighs'
      expressionDescription = 'warm genuine smile with lips slightly parted, bright eyes looking directly at camera with slight eyebrow raise showing pleasant curiosity'
    } else if (isLast) {
      poseDescription = 'standing confident with shoulders back, right arm bent holding product at chest level with label facing camera, left hand gently touching the product'
      expressionDescription = 'satisfied closed-mouth smile with eyes gently squinted showing contentment, gaze directed at product in hands'
    } else {
      poseDescription = 'standing naturally with weight centered, right arm extended holding product at waist level, left arm relaxed at side'
      expressionDescription = 'soft natural smile with relaxed eyebrows, eyes looking at product with engaged interest'
    }

    const prompt = `The same person from Figure 1, wearing the same outfit as in Figure 1. ${poseDescription}. Face showing ${expressionDescription}. Holding the product from Figure 2 at chest level. Set in a ${params.scenarioMood} environment with soft natural lighting from the left creating gentle shadows. Background is clean and minimal with subtle depth. Shot on 85mm portrait lens at f/8.0, crystal sharp background, medium shot from waist up, camera at eye level. Hyperrealistic photograph, 8K RAW quality, natural skin texture with visible pores.`

    scenePrompts.push({
      sceneIndex: i,
      role: role as 'opening' | 'development' | 'closing',
      duration: params.sceneDurations[i] || 5,
      connectionFromPrevious: getDefaultConnection(i),
      narrativeContext: getDefaultNarrativeContext(i, params.sceneCount),
      prompt,
      motionPromptEN: getDefaultMotionPrompt(i, params.sceneCount),
      negativePrompt: AVATAR_MOTION_NEGATIVE_PROMPT,
    })
  }

  return {
    visualConsistency: {
      outfit: 'casual comfortable clothing appropriate for the mood',
      lighting: 'soft natural light from left side',
      colorGrading: 'warm, natural tones',
      cameraStyle: 'shot on 85mm lens at f/2.8, medium shot',
    },
    scenePrompts,
  }
}
