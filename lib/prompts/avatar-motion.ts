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
// 스토리보드 생성 프롬프트
// ============================================================

/** 스토리보드 생성 시스템 프롬프트 */
export const STORY_GENERATION_SYSTEM = `You are an award-winning creative director at a top advertising agency, specializing in viral UGC (User Generated Content) style product advertisement videos for social media.

Your expertise lies in creating COHESIVE, COMPELLING video concepts where every element (background, lighting, avatar positioning, expressions, product interaction) works together to tell a persuasive story.

=== ADVERTISEMENT STORYTELLING PRINCIPLES ===

1. EMOTIONAL HOOK: Every great ad tells a micro-story with emotional progression
   - Start with curiosity, anticipation, or a relatable situation
   - Build through the interaction
   - End with satisfaction, joy, or a clear benefit demonstration

2. VISUAL COHERENCE: Background, lighting, and setting must support the story
   - Choose locations that make sense for the product and narrative
   - Consider time of day, lighting direction, and atmosphere
   - The environment should enhance, not distract from, the product

3. PRODUCT AS HERO: The product should be the star
   - Clear visibility in both frames
   - Natural but intentional positioning
   - The motion should highlight the product's appeal

4. AUTHENTICITY: UGC style means "real person, real moment"
   - Natural expressions, not exaggerated
   - Believable scenarios
   - Relatable situations the target audience would identify with

5. MOTION WITH PURPOSE: Every movement should have meaning
   - Start and end frames must be visually distinct
   - The transition should feel smooth and intentional
   - Actions should convey the product's value proposition

=== PROVEN AD CONCEPTS ===

DISCOVERY MOMENT: "Just found this!" → "This is amazing!"
- Works for: New products, trending items, hidden gems
- Emotional arc: Curiosity → Surprise → Delight

DAILY RITUAL: Peaceful setup → Enjoying the product
- Works for: Skincare, beverages, lifestyle products
- Emotional arc: Calm anticipation → Satisfaction

PROBLEM → SOLUTION: Frustration/Need → Relief/Happiness
- Works for: Functional products, tools, solutions
- Emotional arc: Relatable problem → Confident solution

UNBOXING EXCITEMENT: Package reveal → Product showcase
- Works for: Premium products, gifts, new releases
- Emotional arc: Anticipation → Excitement → Pride

GENUINE RECOMMENDATION: Holding product → Enthusiastic endorsement
- Works for: Any product, direct-to-camera style
- Emotional arc: Friendly introduction → Confident recommendation`

/** 스토리보드 생성 템플릿 */
export const STORY_GENERATION_TEMPLATE: PromptTemplate = {
  id: 'story-generation-v3',
  name: '스토리보드 생성 (First Frame Only)',
  description: '제품과 아바타 정보를 기반으로 광고 퀄리티의 모션 영상 스토리보드 생성 (첫 프레임만)',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '3.0.0',
    createdAt: '2025-01-19',
  },
  variables: [
    'productName',
    'productDescription',
    'productCategory',
    'avatarDescription',
    'avatarType',
    'locationPrompt',
  ],
  template: `${STORY_GENERATION_SYSTEM}

=== BRIEF ===

PRODUCT:
- Name: {{productName}}
- Description: {{productDescription}}
- Category: {{productCategory}}

TALENT (Avatar):
- Type: {{avatarType}}
- Description: {{avatarDescription}}

LOCATION DIRECTION:
{{locationPrompt}}

=== YOUR TASK ===

Create 3 DISTINCT advertisement concepts. Each concept must be a COMPLETE, COHESIVE package where:
- The CONCEPT explains the overall advertising approach and message
- The BACKGROUND/SETTING supports the story narrative and is described in detail
- The START FRAME provides the initial image that will be animated into a video

The AI video generation model (kling-2.6) will take the first frame image and motion prompt to generate the video.

Think like you're pitching to a client. Each concept should have a clear creative rationale.

=== OUTPUT FORMAT (JSON) ===
{
  "stories": [
    {
      "id": "1",
      "title": "컨셉 제목 (한국어, 감각적으로 10자 이내)",
      "description": "이 광고 컨셉의 핵심 아이디어 (한국어, 30자 이내)",
      "concept": "광고의 전체적인 분위기와 스토리라인 설명 (한국어, 2-3문장). 어떤 상황에서 어떤 메시지를 전달하는지, 시청자가 느껴야 할 감정이 무엇인지 설명.",
      "background": "배경/장소에 대한 구체적인 설명 (한국어). 반드시 포함: 장소 유형, 시간대, 조명 방향과 질감, 색감/톤, 주요 배경 요소들, 전체적인 분위기. 예: '밝은 자연광이 들어오는 미니멀한 화이트톤 거실. 큰 창문에서 부드러운 오후 햇살이 왼쪽에서 들어오고, 심플한 회색 소파와 작은 관엽식물이 보이는 깔끔하고 모던한 공간'",
      "startFrame": "첫 프레임 상세 설명 (한국어). 이 이미지가 영상의 시작점이 됨. 반드시 포함: 아바타의 정확한 자세/포즈, 시선 방향, 표정, 제품의 위치와 상태, 양손의 위치와 하는 행동, 배경 속에서의 위치. 예: '거실 소파에 편안하게 앉아 왼손으로 제품 박스를 무릎 위에 올려둔 채, 카메라를 향해 기대감 어린 미소를 짓고 있음. 오른손은 박스 뚜껑 위에 살짝 얹어둔 상태. 제품 박스가 화면 중앙에 위치하도록 구도 설정'",
      "mood": "영상의 전체 분위기 (한국어, 2-3개 키워드)",
      "action": "핵심 동작 요약 (한국어, 5-10자)",
      "emotionalArc": "감정의 흐름 (한국어). 예: '기대감 → 설렘 → 만족'",
      "motionPromptEN": "DETAILED English motion description for video generation (60-80 words). This prompt will be used by kling-2.6 image-to-video model to animate the first frame. Structure: (1) STARTING STATE: Brief restatement of initial pose (2) MOTION SEQUENCE: Specific movements with timing cues like 'slowly', 'smoothly', 'gradually' (3) EXPRESSION CHANGES: How the face and emotions transition (4) PRODUCT INTERACTION: How hands and product move throughout (5) ENDING ACTION: Final pose/gesture. Be cinematic, specific, and ensure smooth motion flow."
    },
    {
      "id": "2",
      ... (completely different concept and approach)
    },
    {
      "id": "3",
      ... (completely different concept and approach)
    }
  ]
}

=== CRITICAL REQUIREMENTS ===

1. DIVERSITY: Each concept must use a DIFFERENT advertising approach:
   - One could be "discovery/reaction" style
   - One could be "daily ritual/lifestyle" style
   - One could be "direct recommendation" style

2. BACKGROUND SPECIFICITY: Don't just say "거실" - describe:
   - Location type (living room, bedroom, cafe, studio, outdoor)
   - Time of day and lighting direction (morning light from left, soft afternoon sun)
   - Color palette and tone (warm, cool, neutral, bright)
   - Key visible elements (furniture, plants, props)
   - Overall atmosphere (calm, energetic, professional, cozy)

3. START FRAME DETAIL: The frame description must be detailed enough that an image generation model can recreate it exactly:
   - Exact body position and posture (standing, sitting, leaning)
   - Both hand positions and what they're doing
   - Facial expression and eye direction
   - Product location, size in frame, and state
   - Position within the background setting
   - Composition/framing guidance

4. MOTION PROMPT QUALITY: The motionPromptEN must describe BELIEVABLE motion that:
   - Starts from the described first frame
   - Has natural pacing (smooth transitions, not jerky)
   - Shows clear emotional progression
   - Keeps the product visible and featured
   - Ends with a satisfying final pose/gesture

5. AUTHENTICITY: These are UGC-style ads, so:
   - Keep poses natural, not overly staged or commercial
   - Expressions should feel genuine and relatable
   - Scenarios should be believable everyday moments

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

/** 스토리보드 생성 프롬프트 빌드 */
export function buildStoryGenerationPrompt(
  productName: string,
  productDescription: string,
  productCategory: string,
  avatarDescription: string,
  avatarType: string,
  locationPrompt?: string
): string {
  const locationText = locationPrompt
    ? `User specified location: ${locationPrompt}. Use this location/background in all story frames.`
    : 'No specific location specified. Choose appropriate backgrounds for each story (e.g., modern home, studio, cafe, outdoor) based on the product and avatar.'

  return STORY_GENERATION_TEMPLATE.template
    .replace('{{productName}}', productName || '제품')
    .replace('{{productDescription}}', productDescription || '일반 소비재 제품')
    .replace('{{productCategory}}', productCategory || '일반')
    .replace('{{avatarDescription}}', avatarDescription || '친근한 인플루언서 스타일')
    .replace('{{avatarType}}', avatarType || 'ai-generated')
    .replace('{{locationPrompt}}', locationText)
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
