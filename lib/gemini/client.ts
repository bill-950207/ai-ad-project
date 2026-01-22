/**
 * Gemini API 클라이언트
 *
 * 영상 광고 프롬프트 생성을 위한 Gemini 클라이언트입니다.
 * - 제품 정보 요약
 * - URL에서 제품 정보 추출 (URL Context 사용)
 * - 영상 광고 프롬프트 생성
 */

import { GenerateContentConfig, GoogleGenAI, MediaResolution, ThinkingLevel, Type } from '@google/genai'

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
  language?: 'ko' | 'en' | 'ja' | 'zh'  // 대본 생성 언어 (기본값: ko)
  additionalInstructions?: string  // 추가 지시사항
  // AI 의상 추천용 추가 정보
  requestOutfitRecommendation?: boolean  // AI 의상 추천 요청 여부
  avatarDescription?: string    // 아바타 설명 (의상 추천 시)
  productImageUrl?: string      // 제품 이미지 URL (의상 추천 시)
}

/** 개별 대본 */
export interface Script {
  style: ScriptStyle            // 대본 스타일
  styleName: string             // 스타일 이름 (한국어)
  content: string               // 대본 내용
  estimatedDuration: number     // 예상 길이 (초)
}

/** AI 추천 의상 정보 */
export interface RecommendedOutfit {
  description: string           // 의상 설명 (영어, 프롬프트용)
  koreanDescription: string     // 의상 설명 (한국어, 사용자 표시용)
  reason: string                // 추천 이유 (한국어)
}

/** 제품 설명 대본 생성 결과 */
export interface ProductScriptResult {
  productSummary: string        // 제품 요약
  scripts: Script[]             // 3가지 스타일의 대본
  recommendedOutfit?: RecommendedOutfit  // AI 추천 의상 (요청 시에만)
}

/** 카메라 구도 타입 (셀카는 각도별로 세분화) */
export type CameraCompositionType = 'selfie-high' | 'selfie-front' | 'selfie-side' | 'tripod' | 'closeup' | 'fullbody' | 'ugc-closeup'

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
  | 'lifestyle'
  | 'unboxing'
  | 'seasonal'

/** 아바타 특성 정보 (광고 프롬프트에 반영) */
export interface AvatarCharacteristics {
  gender?: 'female' | 'male' | 'nonbinary'
  age?: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus'
  ethnicity?: 'korean' | 'eastAsian' | 'western' | 'southeastAsian' | 'black' | 'hispanic' | 'mixed'
  height?: 'short' | 'average' | 'tall'
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'plussize'
  hairStyle?: 'longStraight' | 'bob' | 'wavy' | 'ponytail' | 'short'
  hairColor?: 'blackhair' | 'brown' | 'blonde' | 'custom'
  customHairColor?: string
  vibe?: 'natural' | 'sophisticated' | 'cute' | 'professional'
}

/** 이미지 광고 프롬프트 생성 입력 */
export interface ImageAdPromptInput {
  adType: ImageAdType                    // 광고 유형
  productName?: string                   // 제품명
  productDescription?: string            // 제품 설명
  productImageUrl?: string               // 제품 이미지 URL
  avatarImageUrls?: string[]             // 아바타 이미지 URL 배열
  avatarCharacteristics?: AvatarCharacteristics  // 아바타 특성 (피부톤, 체형, 키 등)
  outfitImageUrl?: string                // 의상 이미지 URL (wearing 타입)
  referenceStyleImageUrl?: string        // 참조 스타일 이미지 URL (분위기/스타일만 참조)
  selectedOptions: Record<string, string> // 사용자 선택 옵션 (outfit 옵션 포함)
  additionalPrompt?: string              // 추가 프롬프트
  aiAvatarDescription?: string           // AI 생성 아바타 설명 (아바타 이미지 없이 텍스트로 생성할 때)
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
  reason: string              // 왜 이 값을 선택했는지 상세한 근거
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

/** 모델 포즈 타입 */
export type ModelPoseType = 'holding-product' | 'showing-product' | 'using-product' | 'talking-only'

/** 의상 프리셋 타입 */
export type OutfitPresetType = 'casual_everyday' | 'formal_elegant' | 'professional_business' | 'sporty_athletic' | 'cozy_comfortable' | 'trendy_fashion' | 'minimal_simple'

/** 첫 프레임 이미지 프롬프트 생성 입력 */
export interface FirstFramePromptInput {
  productInfo: string           // 제품 정보
  avatarImageUrl: string        // 아바타 이미지 URL
  locationPrompt?: string       // 장소 프롬프트 (선택사항)
  productImageUrl?: string      // 제품 이미지 URL (선택사항)
  cameraComposition?: CameraCompositionType  // 카메라 구도 (선택사항)
  modelPose?: ModelPoseType     // 모델 포즈 (선택사항)
  outfitPreset?: OutfitPresetType  // 의상 프리셋 (선택사항)
  outfitCustom?: string         // 의상 직접 입력 (선택사항)
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
 * 범용 텍스트 생성 함수
 * 프롬프트를 받아서 Gemini로 텍스트를 생성합니다.
 *
 * @param prompt - 생성할 텍스트의 프롬프트
 * @returns 생성된 텍스트
 */
export async function generateText(prompt: string): Promise<string> {
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  return response.text || ''
}

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
   - GOAL: Generate hyper-realistic commercial advertisement visual
   - Structure: subject → dynamic action → lighting → texture details → premium aesthetic
   - Use natural language sentences (NOT comma-separated keywords)
   - First 5-8 words are most important - place the main subject there

   🎯 PREMIUM ADVERTISEMENT STYLE:
   * Dynamic Elements: "dynamic pose", "elements frozen mid-air", "energetic composition"
   * Skin/Model: "clean skin tones with natural texture", "confident expression", "bright engaging look"
   * Lighting: "bold punchy studio lighting", "cinematic key light with soft fill to sculpt facial features"
   * Texture: "ultra-sharp focus on product texture: surface details, material sheen, fine details clearly visible"
   * Depth: "shallow depth of field isolates subject while maintaining product sharpness"
   * Hands: "confident grip on product", "dynamic hand positioning"

   * Camera style:
     - Premium Ad: "cinematic lighting", "shallow depth of field", "high-impact commercial look"
     - Bold colors: "punchy saturated colors", "bold color palette"
   * Background: "clean studio background" or "bold colored backdrop"

   - End with: "Premium advertising aesthetic, energetic and visually bold, optimized for social media hero frames"
   - Product reference: Use "the product in IMAGE1" (with correct index) instead of brand/product names
   - INCLUDE: "ultra-sharp focus", "texture details", "premium aesthetic", "visually bold"
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
    // Gemini 3 Flash: 이미지 분석을 위한 중간 해상도 설정 (256 tokens)
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
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
    // 프로페셔널 광고 스타일 폴백 응답 (고급 광고 비주얼)
    return {
      productSummary: 'Product information has been analyzed.',
      firstScenePrompt: 'Hyper-realistic ad visual of a person confidently holding the product from the reference image with dynamic energy. Clean skin tones with natural texture, bright confident expression. Bold punchy studio lighting with cinematic key light and soft fill to sculpt facial features. Shallow depth of field isolates subject while product stays ultra-sharp. Ultra-sharp focus on product texture: surface details, material sheen clearly visible. Premium advertising aesthetic, energetic and visually bold, optimized for social media hero frames.',
      videoPrompt: `Dynamic product advertisement video. The scene begins with an energetic shot of the person confidently presenting the product. Camera slowly pushes in to reveal ultra-sharp product details and textures. Bold cinematic lighting creates high-impact visual. The person shows confident, engaging movements. Premium commercial quality, ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, words, watermark, logo, blurry, low quality, distorted, deformed, ugly, artificial looking, CGI, 3D render, illustration, painting, anime, cartoon, dull colors, flat lighting, boring composition',
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

   ⚠️ CRITICAL FOR UGC EDITORIAL STYLE - AVOID AI/COMMERCIAL LOOK:
   - Style: "ultra-realistic cinematic editorial photography" (NOT commercial/advertisement style)
   - Framing: "full body visible" or "natural editorial distance" (NOT face-only closeup)
   - Skin: "realistic skin texture with natural details" (NOT smooth/flawless)
   - Hair: "individual hair strands with natural flyaways" (NOT perfectly styled)
   - Expression: "calm, confident, intelligent expression" (NOT exaggerated smile/pose)
   - Lighting: "soft natural daylight" (NOT studio/dramatic lighting)
   - Background: "sharp in-focus background with visible environment details" (NO blur/bokeh!)
   - Eyes: "natural imperfect catchlights" (NOT perfectly symmetric)
   - Hands: "natural relaxed grip, realistic finger positioning" (NOT stiff or awkward)
   - Camera: "Shot on Sony A7IV, 35mm f/8, deep depth of field" (background must be sharp!)
   - Quality: "ultra-realistic, photorealistic, 8K quality"

   - Vertical (9:16) camera perspective
   - AVOID: "smooth skin", "blurred background", "bokeh", "professional lighting", "advertisement quality"
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
    // Gemini 3 Flash: 아바타/제품 이미지 분석을 위한 중간 해상도 설정
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
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
    // Fallback response on parse failure (UGC 에디토리얼 스타일)
    return {
      productSummary: input.productInfo ? '제품 정보가 분석되었습니다.' : '일반 UGC 영상',
      firstScenePrompt: 'A young woman seated comfortably on a modern designer armchair in a cozy living room, naturally looking at camera with calm confident expression. Full body visible. Soft natural daylight from floor-to-ceiling window. Sharp in-focus background with furniture and plants clearly visible. Shot on Sony A7IV, 35mm f/8, deep depth of field. Ultra-realistic cinematic editorial photography, 8K quality.',
      videoPrompt: `A woman speaks naturally to camera with subtle head movements and confident expressions. She gestures occasionally while talking, maintaining eye contact. Her facial expressions shift naturally. Authentic UGC style with slight camera movement. ${input.duration} seconds of natural conversation.`,
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
  // 언어별 TTS 속도 설정 (1.1배속 기준)
  // - 한국어/일본어/중국어: 초당 약 5자
  // - 영어: 초당 약 15자 (약 2.5-3 단어)
  const language = input.language || 'ko'

  const languageConfig: Record<string, {
    charsPerSecond: number
    name: string
    formalExample: string
    casualExample: string
    energeticExample: string
    styleName: { formal: string; casual: string; energetic: string }
  }> = {
    ko: {
      charsPerSecond: 5.0,
      name: '한국어',
      formalExample: '안녕하세요. 오늘 소개해드릴 제품은...',
      casualExample: '이거 진짜 써봤는데요, 솔직히...',
      energeticExample: '여러분! 이거 진짜 대박이에요!',
      styleName: { formal: '전문적', casual: '친근한', energetic: '활기찬' },
    },
    en: {
      charsPerSecond: 15.0,
      name: 'English',
      formalExample: 'Hello. Today, I would like to introduce...',
      casualExample: 'So I actually tried this, and honestly...',
      energeticExample: 'Hey everyone! This is absolutely amazing!',
      styleName: { formal: 'Professional', casual: 'Casual', energetic: 'Energetic' },
    },
    ja: {
      charsPerSecond: 5.0,
      name: '日本語',
      formalExample: 'こんにちは。本日ご紹介する商品は...',
      casualExample: 'これ実際に使ってみたんだけど、正直...',
      energeticExample: 'みなさん！これ本当にすごいんです！',
      styleName: { formal: 'プロフェッショナル', casual: 'カジュアル', energetic: 'エネルギッシュ' },
    },
    zh: {
      charsPerSecond: 5.0,
      name: '中文',
      formalExample: '大家好。今天要为大家介绍的产品是...',
      casualExample: '我实际用过这个，说实话...',
      energeticExample: '大家！这个真的太棒了！',
      styleName: { formal: '专业', casual: '亲切', energetic: '活力' },
    },
  }

  const config_lang = languageConfig[language] || languageConfig.ko
  const charsPerSecond = config_lang.charsPerSecond
  const targetChars = Math.round(input.durationSeconds * charsPerSecond)
  const minChars = Math.round(targetChars * 0.9)
  const maxChars = Math.round(targetChars * 1.1)

  const productSection = input.productUrl
    ? `Product URL: ${input.productUrl}
Please fetch and analyze product information from the URL above.

Additional product info:
${input.productInfo}`
    : `Product info:
${input.productInfo}`

  // AI 의상 추천 섹션 (요청 시에만)
  const outfitRecommendationSection = input.requestOutfitRecommendation
    ? `

OUTFIT RECOMMENDATION REQUEST:
Please also recommend an appropriate outfit for the model/avatar that complements the product.
${input.avatarDescription ? `Avatar/Model description: ${input.avatarDescription}` : ''}

Outfit recommendation guidelines:
- The outfit should complement the product being advertised
- Consider the product's style, color, and target audience
- Choose an outfit that looks natural for UGC-style content
- The outfit should not distract from the product
- Consider seasonal appropriateness and current fashion trends
- Provide specific details (color, style, material) for image generation`
    : ''

  const prompt = `You are a professional advertising script writer. Write 3 different style scripts for the following product.

${productSection}

Video duration: ${input.durationSeconds} seconds
Target character count: ${minChars}~${maxChars} characters (for ${config_lang.name})
${input.additionalInstructions ? `Additional instructions: ${input.additionalInstructions}` : ''}

Product analysis guidelines:
- Use structured information if provided (product name, brand, price, description, key features)
- Key features (selling points) should be highlighted in the scripts
- Brand and price information can be naturally mentioned if available

Write scripts in 3 styles:

1. **Professional (formal)**:
   - Trustworthy and professional tone
   - Clear explanation of product features and benefits
   - Use data and numbers when appropriate
   - Example: "${config_lang.formalExample}"

2. **Friendly (casual)**:
   - Natural conversational tone like recommending to a friend
   - Personal experience format
   - Honest and relaxed atmosphere
   - Example: "${config_lang.casualExample}"

3. **Lively (energetic)**:
   - Enthusiastic and energetic tone
   - Use exclamations and emphatic expressions
   - Positive and exciting atmosphere
   - Example: "${config_lang.energeticExample}"

IMPORTANT:
- Each script must be ${minChars}~${maxChars} characters
- Write in natural spoken language
- Clearly convey the product's core value and selling points
- ALL SCRIPTS MUST BE WRITTEN IN ${config_lang.name.toUpperCase()}
${outfitRecommendationSection}`

  const tools = input.productUrl
    ? [{ urlContext: {} }, { googleSearch: {} }]
    : undefined

  // 기본 스키마 속성
  const baseSchemaProperties = {
    productSummary: {
      type: Type.STRING,
      description: `Summarize the product's core value in 2-3 sentences (in ${config_lang.name})`,
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
            description: 'Script style code',
          },
          styleName: {
            type: Type.STRING,
            description: `Style name in ${config_lang.name}`,
          },
          content: {
            type: Type.STRING,
            description: `Script content (must be in ${config_lang.name})`,
          },
          estimatedDuration: {
            type: Type.NUMBER,
            description: 'Estimated speech duration (seconds)',
          },
        },
      },
    },
  }

  // AI 의상 추천 요청 시 스키마에 추가
  const schemaProperties = input.requestOutfitRecommendation
    ? {
        ...baseSchemaProperties,
        recommendedOutfit: {
          type: Type.OBJECT,
          required: ['description', 'koreanDescription', 'reason'],
          description: 'AI recommended outfit for the model',
          properties: {
            description: {
              type: Type.STRING,
              description: 'Outfit description in English for image generation prompt (e.g., "casual white cotton t-shirt with light blue jeans")',
            },
            koreanDescription: {
              type: Type.STRING,
              description: '의상 설명 (한국어, 사용자 표시용)',
            },
            reason: {
              type: Type.STRING,
              description: '추천 이유 (한국어, 왜 이 의상이 제품과 잘 어울리는지)',
            },
          },
        },
      }
    : baseSchemaProperties

  const requiredFields = input.requestOutfitRecommendation
    ? ['productSummary', 'scripts', 'recommendedOutfit']
    : ['productSummary', 'scripts']

  const genConfig: GenerateContentConfig = {
    tools,
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: requiredFields,
      properties: schemaProperties,
    },
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: genConfig,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as ProductScriptResult
  } catch {
    // Fallback responses by language
    const fallbackByLanguage: Record<string, {
      summary: string
      formal: string
      casual: string
      energetic: string
    }> = {
      ko: {
        summary: '제품 정보가 분석되었습니다.',
        formal: '안녕하세요. 오늘 소개해드릴 제품에 대해 말씀드리겠습니다. 이 제품은 뛰어난 품질과 성능을 자랑합니다.',
        casual: '안녕하세요! 오늘 정말 좋은 제품 하나 소개해드릴게요. 저도 써봤는데 정말 만족스러웠어요.',
        energetic: '여러분! 이거 진짜 대박 제품이에요! 써보시면 왜 이렇게 인기 있는지 바로 아실 거예요!',
      },
      en: {
        summary: 'Product information has been analyzed.',
        formal: 'Hello. Today, I would like to introduce you to this product. It offers exceptional quality and performance.',
        casual: 'Hey! Let me introduce you to this amazing product. I have tried it myself and I was really satisfied.',
        energetic: 'Everyone! This product is absolutely amazing! Once you try it, you will understand why it is so popular!',
      },
      ja: {
        summary: '製品情報が分析されました。',
        formal: 'こんにちは。本日ご紹介する製品についてお話しします。この製品は優れた品質と性能を誇ります。',
        casual: 'こんにちは！今日は本当に良い商品を紹介しますね。私も使ってみて、本当に満足でした。',
        energetic: 'みなさん！これ本当にすごい商品なんです！使ってみれば、なぜこんなに人気があるのかすぐわかりますよ！',
      },
      zh: {
        summary: '产品信息已分析完毕。',
        formal: '大家好。今天我要为大家介绍这款产品。它具有卓越的品质和性能。',
        casual: '大家好！今天给大家介绍一款很棒的产品。我自己用过，真的很满意。',
        energetic: '大家！这款产品真的太棒了！用过之后你就会明白为什么这么受欢迎！',
      },
    }

    const fallback = fallbackByLanguage[language] || fallbackByLanguage.ko

    const result: ProductScriptResult = {
      productSummary: fallback.summary,
      scripts: [
        {
          style: 'formal',
          styleName: config_lang.styleName.formal,
          content: fallback.formal,
          estimatedDuration: input.durationSeconds,
        },
        {
          style: 'casual',
          styleName: config_lang.styleName.casual,
          content: fallback.casual,
          estimatedDuration: input.durationSeconds,
        },
        {
          style: 'energetic',
          styleName: config_lang.styleName.energetic,
          content: fallback.energetic,
          estimatedDuration: input.durationSeconds,
        },
      ],
    }

    // AI 의상 추천 요청 시 기본 의상 추가
    if (input.requestOutfitRecommendation) {
      result.recommendedOutfit = {
        description: 'casual white cotton t-shirt with comfortable light blue jeans',
        koreanDescription: '캐주얼한 흰색 면 티셔츠와 편안한 라이트 블루 청바지',
        reason: '제품과 잘 어울리는 자연스럽고 깔끔한 캐주얼 스타일입니다.',
      }
    }

    return result
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
    'ugc-closeup': 'UGC 스타일 미디엄 클로즈업 - 인플루언서가 직접 촬영한 듯한 친근한 구도. 가슴 위쪽부터 머리까지 프레임에 가득 차게 담김. 카메라 렌즈를 똑바로 바라보며 자연스러운 표정. 시청자에게 편하게 말하는 듯한 분위기.',
  }

  // 셀카 구도인지 확인
  const isSelfieMode = input.cameraComposition?.startsWith('selfie-')

  const cameraSection = input.cameraComposition
    ? `카메라 구도: ${cameraCompositionDescriptions[input.cameraComposition]}
이 구도에 맞게 아바타의 포즈와 카메라 앵글을 설정해주세요.`
    : ''

  // 모델 포즈 설명
  const modelPoseDescriptions: Record<ModelPoseType, string> = {
    'holding-product': '제품 들기 - 모델이 제품을 양손으로 자연스럽게 들고 카메라를 향해 보여주는 포즈. 제품이 얼굴 옆이나 가슴 높이에 위치.',
    'showing-product': '제품 제시 - 모델이 제품을 카메라 앞으로 내밀어 보여주는 포즈. 한 손 또는 양손으로 제품을 프레젠테이션하듯 제시.',
    'using-product': '제품 사용 - 모델이 실제로 제품을 사용하는 모습. 스킨케어면 얼굴에 바르는 중, 음료면 마시는 중 등 제품 특성에 맞는 사용 장면.',
    'talking-only': '말로만 설명 - ⚠️ 제품이 화면에 절대 보이지 않음! 제품 없이 아바타만 화면에 등장. 손은 자연스럽게 내려두거나 제스처를 취하며 대화하듯 자연스러운 포즈.',
  }

  const poseSection = input.modelPose
    ? `모델 포즈: ${modelPoseDescriptions[input.modelPose]}
${input.modelPose === 'talking-only' ? '⚠️ 중요: 제품이 화면에 전혀 보이지 않아야 합니다! 아바타만 등장하는 프레임입니다.' : '이 포즈에 맞게 모델의 자세와 제품 배치를 설정해주세요.'}`
    : ''

  // 의상 프리셋 설명
  const outfitPresetDescriptions: Record<OutfitPresetType, string> = {
    casual_everyday: '캐주얼 일상 의상 - 편안한 티셔츠나 블라우스에 청바지 또는 캐주얼 팬츠, 친근하고 편안한 스타일',
    formal_elegant: '포멀/우아한 의상 - 세련된 드레스나 정장, 고급스럽고 우아한 분위기',
    professional_business: '비즈니스 의상 - 전문적인 비즈니스 정장이나 깔끔한 셔츠, 신뢰감 있는 스타일',
    sporty_athletic: '스포티 의상 - 운동복이나 애슬레저 스타일, 활동적이고 건강한 이미지',
    cozy_comfortable: '편안한 의상 - 부드러운 니트 스웨터나 가디건, 따뜻하고 아늑한 느낌',
    trendy_fashion: '트렌디 패션 의상 - 최신 유행 스타일, 세련되고 패셔너블한 룩',
    minimal_simple: '미니멀 심플 의상 - 깔끔한 단색 의상, 절제된 우아함과 세련된 느낌',
  }

  // 의상 설명 생성
  let outfitSection = ''
  if (input.outfitCustom) {
    outfitSection = `의상 설정 (사용자 지정): ${input.outfitCustom}
이 의상 설명에 맞게 모델의 의상을 설정해주세요. 원본 아바타의 의상 대신 지정된 의상을 입혀주세요.`
  } else if (input.outfitPreset) {
    outfitSection = `의상 설정: ${outfitPresetDescriptions[input.outfitPreset]}
이 스타일에 맞게 모델의 의상을 설정해주세요. 원본 아바타의 의상 대신 지정된 스타일의 의상을 입혀주세요.`
  }

  // 이미지 인덱스 계산 (Seedream 4.5 Figure 형식)
  const avatarImageIndex = 1
  const productImageIndex = input.productImageUrl ? 2 : null

  const imageReferenceSection = `
=== ATTACHED IMAGES GUIDE (Seedream 4.5 Figure Format) ===
[Figure ${avatarImageIndex}] = AVATAR (MODEL) IMAGE
- This is the human model for the video. Use this model's appearance in the generated image.
- Reference as "the model from Figure ${avatarImageIndex}" in your prompt.
${productImageIndex ? `[Figure ${productImageIndex}] = PRODUCT IMAGE
- This is the product to feature.
- ⚠️ IMPORTANT: The product may be a figurine, doll, character merchandise, or statue with human-like form. Even if it looks like a person, it is a PRODUCT, NOT a real human. Do NOT transform or animate it into a real person.
- Reference as "the product from Figure ${productImageIndex}" in your prompt.
- When the model holds or presents this product, write: "holding the product from Figure ${productImageIndex}"` : ''}`

  // 셀카 각도별 카메라 설정
  const selfieAngleSettings: Record<string, string> = {
    'selfie-high': 'high angle selfie perspective shot from above eye level (approximately 30 degrees down), looking up at camera',
    'selfie-front': 'eye-level selfie perspective, direct frontal view, intimate distance',
    'selfie-side': 'three-quarter angle selfie perspective (45 degrees from front), showing facial contours',
  }

  // Seedream 4.5 최적화 가이드라인 (포토리얼리즘 강화 + 카메라/손 제거 강화 + Figure 형식)
  const seedreamGuide = `
=== Seedream 4.5 프롬프트 작성 가이드라인 (포토리얼리즘 필수) ===
ByteDance의 Seedream 4.5 이미지-to-이미지 편집/합성 모델에 최적화된 프롬프트를 작성해야 합니다.
목표: 실제 카메라로 촬영한 것처럼 보이는 100% 포토리얼리스틱 이미지

⭐ 핵심 프롬프트 형식 (Seedream 4.5 공식 문서 기반):
- 편집 명령 형태로 시작: "Place the model from Figure X holding the product from Figure Y in [환경]"
- 반드시 "Figure 1", "Figure 2" 형식 사용 (IMAGE1, IMAGE2 아님!)
- 예: "the model from Figure 1", "the product from Figure 2"
- 예: "Place the model from Figure 1 holding the product from Figure 2"

핵심 원칙:
1. 편집 명령 형태: "Place...", "Compose...", "Copy... and place..." 형식으로 시작
2. Figure 참조: "the model from Figure 1", "the product from Figure 2" 형식 필수
3. 간결성: 50-80단어가 최적. 복잡한 형용사를 쌓지 말고 3-5개의 강력한 서술어만 사용
4. 첫 문장에 편집 명령과 Figure 참조를 배치
5. 조명 (방향성 필수): "soft natural daylight streaming from large window", "warm studio lighting from the left"
6. 품질 키워드 (간결하게): "Hyperrealistic photograph, 8K RAW quality" (중복 표현 금지)

카메라 스펙 (UGC 에디토리얼 스타일 - 배경 선명하게):
- 기본: "Shot on Sony A7IV, 35mm f/8, deep depth of field, entire scene sharp"
- 셀피-위에서(selfie-high): "${selfieAngleSettings['selfie-high']}, Shot on Sony A7IV, 28mm f/8, entire scene sharp"
- 셀피-정면(selfie-front): "${selfieAngleSettings['selfie-front']}, Shot on Sony A7IV, 35mm f/8, entire scene sharp"
- 셀피-측면(selfie-side): "${selfieAngleSettings['selfie-side']}, Shot on Sony A7IV, 35mm f/8, entire scene sharp"
- 삼각대(tripod)/일반: "Shot on Sony A7IV, 50mm f/8, entire scene sharp"
- 클로즈업(closeup): "Shot on Sony A7IV, 50mm f/8, sharp background"
- 전신(fullbody): "Shot on Sony A7IV, 35mm f/8, full body visible, entire scene sharp"

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
- 첫 문장에 "both hands holding the product from Figure X" 명시

셀피 앵글별 구도:
- selfie-high (위에서): 카메라가 얼굴 위 30도에서 내려다보는 각도. 턱선이 슬림해보이고 눈이 커보임.
- selfie-front (정면): 눈높이에서 정면. 가장 자연스럽고 직접적인 시선 교류.
- selfie-side (측면): 45도 측면에서. 얼굴 입체감이 살아나고 세련된 느낌.

배경 심도 가이드 (⚠️ 매우 중요 - 블러 절대 금지):
- 모든 스타일에서 배경이 선명하게 보여야 함 (실제 스마트폰으로 찍은 것처럼)
- "blurred background", "soft background", "bokeh", "shallow depth of field" 표현 절대 금지
- 배경의 환경 디테일(가구, 간판, 사람들 등)이 또렷하게 보여야 UGC/인플루언서 느낌
- 배경이 흐리면 AI가 만든 것처럼 보이므로 반드시 "sharp in-focus background" 사용

=== ⭐ 럭셔리 에디토리얼 스타일 가이드 (핵심 요소) ===
참조 이미지처럼 고급스럽고 세련된 에디토리얼 사진을 만들기 위한 필수 요소:

**구도 & 카메라 (Composition)**:
- 프레이밍: "full body visible" - 전신이 보이는 자연스러운 에디토리얼 거리
- 카메라 각도: "slightly diagonal to the subject" - 약간 대각선에서 촬영하여 입체감 있는 구도
- 거리: "natural editorial distance" - 에디토리얼 사진처럼 적절한 거리감

**인물 & 표정 (Subject)**:
- 표정: "calm, confident, intelligent expression" - 차분하고 자신감 있는 지적인 표정
- 자세: "seated comfortably" 또는 "relaxed natural pose" - 편안하게 앉거나 자연스러운 포즈
- 시선: "looking at camera" 또는 "natural gaze direction" - 카메라를 향하거나 자연스러운 시선
- ⛔ "big smile", "enthusiastic", "excited expression" 등 과장된 표정 금지

**환경 & 배경 (Environment)**:
- 장소: "luxurious modern interior" - 고급스러운 현대적 인테리어
- 가구: "luxury designer armchair/chair" - 디자이너 가구
- 창문: "floor-to-ceiling glass window" - 천장까지 닿는 유리창
- 소품: "modern coffee table with magazines/books, plants" - 잡지/책이 놓인 테이블, 화분
- 배경: "sharp in-focus background showing entire luxurious interior" - 선명한 배경

**조명 (Lighting)**:
- 타입: "soft natural daylight" - 부드러운 자연광
- 방향: "entering from behind/side through large window" - 창문을 통해 들어오는 빛
- 효과: "enhances skin texture and fabric details without harsh shadows" - 자연스러운 하이라이트
- ⛔ "studio lighting", "dramatic lighting", "rim lighting" 등 인공적인 조명 금지

**분위기 & 스타일 (Mood)**:
- 테마: "intelligence, influence, calm power, understated wealth" - 지적이고 영향력 있는 느낌
- 스타일: "refined smart-casual billionaire aesthetic" - 절제된 고급스러움
- ⛔ "advertisement", "commercial", "promotional" 등 광고 느낌 금지

**품질 키워드 (Quality)**:
- "pure photorealism, ultra-high detail level"
- "realistic skin texture, authentic fabric weave"
- "8K quality, ultra-realistic cinematic editorial photography"

제품 참조 방식 (중요):
- 제품 이미지가 제공된 경우: "the product from Figure X" 형식으로 참조 (브랜드명 직접 사용 금지)

⚠️ 럭셔리 에디토리얼 스타일 필수 요소 (고급스럽고 세련된 사진):
- 스타일: "ultra-realistic cinematic editorial photography" (⛔ 전문 광고/상업 스타일 금지)
- 환경: "luxurious modern interior" - 천장까지 유리창, 디자이너 가구, 화분, 잡지/책
- 프레이밍: "full body visible" + "camera slightly diagonal to subject" (⛔ 얼굴만 클로즈업 금지)
- 자세: "seated comfortably on luxury designer armchair" 또는 편안한 자연스러운 포즈
- 표정: "calm, confident, intelligent expression" (⛔ 과장된 미소/"excited" 금지!)
- 피부: "realistic skin texture with natural details" (⛔ "smooth", "flawless", "healthy glow" 금지)
- 머리카락: "individual hair strands with natural flyaways" (⛔ 완벽하게 정돈된 머리카락 금지)
- 손: "natural relaxed grip, realistic finger positioning" (⛔ 어색한 손가락 배치 금지)
- 조명: "soft natural daylight entering from floor-to-ceiling glass window" (⛔ 스튜디오/드라마틱 조명 금지)
- 배경: "sharp in-focus background showing luxurious interior with furniture, plants clearly visible" (⛔ 블러/보케 절대 금지!)
- 분위기: "refined smart-casual aesthetic, understated wealth, calm power" (절제된 고급스러움)
- 카메라: "Shot on Sony A7IV, 35mm f/8, deep depth of field" (배경까지 선명하게)
- 품질: "ultra-realistic, photorealistic, 8K quality"

프롬프트 예시 (럭셔리 에디토리얼 스타일):
"Place the model from Figure 1 seated comfortably on a luxury designer armchair, naturally holding the product from Figure 2. Full body visible. Camera slightly diagonal to subject. Calm, confident, intelligent expression. Soft natural daylight entering from floor-to-ceiling glass window behind. Sharp in-focus background showing luxurious modern interior with coffee table, magazines, and plants clearly visible. Refined smart-casual aesthetic. Ultra-realistic cinematic editorial photography. Shot on Sony A7IV, 35mm f/8, deep depth of field. Realistic skin texture, authentic fabric weave. 8K quality."`

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

${poseSection}

${outfitSection}

${imageReferenceSection}

요구사항 (토킹 영상 첫 프레임 - 럭셔리 에디토리얼 스타일):
1. 아바타가 차분하고 자신감 있으며 지적인 표정 (calm, confident, intelligent - 과장된 미소 금지!)
2. 전신이 보이는 자연스러운 에디토리얼 거리 (full body visible)
3. 고급스러운 현대적 인테리어 배경 (디자이너 가구, 천장까지 유리창, 식물, 잡지/책)
4. 제품을 양손으로 자연스럽게 들고 있거나 옆에 배치
5. 부드러운 자연광 (창문을 통해 들어오는 빛)
6. 세로 비율(9:16) 구도 - 영상용
7. 카메라를 피사체에서 약간 대각선으로 배치 (slightly diagonal to subject)
8. 럭셔리 에디토리얼 스타일 - 광고/상업적 느낌 금지
${input.cameraComposition ? `9. 지정된 카메라 구도(${input.cameraComposition})를 반드시 반영` : ''}
${isSelfieMode ? `10. [필수] 셀피 구도이지만 카메라/스마트폰/손이 화면에 절대 보이지 않아야 함. 모델의 양손은 제품을 들고 있거나 자연스러운 포즈.` : ''}
${input.modelPose ? `11. [필수] 지정된 모델 포즈(${input.modelPose})를 반드시 반영하여 모델의 자세와 제품 배치를 설정` : ''}
${(input.outfitPreset || input.outfitCustom) ? `12. [필수] 지정된 의상 스타일을 반드시 반영하여 모델의 의상을 변경 (원본 아바타 의상 무시)` : ''}

프롬프트 작성 지침 (Seedream 4.5 Figure 형식 필수):
- 영어로 작성, 50-80단어 권장 (최대 100단어)
- 반드시 편집 명령 형태로 시작: "Place the model from Figure 1 holding the product from Figure 2..."
- "Figure 1", "Figure 2" 형식 필수 (IMAGE1, IMAGE2 형식 사용 금지!)
${isSelfieMode ? `- 셀피 구도: "Place the model from Figure 1 with both hands holding the product from Figure 2..."` : ''}

Figure 참조 형식:
- 모델: "the model from Figure 1"
- 제품: "the product from Figure 2"
- 결합: "Place the model from Figure 1 holding the product from Figure 2 in [환경]"

카메라 스펙 (UGC 에디토리얼 스타일 - 배경 선명하게):
- 기본: "Shot on Sony A7IV, 35mm f/8, deep depth of field, entire scene sharp"
- 셀피-위에서(selfie-high): "${selfieAngleSettings['selfie-high']}", Shot on Sony A7IV, 28mm f/8, entire scene sharp
- 셀피-정면(selfie-front): "${selfieAngleSettings['selfie-front']}", Shot on Sony A7IV, 35mm f/8, entire scene sharp
- 셀피-측면(selfie-side): "${selfieAngleSettings['selfie-side']}", Shot on Sony A7IV, 35mm f/8, entire scene sharp
- 삼각대(tripod)/일반: Shot on Sony A7IV, 50mm f/8, entire scene sharp
- 클로즈업(closeup): Shot on Sony A7IV, 50mm f/8, sharp background
- 전신(fullbody): Shot on Sony A7IV, 35mm f/8, full body visible, entire scene sharp

⭐ 럭셔리 에디토리얼 스타일 필수 요소 (핵심!):
- 스타일: "ultra-realistic cinematic editorial photography" (⛔ 광고/상업 스타일 금지!)
- 환경: "luxurious modern interior" - 디자이너 가구, 천장까지 유리창, 식물, 잡지
- 구도: "full body visible, camera slightly diagonal to subject" (⛔ 얼굴만 클로즈업 금지)
- 자세: "seated comfortably on luxury designer armchair" 또는 자연스러운 포즈
- 표정: "calm, confident, intelligent expression" (⛔ 과장된 미소/흥분 표정 금지!)
- 카메라: "Shot on Sony A7IV, 35mm f/8, deep depth of field" (배경까지 선명하게)
- 조명: "soft natural daylight entering from floor-to-ceiling glass window" (⛔ 스튜디오 조명 금지)
- 피부: "realistic skin texture" (⛔ "smooth", "flawless", "healthy glow" 금지)
- 배경: "sharp in-focus background showing luxurious interior with furniture, plants clearly visible" (⛔ 블러 절대 금지!)
- 분위기: "refined smart-casual aesthetic, understated wealth" (절제된 고급스러움)
- 품질: "ultra-realistic, photorealistic, 8K quality"

절대 피해야 할 것 (⚠️ 매우 중요):
- IMAGE1, IMAGE2 형식 사용 (반드시 Figure 1, Figure 2 사용!)
- ⛔ 배경 블러 관련 표현 절대 금지: "blurred background", "soft background", "bokeh", "shallow depth of field"
- ⛔ 과장된 표정 금지: "big smile", "enthusiastic", "excited", "energetic expression"
- ⛔ 광고/상업적 표현 금지: "advertisement", "commercial", "promotional", "marketing"
- ⛔ 인공적인 조명 금지: "studio lighting", "dramatic lighting", "rim lighting", "spotlight"
- ⛔ 완벽한 피부 표현 금지: "smooth skin", "flawless", "healthy glow", "perfect complexion"
- "taking a selfie", "holding phone", "smartphone", "camera in hand" 등 카메라/폰 관련 표현
- "extended arm", "arm reaching forward" 등 팔이 카메라 쪽으로 뻗는 묘사
- 화면 가장자리에 손/팔이 잘려 보이는 묘사
- 중복 표현

핵심 키워드 (반드시 포함):
- "luxurious modern interior" 또는 "luxury designer armchair"
- "calm, confident, intelligent expression"
- "full body visible"
- "soft natural daylight from floor-to-ceiling glass window"
- "sharp in-focus background"`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    // Gemini 3 Flash: 아바타/제품 이미지 분석을 위한 중간 해상도 설정
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['prompt', 'locationDescription'],
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'Seedream 4.5 편집 명령 형태 프롬프트 (영어, 50-80단어, Figure 1/Figure 2 형식 필수, 편집 명령으로 시작)',
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
    // Seedream 4.5 Figure 형식 폴백 응답 (편집 명령 형태) - 럭셔리 에디토리얼 스타일
    const fallbackPrompt = isSelfieMode
      ? `Place the model from Figure 1 with both hands holding the product from Figure 2 in a luxurious modern interior. ${selfieAngleSettings[input.cameraComposition || 'selfie-front']}, looking directly at camera with calm, confident, intelligent expression. Natural skin with visible pores and subtle texture. Soft natural daylight entering from floor-to-ceiling glass window. Sharp in-focus background with luxury furniture and plants clearly visible. Shot on Sony A7IV, 35mm f/8, deep depth of field. Vertical 9:16. Ultra-realistic cinematic editorial photography, 8K quality.`
      : 'Place the model from Figure 1 seated comfortably on a luxury designer armchair, naturally holding the product from Figure 2. Full body visible. Camera slightly diagonal to subject. Calm, confident, intelligent expression. Soft natural daylight entering from floor-to-ceiling glass window behind. Sharp in-focus background showing luxurious modern interior with coffee table, magazines, and plants clearly visible. Refined smart-casual aesthetic. Shot on Sony A7IV, 35mm f/8, deep depth of field. Vertical 9:16. Ultra-realistic cinematic editorial photography, 8K quality.'

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
    // Gemini 3 Flash: 제품 이미지 분석을 위한 중간 해상도 설정
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
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
 * 아바타 특성을 영어 프롬프트 텍스트로 변환
 * @param characteristics - 아바타 특성 정보
 * @returns 아바타 특성 설명 텍스트
 */
function buildAvatarCharacteristicsText(characteristics: AvatarCharacteristics): string {
  const parts: string[] = []

  // 인종/피부톤
  const ethnicityMap: Record<string, string> = {
    korean: 'Korean',
    eastAsian: 'East Asian',
    western: 'Caucasian',
    southeastAsian: 'Southeast Asian',
    black: 'African',
    hispanic: 'Hispanic',
    mixed: 'mixed ethnicity',
  }

  // 성별
  const genderMap: Record<string, string> = {
    female: 'woman',
    male: 'man',
    nonbinary: 'person',
  }

  // 나이대
  const ageMap: Record<string, string> = {
    teen: 'teenage',
    early20s: 'in their early 20s',
    late20s: 'in their late 20s',
    '30s': 'in their 30s',
    '40plus': 'in their 40s',
  }

  // 키
  const heightMap: Record<string, string> = {
    short: 'petite',
    average: 'average height',
    tall: 'tall',
  }

  // 여성 체형 (구체적인 신체 비율 포함)
  const femaleBodyTypeMap: Record<string, string> = {
    slim: 'slim slender body with 32-24-34 inch proportions, narrow shoulders, small bust, thin waist, lean hips',
    average: 'average female body with 34-26-36 inch proportions, moderate bust, defined waist, balanced hips',
    athletic: 'athletic toned female body with 34-25-35 inch proportions, firm muscles, toned abs, strong legs, defined arms',
    curvy: 'hourglass figure body with 36-24-36 inch proportions, full bust (D-cup), very slim tiny waist, shapely round hips, slender toned legs',
    plussize: 'plus-size female body with 42-36-46 inch proportions, very large bust, soft rounded belly, wide hips, thick thighs',
  }

  // 남성 체형 (구체적인 신체 비율 포함)
  const maleBodyTypeMap: Record<string, string> = {
    slim: 'slim lean male body with narrow shoulders, thin arms, flat chest, slim waist, lean legs',
    average: 'average male body with moderate shoulders, normal chest, slight belly, standard proportions',
    athletic: 'athletic muscular male body with broad shoulders (18+ inches), defined chest muscles, visible six-pack abs, V-shaped torso, muscular arms and legs',
    curvy: 'stocky male body with broad frame, thick chest, solid midsection, strong thick legs',
    plussize: 'plus-size male body with large frame, broad chest, round belly, thick arms and legs',
  }

  // 기본 체형 (성별 불명 시)
  const defaultBodyTypeMap: Record<string, string> = {
    slim: 'slim slender build with lean proportions',
    average: 'average build with balanced proportions',
    athletic: 'athletic toned build with defined muscles',
    curvy: 'curvy build with pronounced proportions',
    plussize: 'plus-size build with fuller figure',
  }

  // 성별에 따른 체형 설명 반환
  const getBodyTypeDesc = (bodyType: string, gender?: string): string => {
    if (gender === 'female') {
      return femaleBodyTypeMap[bodyType] || defaultBodyTypeMap[bodyType] || bodyType
    } else if (gender === 'male') {
      return maleBodyTypeMap[bodyType] || defaultBodyTypeMap[bodyType] || bodyType
    }
    return defaultBodyTypeMap[bodyType] || bodyType
  }

  // 헤어스타일
  const hairStyleMap: Record<string, string> = {
    longStraight: 'long straight hair',
    bob: 'bob haircut',
    wavy: 'wavy hair',
    ponytail: 'ponytail',
    short: 'short hair',
  }

  // 머리 색상
  const hairColorMap: Record<string, string> = {
    blackhair: 'black hair',
    brown: 'brown hair',
    blonde: 'blonde hair',
    custom: '',
  }

  // 기본 주체 (성별 + 인종 + 나이)
  const gender = characteristics.gender ? genderMap[characteristics.gender] : 'person'
  const ethnicity = characteristics.ethnicity ? ethnicityMap[characteristics.ethnicity] : ''
  const age = characteristics.age ? ageMap[characteristics.age] : ''

  let subject = ethnicity ? `${ethnicity} ${gender}` : gender
  if (age) subject += ` ${age}`
  parts.push(subject)

  // 체형 (키 + 체형) - 성별에 따른 구체적인 신체 비율 사용
  const bodyParts: string[] = []
  if (characteristics.height) {
    bodyParts.push(heightMap[characteristics.height])
  }
  if (characteristics.bodyType) {
    bodyParts.push(getBodyTypeDesc(characteristics.bodyType, characteristics.gender))
  }
  if (bodyParts.length > 0) {
    parts.push(`with ${bodyParts.join(', ')}`)
  }

  // 헤어스타일
  if (characteristics.hairStyle) {
    let hair = hairStyleMap[characteristics.hairStyle]
    // 머리 색상 적용
    if (characteristics.hairColor === 'custom' && characteristics.customHairColor) {
      hair = `${characteristics.customHairColor} colored ${hair}`
    } else if (characteristics.hairColor && hairColorMap[characteristics.hairColor]) {
      hair = `${hairColorMap[characteristics.hairColor]}, ${hair}`
    }
    parts.push(hair)
  }

  return parts.join(', ')
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
    wearing: '착용샷 (모델이 Figure 1의 의류/속옷 제품을 직접 입고 있는 패션 광고 - 제품을 들거나 액세서리로 취급하지 않음!)',
    lifestyle: '라이프스타일 (일상에서 제품과 함께하는 자연스러운 모습)',
    unboxing: '언박싱 (제품을 개봉하거나 소개하는 리뷰 스타일)',
    seasonal: '시즌/테마 (계절감이나 특별한 테마가 있는 광고)',
  }

  // 의상 옵션 프롬프트 매핑 (outfit 키를 구체적인 프롬프트로 변환)
  const outfitPromptMap: Record<string, string> = {
    keep_original: '',  // 원본 의상 유지 시 추가 안함
    casual_everyday: 'Model wearing casual everyday outfit: comfortable t-shirt or blouse with jeans or casual pants, relaxed and approachable style.',
    formal_elegant: 'Model wearing formal elegant outfit: sophisticated dress or tailored suit, refined and polished appearance.',
    professional_business: 'Model wearing professional business attire: crisp blazer with dress shirt, polished and authoritative look.',
    sporty_athletic: 'Model wearing sporty athletic wear: comfortable activewear or athleisure, energetic and dynamic style.',
    cozy_comfortable: 'Model wearing cozy comfortable clothing: soft knit sweater or cardigan, warm and inviting appearance.',
    trendy_fashion: 'Model wearing trendy fashion-forward outfit: current season styles, stylish and on-trend look.',
    minimal_simple: 'Model wearing minimal simple outfit: clean solid-colored clothing without busy patterns, understated elegance.',
  }

  // 옵션을 한국어 설명으로 변환 (outfit은 구체적인 프롬프트로 확장)
  const optionDescriptions = Object.entries(input.selectedOptions)
    .map(([key, value]) => {
      // outfit 옵션은 구체적인 프롬프트로 변환
      if (key === 'outfit' && value !== 'keep_original') {
        const outfitPrompt = outfitPromptMap[value]
        if (outfitPrompt) {
          return `outfit: ${value} → ${outfitPrompt}`
        }
      }
      return `${key}: ${value}`
    })
    .join(', ')

  // 제품 정보 섹션
  const productSection = input.productName
    ? `제품 정보:
- 제품명: ${input.productName}
- 설명: ${input.productDescription || '없음'}`
    : '제품 정보: 첨부된 이미지 참고'

  // 이미지 첨부 순서 계산 (Figure 1, Figure 2 형태로 Seedream 4.5 문서 규격에 맞춤)
  let imageIndex = 1
  const productImageIndex = input.productImageUrl ? imageIndex++ : null
  const avatarImageIndices = input.avatarImageUrls?.length ? Array.from({ length: input.avatarImageUrls.length }, () => imageIndex++) : []
  const outfitImageIndex = input.outfitImageUrl ? imageIndex++ : null
  const referenceStyleImageIndex = input.referenceStyleImageUrl ? imageIndex++ : null

  // AI 생성 아바타 여부 확인 (아바타 이미지 없이 텍스트 설명만 있는 경우)
  const isAiGeneratedAvatar = !!input.aiAvatarDescription && !input.avatarImageUrls?.length

  // 아바타 특성 텍스트 생성 (있는 경우)
  const avatarCharacteristicsText = input.avatarCharacteristics
    ? buildAvatarCharacteristicsText(input.avatarCharacteristics)
    : null

  // 이미지 참조 안내 (Figure 1, Figure 2 형태로 Seedream 4.5 문서 규격에 맞춤)
  const imageReferenceSection = `
=== ATTACHED IMAGES GUIDE ===
${productImageIndex ? `[Figure ${productImageIndex}] = PRODUCT IMAGE
- This is the product to advertise.
- ⭐ CRITICAL: You MUST first analyze and identify WHAT this product is (e.g., "water bottle", "skincare serum", "action figure", "ceramic mug", "sneakers").
- IMPORTANT: The product may be a figurine, doll, character merchandise, or statue that has human-like form. Even if it looks like a person, it is a PRODUCT, NOT a real human model. Do NOT transform or animate it into a real person.
- In your prompt, describe the product specifically (e.g., "the water bottle product from Figure 1", "the action figure from Figure 1") instead of just "the product from Figure 1".
- Reference format: "the [specific product name] from Figure ${productImageIndex}"` : ''}
${avatarImageIndices.length ? `[Figure ${avatarImageIndices.join('], [Figure ')}] = MODEL IMAGE(S) (${avatarImageIndices.length} image${avatarImageIndices.length > 1 ? 's' : ''})
- This is the human model for the advertisement.
- Reference as "the model in Figure ${avatarImageIndices[0]}" in your prompt.
${avatarCharacteristicsText ? `- ⭐⭐⭐ CRITICAL - MUST PRESERVE EXACT PHYSICAL CHARACTERISTICS ⭐⭐⭐
  * Physical traits (USE THESE EXACT DESCRIPTIONS VERBATIM): ${avatarCharacteristicsText}
  * DO NOT shorten, summarize, or paraphrase these descriptions!
  * "hourglass figure with fuller bust and hips, slim waist, attractive curves" must stay as-is, NOT shortened to just "hourglass figure"
  * Include the FULL body type description in your prompt to maintain visual consistency.
  * Example: "The ${avatarCharacteristicsText} model from Figure ${avatarImageIndices[0]} holding..."` : ''}` : ''}
${isAiGeneratedAvatar ? `[NO MODEL IMAGE - AI-GENERATED AVATAR]
- There is NO model image provided (no Figure for the model).
- You MUST describe the model using TEXT description only.
- AI Avatar Description: "${input.aiAvatarDescription}"
- DO NOT reference any "Figure 2" or "model from Figure X" - there is no such image!
- Instead, describe the model directly in the prompt using the description above.
- Example: "A ${input.aiAvatarDescription} holding the product from Figure 1..."` : ''}
${outfitImageIndex ? `[Figure ${outfitImageIndex}] = OUTFIT IMAGE
- This shows the clothing/outfit the model should wear.
- Reference as "the outfit in Figure ${outfitImageIndex}" in your prompt.` : ''}
${referenceStyleImageIndex ? `[Figure ${referenceStyleImageIndex}] = STYLE REFERENCE IMAGE (Style only!)
- Use ONLY for mood, color palette, lighting, and composition style.
- DO NOT copy any products or people from this image! Extract only abstract style elements.
- Apply the style from Figure ${referenceStyleImageIndex} to the final composition.` : ''}`

  const prompt = `당신은 이미지 광고 프롬프트 전문가입니다.
최고 품질의 상업 광고 이미지를 생성하기 위한 프롬프트를 작성해주세요.

=== 이미지 생성 프롬프트 가이드라인 ===

${isAiGeneratedAvatar ? `
⭐⭐⭐ 중요: AI 생성 아바타 모드 ⭐⭐⭐
이 요청은 **모델 이미지가 없이** AI가 모델을 생성해야 하는 케이스입니다.
따라서 "Figure 2", "the model from Figure X" 같은 이미지 참조를 절대 사용하지 마세요!

${input.aiAvatarDescription?.includes('automatically select') ? `
🎯 자동 선택 모드: 모든 아바타 옵션이 '무관'으로 설정되었습니다.
**당신이 제품에 가장 적합한 모델을 직접 설계해야 합니다!**

제품 정보를 바탕으로 다음을 결정하세요:
- 인종/민족: 제품의 타겟 시장에 맞게 (예: 한국 화장품 → Korean, 글로벌 전자제품 → 다양한 인종)
- 성별: 제품 특성에 맞게 (예: 남성용 면도기 → male, 여성용 화장품 → female, 중립적 제품 → 어느 쪽이든)
- 나이대: 제품 타겟에 맞게 (예: 안티에이징 → 30s-40s, 트렌디한 제품 → 20s-30s)
- 스타일: 제품 이미지에 맞게 (예: 럭셔리 브랜드 → elegant, 일상 제품 → natural)

프롬프트 예시: "A Korean woman in her late 20s with natural black hair and a friendly smile, naturally holding..."
` : `
AI 아바타 설명: "${input.aiAvatarDescription}"
`}

프롬프트 형식 (AI 아바타용):
- 먼저 Figure 1 이미지를 분석하여 제품이 무엇인지 파악 (예: water bottle, figurine, skincare serum, etc.)
- 모델을 텍스트로 상세히 묘사 (인종, 성별, 나이, 외모 특징 포함)
- 제품을 구체적인 이름으로 참조 (예: "the water bottle from Figure 1", "the action figure from Figure 1")
- 예: "A Korean woman in her 20s with black hair naturally holding the skincare serum from Figure 1..."

광고 유형별 프롬프트 예시 (AI 아바타 - 프리미엄 광고 품질):
- holding: "A [인종] [성별] in their [나이대] with [외모 특징] confidently holding the [구체적 제품명] from Figure 1 in a [환경]. Authentic confident expression. Natural skin with visible pores and subtle texture, individual hair strands with natural flyaways. Professional commercial lighting. Shot on Sony A7IV, 85mm f/1.8, sharp focus. 4K resolution, hyperrealistic, premium advertisement quality."
- using: "A [인종] [성별] in their [나이대] using the [구체적 제품명] from Figure 1 in a [환경]. Genuine expression with confident demeanor. Natural skin texture with subtle imperfections, hair with natural flyaways. Professional lighting setup. Shot on Sony A7IV, 85mm f/1.8, sharp focus. 4K resolution, hyperrealistic."
- lifestyle: "A [인종] [성별] in a [일상 환경], the [구체적 제품명] from Figure 1 nearby. Natural skin with visible pores. Confident authentic moment. Professional commercial lighting. Shot on Sony A7IV, 85mm f/1.8, sharp focus. 4K resolution, hyperrealistic, premium advertisement quality."

⚠️ 절대 금지:
- "the model from Figure 2" - 모델 이미지가 없습니다!
- "Copy the appearance from Figure 2" - 해당 Figure가 존재하지 않습니다!
- 존재하지 않는 Figure 번호 참조
- "A person" 같은 모호한 표현 - 반드시 구체적인 인물 묘사 필요!
- "the product from Figure 1" 같은 일반적인 표현 - 제품 유형 명시 필요!

✅ 반드시 사용:
- 구체적인 인물 묘사 (인종, 성별, 나이대, 외모 특징)
- "the [구체적 제품명] from Figure 1" - 제품을 구체적으로 참조 (예: "the skincare bottle from Figure 1", "the action figure from Figure 1")
- 프리미엄 광고 품질 문구: "Shot on Sony A7IV, 85mm f/1.8, sharp focus. Natural skin with visible pores and texture. 4K resolution, hyperrealistic, premium advertisement quality"
- ⛔ 금지: "smooth skin", "healthy glow", "flawless", "perfect" (AI 느낌 유발)
` : `
이미지-to-이미지 편집/합성을 위한 프롬프트입니다.
자연어 편집 명령을 사용하여 참조 이미지들의 요소를 조합합니다.

⭐ 핵심 프롬프트 형식:
- "Place the model from Figure X holding the [구체적 제품명] from Figure Y in [환경]"
- "Compose a scene with the model from Figure X naturally presenting the [구체적 제품명] from Figure Y"
- "Copy the appearance of the model from Figure X and place them holding the [구체적 제품명] from Figure Y"

참조 형식:
- 반드시 "Figure 1", "Figure 2" 형식 사용 (IMAGE1, IMAGE2 아님!)
- ⭐ 제품 참조 시: 구체적인 제품명 포함 필수! (예: "the water bottle from Figure 1", "the skincare serum from Figure 1", "the action figure from Figure 1")
- 모델 참조: "the model in Figure 2", "copy the model from Figure 2"

광고 유형별 편집 명령:
- productOnly: "Place the [구체적 제품명] from Figure 1 in a [배경] with [조명]"
- holding: "Place the model from Figure 2 holding the [구체적 제품명] from Figure 1 in [환경]"
- using: "Compose the model from Figure 2 naturally using the [구체적 제품명] from Figure 1"
- wearing: "⭐ 착용샷 - 모델이 Figure 1의 [의류/속옷 제품명]을 직접 착용! Place the model from Figure 2 WEARING the [구체적 의류/속옷 제품명] from Figure 1. 제품을 들거나 액세서리로 취급하지 말고, 실제로 입고 있어야 합니다!"
- lifestyle: "Compose a lifestyle scene with the model from Figure 2 and the [구체적 제품명] from Figure 1 nearby"
`}

=== UGC 스타일 포토리얼리즘 (AI 티를 벗겨내는 핵심 전략) ===

⭐ 1. 조리개 설정 (매우 중요 - AI 기본값 f/1.8 절대 금지!):
- AI는 기본적으로 f/1.8~f/2.0을 선호하여 배경이 뭉개지고 "가짜 배경 앞에 서 있는" 느낌을 줍니다.
- ✅ UGC 추천: f/11 ~ f/16 - 배경이 완전히 선명하게 보여 "실제 공간에서 찍은 사진" 신뢰감을 줍니다.
- 카메라 스펙: "Shot on Sony A7IV, 85mm f/1.8, sharp focus" (전문 카메라 스펙으로 고화질 유도)

⭐ 2. 조명 (스튜디오 조명 버리고 일상 선택):
- ❌ Bad: "Professional lighting, soft light, studio light, even lighting"
- ✅ Good: "Natural light from a window", "Harsh sunlight with shadows", "Fluorescent indoor lighting", "Overcast sky"
- 그림자가 너무 깔끔하면 가짜 같습니다: "realistic shadows, imperfect lighting, uneven natural lighting"

⭐ 3. 피부/머리카락 텍스처 (AI 느낌 피하기 - 핵심!):
- ⛔ 금지: "smooth skin", "flawless", "healthy glow", "perfect skin" (AI 느낌 유발)
- ✅ 피부: "natural skin with visible pores, subtle texture, minor imperfections" (모공 보여야 진짜 같음)
- ✅ 머리카락: "individual hair strands with natural flyaways and slight messiness" (잔머리 필수)
- ✅ 카메라 스펙: "Shot on Sony A7IV, 85mm f/1.8, sharp focus, 4K resolution, hyperrealistic"

⭐ 4. 구도 (프리미엄 광고 구도):
- ✅ Good: 안정적인 중앙 구도 또는 삼분법
- 배경 요소: "clean modern environment", "premium setting"
- 프리미엄 느낌: 깔끔하고 세련된 배경

⭐ 5. 배경 (선명하고 세련되게):
- 배경이 선명하게 보여야 함: "sharp in-focus background with visible environment details"
- 프리미엄 환경: "modern, premium setting"

⭐ 필수 문구 (프롬프트 끝에 반드시 추가):
"Shot on Sony A7IV with 85mm f/1.8 lens, sharp focus on face and product. Natural skin with visible pores and subtle texture, minor imperfections. Individual hair strands with natural flyaways. Authentic confident expression. Professional commercial lighting. 4K resolution, hyperrealistic, premium advertisement quality."

⚠️ 피규어/캐릭터 상품 중요 주의사항:
- Figure 1(제품)이 피규어, 인형, 캐릭터 상품, 조각상 등 인물 형태인 경우가 있습니다.
- 이 경우 제품을 실제 사람으로 변환하거나 애니메이션화하지 마세요!
- 프롬프트에 반드시 포함: "Preserve the exact appearance of the product from Figure 1 and keep it as a physical figurine; do not transform it into a real person"
${isAiGeneratedAvatar ? `- AI 생성 모델이 피규어를 손에 들고 있거나 보여주는 형태로 구성` : `- 모델(Figure 2)이 피규어를 손에 들고 있거나 보여주는 형태로 구성`}

⭐⭐⭐ 착용샷(wearing) 타입 중요 주의사항 ⭐⭐⭐
광고 유형이 "wearing"인 경우, 반드시 다음 규칙을 따르세요:
- Figure 1의 제품(의류, 속옷, 액세서리 등)을 모델이 **직접 착용**해야 합니다!
- ❌ 잘못된 예: "presenting the bra as an accessory", "holding the underwear", "the bra nearby"
- ✅ 올바른 예: "wearing the red push-up bra from Figure 1", "dressed in the lingerie from Figure 1"
- 속옷(브라, 팬티, 란제리 등) 제품인 경우: 모델이 해당 속옷을 **실제로 입고 있는** 이미지여야 합니다!
- 의류 제품인 경우: 모델이 해당 의류를 **실제로 입고 있는** 패션 화보 이미지여야 합니다!
- 액세서리(목걸이, 귀걸이, 시계 등)인 경우: 모델이 해당 액세서리를 **착용하고 있는** 이미지여야 합니다!
- 절대 제품을 손에 들거나, 옆에 놓거나, 액세서리로 취급하지 마세요!

제품 보존 (중요):
- "Preserve the exact appearance of the product from Figure 1"
- 제품의 로고, 라벨, 브랜드 마크 원본 유지

절대 금지 (Constraints):
- 새로운 텍스트, 워터마크, 오버레이 추가
- 피규어/인형 제품을 실제 사람으로 변환
- ⛔ 인공적인 배경 블러/보케 효과 (NO artificial background blur, NO bokeh)
- ⛔ 얕은 피사계 심도 (NO shallow depth of field)
- ⛔ 인공적인 필터나 스타일화 (No artificial filters or stylization)
- ⛔ 얼굴 변형이나 미화 (No facial reshaping or beautification)
- "Do not add any new text, letters, words, or watermarks"
- "Maintain natural proportions and lighting"

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
${input.selectedOptions.outfit && input.selectedOptions.outfit !== 'keep_original' ? `
⭐ 의상 옵션 필수 포함: 위 outfit 옵션에 명시된 의상 설명을 프롬프트에 반드시 포함하세요!
- 제품(Figure 1)은 제외하고, 모델이 착용하는 다른 의상에 대한 설명입니다.
- 예: "wearing casual everyday outfit with comfortable t-shirt and jeans" 형태로 포함` : ''}

${input.additionalPrompt ? `추가 요청: ${input.additionalPrompt}` : ''}

${imageReferenceSection}

위 정보를 바탕으로 최적화된 영어 프롬프트를 생성해주세요.

${isAiGeneratedAvatar ? `
=== AI 생성 아바타 모드 필수 규칙 ===
⭐ 이것은 AI 아바타 모드입니다. 모델 이미지가 없으므로 Figure 2를 참조하면 안 됩니다!

1. ⭐ 먼저 Figure 1 이미지를 분석하여 제품이 무엇인지 파악하세요 (예: water bottle, figurine, skincare serum, action figure)
2. 모델은 텍스트로 설명: "A ${input.aiAvatarDescription}..." 형태로 시작
3. 제품은 구체적으로 참조: "the [구체적 제품명] from Figure 1" 사용 (절대 "the product from Figure 1" 금지!)
4. ❌ 절대 사용 금지: "Figure 2", "the model from Figure", "copy the model from Figure", "the product from Figure 1"
5. 제품 보존: "Preserve the exact appearance of the [구체적 제품명] from Figure 1"
6. 텍스트 금지: "Do not add any new text, letters, words, or watermarks"
7. 피규어 제품인 경우: "keep it as a physical figurine; do not transform it into a real person"
8. 🔥 프리미엄 광고 품질: 프롬프트 끝에 반드시 "Shot on Sony A7IV, 85mm f/1.8, sharp focus. Natural skin with visible pores and texture, individual hair strands with flyaways. 4K resolution, hyperrealistic, premium advertisement quality" 추가
9. ⛔ 금지어: "smooth skin", "healthy glow", "flawless", "perfect" (AI 느낌 유발)
10. ⭐⭐ 모델 체형 필수: 아바타 설명에 체형 정보가 있으면 반드시 그대로 프롬프트에 포함하세요!
    - "hourglass figure with fuller bust and hips, slim waist, attractive curves" → 그대로 사용 (절대 축약 금지!)
    - 체형 설명을 생략하거나 축약하면 안 됨!

프롬프트 예시 (AI 아바타 - 체형 포함 - 프리미엄 광고 품질):
"A Korean woman in her late 20s with hourglass figure with fuller bust and hips, slim waist, attractive curves. Compose the model confidently holding the water bottle from Figure 1 in a modern indoor setting. Authentic confident expression. Natural skin with visible pores and subtle texture, individual hair strands with natural flyaways. Professional commercial lighting. Shot on Sony A7IV, 85mm f/1.8, sharp focus on face and product. Preserve the exact appearance of the water bottle from Figure 1. Do not add any new text. 4K resolution, hyperrealistic, premium advertisement quality."
` : `
=== 필수 규칙 ===
1. ⭐ 먼저 Figure 1 이미지를 분석하여 제품이 무엇인지 파악하세요 (예: water bottle, figurine, skincare serum, action figure)
2. 반드시 "Figure 1", "Figure 2" 형식으로 이미지 참조 (IMAGE1, IMAGE2 형식 사용 금지!)
3. 편집 명령 형태로 시작: "Place...", "Compose...", "Copy... and place..."
4. 제품은 구체적으로 참조: "the [구체적 제품명] from Figure 1" (예: "the water bottle from Figure 1", "the figurine from Figure 1")
5. 제품 보존: "Preserve the exact appearance of the [구체적 제품명] from Figure 1"
6. 텍스트 금지: "Do not add any new text, letters, words, or watermarks"
7. 피규어/인형 제품인 경우: "Preserve the exact appearance of the figurine from Figure 1 and keep it as a physical figurine; do not transform it into a real person"
8. 🔥 프리미엄 광고 품질: 프롬프트 끝에 반드시 "Shot on Sony A7IV, 85mm f/1.8, sharp focus. Natural skin with visible pores and texture, individual hair strands with flyaways. 4K resolution, hyperrealistic, premium advertisement quality" 추가
9. ⛔ 금지어: "smooth skin", "healthy glow", "flawless", "perfect" (AI 느낌 유발)
10. ⭐⭐ 모델 체형 필수: 위에서 제공된 모델의 Physical traits를 그대로 프롬프트에 포함하세요!
    - "hourglass figure with fuller bust and hips, slim waist, attractive curves" → 그대로 사용 (절대 축약 금지!)
    - "slim slender build", "athletic toned build" 등도 정확히 포함
    - 체형 설명을 생략하거나 "hourglass figure"로만 축약하면 안 됨!

프롬프트 예시 형식 (제품이 물병인 경우 - 체형 포함 - 프리미엄 광고 품질):
"Place the Korean woman in her late 20s with hourglass figure with fuller bust and hips, slim waist, attractive curves model from Figure 2 confidently holding the water bottle from Figure 1 in a modern indoor setting. Authentic confident expression. Natural skin with visible pores and subtle texture, individual hair strands with natural flyaways. Professional commercial lighting. Shot on Sony A7IV, 85mm f/1.8, sharp focus on face and product. Preserve the exact appearance of the water bottle from Figure 1. Copy the appearance of the model from Figure 2. Do not add any new text. 4K resolution, hyperrealistic, premium advertisement quality."
`}`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    // Gemini 3 Flash: 제품/아바타 이미지 분석을 위한 중간 해상도 설정
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['optimizedPrompt', 'koreanDescription'],
      properties: {
        optimizedPrompt: {
          type: Type.STRING,
          description: isAiGeneratedAvatar
            ? '영어 프롬프트 (AI 아바타는 텍스트로 설명, 제품은 구체적 이름으로 Figure 1 참조 예: "the water bottle from Figure 1", Figure 2 사용 금지, 끝에 포토리얼리즘 문구 필수)'
            : '편집 명령 형태 영어 프롬프트 (Figure 1, Figure 2 형식 사용, 제품은 구체적 이름으로 참조 예: "the skincare serum from Figure 1", 끝에 포토리얼리즘 문구 필수)',
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

    // AI 아바타 여부에 따라 모델 설명 방식 결정
    // 자동 선택 모드인 경우 기본 아바타 설명 사용
    let modelDescription: string
    if (isAiGeneratedAvatar) {
      if (input.aiAvatarDescription?.includes('automatically select')) {
        // 자동 선택 모드 - 기본적으로 한국인 여성 모델 사용 (한국 시장 타겟)
        modelDescription = 'A Korean woman in her late 20s with natural black hair and a friendly, approachable appearance'
      } else {
        modelDescription = `A ${input.aiAvatarDescription}`
      }
    } else {
      modelDescription = 'The model from the reference image'
    }

    // === 스타일 옵션: UGC vs 프로페셔널 광고 ===
    // 향후 스타일 선택 기능 추가 시 사용 가능
    // UGC 스타일: 'Candid iPhone photo aesthetic, Instagram story quality. Natural skin with visible pores and subtle texture, minor imperfections. Individual hair strands with natural flyaways. Authentic casual expression, slight asymmetry in features. Soft natural daylight from window. Slightly off-center framing. Film grain ISO 400. Real smartphone photo quality.'

    // 프로페셔널 광고 스타일 (참조: 고급 광고 비주얼)
    const photoRealism = 'Hyper-realistic commercial advertisement visual. Dynamic pose with confident expression, clean skin tones with natural texture. Bold punchy studio lighting with cinematic key light and soft fill to sculpt facial features. Shallow depth of field isolates the subject while maintaining product sharpness. Ultra-sharp focus on product texture: surface details, material sheen, and fine details clearly visible. Premium advertising aesthetic, energetic and visually bold, optimized for social media hero frames.'

    const fallbackPrompts: Record<ImageAdType, string> = {
      productOnly: `Hyper-realistic product photography of the product from Figure 1 with dynamic floating elements or particles frozen mid-air. Bold studio background with punchy lighting. Ultra-sharp focus on texture: surface details, material quality, and fine features clearly visible. Cinematic key light with soft fill to enhance product gloss without harsh reflections. Premium commercial aesthetic, visually bold. ${logoPreserve} ${photoRealism}`,
      holding: `${modelDescription} confidently holds the product from Figure 1 with dynamic energy, bright confident expression. Clean skin tones with natural texture. Bold studio lighting with cinematic key light sculpting facial features. Shallow depth of field isolates subject while product stays sharp. Ultra-sharp focus on product texture and details. Premium advertising aesthetic, energetic and visually bold. ${logoPreserve} ${photoRealism}`,
      using: `${modelDescription} actively demonstrates the product from Figure 1 with energetic, dynamic pose. Confident expression showing genuine excitement. Bold punchy lighting creates high-impact commercial look. Ultra-sharp focus on product interaction and texture details. Shallow depth of field with motion clarity. Premium advertisement aesthetic, visually bold. ${logoPreserve} ${photoRealism}`,
      wearing: `Fashion advertisement featuring ${modelDescription.toLowerCase()} in confident dynamic pose WEARING the clothing/underwear product from Figure 1. The model must actually be wearing the product from Figure 1, NOT holding it or presenting it as an accessory. Bold studio lighting sculpts the form and fabric texture. Ultra-sharp focus on clothing details: fabric texture, stitching, material quality. Shallow depth of field isolates subject. Premium fashion advertising aesthetic, energetic and visually bold. ${logoPreserve} ${photoRealism}`,
      lifestyle: `${modelDescription.toLowerCase()} in energetic lifestyle moment with the product from Figure 1. Dynamic pose, confident expression. Bold lighting creates warm inviting atmosphere with high visual impact. Ultra-sharp focus on product integration. Shallow depth of field isolates key elements. Premium lifestyle advertising aesthetic, visually bold. ${logoPreserve} ${photoRealism}`,
      unboxing: `${modelDescription} reveals the product from Figure 1 with genuine excitement and dynamic energy. Elements frozen mid-air for dramatic effect. Bold punchy lighting. Ultra-sharp focus on product details and textures. Premium unboxing aesthetic, energetic and visually bold. ${logoPreserve} ${photoRealism}`,
      seasonal: `Festive seasonal advertisement featuring the product from Figure 1 with dynamic decorative elements. Bold warm lighting creates high-impact festive atmosphere. Ultra-sharp focus on product and seasonal details. Premium seasonal advertising aesthetic, energetic and visually bold. ${logoPreserve} ${photoRealism}`,
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
    wearing: '착용샷 - 모델이 제품(의류/속옷)을 직접 입고 있는 모습 (제품을 들거나 액세서리로 취급하지 않음)',
    lifestyle: '라이프스타일 - 일상 속에서 제품을 사용하는 장면',
    unboxing: '언박싱 - 제품 개봉/공개 장면',
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
   - reason: 왜 이 값을 선택했는지 상세한 근거 (참조 이미지의 어떤 요소를 보고 판단했는지)

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
    // Gemini 3 Flash: 참조 이미지 스타일 분석을 위한 높은 해상도 설정
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['analyzedOptions', 'overallStyle', 'suggestedPrompt'],
      properties: {
        analyzedOptions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['key', 'type', 'value', 'confidence', 'reason'],
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
              reason: {
                type: Type.STRING,
                description: '왜 이 값을 선택했는지 상세한 근거 (한국어, 예: "이미지에서 모델이 카메라를 응시하며 미소 짓고 있어 eye_contact와 smile을 선택했습니다")',
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
          enum: ['productOnly', 'holding', 'using', 'wearing', 'lifestyle', 'unboxing', 'seasonal'],
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
  modelPose?: ModelPoseType        // 모델 포즈 (선택)
  outfitPreset?: OutfitPresetType  // 의상 프리셋 (선택)
  outfitCustom?: string            // 의상 직접 입력 (선택)
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

  // 카메라 구도 설명 (조리개 값 포함 - UGC 스타일, 배경 완전 선명)
  const cameraCompositionDescriptions: Record<CameraCompositionType, { description: string; aperture: string; lens: string }> = {
    'selfie-high': {
      description: 'high angle selfie perspective, camera looking down from above eye level',
      aperture: 'f/11',
      lens: '28mm',
    },
    'selfie-front': {
      description: 'eye-level frontal view, direct eye contact with camera',
      aperture: 'f/11',
      lens: '35mm',
    },
    'selfie-side': {
      description: 'three-quarter angle, showing facial contours, slight side view',
      aperture: 'f/11',
      lens: '35mm',
    },
    tripod: {
      description: 'stable tripod shot, medium distance, waist to head visible',
      aperture: 'f/16',
      lens: '50mm',
    },
    closeup: {
      description: 'close-up portrait, face and upper body prominent',
      aperture: 'f/11',
      lens: '50mm',
    },
    fullbody: {
      description: 'full body shot, entire person visible in frame',
      aperture: 'f/16',
      lens: '35mm',
    },
    'ugc-closeup': {
      description: 'UGC-style intimate medium close-up, chest-up framing filling most of frame, eyes looking DIRECTLY into camera lens, natural relaxed expression, casual influencer vlog aesthetic like talking to viewer',
      aperture: 'f/8',
      lens: '35mm',
    },
  }

  // 카메라 구도에 따른 조리개/렌즈 설정 (배경 완전 선명)
  const cameraConfig = input.cameraComposition
    ? cameraCompositionDescriptions[input.cameraComposition]
    : { description: 'natural framing', aperture: 'f/11', lens: '35mm' }

  const cameraSection = input.cameraComposition
    ? `카메라 구도: ${cameraConfig.description}
카메라 스펙: Shot on Sony A7IV, 35mm f/8, deep depth of field (⚠️ 이 카메라 스펙을 프롬프트에 반드시 포함! 배경까지 선명하게!)`
    : `카메라 스펙: Shot on Sony A7IV, 35mm f/8, deep depth of field (⚠️ 이 카메라 스펙을 프롬프트에 반드시 포함! 배경까지 선명하게!)`

  // 모델 포즈 설명
  const modelPoseDescriptions: Record<ModelPoseType, string> = {
    'holding-product': '모델이 제품을 양손으로 자연스럽게 들고 카메라를 향해 보여주는 포즈. 제품이 얼굴 옆이나 가슴 높이에 위치.',
    'showing-product': '모델이 제품을 카메라 앞으로 내밀어 보여주는 포즈. 한 손 또는 양손으로 제품을 프레젠테이션하듯 제시.',
    'using-product': '모델이 실제로 제품을 사용하는 모습. 스킨케어면 얼굴에 바르는 중, 음료면 마시는 중 등 제품 특성에 맞는 사용 장면.',
    'talking-only': '⚠️ 제품이 화면에 절대 보이지 않음! 제품 없이 아바타만 화면에 등장. 손은 자연스럽게 내려두거나 제스처를 취하며 대화하듯 자연스러운 포즈.',
  }

  const poseSection = input.modelPose
    ? `모델 포즈: ${modelPoseDescriptions[input.modelPose]}
${input.modelPose === 'talking-only' ? '⚠️ 중요: 제품이 화면에 전혀 보이지 않아야 합니다! 아바타만 등장하는 프레임입니다.' : '이 포즈에 맞게 모델의 자세와 제품 배치를 설정해주세요.'}`
    : ''

  // 의상 프리셋 설명
  const outfitPresetDescriptions: Record<OutfitPresetType, string> = {
    casual_everyday: '캐주얼 일상 의상 - 편안한 티셔츠나 블라우스에 청바지 또는 캐주얼 팬츠',
    formal_elegant: '포멀/우아한 의상 - 세련된 드레스나 정장',
    professional_business: '비즈니스 의상 - 전문적인 비즈니스 정장이나 깔끔한 셔츠',
    sporty_athletic: '스포티 의상 - 운동복이나 애슬레저 스타일',
    cozy_comfortable: '편안한 의상 - 부드러운 니트 스웨터나 가디건',
    trendy_fashion: '트렌디 패션 의상 - 최신 유행 스타일',
    minimal_simple: '미니멀 심플 의상 - 깔끔한 단색 의상',
  }

  // 의상 설명 생성
  let outfitSection = ''
  if (input.outfitCustom) {
    outfitSection = `의상 설정 (사용자 지정): ${input.outfitCustom}`
  } else if (input.outfitPreset) {
    outfitSection = `의상 설정: ${outfitPresetDescriptions[input.outfitPreset]}`
  }

  const prompt = `당신은 GPT-Image 1.5 이미지 생성을 위한 프롬프트 전문가입니다.
**제품 설명 영상의 첫 프레임**에 사용될 이미지를 생성하기 위한 프롬프트를 작성해주세요.

⚠️ 중요: 이것은 정적인 광고 포스터가 아니라, 제품을 설명하는 **토킹 영상의 시작 장면**입니다.
인물이 곧 카메라를 향해 말을 시작할 것처럼 자연스럽고 편안한 모습이어야 합니다.

=== GPT-Image 1.5 프롬프트 가이드라인 (UGC 에디토리얼 스타일) ===
- 자연스러운 문장 형태로 작성
- 인물이 카메라를 바라보며 대화를 시작하려는 자연스러운 순간 포착
- 광고 포스터가 아닌 에디토리얼/UGC 스타일로 자연스럽게
- 인물의 외모, 표정, 포즈를 상세히 묘사
- ⭐ 프레이밍: "full body visible" 또는 "natural editorial distance" 권장 (얼굴만 클로즈업 금지!)
- ⭐ 배경: "sharp in-focus background with visible environment details" 필수 (블러/보케 절대 금지!)
- 조명: "soft natural daylight" (스튜디오 조명 금지)
- 50-100 단어 권장
- 제품 이미지가 첨부된 경우 "the product from Figure 1" 형식으로 참조 (IMAGE1 형식 사용 금지)
- ⭐ 카메라 스펙 필수 포함: "Shot on Sony A7IV, 35mm f/8, deep depth of field" (배경 선명하게!)
- ⭐ 스타일 필수: "ultra-realistic cinematic editorial photography, photorealistic, 8K quality"

=== 제품 정보 ===
${input.productInfo}

${input.productImageUrl ? `=== ATTACHED PRODUCT IMAGE (Figure 1) ===
- The attached image shows the PRODUCT to be featured.
- ⚠️ IMPORTANT: The product may be a figurine, doll, character merchandise, or statue with human-like form. Even if it looks like a person, it is a PRODUCT, NOT a real human. Do NOT transform or animate it into a real person.
- The AI-generated avatar should hold or present this product naturally.
- Reference as "the product from Figure 1" when describing product placement.
- Example: "holding the product from Figure 1", "presenting the product from Figure 1"` : ''}

=== 타겟 아바타 조건 (⚠️ 반드시 준수) ===
- 성별: ${targetGenderText}
- 연령대: ${targetAgeText}
- 스타일: ${styleText}
- 인종/민족: ${ethnicityText} ← ⭐ 이 인종 설정은 절대 변경하지 마세요!

=== 장소/배경 ===
${locationSection}

${cameraSection}

${poseSection}

${outfitSection ? `=== 의상 설정 ===
${outfitSection}
이 의상 스타일에 맞게 모델의 의상을 설정해주세요.` : ''}

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

2. 배경/장소 묘사 (⚠️ 배경 블러 절대 금지):
   - 제품 특성에 맞는 적절한 장소
   - 영상 촬영에 적합한 자연스러운 조명
   - 유튜브/SNS 영상에 어울리는 깔끔한 배경
   - ⛔ "blurred background", "soft background", "bokeh" 절대 금지 - 배경이 선명해야 UGC/인플루언서 스타일!
   - 반드시 "sharp in-focus background with visible environment details" 사용

3. 제품 배치 (Figure 형식 필수):
   - 인물이 제품을 자연스럽게 들고 있거나 옆에 두고 있는 모습
   - 제품 소개를 시작하려는 느낌
   - 제품 참조: "holding the product from Figure 1" 형식 사용 (IMAGE1 형식 금지!)

4. 기술적 품질 (영상용 - UGC 에디토리얼 스타일):
   - 에디토리얼 포토그래피 스타일 (광고 포스터 스타일 금지!)
   - ⭐ 프레이밍: "full body visible" 또는 "natural editorial distance" (얼굴만 클로즈업 금지!)
   - 조명: "soft natural daylight" (⛔ 스튜디오/드라마틱 조명 금지)
   - 텍스트, 로고, 그래픽 요소 없이 순수 촬영 이미지만
   - ⭐⭐⭐ 배경 필수: "sharp in-focus background with visible environment details" (⛔ 블러/보케 절대 금지!)
   - ⭐⭐⭐ 카메라 스펙 필수 (프롬프트에 반드시 포함!):
     "Shot on Sony A7IV, 35mm f/8, deep depth of field" (배경까지 선명하게!)
   - 끝에 반드시 추가: "ultra-realistic cinematic editorial photography, photorealistic, 8K quality"

다음 JSON 형식으로 응답하세요:
{
  "prompt": "영어로 작성된 GPT-Image 1.5 프롬프트 (50-100단어). ⭐ 필수 포함 사항: (1) 인종을 첫 부분에 명시, (2) 'the product from Figure 1' 형식, (3) 프레이밍: 'full body visible' 또는 'natural editorial distance', (4) 배경: 'sharp in-focus background with visible environment details', (5) 카메라: 'Shot on Sony A7IV, 35mm f/8, deep depth of field', (6) 스타일: 'ultra-realistic cinematic editorial photography'",
  "avatarDescription": "생성될 아바타에 대한 한국어 설명 (인종, 성별, 나이대, 외모, 스타일 등)",
  "locationDescription": "장소/배경에 대한 한국어 설명"
}

⭐ 프롬프트 작성 예시 (UGC 에디토리얼 스타일 - 배경 선명하게!):
- 한국인 여성: "A Korean woman in her 20s with black hair and natural flyaways, seated comfortably on a designer armchair, naturally holding the product from Figure 1. Full body visible. Calm, confident expression. Soft natural daylight from floor-to-ceiling window. Sharp in-focus background showing modern interior with plants and furniture clearly visible. Shot on Sony A7IV, 35mm f/8, deep depth of field. Ultra-realistic cinematic editorial photography, 8K quality."
- 한국인 남성: "A Korean man in his 30s with natural hair texture, standing in a cozy home office, presenting the product from Figure 1. Full body visible. Confident, intelligent expression. Soft natural daylight. Sharp background with bookshelf and desk clearly visible. Shot on Sony A7IV, 35mm f/8, deep depth of field. Ultra-realistic editorial photography, photorealistic."
- 서양인 여성: "A Caucasian woman with natural flyaways in hair, seated at a modern kitchen counter, naturally holding the product from Figure 1. Full body visible. Authentic calm expression. Soft natural daylight from large window. Sharp in-focus background showing kitchen interior details. Shot on Sony A7IV, 35mm f/8, deep depth of field. Cinematic editorial photography, 8K quality."
- 아시아인: "An Asian person with natural hair strands, seated on a luxury sofa, naturally holding the product from Figure 1. Full body visible in frame. Calm, confident expression. Soft natural daylight. Sharp background with modern living room furniture clearly visible. Shot on Sony A7IV, 35mm f/8, deep depth of field. Ultra-realistic editorial photography, photorealistic."`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    // Gemini 3 Flash: 제품 이미지 분석을 위한 중간 해상도 설정
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
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
    // Fallback response (UGC 에디토리얼 스타일)
    return {
      prompt: `A person seated comfortably in a modern living room, naturally holding a product. Full body visible in frame. Calm, confident expression. Soft natural daylight from large window. Sharp in-focus background with furniture and plants clearly visible. Shot on Sony A7IV, 35mm f/8, deep depth of field. Ultra-realistic cinematic editorial photography, photorealistic, 8K quality.`,
      avatarDescription: '자연스러운 느낌의 모델',
      locationDescription: '모던한 거실 배경',
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

/** 아바타 정보 (시나리오 추천용) */
export interface AvatarInfoForScenario {
  type: 'avatar' | 'outfit' | 'ai-generated'
  avatarName?: string
  outfitName?: string
  // AI 생성 아바타 옵션
  aiOptions?: {
    targetGender: 'male' | 'female' | 'any'
    targetAge: 'young' | 'middle' | 'mature' | 'any'
    style: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
    ethnicity: 'korean' | 'asian' | 'western' | 'any'
  }
}

/** AI 자동 설정 입력 */
export interface RecommendedOptionsInput {
  adType: ImageAdType
  productName?: string
  productDescription?: string
  categoryGroups: CategoryOptionGroup[]  // 해당 광고 유형의 카테고리 그룹들 (outfit 포함)
  language?: string  // 응답 언어 (ko, en, ja)
  hasAvatar?: boolean  // 아바타 포함 여부
  avatarInfo?: AvatarInfoForScenario  // 아바타 상세 정보
  productImageUrl?: string  // 제품 이미지 URL (멀티모달 분석용)
  productUsageMethod?: string  // 제품 사용 방법 (using 타입 전용)
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

/** AI 다중 시나리오 결과 (3개 시나리오 중 선택) */
export interface MultipleRecommendedOptionsResult {
  scenarios: Array<{
    title: string  // 시나리오 제목 (예: "프리미엄 고급스러운 스타일")
    description: string  // 시나리오 설명 (1-2문장)
    recommendedOptions: Record<string, {
      value: string
      customText?: string
      reason: string
    }>
    overallStrategy: string
    suggestedPrompt?: string
  }>
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
    lifestyle: 'Lifestyle - Natural everyday scene with the product',
    unboxing: 'Unboxing - Product reveal and first impression style',
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
    // Gemini 3 Flash: 제품/아바타 이미지 분석을 위한 중간 해상도 설정
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
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

/**
 * 제품 정보와 광고 유형에 맞는 3가지 다른 스타일의 시나리오를 AI가 추천합니다.
 * 사용자가 원하는 스타일을 선택할 수 있도록 다양한 옵션을 제공합니다.
 *
 * @param input - AI 자동 설정 입력
 * @returns 3개의 추천 시나리오
 */
export async function generateMultipleRecommendedOptions(
  input: RecommendedOptionsInput
): Promise<MultipleRecommendedOptionsResult> {
  const language = input.language || 'ko'

  // Output language instructions
  const outputLanguageInstructions: Record<string, string> = {
    ko: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt) in Korean.',
    en: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt) in English.',
    ja: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt) in Japanese.',
  }

  // Ad type descriptions
  const adTypeDescriptions: Record<ImageAdType, string> = {
    productOnly: 'Product only shot - Clean product photography showcasing the product alone',
    holding: 'Holding shot - Model naturally holding the product',
    using: 'Using shot - Model actively using/demonstrating the product',
    wearing: 'Wearing shot - Fashion advertisement with model wearing clothing/accessories',
    lifestyle: 'Lifestyle - Natural everyday scene with the product',
    unboxing: 'Unboxing - Product reveal and first impression style',
    seasonal: 'Seasonal/Theme - Advertisement with seasonal or themed atmosphere',
  }

  // Convert category groups to text (with keys and descriptions)
  const groupsDescription = input.categoryGroups.map(group => {
    const optionsText = group.options.map(opt => `    - ${opt.key}: ${opt.description}`).join('\n')
    return `[${group.key}]\n${optionsText}`
  }).join('\n\n')

  // Build avatar description
  let avatarDescription = ''
  if (input.hasAvatar && input.avatarInfo) {
    const { type, avatarName, outfitName, aiOptions } = input.avatarInfo
    if (type === 'ai-generated' && aiOptions) {
      const genderText = aiOptions.targetGender !== 'any' ? aiOptions.targetGender : 'any gender'
      const ageText = aiOptions.targetAge !== 'any' ? aiOptions.targetAge : 'any age'
      const styleText = aiOptions.style !== 'any' ? aiOptions.style : 'any style'
      const ethnicityText = aiOptions.ethnicity !== 'any' ? aiOptions.ethnicity : 'any ethnicity'
      avatarDescription = `AI-generated avatar: ${genderText}, ${ageText}, ${styleText} style, ${ethnicityText}`
    } else if (type === 'outfit' && outfitName) {
      avatarDescription = `Pre-made avatar with outfit: ${avatarName || 'Unknown'} (${outfitName})`
    } else if (avatarName) {
      avatarDescription = `Pre-made avatar: ${avatarName}`
    }
  }

  // Build product usage section for 'using' type
  const productUsageSection = input.productUsageMethod
    ? `\nProduct Usage Method: ${input.productUsageMethod}`
    : ''

  const prompt = `You are a creative director at a top advertising agency.

${outputLanguageInstructions[language] || outputLanguageInstructions.ko}

=== #1 PRIORITY: THE PRODUCT ===
Name: ${input.productName || 'Unknown'}
Description: ${input.productDescription || 'No description'}${productUsageSection}

Study this product deeply. What makes it special? Who desires it? What feelings does it evoke? What visual story would make someone want to buy it RIGHT NOW?
${input.hasAvatar ? `
=== #2 PRIORITY: THE MODEL ===
${avatarDescription || 'Model included'}

How can this person best showcase the product? What's their vibe? How do they naturally interact with products like this?` : ''}

=== AD FORMAT: ${input.adType} ===
${adTypeDescriptions[input.adType]}

=== OPTIONS TO CHOOSE FROM ===
${groupsDescription}

(Use "__custom__" with customText if the preset options don't capture your vision)

=== YOUR TASK ===

**STEP 1: ANALYZE THE PRODUCT DEEPLY**
Before creating scenarios, think about:
- What are its key features, benefits, ingredients, texture?
- Who is the ideal customer? What do they care about?
- What makes this product stand out from competitors?
- What emotions should the ad evoke?

**STEP 2: CREATE 3 COMPLETELY DIFFERENT SCENARIOS**
- Each scenario must highlight a DIFFERENT aspect of the product
- Each scenario must appeal to a DIFFERENT customer motivation
- Think creatively - there are no right or wrong answers
- The scenarios should feel like they could be real ads for this specific product

**STEP 3: MANDATORY DIVERSIFICATION (CRITICAL!)**
⚠️ IMPORTANT: The following options MUST be different across all 3 scenarios:
- background: MUST choose 3 DIFFERENT backgrounds
- mood: MUST choose 3 DIFFERENT moods
- If available: lighting, pose, gaze should also vary

Do NOT create 3 scenarios with the same background or same mood. This will be rejected.

**STEP 4: FOCUS ON THE PRODUCT**
- How can the product be the star of each scene?
- What setting makes this product look most appealing?
- What emotion will make customers want to buy this?`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['scenarios'],
      properties: {
        scenarios: {
          type: Type.ARRAY,
          description: '3개의 완전히 다른 시나리오 - 각각 다른 background와 mood 필수',
          items: {
            type: Type.OBJECT,
            required: ['title', 'description', 'recommendations', 'overallStrategy'],
            properties: {
              title: {
                type: Type.STRING,
                description: '시나리오 제목 (2-4 단어, 창의적이고 기억에 남는 제목)',
              },
              description: {
                type: Type.STRING,
                description: '시나리오 설명 - 생생한 장면 묘사 (1-2문장)',
              },
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
    const rawResult = JSON.parse(responseText) as {
      scenarios: Array<{
        title: string
        description: string
        recommendations: Array<{
          key: string
          value: string
          customText?: string
          reason: string
        }>
        overallStrategy: string
        suggestedPrompt?: string
      }>
    }

    // 배열을 Record 형태로 변환
    const scenarios = rawResult.scenarios.map(scenario => {
      const recommendedOptions: Record<string, { value: string; customText?: string; reason: string }> = {}
      for (const rec of scenario.recommendations) {
        recommendedOptions[rec.key] = {
          value: rec.value,
          customText: rec.customText,
          reason: rec.reason,
        }
      }

      return {
        title: scenario.title,
        description: scenario.description,
        recommendedOptions,
        overallStrategy: scenario.overallStrategy,
        suggestedPrompt: scenario.suggestedPrompt,
      }
    })

    return { scenarios }
  } catch {
    // Fallback: 단일 시나리오로 기본값 반환
    const fallbackOptions: Record<string, { value: string; reason: string }> = {}
    for (const group of input.categoryGroups) {
      fallbackOptions[group.key] = {
        value: group.options[0]?.key || '',
        reason: '기본 설정이 적용되었습니다.',
      }
    }

    return {
      scenarios: [{
        title: '기본 스타일',
        description: '제품에 맞는 기본 설정입니다.',
        recommendedOptions: fallbackOptions,
        overallStrategy: '제품 정보를 기반으로 기본 설정이 적용되었습니다.',
        suggestedPrompt: undefined,
      }],
    }
  }
}

// ============================================================
// 이미지 편집 프롬프트 개선
// ============================================================

/** 이미지 편집 프롬프트 입력 */
export interface MergeEditPromptInput {
  originalPrompt: string  // 기존 프롬프트 (참고용, 사용되지 않음)
  userEditRequest: string  // 유저가 입력한 수정 요청 (한국어 가능)
  currentImageUrl?: string  // 현재 이미지 URL (분석용)
}

/** 이미지 편집 프롬프트 결과 */
export interface MergeEditPromptResult {
  mergedPrompt: string  // 개선된 편집 프롬프트 (영어)
  editSummary: string   // 수정 내용 요약 (한국어)
}

/**
 * 이미지 편집 프롬프트 개선
 *
 * 유저의 편집 요청만을 기반으로 이미지 모델에 적합한 프롬프트를 생성합니다.
 * 기존 프롬프트의 설정(포즈, 배경 등)은 포함하지 않고 유저 요청만 개선합니다.
 *
 * @param input - 편집 프롬프트 입력
 * @returns 개선된 프롬프트와 수정 요약
 */
export async function mergeEditPrompt(input: MergeEditPromptInput): Promise<MergeEditPromptResult> {
  const prompt = `You are an expert image prompt engineer for AI image editing.
Your task is to enhance the user's edit request into a clear, effective prompt for an image editing AI model.

=== USER'S EDIT REQUEST ===
${input.userEditRequest}

=== INSTRUCTIONS ===
1. The user wants to modify an existing image. The image is provided for reference.
2. Your job is to enhance ONLY the user's edit request into a professional image editing prompt.
3. DO NOT include:
   - Pose descriptions
   - Framing/composition settings
   - Camera settings
   - Lighting setups (unless specifically requested by user)
   - Background descriptions (unless specifically requested by user)
   - Any other settings that were NOT mentioned by the user
4. ONLY describe what the user explicitly wants to change.
5. Keep the prompt focused and concise - describe only the modification.
6. Translate Korean to English if needed.
7. Use clear, direct language that an image editing AI can understand.

=== EXAMPLES ===
User request: "배경을 해변으로 바꿔줘"
Enhanced prompt: "Change the background to a tropical beach with clear blue sky, soft sand, and gentle ocean waves."

User request: "더 밝게"
Enhanced prompt: "Increase brightness and make the overall image brighter and more luminous."

User request: "표정을 웃는 얼굴로"
Enhanced prompt: "Change the facial expression to a warm, natural smile."

User request: "제품 색상을 빨간색으로"
Enhanced prompt: "Change the product color to vibrant red while maintaining its texture and material appearance."

=== OUTPUT FORMAT ===
Return a JSON object with:
- mergedPrompt: The enhanced edit prompt in English (focused only on what needs to change)
- editSummary: A brief summary of the edit (in Korean, 1 sentence)

Example response:
{
  "mergedPrompt": "Change the background to a modern minimalist kitchen with white marble countertops and natural daylight.",
  "editSummary": "배경을 모던 주방으로 변경합니다."
}`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['mergedPrompt', 'editSummary'],
      properties: {
        mergedPrompt: {
          type: Type.STRING,
          description: 'The final merged prompt in English',
        },
        editSummary: {
          type: Type.STRING,
          description: 'Brief summary of changes in Korean',
        },
      },
    },
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // 현재 이미지가 있으면 분석을 위해 포함 (선택사항)
  if (input.currentImageUrl) {
    const imageData = await fetchImageAsBase64(input.currentImageUrl)
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
    return JSON.parse(responseText) as MergeEditPromptResult
  } catch {
    // Fallback: 단순 연결
    return {
      mergedPrompt: `${input.originalPrompt} Additionally: ${input.userEditRequest}`,
      editSummary: '프롬프트가 수정되었습니다.',
    }
  }
}
