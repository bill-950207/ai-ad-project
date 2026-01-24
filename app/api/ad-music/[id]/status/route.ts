/**
 * 광고 음악 생성 상태 조회 API
 *
 * GET: 특정 음악의 생성 상태 확인 (kie_task_id로 Kie.ai API 조회)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMusicTaskInfo } from '@/lib/kie/client'

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
      .select('id, status, audio_url, error_message, updated_at, kie_task_id, stream_audio_url, image_url, duration, tracks')
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

    // 아직 완료되지 않은 경우 Kie.ai API에서 최신 상태 확인
    if (['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(music.status)) {
      try {
        const kieResult = await getMusicTaskInfo(taskId)

        // Kie.ai 상태를 DB 상태로 매핑
        let dbStatus = music.status
        if (kieResult.status === 'SUCCESS' || kieResult.status === 'FIRST_SUCCESS') {
          dbStatus = 'COMPLETED'
        } else if (kieResult.status === 'PENDING') {
          dbStatus = 'IN_QUEUE'
        } else if (kieResult.status === 'TEXT_SUCCESS') {
          dbStatus = 'IN_PROGRESS'
        } else if (
          kieResult.status === 'CREATE_TASK_FAILED' ||
          kieResult.status === 'GENERATE_AUDIO_FAILED' ||
          kieResult.status === 'CALLBACK_EXCEPTION' ||
          kieResult.status === 'SENSITIVE_WORD_ERROR'
        ) {
          dbStatus = 'FAILED'
        }

        // 완료된 경우 DB 업데이트
        if (dbStatus === 'COMPLETED' && kieResult.response?.sunoData?.length) {
          const sunoData = kieResult.response.sunoData

          // 모든 트랙의 audioUrl이 채워졌는지 확인
          const allTracksReady = sunoData.every(track => track.audioUrl && track.audioUrl.trim() !== '')

          // 아직 모든 트랙이 준비되지 않은 경우 IN_PROGRESS 유지
          if (!allTracksReady) {
            // 트랙 데이터는 업데이트하되 상태는 IN_PROGRESS 유지
            const tracks = sunoData.map(track => ({
              id: track.id,
              audioUrl: track.audioUrl,
              streamAudioUrl: track.streamAudioUrl,
              imageUrl: track.imageUrl,
              title: track.title,
              tags: track.tags,
              duration: track.duration,
            }))

            await supabase
              .from('ad_music')
              .update({
                status: 'IN_PROGRESS',
                tracks: tracks,
                updated_at: new Date().toISOString(),
              })
              .eq('id', music.id)

            return NextResponse.json({
              id: music.id,
              taskId: music.kie_task_id,
              status: 'IN_PROGRESS',
              audioUrl: null,
              streamAudioUrl: null,
              imageUrl: null,
              duration: null,
              tracks: tracks,
              error: null,
              updatedAt: new Date().toISOString(),
            })
          }

          const firstTrack = sunoData[0]

          // 트랙 데이터 변환
          const tracks = sunoData.map(track => ({
            id: track.id,
            audioUrl: track.audioUrl,
            streamAudioUrl: track.streamAudioUrl,
            imageUrl: track.imageUrl,
            title: track.title,
            tags: track.tags,
            duration: track.duration,
          }))

          await supabase
            .from('ad_music')
            .update({
              status: 'COMPLETED',
              audio_url: firstTrack.audioUrl,
              stream_audio_url: firstTrack.streamAudioUrl,
              image_url: firstTrack.imageUrl,
              duration: firstTrack.duration,
              tracks: tracks,
              updated_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            })
            .eq('id', music.id)

          return NextResponse.json({
            id: music.id,
            taskId: music.kie_task_id,
            status: 'COMPLETED',
            audioUrl: firstTrack.audioUrl,
            streamAudioUrl: firstTrack.streamAudioUrl,
            imageUrl: firstTrack.imageUrl,
            duration: firstTrack.duration,
            tracks: tracks,
            error: null,
            updatedAt: new Date().toISOString(),
          })
        }

        // 실패한 경우 DB 업데이트
        if (dbStatus === 'FAILED') {
          await supabase
            .from('ad_music')
            .update({
              status: 'FAILED',
              error_message: kieResult.errorMessage || 'Unknown error',
              updated_at: new Date().toISOString(),
            })
            .eq('id', music.id)

          return NextResponse.json({
            id: music.id,
            taskId: music.kie_task_id,
            status: 'FAILED',
            audioUrl: null,
            error: kieResult.errorMessage || 'Unknown error',
            updatedAt: new Date().toISOString(),
          })
        }

        // 진행 중인 경우 상태만 업데이트
        if (dbStatus !== music.status) {
          await supabase
            .from('ad_music')
            .update({
              status: dbStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', music.id)
        }

        return NextResponse.json({
          id: music.id,
          taskId: music.kie_task_id,
          status: dbStatus,
          audioUrl: music.audio_url,
          error: music.error_message,
          updatedAt: new Date().toISOString(),
        })
      } catch (kieError) {
        console.error('Kie.ai 상태 조회 오류:', kieError)
        // Kie.ai 조회 실패 시 DB 상태 반환
      }
    }

    return NextResponse.json({
      id: music.id,
      taskId: music.kie_task_id,
      status: music.status,
      audioUrl: music.audio_url,
      streamAudioUrl: music.stream_audio_url,
      imageUrl: music.image_url,
      duration: music.duration,
      tracks: music.tracks,
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
