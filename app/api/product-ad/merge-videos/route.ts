/**
 * 비디오 합치기 API
 *
 * POST: 여러 비디오 URL을 받아서 하나의 비디오로 합칩니다.
 * - FFmpeg를 사용하여 비디오 연결
 * - 결과를 R2에 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadBufferToR2 } from '@/lib/storage/r2'

// 동적 import로 FFmpeg 모듈 로드 (서버 환경에서만 작동)
async function getConcatenateVideos() {
  const { concatenateVideos } = await import('@/lib/video/ffmpeg')
  return concatenateVideos
}

interface MergeVideosRequest {
  videoUrls: string[]
  draftId?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: MergeVideosRequest = await request.json()
    const { videoUrls, draftId } = body

    if (!videoUrls || videoUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one video URL is required' },
        { status: 400 }
      )
    }

    // 비디오가 하나뿐이면 그대로 반환
    if (videoUrls.length === 1) {
      return NextResponse.json({
        mergedVideoUrl: videoUrls[0],
        message: 'Only one video provided, no merge needed',
      })
    }

    console.log(`Merging ${videoUrls.length} videos...`)
    console.log('Video URLs:', videoUrls)

    // FFmpeg로 비디오 합치기
    const concatenateVideos = await getConcatenateVideos()
    const mergedBuffer = await concatenateVideos(videoUrls)

    // R2에 업로드
    const timestamp = Date.now()
    const key = `product-ad/merged/${draftId || user.id}_merged_${timestamp}.mp4`

    const mergedVideoUrl = await uploadBufferToR2(
      mergedBuffer,
      key,
      'video/mp4'
    )

    console.log(`Merged video uploaded: ${mergedVideoUrl}`)

    return NextResponse.json({
      mergedVideoUrl,
      message: `Successfully merged ${videoUrls.length} videos`,
    })
  } catch (error) {
    console.error('비디오 합치기 오류:', error)

    // 상세한 오류 정보 수집
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Error message:', errorMessage)
    if (errorStack) {
      console.error('Error stack:', errorStack)
    }

    // FFmpeg 관련 오류인 경우 더 자세한 메시지 제공
    if (errorMessage.includes('ffmpeg') || errorMessage.includes('FFmpeg') || errorMessage.includes('ENOENT')) {
      return NextResponse.json(
        { error: `Video processing failed: ${errorMessage}` },
        { status: 500 }
      )
    }

    // 다운로드 관련 오류
    if (errorMessage.includes('fetch') || errorMessage.includes('download') || errorMessage.includes('network')) {
      return NextResponse.json(
        { error: `Video download failed: ${errorMessage}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: `Failed to merge videos: ${errorMessage}` },
      { status: 500 }
    )
  }
}
