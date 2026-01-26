/**
 * 이미지 광고 배치 생성 상태 확인 API
 *
 * GET: imageAdId로 배치 생성 상태 확인
 * - batch_request_ids의 모든 요청 상태를 집계
 * - 모두 완료 시 image_urls 배열에 결과 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSeedreamEditQueueStatus, getSeedreamEditQueueResponse } from '@/lib/fal/client'
import {
  getGPTImageQueueStatus as getKieGptImageStatus,
  getGPTImageQueueResponse as getKieGptImageResponse,
} from '@/lib/kie/client'

interface BatchRequestId {
  provider: 'fal' | 'kie'
  requestId: string
}

interface ImageResult {
  index: number
  status: 'COMPLETED' | 'IN_PROGRESS' | 'IN_QUEUE' | 'FAILED'
  aiServiceUrl?: string  // AI 서비스 원본 URL (클라이언트에서 R2 업로드)
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageAdId: string }> }
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

    const { imageAdId } = await params

    if (!imageAdId) {
      return NextResponse.json(
        { error: 'Image Ad ID is required' },
        { status: 400 }
      )
    }

    // 이미지 광고 레코드 조회
    const { data: imageAd, error: fetchError } = await supabase
      .from('image_ads')
      .select('id, status, batch_request_ids, num_images, image_urls, image_url_originals, fal_request_id')
      .eq('id', imageAdId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !imageAd) {
      return NextResponse.json(
        { error: 'Image ad not found' },
        { status: 404 }
      )
    }

    // 이미 완료된 경우 (image_urls가 num_images와 일치하는지도 확인)
    const expectedNumImages = imageAd.num_images || (imageAd.batch_request_ids as BatchRequestId[] | null)?.length || 1
    const hasCompleteImages = imageAd.image_urls && imageAd.image_urls.length >= expectedNumImages

    if (imageAd.status === 'COMPLETED' && hasCompleteImages) {
      return NextResponse.json({
        status: 'COMPLETED',
        imageUrls: imageAd.image_urls,
        originalUrls: imageAd.image_url_originals,
      })
    }

    // 실패한 경우
    if (imageAd.status === 'FAILED') {
      return NextResponse.json({
        status: 'FAILED',
        error: 'Image generation failed',
      })
    }

    // 이미 IMAGES_READY 상태인 경우 (클라이언트가 R2 업로드 중)
    // 외부 API 재호출 방지
    if (imageAd.status === 'IMAGES_READY') {
      console.log(`[batch-status] 이미 IMAGES_READY 상태, 조기 반환: ${imageAdId}`)
      return NextResponse.json({
        status: 'IMAGES_READY',
        message: 'Images are ready for client upload. Please complete the upload.',
      })
    }

    console.log(`[batch-status] 현재 상태: ${imageAd.status}, 외부 API 조회 시작: ${imageAdId}`)

    // 하위 호환성: batch_request_ids가 없고 fal_request_id가 있는 경우 (기존 단일 요청)
    if (!imageAd.batch_request_ids && imageAd.fal_request_id) {
      // 기존 단일 요청 API로 리다이렉트하는 대신 직접 처리
      const batchRequestIds: BatchRequestId[] = []
      if (imageAd.fal_request_id.startsWith('kie:')) {
        batchRequestIds.push({ provider: 'kie', requestId: imageAd.fal_request_id.substring(4) })
      } else if (imageAd.fal_request_id.startsWith('fal:')) {
        batchRequestIds.push({ provider: 'fal', requestId: imageAd.fal_request_id.substring(4) })
      } else {
        batchRequestIds.push({ provider: 'fal', requestId: imageAd.fal_request_id })
      }
      // 이 경우에도 아래 로직으로 처리
      return await processBatchStatus(supabase, user.id, imageAd.id, batchRequestIds)
    }

    // batch_request_ids가 없는 경우
    if (!imageAd.batch_request_ids || !Array.isArray(imageAd.batch_request_ids)) {
      return NextResponse.json({
        status: imageAd.status || 'IN_QUEUE',
        error: 'No batch request IDs found',
      })
    }

    // 배치 상태 처리
    return await processBatchStatus(
      supabase,
      user.id,
      imageAd.id,
      imageAd.batch_request_ids as BatchRequestId[]
    )
  } catch (error) {
    console.error('배치 상태 확인 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processBatchStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  imageAdId: string,
  batchRequestIds: BatchRequestId[]
) {
  // 각 요청의 상태 확인
  const results: ImageResult[] = await Promise.all(
    batchRequestIds.map(async (req, index) => {
      try {
        // provider에 따라 상태 조회
        let status: { status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'; queue_position?: number }

        if (req.provider === 'kie') {
          status = await getKieGptImageStatus(req.requestId)
        } else {
          status = await getSeedreamEditQueueStatus(req.requestId)
        }

        // 완료된 경우 결과 조회
        if (status.status === 'COMPLETED') {
          try {
            let result: { images: Array<{ url: string }> }

            if (req.provider === 'kie') {
              result = await getKieGptImageResponse(req.requestId)
            } else {
              result = await getSeedreamEditQueueResponse(req.requestId)
            }

            if (result.images && result.images.length > 0) {
              // AI 서비스 원본 URL만 반환 (클라이언트에서 R2 업로드)
              return {
                index,
                status: 'COMPLETED' as const,
                aiServiceUrl: result.images[0].url,
              }
            }
          } catch (resultError) {
            const errorMessage = resultError instanceof Error ? resultError.message : 'Unknown error'
            const isNsfwError = errorMessage.toLowerCase().includes('nsfw') ||
                               errorMessage.toLowerCase().includes('content policy') ||
                               errorMessage.toLowerCase().includes('safety')

            console.error(`이미지 ${index} 결과 조회 실패:`, errorMessage)
            return {
              index,
              status: 'FAILED' as const,
              error: isNsfwError ? 'NSFW_CONTENT_DETECTED' : errorMessage,
            }
          }
        }

        return {
          index,
          status: status.status as ImageResult['status'],
        }
      } catch (error) {
        console.error(`이미지 ${index} 상태 확인 실패:`, error)
        return {
          index,
          status: 'FAILED' as const,
          error: 'Status check failed',
        }
      }
    })
  )

  // 결과 집계
  const completedResults = results.filter(r => r.status === 'COMPLETED' && r.aiServiceUrl)
  const failedResults = results.filter(r => r.status === 'FAILED')
  const inProgressResults = results.filter(r => r.status === 'IN_PROGRESS' || r.status === 'IN_QUEUE')

  // 모두 완료되었거나 실패한 경우 (진행 중인 것이 없음)
  if (inProgressResults.length === 0) {
    // 최소 하나라도 성공한 경우 - 클라이언트가 R2 업로드할 이미지 목록 반환
    if (completedResults.length > 0) {
      const pendingImages = completedResults
        .sort((a, b) => a.index - b.index)
        .map(r => ({
          index: r.index,
          aiServiceUrl: r.aiServiceUrl!,
        }))

      // 상태만 IMAGES_READY로 업데이트 (클라이언트가 업로드 후 COMPLETED로 변경)
      const { error: updateError, count } = await supabase
        .from('image_ads')
        .update({ status: 'IMAGES_READY' })
        .eq('id', imageAdId)
        .eq('user_id', userId)

      if (updateError) {
        console.error('[batch-status] IMAGES_READY 상태 업데이트 실패:', updateError)
      } else {
        console.log(`[batch-status] IMAGES_READY 상태 업데이트 완료: ${imageAdId}, count: ${count}`)
      }

      return NextResponse.json({
        status: 'IMAGES_READY',
        pendingImages,
        completedCount: completedResults.length,
        failedCount: failedResults.length,
      })
    }

    // 모두 실패한 경우
    await supabase
      .from('image_ads')
      .update({
        status: 'FAILED',
        error_message: failedResults[0]?.error || 'All images failed to generate',
      })
      .eq('id', imageAdId)
      .eq('user_id', userId)

    return NextResponse.json({
      status: 'FAILED',
      error: failedResults[0]?.error || 'All images failed to generate',
    })
  }

  // 진행 중인 경우 상태 업데이트
  const newStatus = inProgressResults.some(r => r.status === 'IN_PROGRESS')
    ? 'IN_PROGRESS'
    : 'IN_QUEUE'

  await supabase
    .from('image_ads')
    .update({ status: newStatus })
    .eq('id', imageAdId)
    .eq('user_id', userId)

  return NextResponse.json({
    status: newStatus,
    completedCount: completedResults.length,
    totalCount: batchRequestIds.length,
    progress: Math.round((completedResults.length / batchRequestIds.length) * 100),
  })
}
