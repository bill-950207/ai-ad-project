/**
 * 이미지 광고 생성 상태 확인 API
 *
 * GET: fal.ai 큐 상태 확인 및 결과 반환
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

    // 완료된 경우 결과 이미지 URL 반환
    if (status.status === 'COMPLETED') {
      const result = await getImageAdQueueResponse(requestId)

      if (result.images && result.images.length > 0) {
        // 모든 이미지 URL 배열로 반환
        const imageUrls = result.images.map(img => img.url)

        return NextResponse.json({
          status: 'COMPLETED',
          imageUrl: result.images[0].url,  // 하위 호환성 유지
          imageUrls: imageUrls,            // 새로운 배열 필드
          width: result.images[0].width,
          height: result.images[0].height,
        })
      } else {
        return NextResponse.json({
          status: 'FAILED',
          error: 'No images generated',
        })
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
