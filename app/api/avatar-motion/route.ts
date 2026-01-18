/**
 * 아바타 모션 영상 API
 *
 * GET: 아바타 모션 영상 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 아바타 모션 영상 목록 조회
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
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)
    const status = searchParams.get('status') // 특정 상태만 필터링

    const actualPageSize = Math.min(pageSize, 50)
    const offset = (page - 1) * actualPageSize

    // 총 개수 조회
    let countQuery = supabase
      .from('video_ads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'avatarMotion')

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery
    const totalCount = count || 0

    // 데이터 조회
    let query = supabase
      .from('video_ads')
      .select(`
        id,
        status,
        wizard_step,
        avatar_id,
        outfit_id,
        avatar_image_url,
        product_id,
        story_method,
        story_info,
        start_frame_url,
        end_frame_url,
        video_url,
        aspect_ratio,
        duration,
        thumbnail_url,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('category', 'avatarMotion')
      .order('updated_at', { ascending: false })
      .range(offset, offset + actualPageSize - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: videos, error } = await query

    if (error) {
      console.error('아바타 모션 영상 조회 오류:', error)
      return NextResponse.json(
        { error: 'Failed to fetch avatar motion videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      videos,
      pagination: {
        page,
        pageSize: actualPageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / actualPageSize),
        hasMore: page * actualPageSize < totalCount,
      },
    })
  } catch (error) {
    console.error('아바타 모션 영상 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
