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
  selectedOptions: Record<string, string> // 사용자 선택 옵션
  additionalPrompt?: string              // 추가 프롬프트
}

/** 이미지 광고 프롬프트 생성 결과 */
export interface ImageAdPromptResult {
  optimizedPrompt: string     // Seedream 4.5 최적화 프롬프트 (영어)
  koreanDescription: string   // 한국어 설명
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

  // Image reference instructions (if images are attached)
  const imageReferenceSection = (input.productImageUrl || input.avatarImageUrl)
    ? `
IMPORTANT: Please carefully analyze the attached images.
${input.productImageUrl ? '- First image: This is the PRODUCT image. Describe the product\'s exact appearance including color, shape, material, and design details accurately.' : ''}
${input.avatarImageUrl ? '- ' + (input.productImageUrl ? 'Second' : 'First') + ' image: This is the MODEL (avatar) image. Reference the model\'s appearance, clothing, pose, and style.' : ''}
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
   - Product reference: Use "the product from the reference image" instead of brand/product names
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

  // Image reference instructions
  const imageReferenceSection = `
IMPORTANT: Please carefully analyze the attached avatar image.
- This is the person who will appear in the video speaking to camera
- Describe their exact appearance: face features, hair color/style, skin tone, clothing
- The generated image must show this EXACT same person

${input.productImageUrl ? 'Also analyze the product image and describe it accurately for consistent reproduction.' : ''}`

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
제품 설명 영상의 첫 프레임 이미지 생성을 위한 최고 품질의 프롬프트를 작성해주세요.

${seedreamGuide}

제품 정보:
${input.productInfo}

(참고: 제품명, 설명, 핵심 특징 등 구조화된 정보가 포함될 수 있습니다. 이를 참고하여 제품의 특성에 맞는 이미지를 구성하세요.)

${locationSection}

${cameraSection}

${imageReferenceSection}

요구사항:
1. 아바타가 카메라를 정면으로 바라보며 말하기 시작하는 포즈
2. 제품을 양손으로 들거나 옆에 자연스럽게 배치 (제품 특성에 맞게)
3. 세로 비율(9:16) 구도
4. 자연스럽고 전문적인 조명
5. 상업 광고 품질의 포토리얼리스틱 이미지
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

  // 이미지 참조 안내
  const imageReferenceSection = `
이미지 분석 안내:
${input.productImageUrl ? '- 제품 이미지: 제품의 색상, 형태, 질감, 디자인을 정확히 묘사해야 합니다.' : ''}
${input.avatarImageUrls?.length ? `- 모델 이미지 ${input.avatarImageUrls.length}장: 모델의 외모, 피부톤, 헤어스타일, 표정을 정확히 묘사해야 합니다.` : ''}
${input.outfitImageUrl ? '- 의상 이미지: 의상의 색상, 스타일, 디테일을 정확히 묘사해야 합니다.' : ''}`

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
5. 참조 이미지 요소는 "the product from the reference image", "the model from the reference" 형태로 지칭

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

포토리얼리즘 필수 요소:
- 피부: "natural skin texture with subtle imperfections, realistic pores"
- 조명: 방향성 포함 (예: "soft natural daylight from large window on the left")
- 눈: "realistic eye reflections with catchlights"
- 머리카락: "individual hair strands catching light naturally"

절대 금지:
- 텍스트, 글자, 로고, 워터마크 포함
- "text", "letters", "words", "logo", "watermark" 등 문자 관련 표현
- 브랜드명 직접 언급 (참조 이미지로 대체)

=== 생성 요청 ===

광고 유형: ${input.adType} (${adTypeDescriptions[input.adType]})

${productSection}

선택된 옵션: ${optionDescriptions || '기본값'}

${input.additionalPrompt ? `추가 요청: ${input.additionalPrompt}` : ''}

${imageReferenceSection}

위 정보를 바탕으로 Seedream 4.5에 최적화된 영어 프롬프트를 생성해주세요.
프롬프트는 첨부된 참조 이미지들의 요소를 조합하여 새로운 광고 이미지를 만들도록 해야 합니다.

중요: 이미지에 텍스트나 글자가 절대 포함되지 않도록 "Do not include any text, letters, words, numbers, or typography in the image." 문구를 프롬프트에 반드시 포함하세요.`

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
          description: 'Seedream 4.5 최적화 영어 프롬프트 (50-100 단어, 텍스트 금지 문구 필수 포함)',
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
    // Fallback response based on ad type
    const fallbackPrompts: Record<ImageAdType, string> = {
      productOnly: 'Professional product photography of the product from the reference image on a clean white studio background. Soft diffused lighting from above creates subtle shadows and highlights product details. Commercial advertisement quality with sharp focus. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
      holding: 'The model from the reference image naturally holds the product from the reference, presenting it to camera with a warm genuine smile. Natural skin texture with subtle imperfections, realistic eye reflections with catchlights. Soft studio lighting from the left creates gentle shadows. Medium shot composition. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
      using: 'The model from the reference image actively uses and demonstrates the product from the reference in a natural setting. Genuine expression showing satisfaction. Natural skin texture with realistic pores. Soft natural daylight from large window. Balanced focus on both model and product. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
      wearing: 'Fashion advertisement featuring the model from the reference wearing the outfit from the reference image. Full body shot in clean studio setting. Model strikes a confident pose showing the clothing fit and style. Professional fashion photography lighting. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
      beforeAfter: 'Before and after comparison layout showing transformation effect. Clean consistent lighting on both sides. Clear visual difference highlighting the product benefit. Professional commercial quality. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
      lifestyle: 'Lifestyle advertisement showing the model from the reference naturally incorporating the product into their daily routine in a cozy home setting. Authentic candid moment. Natural daylight streaming through window. Warm inviting atmosphere. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
      unboxing: 'The model from the reference excitedly reveals and presents the product from the reference, showing genuine enthusiasm. Unboxing style shot on a clean desk setup. Natural expressions of discovery and delight. Influencer content aesthetic. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
      comparison: 'Product comparison layout with the product from the reference prominently displayed. Side by side arrangement on clean neutral background. Clear professional lighting highlighting product features. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
      seasonal: 'Seasonal themed advertisement featuring the product from the reference with festive decorations and warm atmosphere. Cozy seasonal setting with appropriate props and lighting mood. Holiday commercial aesthetic. Do not include any text, letters, words, numbers, or typography in the image. Hyperrealistic photograph, 8K quality.',
    }

    return {
      optimizedPrompt: fallbackPrompts[input.adType] || fallbackPrompts.productOnly,
      koreanDescription: `${adTypeDescriptions[input.adType]} 스타일의 광고 이미지가 생성됩니다.`,
    }
  }
}
