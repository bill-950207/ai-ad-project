/**
 * 이미지 편집 프롬프트 개선
 */

import { GenerateContentConfig, ThinkingLevel } from '@google/genai'
import { genAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import type { MergeEditPromptInput, MergeEditPromptResult } from './types'

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 이미지 편집 Few-Shot 예시 */
const IMAGE_EDIT_EXAMPLES = `
=== IMAGE EDITING EXAMPLES (Few-Shot) ===

GOOD (specific, actionable):
User: "배경을 해변으로 바꿔줘"
✓ Enhanced: "Change the background to a tropical beach with clear blue sky, soft sand, and gentle ocean waves."

User: "더 밝게"
✓ Enhanced: "Increase brightness and make the overall image brighter and more luminous."

User: "표정을 웃는 얼굴로"
✓ Enhanced: "Change the facial expression to a warm, natural smile with relaxed eyes."

User: "옷을 빨간색으로"
✓ Enhanced: "Change the clothing color to a vibrant red while maintaining the same style and texture."

BAD (vague or overreaching):
✗ "Make it better" (too vague)
✗ "Change everything to look perfect" (unclear scope)
✗ Adding unrequested changes like pose or lighting
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
