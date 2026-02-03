/**
 * 첫 프레임 이미지 프롬프트
 *
 * 영상 광고의 첫 장면 이미지 생성에 사용되는 프롬프트 템플릿들
 */

import { PromptTemplate } from './types'
import {
  PHOTOREALISM_ESSENTIALS,
  CAMERA_COMPOSITION_PROMPTS,
  SEEDREAM_FORBIDDEN_TERMS,
  UGC_BACKGROUND_STYLE,
  JSON_RESPONSE_INSTRUCTION,
  LIGHTING_CAMERA_INSTRUCTION,
  EQUIPMENT_NEGATIVE_PROMPT,
  NO_OVERLAY_ELEMENTS,
} from './common'
import { VideoType } from './scripts'

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 첫 프레임 프롬프트 가이드라인 */
const FIRST_FRAME_EXAMPLES = `
=== FIRST FRAME PROMPT GUIDELINES ===

PROMPT STRUCTURE (follow this pattern):
"[Person description] + [outfit] + [pose/action] + [product interaction] + [expression] + [environment] + [lighting] + [camera specs] + [quality tags]"

REQUIRED ELEMENTS:
1. Person: Use avatar reference or describe naturally
2. Outfit: Casual/appropriate for video type
3. Pose: Sitting, standing, or natural position
4. Product: "holding product at chest level" or appropriate interaction
5. Expression: "natural relaxed expression" or "calm neutral expression"
6. Environment: Match video type (home for UGC, desk for podcast, etc.)
7. Lighting: "soft natural light from window" or similar
8. Camera: "shot on 35mm f/11" (UGC) or "shot on 50mm f/16" (professional)
9. Quality: "natural skin texture, 8K quality"

AVOID (causes issues):
✗ Lighting equipment words (ring light, softbox, LED)
✗ Forced expressions (big smile, excited, teeth showing)
✗ "Studio" word (use "plain solid color background" instead)
✗ Shallow depth of field (f/1.8, f/2.8 - causes bokeh)
`.trim()

/** 카메라 선택 Chain-of-Thought */
const CAMERA_SELECTION_COT = `
=== CAMERA SELECTION (Chain-of-Thought) ===

Step 1: IDENTIFY video type
- UGC → prefer ugc-selfie, ugc-closeup
- Podcast → prefer tripod, closeup
- Expert → prefer tripod, fullbody

Step 2: CONSIDER product interaction
- Holding product → selfie-front, ugc-closeup
- Using product → closeup
- Presenting product → tripod, fullbody

Step 3: SELECT depth of field
- UGC style → f/11, background SHARP
- Professional → f/16, everything in focus
- NEVER use shallow depth of field or bokeh for UGC
`.trim()

/** 첫 프레임 Self-Verification */
const FIRST_FRAME_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your prompt:
✓ No lighting EQUIPMENT words (softbox, ring light)?
✓ No "studio" word? (use "plain solid color background" or specific location instead)
✓ No "big smile", "wide grin", "teeth showing"?
✓ Background is SHARP (f/11+), no bokeh?
✓ Has camera specs (lens, f/stop)?
✓ 50-80 words?
If any check fails, revise before responding.
`.trim()

// ============================================================
// 첫 프레임 프롬프트 시스템 지시
// ============================================================

/** 첫 프레임 생성 시스템 프롬프트 (Gemini용) */
export const FIRST_FRAME_SYSTEM_PROMPT = `You are an expert photographer specializing in UGC (User-Generated Content) style product photography. Your task is to create Seedream 4.5 optimized prompts for generating the first frame of a product video advertisement.

GOAL: Generate a 100% photorealistic image that looks like a real photograph taken by an influencer or content creator.

CRITICAL RULES:
1. NEVER include these terms: ${SEEDREAM_FORBIDDEN_TERMS.join(', ')}
2. Hands must be: holding product naturally or in relaxed pose
3. Background must be: ${UGC_BACKGROUND_STYLE}
4. Always end with: ${PHOTOREALISM_ESSENTIALS.quality}

=== CRITICAL: NO VISIBLE EQUIPMENT ===
${LIGHTING_CAMERA_INSTRUCTION}

=== CRITICAL: NO GRAPHIC OVERLAYS ===
${NO_OVERLAY_ELEMENTS}

PROMPT STRUCTURE:
Subject (who) → Action/Pose (what) → Environment (where) → Lighting effect (NOT equipment) → Camera specs (NOT visible camera)

PHOTOREALISM CHECKLIST:
- Skin: ${PHOTOREALISM_ESSENTIALS.skin}
- Hair: ${PHOTOREALISM_ESSENTIALS.hair}
- Eyes: ${PHOTOREALISM_ESSENTIALS.eyes}
- Include camera specs: shot on [focal length] lens at f/[aperture] (this describes image quality, NOT a visible camera)`

// ============================================================
// 카메라 구도별 프롬프트 생성
// ============================================================

/** 카메라 구도에 따른 프롬프트 세그먼트 생성 */
export function getCameraCompositionSegment(composition: string): string {
  const config = CAMERA_COMPOSITION_PROMPTS[composition]
  if (!config) {
    return 'natural pose at comfortable angle'
  }

  return `${config.angle}, ${config.description}, ${config.handPosition}`
}

/** 카메라 구도별 상세 가이드 (UGC 스타일 - 배경 완전 선명) */
export const CAMERA_COMPOSITION_DETAILED_GUIDES: Record<string, {
  promptSegment: string
  lightingRecommendation: string
  depthOfField: string
}> = {
  'selfie-high': {
    promptSegment: 'captured from high angle approximately 30 degrees above eye level, subject looking up with naturally enlarged eyes, one hand holding product at chest level',
    lightingRecommendation: 'soft overhead lighting with catchlights in eyes',
    depthOfField: 'f/11 with entire scene in razor sharp focus from foreground to background, absolutely no blur or bokeh anywhere',
  },
  'selfie-front': {
    promptSegment: 'eye-level straight-on frontal view, direct eye contact with camera, confident expression, product held forward at chest height',
    lightingRecommendation: 'balanced front lighting with soft fill',
    depthOfField: 'f/11 with every background detail crystal clear and sharp, absolutely no blur no bokeh no soft focus',
  },
  'selfie-side': {
    promptSegment: 'three-quarter view at 45-degree angle, showing facial contours and profile definition, product visible from angled perspective',
    lightingRecommendation: 'side lighting to emphasize facial structure',
    depthOfField: 'f/11 with entire background razor sharp including all details, no blur no bokeh',
  },
  'tripod': {
    promptSegment: 'stable fixed-camera composition at chest to eye level, professional framing as if on tripod, both hands free to hold product naturally',
    lightingRecommendation: 'controlled soft even light or well-lit interior (NO visible lighting equipment)',
    depthOfField: 'f/16 with entire scene in perfect sharp focus from nearest to farthest point',
  },
  'closeup': {
    promptSegment: 'intimate close framing on face and upper chest, filling most of frame, detailed facial features visible, product held near face',
    lightingRecommendation: 'soft beauty lighting with subtle shadows',
    depthOfField: 'f/11 with environment completely visible and razor sharp, absolutely no artificial blur or bokeh',
  },
  'fullbody': {
    promptSegment: 'full body visible in frame from head to feet, environmental context included, product held at waist level in natural standing pose',
    lightingRecommendation: 'even full-body lighting, possibly natural outdoor light',
    depthOfField: 'f/16 with entire scene in perfect sharp focus from foreground to background, every detail visible',
  },
  'ugc-closeup': {
    promptSegment: 'UGC-style intimate medium close-up, subject fills most of the frame from chest up, natural authentic expression (can be neutral, thoughtful, or subtly engaged - NOT forced smile), eyes looking DIRECTLY into camera lens, casual influencer vlog aesthetic like casually talking to viewer, approachable and genuine vibe',
    lightingRecommendation: 'soft natural window light, flattering front lighting (NO visible lighting equipment)',
    depthOfField: 'f/11 with background clearly visible and mostly sharp, only natural perspective depth - no artificial bokeh, like a real smartphone photo',
  },
  'ugc-selfie': {
    promptSegment: 'POV selfie shot from smartphone camera perspective, subject looking directly at camera with natural authentic expression (can be neutral, curious, or subtly engaged - NOT forced smile), intimate selfie perspective at eye level or slightly above, NO phone device visible in frame, natural relaxed pose presenting product at chest level, anatomically correct natural hands',
    lightingRecommendation: 'natural daylight or soft indoor lighting, flattering selfie lighting',
    depthOfField: 'f/11 with background clearly visible and mostly sharp, minimal natural perspective blur only - no artificial bokeh, like a real smartphone photo',
  },
  // Podcast 스타일 카메라 구도
  webcam: {
    promptSegment: 'webcam-style frontal view at desktop distance, subject centered in frame at eye level, conversational podcast framing with slight head room, natural relaxed posture as if speaking to viewer through computer screen',
    lightingRecommendation: 'soft front-facing window light or ambient room lighting, warm comfortable atmosphere',
    depthOfField: 'f/11 with background mostly sharp, natural room depth visible, no artificial blur',
  },
  'medium-shot': {
    promptSegment: 'medium shot showing subject from waist up, balanced composition with comfortable breathing room, professional yet casual framing suitable for extended viewing',
    lightingRecommendation: 'even balanced lighting from front and side, creating depth without harsh shadows',
    depthOfField: 'f/11-f/16 with entire scene in sharp focus, suitable for any video style',
  },
  'three-quarter': {
    promptSegment: 'three-quarter angle view with subject turned 30-45 degrees from camera, adding visual depth and interest, dynamic yet professional composition',
    lightingRecommendation: 'key light from turned side creating natural dimension, subtle fill from opposite side',
    depthOfField: 'f/11 with full scene clarity, engaging perspective without distraction',
  },
  // Expert 스타일 카메라 구도
  presenter: {
    promptSegment: 'professional presenter framing with subject in power position, confident stance with shoulders squared, TED-talk style composition conveying authority and expertise, adequate space for gestures',
    lightingRecommendation: 'professional broadcast-quality lighting, even illumination conveying credibility',
    depthOfField: 'f/16 with entire scene in perfect sharp focus, professional presentation quality',
  },
}

// ============================================================
// 비디오 타입별 첫 프레임 가이드
// ============================================================

/** 비디오 타입별 첫 프레임 생성 가이드 */
export const VIDEO_TYPE_FIRST_FRAME_GUIDES: Record<VideoType, {
  environmentPrompt: string
  posePrompt: string
  atmospherePrompt: string
  recommendedCompositions: string[]
  expressionGuide: string
  cameraMovementHint: string
  handProductGuide: string
}> = {
  UGC: {
    environmentPrompt: 'casual home setting, cozy living room or bedroom, natural lived-in environment with personal touches',
    posePrompt: 'relaxed natural pose, casually holding product at chest level, authentic genuine expression (NOT forced smile)',
    atmospherePrompt: 'candid authentic vibe, real influencer sharing discovery, warm personal connection with viewer',
    recommendedCompositions: ['ugc-selfie', 'ugc-closeup', 'selfie-front', 'selfie-high', 'selfie-side'],
    expressionGuide: 'natural relaxed expression, can be neutral/curious/subtly engaged - avoid big smiles or exaggerated reactions',
    cameraMovementHint: 'handheld selfie feel, slight natural movement okay, POV perspective',
    handProductGuide: 'casual natural grip, product visible and angled toward camera',
  },
  podcast: {
    environmentPrompt: 'intimate podcast setting atmosphere, clean organized desk setup, warm ambient lighting, comfortable professional space with minimal distractions, no visible equipment',
    posePrompt: 'seated comfortably, conversational posture, engaged expression',
    atmospherePrompt: 'intimate one-on-one conversation feel, warm inviting setting, like chatting with a trusted friend who happens to be knowledgeable',
    recommendedCompositions: ['webcam', 'medium-shot', 'closeup', 'three-quarter'],
    expressionGuide: 'warm engaged expression, attentive listener/speaker vibe, occasional thoughtful pauses',
    cameraMovementHint: 'stable webcam or tripod feel, minimal movement, focus on connection',
    handProductGuide: 'product on desk or held casually, natural posture',
  },
  expert: {
    environmentPrompt: 'professional educational setting, modern office or clean minimalist space, seamless backdrop, well-lit presentation area conveying credibility, no visible equipment',
    posePrompt: 'confident presenter stance, product held in presenting position, professional display',
    atmospherePrompt: 'educational authority atmosphere, TED-talk credibility, trustworthy expert sharing valuable knowledge',
    recommendedCompositions: ['tripod', 'presenter', 'medium-shot', 'fullbody'],
    expressionGuide: 'confident knowledgeable expression, professional demeanor, calm assured look',
    cameraMovementHint: 'stable professional framing, broadcast quality, authority positioning',
    handProductGuide: 'product held for optimal viewing angle, professional display',
  },
}

// ============================================================
// 프롬프트 템플릿
// ============================================================

/** 첫 프레임 프롬프트 생성 요청 템플릿 */
export const FIRST_FRAME_PROMPT_TEMPLATE: PromptTemplate = {
  id: 'first-frame-prompt-v1',
  name: '첫 프레임 이미지 프롬프트 생성',
  description: '영상 광고의 첫 장면 이미지 생성용 프롬프트',
  category: 'video-ad',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-16',
  },
  variables: [
    'productInfo',
    'cameraComposition',
    'cameraGuide',
    'locationPrompt',
    'hasProductImage',
    'hasAvatarImage',
  ],
  template: `${FIRST_FRAME_SYSTEM_PROMPT}

PRODUCT INFO:
{{productInfo}}

CAMERA COMPOSITION: {{cameraComposition}}
{{cameraGuide}}

LOCATION/BACKGROUND: {{locationPrompt}}

REFERENCE IMAGES PROVIDED:
- Product image: {{hasProductImage}}
- Avatar/Model image: {{hasAvatarImage}}

Generate an optimized prompt for the first frame image.

${FIRST_FRAME_EXAMPLES}

${CAMERA_SELECTION_COT}

OUTPUT FORMAT (JSON):
{
  "prompt": "English prompt for Seedream 4.5 (50-80 words, max 100)",
  "locationDescription": "사용된 장소/배경 설명 (한국어)"
}

Remember:
- ${UGC_BACKGROUND_STYLE}
- End with: ${PHOTOREALISM_ESSENTIALS.quality}
- Include camera specs in the prompt

${FIRST_FRAME_VERIFICATION}

${JSON_RESPONSE_INSTRUCTION}`,
}

/** AI 아바타용 첫 프레임 프롬프트 템플릿 (참조 이미지 없이) */
export const AI_AVATAR_FIRST_FRAME_TEMPLATE: PromptTemplate = {
  id: 'ai-avatar-first-frame-v1',
  name: 'AI 아바타 첫 프레임 프롬프트',
  description: 'AI로 아바타를 생성하는 첫 프레임 프롬프트',
  category: 'video-ad',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-16',
  },
  variables: [
    'productInfo',
    'targetGender',
    'targetAge',
    'style',
    'ethnicity',
    'cameraComposition',
    'locationPrompt',
  ],
  template: `${FIRST_FRAME_SYSTEM_PROMPT}

SPECIAL TASK: Generate a first frame with an AI-created avatar (no reference person).

AVATAR SPECIFICATIONS:
- Gender: {{targetGender}}
- Age range: {{targetAge}}
- Style: {{style}}
- Ethnicity: {{ethnicity}}

PRODUCT INFO:
{{productInfo}}

CAMERA COMPOSITION: {{cameraComposition}}
LOCATION: {{locationPrompt}}

Create a prompt that:
1. Describes a photorealistic person matching the specifications
2. Shows them naturally presenting/holding the product
3. Uses UGC-style authentic setting
4. Includes all photorealism elements

${FIRST_FRAME_EXAMPLES}

OUTPUT FORMAT (JSON):
{
  "prompt": "English prompt for GPT-Image 1.5 (60-90 words)",
  "locationDescription": "사용된 장소/배경 설명 (한국어)",
  "avatarDescription": "생성될 아바타 설명 (한국어)"
}

${FIRST_FRAME_VERIFICATION}

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 장소/배경 프롬프트 생성
// ============================================================

/** 기본 장소 옵션 */
export const DEFAULT_LOCATION_OPTIONS = [
  { key: 'modern_home', prompt: 'bright modern living room with minimalist decor and large windows', korean: '밝은 현대식 거실' },
  { key: 'cozy_cafe', prompt: 'stylish cafe interior with warm ambient lighting and wooden accents', korean: '따뜻한 분위기의 카페' },
  { key: 'clean_bathroom', prompt: 'clean bright bathroom with white marble surfaces and natural light', korean: '깔끔한 화이트 욕실' },
  { key: 'outdoor_park', prompt: 'natural outdoor setting with greenery and soft daylight', korean: '푸른 야외 공원' },
  { key: 'office', prompt: 'modern minimalist office space with clean desk and natural light', korean: '모던한 사무실' },
  { key: 'bedroom', prompt: 'cozy bedroom with soft morning light streaming through sheer curtains', korean: '아늑한 침실' },
  { key: 'kitchen', prompt: 'bright modern kitchen with natural materials and warm lighting', korean: '밝은 주방' },
  { key: 'studio', prompt: 'clean seamless solid color backdrop with professional lighting effect, no visible equipment or light stands', korean: '전문 스튜디오' },
]

/** 제품 카테고리별 추천 장소 */
export const PRODUCT_CATEGORY_LOCATIONS: Record<string, string[]> = {
  skincare: ['clean_bathroom', 'bedroom', 'modern_home'],
  makeup: ['bedroom', 'clean_bathroom', 'studio'],
  food: ['kitchen', 'cozy_cafe', 'modern_home'],
  fashion: ['modern_home', 'outdoor_park', 'cozy_cafe'],
  tech: ['office', 'modern_home', 'cozy_cafe'],
  fitness: ['outdoor_park', 'modern_home', 'studio'],
  home: ['modern_home', 'bedroom', 'kitchen'],
}
