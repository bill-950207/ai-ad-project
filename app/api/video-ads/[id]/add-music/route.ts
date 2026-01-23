/**
 * 영상 광고에 배경 음악(BGM) 추가 API
 *
 * POST /api/video-ads/[id]/add-music
 * - 영상 광고에 광고 음악을 합성합니다
 * - 원본 영상의 오디오와 BGM을 믹싱합니다
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { mergeVideoWithAudio } from '@/lib/video/ffmpeg'
import { uploadBufferToR2 } from '@/lib/storage/r2'

interface MusicTrack {
  id: string
  audioUrl: string
  streamAudioUrl?: string
  duration: number
  title?: string
}

interface BgmInfo {
  music_id: string
  music_name: string
  track_index: number
  start_time: number
  end_time: number
  music_volume: number
  original_video_url: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: videoAdId } = await params

    // 2. 요청 바디 파싱
    const body = await request.json()
    const {
      musicId,
      trackIndex = 0,
      startTime,
      endTime,
      musicVolume = 0.3,
    } = body

    // 3. 필수 파라미터 검증
    if (!musicId) {
      return NextResponse.json({ error: 'musicId is required' }, { status: 400 })
    }
    if (typeof startTime !== 'number' || typeof endTime !== 'number') {
      return NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 })
    }
    if (startTime < 0 || endTime <= startTime) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 })
    }

    // 4. 영상 광고 조회 및 권한 확인
    const videoAd = await prisma.video_ads.findUnique({
      where: { id: videoAdId },
    })

    if (!videoAd) {
      return NextResponse.json({ error: 'Video ad not found' }, { status: 404 })
    }

    if (videoAd.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (videoAd.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Video ad is not completed' }, { status: 400 })
    }

    if (!videoAd.video_url) {
      return NextResponse.json({ error: 'Video URL is missing' }, { status: 400 })
    }

    // 5. 광고 음악 조회
    const adMusic = await prisma.ad_music.findUnique({
      where: { id: musicId },
    })

    if (!adMusic) {
      return NextResponse.json({ error: 'Music not found' }, { status: 404 })
    }

    if (adMusic.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to use this music' }, { status: 403 })
    }

    if (adMusic.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Music is not completed' }, { status: 400 })
    }

    // 6. 트랙 정보 추출
    let audioUrl: string | null = null
    let trackDuration: number | null = null

    if (adMusic.tracks && Array.isArray(adMusic.tracks)) {
      const tracks = adMusic.tracks as MusicTrack[]
      if (trackIndex >= 0 && trackIndex < tracks.length) {
        audioUrl = tracks[trackIndex].audioUrl
        trackDuration = tracks[trackIndex].duration
      }
    }

    // tracks 배열이 없으면 기본 audio_url 사용
    if (!audioUrl) {
      audioUrl = adMusic.audio_url
      trackDuration = adMusic.duration
    }

    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is missing' }, { status: 400 })
    }

    // 7. 시간 범위 검증 (트랙 길이 내인지)
    if (trackDuration && endTime > trackDuration) {
      return NextResponse.json(
        { error: `endTime (${endTime}s) exceeds track duration (${trackDuration}s)` },
        { status: 400 }
      )
    }

    // 8. 원본 비디오 URL 저장 (이미 BGM이 적용된 경우 기존 원본 유지)
    const existingBgmInfo = videoAd.bgm_info as BgmInfo | null
    const originalVideoUrl = existingBgmInfo?.original_video_url || videoAd.video_url

    // 9. 비디오 + 오디오 합성
    console.log('Merging video with BGM...', {
      videoAdId,
      musicId,
      trackIndex,
      startTime,
      endTime,
      musicVolume,
    })

    const mergedBuffer = await mergeVideoWithAudio({
      videoUrl: originalVideoUrl,
      audioUrl,
      audioStartTime: startTime,
      audioEndTime: endTime,
      videoVolume: 1.0,
      musicVolume,
    })

    // 10. R2에 업로드
    const timestamp = Date.now()
    const r2Key = `video-ads/merged/${videoAdId}_${timestamp}.mp4`
    const mergedVideoUrl = await uploadBufferToR2(mergedBuffer, r2Key, 'video/mp4')

    console.log('Merged video uploaded:', mergedVideoUrl)

    // 11. DB 업데이트
    const bgmInfo: BgmInfo = {
      music_id: musicId,
      music_name: adMusic.name,
      track_index: trackIndex,
      start_time: startTime,
      end_time: endTime,
      music_volume: musicVolume,
      original_video_url: originalVideoUrl,
    }

    const updatedVideoAd = await prisma.video_ads.update({
      where: { id: videoAdId },
      data: {
        video_url: mergedVideoUrl,
        bgm_info: bgmInfo,
        updated_at: new Date(),
      },
      include: {
        ad_products: true,
        avatars: true,
      },
    })

    return NextResponse.json({
      success: true,
      videoAd: updatedVideoAd,
    })
  } catch (error) {
    console.error('영상 음악 추가 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add music to video' },
      { status: 500 }
    )
  }
}
