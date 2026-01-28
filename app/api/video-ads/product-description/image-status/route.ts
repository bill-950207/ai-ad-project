/**
 * 이미지 생성 상태 폴링 API
 *
 * GET /api/video-ads/product-description/image-status
 * - 이미지 생성 request ID들의 상태를 확인
 * - 완료된 이미지 URL 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getSeedreamEditQueueStatus,
  getSeedreamEditQueueResponse,
} from '@/lib/fal/client'
import {
  getEditQueueStatus as getKieEditQueueStatus,
  getEditQueueResponse as getKieEditQueueResponse,
  getZImageTurboQueueStatus,
  getZImageTurboQueueResponse,
} from '@/lib/kie/client'
import { uploadExternalImageToR2 } from '@/lib/image/compress'

interface ImageRequest {
  requestId: string
  provider: 'fal' | 'kie' | 'kie-zimage'
  index: number
}

/**
 * GET /api/video-ads/product-description/image-status
 */
export async function GET(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query params에서 이미지 요청 정보 파싱
    const searchParams = request.nextUrl.searchParams
    const requestsParam = searchParams.get('requests')

    if (!requestsParam) {
      return NextResponse.json({ error: 'Missing requests parameter' }, { status: 400 })
    }

    let imageRequests: ImageRequest[]
    try {
      imageRequests = JSON.parse(requestsParam)
    } catch {
      return NextResponse.json({ error: 'Invalid requests format' }, { status: 400 })
    }

    // 각 이미지 요청의 상태 확인
    const results = await Promise.all(
      imageRequests.map(async (req) => {
        try {
          let status: string = 'PENDING'
          let imageUrl: string | null = null

          if (req.provider === 'fal') {
            const statusResult = await getSeedreamEditQueueStatus(req.requestId)
            status = statusResult.status
            if (status === 'COMPLETED') {
              const response = await getSeedreamEditQueueResponse(req.requestId)
              imageUrl = response.images[0]?.url || null
            }
          } else if (req.provider === 'kie-zimage') {
            const statusResult = await getZImageTurboQueueStatus(req.requestId)
            status = statusResult.status
            if (status === 'COMPLETED') {
              const response = await getZImageTurboQueueResponse(req.requestId)
              imageUrl = response.images[0]?.url || null
            }
          } else {
            // kie Seedream 4.5 Edit
            const statusResult = await getKieEditQueueStatus(req.requestId)
            status = statusResult.status
            if (status === 'COMPLETED') {
              const response = await getKieEditQueueResponse(req.requestId)
              imageUrl = response.images[0]?.url || null
            }
          }

          return {
            index: req.index,
            requestId: req.requestId,
            status,
            imageUrl,
          }
        } catch (error) {
          console.error(`이미지 상태 확인 실패 (${req.requestId}):`, error)
          return {
            index: req.index,
            requestId: req.requestId,
            status: 'ERROR',
            imageUrl: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    // 전체 상태 계산
    const allCompleted = results.every(r => r.status === 'COMPLETED')
    const anyFailed = results.some(r => r.status === 'ERROR' || r.status === 'FAILED')

    return NextResponse.json({
      allCompleted,
      anyFailed,
      results,
    })
  } catch (error) {
    console.error('이미지 상태 확인 오류:', error)
    return NextResponse.json(
      { error: 'Failed to check image status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/video-ads/product-description/image-status
 * - 완료된 이미지를 R2에 업로드
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrls } = body as { imageUrls: string[] }

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: 'Missing imageUrls' }, { status: 400 })
    }

    // R2에 업로드
    const timestamp = Date.now()
    const uploadResults = await Promise.all(
      imageUrls.map(async (url, index) => {
        try {
          const result = await uploadExternalImageToR2(
            url,
            'video-ads/first-frame',
            `${user.id}_${timestamp}_${index}`
          )
          return {
            index,
            originalUrl: result.originalUrl,
            compressedUrl: result.compressedUrl,
          }
        } catch (error) {
          console.error(`R2 업로드 실패 (${index}):`, error)
          // 업로드 실패 시 원본 URL 사용
          return {
            index,
            originalUrl: url,
            compressedUrl: url,
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      uploadResults,
    })
  } catch (error) {
    console.error('이미지 업로드 오류:', error)
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}
