/**
 * 이미지 편집 프롬프트 개선
 */

import { GenerateContentConfig, ThinkingLevel } from '@google/genai'
import { genAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import type { MergeEditPromptInput, MergeEditPromptResult } from './types'

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 이미지 편집 가이드라인 */
const IMAGE_EDIT_EXAMPLES = `
=== IMAGE EDITING GUIDELINES ===

Enhanced 프롬프트 작성 원칙:
- 사용자 요청을 구체적이고 실행 가능한 영어 프롬프트로 변환
- 변경 대상 명확히 지정 (background, expression, clothing color 등)
- 변경 결과 구체적으로 묘사 (색상, 질감, 스타일 등)
- 요청하지 않은 변경은 추가하지 않음

변환 패턴:
- 배경 변경: "Change the background to [specific scene with details]"
- 밝기 조정: "Increase/Decrease brightness and make [specific effect]"
- 표정 변경: "Change the facial expression to [specific expression]"
- 색상 변경: "Change the [item] color to [color] while maintaining [preserved aspects]"

AVOID (반드시 피할 것):
✗ "Make it better" (너무 모호)
✗ "Change everything to look perfect" (범위 불명확)
✗ 요청하지 않은 포즈, 조명 등 추가 변경
✗ 구체적 결과 묘사 없이 모호한 지시
`.trim()

/** 이미지 편집 Self-Verification */
const IMAGE_EDIT_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your enhanced prompt:
✓ ONLY describes what user explicitly requested?
✓ No unrequested additions (pose, lighting, framing)?
✓ Specific and actionable?
✓ In English?
If any check fails, revise before responding.
`.trim()

/**
 * 이미지 편집 프롬프트 개선
 * 유저의 편집 요청을 이미지 모델에 적합한 프롬프트로 변환합니다.
 */
export async function mergeEditPrompt(input: MergeEditPromptInput): Promise<MergeEditPromptResult> {
  const prompt = `You are an expert image prompt engineer for AI image editing.
Enhance the user's edit request into a clear, effective prompt for an image editing AI model.

=== USER'S EDIT REQUEST ===
${input.userEditRequest}

=== INSTRUCTIONS ===
1. The user wants to modify an existing image.
2. Enhance ONLY the user's edit request into a professional image editing prompt.
3. DO NOT include: pose descriptions, framing, camera settings, lighting (unless requested).
4. ONLY describe what the user explicitly wants to change.
5. Translate Korean to English if needed.

${IMAGE_EDIT_EXAMPLES}

=== OUTPUT FORMAT ===
{
  "mergedPrompt": "Enhanced edit prompt in English",
  "editSummary": "Brief summary in Korean"
}

${IMAGE_EDIT_VERIFICATION}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.currentImageUrl) {
    const imageData = await fetchImageAsBase64(input.currentImageUrl)
    if (imageData) {
      parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
    }
  }

  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    return JSON.parse(response.text || '') as MergeEditPromptResult
  } catch {
    return {
      mergedPrompt: `${input.originalPrompt} Additionally: ${input.userEditRequest}`,
      editSummary: '프롬프트가 수정되었습니다.',
    }
  }
}
