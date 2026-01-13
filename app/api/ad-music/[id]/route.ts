/**
 * 광고 음악 개별 API
 *
 * GET: 개별 음악 조회
 * DELETE: 음악 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 개별 음악 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 음악 조회
    const { data: music, error } = await supabase
      .from('ad_music')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !music) {
      return NextResponse.json(
        { error: 'Music not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ music })
  } catch (error) {
    console.error('음악 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 음악 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 음악 삭제
    const { error } = await supabase
      .from('ad_music')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('음악 삭제 오류:', error)
      return NextResponse.json(
        { error: 'Failed to delete music' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('음악 삭제 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
