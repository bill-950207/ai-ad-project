/**
 * AI 카테고리 옵션 추천
 */

import { GenerateContentConfig, MediaResolution, ThinkingLevel, Type } from '@google/genai'
import { genAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import { BRAND_PRESERVATION_INSTRUCTION, PRODUCT_NEGATIVE_PROMPT } from '@/lib/prompts/common'
import type {
  ImageAdType,
  RecommendedOptionsInput,
  RecommendedOptionsResult,
  MultipleRecommendedOptionsResult,
  ImageAdPromptInput,
  ImageAdPromptResult,
  ReferenceStyleAnalysisInput,
  ReferenceStyleAnalysisResult,
  BackgroundPromptInput,
  BackgroundPromptResult,
} from './types'

// 광고 유형 설명
const adTypeDescriptions: Record<ImageAdType, string> = {
  productOnly: 'Product only shot - Clean product photography',
  holding: 'Holding shot - Model naturally holding the product',
  using: 'Using shot - Model actively using the product',
  wearing: 'Wearing shot - Fashion advertisement',
  lifestyle: 'Lifestyle - Natural everyday scene',
  unboxing: 'Unboxing - Product reveal style',
  seasonal: 'Seasonal/Theme - Themed atmosphere',
}

/**
 * 제품 정보와 광고 유형에 맞는 최적의 카테고리 옵션을 AI가 추천합니다.
 */
export async function generateRecommendedCategoryOptions(
  input: RecommendedOptionsInput
): Promise<RecommendedOptionsResult> {
  const language = input.language || 'ko'

  const outputLanguageInstructions: Record<string, string> = {
    ko: 'Write all text responses in Korean.',
    en: 'Write all text responses in English.',
    ja: 'Write all text responses in Japanese.',
  }

  const groupsDescription = input.categoryGroups.map(group => {
    const optionsText = group.options.map(opt => `    - ${opt.key}: ${opt.description}`).join('\n')
    return `[${group.key}]\n${optionsText}`
  }).join('\n\n')

  const prompt = `You are an expert advertising image producer.
Analyze the product and ad type to recommend optimal category options.

OUTPUT LANGUAGE: ${outputLanguageInstructions[language] || outputLanguageInstructions.ko}

=== PRODUCT ===
Name: ${input.productName || 'Not provided'}
Description: ${input.productDescription || 'Not provided'}
${input.productSellingPoints?.length ? `Selling Points: ${input.productSellingPoints.join(', ')}` : ''}

=== AD TYPE ===
${input.adType}: ${adTypeDescriptions[input.adType]}

=== AVAILABLE OPTIONS ===
${groupsDescription}

Recommend optimal settings for each category. Use '__custom__' with customText for specific requirements.`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['recommendations', 'overallStrategy', 'suggestedPrompt'],
      properties: {
        recommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['key', 'value', 'reason'],
            properties: {
              key: { type: Type.STRING },
              value: { type: Type.STRING },
              customText: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
          },
        },
        overallStrategy: { type: Type.STRING },
        suggestedPrompt: { type: Type.STRING },
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

  parts.push({ text: prompt })

  console.log('[generateRecommendedCategoryOptions] 입력 프롬프트:', prompt)

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    const rawResult = JSON.parse(response.text || '') as {
      recommendations: Array<{ key: string; value: string; customText?: string; reason: string }>
      overallStrategy: string
      suggestedPrompt?: string
    }

    const recommendedOptions: Record<string, { value: string; customText?: string; reason: string }> = {}
    for (const rec of rawResult.recommendations) {
      recommendedOptions[rec.key] = { value: rec.value, customText: rec.customText, reason: rec.reason }
    }

    return {
      recommendedOptions,
      overallStrategy: rawResult.overallStrategy,
      suggestedPrompt: rawResult.suggestedPrompt,
    }
  } catch {
    const fallbackOptions: Record<string, { value: string; reason: string }> = {}
    for (const group of input.categoryGroups) {
      if (group.options.length > 0) {
        fallbackOptions[group.key] = { value: group.options[0].key, reason: '기본 설정입니다.' }
      }
    }
    return {
      recommendedOptions: fallbackOptions,
      overallStrategy: '제품에 맞는 기본 설정이 적용되었습니다.',
      suggestedPrompt: undefined,
    }
  }
}

/**
 * 3가지 다양한 시나리오 옵션을 추천합니다.
 */
export async function generateMultipleRecommendedOptions(
  input: RecommendedOptionsInput
): Promise<MultipleRecommendedOptionsResult> {
  const language = input.language || 'ko'

  const outputLanguageInstructions: Record<string, string> = {
    ko: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt) in Korean.',
    en: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt) in English.',
    ja: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt) in Japanese.',
  }

  const groupsDescription = input.categoryGroups.map(group => {
    const optionsText = group.options.map(opt => `    - ${opt.key}: ${opt.description}`).join('\n')
    return `[${group.key}]\n${optionsText}`
  }).join('\n\n')

  const prompt = `You are an expert advertising creative director. Create 3 DISTINCT advertising scenario recommendations that target DIFFERENT audiences.

OUTPUT LANGUAGE: ${outputLanguageInstructions[language] || outputLanguageInstructions.ko}

=== STEP 1: ANALYZE THE PRODUCT IMAGE ===
Examine the product image carefully and identify:
1. PRODUCT CATEGORY: (cosmetics, skincare, electronics, food, fashion accessory, beverage, household, etc.)
2. PRICE POSITIONING: (luxury/premium, mid-range, budget-friendly) based on packaging quality and design sophistication
3. VISUAL CHARACTERISTICS: Primary colors, materials (glass/matte/glossy/metallic), shape, size
4. BRAND PERSONALITY: (sophisticated, youthful, natural/organic, professional, playful, minimalist)
5. TARGET HINTS: Who would typically buy this? (age range, lifestyle indicators from design)

=== PRODUCT INFO ===
Name: ${input.productName || 'Not provided'}
Description: ${input.productDescription || 'Not provided'}
${input.productSellingPoints?.length ? `Selling Points: ${input.productSellingPoints.join(', ')}` : ''}

=== AD TYPE ===
${input.adType}: ${adTypeDescriptions[input.adType]}

=== AVAILABLE OPTIONS ===
${groupsDescription}

=== STEP 2: CREATE 3 DISTINCT SCENARIOS ===

**SCENARIO 1 - MAINSTREAM (메인스트림)**
- Target: Primary, most obvious audience for this product
- Style: Approachable, trustworthy, product-benefit focused
- Goal: Appeal to the widest relevant audience

**SCENARIO 2 - PREMIUM (프리미엄)**
- Target: Aspirational, upscale positioning
- Style: Sophisticated, elegant, elevated lifestyle aesthetic
- Goal: Position product as premium/luxury choice

**SCENARIO 3 - TRENDY (트렌디)**
- Target: Younger, trend-conscious, social-media-savvy audience
- Style: Dynamic, authentic, SNS-friendly, relatable
- Goal: Create shareable, modern content

=== CRITICAL REQUIREMENTS ===
1. Each scenario MUST genuinely differ in:
   - Target audience (age, lifestyle, values)
   - Visual mood and atmosphere
   - Lighting and color temperature
   - Setting/background choice
   - Model expression and energy level

2. Match options to product characteristics from image analysis:
   - LUXURY PRODUCTS → luxury/marble backgrounds, soft/dramatic lighting, elegant mood
   - YOUTHFUL PRODUCTS → urban/nature backgrounds, natural/golden lighting, vibrant mood
   - NATURAL/ORGANIC PRODUCTS → nature/minimal backgrounds, soft lighting, calm/fresh mood
   - TECH/MODERN PRODUCTS → modern/studio backgrounds, high-key/cool lighting, sleek mood

3. Title: 8-15 characters (compelling, descriptive)
4. Description: 30-50 characters (explain target & concept clearly)
5. Provide CLEAR REASONING for each option based on product analysis

IMPORTANT: All scenario titles, descriptions, reasons, and strategies must be written in the specified output language.`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['scenarios'],
      properties: {
        scenarios: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['title', 'description', 'recommendations', 'overallStrategy'],
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              scenarioType: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ['key', 'value', 'reason'],
                  properties: {
                    key: { type: Type.STRING },
                    value: { type: Type.STRING },
                    customText: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                },
              },
              overallStrategy: { type: Type.STRING },
              suggestedPrompt: { type: Type.STRING },
            },
          },
        },
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

  parts.push({ text: prompt })

  console.log('[generateMultipleRecommendedOptions] 입력 프롬프트:', prompt)

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    const rawResult = JSON.parse(response.text || '') as {
      scenarios: Array<{
        title: string
        description: string
        targetAudience?: string
        scenarioType?: string
        recommendations: Array<{ key: string; value: string; customText?: string; reason: string }>
        overallStrategy: string
        suggestedPrompt?: string
      }>
    }

    return {
      scenarios: rawResult.scenarios.map(scenario => {
        const recommendedOptions: Record<string, { value: string; customText?: string; reason: string }> = {}
        for (const rec of scenario.recommendations) {
          recommendedOptions[rec.key] = { value: rec.value, customText: rec.customText, reason: rec.reason }
        }
        return {
          title: scenario.title,
          description: scenario.description,
          targetAudience: scenario.targetAudience,
          scenarioType: scenario.scenarioType as 'mainstream' | 'premium' | 'trendy' | undefined,
          recommendedOptions,
          overallStrategy: scenario.overallStrategy,
          suggestedPrompt: scenario.suggestedPrompt,
        }
      }),
    }
  } catch {
    const fallbackMessages: Record<string, { title: string; description: string; reason: string; strategy: string }> = {
      ko: {
        title: '기본 시나리오',
        description: '제품에 맞는 기본 설정입니다.',
        reason: '기본 설정입니다.',
        strategy: '제품 정보를 기반으로 기본 설정이 적용되었습니다.',
      },
      en: {
        title: 'Default Scenario',
        description: 'Default settings for the product.',
        reason: 'Default setting.',
        strategy: 'Default settings applied based on product information.',
      },
      ja: {
        title: 'デフォルトシナリオ',
        description: '製品に合ったデフォルト設定です。',
        reason: 'デフォルト設定です。',
        strategy: '製品情報に基づいてデフォルト設定が適用されました。',
      },
    }
    const messages = fallbackMessages[language] || fallbackMessages.ko

    const fallbackOptions: Record<string, { value: string; reason: string }> = {}
    for (const group of input.categoryGroups) {
      if (group.options.length > 0) {
        fallbackOptions[group.key] = { value: group.options[0].key, reason: messages.reason }
      }
    }
    return {
      scenarios: [{
        title: messages.title,
        description: messages.description,
        recommendedOptions: fallbackOptions,
        overallStrategy: messages.strategy,
        suggestedPrompt: undefined,
      }],
    }
  }
}

/**
 * 아바타 체형 특성을 프롬프트용 텍스트로 변환
 * z-image-turbo 프롬프트 빌더와 동일한 상세 묘사 사용
 */
function formatAvatarBodyCharacteristics(characteristics: ImageAdPromptInput['avatarCharacteristics']): string {
  if (!characteristics) return ''

  const parts: string[] = []

  // 키 (height)
  const heightMap: Record<string, string> = {
    short: 'petite',
    average: 'average height',
    tall: 'tall',
  }
  if (characteristics.height && heightMap[characteristics.height]) {
    parts.push(heightMap[characteristics.height])
  }

  // 체형 (bodyType) - 성별에 따라 구체적인 신체 비율 사용
  const femaleBodyTypeMap: Record<string, string> = {
    slim: 'slim slender body with 32-24-34 inch proportions, narrow shoulders, small bust, thin waist, lean hips',
    average: 'average female body with 34-26-36 inch proportions, moderate bust, defined waist, balanced hips',
    athletic: 'athletic toned female body with 34-25-35 inch proportions, firm muscles, toned abs, strong legs, defined arms',
    curvy: 'hourglass figure body with 36-24-36 inch proportions, full bust (D-cup), very slim tiny waist, shapely round hips, slender toned legs',
    plussize: 'plus-size female body with 42-36-46 inch proportions, very large bust, soft rounded belly, wide hips, thick thighs',
  }

  const maleBodyTypeMap: Record<string, string> = {
    slim: 'slim lean male body with narrow shoulders, thin arms, flat chest, slim waist, lean legs',
    average: 'average male body with moderate shoulders, normal chest, slight belly, standard proportions',
    athletic: 'athletic muscular male body with broad shoulders (18+ inches), defined chest muscles, visible six-pack abs, V-shaped torso, muscular arms and legs',
    curvy: 'stocky male body with broad frame, thick chest, solid midsection, strong thick legs',
    plussize: 'plus-size male body with large frame, broad chest, round belly, thick arms and legs',
  }

  const defaultBodyTypeMap: Record<string, string> = {
    slim: 'slim slender build with lean proportions',
    average: 'average build with balanced proportions',
    athletic: 'athletic toned build with defined muscles',
    curvy: 'curvy build with pronounced proportions',
    plussize: 'plus-size build with fuller figure',
  }

  if (characteristics.bodyType) {
    let bodyDesc: string
    if (characteristics.gender === 'female') {
      bodyDesc = femaleBodyTypeMap[characteristics.bodyType] || defaultBodyTypeMap[characteristics.bodyType] || ''
    } else if (characteristics.gender === 'male') {
      bodyDesc = maleBodyTypeMap[characteristics.bodyType] || defaultBodyTypeMap[characteristics.bodyType] || ''
    } else {
      bodyDesc = defaultBodyTypeMap[characteristics.bodyType] || ''
    }
    if (bodyDesc) {
      parts.push(bodyDesc)
    }
  }

  return parts.length > 0 ? parts.join(', ') : ''
}

/**
 * 이미지 광고 프롬프트를 생성합니다.
 */
export async function generateImageAdPrompt(input: ImageAdPromptInput): Promise<ImageAdPromptResult> {
  // 아바타 체형 특성 포맷팅 (아바타가 선택된 경우)
  const avatarBodyDescription = formatAvatarBodyCharacteristics(input.avatarCharacteristics)
  const avatarBodyInstruction = avatarBodyDescription
    ? `\n\n=== AVATAR BODY CONSISTENCY ===\nWhen including the model/avatar in the image, maintain consistent body characteristics: ${avatarBodyDescription}.\nThe model's body proportions should match these characteristics throughout the image.`
    : ''

  const prompt = `You are an expert advertising photographer. Generate a Seedream 4.5 optimized prompt for ${input.adType} advertisement.

Product: ${input.productName || 'Product'} - ${input.productDescription || ''}
Options: ${JSON.stringify(input.selectedOptions)}
${input.additionalPrompt ? `Additional: ${input.additionalPrompt}` : ''}${avatarBodyInstruction}

=== CRITICAL: LOGO & BRAND PRESERVATION ===
${BRAND_PRESERVATION_INSTRUCTION}

When the product has visible logos, labels, or brand marks:
- The generated prompt MUST include instructions to preserve them exactly
- Include phrases like "preserving all product logos and labels exactly as shown"
- The prompt MUST explicitly state: "do not add any new text, logos, or written elements to the image"
- Never instruct to modify, remove, or obscure any branding elements

=== NEGATIVE ELEMENTS (things to avoid in the image) ===
${PRODUCT_NEGATIVE_PROMPT}

Output JSON: { "optimizedPrompt": "English 60-100 words, must include logo preservation instruction AND 'no new text or logos' instruction", "koreanDescription": "Korean summary" }`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.avatarImageUrls?.length) {
    for (const url of input.avatarImageUrls) {
      const imageData = await fetchImageAsBase64(url)
      if (imageData) {
        parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
      }
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
    return JSON.parse(response.text || '') as ImageAdPromptResult
  } catch {
    return {
      optimizedPrompt: 'Professional product advertisement. High quality, photorealistic.',
      koreanDescription: '제품 광고 이미지',
    }
  }
}

/**
 * 참조 스타일 이미지를 분석합니다.
 */
export async function analyzeReferenceStyleImage(input: ReferenceStyleAnalysisInput): Promise<ReferenceStyleAnalysisResult> {
  const prompt = `Analyze this reference image for ${input.adType} advertisement style.

Available options to match:
${input.availableOptions.map(g => `${g.key}: ${g.options.join(', ')}`).join('\n')}

Analyze and recommend matching options for each category.
Output JSON with: analyzedOptions, overallStyle, suggestedPrompt, recommendedAdType`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  const imageData = await fetchImageAsBase64(input.imageUrl)
  if (imageData) {
    parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
  }

  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    return JSON.parse(response.text || '') as ReferenceStyleAnalysisResult
  } catch {
    return {
      analyzedOptions: [],
      overallStyle: '분석 결과를 가져올 수 없습니다.',
      suggestedPrompt: '',
    }
  }
}

/**
 * 배경 프롬프트를 생성합니다.
 */
export async function generateBackgroundPrompt(input: BackgroundPromptInput): Promise<BackgroundPromptResult> {
  let promptContext = ''

  if (input.mode === 'PRODUCT' && input.productImageUrl) {
    promptContext = `Analyze the product image and generate a suitable background prompt.
Product: ${input.productName || ''} - ${input.productDescription || ''}`
  } else if (input.mode === 'OPTIONS' && input.options) {
    promptContext = `Generate background based on options:
Style: ${input.options.style || 'modern'}
Location: ${input.options.location || 'studio'}
Mood: ${input.options.mood || 'professional'}
Color: ${input.options.color || 'neutral'}
Time: ${input.options.time || 'day'}`
  } else if (input.mode === 'PROMPT' && input.userPrompt) {
    promptContext = `Enhance this user prompt into optimized z-image-turbo prompt:
"${input.userPrompt}"`
  }

  const prompt = `Generate z-image-turbo optimized background prompt.

${promptContext}
Aspect Ratio: ${input.aspectRatio || '16:9'}

Output JSON: { "optimizedPrompt": "English background prompt", "koreanDescription": "Korean description" }`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.mode === 'PRODUCT' && input.productImageUrl) {
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
    return JSON.parse(response.text || '') as BackgroundPromptResult
  } catch {
    return {
      optimizedPrompt: 'Clean modern studio background with soft gradient lighting. Professional product photography setting.',
      koreanDescription: '깔끔한 모던 스튜디오 배경',
    }
  }
}
