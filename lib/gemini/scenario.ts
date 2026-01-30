/**
 * 아바타 모션 시나리오 생성
 *
 * Gemini Structured Output을 사용한 시나리오 생성 함수들
 */

import { GenerateContentConfig, GoogleGenAI, ThinkingLevel } from '@google/genai'
import type { GenerateScenariosResult } from './types'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 씬 설명 가이드라인 (한국어) */
const SCENE_DESCRIPTION_EXAMPLES = `
=== SCENE DESCRIPTION GUIDELINES (한국어) ===

title 작성 원칙:
- 감정/상태를 담은 짧은 제목 (2-4자)
- 각 시나리오 내에서 고유해야 함
- 예: 발견, 설렘, 만족, 확신 등

description 작성 원칙:
- 구체적인 동작 + 표정/감정 변화 포함
- 제품과의 인터랙션 명시
- 시각적으로 상상 가능한 묘사

AVOID (반드시 피할 것):
✗ title: "시작", "소개", "끝" (너무 일반적)
✗ description: "제품을 보여준다", "제품 설명" (모호함)
✗ 구체적 동작 없이 추상적 설명만
`.trim()

/** 모션 프롬프트 가이드라인 (영어) */
const MOTION_PROMPT_EXAMPLES = `
=== MOTION PROMPT GUIDELINES (English) ===

필수 포함 요소:
1. Camera movement: dolly in/out, push-in, tracking, static 등
2. Model action: 구체적 동작 (picks up, turns, applies, examines 등)
3. Expression change: 표정 변화 (smile forming, eyebrow raise, shifts to 등)
4. Timing adverbs: slowly, gently, gradually 등

구조: [Camera movement] + [Model action with timing] + [Expression/reaction]

AVOID (반드시 피할 것):
✗ "Model holds product" (동작 없이 정적)
✗ "Shows the product to camera" (너무 모호)
✗ "Product appears in frame" (주체 불명확)
✗ 카메라 움직임이나 표정 변화 없는 정적 묘사
`.trim()

/** Self-Verification 체크리스트 */
const SCENARIO_SELF_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your scenarios:
✓ All 3 scenarios are DISTINCT concepts (not similar moods)?
✓ Scene titles are UNIQUE within each scenario?
✓ Total duration matches target (sum of scene durations)?
✓ Scene flow is LOGICAL (beginning → middle → end)?
✓ No person description in firstFramePrompt (only pose/expression/outfit)?
✓ Motion prompts include camera movement AND expression changes?
If any check fails, revise before responding.
`.trim()

// ============================================================
// 시나리오 생성 함수
// ============================================================

/**
 * 완전 시나리오 생성 (AI 추천 모드)
 * - Structured Output 사용
 * - 설정(aspectRatio, sceneCount)과 씬 정보 포함
 */
export async function generateCompleteScenarios(prompt: string): Promise<GenerateScenariosResult> {
  // Few-Shot 및 Self-Verification 추가
  const enhancedPrompt = `${prompt}

${SCENE_DESCRIPTION_EXAMPLES}

${MOTION_PROMPT_EXAMPLES}

${SCENARIO_SELF_VERIFICATION}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    responseMimeType: 'application/json',
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
 * 멀티씬 시나리오 생성
 * - Structured Output 사용
 * - 지정된 씬 개수와 총 길이에 맞춰 생성
 */
export async function generateMultiSceneScenarios(
  prompt: string,
  sceneCount: number,
  totalDuration: number
): Promise<GenerateScenariosResult> {
  const avgDuration = Math.round(totalDuration / sceneCount)

  // Chain-of-Thought + Few-Shot + Self-Verification 추가
  const enhancedPrompt = `${prompt}

=== DURATION CONSTRAINTS (Chain-of-Thought) ===
Step 1: Total ${totalDuration} seconds ÷ ${sceneCount} scenes = ~${avgDuration} seconds each
Step 2: Adjust for scene importance:
  - Opening: ${avgDuration + 1}s (establish mood)
  - Middle: ${avgDuration}s (build story)
  - Climax: ${avgDuration + 1}s (product highlight)
  - Ending: ${avgDuration - 1}s (quick wrap-up)
Step 3: Verify sum = ${totalDuration} seconds

IMPORTANT CONSTRAINTS:
- Each scenario MUST have exactly ${sceneCount} scenes
- Total duration MUST equal ${totalDuration} seconds
- Each scene: 2-5 seconds (recommend 2-3s for fast pacing)

${SCENE_DESCRIPTION_EXAMPLES}

${MOTION_PROMPT_EXAMPLES}

${SCENARIO_SELF_VERIFICATION}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    responseMimeType: 'application/json',
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

IMPORTANT: Each scenario should have exactly 1 scene (single-scene mode).

${SCENE_DESCRIPTION_EXAMPLES}

${MOTION_PROMPT_EXAMPLES}

=== SINGLE-SCENE VERIFICATION ===
✓ Each scenario has exactly 1 scene?
✓ Scene captures the entire story arc?
✓ Duration is appropriate (5-15 seconds)?`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
    config,
  })

  const responseText = response.text || ''
  return JSON.parse(responseText) as GenerateScenariosResult
}
