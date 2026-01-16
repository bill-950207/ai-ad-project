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
  beforeAfter: {
    korean: '비포/애프터 비교',
    english: 'Before and after transformation',
    focusPoints: ['clear comparison', 'same angle', 'visible difference'],
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
  comparison: {
    korean: '제품 비교 레이아웃',
    english: 'Product comparison layout',
    focusPoints: ['side by side', 'clear differences', 'organized layout'],
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

PHOTOREALISM ELEMENTS TO INCLUDE:
- Camera specs: ${PHOTOREALISM_ESSENTIALS.camera()}
- Skin details: ${PHOTOREALISM_ESSENTIALS.skin}
- Hair details: ${PHOTOREALISM_ESSENTIALS.hair}
- Eye details: ${PHOTOREALISM_ESSENTIALS.eyes}
- End with: ${PHOTOREALISM_ESSENTIALS.quality}`

/** 광고 유형별 프롬프트 구조 가이드 */
export const AD_TYPE_PROMPT_GUIDES: Record<string, string> = {
  productOnly: `Focus on the product as the hero. Structure: Product description → Placement → Background → Lighting → Technical specs.
Example structure: "[Product] centered on [surface], [background description], [lighting setup], shot on 85mm lens at f/2.8, ${PHOTOREALISM_ESSENTIALS.quality}"`,

  holding: `Model naturally holding/presenting the product. Structure: Model + Product interaction → Pose → Expression → Background → Lighting.
Hand position must be natural and product clearly visible. Avoid phone/selfie references.`,

  using: `Model actively using the product in a natural way. Structure: Action description → Model state → Environment → Mood → Lighting.
Show authentic product usage moment, not posed.`,

  wearing: `Fashion-focused shot with model wearing the product. Structure: Outfit description → Model pose → Body framing → Environment → Lighting.
Emphasize fit, drape, and style of the clothing.`,

  lifestyle: `Product naturally integrated into daily life scene. Structure: Scene setting → Activity → Product placement → Atmosphere → Lighting.
Product should feel like a natural part of the scene, not forced.`,
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

AVATAR PRESENCE: {{hasAvatar}}
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
    camera: 'shot on 85mm lens at f/1.8, shallow depth of field',
    quality: 'Hyperrealistic photograph, 8K RAW quality',
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
