/**
 * 이미지 광고 생성 API
 *
 * GET: 이미지 광고 목록 조회 (productId로 필터링 가능)
 * POST: 이미지 광고 생성 요청 (fal.ai Seedream 4.5 Edit)
 */

import { submitSeedreamEditToQueue, type SeedreamAspectRatio } from '@/lib/fal/client'
// [주석 처리] AI 아바타용 kie.ai GPT-Image 1.5 (현재 Seedream 사용)
// import {
//   submitGPTImageToQueue as submitKieGptImageToQueue,
//   type GPTImageAspectRatio,
// } from '@/lib/kie/client'
import { createClient } from '@/lib/supabase/server'
import { generateImageAdPrompt, type ImageAdType as GeminiImageAdType } from '@/lib/gemini/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** 이미지 광고 생성 크레딧 비용 (퀄리티별) */
const IMAGE_AD_CREDIT_COST = {
  medium: 2,
  high: 3,
} as const

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
  | 'beforeAfter'
  | 'lifestyle'
  | 'unboxing'
  | 'comparison'
  | 'seasonal'

// 퀄리티 타입
type Quality = 'medium' | 'high'

// 요청 바디 타입
interface ImageAdRequestBody {
  adType: ImageAdType
  productId?: string  // wearing일 경우 없을 수 있음
  avatarIds?: string[]  // 다중 아바타 지원 (productOnly일 경우 빈 배열)
  outfitId?: string  // wearing일 경우 의상 ID
  prompt: string
  imageSize: ImageAdSize
  quality?: Quality
  numImages?: number
  referenceStyleImageUrl?: string  // 참조 스타일 이미지 URL (분위기/스타일만 참조)
  options?: {
    background?: string
    lighting?: string
    mood?: string
    angle?: string
  }
  // AI 아바타 옵션 (avatarIds[0]이 'ai-generated'일 때)
  aiAvatarOptions?: {
    targetGender?: 'male' | 'female' | 'any'
    targetAge?: 'young' | 'middle' | 'mature' | 'any'
    style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
    ethnicity?: 'korean' | 'asian' | 'western' | 'any'
  }
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
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)
    const limit = searchParams.get('limit') // legacy support

    // limit이 있으면 legacy 모드, 없으면 pagination 모드
    const usePagination = !limit
    const actualPageSize = limit ? parseInt(limit, 10) : pageSize

    // offset 계산 (pagination 모드일 때만)
    const offset = usePagination ? (page - 1) * actualPageSize : 0

    // 먼저 총 개수 조회
    let countQuery = supabase
      .from('image_ads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['COMPLETED', 'IN_QUEUE', 'IN_PROGRESS', 'FAILED'])

    if (productId) {
      countQuery = countQuery.eq('product_id', productId)
    }

    const { count: totalCount } = await countQuery

    // 쿼리 빌드 - 모든 상태의 광고 반환 (COMPLETED, IN_QUEUE, IN_PROGRESS, FAILED)
    // 제품 정보도 함께 조회
    let query = supabase
      .from('image_ads')
      .select(`
        id,
        image_url,
        image_urls,
        image_url_originals,
        num_images,
        batch_request_ids,
        product_id,
        avatar_id,
        ad_type,
        status,
        fal_request_id,
        created_at,
        ad_products (
          id,
          name,
          image_url,
          rembg_image_url
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['COMPLETED', 'IN_QUEUE', 'IN_PROGRESS', 'FAILED'])
      .order('created_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    // pagination 또는 legacy limit 적용
    if (usePagination) {
      query = query.range(offset, offset + actualPageSize - 1)
    } else {
      query = query.limit(actualPageSize)
    }

    const { data: ads, error } = await query

    if (error) {
      console.error('이미지 광고 조회 오류:', error)
      return NextResponse.json(
        { error: 'Failed to fetch image ads' },
        { status: 500 }
      )
    }

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
    const { adType, productId, avatarIds = [], outfitId, prompt, imageSize, quality = 'medium', numImages = 2, referenceStyleImageUrl, options, aiAvatarOptions } = body

    // numImages 범위 제한 (1-5)
    const validNumImages = Math.min(Math.max(1, numImages), 5)

    // 크레딧 비용 계산
    const creditCostPerImage = IMAGE_AD_CREDIT_COST[quality] || IMAGE_AD_CREDIT_COST.medium
    const totalCreditCost = creditCostPerImage * validNumImages

    // 크레딧 확인
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
    })

    if (!profile || (profile.credits ?? 0) < totalCreditCost) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: totalCreditCost, available: profile?.credits ?? 0 },
        { status: 402 }
      )
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
    let outfitImageUrl: string | undefined

    // 제품 정보 조회 (모든 타입에서 필수)
    if (productId) {
      const { data: product, error: productError } = await supabase
        .from('ad_products')
        .select('id, name, description, rembg_image_url, image_url, status')
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

      // 제품 이미지 추가 (배경 제거된 이미지 우선)
      productImageUrl = product.rembg_image_url || product.image_url
      if (productImageUrl) {
        imageUrls.push(productImageUrl)
      }
    }

    // 아바타가 필요한 경우 (productOnly, seasonal 제외)
    // 첫 번째 아바타 ID (DB 저장용)
    let primaryAvatarId: string | null = null

    // AI 생성 아바타 여부 확인
    const isAiGeneratedAvatar = avatarIds.length > 0 && avatarIds[0] === 'ai-generated'

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

      // AI 생성 아바타인 경우 - 아바타 이미지 없이 진행 (GPT-Image가 프롬프트만으로 생성)
      if (isAiGeneratedAvatar) {
        // AI 생성 아바타는 DB에 null로 저장
        primaryAvatarId = null
        // 아바타 이미지 URL은 추가하지 않음 - 프롬프트만으로 생성
      }
      // 착용샷이고 의상이 선택된 경우, 의상 이미지 사용 (단일 아바타만)
      else if (isWearingType && outfitId) {
        const avatarId = avatarIds[0]
        primaryAvatarId = avatarId

        const { data: avatar, error: avatarError } = await supabase
          .from('avatars')
          .select('id, name, image_url, status')
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

        // Gemini용 아바타 이미지 URL 저장
        if (avatar.image_url) {
          avatarImageUrls.push(avatar.image_url)
        }

        const { data: outfit, error: outfitError } = await supabase
          .from('avatar_outfits')
          .select('id, name, image_url, status')
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

        // Gemini용 의상 이미지 URL 저장
        outfitImageUrl = outfit.image_url || undefined

        // 의상 이미지 사용 (아바타 + 의상이 합성된 이미지)
        if (outfit.image_url) {
          imageUrls.push(outfit.image_url)
        }
      } else {
        // 다중 아바타 이미지 추가
        for (const avatarId of avatarIds) {
          const { data: avatar, error: avatarError } = await supabase
            .from('avatars')
            .select('id, name, image_url, status')
            .eq('id', avatarId)
            .eq('user_id', user.id)
            .single()

          if (avatarError || !avatar) {
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
          }

          // 일반 아바타 이미지 추가
          if (avatar.image_url) {
            imageUrls.push(avatar.image_url)
            // Gemini용 아바타 이미지 URL 저장
            avatarImageUrls.push(avatar.image_url)
          }
        }
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
      const ageMap: Record<string, string> = { young: 'in their 20s-30s', middle: 'in their 30s-40s', mature: 'in their 40s-50s', any: '' }
      const styleMap: Record<string, string> = { natural: 'natural and friendly', professional: 'professional and sophisticated', casual: 'casual and relaxed', elegant: 'elegant and luxurious', any: '' }
      const ethnicityMap: Record<string, string> = { korean: 'Korean', asian: 'Asian', western: 'Western/Caucasian', any: '' }

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
        if (aiAvatarOptions.style && aiAvatarOptions.style !== 'any' && styleMap[aiAvatarOptions.style]) {
          avatarParts.push(`with ${styleMap[aiAvatarOptions.style]} appearance`)
        }
      }

      // 모든 옵션이 '무관'이거나 설정되지 않은 경우 - Gemini가 제품에 맞게 자동 선택
      if (avatarParts.length === 0) {
        // 기본 설명을 제공하되, Gemini에게 제품에 맞게 구체화하도록 요청
        aiAvatarDescription = 'a person suitable for this product advertisement (automatically select ethnicity, gender, age, and style based on the product and target market)'
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
        outfitImageUrl,
        referenceStyleImageUrl,
        selectedOptions: options || {},
        additionalPrompt: prompt,
        aiAvatarDescription,
      })

      finalPrompt = geminiResult.optimizedPrompt
      console.log('Gemini 프롬프트 생성 완료:', { koreanDescription: geminiResult.koreanDescription })
    } catch (geminiError) {
      console.error('Gemini 프롬프트 생성 실패, 기본 프롬프트 사용:', geminiError)

      // Gemini 실패 시 기존 방식으로 폴백
      // 제품 단독일 경우 옵션 반영
      if (adType === 'productOnly' && options) {
        const optionParts: string[] = []
        if (options.background) optionParts.push(`${options.background} background`)
        if (options.lighting) optionParts.push(`${options.lighting} lighting`)
        if (options.mood) optionParts.push(`${options.mood} mood`)
        if (options.angle) optionParts.push(`${options.angle} angle`)

        if (optionParts.length > 0) {
          finalPrompt = `${prompt}. Style: ${optionParts.join(', ')}.`
        }
      }

      // 광고 유형별 프롬프트 보강 (AI 아바타 고려)
      const typePromptPrefix = getTypePromptPrefix(adType, isAiGeneratedAvatar, aiAvatarDescription)
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
      // AI 생성 아바타: fal.ai Seedream 4.5 Edit 사용 (제품 이미지를 참조로 활용)
      // aiAvatarDescription은 이미 Gemini 호출 전에 생성됨

      // AI 아바타 프롬프트를 DB에 저장 (Gemini가 이미 아바타 설명을 포함한 프롬프트 생성)
      promptToSave = finalPrompt

      // AI 아바타용 입력 이미지 (제품 이미지가 있으면 사용)
      const aiInputUrls = productImageUrl ? [productImageUrl] : []
      const seedreamQuality = quality === 'high' ? 'high' : 'basic'

      console.log('AI 아바타 이미지 광고 생성 (fal.ai Seedream 4.5):', { aiAvatarDescription, aspectRatio, inputUrls: aiInputUrls })

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
      // 기존 아바타: fal.ai Seedream 4.5 Edit 사용
      const seedreamQuality = quality === 'high' ? 'high' : 'basic'

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

    const { data: imageAd, error: insertError } = await supabase
      .from('image_ads')
      .insert({
        user_id: user.id,
        product_id: productId || null,
        avatar_id: primaryAvatarId,  // AI 아바타일 경우 null
        outfit_id: outfitId || null,
        ad_type: adType,
        status: 'IN_QUEUE',
        fal_request_id: null,  // 배치에서는 사용 안 함
        batch_request_ids: batchRequestIds,  // 배치 요청 ID 배열
        num_images: validNumImages,  // 요청된 이미지 개수
        prompt: promptToSave,  // AI 아바타인 경우 아바타 설명 포함된 프롬프트
        image_size: imageSize,
        quality: quality,
        selected_options: selectedOptionsToSave,  // 사용자 선택 옵션 + AI 아바타 옵션
      })
      .select('id')
      .single()

    const imageAdRecords: string[] = []
    if (insertError) {
      console.error('이미지 광고 DB 저장 오류:', insertError)
    } else if (imageAd) {
      imageAdRecords.push(imageAd.id)
    }

    // 크레딧 차감
    await prisma.profiles.update({
      where: { id: user.id },
      data: {
        credits: { decrement: totalCreditCost },
      },
    })

    console.log('이미지 광고 크레딧 차감:', { userId: user.id, cost: totalCreditCost, numImages: validNumImages })

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
function getTypePromptPrefix(adType: ImageAdType, isAiAvatar = false, avatarDescription?: string): string {
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
      return `Create a fashion advertisement image showcasing ${modelRef} wearing the outfit from the reference image.`
    case 'beforeAfter':
      return 'Create a before/after comparison advertisement showing the transformation.'
    case 'lifestyle':
      return `Create a lifestyle advertisement showing ${modelRef} naturally incorporating the product from Figure 1 into daily life.`
    case 'unboxing':
      return `Create an unboxing/review style advertisement with ${modelRef} opening or presenting the product from Figure 1.`
    case 'comparison':
      return 'Create a product comparison style advertisement.'
    case 'seasonal':
      return 'Create a seasonal/themed advertisement with festive atmosphere.'
    default:
      return ''
  }
}
