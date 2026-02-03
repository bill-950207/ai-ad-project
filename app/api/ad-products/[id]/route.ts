/**
 * 광고 제품 상세 API 라우트
 *
 * GET    /api/ad-products/[id] - 광고 제품 상세 조회
 * DELETE /api/ad-products/[id] - 광고 제품 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { invalidateProductsCache } from '@/lib/cache/user-data'

/**
 * GET /api/ad-products/[id]
 *
 * 특정 광고 제품의 상세 정보를 조회합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    return NextResponse.json({ product })
  } catch (error) {
    console.error('광고 제품 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad product' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ad-products/[id]
 *
 * 광고 제품 정보를 수정합니다.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 소유권 확인
    const product = await prisma.ad_products.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { name, description, selling_points, price, brand } = body as {
      name?: string
      description?: string
      selling_points?: string[]
      price?: string
      brand?: string
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim() || null
    if (selling_points !== undefined) updateData.selling_points = selling_points.length > 0 ? selling_points : null
    if (price !== undefined) updateData.price = price.trim() || null
    if (brand !== undefined) updateData.brand = brand.trim() || null

    // 업데이트 실행
    const updatedProduct = await prisma.ad_products.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('광고 제품 수정 오류:', error)
    return NextResponse.json(
      { error: 'Failed to update ad product' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ad-products/[id]
 *
 * 광고 제품을 삭제합니다.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 소유권 확인
    const product = await prisma.ad_products.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 삭제
    await prisma.ad_products.delete({
      where: { id },
    })

    // 캐시 무효화
    invalidateProductsCache(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('광고 제품 삭제 오류:', error)
    return NextResponse.json(
      { error: 'Failed to delete ad product' },
      { status: 500 }
    )
  }
}
