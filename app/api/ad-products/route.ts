/**
 * 광고 제품 API 라우트
 *
 * 광고 제품 목록 조회 및 새 광고 제품 생성을 처리합니다.
 *
 * GET  /api/ad-products - 사용자의 광고 제품 목록 조회
 * POST /api/ad-products - 새 광고 제품 생성 요청 (배경 제거)
 */

import { prisma } from '@/lib/db'
import { submitRembgToQueue } from '@/lib/kie/client'
import { uploadAdProductSourceFromDataUrl } from '@/lib/storage/r2'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/ad-products
 *
 * 현재 로그인한 사용자의 모든 광고 제품을 조회합니다.
 * 최신순으로 정렬하여 반환합니다.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.ad_products.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('광고 제품 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad products' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ad-products
 *
 * 새 광고 제품을 생성합니다.
 * 이미지 Data URL을 받아 R2에 업로드 후 Kie.ai rembg로 배경 제거 요청을 제출합니다.
 *
 * 요청 본문:
 * - name: 제품 이름 (필수)
 * - imageDataUrl: 이미지 Data URL (새 업로드 시)
 * - sourceImageUrl: 기존 이미지 URL (재시도 시)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      imageDataUrl,
      sourceImageUrl: existingSourceUrl,
      // 새 제품 정보 필드
      description,
      sellingPoints,
      additionalPhotos,
      sourceUrl,
      price,
      brand,
    } = body as {
      name: string
      imageDataUrl?: string
      sourceImageUrl?: string
      description?: string
      sellingPoints?: string[]
      additionalPhotos?: string[]
      sourceUrl?: string
      price?: string
      brand?: string
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!imageDataUrl && !existingSourceUrl) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // 1. 먼저 제품 레코드 생성 (PENDING 상태)
    const product = await prisma.ad_products.create({
      data: {
        user_id: user.id,
        name: name.trim(),
        status: 'PENDING',
        // 제품 정보 필드
        description: description?.trim() || undefined,
        selling_points: sellingPoints && sellingPoints.length > 0 ? sellingPoints : undefined,
        additional_photos: additionalPhotos && additionalPhotos.length > 0 ? additionalPhotos : undefined,
        source_url: sourceUrl?.trim() || undefined,
        price: price?.trim() || undefined,
        brand: brand?.trim() || undefined,
      },
    })

    try {
      // 2. 이미지 URL 결정 (새 업로드 또는 기존 URL 사용)
      let sourceImageUrl: string

      if (imageDataUrl) {
        // 새로운 이미지 업로드
        sourceImageUrl = await uploadAdProductSourceFromDataUrl(
          product.id,
          imageDataUrl
        )
      } else {
        // 재시도: 기존 이미지 URL 사용
        sourceImageUrl = existingSourceUrl!
      }

      // 3. Kie.ai rembg 큐에 배경 제거 요청 제출
      const queueResponse = await submitRembgToQueue({
        image_url: sourceImageUrl,
      })

      // 4. 제품 레코드 업데이트 (IN_QUEUE 상태)
      const updatedProduct = await prisma.ad_products.update({
        where: { id: product.id },
        data: {
          source_image_url: sourceImageUrl,
          status: 'IN_QUEUE',
          fal_request_id: queueResponse.request_id,
        },
      })

      return NextResponse.json({
        product: updatedProduct,
        sourceImageUrl,
      }, { status: 201 })
    } catch (uploadError) {
      // 업로드 또는 Kie.ai 요청 실패 시 제품 상태를 FAILED로 업데이트
      await prisma.ad_products.update({
        where: { id: product.id },
        data: {
          status: 'FAILED',
          error_message: uploadError instanceof Error ? uploadError.message : 'Upload failed',
        },
      })
      throw uploadError
    }
  } catch (error) {
    console.error('광고 제품 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to create ad product' },
      { status: 500 }
    )
  }
}
