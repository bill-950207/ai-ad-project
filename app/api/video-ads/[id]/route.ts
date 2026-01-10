/**
 * 영상 광고 상세 API
 *
 * GET: 영상 광고 상세 조회 (관련 제품, 아바타 정보 포함)
 * DELETE: 영상 광고 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: 영상 광고 상세 조회
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

    // 영상 광고 조회 (관련 정보 포함)
    const { data: videoAd, error } = await supabase
      .from('video_ads')
      .select(`
        id,
        video_url,
        thumbnail_url,
        status,
        prompt,
        prompt_expanded,
        duration,
        resolution,
        product_info,
        product_url,
        product_summary,
        video_width,
        video_height,
        video_fps,
        video_duration,
        seed,
        created_at,
        completed_at,
        product_id,
        avatar_id,
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
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !videoAd) {
      return NextResponse.json(
        { error: 'Video ad not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ videoAd })
  } catch (error) {
    console.error('영상 광고 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 영상 광고 삭제
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

    // 영상 광고 존재 확인
    const { data: videoAd, error: findError } = await supabase
      .from('video_ads')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (findError || !videoAd) {
      return NextResponse.json(
        { error: 'Video ad not found' },
        { status: 404 }
      )
    }

    // 영상 광고 삭제
    const { error: deleteError } = await supabase
      .from('video_ads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('영상 광고 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete video ad' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('영상 광고 삭제 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
