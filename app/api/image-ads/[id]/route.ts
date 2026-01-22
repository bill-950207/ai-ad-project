/**
 * 이미지 광고 상세 API
 *
 * GET: 이미지 광고 상세 조회 (관련 제품, 아바타, 의상 정보 포함)
 * DELETE: 이미지 광고 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: 이미지 광고 상세 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 이미지 광고 조회 (관련 정보 포함)
    const { data: imageAd, error } = await supabase
      .from('image_ads')
      .select(`
        id,
        image_url,
        image_url_original,
        image_urls,
        image_url_originals,
        num_images,
        ad_type,
        status,
        prompt,
        image_size,
        quality,
        selected_options,
        created_at,
        product_id,
        avatar_id,
        outfit_id,
        ad_products (
          id,
          name,
          image_url,
          rembg_image_url
        ),
        avatars (
          id,
          name,
          image_url
        ),
        avatar_outfits (
          id,
          name,
          image_url
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !imageAd) {
      return NextResponse.json(
        { error: 'Image ad not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ imageAd })
  } catch (error) {
    console.error('이미지 광고 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: 이미지 광고 업데이트 (편집된 이미지 URL 반영 또는 개별 이미지 삭제)
// 편집된 이미지는 새로 추가되어 원본 이미지와 함께 표시됨
// deleteIndex가 전달되면 해당 인덱스의 이미지를 삭제
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
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
    const body = await request.json()
    const { imageIndex, imageUrl, imageUrlOriginal, deleteIndex } = body as {
      imageIndex?: number
      imageUrl?: string
      imageUrlOriginal?: string
      deleteIndex?: number
    }

    // 기존 이미지 광고 조회
    const { data: imageAd, error: findError } = await supabase
      .from('image_ads')
      .select('id, image_url, image_urls, image_url_original, image_url_originals, num_images')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (findError || !imageAd) {
      return NextResponse.json(
        { error: 'Image ad not found' },
        { status: 404 }
      )
    }

    // 기존 배열 복사
    const existingUrls = imageAd.image_urls || (imageAd.image_url ? [imageAd.image_url] : [])
    const existingOriginals = imageAd.image_url_originals || (imageAd.image_url_original ? [imageAd.image_url_original] : [])

    // 개별 이미지 삭제 처리
    if (typeof deleteIndex === 'number') {
      if (deleteIndex < 0 || deleteIndex >= existingUrls.length) {
        return NextResponse.json(
          { error: 'Invalid deleteIndex' },
          { status: 400 }
        )
      }

      // 마지막 하나 남은 이미지는 삭제 불가
      if (existingUrls.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last remaining image' },
          { status: 400 }
        )
      }

      const newUrls = [...existingUrls]
      const newOriginals = [...existingOriginals]
      newUrls.splice(deleteIndex, 1)
      newOriginals.splice(deleteIndex, 1)

      // 첫 번째 이미지 업데이트 (대표 이미지 변경될 수 있음)
      const updateData: Record<string, unknown> = {
        image_urls: newUrls,
        image_url_originals: newOriginals,
        num_images: newUrls.length,
        image_url: newUrls[0],
        image_url_original: newOriginals[0],
      }

      const { error: updateError } = await supabase
        .from('image_ads')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('이미지 삭제 오류:', updateError)
        return NextResponse.json(
          { error: 'Failed to delete image' },
          { status: 500 }
        )
      }

      console.log('개별 이미지 삭제 완료:', {
        id,
        deletedIndex: deleteIndex,
        remainingImages: newUrls.length,
      })

      return NextResponse.json({
        success: true,
        imageUrls: newUrls,
        imageUrlOriginals: newOriginals,
      })
    }

    // 편집된 이미지 추가 처리
    if (typeof imageIndex !== 'number' || !imageUrl) {
      return NextResponse.json(
        { error: 'imageIndex and imageUrl are required for edit, or deleteIndex for deletion' },
        { status: 400 }
      )
    }

    // 편집된 이미지를 기존 이미지 바로 다음 위치에 추가 (원본 유지)
    const newUrls = [...existingUrls]
    const newOriginals = [...existingOriginals]

    // 선택된 이미지 다음 위치에 편집된 이미지 삽입
    const insertIndex = imageIndex + 1
    newUrls.splice(insertIndex, 0, imageUrl)
    newOriginals.splice(insertIndex, 0, imageUrlOriginal || imageUrl)

    // DB 업데이트 (원본 이미지는 유지, 편집된 이미지는 새로 추가)
    const { error: updateError } = await supabase
      .from('image_ads')
      .update({
        image_urls: newUrls,
        image_url_originals: newOriginals,
        num_images: newUrls.length,
        // image_url과 image_url_original은 변경하지 않음 (원본 유지)
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('이미지 광고 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: 'Failed to update image ad' },
        { status: 500 }
      )
    }

    console.log('이미지 광고 편집 완료 (원본 유지):', {
      id,
      originalIndex: imageIndex,
      newImageIndex: insertIndex,
      totalImages: newUrls.length,
    })

    return NextResponse.json({
      success: true,
      imageUrls: newUrls,
      imageUrlOriginals: newOriginals,
      newImageIndex: insertIndex,
    })
  } catch (error) {
    console.error('이미지 광고 업데이트 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 이미지 광고 삭제
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 이미지 광고 존재 확인
    const { data: imageAd, error: findError } = await supabase
      .from('image_ads')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (findError || !imageAd) {
      return NextResponse.json(
        { error: 'Image ad not found' },
        { status: 404 }
      )
    }

    // 이미지 광고 삭제
    const { error: deleteError } = await supabase
      .from('image_ads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('이미지 광고 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete image ad' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('이미지 광고 삭제 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
