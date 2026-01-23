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
import {
  generateCompleteScenarios,
  generateMultiSceneScenarios,
  generateSingleSceneScenarios,
} from '@/lib/gemini'
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
  imageSummary?: string    // 이미지 프롬프트 요약 (한국어, 사용자 표시용)
  videoSummary?: string    // 영상 모션 요약 (한국어, 사용자 표시용)
  firstFramePrompt: string
  motionPromptEN: string
  duration: number
  movementAmplitude: 'auto' | 'small' | 'medium' | 'large'
  location: string
  mood: string
}

// 추천 설정 타입 (씬별 duration/movementAmplitude는 scenes 배열에서 관리)
interface RecommendedSettings {
  aspectRatio: '16:9' | '9:16' | '1:1'
  sceneCount: number
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

    // 완전 시나리오 생성 모드 (AI 추천 - 설정 포함, Structured Output 사용)
    if (generateCompleteSettings) {
      const prompt = buildCompleteScenarioPrompt(
        productName,
        productDescription,
        productSellingPoints,
        avatarDescription || getDefaultAvatarDescription(avatarType),
        avatarType
      )

      // Gemini Structured Output을 사용하여 시나리오 생성
      const result = await generateCompleteScenarios(prompt)
      scenarios = normalizeCompleteScenarios(result.scenarios)

      return NextResponse.json({
        success: true,
        scenarios,
        multiScene: true,
        generateCompleteSettings: true,
      })
    }

    // 멀티 씬 모드 (설정 별도, Structured Output 사용)
    if (multiScene) {
      const prompt = buildMultiSceneScenarioPrompt(
        productName,
        productDescription,
        productSellingPoints,
        avatarDescription || getDefaultAvatarDescription(avatarType),
        avatarType,
        sceneCount,
        totalDuration
      )

      // Gemini Structured Output으로 시나리오 생성
      const result = await generateMultiSceneScenarios(prompt, sceneCount, totalDuration)
      scenarios = normalizeMultiSceneScenarios(result.scenarios, sceneCount)
    } else {
      // 단일 씬 모드 (Legacy, Structured Output 사용)
      const prompt = buildScenarioGenerationPrompt(
        productName,
        productDescription,
        productSellingPoints,
        avatarDescription || getDefaultAvatarDescription(avatarType),
        avatarType
      )

      // Gemini Structured Output으로 시나리오 생성
      const result = await generateSingleSceneScenarios(prompt)
      scenarios = normalizeSingleSceneScenarios(result.scenarios)
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

// 완전 시나리오 정규화 (설정 포함)
function normalizeCompleteScenarios(rawScenarios: unknown[]): Scenario[] {
  return rawScenarios.map((s: unknown, i: number) => {
    const scenario = s as Record<string, unknown>
    const rawScenes = (scenario.scenes as unknown[]) || []
    const rawSettings = (scenario.recommendedSettings as Record<string, unknown>) || {}

    // 씬 정규화 (duration, movementAmplitude는 각 씬에서 직접 관리)
    const scenes: SceneInfo[] = rawScenes.map((sc: unknown, j: number) => {
      const scene = sc as Record<string, unknown>
      return {
        sceneIndex: (scene.sceneIndex as number) ?? j,
        title: (scene.title as string) || `씬 ${j + 1}`,
        description: (scene.description as string) || '',
        imageSummary: (scene.imageSummary as string) || '',
        videoSummary: (scene.videoSummary as string) || '',
        firstFramePrompt: (scene.firstFramePrompt as string) || '',
        motionPromptEN: (scene.motionPromptEN as string) || '',
        duration: (scene.duration as number) || 3,
        movementAmplitude: (scene.movementAmplitude as SceneInfo['movementAmplitude']) || 'auto',
        location: (scene.location as string) || '',
        mood: (scene.mood as string) || '',
      }
    })

    // 추천 설정 정규화 (aspectRatio, sceneCount만 관리)
    const recommendedSettings: RecommendedSettings = {
      aspectRatio: (rawSettings.aspectRatio as RecommendedSettings['aspectRatio']) || '9:16',
      sceneCount: scenes.length || 3,
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

