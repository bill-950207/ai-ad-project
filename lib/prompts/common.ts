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
  quality: 'professional commercial photography, brand campaign quality, high-end advertisement, Hyperrealistic photograph, 8K RAW quality',

  /** 카메라 설정 */
  camera: (lens: string = '85mm', aperture: string = '1.8') =>
    `shot on ${lens} lens at f/${aperture}`,
}

/** 광고 스타일 강화 프롬프트 */
export const COMMERCIAL_AD_STYLE =
  'professional commercial advertisement, brand campaign quality, magazine-worthy composition, premium aesthetic, editorial photography style, high-end product photography'

/** Seedream 4.5에서 금지된 표현들 */
export const SEEDREAM_FORBIDDEN_TERMS = [
  'taking a selfie',
  'holding phone',
  'smartphone',
  'camera visible',
  'phone in hand',
  'selfie stick',
  // 조명 장비 관련 - 조명 "효과"만 설명하고 장비는 보이면 안됨
  'lighting equipment',
  'light stand',
  'softbox',
  'studio light',
  'ring light visible',
  'lamp in frame',
  'light fixture',
  'visible lighting',
  // 카메라 장비 관련 - 카메라 "스펙"만 설명하고 장비는 보이면 안됨
  'camera in frame',
  'camera equipment',
  'tripod visible',
  'camera lens visible',
  'filming equipment',
  'recording setup',
]

/** 조명/카메라 장비 방지 네거티브 프롬프트 */
export const EQUIPMENT_NEGATIVE_PROMPT =
  'visible lighting equipment, light stand, softbox, studio light, ring light, lamp, light fixture, lighting rig, visible camera, camera in frame, tripod, camera lens, filming equipment, photography equipment, studio equipment, behind the scenes, production setup, studio lighting setup, professional lighting equipment, photography light, LED panel, LED light, spotlight visible, light reflector, lighting umbrella, flash unit, strobe light, continuous light, light modifier, barn doors, light diffuser, lighting grid, c-stand, light boom, light tent, photography backdrop stand, reflector panel, scrim, gobo, snoot, beauty dish visible, octabox, parabolic reflector'

/** 조명/카메라 표현 가이드 (프롬프트 생성 시 참조) */
export const LIGHTING_CAMERA_INSTRUCTION = `
CRITICAL: LIGHTING AND CAMERA TERMS DESCRIBE EFFECTS, NOT VISIBLE EQUIPMENT

When describing lighting:
- CORRECT: "soft natural light from the left" (describes the light effect/direction)
- WRONG: "softbox on the left" (describes visible equipment)
- CORRECT: "warm golden hour lighting" (describes light quality)
- WRONG: "studio light setup" (implies visible equipment)

When describing camera:
- CORRECT: "shot on 85mm lens at f/1.8" (technical specs that affect image quality)
- WRONG: "camera on tripod" (describes visible equipment)
- CORRECT: "eye-level perspective" (describes angle/composition)
- WRONG: "filming setup visible" (implies equipment in frame)

The scene should look like a CANDID PHOTOGRAPH, not a behind-the-scenes photo.
NO lighting equipment, cameras, tripods, or any production equipment should be visible in the generated image.
`.trim()

/** UGC 스타일 배경 (인위적 블러 금지 - 자연스러운 스마트폰 사진처럼) */
export const UGC_BACKGROUND_STYLE =
  'IMPORTANT: Background should be clearly visible and mostly in focus like a real smartphone photo. Use f/11 aperture. NO heavy bokeh, NO artificial blur, NO shallow depth of field effect. Only minimal natural perspective depth is acceptable - background should be sharp enough to see all details clearly. The image should NOT look like professional DSLR photography with wide aperture blur.'

/** 전문적 스타일 배경 (제한적 사용 - 여전히 블러 최소화) */
export const PROFESSIONAL_BACKGROUND_STYLE =
  'background with visible environment details, minimal depth separation'

// ============================================================
// 네거티브 프롬프트
// ============================================================

/** 공통 네거티브 프롬프트 */
export const COMMON_NEGATIVE_PROMPT =
  'cartoon, anime, illustration, painting, drawing, sketch, low quality, blurry, distorted, deformed, ugly, bad anatomy, bad proportions, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, disfigured, watermark, signature, text overlay, bokeh, shallow depth of field, blurred background, soft focus, out of focus background, defocused background, logo overlay, brand banner, text banner, header banner, footer banner, barcode, QR code, price tag, product label, info graphic, UI elements, graphic overlay, decorative text, promotional text, advertising overlay, frame overlay, border overlay, corner logo, bottom text, top text'

/** 아바타/인물용 네거티브 프롬프트 */
export const AVATAR_NEGATIVE_PROMPT =
  `${COMMON_NEGATIVE_PROMPT}, unnatural pose, stiff expression, plastic skin, mannequin, wax figure, dead eyes, blurry background, bokeh effect, soft background, forced smile, fake smile, exaggerated smile, toothy grin, unnatural smile, AI smile, stock photo smile, overly cheerful, excessive grinning, ${EQUIPMENT_NEGATIVE_PROMPT}`

/** 제품용 네거티브 프롬프트 */
export const PRODUCT_NEGATIVE_PROMPT =
  `${COMMON_NEGATIVE_PROMPT}, wrong product, different product, modified logo, altered branding, fake label, blurry background, bokeh, out of focus, fake brand name, invented logo, added text, fictional branding, generic brand text, placeholder text, brand name on product, logo on product, text on product, sticker on product, label on product, writing on product, letters on product, product branding, product logo, product label, product text, barcode on product, QR code on product, serial number on product, product code, nutrition label, ingredient list, warning label, price tag on product, batch number, expiry date text, surface modification, added graphics, printed pattern`

/** 로고 없는 제품용 프롬프트 강제 추가 문구 */
export const NO_LOGO_PROMPT_SUFFIX =
  'CRITICAL PRODUCT SURFACE RULE: DO NOT ADD anything to the product surface. The product has NO logos, NO text, NO barcodes, NO QR codes, NO labels in the reference - it MUST remain exactly this clean. DO NOT invent or hallucinate any branding. DO NOT add any marks or elements not in the original. The product surface must be preserved EXACTLY as shown in the reference image.'

/** 오버레이 요소 방지 프롬프트 */
export const NO_OVERLAY_ELEMENTS =
  'CRITICAL: Generate a CLEAN photograph only. ABSOLUTELY NO graphic overlays, NO logo banners, NO text banners, NO headers, NO footers, NO barcodes, NO QR codes, NO price tags, NO product labels, NO promotional text, NO watermarks, NO UI elements, NO frames, NO borders, NO corner logos anywhere in the image. The image must be a pure photograph without any added graphic elements or text overlays.'

/** 오버레이 방지 네거티브 프롬프트 */
export const OVERLAY_NEGATIVE_PROMPT =
  'logo overlay, brand banner, text banner, header, footer, barcode, QR code, price tag, product label, info graphic, UI elements, graphic overlay, decorative text, promotional text, advertising overlay, frame, border, corner logo, watermark overlay, stamp, badge, sticker overlay, floating text, caption, subtitle, title card'

// ============================================================
// 브랜드 보존 지시
// ============================================================

/** 제품 표면 무결성 지시 (Gemini 프롬프트용) */
export const BRAND_PRESERVATION_INSTRUCTION = `
CRITICAL: PRODUCT SURFACE INTEGRITY - DO NOT MODIFY

=== STEP 1: ANALYZE THE PRODUCT REFERENCE ===
Examine the product image and determine:
- Does the product have ANY visible text, logos, labels, or barcodes? (YES/NO)

=== STEP 2: STRICT RULES ===

IF PRODUCT HAS MARKINGS (productHasLogo = true):
- Reproduce ONLY what exists in reference - DO NOT add anything new
- Include: "reproduce existing markings only, DO NOT add any new text or logos"

IF PRODUCT IS CLEAN (productHasLogo = false):
- The product has ZERO branding - keep it that way
- Include: "CRITICAL: Product is CLEAN with ZERO branding. DO NOT ADD any logos, text, labels, barcodes, or markings of ANY kind. Surface must remain 100% identical to reference."

=== ABSOLUTE PROHIBITIONS ===
- NEVER add barcodes, QR codes, serial numbers to the product
- NEVER add fake brand names or placeholder text
- NEVER add any surface element not present in the reference image
- NEVER invent or hallucinate product markings
`.trim()

/** 로고 없는 제품용 강화 지시 */
export const NO_LOGO_PRODUCT_INSTRUCTION = `
IMPORTANT: This product has NO visible logos, text, or branding in the reference image.
The generated image MUST keep the product surface completely clean:
- No brand names
- No logos
- No text of any kind
- No labels
- No watermarks
The product should appear exactly as clean and unbranded as in the reference.
`.trim()

/** holding 광고 유형용 제품 표면 보존 강화 지시 */
export const HOLDING_PRODUCT_SURFACE_INSTRUCTION = `
HOLDING SHOT - PRODUCT SURFACE PRESERVATION:
The product being held must be VISUALLY IDENTICAL to the reference:
- DO NOT add any text, logos, labels, barcodes that were not in the reference
- The product should look like the EXACT same item from the reference
- Focus on natural hand grip while maintaining 100% surface fidelity
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
    expressionShift: 'subtle natural expression shift, authentic micro-movements',
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
   "Expression shifts naturally as she examines the product" (can be curious, thoughtful, engaged - NOT forced smile)

5. MICRO-EXPRESSION (5-10 words):
   "Natural blink, eyes showing genuine interest"

6. END STATE (10 words):
   "She brings it closer, settling into natural contemplation"

IMPORTANT:
- Do NOT describe motion intensity (use API's movement_amplitude)
- Use human rhythm descriptions ("natural breath", "unhurried")
- Include micro-expressions for realism
`.trim()

// ============================================================
// 체형 보존 지시
// ============================================================

/** 체형 관련 네거티브 프롬프트 */
export const BODY_NEGATIVE_PROMPT =
  'exaggerated proportions, enhanced curves, unrealistic body, oversized bust, inflated chest, cartoonish proportions, anime proportions, idealized body, enhanced figure, augmented features, unrealistic waist-to-hip ratio'

// ============================================================
// Few-Shot 예시 (공용)
// ============================================================

/** 표정 예시 (Few-Shot) - 공용 */
export const EXPRESSION_EXAMPLES = `
EXPRESSION EXAMPLES (use these patterns):

GOOD (natural, relatable):
✓ "gentle closed-lip smile with relaxed eye contact"
✓ "soft confident gaze, natural resting expression"
✓ "looking at product with genuine curiosity"
✓ "candid moment, caught mid-thought"

BAD (exaggerated, artificial):
✗ "big smile", "wide grin", "teeth showing", "beaming"
✗ "excited expression", "enthusiastic smile", "overly cheerful"
✗ "perfect smile", "dramatic reaction"

Use words: gentle, soft, subtle, relaxed, natural, candid
`.trim()

/** 조명 예시 (Few-Shot) - 공용 */
export const LIGHTING_EXAMPLES = `
LIGHTING EXAMPLES (describe EFFECT, not equipment):

GOOD:
✓ "soft natural daylight from left window"
✓ "warm golden hour glow creating gentle shadows"
✓ "diffused ambient light, even illumination"
✓ "backlight from behind creating rim light"

BAD (equipment visible):
✗ "ring light illuminating face"
✗ "softbox on the left", "LED panel"
✗ "studio lighting rig", "reflector panel"
✗ "lighting equipment", "photography setup"

Scene = FINAL PHOTOGRAPH, not behind-the-scenes.
`.trim()

/** 공용 Self-Verification 체크리스트 */
export const COMMON_SELF_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your output:
✓ No product names or brand names?
✓ No "big smile", "wide grin", "teeth showing"?
✓ No lighting EQUIPMENT words (softbox, ring light, LED, reflector)?
✓ Has camera specs (lens, f/stop)?
If any check fails, revise before responding.
`.trim()

/** 제품명 금지 규칙 */
export const NO_PRODUCT_NAME_RULE = `
CRITICAL - PRODUCT NAME PROHIBITION:
- NEVER include product names, brand names, or model names
- Product names may contain misleading words (e.g., "Mushroom" in a shoe name would generate actual mushrooms)
- Use only: "the product", "the item", "the product from Figure 1"
- Focus on visual characteristics, not product identifiers
`.trim()

// ============================================================
// 손+제품 자연스러움 가이드 (Few-Shot)
// ============================================================

/** 손 묘사 가이드 (Few-Shot) */
export const HAND_DESCRIPTION_GUIDE = `
=== ANATOMICALLY CORRECT HANDS GUIDE ===

CRITICAL RULES FOR NATURAL HANDS:
1. FIVE FINGERS ONLY - exactly 5 fingers per hand, no extra or missing
2. NATURAL FINGER SPACING - fingers slightly apart, not merged or spread too wide
3. RELAXED GRIP - fingers gently curved, not stiff or clenched
4. VISIBLE KNUCKLES - natural bends at joints
5. PROPER THUMB POSITION - thumb opposing fingers naturally

GOOD HAND DESCRIPTIONS:
✓ "relaxed hand with fingers gently curved around product, thumb naturally supporting from opposite side"
✓ "natural grip with all five fingers visible, palm facing slightly toward camera"
✓ "casual hold with index finger and thumb pinching product edge, other fingers relaxed"
✓ "both hands cradling product with fingers interlaced naturally underneath"

BAD HAND DESCRIPTIONS:
✗ "holding product" (too vague - AI may generate distorted hands)
✗ "gripping tightly" (causes unnatural tension)
✗ "hand on product" (ambiguous positioning)
✗ Any description missing finger count or grip type
`.trim()

/** 제품 유형별 그립 가이드 */
export const PRODUCT_GRIP_GUIDE = `
=== PRODUCT-SPECIFIC GRIP GUIDE ===

SMALL PRODUCTS (cosmetics, skincare bottles, phones):
- "delicate pinch grip between thumb and first two fingers"
- "cradled in palm with fingers gently curved over top"
- "held at base with thumb and fingers forming C-shape"

MEDIUM PRODUCTS (boxes, jars, devices):
- "wrapped grip with all fingers around product body"
- "supported from bottom with one hand, other hand presenting top"
- "natural two-hand hold at product sides"

LARGE PRODUCTS (bags, equipment):
- "handle grip with relaxed wrist angle"
- "supporting weight from bottom with arm slightly bent"
- "casual carry position at hip level"

BOTTLES/TUBES:
- "wrapped around body with thumb on front label area"
- "held at neck/cap area with fingertips"
- "pump bottle: one hand on body, finger on pump"
`.trim()

/** 손-제품 접촉면 묘사 */
export const HAND_PRODUCT_CONTACT_GUIDE = `
=== HAND-PRODUCT CONTACT REALISM ===

CONTACT POINTS - Always specify:
1. Which fingers touch the product
2. Where on the product they touch
3. Pressure level (light touch, gentle grip, secure hold)

GOOD CONTACT DESCRIPTIONS:
✓ "fingertips resting lightly on product surface, thumb supporting from behind"
✓ "palm pressed gently against product back, fingers wrapped around sides"
✓ "product nestled in curved palm, fingers naturally draped over edge"

SHADOW CONSISTENCY:
✓ "consistent shadow under hand where it contacts product"
✓ "fingers casting small natural shadows on product surface"

AVOID:
✗ Product appearing to float near hand
✗ Fingers merging into or through product
✗ Unnatural gap between palm and product
`.trim()

/** 조명 일관성 가이드 */
export const LIGHTING_CONSISTENCY_GUIDE = `
=== AVATAR-PRODUCT LIGHTING CONSISTENCY ===

CRITICAL: Avatar and product must appear in SAME lighting environment.

UNIFIED LIGHTING RULES:
1. SAME LIGHT SOURCE - both avatar and product lit from same direction
2. MATCHING SHADOWS - shadow direction identical for face and product
3. CONSISTENT HIGHLIGHTS - specular highlights on same side for skin and product surface
4. COLOR TEMPERATURE - same warm/cool tone on skin and product

GOOD:
✓ "soft window light from left illuminating both face and product with matching shadows falling to right"
✓ "warm overhead light creating consistent highlights on forehead, nose, and product surface"

BAD:
✗ Face lit from left, but product appears lit from right
✗ Sharp shadows on product but diffused shadows on face
✗ Different color temperatures on skin vs product
`.trim()

/** 시선-표정 매트릭스 */
export const GAZE_EXPRESSION_MATRIX = `
=== GAZE + EXPRESSION COMBINATIONS ===

LOOKING AT CAMERA:
- "direct eye contact with gentle closed-lip smile, confident and approachable"
- "eyes meeting camera with soft curious expression, slightly raised eyebrow"
- "warm friendly gaze into camera, relaxed natural expression"

LOOKING AT PRODUCT:
- "eyes focused on product with genuine curiosity, slight head tilt"
- "examining product closely with thoughtful engaged expression"
- "admiring product with soft appreciative look, subtle smile forming"

LOOKING AWAY (CANDID):
- "gazing to side with relaxed contemplative expression"
- "looking past camera with natural unfocused gaze, genuine moment"
- "eyes directed downward at product in hand, absorbed in inspection"

AVOID COMBINATIONS:
✗ Looking at camera + examining product expression (conflicting focus)
✗ Looking at product + direct eye contact (impossible)
✗ Any gaze + exaggerated smile (unnatural)
`.trim()

/** 손+제품 Few-Shot 종합 예시 */
export const HAND_PRODUCT_EXAMPLES = `
=== HAND + PRODUCT NATURAL EXAMPLES (Few-Shot) ===

GOOD EXAMPLES (photorealistic, natural):
✓ "Woman holding skincare bottle with relaxed right hand, all five fingers visible - thumb on front, four fingers wrapped around back, product at chest level, eyes looking at camera with gentle smile, soft window light from left illuminating both face and product consistently"

✓ "Man presenting smartphone in open palm, fingers slightly curved supporting device from below, thumb resting naturally on side edge, product angled 15 degrees toward camera, matching warm ambient light on both skin and device surface"

✓ "Close-up of hands cradling cosmetic jar, thumbs on lid, fingers interlaced underneath supporting base, natural skin texture with visible pores, consistent soft overhead lighting creating matching shadows under chin and under jar"

BAD EXAMPLES (avoid these patterns):
✗ "Person holding product happily" (too vague, no hand details, no lighting)
✗ "Hand gripping bottle tightly" (tense, unnatural)
✗ "Model with product" (no grip description, no spatial relationship)
✗ "Showing product to camera with big smile" (exaggerated expression)
✗ "Professional photo of person with item" (no specific details)

SELF-CHECK BEFORE OUTPUT:
□ Hand description includes finger count/position?
□ Grip type matches product size/shape?
□ Contact points specified?
□ Lighting direction consistent for avatar and product?
□ Expression natural and matching gaze direction?
`.trim()
