/**
 * AI 카테고리 옵션 추천
 */

import { GenerateContentConfig, MediaResolution, ThinkingLevel, Type } from '@google/genai'
import { genAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import { BRAND_PRESERVATION_INSTRUCTION, PRODUCT_NEGATIVE_PROMPT, NO_LOGO_PRODUCT_INSTRUCTION, NO_LOGO_PROMPT_SUFFIX, NO_OVERLAY_ELEMENTS, OVERLAY_NEGATIVE_PROMPT } from '@/lib/prompts/common'
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

  // 아바타 정보 컨텍스트 생성
  const isAiGeneratedAvatar = input.avatarInfo?.type === 'ai-generated'
  const hasRealAvatar = input.avatarInfo?.type === 'avatar' || input.avatarInfo?.type === 'outfit'

  let avatarContext = ''
  if (hasRealAvatar && input.avatarInfo?.avatarStyle) {
    const style = input.avatarInfo.avatarStyle
    const styleParts: string[] = []
    if (style.vibe) styleParts.push(`vibe: ${style.vibe}`)
    if (style.bodyType) styleParts.push(`body type: ${style.bodyType}`)
    if (style.height) styleParts.push(`height: ${style.height}`)
    if (styleParts.length > 0) {
      avatarContext = `\n\n=== AVATAR STYLE INFO ===
The user has selected a real avatar with the following characteristics:
${styleParts.join(', ')}
Consider these avatar traits when recommending options (especially outfit, pose, expression) to create harmonious visuals.`
    }
  } else if (isAiGeneratedAvatar) {
    avatarContext = `\n\n=== AI AVATAR RECOMMENDATION ===
The user will use an AI-generated avatar. For each scenario, create a detailed avatar description prompt that matches the scenario's mood and target audience.

For recommendedAvatarStyle, provide:
1. avatarPrompt: A detailed English prompt for AI avatar generation (40-60 words). Include:
   - Age range and ethnicity appropriate for the product's target market
   - Body type and height that fits the scenario mood
   - Facial features and expression matching the scenario vibe
   - Hair style appropriate for the concept
   Example: "A sophisticated Korean woman in her late 20s, tall with slim elegant figure, sharp facial features with confident gaze, long straight black hair, natural makeup highlighting her refined beauty"

2. avatarDescription: A brief description in the output language (15-25 characters)

You MUST provide recommendedAvatarStyle for each scenario with both avatarPrompt and avatarDescription.`
  }

  const prompt = `You are an expert advertising creative director. Create 3 DISTINCT advertising scenarios customized specifically for this product.

OUTPUT LANGUAGE: ${outputLanguageInstructions[language] || outputLanguageInstructions.ko}

=== STEP 1: DEEP PRODUCT ANALYSIS ===
Examine the product image and information carefully. Identify:

1. PRODUCT FUNDAMENTALS:
   - Category & sub-category (e.g., "anti-aging serum" not just "skincare")
   - Price tier indication: (budget/mass-market, mid-range, premium/luxury) based on packaging quality

2. VISUAL IDENTITY:
   - Primary colors, materials, textures (glass/plastic/matte/glossy/metallic)
   - Design language (minimalist/ornate/playful/clinical/organic)
   - Packaging sophistication level

3. BRAND SIGNALS:
   - Brand personality from design (sophisticated, youthful, natural, professional, playful)
   - Target market hints from packaging choices
   - Quality positioning indicators

4. UNIQUE SELLING PROPOSITION HINTS:
   - What problem does this product likely solve?
   - What emotional benefit does it promise?

=== PRODUCT INFO ===
Name: ${input.productName || 'Not provided'}
Description: ${input.productDescription || 'Not provided'}
${input.productSellingPoints?.length ? `Selling Points: ${input.productSellingPoints.join(', ')}` : ''}

=== AD TYPE ===
${input.adType}: ${adTypeDescriptions[input.adType]}

=== AVAILABLE OPTIONS ===
${groupsDescription}

=== STEP 2: DYNAMIC SCENARIO GENERATION ===

Based on your product analysis, create 3 DISTINCT advertising scenarios.

**NAMING REQUIREMENT:**
- Create unique creative concept names (8-15 characters)
- NOT generic labels like "Premium", "Mainstream", "Trendy", "Basic", "Standard"
- Names should reflect the actual concept: "Morning Glow", "City Confidence", "Self-Care Ritual", "Gift of Beauty", "Daily Essential"

**TARGETING REQUIREMENT:**
- Each scenario targets a specific audience segment that makes sense for THIS product
- Don't force premium positioning on budget products
- Don't force youthful positioning on products targeting mature audiences
- Consider the product's actual price point and brand positioning

**DIVERSITY REQUIREMENT:**
The 3 scenarios MUST genuinely differ in:
- Target audience (age, lifestyle, values, income level)
- Emotional tone (inspirational, practical, playful, sophisticated, warm)
- Visual atmosphere (bright/dark, warm/cool, minimal/rich)
- Setting/context (home, outdoor, professional, social)
- Key message angle (benefit-focused, lifestyle-focused, emotional-focused)

**QUALITY REQUIREMENT:**
- Concept authenticity: Scenario should feel natural for the product
- Option coherence: All options (mood, lighting, background, etc.) should work together harmoniously
- Target alignment: Options should match target audience expectations

=== PRODUCT-APPROPRIATE CONSTRAINTS ===
- Budget-friendly products: Avoid overly luxury/aspirational positioning
- Premium products: At least one scenario should reflect premium positioning
- Age-specific products: Scenarios should respect that age range
- Gender-specific products: Maintain gender appropriateness

3. Title: 8-15 characters (creative, concept-reflecting)
4. Description: 30-50 characters (explain target & concept clearly)
5. Provide CLEAR REASONING for each option based on product analysis
${avatarContext}

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
              conceptType: { type: Type.STRING },
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
              recommendedAvatarStyle: {
                type: Type.OBJECT,
                properties: {
                  avatarPrompt: { type: Type.STRING },
                  avatarDescription: { type: Type.STRING },
                },
              },
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
        conceptType?: string
        recommendations: Array<{ key: string; value: string; customText?: string; reason: string }>
        overallStrategy: string
        suggestedPrompt?: string
        recommendedAvatarStyle?: {
          avatarPrompt: string
          avatarDescription: string
        }
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
          conceptType: scenario.conceptType,
          recommendedOptions,
          overallStrategy: scenario.overallStrategy,
          suggestedPrompt: scenario.suggestedPrompt,
          // AI 추천 아바타용 - 시나리오에 어울리는 아바타 스타일
          recommendedAvatarStyle: scenario.recommendedAvatarStyle,
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

  // 체형 (bodyType) - 추상적이고 상대적인 표현 사용 (구체적 신체 크기 표현 금지)
  const femaleBodyTypeMap: Record<string, string> = {
    slim: 'slim slender feminine silhouette with delicate proportions',
    average: 'balanced feminine proportions with natural curves',
    athletic: 'toned athletic feminine build with defined musculature',
    curvy: 'feminine silhouette with natural soft curves',
    plussize: 'full-figured feminine form with generous proportions',
  }

  const maleBodyTypeMap: Record<string, string> = {
    slim: 'lean masculine frame with slender proportions',
    average: 'balanced masculine build with standard proportions',
    athletic: 'toned athletic masculine physique with defined muscles',
    curvy: 'solid masculine build with broader frame',
    plussize: 'full masculine frame with generous build',
  }

  const defaultBodyTypeMap: Record<string, string> = {
    slim: 'slim slender build with delicate frame',
    average: 'balanced proportions with natural build',
    athletic: 'toned athletic build with defined physique',
    curvy: 'naturally curved silhouette with soft proportions',
    plussize: 'full-figured build with generous proportions',
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
    ? `\n\n=== AVATAR BODY CONSISTENCY (CRITICAL) ===
IMPORTANT: Preserve the EXACT body proportions from the avatar reference image.
Body type hint: ${avatarBodyDescription}

STRICT RULES:
- DO NOT exaggerate or enhance any body features beyond the reference
- DO NOT add curves, bust definition, or body enhancement
- Keep proportions IDENTICAL to the reference avatar image
- The body type hint is for maintaining consistency, NOT for enhancing features
- When uncertain, always use MORE CONSERVATIVE proportions`
    : ''

  // 제품 카테고리 추상화 (제품명 대신 사용)
  const productCategory = input.productDescription?.includes('립') || input.productDescription?.includes('tint') || input.productDescription?.includes('립틴트')
    ? 'cosmetic product (lip tint)'
    : input.productDescription?.includes('스킨') || input.productDescription?.includes('화장품') || input.productDescription?.includes('skincare')
      ? 'skincare product'
      : input.productDescription?.includes('신발') || input.productDescription?.includes('shoes')
        ? 'footwear product'
        : input.productDescription?.includes('옷') || input.productDescription?.includes('의류') || input.productDescription?.includes('clothing')
          ? 'clothing product'
          : 'product'

  // 아바타 성별 추상화 (상세 묘사 대신 사용)
  const avatarGender = input.avatarCharacteristics?.gender === 'female' ? 'female model' : input.avatarCharacteristics?.gender === 'male' ? 'male model' : 'model'

  // 이미지 순서 안내 (아바타 먼저, 제품 나중)
  const hasAvatar = input.avatarImageUrls && input.avatarImageUrls.length > 0
  const hasProduct = !!input.productImageUrl
  let figureGuide = ''
  if (hasAvatar && hasProduct) {
    figureGuide = `\n=== ATTACHED IMAGES ===
- Figure 1: Avatar/Model reference image (${avatarGender})
- Figure 2: Product reference image (${productCategory})

⚠️ CRITICAL REFERENCE RULES:
- When referring to the avatar/model, use ONLY "the ${avatarGender} from Figure 1" or "the model in Figure 1"
- When referring to the product, use ONLY "the ${productCategory} from Figure 2" or "the product in Figure 2"
- DO NOT describe physical features of the model in detail (no hair color, skin tone, body shape descriptions)
- DO NOT mention product name or brand - only use category (e.g., "the cosmetic product" not "Waterism Glow Mini Tint")
- Keep descriptions ABSTRACT: only gender for model, only category for product`
  } else if (hasAvatar) {
    figureGuide = `\n=== ATTACHED IMAGES ===
- Figure 1: Avatar/Model reference image (${avatarGender})

⚠️ CRITICAL: Refer to model as "the ${avatarGender} from Figure 1" only. DO NOT describe physical features in detail.`
  } else if (hasProduct) {
    figureGuide = `\n=== ATTACHED IMAGES ===
- Figure 1: Product reference image (${productCategory})

⚠️ CRITICAL: Refer to product as "the ${productCategory} from Figure 1" only. DO NOT mention product name or brand.`
  }

  const prompt = `You are an expert advertising photographer creating a HIGH-END COMMERCIAL ADVERTISEMENT image. Generate a Seedream 4.5 optimized prompt for ${input.adType} advertisement.

=== AD TYPE DESCRIPTION ===
${input.adType}: ${adTypeDescriptions[input.adType]}
${figureGuide}

Product Category: ${productCategory}
Options: ${JSON.stringify(input.selectedOptions)}
${input.additionalPrompt ? `Additional: ${input.additionalPrompt}` : ''}${avatarBodyInstruction}

=== COMMERCIAL ADVERTISEMENT STYLE (CRITICAL) ===
This image MUST look like a professional advertisement from a major brand campaign:

1. LIGHTING: Professional studio-quality lighting effect - soft key light with subtle fill, creating dimensionality and highlighting the product. Mention "commercial photography lighting" or "beauty lighting" effect.

2. MODEL EXPRESSION & POSE (if applicable):
   - Confident, engaging expression with genuine emotion
   - Natural but polished pose that draws attention to the product
   - Eyes should convey trust and appeal
   - Slight smile or pleasant expression that feels authentic

3. PRODUCT PRESENTATION:
   - Product should be the HERO of the image
   - Product placement should feel intentional and aesthetically pleasing
   - Product should be well-lit and clearly visible
   - Include "product photography" or "commercial product shot" style

4. OVERALL AESTHETIC:
   - Clean, premium, aspirational feel
   - Magazine-worthy composition
   - High-end brand advertisement quality
   - Include: "commercial advertisement", "brand campaign style", "editorial quality"

5. COLOR & ATMOSPHERE:
   - Rich, vibrant colors with professional color grading
   - Cohesive color palette that complements the product
   - Premium, polished atmosphere

=== CRITICAL FIRST STEP: ANALYZE PRODUCT FOR LOGOS ===
Before generating the prompt, carefully examine the product reference image:
1. Does the product have ANY visible logos, text, labels, or brand names? (Answer YES or NO)
2. If YES: Note exactly what text/logos are visible and where
3. If NO: The product is clean/unbranded - this is IMPORTANT information

=== LOGO & TEXT RULES (STRICTLY ENFORCE) ===
${BRAND_PRESERVATION_INSTRUCTION}

=== PROMPT GENERATION RULES BASED ON LOGO ANALYSIS ===

IF productHasLogo = true (product HAS visible logos/text):
- Add this exact phrase: "reproduce ONLY existing markings from reference image, DO NOT add any new text, logos, or barcodes"
- Do not describe the logos in detail - just preserve what exists

IF productHasLogo = false (product has NO logos/text - CLEAN product):
- Add this exact phrase: "CRITICAL: Product is CLEAN with ZERO branding in the reference. DO NOT ADD any logos, text, labels, barcodes, QR codes, or markings of ANY kind. The product surface must remain 100% identical to the reference image."
- This prohibition is MANDATORY and non-negotiable

ALWAYS include: "DO NOT invent or hallucinate any product markings, brand names, or surface details that are not in the reference image"

=== NEGATIVE ELEMENTS (things to avoid in the image) ===
${PRODUCT_NEGATIVE_PROMPT}
${OVERLAY_NEGATIVE_PROMPT}

=== CRITICAL: NO GRAPHIC OVERLAYS (ABSOLUTE REQUIREMENT) ===
${NO_OVERLAY_ELEMENTS}

The generated image must be a PURE PHOTOGRAPH only:
- NO logo banners at top or bottom
- NO text overlays or captions
- NO barcodes or QR codes
- NO product tags or price labels
- NO decorative frames or borders
- NO watermarks or stamps
- NO promotional graphics
- NO UI elements of any kind

The image should look like a raw camera photograph, not a finished advertisement with added graphics.

Output JSON format:
{
  "productHasLogo": true/false,  // Based on your analysis of the product image
  "optimizedPrompt": "English 80-120 words. ⚠️ CRITICAL: Use ONLY 'the model from Figure 1' and 'the product from Figure 2' to reference images. NO detailed physical descriptions of model (no hair color, skin tone, body features). NO product names or brands - only category (cosmetic, skincare, footwear, etc.). MUST include: (1) commercial advertisement style keywords, (2) professional lighting description, (3) product as hero element, (4) the appropriate logo instruction based on productHasLogo value. End with: professional commercial photography, brand campaign quality, high-end advertisement",
  "koreanDescription": "Korean summary"
}`

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
    const result = JSON.parse(response.text || '') as ImageAdPromptResult

    // 모든 프롬프트에 오버레이 방지 문구 강제 추가
    const overlayPrevention = 'Generate a pure photograph only with absolutely no graphic overlays, no logo banners, no text overlays, no barcodes, no product tags, no frames or borders anywhere in the image.'

    // holding 타입에 대한 제품 표면 보존 강화
    const holdingReinforcement = input.adType === 'holding'
      ? ' The held product must have the EXACT same surface as the reference - no added markings, logos, or barcodes.'
      : ''

    // productHasLogo가 false인 경우, 로고 방지 문구도 추가
    if (result.productHasLogo === false) {
      result.optimizedPrompt = `${result.optimizedPrompt}. ${NO_LOGO_PROMPT_SUFFIX}${holdingReinforcement} ${overlayPrevention}`
    } else {
      result.optimizedPrompt = `${result.optimizedPrompt}.${holdingReinforcement} ${overlayPrevention}`
    }

    return result
  } catch {
    return {
      optimizedPrompt: `Professional product advertisement. High quality, photorealistic. ${NO_LOGO_PROMPT_SUFFIX} Generate a pure photograph only with absolutely no graphic overlays, no logo banners, no text overlays, no barcodes, no product tags, no frames or borders anywhere in the image.`,
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
