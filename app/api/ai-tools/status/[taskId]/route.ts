/**
 * AI 도구 - 생성 상태 폴링 API (영상/이미지 공용)
 *
 * GET /api/ai-tools/status/[taskId]
 *
 * taskId 형식: provider_task_id (tool_generations.id)
 * provider_task_id에서 프로바이더를 추출하여 해당 API로 상태 조회
 *
 * 프로바이더 접두사:
 * - fal-seedance:xxx → FAL.ai (Seedance 1.5 Pro I2V)
 * - fal-seedance-t2v:xxx → FAL.ai (Seedance 1.5 Pro T2V)
 * - byteplus:xxx → BytePlus (Seedance, 하위 호환)
 * - wavespeed-vidu:xxx → WaveSpeed (Vidu Q3)
 * - fal-seedream-v5:xxx → FAL.ai (Seedream 5.0 Lite Edit)
 * - fal-seedream-v5-t2i:xxx → FAL.ai (Seedream 5.0 Lite T2I)
 * - kie-edit:xxx → Kie.ai (Seedream 4.5, 하위 호환)
 * - kie-zimage:xxx → Kie.ai (Z-Image)
 * - kie-seedream-v4:xxx → Kie.ai (Seedream V4, 하위 호환)
 * - fal-flux2:xxx → FAL.ai (FLUX.2 Pro)
 * - fal-grok-img:xxx → FAL.ai (Grok Imagine Image)
 * - fal-kling3s-i2v:xxx → FAL.ai (Kling 3.0 Standard I2V)
 * - fal-kling3s-t2v:xxx → FAL.ai (Kling 3.0 Standard T2V)
 * - fal-kling3p-i2v:xxx → FAL.ai (Kling 3.0 Pro I2V)
 * - fal-kling3p-t2v:xxx → FAL.ai (Kling 3.0 Pro T2V)
 * - fal-grok-vid-i2v:xxx → FAL.ai (Grok Imagine Video I2V)
 * - fal-grok-vid-t2v:xxx → FAL.ai (Grok Imagine Video T2V)
 * - fal-wan26-i2v:xxx → FAL.ai (Wan 2.6 I2V)
 * - fal-wan26-t2v:xxx → FAL.ai (Wan 2.6 T2V)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { refundCredits, getUserCredits } from '@/lib/credits/utils'
import { recordCreditRefund } from '@/lib/credits/history'
import { getVideoTaskStatus } from '@/lib/byteplus/client'
import { getViduQueueStatus, getViduQueueResponse } from '@/lib/wavespeed/client'
import { getEditQueueStatus, getEditQueueResponse, getZImageQueueStatus, getZImageQueueResponse, getSeedreamV4QueueStatus, getSeedreamV4QueueResponse } from '@/lib/kie/client'
import {
  getSeedreamEditQueueStatus, getSeedreamEditQueueResponse,
  getSeedreamT2IQueueStatus, getSeedreamT2IQueueResponse,
  getSeedanceQueueStatus, getSeedanceQueueResponse,
  getSeedanceT2VQueueStatus, getSeedanceT2VQueueResponse,
  getFalQueueStatus, getFalQueueResult,
  FLUX2_PRO_MODEL, GROK_IMAGE_MODEL,
  KLING3_STD_I2V_MODEL, KLING3_STD_T2V_MODEL,
  KLING3_PRO_I2V_MODEL, KLING3_PRO_T2V_MODEL,
  GROK_VIDEO_I2V_MODEL, GROK_VIDEO_T2V_MODEL,
  WAN26_I2V_MODEL, WAN26_T2V_MODEL,
} from '@/lib/fal/client'

// ============================================================
// 상태 조회 결과 타입
// ============================================================

interface StatusResult {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  resultUrl?: string
  error?: string
}

// ============================================================
// 프로바이더별 상태 조회
// ============================================================

async function getProviderStatus(providerTaskId: string): Promise<StatusResult> {
  const colonIndex = providerTaskId.indexOf(':')
  if (colonIndex === -1) {
    throw new Error('잘못된 taskId 형식')
  }

  const provider = providerTaskId.substring(0, colonIndex)
  const taskId = providerTaskId.substring(colonIndex + 1)

  switch (provider) {
    case 'fal-seedance': {
      const statusResult = await getSeedanceQueueStatus(taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getSeedanceQueueResponse(taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.video?.url,
        }
      }
      return { status: statusResult.status }
    }

    case 'fal-seedance-t2v': {
      const statusResult = await getSeedanceT2VQueueStatus(taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getSeedanceT2VQueueResponse(taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.video?.url,
        }
      }
      return { status: statusResult.status }
    }

    case 'byteplus': {
      // 하위 호환: 기존 BytePlus Seedance 작업
      const result = await getVideoTaskStatus(taskId)
      return {
        status: result.status,
        resultUrl: result.videoUrl,
        error: result.error,
      }
    }

    case 'wavespeed-vidu': {
      const statusResult = await getViduQueueStatus(taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getViduQueueResponse(taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.videos[0]?.url,
        }
      }
      return { status: statusResult.status }
    }

    case 'fal-seedream-v5': {
      const statusResult = await getSeedreamEditQueueStatus(taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getSeedreamEditQueueResponse(taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.images[0]?.url,
        }
      }
      return { status: statusResult.status }
    }

    case 'fal-seedream-v5-t2i': {
      const statusResult = await getSeedreamT2IQueueStatus(taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getSeedreamT2IQueueResponse(taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.images[0]?.url,
        }
      }
      return { status: statusResult.status }
    }

    case 'kie-edit': {
      // 하위 호환: 기존 진행 중인 Kie.ai 작업 지원
      const statusResult = await getEditQueueStatus(taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getEditQueueResponse(taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.images[0]?.url,
        }
      }
      return { status: statusResult.status }
    }

    case 'kie-zimage': {
      const statusResult = await getZImageQueueStatus(taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getZImageQueueResponse(taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.images[0]?.url,
        }
      }
      return { status: statusResult.status }
    }

    case 'kie-seedream-v4': {
      // 하위 호환: 기존 진행 중인 Kie.ai Seedream V4 작업 지원
      const statusResult = await getSeedreamV4QueueStatus(taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getSeedreamV4QueueResponse(taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.images[0]?.url,
        }
      }
      return { status: statusResult.status }
    }

    // FLUX.2 Pro (이미지)
    case 'fal-flux2': {
      const statusResult = await getFalQueueStatus(FLUX2_PRO_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(FLUX2_PRO_MODEL, taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.images?.[0]?.url,
        }
      }
      return { status: statusResult.status }
    }

    // Grok Imagine Image (이미지)
    case 'fal-grok-img': {
      const statusResult = await getFalQueueStatus(GROK_IMAGE_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(GROK_IMAGE_MODEL, taskId)
        return {
          status: 'COMPLETED',
          resultUrl: response.images?.[0]?.url,
        }
      }
      return { status: statusResult.status }
    }

    // Kling 3.0 Standard (영상)
    case 'fal-kling3s-i2v': {
      const statusResult = await getFalQueueStatus(KLING3_STD_I2V_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(KLING3_STD_I2V_MODEL, taskId)
        return { status: 'COMPLETED', resultUrl: response.video?.url }
      }
      return { status: statusResult.status }
    }

    case 'fal-kling3s-t2v': {
      const statusResult = await getFalQueueStatus(KLING3_STD_T2V_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(KLING3_STD_T2V_MODEL, taskId)
        return { status: 'COMPLETED', resultUrl: response.video?.url }
      }
      return { status: statusResult.status }
    }

    // Kling 3.0 Pro (영상)
    case 'fal-kling3p-i2v': {
      const statusResult = await getFalQueueStatus(KLING3_PRO_I2V_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(KLING3_PRO_I2V_MODEL, taskId)
        return { status: 'COMPLETED', resultUrl: response.video?.url }
      }
      return { status: statusResult.status }
    }

    case 'fal-kling3p-t2v': {
      const statusResult = await getFalQueueStatus(KLING3_PRO_T2V_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(KLING3_PRO_T2V_MODEL, taskId)
        return { status: 'COMPLETED', resultUrl: response.video?.url }
      }
      return { status: statusResult.status }
    }

    // Grok Imagine Video (영상) - I2V/T2V 명시적 prefix
    case 'fal-grok-vid-i2v': {
      const statusResult = await getFalQueueStatus(GROK_VIDEO_I2V_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(GROK_VIDEO_I2V_MODEL, taskId)
        return { status: 'COMPLETED', resultUrl: response.video?.url }
      }
      return { status: statusResult.status }
    }

    case 'fal-grok-vid-t2v': {
      const statusResult = await getFalQueueStatus(GROK_VIDEO_T2V_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(GROK_VIDEO_T2V_MODEL, taskId)
        return { status: 'COMPLETED', resultUrl: response.video?.url }
      }
      return { status: statusResult.status }
    }

    // Wan 2.6 (영상) - I2V/T2V 명시적 prefix
    case 'fal-wan26-i2v': {
      const statusResult = await getFalQueueStatus(WAN26_I2V_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(WAN26_I2V_MODEL, taskId)
        return { status: 'COMPLETED', resultUrl: response.video?.url }
      }
      return { status: statusResult.status }
    }

    case 'fal-wan26-t2v': {
      const statusResult = await getFalQueueStatus(WAN26_T2V_MODEL, taskId)
      if (statusResult.status === 'COMPLETED') {
        const response = await getFalQueueResult(WAN26_T2V_MODEL, taskId)
        return { status: 'COMPLETED', resultUrl: response.video?.url }
      }
      return { status: statusResult.status }
    }

    default:
      throw new Error(`알 수 없는 프로바이더: ${provider}`)
  }
}

// ============================================================
// GET 핸들러
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params

    // tool_generations에서 레코드 조회
    const generation = await prisma.tool_generations.findFirst({
      where: {
        id: taskId,
        user_id: user.id,
      },
    })

    if (!generation) {
      return NextResponse.json({ error: '생성 기록을 찾을 수 없습니다' }, { status: 404 })
    }

    // 이미 완료된 경우 DB 결과 반환
    if (generation.status === 'COMPLETED' && generation.result_url) {
      return NextResponse.json({
        status: 'COMPLETED',
        resultUrl: generation.result_url,
      })
    }

    if (generation.status === 'FAILED') {
      return NextResponse.json({
        status: 'FAILED',
        error: generation.error_message,
      })
    }

    // Provider에서 상태 조회
    if (!generation.provider_task_id) {
      return NextResponse.json({ status: generation.status })
    }

    const result = await getProviderStatus(generation.provider_task_id)

    // COMPLETED 시 DB 업데이트
    if (result.status === 'COMPLETED' && result.resultUrl) {
      await prisma.tool_generations.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          result_url: result.resultUrl,
        },
      })
    }

    // FAILED 시 DB 업데이트 + 크레딧 환불
    if (result.status === 'FAILED') {
      await prisma.tool_generations.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error_message: result.error || '생성에 실패했습니다',
        },
      })

      // 크레딧 환불 (이미 차감된 상태에서 provider가 실패한 경우)
      if (generation.credits_used > 0) {
        try {
          await refundCredits(user.id, generation.credits_used)
          const currentCredits = await getUserCredits(user.id)
          const featureType = generation.type === 'video' ? 'TOOL_VIDEO' as const : 'TOOL_IMAGE' as const
          await recordCreditRefund({
            userId: user.id,
            featureType,
            amount: generation.credits_used,
            balanceAfter: currentCredits,
            relatedEntityId: generation.id,
            description: `${generation.model} 생성 실패 - 환불`,
          })
        } catch (refundError) {
          console.error('[AI Tools Status] 크레딧 환불 실패:', refundError)
        }
      }
    }

    // IN_PROGRESS 상태 업데이트
    if (result.status === 'IN_PROGRESS' && generation.status !== 'IN_PROGRESS') {
      await prisma.tool_generations.update({
        where: { id: generation.id },
        data: { status: 'IN_PROGRESS' },
      })
    }

    return NextResponse.json({
      status: result.status,
      resultUrl: result.resultUrl,
      error: result.error,
    })
  } catch (error) {
    console.error('[AI Tools Status]', error)
    return NextResponse.json(
      { error: '상태 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
