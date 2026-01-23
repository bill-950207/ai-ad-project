/**
 * 시나리오 개선 API
 *
 * POST: 사용자 피드백을 기반으로 기존 시나리오를 개선
 * - 원본 시나리오와 사용자의 개선 요청을 받아서
 * - LLM이 피드백을 반영한 개선된 시나리오를 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import { buildScenarioImprovementPrompt } from '@/lib/prompts/avatar-motion'

// 씬 상세 정보 타입
interface SceneDetail {
  sceneIndex: number
  title: string
  role: 'opening' | 'development' | 'closing'
  narrativeContext: string
  duration: number
  movementAmplitude: string
  firstFramePrompt: string
  motionPromptEN: string
}

// 시나리오 타입
interface Scenario {
  id: string
  title: string
  description: string
  concept: string
  productAppearance?: string
  productRole?: string
  mood: string
  visualStyle?: string
  tags: string[]
  storyType?: string
  emotionalArc?: string
  storyBeats?: {
    setup?: string
    middle?: string
    payoff?: string
  }
  aspectRatio?: string
  sceneCount?: number
  visualConsistency?: {
    outfit: string
    lighting: string
    colorGrading: string
    cameraStyle: string
  }
  scenes?: SceneDetail[]
}

interface ImproveScenarioRequest {
  scenario: Scenario
  feedback: string
  productName: string
  productDescription?: string
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

    const body: ImproveScenarioRequest = await request.json()
    const {
      scenario,
      feedback,
      productName,
      productDescription = '',
    } = body

    if (!scenario || !feedback) {
      return NextResponse.json(
        { error: 'Scenario and feedback are required' },
        { status: 400 }
      )
    }

    console.log('시나리오 개선 요청:', {
      scenarioId: scenario.id,
      feedback: feedback.substring(0, 100) + '...',
    })

    // 시나리오 개선 프롬프트 생성
    const prompt = buildScenarioImprovementPrompt(
      JSON.stringify(scenario, null, 2),
      feedback,
      productName,
      productDescription
    )

    // Gemini API 호출
    const response = await generateText(prompt)

    // JSON 파싱
    let improvedScenario: Scenario
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const parsed = JSON.parse(jsonMatch[0])
      improvedScenario = normalizeImprovedScenario(parsed, scenario.id)
    } catch (parseError) {
      console.error('Failed to parse improvement response:', response, parseError)
      return NextResponse.json(
        { error: 'Failed to parse improved scenario' },
        { status: 500 }
      )
    }

    console.log('시나리오 개선 완료:', improvedScenario.title)

    return NextResponse.json({
      success: true,
      scenario: improvedScenario,
    })
  } catch (error) {
    console.error('시나리오 개선 오류:', error)
    return NextResponse.json(
      { error: 'Failed to improve scenario' },
      { status: 500 }
    )
  }
}

// 개선된 시나리오 정규화
function normalizeImprovedScenario(raw: Record<string, unknown>, originalId: string): Scenario {
  const storyBeats = raw.storyBeats as Record<string, string> | undefined
  const visualConsistency = raw.visualConsistency as Record<string, string> | undefined
  const rawScenes = raw.scenes as unknown[] | undefined

  // 씬 정규화
  const scenes: SceneDetail[] = rawScenes?.map((scene: unknown, j: number) => {
    const s = scene as Record<string, unknown>
    return {
      sceneIndex: (s.sceneIndex as number) ?? j,
      title: (s.title as string) || `씬 ${j + 1}`,
      role: (s.role as 'opening' | 'development' | 'closing') || (j === 0 ? 'opening' : j === rawScenes.length - 1 ? 'closing' : 'development'),
      narrativeContext: (s.narrativeContext as string) || '',
      duration: (s.duration as number) || 4,
      movementAmplitude: (s.movementAmplitude as string) || 'auto',
      firstFramePrompt: (s.firstFramePrompt as string) || '',
      motionPromptEN: (s.motionPromptEN as string) || '',
    }
  }) || []

  return {
    id: originalId,  // 원본 ID 유지
    title: (raw.title as string) || '개선된 시나리오',
    description: (raw.description as string) || '',
    concept: (raw.concept as string) || '',
    productAppearance: (raw.productAppearance as string),
    productRole: (raw.productRole as string),
    mood: (raw.mood as string) || '',
    visualStyle: (raw.visualStyle as string) || '',
    tags: (raw.tags as string[]) || [],
    storyType: (raw.storyType as string),
    emotionalArc: (raw.emotionalArc as string),
    storyBeats: storyBeats ? {
      setup: storyBeats.setup || '',
      middle: storyBeats.middle || '',
      payoff: storyBeats.payoff || '',
    } : undefined,
    aspectRatio: (raw.aspectRatio as string) || '9:16',
    sceneCount: scenes.length || (raw.sceneCount as number) || 3,
    visualConsistency: visualConsistency ? {
      outfit: visualConsistency.outfit || '',
      lighting: visualConsistency.lighting || '',
      colorGrading: visualConsistency.colorGrading || '',
      cameraStyle: visualConsistency.cameraStyle || '',
    } : undefined,
    scenes,
  }
}
