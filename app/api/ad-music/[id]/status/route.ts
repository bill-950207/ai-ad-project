/**
 * 광고 음악 생성 상태 조회 API
 *
 * GET: 특정 음악의 생성 상태 확인 (kie_task_id로 조회)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: taskId } = await params

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // kie_task_id로 음악 정보 조회
    const { data: music, error: queryError } = await supabase
      .from('ad_music')
      .select('id, status, audio_url, error_message, updated_at, kie_task_id')
      .eq('kie_task_id', taskId)
      .eq('user_id', user.id)
      .single()

    if (queryError) {
      console.error('음악 상태 조회 오류:', queryError)
      return NextResponse.json(
        { error: 'Music not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: music.id,
      taskId: music.kie_task_id,
      status: music.status,
      audioUrl: music.audio_url,
      error: music.error_message,
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
