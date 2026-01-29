/**
 * 영상 광고 생성 상태 확인 API
 *
 * GET: fal.ai 또는 WaveSpeed/Kie.ai 큐 상태 확인 및 결과 반환, DB 업데이트
 *
 * 워크플로우:
 * 1. 이미지 생성 단계 (fal_image_request_id 사용)
 * 2. 영상 생성 단계 (fal_request_id 사용)
 * 3. 제품 설명 영상 (kie_request_id 사용, wavespeed: 또는 kie: prefix)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getImageAdQueueStatus,
  getImageAdQueueResponse,
  getVideoAdQueueStatus,
  getVideoAdQueueResponse,
  submitVideoAdToQueue,
  type VideoResolution,
  type VideoDuration
} from '@/lib/fal/client'
import { uploadExternalImageToR2 } from '@/lib/image/compress'
import {
  getInfinitalkQueueStatus as getKieInfinitalkQueueStatus,
  getInfinitalkQueueResponse as getKieInfinitalkQueueResponse,
} from '@/lib/kie/client'
import {
  getInfiniteTalkQueueStatus as getWavespeedInfiniteTalkQueueStatus,
  getInfiniteTalkQueueResponse as getWavespeedInfiniteTalkQueueResponse,
} from '@/lib/wavespeed/client'

/**
 * kie_request_id에서 provider와 실제 request ID 추출
 * 형식: "wavespeed:abc123" 또는 "kie:def456" 또는 기존 형식 "abc123" (kie로 가정)
 */
function parseRequestId(kieRequestId: string): { provider: 'wavespeed' | 'kie'; requestId: string } {
  if (kieRequestId.startsWith('wavespeed:')) {
    return {
      provider: 'wavespeed',
      requestId: kieRequestId.slice('wavespeed:'.length),
    }
  }
  if (kieRequestId.startsWith('kie:')) {
    return {
      provider: 'kie',
      requestId: kieRequestId.slice('kie:'.length),
    }
  }
  // 기존 호환성: prefix 없으면 kie로 가정
  return {
    provider: 'kie',
    requestId: kieRequestId,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
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

    const { requestId } = await params

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // 쿼리 파라미터로 단계 확인
    const { searchParams } = new URL(request.url)
    const phase = searchParams.get('phase') || 'auto'  // 'image', 'video', or 'auto'

    // videoAdId로 현재 상태 확인 (auto인 경우)
    if (phase === 'auto') {
      // requestId가 video ad ID인 경우
      const { data: videoAd } = await supabase
        .from('video_ads')
        .select('id, status, fal_image_request_id, fal_request_id, kie_request_id, prompt, first_scene_image_url, duration, resolution, category')
        .eq('id', requestId)
        .eq('user_id', user.id)
        .single()

      if (videoAd) {
        // 제품 설명 영상 (Infinitalk) 처리 - WaveSpeed 또는 Kie.ai
        if (videoAd.category === 'productDescription' && videoAd.kie_request_id) {
          return await handleInfinitalkPhase(supabase, user.id, videoAd)
        }

        // 현재 상태에 따라 분기 (기존 fal.ai 플로우)
        if (['IMAGE_IN_QUEUE', 'IMAGE_IN_PROGRESS'].includes(videoAd.status) && videoAd.fal_image_request_id) {
          return await handleImagePhase(supabase, user.id, videoAd)
        } else if (['IN_QUEUE', 'IN_PROGRESS'].includes(videoAd.status) && videoAd.fal_request_id) {
          return await handleVideoPhase(supabase, user.id, videoAd.fal_request_id)
        } else {
          // DB에서 현재 상태 반환
          return NextResponse.json({
            status: videoAd.status,
            firstSceneImageUrl: videoAd.first_scene_image_url,
          })
        }
      }
    }

    // 이미지 생성 단계
    if (phase === 'image') {
      const { data: videoAd } = await supabase
        .from('video_ads')
        .select('id, status, fal_image_request_id, prompt, duration, resolution')
        .eq('fal_image_request_id', requestId)
        .eq('user_id', user.id)
        .single()

      if (!videoAd) {
        return NextResponse.json({ error: 'Video ad not found' }, { status: 404 })
      }

      return await handleImagePhase(supabase, user.id, videoAd)
    }

    // 영상 생성 단계
    if (phase === 'video') {
      return await handleVideoPhase(supabase, user.id, requestId)
    }

    // 기존 호환성: fal_request_id로 직접 조회
    return await handleVideoPhase(supabase, user.id, requestId)

  } catch (error) {
    console.error('영상 광고 상태 확인 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 이미지 생성 단계 처리
async function handleImagePhase(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createClient> extends Promise<infer T> ? T : never,
  userId: string,
  videoAd: {
    id: string
    status: string
    fal_image_request_id: string | null
    prompt: string | null
    duration: number | null
    resolution: string | null
  }
) {
  if (!videoAd.fal_image_request_id) {
    return NextResponse.json({ error: 'No image request found' }, { status: 400 })
  }

  const status = await getImageAdQueueStatus(videoAd.fal_image_request_id)

  // 이미지 생성 완료
  if (status.status === 'COMPLETED') {
    const result = await getImageAdQueueResponse(videoAd.fal_image_request_id)

    if (result.images && result.images.length > 0) {
      const falImageUrl = result.images[0].url
      let firstSceneImageUrl = falImageUrl

      // R2에 원본/압축본 업로드
      try {
        const uploadResult = await uploadExternalImageToR2(
          falImageUrl,
          'video-ads/first-scene',
          videoAd.id
        )
        firstSceneImageUrl = uploadResult.compressedUrl
        console.log('영상 광고 첫 씬 이미지 R2 업로드 완료:', { id: videoAd.id, compressedUrl: firstSceneImageUrl })
      } catch (uploadError) {
        console.error('영상 광고 첫 씬 이미지 R2 업로드 실패, fal.ai URL 사용:', uploadError)
        // 업로드 실패 시 fal.ai URL 그대로 사용
      }

      // 첫 씬 이미지 저장
      await supabase
        .from('video_ads')
        .update({
          status: 'IN_QUEUE',
          first_scene_image_url: firstSceneImageUrl,
        })
        .eq('id', videoAd.id)

      // 영상 생성 요청
      const videoQueueResponse = await submitVideoAdToQueue({
        prompt: videoAd.prompt || 'Product advertisement video',
        image_url: firstSceneImageUrl,
        duration: (videoAd.duration || 5) as VideoDuration,
        resolution: (videoAd.resolution || '1080p') as VideoResolution,
        negative_prompt: 'text, letters, words, watermark, logo, blurry, low quality, distorted, deformed',
        enable_prompt_expansion: false,
      })

      // 영상 요청 ID 저장
      await supabase
        .from('video_ads')
        .update({
          fal_request_id: videoQueueResponse.request_id,
        })
        .eq('id', videoAd.id)

      return NextResponse.json({
        status: 'IN_QUEUE',
        phase: 'video',
        firstSceneImageUrl,
        videoRequestId: videoQueueResponse.request_id,
      })
    } else {
      // 이미지 생성 실패
      await supabase
        .from('video_ads')
        .update({
          status: 'FAILED',
          error_message: 'No image generated',
        })
        .eq('id', videoAd.id)

      return NextResponse.json({
        status: 'FAILED',
        error: 'No image generated',
      })
    }
  }

  // 이미지 생성 진행 중
  if (status.status === 'IN_PROGRESS') {
    await supabase
      .from('video_ads')
      .update({ status: 'IMAGE_IN_PROGRESS' })
      .eq('id', videoAd.id)
  }

  return NextResponse.json({
    status: status.status === 'IN_QUEUE' ? 'IMAGE_IN_QUEUE' : 'IMAGE_IN_PROGRESS',
    phase: 'image',
    queuePosition: status.queue_position,
  })
}

// 영상 생성 단계 처리
async function handleVideoPhase(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createClient> extends Promise<infer T> ? T : never,
  userId: string,
  requestId: string
) {
  const status = await getVideoAdQueueStatus(requestId)

  // 완료된 경우 결과 반환 및 DB 업데이트
  if (status.status === 'COMPLETED') {
    const result = await getVideoAdQueueResponse(requestId)

    if (result.video && result.video.url) {
      // DB에서 first_scene_image_url 가져오기
      const { data: existingAd } = await supabase
        .from('video_ads')
        .select('first_scene_image_url')
        .eq('fal_request_id', requestId)
        .eq('user_id', userId)
        .single()

      // DB 업데이트
      const { error: updateError } = await supabase
        .from('video_ads')
        .update({
          status: 'COMPLETED',
          video_url: result.video.url,
          video_width: result.video.width,
          video_height: result.video.height,
          video_fps: result.video.fps,
          video_duration: result.video.duration,
          seed: result.seed,
          prompt_expanded: result.actual_prompt,
          completed_at: new Date().toISOString(),
        })
        .eq('fal_request_id', requestId)
        .eq('user_id', userId)

      if (updateError) {
        console.error('영상 광고 DB 업데이트 오류:', updateError)
      }

      return NextResponse.json({
        status: 'COMPLETED',
        phase: 'video',
        videoUrl: result.video.url,
        firstSceneImageUrl: existingAd?.first_scene_image_url,
        width: result.video.width,
        height: result.video.height,
        fps: result.video.fps,
        duration: result.video.duration,
        seed: result.seed,
        actualPrompt: result.actual_prompt,
      })
    } else {
      // 실패 상태로 DB 업데이트
      await supabase
        .from('video_ads')
        .update({
          status: 'FAILED',
          error_message: 'No video generated',
        })
        .eq('fal_request_id', requestId)
        .eq('user_id', userId)

      return NextResponse.json({
        status: 'FAILED',
        error: 'No video generated',
      })
    }
  }

  // 진행 중인 경우 상태 업데이트
  if (status.status === 'IN_PROGRESS') {
    await supabase
      .from('video_ads')
      .update({ status: 'IN_PROGRESS' })
      .eq('fal_request_id', requestId)
      .eq('user_id', userId)
  }

  // 진행 중인 경우 상태 반환 (first_scene_image_url도 함께)
  const { data: existingAd } = await supabase
    .from('video_ads')
    .select('first_scene_image_url')
    .eq('fal_request_id', requestId)
    .eq('user_id', userId)
    .single()

  return NextResponse.json({
    status: status.status,
    phase: 'video',
    firstSceneImageUrl: existingAd?.first_scene_image_url,
    queuePosition: status.queue_position,
  })
}

// Infinitalk (제품 설명 영상) 단계 처리 - WaveSpeed 또는 Kie.ai
async function handleInfinitalkPhase(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createClient> extends Promise<infer T> ? T : never,
  userId: string,
  videoAd: {
    id: string
    status: string
    kie_request_id: string | null
    first_scene_image_url: string | null
  }
) {
  if (!videoAd.kie_request_id) {
    return NextResponse.json({ error: 'No Infinitalk request found' }, { status: 400 })
  }

  // provider와 실제 request ID 파싱
  const { provider, requestId } = parseRequestId(videoAd.kie_request_id)

  let status: { status: string; queue_position?: number }
  let videoUrl: string | null = null

  try {
    if (provider === 'wavespeed') {
      // WaveSpeed InfiniteTalk 상태 조회
      const wavespeedStatus = await getWavespeedInfiniteTalkQueueStatus(requestId)
      status = { status: wavespeedStatus.status }

      // 완료된 경우 결과 가져오기
      if (wavespeedStatus.status === 'COMPLETED') {
        const result = await getWavespeedInfiniteTalkQueueResponse(requestId)
        if (result.videos && result.videos.length > 0) {
          videoUrl = result.videos[0].url
        }
      }
    } else {
      // Kie.ai Infinitalk 상태 조회
      const kieStatus = await getKieInfinitalkQueueStatus(requestId)
      status = { status: kieStatus.status, queue_position: kieStatus.queue_position }

      // 완료된 경우 결과 가져오기
      if (kieStatus.status === 'COMPLETED') {
        const result = await getKieInfinitalkQueueResponse(requestId)
        if (result.videos && result.videos.length > 0) {
          videoUrl = result.videos[0].url
        }
      }
    }
  } catch (error) {
    console.error(`${provider} Infinitalk 상태 조회 오류:`, error)
    return NextResponse.json({
      status: 'FAILED',
      error: 'Failed to check video status',
    })
  }

  // 완료된 경우 결과 반환 및 DB 업데이트
  if (status.status === 'COMPLETED' && videoUrl) {
    // DB 업데이트
    const { error: updateError } = await supabase
      .from('video_ads')
      .update({
        status: 'COMPLETED',
        video_url: videoUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', videoAd.id)
      .eq('user_id', userId)

    if (updateError) {
      console.error('영상 광고 DB 업데이트 오류:', updateError)
    }

    return NextResponse.json({
      status: 'COMPLETED',
      phase: 'infinitalk',
      provider,
      videoUrl: videoUrl,
      firstSceneImageUrl: videoAd.first_scene_image_url,
    })
  }

  // 실패한 경우
  if (status.status === 'FAILED' || (status.status === 'COMPLETED' && !videoUrl)) {
    await supabase
      .from('video_ads')
      .update({
        status: 'FAILED',
        error_message: 'No video generated',
      })
      .eq('id', videoAd.id)
      .eq('user_id', userId)

    return NextResponse.json({
      status: 'FAILED',
      error: 'No video generated',
    })
  }

  // 진행 중인 경우 상태 업데이트
  if (status.status === 'IN_PROGRESS' && videoAd.status !== 'IN_PROGRESS') {
    await supabase
      .from('video_ads')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', videoAd.id)
      .eq('user_id', userId)
  }

  return NextResponse.json({
    status: status.status,
    phase: 'infinitalk',
    provider,
    requestId,  // AI 서비스 실제 요청 ID (prefix 제외)
    firstSceneImageUrl: videoAd.first_scene_image_url,
    queuePosition: status.queue_position,
  })
}
