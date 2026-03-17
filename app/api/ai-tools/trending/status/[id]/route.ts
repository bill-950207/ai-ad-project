export const maxDuration = 300 // 5분 (Vercel Pro — 합성에 시간 소요)

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
import { downloadToTemp, trimVideoFromFile, concatenateVideosWithReencode, getVideoResolutionFromFile } from '@/lib/video/ffmpeg'
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
  trimOffset?: number       // Kling 결과에서 건너뛸 시간 (startTime 앞당김 시)
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

    // 원본 영상 해상도 감지 (로컬 파일에서 직접)
    let targetWidth = 720
    let targetHeight = 1280
    try {
      const res = await getVideoResolutionFromFile(sourceFilePath)
      targetWidth = res.width
      targetHeight = res.height
      console.log(`[Trending Composite] Source resolution: ${targetWidth}x${targetHeight}`)
    } catch (e) {
      console.warn('[Trending Composite] Failed to detect resolution:', e)
    }

    // 모든 세그먼트를 시간순으로 정렬
    const sortedTasks = [...updatedTasks].sort((a, b) => a.startTime - b.startTime)

    // 모든 세그먼트 URL을 병렬로 준비 (원본 트리밍 + transform 트리밍 동시)
    const segmentUrlResults = await Promise.all(
      sortedTasks.map(async (task): Promise<{ index: number; url: string } | null> => {
        if (task.type === 'original') {
          console.log(`[Composite] seg${task.index}: original ${task.startTime}s~${task.endTime}s`)
          const trimmedBuffer = await trimVideoFromFile(sourceFilePath, task.startTime, task.endTime)
          const key = `trending/${userId}/orig_${generationId}_seg${task.index}_${Date.now()}.mp4`
          return { index: task.index, url: await uploadBufferToR2(trimmedBuffer, key, 'video/mp4') }
        } else if (task.resultUrl) {
          // Kling MC 결과 다운로드 → 필요 시 트림 → R2 업로드
          console.log(`[Composite] seg${task.index}: transform, resultUrl=${task.resultUrl.substring(0, 60)}, originalDuration=${task.originalDuration}, trimOffset=${task.trimOffset}`)
          const dl = await downloadToTemp(task.resultUrl, 'mp4')
          tempDirsToClean.push(dl.tempDir)

          // 다운로드 검증
          const stat = await fs.stat(dl.filePath)
          if (stat.size < 5000) {
            console.error(`[Composite] seg${task.index}: downloaded file too small (${stat.size} bytes), skipping`)
            return null
          }

          if (task.originalDuration) {
            // 유저 원래 길이로 트림
            const offset = task.trimOffset || 0
            const trimmedBuffer = await trimVideoFromFile(dl.filePath, offset, offset + task.originalDuration)
            const key = `trending/${userId}/klingtrim_${generationId}_seg${task.index}_${Date.now()}.mp4`
            return { index: task.index, url: await uploadBufferToR2(trimmedBuffer, key, 'video/mp4') }
          } else {
            // 트림 불필요 — 이미 R2에 있으면 그대로, 아니면 R2로 복사
            if (task.resultUrl.includes('r2.dev')) {
              return { index: task.index, url: task.resultUrl }
            }
            // FAL.ai URL → R2에 복사
            const videoBuffer = await fs.readFile(dl.filePath)
            const key = `trending/${userId}/kling_${generationId}_seg${task.index}_${Date.now()}.mp4`
            const permanentUrl = await uploadBufferToR2(videoBuffer, key, 'video/mp4')
            return { index: task.index, url: permanentUrl }
          }
        }
        return null
      })
    )

    // 시간순으로 URL 수집
    const videoUrls = segmentUrlResults
      .filter((r): r is { index: number; url: string } => r !== null && !!r.url)
      .map(r => r.url)

    console.log(`[Trending Composite] ${videoUrls.length} segments:`, videoUrls.map((u, i) => `${i}: ${u.substring(0, 80)}`))
    if (videoUrls.length === 0) {
      throw new Error('합성할 세그먼트가 없습니다')
    }

    // FFmpeg 합성
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
        description: '모션 컨트롤 합성 실패 환불',
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

    // COMPOSITING 상태 → 합성 실행 (서버리스에서 fire-and-forget 불가하므로 동기 실행)
    if (generation.status === 'COMPOSITING') {
      const inputParams = generation.input_params as unknown as InputParams
      if (inputParams?.segmentTasks) {
        await compositeSegments(generation.id, inputParams, inputParams.segmentTasks, user.id, generation.credits_used)
        // 합성 완료 후 상태 다시 조회
        const updated = await prisma.tool_generations.findUnique({ where: { id } })
        if (updated?.status === 'COMPLETED') {
          return NextResponse.json({ status: 'COMPLETED', resultUrl: updated.result_url })
        }
        if (updated?.status === 'FAILED') {
          return NextResponse.json({ status: 'FAILED', error: updated.error_message })
        }
      }
      return NextResponse.json({ status: 'COMPOSITING', progress: '영상 합성 중...' })
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
          const tempUrl = response.video?.url
          if (tempUrl) {
            // FAL.ai 임시 URL → R2에 복사하여 영구 URL 확보
            const videoRes = await fetch(tempUrl)
            if (videoRes.ok) {
              const videoBuffer = Buffer.from(await videoRes.arrayBuffer())
              const permanentKey = `trending/${user.id}/kling_${id}_seg${task.index}_${Date.now()}.mp4`
              const resultUrl = await uploadBufferToR2(videoBuffer, permanentKey, 'video/mp4')
              const taskIndex = updatedTasks.findIndex((t) => t.index === task.index)
              if (taskIndex >= 0) {
                updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], resultUrl }
              }
              completedCount++
            }
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
          description: '모션 컨트롤 실패 환불',
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
      // 동기 실행 — 서버리스에서 fire-and-forget 불가
      await compositeSegments(id, inputParams, updatedTasks, user.id, generation.credits_used)
      const finalGen = await prisma.tool_generations.findUnique({ where: { id } })
      if (finalGen?.status === 'COMPLETED') {
        return NextResponse.json({ status: 'COMPLETED', resultUrl: finalGen.result_url })
      }
      if (finalGen?.status === 'FAILED') {
        return NextResponse.json({ status: 'FAILED', error: finalGen.error_message })
      }
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
