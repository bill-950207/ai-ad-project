/**
 * AI 트렌딩 도구 - 멀티 세그먼트 상태 확인 + 합성 API
 *
 * GET /api/ai-tools/trending/status/[id]
 *
 * 상태 흐름: PENDING → IN_PROGRESS → COMPOSITING → COMPLETED / FAILED
 * - IN_PROGRESS: 각 세그먼트의 Kling MC 작업 진행 중
 * - COMPOSITING: 모든 세그먼트 완료, FFmpeg 합성 진행 중
 * - COMPLETED: 최종 영상 생성 완료
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { refundCredits, getUserCredits } from '@/lib/credits/utils'
import { recordCreditRefund } from '@/lib/credits/history'
import {
  getFalQueueStatus,
  getFalQueueResult,
  KLING3_MC_STD_MODEL,
  KLING3_MC_PRO_MODEL,
} from '@/lib/fal/client'
import { trimVideo, concatenateVideosWithReencode } from '@/lib/video/ffmpeg'
import { uploadBufferToR2 } from '@/lib/storage/r2'

// ============================================================
// 타입
// ============================================================

interface SegmentTask {
  index: number
  type: 'original' | 'transform'
  startTime: number
  endTime: number
  providerTaskId?: string
  targetImageUrl?: string
  resultUrl?: string // 완료된 세그먼트의 결과 URL
}

interface InputParams {
  sourceVideoUrl: string
  segments: Array<{
    type: 'original' | 'transform'
    startTime: number
    endTime: number
    targetImageUrl?: string
  }>
  tier: string
  segmentTasks: SegmentTask[]
}

// ============================================================
// API 핸들러
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 레코드 조회
    const generation = await prisma.tool_generations.findUnique({
      where: { id },
    })

    if (!generation || generation.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 이미 완료/실패된 경우 바로 반환
    if (generation.status === 'COMPLETED') {
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

    // COMPOSITING 상태면 아직 합성 중
    if (generation.status === 'COMPOSITING') {
      return NextResponse.json({
        status: 'COMPOSITING',
        progress: '영상 합성 중...',
      })
    }

    // PENDING 상태 (아직 제출 전)
    if (generation.status === 'PENDING') {
      return NextResponse.json({ status: 'PENDING' })
    }

    // IN_PROGRESS: 각 세그먼트 상태 확인
    const inputParams = generation.input_params as unknown as InputParams
    if (!inputParams?.segmentTasks) {
      return NextResponse.json({ status: 'IN_PROGRESS' })
    }

    const { segmentTasks, tier } = inputParams
    const transformTasks = segmentTasks.filter((t) => t.type === 'transform')

    let completedCount = 0
    let failedCount = 0
    const updatedTasks = [...segmentTasks]

    for (const task of transformTasks) {
      if (!task.providerTaskId) continue
      if (task.resultUrl) {
        // 이미 이전 폴링에서 완료 확인된 세그먼트
        completedCount++
        continue
      }

      const colonIndex = task.providerTaskId.indexOf(':')
      const provider = task.providerTaskId.substring(0, colonIndex)
      const taskId = task.providerTaskId.substring(colonIndex + 1)

      const model = provider === 'fal-kling3mcp'
        ? KLING3_MC_PRO_MODEL
        : KLING3_MC_STD_MODEL

      try {
        const statusResult = await getFalQueueStatus(model, taskId)

        if (statusResult.status === 'COMPLETED') {
          const response = await getFalQueueResult(model, taskId)
          const resultUrl = response.video?.url
          if (resultUrl) {
            // 업데이트된 태스크에 resultUrl 기록
            const taskIndex = updatedTasks.findIndex((t) => t.index === task.index)
            if (taskIndex >= 0) {
              updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], resultUrl }
            }
            completedCount++
          }
        }
        // IN_QUEUE, IN_PROGRESS → 아직 진행 중 (무시)
      } catch (error) {
        // FAL API 에러 → 해당 세그먼트 실패 처리
        console.error(`[Trending Status] Segment ${task.index} failed:`, error)
        failedCount++
      }
    }

    // segmentTasks 업데이트 (resultUrl 캐싱)
    if (completedCount > 0) {
      await prisma.tool_generations.update({
        where: { id },
        data: {
          input_params: {
            ...inputParams,
            segmentTasks: updatedTasks,
          } as never,
        },
      })
    }

    // 실패한 세그먼트가 있으면 전체 실패 처리
    if (failedCount > 0) {
      const currentCredits = await getUserCredits(user.id)
      await refundCredits(user.id, generation.credits_used)
      await recordCreditRefund({
        userId: user.id,
        featureType: 'TOOL_TRENDING',
        amount: generation.credits_used,
        balanceAfter: currentCredits + generation.credits_used,
        description: '얼굴 변환 실패 환불',
      })

      await prisma.tool_generations.update({
        where: { id },
        data: {
          status: 'FAILED',
          error_message: `${failedCount}개 세그먼트 생성 실패`,
        },
      })

      return NextResponse.json({
        status: 'FAILED',
        error: `${failedCount}개 세그먼트 생성 실패`,
      })
    }

    // 아직 진행 중
    if (completedCount < transformTasks.length) {
      return NextResponse.json({
        status: 'IN_PROGRESS',
        progress: `${completedCount}/${transformTasks.length}`,
        completedSegments: completedCount,
        totalSegments: transformTasks.length,
      })
    }

    // 모든 세그먼트 완료 → 합성 시작
    await prisma.tool_generations.update({
      where: { id },
      data: { status: 'COMPOSITING' },
    })

    try {
      // 모든 세그먼트를 시간순으로 정렬하여 영상 URL 수집
      const sortedTasks = [...updatedTasks].sort((a, b) => a.startTime - b.startTime)
      const videoUrls: string[] = []

      for (const task of sortedTasks) {
        if (task.type === 'original') {
          // 원본 영상에서 해당 구간 트리밍
          const trimmedBuffer = await trimVideo(
            inputParams.sourceVideoUrl,
            task.startTime,
            task.endTime
          )
          const trimmedKey = `trending/${user.id}/orig_${id}_seg${task.index}_${Date.now()}.mp4`
          const trimmedUrl = await uploadBufferToR2(trimmedBuffer, trimmedKey, 'video/mp4')
          videoUrls.push(trimmedUrl)
        } else if (task.resultUrl) {
          // Kling MC 결과 영상
          videoUrls.push(task.resultUrl)
        }
      }

      // FFmpeg로 모든 세그먼트 합치기 (재인코딩 — 코덱 호환)
      const finalBuffer = await concatenateVideosWithReencode(videoUrls, {
        width: 720,
        height: 1280,
        fps: 30,
        videoBitrate: '4000k',
      })

      // R2에 최종 영상 업로드
      const finalKey = `trending/${user.id}/result_${id}_${Date.now()}.mp4`
      const finalUrl = await uploadBufferToR2(finalBuffer, finalKey, 'video/mp4')

      // 완료 처리
      await prisma.tool_generations.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          result_url: finalUrl,
        },
      })

      return NextResponse.json({
        status: 'COMPLETED',
        resultUrl: finalUrl,
      })
    } catch (compositeError) {
      console.error('[Trending Status] Composite error:', compositeError)

      // 합성 실패 — 크레딧 환불
      const currentCredits = await getUserCredits(user.id)
      await refundCredits(user.id, generation.credits_used)
      await recordCreditRefund({
        userId: user.id,
        featureType: 'TOOL_TRENDING',
        amount: generation.credits_used,
        balanceAfter: currentCredits + generation.credits_used,
        description: '얼굴 변환 합성 실패 환불',
      })

      await prisma.tool_generations.update({
        where: { id },
        data: {
          status: 'FAILED',
          error_message: '영상 합성에 실패했습니다',
        },
      })

      return NextResponse.json({
        status: 'FAILED',
        error: '영상 합성에 실패했습니다',
      })
    }
  } catch (error) {
    console.error('[Trending Status]', error)
    return NextResponse.json(
      { error: '상태 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
