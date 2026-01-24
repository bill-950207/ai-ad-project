/**
 * 이미지 광고 카테고리 옵션 AI 자동 추천 API
 *
 * POST /api/image-ads/recommend-options
 * - 제품 정보와 광고 유형을 기반으로 최적의 카테고리 옵션 추천
 * - AI가 액션, 시선, 장소, 분위기 등 모든 설정을 자동으로 결정
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRecommendedCategoryOptions, generateMultipleRecommendedOptions } from '@/lib/gemini/client'
import { CATEGORY_OPTIONS } from '@/lib/image-ad/category-options'
import type { ImageAdType } from '@/components/ad-product/image-ad-type-modal'

// Option descriptions for LLM (in English for better model performance)
const OPTION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  // Outfit options (for avatar-included ads)
  outfit: {
    keep_original: 'Keep the original outfit from the avatar image',
    casual_everyday: 'Casual everyday wear (t-shirt, jeans, comfortable clothes)',
    formal_elegant: 'Formal elegant attire (dress, suit, sophisticated clothes)',
    professional_business: 'Professional business wear (office attire, blazer)',
    sporty_athletic: 'Sporty athletic wear (workout clothes, activewear)',
    cozy_comfortable: 'Cozy comfortable wear (loungewear, soft fabrics)',
    trendy_fashion: 'Trendy fashion-forward style (latest trends, stylish pieces)',
    minimal_simple: 'Minimal simple style (clean lines, neutral colors)',
  },
  // Pose options
  pose: {
    natural_hold: 'Naturally holding the product',
    showing_camera: 'Showing product to camera',
    near_face: 'Holding product near face',
    both_hands: 'Holding product with both hands',
    casual_hold: 'Casually holding the product',
    standing: 'Standing pose',
    walking: 'Walking pose',
    sitting: 'Sitting pose',
    dynamic: 'Dynamic action pose',
  },
  // Gaze options
  gaze: {
    camera: 'Looking at camera',
    product: 'Looking at product',
    away: 'Looking away (candid style)',
    down: 'Looking downward',
    up: 'Looking upward',
  },
  // Background options
  background: {
    studio: 'Studio background',
    studio_white: 'Pure white studio',
    studio_gradient: 'Gradient studio background',
    outdoor: 'Outdoor setting',
    home: 'Home interior',
    office: 'Office setting',
    cafe: 'Cafe setting',
    nature: 'Nature background',
    marble: 'Marble surface',
    wood: 'Wooden surface',
    fabric: 'Fabric background',
    minimal: 'Minimal background',
    white: 'White background',
    gradient: 'Gradient background',
    neutral: 'Neutral tone background',
  },
  // Expression options
  expression: {
    smile: 'Smiling expression',
    natural: 'Natural relaxed expression',
    confident: 'Confident expression',
    friendly: 'Friendly approachable expression',
  },
  // Framing options
  framing: {
    closeup: 'Close-up shot',
    medium: 'Medium shot',
    full_body: 'Full body shot',
    three_quarter: 'Three-quarter shot',
    upper_body: 'Upper body shot',
  },
  // Action options
  action: {
    applying: 'Applying the product',
    demonstrating: 'Demonstrating product usage',
    enjoying: 'Enjoying the product',
    testing: 'Testing the product',
    opening: 'Opening the package',
    revealing: 'Revealing the product',
    presenting: 'Presenting the product',
    excited: 'Excited reaction',
  },
  // Setting options
  setting: {
    bathroom: 'Bathroom',
    vanity: 'Vanity table',
    bedroom: 'Bedroom',
    desk: 'Desk',
    bed: 'On bed',
    couch: 'On couch',
    table: 'On table',
    street: 'Street',
    indoor: 'Indoor',
    studio: 'Studio',
    nature: 'Nature',
  },
  // Location options
  location: {
    living_room: 'Living room',
    kitchen: 'Kitchen',
    bedroom: 'Bedroom',
    outdoor_terrace: 'Outdoor terrace',
    coffee_shop: 'Coffee shop',
  },
  // Scene options
  scene: {
    morning_routine: 'Morning routine',
    relaxing: 'Relaxing',
    working: 'Working',
    socializing: 'Socializing',
    exercising: 'Exercising',
  },
  // Time options
  time: {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    golden_hour: 'Golden hour',
  },
  // Lighting options
  lighting: {
    soft: 'Soft diffused lighting',
    natural: 'Natural daylight',
    dramatic: 'Dramatic lighting',
    warm: 'Warm lighting',
    cool: 'Cool lighting',
    consistent: 'Consistent even lighting',
  },
  // Style options
  style: {
    minimalist: 'Minimalist',
    luxury: 'Luxury premium',
    lifestyle: 'Lifestyle',
    editorial: 'Editorial fashion',
    commercial: 'Commercial',
    streetwear: 'Streetwear',
    elegant: 'Elegant sophisticated',
    influencer: 'Influencer style',
    professional: 'Professional',
    casual: 'Casual relaxed',
    clean: 'Clean simple',
    detailed: 'Detailed',
    infographic: 'Infographic',
  },
  // Mood options
  mood: {
    luxury: 'Luxurious premium feel',
    casual: 'Casual relaxed vibe',
    professional: 'Professional atmosphere',
    friendly: 'Friendly welcoming mood',
    energetic: 'Energetic vibrant feel',
    cozy: 'Cozy comfortable atmosphere',
    vibrant: 'Vibrant colorful energy',
    peaceful: 'Peaceful serene mood',
    sophisticated: 'Sophisticated elegant feel',
    warm: 'Warm inviting atmosphere',
    fresh: 'Fresh clean feeling',
  },
  // Angle options
  angle: {
    front: 'Front facing',
    three_quarter: 'Three-quarter angle',
    side: 'Side profile',
    top_down: 'Top-down view',
    low_angle: 'Low angle upward',
  },
  // Focus options
  focus: {
    product_focus: 'Product focused',
    model_focus: 'Model focused',
    balanced: 'Balanced focus',
    skin: 'Skin focused',
    hair: 'Hair focused',
    overall: 'Overall view',
  },
  // Layout options
  layout: {
    side_by_side: 'Side by side',
    split_screen: 'Split screen',
    stacked: 'Vertically stacked',
  },
  // Season options
  season: {
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall/Autumn',
    winter: 'Winter',
  },
  // Theme options
  theme: {
    holiday: 'Holiday festive',
    valentines: 'Valentines romantic',
    new_year: 'New Year celebration',
    festive: 'Festive celebration',
    none: 'No specific theme',
  },
  // Atmosphere options
  atmosphere: {
    warm: 'Warm cozy',
    fresh: 'Fresh clean',
    cozy: 'Cozy comfortable',
    bright: 'Bright cheerful',
  },
  // Product placement options
  productPlacement: {
    none: 'No product',
    holding: 'Holding in hand',
    bag: 'In bag',
    accessory: 'As accessory',
    nearby: 'Placed nearby',
  },
}

export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      adType,
      productName,
      productDescription,
      productSellingPoints,  // 제품 셀링 포인트
      language = 'ko',
      multiple = false,  // 다중 시나리오 모드 (기본: false)
      hasAvatar = false,  // 아바타 포함 여부 (의상 옵션은 카테고리 옵션으로 포함됨)
      avatarInfo,  // 아바타 상세 정보 (type, avatarName, outfitName, aiOptions)
      productImageUrl,  // 제품 이미지 URL
      productUsageMethod,  // 제품 사용 방법 (using 타입 전용)
    } = body

    if (!adType) {
      return NextResponse.json({ error: 'Ad type is required' }, { status: 400 })
    }

    // 해당 광고 유형의 카테고리 옵션 가져오기
    const categoryOptions = CATEGORY_OPTIONS[adType as ImageAdType]
    if (!categoryOptions) {
      return NextResponse.json({ error: 'Invalid ad type' }, { status: 400 })
    }

    // 카테고리 그룹 정보 추출 (설명 포함) - outfit도 포함됨
    const categoryGroups = categoryOptions.groups.map(group => ({
      key: group.key,
      options: group.options.map(opt => ({
        key: opt.key,
        description: OPTION_DESCRIPTIONS[group.key]?.[opt.key] || opt.labelKey,
      })),
    }))

    // 다중 시나리오 모드일 때 3개의 시나리오 생성
    if (multiple) {
      const result = await generateMultipleRecommendedOptions({
        adType: adType as ImageAdType,
        productName,
        productDescription,
        productSellingPoints,  // 셀링 포인트 전달
        categoryGroups,
        language,
        hasAvatar,
        avatarInfo,  // 아바타 상세 정보 전달
        productImageUrl,  // 제품 이미지 URL 전달
        productUsageMethod,  // 제품 사용 방법 전달
      })

      return NextResponse.json(result)
    }

    // 단일 시나리오 모드 (기존 동작)
    const result = await generateRecommendedCategoryOptions({
      adType: adType as ImageAdType,
      productName,
      productDescription,
      productSellingPoints,  // 셀링 포인트 전달
      categoryGroups,
      language,
      hasAvatar,
      avatarInfo,
      productImageUrl,
      productUsageMethod,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI 자동 설정 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
