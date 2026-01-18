/**
 * 아바타 모션 영상용 프롬프트
 *
 * AI 아바타 생성 및 프레임 이미지 생성에 사용되는 프롬프트 템플릿들
 */

import { PromptTemplate } from './types'
import {
  PHOTOREALISM_ESSENTIALS,
  SEEDREAM_FORBIDDEN_TERMS,
  JSON_RESPONSE_INSTRUCTION,
  AVATAR_NEGATIVE_PROMPT,
} from './common'

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
// 프레임 이미지 프롬프트 개선
// ============================================================

/** 프레임 프롬프트 개선 시스템 프롬프트 */
export const FRAME_PROMPT_SYSTEM = `You are an expert at creating optimized prompts for Seedream 4.5 Edit image generation model.

Your task is to transform a Korean frame description into an optimized English prompt for photorealistic image generation.

CRITICAL - IMAGE REFERENCE UNDERSTANDING:
The model will receive reference images in order:
- Image 1 (AVATAR): The person/model who MUST appear in the generated image. PRESERVE their exact facial features, hair, skin tone, and overall appearance.
- Image 2 (PRODUCT, if provided): The product that should appear in the scene. PRESERVE its exact appearance, logo, packaging, and branding.
- Image 3 (FIRST FRAME, for end frame only): Reference for background, lighting, and environment consistency.

CRITICAL RULES:
1. Output must be in English
2. NEVER include: ${SEEDREAM_FORBIDDEN_TERMS.join(', ')}
3. ALWAYS start the prompt with "The same person from the reference image" to ensure identity consistency
4. Describe the EXACT appearance from reference images - do not invent new features
5. ALWAYS include "wearing the same outfit/clothing as in the reference image" to maintain clothing consistency
6. Include specific lighting, camera angle, and composition details
7. End with quality tags for photorealism

CLOTHING CONSISTENCY (CRITICAL):
- The avatar MUST wear the EXACT SAME clothing as shown in the reference image
- Describe the clothing from the reference (e.g., "wearing the same white t-shirt and blue jeans as in reference")
- Never change or invent new clothing - keep outfit identical across all frames

PHOTOREALISM ESSENTIALS:
- Skin: ${PHOTOREALISM_ESSENTIALS.skin}
- Hair: ${PHOTOREALISM_ESSENTIALS.hair}
- Eyes: ${PHOTOREALISM_ESSENTIALS.eyes}
- Quality: ${PHOTOREALISM_ESSENTIALS.quality}

PROMPT STRUCTURE ORDER:
1. Identity reference ("The same person from reference image 1")
2. Physical appearance matching the reference
3. Pose and expression as described
4. Product interaction (if applicable, "holding/using the exact product from reference image 2")
5. Environment/background
6. Lighting setup
7. Camera specifications
8. Quality tags`

/** 프레임 프롬프트 개선 템플릿 (시작 프레임용) */
export const FRAME_PROMPT_IMPROVEMENT_TEMPLATE: PromptTemplate = {
  id: 'frame-prompt-improve-v2',
  name: '프레임 프롬프트 개선',
  description: '한국어 프레임 설명을 영어 프롬프트로 변환 및 개선',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '2.0.0',
    createdAt: '2025-01-18',
  },
  variables: [
    'frameDescription',
    'avatarDescription',
    'productInfo',
    'frameType',
    'aspectRatio',
  ],
  template: `${FRAME_PROMPT_SYSTEM}

FRAME DESCRIPTION (Korean):
{{frameDescription}}

AVATAR REFERENCE (will be provided as Image 1):
{{avatarDescription}}

PRODUCT INFO (will be provided as Image 2, if available):
{{productInfo}}

FRAME TYPE: {{frameType}} (start or end frame)
ASPECT RATIO: {{aspectRatio}}

Transform this into an optimized Seedream 4.5 Edit prompt.

MANDATORY PROMPT REQUIREMENTS:
1. START with "The same person from reference image 1" - this is CRITICAL for identity consistency
2. Describe physical features that MATCH the reference avatar exactly (do not invent new features)
3. ALWAYS include "wearing the same outfit/clothing as in the reference image" - CRITICAL for consistency
4. Include the pose/action from the frame description
5. If product is involved, write "holding/using the exact product shown in reference image 2"
6. Describe a specific background/environment suitable for UGC content
7. Include natural lighting setup (e.g., "soft natural daylight from window on the left")
8. Include camera specs (e.g., "shot on 85mm lens at f/1.8")
9. End with "${PHOTOREALISM_ESSENTIALS.quality}"

EXAMPLE PROMPT STRUCTURE:
"The same person from reference image 1, wearing the same outfit as in the reference, a young woman with [hair from reference], [skin tone from reference], [expression as described], holding the exact product from reference image 2 at chest level, in a bright modern living room with white walls and natural plants, soft natural daylight streaming from large window on the left, shot on 85mm lens at f/1.8, shallow depth of field, ${PHOTOREALISM_ESSENTIALS.quality}"

OUTPUT FORMAT (JSON):
{
  "prompt": "Optimized English prompt for Seedream 4.5 Edit (80-120 words, following the structure above)",
  "negativePrompt": "Negative prompt to avoid common issues"
}

${JSON_RESPONSE_INSTRUCTION}`,
}

/** 끝 프레임 프롬프트 개선 템플릿 (첫 프레임 참조 포함) */
export const END_FRAME_PROMPT_IMPROVEMENT_TEMPLATE: PromptTemplate = {
  id: 'end-frame-prompt-improve-v1',
  name: '끝 프레임 프롬프트 개선 (일관성 유지)',
  description: '첫 프레임을 참조하여 일관된 끝 프레임 프롬프트 생성',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-18',
  },
  variables: [
    'frameDescription',
    'avatarDescription',
    'productInfo',
    'aspectRatio',
    'startFrameDescription',
  ],
  template: `${FRAME_PROMPT_SYSTEM}

IMPORTANT: This is the END FRAME of a video. The START FRAME has already been generated and will be provided as Image 3.
You MUST maintain EXACT consistency with the start frame for:
- CLOTHING/OUTFIT (CRITICAL: SAME clothes, colors, and accessories as start frame)
- Background/environment (SAME room, SAME setting)
- Lighting setup (SAME light direction and quality)
- Color grading and atmosphere
- Camera angle and distance
- Avatar identity (SAME person, hair, face)

START FRAME DESCRIPTION (for reference):
{{startFrameDescription}}

END FRAME DESCRIPTION (Korean):
{{frameDescription}}

AVATAR REFERENCE (Image 1):
{{avatarDescription}}

PRODUCT INFO (Image 2, if available):
{{productInfo}}

ASPECT RATIO: {{aspectRatio}}

Transform this into an optimized Seedream 4.5 Edit prompt for the END FRAME.

MANDATORY REQUIREMENTS FOR END FRAME CONSISTENCY:
1. START with "The same person from reference image 1, wearing the exact same outfit as in reference image 3"
2. The avatar's identity MUST match Image 1 exactly
3. CLOTHING MUST be IDENTICAL to Image 3 (start frame) - same clothes, colors, accessories
4. The background/environment MUST match Image 3 (the start frame) exactly
5. Only the POSE, EXPRESSION, and PRODUCT POSITION should change as described
6. Lighting direction and quality should remain consistent with the start frame
7. Camera angle should be similar to maintain visual continuity

EXAMPLE END FRAME PROMPT:
"The same person from reference image 1, wearing the exact same outfit as shown in reference image 3, in the same environment, now with [new expression] and [new pose], holding the exact product from reference image 2 [new position], maintaining identical clothing, background, lighting, and atmosphere as the start frame, shot on 85mm lens at f/1.8, ${PHOTOREALISM_ESSENTIALS.quality}"

OUTPUT FORMAT (JSON):
{
  "prompt": "Optimized English prompt for Seedream 4.5 Edit (80-120 words, emphasizing clothing and consistency with start frame)",
  "negativePrompt": "different outfit, different clothing, wardrobe change, different background, different lighting, different environment, inconsistent appearance, different person, wrong identity"
}

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 스토리보드 생성 프롬프트
// ============================================================

/** 스토리보드 생성 시스템 프롬프트 */
export const STORY_GENERATION_SYSTEM = `You are a creative director specializing in UGC (User Generated Content) style product advertisement videos.

Your task is to create compelling storyboard options for short avatar motion videos (3-12 seconds).

STORY PRINCIPLES:
1. Focus on natural, authentic movements that feel like real social media content
2. Start frame and end frame should have clear visual difference to create motion
3. The avatar should interact with the product in a believable way
4. Keep actions simple and achievable - these are short clips, not complex narratives
5. Consider the avatar's expressions and body language

COMMON UGC VIDEO PATTERNS:
- Product reveal: Hide → Show
- Before/After: Problem → Solution
- Reaction: Neutral → Excited
- Demonstration: Setup → Result
- Unboxing: Closed → Open`

/** 스토리보드 생성 템플릿 */
export const STORY_GENERATION_TEMPLATE: PromptTemplate = {
  id: 'story-generation-v1',
  name: '스토리보드 생성',
  description: '제품과 아바타 정보를 기반으로 모션 영상 스토리보드 생성',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-18',
  },
  variables: [
    'productName',
    'productDescription',
    'productCategory',
    'avatarDescription',
    'avatarType',
  ],
  template: `${STORY_GENERATION_SYSTEM}

PRODUCT INFORMATION:
- Name: {{productName}}
- Description: {{productDescription}}
- Category: {{productCategory}}

AVATAR INFORMATION:
- Type: {{avatarType}}
- Description: {{avatarDescription}}

Based on this product and avatar, create 3 DIFFERENT storyboard options.
Each story should be unique and suitable for a short UGC-style video.

OUTPUT FORMAT (JSON):
{
  "stories": [
    {
      "id": "1",
      "title": "스토리 제목 (한국어, 10자 이내)",
      "description": "스토리 설명 (한국어, 30자 이내)",
      "startFrame": "시작 프레임 설명 - 아바타의 포즈, 표정, 제품 위치 등 구체적으로 (한국어)",
      "endFrame": "끝 프레임 설명 - 아바타의 포즈, 표정, 제품 위치 등 구체적으로 (한국어)",
      "mood": "분위기 (한국어, 예: 밝고 활기찬, 차분하고 신뢰감 있는)",
      "action": "주요 동작 (한국어, 예: 제품 들어보이기, 제품 사용하기)",
      "motionPromptEN": "DETAILED English motion description for video generation. Describe: (1) Starting pose and expression, (2) The specific motion/movement between start and end, (3) Product interaction throughout the motion, (4) Ending pose and expression. Include details like 'smoothly lifts the product', 'gradually transitions to a smile', 'arm movement from waist to chest level'. MUST be 40-60 words."
    },
    {
      "id": "2",
      ...
    },
    {
      "id": "3",
      ...
    }
  ]
}

IMPORTANT:
- Write startFrame, endFrame, mood, action in Korean
- Write motionPromptEN in DETAILED English - this is critical for video generation quality
- motionPromptEN should describe the MOTION between frames, not just the start and end states
- Make start and end frames visually distinct
- Include specific details about avatar pose, expression, and product position
- Each story should offer a different approach to showcasing the product

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 네거티브 프롬프트
// ============================================================

/** 아바타 모션용 네거티브 프롬프트 */
export const AVATAR_MOTION_NEGATIVE_PROMPT = AVATAR_NEGATIVE_PROMPT + ', inconsistent appearance, different person, wrong identity'

// ============================================================
// 유틸리티 함수
// ============================================================

/** 아바타 생성용 프롬프트 빌드 */
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

/** 시작 프레임 프롬프트 개선 빌드 */
export function buildFrameImprovementPrompt(
  frameDescription: string,
  avatarDescription: string,
  productInfo: string,
  frameType: 'start' | 'end',
  aspectRatio: string
): string {
  return FRAME_PROMPT_IMPROVEMENT_TEMPLATE.template
    .replace('{{frameDescription}}', frameDescription)
    .replace('{{avatarDescription}}', avatarDescription)
    .replace('{{productInfo}}', productInfo)
    .replace('{{frameType}}', frameType)
    .replace('{{aspectRatio}}', aspectRatio)
}

/** 끝 프레임 프롬프트 개선 빌드 (첫 프레임 일관성 유지) */
export function buildEndFrameImprovementPrompt(
  frameDescription: string,
  avatarDescription: string,
  productInfo: string,
  aspectRatio: string,
  startFrameDescription: string
): string {
  return END_FRAME_PROMPT_IMPROVEMENT_TEMPLATE.template
    .replace('{{frameDescription}}', frameDescription)
    .replace('{{avatarDescription}}', avatarDescription)
    .replace('{{productInfo}}', productInfo)
    .replace('{{aspectRatio}}', aspectRatio)
    .replace('{{startFrameDescription}}', startFrameDescription)
}

/** 스토리보드 생성 프롬프트 빌드 */
export function buildStoryGenerationPrompt(
  productName: string,
  productDescription: string,
  productCategory: string,
  avatarDescription: string,
  avatarType: string
): string {
  return STORY_GENERATION_TEMPLATE.template
    .replace('{{productName}}', productName || '제품')
    .replace('{{productDescription}}', productDescription || '일반 소비재 제품')
    .replace('{{productCategory}}', productCategory || '일반')
    .replace('{{avatarDescription}}', avatarDescription || '친근한 인플루언서 스타일')
    .replace('{{avatarType}}', avatarType || 'ai-generated')
}

// ============================================================
// 영상 생성 프롬프트
// ============================================================

/** 영상 생성용 프롬프트 구조 */
interface VideoPromptParams {
  motionPromptEN?: string       // AI가 생성한 영어 모션 설명
  startFrameDescription: string // 시작 프레임 설명
  endFrameDescription: string   // 끝 프레임 설명
  mood?: string                 // 분위기
  action?: string               // 주요 동작
  productName?: string          // 제품명
  productDescription?: string   // 제품 설명
  duration?: number             // 영상 길이 (초)
}

/**
 * 영상 생성용 영어 프롬프트 빌드
 * - AI 스토리에서 생성된 motionPromptEN이 있으면 사용
 * - 없으면 템플릿 기반으로 영어 프롬프트 생성
 */
export function buildVideoGenerationPrompt(params: VideoPromptParams): string {
  const {
    motionPromptEN,
    startFrameDescription,
    endFrameDescription,
    mood,
    action,
    productName,
    productDescription,
    duration = 8,
  } = params

  // AI가 생성한 영어 모션 설명이 있으면 사용
  if (motionPromptEN && motionPromptEN.length > 20) {
    const consistencyClause = 'The person maintains the same appearance, outfit, and clothing throughout the entire video. Smooth, natural, and realistic human motion.'
    const productClause = productName
      ? `Product interaction with ${productName} is natural and fluid.`
      : ''
    const moodClause = mood ? `The overall mood is ${translateMoodToEnglish(mood)}.` : ''

    return `${motionPromptEN} ${consistencyClause} ${productClause} ${moodClause}`.trim()
  }

  // 영어 모션 설명이 없으면 템플릿 기반 생성
  const translatedAction = translateActionToEnglish(action || '')
  const translatedMood = translateMoodToEnglish(mood || '')
  const motionSpeed = duration <= 4 ? 'quick and dynamic' : duration >= 12 ? 'slow and graceful' : 'natural and smooth'

  // 제품 관련 설명
  const productClause = productName
    ? `The person interacts with ${productName}${productDescription ? ` (${productDescription})` : ''} in a natural, authentic way.`
    : ''

  // 프레임 설명을 간단히 영어화 (fallback)
  const hasFrameContext = startFrameDescription && endFrameDescription
  const frameTransitionClause = hasFrameContext
    ? `Starting from initial pose and transitioning to final presentation pose.`
    : ''

  // 기본 영어 프롬프트 템플릿
  const prompt = `The person smoothly transitions from the starting pose to the ending pose with ${motionSpeed} movement. ${frameTransitionClause} ${translatedAction ? `Motion: ${translatedAction}.` : ''} ${productClause} The person maintains the exact same appearance, clothing, and outfit throughout the entire video - no wardrobe changes. Realistic human motion with natural body language and facial expressions. ${translatedMood ? `${translatedMood} mood and atmosphere.` : 'Natural and authentic UGC-style content.'}`

  return prompt.replace(/\s+/g, ' ').trim()
}

/** 한국어 동작 → 영어 변환 */
function translateActionToEnglish(koreanAction: string): string {
  const actionMap: Record<string, string> = {
    '제품 들어보이기': 'Lifting and presenting the product towards the camera',
    '제품 사용하기': 'Demonstrating the product usage in a natural way',
    '제품 개봉하기': 'Unboxing and revealing the product with excitement',
    '제품 소개하기': 'Introducing and showcasing the product features',
    '제품 보여주기': 'Displaying the product with clear visibility',
  }

  // 매핑에 있으면 사용, 없으면 일반적인 설명
  for (const [korean, english] of Object.entries(actionMap)) {
    if (koreanAction.includes(korean.replace('제품 ', ''))) {
      return english
    }
  }

  return 'Natural product interaction and presentation'
}

/** 한국어 분위기 → 영어 변환 */
function translateMoodToEnglish(koreanMood: string): string {
  const moodMap: Record<string, string> = {
    '밝고': 'bright and cheerful',
    '활기찬': 'energetic and lively',
    '친근한': 'friendly and approachable',
    '자연스럽고': 'natural and authentic',
    '일상적인': 'casual and everyday',
    '차분하고': 'calm and relaxed',
    '신뢰감': 'trustworthy and professional',
    '설레는': 'excited and anticipating',
    '기대되는': 'eager and expectant',
    '세련된': 'sophisticated and elegant',
    '편안한': 'comfortable and relaxed',
  }

  let result = ''
  for (const [korean, english] of Object.entries(moodMap)) {
    if (koreanMood.includes(korean)) {
      result = result ? `${result} and ${english}` : english
    }
  }

  return result || 'warm and inviting'
}
