/**
 * 이미지 광고 카테고리별 옵션 정의
 *
 * 각 카테고리에 특화된 구조화된 선택지를 제공합니다.
 */

import { ImageAdType } from '@/components/ad-product/image-ad-type-modal'

// 옵션 항목 타입
export interface OptionItem {
  key: string
  labelKey: string  // 번역 키
}

// 옵션 그룹 타입
export interface OptionGroup {
  key: string
  labelKey: string  // 번역 키
  options: OptionItem[]
  defaultValue: string
  allowCustom?: boolean  // 직접 입력 허용 여부
}

// 선택된 옵션 값 (일반 선택 또는 직접 입력)
export interface SelectedOptionValue {
  type: 'preset' | 'custom'
  value: string
  customText?: string  // type이 'custom'일 때 사용자 입력 텍스트
}

// 카테고리별 옵션 구조
export interface CategoryOptions {
  groups: OptionGroup[]
}

// ============================================================
// 공통 옵션
// ============================================================

const COMMON_BACKGROUNDS: OptionItem[] = [
  { key: 'studio', labelKey: 'studio' },
  { key: 'outdoor', labelKey: 'outdoor' },
  { key: 'home', labelKey: 'home' },
  { key: 'office', labelKey: 'office' },
  { key: 'cafe', labelKey: 'cafe' },
  { key: 'nature', labelKey: 'nature' },
]

const COMMON_LIGHTING: OptionItem[] = [
  { key: 'soft', labelKey: 'soft' },
  { key: 'natural', labelKey: 'natural' },
  { key: 'dramatic', labelKey: 'dramatic' },
  { key: 'warm', labelKey: 'warm' },
  { key: 'cool', labelKey: 'cool' },
]

const COMMON_MOOD: OptionItem[] = [
  { key: 'luxury', labelKey: 'luxury' },
  { key: 'casual', labelKey: 'casual' },
  { key: 'professional', labelKey: 'professional' },
  { key: 'friendly', labelKey: 'friendly' },
  { key: 'energetic', labelKey: 'energetic' },
]

// 시선 방향 옵션 (아바타 사용 시)
const COMMON_GAZE: OptionItem[] = [
  { key: 'camera', labelKey: 'camera' },
  { key: 'product', labelKey: 'product' },
  { key: 'away', labelKey: 'away' },
  { key: 'down', labelKey: 'down' },
  { key: 'up', labelKey: 'up' },
]

// ============================================================
// 카테고리별 특화 옵션
// ============================================================

// 제품 단독 (productOnly)
const PRODUCT_ONLY_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'background',
      labelKey: 'background',
      options: [
        { key: 'studio_white', labelKey: 'studioWhite' },
        { key: 'studio_gradient', labelKey: 'studioGradient' },
        { key: 'marble', labelKey: 'marble' },
        { key: 'wood', labelKey: 'wood' },
        { key: 'fabric', labelKey: 'fabric' },
        { key: 'minimal', labelKey: 'minimal' },
      ],
      defaultValue: 'studio_white',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: COMMON_LIGHTING,
      defaultValue: 'soft',
      allowCustom: true,
    },
    {
      key: 'angle',
      labelKey: 'angle',
      options: [
        { key: 'front', labelKey: 'front' },
        { key: 'three_quarter', labelKey: 'threeQuarter' },
        { key: 'side', labelKey: 'side' },
        { key: 'top_down', labelKey: 'topDown' },
        { key: 'low_angle', labelKey: 'lowAngle' },
      ],
      defaultValue: 'three_quarter',
      allowCustom: true,
    },
    {
      key: 'style',
      labelKey: 'style',
      options: [
        { key: 'minimalist', labelKey: 'minimalist' },
        { key: 'luxury', labelKey: 'luxury' },
        { key: 'lifestyle', labelKey: 'lifestyle' },
        { key: 'editorial', labelKey: 'editorial' },
      ],
      defaultValue: 'minimalist',
      allowCustom: true,
    },
  ],
}

// 들고 있는 샷 (holding)
const HOLDING_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'pose',
      labelKey: 'pose',
      options: [
        { key: 'natural_hold', labelKey: 'naturalHold' },
        { key: 'showing_camera', labelKey: 'showingCamera' },
        { key: 'near_face', labelKey: 'nearFace' },
        { key: 'both_hands', labelKey: 'bothHands' },
        { key: 'casual_hold', labelKey: 'casualHold' },
      ],
      defaultValue: 'natural_hold',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'camera',
      allowCustom: true,
    },
    {
      key: 'background',
      labelKey: 'background',
      options: COMMON_BACKGROUNDS,
      defaultValue: 'studio',
      allowCustom: true,
    },
    {
      key: 'expression',
      labelKey: 'expression',
      options: [
        { key: 'smile', labelKey: 'smile' },
        { key: 'natural', labelKey: 'natural' },
        { key: 'confident', labelKey: 'confident' },
        { key: 'friendly', labelKey: 'friendly' },
      ],
      defaultValue: 'natural',
      allowCustom: true,
    },
    {
      key: 'framing',
      labelKey: 'framing',
      options: [
        { key: 'closeup', labelKey: 'closeup' },
        { key: 'medium', labelKey: 'medium' },
        { key: 'full_body', labelKey: 'fullBody' },
      ],
      defaultValue: 'medium',
      allowCustom: true,
    },
  ],
}

// 사용 중인 샷 (using)
const USING_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'action',
      labelKey: 'action',
      options: [
        { key: 'applying', labelKey: 'applying' },
        { key: 'demonstrating', labelKey: 'demonstrating' },
        { key: 'enjoying', labelKey: 'enjoying' },
        { key: 'testing', labelKey: 'testing' },
      ],
      defaultValue: 'applying',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'product',
      allowCustom: true,
    },
    {
      key: 'setting',
      labelKey: 'setting',
      options: [
        { key: 'bathroom', labelKey: 'bathroom' },
        { key: 'vanity', labelKey: 'vanity' },
        { key: 'bedroom', labelKey: 'bedroom' },
        { key: 'outdoor', labelKey: 'outdoor' },
      ],
      defaultValue: 'vanity',
      allowCustom: true,
    },
    {
      key: 'mood',
      labelKey: 'mood',
      options: COMMON_MOOD,
      defaultValue: 'casual',
      allowCustom: true,
    },
    {
      key: 'focus',
      labelKey: 'focus',
      options: [
        { key: 'product_focus', labelKey: 'productFocus' },
        { key: 'model_focus', labelKey: 'modelFocus' },
        { key: 'balanced', labelKey: 'balanced' },
      ],
      defaultValue: 'balanced',
      allowCustom: true,
    },
  ],
}

// 착용샷 (wearing)
const WEARING_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'pose',
      labelKey: 'pose',
      options: [
        { key: 'standing', labelKey: 'standing' },
        { key: 'walking', labelKey: 'walking' },
        { key: 'sitting', labelKey: 'sitting' },
        { key: 'dynamic', labelKey: 'dynamic' },
      ],
      defaultValue: 'standing',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'camera',
      allowCustom: true,
    },
    {
      key: 'setting',
      labelKey: 'setting',
      options: [
        { key: 'studio', labelKey: 'studio' },
        { key: 'street', labelKey: 'street' },
        { key: 'indoor', labelKey: 'indoor' },
        { key: 'nature', labelKey: 'nature' },
      ],
      defaultValue: 'studio',
      allowCustom: true,
    },
    {
      key: 'style',
      labelKey: 'style',
      options: [
        { key: 'editorial', labelKey: 'editorial' },
        { key: 'commercial', labelKey: 'commercial' },
        { key: 'streetwear', labelKey: 'streetwear' },
        { key: 'elegant', labelKey: 'elegant' },
      ],
      defaultValue: 'commercial',
      allowCustom: true,
    },
    {
      key: 'framing',
      labelKey: 'framing',
      options: [
        { key: 'full_body', labelKey: 'fullBody' },
        { key: 'three_quarter', labelKey: 'threeQuarter' },
        { key: 'upper_body', labelKey: 'upperBody' },
      ],
      defaultValue: 'full_body',
      allowCustom: true,
    },
    {
      key: 'productPlacement',
      labelKey: 'productPlacement',
      options: [
        { key: 'none', labelKey: 'noProduct' },
        { key: 'holding', labelKey: 'holdingProduct' },
        { key: 'bag', labelKey: 'inBag' },
        { key: 'accessory', labelKey: 'asAccessory' },
        { key: 'nearby', labelKey: 'nearbyProduct' },
      ],
      defaultValue: 'none',
      allowCustom: true,
    },
  ],
}

// 비포/애프터 (beforeAfter)
const BEFORE_AFTER_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'layout',
      labelKey: 'layout',
      options: [
        { key: 'side_by_side', labelKey: 'sideBySide' },
        { key: 'split_screen', labelKey: 'splitScreen' },
      ],
      defaultValue: 'side_by_side',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'camera',
      allowCustom: true,
    },
    {
      key: 'focus',
      labelKey: 'focus',
      options: [
        { key: 'skin', labelKey: 'skin' },
        { key: 'hair', labelKey: 'hair' },
        { key: 'overall', labelKey: 'overall' },
      ],
      defaultValue: 'overall',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: [
        { key: 'consistent', labelKey: 'consistent' },
        { key: 'natural', labelKey: 'natural' },
      ],
      defaultValue: 'consistent',
      allowCustom: true,
    },
  ],
}

// 라이프스타일 (lifestyle)
const LIFESTYLE_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'scene',
      labelKey: 'scene',
      options: [
        { key: 'morning_routine', labelKey: 'morningRoutine' },
        { key: 'relaxing', labelKey: 'relaxing' },
        { key: 'working', labelKey: 'working' },
        { key: 'socializing', labelKey: 'socializing' },
        { key: 'exercising', labelKey: 'exercising' },
      ],
      defaultValue: 'morning_routine',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'away',
      allowCustom: true,
    },
    {
      key: 'location',
      labelKey: 'location',
      options: [
        { key: 'living_room', labelKey: 'livingRoom' },
        { key: 'kitchen', labelKey: 'kitchen' },
        { key: 'bedroom', labelKey: 'bedroom' },
        { key: 'outdoor_terrace', labelKey: 'outdoorTerrace' },
        { key: 'coffee_shop', labelKey: 'coffeeShop' },
      ],
      defaultValue: 'living_room',
      allowCustom: true,
    },
    {
      key: 'time',
      labelKey: 'time',
      options: [
        { key: 'morning', labelKey: 'morning' },
        { key: 'afternoon', labelKey: 'afternoon' },
        { key: 'evening', labelKey: 'evening' },
        { key: 'golden_hour', labelKey: 'goldenHour' },
      ],
      defaultValue: 'morning',
      allowCustom: true,
    },
    {
      key: 'mood',
      labelKey: 'mood',
      options: [
        { key: 'cozy', labelKey: 'cozy' },
        { key: 'vibrant', labelKey: 'vibrant' },
        { key: 'peaceful', labelKey: 'peaceful' },
        { key: 'sophisticated', labelKey: 'sophisticated' },
      ],
      defaultValue: 'cozy',
      allowCustom: true,
    },
  ],
}

// 언박싱 (unboxing)
const UNBOXING_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'action',
      labelKey: 'action',
      options: [
        { key: 'opening', labelKey: 'opening' },
        { key: 'revealing', labelKey: 'revealing' },
        { key: 'presenting', labelKey: 'presenting' },
        { key: 'excited', labelKey: 'excited' },
      ],
      defaultValue: 'revealing',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'product',
      allowCustom: true,
    },
    {
      key: 'setting',
      labelKey: 'setting',
      options: [
        { key: 'desk', labelKey: 'desk' },
        { key: 'bed', labelKey: 'bed' },
        { key: 'couch', labelKey: 'couch' },
        { key: 'table', labelKey: 'table' },
      ],
      defaultValue: 'desk',
      allowCustom: true,
    },
    {
      key: 'style',
      labelKey: 'style',
      options: [
        { key: 'influencer', labelKey: 'influencer' },
        { key: 'professional', labelKey: 'professional' },
        { key: 'casual', labelKey: 'casual' },
      ],
      defaultValue: 'influencer',
      allowCustom: true,
    },
  ],
}

// 비교 (comparison)
const COMPARISON_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'layout',
      labelKey: 'layout',
      options: [
        { key: 'side_by_side', labelKey: 'sideBySide' },
        { key: 'stacked', labelKey: 'stacked' },
      ],
      defaultValue: 'side_by_side',
      allowCustom: true,
    },
    {
      key: 'style',
      labelKey: 'style',
      options: [
        { key: 'clean', labelKey: 'clean' },
        { key: 'detailed', labelKey: 'detailed' },
        { key: 'infographic', labelKey: 'infographic' },
      ],
      defaultValue: 'clean',
      allowCustom: true,
    },
    {
      key: 'background',
      labelKey: 'background',
      options: [
        { key: 'white', labelKey: 'white' },
        { key: 'gradient', labelKey: 'gradient' },
        { key: 'neutral', labelKey: 'neutral' },
      ],
      defaultValue: 'white',
      allowCustom: true,
    },
  ],
}

// 시즌/테마 (seasonal)
const SEASONAL_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'season',
      labelKey: 'season',
      options: [
        { key: 'spring', labelKey: 'spring' },
        { key: 'summer', labelKey: 'summer' },
        { key: 'fall', labelKey: 'fall' },
        { key: 'winter', labelKey: 'winter' },
      ],
      defaultValue: 'spring',
      allowCustom: true,
    },
    {
      key: 'theme',
      labelKey: 'theme',
      options: [
        { key: 'holiday', labelKey: 'holiday' },
        { key: 'valentines', labelKey: 'valentines' },
        { key: 'new_year', labelKey: 'newYear' },
        { key: 'festive', labelKey: 'festive' },
        { key: 'none', labelKey: 'none' },
      ],
      defaultValue: 'none',
      allowCustom: true,
    },
    {
      key: 'atmosphere',
      labelKey: 'atmosphere',
      options: [
        { key: 'warm', labelKey: 'warm' },
        { key: 'fresh', labelKey: 'fresh' },
        { key: 'cozy', labelKey: 'cozy' },
        { key: 'bright', labelKey: 'bright' },
      ],
      defaultValue: 'warm',
      allowCustom: true,
    },
  ],
}

// ============================================================
// 카테고리별 옵션 매핑
// ============================================================

export const CATEGORY_OPTIONS: Record<ImageAdType, CategoryOptions> = {
  productOnly: PRODUCT_ONLY_OPTIONS,
  holding: HOLDING_OPTIONS,
  using: USING_OPTIONS,
  wearing: WEARING_OPTIONS,
  beforeAfter: BEFORE_AFTER_OPTIONS,
  lifestyle: LIFESTYLE_OPTIONS,
  unboxing: UNBOXING_OPTIONS,
  comparison: COMPARISON_OPTIONS,
  seasonal: SEASONAL_OPTIONS,
}

// ============================================================
// 프롬프트 생성 함수
// ============================================================

/**
 * 선택된 옵션들을 기반으로 프롬프트 생성
 *
 * @param adType - 광고 유형
 * @param selectedOptions - 선택된 옵션 (키: 그룹 키, 값: 옵션 키 또는 '__custom__')
 * @param additionalPrompt - 추가 프롬프트
 * @param customOptions - 커스텀 옵션 (키: 그룹 키, 값: 사용자 입력 텍스트)
 */
export function buildPromptFromOptions(
  adType: ImageAdType,
  selectedOptions: Record<string, string>,
  additionalPrompt?: string,
  customOptions?: Record<string, string>,
  productName?: string // 제품명 (착용샷에서 제품과 함께 촬영 시)
): string {
  const parts: string[] = []

  // 기본 지시사항 (텍스트 없이)
  parts.push('Do not include any text, letters, words, numbers, or typography in the image.')

  // 카테고리별 기본 프롬프트
  const basePrompt = getBasePrompt(adType, productName)
  if (basePrompt) {
    parts.push(basePrompt)
  }

  // 선택된 옵션들을 프롬프트에 반영
  const categoryOptions = CATEGORY_OPTIONS[adType]
  if (categoryOptions) {
    for (const group of categoryOptions.groups) {
      const selectedValue = selectedOptions[group.key] || group.defaultValue

      // 커스텀 옵션 처리
      if (selectedValue === '__custom__' && customOptions?.[group.key]) {
        // 커스텀 텍스트를 직접 프롬프트에 추가
        parts.push(customOptions[group.key])
      } else {
        // 프리셋 옵션 사용
        const optionPrompt = getOptionPrompt(adType, group.key, selectedValue)
        if (optionPrompt) {
          parts.push(optionPrompt)
        }
      }
    }
  }

  // 추가 프롬프트
  if (additionalPrompt?.trim()) {
    parts.push(additionalPrompt.trim())
  }

  return parts.join(' ')
}

/**
 * 카테고리별 기본 프롬프트
 */
function getBasePrompt(adType: ImageAdType, productName?: string): string {
  switch (adType) {
    case 'productOnly':
      return 'Create a professional product photography showcasing the product from the reference image. High-quality commercial product shot.'
    case 'holding':
      return 'Create an advertisement image where the model from the reference is naturally holding and presenting the product.'
    case 'using':
      return 'Create an advertisement image where the model from the reference is actively using and demonstrating the product.'
    case 'wearing':
      if (productName) {
        return `Create a fashion advertisement image showcasing the model wearing the outfit from the reference image. The model should also be naturally holding or presenting "${productName}" as an accessory or complementary product in the shot.`
      }
      return 'Create a fashion advertisement image showcasing the model wearing the outfit from the reference image.'
    case 'beforeAfter':
      return 'Create a before and after comparison image showing the transformation effect.'
    case 'lifestyle':
      return 'Create a lifestyle advertisement showing the model naturally incorporating the product into their daily routine.'
    case 'unboxing':
      return 'Create an unboxing or product reveal style advertisement with the model presenting the product.'
    case 'comparison':
      return 'Create a product comparison style advertisement highlighting differences.'
    case 'seasonal':
      return 'Create a seasonal themed advertisement with appropriate atmosphere and decorations.'
    default:
      return ''
  }
}

/**
 * 옵션별 프롬프트 조각 생성
 */
function getOptionPrompt(adType: ImageAdType, groupKey: string, optionValue: string): string {
  // 옵션 값을 영어 설명으로 변환
  const prompts: Record<string, Record<string, string>> = {
    // 공통 배경
    background: {
      studio: 'Clean studio background.',
      studio_white: 'Pure white studio background.',
      studio_gradient: 'Soft gradient studio background.',
      outdoor: 'Beautiful outdoor setting.',
      home: 'Cozy home interior.',
      office: 'Modern office environment.',
      cafe: 'Stylish cafe atmosphere.',
      nature: 'Natural outdoor environment.',
      marble: 'Elegant marble surface.',
      wood: 'Warm wooden surface.',
      fabric: 'Textured fabric background.',
      minimal: 'Minimal clean background.',
      white: 'White background.',
      gradient: 'Gradient background.',
      neutral: 'Neutral toned background.',
    },
    // 조명
    lighting: {
      soft: 'Soft diffused lighting.',
      natural: 'Natural daylight.',
      dramatic: 'Dramatic studio lighting.',
      warm: 'Warm golden lighting.',
      cool: 'Cool toned lighting.',
      consistent: 'Consistent even lighting.',
    },
    // 포즈 (holding, wearing)
    pose: {
      natural_hold: 'Naturally holding the product.',
      showing_camera: 'Showing the product to camera.',
      near_face: 'Product held near the face.',
      both_hands: 'Holding with both hands.',
      casual_hold: 'Casually holding the product.',
      standing: 'Standing pose.',
      walking: 'Walking naturally.',
      sitting: 'Sitting comfortably.',
      dynamic: 'Dynamic movement pose.',
    },
    // 표정
    expression: {
      smile: 'Warm genuine smile.',
      natural: 'Natural relaxed expression.',
      confident: 'Confident expression.',
      friendly: 'Friendly approachable look.',
    },
    // 시선 방향
    gaze: {
      camera: 'Looking directly at the camera with engaging eye contact.',
      product: 'Looking at the product with interest and attention.',
      away: 'Looking away naturally, candid and relaxed.',
      down: 'Looking downward with a thoughtful or gentle expression.',
      up: 'Looking upward with a hopeful or dreamy expression.',
    },
    // 프레이밍
    framing: {
      closeup: 'Close-up shot.',
      medium: 'Medium shot framing.',
      full_body: 'Full body shot.',
      three_quarter: 'Three-quarter view.',
      upper_body: 'Upper body framing.',
    },
    // 앵글
    angle: {
      front: 'Front facing angle.',
      three_quarter: 'Three-quarter view angle.',
      side: 'Side profile angle.',
      top_down: 'Top-down bird\'s eye view.',
      low_angle: 'Low angle upward shot.',
    },
    // 스타일
    style: {
      minimalist: 'Minimalist clean style.',
      luxury: 'Luxurious premium style.',
      lifestyle: 'Lifestyle casual style.',
      editorial: 'Editorial fashion style.',
      commercial: 'Commercial advertisement style.',
      streetwear: 'Urban streetwear style.',
      elegant: 'Elegant sophisticated style.',
      influencer: 'Social media influencer style.',
      professional: 'Professional polished style.',
      casual: 'Casual relaxed style.',
      clean: 'Clean simple style.',
      detailed: 'Detailed informative style.',
      infographic: 'Infographic visual style.',
    },
    // 액션 (using, unboxing)
    action: {
      applying: 'Applying the product.',
      demonstrating: 'Demonstrating how to use.',
      enjoying: 'Enjoying the product.',
      testing: 'Testing the product.',
      opening: 'Opening the package.',
      revealing: 'Revealing the product inside.',
      presenting: 'Presenting the product.',
      excited: 'Excited reaction to the product.',
    },
    // 세팅
    setting: {
      bathroom: 'Bathroom setting.',
      vanity: 'Vanity table setting.',
      bedroom: 'Bedroom setting.',
      desk: 'Desk setup.',
      bed: 'On the bed.',
      couch: 'On the couch.',
      table: 'On a table.',
      street: 'Urban street setting.',
      indoor: 'Indoor setting.',
    },
    // 포커스
    focus: {
      product_focus: 'Focus on the product.',
      model_focus: 'Focus on the model.',
      balanced: 'Balanced focus on both.',
      skin: 'Focus on skin transformation.',
      hair: 'Focus on hair transformation.',
      overall: 'Overall transformation view.',
    },
    // 씬 (lifestyle)
    scene: {
      morning_routine: 'Morning routine scene.',
      relaxing: 'Relaxing at home.',
      working: 'Working from home.',
      socializing: 'Social gathering.',
      exercising: 'Exercise or fitness scene.',
    },
    // 장소 (lifestyle)
    location: {
      living_room: 'Living room setting.',
      kitchen: 'Kitchen setting.',
      bedroom: 'Bedroom setting.',
      outdoor_terrace: 'Outdoor terrace.',
      coffee_shop: 'Coffee shop setting.',
    },
    // 시간대
    time: {
      morning: 'Morning daylight.',
      afternoon: 'Afternoon light.',
      evening: 'Evening atmosphere.',
      golden_hour: 'Golden hour warm light.',
    },
    // 무드
    mood: {
      luxury: 'Luxurious premium feel.',
      casual: 'Casual relaxed vibe.',
      professional: 'Professional business atmosphere.',
      friendly: 'Friendly welcoming mood.',
      energetic: 'Energetic vibrant feel.',
      cozy: 'Cozy comfortable atmosphere.',
      vibrant: 'Vibrant colorful energy.',
      peaceful: 'Peaceful serene mood.',
      sophisticated: 'Sophisticated elegant feel.',
      warm: 'Warm inviting atmosphere.',
      fresh: 'Fresh clean feeling.',
    },
    // 제품 배치 (착용샷에서 제품과 함께)
    productPlacement: {
      none: '', // 제품 없음 - 프롬프트 추가 안함
      holding: 'The model is naturally holding and showcasing the product in their hands.',
      bag: 'The product is visible inside the model\'s bag or being taken out from it.',
      accessory: 'The product is styled as an accessory, complementing the outfit.',
      nearby: 'The product is placed nearby the model, visible in the frame.',
    },
    // 레이아웃
    layout: {
      side_by_side: 'Side by side layout.',
      split_screen: 'Split screen comparison.',
      stacked: 'Vertically stacked layout.',
    },
    // 계절
    season: {
      spring: 'Spring seasonal theme with fresh flowers.',
      summer: 'Summer seasonal theme with bright sunshine.',
      fall: 'Fall/Autumn seasonal theme with warm colors.',
      winter: 'Winter seasonal theme with cozy elements.',
    },
    // 테마
    theme: {
      holiday: 'Holiday festive decorations.',
      valentines: 'Valentine\'s Day romantic theme.',
      new_year: 'New Year celebration theme.',
      festive: 'General festive celebration.',
      none: '',
    },
    // 분위기
    atmosphere: {
      warm: 'Warm cozy atmosphere.',
      fresh: 'Fresh clean atmosphere.',
      cozy: 'Cozy comfortable feeling.',
      bright: 'Bright cheerful atmosphere.',
    },
  }

  return prompts[groupKey]?.[optionValue] || ''
}

/**
 * 카테고리의 기본 선택 값 가져오기
 */
export function getDefaultOptions(adType: ImageAdType): Record<string, string> {
  const categoryOptions = CATEGORY_OPTIONS[adType]
  if (!categoryOptions) return {}

  const defaults: Record<string, string> = {}
  for (const group of categoryOptions.groups) {
    defaults[group.key] = group.defaultValue
  }
  return defaults
}
