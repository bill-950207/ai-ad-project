/**
 * 아바타 프롬프트 빌더
 *
 * 사용자가 선택한 옵션을 기반으로 AI 이미지 생성용 프롬프트를 구축합니다.
 * 성별, 나이, 인종, 헤어스타일, 의상 등의 옵션을 자연스러운 영어 프롬프트로 변환합니다.
 */

// ============================================================
// 타입 정의
// ============================================================

/** 아바타 생성 옵션 */
export interface AvatarOptions {
  // 기본 정보
  gender?: 'female' | 'male'  // 성별
  age?: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus'  // 나이대
  ethnicity?: 'caucasian' | 'black' | 'eastAsian' | 'southeastAsian' | 'southAsian' | 'middleEastern' | 'hispanic' | 'nativeAmerican' | 'multiracial'  // 인종

  // 체형 ('auto'는 성별/나이에 맞게 자동 추천)
  height?: 'auto' | 'short' | 'average' | 'tall'  // 키
  bodyType?: 'auto' | 'slim' | 'average' | 'athletic' | 'curvy' | 'muscular'  // 체형

  // 외모 ('auto'는 성별/나이에 맞게 자동 추천)
  hairStyle?: 'auto' | 'short' | 'medium' | 'long'  // 헤어스타일 (간소화)
  hairColor?: 'auto' | 'blackhair' | 'brown' | 'blonde' | 'custom'  // 머리 색상
  customHairColor?: string  // 커스텀 머리 색상 (hairColor가 'custom'일 때)

  // 의상 (직업 기반, 'auto'는 배경/상황에 맞게 자동 추천)
  outfitStyle?: 'auto' | 'casual' | 'formal' | 'sporty' | 'doctor' | 'nurse' | 'chef' | 'worker'

  // 배경 ('auto'는 의상에 맞게 자동 추천)
  background?:
    | 'auto' | 'studioWhite' | 'studioGray' | 'home' | 'office' | 'cafe'
    | 'restaurant' | 'street' | 'park' | 'beach' | 'gym'

  // 포즈 (내부적으로만 사용, UI에서는 선택 불가)
  pose?:
    | 'standingFull' | 'standingHalf' | 'sitting' | 'walking'
    | 'leaning' | 'armsCrossed' | 'handsInPocket' | 'holding'
}

/** 아바타 생성 기본 옵션 (아무것도 선택하지 않았을 때 사용) */
export const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  gender: 'female',
  age: 'late20s',
  ethnicity: 'eastAsian',
  height: 'auto',       // 자동 추천
  bodyType: 'auto',     // 자동 추천
  hairStyle: 'auto',    // 자동 추천
  hairColor: 'auto',    // 자동 추천
  outfitStyle: 'auto',  // 배경에 맞는 의상 자동 추천
  background: 'auto',   // 자동 추천
}

// ============================================================
// 옵션-프롬프트 매핑
// ============================================================

/** 성별 매핑 */
const genderMap: Record<string, string> = {
  female: 'woman',
  male: 'man',
}

/** 나이대 매핑 */
const ageMap: Record<string, string> = {
  teen: 'teenage',
  early20s: 'in their early 20s',
  late20s: 'in their late 20s',
  '30s': 'in their 30s',
  '40plus': 'in their 40s',
}

/** 인종 매핑 (동아시아인 선택 시 한국인으로 처리) */
const ethnicityMap: Record<string, string> = {
  caucasian: 'Caucasian',
  black: 'Black African American',
  eastAsian: 'Korean',  // 동아시아인 선택 시 한국인으로 처리
  southeastAsian: 'Southeast Asian',
  southAsian: 'South Asian',
  middleEastern: 'Middle Eastern',
  hispanic: 'Hispanic Latino',
  nativeAmerican: 'Native American Indigenous',
  multiracial: 'Multiracial mixed ethnicity',
}

/** 키 매핑 */
const heightMap: Record<string, string> = {
  short: 'petite',
  average: 'average height',
  tall: 'tall',
}

/** 여성 체형 매핑 */
const femaleBodyTypeMap: Record<string, string> = {
  slim: 'slim slender feminine silhouette with delicate proportions',
  average: 'balanced feminine proportions with natural curves',
  athletic: 'toned athletic feminine build with defined musculature',
  curvy: 'feminine silhouette with natural soft curves',
}

/** 남성 체형 매핑 */
const maleBodyTypeMap: Record<string, string> = {
  slim: 'lean masculine frame with slender proportions',
  average: 'balanced masculine build with standard proportions',
  athletic: 'toned athletic masculine physique with defined muscles',
  muscular: 'muscular masculine build with well-developed muscles',
}

/** 기본 체형 매핑 (성별 불명 시) */
const defaultBodyTypeMap: Record<string, string> = {
  slim: 'slim slender build with delicate frame',
  average: 'balanced proportions with natural build',
  athletic: 'toned athletic build with defined physique',
  curvy: 'naturally curved silhouette with soft proportions',
  muscular: 'muscular build with well-developed muscles',
}

/** 성별에 따른 체형 설명 반환 */
function getBodyTypeDescription(bodyType: string, gender?: string): string {
  if (gender === 'female') {
    return femaleBodyTypeMap[bodyType] || defaultBodyTypeMap[bodyType] || bodyType
  } else if (gender === 'male') {
    return maleBodyTypeMap[bodyType] || defaultBodyTypeMap[bodyType] || bodyType
  }
  return defaultBodyTypeMap[bodyType] || bodyType
}

/** 헤어스타일 매핑 (간소화) */
const hairStyleMap: Record<string, string> = {
  short: 'short hair',
  medium: 'medium length hair',
  long: 'long hair',
}

/** 머리 색상 매핑 */
const hairColorMap: Record<string, string> = {
  blackhair: 'black hair',
  brown: 'brown hair',
  blonde: 'blonde hair',
  custom: '',  // 커스텀 색상은 별도 처리
}

/** 배경 환경 매핑 */
const backgroundMap: Record<string, string> = {
  studioWhite: 'against clean white seamless backdrop, soft even lighting effect',
  studioGray: 'against neutral gray seamless backdrop, soft even lighting effect',
  home: 'in a cozy home interior with modern furniture, warm natural lighting',
  office: 'in a modern office environment with clean design, professional lighting',
  cafe: 'in a stylish cafe interior with warm ambient lighting',
  restaurant: 'in an elegant restaurant interior with sophisticated lighting',
  street: 'on a modern city street with urban architecture, natural daylight',
  park: 'in a beautiful green park with trees and nature, golden hour natural sunlight',
  beach: 'on a beach with ocean view, warm sunlight, clear blue sky',
  gym: 'in a modern fitness gym with exercise equipment, bright lighting',
}

/** 성별에 따른 외모 개선 문구 (자연스럽게 매력적으로) */
const attractivenessEnhancerMap: Record<string, string> = {
  female: 'beautiful attractive face with refined features, clear smooth skin, bright expressive eyes, elegant natural beauty',
  male: 'handsome attractive face with well-defined features, clear healthy skin, confident charming expression, naturally good-looking',
}

/** 포즈 스타일 매핑 (항상 카메라 응시) */
const poseMap: Record<string, string> = {
  standingFull: 'standing full body shot, looking directly at camera, eye contact, confident posture',
  standingHalf: 'standing upper body shot from waist up, looking directly at camera, eye contact',
  sitting: 'sitting comfortably, looking directly at camera, eye contact, relaxed posture',
  walking: 'walking pose mid-stride, looking at camera, natural movement',
  leaning: 'leaning against wall or surface, relaxed pose, looking at camera, eye contact',
  armsCrossed: 'standing with arms crossed, confident pose, looking directly at camera, eye contact',
  handsInPocket: 'standing with hands in pockets, casual relaxed pose, looking at camera',
  holding: 'holding an object or product, looking at camera, eye contact, natural pose',
}

/** 의상 스타일 매핑 (직업 기반, 상체 중심 의상 설명 - 하체/신발 제외) */
const outfitStyleMap: Record<string, string> = {
  casual: 'wearing a fitted white cotton t-shirt, casual relaxed style',
  formal: 'wearing a tailored navy blue suit jacket with white dress shirt and silk tie, professional elegant style',
  sporty: 'wearing a performance athletic zip-up track jacket, active fitness style',
  doctor: 'wearing a crisp white lab coat over light blue scrubs, stethoscope around neck, medical professional attire',
  nurse: 'wearing clean teal medical scrubs with v-neck top, healthcare professional attire',
  chef: 'wearing a double-breasted white chef coat with black buttons, traditional white chef hat, culinary professional attire',
  worker: 'wearing durable navy blue work coveralls with reflective stripes, industrial worker attire',
}

/** 배경에 따른 자동 의상 추천 (상체 중심 - 하체/신발 제외) */
function getAutoOutfit(options: AvatarOptions): string {
  const { background } = options

  // 'auto' 또는 스튜디오 배경인 경우 기본 캐주얼
  if (!background || background === 'auto' || background === 'studioWhite' || background === 'studioGray') {
    return outfitStyleMap['casual']
  }

  // 배경에 따른 의상 추천 (상체만 언급)
  if (background === 'gym') {
    return outfitStyleMap['sporty']
  }
  if (background === 'office') {
    return outfitStyleMap['formal']
  }
  if (background === 'beach' || background === 'park') {
    return 'wearing a comfortable linen shirt, relaxed vacation style'
  }
  if (background === 'restaurant') {
    return 'wearing a smart casual blazer over a clean button-up shirt, refined dining attire'
  }
  if (background === 'cafe') {
    return 'wearing a cozy knit sweater, trendy casual style'
  }
  if (background === 'home') {
    return 'wearing a soft cotton hoodie, cozy home style'
  }
  if (background === 'street') {
    return 'wearing a stylish bomber jacket over a plain t-shirt, urban streetwear style'
  }

  // 기본값: 캐주얼
  return outfitStyleMap['casual']
}

// ============================================================
// 함수
// ============================================================

/**
 * 아바타 옵션을 기반으로 이미지 생성 프롬프트 구축
 *
 * 선택된 옵션들을 자연스러운 영어 문장으로 조합하여
 * AI 이미지 생성에 최적화된 프롬프트를 생성합니다.
 *
 * @param options - 아바타 옵션
 * @returns 생성된 프롬프트 문자열
 */
export function buildPromptFromOptions(options: AvatarOptions): string {
  const parts: string[] = []

  // 기본 주체 (성별, 나이, 인종)
  const gender = options.gender ? genderMap[options.gender] : 'person'
  const age = options.age ? ageMap[options.age] : ''
  const ethnicity = options.ethnicity ? ethnicityMap[options.ethnicity] : ''

  let subject = `A ${ethnicity} ${gender}`.trim()
  if (age) subject += ` ${age}`
  parts.push(subject)

  // 외모 개선 문구 (성별에 따라 자연스럽게 매력적인 외모 적용)
  if (options.gender && attractivenessEnhancerMap[options.gender]) {
    parts.push(attractivenessEnhancerMap[options.gender])
  }

  // 체형 (키와 체형) - 성별에 따른 구체적인 신체 비율 사용
  // 'auto'인 경우 생략하여 AI가 자연스럽게 결정하도록 함
  const bodyDescParts: string[] = []
  if (options.height && options.height !== 'auto') {
    bodyDescParts.push(heightMap[options.height])
  }
  if (options.bodyType && options.bodyType !== 'auto') {
    bodyDescParts.push(getBodyTypeDescription(options.bodyType, options.gender))
  }
  if (bodyDescParts.length > 0) {
    parts.push(bodyDescParts.join(' with '))
  }

  // 헤어스타일 ('auto'인 경우 생략)
  if (options.hairStyle && options.hairStyle !== 'auto') {
    let hair = hairStyleMap[options.hairStyle] || options.hairStyle

    // 머리 색상 적용 ('auto'인 경우 생략)
    if (options.hairColor === 'custom' && options.customHairColor) {
      hair = `${options.customHairColor} colored ${hair}`
    } else if (options.hairColor && options.hairColor !== 'auto') {
      const hairColorDesc = hairColorMap[options.hairColor]
      if (hairColorDesc) hair = `${hairColorDesc}, ${hair}`
    }

    parts.push(`with ${hair}`)
  }

  // 의상 스타일 ('auto' 또는 미지정 시 배경에 맞는 의상 자동 추천)
  if (options.outfitStyle === 'auto' || !options.outfitStyle) {
    parts.push(getAutoOutfit(options))
  } else {
    parts.push(outfitStyleMap[options.outfitStyle] || outfitStyleMap['casual'])
  }

  // 포즈 - 기본값: 정면을 바라보는 자연스러운 상체 포즈
  const pose = options.pose ? poseMap[options.pose] : 'looking directly at camera, eye contact, relaxed natural expression'
  parts.push(pose)

  // 배경 ('auto'인 경우 기본 스튜디오 화이트 배경 사용)
  if (options.background && options.background !== 'auto') {
    parts.push(backgroundMap[options.background])
  } else {
    // auto 또는 미지정 시 기본 스튜디오 화이트 배경
    parts.push(backgroundMap['studioWhite'])
  }

  return parts.join(', ')
}

/**
 * 아바타 옵션 유효성 검증
 *
 * 전달된 옵션이 올바른 형식과 값을 가지고 있는지 확인합니다.
 *
 * @param options - 검증할 옵션 객체
 * @returns 유효한 AvatarOptions인 경우 true
 */
export function validateAvatarOptions(options: unknown): options is AvatarOptions {
  // 옵션이 없거나 객체가 아닌 경우 (옵션은 선택사항이므로 true 반환)
  if (!options || typeof options !== 'object') return true

  const o = options as Record<string, unknown>

  // 허용된 값 목록
  const validGenders = ['female', 'male']
  const validAges = ['teen', 'early20s', 'late20s', '30s', '40plus']
  const validEthnicities = ['caucasian', 'black', 'eastAsian', 'southeastAsian', 'southAsian', 'middleEastern', 'hispanic', 'nativeAmerican', 'multiracial']
  const validHeights = ['auto', 'short', 'average', 'tall']
  const validBodyTypes = ['auto', 'slim', 'average', 'athletic', 'curvy', 'muscular']
  const validHairStyles = ['auto', 'short', 'medium', 'long']
  const validHairColors = ['auto', 'blackhair', 'brown', 'blonde', 'custom']
  const validOutfitStyles = ['auto', 'casual', 'formal', 'sporty', 'doctor', 'nurse', 'chef', 'worker']
  const validBackgrounds = [
    'auto', 'studioWhite', 'studioGray', 'home', 'office', 'cafe',
    'restaurant', 'street', 'park', 'beach', 'gym',
  ]
  const validPoses = [
    'standingFull', 'standingHalf', 'sitting', 'walking',
    'leaning', 'armsCrossed', 'handsInPocket', 'holding',
  ]

  // 각 필드 검증
  if (o.gender && !validGenders.includes(o.gender as string)) return false
  if (o.age && !validAges.includes(o.age as string)) return false
  if (o.ethnicity && !validEthnicities.includes(o.ethnicity as string)) return false
  if (o.height && !validHeights.includes(o.height as string)) return false
  if (o.bodyType && !validBodyTypes.includes(o.bodyType as string)) return false
  if (o.hairStyle && !validHairStyles.includes(o.hairStyle as string)) return false
  if (o.hairColor && !validHairColors.includes(o.hairColor as string)) return false
  if (o.outfitStyle && !validOutfitStyles.includes(o.outfitStyle as string)) return false
  if (o.background && !validBackgrounds.includes(o.background as string)) return false
  if (o.pose && !validPoses.includes(o.pose as string)) return false

  return true
}

// ============================================================
// AI 아바타 옵션 변환 및 이미지 생성
// ============================================================

/** AI 아바타 옵션 타입 (이미지/영상 광고에서 사용) */
export interface AiAvatarOptions {
  targetGender?: 'male' | 'female' | 'any'
  targetAge?: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus' | 'young' | 'middle' | 'mature' | 'any'
  style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
  ethnicity?: 'eastAsian' | 'southeastAsian' | 'southAsian' | 'caucasian' | 'black' | 'hispanic' | 'middleEastern' | 'korean' | 'asian' | 'western' | 'japanese' | 'chinese' | 'any'
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'muscular' | 'any'
  // 상세 옵션 (새로 추가)
  height?: 'short' | 'average' | 'tall' | 'any'
  hairStyle?: 'short' | 'medium' | 'long' | 'any'
  hairColor?: 'black' | 'brown' | 'blonde' | 'any'
  outfitStyle?: 'casual' | 'formal' | 'sporty' | 'professional' | 'elegant' | 'any'
}

/** AI 아바타 옵션을 AvatarOptions로 변환 */
export function convertAiAvatarOptionsToAvatarOptions(aiOptions: AiAvatarOptions): AvatarOptions {
  const options: AvatarOptions = {}

  // 성별 변환
  if (aiOptions.targetGender && aiOptions.targetGender !== 'any') {
    options.gender = aiOptions.targetGender as 'female' | 'male'
  }

  // 나이 변환
  if (aiOptions.targetAge && aiOptions.targetAge !== 'any') {
    const ageConvertMap: Record<string, AvatarOptions['age']> = {
      teen: 'teen',
      early20s: 'early20s',
      late20s: 'late20s',
      '30s': '30s',
      '40plus': '40plus',
      young: 'early20s',
      middle: '30s',
      mature: '40plus',
    }
    options.age = ageConvertMap[aiOptions.targetAge]
  }

  // 인종 변환
  if (aiOptions.ethnicity && aiOptions.ethnicity !== 'any') {
    const ethnicityConvertMap: Record<string, AvatarOptions['ethnicity']> = {
      eastAsian: 'eastAsian',
      southeastAsian: 'southeastAsian',
      southAsian: 'southAsian',
      caucasian: 'caucasian',
      black: 'black',
      hispanic: 'hispanic',
      middleEastern: 'middleEastern',
      korean: 'eastAsian',
      asian: 'eastAsian',
      western: 'caucasian',
    }
    options.ethnicity = ethnicityConvertMap[aiOptions.ethnicity]
  }

  // 키 변환
  if (aiOptions.height && aiOptions.height !== 'any') {
    options.height = aiOptions.height as AvatarOptions['height']
  }

  // 체형 변환
  if (aiOptions.bodyType && aiOptions.bodyType !== 'any') {
    options.bodyType = aiOptions.bodyType as AvatarOptions['bodyType']
  }

  // 헤어스타일 변환
  if (aiOptions.hairStyle && aiOptions.hairStyle !== 'any') {
    options.hairStyle = aiOptions.hairStyle as AvatarOptions['hairStyle']
  }

  // 헤어컬러 변환
  if (aiOptions.hairColor && aiOptions.hairColor !== 'any') {
    const hairColorMap: Record<string, AvatarOptions['hairColor']> = {
      black: 'blackhair',
      brown: 'brown',
      blonde: 'blonde',
    }
    options.hairColor = hairColorMap[aiOptions.hairColor]
  }

  // 의상 스타일 변환
  if (aiOptions.outfitStyle && aiOptions.outfitStyle !== 'any') {
    const outfitMap: Record<string, AvatarOptions['outfitStyle']> = {
      casual: 'casual',
      formal: 'formal',
      sporty: 'sporty',
      professional: 'formal',
      elegant: 'formal',
    }
    options.outfitStyle = outfitMap[aiOptions.outfitStyle]
  }

  // 기본값: 스튜디오 배경
  options.background = 'studioWhite'

  return options
}

/**
 * AI 아바타용 z-image-turbo 프롬프트 생성
 *
 * 아바타 생성 API와 동일한 품질 향상 문구를 적용합니다.
 */
export function buildAiAvatarPrompt(aiOptions: AiAvatarOptions): string {
  // 옵션 변환
  const avatarOptions = convertAiAvatarOptionsToAvatarOptions(aiOptions)

  // 기본 프롬프트 생성
  const rawPrompt = buildPromptFromOptions(avatarOptions)

  // 품질 향상 문구 추가 (아바타 생성 API와 동일, 중복 제거)
  const hasBackground = avatarOptions.background

  const gazeDirection = 'looking directly at camera, eye contact with viewer'
  const qualityEnhancers = 'high quality photo, realistic, detailed skin texture'
  const defaultBackground = hasBackground ? '' : ', against clean white seamless backdrop with soft even lighting'
  const viewType = 'upper body shot'

  return `${rawPrompt}, ${gazeDirection}, ${qualityEnhancers}${defaultBackground}, ${viewType}`
}
