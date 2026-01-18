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

        // 해당 image_ad의 ID 조회 (rawRequestId로 조회 - prefix 포함)
        const { data: imageAdData } = await supabase
          .from('image_ads')
          .select('id')
          .eq('fal_request_id', rawRequestId)
          .eq('user_id', user.id)
          .single()

        let imageUrl = generatedImageUrl
        let imageUrlOriginal = generatedImageUrl

        // R2에 원본/압축본 업로드
        if (imageAdData?.id) {
          try {
            const uploadResult = await uploadExternalImageToR2(
              generatedImageUrl,
              'image-ads',
              imageAdData.id
            )
            imageUrl = uploadResult.compressedUrl
            imageUrlOriginal = uploadResult.originalUrl
            console.log('이미지 광고 R2 업로드 완료:', { id: imageAdData.id, provider, compressedUrl: imageUrl })
          } catch (uploadError) {
            console.error('이미지 광고 R2 업로드 실패, 원본 URL 사용:', uploadError)
            // 업로드 실패 시 원본 URL 그대로 사용
          }
        }

        // DB 업데이트
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
          console.error('이미지 광고 DB 업데이트 오류:', updateError)
        }

        return NextResponse.json({
          status: 'COMPLETED',
          imageUrl: imageUrl,
          imageUrls: [imageUrl],
        })
      } else {
        // 실패 상태로 DB 업데이트
        await supabase
          .from('image_ads')
          .update({
            status: 'FAILED',
            error_message: 'No images generated',
          })
          .eq('fal_request_id', rawRequestId)
          .eq('user_id', user.id)

        return NextResponse.json({
          status: 'FAILED',
          error: 'No images generated',
        })
      }
    }

    // 진행 중인 경우 상태 업데이트
    if (status.status === 'IN_PROGRESS') {
      await supabase
        .from('image_ads')
        .update({ status: 'IN_PROGRESS' })
        .eq('fal_request_id', rawRequestId)
        .eq('user_id', user.id)
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
