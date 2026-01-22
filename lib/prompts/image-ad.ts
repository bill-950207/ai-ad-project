/**
 * 이미지 광고 프롬프트
 *
 * 이미지 광고 생성에 사용되는 프롬프트 템플릿들
 */

import { PromptTemplate } from './types'
import {
  PHOTOREALISM_ESSENTIALS,
  BRAND_PRESERVATION_INSTRUCTION,
  AVATAR_NEGATIVE_PROMPT,
} from './common'

// ============================================================
// 광고 유형별 프롬프트 템플릿
// ============================================================

/** 광고 유형별 기본 설명 */
export const AD_TYPE_DESCRIPTIONS: Record<string, {
  korean: string
  english: string
  focusPoints: string[]
}> = {
  productOnly: {
    korean: '제품 단독 촬영',
    english: 'Professional product photography',
    focusPoints: ['product details', 'clean background', 'studio lighting'],
  },
  holding: {
    korean: '모델이 제품을 들고 있는 컷',
    english: 'Model holding product showcase',
    focusPoints: ['natural grip', 'product visibility', 'model expression'],
  },
  using: {
    korean: '모델이 제품을 사용하는 장면',
    english: 'Model actively using the product',
    focusPoints: ['action shot', 'product in use', 'authentic moment'],
  },
  wearing: {
    korean: '패션/의류 착용샷',
    english: 'Fashion/outfit worn by model',
    focusPoints: ['outfit fit', 'full body or detail', 'style coherence'],
  },
  lifestyle: {
    korean: '일상 사용 맥락',
    english: 'Product in daily life context',
    focusPoints: ['natural setting', 'lifestyle scene', 'product integration'],
  },
  unboxing: {
    korean: '개봉/언박싱',
    english: 'Product unboxing presentation',
    focusPoints: ['packaging visible', 'reveal moment', 'excitement'],
  },
  seasonal: {
    korean: '시즌/기념일 테마',
    english: 'Holiday or seasonal theme',
    focusPoints: ['seasonal elements', 'festive mood', 'themed decoration'],
  },
}

// ============================================================
// Gemini용 이미지 광고 프롬프트 생성 지시
// ============================================================

/** 이미지 광고 프롬프트 생성 시스템 프롬프트 */
export const IMAGE_AD_SYSTEM_PROMPT = `You are an expert advertising photographer and creative director specializing in e-commerce product photography. Your task is to create optimized image generation prompts for Seedream 4.5 model.

KEY REQUIREMENTS:
1. Generate prompts in English only
2. Focus on photorealism - the output should be indistinguishable from a real photograph
3. ${BRAND_PRESERVATION_INSTRUCTION}
4. Include specific camera and lighting details
5. Keep prompts between 60-100 words

AVATAR USAGE FLEXIBILITY:
- If an avatar is provided, it represents the PREFERRED model appearance when a human is needed
- However, the avatar does NOT need to appear in every image
- Decide avatar inclusion based on the ad type and context:
  * "productOnly" → Avatar should NOT appear (product-focused shots)
  * "holding", "using", "wearing" → Avatar SHOULD appear (model-centric shots)
  * "lifestyle", "unboxing", "seasonal" → Avatar is OPTIONAL (include only if it enhances the scene naturally)
- If the avatar would feel forced or unnatural in the composition, prioritize a better product presentation without the avatar
- When avatar is not used, focus entirely on the product and environment

CRITICAL BACKGROUND SHARPNESS RULE:
- The ENTIRE image must be in sharp focus - both subject AND background
- ALWAYS specify "f/11" or "f/16" aperture for maximum depth of field
- ALWAYS include: "entire scene in sharp focus, no blur, no bokeh, no soft background"
- NEVER use shallow depth of field or blurry backgrounds
- Background details must be as crisp and clear as the main subject

PHOTOREALISM ELEMENTS TO INCLUDE:
- Camera specs: shot on 35mm lens at f/11, entire scene razor sharp
- Skin details: ${PHOTOREALISM_ESSENTIALS.skin}
- Hair details: ${PHOTOREALISM_ESSENTIALS.hair}
- Eye details: ${PHOTOREALISM_ESSENTIALS.eyes}
- End with: ${PHOTOREALISM_ESSENTIALS.quality}, entire background crystal clear and in focus`

/** 광고 유형별 프롬프트 구조 가이드 */
export const AD_TYPE_PROMPT_GUIDES: Record<string, string> = {
  productOnly: `Focus on the product as the hero. Structure: Product description → Placement → Background → Lighting → Technical specs.
Example structure: "[Product] centered on [surface], [background description], [lighting setup], shot on 50mm lens at f/11, entire scene in sharp focus, ${PHOTOREALISM_ESSENTIALS.quality}"
CRITICAL: Background must be crystal clear and sharp, never blurry.
AVATAR: Do NOT include any human/model in this shot - pure product focus only.`,

  holding: `Model naturally holding/presenting the product. Structure: Model + Product interaction → Pose → Expression → Background → Lighting.
Hand position must be natural and product clearly visible. Avoid phone/selfie references.
CRITICAL: Use f/11 aperture. Background must be completely sharp and in focus, no blur or bokeh.
AVATAR: Use the provided avatar reference for the model appearance.`,

  using: `Model actively using the product in a natural way. Structure: Action description → Model state → Environment → Mood → Lighting.
Show authentic product usage moment, not posed.
CRITICAL: Entire scene must be in razor sharp focus from foreground to background.
AVATAR: Use the provided avatar reference for the model appearance.`,

  wearing: `Fashion-focused shot with model wearing the product. Structure: Outfit description → Model pose → Body framing → Environment → Lighting.
Emphasize fit, drape, and style of the clothing.
CRITICAL: Use f/11 aperture for maximum sharpness throughout the entire image.
AVATAR: Use the provided avatar reference for the model appearance.`,

  lifestyle: `Product naturally integrated into daily life scene. Structure: Scene setting → Activity → Product placement → Atmosphere → Lighting.
Product should feel like a natural part of the scene, not forced.
CRITICAL: All background details must be perfectly sharp and visible, no soft focus.
AVATAR: Optional - include a human only if it enhances the natural lifestyle context. If the scene works better without a person, omit the avatar entirely.`,

  unboxing: `Product unboxing presentation showing packaging and reveal moment. Structure: Package state → Product visibility → Hands/interaction → Surface → Lighting.
Show the excitement of discovery.
CRITICAL: All packaging details must be crisp and legible.
AVATAR: Optional - include hands or partial figure only if it adds to the unboxing experience naturally.`,

  seasonal: `Holiday or seasonal themed product presentation. Structure: Seasonal elements → Product placement → Decorative context → Themed lighting.
Festive mood without overwhelming the product.
CRITICAL: Maintain sharp focus on both product and seasonal decorations.
AVATAR: Optional - include a person only if they naturally fit the seasonal celebration context.`,
}

// ============================================================
// 프롬프트 템플릿
// ============================================================

/** 이미지 광고 프롬프트 생성 요청 템플릿 */
export const IMAGE_AD_PROMPT_REQUEST_TEMPLATE: PromptTemplate = {
  id: 'image-ad-prompt-request-v1',
  name: '이미지 광고 프롬프트 생성 요청',
  description: 'Gemini에게 이미지 광고 프롬프트 생성을 요청하는 템플릿',
  category: 'image-ad',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-16',
    description: 'Initial version',
  },
  variables: [
    'adType',
    'adTypeDescription',
    'productName',
    'productDescription',
    'selectedOptions',
    'additionalPrompt',
    'hasAvatar',
    'hasReferenceStyle',
  ],
  template: `${IMAGE_AD_SYSTEM_PROMPT}

TASK: Generate an image generation prompt for the following advertisement:

AD TYPE: {{adType}} ({{adTypeDescription}})

PRODUCT INFO:
- Name: {{productName}}
- Description: {{productDescription}}

USER SELECTIONS:
{{selectedOptions}}

{{additionalPrompt}}

AVATAR INFO: {{hasAvatar}}
(Note: Avatar is a style reference for when a human model is appropriate. Decide whether to include a human based on the ad type and context - do NOT force avatar inclusion if it doesn't fit naturally.)

REFERENCE STYLE: {{hasReferenceStyle}}

OUTPUT FORMAT (JSON):
{
  "optimizedPrompt": "English prompt for Seedream 4.5 (60-100 words)",
  "koreanDescription": "Korean description of the generated image (1-2 sentences)"
}

${BRAND_PRESERVATION_INSTRUCTION}`,
}

/** Seedream 4.5용 직접 프롬프트 구조 */
export const SEEDREAM_PROMPT_STRUCTURE = {
  /** 기본 구조 순서 */
  order: [
    'subject',        // 주제/피사체
    'action',         // 동작/포즈
    'environment',    // 환경/배경
    'lighting',       // 조명
    'camera',         // 카메라 설정
    'quality',        // 품질 태그
  ],

  /** 각 섹션 예시 */
  examples: {
    subject: 'Young Asian woman with natural makeup',
    action: 'holding a skincare product at chest level, looking at camera with confident smile',
    environment: 'in a bright modern bathroom with white marble surfaces and natural plants',
    lighting: 'soft natural daylight streaming from large window on the left',
    camera: 'shot on 35mm lens at f/11, entire scene in razor sharp focus from foreground to background, no blur, no bokeh',
    quality: 'Hyperrealistic photograph, 8K RAW quality, crystal clear sharp background',
  },
}

/** 참조 스타일 분석 프롬프트 */
export const REFERENCE_STYLE_ANALYSIS_PROMPT: PromptTemplate = {
  id: 'reference-style-analysis-v1',
  name: '참조 스타일 이미지 분석',
  description: '참조 이미지의 스타일을 분석하여 옵션 값을 추출하는 프롬프트',
  category: 'analysis',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-16',
  },
  variables: ['adType', 'availableOptions'],
  template: `You are an expert image analyst specializing in advertising photography. Analyze the provided reference image and extract style information.

CURRENT AD TYPE: {{adType}}

AVAILABLE OPTIONS TO MATCH:
{{availableOptions}}

ANALYSIS DIMENSIONS:
1. Color Analysis: dominant colors, color temperature (warm/cool), saturation level, contrast, color grading style
2. Lighting Analysis: light direction, light type (natural/artificial), light quality (soft/hard), shadow characteristics, highlight handling
3. Mood/Atmosphere: overall feeling (warm/cool/luxurious/casual/dramatic/minimal)
4. Composition: use of negative space, subject placement, depth of field
5. Texture/Finish: grain level, sharpness, film-like effects

OUTPUT FORMAT (JSON):
{
  "analyzedOptions": [
    {
      "key": "option_group_key",
      "type": "preset" | "custom",
      "value": "preset_key or custom_text",
      "customText": "detailed description if custom",
      "confidence": 0.0-1.0
    }
  ],
  "overallStyle": "전체적인 스타일 설명 (한국어)",
  "suggestedPrompt": "추가 프롬프트 제안 (한국어)"
}`,
}

/** 네거티브 프롬프트 */
export const IMAGE_AD_NEGATIVE_PROMPT = AVATAR_NEGATIVE_PROMPT
