/**
 * 영상 프롬프트 생성 Gemini API 함수
 * - 영상 광고 프롬프트 생성
 * - UGC 프롬프트 생성
 * - 제품 대본 생성
 * - 첫 프레임 프롬프트 생성
 */

import { GenerateContentConfig, MediaResolution, ThinkingLevel, Type } from '@google/genai'
import { genAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import type {
  VideoPromptInput,
  VideoPromptResult,
  VideoAdPromptInput,
  VideoAdPromptResult,
  UGCPromptInput,
  UGCPromptResult,
  ProductScriptInput,
  ProductScriptResult,
  FirstFramePromptInput,
  FirstFramePromptResult,
  CameraCompositionType,
  ModelPoseType,
  OutfitPresetType,
} from './types'

/**
 * 범용 텍스트 생성 함수
 */
export async function generateText(prompt: string): Promise<string> {
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })
  return response.text || ''
}

/**
 * 영상 광고용 프롬프트를 생성합니다.
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
    return {
      prompt: `Professional product advertisement video. The product slowly rotates with soft studio lighting. Smooth camera movement reveals product details. High-quality commercial style. ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, words, watermark, logo, blurry, low quality, distorted',
    }
  }
}

/**
 * 영상 광고용 통합 프롬프트를 생성합니다.
 */
export async function generateVideoAdPrompts(input: VideoAdPromptInput): Promise<VideoAdPromptResult> {
  const durationDesc =
    input.duration === 5 ? 'short and impactful 5 seconds'
      : input.duration === 10 ? 'moderate length 10 seconds'
        : 'full story 15 seconds'

  const productInfoSection = input.productUrl
    ? `Product Info URL: ${input.productUrl}\nPlease retrieve and analyze the product information directly from the URL above.\n\nAdditional Product Info:\n${input.productInfo || 'None'}`
    : `Product Info:\n${input.productInfo || 'No information provided'}`

  let videoImageIndex = 1
  const videoProductImageIndex = input.productImageUrl ? videoImageIndex++ : null
  const videoAvatarImageIndex = input.avatarImageUrl ? videoImageIndex++ : null

  const imageReferenceSection = (input.productImageUrl || input.avatarImageUrl)
    ? `\n=== ATTACHED IMAGES GUIDE ===\n${videoProductImageIndex ? `[IMAGE${videoProductImageIndex}] = PRODUCT IMAGE\n- Reference as "the product in IMAGE${videoProductImageIndex}" in your prompt.` : ''}\n${videoAvatarImageIndex ? `[IMAGE${videoAvatarImageIndex}] = MODEL (AVATAR) IMAGE\n- Reference as "the model in IMAGE${videoAvatarImageIndex}" in your prompt.` : ''}`
    : ''

  const prompt = `You are a video advertisement expert. Analyze the product information and generate prompts for AI models.

${productInfoSection}
${imageReferenceSection}

Video Duration: ${durationDesc}
Ad Style: ${input.style || 'professional and attractive'}
${input.additionalInstructions ? `Additional Instructions: ${input.additionalInstructions}` : ''}

Generate TWO prompts:
1. **First Scene Image Prompt (firstScenePrompt)**: Seedream 4.5 optimized prompt (English, 50-80 words)
2. **Video Generation Prompt (videoPrompt)**: Wan 2.6 prompt (English, max 800 characters)`

  const tools = input.productUrl ? [{ urlContext: {} }, { googleSearch: {} }] : undefined

  const config: GenerateContentConfig = {
    tools,
    thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['productSummary', 'firstScenePrompt', 'videoPrompt', 'negativePrompt'],
      properties: {
        productSummary: { type: Type.STRING, description: 'Product summary in Korean' },
        firstScenePrompt: { type: Type.STRING, description: 'Seedream 4.5 image prompt (English)' },
        videoPrompt: { type: Type.STRING, description: 'Video generation prompt (English)' },
        negativePrompt: { type: Type.STRING, description: 'Elements to avoid (English)' },
      },
    },
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
    }
  }
  if (input.avatarImageUrl) {
    const imageData = await fetchImageAsBase64(input.avatarImageUrl)
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

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as VideoAdPromptResult
  } catch {
    return {
      productSummary: 'Product information has been analyzed.',
      firstScenePrompt: 'Hyper-realistic ad visual of a person confidently holding the product. Premium advertising aesthetic, optimized for social media.',
      videoPrompt: `Dynamic product advertisement video. ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, watermark, logo, blurry, low quality',
    }
  }
}

/**
 * UGC 영상용 프롬프트를 생성합니다.
 */
export async function generateUGCPrompts(input: UGCPromptInput): Promise<UGCPromptResult> {
  const durationDesc = input.duration === 5 ? 'short 5 seconds' : input.duration === 8 ? 'medium 8 seconds' : 'longer 12 seconds'
  const moodDesc = { friendly: 'warm, approachable, casual', professional: 'confident, knowledgeable', energetic: 'excited, enthusiastic' }[input.mood || 'friendly']

  const productSection = input.productUrl
    ? `Product URL: ${input.productUrl}\n${input.productInfo || ''}`
    : `Product Info:\n${input.productInfo || 'No product information provided'}`

  const scriptSection = input.script ? `User Script: "${input.script}"` : 'No script provided - please generate a natural UGC-style script.'

  const prompt = `You are a UGC video expert. Create prompts for an authentic video.

${productSection}
${scriptSection}

Video Duration: ${durationDesc}
Mood/Tone: ${moodDesc}
${input.additionalInstructions ? `Additional: ${input.additionalInstructions}` : ''}

Generate: productSummary (Korean), firstScenePrompt (English, gpt-image-1.5), videoPrompt (English, Seedance), suggestedScript (Korean, if no user script)`

  const tools = input.productUrl ? [{ urlContext: {} }, { googleSearch: {} }] : undefined

  const config: GenerateContentConfig = {
    tools,
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['productSummary', 'firstScenePrompt', 'videoPrompt'],
      properties: {
        productSummary: { type: Type.STRING },
        firstScenePrompt: { type: Type.STRING },
        videoPrompt: { type: Type.STRING },
        suggestedScript: { type: Type.STRING, nullable: true },
      },
    },
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.avatarImageUrl) {
    const imageData = await fetchImageAsBase64(input.avatarImageUrl)
    if (imageData) {
      parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
    }
  }
  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
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
    const result = JSON.parse(response.text || '') as UGCPromptResult
    if (input.script) result.suggestedScript = undefined
    return result
  } catch {
    return {
      productSummary: input.productInfo ? '제품 정보가 분석되었습니다.' : '일반 UGC 영상',
      firstScenePrompt: 'A person seated comfortably looking at camera with confident expression. Soft natural daylight. Sharp background. Ultra-realistic editorial photography.',
      videoPrompt: `A person speaks naturally to camera with subtle movements. ${input.duration} seconds of natural conversation.`,
      suggestedScript: input.script ? undefined : '안녕하세요! 오늘 정말 좋은 거 발견해서 공유하려고요.',
    }
  }
}

/**
 * 제품 설명 대본을 3가지 스타일로 생성합니다.
 */
export async function generateProductScripts(input: ProductScriptInput): Promise<ProductScriptResult> {
  const language = input.language || 'ko'

  const languageConfig: Record<string, { charsPerSecond: number; name: string; styleName: { formal: string; casual: string; energetic: string } }> = {
    ko: { charsPerSecond: 5.0, name: '한국어', styleName: { formal: '전문적', casual: '친근한', energetic: '활기찬' } },
    en: { charsPerSecond: 15.0, name: 'English', styleName: { formal: 'Professional', casual: 'Casual', energetic: 'Energetic' } },
    ja: { charsPerSecond: 5.0, name: '日本語', styleName: { formal: 'プロフェッショナル', casual: 'カジュアル', energetic: 'エネルギッシュ' } },
    zh: { charsPerSecond: 5.0, name: '中文', styleName: { formal: '专业', casual: '亲切', energetic: '活力' } },
  }

  const config_lang = languageConfig[language] || languageConfig.ko
  const targetChars = Math.round(input.durationSeconds * config_lang.charsPerSecond)

  const productSection = input.productUrl
    ? `Product URL: ${input.productUrl}\n${input.productInfo}`
    : `Product info:\n${input.productInfo}`

  const prompt = `Write 3 style scripts for the product in ${config_lang.name}. Target: ~${targetChars} characters each.

${productSection}

Styles: formal (professional), casual (friendly), energetic (enthusiastic)`

  const tools = input.productUrl ? [{ urlContext: {} }, { googleSearch: {} }] : undefined

  const schemaProperties: Record<string, unknown> = {
    productSummary: { type: Type.STRING },
    scripts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['style', 'styleName', 'content', 'estimatedDuration'],
        properties: {
          style: { type: Type.STRING, enum: ['formal', 'casual', 'energetic'] },
          styleName: { type: Type.STRING },
          content: { type: Type.STRING },
          estimatedDuration: { type: Type.NUMBER },
        },
      },
    },
  }

  if (input.requestOutfitRecommendation) {
    schemaProperties.recommendedOutfit = {
      type: Type.OBJECT,
      required: ['description', 'koreanDescription', 'reason'],
      properties: {
        description: { type: Type.STRING },
        koreanDescription: { type: Type.STRING },
        reason: { type: Type.STRING },
      },
    }
  }

  const genConfig: GenerateContentConfig = {
    tools,
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: input.requestOutfitRecommendation ? ['productSummary', 'scripts', 'recommendedOutfit'] : ['productSummary', 'scripts'],
      properties: schemaProperties,
    },
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: genConfig,
  })

  try {
    return JSON.parse(response.text || '') as ProductScriptResult
  } catch {
    const result: ProductScriptResult = {
      productSummary: '제품 정보가 분석되었습니다.',
      scripts: [
        { style: 'formal', styleName: config_lang.styleName.formal, content: '안녕하세요. 오늘 소개해드릴 제품입니다.', estimatedDuration: input.durationSeconds },
        { style: 'casual', styleName: config_lang.styleName.casual, content: '안녕하세요! 정말 좋은 제품 소개해드릴게요.', estimatedDuration: input.durationSeconds },
        { style: 'energetic', styleName: config_lang.styleName.energetic, content: '여러분! 이거 진짜 대박이에요!', estimatedDuration: input.durationSeconds },
      ],
    }
    if (input.requestOutfitRecommendation) {
      result.recommendedOutfit = {
        description: 'casual white cotton t-shirt with light blue jeans',
        koreanDescription: '캐주얼한 흰색 티셔츠와 라이트 블루 청바지',
        reason: '자연스럽고 깔끔한 캐주얼 스타일입니다.',
      }
    }
    return result
  }
}

// 카메라 구도 설명
const cameraCompositionDescriptions: Record<CameraCompositionType, string> = {
  'selfie-high': 'high angle selfie perspective, camera looking down from above',
  'selfie-front': 'eye-level frontal view, direct eye contact',
  'selfie-side': 'three-quarter angle, showing facial contours',
  tripod: 'stable tripod shot, medium distance',
  closeup: 'close-up portrait, face and upper body',
  fullbody: 'full body shot, entire person visible',
  'ugc-closeup': 'UGC-style medium close-up, chest-up framing',
}

// 모델 포즈 설명
const modelPoseDescriptions: Record<ModelPoseType, string> = {
  'holding-product': 'Model holding product naturally at chest level',
  'showing-product': 'Model presenting product towards camera',
  'using-product': 'Model actively using the product',
  'talking-only': 'Model without product, natural conversational pose',
}

// 의상 프리셋 설명
const outfitPresetDescriptions: Record<OutfitPresetType, string> = {
  casual_everyday: 'casual t-shirt with jeans',
  formal_elegant: 'elegant dress or formal wear',
  professional_business: 'professional business attire',
  sporty_athletic: 'athletic wear',
  cozy_comfortable: 'cozy sweater or cardigan',
  trendy_fashion: 'trendy fashion style',
  minimal_simple: 'minimal solid color outfit',
}

/**
 * 첫 프레임 이미지 생성용 프롬프트를 생성합니다.
 */
export async function generateFirstFramePrompt(input: FirstFramePromptInput): Promise<FirstFramePromptResult> {
  const locationSection = input.locationPrompt
    ? `Location: ${input.locationPrompt}`
    : 'Auto-select best location for the product.'

  const cameraSection = input.cameraComposition
    ? `Camera: ${cameraCompositionDescriptions[input.cameraComposition]}`
    : ''

  const poseSection = input.modelPose
    ? `Pose: ${modelPoseDescriptions[input.modelPose]}`
    : ''

  let outfitSection = ''
  if (input.outfitCustom) {
    outfitSection = `Outfit: ${input.outfitCustom}`
  } else if (input.outfitPreset) {
    outfitSection = `Outfit: ${outfitPresetDescriptions[input.outfitPreset]}`
  }

  const prompt = `Generate Seedream 4.5 first frame image prompt.

Product: ${input.productInfo}
${locationSection}
${cameraSection}
${poseSection}
${outfitSection}

Create photorealistic prompt using "Figure 1" for avatar, "Figure 2" for product.
Include: camera specs, lighting direction, quality tags.
Output JSON: { "prompt": "English 50-80 words", "locationDescription": "Korean location description" }`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['prompt', 'locationDescription'],
      properties: {
        prompt: { type: Type.STRING },
        locationDescription: { type: Type.STRING },
      },
    },
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  const avatarData = await fetchImageAsBase64(input.avatarImageUrl)
  if (avatarData) {
    parts.push({ inlineData: { mimeType: avatarData.mimeType, data: avatarData.base64 } })
  }

  if (input.productImageUrl) {
    const productData = await fetchImageAsBase64(input.productImageUrl)
    if (productData) {
      parts.push({ inlineData: { mimeType: productData.mimeType, data: productData.base64 } })
    }
  }

  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    return JSON.parse(response.text || '') as FirstFramePromptResult
  } catch {
    return {
      prompt: 'Place the model from Figure 1 in a modern living room. Soft natural daylight. Shot on Sony A7IV, 35mm f/8. Hyperrealistic photograph, 8K quality.',
      locationDescription: '모던한 거실',
    }
  }
}
