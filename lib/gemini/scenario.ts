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

/** 씬 설명 예시 (Few-Shot - 한국어) */
const SCENE_DESCRIPTION_EXAMPLES = `
=== SCENE DESCRIPTION EXAMPLES (한국어) ===

GOOD (구체적, 액션 중심):
✓ title: "첫 만남" / description: "제품 상자를 천천히 열며 기대감 표현"
✓ title: "발견" / description: "제품 텍스처를 손끝으로 느끼며 놀라는 표정"
✓ title: "사용" / description: "제품을 피부에 부드럽게 바르는 모습"

BAD (모호, 일반적):
✗ title: "시작" / description: "제품을 보여준다"
✗ title: "소개" / description: "제품 설명"
✗ title: "끝" / description: "마무리"
`.trim()

/** 모션 프롬프트 예시 (Few-Shot - 영어) */
const MOTION_PROMPT_EXAMPLES = `
=== MOTION PROMPT EXAMPLES (English) ===

GOOD (specific, cinematic):
✓ "Camera slowly dollies in as model gently picks up the product, soft smile forming"
✓ "Model turns product in hands examining texture, subtle eyebrow raise shows interest"
✓ "Slow push-in on face as model applies product, expression shifts to satisfaction"

BAD (vague, static):
✗ "Model holds product"
✗ "Shows the product to camera"
✗ "Product appears in frame"
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

/** Chain-of-Thought 시간 분배 가이드 */
const DURATION_DISTRIBUTION_GUIDE = `
=== DURATION DISTRIBUTION (Chain-of-Thought) ===
Step 1: Calculate average duration = totalDuration ÷ sceneCount
Step 2: Adjust for scene importance:
  - Opening scene: +1 second (establish mood)
  - Climax scene: +1 second (product highlight)
  - Transition scenes: -1 second (keep pace)
Step 3: Verify total equals target duration
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
