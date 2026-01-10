/**
 * Gemini API 클라이언트
 *
 * 영상 광고 프롬프트 생성을 위한 Gemini 클라이언트입니다.
 * - 제품 정보 요약
 * - URL에서 제품 정보 추출 (URL Context 사용)
 * - 영상 광고 프롬프트 생성
 */

import { GoogleGenAI } from '@google/genai'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

// 사용할 모델
const MODEL_NAME = 'gemini-3-flash-preview'

// ============================================================
// 타입 정의
// ============================================================

/** 제품 정보 요약 입력 */
export interface ProductInfoInput {
  productName?: string      // 제품명
  productDescription?: string  // 제품 설명
  productFeatures?: string[]   // 제품 특징
  targetAudience?: string   // 타겟 고객
  brandName?: string        // 브랜드명
  price?: string            // 가격
  rawText?: string          // 직접 입력한 텍스트
}

/** 제품 정보 요약 결과 */
export interface ProductSummary {
  summary: string           // 요약된 제품 정보
  keyPoints: string[]       // 핵심 포인트
  suggestedTone: string     // 추천 광고 톤
}

/** URL 추출 결과 */
export interface UrlExtractResult {
  title?: string
  description?: string
  price?: string
  brand?: string
  features?: string[]
  imageUrl?: string
  rawContent?: string
}

/** 영상 프롬프트 생성 입력 */
export interface VideoPromptInput {
  productSummary: string    // 요약된 제품 정보
  productImageUrl?: string  // 제품 이미지 URL
  avatarImageUrl?: string   // 아바타 이미지 URL
  duration: number          // 영상 길이 (5, 10, 15초)
  style?: string            // 광고 스타일 (예: 밝은, 고급스러운, 활기찬)
  additionalInstructions?: string  // 추가 지시사항
}

/** 영상 프롬프트 생성 결과 */
export interface VideoPromptResult {
  prompt: string            // 생성된 프롬프트
  negativePrompt: string    // 네거티브 프롬프트
}

/** 통합 영상 광고 프롬프트 생성 입력 */
export interface VideoAdPromptInput {
  productInfo?: string      // 제품 정보 (직접 입력)
  productUrl?: string       // 제품 URL (Gemini가 직접 접근)
  duration: number          // 영상 길이 (5, 10, 15초)
  style?: string            // 광고 스타일
  additionalInstructions?: string  // 추가 지시사항
}

/** 통합 영상 광고 프롬프트 생성 결과 */
export interface VideoAdPromptResult {
  productSummary: string        // 요약된 제품 정보
  firstScenePrompt: string      // 첫 씬 이미지 생성 프롬프트 (영어)
  videoPrompt: string           // 영상 생성 프롬프트 (영어)
  negativePrompt: string        // 네거티브 프롬프트 (영어)
}

// ============================================================
// API 함수
// ============================================================

/**
 * 제품 정보를 요약합니다.
 *
 * @param input - 제품 정보
 * @returns 요약된 제품 정보
 */
export async function summarizeProductInfo(input: ProductInfoInput): Promise<ProductSummary> {
  // 입력 정보 구성
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

다음 형식으로 JSON 응답해주세요:
{
  "summary": "제품의 핵심 가치와 특징을 2-3문장으로 요약",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "suggestedTone": "추천하는 광고 톤 (예: 고급스러운, 친근한, 에너지틱한 등)"
}

반드시 유효한 JSON 형식으로만 응답하세요.`

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  const responseText = response.text || ''

  try {
    // JSON 파싱 시도
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ProductSummary
    }
    throw new Error('JSON 형식 응답 없음')
  } catch {
    // 파싱 실패 시 기본 응답
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
 *
 * @param url - 제품 페이지 URL
 * @returns 추출된 제품 정보
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

    // URL Context 도구를 사용하여 페이지 내용 직접 분석
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [
          { urlContext: {} },
          { googleSearch: {} },
        ],
      },
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

    // 파싱 실패 시 기본 응답
    return {
      title: undefined,
      description: responseText.slice(0, 200),
    }
  } catch (error) {
    console.error('URL 추출 오류:', error)
    throw new Error('제품 정보를 가져올 수 없습니다. URL을 확인해주세요.')
  }
}

/**
 * 영상 광고용 프롬프트를 생성합니다.
 *
 * @param input - 프롬프트 생성 입력
 * @returns 생성된 프롬프트
 */
export async function generateVideoPrompt(input: VideoPromptInput): Promise<VideoPromptResult> {
  const durationDesc =
    input.duration === 5 ? '짧고 임팩트 있는 5초'
      : input.duration === 10 ? '적당한 길이의 10초'
        : '충분한 스토리를 담은 15초'

  const prompt = `당신은 영상 광고 프롬프트 전문가입니다. AI 영상 생성 모델(Wan 2.6)에 입력할 프롬프트를 만들어주세요.

제품 정보:
${input.productSummary}

영상 길이: ${durationDesc}
광고 스타일: ${input.style || '전문적이고 매력적인'}
${input.additionalInstructions ? `추가 요청: ${input.additionalInstructions}` : ''}

중요 지침:
1. 프롬프트는 영어로 작성하세요.
2. 첫 프레임은 제품/모델 이미지이므로, 그 이미지에서 시작하는 자연스러운 움직임을 묘사하세요.
3. ${input.duration}초 동안의 부드러운 모션을 설명하세요.
4. 텍스트, 글자, 로고는 포함하지 마세요.
5. 카메라 움직임, 조명 변화, 제품/모델의 동작을 구체적으로 묘사하세요.
6. 최대 800자 이내로 작성하세요.

다음 형식으로 JSON 응답해주세요:
{
  "prompt": "영어 프롬프트 (800자 이내)",
  "negativePrompt": "피해야 할 요소들 (영어, 500자 이내)"
}

반드시 유효한 JSON으로만 응답하세요.`

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  const responseText = response.text || ''

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as VideoPromptResult
    }
    throw new Error('JSON 형식 응답 없음')
  } catch {
    // 파싱 실패 시 기본 응답
    return {
      prompt: `Professional product advertisement video. The product slowly rotates with soft studio lighting. Smooth camera movement reveals product details. High-quality commercial style. ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, words, watermark, logo, blurry, low quality, distorted',
    }
  }
}

/**
 * 영상 광고용 통합 프롬프트를 생성합니다.
 * 제품 정보(직접 입력 또는 URL)를 분석하여 첫 씬 이미지 프롬프트와 영상 프롬프트를 함께 생성합니다.
 *
 * @param input - 프롬프트 생성 입력
 * @returns 제품 요약, 첫 씬 프롬프트, 영상 프롬프트
 */
export async function generateVideoAdPrompts(input: VideoAdPromptInput): Promise<VideoAdPromptResult> {
  const durationDesc =
    input.duration === 5 ? '짧고 임팩트 있는 5초'
      : input.duration === 10 ? '적당한 길이의 10초'
        : '충분한 스토리를 담은 15초'

  // URL이 있으면 URL 정보를 포함
  const productInfoSection = input.productUrl
    ? `제품 정보 URL: ${input.productUrl}
위 URL에서 제품 정보를 직접 확인하세요.

추가 제품 정보:
${input.productInfo || '없음'}`
    : `제품 정보:
${input.productInfo || '정보 없음'}`

  const prompt = `당신은 영상 광고 전문가입니다. 제품 정보를 분석하고, AI 모델을 위한 프롬프트를 생성해주세요.

${productInfoSection}

영상 길이: ${durationDesc}
광고 스타일: ${input.style || '전문적이고 매력적인'}
${input.additionalInstructions ? `추가 요청: ${input.additionalInstructions}` : ''}

두 가지 프롬프트를 생성해주세요:

1. **첫 씬 이미지 프롬프트 (firstScenePrompt)**:
   - GPT-Image-1.5 모델에 입력할 이미지 생성 프롬프트
   - 제품과 모델(아바타)이 함께 있는 광고 이미지 묘사
   - 모델이 제품을 들고 있거나, 사용하거나, 제품 옆에 있는 장면
   - 제품의 특징이 잘 보이도록 구성
   - 조명, 배경, 분위기 등 구체적으로 묘사
   - 영어로 작성, 500자 이내

2. **영상 생성 프롬프트 (videoPrompt)**:
   - Wan 2.6 Image-to-Video 모델에 입력할 프롬프트
   - 첫 씬 이미지에서 시작하여 ${input.duration}초 동안의 자연스러운 움직임 묘사
   - 카메라 움직임, 모델의 동작, 제품 하이라이트 등
   - 텍스트, 글자, 로고는 포함하지 않도록
   - 영어로 작성, 800자 이내

다음 JSON 형식으로 응답해주세요:
{
  "productSummary": "제품의 핵심 가치를 2-3문장으로 요약 (한국어)",
  "firstScenePrompt": "첫 씬 이미지 생성 프롬프트 (영어, 500자 이내)",
  "videoPrompt": "영상 생성 프롬프트 (영어, 800자 이내)",
  "negativePrompt": "피해야 할 요소들 (영어, 200자 이내)"
}

반드시 유효한 JSON으로만 응답하세요.`

  // URL이 있으면 urlContext 도구 사용
  const config = input.productUrl
    ? {
        tools: [
          { urlContext: {} },
          { googleSearch: {} },
        ],
      }
    : undefined

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  const responseText = response.text || ''

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as VideoAdPromptResult
    }
    throw new Error('JSON 형식 응답 없음')
  } catch {
    // 파싱 실패 시 기본 응답
    return {
      productSummary: '제품 정보를 분석했습니다.',
      firstScenePrompt: 'Professional advertising scene. A model elegantly holds the product in a well-lit studio setting. Clean background, soft shadows, commercial photography style. The product is prominently displayed with clear details visible. High-end fashion advertisement aesthetic.',
      videoPrompt: `Professional product advertisement video. The scene begins with a static shot of the model holding the product. Camera slowly zooms in to reveal product details. Smooth lighting transitions highlight the product features. The model shows subtle natural movements. Cinematic quality, ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, words, watermark, logo, blurry, low quality, distorted, deformed, ugly',
    }
  }
}
