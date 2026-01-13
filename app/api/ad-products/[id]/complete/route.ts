/**
 * 광고 제품 업로드 완료 API 라우트
 *
 * 클라이언트에서 R2 업로드 완료 후 호출하여
 * 이미지 URL을 저장하고 상태를 COMPLETED로 변경합니다.
 *
 * POST /api/ad-products/[id]/complete - 업로드 완료 처리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface CompleteRequestBody {
  originalUrl: string     // 원본 이미지 URL (재가공용)
  compressedUrl: string   // 압축 이미지 URL (조회용)
}

/**
 * POST /api/ad-products/[id]/complete
 *
 * 클라이언트에서 R2 업로드 완료 후 호출합니다.
 * 업로드된 이미지 URL을 저장하고 상태를 완료로 변경합니다.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.ad_products.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 이미 완료된 경우 에러 반환
    if (product.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Product is already completed' },
        { status: 400 }
      )
    }

    const body = await request.json() as CompleteRequestBody

    if (!body.originalUrl || !body.compressedUrl) {
      return NextResponse.json(
        { error: 'Missing image URLs' },
        { status: 400 }
      )
    }

    // URL 형식 검증
    const r2PublicUrl = process.env.R2_PUBLIC_URL
    if (r2PublicUrl) {
      if (!body.originalUrl.startsWith(r2PublicUrl) ||
          !body.compressedUrl.startsWith(r2PublicUrl)) {
        return NextResponse.json(
          { error: 'Invalid image URL format' },
          { status: 400 }
        )
      }
    }

    const updatedProduct = await prisma.ad_products.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        image_url: body.compressedUrl,
        image_url_original: body.originalUrl,
        completed_at: new Date(),
      },
    })

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('광고 제품 완료 처리 오류:', error)
    return NextResponse.json(
      { error: 'Failed to complete ad product' },
      { status: 500 }
    )
  }
}
