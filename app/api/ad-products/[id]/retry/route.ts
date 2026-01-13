/**
 * 광고 제품 배경 제거 재시도 API 라우트
 *
 * 기존 원본 이미지로 배경 제거를 다시 요청합니다.
 *
 * POST /api/ad-products/[id]/retry - 배경 제거 재시도
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { submitRembgToQueue } from '@/lib/kie/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 제품 조회
    const product = await prisma.ad_products.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 원본 이미지 URL 확인
    if (!product.source_image_url) {
      return NextResponse.json(
        { error: 'No source image available for retry' },
        { status: 400 }
      )
    }

    // Kie.ai rembg 큐에 배경 제거 요청 제출
    const queueResponse = await submitRembgToQueue({
      image_url: product.source_image_url,
    })

    // 제품 상태를 IN_QUEUE로 업데이트
    const updatedProduct = await prisma.ad_products.update({
      where: { id },
      data: {
        status: 'IN_QUEUE',
        fal_request_id: queueResponse.request_id,
        error_message: null, // 이전 에러 메시지 초기화
      },
    })

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('배경 제거 재시도 오류:', error)
    return NextResponse.json(
      { error: 'Failed to retry background removal' },
      { status: 500 }
    )
  }
}
