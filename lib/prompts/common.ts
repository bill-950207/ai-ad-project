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
CRITICAL: Preserve all existing logos, labels, and brand marks on the product exactly as shown in the reference image.
Do not add any new text, watermarks, or overlays that are not present in the original reference image.
Maintain the exact appearance of product packaging and branding.
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
