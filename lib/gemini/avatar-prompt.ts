/**
 * AI 아바타 프롬프트 생성 (GPT-Image용)
 */

import { GenerateContentConfig, MediaResolution, ThinkingLevel } from '@google/genai'
import { getGenAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import type {
  AiAvatarPromptInput,
  AiAvatarPromptResult,
  CameraCompositionType,
  ModelPoseType,
  OutfitPresetType,
} from './types'
import {
  NO_OVERLAY_ELEMENTS,
  HAND_DESCRIPTION_GUIDE,
  PRODUCT_GRIP_GUIDE,
  HAND_PRODUCT_CONTACT_GUIDE,
  LIGHTING_CONSISTENCY_GUIDE,
  GAZE_EXPRESSION_MATRIX,
  HAND_PRODUCT_EXAMPLES,
  SHARP_BACKGROUND_GUIDE,
} from '@/lib/prompts/common'
import { VIDEO_TYPE_SCRIPT_STYLES } from '@/lib/prompts/scripts'
import { VIDEO_TYPE_FIRST_FRAME_GUIDES } from '@/lib/prompts/first-frame'

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 아바타 외모 묘사 가이드라인 */
const AVATAR_APPEARANCE_EXAMPLES = `
AVATAR DESCRIPTION GUIDELINES:

PROMPT STRUCTURE (follow this pattern):
"[Ethnicity] [gender] in [age range] with [skin description], [hair description]"

REQUIRED ELEMENTS:
- Ethnicity: Use the ethnicity specified in input
- Age range: Match the target age group
- Skin: "natural skin texture", "healthy skin tone", "soft natural makeup"
- Hair: Describe length and style naturally

AVOID:
✗ Generic phrases: "beautiful", "perfect skin", "flawless"
✗ Stereotypical descriptions
✗ Vague terms: "model-like", "attractive"

The avatar should feel authentic and relatable, not idealized.
`.trim()

/** 표정 예시 (Few-Shot) */
const AVATAR_EXPRESSION_EXAMPLES = `
EXPRESSION EXAMPLES:

GOOD (natural, neutral - NO forced smile):
✓ "calm natural expression with relaxed eye contact"
✓ "soft confident gaze, neutral resting expression"
✓ "approachable look with subtle warmth"
✓ "relaxed candid expression"

BAD (exaggerated, artificial, forced):
✗ "big smile", "wide grin", "teeth showing"
✗ "excited expression", "overly enthusiastic"
✗ "perfect smile", "beaming at camera"
✗ "friendly smile", "warm smile" (too forced)
`.trim()

/** 조명 예시 (Few-Shot) */
const AVATAR_LIGHTING_EXAMPLES = `
LIGHTING EXAMPLES:

GOOD (describe effect):
✓ "soft natural daylight from window"
✓ "warm golden hour glow with gentle shadows"
✓ "even ambient light, natural skin tones"

BAD (equipment visible):
✗ "ring light", "softbox", "studio lighting"
✗ "LED panel", "reflector", "lighting rig"
`.trim()

/** Self-Verification 체크리스트 */
const AVATAR_SELF_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your prompt:
✓ No product names or brand names?
✓ No "big smile", "wide grin", "teeth showing"?
✓ No lighting EQUIPMENT words (ring light, softbox, LED)?
✓ No "studio" word? (use "plain solid color background" or specific location instead)
✓ Body type matches input specification?
✓ Has camera specs (lens, f/stop)?
✓ 50-100 words?
✓ BACKGROUND SHARPNESS CHECK (CRITICAL):
  - Aperture f/11 or higher specified? (NOT f/1.4, f/1.8, f/2.8)
  - "sharp background" or "deep depth of field" included?
  - "NO bokeh" or "NO blur" mentioned?
✓ HAND CHECK (if product present):
  - Product visibility prioritized?
  - Natural grip description (avoid finger details)?
  - Consistent lighting between avatar and product?
If any check fails, revise before responding.
`.trim()

// 카메라 구도별 설정 (영상 스타일별로 확장)
const cameraCompositionDescriptions: Record<CameraCompositionType, { description: string; aperture: string; lens: string }> = {
  // 공통
  closeup: { description: 'close-up portrait, face and upper body prominent', aperture: 'f/11', lens: '50mm' },
  'medium-shot': { description: 'medium shot showing upper body from waist up, balanced composition', aperture: 'f/11', lens: '50mm' },
  fullbody: { description: 'full body shot, entire person visible in frame', aperture: 'f/16', lens: '35mm' },
  // UGC용 (셀카 스타일)
  'selfie-high': { description: 'high angle selfie perspective, camera looking down from above eye level', aperture: 'f/11', lens: '28mm' },
  'selfie-front': { description: 'eye-level frontal view, direct eye contact with camera', aperture: 'f/11', lens: '35mm' },
  'selfie-side': { description: 'three-quarter angle, showing facial contours, slight side view', aperture: 'f/11', lens: '35mm' },
  'ugc-closeup': { description: 'UGC-style intimate medium close-up, chest-up framing, eyes looking DIRECTLY into camera lens', aperture: 'f/11', lens: '35mm' },
  'ugc-selfie': { description: 'POV selfie shot, subject looking at camera, NO phone visible, natural relaxed pose', aperture: 'f/11', lens: '28mm' },
  // Podcast용
  webcam: { description: 'webcam-style frontal view, desktop setup distance, conversational framing', aperture: 'f/11', lens: '35mm' },
  front: { description: 'frontal camera view, direct eye contact, professional podcast framing', aperture: 'f/11', lens: '35mm' },
  side: { description: 'side angle camera view, profile or three-quarter view, interview style podcast framing', aperture: 'f/11', lens: '35mm' },
  'three-quarter': { description: 'three-quarter angle view, slight turn adding depth and visual interest', aperture: 'f/11', lens: '35mm' },
  // Expert용 (레거시 호환)
  tripod: { description: 'stable tripod shot, medium distance, waist to head visible, professional framing', aperture: 'f/16', lens: '50mm' },
  presenter: { description: 'professional presenter framing, confident stance, authoritative composition', aperture: 'f/16', lens: '50mm' },
}

// 모델 포즈 설명 (영상 스타일별로 확장 - 자연스러운 표현)
const modelPoseDescriptions: Record<ModelPoseType, string> = {
  // 공통
  'talking-only': '⚠️ NO PRODUCT! Avatar only, natural conversational pose with empty hands relaxed at sides or gesturing naturally',
  'showing-product': 'Model presenting product toward camera, demonstrative pose, product prominently featured',
  // UGC용
  'holding-product': 'Model naturally holding product at chest level, relaxed authentic pose, product clearly visible',
  'using-product': 'Model demonstrating product use, natural interaction',
  reaction: 'Model showing genuine reaction, product held casually, expressive authentic enthusiasm',
  // Podcast용
  'desk-presenter': 'Model seated at desk, product on desk or held casually, conversational demeanor',
  'casual-chat': 'Model in relaxed pose, product held casually if present, friendly approachable vibe',
  // Expert용
  demonstrating: 'Model displaying product features, product-focused composition, educational presentation',
  presenting: 'Model in presenter stance, product held for optimal viewing, professional display',
  explaining: 'Model in explanation pose, product presented clearly, knowledgeable expression',
}

// 의상 프리셋 설명
const outfitPresetDescriptions: Record<OutfitPresetType, string> = {
  casual_everyday: '캐주얼 일상 의상 - 티셔츠와 청바지',
  formal_elegant: '포멀/우아한 의상 - 세련된 드레스나 정장',
  professional_business: '비즈니스 의상 - 전문적인 정장',
  sporty_athletic: '스포티 의상 - 운동복 스타일',
  cozy_comfortable: '편안한 의상 - 니트 스웨터',
  trendy_fashion: '트렌디 패션 의상 - 최신 유행',
  minimal_simple: '미니멀 심플 의상 - 깔끔한 단색',
}

// 언어별 출력 지시문
const outputLanguageInstructions: Record<string, string> = {
  ko: 'Write all user-facing text responses (avatarDescription, locationDescription) in Korean (한국어).',
  en: 'Write all user-facing text responses (avatarDescription, locationDescription) in English.',
  ja: 'Write all user-facing text responses (avatarDescription, locationDescription) in Japanese (日本語).',
  zh: 'Write all user-facing text responses (avatarDescription, locationDescription) in Simplified Chinese (简体中文).',
}

/**
 * AI 아바타 프롬프트 생성
 * 제품 정보를 바탕으로 GPT-Image 1.5용 이미지 생성 프롬프트를 생성합니다.
 */
export async function generateAiAvatarPrompt(input: AiAvatarPromptInput): Promise<AiAvatarPromptResult> {
  // 출력 언어 설정
  const outputLanguage = input.language || 'ko'
  const languageInstruction = outputLanguageInstructions[outputLanguage] || outputLanguageInstructions.ko

  const genderMap: Record<string, string> = { male: '남성', female: '여성', any: '성별 무관' }
  const ageMap: Record<string, string> = { young: '20-30대', middle: '30-40대', mature: '40-50대', any: '연령대 무관' }
  const styleMap: Record<string, string> = { natural: '자연스럽고 편안한', professional: '전문적이고 세련된', casual: '캐주얼하고 편안한', elegant: '우아하고 고급스러운', any: '스타일 무관' }
  const ethnicityMap: Record<string, string> = { korean: '한국인', asian: '아시아인', western: '서양인', japanese: '일본인', chinese: '중국인', any: '인종 무관' }
  // 영어 민족성 키워드 (이미지 생성 모델용 - 프롬프트에 필수 포함)
  const ethnicityEnglishMap: Record<string, string> = {
    korean: 'Korean',
    asian: 'East Asian',
    western: 'Caucasian Western',
    japanese: 'Japanese',
    chinese: 'Chinese',
    any: '',
  }

  // 성별별 체형 프롬프트 (영어 - 이미지 생성 모델 최적화)
  const femaleBodyTypeMap: Record<string, string> = {
    slim: 'slim slender feminine silhouette with delicate proportions',
    average: 'balanced feminine proportions with natural curves',
    athletic: 'toned athletic feminine build with defined musculature',
    curvy: 'feminine silhouette with natural soft curves',
    any: 'natural feminine proportions',
  }
  const maleBodyTypeMap: Record<string, string> = {
    slim: 'lean masculine frame with slender proportions',
    average: 'balanced masculine build with standard proportions',
    athletic: 'toned athletic masculine physique with defined muscles',
    curvy: 'solid masculine build with broader frame',
    any: 'natural masculine proportions',
  }
  // 성별 중립 기본 체형 맵 (성별 미지정 시 사용)
  const defaultBodyTypeMap: Record<string, string> = {
    slim: 'slim slender build with delicate frame',
    average: 'balanced proportions with natural build',
    athletic: 'toned athletic build with defined physique',
    curvy: 'naturally curved silhouette with soft proportions',
    any: 'natural proportions',
  }

  // 성별에 따른 체형 설명 반환
  const getBodyTypeDescription = (bodyType: string, gender?: string): string => {
    if (gender === 'female') {
      return femaleBodyTypeMap[bodyType] || femaleBodyTypeMap['any']
    } else if (gender === 'male') {
      return maleBodyTypeMap[bodyType] || maleBodyTypeMap['any']
    }
    // 성별 미지정 시 중립적 기본값 사용
    return defaultBodyTypeMap[bodyType] || defaultBodyTypeMap['any']
  }

  // 언어-인종 매핑 (ethnicity가 'any'일 때 언어에 맞는 인종 자동 설정)
  const languageToEthnicityMap: Record<string, string> = {
    ko: 'korean',
    en: 'western',
    ja: 'japanese',
    zh: 'chinese',
  }

  // ethnicity가 'any'이고 language가 있으면 언어에 맞는 인종으로 자동 설정
  const resolvedEthnicity = (input.ethnicity === 'any' || !input.ethnicity) && input.language
    ? languageToEthnicityMap[input.language] || 'any'
    : input.ethnicity || 'any'

  // 비디오 타입별 스타일 가이드
  const videoType = input.videoType || 'UGC'
  const videoTypeGuide = VIDEO_TYPE_FIRST_FRAME_GUIDES[videoType]
  const videoTypeStyle = VIDEO_TYPE_SCRIPT_STYLES[videoType]

  // 장소: 사용자 지정 > 비디오 타입 기본값
  const locationSection = input.locationPrompt
    ? `사용자가 지정한 장소: ${input.locationPrompt}`
    : `장소: ${videoTypeGuide.environmentPrompt} (${videoTypeStyle.korean} 스타일)`

  // 키 매핑
  const heightMap: Record<string, string> = {
    short: 'petite/short stature',
    average: 'average height',
    tall: 'tall stature',
    any: '',
  }

  // 헤어스타일 매핑
  const hairStyleMap: Record<string, string> = {
    short: 'short hair',
    medium: 'medium-length hair',
    long: 'long flowing hair',
    any: '',
  }

  // 헤어컬러 매핑
  const hairColorMap: Record<string, string> = {
    black: 'black hair',
    brown: 'brown hair',
    blonde: 'blonde hair',
    any: '',
  }

  const targetGenderText = genderMap[input.targetGender || 'any']
  const targetAgeText = ageMap[input.targetAge || 'any']
  const styleText = styleMap[input.style || 'any']
  const ethnicityText = ethnicityMap[resolvedEthnicity]
  const ethnicityEnglish = ethnicityEnglishMap[resolvedEthnicity] || ''
  const bodyTypeText = getBodyTypeDescription(input.bodyType || 'any', input.targetGender)
  const heightText = heightMap[input.height || 'any'] || ''
  const hairStyleText = hairStyleMap[input.hairStyle || 'any'] || ''
  const hairColorText = hairColorMap[input.hairColor || 'any'] || ''

  // 카메라 구도: 프리셋 > 직접 입력 > 기본값
  const cameraConfig = input.cameraComposition
    ? cameraCompositionDescriptions[input.cameraComposition]
    : { description: 'natural framing', aperture: 'f/11', lens: '35mm' }

  const cameraSection = input.cameraComposition
    ? `카메라 구도: ${cameraConfig.description}\n카메라 스펙: Shot on Sony A7IV, ${cameraConfig.lens} ${cameraConfig.aperture}, deep depth of field`
    : input.cameraCompositionPrompt
      ? `카메라 구도: ${input.cameraCompositionPrompt}\n카메라 스펙: Shot on Sony A7IV, 35mm f/11, deep depth of field`
      : `카메라 구도: ${cameraConfig.description}\n카메라 스펙: Shot on Sony A7IV, ${cameraConfig.lens} ${cameraConfig.aperture}, deep depth of field`

  // 포즈: 프리셋 > 직접 입력 > 비디오 타입 기본값
  const poseSection = input.modelPose
    ? `모델 포즈: ${modelPoseDescriptions[input.modelPose]}`
    : input.modelPosePrompt
      ? `모델 포즈: ${input.modelPosePrompt}`
      : `모델 포즈: ${videoTypeGuide.posePrompt}`

  // UGC 셀카 + 제품 포즈 조합 시 특별 지시
  const isUgcSelfie = input.cameraComposition === 'ugc-selfie'
  const isProductPose = input.modelPose === 'holding-product' || input.modelPose === 'showing-product'
  const ugcSelfieProductInstruction = isUgcSelfie && isProductPose
    ? `\n=== 중요: UGC 셀카 규칙 (POV 촬영) ===
- POV 셀카: 카메라 자체가 스마트폰 (이미지에 휴대폰 나타나면 안 됨)
- 제품을 자연스럽게 가슴 높이에서 들고 카메라를 바라보는 포즈
- anatomically correct hands (손 왜곡 방지)`
    : ''

  let outfitSection = ''
  if (input.outfitCustom) {
    outfitSection = `의상 설정 (사용자 지정): ${input.outfitCustom}`
  } else if (input.outfitPreset) {
    outfitSection = `의상 설정: ${outfitPresetDescriptions[input.outfitPreset]}`
  }

  // 비디오 타입별 분위기
  const atmosphereSection = `분위기: ${videoTypeGuide.atmospherePrompt}`

  // 비디오 타입별 표정 가이드 (새 필드 활용)
  const expressionGuideSection = videoTypeGuide.expressionGuide
    ? `표정 가이드 (${videoTypeStyle.korean}): ${videoTypeGuide.expressionGuide}`
    : ''

  // 비디오 타입별 카메라 느낌 (새 필드 활용)
  const cameraHintSection = videoTypeGuide.cameraMovementHint
    ? `카메라 느낌: ${videoTypeGuide.cameraMovementHint}`
    : ''

  const prompt = `당신은 GPT-Image 1.5 이미지 생성을 위한 프롬프트 전문가입니다.
제품 설명 영상의 첫 프레임에 사용될 이미지를 생성하기 위한 프롬프트를 작성해주세요.

=== OUTPUT LANGUAGE ===
${languageInstruction}

=== 영상 스타일: ${videoTypeStyle.korean} ===
${videoTypeStyle.description}
${atmosphereSection}
${expressionGuideSection}
${cameraHintSection}

=== 제품 맥락 (이해용, 프롬프트에 제품명/브랜드명 포함 금지) ===
${input.productInfo}

${input.productImageUrl ? '제품 이미지가 Figure 1로 첨부되어 있습니다. 프롬프트에서는 "the product" 또는 "the product from Figure 1"로만 지칭하세요. 절대로 제품명이나 브랜드명을 프롬프트에 포함하지 마세요.' : '⚠️ 중요: 이 이미지에는 제품이 등장하지 않습니다. 아바타만 나오고, 손은 비어있는 자연스러운 포즈로 생성하세요.'}

=== 타겟 아바타 조건 ===
- 성별: ${targetGenderText}
- 연령대: ${targetAgeText}
- 스타일: ${styleText}
- 인종/민족: ${ethnicityText} (⚠️ 프롬프트에 반드시 "${ethnicityEnglish}" 키워드 포함 필수)
- Body type (use this exact English phrase in prompt): ${bodyTypeText}${heightText ? `\n- Height: ${heightText}` : ''}${hairStyleText ? `\n- Hair style: ${hairStyleText}` : ''}${hairColorText ? `\n- Hair color: ${hairColorText}` : ''}

=== 장소/배경 ===
${locationSection}

${cameraSection}

${poseSection}
${ugcSelfieProductInstruction}

${outfitSection ? `=== 의상 설정 ===\n${outfitSection}` : ''}

=== 작성 지침 ===
1. ⚠️ 아바타 인종 필수: 프롬프트 첫 부분에 반드시 "${ethnicityEnglish}" 키워드를 포함하세요. 형식: "A ${ethnicityEnglish} [gender] in [age range]..."
2. 아바타: 성별, 나이대, 피부톤, 머리카락, 표정, 의상 상세 묘사
3. ⚠️ 배경 선명도 필수: 배경이 흐리면 안 됩니다! "sharp in-focus background", "NO bokeh", "NO blur" 반드시 포함
4. 카메라: Shot on Sony A7IV, 35mm f/11, deep depth of field, entire background sharp (NOT f/1.8 or f/2.8!)
5. 품질: ultra-realistic cinematic editorial photography, 8K quality
6. 중요: 이미지는 "${videoTypeStyle.korean}" 영상 스타일의 분위기를 반영해야 합니다
7. 중요: 생성된 프롬프트에 제품명, 브랜드명을 절대 포함하지 마세요. 제품은 "the product"로만 지칭하세요.
${input.productImageUrl ? '8. 손+제품: 자연스러운 그립으로 묘사하고 (손가락 상세 설명 금지), 제품 가시성을 우선하세요. 아바타와 제품의 조명이 일치해야 합니다.' : ''}

=== 중요: 오버레이 요소 금지 ===
${NO_OVERLAY_ELEMENTS}

${SHARP_BACKGROUND_GUIDE}

${input.productImageUrl ? `
=== 자연스러운 손+제품 가이드 (핵심 - 리얼리즘) ===
${HAND_DESCRIPTION_GUIDE}

${PRODUCT_GRIP_GUIDE}

${HAND_PRODUCT_CONTACT_GUIDE}

${LIGHTING_CONSISTENCY_GUIDE}

${GAZE_EXPRESSION_MATRIX}

${HAND_PRODUCT_EXAMPLES}
` : ''}

${AVATAR_APPEARANCE_EXAMPLES}

${AVATAR_EXPRESSION_EXAMPLES}

${AVATAR_LIGHTING_EXAMPLES}

다음 JSON 형식으로 응답하세요:
{
  "prompt": "영어로 작성된 GPT-Image 1.5 프롬프트 (50-100단어)",
  "avatarDescription": "생성될 아바타에 대한 설명 (OUTPUT LANGUAGE로 작성)",
  "locationDescription": "장소/배경에 대한 설명 (OUTPUT LANGUAGE로 작성)"
}

${AVATAR_SELF_VERIFICATION}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
    }
  }

  parts.push({ text: prompt })

  const response = await getGenAI().models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as AiAvatarPromptResult
  } catch {
    // 폴백 메시지 (언어별)
    const fallbackMessages: Record<string, { avatarDescription: string; locationDescription: string }> = {
      ko: { avatarDescription: '자연스러운 느낌의 모델', locationDescription: '자연스러운 실내 배경' },
      en: { avatarDescription: 'Natural looking model', locationDescription: 'Natural indoor background' },
      ja: { avatarDescription: 'ナチュラルなモデル', locationDescription: '自然な室内背景' },
      zh: { avatarDescription: '自然风格的模特', locationDescription: '自然的室内背景' },
    }
    const fallback = fallbackMessages[outputLanguage] || fallbackMessages.ko

    return {
      prompt: 'A person seated comfortably in a natural indoor setting, naturally holding a product. Full body visible. Calm, confident expression. Soft natural daylight. Sharp in-focus background with every detail visible, NO bokeh, NO blur. Shot on Sony A7IV, 35mm f/11, deep depth of field, entire scene razor sharp. Ultra-realistic cinematic editorial photography, 8K quality.',
      avatarDescription: fallback.avatarDescription,
      locationDescription: fallback.locationDescription,
    }
  }
}
