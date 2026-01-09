/**
 * 이미지 광고 생성 API
 *
 * GET: 이미지 광고 목록 조회 (productId로 필터링 가능)
 * POST: 이미지 광고 생성 요청 (fal.ai gpt-image-1.5/edit 사용)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitImageAdToQueue, type ImageAdSize } from '@/lib/fal/client'

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
  productId: string
  avatarId?: string  // productOnly일 경우 없음
  prompt: string
  imageSize: ImageAdSize
  quality?: Quality
  numImages?: number
  options?: {
    background?: string
    lighting?: string
    mood?: string
    angle?: string
  }
}

// GET: 이미지 광고 목록 조회
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
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // 쿼리 빌드
    let query = supabase
      .from('image_ads')
      .select('id, image_url, product_id, avatar_id, ad_type, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: ads, error } = await query

    if (error) {
      console.error('이미지 광고 조회 오류:', error)
      return NextResponse.json(
        { error: 'Failed to fetch image ads' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ads })
  } catch (error) {
    console.error('이미지 광고 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { adType, productId, avatarId, prompt, imageSize, quality = 'medium', numImages = 2, options } = body

    // 필수 필드 검증
    if (!adType || !productId || !prompt || !imageSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // numImages 범위 제한 (1-5)
    const validNumImages = Math.min(Math.max(1, numImages), 5)

    // 제품 정보 조회
    const { data: product, error: productError } = await supabase
      .from('ad_products')
      .select('id, name, rembg_image_url, image_url, status')
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

    // 이미지 URL 수집
    const imageUrls: string[] = []

    // 제품 이미지 추가 (배경 제거된 이미지 우선)
    const productImageUrl = product.rembg_image_url || product.image_url
    if (productImageUrl) {
      imageUrls.push(productImageUrl)
    }

    // 아바타가 필요한 경우 (productOnly 제외)
    if (adType !== 'productOnly') {
      if (!avatarId) {
        return NextResponse.json(
          { error: 'Avatar is required for this ad type' },
          { status: 400 }
        )
      }

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

      if (avatar.image_url) {
        imageUrls.push(avatar.image_url)
      }
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid images found' },
        { status: 400 }
      )
    }

    // 프롬프트 구성
    let finalPrompt = prompt

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

    // 광고 유형별 프롬프트 보강
    const typePromptPrefix = getTypePromptPrefix(adType)
    if (typePromptPrefix) {
      finalPrompt = `${typePromptPrefix} ${finalPrompt}`
    }

    // fal.ai에 요청 제출
    const queueResponse = await submitImageAdToQueue({
      prompt: finalPrompt,
      image_urls: imageUrls,
      image_size: imageSize,
      quality: quality,
      num_images: validNumImages,
      background: 'auto',
    })

    return NextResponse.json({
      success: true,
      requestId: queueResponse.request_id,
      statusUrl: queueResponse.status_url,
      numImages: validNumImages,
    })
  } catch (error) {
    console.error('이미지 광고 생성 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 광고 유형별 프롬프트 접두사
function getTypePromptPrefix(adType: ImageAdType): string {
  switch (adType) {
    case 'productOnly':
      return 'Create a professional product photography showcasing the product from the reference image.'
    case 'holding':
      return 'Create an advertisement image where the model from the reference is naturally holding the product.'
    case 'using':
      return 'Create an advertisement image where the model from the reference is actively using the product.'
    case 'wearing':
      return 'Create an advertisement image where the model from the reference is wearing/using the product as an accessory.'
    case 'beforeAfter':
      return 'Create a before/after comparison advertisement showing the transformation.'
    case 'lifestyle':
      return 'Create a lifestyle advertisement showing the model naturally incorporating the product into daily life.'
    case 'unboxing':
      return 'Create an unboxing/review style advertisement with the model opening or presenting the product.'
    case 'comparison':
      return 'Create a product comparison style advertisement.'
    case 'seasonal':
      return 'Create a seasonal/themed advertisement with festive atmosphere.'
    default:
      return ''
  }
}
