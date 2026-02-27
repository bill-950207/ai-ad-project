/**
 * 제품 광고 생성 상태 조회 API
 *
 * GET: 이미지/영상 생성 상태 확인
 * - fal-seedream:xxx 형식: FAL.ai Seedream 5.0 Lite 상태 조회
 * - kie:xxx 형식: kie.ai 상태 조회 (하위 호환)
 * - fal:xxx 형식: fal.ai 상태 조회 (Kling O1)
 * - fal-vidu-q2:xxx 형식: FAL.ai Vidu Q2 Turbo 상태 조회
 * - wavespeed-vidu:xxx 형식: WaveSpeed Vidu Q3 Turbo 상태 조회
 * - 이미지 완료 시 AI 서비스 원본 URL 반환 (클라이언트에서 R2 업로드)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getTaskInfo as getKieTaskInfo,
  getGPTImageQueueResponse,
  getSeedanceQueueResponse,
  getWan26QueueResponse,
} from '@/lib/kie/client'
import {
  getKlingO1QueueStatus,
  getKlingO1QueueResponse,
  getViduQ2QueueStatus,
  getViduQ2QueueResponse,
  getSeedreamEditQueueStatus,
  getSeedreamEditQueueResponse,
} from '@/lib/fal/client'
import {
  getViduQueueStatus as getWaveSpeedViduQueueStatus,
  getViduQueueResponse as getWaveSpeedViduQueueResponse,
} from '@/lib/wavespeed/client'

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
    const colonIndex = requestId.indexOf(':')
    if (colonIndex === -1) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      )
    }
    const provider = requestId.substring(0, colonIndex)
    const taskId = requestId.substring(colonIndex + 1)

    if (!provider || !taskId) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    // type 파라미터로 이미지/영상 구분
    const type = request.nextUrl.searchParams.get('type') || 'image'

    let status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    let resultUrl: string | null = null
    const originalUrl: string | null = null
    let errorMessage: string | null = null

    if (provider === 'fal-seedream') {
      // FAL.ai Seedream 5.0 Lite 상태 조회 (키프레임 이미지)
      const statusInfo = await getSeedreamEditQueueStatus(taskId)

      if (statusInfo.status === 'IN_QUEUE') {
        status = 'IN_QUEUE'
      } else if (statusInfo.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS'
      } else if (statusInfo.status === 'COMPLETED') {
        status = 'COMPLETED'

        try {
          const result = await getSeedreamEditQueueResponse(taskId)
          resultUrl = result.images[0]?.url || null
        } catch (resultError) {
          console.error('Seedream 5 결과 조회 오류:', resultError)
          status = 'FAILED'
          errorMessage = 'Failed to get result'
        }
      } else {
        status = 'IN_PROGRESS'
      }
    } else if (provider === 'kie') {
      // kie.ai 상태 조회
      const taskInfo = await getKieTaskInfo(taskId)

      // kie.ai 상태: 'waiting', 'running', 'success', 'fail'
      if (taskInfo.state === 'waiting') {
        status = 'IN_QUEUE'
      } else if (taskInfo.state === 'running' || taskInfo.state === 'processing') {
        // 실행 중인 상태 처리
        status = 'IN_PROGRESS'
      } else if (taskInfo.state === 'success') {
        status = 'COMPLETED'

        // 결과 URL 가져오기
        if (type === 'video') {
          // 영상 결과 조회 (Seedance 또는 Wan 2.6)
          try {
            const result = await getSeedanceQueueResponse(taskId)
            resultUrl = result.videos[0]?.url || null
          } catch {
            // Seedance가 아니면 Wan 2.6 시도
            const result = await getWan26QueueResponse(taskId)
            resultUrl = result.videos[0]?.url || null
          }
        } else {
          // GPT Image 결과 조회
          const result = await getGPTImageQueueResponse(taskId)
          const externalImageUrl = result.images[0]?.url || null

          if (externalImageUrl) {
            // AI 서비스 원본 URL 반환 (클라이언트에서 R2 업로드)
            resultUrl = externalImageUrl
          }
        }
      } else if (taskInfo.state === 'fail') {
        status = 'FAILED'
        errorMessage = taskInfo.failMsg || '알 수 없는 오류'
      } else {
        // 알 수 없는 상태는 진행 중으로 처리 (안전한 기본값)
        status = 'IN_PROGRESS'
      }
    } else if (provider === 'fal') {
      // fal.ai 상태 조회 (Kling O1)
      const statusInfo = await getKlingO1QueueStatus(taskId)

      if (statusInfo.status === 'IN_QUEUE') {
        status = 'IN_QUEUE'
      } else if (statusInfo.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS'
      } else if (statusInfo.status === 'COMPLETED') {
        status = 'COMPLETED'

        // Kling O1 결과 조회 (영상)
        try {
          const result = await getKlingO1QueueResponse(taskId)
          resultUrl = result.video?.url || null
        } catch (resultError) {
          console.error('Kling O1 결과 조회 오류:', resultError)
          status = 'FAILED'
          errorMessage = 'Failed to get result'
        }
      } else {
        // 알 수 없는 상태는 진행 중으로 처리
        status = 'IN_PROGRESS'
      }
    } else if (provider === 'fal-vidu-q2') {
      // FAL.ai Vidu Q2 Turbo 상태 조회
      const statusInfo = await getViduQ2QueueStatus(taskId)

      if (statusInfo.status === 'IN_QUEUE') {
        status = 'IN_QUEUE'
      } else if (statusInfo.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS'
      } else if (statusInfo.status === 'COMPLETED') {
        status = 'COMPLETED'

        // Vidu Q2 결과 조회 (영상)
        try {
          const result = await getViduQ2QueueResponse(taskId)
          resultUrl = result.video?.url || null
        } catch (resultError) {
          console.error('Vidu Q2 결과 조회 오류:', resultError)
          status = 'FAILED'
          errorMessage = 'Failed to get result'
        }
      } else {
        // 알 수 없는 상태는 진행 중으로 처리
        status = 'IN_PROGRESS'
      }
    } else if (provider === 'wavespeed-vidu') {
      // WaveSpeed Vidu Q3 Turbo 상태 조회
      const statusInfo = await getWaveSpeedViduQueueStatus(taskId)

      if (statusInfo.status === 'IN_QUEUE') {
        status = 'IN_QUEUE'
      } else if (statusInfo.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS'
      } else if (statusInfo.status === 'COMPLETED') {
        status = 'COMPLETED'

        // WaveSpeed Vidu Q3 Turbo 결과 조회 (영상)
        try {
          const result = await getWaveSpeedViduQueueResponse(taskId)
          resultUrl = result.videos[0]?.url || null
        } catch (resultError) {
          console.error('WaveSpeed Vidu Q3 Turbo 결과 조회 오류:', resultError)
          status = 'FAILED'
          errorMessage = 'Failed to get result'
        }
      } else if (statusInfo.status === 'FAILED') {
        status = 'FAILED'
        errorMessage = 'Video generation failed'
      } else {
        // 알 수 없는 상태는 진행 중으로 처리
        status = 'IN_PROGRESS'
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
      originalUrl,
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
