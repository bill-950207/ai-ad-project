/**
 * 아바타 모션 영상 설정 AI 추천 API
 *
 * POST: 시나리오를 분석하여 최적의 영상 설정 추천
 * - 화면 비율
 * - 해상도
 * - 씬 개수
 * - 씬별 시간
 * - 씬별 움직임 강도
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import { buildAIRecommendationPrompt } from '@/lib/prompts/avatar-motion'

interface RecommendSettingsRequest {
  scenarioTitle: string
  scenarioDescription: string
  scenarioConcept: string
  productCategory?: string
  targetPlatform?: string
}

interface AIRecommendedSettings {
  aspectRatio: '9:16' | '16:9' | '1:1'
  resolution: '540p' | '720p' | '1080p'
  sceneCount: number
  sceneDurations: number[]
  movementAmplitudes: ('auto' | 'small' | 'medium' | 'large')[]
  reasoning: string
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

    const body: RecommendSettingsRequest = await request.json()
    const {
      scenarioTitle,
      scenarioDescription,
      scenarioConcept,
      productCategory = '일반 소비재',
      targetPlatform = '소셜 미디어 (인스타그램, 틱톡)',
    } = body

    if (!scenarioTitle) {
      return NextResponse.json(
        { error: 'Scenario title is required' },
        { status: 400 }
      )
    }

    // 프롬프트 생성
    const prompt = buildAIRecommendationPrompt(
      scenarioTitle,
      scenarioDescription,
      scenarioConcept,
      productCategory,
      targetPlatform
    )

    // Gemini API 호출
    const response = await generateText(prompt)

    // JSON 파싱
    let recommendation: AIRecommendedSettings
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const parsed = JSON.parse(jsonMatch[0])
      recommendation = normalizeRecommendation(parsed.recommendation)
    } catch (parseError) {
      console.error('Failed to parse recommendation response:', response, parseError)
      // Fallback 추천
      recommendation = getDefaultRecommendation()
    }

    return NextResponse.json({
      success: true,
      recommendation,
    })
  } catch (error) {
    console.error('설정 추천 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendation' },
      { status: 500 }
    )
  }
}

function normalizeRecommendation(raw: unknown): AIRecommendedSettings {
  const data = raw as Record<string, unknown>

  const sceneCount = Math.min(5, Math.max(2, (data.sceneCount as number) || 3))
  const rawDurations = (data.sceneDurations as number[]) || []
  const rawAmplitudes = (data.movementAmplitudes as string[]) || []

  // 씬별 시간 정규화 (1-8초)
  const sceneDurations: number[] = []
  for (let i = 0; i < sceneCount; i++) {
    const dur = rawDurations[i]
    if (typeof dur === 'number') {
      sceneDurations.push(Math.min(8, Math.max(1, dur)))
    } else {
      sceneDurations.push(5)
    }
  }

  // 움직임 강도 정규화
  const validAmplitudes = ['auto', 'small', 'medium', 'large'] as const
  const movementAmplitudes: AIRecommendedSettings['movementAmplitudes'] = []
  for (let i = 0; i < sceneCount; i++) {
    const amp = rawAmplitudes[i]
    if (validAmplitudes.includes(amp as typeof validAmplitudes[number])) {
      movementAmplitudes.push(amp as typeof validAmplitudes[number])
    } else {
      movementAmplitudes.push('auto')
    }
  }

  // 비율 정규화
  const validRatios = ['9:16', '16:9', '1:1'] as const
  let aspectRatio: AIRecommendedSettings['aspectRatio'] = '9:16'
  if (validRatios.includes(data.aspectRatio as typeof validRatios[number])) {
    aspectRatio = data.aspectRatio as typeof validRatios[number]
  }

  // 해상도 정규화
  const validResolutions = ['540p', '720p', '1080p'] as const
  let resolution: AIRecommendedSettings['resolution'] = '720p'
  if (validResolutions.includes(data.resolution as typeof validResolutions[number])) {
    resolution = data.resolution as typeof validResolutions[number]
  }

  return {
    aspectRatio,
    resolution,
    sceneCount,
    sceneDurations,
    movementAmplitudes,
    reasoning: (data.reasoning as string) || '시나리오에 맞는 기본 설정을 추천합니다.',
  }
}

function getDefaultRecommendation(): AIRecommendedSettings {
  return {
    aspectRatio: '9:16',
    resolution: '720p',
    sceneCount: 3,
    sceneDurations: [4, 5, 6],
    movementAmplitudes: ['medium', 'medium', 'small'],
    reasoning: '소셜 미디어에 최적화된 세로 형식으로, 3개 씬으로 자연스러운 스토리텔링이 가능합니다. 시작과 중간은 중간 정도의 움직임, 마지막은 차분하게 마무리하는 구성입니다.',
  }
}
