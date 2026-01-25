/**
 * 공통 프롬프트 컴포넌트
 *
 * 여러 기능에서 재사용되는 프롬프트 조각들
 */

// ============================================================
// 포토리얼리즘 프롬프트 컴포넌트
// ============================================================

/** Seedream 4.5용 포토리얼리즘 필수 요소 */
export const PHOTOREALISM_ESSENTIALS = {
  /** 피부 표현 */
  skin: 'smooth natural skin with healthy glow',

  /** 머리카락 표현 */
  hair: 'individual strands catching light naturally',

  /** 눈 표현 */
  eyes: 'realistic eye reflections with natural catchlights',

  /** 조명 표현 */
  lighting: (direction: string = 'from large window') =>
    `soft natural daylight streaming ${direction}`,

  /** 품질 태그 */
  quality: 'Hyperrealistic photograph, 8K RAW quality',

  /** 카메라 설정 */
  camera: (lens: string = '85mm', aperture: string = '1.8') =>
    `shot on ${lens} lens at f/${aperture}`,
}

/** Seedream 4.5에서 금지된 표현들 */
export const SEEDREAM_FORBIDDEN_TERMS = [
  'taking a selfie',
  'holding phone',
  'smartphone',
  'camera visible',
  'phone in hand',
  'selfie stick',
]

/** UGC 스타일 배경 (blur/bokeh 절대 금지 - 실제 스마트폰 사진처럼) */
export const UGC_BACKGROUND_STYLE =
  'CRITICALLY IMPORTANT: The entire background MUST be perfectly sharp and crystal clear with every detail visible. ABSOLUTELY NO blur, NO bokeh, NO soft focus, NO shallow depth of field, NO out-of-focus areas anywhere in the image. Use f/11-f/16 aperture for maximum sharpness. Every element from foreground to background must be in razor-sharp focus like a real smartphone photo.'

/** 전문적 스타일 배경 (제한적 사용 - 여전히 블러 최소화) */
export const PROFESSIONAL_BACKGROUND_STYLE =
  'background with visible environment details, minimal depth separation'

// ============================================================
// 네거티브 프롬프트
// ============================================================

/** 공통 네거티브 프롬프트 */
export const COMMON_NEGATIVE_PROMPT =
  'cartoon, anime, illustration, painting, drawing, sketch, low quality, blurry, distorted, deformed, ugly, bad anatomy, bad proportions, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, disfigured, watermark, signature, text overlay, bokeh, shallow depth of field, blurred background, soft focus, out of focus background, defocused background'

/** 아바타/인물용 네거티브 프롬프트 */
export const AVATAR_NEGATIVE_PROMPT =
  `${COMMON_NEGATIVE_PROMPT}, unnatural pose, stiff expression, plastic skin, mannequin, wax figure, dead eyes, blurry background, bokeh effect, soft background`

/** 제품용 네거티브 프롬프트 */
export const PRODUCT_NEGATIVE_PROMPT =
  `${COMMON_NEGATIVE_PROMPT}, wrong product, different product, modified logo, altered branding, fake label, blurry background, bokeh, out of focus`

// ============================================================
// 브랜드 보존 지시
// ============================================================

/** 로고/라벨 보존 지시 (Gemini 프롬프트용) */
export const BRAND_PRESERVATION_INSTRUCTION = `
CRITICAL LOGO & TEXT RULES:
1. PRESERVE: All existing logos, labels, brand marks, and text on the product MUST be preserved exactly as shown in the reference image.
2. DO NOT ADD: Never add any new logos, text, watermarks, brand names, or written elements that are not in the original product image.
3. DO NOT MODIFY: Do not alter, obscure, blur, or change the size/position of any existing product branding.
4. MAINTAIN: Keep the exact appearance of product packaging, labels, and all printed text.
`.trim()

// ============================================================
// 카메라 구도 설명
// ============================================================

/** 카메라 구도별 프롬프트 가이드 */
export const CAMERA_COMPOSITION_PROMPTS: Record<string, {
  angle: string
  description: string
  handPosition: string
}> = {
  'selfie-high': {
    angle: 'high angle from above, approximately 30 degrees down',
    description: 'looking up at camera with enlarged eyes effect',
    handPosition: 'holding product at chest level or one hand raised slightly',
  },
  'selfie-front': {
    angle: 'eye level, direct frontal view',
    description: 'straight-on perspective with natural proportions',
    handPosition: 'holding product forward toward camera or at chest level',
  },
  'selfie-side': {
    angle: '45-degree angle from the side',
    description: 'showing facial contours and profile, three-quarter view',
    handPosition: 'holding product visible from side angle',
  },
  'tripod': {
    angle: 'fixed camera position at chest to eye level',
    description: 'stable framing as if mounted on tripod, professional look',
    handPosition: 'both hands free, holding product naturally',
  },
  'closeup': {
    angle: 'close framing focusing on face and upper body',
    description: 'intimate view showing facial details and expressions',
    handPosition: 'product held close to face or at upper chest',
  },
  'fullbody': {
    angle: 'wide shot showing complete figure from head to feet',
    description: 'full body visible in frame with environment context',
    handPosition: 'holding product at waist level or in natural pose',
  },
}

// ============================================================
// 분위기/스타일 키워드
// ============================================================

/** 분위기별 조명 키워드 */
export const MOOD_LIGHTING: Record<string, string> = {
  warm: 'warm golden hour lighting with soft shadows',
  cool: 'cool blue-toned lighting with clean shadows',
  bright: 'bright even lighting with minimal shadows',
  dramatic: 'dramatic side lighting with strong contrast',
  natural: 'soft natural daylight with gentle shadows',
  studio: 'professional studio lighting with controlled highlights',
}

/** 장소별 배경 키워드 */
export const LOCATION_BACKGROUNDS: Record<string, string> = {
  studio: 'clean studio background with seamless backdrop',
  home: 'cozy modern living room interior',
  cafe: 'stylish cafe interior with ambient lighting',
  outdoor: 'natural outdoor setting with greenery',
  office: 'modern minimalist office space',
  bathroom: 'clean bright bathroom with natural light',
  bedroom: 'elegant bedroom with soft morning light',
  kitchen: 'modern kitchen with natural materials',
}

// ============================================================
// JSON 응답 포맷 지시
// ============================================================

/** JSON 응답 지시 (기본 - 영어) */
export const JSON_RESPONSE_INSTRUCTION =
  'Respond with valid JSON only. Do not include any additional explanations or markdown formatting.'

/** JSON 응답 지시 (한국어 - 레거시 호환용) */
export const JSON_RESPONSE_INSTRUCTION_KO =
  '반드시 유효한 JSON 형식으로만 응답하세요. 추가 설명이나 마크다운 없이 JSON만 반환하세요.'

// ============================================================
// 모델별 프롬프트 최적화 가이드라인
// ============================================================

/**
 * Seedream 4.5 이미지 생성 모델 최적화 가이드라인
 *
 * 공식 가이드 기반:
 * - 자연어 프롬프트 선호 (50-80 words 최적)
 * - 구체적이지만 간결한 설명
 * - 카메라 스펙 포함 (렌즈, 조리개)
 * - 조명 방향 명시
 * - 네거티브 프롬프트 활용
 */
export const SEEDREAM_OPTIMIZATION = {
  /** 권장 프롬프트 길이 */
  wordCount: { min: 50, max: 80, ideal: 65 },

  /** 필수 포함 요소 */
  requiredElements: [
    'subject description (who)',
    'pose/action (what)',
    'environment (where)',
    'lighting direction (how lit)',
    'camera specs (lens/aperture)',
  ],

  /** 권장 카메라 스펙 */
  cameraSpecs: {
    portrait: 'shot on 85mm lens at f/1.8',
    closeup: 'shot on 50mm lens at f/2.0',
    environmental: 'shot on 35mm lens at f/2.8',
    fullbody: 'shot on 24mm lens at f/4.0',
  },

  /** 조명 방향 표현 */
  lightingDirections: [
    'warm golden light from upper left',
    'soft window light from right side',
    'backlight from behind creating rim light',
    'soft diffused overhead light',
  ],

  /** 얼굴 일관성 유지 표현 */
  faceConsistency:
    'The same person from the reference image, maintaining exact facial features, skin tone, and hair',

  /** 품질 종결 태그 */
  qualityTags: 'shot on film, natural color grading, photorealistic',

  /** Anti-AI 텍스처 표현 */
  antiAI: {
    skin: 'natural skin texture with visible pores and subtle imperfections',
    hair: 'natural hair with individual strands and flyaways',
    environment: 'lived-in environment with authentic details',
  },
}

/**
 * Vidu Q2 영상 생성 모델 최적화 가이드라인
 *
 * 공식 가이드 기반:
 * - 카메라 무브먼트 용어 활용
 * - movement_amplitude API 파라미터 사용 (프롬프트에 움직임 강도 X)
 * - 마이크로 표정 타이밍 힌트
 * - 간결하고 명확한 문장 구조
 * - 50-70 words 권장
 */
export const VIDU_OPTIMIZATION = {
  /** 권장 프롬프트 길이 */
  wordCount: { min: 50, max: 70, ideal: 60 },

  /** 카메라 무브먼트 용어 (영어) */
  cameraMovements: {
    dollyIn: 'camera slowly dollies in',
    dollyOut: 'camera gently dollies out',
    trackingShot: 'camera smoothly tracks subject',
    slowZoom: 'slow zoom into face',
    staticShot: 'static camera, subject moves naturally',
    orbitLeft: 'camera orbits slowly to the left',
    orbitRight: 'camera orbits slowly to the right',
    rackFocus: 'focus racks from background to subject',
    tiltUp: 'camera tilts up slowly',
    tiltDown: 'camera tilts down gently',
  },

  /** 마이크로 표정 타이밍 힌트 */
  microExpressions: {
    blink: 'natural blink around 2 seconds',
    smile: 'subtle smile slowly forming',
    eyeMovement: 'eyes drift naturally before settling',
    breathe: 'chest rises gently with natural breath',
  },

  /** 움직임 속도 표현 (movement_amplitude와 함께 사용) */
  movementPace: {
    slow: 'slowly, gracefully, gently, softly',
    medium: 'smoothly, naturally, steadily',
    fast: 'quickly, dynamically, energetically',
  },

  /** 프롬프트 구조 템플릿 */
  structureTemplate:
    '[Starting state] → [Movement with timing adverb] → [Expression change] → [Product interaction] → [End state]',

  /** 금지 표현 (API 파라미터로 제어해야 하는 것들) */
  avoidInPrompt: [
    'fast movement', // use movement_amplitude instead
    'slow motion', // use movement_amplitude instead
    'high speed', // use movement_amplitude instead
    'quick action', // use movement_amplitude instead
  ],

  /** 시네마틱 움직임 표현 */
  cinematicMotion: {
    contemplative: 'unhurried, deliberate movements with natural pauses',
    emotional: 'subtle internal emotion visible through micro-expressions',
    natural: 'realistic human rhythm, natural breathing pace',
  },
}

/**
 * 모델별 프롬프트 구조 템플릿
 */
export const MODEL_PROMPT_STRUCTURES = {
  /** Seedream 4.5 이미지 프롬프트 구조 */
  seedream: `[Subject] [Pose/Expression] [Clothing], [Environment], [Lighting direction], [Camera specs], [Quality tags]`,

  /** Vidu Q2 모션 프롬프트 구조 */
  vidu: `[Initial state]. [Camera movement if any]. [Subject movement with timing]. [Expression transition]. [Product interaction]. [Final state]. [Atmospheric detail].`,
}

/**
 * firstFramePrompt 생성 가이드 (Seedream 4.5용)
 *
 * ⚠️ 중요: 아바타 참조 이미지가 제공되므로 인물 외모 묘사 금지
 */
export const SEEDREAM_FIRST_FRAME_GUIDE = `
SEEDREAM 4.5 OPTIMIZED PROMPT STRUCTURE (60-80 words):

⚠️ CRITICAL: An avatar reference image will be provided.
DO NOT describe person's physical appearance (age, ethnicity, facial features, hair color/style, body type).
ONLY describe pose, action, expression, clothing, and environment.

1. POSE & ACTION (10-15 words):
   "[Action verb], [body position], [expression/emotion]"
   Example: "leaning against window frame, gazing outside thoughtfully, serene expression"

2. PRODUCT INTERACTION (10-15 words):
   "[How model interacts with product], [product from reference image 2]"
   Example: "holding the product from reference image 2 at chest level, examining it closely"

3. ENVIRONMENT (10-15 words):
   "[Specific location] with [lived-in details]"
   Example: "in a cozy cafe with warm wooden interior and morning sunlight"

4. LIGHTING - CRITICAL (10-15 words):
   "[Temperature] light from [specific direction] creating [effect]"
   Example: "warm golden light from large window on left, creating soft shadows"

5. CAMERA SPECS (10-15 words):
   "shot on [lens]mm lens at f/[aperture]"
   Example: "shot on 35mm lens at f/2.8, cinematic composition"

6. QUALITY TAGS (5-10 words):
   "natural skin texture with visible pores, cinematic atmosphere, 8K RAW quality"

❌ FORBIDDEN (will cause different person):
- Age descriptions ("in her 20s", "young", "middle-aged")
- Ethnicity/race ("Asian", "Caucasian", "Korean")
- Facial features ("sharp jawline", "big eyes", "oval face")
- Hair descriptions ("short black hair", "long wavy hair")
- Body type ("slim", "athletic", "petite")
`.trim()

/**
 * motionPromptEN 생성 가이드 (Vidu Q2용)
 */
export const VIDU_MOTION_GUIDE = `
VIDU Q2 OPTIMIZED MOTION PROMPT (50-70 words):

STRUCTURE:
1. STARTING STATE (10 words):
   "She sits peacefully, [initial pose and expression]"

2. CAMERA (optional, 5-10 words):
   "Camera slowly dollies in" or "Static shot"

3. PRIMARY MOVEMENT (15-20 words):
   Use timing adverbs: slowly, gently, gracefully, softly
   "Gently raises the product toward her face, movement unhurried and deliberate"

4. EXPRESSION TRANSITION (10 words):
   "A subtle smile forms as she examines the product"

5. MICRO-EXPRESSION (5-10 words):
   "Natural blink, eyes softening with contentment"

6. END STATE (10 words):
   "She brings it closer, settling into quiet satisfaction"

IMPORTANT:
- Do NOT describe motion intensity (use API's movement_amplitude)
- Use human rhythm descriptions ("natural breath", "unhurried")
- Include micro-expressions for realism
`.trim()
