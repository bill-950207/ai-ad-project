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

    // 영상 광고 조회 (기본 필드)
    const { data: videoAd, error } = await supabase
      .from('video_ads')
      .select(`
        id,
        video_url,
        thumbnail_url,
        status,
        category,
        prompt,
        prompt_expanded,
        duration,
        resolution,
        aspect_ratio,
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
        outfit_id,
        script,
        script_style,
        voice_id,
        voice_name,
        camera_composition,
        location_prompt,
        first_scene_image_url,
        first_frame_urls,
        first_frame_prompt,
        error_message,
        scenario_info,
        scene_keyframes,
        scene_video_urls
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('영상 광고 조회 오류:', error)
      return NextResponse.json(
        { error: 'Video ad not found' },
        { status: 404 }
      )
    }

    if (!videoAd) {
      return NextResponse.json(
        { error: 'Video ad not found' },
        { status: 404 }
      )
    }

    // 관련 정보 별도 조회 (실패해도 무시)
    let ad_products = null
    let avatars = null
    let avatar_outfits = null

    if (videoAd.product_id) {
      const { data } = await supabase
        .from('ad_products')
        .select('id, name, image_url, rembg_image_url, description, brand, price')
        .eq('id', videoAd.product_id)
        .single()
      ad_products = data
    }

    if (videoAd.avatar_id) {
      const { data } = await supabase
        .from('avatars')
        .select('id, name, image_url')
        .eq('id', videoAd.avatar_id)
        .single()
      avatars = data
    }

    if (videoAd.outfit_id) {
      const { data } = await supabase
        .from('avatar_outfits')
        .select('id, name, image_url')
        .eq('id', videoAd.outfit_id)
        .single()
      avatar_outfits = data
    }

    // 관련 정보 포함하여 반환
    return NextResponse.json({
      videoAd: {
        ...videoAd,
        ad_products,
        avatars,
        avatar_outfits,
      }
    })
  } catch (error) {
    console.error('영상 광고 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: 영상 광고 정보 업데이트 (video_duration 등)
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

    const body = await request.json()
    const { video_duration } = body

    // 업데이트할 필드 구성
    const updateData: Record<string, number | string> = {}
    if (typeof video_duration === 'number' && video_duration > 0) {
      updateData.video_duration = video_duration
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // 영상 광고 업데이트
    const { error: updateError } = await supabase
      .from('video_ads')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('영상 광고 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: 'Failed to update video ad' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('영상 광고 업데이트 오류:', error)
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
