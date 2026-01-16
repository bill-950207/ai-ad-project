/**
 * Gemini API 클라이언트
 *
 * 영상 광고 프롬프트 생성을 위한 Gemini 클라이언트입니다.
 * - 제품 정보 요약
 * - URL에서 제품 정보 추출 (URL Context 사용)
 * - 영상 광고 프롬프트 생성
 */

import { GenerateContentConfig, GoogleGenAI, ThinkingLevel, Type } from '@google/genai'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

// 사용할 모델
const MODEL_NAME = 'gemini-3-flash-preview'

/**
 * URL에서 이미지를 가져와 base64로 변환합니다.
 */
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return { base64, mimeType: contentType }
  } catch (error) {
    console.error('이미지 로드 오류:', error)
    return null
  }
}

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
  productImageUrl?: string  // 제품 이미지 URL (외형 참고용)
  avatarImageUrl?: string   // 아바타 이미지 URL (외형 참고용)
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

/** UGC 영상 프롬프트 생성 입력 */
export interface UGCPromptInput {
  productInfo?: string        // 제품 정보 (직접 입력)
  productUrl?: string         // 제품 URL (Gemini가 직접 접근)
  productImageUrl?: string    // 제품 이미지 URL (외형 참고용)
  avatarImageUrl?: string     // 아바타 이미지 URL (필수)
  script?: string             // 사용자 입력 스크립트
  duration: number            // 영상 길이 (5, 8, 12초)
  mood?: 'friendly' | 'professional' | 'energetic'  // 분위기
  additionalInstructions?: string  // 추가 지시사항
}

/** UGC 영상 프롬프트 생성 결과 */
export interface UGCPromptResult {
  productSummary: string        // 요약된 제품 정보
  firstScenePrompt: string      // 첫 장면 이미지 프롬프트 (영어)
  videoPrompt: string           // 영상 생성 프롬프트 (영어)
  suggestedScript?: string      // AI 생성 스크립트 (URL 입력 시, 한국어)
}

/** 대본 스타일 타입 */
export type ScriptStyle = 'formal' | 'casual' | 'energetic'

/** 제품 설명 대본 생성 입력 */
export interface ProductScriptInput {
  productInfo: string           // 제품 정보 (직접 입력)
  productUrl?: string           // 제품 URL (선택사항)
  durationSeconds: number       // 영상 길이 (초)
  additionalInstructions?: string  // 추가 지시사항
}

/** 개별 대본 */
export interface Script {
  style: ScriptStyle            // 대본 스타일
  styleName: string             // 스타일 이름 (한국어)
  content: string               // 대본 내용
  estimatedDuration: number     // 예상 길이 (초)
}

/** 제품 설명 대본 생성 결과 */
export interface ProductScriptResult {
  productSummary: string        // 제품 요약
  scripts: Script[]             // 3가지 스타일의 대본
}

/** 카메라 구도 타입 (셀카는 각도별로 세분화) */
export type CameraCompositionType = 'selfie-high' | 'selfie-front' | 'selfie-side' | 'tripod' | 'closeup' | 'fullbody'

/** 배경 생성 모드 */
export type BackgroundGenerationMode = 'PRODUCT' | 'OPTIONS' | 'PROMPT'

/** 배경 옵션 타입 */
export interface BackgroundOptions {
  style?: string       // 스타일 (modern, natural, minimal, luxurious, etc.)
  location?: string    // 장소 (studio, outdoor, home, cafe, office, etc.)
  mood?: string        // 분위기 (bright, warm, cool, dramatic, etc.)
  color?: string       // 주요 색상 (white, beige, blue, green, etc.)
  time?: string        // 시간대 (day, night, sunset, sunrise, etc.)
}

/** 배경 프롬프트 생성 입력 */
export interface BackgroundPromptInput {
  mode: BackgroundGenerationMode
  // PRODUCT 모드
  productImageUrl?: string
  productName?: string
  productDescription?: string
  // OPTIONS 모드
  options?: BackgroundOptions
  // PROMPT 모드
  userPrompt?: string
  // 공통
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
}

/** 배경 프롬프트 생성 결과 */
export interface BackgroundPromptResult {
  optimizedPrompt: string    // z-image-turbo용 최적화된 영어 프롬프트
  koreanDescription: string  // 사용자에게 보여줄 한국어 설명
}

/** 이미지 광고 유형 */
export type ImageAdType =
  | 'productOnly'
  | 'holding'
  | 'using'
  | 'wearing'
  | 'beforeAfter'
  | 'lifestyle'
  | 'unboxing'
  | 'comparison'
  | 'seasonal'

/** 이미지 광고 프롬프트 생성 입력 */
export interface ImageAdPromptInput {
  adType: ImageAdType                    // 광고 유형
  productName?: string                   // 제품명
  productDescription?: string            // 제품 설명
  productImageUrl?: string               // 제품 이미지 URL
  avatarImageUrls?: string[]             // 아바타 이미지 URL 배열
  outfitImageUrl?: string                // 의상 이미지 URL (wearing 타입)
  referenceStyleImageUrl?: string        // 참조 스타일 이미지 URL (분위기/스타일만 참조)
  selectedOptions: Record<string, string> // 사용자 선택 옵션
  additionalPrompt?: string              // 추가 프롬프트
}

/** 이미지 광고 프롬프트 생성 결과 */
export interface ImageAdPromptResult {
  optimizedPrompt: string     // Seedream 4.5 최적화 프롬프트 (영어)
  koreanDescription: string   // 한국어 설명
}

/** 참조 스타일 이미지 분석 입력 */
export interface ReferenceStyleAnalysisInput {
  imageUrl: string            // 참조 이미지 URL
  adType: ImageAdType         // 현재 선택된 광고 유형
  availableOptions: {         // 현재 광고 유형에서 사용 가능한 옵션 목록
    key: string
    options: string[]
  }[]
}

/** 분석된 옵션 값 (프리셋 또는 커스텀) */
export interface AnalyzedOptionValue {
  key: string                 // 옵션 그룹 키 (예: 'pose', 'background')
  type: 'preset' | 'custom'   // 프리셋 선택 또는 직접 입력
  value: string               // 선택된 프리셋 키 또는 커스텀 텍스트
  customText?: string         // 커스텀인 경우 상세 설명
  confidence: number          // 확신도 (0-1)
}

/** 참조 스타일 이미지 분석 결과 */
export interface ReferenceStyleAnalysisResult {
  analyzedOptions: AnalyzedOptionValue[]  // 분석된 옵션 값들
  overallStyle: string        // 전체적인 스타일 설명 (한국어)
  suggestedPrompt: string     // 추가 프롬프트 제안 (한국어)
  recommendedAdType?: ImageAdType  // 이미지에 가장 적합한 광고 유형
  adTypeMatchConfidence?: number   // 추천 광고 유형 확신도 (0-1)
  adTypeMatchReason?: string       // 추천 이유 (한국어)
}

/** 첫 프레임 이미지 프롬프트 생성 입력 */
export interface FirstFramePromptInput {
  productInfo: string           // 제품 정보
  avatarImageUrl: string        // 아바타 이미지 URL
  locationPrompt?: string       // 장소 프롬프트 (선택사항)
  productImageUrl?: string      // 제품 이미지 URL (선택사항)
  cameraComposition?: CameraCompositionType  // 카메라 구도 (선택사항)
}

/** 첫 프레임 이미지 프롬프트 생성 결과 */
export interface FirstFramePromptResult {
  prompt: string                // 이미지 생성 프롬프트 (영어)
  locationDescription: string   // 사용된 장소 설명 (한국어)
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
    input.duration === 5 ? 'short and impactful 5 seconds'
      : input.duration === 10 ? 'moderate length 10 seconds'
        : 'full story 15 seconds'

  // Include URL info if available
  const productInfoSection = input.productUrl
    ? `Product Info URL: ${input.productUrl}
Please retrieve and analyze the product information directly from the URL above.

Additional Product Info:
${input.productInfo || 'None'}`
    : `Product Info:
${input.productInfo || 'No information provided'}`

  // Image reference instructions with explicit IMAGE index (if images are attached)
  let videoImageIndex = 1
  const videoProductImageIndex = input.productImageUrl ? videoImageIndex++ : null
  const videoAvatarImageIndex = input.avatarImageUrl ? videoImageIndex++ : null

  const imageReferenceSection = (input.productImageUrl || input.avatarImageUrl)
    ? `
=== ATTACHED IMAGES GUIDE ===
${videoProductImageIndex ? `[IMAGE${videoProductImageIndex}] = PRODUCT IMAGE
- This is the product to advertise. Describe its exact appearance including color, shape, material, and design.
- IMPORTANT: The product may be a figurine, doll, or character merchandise with human-like form. Even if it looks like a person, it is a PRODUCT, NOT a real human. Do NOT transform it into a real person.
- Reference as "the product in IMAGE${videoProductImageIndex}" in your prompt.` : ''}
${videoAvatarImageIndex ? `[IMAGE${videoAvatarImageIndex}] = MODEL (AVATAR) IMAGE
- This is the human model for the advertisement. Reference their appearance, clothing, pose, and style.
- Reference as "the model in IMAGE${videoAvatarImageIndex}" in your prompt.` : ''}

You MUST describe the product and model appearances in detail so the image generation model can reproduce them identically to the originals.`
    : ''

  const prompt = `You are a video advertisement expert. Analyze the product information and generate prompts for AI models.

${productInfoSection}
${imageReferenceSection}

Video Duration: ${durationDesc}
Ad Style: ${input.style || 'professional and attractive'}
${input.additionalInstructions ? `Additional Instructions: ${input.additionalInstructions}` : ''}

Generate TWO prompts:

1. **First Scene Image Prompt (firstScenePrompt)**:
   - Image generation prompt optimized for Seedream 4.5 model (ByteDance)
   - GOAL: Generate 100% photorealistic image indistinguishable from real photo
   - Structure: subject → style → composition → lighting → technical parameters
   - Use natural language sentences (NOT comma-separated keywords)
   - First 5-8 words are most important - place the main subject there
   - MUST include photorealism elements:
     * Camera (choose based on style):
       - UGC/selfie style: "shot on smartphone camera" or "shot on 28mm lens at f/5.6" (background visible)
       - Professional style: "shot on 50mm lens at f/4" (slight background blur OK)
     * Skin/Eyes: "natural skin texture with visible pores, realistic eye reflections with catchlights"
     * Lighting (with direction): "soft natural daylight streaming from large window"
     * Background: describe actual background details instead of blur/bokeh for UGC style
   - End with (concise): "Hyperrealistic photograph, 8K RAW quality"
   - Product reference: Use "the product in IMAGE1" (with correct index) instead of brand/product names
   - AVOID for UGC style: "shallow depth of field", "creamy bokeh", "85mm lens" (causes excessive blur)
   - Write in English, 50-80 words (max 100 words)

2. **Video Generation Prompt (videoPrompt)**:
   - Prompt for Wan 2.6 Image-to-Video model
   - Describe natural movement starting from the first scene image for ${input.duration} seconds
   - Include camera movement, model actions, product highlights
   - Do NOT include any text, letters, or logos
   - Write in English, max 800 characters`

  // Use urlContext tool if URL is provided
  const tools = input.productUrl
    ? [{ urlContext: {} }, { googleSearch: {} }]
    : undefined

  const config: GenerateContentConfig = {
    tools,
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.HIGH,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['productSummary', 'firstScenePrompt', 'videoPrompt', 'negativePrompt'],
      properties: {
        productSummary: {
          type: Type.STRING,
          description: 'Summarize the core value of the product in 2-3 sentences (in Korean)',
        },
        firstScenePrompt: {
          type: Type.STRING,
          description: 'Seedream 4.5 photorealistic image prompt (English, 50-80 words, camera specs, lighting with direction, product as reference)',
        },
        videoPrompt: {
          type: Type.STRING,
          description: 'Video generation prompt (English, max 800 characters)',
        },
        negativePrompt: {
          type: Type.STRING,
          description: 'Elements to avoid (English, max 200 characters)',
        },
      },
    },
  }

  // Build multimodal contents (including images)
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Add images as base64 inline data
  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }
  if (input.avatarImageUrl) {
    const imageData = await fetchImageAsBase64(input.avatarImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }

  // Add text prompt
  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as VideoAdPromptResult
  } catch {
    // Seedream 4.5 포토리얼리즘 최적화 폴백 응답 (배경 선명 스타일)
    return {
      productSummary: 'Product information has been analyzed.',
      firstScenePrompt: 'A professional model with natural skin texture and visible pores confidently presents the product from the reference image in an elegant studio setting. Warm studio lighting from the left creates subtle shadows on her face with realistic eye reflections and catchlights. Individual hair strands catch the light naturally. She holds the product at chest height looking directly at camera. The background shows clean studio walls and subtle decor details. Shot on 50mm lens at f/4. Hyperrealistic photograph, 8K RAW quality.',
      videoPrompt: `Professional product advertisement video. The scene begins with a static shot of the model holding the product. Camera slowly zooms in to reveal product details. Smooth lighting transitions highlight the product features. The model shows subtle natural movements. Cinematic quality, ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, words, watermark, logo, blurry, low quality, distorted, deformed, ugly, artificial looking, CGI, 3D render, illustration, painting, anime, cartoon',
    }
  }
}

/**
 * UGC 영상용 프롬프트를 생성합니다.
 * 사용자가 입력한 스크립트 또는 제품 URL을 기반으로
 * 첫 장면 이미지 프롬프트와 영상 프롬프트를 생성합니다.
 *
 * @param input - UGC 프롬프트 생성 입력
 * @returns 제품 요약, 첫 장면 프롬프트, 영상 프롬프트, AI 스크립트
 */
export async function generateUGCPrompts(input: UGCPromptInput): Promise<UGCPromptResult> {
  const durationDesc =
    input.duration === 5 ? 'short 5 seconds'
      : input.duration === 8 ? 'medium 8 seconds'
        : 'longer 12 seconds'

  const moodDesc = {
    friendly: 'warm, approachable, casual, like talking to a friend',
    professional: 'confident, knowledgeable, trustworthy, expert-like',
    energetic: 'excited, enthusiastic, dynamic, high-energy',
  }[input.mood || 'friendly']

  // Product info section
  const productSection = input.productUrl
    ? `Product URL: ${input.productUrl}
Please retrieve and analyze the product information from the URL above.

Additional Product Info:
${input.productInfo || 'None'}`
    : `Product Info:
${input.productInfo || 'No product information provided - this is a general UGC video'}`

  // Script section
  const scriptSection = input.script
    ? `User Script (use this as the concept):
"${input.script}"`
    : `No script provided - please generate a natural UGC-style script based on the product info.`

  // Image reference instructions with explicit IMAGE index
  let ugcImageIndex = 1
  const ugcAvatarImageIndex = input.avatarImageUrl ? ugcImageIndex++ : null
  const ugcProductImageIndex = input.productImageUrl ? ugcImageIndex++ : null

  const imageReferenceSection = `
=== ATTACHED IMAGES GUIDE ===
${ugcAvatarImageIndex ? `[IMAGE${ugcAvatarImageIndex}] = AVATAR (MODEL) IMAGE
- This is the person who will appear in the video speaking to camera.
- Describe their exact appearance: face features, hair color/style, skin tone, clothing.
- The generated image must show this EXACT same person.
- Reference as "the person in IMAGE${ugcAvatarImageIndex}" in your prompt.` : ''}
${ugcProductImageIndex ? `[IMAGE${ugcProductImageIndex}] = PRODUCT IMAGE
- This is the product to feature in the video.
- IMPORTANT: The product may be a figurine, doll, or character merchandise with human-like form. Even if it looks like a person, it is a PRODUCT, NOT a real human. Do NOT transform it into a real person.
- Reference as "the product in IMAGE${ugcProductImageIndex}" in your prompt.` : ''}`

  const prompt = `You are a UGC (User Generated Content) video expert. Create prompts for an authentic, relatable video where a real person talks about a product.

${productSection}

${scriptSection}

Video Duration: ${durationDesc}
Mood/Tone: ${moodDesc}
${input.additionalInstructions ? `Additional Instructions: ${input.additionalInstructions}` : ''}
${imageReferenceSection}

Generate the following:

1. **Product Summary (productSummary)**:
   - Summarize the product's key value in 2-3 sentences (in Korean)
   - If no product info, write "일반 UGC 영상"

2. **First Scene Image Prompt (firstScenePrompt)**:
   - Create an image prompt for gpt-image-1.5 model
   - Show the avatar person in a natural, casual setting (home, cafe, etc.)
   - They should be looking at the camera, ready to speak
   - ${input.productImageUrl ? 'Include the product naturally in frame (holding it or nearby)' : 'No product in this shot'}
   - **CRITICAL: Describe the avatar's exact appearance from the attached image**
   - Natural lighting, authentic feel, NOT studio/commercial look
   - Vertical (9:16) phone camera perspective
   - Write in English, max 500 characters

3. **Video Generation Prompt (videoPrompt)**:
   - Prompt for Seedance 1.5 image-to-video model
   - Describe the person talking to camera with natural expressions
   - Include subtle head movements, gestures, facial expressions
   - ${input.productImageUrl ? 'Show them interacting with the product naturally' : ''}
   - ${durationDesc} of natural conversation-style movement
   - Authentic UGC feel, NOT polished commercial
   - Camera is mostly static (selfie-style) with slight natural movement
   - Write in English, max 600 characters

4. **Suggested Script (suggestedScript)** (only if no user script provided):
   - Write a natural Korean script for the person to "say"
   - Should match the mood: ${moodDesc}
   - Duration appropriate: ${input.duration} seconds
   - Authentic UGC tone, NOT commercial/scripted
   - If user provided a script, return null`

  // Use urlContext tool if URL is provided
  const tools = input.productUrl
    ? [{ urlContext: {} }, { googleSearch: {} }]
    : undefined

  const config: GenerateContentConfig = {
    tools,
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['productSummary', 'firstScenePrompt', 'videoPrompt'],
      properties: {
        productSummary: {
          type: Type.STRING,
          description: 'Product summary in Korean (2-3 sentences)',
        },
        firstScenePrompt: {
          type: Type.STRING,
          description: 'First scene image prompt for gpt-image-1.5 (English, max 500 chars)',
        },
        videoPrompt: {
          type: Type.STRING,
          description: 'Video generation prompt for Seedance (English, max 600 chars)',
        },
        suggestedScript: {
          type: Type.STRING,
          nullable: true,
          description: 'AI-generated Korean script if no user script provided',
        },
      },
    },
  }

  // Build multimodal contents
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Avatar image is required for UGC
  if (input.avatarImageUrl) {
    const imageData = await fetchImageAsBase64(input.avatarImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }

  // Product image is optional
  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }

  // Add text prompt
  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    const result = JSON.parse(responseText) as UGCPromptResult
    // If user provided script, don't include AI-generated one
    if (input.script) {
      result.suggestedScript = undefined
    }
    return result
  } catch {
    // Fallback response on parse failure
    return {
      productSummary: input.productInfo ? '제품 정보가 분석되었습니다.' : '일반 UGC 영상',
      firstScenePrompt: 'A young woman in casual clothes sits in a cozy home setting, looking directly at the camera with a friendly smile. Natural daylight from a window illuminates her face. She appears ready to share something exciting. Authentic selfie-style vertical composition, warm and inviting atmosphere.',
      videoPrompt: `A woman speaks enthusiastically to camera with natural expressions and subtle head movements. She gestures occasionally while talking, maintaining eye contact. Her facial expressions shift naturally between smiling and speaking. Authentic UGC style with slight camera movement. ${input.duration} seconds of natural conversation.`,
      suggestedScript: input.script ? undefined : '안녕하세요! 오늘 정말 좋은 거 발견해서 공유하려고요. 진짜 대박인데...',
    }
  }
}

/**
 * 제품 설명 대본을 3가지 스타일로 생성합니다.
 * - formal: 전문적이고 신뢰감 있는 톤
 * - casual: 친근하고 편안한 대화체
 * - energetic: 활기차고 열정적인 톤
 *
 * @param input - 대본 생성 입력
 * @returns 제품 요약과 3가지 스타일의 대본
 */
export async function generateProductScripts(input: ProductScriptInput): Promise<ProductScriptResult> {
  // 한국어 기준 1.1배속 TTS 사용 시 초당 약 5자
  // (기본 속도 3.7자/초 × 1.35 보정 × 1.1 배속 = 약 5.5, 여유있게 5.0 적용)
  const charsPerSecond = 5.0
  const targetChars = Math.round(input.durationSeconds * charsPerSecond)
  const minChars = Math.round(targetChars * 0.9)
  const maxChars = Math.round(targetChars * 1.1)

  const productSection = input.productUrl
    ? `제품 URL: ${input.productUrl}
위 URL에서 제품 정보를 직접 가져와서 분석해주세요.

추가 제품 정보:
${input.productInfo}`
    : `제품 정보:
${input.productInfo}`

  const prompt = `당신은 광고 대본 전문 작가입니다. 다음 제품에 대한 설명 대본을 3가지 스타일로 작성해주세요.

${productSection}

영상 길이: ${input.durationSeconds}초
목표 글자 수: ${minChars}~${maxChars}자 (한국어 기준)
${input.additionalInstructions ? `추가 지시사항: ${input.additionalInstructions}` : ''}

제품 정보 분석 지침:
- 제품명, 브랜드, 가격, 설명, 핵심 특징 등 구조화된 정보가 제공된 경우 이를 활용하세요
- 핵심 특징(셀링 포인트)은 대본에서 중요하게 다뤄야 합니다
- 브랜드와 가격 정보가 있다면 자연스럽게 언급할 수 있습니다

3가지 스타일로 대본을 작성해주세요:

1. **전문적 (formal)**:
   - 신뢰감 있고 전문적인 톤
   - 제품의 기능과 장점을 명확하게 설명
   - 데이터나 수치를 활용
   - 예: "안녕하세요. 오늘 소개해드릴 제품은..."

2. **친근한 (casual)**:
   - 친구에게 추천하는 듯한 자연스러운 대화체
   - 개인적인 경험담 형식
   - 솔직하고 편안한 분위기
   - 예: "이거 진짜 써봤는데요, 솔직히..."

3. **활기찬 (energetic)**:
   - 열정적이고 에너지 넘치는 톤
   - 감탄사와 강조 표현 활용
   - 긍정적이고 신나는 분위기
   - 예: "여러분! 이거 진짜 대박이에요!"

중요 지침:
- 각 대본은 ${minChars}~${maxChars}자 범위 내로 작성
- 자연스럽게 말할 수 있는 구어체로 작성
- 제품의 핵심 가치와 셀링 포인트를 명확히 전달
- 한국어로 작성`

  const tools = input.productUrl
    ? [{ urlContext: {} }, { googleSearch: {} }]
    : undefined

  const config: GenerateContentConfig = {
    tools,
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['productSummary', 'scripts'],
      properties: {
        productSummary: {
          type: Type.STRING,
          description: '제품의 핵심 가치를 2-3문장으로 요약 (한국어)',
        },
        scripts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['style', 'styleName', 'content', 'estimatedDuration'],
            properties: {
              style: {
                type: Type.STRING,
                enum: ['formal', 'casual', 'energetic'],
                description: '대본 스타일 코드',
              },
              styleName: {
                type: Type.STRING,
                description: '스타일 이름 (한국어: 전문적, 친근한, 활기찬)',
              },
              content: {
                type: Type.STRING,
                description: '대본 내용 (한국어)',
              },
              estimatedDuration: {
                type: Type.NUMBER,
                description: '예상 음성 길이 (초)',
              },
            },
          },
        },
      },
    },
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as ProductScriptResult
  } catch {
    // Fallback response
    return {
      productSummary: '제품 정보가 분석되었습니다.',
      scripts: [
        {
          style: 'formal',
          styleName: '전문적',
          content: '안녕하세요. 오늘 소개해드릴 제품에 대해 말씀드리겠습니다. 이 제품은 뛰어난 품질과 성능을 자랑합니다.',
          estimatedDuration: input.durationSeconds,
        },
        {
          style: 'casual',
          styleName: '친근한',
          content: '안녕하세요! 오늘 정말 좋은 제품 하나 소개해드릴게요. 저도 써봤는데 정말 만족스러웠어요.',
          estimatedDuration: input.durationSeconds,
        },
        {
          style: 'energetic',
          styleName: '활기찬',
          content: '여러분! 이거 진짜 대박 제품이에요! 써보시면 왜 이렇게 인기 있는지 바로 아실 거예요!',
          estimatedDuration: input.durationSeconds,
        },
      ],
    }
  }
}

/**
 * 첫 프레임 이미지 생성용 프롬프트를 생성합니다.
 * Seedream 4.5 모델에 최적화된 프롬프트를 생성합니다.
 * 장소 프롬프트가 없으면 제품에 적합한 장소를 자동으로 생성합니다.
 *
 * @param input - 첫 프레임 프롬프트 생성 입력
 * @returns 이미지 생성 프롬프트와 장소 설명
 */
export async function generateFirstFramePrompt(input: FirstFramePromptInput): Promise<FirstFramePromptResult> {
  const locationSection = input.locationPrompt
    ? `사용자가 지정한 장소: ${input.locationPrompt}
위 장소에서 촬영하는 것처럼 묘사해주세요.`
    : `장소가 지정되지 않았습니다. 제품에 가장 적합한 장소를 자동으로 선택해주세요.
예시: 카페, 거실, 사무실, 야외, 스튜디오 등`

  // 카메라 구도 설명 (셀카는 각도별로 세분화)
  const cameraCompositionDescriptions: Record<CameraCompositionType, string> = {
    'selfie-high': '하이앵글 셀카 - 카메라가 얼굴 위쪽에서 아래를 내려다보는 각도 (약 30도 위). 얼굴이 돋보이고 눈이 커보이는 효과. 팔 거리 정도의 가까운 거리.',
    'selfie-front': '정면 셀카 - 눈높이에서 정면으로 촬영하는 각도. 자연스럽고 직접적인 시선 교류. 팔 거리 정도의 가까운 거리.',
    'selfie-side': '측면 셀카 - 약 45도 측면에서 촬영하는 각도. 얼굴 라인이 돋보이고 입체감 있는 구도. 팔 거리 정도의 가까운 거리.',
    tripod: '삼각대 촬영 스타일 - 카메라가 고정된 위치에 설치된 것처럼, 정면에서 안정적인 구도, 허리부터 머리까지 보이는 거리',
    closeup: '클로즈업 - 얼굴과 상체 위주, 표정이 잘 보이는 가까운 거리, 어깨부터 머리까지',
    fullbody: '전신 샷 - 아바타의 전신이 보이는 구도, 발끝부터 머리까지 전체가 프레임에 담김',
  }

  // 셀카 구도인지 확인
  const isSelfieMode = input.cameraComposition?.startsWith('selfie-')

  const cameraSection = input.cameraComposition
    ? `카메라 구도: ${cameraCompositionDescriptions[input.cameraComposition]}
이 구도에 맞게 아바타의 포즈와 카메라 앵글을 설정해주세요.`
    : ''

  const imageReferenceSection = `
중요: 첨부된 이미지들을 주의 깊게 분석해주세요.
- 첫 번째 이미지: 아바타(모델)입니다. 얼굴 특징, 머리 색상/스타일, 피부톤을 정확히 묘사해야 합니다.
${input.productImageUrl ? '- 두 번째 이미지: 제품입니다. 제품의 색상, 형태, 디자인을 정확히 묘사해야 합니다.' : ''}`

  // 셀카 각도별 카메라 설정
  const selfieAngleSettings: Record<string, string> = {
    'selfie-high': 'high angle selfie perspective shot from above eye level (approximately 30 degrees down), looking up at camera',
    'selfie-front': 'eye-level selfie perspective, direct frontal view, intimate distance',
    'selfie-side': 'three-quarter angle selfie perspective (45 degrees from front), showing facial contours',
  }

  // Seedream 4.5 최적화 가이드라인 (포토리얼리즘 강화 + 카메라/손 제거 강화)
  const seedreamGuide = `
=== Seedream 4.5 프롬프트 작성 가이드라인 (포토리얼리즘 필수) ===
ByteDance의 Seedream 4.5 이미지 생성 모델에 최적화된 프롬프트를 작성해야 합니다.
목표: 실제 카메라로 촬영한 것처럼 보이는 100% 포토리얼리스틱 이미지

핵심 원칙:
1. 구조: 주제(subject) → 스타일(style) → 구도(composition) → 조명(lighting) → 기술적 파라미터(technical) 순서
2. 자연어 사용: "주제 + 행동 + 환경"을 자연스러운 문장으로 작성
   - 좋은 예: "A woman in a casual dress holding a skincare product in a modern living room"
   - 나쁜 예: "woman, dress, product, living room, modern" (키워드 나열 금지)
3. 간결성: 50-80단어가 최적. 복잡한 형용사를 쌓지 말고 3-5개의 강력한 서술어만 사용
4. 첫 5-8단어가 가장 중요: 가장 중요한 주제/요소를 맨 앞에 배치
5. 조명 (방향성 필수): "soft natural daylight streaming from large window", "warm studio lighting from the left"
6. 품질 키워드 (간결하게): "Hyperrealistic photograph, 8K RAW quality" (중복 표현 금지)

카메라 스펙 (구도별 설정):
- 셀피-위에서(selfie-high): "${selfieAngleSettings['selfie-high']}, shot on 28mm lens at f/5.6"
- 셀피-정면(selfie-front): "${selfieAngleSettings['selfie-front']}, shot on 35mm lens at f/4"
- 셀피-측면(selfie-side): "${selfieAngleSettings['selfie-side']}, shot on 35mm lens at f/4"
- 삼각대(tripod)/일반: "shot on 50mm lens at f/4" - 배경이 약간 보이면서 주제 강조
- 클로즈업(closeup): "shot on 85mm lens at f/2.8" - 적당한 배경 블러로 얼굴 강조
- 전신(fullbody): "shot on 35mm lens at f/5.6, environmental portrait" - 배경 맥락이 중요

=== 셀피 구도 필수 규칙 (매우 중요 - 반드시 준수) ===
셀피 스타일은 "카메라 앵글"만 셀피처럼 표현하고, 실제 셀카 찍는 동작/장비는 절대 보이지 않아야 합니다.

절대 금지 사항 (프롬프트에 포함하면 안 됨):
- "taking a selfie", "holding phone", "holding camera", "smartphone", "phone in hand"
- "extended arm", "arm reaching out", "selfie stick", "camera visible"
- 손이 카메라를 향해 뻗어있거나 화면 가장자리에 손/팔이 보이는 묘사

올바른 표현 방법:
- "looking directly at camera from ${isSelfieMode ? selfieAngleSettings[input.cameraComposition || 'selfie-front'] : 'eye level'}"
- 모델의 양손은 반드시 제품을 들고 있거나, 자연스러운 포즈(팔짱, 허리에 손 등)
- 화면에는 모델의 상체/얼굴만 보이고, 카메라를 들고 있는 손은 프레임 밖에 있다고 가정
- 첫 문장에 "both hands holding the product" 또는 "hands resting naturally" 명시

셀피 앵글별 구도:
- selfie-high (위에서): 카메라가 얼굴 위 30도에서 내려다보는 각도. 턱선이 슬림해보이고 눈이 커보임.
- selfie-front (정면): 눈높이에서 정면. 가장 자연스럽고 직접적인 시선 교류.
- selfie-side (측면): 45도 측면에서. 얼굴 입체감이 살아나고 세련된 느낌.

배경 심도 가이드:
- UGC/셀피 스타일: 배경이 선명하게 보여야 자연스러움 (shallow DOF, bokeh 사용 금지)
- 전문 촬영 스타일: 약간의 배경 블러 허용 (soft background 정도만)

제품 참조 방식 (중요):
- 제품 이미지가 제공된 경우: 제품명을 직접 쓰지 말고 "the product from the reference image" 형태로 참조

실제 사진처럼 보이게 하는 필수 요소:
- 피부: "natural skin texture with subtle imperfections", "realistic skin with natural pores"
- 머리카락: "individual hair strands catching light", "natural hair texture"
- 눈: "realistic eye reflections with catchlights, natural iris detail"
- 조명: "natural ambient lighting with soft shadows", 과도하게 균일한 조명 피하기
- 환경: 실제 장소의 디테일 (가구, 소품, 창문 등)을 구체적으로 묘사`

  const prompt = `당신은 Seedream 4.5 이미지 생성 모델을 위한 프롬프트 전문가입니다.
**제품 설명 토킹 영상의 첫 프레임** 이미지 생성을 위한 프롬프트를 작성해주세요.

⚠️ 중요: 이것은 정적인 광고 포스터가 아닙니다!
- 제품을 설명하는 토킹 영상의 시작 장면입니다
- 모델이 곧 카메라를 향해 말을 시작할 것 같은 자연스러운 순간을 포착해야 합니다
- 광고 포스터처럼 과장된 포즈나 텍스트 오버레이 없이 자연스럽게
- UGC/인플루언서 영상 스타일로, 친근하고 편안한 느낌

${seedreamGuide}

제품 정보:
${input.productInfo}

(참고: 제품명, 설명, 핵심 특징 등 구조화된 정보가 포함될 수 있습니다. 이를 참고하여 제품의 특성에 맞는 이미지를 구성하세요.)

${locationSection}

${cameraSection}

${imageReferenceSection}

요구사항 (토킹 영상 첫 프레임):
1. 아바타가 카메라를 정면으로 바라보며 막 말을 시작하려는 자연스러운 표정 (밝고 친근한 미소)
2. 제품을 양손으로 들거나 옆에 자연스럽게 배치 (제품 특성에 맞게)
3. 세로 비율(9:16) 구도 - 영상용
4. 유튜브/SNS 영상 촬영에 어울리는 자연스러운 조명
5. UGC/인플루언서 영상 스타일의 포토리얼리스틱 이미지 (광고 포스터 스타일 금지)
${input.cameraComposition ? `6. 지정된 카메라 구도(${input.cameraComposition})를 반드시 반영` : ''}
${isSelfieMode ? `7. [필수] 셀피 구도이지만 카메라/스마트폰/손이 화면에 절대 보이지 않아야 함. 모델의 양손은 제품을 들고 있거나 자연스러운 포즈.` : ''}

프롬프트 작성 지침 (Seedream 4.5 포토리얼리즘 최적화):
- 영어로 작성, 50-80단어 권장 (최대 100단어)
- 첫 문장에 가장 중요한 주제(아바타+제품)를 배치
- 자연스러운 문장 형태로 작성 (키워드 나열 금지)
${isSelfieMode ? `- 셀피 구도 시 반드시 "both hands holding the product" 또는 "hands visible and natural pose" 포함` : ''}

카메라 스펙 (구도에 따라 선택):
- 셀피-위에서(selfie-high): "${selfieAngleSettings['selfie-high']}" + 배경 선명하게
- 셀피-정면(selfie-front): "${selfieAngleSettings['selfie-front']}" + 배경 선명하게
- 셀피-측면(selfie-side): "${selfieAngleSettings['selfie-side']}" + 배경 선명하게
- 삼각대(tripod)/일반: "shot on 50mm lens at f/4" + 배경 약간 보이게
- 클로즈업(closeup): "shot on 85mm lens at f/2.8" + 배경 soft blur 허용
- 전신(fullbody): "shot on 35mm lens at f/5.6, environmental portrait" + 배경 맥락 중요

포토리얼리즘 필수 요소:
- 조명 (방향성 포함): "soft natural daylight streaming from large window"
- 피부: "natural skin texture with subtle imperfections" (과도하게 완벽한 피부 금지)
- 눈: "realistic eye reflections with catchlights"
- 마지막에 품질 키워드: "Hyperrealistic photograph, 8K RAW quality"

제품 참조: 브랜드명/제품명 대신 "the product from the reference image" 형태로 작성

절대 피해야 할 것:
- 셀피/UGC 스타일에서 "shallow depth of field", "creamy bokeh" 사용 금지 (배경이 과하게 흐려짐)
- "taking a selfie", "holding phone", "smartphone", "camera in hand" 등 카메라/폰 관련 표현
- "extended arm", "arm reaching forward" 등 팔이 카메라 쪽으로 뻗는 묘사
- 화면 가장자리에 손/팔이 잘려 보이는 묘사
- 중복 표현, 과도하게 완벽한 피부`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['prompt', 'locationDescription'],
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'Seedream 4.5 포토리얼리즘 프롬프트 (영어, 50-80단어, 카메라 스펙/방향성 있는 조명/제품은 참조 형태로)',
        },
        locationDescription: {
          type: Type.STRING,
          description: '사용된 장소 설명 (한국어, 예: "밝은 조명의 현대적인 거실")',
        },
      },
    },
  }

  // Build multimodal contents
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Avatar image is required
  const avatarImageData = await fetchImageAsBase64(input.avatarImageUrl)
  if (avatarImageData) {
    parts.push({
      inlineData: {
        mimeType: avatarImageData.mimeType,
        data: avatarImageData.base64,
      },
    })
  }

  // Product image is optional
  if (input.productImageUrl) {
    const productImageData = await fetchImageAsBase64(input.productImageUrl)
    if (productImageData) {
      parts.push({
        inlineData: {
          mimeType: productImageData.mimeType,
          data: productImageData.base64,
        },
      })
    }
  }

  // Add text prompt
  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as FirstFramePromptResult
  } catch {
    // Seedream 4.5 포토리얼리즘 최적화 폴백 응답 (양손으로 제품 들고 있는 구도 - 카메라/폰 안보임)
    const fallbackPrompt = isSelfieMode
      ? `A young woman with natural skin texture and subtle imperfections holds the product from the reference image with both hands clearly visible, ${selfieAngleSettings[input.cameraComposition || 'selfie-front']} in a bright modern living room. Looking directly at the camera with realistic eye reflections and natural iris detail. Individual hair strands catching soft natural daylight from large window. The background shows clear details of minimalist furniture. Natural ambient lighting with soft shadows. Vertical 9:16 composition. Hyperrealistic photograph, 8K RAW quality.`
      : 'A young woman with natural skin texture and subtle imperfections holds the product from the reference image with both hands in a bright modern living room, looking directly at the camera with realistic eye reflections and natural iris detail. Individual hair strands catching soft natural daylight streaming from large window, creating gentle shadows. The background shows clear details of minimalist furniture and decor. Shot on 50mm lens at f/4. Vertical 9:16 composition. Hyperrealistic photograph, 8K RAW quality.'

    return {
      prompt: fallbackPrompt,
      locationDescription: input.locationPrompt || '밝은 자연광이 들어오는 현대적인 거실',
    }
  }
}

/**
 * 광고 배경 이미지 생성용 프롬프트를 최적화합니다.
 * z-image-turbo 모델에 최적화된 프롬프트를 생성합니다.
 *
 * @param input - 배경 프롬프트 생성 입력
 * @returns 최적화된 프롬프트와 한국어 설명
 */
export async function generateBackgroundPrompt(input: BackgroundPromptInput): Promise<BackgroundPromptResult> {
  // 모드별 프롬프트 구성
  let modeSection = ''

  if (input.mode === 'PRODUCT') {
    modeSection = `제품 기반 배경 생성 모드입니다.
제품명: ${input.productName || '미입력'}
제품 설명: ${input.productDescription || '미입력'}
${input.productImageUrl ? '첨부된 제품 이미지를 분석하여 제품에 어울리는 배경을 설계해주세요.' : ''}

제품의 특성, 용도, 타겟 고객을 고려하여 광고에 적합한 배경을 생성해주세요.`

  } else if (input.mode === 'OPTIONS') {
    const opts = input.options || {}
    modeSection = `옵션 선택 기반 배경 생성 모드입니다.
선택된 옵션:
- 스타일: ${opts.style || '자동'}
- 장소: ${opts.location || '자동'}
- 분위기: ${opts.mood || '자동'}
- 주요 색상: ${opts.color || '자동'}
- 시간대: ${opts.time || '자동'}

위 옵션들을 조합하여 조화로운 배경을 생성해주세요.`

  } else if (input.mode === 'PROMPT') {
    modeSection = `직접 프롬프트 입력 모드입니다.
사용자 입력:
"${input.userPrompt || ''}"

위 입력을 z-image-turbo 모델에 최적화된 영어 프롬프트로 변환해주세요.`
  }

  const prompt = `당신은 AI 이미지 생성 프롬프트 전문가입니다.
광고 배경 이미지 생성을 위한 프롬프트를 최적화해주세요.

${modeSection}

화면 비율: ${input.aspectRatio || '16:9'}

=== z-image-turbo 프롬프트 최적화 가이드라인 ===

z-image-turbo는 ByteDance의 초고속 이미지 생성 모델입니다.
광고 배경에 적합한 고품질 이미지를 생성할 수 있습니다.

프롬프트 작성 원칙:
1. 영어로 작성 (한국어 입력도 영어로 번역)
2. 40-80 단어로 간결하게 작성
3. 구조: 장면 설명 → 스타일 → 조명 → 기술적 품질
4. 사람이나 제품을 포함하지 않음 (순수 배경만)
5. 광고 배경에 적합한 깔끔하고 전문적인 느낌

필수 포함 요소:
- 장면/환경 설명 (예: modern minimalist studio, luxurious marble surface)
- 조명 설명 (예: soft diffused lighting, dramatic side lighting)
- 색상 톤 (예: neutral tones, warm amber hues)
- 품질 키워드: "professional photography, high-end commercial, 8K quality"

피해야 할 것:
- 사람, 손, 얼굴 등 인물 요소
- 특정 브랜드명이나 로고
- 텍스트나 글자
- 과도하게 복잡한 장면

예시 프롬프트:
"A pristine white marble surface with subtle gold veining, bathed in soft diffused lighting from above. Clean minimalist composition with gentle shadows. Warm neutral tones with hints of cream. Professional product photography backdrop, high-end commercial aesthetic, 8K quality, sharp focus."`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['optimizedPrompt', 'koreanDescription'],
      properties: {
        optimizedPrompt: {
          type: Type.STRING,
          description: 'z-image-turbo용 최적화된 영어 프롬프트 (40-80 단어)',
        },
        koreanDescription: {
          type: Type.STRING,
          description: '생성될 배경 이미지에 대한 한국어 설명 (1-2문장)',
        },
      },
    },
  }

  // Build multimodal contents
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Product image for PRODUCT mode
  if (input.mode === 'PRODUCT' && input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }

  // Add text prompt
  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as BackgroundPromptResult
  } catch {
    // Fallback response
    return {
      optimizedPrompt: 'A clean minimalist white surface with soft gradient lighting from above. Subtle shadows create depth and dimension. Neutral tones with a professional commercial aesthetic. Perfect for product photography, high-end advertising backdrop, 8K quality, sharp focus.',
      koreanDescription: '깔끔한 미니멀리즘 스타일의 흰색 배경, 부드러운 조명이 제품을 돋보이게 합니다.',
    }
  }
}

/**
 * 이미지 광고용 프롬프트를 Gemini로 최적화하여 생성합니다.
 * Seedream 4.5 모델에 최적화된 프롬프트를 생성합니다.
 *
 * @param input - 이미지 광고 프롬프트 생성 입력
 * @returns 최적화된 프롬프트와 한국어 설명
 */
export async function generateImageAdPrompt(input: ImageAdPromptInput): Promise<ImageAdPromptResult> {
  // 광고 유형별 한국어 설명
  const adTypeDescriptions: Record<ImageAdType, string> = {
    productOnly: '제품 단독 촬영 (제품만 강조하는 프로페셔널 제품 사진)',
    holding: '들고 있는 샷 (모델이 제품을 자연스럽게 들고 있는 광고)',
    using: '사용 중인 샷 (모델이 제품을 실제로 사용하는 모습)',
    wearing: '착용샷 (모델이 의상/액세서리를 착용한 패션 광고)',
    beforeAfter: '비포/애프터 (사용 전후 비교 이미지)',
    lifestyle: '라이프스타일 (일상에서 제품과 함께하는 자연스러운 모습)',
    unboxing: '언박싱 (제품을 개봉하거나 소개하는 리뷰 스타일)',
    comparison: '비교 (제품 비교 스타일 광고)',
    seasonal: '시즌/테마 (계절감이나 특별한 테마가 있는 광고)',
  }

  // 옵션을 한국어 설명으로 변환
  const optionDescriptions = Object.entries(input.selectedOptions)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')

  // 제품 정보 섹션
  const productSection = input.productName
    ? `제품 정보:
- 제품명: ${input.productName}
- 설명: ${input.productDescription || '없음'}`
    : '제품 정보: 첨부된 이미지 참고'

  // 이미지 첨부 순서 계산 (IMAGE1, IMAGE2 형태로 명확히 인덱싱)
  let imageIndex = 1
  const productImageIndex = input.productImageUrl ? imageIndex++ : null
  const avatarImageIndices = input.avatarImageUrls?.length ? Array.from({ length: input.avatarImageUrls.length }, () => imageIndex++) : []
  const outfitImageIndex = input.outfitImageUrl ? imageIndex++ : null
  const referenceStyleImageIndex = input.referenceStyleImageUrl ? imageIndex++ : null

  // 이미지 참조 안내 (IMAGE1, IMAGE2 형태로 명확히 구분)
  const imageReferenceSection = `
=== ATTACHED IMAGES GUIDE ===
${productImageIndex ? `[IMAGE${productImageIndex}] = PRODUCT IMAGE
- This is the product to advertise. Describe its color, shape, texture, and design accurately.
- IMPORTANT: The product may be a figurine, doll, character merchandise, or statue that has human-like form. Even if it looks like a person, it is a PRODUCT, NOT a real human model. Do NOT transform or animate it into a real person.
- Reference as "the product in IMAGE${productImageIndex}" in your prompt.` : ''}
${avatarImageIndices.length ? `[IMAGE${avatarImageIndices.join('], [IMAGE')}] = MODEL IMAGE(S) (${avatarImageIndices.length} image${avatarImageIndices.length > 1 ? 's' : ''})
- This is the human model for the advertisement. Describe their appearance, skin tone, hairstyle, and expression accurately.
- Reference as "the model in IMAGE${avatarImageIndices[0]}" in your prompt.` : ''}
${outfitImageIndex ? `[IMAGE${outfitImageIndex}] = OUTFIT IMAGE
- This shows the clothing/outfit the model should wear. Describe its color, style, and details.
- Reference as "the outfit in IMAGE${outfitImageIndex}" in your prompt.` : ''}
${referenceStyleImageIndex ? `[IMAGE${referenceStyleImageIndex}] = STYLE REFERENCE IMAGE (Style only!)
- Use ONLY for mood, color palette, lighting, and composition style.
- DO NOT copy any products or people from this image! Extract only abstract style elements.
- Reference as "the style of IMAGE${referenceStyleImageIndex}" in your prompt.` : ''}`

  const prompt = `당신은 Seedream 4.5 이미지 생성 모델을 위한 광고 프롬프트 전문가입니다.
최고 품질의 상업 광고 이미지를 생성하기 위한 프롬프트를 작성해주세요.

=== Seedream 4.5 프롬프트 최적화 가이드라인 ===

ByteDance의 Seedream 4.5 이미지 편집/합성 모델에 최적화된 프롬프트를 작성합니다.
이 모델은 참조 이미지의 요소들을 조합하여 새로운 이미지를 생성합니다.

핵심 원칙:
1. 구조: 주제(subject) → 행동(action) → 환경(environment) → 스타일(style) → 조명(lighting) → 기술적 품질
2. 자연어 문장으로 작성 (키워드 나열 금지)
3. 첫 5-8단어가 가장 중요 - 핵심 주제를 맨 앞에
4. 50-100 단어가 최적
5. 참조 이미지 요소는 IMAGE 인덱스로 명확히 지칭 (예: "the product in IMAGE1", "the model in IMAGE2")

광고 유형별 핵심 요소:
- productOnly: 제품 중심, 깔끔한 배경, 제품 디테일 강조
- holding: 모델이 제품을 자연스럽게 들고 있음, 시선 처리, 손 포즈
- using: 제품 사용 동작, 자연스러운 상황, 제품 효과 암시
- wearing: 패션 스타일, 전신 또는 상반신, 의상 핏 강조
- lifestyle: 일상적 환경, 자연스러운 포즈, 제품과의 조화
- unboxing: 개봉 동작, 기대감 표현, 제품 첫인상
- beforeAfter: 대비 구도, 변화 강조, 명확한 차이
- comparison: 나란히 배치, 차이점 부각
- seasonal: 계절 분위기, 테마 장식, 특별한 무드

포토리얼리즘 필수 요소 (AI 생성 티가 나지 않도록 반드시 포함):
- 카메라 스펙: "Shot on [렌즈mm] lens at f/[조리개값]" (예: "Shot on 35mm lens at f/2.8", "Shot on 85mm lens at f/1.8")
- 피부: "natural skin texture with visible pores and subtle imperfections" (매끄럽지 않은 자연스러운 피부)
- 눈: "realistic eye reflections with catchlights" (눈에 빛 반사)
- 조명 방향: "soft natural daylight from [방향]" (예: "streaming from a side window", "from large window on the left")
- 머리카락: "individual hair strands catching light naturally"
- 품질: "Hyperrealistic photograph, 8K RAW quality"

프롬프트 예시:
"The model in IMAGE2 looks directly into the camera from a [앵글] angle, holding the product in IMAGE1 near her face. She is in a [장소] with [조명 설명]. Shot on [렌즈]mm lens at f/[조리개], showing natural skin texture with visible pores and realistic eye reflections. Hyperrealistic photograph, 8K RAW quality."

⚠️ 피규어/캐릭터 상품 주의:
- IMAGE1(제품)이 피규어, 인형, 캐릭터 상품, 조각상 등 인물 형태인 경우가 있습니다.
- 이 경우 제품을 실제 사람으로 변환하거나 애니메이션화하지 마세요.
- 제품은 그대로 "제품"으로 유지하고, 모델(IMAGE2)이 들거나 보여주는 형태로 광고하세요.

제품 로고/라벨 보존 (중요):
- 제품 이미지(IMAGE1)에 있는 로고, 라벨, 브랜드 마크는 반드시 그대로 유지
- "Preserve all existing logos, labels, and brand marks on the product in IMAGE1"
- 제품의 패키지 디자인, 라벨 텍스트, 브랜드 로고는 원본 그대로 표현

절대 금지:
- 새로운 텍스트, 워터마크, 오버레이 추가
- 이미지에 존재하지 않는 새로운 글자나 숫자 생성
- 브랜드명을 텍스트로 직접 추가 (참조 이미지에 있는 것만 유지)

=== 참조 스타일 이미지 처리 (해당 시) - 매우 중요! ===

참조 스타일 이미지가 제공된 경우, 생성되는 이미지가 참조 이미지와 **시각적으로 매우 유사하게** 느껴지도록 해야 합니다.

🔍 1. 참조 이미지에서 다음 스타일 요소를 **상세하게** 분석하고 추출합니다:

   [색상 분석 - Color Analysis]
   - 지배적인 색상 (dominant colors): 이미지에서 가장 많이 차지하는 색상들
   - 색상 온도 (color temperature): warm/cool/neutral - 구체적인 온도감
   - 채도 수준 (saturation): 높음/중간/낮음/음소거된 톤
   - 대비 수준 (contrast): 높은 대비/낮은 대비/부드러운 대비
   - 색상 그레이딩 (color grading): 특정 색상 쪽으로 틸트된 느낌 (예: 청록색 그림자, 오렌지빛 하이라이트)
   - 검정색 수준 (black levels): 깊은 검정/들린 검정/밀키한 그림자

   [조명 분석 - Lighting Analysis]
   - 광원 방향: 정면/측면/후면/상단/하단 (구체적 각도)
   - 광원 유형: 자연광/인공광/스튜디오/창문광
   - 조명 품질: hard/soft - 그림자의 경계가 날카로운지 부드러운지
   - 그림자 특성: 그림자의 깊이, 색상, 부드러움
   - 하이라이트 특성: 스페큘러 하이라이트의 강도와 위치
   - 광비 (lighting ratio): 밝은 부분과 어두운 부분의 비율

   [분위기 분석 - Mood/Atmosphere]
   - 전체적인 무드: 따뜻한/차가운/고급스러운/캐주얼/드라마틱/미니멀
   - 감성적 톤: 행복한/차분한/에너지틱/로맨틱/프로페셔널
   - 시각적 밀도: 복잡한/심플한/미니멀

   [구도 분석 - Composition]
   - 여백 사용: 여백이 많은/빽빽한/균형잡힌
   - 주체 배치: 중앙/삼등분/대칭/비대칭
   - 피사계 심도: 얕은/깊은 - 배경 흐림 정도

   [텍스처 분석 - Texture/Finish]
   - 전체적인 질감: 매끈한/입자감 있는/필름 그레인
   - 선명도: 날카로운/부드러운 포커스

2. ⭐ 추출된 스타일을 프롬프트에 **매우 구체적으로** 통합합니다:

   나쁜 예: "warm lighting with nice colors"
   좋은 예: "warm golden hour color palette with orange-tinted highlights and lifted shadows creating a nostalgic film-like look, soft diffused lighting from the left at 45-degree angle with gentle wrap-around fill, low contrast with muted saturation reminiscent of Kodak Portra 400 film"

3. 반드시 프롬프트에 포함할 스타일 문구 형식:
   "[색온도] color palette with [색상 특성], [조명 방향] lighting creating [그림자 특성], [대비 수준] contrast with [채도 특성], [전체 무드] atmosphere"

4. ⚠️ 절대 금지:
   - 참조 이미지의 제품, 모델, 구체적인 피사체를 프롬프트에 포함하지 마세요
   - 참조 이미지에 있는 특정 브랜드, 로고, 텍스트를 복사하지 마세요
   - 오직 추상적인 스타일/분위기 요소만 추출하여 사용하세요

=== 생성 요청 ===

광고 유형: ${input.adType} (${adTypeDescriptions[input.adType]})

${productSection}

선택된 옵션: ${optionDescriptions || '기본값'}

${input.additionalPrompt ? `추가 요청: ${input.additionalPrompt}` : ''}

${imageReferenceSection}

위 정보를 바탕으로 Seedream 4.5에 최적화된 영어 프롬프트를 생성해주세요.
프롬프트는 첨부된 참조 이미지들의 요소를 조합하여 새로운 광고 이미지를 만들도록 해야 합니다.

중요:
1. 각 이미지는 IMAGE1, IMAGE2 형태로 명확히 참조하세요 (예: "the product in IMAGE1", "the model in IMAGE2").
2. 제품의 기존 로고/라벨 보존을 위해 "Preserve all existing logos, labels, and brand marks on the product in IMAGE1." 문구를 반드시 포함하세요.
3. 새로운 텍스트 추가 방지를 위해 "Do not add any new text, watermarks, or overlays." 문구를 포함하세요.
4. 제품(IMAGE1)이 피규어/인형/캐릭터 상품처럼 인물 형태인 경우, 이를 실제 사람으로 변환하지 말고 제품 그대로 유지하세요.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['optimizedPrompt', 'koreanDescription'],
      properties: {
        optimizedPrompt: {
          type: Type.STRING,
          description: 'Seedream 4.5 최적화 영어 프롬프트 (50-100 단어, 제품 로고 보존 문구와 새 텍스트 금지 문구 필수 포함)',
        },
        koreanDescription: {
          type: Type.STRING,
          description: '생성될 이미지에 대한 한국어 설명 (1-2문장)',
        },
      },
    },
  }

  // Build multimodal contents
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Product image
  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }

  // Avatar images
  if (input.avatarImageUrls?.length) {
    for (const avatarUrl of input.avatarImageUrls) {
      const imageData = await fetchImageAsBase64(avatarUrl)
      if (imageData) {
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.base64,
          },
        })
      }
    }
  }

  // Outfit image (for wearing type)
  if (input.outfitImageUrl) {
    const imageData = await fetchImageAsBase64(input.outfitImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }

  // Reference style image (for style/mood reference only)
  if (input.referenceStyleImageUrl) {
    const imageData = await fetchImageAsBase64(input.referenceStyleImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }

  // Add text prompt
  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as ImageAdPromptResult
  } catch {
    // Fallback response based on ad type (enhanced photorealism + preserve product logos)
    const logoPreserve = 'Preserve all existing logos, labels, and brand marks on the product exactly as shown in the reference image. Do not add any new text, watermarks, or overlays that are not present in the original reference image.'
    const fallbackPrompts: Record<ImageAdType, string> = {
      productOnly: `Professional product photography of the product from the reference image on a clean white studio background. Soft diffused lighting from above creates subtle shadows and highlights product details. Shot on 50mm lens at f/2.8. Commercial advertisement quality with sharp focus. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
      holding: `The model from the reference image naturally holds the product from the reference near her face, looking directly into the camera with a warm genuine smile. Shot on 35mm lens at f/2.8. Natural skin texture with visible pores and subtle imperfections, realistic eye reflections with catchlights. Soft studio lighting from the left creates gentle shadows. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
      using: `The model from the reference image actively uses and demonstrates the product from the reference in a bright modern setting. Genuine expression showing satisfaction. Shot on 35mm lens at f/4.0. Natural skin texture with visible pores, realistic eye reflections. Soft natural daylight streaming from a side window. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
      wearing: `Fashion advertisement featuring the model from the reference wearing the outfit from the reference image. Full body shot in clean studio setting. Model strikes a confident pose showing the clothing fit and style. Shot on 85mm lens at f/2.0. Natural skin texture with visible pores, realistic eye reflections with catchlights. Professional fashion photography lighting from the front. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
      beforeAfter: `Before and after comparison layout showing transformation effect. Clean consistent lighting on both sides. Shot on 50mm lens at f/4.0. Natural skin texture with visible pores in both frames. Clear visual difference highlighting the product benefit. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
      lifestyle: `Lifestyle advertisement showing the model from the reference naturally incorporating the product into their daily routine in a cozy home setting. Authentic candid moment. Shot on 35mm lens at f/2.8. Natural skin texture with visible pores, realistic eye reflections. Natural daylight streaming through window creates warm inviting atmosphere. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
      unboxing: `The model from the reference excitedly reveals and presents the product from the reference, looking at the camera with genuine enthusiasm. Unboxing style shot on a clean desk setup. Shot on 28mm lens at f/3.5. Natural skin texture with visible pores, realistic eye reflections with catchlights. Soft natural daylight from window. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
      comparison: `Product comparison layout with the product from the reference prominently displayed. Side by side arrangement on clean neutral background. Shot on 50mm lens at f/4.0. Clear professional lighting highlighting product features and textures. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
      seasonal: `Seasonal themed advertisement featuring the product from the reference with festive decorations and warm atmosphere. Cozy seasonal setting with appropriate props. Shot on 35mm lens at f/2.8. Warm lighting mood with natural shadows. ${logoPreserve} Hyperrealistic photograph, 8K RAW quality.`,
    }

    return {
      optimizedPrompt: fallbackPrompts[input.adType] || fallbackPrompts.productOnly,
      koreanDescription: `${adTypeDescriptions[input.adType]} 스타일의 광고 이미지가 생성됩니다.`,
    }
  }
}

/**
 * 참조 스타일 이미지를 분석하여 카테고리 옵션을 추출합니다.
 * 이미지의 스타일, 분위기, 구도 등을 분석하여 해당하는 옵션을 자동으로 선택합니다.
 *
 * @param input - 참조 스타일 분석 입력
 * @returns 분석된 옵션 값들과 스타일 설명
 */
export async function analyzeReferenceStyleImage(input: ReferenceStyleAnalysisInput): Promise<ReferenceStyleAnalysisResult> {
  // 옵션 목록을 프롬프트용 텍스트로 변환
  const optionsDescription = input.availableOptions
    .map(opt => `- ${opt.key}: [${opt.options.join(', ')}]`)
    .join('\n')

  // 광고 유형 목록
  const adTypeDescriptions = {
    productOnly: '제품 단독 - 제품만 보이는 스튜디오 촬영',
    holding: '들고 있는 샷 - 모델이 제품을 손에 들고 있는 포즈',
    using: '사용 중인 샷 - 모델이 제품을 사용/적용하는 모습',
    wearing: '착용샷 - 모델이 의류/액세서리를 착용한 모습',
    beforeAfter: '비포/애프터 - 제품 사용 전후 비교',
    lifestyle: '라이프스타일 - 일상 속에서 제품을 사용하는 장면',
    unboxing: '언박싱 - 제품 개봉/공개 장면',
    comparison: '비교 - 여러 제품 비교',
    seasonal: '시즌/테마 - 계절이나 특정 테마에 맞춘 광고',
  }

  const prompt = `당신은 광고 이미지 분석 전문가입니다.
첨부된 참조 이미지를 분석하여, 해당 이미지의 스타일/분위기 요소를 추출하고
주어진 옵션 목록에서 가장 적합한 값을 선택하거나 직접 입력 값을 제안해주세요.

=== 분석 대상 이미지 ===
첨부된 이미지를 분석해주세요.

=== 현재 선택된 광고 유형 ===
${input.adType}

=== 사용 가능한 광고 유형들 ===
${Object.entries(adTypeDescriptions).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}

=== 사용 가능한 옵션 목록 ===
각 옵션 그룹에 대해 프리셋 값이 제공됩니다. 이미지와 가장 잘 맞는 값을 선택하세요.
프리셋 중 적합한 것이 없다면 커스텀(직접 입력) 값을 제안하세요.

${optionsDescription}

=== 분석 지침 ===

1. **광고 유형 분석 (가장 중요!)**:
   이미지가 어떤 광고 유형에 가장 적합한지 판단하세요.
   - 이미지에 사람이 있는지, 제품만 있는지
   - 사람이 있다면 제품을 어떻게 다루고 있는지 (들고 있음, 사용 중, 착용 중, 언박싱 등)
   - 배경/컨텍스트가 라이프스타일인지, 스튜디오인지
   - 비교 구도인지, 비포/애프터 구도인지

2. 이미지에서 다음 요소들을 **상세하게** 분석하세요:

   [기본 옵션 분석]
   - 포즈/동작 (pose): 모델의 자세, 몸짓
   - 시선 방향 (gaze): 모델의 눈이 향하는 방향 (카메라, 제품, 다른 곳, 아래, 위)
   - 배경 (background/setting): 촬영 장소, 환경
   - 표정 (expression): 얼굴 표정, 감정
   - 프레이밍 (framing): 카메라 구도, 거리
   - 조명 (lighting): 빛의 방향, 강도, 색온도
   - 분위기 (mood): 전체적인 느낌, 감성
   - 스타일 (style): 촬영 스타일, 톤앤매너

   [심층 스타일 분석 - suggestedPrompt에 반영할 내용]
   - 색상 분석: 지배적 색상, 색온도 (warm/cool/neutral), 채도 수준, 대비 수준
   - 색상 그레이딩: 그림자와 하이라이트의 색조 틴트
   - 조명 품질: hard light vs soft light, 그림자 경계의 선명도
   - 광원 방향: 구체적인 각도 (예: 45도 측면광)
   - 피사계 심도: 배경 흐림 정도
   - 텍스처/질감: 필름 그레인, 선명도 등

3. 각 옵션 그룹에 대해:
   - 프리셋 목록에서 가장 적합한 값이 있으면 type: "preset"으로 선택
   - 프리셋 중 적합한 것이 없거나 더 구체적인 설명이 필요하면 type: "custom"으로 직접 입력
   - confidence: 해당 분석의 확신도 (0.0 ~ 1.0)

4. **suggestedPrompt 작성 (매우 중요!)**:
   참조 이미지의 스타일을 최대한 유사하게 재현하기 위한 상세한 스타일 설명을 작성하세요.

   포함해야 할 내용:
   - 색온도와 색감 특성 (예: "warm golden tones with orange-tinted highlights")
   - 조명 방향과 품질 (예: "soft diffused lighting from the left at 45-degree angle")
   - 대비와 채도 (예: "low contrast with muted saturation")
   - 그림자 특성 (예: "lifted shadows creating a film-like look")
   - 전체 무드 (예: "intimate cozy atmosphere")

   좋은 예시:
   "warm golden hour color palette with soft orange-tinted highlights and slightly lifted shadows, diffused lighting from the upper left creating gentle wrap-around illumination, low-medium contrast with slightly desaturated colors, intimate and cozy atmosphere with shallow depth of field"

5. overallStyle은 한국어로 전체적인 스타일을 1-2문장으로 설명합니다.

주의사항:
- 이미지의 제품이나 모델 자체를 복사하지 마세요
- 오직 스타일, 분위기, 구도, 조명 등 추상적 요소만 분석하세요
- 한국어로 설명을 작성하세요 (suggestedPrompt는 영어)
- 추천 광고 유형이 현재 선택된 유형과 다르면 반드시 recommendedAdType을 채워주세요`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['analyzedOptions', 'overallStyle', 'suggestedPrompt'],
      properties: {
        analyzedOptions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['key', 'type', 'value', 'confidence'],
            properties: {
              key: {
                type: Type.STRING,
                description: '옵션 그룹 키 (예: pose, background, expression)',
              },
              type: {
                type: Type.STRING,
                enum: ['preset', 'custom'],
                description: '프리셋 선택 또는 직접 입력',
              },
              value: {
                type: Type.STRING,
                description: '선택된 프리셋 키 또는 커스텀 설명',
              },
              customText: {
                type: Type.STRING,
                nullable: true,
                description: '커스텀인 경우 상세 설명 (한국어)',
              },
              confidence: {
                type: Type.NUMBER,
                description: '확신도 (0.0 ~ 1.0)',
              },
            },
          },
        },
        overallStyle: {
          type: Type.STRING,
          description: '이미지의 전체적인 스타일/분위기 설명 (한국어, 1-2문장)',
        },
        suggestedPrompt: {
          type: Type.STRING,
          description: '참조 이미지의 스타일을 상세하게 설명하는 영어 프롬프트 (색온도, 조명, 대비, 채도, 분위기 포함). 예: "warm golden hour color palette with soft orange-tinted highlights and slightly lifted shadows, diffused lighting from the upper left, low-medium contrast with slightly desaturated colors, intimate cozy atmosphere"',
        },
        recommendedAdType: {
          type: Type.STRING,
          nullable: true,
          enum: ['productOnly', 'holding', 'using', 'wearing', 'beforeAfter', 'lifestyle', 'unboxing', 'comparison', 'seasonal'],
          description: '이미지에 가장 적합한 광고 유형 (현재 선택과 다를 경우에만)',
        },
        adTypeMatchConfidence: {
          type: Type.NUMBER,
          nullable: true,
          description: '추천 광고 유형 확신도 (0.0 ~ 1.0)',
        },
        adTypeMatchReason: {
          type: Type.STRING,
          nullable: true,
          description: '추천 이유 (한국어, 예: "이미지에 모델이 제품을 들고 있어 holding 유형이 더 적합합니다")',
        },
      },
    },
  }

  // Build multimodal contents
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Add reference image
  const imageData = await fetchImageAsBase64(input.imageUrl)
  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: imageData.mimeType,
        data: imageData.base64,
      },
    })
  }

  // Add text prompt
  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as ReferenceStyleAnalysisResult
  } catch {
    // Fallback response
    return {
      analyzedOptions: [],
      overallStyle: '이미지 분석에 실패했습니다.',
      suggestedPrompt: '',
    }
  }
}

// ============================================================
// AI 아바타 프롬프트 생성 (GPT-Image용)
// ============================================================

/** AI 아바타 프롬프트 생성 입력 */
export interface AiAvatarPromptInput {
  productInfo: string              // 제품 정보
  productImageUrl?: string         // 제품 이미지 URL (선택)
  locationPrompt?: string          // 장소 지정 (선택)
  cameraComposition?: CameraCompositionType  // 카메라 구도 (선택)
  targetGender?: 'male' | 'female' | 'any'  // 타겟 성별 (선택)
  targetAge?: 'young' | 'middle' | 'mature' | 'any'  // 타겟 연령대 (선택)
  style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'  // 스타일 (선택)
  ethnicity?: 'korean' | 'asian' | 'western' | 'any'  // 인종 (선택)
}

/** AI 아바타 프롬프트 생성 결과 */
export interface AiAvatarPromptResult {
  prompt: string                   // GPT-Image용 이미지 생성 프롬프트 (아바타 포함)
  avatarDescription: string        // 생성될 아바타 설명 (한국어)
  locationDescription: string      // 장소 설명 (한국어)
}

/**
 * AI 아바타 프롬프트 생성
 *
 * 제품 정보를 바탕으로 제품에 어울리는 가상 아바타와 배경을 포함한
 * GPT-Image 1.5용 이미지 생성 프롬프트를 생성합니다.
 *
 * @param input - AI 아바타 프롬프트 생성 입력
 * @returns 이미지 생성 프롬프트와 아바타/장소 설명
 */
export async function generateAiAvatarPrompt(input: AiAvatarPromptInput): Promise<AiAvatarPromptResult> {
  const genderMap: Record<string, string> = {
    male: '남성',
    female: '여성',
    any: '성별 무관',
  }

  const ageMap: Record<string, string> = {
    young: '20-30대',
    middle: '30-40대',
    mature: '40-50대',
    any: '연령대 무관',
  }

  const styleMap: Record<string, string> = {
    natural: '자연스럽고 친근한',
    professional: '전문적이고 세련된',
    casual: '캐주얼하고 편안한',
    elegant: '우아하고 고급스러운',
    any: '스타일 무관',
  }

  const ethnicityMap: Record<string, string> = {
    korean: '한국인',
    asian: '아시아인',
    western: '서양인',
    any: '인종 무관',
  }

  const locationSection = input.locationPrompt
    ? `사용자가 지정한 장소: ${input.locationPrompt}`
    : `장소가 지정되지 않았습니다. 제품에 가장 적합한 장소를 선택해주세요.`

  const targetGenderText = genderMap[input.targetGender || 'any']
  const targetAgeText = ageMap[input.targetAge || 'any']
  const styleText = styleMap[input.style || 'any']
  const ethnicityText = ethnicityMap[input.ethnicity || 'any']

  // 카메라 구도 설명
  const cameraCompositionDescriptions: Record<CameraCompositionType, string> = {
    'selfie-high': 'high angle selfie perspective, camera looking down from above eye level',
    'selfie-front': 'eye-level frontal view, direct eye contact with camera',
    'selfie-side': 'three-quarter angle, showing facial contours, slight side view',
    tripod: 'stable tripod shot, medium distance, waist to head visible',
    closeup: 'close-up portrait, face and upper body prominent',
    fullbody: 'full body shot, entire person visible in frame',
  }

  const cameraSection = input.cameraComposition
    ? `카메라 구도: ${cameraCompositionDescriptions[input.cameraComposition]}`
    : ''

  const prompt = `당신은 GPT-Image 1.5 이미지 생성을 위한 프롬프트 전문가입니다.
**제품 설명 영상의 첫 프레임**에 사용될 이미지를 생성하기 위한 프롬프트를 작성해주세요.

⚠️ 중요: 이것은 정적인 광고 포스터가 아니라, 제품을 설명하는 **토킹 영상의 시작 장면**입니다.
인물이 곧 카메라를 향해 말을 시작할 것처럼 자연스럽고 편안한 모습이어야 합니다.

=== GPT-Image 1.5 프롬프트 가이드라인 ===
- 자연스러운 문장 형태로 작성
- 인물이 카메라를 바라보며 대화를 시작하려는 자연스러운 순간 포착
- 광고 포스터처럼 과장된 포즈나 텍스트 오버레이 없이 자연스럽게
- 인물의 외모, 표정, 포즈를 상세히 묘사
- 조명과 분위기를 구체적으로 설명
- 50-100 단어 권장

=== 제품 정보 ===
${input.productInfo}

=== 타겟 아바타 조건 (⚠️ 반드시 준수) ===
- 성별: ${targetGenderText}
- 연령대: ${targetAgeText}
- 스타일: ${styleText}
- 인종/민족: ${ethnicityText} ← ⭐ 이 인종 설정은 절대 변경하지 마세요!

=== 장소/배경 ===
${locationSection}

${cameraSection}

=== 작성 지침 (영상 첫 프레임용) ===

⚠️ 인종/민족 필수 준수:
위에서 지정된 인종(${ethnicityText})을 **반드시** 따라야 합니다. 다른 인종으로 변경하지 마세요.
- 한국인: Korean person, East Asian features, typically black hair, warm skin tone
- 아시아인: Asian person, East/Southeast Asian features
- 서양인: Western/Caucasian person, European features
- 인종 무관: 제품 타겟에 맞는 인종 자동 선택

1. 아바타(인물) 묘사 필수 요소:
   - 인종/민족: ⭐ **${ethnicityText}** (이 설정을 프롬프트 첫 부분에 명시!)
   - 성별, 대략적 나이대
   - 피부톤, 머리카락 색상/스타일 (인종에 맞게)
   - 표정: 친근하고 자연스러운 미소, 카메라를 바라보는 눈빛 (곧 말하기 시작할 것 같은 느낌)
   - 의상 (제품과 어울리는 일상적인 스타일)
   - 포즈: 자연스럽고 편안한 자세, 과장되지 않은 모습

2. 배경/장소 묘사:
   - 제품 특성에 맞는 적절한 장소
   - 영상 촬영에 적합한 자연스러운 조명
   - 유튜브/SNS 영상에 어울리는 깔끔한 배경

3. 제품 배치:
   - 인물이 제품을 자연스럽게 들고 있거나 옆에 두고 있는 모습
   - 제품 소개를 시작하려는 느낌

4. 기술적 품질 (영상용):
   - 포토리얼리스틱 스타일
   - 영상 촬영에 적합한 자연스러운 조명
   - UGC/인플루언서 영상 스타일 (광고 포스터 스타일 ❌)
   - 텍스트, 로고, 그래픽 요소 없이 순수 촬영 이미지만

다음 JSON 형식으로 응답하세요:
{
  "prompt": "영어로 작성된 GPT-Image 1.5 프롬프트 (50-100단어). ⭐ 반드시 인종을 프롬프트 첫 부분에 명시하세요! 예: 'A Korean woman...' 또는 'An Asian man...'",
  "avatarDescription": "생성될 아바타에 대한 한국어 설명 (인종, 성별, 나이대, 외모, 스타일 등)",
  "locationDescription": "장소/배경에 대한 한국어 설명"
}

⭐ 프롬프트 작성 예시 (인종별):
- 한국인 여성: "A Korean woman in her 20s with black hair and warm skin tone..."
- 한국인 남성: "A Korean man in his 30s with short black hair..."
- 서양인 여성: "A Caucasian woman with blonde hair and fair skin..."
- 아시아인: "An Asian person with East Asian features..."`

  const config: GenerateContentConfig = {
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // 제품 이미지가 있으면 추가
  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }
  }

  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as AiAvatarPromptResult
  } catch {
    // Fallback response
    return {
      prompt: 'A professional looking person holding a product in a modern setting, natural lighting, photorealistic style, 8K quality',
      avatarDescription: '제품에 어울리는 전문적인 모델',
      locationDescription: '모던한 배경',
    }
  }
}

// ============================================================
// AI 자동 카테고리 옵션 추천
// ============================================================

/** 카테고리 옵션 그룹 정보 */
export interface CategoryOptionItem {
  key: string
  description: string  // 옵션에 대한 한국어 설명
}

export interface CategoryOptionGroup {
  key: string
  options: CategoryOptionItem[]  // 사용 가능한 옵션 (키 + 설명)
}

/** AI 자동 설정 입력 */
export interface RecommendedOptionsInput {
  adType: ImageAdType
  productName?: string
  productDescription?: string
  categoryGroups: CategoryOptionGroup[]  // 해당 광고 유형의 카테고리 그룹들
  language?: string  // 응답 언어 (ko, en, ja)
}

/** AI 자동 설정 결과 */
export interface RecommendedOptionsResult {
  recommendedOptions: Record<string, {
    value: string      // 선택된 옵션 키 또는 '__custom__'
    customText?: string  // 커스텀 옵션일 경우 텍스트
    reason: string     // 선택 이유
  }>
  overallStrategy: string  // 전체 전략 설명
  suggestedPrompt?: string  // 추가 프롬프트 제안
}

/**
 * 제품 정보와 광고 유형에 맞는 최적의 카테고리 옵션을 AI가 추천합니다.
 * 액션, 시선, 장소, 분위기 등 모든 설정을 자동으로 결정합니다.
 *
 * @param input - AI 자동 설정 입력
 * @returns 추천된 옵션들과 선택 이유
 */
export async function generateRecommendedCategoryOptions(
  input: RecommendedOptionsInput
): Promise<RecommendedOptionsResult> {
  const language = input.language || 'ko'

  // Output language instructions
  const outputLanguageInstructions: Record<string, string> = {
    ko: 'Write all text responses (reason, overallStrategy, suggestedPrompt) in Korean.',
    en: 'Write all text responses (reason, overallStrategy, suggestedPrompt) in English.',
    ja: 'Write all text responses (reason, overallStrategy, suggestedPrompt) in Japanese.',
  }

  // Ad type descriptions
  const adTypeDescriptions: Record<ImageAdType, string> = {
    productOnly: 'Product only shot - Clean product photography showcasing the product alone',
    holding: 'Holding shot - Model naturally holding the product',
    using: 'Using shot - Model actively using/demonstrating the product',
    wearing: 'Wearing shot - Fashion advertisement with model wearing clothing/accessories',
    beforeAfter: 'Before/After - Comparison image showing transformation',
    lifestyle: 'Lifestyle - Natural everyday scene with the product',
    unboxing: 'Unboxing - Product reveal and first impression style',
    comparison: 'Comparison - Product comparison advertisement',
    seasonal: 'Seasonal/Theme - Advertisement with seasonal or themed atmosphere',
  }

  // Convert category groups to text (with keys and descriptions)
  const groupsDescription = input.categoryGroups.map(group => {
    const optionsText = group.options.map(opt => `    - ${opt.key}: ${opt.description}`).join('\n')
    return `[${group.key}]\n${optionsText}`
  }).join('\n\n')

  const prompt = `You are an expert advertising image producer.
Analyze the product information and ad type to recommend optimal category options.

OUTPUT LANGUAGE: ${outputLanguageInstructions[language] || outputLanguageInstructions.ko}

=== PRODUCT INFORMATION ===
Product Name: ${input.productName || 'Not provided'}
Product Description: ${input.productDescription || 'Not provided'}

=== AD TYPE ===
${input.adType}: ${adTypeDescriptions[input.adType]}

=== AVAILABLE CATEGORY OPTIONS ===
${groupsDescription}

=== RECOMMENDATION GUIDELINES ===

1. Product Analysis:
   - Product category (beauty, fashion, food, electronics, etc.)
   - Target customer demographics
   - Key selling points

2. Optimal Settings by Ad Type:
   - productOnly: Background and lighting that best highlights the product
   - holding: Natural, friendly pose and gaze direction
   - using: Action and setting that matches product usage
   - wearing: Pose and background that suits the clothing style
   - lifestyle: Relatable everyday scene and mood
   - unboxing: Exciting action and expression
   - beforeAfter: Layout that emphasizes transformation
   - comparison: Clear comparison with appropriate background
   - seasonal: Theme and atmosphere matching the season

3. Harmonious Combination:
   - Selected options should complement each other
   - Maintain consistency with product feel
   - Appeal to target customers

4. Option Selection:
   - Select from the given option list, OR
   - Use '__custom__' with customText for specific requirements

5. Additional Prompt Suggestion (suggestedPrompt):
   - Complementary style or atmosphere description
   - Specific instructions to enhance the ad image

IMPORTANT: Provide recommendations for ALL category groups.
Explain why each option is suitable for this product.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['recommendations', 'overallStrategy', 'suggestedPrompt'],
      properties: {
        recommendations: {
          type: Type.ARRAY,
          description: '각 카테고리 그룹별 추천 옵션 배열',
          items: {
            type: Type.OBJECT,
            required: ['key', 'value', 'reason'],
            properties: {
              key: {
                type: Type.STRING,
                description: '카테고리 그룹 키 (예: pose, gaze, background 등)',
              },
              value: {
                type: Type.STRING,
                description: '선택된 옵션 키 또는 커스텀일 경우 "__custom__"',
              },
              customText: {
                type: Type.STRING,
                description: 'value가 "__custom__"일 때 커스텀 텍스트',
              },
              reason: {
                type: Type.STRING,
                description: '이 옵션을 선택한 이유 (1-2문장)',
              },
            },
          },
        },
        overallStrategy: {
          type: Type.STRING,
          description: '전체 광고 전략 설명 (2-3문장)',
        },
        suggestedPrompt: {
          type: Type.STRING,
          description: '추가 프롬프트 제안 - 광고 이미지를 더 효과적으로 만들 수 있는 구체적인 스타일, 분위기, 지시사항 (1-2문장)',
        },
      },
    },
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  const responseText = response.text || ''

  try {
    // 배열 형태의 응답을 객체 형태로 변환
    const rawResult = JSON.parse(responseText) as {
      recommendations: Array<{
        key: string
        value: string
        customText?: string
        reason: string
      }>
      overallStrategy: string
      suggestedPrompt?: string
    }

    // 배열을 Record 형태로 변환
    const recommendedOptions: Record<string, { value: string; customText?: string; reason: string }> = {}
    for (const rec of rawResult.recommendations) {
      recommendedOptions[rec.key] = {
        value: rec.value,
        customText: rec.customText,
        reason: rec.reason,
      }
    }

    return {
      recommendedOptions,
      overallStrategy: rawResult.overallStrategy,
      suggestedPrompt: rawResult.suggestedPrompt,
    }
  } catch {
    // Fallback: 각 그룹의 첫 번째 옵션 선택
    const fallbackOptions: Record<string, { value: string; reason: string }> = {}
    for (const group of input.categoryGroups) {
      fallbackOptions[group.key] = {
        value: group.options[0]?.key || '',
        reason: '기본 설정이 적용되었습니다.',
      }
    }

    return {
      recommendedOptions: fallbackOptions,
      overallStrategy: '제품 정보를 기반으로 기본 설정이 적용되었습니다. 필요에 따라 수정해주세요.',
      suggestedPrompt: undefined,
    }
  }
}
