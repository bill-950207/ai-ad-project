/**
 * 광고 음악 상태 조회 API
 *
 * GET: 음악 생성 상태 폴링
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMusicTaskInfo } from '@/lib/kie/client'

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

    // 음악 레코드 조회
    const { data: music, error: fetchError } = await supabase
      .from('ad_music')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !music) {
      return NextResponse.json(
        { error: 'Music not found' },
        { status: 404 }
      )
    }

    // 이미 완료되었거나 실패한 경우 DB 값 반환
    if (music.status === 'COMPLETED' || music.status === 'FAILED') {
      return NextResponse.json({ music })
    }

    // KIE API에서 상태 조회
    if (music.kie_task_id) {
      try {
        const taskInfo = await getMusicTaskInfo(music.kie_task_id)

        // 상태 매핑 (새로운 API 응답 구조에 맞게)
        let newStatus = music.status
        let audioUrl = music.audio_url
        let streamAudioUrl = music.stream_audio_url
        let imageUrl = music.image_url
        let duration = music.duration
        let errorMessage = music.error_message
        let tracks = music.tracks

        const sunoData = taskInfo.response?.sunoData

        if ((taskInfo.status === 'SUCCESS' || taskInfo.status === 'FIRST_SUCCESS') && sunoData && sunoData.length > 0) {
          // 완료: 모든 트랙 저장
          const firstResult = sunoData[0]
          newStatus = 'COMPLETED'
          audioUrl = firstResult.audioUrl
          streamAudioUrl = firstResult.streamAudioUrl
          imageUrl = firstResult.imageUrl
          duration = firstResult.duration
          // 모든 트랙을 tracks 배열로 저장
          tracks = sunoData.map((track) => ({
            id: track.id,
            audioUrl: track.audioUrl,
            streamAudioUrl: track.streamAudioUrl,
            imageUrl: track.imageUrl,
            title: track.title,
            tags: track.tags,
            duration: track.duration,
          }))
        } else if (
          taskInfo.status === 'CREATE_TASK_FAILED' ||
          taskInfo.status === 'GENERATE_AUDIO_FAILED' ||
          taskInfo.status === 'CALLBACK_EXCEPTION' ||
          taskInfo.status === 'SENSITIVE_WORD_ERROR'
        ) {
          newStatus = 'FAILED'
          errorMessage = taskInfo.errorMessage || 'Unknown error'
        } else if (taskInfo.status === 'TEXT_SUCCESS' || taskInfo.status === 'PENDING') {
          newStatus = 'IN_PROGRESS'
        }

        // 상태가 변경된 경우 DB 업데이트
        if (newStatus !== music.status || audioUrl !== music.audio_url) {
          const updateData: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          }

          if (audioUrl) updateData.audio_url = audioUrl
          if (streamAudioUrl) updateData.stream_audio_url = streamAudioUrl
          if (imageUrl) updateData.image_url = imageUrl
          if (duration) updateData.duration = duration
          if (tracks) updateData.tracks = tracks
          if (errorMessage) updateData.error_message = errorMessage
          if (newStatus === 'COMPLETED') updateData.completed_at = new Date().toISOString()

          const { data: updatedMusic, error: updateError } = await supabase
            .from('ad_music')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

          if (!updateError && updatedMusic) {
            return NextResponse.json({ music: updatedMusic })
          }
        }
      } catch (apiError) {
        console.error('KIE API 조회 오류:', apiError)
        // API 오류 시 DB 값 그대로 반환
      }
    }

    return NextResponse.json({ music })
  } catch (error) {
    console.error('음악 상태 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
