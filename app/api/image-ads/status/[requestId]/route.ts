/**
 * 이미지 광고 생성 상태 확인 API
 *
 * GET: fal.ai Seedream 4.5 또는 kie.ai GPT-Image 1.5 큐 상태 확인 및 결과 반환, DB 업데이트
 * - 완료 시 원본 이미지를 R2에 저장 (원본/WebP 압축본 분리)
 * - requestId 형식: "provider:actual_request_id" (예: "fal:xxx" 또는 "kie:xxx")
 * - 하위 호환성: prefix 없으면 fal.ai로 간주
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSeedreamEditQueueStatus, getSeedreamEditQueueResponse } from '@/lib/fal/client'
import {
  getGPTImageQueueStatus as getKieGptImageStatus,
  getGPTImageQueueResponse as getKieGptImageResponse,
} from '@/lib/kie/client'
import { uploadExternalImageToR2 } from '@/lib/image/compress'

/** requestId에서 provider와 실제 ID 파싱 */
function parseRequestId(requestId: string): { provider: 'fal' | 'kie'; actualId: string } {
  if (requestId.startsWith('kie:')) {
    return { provider: 'kie', actualId: requestId.substring(4) }
  } else if (requestId.startsWith('fal:')) {
    return { provider: 'fal', actualId: requestId.substring(4) }
  }
  // 하위 호환성: prefix 없으면 fal로 간주
  return { provider: 'fal', actualId: requestId }
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

    const { requestId: rawRequestId } = await params

    if (!rawRequestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // provider와 실제 requestId 파싱
    const { provider, actualId } = parseRequestId(rawRequestId)

    // provider에 따라 상태 조회
    let status: { status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'; queue_position?: number }

    if (provider === 'kie') {
      status = await getKieGptImageStatus(actualId)
    } else {
      status = await getSeedreamEditQueueStatus(actualId)
    }

    // 완료된 경우 결과 이미지 URL 반환 및 DB 업데이트
    if (status.status === 'COMPLETED') {
      // provider에 따라 결과 조회
      let result: { images: Array<{ url: string }> }

      try {
        if (provider === 'kie') {
          result = await getKieGptImageResponse(actualId)
        } else {
          result = await getSeedreamEditQueueResponse(actualId)
        }
      } catch (resultError) {
        // NSFW 또는 콘텐츠 정책 위반 오류 처리
        const errorMessage = resultError instanceof Error ? resultError.message : 'Unknown error'
        const isNsfwError = errorMessage.toLowerCase().includes('nsfw') ||
                           errorMessage.toLowerCase().includes('content policy') ||
                           errorMessage.toLowerCase().includes('safety')

        console.error('이미지 생성 결과 조회 오류:', { provider, errorMessage, isNsfwError })

        // DB에 실패 상태 업데이트
        await supabase
          .from('image_ads')
          .update({
            status: 'FAILED',
            error_message: isNsfwError
              ? 'NSFW_CONTENT_DETECTED'
              : errorMessage,
          })
          .eq('fal_request_id', rawRequestId)
          .eq('user_id', user.id)

        return NextResponse.json({
          status: 'FAILED',
          error: isNsfwError
            ? 'NSFW_CONTENT_DETECTED'
            : 'Image generation failed',
          errorCode: isNsfwError ? 'NSFW' : 'GENERATION_FAILED',
        })
      }

      if (result.images && result.images.length > 0) {
        const generatedImageUrl = result.images[0].url

        // 해당 image_ad 조회 (fal_request_id 또는 batch_request_ids에서 검색)
        let imageAdData: { id: string; batch_request_ids: Array<{ provider: string; requestId: string }> | null; image_urls: string[] | null; image_url_originals: string[] | null; num_images: number | null } | null = null

        // 1. fal_request_id로 먼저 검색
        const { data: singleData } = await supabase
          .from('image_ads')
          .select('id, batch_request_ids, image_urls, image_url_originals, num_images')
          .eq('fal_request_id', rawRequestId)
          .eq('user_id', user.id)
          .single()

        if (singleData) {
          imageAdData = singleData
        } else {
          // 2. batch_request_ids에서 검색 (JSONB 배열 내 객체의 requestId 필드 검색)
          const { data: batchData } = await supabase
            .from('image_ads')
            .select('id, batch_request_ids, image_urls, image_url_originals, num_images')
            .eq('user_id', user.id)
            .not('batch_request_ids', 'is', null)

          // batch_request_ids 배열에서 해당 requestId 찾기
          if (batchData) {
            for (const ad of batchData) {
              const batchIds = ad.batch_request_ids as Array<{ provider: string; requestId: string }> | null
              if (batchIds?.some(b => b.requestId === actualId || `${b.provider}:${b.requestId}` === rawRequestId)) {
                imageAdData = ad
                break
              }
            }
          }
        }

        let imageUrl = generatedImageUrl
        let imageUrlOriginal = generatedImageUrl

        // R2에 원본/압축본 업로드
        if (imageAdData?.id) {
          // batch에서의 인덱스 찾기
          let batchIndex = 0
          if (imageAdData.batch_request_ids) {
            const idx = imageAdData.batch_request_ids.findIndex(
              b => b.requestId === actualId || `${b.provider}:${b.requestId}` === rawRequestId
            )
            if (idx >= 0) batchIndex = idx
          }

          try {
            const uploadResult = await uploadExternalImageToR2(
              generatedImageUrl,
              'image-ads',
              `${imageAdData.id}_${batchIndex}`
            )
            imageUrl = uploadResult.compressedUrl
            imageUrlOriginal = uploadResult.originalUrl
            console.log('이미지 광고 R2 업로드 완료:', { id: imageAdData.id, provider, batchIndex, compressedUrl: imageUrl })
          } catch (uploadError) {
            console.error('이미지 광고 R2 업로드 실패, 원본 URL 사용:', uploadError)
            // 업로드 실패 시 원본 URL 그대로 사용
          }

          // 배치 레코드인 경우: image_urls 배열 업데이트
          if (imageAdData.batch_request_ids && imageAdData.batch_request_ids.length > 1) {
            const existingUrls = imageAdData.image_urls || []
            const existingOriginals = imageAdData.image_url_originals || []
            const numImages = imageAdData.num_images || imageAdData.batch_request_ids.length

            // 배열이 아직 초기화되지 않은 경우 빈 배열로 채우기
            const newUrls = [...existingUrls]
            const newOriginals = [...existingOriginals]

            // 해당 인덱스에 URL 설정
            newUrls[batchIndex] = imageUrl
            newOriginals[batchIndex] = imageUrlOriginal

            // 모든 요청이 완료되었는지 확인
            const completedCount = newUrls.filter(u => u && u.length > 0).length
            const isAllCompleted = completedCount >= numImages

            await supabase
              .from('image_ads')
              .update({
                status: isAllCompleted ? 'COMPLETED' : 'IN_PROGRESS',
                image_urls: newUrls,
                image_url_originals: newOriginals,
                image_url: newUrls[0] || imageUrl,  // 하위 호환성
                image_url_original: newOriginals[0] || imageUrlOriginal,
                ...(isAllCompleted ? { completed_at: new Date().toISOString() } : {}),
              })
              .eq('id', imageAdData.id)
              .eq('user_id', user.id)

            console.log('배치 이미지 상태 업데이트:', { id: imageAdData.id, batchIndex, completedCount, numImages, isAllCompleted })
          } else {
            // 단일 레코드인 경우 (기존 로직)
            await supabase
              .from('image_ads')
              .update({
                status: 'COMPLETED',
                image_url: imageUrl,
                image_url_original: imageUrlOriginal,
                image_urls: [imageUrl],
                image_url_originals: [imageUrlOriginal],
                completed_at: new Date().toISOString(),
              })
              .eq('id', imageAdData.id)
              .eq('user_id', user.id)
          }
        } else {
          // 레코드를 찾지 못한 경우에도 fal_request_id로 업데이트 시도 (하위 호환성)
          const { error: updateError } = await supabase
            .from('image_ads')
            .update({
              status: 'COMPLETED',
              image_url: imageUrl,
              image_url_original: imageUrlOriginal,
              completed_at: new Date().toISOString(),
            })
            .eq('fal_request_id', rawRequestId)
            .eq('user_id', user.id)

          if (updateError) {
            console.error('이미지 광고 DB 업데이트 오류 (레코드 없음):', updateError)
          }
        }

        return NextResponse.json({
          status: 'COMPLETED',
          imageUrl: imageUrl,
          imageUrls: [imageUrl],
        })
      } else {
        // 실패 상태로 DB 업데이트 (batch_request_ids도 확인)
        // 먼저 fal_request_id로 업데이트 시도
        const { count } = await supabase
          .from('image_ads')
          .update({
            status: 'FAILED',
            error_message: 'No images generated',
          })
          .eq('fal_request_id', rawRequestId)
          .eq('user_id', user.id)

        // fal_request_id로 찾지 못한 경우 batch_request_ids에서 검색
        if (!count || count === 0) {
          const { data: batchAds } = await supabase
            .from('image_ads')
            .select('id, batch_request_ids')
            .eq('user_id', user.id)
            .not('batch_request_ids', 'is', null)

          if (batchAds) {
            for (const ad of batchAds) {
              const batchIds = ad.batch_request_ids as Array<{ provider: string; requestId: string }> | null
              if (batchIds?.some(b => b.requestId === actualId || `${b.provider}:${b.requestId}` === rawRequestId)) {
                // 배치의 일부가 실패해도 전체를 실패로 표시하지 않음 (다른 이미지가 성공할 수 있음)
                console.log('배치 이미지 중 하나 실패:', { id: ad.id, requestId: rawRequestId })
                break
              }
            }
          }
        }

        return NextResponse.json({
          status: 'FAILED',
          error: 'No images generated',
        })
      }
    }

    // 진행 중인 경우 상태 업데이트 (배치도 고려)
    if (status.status === 'IN_PROGRESS') {
      // fal_request_id로 업데이트 시도
      const { count } = await supabase
        .from('image_ads')
        .update({ status: 'IN_PROGRESS' })
        .eq('fal_request_id', rawRequestId)
        .eq('user_id', user.id)

      // 배치 레코드인 경우 (count가 0이면 fal_request_id로 찾지 못한 것)
      if (!count || count === 0) {
        const { data: batchAds } = await supabase
          .from('image_ads')
          .select('id, batch_request_ids')
          .eq('user_id', user.id)
          .eq('status', 'IN_QUEUE')  // 아직 IN_QUEUE 상태인 것만
          .not('batch_request_ids', 'is', null)

        if (batchAds) {
          for (const ad of batchAds) {
            const batchIds = ad.batch_request_ids as Array<{ provider: string; requestId: string }> | null
            if (batchIds?.some(b => b.requestId === actualId || `${b.provider}:${b.requestId}` === rawRequestId)) {
              await supabase
                .from('image_ads')
                .update({ status: 'IN_PROGRESS' })
                .eq('id', ad.id)
                .eq('user_id', user.id)
              break
            }
          }
        }
      }
    }

    // 진행 중인 경우 상태 반환
    return NextResponse.json({
      status: status.status,
      queuePosition: status.queue_position,
    })
  } catch (error) {
    console.error('이미지 광고 상태 확인 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
