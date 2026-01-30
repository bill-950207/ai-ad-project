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
// 공통 옵션 (개선된 버전)
// ============================================================

const COMMON_BACKGROUNDS: OptionItem[] = [
  { key: 'studio_white', labelKey: 'studioWhite' },
  { key: 'studio_gradient', labelKey: 'studioGradient' },
  { key: 'luxury_interior', labelKey: 'luxuryInterior' },
  { key: 'modern_minimal', labelKey: 'modernMinimal' },
  { key: 'nature_blur', labelKey: 'natureBlur' },
  { key: 'urban_city', labelKey: 'urbanCity' },
  { key: 'abstract_art', labelKey: 'abstractArt' },
  { key: 'bokeh_lights', labelKey: 'bokehLights' },
]

const COMMON_LIGHTING: OptionItem[] = [
  { key: 'soft_diffused', labelKey: 'softDiffused' },
  { key: 'natural_window', labelKey: 'naturalWindow' },
  { key: 'dramatic_contrast', labelKey: 'dramaticContrast' },
  { key: 'golden_hour', labelKey: 'goldenHour' },
  { key: 'rim_light', labelKey: 'rimLight' },
  { key: 'neon_glow', labelKey: 'neonGlow' },
  { key: 'high_key', labelKey: 'highKey' },
  { key: 'low_key', labelKey: 'lowKey' },
]

const COMMON_MOOD: OptionItem[] = [
  { key: 'luxury_premium', labelKey: 'luxuryPremium' },
  { key: 'warm_friendly', labelKey: 'warmFriendly' },
  { key: 'modern_sleek', labelKey: 'modernSleek' },
  { key: 'vibrant_energetic', labelKey: 'vibrantEnergetic' },
  { key: 'calm_serene', labelKey: 'calmSerene' },
  { key: 'trendy_bold', labelKey: 'trendyBold' },
  { key: 'elegant_timeless', labelKey: 'elegantTimeless' },
  { key: 'playful_fun', labelKey: 'playfulFun' },
]

// 시선 방향 옵션 (아바타 사용 시)
const COMMON_GAZE: OptionItem[] = [
  { key: 'camera_direct', labelKey: 'cameraDirect' },
  { key: 'camera_soft', labelKey: 'cameraSoft' },
  { key: 'product_focus', labelKey: 'productFocus' },
  { key: 'away_candid', labelKey: 'awayCandid' },
  { key: 'down_thoughtful', labelKey: 'downThoughtful' },
  { key: 'up_dreamy', labelKey: 'upDreamy' },
]

// 색상 톤 옵션 (NEW)
const COMMON_COLOR_TONE: OptionItem[] = [
  { key: 'bright_vivid', labelKey: 'brightVivid' },
  { key: 'warm_golden', labelKey: 'warmGolden' },
  { key: 'cool_blue', labelKey: 'coolBlue' },
  { key: 'muted_pastel', labelKey: 'mutedPastel' },
  { key: 'high_contrast', labelKey: 'highContrast' },
  { key: 'cinematic', labelKey: 'cinematic' },
  { key: 'vintage_film', labelKey: 'vintageFilm' },
  { key: 'monochrome', labelKey: 'monochrome' },
]

// 구도/컴포지션 옵션 (NEW)
const COMMON_COMPOSITION: OptionItem[] = [
  { key: 'centered', labelKey: 'centered' },
  { key: 'rule_of_thirds', labelKey: 'ruleOfThirds' },
  { key: 'asymmetric', labelKey: 'asymmetric' },
  { key: 'diagonal', labelKey: 'diagonal' },
  { key: 'framed', labelKey: 'framed' },
  { key: 'negative_space', labelKey: 'negativeSpace' },
]

// 의상 옵션 (아바타 포함 광고용)
const COMMON_OUTFIT: OptionItem[] = [
  { key: 'keep_original', labelKey: 'keepOriginal' },  // 원본 의상 유지
  { key: 'casual_everyday', labelKey: 'casualEveryday' },
  { key: 'formal_elegant', labelKey: 'formalElegant' },
  { key: 'professional_business', labelKey: 'professionalBusiness' },
  { key: 'sporty_athletic', labelKey: 'sportyAthletic' },
  { key: 'cozy_comfortable', labelKey: 'cozyComfortable' },
  { key: 'trendy_fashion', labelKey: 'trendyFashion' },
  { key: 'minimal_simple', labelKey: 'minimalSimple' },
]

// 의상 옵션 그룹 (아바타 포함 광고에 추가)
const OUTFIT_GROUP: OptionGroup = {
  key: 'outfit',
  labelKey: 'outfit',
  options: COMMON_OUTFIT,
  defaultValue: 'keep_original',
  allowCustom: true,
}

// ============================================================
// 카테고리별 특화 옵션
// ============================================================

// 제품 단독 (productOnly) - 개선된 버전
const PRODUCT_ONLY_OPTIONS: CategoryOptions = {
  groups: [
    {
      key: 'background',
      labelKey: 'background',
      options: [
        { key: 'studio_white', labelKey: 'studioWhite' },
        { key: 'studio_gradient', labelKey: 'studioGradient' },
        { key: 'marble_luxury', labelKey: 'marbleLuxury' },
        { key: 'wood_natural', labelKey: 'woodNatural' },
        { key: 'fabric_texture', labelKey: 'fabricTexture' },
        { key: 'abstract_shapes', labelKey: 'abstractShapes' },
        { key: 'floating_3d', labelKey: 'floating3d' },
        { key: 'lifestyle_scene', labelKey: 'lifestyleScene' },
      ],
      defaultValue: 'studio_white',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: COMMON_LIGHTING,
      defaultValue: 'soft_diffused',
      allowCustom: true,
    },
    {
      key: 'angle',
      labelKey: 'angle',
      options: [
        { key: 'front_hero', labelKey: 'frontHero' },
        { key: 'three_quarter', labelKey: 'threeQuarter' },
        { key: 'side_profile', labelKey: 'sideProfile' },
        { key: 'top_down_flat', labelKey: 'topDownFlat' },
        { key: 'low_angle_dramatic', labelKey: 'lowAngleDramatic' },
        { key: 'macro_detail', labelKey: 'macroDetail' },
        { key: 'dynamic_tilt', labelKey: 'dynamicTilt' },
      ],
      defaultValue: 'three_quarter',
      allowCustom: true,
    },
    {
      key: 'style',
      labelKey: 'style',
      options: [
        { key: 'minimalist_clean', labelKey: 'minimalistClean' },
        { key: 'luxury_premium', labelKey: 'luxuryPremium' },
        { key: 'lifestyle_context', labelKey: 'lifestyleContext' },
        { key: 'editorial_artistic', labelKey: 'editorialArtistic' },
        { key: 'tech_futuristic', labelKey: 'techFuturistic' },
        { key: 'vintage_retro', labelKey: 'vintageRetro' },
      ],
      defaultValue: 'minimalist_clean',
      allowCustom: true,
    },
    {
      key: 'colorTone',
      labelKey: 'colorTone',
      options: COMMON_COLOR_TONE,
      defaultValue: 'bright_vivid',
      allowCustom: true,
    },
    {
      key: 'composition',
      labelKey: 'composition',
      options: COMMON_COMPOSITION,
      defaultValue: 'centered',
      allowCustom: true,
    },
  ],
}

// 들고 있는 샷 (holding) - 개선된 버전
const HOLDING_OPTIONS: CategoryOptions = {
  groups: [
    OUTFIT_GROUP,  // 의상 옵션 추가
    {
      key: 'pose',
      labelKey: 'pose',
      options: [
        { key: 'natural_elegant', labelKey: 'naturalElegant' },
        { key: 'showing_proudly', labelKey: 'showingProudly' },
        { key: 'near_face_beauty', labelKey: 'nearFaceBeauty' },
        { key: 'both_hands_precious', labelKey: 'bothHandsPrecious' },
        { key: 'casual_relaxed', labelKey: 'casualRelaxed' },
        { key: 'dramatic_showcase', labelKey: 'dramaticShowcase' },
        { key: 'unboxing_reveal', labelKey: 'unboxingReveal' },
      ],
      defaultValue: 'natural_elegant',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'camera_direct',
      allowCustom: true,
    },
    {
      key: 'background',
      labelKey: 'background',
      options: COMMON_BACKGROUNDS,
      defaultValue: 'studio_gradient',
      allowCustom: true,
    },
    {
      key: 'expression',
      labelKey: 'expression',
      options: [
        { key: 'warm_smile', labelKey: 'warmSmile' },
        { key: 'natural_glow', labelKey: 'naturalGlow' },
        { key: 'confident_bold', labelKey: 'confidentBold' },
        { key: 'friendly_approachable', labelKey: 'friendlyApproachable' },
        { key: 'mysterious_allure', labelKey: 'mysteriousAllure' },
        { key: 'excited_joyful', labelKey: 'excitedJoyful' },
      ],
      defaultValue: 'natural_glow',
      allowCustom: true,
    },
    {
      key: 'framing',
      labelKey: 'framing',
      options: [
        { key: 'extreme_closeup', labelKey: 'extremeCloseup' },
        { key: 'closeup_portrait', labelKey: 'closeupPortrait' },
        { key: 'medium_waist', labelKey: 'mediumWaist' },
        { key: 'three_quarter', labelKey: 'threeQuarterBody' },
        { key: 'full_body', labelKey: 'fullBody' },
      ],
      defaultValue: 'medium_waist',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: COMMON_LIGHTING,
      defaultValue: 'soft_diffused',
      allowCustom: true,
    },
    {
      key: 'colorTone',
      labelKey: 'colorTone',
      options: COMMON_COLOR_TONE,
      defaultValue: 'bright_vivid',
      allowCustom: true,
    },
  ],
}

// 사용 중인 샷 (using) - 개선된 버전
const USING_OPTIONS: CategoryOptions = {
  groups: [
    OUTFIT_GROUP,  // 의상 옵션 추가
    {
      key: 'action',
      labelKey: 'action',
      options: [
        { key: 'applying_skincare', labelKey: 'applyingSkincare' },
        { key: 'demonstrating_how', labelKey: 'demonstratingHow' },
        { key: 'enjoying_moment', labelKey: 'enjoyingMoment' },
        { key: 'before_application', labelKey: 'beforeApplication' },
        { key: 'mid_application', labelKey: 'midApplication' },
        { key: 'result_showcase', labelKey: 'resultShowcase' },
        { key: 'routine_step', labelKey: 'routineStep' },
      ],
      defaultValue: 'applying_skincare',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'product_focus',
      allowCustom: true,
    },
    {
      key: 'setting',
      labelKey: 'setting',
      options: [
        { key: 'luxury_bathroom', labelKey: 'luxuryBathroom' },
        { key: 'modern_vanity', labelKey: 'modernVanity' },
        { key: 'cozy_bedroom', labelKey: 'cozyBedroom' },
        { key: 'spa_retreat', labelKey: 'spaRetreat' },
        { key: 'natural_outdoor', labelKey: 'naturalOutdoor' },
        { key: 'minimal_studio', labelKey: 'minimalStudio' },
      ],
      defaultValue: 'modern_vanity',
      allowCustom: true,
    },
    {
      key: 'mood',
      labelKey: 'mood',
      options: COMMON_MOOD,
      defaultValue: 'calm_serene',
      allowCustom: true,
    },
    {
      key: 'focus',
      labelKey: 'focus',
      options: [
        { key: 'product_hero', labelKey: 'productHero' },
        { key: 'model_emotion', labelKey: 'modelEmotion' },
        { key: 'balanced_harmony', labelKey: 'balancedHarmony' },
        { key: 'detail_texture', labelKey: 'detailTexture' },
        { key: 'environment_context', labelKey: 'environmentContext' },
      ],
      defaultValue: 'balanced_harmony',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: COMMON_LIGHTING,
      defaultValue: 'natural_window',
      allowCustom: true,
    },
    {
      key: 'colorTone',
      labelKey: 'colorTone',
      options: COMMON_COLOR_TONE,
      defaultValue: 'warm_golden',
      allowCustom: true,
    },
  ],
}

// 착용샷 (wearing) - 개선된 버전
const WEARING_OPTIONS: CategoryOptions = {
  groups: [
    OUTFIT_GROUP,  // 의상 옵션 추가 (착용 제품 외 나머지 의상)
    {
      key: 'pose',
      labelKey: 'pose',
      options: [
        { key: 'standing_elegant', labelKey: 'standingElegant' },
        { key: 'walking_motion', labelKey: 'walkingMotion' },
        { key: 'sitting_relaxed', labelKey: 'sittingRelaxed' },
        { key: 'dynamic_action', labelKey: 'dynamicAction' },
        { key: 'leaning_casual', labelKey: 'leaningCasual' },
        { key: 'power_pose', labelKey: 'powerPose' },
        { key: 'candid_moment', labelKey: 'candidMoment' },
      ],
      defaultValue: 'standing_elegant',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'camera_direct',
      allowCustom: true,
    },
    {
      key: 'setting',
      labelKey: 'setting',
      options: [
        { key: 'studio_clean', labelKey: 'studioClean' },
        { key: 'urban_street', labelKey: 'urbanStreet' },
        { key: 'luxury_interior', labelKey: 'luxuryInterior' },
        { key: 'nature_scenic', labelKey: 'natureScenic' },
        { key: 'rooftop_city', labelKey: 'rooftopCity' },
        { key: 'cafe_lifestyle', labelKey: 'cafeLifestyle' },
        { key: 'beach_resort', labelKey: 'beachResort' },
      ],
      defaultValue: 'studio_clean',
      allowCustom: true,
    },
    {
      key: 'style',
      labelKey: 'style',
      options: [
        { key: 'editorial_high', labelKey: 'editorialHigh' },
        { key: 'commercial_clean', labelKey: 'commercialClean' },
        { key: 'streetwear_urban', labelKey: 'streetwearUrban' },
        { key: 'elegant_luxury', labelKey: 'elegantLuxury' },
        { key: 'sporty_active', labelKey: 'sportyActive' },
        { key: 'bohemian_free', labelKey: 'bohemianFree' },
      ],
      defaultValue: 'commercial_clean',
      allowCustom: true,
    },
    {
      key: 'framing',
      labelKey: 'framing',
      options: [
        { key: 'full_body_wide', labelKey: 'fullBodyWide' },
        { key: 'three_quarter', labelKey: 'threeQuarterBody' },
        { key: 'upper_body', labelKey: 'upperBody' },
        { key: 'detail_focus', labelKey: 'detailFocus' },
      ],
      defaultValue: 'full_body_wide',
      allowCustom: true,
    },
    {
      key: 'productPlacement',
      labelKey: 'productPlacement',
      options: [
        { key: 'none', labelKey: 'noProduct' },
        { key: 'holding_showcase', labelKey: 'holdingShowcase' },
        { key: 'bag_styled', labelKey: 'bagStyled' },
        { key: 'accessory_complement', labelKey: 'accessoryComplement' },
        { key: 'nearby_artful', labelKey: 'nearbyArtful' },
      ],
      defaultValue: 'none',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: COMMON_LIGHTING,
      defaultValue: 'natural_window',
      allowCustom: true,
    },
    {
      key: 'colorTone',
      labelKey: 'colorTone',
      options: COMMON_COLOR_TONE,
      defaultValue: 'cinematic',
      allowCustom: true,
    },
  ],
}

// 라이프스타일 (lifestyle) - 개선된 버전
const LIFESTYLE_OPTIONS: CategoryOptions = {
  groups: [
    OUTFIT_GROUP,  // 의상 옵션 추가
    {
      key: 'scene',
      labelKey: 'scene',
      options: [
        { key: 'morning_ritual', labelKey: 'morningRitual' },
        { key: 'relaxing_moment', labelKey: 'relaxingMoment' },
        { key: 'work_from_home', labelKey: 'workFromHome' },
        { key: 'social_gathering', labelKey: 'socialGathering' },
        { key: 'fitness_wellness', labelKey: 'fitnessWellness' },
        { key: 'travel_adventure', labelKey: 'travelAdventure' },
        { key: 'self_care_spa', labelKey: 'selfCareSpa' },
        { key: 'date_night', labelKey: 'dateNight' },
      ],
      defaultValue: 'morning_ritual',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'away_candid',
      allowCustom: true,
    },
    {
      key: 'location',
      labelKey: 'location',
      options: [
        { key: 'modern_living', labelKey: 'modernLiving' },
        { key: 'designer_kitchen', labelKey: 'designerKitchen' },
        { key: 'luxe_bedroom', labelKey: 'luxeBedroom' },
        { key: 'rooftop_terrace', labelKey: 'rooftopTerrace' },
        { key: 'trendy_cafe', labelKey: 'trendyCafe' },
        { key: 'beach_poolside', labelKey: 'beachPoolside' },
        { key: 'mountain_retreat', labelKey: 'mountainRetreat' },
        { key: 'urban_loft', labelKey: 'urbanLoft' },
      ],
      defaultValue: 'modern_living',
      allowCustom: true,
    },
    {
      key: 'time',
      labelKey: 'time',
      options: [
        { key: 'sunrise_fresh', labelKey: 'sunriseFresh' },
        { key: 'bright_midday', labelKey: 'brightMidday' },
        { key: 'golden_hour', labelKey: 'goldenHour' },
        { key: 'blue_hour', labelKey: 'blueHour' },
        { key: 'cozy_evening', labelKey: 'cozyEvening' },
        { key: 'night_ambiance', labelKey: 'nightAmbiance' },
      ],
      defaultValue: 'golden_hour',
      allowCustom: true,
    },
    {
      key: 'mood',
      labelKey: 'mood',
      options: COMMON_MOOD,
      defaultValue: 'warm_friendly',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: COMMON_LIGHTING,
      defaultValue: 'golden_hour',
      allowCustom: true,
    },
    {
      key: 'colorTone',
      labelKey: 'colorTone',
      options: COMMON_COLOR_TONE,
      defaultValue: 'warm_golden',
      allowCustom: true,
    },
  ],
}

// 언박싱 (unboxing) - 개선된 버전
const UNBOXING_OPTIONS: CategoryOptions = {
  groups: [
    OUTFIT_GROUP,  // 의상 옵션 추가
    {
      key: 'action',
      labelKey: 'action',
      options: [
        { key: 'opening_anticipation', labelKey: 'openingAnticipation' },
        { key: 'revealing_surprise', labelKey: 'revealingSurprise' },
        { key: 'presenting_proudly', labelKey: 'presentingProudly' },
        { key: 'excited_reaction', labelKey: 'excitedReaction' },
        { key: 'examining_detail', labelKey: 'examiningDetail' },
        { key: 'first_touch', labelKey: 'firstTouch' },
        { key: 'comparing_items', labelKey: 'comparingItems' },
      ],
      defaultValue: 'revealing_surprise',
      allowCustom: true,
    },
    {
      key: 'gaze',
      labelKey: 'gaze',
      options: COMMON_GAZE,
      defaultValue: 'product_focus',
      allowCustom: true,
    },
    {
      key: 'setting',
      labelKey: 'setting',
      options: [
        { key: 'modern_desk', labelKey: 'modernDesk' },
        { key: 'cozy_bed', labelKey: 'cozyBed' },
        { key: 'stylish_couch', labelKey: 'stylishCouch' },
        { key: 'marble_table', labelKey: 'marbleTable' },
        { key: 'floor_flatlay', labelKey: 'floorFlatlay' },
        { key: 'vanity_setup', labelKey: 'vanitySetup' },
      ],
      defaultValue: 'modern_desk',
      allowCustom: true,
    },
    {
      key: 'style',
      labelKey: 'style',
      options: [
        { key: 'influencer_trendy', labelKey: 'influencerTrendy' },
        { key: 'professional_clean', labelKey: 'professionalClean' },
        { key: 'casual_authentic', labelKey: 'casualAuthentic' },
        { key: 'luxury_premium', labelKey: 'luxuryPremium' },
        { key: 'asmr_satisfying', labelKey: 'asmrSatisfying' },
      ],
      defaultValue: 'influencer_trendy',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: COMMON_LIGHTING,
      defaultValue: 'soft_diffused',
      allowCustom: true,
    },
    {
      key: 'colorTone',
      labelKey: 'colorTone',
      options: COMMON_COLOR_TONE,
      defaultValue: 'bright_vivid',
      allowCustom: true,
    },
  ],
}

// 시즌/테마 (seasonal) - 개선된 버전
const SEASONAL_OPTIONS: CategoryOptions = {
  groups: [
    OUTFIT_GROUP,  // 의상 옵션 추가
    {
      key: 'season',
      labelKey: 'season',
      options: [
        { key: 'spring_bloom', labelKey: 'springBloom' },
        { key: 'summer_vibrant', labelKey: 'summerVibrant' },
        { key: 'fall_warm', labelKey: 'fallWarm' },
        { key: 'winter_cozy', labelKey: 'winterCozy' },
      ],
      defaultValue: 'spring_bloom',
      allowCustom: true,
    },
    {
      key: 'theme',
      labelKey: 'theme',
      options: [
        { key: 'holiday_festive', labelKey: 'holidayFestive' },
        { key: 'valentines_romantic', labelKey: 'valentinesRomantic' },
        { key: 'new_year_celebration', labelKey: 'newYearCelebration' },
        { key: 'halloween_spooky', labelKey: 'halloweenSpooky' },
        { key: 'chuseok_traditional', labelKey: 'chuseokTraditional' },
        { key: 'christmas_magical', labelKey: 'christmasMagical' },
        { key: 'none', labelKey: 'none' },
      ],
      defaultValue: 'none',
      allowCustom: true,
    },
    {
      key: 'atmosphere',
      labelKey: 'atmosphere',
      options: [
        { key: 'magical_dreamy', labelKey: 'magicalDreamy' },
        { key: 'warm_cozy', labelKey: 'warmCozy' },
        { key: 'fresh_energetic', labelKey: 'freshEnergetic' },
        { key: 'elegant_sophisticated', labelKey: 'elegantSophisticated' },
        { key: 'playful_fun', labelKey: 'playfulFun' },
        { key: 'romantic_soft', labelKey: 'romanticSoft' },
      ],
      defaultValue: 'warm_cozy',
      allowCustom: true,
    },
    {
      key: 'background',
      labelKey: 'background',
      options: [
        { key: 'seasonal_props', labelKey: 'seasonalProps' },
        { key: 'nature_setting', labelKey: 'natureSetting' },
        { key: 'studio_themed', labelKey: 'studioThemed' },
        { key: 'lifestyle_context', labelKey: 'lifestyleContext' },
        { key: 'abstract_festive', labelKey: 'abstractFestive' },
      ],
      defaultValue: 'seasonal_props',
      allowCustom: true,
    },
    {
      key: 'lighting',
      labelKey: 'lighting',
      options: COMMON_LIGHTING,
      defaultValue: 'warm_golden',
      allowCustom: true,
    },
    {
      key: 'colorTone',
      labelKey: 'colorTone',
      options: COMMON_COLOR_TONE,
      defaultValue: 'warm_golden',
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
  lifestyle: LIFESTYLE_OPTIONS,
  unboxing: UNBOXING_OPTIONS,
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
    case 'wearing': {
      const productRef = productName ? `"${productName}"` : 'the product'
      return `Create a fashion advertisement image showcasing ${productRef} from Figure 1 being WORN by a model.

CRITICAL WEARING REQUIREMENT:
The product MUST be worn in its NATURAL, INTENDED way - exactly how a real person would wear this product in real life.

FRAMING PRIORITY - THE PRODUCT IS THE STAR:
- Focus the camera on the PRODUCT and the body part wearing it
- It is PERFECTLY ACCEPTABLE to crop out other body parts that are not relevant to the product
- Footwear (shoes, sneakers, boots) → Frame the FEET and LEGS. Face/upper body can be cropped out or not visible. Show from knees down or full legs.
- Headwear (hats, caps, beanies) → Frame the HEAD. Lower body can be cropped.
- Eyewear (glasses, sunglasses) → Frame the FACE closely.
- Jewelry/Accessories → Frame the specific body part (neck, ears, wrist, fingers)
- Clothing → Frame to show the garment properly on the body

DO NOT:
- Place the product next to or near the model as a prop
- Have the model hold the product in their hands (unless it's a bag/purse meant to be held)
- Show the product floating or disconnected from the model
- Force the entire body or face into frame if it makes the product look awkward

IMPORTANT: Prioritize making the PRODUCT look good and naturally worn. A partial body shot (legs only, hands only, face closeup) is often MORE effective than forcing a full body shot.`
    }
    case 'lifestyle':
      return 'Create a lifestyle advertisement showing the model naturally incorporating the product into their daily routine.'
    case 'unboxing':
      return 'Create an unboxing or product reveal style advertisement with the model presenting the product.'
    case 'seasonal':
      return 'Create a seasonal themed advertisement with appropriate atmosphere and decorations.'
    default:
      return ''
  }
}

/**
 * 옵션별 프롬프트 조각 생성 (개선된 버전)
 */
function getOptionPrompt(adType: ImageAdType, groupKey: string, optionValue: string): string {
  // 옵션 값을 영어 설명으로 변환
  const prompts: Record<string, Record<string, string>> = {
    // 배경 (개선된 버전)
    background: {
      // 기존 옵션
      studio: 'Clean seamless backdrop with professional lighting effect, no visible equipment.',
      studio_white: 'Pure white seamless backdrop with soft shadows, no visible equipment or stands.',
      studio_gradient: 'Elegant gradient backdrop transitioning from light to dark, no visible equipment.',
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
      // 새로운 옵션
      luxury_interior: 'Luxurious high-end interior with elegant furniture and sophisticated decor.',
      modern_minimal: 'Modern minimalist space with clean lines and contemporary design.',
      nature_blur: 'Beautiful blurred natural background with soft bokeh effect, creating depth.',
      urban_city: 'Stylish urban cityscape with modern architecture in the background.',
      abstract_art: 'Artistic abstract background with creative shapes and colors.',
      bokeh_lights: 'Dreamy bokeh light background with soft glowing circles.',
      marble_luxury: 'Premium marble surface with elegant veining patterns and luxurious feel.',
      wood_natural: 'Warm natural wood texture surface with organic grain patterns.',
      fabric_texture: 'Rich fabric texture background with sophisticated textile patterns.',
      abstract_shapes: 'Modern abstract geometric shapes creating a dynamic visual backdrop.',
      floating_3d: '3D floating elements creating depth and futuristic visual appeal.',
      lifestyle_scene: 'Natural lifestyle environment showing product in context of daily life.',
      // 착용샷용
      studio_clean: 'Clean seamless neutral backdrop with professional lighting effect, no visible equipment.',
      urban_street: 'Trendy urban street setting with modern city elements.',
      nature_scenic: 'Beautiful scenic nature location with natural elements.',
      rooftop_city: 'Stylish rooftop with city skyline panorama view.',
      cafe_lifestyle: 'Trendy cafe or restaurant setting with lifestyle vibe.',
      beach_resort: 'Beautiful beach or resort setting with vacation atmosphere.',
      // 시즌용
      seasonal_props: 'Seasonal decorative props and elements matching the theme.',
      nature_setting: 'Natural seasonal outdoor setting.',
      studio_themed: 'Clean backdrop with themed seasonal decorations, no visible equipment.',
      lifestyle_context: 'Lifestyle setting with seasonal context.',
      abstract_festive: 'Abstract festive background with themed colors.',
      // 비교용
      pure_white: 'Pure white clean background for clear product visibility.',
      soft_gradient: 'Soft subtle gradient background.',
      neutral_gray: 'Neutral gray background for professional look.',
      colored_accent: 'Background with subtle brand color accent.',
      texture_subtle: 'Subtle textured background adding visual interest.',
    },
    // 조명 (개선된 버전)
    lighting: {
      // 기존 옵션
      soft: 'Soft diffused lighting.',
      natural: 'Natural daylight.',
      dramatic: 'Dramatic lighting with bold shadows, no visible equipment.',
      warm: 'Warm golden lighting.',
      cool: 'Cool toned lighting.',
      consistent: 'Consistent even lighting.',
      // 새로운 옵션
      soft_diffused: 'Beautifully soft diffused lighting creating gentle shadows and flattering illumination.',
      natural_window: 'Natural window light creating soft, authentic illumination with gentle shadows.',
      dramatic_contrast: 'High contrast dramatic lighting with bold shadows creating depth and dimension.',
      golden_hour: 'Warm golden hour sunlight with magical warm tones and long shadows.',
      rim_light: 'Striking rim lighting effect outlining the subject with a glowing edge highlight.',
      neon_glow: 'Vibrant neon lighting creating colorful, modern, and edgy atmosphere.',
      high_key: 'Bright high-key lighting with minimal shadows for clean, airy feel.',
      low_key: 'Moody low-key lighting with dramatic shadows for sophisticated atmosphere.',
      warm_golden: 'Warm golden lighting creating inviting and cozy atmosphere.',
      // 비포애프터용
      consistent_studio: 'Consistent even lighting ensuring accurate comparison, no visible equipment.',
      natural_soft: 'Soft natural lighting for authentic look.',
      dramatic_highlight: 'Dramatic highlighting to emphasize transformation.',
      ring_light: 'Even circular lighting effect creating flattering illumination on face.',
    },
    // 포즈 (개선된 버전)
    pose: {
      // 기존 옵션
      natural_hold: 'Naturally holding the product.',
      showing_camera: 'Showing the product to camera.',
      near_face: 'Product held near the face.',
      both_hands: 'Holding with both hands.',
      casual_hold: 'Casually holding the product.',
      standing: 'Standing pose.',
      walking: 'Walking naturally.',
      sitting: 'Sitting comfortably.',
      dynamic: 'Dynamic movement pose.',
      // 새로운 옵션
      natural_elegant: 'Elegantly and naturally holding the product with grace and poise.',
      showing_proudly: 'Confidently showing the product to camera with pride.',
      near_face_beauty: 'Product held gracefully near the face, highlighting beauty benefits.',
      both_hands_precious: 'Carefully holding with both hands as if presenting something precious.',
      casual_relaxed: 'Relaxed casual pose with natural, effortless holding.',
      dramatic_showcase: 'Dramatic pose showcasing the product as the star.',
      unboxing_reveal: 'Exciting unboxing moment revealing the product.',
      // 착용샷용
      standing_elegant: 'Elegant standing pose with confident posture and graceful stance.',
      walking_motion: 'Natural walking motion capturing dynamic movement and flow.',
      sitting_relaxed: 'Relaxed sitting pose in comfortable, approachable position.',
      dynamic_action: 'Dynamic action pose with energetic movement and excitement.',
      leaning_casual: 'Casual leaning pose creating relaxed, approachable vibe.',
      power_pose: 'Confident power pose exuding strength and self-assurance.',
      candid_moment: 'Natural candid moment captured spontaneously.',
    },
    // 표정 (개선된 버전) - 자연스러운 표정 강조, AI스러운 미소 방지
    expression: {
      // 기존 옵션
      smile: 'Subtle natural smile, NOT forced or exaggerated.',
      natural: 'Natural relaxed neutral expression, candid and authentic.',
      confident: 'Confident calm expression with subtle intensity.',
      friendly: 'Soft friendly look, approachable but not overly cheerful.',
      // 새로운 옵션
      warm_smile: 'Subtle warm smile with relaxed eyes - natural and understated, NOT a big toothy grin.',
      natural_glow: 'Natural relaxed expression with soft contentment, authentic and candid.',
      confident_bold: 'Bold confident expression with calm intensity, NOT smiling.',
      friendly_approachable: 'Soft friendly expression, approachable and genuine, subtle warmth.',
      mysterious_allure: 'Mysterious alluring expression with subtle intrigue, neutral lips.',
      excited_joyful: 'Genuine subtle excitement, bright eyes with natural slight smile.',
    },
    // 시선 방향 (개선된 버전)
    gaze: {
      // 기존 옵션
      camera: 'Looking directly at the camera with engaging eye contact.',
      product: 'Looking at the product with interest and attention.',
      away: 'Looking away naturally, candid and relaxed.',
      down: 'Looking downward with a thoughtful or gentle expression.',
      up: 'Looking upward with a hopeful or dreamy expression.',
      // 새로운 옵션
      camera_direct: 'Directly engaging the camera with confident, captivating eye contact.',
      camera_soft: 'Soft gentle gaze toward camera creating intimate connection.',
      product_focus: 'Attentively focused on the product with genuine interest.',
      away_candid: 'Naturally looking away creating authentic candid moment.',
      down_thoughtful: 'Thoughtfully looking downward with gentle contemplative expression.',
      up_dreamy: 'Dreamily looking upward with hopeful, aspirational expression.',
    },
    // 프레이밍 (개선된 버전)
    framing: {
      // 기존 옵션
      closeup: 'Close-up shot.',
      medium: 'Medium shot framing.',
      full_body: 'Full body shot.',
      three_quarter: 'Three-quarter view.',
      upper_body: 'Upper body framing.',
      // 새로운 옵션
      extreme_closeup: 'Extreme close-up capturing fine details and textures.',
      closeup_portrait: 'Close-up portrait framing focusing on face and product.',
      medium_waist: 'Medium waist-up shot balancing subject and environment.',
      three_quarter_body: 'Three-quarter body shot showing outfit and pose.',
      full_body_wide: 'Full body shot with wider framing for context.',
      detail_focus: 'Detailed focus shot highlighting specific product features.',
    },
    // 앵글 (개선된 버전)
    angle: {
      // 기존 옵션
      front: 'Front facing angle.',
      three_quarter: 'Three-quarter view angle.',
      side: 'Side profile angle.',
      top_down: 'Top-down bird\'s eye view.',
      low_angle: 'Low angle upward shot.',
      // 새로운 옵션
      front_hero: 'Powerful front-facing hero angle making the product the star.',
      side_profile: 'Elegant side profile angle showing depth and dimension.',
      top_down_flat: 'Clean top-down flat lay perspective for clear product view.',
      low_angle_dramatic: 'Dramatic low angle creating powerful, imposing presence.',
      macro_detail: 'Macro close-up angle revealing intricate product details.',
      dynamic_tilt: 'Dynamic tilted angle adding energy and visual interest.',
    },
    // 스타일 (개선된 버전)
    style: {
      // 기존 옵션
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
      // 새로운 옵션
      minimalist_clean: 'Ultra-clean minimalist style with purposeful simplicity.',
      luxury_premium: 'High-end luxury style exuding premium quality and exclusivity.',
      lifestyle_context: 'Authentic lifestyle style showing product in real-life context.',
      editorial_artistic: 'Artistic editorial style with creative visual storytelling.',
      tech_futuristic: 'Futuristic tech-forward style with modern, innovative aesthetics.',
      vintage_retro: 'Nostalgic vintage retro style with timeless charm.',
      // 착용샷용
      editorial_high: 'High fashion editorial style with artistic vision.',
      commercial_clean: 'Clean commercial style optimized for advertising impact.',
      streetwear_urban: 'Urban streetwear style with trendy, youthful energy.',
      elegant_luxury: 'Elegant luxury style with sophisticated refinement.',
      sporty_active: 'Sporty active style with energetic, dynamic feel.',
      bohemian_free: 'Free-spirited bohemian style with artistic flair.',
      // 언박싱용
      influencer_trendy: 'Trendy influencer style popular on social media.',
      professional_clean: 'Clean professional style with polished presentation.',
      casual_authentic: 'Authentic casual style feeling genuine and relatable.',
      asmr_satisfying: 'Satisfying ASMR-style presentation with pleasing visuals.',
      // 비교용
      clean_minimal: 'Clean minimal style for clear product comparison.',
      detailed_specs: 'Detailed specification style highlighting features.',
      infographic_visual: 'Visual infographic style communicating information.',
      editorial_premium: 'Premium editorial style elevating product perception.',
      // 비포애프터용
      clinical_clean: 'Clinical clean style for credible transformation display.',
      lifestyle_natural: 'Natural lifestyle style for authentic before/after.',
      dramatic_transformation: 'Dramatic style emphasizing transformation impact.',
      subtle_enhancement: 'Subtle style for natural enhancement showcase.',
    },
    // 액션 (개선된 버전)
    action: {
      // 기존 옵션
      applying: 'Applying the product.',
      demonstrating: 'Demonstrating how to use.',
      enjoying: 'Enjoying the product.',
      testing: 'Testing the product.',
      opening: 'Opening the package.',
      revealing: 'Revealing the product inside.',
      presenting: 'Presenting the product.',
      excited: 'Excited reaction to the product.',
      // 새로운 옵션
      applying_skincare: 'Gently applying skincare product with elegant hand movements.',
      demonstrating_how: 'Demonstrating product usage with clear instructional pose.',
      enjoying_moment: 'Genuinely enjoying the moment of using the product.',
      before_application: 'Moment just before applying product, building anticipation.',
      mid_application: 'Mid-application moment capturing the product in use.',
      result_showcase: 'Showcasing the beautiful results after product use.',
      routine_step: 'Natural routine step incorporating product seamlessly.',
      // 언박싱용
      opening_anticipation: 'Opening package with excited anticipation.',
      revealing_surprise: 'Revealing product with delightful surprise.',
      presenting_proudly: 'Proudly presenting the unboxed product.',
      excited_reaction: 'Genuine excited reaction upon seeing the product.',
      examining_detail: 'Carefully examining product details with interest.',
      first_touch: 'First touch moment with the product.',
      comparing_items: 'Comparing items from the package.',
    },
    // 세팅 (개선된 버전)
    setting: {
      // 기존 옵션
      bathroom: 'Bathroom setting.',
      vanity: 'Vanity table setting.',
      bedroom: 'Bedroom setting.',
      desk: 'Desk setup.',
      bed: 'On the bed.',
      couch: 'On the couch.',
      table: 'On a table.',
      street: 'Urban street setting.',
      indoor: 'Indoor setting.',
      // 새로운 옵션
      luxury_bathroom: 'Luxurious spa-like bathroom with elegant fixtures.',
      modern_vanity: 'Modern vanity setup with stylish organization.',
      cozy_bedroom: 'Cozy inviting bedroom with warm atmosphere.',
      spa_retreat: 'Serene spa retreat setting for relaxation.',
      natural_outdoor: 'Beautiful natural outdoor setting.',
      minimal_studio: 'Clean minimal seamless backdrop environment, no visible equipment.',
      // 언박싱용
      modern_desk: 'Modern stylish desk setup.',
      cozy_bed: 'Cozy comfortable bed setting.',
      stylish_couch: 'Stylish couch or sofa area.',
      marble_table: 'Elegant marble table surface.',
      floor_flatlay: 'Clean floor setup for flat lay presentation.',
      vanity_setup: 'Organized vanity table setup.',
    },
    // 포커스 (개선된 버전)
    focus: {
      // 기존 옵션
      product_focus: 'Focus on the product.',
      model_focus: 'Focus on the model.',
      balanced: 'Balanced focus on both.',
      skin: 'Focus on skin transformation.',
      hair: 'Focus on hair transformation.',
      overall: 'Overall transformation view.',
      // 새로운 옵션
      product_hero: 'Hero focus on product as the main subject.',
      model_emotion: 'Focus on model\'s emotional connection with product.',
      balanced_harmony: 'Harmonious balance between model and product.',
      detail_texture: 'Detail focus on textures and fine details.',
      environment_context: 'Focus including environment for context.',
      // 비포애프터용
      skin_texture: 'Focus on skin texture improvements.',
      skin_tone: 'Focus on skin tone enhancements.',
      hair_health: 'Focus on hair health and shine.',
      overall_glow: 'Focus on overall radiant glow.',
      detail_closeup: 'Close-up detail focus for transformation.',
    },
    // 씬 (개선된 버전)
    scene: {
      // 기존 옵션
      morning_routine: 'Morning routine scene.',
      relaxing: 'Relaxing at home.',
      working: 'Working from home.',
      socializing: 'Social gathering.',
      exercising: 'Exercise or fitness scene.',
      // 새로운 옵션
      morning_ritual: 'Peaceful morning ritual with self-care focus.',
      relaxing_moment: 'Serene relaxing moment of tranquility.',
      work_from_home: 'Stylish work from home environment.',
      social_gathering: 'Warm social gathering with friends.',
      fitness_wellness: 'Active fitness and wellness scene.',
      travel_adventure: 'Exciting travel and adventure scene.',
      self_care_spa: 'Indulgent self-care spa moment.',
      date_night: 'Glamorous date night preparation.',
    },
    // 장소 (개선된 버전)
    location: {
      // 기존 옵션
      living_room: 'Living room setting.',
      kitchen: 'Kitchen setting.',
      bedroom: 'Bedroom setting.',
      outdoor_terrace: 'Outdoor terrace.',
      coffee_shop: 'Coffee shop setting.',
      // 새로운 옵션
      modern_living: 'Modern stylish living room with contemporary design.',
      designer_kitchen: 'Designer kitchen with premium appliances.',
      luxe_bedroom: 'Luxurious bedroom with elegant furnishings.',
      rooftop_terrace: 'Stunning rooftop terrace with city views.',
      trendy_cafe: 'Trendy Instagram-worthy cafe setting.',
      beach_poolside: 'Beautiful beach or poolside location.',
      mountain_retreat: 'Serene mountain retreat setting.',
      urban_loft: 'Stylish urban loft space.',
    },
    // 시간대 (개선된 버전)
    time: {
      // 기존 옵션
      morning: 'Morning daylight.',
      afternoon: 'Afternoon light.',
      evening: 'Evening atmosphere.',
      golden_hour: 'Golden hour warm light.',
      // 새로운 옵션
      sunrise_fresh: 'Fresh sunrise light with soft morning glow.',
      bright_midday: 'Bright midday light with clear visibility.',
      blue_hour: 'Magical blue hour with soft twilight tones.',
      cozy_evening: 'Cozy evening atmosphere with warm ambient light.',
      night_ambiance: 'Atmospheric night setting with ambient lighting.',
    },
    // 무드 (개선된 버전)
    mood: {
      // 기존 옵션
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
      // 새로운 옵션
      luxury_premium: 'Ultra-luxurious premium atmosphere exuding exclusivity.',
      warm_friendly: 'Warm and friendly atmosphere creating connection.',
      modern_sleek: 'Modern sleek atmosphere with contemporary sophistication.',
      vibrant_energetic: 'Vibrant energetic atmosphere full of life and excitement.',
      calm_serene: 'Calm serene atmosphere for peaceful contemplation.',
      trendy_bold: 'Trendy bold atmosphere with fashion-forward energy.',
      elegant_timeless: 'Elegant timeless atmosphere with classic sophistication.',
      playful_fun: 'Playful fun atmosphere with joyful energy.',
    },
    // 제품 배치 (개선된 버전)
    productPlacement: {
      // 기존 옵션
      none: '',
      holding: 'The model is naturally holding and showcasing the product in their hands.',
      bag: 'The product is visible inside the model\'s bag or being taken out from it.',
      accessory: 'The product is styled as an accessory, complementing the outfit.',
      nearby: 'The product is placed nearby the model, visible in the frame.',
      // 새로운 옵션
      holding_showcase: 'Elegantly holding and showcasing the product as the star.',
      bag_styled: 'Stylishly visible in or with the model\'s bag.',
      accessory_complement: 'Complementing the outfit as a stylish accessory.',
      nearby_artful: 'Artfully placed nearby creating visual harmony.',
    },
    // 레이아웃 (개선된 버전)
    layout: {
      // 기존 옵션
      side_by_side: 'Clean side by side comparison layout.',
      split_screen: 'Split screen comparison.',
      stacked: 'Vertically stacked layout.',
      // 새로운 옵션
      split_screen_diagonal: 'Dynamic diagonal split screen comparison.',
      slider_reveal: 'Interactive slider reveal style comparison.',
      overlay_fade: 'Elegant overlay fade transition comparison.',
      stacked_vertical: 'Vertically stacked for scrolling comparison.',
      grid_showcase: 'Grid layout showcasing multiple products.',
      spotlight_hero: 'Spotlight hero layout featuring main product.',
    },
    // 계절 (개선된 버전)
    season: {
      // 기존 옵션
      spring: 'Spring seasonal theme with fresh flowers.',
      summer: 'Summer seasonal theme with bright sunshine.',
      fall: 'Fall/Autumn seasonal theme with warm colors.',
      winter: 'Winter seasonal theme with cozy elements.',
      // 새로운 옵션
      spring_bloom: 'Beautiful spring with fresh blooming flowers and renewal energy.',
      summer_vibrant: 'Vibrant summer with bright sunshine and lively atmosphere.',
      fall_warm: 'Warm autumn with rich golden and orange tones.',
      winter_cozy: 'Cozy winter with warm textures and intimate atmosphere.',
    },
    // 테마 (개선된 버전)
    theme: {
      // 기존 옵션
      holiday: 'Holiday festive decorations.',
      valentines: 'Valentine\'s Day romantic theme.',
      new_year: 'New Year celebration theme.',
      festive: 'General festive celebration.',
      none: '',
      // 새로운 옵션
      holiday_festive: 'Joyful holiday festive decorations and atmosphere.',
      valentines_romantic: 'Romantic Valentine\'s theme with hearts and love.',
      new_year_celebration: 'Glamorous New Year celebration with sparkle.',
      halloween_spooky: 'Fun spooky Halloween theme with creative elements.',
      chuseok_traditional: 'Traditional Chuseok theme with Korean elements.',
      christmas_magical: 'Magical Christmas theme with warm festive spirit.',
    },
    // 분위기 (개선된 버전)
    atmosphere: {
      // 기존 옵션
      warm: 'Warm cozy atmosphere.',
      fresh: 'Fresh clean atmosphere.',
      cozy: 'Cozy comfortable feeling.',
      bright: 'Bright cheerful atmosphere.',
      // 새로운 옵션
      magical_dreamy: 'Magical dreamy atmosphere with ethereal quality.',
      warm_cozy: 'Warm and cozy atmosphere creating comfort.',
      fresh_energetic: 'Fresh energetic atmosphere with vibrant energy.',
      elegant_sophisticated: 'Elegant sophisticated atmosphere with refinement.',
      playful_fun: 'Playful fun atmosphere with joyful energy.',
      romantic_soft: 'Romantic soft atmosphere with gentle intimacy.',
    },
    // 색상 톤 (NEW)
    colorTone: {
      bright_vivid: 'Bright vivid colors with high saturation and energy.',
      warm_golden: 'Warm golden tones creating inviting cozy atmosphere.',
      cool_blue: 'Cool blue tones for modern sophisticated feel.',
      muted_pastel: 'Soft muted pastel tones for gentle elegant look.',
      high_contrast: 'High contrast dramatic color treatment.',
      cinematic: 'Cinematic color grading with film-like quality.',
      vintage_film: 'Vintage film aesthetic with nostalgic tones.',
      monochrome: 'Sophisticated monochrome or black and white treatment.',
    },
    // 구도/컴포지션 (NEW)
    composition: {
      centered: 'Centered composition with product as focal point.',
      rule_of_thirds: 'Rule of thirds composition for visual balance.',
      asymmetric: 'Asymmetric composition creating dynamic visual interest.',
      diagonal: 'Diagonal composition adding energy and movement.',
      framed: 'Framed composition using environmental elements.',
      negative_space: 'Negative space composition for minimalist impact.',
    },
    // 의상 (아바타 포함 광고용)
    outfit: {
      keep_original: '',  // 원본 의상 유지 시 프롬프트 추가 안함
      casual_everyday: 'Model wearing casual everyday outfit: comfortable t-shirt or blouse with jeans or casual pants, relaxed and approachable style.',
      formal_elegant: 'Model wearing formal elegant outfit: sophisticated dress or tailored suit, refined and polished appearance.',
      professional_business: 'Model wearing professional business attire: crisp blazer with dress shirt, polished and authoritative look.',
      sporty_athletic: 'Model wearing sporty athletic wear: comfortable activewear or athleisure, energetic and dynamic style.',
      cozy_comfortable: 'Model wearing cozy comfortable clothing: soft knit sweater or cardigan, warm and inviting appearance.',
      trendy_fashion: 'Model wearing trendy fashion-forward outfit: current season styles, stylish and on-trend look.',
      minimal_simple: 'Model wearing minimal simple outfit: clean solid-colored clothing without busy patterns, understated elegance.',
    },
  }

  // wearing 타입에서 outfit 선택 시, 착용 제품 외 의상임을 명확히
  if (adType === 'wearing' && groupKey === 'outfit' && optionValue !== 'keep_original') {
    const baseOutfitPrompt = prompts[groupKey]?.[optionValue] || ''
    if (baseOutfitPrompt) {
      return baseOutfitPrompt + ' (This outfit applies to clothing OTHER than the product being advertised. The advertised product must be worn as-is.)'
    }
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
