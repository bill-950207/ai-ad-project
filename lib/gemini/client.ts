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

/** 카메라 구도 타입 */
export type CameraCompositionType = 'selfie' | 'tripod' | 'closeup' | 'fullbody'

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
   - Structure: subject → style → composition → lighting → technical parameters
   - Use natural language sentences (NOT comma-separated keywords)
   - Example: "A woman in a casual dress holding a skincare product in a modern living room"
   - First 5-8 words are most important - place the main subject there
   - Include lighting cues: "soft natural lighting", "golden hour lighting", "studio lighting"
   - Include camera specs: "shot on 85mm lens", "shallow depth of field"
   - End with quality keywords: "photorealistic, professional advertisement, 4K quality"
   - **CRITICAL: Reference the attached product/model images and describe their exact appearance**
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
          description: 'Seedream 4.5 optimized image prompt (English, 50-100 words, natural language sentences)',
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
    // Seedream 4.5 optimized fallback response
    return {
      productSummary: 'Product information has been analyzed.',
      firstScenePrompt: 'A professional model confidently presents a premium product in an elegant studio setting with soft diffused lighting. She holds the product at chest height, looking directly at camera with a warm inviting expression. The background features subtle gradient tones that complement the product colors. Shot on 85mm lens with shallow depth of field, soft studio lighting creates gentle shadows. Photorealistic, professional advertisement quality, 4K detail.',
      videoPrompt: `Professional product advertisement video. The scene begins with a static shot of the model holding the product. Camera slowly zooms in to reveal product details. Smooth lighting transitions highlight the product features. The model shows subtle natural movements. Cinematic quality, ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, words, watermark, logo, blurry, low quality, distorted, deformed, ugly',
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
  // 한국어 기준 분당 약 220자, 초당 약 3.7자
  const charsPerSecond = 3.7
  const targetChars = Math.round(input.durationSeconds * charsPerSecond)
  const minChars = Math.round(targetChars * 0.85)
  const maxChars = Math.round(targetChars * 1.15)

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

  // 카메라 구도 설명
  const cameraCompositionDescriptions: Record<CameraCompositionType, string> = {
    selfie: '셀카 스타일 - 아바타가 카메라를 직접 들고 있는 것처럼, 약간 위에서 아래로 내려다보는 각도, 팔 거리 정도의 가까운 거리',
    tripod: '삼각대 촬영 스타일 - 카메라가 고정된 위치에 설치된 것처럼, 정면에서 안정적인 구도, 허리부터 머리까지 보이는 거리',
    closeup: '클로즈업 - 얼굴과 상체 위주, 표정이 잘 보이는 가까운 거리, 어깨부터 머리까지',
    fullbody: '전신 샷 - 아바타의 전신이 보이는 구도, 발끝부터 머리까지 전체가 프레임에 담김',
  }

  const cameraSection = input.cameraComposition
    ? `카메라 구도: ${cameraCompositionDescriptions[input.cameraComposition]}
이 구도에 맞게 아바타의 포즈와 카메라 앵글을 설정해주세요.`
    : ''

  const imageReferenceSection = `
중요: 첨부된 이미지들을 주의 깊게 분석해주세요.
- 첫 번째 이미지: 아바타(모델)입니다. 얼굴 특징, 머리 색상/스타일, 피부톤을 정확히 묘사해야 합니다.
${input.productImageUrl ? '- 두 번째 이미지: 제품입니다. 제품의 색상, 형태, 디자인을 정확히 묘사해야 합니다.' : ''}`

  // Seedream 4.5 최적화 가이드라인 (포토리얼리즘 강화)
  const seedreamGuide = `
=== Seedream 4.5 프롬프트 작성 가이드라인 (포토리얼리즘 필수) ===
ByteDance의 Seedream 4.5 이미지 생성 모델에 최적화된 프롬프트를 작성해야 합니다.
목표: 실제 DSLR 카메라로 촬영한 것처럼 보이는 100% 포토리얼리스틱 이미지

핵심 원칙:
1. 구조: 주제(subject) → 스타일(style) → 구도(composition) → 조명(lighting) → 기술적 파라미터(technical) 순서
2. 자연어 사용: "주제 + 행동 + 환경"을 자연스러운 문장으로 작성
   - 좋은 예: "A woman in a casual dress holding a skincare product in a modern living room"
   - 나쁜 예: "woman, dress, product, living room, modern" (키워드 나열 금지)
3. 간결성: 30-100단어가 최적. 복잡한 형용사를 쌓지 말고 3-5개의 강력한 서술어만 사용
4. 첫 5-8단어가 가장 중요: 가장 중요한 주제/요소를 맨 앞에 배치
5. 조명 (리얼리즘 핵심): "soft natural window light", "diffused daylight", "professional studio lighting with subtle shadows"
6. 카메라 스펙 필수: "shot on Sony A7R IV with 85mm f/1.4 lens", "shallow depth of field with natural bokeh", "RAW quality"
7. 포토리얼리즘 필수 키워드: "ultra realistic photograph", "hyperrealistic", "indistinguishable from real photo"

실제 사진처럼 보이게 하는 필수 요소:
- 피부: "natural skin texture with visible pores", "subtle skin imperfections", "realistic skin tone"
- 머리카락: "individual hair strands visible", "natural hair highlights and shadows"
- 눈: "realistic eye reflections", "catchlights in eyes"
- 조명 반사: "subtle specular highlights on skin", "natural light reflections"
- 배경: "realistic depth of field blur", "natural bokeh"
- 전체 느낌: "candid natural moment", "unstaged authentic look"`

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
2. 제품을 손에 들거나 옆에 자연스럽게 배치 (제품 특성에 맞게)
3. 세로 비율(9:16) 구도
4. 자연스럽고 전문적인 조명
5. 상업 광고 품질의 포토리얼리스틱 이미지
${input.cameraComposition ? `6. 지정된 카메라 구도(${input.cameraComposition})를 반드시 반영` : ''}

프롬프트 작성 지침 (Seedream 4.5 최적화):
- 영어로 작성, 50-80단어 권장 (최대 100단어)
- 첫 문장에 가장 중요한 주제(아바타+제품)를 배치
- 자연스러운 문장 형태로 작성 (키워드 나열 금지)
- 조명, 분위기, 카메라 스펙을 구체적으로 명시
- 마지막에 품질 관련 키워드 추가: "photorealistic, professional advertisement, 4K quality"
- 아바타와 제품의 외형을 정확하게 묘사`

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
          description: 'Seedream 4.5용 이미지 생성 프롬프트 (영어, 50-100단어, 자연어 문장 형태)',
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
    // Seedream 4.5 optimized fallback response
    return {
      prompt: 'A young professional woman holding a premium product stands in a bright modern living room, looking directly at the camera with a warm confident smile. She wears elegant casual attire that complements the product in her hands. Soft natural window lighting creates gentle shadows on her face. Shot on 85mm lens with shallow depth of field, the background shows tasteful minimalist decor slightly blurred. Vertical 9:16 composition, photorealistic, professional advertisement quality, 4K detail.',
      locationDescription: input.locationPrompt || '밝은 자연광이 들어오는 현대적인 거실',
    }
  }
}
