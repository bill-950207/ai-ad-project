/**
 * AI 트렌딩 도구 - 멀티 세그먼트 상태 확인 + 합성 API
 *
 * GET /api/ai-tools/trending/status/[id]
 *
 * 상태 흐름: PENDING → IN_PROGRESS → COMPOSITING → COMPLETED / FAILED
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
import { downloadToTemp, trimVideoFromFile, concatenateVideosWithReencode, getVideoResolution } from '@/lib/video/ffmpeg'
import { uploadBufferToR2 } from '@/lib/storage/r2'
import { promises as fs } from 'fs'

// ============================================================
// 타입
// ============================================================

interface SegmentTask {
  index: number
  type: 'original' | 'transform'
  startTime: number
  endTime: number
  originalDuration?: number // 유저 원래 구간 길이 (3초 미만일 때 → Kling 결과를 이 길이로 트림)
  providerTaskId?: string
  targetImageUrl?: string
  resultUrl?: string
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
// 합성 처리 (fire-and-forget)
// ============================================================

async function compositeSegments(
  generationId: string,
  inputParams: InputParams,
  updatedTasks: SegmentTask[],
  userId: string,
  creditsUsed: number
) {
  let sourceTempDir: string | null = null
  const tempDirsToClean: string[] = []

  try {
    // 소스 영상 다운로드 (1회)
    const dl = await downloadToTemp(inputParams.sourceVideoUrl, 'mp4')
    sourceTempDir = dl.tempDir
    const sourceFilePath = dl.filePath

    // 원본 영상 해상도 감지
    let targetWidth = 720
    let targetHeight = 1280
    try {
      const res = await getVideoResolution(inputParams.sourceVideoUrl)
      targetWidth = res.width
      targetHeight = res.height
      console.log(`[Trending Composite] Source resolution: ${targetWidth}x${targetHeight}`)
    } catch (e) {
      console.warn('[Trending Composite] Failed to detect resolution:', e)
    }

    // 모든 세그먼트를 시간순으로 정렬하여 영상 URL 수집
    const sortedTasks = [...updatedTasks].sort((a, b) => a.startTime - b.startTime)
    const videoUrls: string[] = []

    // 원본 세그먼트 트리밍 (로컬 파일 기반, 병렬)
    const originalTasks = sortedTasks.filter((t) => t.type === 'original')
    const originalUrls = await Promise.all(
      originalTasks.map(async (task) => {
        const trimmedBuffer = await trimVideoFromFile(sourceFilePath, task.startTime, task.endTime)
        const trimmedKey = `trending/${userId}/orig_${generationId}_seg${task.index}_${Date.now()}.mp4`
        return uploadBufferToR2(trimmedBuffer, trimmedKey, 'video/mp4')
      })
    )

    // URL 매핑 생성
    const originalUrlMap = new Map<number, string>()
    originalTasks.forEach((task, i) => { originalUrlMap.set(task.index, originalUrls[i]) })

    // 시간순으로 URL 수집 (3초 미만 구간은 Kling 결과를 원래 길이로 트림)
    for (const task of sortedTasks) {
      if (task.type === 'original') {
        const url = originalUrlMap.get(task.index)
        if (url) videoUrls.push(url)
      } else if (task.resultUrl) {
        if (task.originalDuration && task.originalDuration < 3) {
          // Kling MC는 3초로 생성했으므로, 유저가 선택한 원래 길이로 트림
          const trimmedBuffer = await trimVideoFromFile(
            // Kling 결과는 URL이므로 다운로드 후 트림
            await (async () => {
              const dl = await downloadToTemp(task.resultUrl!, 'mp4')
              tempDirsToClean.push(dl.tempDir)
              return dl.filePath
            })(),
            0,
            task.originalDuration
          )
          const trimmedKey = `trending/${userId}/klingtrim_${generationId}_seg${task.index}_${Date.now()}.mp4`
          const trimmedUrl = await uploadBufferToR2(trimmedBuffer, trimmedKey, 'video/mp4')
          videoUrls.push(trimmedUrl)
        } else {
          videoUrls.push(task.resultUrl)
        }
      }
    }

    // FFmpeg 합성 (비디오만 — 오디오는 원본에서 추출하여 합성)
    const finalBuffer = await concatenateVideosWithReencode(videoUrls, {
      width: targetWidth,
      height: targetHeight,
      fps: 30,
      videoBitrate: '4000k',
    })

    // R2에 최종 영상 업로드
    const finalKey = `trending/${userId}/result_${generationId}_${Date.now()}.mp4`
    const finalUrl = await uploadBufferToR2(finalBuffer, finalKey, 'video/mp4')

    // 완료 처리
    await prisma.tool_generations.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETED',
        result_url: finalUrl,
      },
    })

    console.log(`[Trending Composite] Completed: ${finalUrl}`)
  } catch (compositeError) {
    console.error('[Trending Composite] Error:', compositeError)

    // 합성 실패 — atomic 상태 변경 + 크레딧 환불
    const updated = await prisma.tool_generations.updateMany({
      where: { id: generationId, status: { not: 'FAILED' } },
      data: {
        status: 'FAILED',
        error_message: '영상 합성에 실패했습니다',
      },
    })

    if (updated.count > 0) {
      const currentCredits = await getUserCredits(userId)
      await refundCredits(userId, creditsUsed)
      await recordCreditRefund({
        userId,
        featureType: 'TOOL_TRENDING',
        amount: creditsUsed,
        balanceAfter: currentCredits + creditsUsed,
        description: '얼굴 변환 합성 실패 환불',
      })
    }
  } finally {
    // 임시 디렉토리 정리
    const allTempDirs = sourceTempDir ? [sourceTempDir, ...tempDirsToClean] : tempDirsToClean
    for (const dir of allTempDirs) {
      try { await fs.rm(dir, { recursive: true, force: true }) } catch { /* 무시 */ }
    }
  }
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

    const { segmentTasks } = inputParams
    const transformTasks = segmentTasks.filter((t) => t.type === 'transform')

    let completedCount = 0
    let failedCount = 0
    const updatedTasks = [...segmentTasks]

    for (const task of transformTasks) {
      if (!task.providerTaskId) continue
      if (task.resultUrl) {
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
            const taskIndex = updatedTasks.findIndex((t) => t.index === task.index)
            if (taskIndex >= 0) {
              updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], resultUrl }
            }
            completedCount++
          }
        }
      } catch (error) {
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

    // 실패한 세그먼트가 있으면 전체 실패 처리 (atomic — 이중 환불 방지)
    if (failedCount > 0) {
      const updated = await prisma.tool_generations.updateMany({
        where: { id, status: { not: 'FAILED' } },
        data: {
          status: 'FAILED',
          error_message: `${failedCount}개 세그먼트 생성 실패`,
        },
      })

      // 이미 FAILED면 환불 스킵
      if (updated.count > 0) {
        const currentCredits = await getUserCredits(user.id)
        await refundCredits(user.id, generation.credits_used)
        await recordCreditRefund({
          userId: user.id,
          featureType: 'TOOL_TRENDING',
          amount: generation.credits_used,
          balanceAfter: currentCredits + generation.credits_used,
          description: '얼굴 변환 실패 환불',
        })
      }

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

    // 모든 세그먼트 완료 → COMPOSITING 전환 (atomic — 중복 합성 방지)
    const compositeUpdate = await prisma.tool_generations.updateMany({
      where: { id, status: 'IN_PROGRESS' },
      data: { status: 'COMPOSITING' },
    })

    if (compositeUpdate.count > 0) {
      // fire-and-forget: 합성 시작 (GET 요청은 즉시 반환)
      compositeSegments(id, inputParams, updatedTasks, user.id, generation.credits_used)
        .catch((err) => console.error('[Trending Composite] Unhandled:', err))
    }

    return NextResponse.json({
      status: 'COMPOSITING',
      progress: '영상 합성 중...',
    })
  } catch (error) {
    console.error('[Trending Status]', error)
    return NextResponse.json(
      { error: '상태 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
