/**
 * 아바타 모션 시나리오 생성
 *
 * Gemini Structured Output을 사용한 시나리오 생성 함수들
 */

import { GenerateContentConfig, ThinkingLevel } from '@google/genai'
import { getGenAI, MODEL_NAME } from './shared'
import type { GenerateScenariosResult } from './types'

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 씬 설명 예시 (Few-Shot) */
const SCENE_DESCRIPTION_EXAMPLES = `
=== SCENE DESCRIPTION GUIDELINES ===

GOOD (action-oriented, specific):
✓ title: 2-4 characters, emotion or action keyword
✓ description: [specific action with product] + [facial expression/emotion]
  - Include: body part interaction, speed/manner of action, resulting expression
  - Pattern: "[verb] + [product/body part] + [manner] + [expression]"

BAD (vague, emotion-only):
✗ title: Abstract concepts like "Beginning", "Introduction", "End"
✗ description: Only outcomes without specific actions ("shows product", "introduces")
✗ description: Static descriptions without movement or expression change
`.trim()

/** 모션 프롬프트 가이드라인 (영어) */
const MOTION_PROMPT_EXAMPLES = `
=== MOTION PROMPT GUIDELINES (English) ===

PROMPT STRUCTURE (follow this pattern):
"[Camera movement] + [Subject action] + [Expression change]"

REQUIRED ELEMENTS:
- Camera: "slowly dollies in", "push-in", "static shot", "tracking"
- Action: "picks up product", "turns product in hands", "applies product"
- Expression: "curious look", "subtle eyebrow raise", "thoughtful gaze" (NOT smile)

AVOID:
✗ Vague descriptions: "holds product", "shows product"
✗ Static scenes without movement or expression change
✗ Forced smile expressions
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
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
  }

  const response = await getGenAI().models.generateContent({
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
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
  }

  const response = await getGenAI().models.generateContent({
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

  const response = await getGenAI().models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
    config,
  })

  const responseText = response.text || ''
  return JSON.parse(responseText) as GenerateScenariosResult
}
