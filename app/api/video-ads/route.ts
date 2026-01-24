/**
 * 영상 광고 API
 *
 * GET: 영상 광고 목록 조회
 * POST: 영상 광고 생성 요청 (새 워크플로우)
 *   1. Gemini로 프롬프트 생성 (첫 씬 + 영상)
 *   2. gpt-image-1.5로 첫 씬 이미지 생성
 *   3. wan2.6로 영상 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitImageAdToQueue, type VideoResolution, type VideoDuration, type ImageAdSize } from '@/lib/fal/client'
import { generateVideoAdPrompts } from '@/lib/gemini/client'

// 화면 비율 타입
type AspectRatio = '1:1' | '16:9' | '9:16'

// 요청 바디 타입
interface VideoAdRequestBody {
  productId?: string
  avatarId?: string
  duration: VideoDuration
  resolution: VideoResolution
  aspectRatio?: AspectRatio
  productInfo?: string
  productUrl?: string
  style?: string
  additionalInstructions?: string
}

// GET: 영상 광고 목록 조회
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
    const limit = searchParams.get('limit') // 레거시 지원

    // 페이지네이션 사용 여부 (page 파라미터가 있으면 페이지네이션 사용)
    const usePagination = searchParams.has('page') || searchParams.has('pageSize')
    const actualPageSize = usePagination ? Math.min(pageSize, 50) : parseInt(limit || '20', 10)
    const offset = usePagination ? (page - 1) * actualPageSize : 0

    // 총 개수 조회 (페이지네이션 사용 시)
    let totalCount = 0
    if (usePagination) {
      let countQuery = supabase
        .from('video_ads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (productId) {
        countQuery = countQuery.eq('product_id', productId)
      }

      const { count } = await countQuery
      totalCount = count || 0
    }

    // 쿼리 빌드 (제품/아바타 정보 포함)
    let query = supabase
      .from('video_ads')
      .select(`
        id, video_url, thumbnail_url, first_scene_image_url, product_id, avatar_id,
        duration, video_duration, resolution, status, category, wizard_step, bgm_info,
        created_at, updated_at,
        ad_products:product_id (id, name, image_url, rembg_image_url),
        avatars:avatar_id (id, name, image_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + actualPageSize - 1)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: videos, error } = await query

    if (error) {
      console.error('영상 광고 조회 오류:', error)
      return NextResponse.json(
        { error: 'Failed to fetch video ads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      videos,
      pagination: usePagination ? {
        page,
        pageSize: actualPageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / actualPageSize),
        hasMore: page * actualPageSize < totalCount,
      } : undefined,
    })
  } catch (error) {
    console.error('영상 광고 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 영상 광고 생성 요청 (새 워크플로우)
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
    const body: VideoAdRequestBody = await request.json()
    const { productId, avatarId, duration, resolution, aspectRatio, productInfo, productUrl, style, additionalInstructions } = body

    // aspectRatio에 따른 이미지 사이즈 결정
    const getImageSize = (ratio: AspectRatio = '9:16'): ImageAdSize => {
      switch (ratio) {
        case '1:1': return '1024x1024'
        case '16:9': return '1536x1024'
        case '9:16': return '1024x1536'
        default: return '1024x1536'
      }
    }
    const imageSize = getImageSize(aspectRatio)

    // 필수 필드 검증
    if (!duration || !resolution) {
      return NextResponse.json(
        { error: 'Missing required fields: duration, resolution' },
        { status: 400 }
      )
    }

    // 유효한 duration 확인
    if (![5, 10, 15].includes(duration)) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be 5, 10, or 15' },
        { status: 400 }
      )
    }

    // 유효한 resolution 확인
    if (!['720p', '1080p'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution. Must be 720p or 1080p' },
        { status: 400 }
      )
    }

    // 제품 또는 아바타가 필요
    if (!productId && !avatarId) {
      return NextResponse.json(
        { error: 'Either productId or avatarId is required' },
        { status: 400 }
      )
    }

    // 제품 정보가 필요 (직접 입력 또는 URL)
    if (!productInfo && !productUrl) {
      return NextResponse.json(
        { error: 'Product info or URL is required' },
        { status: 400 }
      )
    }

    // 이미지 URL 수집
    let productImageUrl: string | null = null
    let avatarImageUrl: string | null = null

    // 제품 이미지
    if (productId) {
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

      productImageUrl = product.rembg_image_url || product.image_url
    }

    // 아바타 이미지
    if (avatarId) {
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

      avatarImageUrl = avatar.image_url
    }

    // 최소한 하나의 이미지 필요
    if (!productImageUrl && !avatarImageUrl) {
      return NextResponse.json(
        { error: 'No valid image found for video generation' },
        { status: 400 }
      )
    }

    // DB에 영상 광고 레코드 생성 (PENDING 상태)
    const { data: videoAd, error: insertError } = await supabase
      .from('video_ads')
      .insert({
        user_id: user.id,
        product_id: productId || null,
        avatar_id: avatarId || null,
        status: 'GENERATING_PROMPTS',
        duration,
        resolution,
        product_info: productInfo || null,
        product_url: productUrl || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('영상 광고 DB 저장 오류:', insertError)
      return NextResponse.json(
        { error: 'Failed to save video ad' },
        { status: 500 }
      )
    }

    // Step 1: Gemini로 프롬프트 생성 (제품/아바타 이미지 포함)
    let promptResult
    try {
      promptResult = await generateVideoAdPrompts({
        productInfo,
        productUrl,
        productImageUrl: productImageUrl || undefined,
        avatarImageUrl: avatarImageUrl || undefined,
        duration,
        style,
        additionalInstructions,
      })
    } catch (promptError) {
      console.error('프롬프트 생성 오류:', promptError)
      await supabase
        .from('video_ads')
        .update({
          status: 'FAILED',
          error_message: 'Failed to generate prompts',
        })
        .eq('id', videoAd.id)

      return NextResponse.json(
        { error: 'Failed to generate prompts' },
        { status: 500 }
      )
    }

    // 프롬프트 정보 업데이트
    await supabase
      .from('video_ads')
      .update({
        status: 'IMAGE_IN_QUEUE',
        prompt: promptResult.videoPrompt,
        first_scene_prompt: promptResult.firstScenePrompt,
        product_summary: promptResult.productSummary,
      })
      .eq('id', videoAd.id)

    // Step 2: gpt-image-1.5로 첫 씬 이미지 생성 요청
    const imageUrls: string[] = []
    if (productImageUrl) imageUrls.push(productImageUrl)
    if (avatarImageUrl) imageUrls.push(avatarImageUrl)

    const imageQueueResponse = await submitImageAdToQueue({
      prompt: promptResult.firstScenePrompt,
      image_urls: imageUrls,
      image_size: imageSize,
      quality: 'medium',
    })

    // 이미지 요청 ID 저장
    await supabase
      .from('video_ads')
      .update({
        fal_image_request_id: imageQueueResponse.request_id,
      })
      .eq('id', videoAd.id)

    return NextResponse.json({
      success: true,
      videoAdId: videoAd.id,
      imageRequestId: imageQueueResponse.request_id,
      status: 'IMAGE_IN_QUEUE',
      productSummary: promptResult.productSummary,
    })
  } catch (error) {
    console.error('영상 광고 생성 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
