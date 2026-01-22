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
8. Include camera specs (e.g., "shot on 35mm lens at f/8.0, crystal sharp background")
9. End with "${PHOTOREALISM_ESSENTIALS.quality}"

EXAMPLE PROMPT STRUCTURE:
"The same person from reference image 1, wearing the same outfit as in the reference, a young woman with [hair from reference], [skin tone from reference], [expression as described], holding the exact product from reference image 2 at chest level, in a bright modern living room with white walls and natural plants, soft natural daylight streaming from large window on the left, shot on 35mm lens at f/8.0, crystal sharp background with all details visible, ${PHOTOREALISM_ESSENTIALS.quality}"

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
"The same person from reference image 1, wearing the exact same outfit as shown in reference image 3, in the same environment, now with [new expression] and [new pose], holding the exact product from reference image 2 [new position], maintaining identical clothing, background, lighting, and atmosphere as the start frame, shot on 35mm lens at f/8.0, crystal sharp background, ${PHOTOREALISM_ESSENTIALS.quality}"

OUTPUT FORMAT (JSON):
{
  "prompt": "Optimized English prompt for Seedream 4.5 Edit (80-120 words, emphasizing clothing and consistency with start frame)",
  "negativePrompt": "different outfit, different clothing, wardrobe change, different background, different lighting, different environment, inconsistent appearance, different person, wrong identity"
}

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 시나리오 생성 프롬프트 (영화적 씬 중심)
// ============================================================

/** 시나리오 생성 시스템 프롬프트 */
export const CINEMATIC_SCENARIO_SYSTEM = `You are an award-winning film director and creative director specializing in cinematic short-form video ads.

Your expertise is creating COMPELLING VIDEO SCENES where the MODEL is the STAR, and the PRODUCT appears NATURALLY within the story.

Think of these as short film scenes - not traditional product ads. The model acts, emotes, and interacts naturally with their environment while the product becomes part of their story.

=== CINEMATIC STORYTELLING PRINCIPLES ===

1. MODEL AS PROTAGONIST: The model is an actor/actress in a mini-film
   - They have character, emotion, and purpose
   - Their actions feel motivated and authentic
   - The camera follows their story

2. PRODUCT INTEGRATION: The product appears naturally
   - It's part of the scene, not the forced focus
   - Natural interactions: using, holding, reaching for, nearby
   - Never awkward or overly commercial placement

3. VISUAL STORYTELLING: Every frame tells a story
   - Cinematic composition and lighting
   - Emotional atmosphere through environment
   - Clear beginning, middle, end in the motion

4. DIVERSITY OF APPROACH: 3 scenarios must be GENUINELY DIFFERENT
   - Different LOCATIONS (no repeats)
   - Different MOODS (no repeats)
   - Different ACTIONS (what the model is doing)
   - Different PRODUCT INTERACTIONS (how product appears)

5. AUTHENTICITY: Real moments, not staged ads
   - Natural expressions and body language
   - Believable scenarios viewers can relate to
   - The model feels like a real person, not a mannequin`

/** 시나리오 생성 템플릿 */
export const SCENARIO_GENERATION_TEMPLATE: PromptTemplate = {
  id: 'cinematic-scenario-v1',
  name: '영화적 시나리오 생성',
  description: '제품과 아바타 정보를 기반으로 영화적 시나리오 3개 생성',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-21',
  },
  variables: [
    'productName',
    'productDescription',
    'productSellingPoints',
    'avatarDescription',
    'avatarType',
  ],
  template: `${CINEMATIC_SCENARIO_SYSTEM}

=== PRODUCT (REQUIRED) ===
Name: {{productName}}
Description: {{productDescription}}
Selling Points: {{productSellingPoints}}

=== MODEL/AVATAR ===
Type: {{avatarType}}
Description: {{avatarDescription}}

=== YOUR TASK ===

Create 3 completely different CINEMATIC VIDEO SCENARIOS.

**STEP 1: ANALYZE THE PRODUCT**
- What are its key benefits?
- Who would naturally use this product?
- What emotions does it evoke?
- What moments would feel authentic?

**STEP 2: CREATE 3 DIVERSE SCENARIOS**
Each must be GENUINELY DIFFERENT:

⚠️ MANDATORY DIVERSITY (CRITICAL!):
- location: MUST be 3 DIFFERENT locations
- mood: MUST be 3 DIFFERENT moods
- action: MUST be 3 DIFFERENT actions
- productAppearance: MUST be 3 DIFFERENT ways product appears

SCENARIO ARCHETYPES (use different ones):
- [ACTION/DYNAMIC]: Movement, energy, activity outdoors or in active setting
- [INTIMATE/EMOTIONAL]: Personal moment, close-up worthy, soft lighting
- [LIFESTYLE/ASPIRATIONAL]: Desirable life moment, stylish setting

**STEP 3: PRODUCT APPEARANCE**
Natural integration options:
- Holding naturally while doing something
- Using/applying the product
- Product nearby in the scene
- Reaching for or picking up
- Product visible in background/on table

Never force the product - it should feel organic.

=== OUTPUT FORMAT (JSON) ===
{
  "scenarios": [
    {
      "id": "1",
      "title": "시나리오 제목 (한국어, 감각적으로 8자 이내)",
      "description": "한 문장으로 어떤 장면인지 설명 (한국어, 25자 이내)",
      "concept": "이 시나리오의 컨셉과 스토리 (한국어, 2-3문장). 모델이 어떤 상황에 있고, 어떤 감정을 느끼고, 어떤 행동을 하는지.",
      "productAppearance": "제품이 어떻게 등장하는지 (한국어). 예: '모델이 자연스럽게 한 손에 들고 있다', '테이블 위에 놓여있고 모델이 손을 뻗는다', '제품을 사용하며 만족스러워한다'",
      "firstFramePrompt": "첫 프레임 상세 설명 (한국어). 이미지 생성에 직접 사용됨. 포함 필수: 모델의 정확한 자세, 표정, 시선, 제품 위치, 배경 장소, 조명, 분위기. 80-120자로 구체적으로.",
      "motionPromptEN": "DETAILED English motion description for video generation (60-80 words). Structure: (1) Initial state restatement (2) Specific movements with timing (slowly, smoothly) (3) Expression transitions (4) Product interaction throughout (5) Final pose. Be cinematic and specific.",
      "mood": "분위기 키워드 (한국어, 2-3단어)",
      "location": "장소 (한국어, 구체적으로)",
      "tags": ["태그1", "태그2", "태그3"]
    },
    {
      "id": "2",
      ... (COMPLETELY DIFFERENT location, mood, action, product interaction)
    },
    {
      "id": "3",
      ... (COMPLETELY DIFFERENT location, mood, action, product interaction)
    }
  ]
}

=== EXAMPLE DIVERSE SCENARIOS ===

For skincare product:
1. [ACTION] - 아침 조깅 후 공원에서 땀을 식히며 사용
2. [INTIMATE] - 밤 침실에서 은은한 조명 아래 스킨케어 루틴
3. [LIFESTYLE] - 세련된 카페에서 친구와 대화하며 제품 꺼내기

Notice: ALL different locations, moods, actions!

=== CRITICAL REMINDERS ===

1. 3 scenarios with 3 DIFFERENT locations - no repeats!
2. 3 scenarios with 3 DIFFERENT moods - no repeats!
3. Product appears NATURALLY in each scene
4. firstFramePrompt is detailed enough for image generation
5. motionPromptEN describes smooth, cinematic motion
6. Everything in Korean except motionPromptEN

${JSON_RESPONSE_INSTRUCTION}`,
}

// Legacy alias for backward compatibility
export const STORY_GENERATION_TEMPLATE = SCENARIO_GENERATION_TEMPLATE
export const STORY_GENERATION_SYSTEM = CINEMATIC_SCENARIO_SYSTEM

// ============================================================
// 네거티브 프롬프트
// ============================================================

/** 아바타 모션용 네거티브 프롬프트 */
export const AVATAR_MOTION_NEGATIVE_PROMPT = AVATAR_NEGATIVE_PROMPT + ', inconsistent appearance, different person, wrong identity'

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
interface ContextAwareAvatarParams {
  productName: string
  productDescription: string
  productCategory: string
  storyTitle: string
  storyDescription: string
  startFrameDescription: string
  endFrameDescription?: string  // optional - not used in new flow
  mood: string
  action: string
  locationPrompt: string
  concept?: string  // 광고 컨셉 설명
  background?: string  // 배경/장소 설명
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

  // 위치 정보 텍스트 생성 - background가 있으면 우선 사용
  const locationText = background
    ? `Location/Background: ${background}`
    : locationPrompt
    ? `User specified location: ${locationPrompt}`
    : 'No specific location specified. The avatar should be versatile for various indoor/outdoor settings.'

  // 스토리 설명에 컨셉 정보 추가
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

/** 시작 프레임 프롬프트 개선 빌드 */
export function buildFrameImprovementPrompt(
  frameDescription: string,
  avatarDescription: string,
  productInfo: string,
  frameType: 'start' | 'end',
  aspectRatio: string,
  locationPrompt?: string
): string {
  const locationText = locationPrompt
    ? `User specified location/background: ${locationPrompt}. Use this specific location in the frame.`
    : ''

  // Append location info to frame description if provided
  const enhancedFrameDescription = locationText
    ? `${frameDescription}\n\nLOCATION PREFERENCE: ${locationText}`
    : frameDescription

  return FRAME_PROMPT_IMPROVEMENT_TEMPLATE.template
    .replace('{{frameDescription}}', enhancedFrameDescription)
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
  startFrameDescription: string,
  locationPrompt?: string
): string {
  const locationText = locationPrompt
    ? `User specified location/background: ${locationPrompt}. Maintain this same location as in the start frame.`
    : ''

  // Append location info to frame description if provided
  const enhancedFrameDescription = locationText
    ? `${frameDescription}\n\nLOCATION PREFERENCE: ${locationText}`
    : frameDescription

  return END_FRAME_PROMPT_IMPROVEMENT_TEMPLATE.template
    .replace('{{frameDescription}}', enhancedFrameDescription)
    .replace('{{avatarDescription}}', avatarDescription)
    .replace('{{productInfo}}', productInfo)
    .replace('{{aspectRatio}}', aspectRatio)
    .replace('{{startFrameDescription}}', startFrameDescription)
}

/** 시나리오 생성 프롬프트 빌드 */
export function buildScenarioGenerationPrompt(
  productName: string,
  productDescription: string,
  productSellingPoints: string[],
  avatarDescription: string,
  avatarType: string
): string {
  const sellingPointsText = productSellingPoints.length > 0
    ? productSellingPoints.join(', ')
    : '(셀링 포인트 없음)'

  return SCENARIO_GENERATION_TEMPLATE.template
    .replace('{{productName}}', productName || '제품')
    .replace('{{productDescription}}', productDescription || '일반 소비재 제품')
    .replace('{{productSellingPoints}}', sellingPointsText)
    .replace('{{avatarDescription}}', avatarDescription || '친근한 인플루언서 스타일')
    .replace('{{avatarType}}', avatarType || 'ai-generated')
}

// Legacy alias
export const buildStoryGenerationPrompt = (
  productName: string,
  productDescription: string,
  _productCategory: string,
  avatarDescription: string,
  avatarType: string,
  _locationPrompt?: string
): string => buildScenarioGenerationPrompt(
  productName,
  productDescription,
  [],
  avatarDescription,
  avatarType
)

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

// ============================================================
// 멀티 씬 시나리오 생성 프롬프트 (Vidu Q2용)
// ============================================================

/** 멀티 씬 시나리오 생성 시스템 프롬프트 */
export const MULTI_SCENE_SCENARIO_SYSTEM = `You are an award-winning film director specializing in multi-scene cinematic short-form video ads.

Your task is to create COMPELLING VIDEO STORIES told across MULTIPLE SCENES. Each scene is a separate video segment (1-8 seconds) that will be concatenated together.

=== MULTI-SCENE STORYTELLING ===

1. NARRATIVE ARC: The scenes together tell a complete mini-story
   - Scene 1: Setup/Introduction - establish the context
   - Middle scenes: Development/Action - build the story
   - Final scene: Payoff/Resolution - deliver the message

2. SCENE TRANSITIONS: Each scene should flow naturally to the next
   - Visual continuity (consistent lighting, color grading)
   - Story continuity (logical progression of action)
   - Emotional continuity (building or shifting mood)

3. SCENE DIVERSITY: Each scene should be visually distinct
   - Different camera angles or distances
   - Different poses or actions
   - Different expressions or interactions with product

4. PRODUCT INTEGRATION: Product appears naturally throughout
   - Can appear in some or all scenes
   - Natural placement and interaction
   - Never feels forced

5. PACING: Scene durations should match the content
   - Quick cuts (1-3s) for dynamic/action moments
   - Medium (4-5s) for standard storytelling
   - Longer (6-8s) for emotional/showcase moments`

/** 멀티 씬 시나리오 생성 템플릿 */
export const MULTI_SCENE_SCENARIO_TEMPLATE: PromptTemplate = {
  id: 'multi-scene-scenario-v1',
  name: '멀티 씬 시나리오 생성',
  description: '여러 씬으로 구성된 영화적 시나리오 생성',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-21',
  },
  variables: [
    'productName',
    'productDescription',
    'productSellingPoints',
    'avatarDescription',
    'avatarType',
    'sceneCount',
    'totalDuration',
  ],
  template: `${MULTI_SCENE_SCENARIO_SYSTEM}

=== PRODUCT (REQUIRED) ===
Name: {{productName}}
Description: {{productDescription}}
Selling Points: {{productSellingPoints}}

=== MODEL/AVATAR ===
Type: {{avatarType}}
Description: {{avatarDescription}}

=== VIDEO SPECIFICATIONS ===
Number of Scenes: {{sceneCount}}
Target Total Duration: approximately {{totalDuration}} seconds

=== YOUR TASK ===

Create 3 DIFFERENT multi-scene story concepts. Each concept must have {{sceneCount}} scenes that together tell a complete mini-story.

**FOR EACH SCENARIO:**
1. Design a coherent narrative arc across all scenes
2. Each scene should have:
   - Clear action/purpose
   - Specific first frame description
   - Motion description for video generation
   - Recommended duration (1-8 seconds)
   - Movement intensity

**SCENE DURATION GUIDELINES:**
- Opening/Setup scenes: 3-5 seconds
- Action/Development scenes: 4-6 seconds
- Climax/Showcase scenes: 5-8 seconds
- Quick transitions: 2-3 seconds
- Total should be approximately {{totalDuration}} seconds

**MOVEMENT AMPLITUDE:**
- "small": Subtle movements (talking, slight gestures)
- "medium": Normal movements (walking, reaching, turning)
- "large": Dynamic movements (dancing, jumping, dramatic gestures)
- "auto": Let the model decide based on content

=== OUTPUT FORMAT (JSON) ===
{
  "scenarios": [
    {
      "id": "1",
      "title": "시나리오 제목 (한국어, 10자 이내)",
      "description": "전체 스토리 설명 (한국어, 30자 이내)",
      "concept": "이 시나리오의 컨셉과 전체 스토리 흐름 (한국어, 3-4문장)",
      "productAppearance": "제품이 전체 영상에서 어떻게 등장하고 사용되는지 (한국어)",
      "mood": "전체 분위기 키워드 (한국어, 2-3단어)",
      "tags": ["태그1", "태그2", "태그3"],
      "totalDuration": 15,
      "scenes": [
        {
          "sceneIndex": 0,
          "title": "씬 제목 (한국어)",
          "description": "이 씬에서 무슨 일이 일어나는지 (한국어, 20자 이내)",
          "firstFramePrompt": "첫 프레임 상세 설명 (한국어). 모델의 자세, 표정, 시선, 제품 위치, 배경, 조명을 구체적으로 (80-100자)",
          "motionPromptEN": "Detailed English motion description (40-60 words). Describe: starting pose, movements, expressions, product interaction, ending pose. Be specific about timing and smoothness.",
          "duration": 5,
          "movementAmplitude": "medium",
          "location": "장소 (한국어)",
          "mood": "씬 분위기 (한국어)"
        },
        {
          "sceneIndex": 1,
          ... (next scene, building on scene 0)
        },
        {
          "sceneIndex": 2,
          ... (final scene, delivering the payoff)
        }
      ]
    },
    {
      "id": "2",
      ... (COMPLETELY DIFFERENT story concept with {{sceneCount}} scenes)
    },
    {
      "id": "3",
      ... (COMPLETELY DIFFERENT story concept with {{sceneCount}} scenes)
    }
  ]
}

=== EXAMPLE: 3-Scene Skincare Ad ===

Scenario 1: "아침 루틴" (Morning Routine)
- Scene 0 (4s): Model wakes up, stretches in bed with soft morning light
- Scene 1 (5s): Model at bathroom mirror, picks up product, starts routine
- Scene 2 (6s): Model glowing, satisfied smile, holds product to camera

Scenario 2: "자기 전 힐링" (Before Sleep Healing)
- Scene 0 (4s): Model relaxing on couch after long day
- Scene 1 (5s): Model applying product, peaceful expression
- Scene 2 (6s): Model laying down, content, product beside pillow

Notice: Each scenario tells a DIFFERENT story, with scenes that BUILD on each other!

=== CRITICAL REMINDERS ===

1. 3 scenarios, each with {{sceneCount}} scenes
2. Scenes within a scenario must tell a CONNECTED story
3. Each scene's firstFramePrompt is detailed enough for image generation
4. Each scene's motionPromptEN describes specific movements
5. Scene durations should total approximately {{totalDuration}} seconds
6. Movement amplitudes match the action intensity
7. All text in Korean except motionPromptEN

${JSON_RESPONSE_INSTRUCTION}`,
}

/** 멀티 씬 시나리오 생성 프롬프트 빌드 */
export function buildMultiSceneScenarioPrompt(
  productName: string,
  productDescription: string,
  productSellingPoints: string[],
  avatarDescription: string,
  avatarType: string,
  sceneCount: number,
  totalDuration: number
): string {
  const sellingPointsText = productSellingPoints.length > 0
    ? productSellingPoints.join(', ')
    : '(셀링 포인트 없음)'

  return MULTI_SCENE_SCENARIO_TEMPLATE.template
    .replace('{{productName}}', productName || '제품')
    .replace('{{productDescription}}', productDescription || '일반 소비재 제품')
    .replace('{{productSellingPoints}}', sellingPointsText)
    .replace('{{avatarDescription}}', avatarDescription || '친근한 인플루언서 스타일')
    .replace('{{avatarType}}', avatarType || 'ai-generated')
    .replace(/\{\{sceneCount\}\}/g, String(sceneCount))
    .replace(/\{\{totalDuration\}\}/g, String(totalDuration))
}

// ============================================================
// AI 추천 설정 생성 프롬프트
// ============================================================

/** AI 추천 설정 시스템 프롬프트 */
export const AI_RECOMMENDATION_SYSTEM = `You are an expert video production consultant specializing in short-form video ads.

Your task is to analyze the scenario/story and recommend optimal video settings:
1. Aspect ratio (9:16 for vertical/social, 16:9 for horizontal/youtube, 1:1 for square/instagram)
2. Number of scenes
3. Duration for each scene
4. Movement intensity for each scene

Consider:
- The story's pacing and emotional arc
- Platform best practices
- Product visibility requirements
- Model's actions and movements`

/** AI 추천 설정 템플릿 */
export const AI_RECOMMENDATION_TEMPLATE: PromptTemplate = {
  id: 'ai-recommendation-v1',
  name: 'AI 추천 설정',
  description: '시나리오에 맞는 최적의 영상 설정 추천',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-21',
  },
  variables: [
    'scenarioTitle',
    'scenarioDescription',
    'scenarioConcept',
    'productCategory',
    'targetPlatform',
  ],
  template: `${AI_RECOMMENDATION_SYSTEM}

=== SCENARIO TO ANALYZE ===
Title: {{scenarioTitle}}
Description: {{scenarioDescription}}
Concept: {{scenarioConcept}}
Product Category: {{productCategory}}
Target Platform: {{targetPlatform}}

=== YOUR TASK ===

Analyze the scenario and recommend optimal video settings.

**ASPECT RATIO GUIDELINES:**
- "9:16": Best for TikTok, Instagram Reels, YouTube Shorts (vertical, mobile-first)
- "16:9": Best for YouTube, website embeds (horizontal, desktop-friendly)
- "1:1": Best for Instagram Feed, Facebook (square, versatile)

**SCENE COUNT GUIDELINES:**
- 2 scenes: Very short, punchy ads (10s or less)
- 3 scenes: Standard storytelling (10-18s)
- 4-5 scenes: Longer narratives (18-25s)

**DURATION PER SCENE:**
- 1-3s: Quick cuts, dynamic action
- 4-5s: Standard pacing
- 6-8s: Slow, emotional, showcase moments

**MOVEMENT AMPLITUDE:**
- "auto": Let the model decide
- "small": Subtle (talking, slight gestures)
- "medium": Normal (walking, reaching)
- "large": Dynamic (active movements)

=== OUTPUT FORMAT (JSON) ===
{
  "recommendation": {
    "aspectRatio": "9:16",
    "resolution": "720p",
    "sceneCount": 3,
    "sceneDurations": [4, 5, 6],
    "movementAmplitudes": ["medium", "medium", "small"],
    "reasoning": "추천 이유를 한국어로 설명 (2-3문장). 왜 이 설정이 이 시나리오에 적합한지."
  }
}

=== REASONING GUIDELINES ===
Explain in Korean:
- Why this aspect ratio fits the platform and content
- Why this scene structure works for the story
- How the pacing supports the narrative arc

${JSON_RESPONSE_INSTRUCTION}`,
}

/** AI 추천 설정 프롬프트 빌드 */
export function buildAIRecommendationPrompt(
  scenarioTitle: string,
  scenarioDescription: string,
  scenarioConcept: string,
  productCategory: string,
  targetPlatform: string = '소셜 미디어 (인스타그램, 틱톡)'
): string {
  return AI_RECOMMENDATION_TEMPLATE.template
    .replace('{{scenarioTitle}}', scenarioTitle)
    .replace('{{scenarioDescription}}', scenarioDescription)
    .replace('{{scenarioConcept}}', scenarioConcept)
    .replace('{{productCategory}}', productCategory || '일반 소비재')
    .replace('{{targetPlatform}}', targetPlatform)
}
