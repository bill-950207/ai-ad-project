/**
 * 아바타 모션 생성 상태 조회 API
 *
 * GET: 프레임/영상 생성 상태 확인
 * - kie:xxx 형식: kie.ai 상태 조회 (Kling 2.6 포함)
 * - fal:xxx 형식: fal.ai 상태 조회 (Seedream Edit)
 * - wavespeed-vidu:xxx 형식: WaveSpeed Vidu Q2 상태 조회
 * - fal-vidu:xxx 형식: fal.ai Vidu Q2 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getTaskInfo as getKieTaskInfo,
  getGPTImageQueueResponse,
  getSeedanceQueueResponse,
  getKling26QueueResponse,
} from '@/lib/kie/client'
import {
  getSeedreamEditQueueStatus,
  getSeedreamEditQueueResponse,
  getViduQ2QueueStatus,
  getViduQ2QueueResponse,
} from '@/lib/fal/client'
import {
  getViduQueueStatus,
  getViduQueueResponse,
} from '@/lib/wavespeed/client'
import { uploadExternalImageToR2 } from '@/lib/image/compress'

interface RouteContext {
  params: Promise<{ requestId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { requestId: encodedRequestId } = await context.params
    const requestId = decodeURIComponent(encodedRequestId)

    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // provider:taskId 형식 파싱
    const [provider, taskId] = requestId.split(':')

    if (!provider || !taskId) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    // type 파라미터로 프레임/영상 구분
    const type = request.nextUrl.searchParams.get('type') || 'frame'

    let status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    let resultUrl: string | null = null
    let resultUrlOriginal: string | null = null  // 원본 URL (이미지용)
    let errorMessage: string | null = null

    if (provider === 'kie') {
      // kie.ai 상태 조회
      const taskInfo = await getKieTaskInfo(taskId)

      if (taskInfo.state === 'waiting') {
        status = 'IN_QUEUE'
      } else if (taskInfo.state === 'success') {
        status = 'COMPLETED'

        // 결과 URL 가져오기
        if (type === 'video') {
          // Kling 2.6 또는 Seedance 영상 결과 조회
          try {
            const result = await getKling26QueueResponse(taskId)
            resultUrl = result.videos[0]?.url || null
          } catch {
            // Kling 2.6 실패 시 Seedance 시도 (호환성)
            const result = await getSeedanceQueueResponse(taskId)
            resultUrl = result.videos[0]?.url || null
          }
        } else {
          const result = await getGPTImageQueueResponse(taskId)
          const aiImageUrl = result.images[0]?.url || null

          // 이미지인 경우 R2에 업로드
          if (aiImageUrl) {
            try {
              const timestamp = Date.now()
              const uploadResult = await uploadExternalImageToR2(
                aiImageUrl,
                'avatar-motion/frames',
                `${user.id}_${timestamp}`
              )
              resultUrl = uploadResult.compressedUrl
              resultUrlOriginal = uploadResult.originalUrl
            } catch (uploadError) {
              console.error('이미지 R2 업로드 실패, AI 서비스 URL 사용:', uploadError)
              resultUrl = aiImageUrl
              resultUrlOriginal = aiImageUrl
            }
          }
        }
      } else {
        status = 'FAILED'
        errorMessage = taskInfo.failMsg || '알 수 없는 오류'
      }
    } else if (provider === 'fal') {
      // fal.ai 상태 조회 (Seedream Edit)
      const falStatus = await getSeedreamEditQueueStatus(taskId)

      if (falStatus.status === 'IN_QUEUE') {
        status = 'IN_QUEUE'
      } else if (falStatus.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS'
      } else if (falStatus.status === 'COMPLETED') {
        try {
          const result = await getSeedreamEditQueueResponse(taskId)
          if (result.images && result.images.length > 0) {
            status = 'COMPLETED'
            const aiImageUrl = result.images[0]?.url || null

            // 이미지인 경우 R2에 업로드
            if (aiImageUrl) {
              try {
                const timestamp = Date.now()
                const uploadResult = await uploadExternalImageToR2(
                  aiImageUrl,
                  'avatar-motion/frames',
                  `${user.id}_${timestamp}`
                )
                resultUrl = uploadResult.compressedUrl
                resultUrlOriginal = uploadResult.originalUrl
              } catch (uploadError) {
                console.error('이미지 R2 업로드 실패, AI 서비스 URL 사용:', uploadError)
                resultUrl = aiImageUrl
                resultUrlOriginal = aiImageUrl
              }
            }
          } else {
            status = 'FAILED'
            errorMessage = '생성된 이미지가 없습니다'
          }
        } catch (error) {
          status = 'FAILED'
          errorMessage = error instanceof Error ? error.message : '결과 조회 실패'
        }
      } else {
        status = 'IN_PROGRESS'
      }
    } else if (provider === 'wavespeed-vidu') {
      // WaveSpeed Vidu Q2 상태 조회
      try {
        const viduStatus = await getViduQueueStatus(taskId)

        if (viduStatus.status === 'IN_QUEUE') {
          status = 'IN_QUEUE'
        } else if (viduStatus.status === 'IN_PROGRESS') {
          status = 'IN_PROGRESS'
        } else if (viduStatus.status === 'COMPLETED') {
          const result = await getViduQueueResponse(taskId)
          if (result.videos && result.videos.length > 0) {
            status = 'COMPLETED'
            resultUrl = result.videos[0]?.url || null
          } else {
            status = 'FAILED'
            errorMessage = '생성된 영상이 없습니다'
          }
        } else if (viduStatus.status === 'FAILED') {
          status = 'FAILED'
          errorMessage = '영상 생성 실패'
        } else {
          status = 'IN_PROGRESS'
        }
      } catch (error) {
        status = 'FAILED'
        errorMessage = error instanceof Error ? error.message : 'WaveSpeed Vidu 상태 조회 실패'
      }
    } else if (provider === 'fal-vidu') {
      // fal.ai Vidu Q2 상태 조회
      try {
        const viduStatus = await getViduQ2QueueStatus(taskId)

        if (viduStatus.status === 'IN_QUEUE') {
          status = 'IN_QUEUE'
        } else if (viduStatus.status === 'IN_PROGRESS') {
          status = 'IN_PROGRESS'
        } else if (viduStatus.status === 'COMPLETED') {
          const result = await getViduQ2QueueResponse(taskId)
          if (result.video && result.video.url) {
            status = 'COMPLETED'
            resultUrl = result.video.url
          } else {
            status = 'FAILED'
            errorMessage = '생성된 영상이 없습니다'
          }
        } else if (viduStatus.status === 'FAILED') {
          status = 'FAILED'
          errorMessage = '영상 생성 실패'
        } else {
          status = 'IN_PROGRESS'
        }
      } catch (error) {
        status = 'FAILED'
        errorMessage = error instanceof Error ? error.message : 'fal.ai Vidu 상태 조회 실패'
      }
    } else {
      return NextResponse.json(
        { error: 'Unknown provider' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status,
      resultUrl,
      resultUrlOriginal,  // 원본 URL (이미지용, 영상 생성에 사용)
      errorMessage,
    })
  } catch (error) {
    console.error('상태 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
