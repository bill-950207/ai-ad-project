/**
 * 제품 정보 관련 Gemini API 함수
 * - 제품 정보 요약
 * - URL에서 제품 정보 추출
 */

import { GenerateContentConfig, ThinkingLevel } from '@google/genai'
import { getGenAI, MODEL_NAME } from './shared'
import type { ProductInfoInput, ProductSummary, UrlExtractResult } from './types'

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 제품 요약 예시 (Few-Shot) */
const PRODUCT_SUMMARY_EXAMPLES = `
=== PRODUCT SUMMARY EXAMPLES ===

GOOD (specific, benefit-focused):
✓ summary: "천연 성분 기반의 수분 크림으로, 건조한 피부에 즉각적인 보습과 진정 효과를 제공합니다."
✓ keyPoints: ["히알루론산 고함량", "무향료 저자극", "48시간 지속 보습"]
✓ suggestedTone: "신뢰감 있는 전문적"

BAD (vague, exaggerated):
✗ summary: "정말 좋은 크림입니다" (구체성 부족)
✗ keyPoints: ["최고의 품질", "완벽한 제품"] (과장)
✗ suggestedTone: "최고급" (모호)
`.trim()

/** 제품 분석 Self-Verification */
const PRODUCT_SELF_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your summary:
✓ No exaggerated claims (최고, 완벽, 유일)?
✓ Key points are specific and factual?
✓ Suggested tone matches product category?
✓ Summary is 2-3 sentences?
If any check fails, revise before responding.
`.trim()

/**
 * 제품 정보를 요약합니다.
 */
export async function summarizeProductInfo(input: ProductInfoInput): Promise<ProductSummary> {
  const inputText = input.rawText || `
제품명: ${input.productName || '미입력'}
브랜드: ${input.brandName || '미입력'}
제품 설명: ${input.productDescription || '미입력'}
제품 특징: ${input.productFeatures?.join(', ') || '미입력'}
타겟 고객: ${input.targetAudience || '미입력'}
가격: ${input.price || '미입력'}
  `.trim()

  const prompt = `당신은 광고 마케팅 전문가입니다. 다음 제품 정보를 분석하고 영상 광고 제작에 사용할 수 있도록 요약해주세요.

제품 정보:
${inputText}

${PRODUCT_SUMMARY_EXAMPLES}

다음 형식으로 JSON 응답해주세요:
{
  "summary": "제품의 핵심 가치와 특징을 2-3문장으로 요약",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "suggestedTone": "추천하는 광고 톤 (예: 고급스러운, 친근한, 에너지틱한 등)"
}

${PRODUCT_SELF_VERIFICATION}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
  }

  const response = await getGenAI().models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  const responseText = response.text || ''

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ProductSummary
    }
    throw new Error('JSON 형식 응답 없음')
  } catch {
    return {
      summary: responseText.slice(0, 200),
      keyPoints: ['제품 정보 분석 완료'],
      suggestedTone: '전문적인',
    }
  }
}

/**
 * URL에서 제품 정보를 추출합니다.
 * Gemini의 URL Context 기능을 사용하여 직접 페이지를 분석합니다.
 */
export async function extractProductFromUrl(url: string): Promise<UrlExtractResult> {
  try {
    const prompt = `다음 URL은 제품 상세 페이지입니다. 이 페이지에서 제품 정보를 추출해주세요.

URL: ${url}

다음 형식으로 JSON 응답해주세요:
{
  "title": "제품명",
  "brand": "브랜드명",
  "description": "제품 설명 (2-3문장으로 요약)",
  "price": "가격 (숫자와 통화 포함)",
  "features": ["특징1", "특징2", "특징3"],
  "imageUrl": "대표 제품 이미지 URL (있는 경우)"
}

정보가 없거나 찾을 수 없으면 해당 필드는 null로 표시하세요.
반드시 유효한 JSON으로만 응답하세요.`

    const config: GenerateContentConfig = {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      tools: [
        { urlContext: {} },
        { googleSearch: {} },
      ],
      responseMimeType: 'application/json',
    }

    const response = await getGenAI().models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config,
    })

    const responseText = response.text || ''

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0])
        return {
          title: extracted.title || undefined,
          description: extracted.description || undefined,
          price: extracted.price || undefined,
          brand: extracted.brand || undefined,
          features: extracted.features || undefined,
          imageUrl: extracted.imageUrl || undefined,
        }
      }
    } catch {
      // 파싱 실패 무시
    }

    return {
      title: undefined,
      description: responseText.slice(0, 200),
    }
  } catch (error) {
    console.error('URL 추출 오류:', error)
    throw new Error('제품 정보를 가져올 수 없습니다. URL을 확인해주세요.')
  }
}
