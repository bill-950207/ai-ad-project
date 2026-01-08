/**
 * 광고 제품 상세 API 라우트
 *
 * GET    /api/ad-products/[id] - 광고 제품 상세 조회
 * DELETE /api/ad-products/[id] - 광고 제품 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('광고 제품 삭제 오류:', error)
    return NextResponse.json(
      { error: 'Failed to delete ad product' },
      { status: 500 }
    )
  }
}
