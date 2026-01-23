/**
 * 시나리오 수정 API
 *
 * POST: 사용자 피드백에 따라 시나리오 개선
 * - Gemini를 사용하여 시나리오 수정
 * - 원본 시나리오와 수정 요청을 받아 개선된 시나리오 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import { buildScenarioModificationPrompt } from '@/lib/prompts/avatar-motion'

// 씬 정보 타입
interface SceneInfo {
  sceneIndex: number
  title: string
  description: string
  firstFramePrompt: string
  motionPromptEN: string
  duration: number
  movementAmplitude: 'auto' | 'small' | 'medium' | 'large'
  location?: string
  mood?: string
}

// 추천 설정 타입
interface RecommendedSettings {
  aspectRatio: '16:9' | '9:16' | '1:1'
  sceneCount: number
  sceneDurations: number[]
  movementAmplitudes: ('auto' | 'small' | 'medium' | 'large')[]
}

// 시나리오 타입
interface Scenario {
  id: string
  title: string
  description: string
  concept: string
  productAppearance: string
  mood: string
  location?: string
  tags: string[]
  scenes?: SceneInfo[]
  totalDuration?: number
  recommendedSettings?: RecommendedSettings
}

interface ModifyScenarioRequest {
  scenario: Scenario
  modificationRequest: string
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

    const body: ModifyScenarioRequest = await request.json()
    const {
      scenario,
      modificationRequest,
      productName,
      productDescription = '',
    } = body

    if (!scenario || !modificationRequest) {
      return NextResponse.json(
        { error: 'Scenario and modification request are required' },
        { status: 400 }
      )
    }

    // 수정 프롬프트 생성
    const prompt = buildScenarioModificationPrompt(
      scenario,
      modificationRequest,
      productName,
      productDescription
    )

    // Gemini API 호출
    const response = await generateText(prompt)

    // JSON 파싱
    let modifiedScenario: Scenario
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const parsed = JSON.parse(jsonMatch[0])
      modifiedScenario = normalizeModifiedScenario(parsed, scenario.id)
    } catch (parseError) {
      console.error('Failed to parse modified scenario:', response, parseError)
      // 파싱 실패 시 원본 반환하며 에러 메시지 포함
      return NextResponse.json({
        success: false,
        error: 'Failed to parse modified scenario',
        scenario: scenario,
      })
    }

    return NextResponse.json({
      success: true,
      scenario: modifiedScenario,
    })
  } catch (error) {
    console.error('시나리오 수정 오류:', error)
    return NextResponse.json(
      { error: 'Failed to modify scenario' },
      { status: 500 }
    )
  }
}

// 수정된 시나리오 정규화
function normalizeModifiedScenario(raw: Record<string, unknown>, originalId: string): Scenario {
  const rawScenes = (raw.scenes as unknown[]) || []
  const rawSettings = (raw.recommendedSettings as Record<string, unknown>) || {}

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

  // 배열 길이 맞추기
  while (recommendedSettings.sceneDurations.length < sceneCount) {
    recommendedSettings.sceneDurations.push(5)
  }
  while (recommendedSettings.movementAmplitudes.length < sceneCount) {
    recommendedSettings.movementAmplitudes.push('auto')
  }

  // 총 길이 계산
  const totalDuration = scenes.reduce((sum, sc) => sum + sc.duration, 0)

  return {
    id: (raw.id as string) || originalId,
    title: (raw.title as string) || '수정된 시나리오',
    description: (raw.description as string) || '',
    concept: (raw.concept as string) || '',
    productAppearance: (raw.productAppearance as string) || '',
    mood: (raw.mood as string) || '',
    location: (raw.location as string) || '',
    tags: (raw.tags as string[]) || [],
    scenes,
    totalDuration,
    recommendedSettings,
  }
}
