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
  gender?: 'female' | 'male' | 'nonbinary'  // 성별
  age?: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus'  // 나이대
  ethnicity?: 'korean' | 'eastAsian' | 'western' | 'southeastAsian' | 'black' | 'hispanic' | 'mixed'  // 인종

  // 체형
  height?: 'short' | 'average' | 'tall'  // 키
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy'  // 체형

  // 외모
  hairStyle?: 'longStraight' | 'bob' | 'wavy' | 'ponytail' | 'short'  // 헤어스타일
  hairColor?: 'black' | 'brown' | 'blonde' | 'custom'  // 머리 색상
  customHairColor?: string  // 커스텀 머리 색상 (hairColor가 'custom'일 때)
  vibe?: 'natural' | 'sophisticated' | 'cute' | 'professional'  // 분위기/느낌

  // 의상
  outfitStyle?: 'casual' | 'office' | 'sporty' | 'homewear'  // 의상 스타일
  colorTone?: 'light' | 'dark' | 'neutral' | 'brandColor'  // 색상 톤
  brandColorHex?: string  // 브랜드 색상 (colorTone이 'brandColor'일 때)
}

// ============================================================
// 옵션-프롬프트 매핑
// ============================================================

/** 성별 매핑 */
const genderMap: Record<string, string> = {
  female: 'woman',
  male: 'man',
  nonbinary: 'person',
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
  korean: 'Korean',
  eastAsian: 'East Asian',
  western: 'Caucasian',
  southeastAsian: 'Southeast Asian',
  black: 'African',
  hispanic: 'Hispanic',
  mixed: 'mixed ethnicity',
}

/** 키 매핑 */
const heightMap: Record<string, string> = {
  short: 'petite',
  average: 'average height',
  tall: 'tall',
}

/** 체형 매핑 */
const bodyTypeMap: Record<string, string> = {
  slim: 'slim build',
  average: 'average build',
  athletic: 'athletic build',
  curvy: 'curvy figure',
}

/** 헤어스타일 매핑 */
const hairStyleMap: Record<string, string> = {
  longStraight: 'long straight hair',
  bob: 'bob haircut',
  wavy: 'wavy hair',
  ponytail: 'ponytail',
  short: 'short hair',
}

/** 머리 색상 매핑 */
const hairColorMap: Record<string, string> = {
  black: 'black hair',
  brown: 'brown hair',
  blonde: 'blonde hair',
  custom: '',  // 커스텀 색상은 별도 처리
}

/** 분위기/느낌 매핑 */
const vibeMap: Record<string, string> = {
  natural: 'natural and approachable look',
  sophisticated: 'sophisticated and elegant look',
  cute: 'cute and friendly look',
  professional: 'professional and confident look',
}

/** 의상 스타일 매핑 */
const outfitStyleMap: Record<string, string> = {
  casual: 'casual outfit',
  office: 'business casual attire',
  sporty: 'athletic wear',
  homewear: 'comfortable home clothes',
}

/** 색상 톤 매핑 */
const colorToneMap: Record<string, string> = {
  light: 'light-colored',
  dark: 'dark-colored',
  neutral: 'neutral-toned',
  brandColor: '',  // 브랜드 색상은 별도 처리
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

  // 체형 (키와 체형)
  const bodyDescParts: string[] = []
  if (options.height) {
    bodyDescParts.push(heightMap[options.height])
  }
  if (options.bodyType) {
    bodyDescParts.push(bodyTypeMap[options.bodyType])
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

  // 분위기/느낌
  if (options.vibe) {
    parts.push(vibeMap[options.vibe])
  }

  // 의상
  if (options.outfitStyle) {
    let outfit = outfitStyleMap[options.outfitStyle]

    // 색상 톤 적용
    if (options.colorTone === 'brandColor' && options.brandColorHex) {
      outfit = `${options.brandColorHex} colored ${outfit}`
    } else if (options.colorTone) {
      const colorDesc = colorToneMap[options.colorTone]
      if (colorDesc) outfit = `${colorDesc} ${outfit}`
    }

    parts.push(`wearing ${outfit}`)
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
  const validGenders = ['female', 'male', 'nonbinary']
  const validAges = ['teen', 'early20s', 'late20s', '30s', '40plus']
  const validEthnicities = ['korean', 'eastAsian', 'western', 'southeastAsian', 'black', 'hispanic', 'mixed']
  const validHeights = ['short', 'average', 'tall']
  const validBodyTypes = ['slim', 'average', 'athletic', 'curvy']
  const validHairStyles = ['longStraight', 'bob', 'wavy', 'ponytail', 'short']
  const validHairColors = ['black', 'brown', 'blonde', 'custom']
  const validVibes = ['natural', 'sophisticated', 'cute', 'professional']
  const validOutfitStyles = ['casual', 'office', 'sporty', 'homewear']
  const validColorTones = ['light', 'dark', 'neutral', 'brandColor']

  // 각 필드 검증
  if (o.gender && !validGenders.includes(o.gender as string)) return false
  if (o.age && !validAges.includes(o.age as string)) return false
  if (o.ethnicity && !validEthnicities.includes(o.ethnicity as string)) return false
  if (o.height && !validHeights.includes(o.height as string)) return false
  if (o.bodyType && !validBodyTypes.includes(o.bodyType as string)) return false
  if (o.hairStyle && !validHairStyles.includes(o.hairStyle as string)) return false
  if (o.hairColor && !validHairColors.includes(o.hairColor as string)) return false
  if (o.vibe && !validVibes.includes(o.vibe as string)) return false
  if (o.outfitStyle && !validOutfitStyles.includes(o.outfitStyle as string)) return false
  if (o.colorTone && !validColorTones.includes(o.colorTone as string)) return false

  return true
}
