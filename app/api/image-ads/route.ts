/**
 * 이미지 광고 생성 API
 *
 * GET: 이미지 광고 목록 조회 (productId로 필터링 가능)
 * POST: 이미지 광고 생성 요청 (fal.ai Seedream 4.5 Edit)
 *
 * 캐싱: unstable_cache (5분 TTL) - 사용자별 + 페이지별 데이터
 */

import { unstable_cache } from 'next/cache'
import { submitSeedreamEditToQueue, type SeedreamAspectRatio } from '@/lib/fal/client'
import { type AiAvatarOptions } from '@/lib/avatar/prompt-builder'
import { createClient } from '@/lib/supabase/server'
import { generateImageAdPrompt, type ImageAdType as GeminiImageAdType } from '@/lib/gemini/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { IMAGE_AD_CREDIT_COST } from '@/lib/credits'
import { recordCreditUse } from '@/lib/credits/history'
import { getUserPlan } from '@/lib/subscription/queries'
import { plan_type, image_ad_status } from '@/lib/generated/prisma/client'
import { isAdminUser } from '@/lib/auth/admin'
import { getUserCacheTag, invalidateImageAdsCache, DEFAULT_USER_DATA_TTL } from '@/lib/cache/user-data'

// 이미지 크기를 Seedream aspect_ratio로 변환
type ImageAdSize = '1024x1024' | '1536x1024' | '1024x1536'
function imageSizeToAspectRatio(size: ImageAdSize): SeedreamAspectRatio {
  switch (size) {
    case '1024x1024':
      return '1:1'
    case '1536x1024':
      return '3:2'
    case '1024x1536':
      return '2:3'
    default:
      return '1:1'
  }
}

// 이미지 광고 유형
type ImageAdType =
  | 'productOnly'
  | 'holding'
  | 'using'
  | 'wearing'
  | 'lifestyle'
  | 'unboxing'
  | 'seasonal'

// 퀄리티 타입
type Quality = 'medium' | 'high'

// 요청 바디 타입
interface ImageAdRequestBody {
  adType: ImageAdType
  productId?: string  // wearing일 경우 없을 수 있음
  avatarIds?: string[]  // 다중 아바타 지원 (productOnly일 경우 빈 배열)
  avatarType?: 'avatar' | 'preset' | 'ai-generated'  // 아바타 유형 ('preset'은 default_avatars 테이블)
  outfitId?: string  // wearing일 경우 의상 ID
  prompt: string
  imageSize: ImageAdSize
  quality?: Quality
  numImages?: number
  referenceStyleImageUrl?: string  // 참조 스타일 이미지 URL (분위기/스타일만 참조)
  language?: 'ko' | 'en' | 'ja' | 'zh'  // 출력 언어 설정
  options?: {
    // 공통 옵션
    background?: string
    lighting?: string
    mood?: string
    angle?: string
    style?: string
    colorTone?: string
    composition?: string
    // 아바타 포함 광고 옵션
    outfit?: string  // 의상 옵션 (카테고리 옵션으로 포함)
    outfitCustom?: string  // 커스텀 의상 텍스트
    pose?: string
    gaze?: string
    expression?: string
    framing?: string
    setting?: string
    scene?: string
    location?: string
    time?: string
    action?: string
    focus?: string
    productPlacement?: string
    // 시즌/테마 옵션
    season?: string
    theme?: string
    atmosphere?: string
  }
  // AI 아바타 옵션 (avatarIds[0]이 'ai-generated'일 때)
  aiAvatarOptions?: {
    targetGender?: 'male' | 'female' | 'any'
    targetAge?: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus' | 'young' | 'middle' | 'mature' | 'any'
    style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
    ethnicity?: 'eastAsian' | 'southeastAsian' | 'southAsian' | 'caucasian' | 'black' | 'hispanic' | 'middleEastern' | 'korean' | 'asian' | 'western' | 'any'
    bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'muscular' | 'any'
    // 상세 옵션 (새로 추가)
    height?: 'short' | 'average' | 'tall' | 'any'
    hairStyle?: 'short' | 'medium' | 'long' | 'any'
    hairColor?: 'black' | 'brown' | 'blonde' | 'any'
    outfitStyle?: 'casual' | 'formal' | 'sporty' | 'professional' | 'elegant' | 'any'
  }
  draftId?: string  // 기존 DRAFT 업데이트용
}

// 상태 목록 (Prisma enum 타입)
const VALID_STATUSES: image_ad_status[] = [
  image_ad_status.DRAFT,
  image_ad_status.COMPLETED,
  image_ad_status.IN_QUEUE,
  image_ad_status.IN_PROGRESS,
  image_ad_status.FAILED,
  image_ad_status.IMAGES_READY,
]

/**
 * 이미지 광고 목록 조회 함수 (캐싱됨)
 */
function getCachedImageAds(
  userId: string,
  page: number,
  pageSize: number,
  productId: string | null,
  avatarId: string | null
) {
  const cacheKey = `image-ads-${userId}-p${page}-s${pageSize}-prod:${productId || 'all'}-avatar:${avatarId || 'all'}`

  return unstable_cache(
    async () => {
      const whereClause = {
        user_id: userId,
        status: { in: VALID_STATUSES },
        ...(productId && { product_id: productId }),
        ...(avatarId && { avatar_id: avatarId }),
      }

      const [ads, totalCount] = await Promise.all([
        prisma.image_ads.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            image_url: true,
            image_urls: true,
            image_url_originals: true,
            num_images: true,
            batch_request_ids: true,
            product_id: true,
            avatar_id: true,
            ad_type: true,
            status: true,
            wizard_step: true,
            fal_request_id: true,
            created_at: true,
            ad_products: {
              select: {
                id: true,
                name: true,
                image_url: true,
                rembg_image_url: true,
              },
            },
            avatars: {
              select: {
                id: true,
                name: true,
                image_url: true,
              },
            },
          },
        }),
        prisma.image_ads.count({ where: whereClause }),
      ])

      return { ads, totalCount }
    },
    [cacheKey],
    {
      revalidate: DEFAULT_USER_DATA_TTL,
      tags: [getUserCacheTag('image-ads', userId)]
    }
  )()
}

// GET: 이미지 광고 목록 조회 (페이징 지원)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const avatarId = searchParams.get('avatarId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)
    const limit = searchParams.get('limit') // legacy support

    // limit이 있으면 legacy 모드, 없으면 pagination 모드
    const usePagination = !limit
    const actualPageSize = limit ? parseInt(limit, 10) : pageSize

    // 캐시된 데이터 조회
    const { ads, totalCount } = await getCachedImageAds(
      user.id,
      usePagination ? page : 1,
      actualPageSize,
      productId,
      avatarId
    )

    // pagination 정보 포함하여 반환
    return NextResponse.json({
      ads,
      pagination: usePagination ? {
        page,
        pageSize: actualPageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / actualPageSize),
        hasMore: page * actualPageSize < (totalCount || 0),
      } : undefined,
    })
  } catch (error) {
    console.error('이미지 광고 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


/**
 * POST /api/image-ads
 * - 이미지 광고 생성 요청
 * - fal.ai gpt-image-1.5/edit 사용
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 요청 바디 파싱
    const body: ImageAdRequestBody = await request.json()
    const { adType, productId, avatarIds = [], avatarType, outfitId, prompt, imageSize, quality = 'medium', numImages = 2, referenceStyleImageUrl, language = 'ko', options, aiAvatarOptions, draftId } = body

    // 구독 플랜 확인
    const userPlan = await getUserPlan(user.id)
    const isFreeUser = userPlan.planType === plan_type.FREE
    const isAdmin = await isAdminUser(user.id)

    // FREE 사용자 제한: 최대 2개까지 생성, medium 품질만 가능
    const effectiveNumImages = isFreeUser ? Math.min(numImages, 2) : numImages
    const effectiveQuality = isFreeUser ? 'medium' : quality

    // numImages 범위 제한 (1-5)
    const validNumImages = Math.min(Math.max(1, effectiveNumImages), 5)

    // 크레딧 비용 계산 (effectiveQuality 사용)
    const creditCostPerImage = IMAGE_AD_CREDIT_COST[effectiveQuality] || IMAGE_AD_CREDIT_COST.medium
    const totalCreditCost = creditCostPerImage * validNumImages

    // 크레딧 사전 확인 (빠른 실패를 위해) - 어드민은 스킵
    if (!isAdmin) {
      const profile = await prisma.profiles.findUnique({
        where: { id: user.id },
        select: { credits: true },
      })

      if (!profile || (profile.credits ?? 0) < totalCreditCost) {
        return NextResponse.json(
          { error: 'Insufficient credits', required: totalCreditCost, available: profile?.credits ?? 0 },
          { status: 402 }
        )
      }
    }

    // 필수 필드 검증
    const isWearingType = adType === 'wearing'
    const isSeasonalType = adType === 'seasonal'
    const isProductOnlyType = adType === 'productOnly'

    if (!adType || !prompt || !imageSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    // 모든 타입에서 제품 필수 (productOnly, wearing, seasonal 포함)
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required for this ad type' },
        { status: 400 }
      )
    }

    // 이미지 URL 수집
    const imageUrls: string[] = []

    // Gemini 프롬프트 생성용 데이터
    let productName: string | undefined
    let productDescription: string | undefined
    let productImageUrl: string | undefined
    const avatarImageUrls: string[] = []
    let avatarCharacteristics: Record<string, unknown> | undefined  // 아바타 특성 (피부톤, 체형, 키 등)
    let outfitImageUrl: string | undefined

    // 제품 정보 조회 (모든 타입에서 필수)
    if (productId) {
      const { data: product, error: productError } = await supabase
        .from('ad_products')
        .select('id, name, description, rembg_image_url, image_url, image_url_original, status')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      if (product.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Product is not ready' },
          { status: 400 }
        )
      }

      // Gemini용 제품 정보 저장
      productName = product.name
      productDescription = product.description || undefined

      // 제품 이미지 추가 (PNG 원본 우선, 기존 제품 하위 호환)
      productImageUrl = product.image_url_original || product.rembg_image_url || product.image_url
      if (productImageUrl) {
        imageUrls.push(productImageUrl)
      }
    }

    // 아바타가 필요한 경우 (productOnly, seasonal 제외)
    // 첫 번째 아바타 ID (DB 저장용)
    let primaryAvatarId: string | null = null

    // AI 생성 아바타 여부 확인
    // 프리셋 아바타는 avatars 테이블의 id를 사용하므로 일반 아바타와 동일하게 처리
    const isAiGeneratedAvatar = avatarIds.length > 0 && (avatarIds[0] === 'ai-generated' || avatarType === 'ai-generated')
    console.log('=== 아바타 디버그 ===', {
      isAiGeneratedAvatar,
      avatarType,
      avatarIds,
      aiAvatarOptions,
      hasTargetGender: aiAvatarOptions?.targetGender,
      hasBodyType: aiAvatarOptions?.bodyType,
    })

    // 아바타가 필요한 유형인지 확인 (productOnly, seasonal은 아바타 선택사항)
    const requiresAvatar = !isProductOnlyType && !isSeasonalType
    const hasAvatar = avatarIds.length > 0

    if (requiresAvatar && !hasAvatar) {
      return NextResponse.json(
        { error: 'At least one avatar is required for this ad type' },
        { status: 400 }
      )
    }

    // 아바타가 제공된 경우에만 아바타 처리
    if (hasAvatar) {

      // AI 생성 아바타인 경우 - 이미지 생성 없이 텍스트 설명만 사용 (Seedream에서 직접 생성)
      if (isAiGeneratedAvatar) {
        // AI 생성 아바타는 DB에 null로 저장
        primaryAvatarId = null
        console.log('AI 아바타: 텍스트 설명만 사용 (이미지 생성 없음)', aiAvatarOptions)
        // aiAvatarDescription은 아래에서 생성되어 Gemini/Seedream에 전달됨
      }
      // 착용샷이고 의상이 선택된 경우, 의상 이미지 사용 (단일 아바타만)
      // 프리셋 아바타는 avatars 테이블의 id를 사용하므로 아래 일반 아바타 로직에서 처리됨
      else if (isWearingType && outfitId) {
        const avatarId = avatarIds[0]
        primaryAvatarId = avatarId

        const { data: avatar, error: avatarError } = await supabase
          .from('avatars')
          .select('id, name, image_url, image_url_original, status, options')
          .eq('id', avatarId)
          .eq('user_id', user.id)
          .single()

        if (avatarError || !avatar) {
          return NextResponse.json(
            { error: 'Avatar not found' },
            { status: 404 }
          )
        }

        if (avatar.status !== 'COMPLETED') {
          return NextResponse.json(
            { error: 'Avatar is not ready' },
            { status: 400 }
          )
        }

        // Gemini용 아바타 이미지 URL 및 특성 저장 (원본 우선)
        const avatarImage = avatar.image_url_original || avatar.image_url
        if (avatarImage) {
          avatarImageUrls.push(avatarImage)
        }
        // 아바타 특성 저장 (피부톤, 체형, 키 등)
        if (avatar.options) {
          avatarCharacteristics = avatar.options as Record<string, unknown>
        }

        const { data: outfit, error: outfitError } = await supabase
          .from('avatar_outfits')
          .select('id, name, image_url, image_url_original, status')
          .eq('id', outfitId)
          .eq('avatar_id', avatarId)
          .single()

        if (outfitError || !outfit) {
          return NextResponse.json(
            { error: 'Outfit not found' },
            { status: 404 }
          )
        }

        if (outfit.status !== 'COMPLETED') {
          return NextResponse.json(
            { error: 'Outfit is not ready' },
            { status: 400 }
          )
        }

        // Gemini용 의상 이미지 URL 저장 (원본 우선)
        outfitImageUrl = outfit.image_url_original || outfit.image_url || undefined

        // 의상 이미지 사용 (아바타 + 의상이 합성된 이미지, 원본 우선)
        // unshift로 첫 번째에 추가해서 Figure 1이 아바타(의상)가 되도록 함
        const outfitImage = outfit.image_url_original || outfit.image_url
        if (outfitImage) {
          imageUrls.unshift(outfitImage)
        }
      } else {
        // 다중 아바타 이미지 추가 (N+1 쿼리 방지 - 한 번에 조회)
        const { data: avatars, error: avatarsError } = await supabase
          .from('avatars')
          .select('id, name, image_url, image_url_original, status, options')
          .in('id', avatarIds)
          .eq('user_id', user.id)

        if (avatarsError) {
          return NextResponse.json(
            { error: 'Failed to fetch avatars' },
            { status: 500 }
          )
        }

        // 요청한 아바타가 모두 있는지 확인
        const avatarMap = new Map(avatars?.map(a => [a.id, a]) ?? [])

        // 아바타 이미지들을 순서대로 수집 (루프 내 unshift는 순서 역전 발생)
        const collectedAvatarImages: string[] = []

        for (const avatarId of avatarIds) {
          const avatar = avatarMap.get(avatarId)

          if (!avatar) {
            return NextResponse.json(
              { error: `Avatar not found: ${avatarId}` },
              { status: 404 }
            )
          }

          if (avatar.status !== 'COMPLETED') {
            return NextResponse.json(
              { error: `Avatar is not ready: ${avatar.name}` },
              { status: 400 }
            )
          }

          // 첫 번째 아바타를 primary로 설정
          if (!primaryAvatarId) {
            primaryAvatarId = avatarId
            // 첫 번째 아바타의 특성 저장 (피부톤, 체형, 키 등)
            if (avatar.options) {
              avatarCharacteristics = avatar.options as Record<string, unknown>
            }
          }

          // 일반 아바타 이미지 수집 (원본 우선)
          const avatarImage = avatar.image_url_original || avatar.image_url
          if (avatarImage) {
            collectedAvatarImages.push(avatarImage)
            // Gemini용 아바타 이미지 URL 저장
            avatarImageUrls.push(avatarImage)
          }
        }

        // 수집된 아바타 이미지들을 한 번에 앞에 추가 (순서 유지)
        // [product] → [avatar1, avatar2, ..., product]
        imageUrls.unshift(...collectedAvatarImages)
      }
    }

    // AI 생성 아바타가 아닌 경우에만 이미지 URL 필수
    if (imageUrls.length === 0 && !isAiGeneratedAvatar) {
      return NextResponse.json(
        { error: 'No valid images found' },
        { status: 400 }
      )
    }

    // AI 생성 아바타 설명 문자열 생성 (Gemini에 전달용)
    let aiAvatarDescription: string | undefined
    if (isAiGeneratedAvatar) {
      const genderMap: Record<string, string> = { male: 'male', female: 'female', any: '' }
      const ageMap: Record<string, string> = {
        teen: 'teenage',
        early20s: 'in their early 20s',
        late20s: 'in their late 20s',
        '30s': 'in their 30s',
        '40plus': 'in their 40s or older',
        young: 'in their 20s-30s',
        middle: 'in their 30s-40s',
        mature: 'in their 40s-50s',
        any: ''
      }
      const styleMap: Record<string, string> = { natural: 'natural and friendly', professional: 'professional and sophisticated', casual: 'casual and relaxed', elegant: 'elegant and luxurious', any: '' }
      const ethnicityMap: Record<string, string> = {
        eastAsian: 'East Asian',
        southeastAsian: 'Southeast Asian',
        southAsian: 'South Asian',
        caucasian: 'Caucasian',
        black: 'Black/African',
        hispanic: 'Hispanic/Latino',
        middleEastern: 'Middle Eastern',
        korean: 'Korean',
        asian: 'Asian',
        western: 'Western/Caucasian',
        any: ''
      }
      const bodyTypeMap: Record<string, string> = {
        slim: 'slim slender body with thin waist and lean figure',
        average: 'average body build',
        athletic: 'athletic toned body with defined muscles and fit physique',
        curvy: 'curvy voluptuous figure with prominent curves, full hips and bust',
        muscular: 'muscular well-built physique with strong defined muscles',
        any: ''
      }
      const heightMap: Record<string, string> = { short: 'petite/short', average: 'average height', tall: 'tall', any: '' }
      const hairStyleMap: Record<string, string> = { short: 'short hair', medium: 'medium-length hair', long: 'long hair', any: '' }
      const hairColorMap: Record<string, string> = { black: 'black hair', brown: 'brown hair', blonde: 'blonde hair', any: '' }
      const outfitStyleMap: Record<string, string> = { casual: 'casual outfit', formal: 'formal attire', sporty: 'sporty/athletic wear', professional: 'professional business attire', elegant: 'elegant outfit', any: '' }

      const avatarParts: string[] = []

      // 옵션이 있고 'any'가 아닌 값들만 추가
      if (aiAvatarOptions) {
        if (aiAvatarOptions.ethnicity && aiAvatarOptions.ethnicity !== 'any' && ethnicityMap[aiAvatarOptions.ethnicity]) {
          avatarParts.push(ethnicityMap[aiAvatarOptions.ethnicity])
        }
        if (aiAvatarOptions.targetGender && aiAvatarOptions.targetGender !== 'any' && genderMap[aiAvatarOptions.targetGender]) {
          avatarParts.push(genderMap[aiAvatarOptions.targetGender])
        }
        if (aiAvatarOptions.targetAge && aiAvatarOptions.targetAge !== 'any' && ageMap[aiAvatarOptions.targetAge]) {
          avatarParts.push(`person ${ageMap[aiAvatarOptions.targetAge]}`)
        }
        if (aiAvatarOptions.height && aiAvatarOptions.height !== 'any' && heightMap[aiAvatarOptions.height]) {
          avatarParts.push(heightMap[aiAvatarOptions.height])
        }
        if (aiAvatarOptions.bodyType && aiAvatarOptions.bodyType !== 'any' && bodyTypeMap[aiAvatarOptions.bodyType]) {
          avatarParts.push(`with ${bodyTypeMap[aiAvatarOptions.bodyType]}`)
        }
        if (aiAvatarOptions.hairStyle && aiAvatarOptions.hairStyle !== 'any' && hairStyleMap[aiAvatarOptions.hairStyle]) {
          avatarParts.push(hairStyleMap[aiAvatarOptions.hairStyle])
        }
        if (aiAvatarOptions.hairColor && aiAvatarOptions.hairColor !== 'any' && hairColorMap[aiAvatarOptions.hairColor]) {
          avatarParts.push(hairColorMap[aiAvatarOptions.hairColor])
        }
        if (aiAvatarOptions.outfitStyle && aiAvatarOptions.outfitStyle !== 'any' && outfitStyleMap[aiAvatarOptions.outfitStyle]) {
          avatarParts.push(`wearing ${outfitStyleMap[aiAvatarOptions.outfitStyle]}`)
        }
        if (aiAvatarOptions.style && aiAvatarOptions.style !== 'any' && styleMap[aiAvatarOptions.style]) {
          avatarParts.push(`${styleMap[aiAvatarOptions.style]} appearance`)
        }
      }

      // 의상 지정이 없는 경우 기본 완전한 의상 추가 (productOnly 제외)
      const hasOutfitSpecified = aiAvatarOptions?.outfitStyle && aiAvatarOptions.outfitStyle !== 'any'
      if (!hasOutfitSpecified && adType !== 'productOnly') {
        if (adType === 'wearing') {
          // 착용샷: 제품이 의상이므로 제품 제외한 코디 의상 추천
          avatarParts.push('wearing a complete coordinated outfit that complements the advertised product (select appropriate top/bottom/accessories EXCLUDING the product being worn)')
        } else {
          // 그 외: 제품에 어울리는 완전한 의상 추천
          avatarParts.push('wearing a stylish complete outfit appropriate for the scene (including both top and bottom clothing that complements the product)')
        }
      }

      // 모든 옵션이 '무관'이거나 설정되지 않은 경우 - Gemini가 제품에 맞게 자동 선택
      if (avatarParts.length === 0) {
        // 기본 설명을 제공하되, Gemini에게 제품에 맞게 구체화하도록 요청
        aiAvatarDescription = 'a person suitable for this product advertisement (automatically select ethnicity, gender, age, body type, height, hair, outfit, and style based on the product and target market)'
      } else {
        // 'person'이 없으면 추가
        if (!avatarParts.some(p => p.includes('person'))) {
          avatarParts.push('person')
        }
        aiAvatarDescription = avatarParts.join(' ')
      }
    }

    // Gemini를 사용하여 최적화된 프롬프트 생성
    let finalPrompt = prompt
    try {
      console.log('Gemini 프롬프트 생성 시작:', { adType, productName, hasProductImage: !!productImageUrl, avatarCount: avatarImageUrls.length, hasReferenceStyle: !!referenceStyleImageUrl, isAiGeneratedAvatar, aiAvatarDescription })

      const geminiResult = await generateImageAdPrompt({
        adType: adType as GeminiImageAdType,
        productName,
        productDescription,
        productImageUrl,
        avatarImageUrls: avatarImageUrls.length > 0 ? avatarImageUrls : undefined,
        avatarCharacteristics: avatarCharacteristics as import('@/lib/gemini/client').AvatarCharacteristics | undefined,
        outfitImageUrl,
        referenceStyleImageUrl,
        selectedOptions: options || {},  // 의상 옵션도 포함됨 (outfit key)
        additionalPrompt: prompt,
        aiAvatarDescription,
        language,
      })

      finalPrompt = geminiResult.optimizedPrompt
      console.log('Gemini 프롬프트 생성 완료:', { localizedDescription: geminiResult.localizedDescription })
    } catch (geminiError) {
      console.error('Gemini 프롬프트 생성 실패, 기본 프롬프트 사용:', geminiError)

      // Gemini 실패 시 기존 방식으로 폴백 - 모든 옵션을 프롬프트에 반영
      if (options) {
        const optionParts: string[] = []

        // 모델이 필요한 광고인지 확인 (productOnly 또는 seasonal+아바타없음은 모델 불필요)
        const isSeasonalWithoutAvatar = isSeasonalType && !hasAvatar
        const needsModelInFallback = !isProductOnlyType && !isSeasonalWithoutAvatar

        // 공통 옵션들
        if (options.background) optionParts.push(`${options.background} background`)
        if (options.lighting) optionParts.push(`${options.lighting} lighting`)
        if (options.mood) optionParts.push(`${options.mood} mood`)
        if (options.angle) optionParts.push(`${options.angle} angle`)

        // 모델이 필요한 광고에서 사용되는 옵션들
        if (needsModelInFallback) {
          if (options.pose) optionParts.push(`${options.pose} pose`)
          if (options.gaze) optionParts.push(`${options.gaze} gaze direction`)
          if (options.expression) optionParts.push(`${options.expression} expression`)
          if (options.framing) optionParts.push(`${options.framing} framing`)
          if (options.setting) optionParts.push(`${options.setting} setting`)
          if (options.scene) optionParts.push(`${options.scene} scene`)
          if (options.location) optionParts.push(`${options.location} location`)
          if (options.time) optionParts.push(`${options.time} time`)
          if (options.action) optionParts.push(`${options.action} action`)
          if (options.focus) optionParts.push(`${options.focus} focus`)
          if (options.style) optionParts.push(`${options.style} style`)
          if (options.colorTone) optionParts.push(`${options.colorTone} color tone`)
          if (options.composition) optionParts.push(`${options.composition} composition`)
          if (options.productPlacement) optionParts.push(`${options.productPlacement} product placement`)
        }

        // 시즌/테마 옵션 (seasonal은 아바타 없어도 테마 옵션 적용)
        if (isSeasonalType || needsModelInFallback) {
          if (options.season) optionParts.push(`${options.season} season`)
          if (options.theme) optionParts.push(`${options.theme} theme`)
          if (options.atmosphere) optionParts.push(`${options.atmosphere} atmosphere`)
        }

        if (optionParts.length > 0) {
          finalPrompt = `${prompt}. Style: ${optionParts.join(', ')}.`
        }

        // 모델이 필요한 광고에서 outfit 옵션 반영
        if (needsModelInFallback && options.outfit && options.outfit !== 'keep_original') {
          const outfitPrompts: Record<string, string> = {
            casual_everyday: 'Model wearing casual everyday outfit: comfortable t-shirt or blouse with jeans or casual pants, relaxed and approachable style.',
            formal_elegant: 'Model wearing formal elegant outfit: sophisticated dress or tailored suit, refined and polished appearance.',
            professional_business: 'Model wearing professional business attire: crisp blazer with dress shirt, polished and authoritative look.',
            sporty_athletic: 'Model wearing sporty athletic wear: comfortable activewear or athleisure, energetic and dynamic style.',
            cozy_comfortable: 'Model wearing cozy comfortable clothing: soft knit sweater or cardigan, warm and inviting appearance.',
            trendy_fashion: 'Model wearing trendy fashion-forward outfit: current season styles, stylish and on-trend look.',
            minimal_simple: 'Model wearing minimal simple outfit: clean solid-colored clothing without busy patterns, understated elegance.',
          }

          const outfitKey = options.outfit as string
          // 프리셋 의상인지 확인 (프리셋에 없으면 커스텀 텍스트로 간주)
          // 프론트엔드에서 __custom__ 값을 실제 텍스트로 대체하여 전달하므로
          // outfitPrompts에 없는 값은 커스텀 텍스트로 처리
          const outfitText = outfitPrompts[outfitKey]
            ? outfitPrompts[outfitKey]
            : `Model wearing ${outfitKey}.`  // 커스텀 텍스트 (프론트엔드에서 이미 대체됨)

          if (outfitText) {
            // 착용샷의 경우 제품 외 의상임을 명시
            const outfitSuffix = adType === 'wearing'
              ? ' (This outfit applies to clothing OTHER than the product being advertised.)'
              : ''
            finalPrompt = `${finalPrompt} ${outfitText}${outfitSuffix}`
          }
        }
      }

      // 광고 유형별 프롬프트 보강 (AI 아바타 고려)
      const typePromptPrefix = getTypePromptPrefix(adType, isAiGeneratedAvatar, aiAvatarDescription, hasAvatar)
      if (typePromptPrefix) {
        finalPrompt = `${typePromptPrefix} ${finalPrompt}`
      }
    }

    // 이미지 생성 요청 제출
    const aspectRatio = imageSizeToAspectRatio(imageSize)
    type QueueResponse = { request_id: string; provider: 'fal' | 'kie' }
    let queueResponses: QueueResponse[]

    // DB에 저장할 최종 프롬프트 (AI 아바타인 경우 아바타 설명 포함)
    let promptToSave = finalPrompt

    if (isAiGeneratedAvatar) {
      // AI 생성 아바타: fal.ai Seedream 5.0 Lite Edit 사용 (제품 이미지를 참조로 활용)
      // aiAvatarDescription은 이미 Gemini 호출 전에 생성됨

      // AI 아바타 프롬프트를 DB에 저장 (Gemini가 이미 아바타 설명을 포함한 프롬프트 생성)
      promptToSave = finalPrompt

      // AI 아바타용 입력 이미지 (제품 이미지가 있으면 사용)
      const aiInputUrls = productImageUrl ? [productImageUrl] : []
      const seedreamQuality = effectiveQuality === 'high' ? 'high' : 'basic'

      console.log('AI 아바타 이미지 광고 생성 (fal.ai Seedream 5.0 Lite):', { aiAvatarDescription, aspectRatio, inputUrls: aiInputUrls })

      const queuePromises = Array.from({ length: validNumImages }, async () => {
        const response = await submitSeedreamEditToQueue({
          prompt: finalPrompt,
          image_urls: aiInputUrls,
          aspect_ratio: aspectRatio,
          quality: seedreamQuality,
        })
        return { request_id: response.request_id, provider: 'fal' as const }
      })

      queueResponses = await Promise.all(queuePromises)

      // [주석 처리] 기존 kie.ai GPT-Image 1.5 코드
      // const kieAspectRatio: GPTImageAspectRatio = aspectRatio === '1:1' ? '1:1' : aspectRatio === '3:2' ? '3:2' : '2:3'
      // const kieQuality = quality === 'high' ? 'high' : 'medium'
      // const queuePromises = Array.from({ length: validNumImages }, async () => {
      //   const response = await submitKieGptImageToQueue(aiInputUrls, finalPrompt, kieAspectRatio, kieQuality)
      //   return { request_id: response.request_id, provider: 'kie' as const }
      // })
      // queueResponses = await Promise.all(queuePromises)
    } else {
      // 기존 아바타: fal.ai Seedream 5.0 Lite Edit 사용
      const seedreamQuality = effectiveQuality === 'high' ? 'high' : 'basic'

      const queuePromises = Array.from({ length: validNumImages }, async () => {
        const response = await submitSeedreamEditToQueue({
          prompt: finalPrompt,
          image_urls: imageUrls,
          aspect_ratio: aspectRatio,
          quality: seedreamQuality,
        })
        return { request_id: response.request_id, provider: 'fal' as const }
      })

      queueResponses = await Promise.all(queuePromises)
    }

    // DB에 이미지 광고 단일 레코드 생성 (배치 정보 포함)
    // 배치 요청 ID 배열 생성
    const batchRequestIds = queueResponses.map(r => ({
      provider: r.provider,
      requestId: r.request_id,
    }))

    // selected_options에 aiAvatarOptions도 함께 저장 (재시도 시 필요)
    const selectedOptionsToSave = {
      ...(options || {}),
      ...(isAiGeneratedAvatar && aiAvatarOptions ? { _aiAvatarOptions: aiAvatarOptions } : {}),
    }

    // draftId가 있으면 기존 DRAFT 업데이트, 없으면 새 레코드 생성
    let imageAdId: string | null = null
    let dbError: Error | null = null

    if (draftId) {
      // 기존 DRAFT 레코드를 IN_QUEUE로 업데이트 (status가 DRAFT인 경우만)
      const { data: updatedAd, error: updateError } = await supabase
        .from('image_ads')
        .update({
          product_id: productId || null,
          avatar_id: primaryAvatarId,
          outfit_id: outfitId || null,
          ad_type: adType,
          status: 'IN_QUEUE',
          fal_request_id: null,
          batch_request_ids: batchRequestIds,
          num_images: validNumImages,
          prompt: promptToSave,
          image_size: imageSize,
          quality: effectiveQuality,
          selected_options: selectedOptionsToSave,
          wizard_step: null,  // 생성 시작 시 wizard 상태 초기화
          wizard_state: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId)
        .eq('user_id', user.id)
        .eq('status', 'DRAFT')  // DRAFT 상태인 경우만 업데이트
        .select('id')
        .single()

      if (updateError) {
        // DRAFT가 아닌 경우 (이미 생성 중이거나 완료됨) - 새 레코드 생성으로 폴백
        console.log('DRAFT 업데이트 실패, 새 레코드 생성:', updateError.message)
        const { data: newAd, error: insertError } = await supabase
          .from('image_ads')
          .insert({
            user_id: user.id,
            product_id: productId || null,
            avatar_id: primaryAvatarId,
            outfit_id: outfitId || null,
            ad_type: adType,
            status: 'IN_QUEUE',
            fal_request_id: null,
            batch_request_ids: batchRequestIds,
            num_images: validNumImages,
            prompt: promptToSave,
            image_size: imageSize,
            quality: effectiveQuality,
            selected_options: selectedOptionsToSave,
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('이미지 광고 DB 저장 오류:', insertError)
          dbError = insertError
        } else if (newAd) {
          imageAdId = newAd.id
        }
      } else if (updatedAd) {
        imageAdId = updatedAd.id
      }
    } else {
      // 새 레코드 생성 (draftId 없는 경우 - 호환성 유지)
      const { data: imageAd, error: insertError } = await supabase
        .from('image_ads')
        .insert({
          user_id: user.id,
          product_id: productId || null,
          avatar_id: primaryAvatarId,
          outfit_id: outfitId || null,
          ad_type: adType,
          status: 'IN_QUEUE',
          fal_request_id: null,
          batch_request_ids: batchRequestIds,
          num_images: validNumImages,
          prompt: promptToSave,
          image_size: imageSize,
          quality: effectiveQuality,
          selected_options: selectedOptionsToSave,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('이미지 광고 DB 저장 오류:', insertError)
        dbError = insertError
      } else if (imageAd) {
        imageAdId = imageAd.id
      }
    }

    const imageAdRecords: string[] = []
    if (dbError) {
      console.error('이미지 광고 DB 오류:', dbError)
    } else if (imageAdId) {
      imageAdRecords.push(imageAdId)
    }

    // 크레딧 차감 (트랜잭션으로 재확인 후 원자적 차감 - Race Condition 방지) - 어드민은 스킵
    if (!isAdmin) {
      try {
        await prisma.$transaction(async (tx) => {
          const currentProfile = await tx.profiles.findUnique({
            where: { id: user.id },
            select: { credits: true },
          })

          if (!currentProfile || (currentProfile.credits ?? 0) < totalCreditCost) {
            throw new Error('INSUFFICIENT_CREDITS')
          }

          const balanceAfter = (currentProfile.credits ?? 0) - totalCreditCost

          await tx.profiles.update({
            where: { id: user.id },
            data: { credits: { decrement: totalCreditCost } },
          })

          // 크레딧 히스토리 기록
          await recordCreditUse({
            userId: user.id,
            featureType: 'IMAGE_AD',
            amount: totalCreditCost,
            balanceAfter,
            relatedEntityId: imageAdRecords[0],  // 첫 번째 이미지 광고 ID
            description: `이미지 광고 생성 (${validNumImages}장, ${effectiveQuality === 'high' ? '고화질' : '중화질'})`,
          }, tx)
        }, { timeout: 10000 })
      } catch (creditError) {
        // 크레딧 부족 시 생성된 레코드 실패 처리
        if (creditError instanceof Error && creditError.message === 'INSUFFICIENT_CREDITS') {
          if (imageAdRecords.length > 0) {
            await supabase
              .from('image_ads')
              .update({ status: 'FAILED', error_message: 'Insufficient credits' })
              .in('id', imageAdRecords)
          }
          return NextResponse.json(
            { error: 'Insufficient credits (concurrent request detected)' },
            { status: 402 }
          )
        }
        throw creditError
      }
    }

    console.log('이미지 광고 크레딧 차감:', { userId: user.id, cost: totalCreditCost, numImages: validNumImages })

    // 캐시 무효화
    invalidateImageAdsCache(user.id)

    return NextResponse.json({
      success: true,
      requestIds: queueResponses.map(r => `${r.provider}:${r.request_id}`),
      numImages: validNumImages,
      imageAdIds: imageAdRecords,
      creditUsed: totalCreditCost,
    })
  } catch (error) {
    console.error('이미지 광고 생성 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 광고 유형별 프롬프트 접두사 (AI 아바타 지원)
function getTypePromptPrefix(adType: ImageAdType, isAiAvatar = false, avatarDescription?: string, hasAvatar = false): string {
  // AI 아바타인 경우 모델 설명을 텍스트로 대체
  const modelRef = isAiAvatar && avatarDescription
    ? `a ${avatarDescription}`
    : 'the model from the reference'

  switch (adType) {
    case 'productOnly':
      return 'Create a professional product photography showcasing the product from Figure 1.'
    case 'holding':
      return `Create an advertisement image where ${modelRef} is naturally holding the product from Figure 1.`
    case 'using':
      return `Create an advertisement image where ${modelRef} is actively using the product from Figure 1.`
    case 'wearing':
      return `Create a fashion advertisement image showcasing ${modelRef} wearing the clothing/underwear product from Figure 1. The product from Figure 1 is the actual item to be worn, NOT an accessory.`
    case 'lifestyle':
      return `Create a lifestyle advertisement showing ${modelRef} naturally incorporating the product from Figure 1 into daily life.`
    case 'unboxing':
      return `Create an unboxing/review style advertisement with ${modelRef} opening or presenting the product from Figure 1.`
    case 'seasonal':
      // seasonal + 아바타 있음: 모델 포함, seasonal + 아바타 없음: 제품만
      if (hasAvatar || isAiAvatar) {
        return `Create a seasonal/themed advertisement with ${modelRef} and the product from Figure 1 in festive atmosphere.`
      }
      return 'Create a seasonal/themed product advertisement with festive atmosphere showcasing the product from Figure 1.'
    default:
      return ''
  }
}
