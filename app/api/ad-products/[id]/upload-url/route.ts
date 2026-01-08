/**
 * 광고 제품 이미지 업로드 URL API 라우트
 *
 * 클라이언트에서 R2에 직접 이미지를 업로드할 수 있는
 * presigned URL을 생성합니다.
 *
 * POST /api/ad-products/[id]/upload-url - 업로드 URL 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { generateAdProductResultUploadUrls, generateAdProductSourceUploadUrl } from '@/lib/storage/r2'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/ad-products/[id]/upload-url
 *
 * 광고 제품 이미지 업로드용 presigned URL을 생성합니다.
 *
 * 요청 본문:
 * - type: 'source' | 'result' (소스 이미지 또는 결과 이미지)
 * - originalExt: 원본 이미지 확장자 (기본: 'png')
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

    const body = await request.json().catch(() => ({}))
    const { type = 'result', originalExt = 'png' } = body as {
      type?: 'source' | 'result'
      originalExt?: string
    }

    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp']
    if (!allowedExtensions.includes(originalExt.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid image extension' },
        { status: 400 }
      )
    }

    if (type === 'source') {
      // 소스 이미지 업로드 URL
      const sourceUrl = await generateAdProductSourceUploadUrl(
        product.id,
        originalExt.toLowerCase()
      )
      return NextResponse.json({ uploadUrl: sourceUrl })
    } else {
      // 결과 이미지 업로드 URL (원본 + 압축)
      const uploadUrls = await generateAdProductResultUploadUrls(
        product.id,
        originalExt.toLowerCase()
      )
      return NextResponse.json({ uploadUrls })
    }
  } catch (error) {
    console.error('업로드 URL 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URLs' },
      { status: 500 }
    )
  }
}
