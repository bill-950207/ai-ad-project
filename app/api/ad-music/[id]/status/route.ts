/**
 * 광고 음악 생성 상태 조회 API
 *
 * GET: 특정 음악의 생성 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 음악 정보 조회
    const { data: music, error } = await supabase
      .from('ad_music')
      .select('id, status, audio_url, error, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('음악 상태 조회 오류:', error)
      return NextResponse.json(
        { error: 'Music not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: music.id,
      status: music.status,
      audioUrl: music.audio_url,
      error: music.error,
      updatedAt: music.updated_at,
    })
  } catch (error) {
    console.error('음악 상태 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
