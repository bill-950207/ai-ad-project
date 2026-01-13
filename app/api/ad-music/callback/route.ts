/**
 * 광고 음악 콜백 API
 *
 * POST: KIE API에서 음악 생성 완료 시 호출되는 콜백
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 콜백 데이터 아이템 타입
interface MusicCallbackItem {
  id: string
  audio_url: string
  stream_audio_url: string
  image_url: string
  prompt: string
  model_name: string
  title: string
  tags: string
  createTime: string
  duration: number
}

// 콜백 요청 바디 타입
interface MusicCallbackBody {
  code: number
  msg: string
  data: {
    callbackType: 'text' | 'first' | 'complete'
    task_id: string
    data: MusicCallbackItem[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MusicCallbackBody = await request.json()
    console.log('음악 생성 콜백 수신:', JSON.stringify(body, null, 2))

    // 실패 응답 처리
    if (body.code !== 200) {
      console.error('음악 생성 실패:', body.msg)

      // task_id로 레코드 찾아서 실패 처리
      if (body.data?.task_id) {
        const supabase = createAdminClient()
        await supabase
          .from('ad_music')
          .update({
            status: 'FAILED',
            error_message: body.msg || 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('kie_task_id', body.data.task_id)
      }

      return NextResponse.json({ success: false })
    }

    const { callbackType, task_id, data } = body.data

    // 텍스트 생성 단계는 무시
    if (callbackType === 'text') {
      console.log('텍스트 생성 단계 - 무시')
      return NextResponse.json({ success: true })
    }

    // first 또는 complete 단계에서 결과 저장
    if ((callbackType === 'first' || callbackType === 'complete') && data && data.length > 0) {
      const firstResult = data[0]
      const supabase = createAdminClient()

      // 모든 트랙을 tracks 배열로 저장
      const tracks = data.map((track) => ({
        id: track.id,
        audioUrl: track.audio_url,
        streamAudioUrl: track.stream_audio_url,
        imageUrl: track.image_url,
        title: track.title,
        tags: track.tags,
        duration: track.duration,
      }))

      const { error: updateError } = await supabase
        .from('ad_music')
        .update({
          status: 'COMPLETED',
          audio_url: firstResult.audio_url,
          stream_audio_url: firstResult.stream_audio_url,
          image_url: firstResult.image_url,
          duration: firstResult.duration,
          tracks: tracks,
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq('kie_task_id', task_id)

      if (updateError) {
        console.error('음악 레코드 업데이트 오류:', updateError)
        return NextResponse.json({ success: false, error: updateError.message })
      }

      console.log('음악 생성 완료:', task_id, '트랙 수:', data.length)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('콜백 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
