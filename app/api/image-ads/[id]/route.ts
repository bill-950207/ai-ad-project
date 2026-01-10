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
        ad_type,
        status,
        prompt,
        image_size,
        quality,
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
