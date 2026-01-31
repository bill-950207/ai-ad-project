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
  // ⚠️ 단순 카메라 용어 (이미지에 카메라가 등장하는 원인)
  // 주의: "shot on 85mm lens"는 이미지 품질 스펙이므로 괜찮음
  // 문제가 되는 것은 "camera", "tripod" 등 장비를 직접 언급하는 것
  'camera',           // "camera" 단독 사용 시 카메라가 등장
  'tripod',           // 삼각대가 등장
  'photographer',     // 사진가가 등장
  'filming',          // 촬영 현장 분위기
  'behind the scenes',// 촬영 현장
  'DSLR',             // DSLR 카메라가 등장
  'mirrorless',       // 미러리스 카메라가 등장
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
  studio: 'professional controlled lighting with soft even illumination and subtle highlights, no visible equipment',
}

/** 장소별 배경 키워드 */
export const LOCATION_BACKGROUNDS: Record<string, string> = {
  studio: 'clean seamless solid color backdrop with professional lighting effect, no visible equipment or stands',
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
   형식: "[Action verb], [body position], [expression/emotion]"
   포함: 구체적 자세, 몸 위치, 자연스러운 표정

2. PRODUCT INTERACTION (10-15 words):
   형식: "[How model interacts with product], [product from reference image 2]"
   포함: 제품과의 인터랙션 방식, 제품 위치

3. ENVIRONMENT (10-15 words):
   형식: "[Specific location] with [lived-in details]"
   포함: 구체적 장소, 생활감 있는 디테일

4. LIGHTING - CRITICAL (10-15 words):
   형식: "[Temperature] light from [specific direction] creating [effect]"
   포함: 색온도 (warm/cool), 방향, 그림자 효과

5. CAMERA SPECS (10-15 words):
   형식: "shot on [lens]mm lens at f/[aperture]"
   포함: 렌즈 초점거리, 조리개 값

6. QUALITY TAGS (5-10 words):
   포함: natural skin texture, cinematic atmosphere, 8K RAW quality 등

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
   형식: "[Subject] [initial pose], [initial expression]"
   포함: 시작 자세, 초기 표정 상태

2. CAMERA (optional, 5-10 words):
   옵션: dolly in/out, push-in, tracking, static shot
   포함: 카메라 움직임 방향과 속도

3. PRIMARY MOVEMENT (15-20 words):
   형식: "[Timing adverb] [action verb] [object], [movement quality]"
   권장 부사: slowly, gently, gracefully, softly, unhurried

4. EXPRESSION TRANSITION (10 words):
   형식: "[Expression change] as [action context]"
   포함: 표정 변화 (curious, thoughtful, engaged - NOT forced smile)

5. MICRO-EXPRESSION (5-10 words):
   포함: natural blink, subtle eye movement, breathing rhythm

6. END STATE (10 words):
   형식: "[Final position], [settling expression/mood]"
   포함: 최종 자세, 마무리 분위기

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

/** 표정 가이드라인 - 공용 */
export const EXPRESSION_EXAMPLES = `
=== EXPRESSION GUIDELINES ===

원칙: 자연스럽고 편안한 표정, 진정성 있는 느낌
- 미소는 절제되고 자연스럽게 (입을 다문 미소, 눈가 주름)
- 시선은 맥락에 맞게 (카메라 응시, 제품 응시, 자연스러운 시선)
- 과장되거나 연출된 느낌 배제
- 권장 형용사: gentle, soft, subtle, relaxed, natural, candid

AVOID (반드시 피할 것):
✗ "big smile", "wide grin", "teeth showing", "beaming" (과장된 미소)
✗ "excited expression", "enthusiastic smile", "overly cheerful" (억지 흥분)
✗ "perfect smile", "dramatic reaction" (인위적 반응)
✗ 광고 모델처럼 뻣뻣하거나 과하게 밝은 표정
`.trim()

/** 조명 가이드라인 - 공용 */
export const LIGHTING_EXAMPLES = `
=== LIGHTING GUIDELINES ===

원칙: 조명 "효과/결과"만 묘사, 장비는 절대 언급 금지
- 빛의 방향 묘사: from left, from window, from above
- 빛의 질감 묘사: soft, diffused, warm, natural
- 그림자 효과 묘사: gentle shadows, even illumination
- 장면은 최종 결과물 (촬영 현장이 아님)

AVOID (반드시 피할 것):
✗ "ring light", "softbox", "LED panel" (장비명)
✗ "studio lighting rig", "reflector panel" (장비 구성)
✗ "lighting equipment", "photography setup" (장비 존재 암시)
✗ 장비가 보이거나 존재가 느껴지는 모든 표현

결과물 = 완성된 사진/영상, NOT 촬영 현장
`.trim()

/** 공용 Self-Verification 체크리스트 */
export const COMMON_SELF_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your output:
✓ No product names or brand names?
✓ No "big smile", "wide grin", "teeth showing"?
✓ No lighting EQUIPMENT words (softbox, ring light, LED, reflector)?
✓ No "studio" word? (use "plain solid color background" or specific location instead)
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

/** 손 묘사 가이드 */
export const HAND_DESCRIPTION_GUIDE = `
=== ANATOMICALLY CORRECT HANDS GUIDE ===

필수 규칙:
1. FIVE FINGERS ONLY - 손당 정확히 5개 손가락
2. NATURAL FINGER SPACING - 손가락 간격 자연스럽게
3. RELAXED GRIP - 편안하게 굽힌 손가락, 뻣뻣하거나 꽉 쥔 모양 X
4. VISIBLE KNUCKLES - 관절 부분 자연스러운 굽힘
5. PROPER THUMB POSITION - 엄지가 다른 손가락과 자연스럽게 마주보는 위치

필수 포함 요소:
- 손가락 개수 명시: "all five fingers visible"
- 그립 유형: curved, pinch, cradle, wrapped 등
- 엄지 위치: "thumb on [위치]" 또는 "thumb supporting from [방향]"
- 손바닥 방향: "palm facing [방향]"

AVOID (반드시 피할 것):
✗ "holding product" (너무 모호 - AI가 손을 왜곡할 수 있음)
✗ "gripping tightly" (부자연스러운 긴장감)
✗ "hand on product" (위치 관계 모호)
✗ 손가락 개수나 그립 유형 없이 모호한 표현
`.trim()

/** 제품 유형별 그립 가이드 */
export const PRODUCT_GRIP_GUIDE = `
=== PRODUCT-SPECIFIC GRIP GUIDE ===

제품 크기에 맞는 그립 유형 선택:

SMALL PRODUCTS (화장품, 스킨케어, 폰):
- 그립: pinch, cradle, C-shape hold
- 손가락: 엄지 + 검지/중지, 또는 손바닥에 올려놓기
- 위치: 제품 하단/중간 부분

MEDIUM PRODUCTS (박스, 용기, 기기):
- 그립: wrapped, two-hand hold, support + present
- 손가락: 전체 손가락으로 감싸기
- 위치: 제품 양옆 또는 아래에서 받치기

LARGE PRODUCTS (가방, 장비):
- 그립: handle grip, bottom support, carry position
- 손가락: 손잡이 부분 또는 아래에서 무게 지탱
- 위치: 허리 높이, 팔꿈치 살짝 굽힘

BOTTLES/TUBES:
- 그립: body wrap, neck hold, pump ready
- 손가락: 몸통 감싸기 또는 캡/펌프 부분
- 위치: 엄지가 앞면에 오도록
`.trim()

/** 손-제품 접촉면 묘사 */
export const HAND_PRODUCT_CONTACT_GUIDE = `
=== HAND-PRODUCT CONTACT REALISM ===

필수 명시 사항:
1. 어느 손가락이 제품에 닿는지 (which fingers)
2. 제품의 어느 부분에 닿는지 (where on product)
3. 압력 수준 (light touch / gentle grip / secure hold)

그림자 일관성:
- 손과 제품 접촉 부분에 자연스러운 그림자
- 손가락이 제품 표면에 작은 그림자 생성

AVOID (반드시 피할 것):
✗ 제품이 손 근처에서 떠있는 것처럼 보임
✗ 손가락이 제품과 합쳐지거나 통과하는 것처럼 보임
✗ 손바닥과 제품 사이에 부자연스러운 빈 공간
✗ 접촉점 없이 모호하게 "holding" 같은 표현
`.trim()

/** 조명 일관성 가이드 */
export const LIGHTING_CONSISTENCY_GUIDE = `
=== AVATAR-PRODUCT LIGHTING CONSISTENCY ===

핵심: 아바타와 제품이 동일한 조명 환경에 있어야 함

필수 규칙:
1. SAME LIGHT SOURCE - 아바타와 제품 모두 같은 방향에서 빛이 와야 함
2. MATCHING SHADOWS - 얼굴과 제품의 그림자 방향 일치
3. CONSISTENT HIGHLIGHTS - 피부와 제품 표면에 같은 쪽에서 하이라이트
4. COLOR TEMPERATURE - 피부와 제품에 같은 색온도 (warm/cool)

필수 명시 사항:
- 빛의 방향 (from left, from window, from above 등)
- 그림자가 떨어지는 방향 (shadows falling to [방향])
- 아바타와 제품 모두에 적용된다는 점 명시

AVOID (반드시 피할 것):
✗ 얼굴은 왼쪽에서 빛, 제품은 오른쪽에서 빛 (방향 불일치)
✗ 제품에는 날카로운 그림자, 얼굴에는 부드러운 그림자 (질감 불일치)
✗ 피부와 제품에 다른 색온도 (warm/cool 불일치)
`.trim()

/** 시선-표정 매트릭스 */
export const GAZE_EXPRESSION_MATRIX = `
=== GAZE + EXPRESSION COMBINATIONS ===

시선과 표정이 맥락상 일치해야 함:

LOOKING AT CAMERA (카메라 응시):
- 적합한 표정: 자신감 있는, 친근한, 호기심 어린
- 느낌: direct eye contact, confident, approachable, warm

LOOKING AT PRODUCT (제품 응시):
- 적합한 표정: 호기심, 관심, 감탄, 집중
- 느낌: focused, curious, examining, thoughtful

LOOKING AWAY / CANDID (자연스러운 시선):
- 적합한 표정: 편안한, 생각에 잠긴, 자연스러운 순간
- 느낌: relaxed, contemplative, genuine moment

AVOID (반드시 피할 것):
✗ 카메라 응시 + 제품 살펴보는 표정 (시선과 표정 충돌)
✗ 제품 응시 + 카메라와 눈 마주침 (물리적으로 불가능)
✗ 어떤 시선이든 + 과장된 미소 (부자연스러움)
✗ 시선 방향과 맞지 않는 표정
`.trim()

/** 손+제품 가이드라인 */
export const HAND_PRODUCT_EXAMPLES = `
=== HAND + PRODUCT GUIDELINES ===

필수 포함 요소 (반드시 명시할 것):
1. 손가락 개수/위치: "all five fingers visible", "thumb on [위치], fingers on [위치]"
2. 그립 유형: wrapped, pinch, cradle, palm support 등 제품 크기에 맞게
3. 접촉점: 어느 손가락이 제품 어디에 닿는지 구체적으로
4. 조명 일관성: 아바타와 제품에 같은 방향에서 빛이 와야 함
5. 제품 각도: 카메라 쪽으로 살짝 기울임 (15-30도)

구조 템플릿:
"[손 설명: 손가락 위치 + 그립 유형] + [제품 위치: 높이/각도] + [조명: 방향 + 일관성] + [표정: 시선과 맞는 자연스러운 표정]"

AVOID (반드시 피할 것):
✗ "Person holding product happily" (너무 모호, 손 디테일 없음)
✗ "Hand gripping bottle tightly" (긴장된 그립)
✗ "Model with product" (공간 관계 없음)
✗ "Showing product to camera with big smile" (과장된 표정)
✗ "Professional photo of person with item" (구체적 디테일 없음)
✗ 손가락 개수나 위치 없이 "holding" 같은 모호한 표현

SELF-CHECK:
□ 손가락 개수/위치 명시됨?
□ 그립 유형이 제품 크기에 적합?
□ 접촉점 구체적으로 명시됨?
□ 아바타와 제품 조명 방향 일치?
□ 표정이 시선 방향과 맞음?
`.trim()
