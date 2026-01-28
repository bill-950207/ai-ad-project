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
  ethnicity?: 'asian' | 'caucasian' | 'black' | 'hispanic'  // 인종

  // 체형
  height?: 'short' | 'average' | 'tall'  // 키
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'plussize'  // 체형

  // 외모
  // 여성 헤어스타일
  hairStyle?:
    | 'longStraight' | 'longLayered' | 'bob' | 'shortBob' | 'wavy' | 'curly'
    | 'ponytail' | 'bun' | 'halfUp' | 'bangs' | 'pixie'
    // 남성 헤어스타일
    | 'maleShort' | 'buzz' | 'twoBlock' | 'undercut' | 'pompadour'
    | 'slickedBack' | 'sidePart' | 'maleWavy' | 'maleMedium'
  hairColor?: 'blackhair' | 'brown' | 'blonde' | 'custom'  // 머리 색상
  customHairColor?: string  // 커스텀 머리 색상 (hairColor가 'custom'일 때)

  // 의상
  outfitStyle?:
    | 'tshirtJeans' | 'shirtSlacks' | 'blouseSkirt' | 'dress' | 'suit'
    | 'knitSweater' | 'athletic' | 'lounge' | 'jacket'

  // 배경
  background?:
    | 'studioWhite' | 'studioGray' | 'home' | 'office' | 'cafe'
    | 'restaurant' | 'street' | 'park' | 'beach' | 'gym'

  // 포즈
  pose?:
    | 'standingFull' | 'standingHalf' | 'sitting' | 'walking'
    | 'leaning' | 'armsCrossed' | 'handsInPocket' | 'holding'
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

/** 인종 매핑 */
const ethnicityMap: Record<string, string> = {
  asian: 'Asian',
  caucasian: 'Caucasian',
  black: 'Black African',
  hispanic: 'Hispanic Latino',
}

/** 키 매핑 */
const heightMap: Record<string, string> = {
  short: 'petite',
  average: 'average height',
  tall: 'tall',
}

/** 여성 체형 매핑 (추상적이고 상대적인 표현 사용 - 구체적 신체 크기 표현 금지) */
const femaleBodyTypeMap: Record<string, string> = {
  slim: 'slim slender feminine silhouette with delicate proportions',
  average: 'balanced feminine proportions with natural curves',
  athletic: 'toned athletic feminine build with defined musculature',
  curvy: 'feminine silhouette with natural soft curves',
  plussize: 'full-figured feminine form with generous proportions',
}

/** 남성 체형 매핑 (추상적이고 상대적인 표현 사용) */
const maleBodyTypeMap: Record<string, string> = {
  slim: 'lean masculine frame with slender proportions',
  average: 'balanced masculine build with standard proportions',
  athletic: 'toned athletic masculine physique with defined muscles',
  curvy: 'solid masculine build with broader frame',
  plussize: 'full masculine frame with generous build',
}

/** 기본 체형 매핑 (성별 불명 시) */
const defaultBodyTypeMap: Record<string, string> = {
  slim: 'slim slender build with delicate frame',
  average: 'balanced proportions with natural build',
  athletic: 'toned athletic build with defined physique',
  curvy: 'naturally curved silhouette with soft proportions',
  plussize: 'full-figured build with generous proportions',
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

/** 헤어스타일 매핑 */
const hairStyleMap: Record<string, string> = {
  // 여성 헤어스타일
  longStraight: 'long straight hair',
  longLayered: 'long layered hair with face-framing layers',
  bob: 'chin-length bob haircut',
  shortBob: 'short bob haircut above the chin',
  wavy: 'soft wavy hair',
  curly: 'natural curly hair',
  ponytail: 'high ponytail',
  bun: 'elegant hair bun updo',
  halfUp: 'half-up half-down hairstyle',
  bangs: 'hair with bangs fringe',
  pixie: 'short pixie cut',
  // 남성 헤어스타일
  maleShort: 'short cropped hair',
  buzz: 'buzz cut very short hair',
  twoBlock: 'two-block haircut with longer top and shaved sides',
  undercut: 'undercut hairstyle with disconnected sides',
  pompadour: 'pompadour hairstyle with volume on top',
  slickedBack: 'slicked back hair',
  sidePart: 'classic side part hairstyle',
  maleWavy: 'textured wavy hair',
  maleMedium: 'medium length hair',
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
  studioWhite: 'in a professional photo studio with clean white backdrop, soft even lighting, sharp in-focus background',
  studioGray: 'in a professional photo studio with neutral gray backdrop, soft even lighting, sharp in-focus background',
  home: 'in a cozy modern home interior living room with warm natural light from window, sharp clear background',
  office: 'in a bright modern office space with large windows and natural daylight, sharp clear background',
  cafe: 'in a stylish cafe interior with warm ambient light, coffee shop atmosphere, sharp clear background',
  restaurant: 'in an elegant restaurant interior with sophisticated lighting, fine dining atmosphere',
  street: 'on a modern city street with urban architecture, natural daylight, sharp in-focus background',
  park: 'in a beautiful green park with trees and nature, golden hour natural sunlight, sharp background',
  beach: 'on a beach with ocean view, warm sunlight, clear blue sky, sharp in-focus background',
  gym: 'in a modern fitness gym with exercise equipment, bright lighting, sharp clear background',
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

/** 의상 스타일 매핑 */
const outfitStyleMap: Record<string, string> = {
  tshirtJeans: 'wearing a fitted t-shirt and slim-fit jeans, casual everyday style',
  shirtSlacks: 'wearing a crisp button-down shirt and tailored slacks, smart casual style',
  blouseSkirt: 'wearing an elegant blouse and pencil skirt, feminine professional style',
  dress: 'wearing a stylish fitted dress, elegant feminine style',
  suit: 'wearing a well-tailored business suit, professional formal style',
  knitSweater: 'wearing a cozy knit sweater, warm casual style',
  athletic: 'wearing form-fitting athletic wear, sporty activewear style',
  lounge: 'wearing comfortable loungewear, relaxed home style',
  jacket: 'wearing a stylish jacket or coat over casual outfit, layered style',
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

  // 체형 (키와 체형) - 성별에 따른 구체적인 신체 비율 사용
  const bodyDescParts: string[] = []
  if (options.height) {
    bodyDescParts.push(heightMap[options.height])
  }
  if (options.bodyType) {
    bodyDescParts.push(getBodyTypeDescription(options.bodyType, options.gender))
  }
  if (bodyDescParts.length > 0) {
    parts.push(bodyDescParts.join(' with '))
  }

  // 헤어스타일
  if (options.hairStyle) {
    let hair = hairStyleMap[options.hairStyle]

    // 머리 색상 적용
    if (options.hairColor === 'custom' && options.customHairColor) {
      hair = `${options.customHairColor} colored ${hair}`
    } else if (options.hairColor) {
      const hairColorDesc = hairColorMap[options.hairColor]
      if (hairColorDesc) hair = `${hairColorDesc}, ${hair}`
    }

    parts.push(`with ${hair}`)
  }

  // 의상 스타일 (체형이 보이는 핏한 의상)
  if (options.outfitStyle) {
    parts.push(outfitStyleMap[options.outfitStyle])
  } else {
    // 기본 의상: 체형이 잘 보이는 핏한 의상
    parts.push('wearing fitted clothing that shows body shape')
  }

  // 포즈
  if (options.pose) {
    parts.push(poseMap[options.pose])
  }

  // 배경
  if (options.background) {
    parts.push(backgroundMap[options.background])
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
  const validEthnicities = ['asian', 'caucasian', 'black', 'hispanic']
  const validHeights = ['short', 'average', 'tall']
  const validBodyTypes = ['slim', 'average', 'athletic', 'curvy', 'plussize']
  const validHairStyles = [
    // 여성
    'longStraight', 'longLayered', 'bob', 'shortBob', 'wavy', 'curly',
    'ponytail', 'bun', 'halfUp', 'bangs', 'pixie',
    // 남성
    'maleShort', 'buzz', 'twoBlock', 'undercut', 'pompadour',
    'slickedBack', 'sidePart', 'maleWavy', 'maleMedium',
  ]
  const validHairColors = ['blackhair', 'brown', 'blonde', 'custom']
  const validOutfitStyles = [
    'tshirtJeans', 'shirtSlacks', 'blouseSkirt', 'dress', 'suit',
    'knitSweater', 'athletic', 'lounge', 'jacket',
  ]
  const validBackgrounds = [
    'studioWhite', 'studioGray', 'home', 'office', 'cafe',
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
  targetAge?: 'young' | 'middle' | 'mature' | 'any'
  style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
  ethnicity?: 'korean' | 'asian' | 'western' | 'any'
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'any'
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
      young: 'early20s',
      middle: '30s',
      mature: '40plus',
    }
    options.age = ageConvertMap[aiOptions.targetAge]
  }

  // 인종 변환
  if (aiOptions.ethnicity && aiOptions.ethnicity !== 'any') {
    const ethnicityConvertMap: Record<string, AvatarOptions['ethnicity']> = {
      korean: 'korean',
      asian: 'eastAsian',
      western: 'western',
    }
    options.ethnicity = ethnicityConvertMap[aiOptions.ethnicity]
  }

  // 스타일 → 분위기 변환
  if (aiOptions.style && aiOptions.style !== 'any') {
    const vibeConvertMap: Record<string, AvatarOptions['vibe']> = {
      natural: 'natural',
      professional: 'professional',
      casual: 'natural',
      elegant: 'sophisticated',
    }
    options.vibe = vibeConvertMap[aiOptions.style]
  }

  // 체형 변환
  if (aiOptions.bodyType && aiOptions.bodyType !== 'any') {
    options.bodyType = aiOptions.bodyType as AvatarOptions['bodyType']
  }

  // 기본값: 스튜디오 배경, 자연스러운 포즈
  options.background = 'studio'
  options.pose = 'natural'

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

  // 품질 향상 문구 추가 (아바타 생성 API와 동일)
  const hasBackground = avatarOptions.background
  const hasPose = avatarOptions.pose

  const styleAndAntiBlur = 'documentary style environmental portrait, sharp background in focus, NO bokeh, NO blur, NO shallow depth of field, f/11 aperture'
  const gazeDirection = 'looking directly at camera, eye contact with viewer'
  const qualityEnhancers = 'high quality photo, realistic, professional photography, sharp focus, detailed skin texture'
  const defaultBackground = hasBackground ? '' : ', in a professional photo studio with even studio lighting and clean white backdrop, well-lit, sharp clear background'
  const defaultPose = hasPose ? '' : ', in a relaxed natural pose, neutral calm expression'
  const viewType = 'upper body shot'

  return `${styleAndAntiBlur}, ${rawPrompt}, ${gazeDirection}, ${qualityEnhancers}${defaultBackground}${defaultPose}, ${viewType}`
}
