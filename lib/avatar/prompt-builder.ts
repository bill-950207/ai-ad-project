// Avatar option types
export interface AvatarOptions {
  // Basic info
  gender?: 'female' | 'male' | 'nonbinary'
  age?: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus'
  ethnicity?: 'korean' | 'eastAsian' | 'western' | 'southeastAsian' | 'black' | 'hispanic' | 'mixed'

  // Appearance
  hairStyle?: 'longStraight' | 'bob' | 'wavy' | 'ponytail' | 'short'
  hairColor?: 'black' | 'brown' | 'blonde' | 'custom'
  customHairColor?: string
  vibe?: 'natural' | 'sophisticated' | 'cute' | 'professional'

  // Outfit
  outfitStyle?: 'casual' | 'office' | 'sporty' | 'homewear'
  colorTone?: 'light' | 'dark' | 'neutral' | 'brandColor'
  brandColorHex?: string
}

// Mapping for prompt generation
const genderMap: Record<string, string> = {
  female: 'woman',
  male: 'man',
  nonbinary: 'person',
}

const ageMap: Record<string, string> = {
  teen: 'teenage',
  early20s: 'in their early 20s',
  late20s: 'in their late 20s',
  '30s': 'in their 30s',
  '40plus': 'in their 40s',
}

const ethnicityMap: Record<string, string> = {
  korean: 'Korean',
  eastAsian: 'East Asian',
  western: 'Caucasian',
  southeastAsian: 'Southeast Asian',
  black: 'African',
  hispanic: 'Hispanic',
  mixed: 'mixed ethnicity',
}

const hairStyleMap: Record<string, string> = {
  longStraight: 'long straight hair',
  bob: 'bob haircut',
  wavy: 'wavy hair',
  ponytail: 'ponytail',
  short: 'short hair',
}

const hairColorMap: Record<string, string> = {
  black: 'black hair',
  brown: 'brown hair',
  blonde: 'blonde hair',
  custom: '',
}

const vibeMap: Record<string, string> = {
  natural: 'natural and approachable look',
  sophisticated: 'sophisticated and elegant look',
  cute: 'cute and friendly look',
  professional: 'professional and confident look',
}

const outfitStyleMap: Record<string, string> = {
  casual: 'casual outfit',
  office: 'business casual attire',
  sporty: 'athletic wear',
  homewear: 'comfortable home clothes',
}

const colorToneMap: Record<string, string> = {
  light: 'light-colored',
  dark: 'dark-colored',
  neutral: 'neutral-toned',
  brandColor: '',
}

/**
 * Build a prompt from avatar options
 */
export function buildPromptFromOptions(options: AvatarOptions): string {
  const parts: string[] = []

  // Base subject
  const gender = options.gender ? genderMap[options.gender] : 'person'
  const age = options.age ? ageMap[options.age] : ''
  const ethnicity = options.ethnicity ? ethnicityMap[options.ethnicity] : ''

  let subject = `A ${ethnicity} ${gender}`.trim()
  if (age) subject += ` ${age}`
  parts.push(subject)

  // Hair
  if (options.hairStyle) {
    let hair = hairStyleMap[options.hairStyle]
    if (options.hairColor === 'custom' && options.customHairColor) {
      hair = `${options.customHairColor} colored ${hair}`
    } else if (options.hairColor) {
      const hairColorDesc = hairColorMap[options.hairColor]
      if (hairColorDesc) hair = `${hairColorDesc}, ${hair}`
    }
    parts.push(`with ${hair}`)
  }

  // Vibe/atmosphere
  if (options.vibe) {
    parts.push(vibeMap[options.vibe])
  }

  // Outfit
  if (options.outfitStyle) {
    let outfit = outfitStyleMap[options.outfitStyle]
    if (options.colorTone === 'brandColor' && options.brandColorHex) {
      outfit = `${options.brandColorHex} colored ${outfit}`
    } else if (options.colorTone) {
      const colorDesc = colorToneMap[options.colorTone]
      if (colorDesc) outfit = `${colorDesc} ${outfit}`
    }
    parts.push(`wearing ${outfit}`)
  }

  // Add quality modifiers
  parts.push('high quality portrait, studio lighting, clean background')

  return parts.join(', ')
}

/**
 * Validate avatar options
 */
export function validateAvatarOptions(options: unknown): options is AvatarOptions {
  if (!options || typeof options !== 'object') return true // Options are optional

  const o = options as Record<string, unknown>

  const validGenders = ['female', 'male', 'nonbinary']
  const validAges = ['teen', 'early20s', 'late20s', '30s', '40plus']
  const validEthnicities = ['korean', 'eastAsian', 'western', 'southeastAsian', 'black', 'hispanic', 'mixed']
  const validHairStyles = ['longStraight', 'bob', 'wavy', 'ponytail', 'short']
  const validHairColors = ['black', 'brown', 'blonde', 'custom']
  const validVibes = ['natural', 'sophisticated', 'cute', 'professional']
  const validOutfitStyles = ['casual', 'office', 'sporty', 'homewear']
  const validColorTones = ['light', 'dark', 'neutral', 'brandColor']

  if (o.gender && !validGenders.includes(o.gender as string)) return false
  if (o.age && !validAges.includes(o.age as string)) return false
  if (o.ethnicity && !validEthnicities.includes(o.ethnicity as string)) return false
  if (o.hairStyle && !validHairStyles.includes(o.hairStyle as string)) return false
  if (o.hairColor && !validHairColors.includes(o.hairColor as string)) return false
  if (o.vibe && !validVibes.includes(o.vibe as string)) return false
  if (o.outfitStyle && !validOutfitStyles.includes(o.outfitStyle as string)) return false
  if (o.colorTone && !validColorTones.includes(o.colorTone as string)) return false

  return true
}
