/**
 * 아바타 모션 시나리오 생성
 *
 * Gemini Structured Output을 사용한 시나리오 생성 함수들
 */

import { GenerateContentConfig, GoogleGenAI, ThinkingLevel, Type } from '@google/genai'
import type { GenerateScenariosResult } from './types'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

// ============================================================
// Structured Output 스키마 정의
// ============================================================

/** 씬 스키마 (재사용) */
const SCENE_SCHEMA = {
  type: Type.OBJECT,
  required: [
    'sceneIndex', 'title', 'description', 'imageSummary', 'videoSummary',
    'firstFramePrompt', 'motionPromptEN', 'duration', 'movementAmplitude',
    'location', 'mood'
  ],
  properties: {
    sceneIndex: { type: Type.NUMBER, description: '씬 인덱스 (0부터)' },
    title: { type: Type.STRING, description: '씬 제목 (한국어, 8자 이내)' },
    description: { type: Type.STRING, description: '씬 설명 (한국어, 20자 이내)' },
    imageSummary: { type: Type.STRING, description: '이미지 요약 (한국어, 20자)' },
    videoSummary: { type: Type.STRING, description: '모션 요약 (한국어, 20자)' },
    firstFramePrompt: { type: Type.STRING, description: '첫 프레임 (영어, 80-100단어)' },
    motionPromptEN: { type: Type.STRING, description: '모션 설명 (영어, 40-60단어)' },
    duration: { type: Type.NUMBER, description: '씬 길이 (2-5초, 기본 2초 권장)' },
    movementAmplitude: {
      type: Type.STRING,
      enum: ['auto', 'small', 'medium', 'large'],
      description: '움직임 강도',
    },
    location: { type: Type.STRING, description: '장소 (한국어)' },
    mood: { type: Type.STRING, description: '분위기 (한국어)' },
  },
} as const

/** 시나리오 스키마 (재사용) */
const SCENARIO_SCHEMA = {
  type: Type.OBJECT,
  required: [
    'id', 'title', 'description', 'concept', 'productAppearance',
    'mood', 'location', 'tags', 'recommendedSettings', 'scenes'
  ],
  properties: {
    id: { type: Type.STRING, description: '시나리오 ID' },
    title: { type: Type.STRING, description: '제목 (한국어, 10자 이내)' },
    description: { type: Type.STRING, description: '요약 (한국어, 30자 이내)' },
    concept: { type: Type.STRING, description: '컨셉 (한국어, 2-3문장)' },
    productAppearance: { type: Type.STRING, description: '제품 등장 방식 (한국어)' },
    mood: { type: Type.STRING, description: '분위기 (한국어, 2단어)' },
    location: { type: Type.STRING, description: '장소 (한국어)' },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '태그 (한국어)',
    },
    recommendedSettings: {
      type: Type.OBJECT,
      required: ['aspectRatio', 'sceneCount'],
      properties: {
        aspectRatio: {
          type: Type.STRING,
          enum: ['9:16', '16:9', '1:1'],
          description: '화면 비율',
        },
        sceneCount: { type: Type.NUMBER, description: '씬 개수 (4-8)' },
      },
    },
    scenes: {
      type: Type.ARRAY,
      description: '씬 배열 (4-8개, 빠른 씬 전환 권장)',
      items: SCENE_SCHEMA,
    },
  },
} as const

/** 시나리오 배열 스키마 */
const SCENARIOS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: ['scenarios'],
  properties: {
    scenarios: {
      type: Type.ARRAY,
      description: '3개의 시나리오',
      items: SCENARIO_SCHEMA,
    },
  },
} as const

// ============================================================
// 시나리오 생성 함수
// ============================================================

/**
 * 완전 시나리오 생성 (AI 추천 모드)
 * - Structured Output 사용
 * - 설정(aspectRatio, sceneCount)과 씬 정보 포함
 */
export async function generateCompleteScenarios(prompt: string): Promise<GenerateScenariosResult> {
  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    responseMimeType: 'application/json',
    responseSchema: SCENARIOS_RESPONSE_SCHEMA,
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  const responseText = response.text || ''
  return JSON.parse(responseText) as GenerateScenariosResult
}

/**
 * 멀티씬 시나리오 생성
 * - Structured Output 사용
 * - 지정된 씬 개수와 총 길이에 맞춰 생성
 */
export async function generateMultiSceneScenarios(
  prompt: string,
  sceneCount: number,
  totalDuration: number
): Promise<GenerateScenariosResult> {
  // 동적으로 씬 개수 힌트 추가
  const enhancedPrompt = `${prompt}

IMPORTANT CONSTRAINTS:
- Each scenario MUST have exactly ${sceneCount} scenes
- Total duration should be approximately ${totalDuration} seconds
- Distribute duration across scenes (${Math.floor(totalDuration / sceneCount)}-${Math.ceil(totalDuration / sceneCount)} seconds each)`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    responseMimeType: 'application/json',
    responseSchema: SCENARIOS_RESPONSE_SCHEMA,
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
    config,
  })

  const responseText = response.text || ''
  return JSON.parse(responseText) as GenerateScenariosResult
}

/**
 * 단일 씬 시나리오 생성 (레거시 호환)
 * - Structured Output 사용
 * - 각 시나리오에 1개 씬만 포함
 */
export async function generateSingleSceneScenarios(prompt: string): Promise<GenerateScenariosResult> {
  const enhancedPrompt = `${prompt}

IMPORTANT: Each scenario should have exactly 1 scene (single-scene mode).`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
    responseSchema: SCENARIOS_RESPONSE_SCHEMA,
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
    config,
  })

  const responseText = response.text || ''
  return JSON.parse(responseText) as GenerateScenariosResult
}
