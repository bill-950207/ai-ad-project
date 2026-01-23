/**
 * AI 아바타 생성 프롬프트
 */

import { PromptTemplate } from '../types'
import {
  PHOTOREALISM_ESSENTIALS,
  SEEDREAM_FORBIDDEN_TERMS,
  JSON_RESPONSE_INSTRUCTION,
} from '../common'

// ============================================================
// AI 아바타 생성 프롬프트
// ============================================================

/** AI 아바타 생성 시스템 프롬프트 */
export const AI_AVATAR_SYSTEM_PROMPT = `You are an expert at creating prompts for photorealistic AI-generated human avatars for product advertisement videos.

Your task is to create a prompt that generates a photorealistic person who will appear in a product video.

CRITICAL RULES:
1. The avatar must look like a real person, not AI-generated
2. NEVER include these terms: ${SEEDREAM_FORBIDDEN_TERMS.join(', ')}
3. Focus on natural expressions and poses suitable for UGC-style content
4. Include detailed physical appearance descriptions
5. The person should look approachable and authentic

PHOTOREALISM REQUIREMENTS:
- Skin: ${PHOTOREALISM_ESSENTIALS.skin}
- Hair: ${PHOTOREALISM_ESSENTIALS.hair}
- Eyes: ${PHOTOREALISM_ESSENTIALS.eyes}
- Always end with: ${PHOTOREALISM_ESSENTIALS.quality}`

/** AI 아바타 생성 프롬프트 템플릿 */
export const AI_AVATAR_GENERATION_TEMPLATE: PromptTemplate = {
  id: 'ai-avatar-motion-v1',
  name: 'AI 아바타 생성 (모션 영상용)',
  description: '모션 영상에 사용할 AI 아바타 생성용 프롬프트',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-18',
  },
  variables: [
    'targetGender',
    'targetAge',
    'style',
    'ethnicity',
    'productInfo',
  ],
  template: `${AI_AVATAR_SYSTEM_PROMPT}

AVATAR SPECIFICATIONS:
- Gender: {{targetGender}}
- Age range: {{targetAge}}
- Style/Vibe: {{style}}
- Ethnicity: {{ethnicity}}

PRODUCT CONTEXT:
{{productInfo}}

Create 1 avatar description that would be perfect for promoting this product.
The avatar should be photorealistic and natural-looking.

OUTPUT FORMAT (JSON):
{
  "avatar": {
    "prompt": "English prompt for z-image/turbo (60-80 words, detailed physical description)",
    "koreanDescription": "아바타 설명 (한국어, 20자 이내)"
  }
}

IMPORTANT PROMPT STRUCTURE:
- Start with "A [age]s [ethnicity] [gender]..."
- Include: hair style/color, facial features, expression, body type
- Include: clothing style appropriate for casual UGC content
- End with: ${PHOTOREALISM_ESSENTIALS.quality}

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 컨텍스트 기반 AI 아바타 생성 프롬프트
// ============================================================

/** 컨텍스트 기반 아바타 생성 시스템 프롬프트 */
export const CONTEXT_AWARE_AVATAR_SYSTEM_PROMPT = `You are an expert casting director and creative director for UGC-style product advertisement videos.

Your task is to analyze the complete video context (product, story, mood, location) and design the PERFECT avatar/model for this specific advertisement.

ANALYSIS APPROACH:
1. Understand the PRODUCT - What is being advertised? Who is the target customer?
2. Understand the STORY - What is the narrative? What emotions should the avatar convey?
3. Understand the MOOD - Is it energetic? Calm? Luxurious? Casual?
4. Understand the LOCATION - Where will the video be shot? What style fits?

AVATAR DESIGN PRINCIPLES:
1. The avatar should feel AUTHENTIC to the product's target audience
2. The avatar should be able to naturally perform the described actions
3. The avatar's style should match the video's mood and location
4. Consider age, style, and vibe that resonate with the product category

CRITICAL RULES:
1. The avatar must look like a real person, not AI-generated
2. NEVER include these terms: ${SEEDREAM_FORBIDDEN_TERMS.join(', ')}
3. Design for UGC-style authenticity, not polished commercial looks
4. Include detailed physical appearance that fits the context

PHOTOREALISM REQUIREMENTS:
- Skin: ${PHOTOREALISM_ESSENTIALS.skin}
- Hair: ${PHOTOREALISM_ESSENTIALS.hair}
- Eyes: ${PHOTOREALISM_ESSENTIALS.eyes}
- Always end with: ${PHOTOREALISM_ESSENTIALS.quality}`

/** 컨텍스트 기반 아바타 생성 템플릿 */
export const CONTEXT_AWARE_AVATAR_TEMPLATE: PromptTemplate = {
  id: 'context-aware-avatar-v1',
  name: '컨텍스트 기반 AI 아바타 생성',
  description: '영상의 전체 컨텍스트를 분석하여 최적의 아바타 생성',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-19',
  },
  variables: [
    'productName',
    'productDescription',
    'productCategory',
    'storyTitle',
    'storyDescription',
    'startFrameDescription',
    'endFrameDescription',
    'mood',
    'action',
    'locationPrompt',
  ],
  template: `${CONTEXT_AWARE_AVATAR_SYSTEM_PROMPT}

=== VIDEO CONTEXT ===

PRODUCT INFORMATION:
- Name: {{productName}}
- Description: {{productDescription}}
- Category: {{productCategory}}

VIDEO STORY:
- Title: {{storyTitle}}
- Description: {{storyDescription}}
- Start Frame: {{startFrameDescription}}
- End Frame: {{endFrameDescription}}
- Mood: {{mood}}
- Action: {{action}}

LOCATION/SETTING:
{{locationPrompt}}

=== YOUR TASK ===

Based on ALL the context above, design the perfect avatar for this advertisement video.

Think step by step:
1. Who is the target audience for this product?
2. What type of person would naturally use/promote this product?
3. What appearance would feel authentic in this setting and story?
4. What clothing style fits the location and mood?

OUTPUT FORMAT (JSON):
{
  "avatar": {
    "reasoning": "Brief explanation of why this avatar fits the context (2-3 sentences in Korean)",
    "prompt": "Detailed English prompt for z-image/turbo (80-100 words). Include: age, ethnicity, gender, hair style/color, facial features, expression matching the mood, body type, clothing appropriate for the location and product. End with photorealism tags.",
    "koreanDescription": "아바타 설명 (한국어, 25자 이내, 특징을 간결하게)"
  }
}

IMPORTANT PROMPT STRUCTURE:
- Start with "A [specific age] [ethnicity] [gender]..."
- Include hair (style, length, color) that fits the context
- Include natural facial features and expression matching the mood
- Include clothing that fits BOTH the location AND product type
- The outfit should look natural for someone promoting this specific product
- End with: ${PHOTOREALISM_ESSENTIALS.quality}

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 유틸리티 함수
// ============================================================

/** 아바타 생성용 프롬프트 빌드 (기존 - fallback용) */
export function buildAvatarGenerationPrompt(
  gender: string,
  ageRange: string,
  style: string,
  ethnicity: string,
  productInfo: string
): string {
  return AI_AVATAR_GENERATION_TEMPLATE.template
    .replace('{{targetGender}}', gender)
    .replace('{{targetAge}}', ageRange)
    .replace('{{style}}', style)
    .replace('{{ethnicity}}', ethnicity)
    .replace('{{productInfo}}', productInfo)
}

/** 컨텍스트 기반 아바타 생성용 프롬프트 빌드 */
export interface ContextAwareAvatarParams {
  productName: string
  productDescription: string
  productCategory: string
  storyTitle: string
  storyDescription: string
  startFrameDescription: string
  endFrameDescription?: string
  mood: string
  action: string
  locationPrompt: string
  concept?: string
  background?: string
}

export function buildContextAwareAvatarPrompt(params: ContextAwareAvatarParams): string {
  const {
    productName,
    productDescription,
    productCategory,
    storyTitle,
    storyDescription,
    startFrameDescription,
    endFrameDescription,
    mood,
    action,
    locationPrompt,
    concept,
    background,
  } = params

  const locationText = background
    ? `Location/Background: ${background}`
    : locationPrompt
    ? `User specified location: ${locationPrompt}`
    : 'No specific location specified. The avatar should be versatile for various indoor/outdoor settings.'

  const fullDescription = concept
    ? `${storyDescription}\n\nConcept: ${concept}`
    : storyDescription

  return CONTEXT_AWARE_AVATAR_TEMPLATE.template
    .replace('{{productName}}', productName || '(제품명 미지정)')
    .replace('{{productDescription}}', productDescription || '(설명 없음)')
    .replace('{{productCategory}}', productCategory || '일반 소비재')
    .replace('{{storyTitle}}', storyTitle || '(스토리 제목 미지정)')
    .replace('{{storyDescription}}', fullDescription || '(스토리 설명 없음)')
    .replace('{{startFrameDescription}}', startFrameDescription || '(시작 프레임 미지정)')
    .replace('{{endFrameDescription}}', endFrameDescription || '(영상 생성 시 첫 프레임에서 자연스럽게 모션 진행)')
    .replace('{{mood}}', mood || '자연스럽고 친근한')
    .replace('{{action}}', action || '제품 소개')
    .replace('{{locationPrompt}}', locationText)
}
