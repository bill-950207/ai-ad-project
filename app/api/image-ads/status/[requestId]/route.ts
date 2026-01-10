/**
 * 이미지 광고 생성 상태 확인 API
 *
 * GET: fal.ai 큐 상태 확인 및 결과 반환, DB 업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getImageAdQueueStatus, getImageAdQueueResponse } from '@/lib/fal/client'

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

    // fal.ai 상태 조회
    const status = await getImageAdQueueStatus(requestId)

    // 완료된 경우 결과 이미지 URL 반환 및 DB 업데이트
    if (status.status === 'COMPLETED') {
      const result = await getImageAdQueueResponse(requestId)

      if (result.images && result.images.length > 0) {
        // 모든 이미지 URL 배열로 반환
        const imageUrls = result.images.map(img => img.url)

        // 각 이미지에 대해 DB 업데이트
        for (let i = 0; i < result.images.length; i++) {
          const image = result.images[i]
          const falRequestIdWithIndex = `${requestId}_${i}`

          // 해당 인덱스의 레코드 업데이트
          const { error: updateError } = await supabase
            .from('image_ads')
            .update({
              status: 'COMPLETED',
              image_url: image.url,
              image_url_original: image.url,
              image_width: image.width,
              image_height: image.height,
              completed_at: new Date().toISOString(),
            })
            .eq('fal_request_id', falRequestIdWithIndex)
            .eq('user_id', user.id)

          if (updateError) {
            console.error(`이미지 광고 DB 업데이트 오류 (${i}):`, updateError)
          }
        }

        return NextResponse.json({
          status: 'COMPLETED',
          imageUrl: result.images[0].url,  // 하위 호환성 유지
          imageUrls: imageUrls,            // 새로운 배열 필드
          width: result.images[0].width,
          height: result.images[0].height,
        })
      } else {
        // 실패 상태로 DB 업데이트
        await supabase
          .from('image_ads')
          .update({
            status: 'FAILED',
            error_message: 'No images generated',
          })
          .like('fal_request_id', `${requestId}_%`)
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
        .like('fal_request_id', `${requestId}_%`)
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
