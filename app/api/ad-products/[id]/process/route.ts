/**
 * 광고 제품 이미지 처리 API 라우트
 *
 * 사용자가 지정한 크기와 위치로 제품 이미지를 캔버스에 배치합니다.
 *
 * POST /api/ad-products/[id]/process - 이미지 처리 및 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { uploadDataUrlToR2 } from '@/lib/storage/r2'
import { invalidateProductsCache } from '@/lib/cache/user-data'
import sharp from 'sharp'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 캔버스 크기 (아바타와 동일)
const CANVAS_WIDTH = 1024
const CANVAS_HEIGHT = 1536

interface ProcessRequest {
  scale: number      // 0.1 - 1.5
  positionX: number  // 0 - 1
  positionY: number  // 0 - 1
}

/**
 * POST /api/ad-products/[id]/process
 *
 * 배경 제거된 이미지를 사용자 지정 크기/위치로 캔버스에 배치
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body: ProcessRequest = await request.json()
    const { scale, positionX, positionY } = body

    // 파라미터 검증
    if (typeof scale !== 'number' || scale < 0.1 || scale > 1.5) {
      return NextResponse.json({ error: 'Invalid scale' }, { status: 400 })
    }
    if (typeof positionX !== 'number' || positionX < 0 || positionX > 1) {
      return NextResponse.json({ error: 'Invalid positionX' }, { status: 400 })
    }
    if (typeof positionY !== 'number' || positionY < 0 || positionY > 1) {
      return NextResponse.json({ error: 'Invalid positionY' }, { status: 400 })
    }

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

    // 배경 제거된 임시 이미지 URL 확인
    if (!product.rembg_temp_url) {
      return NextResponse.json({ error: 'No rembg image available' }, { status: 400 })
    }

    // 1. 배경 제거된 이미지 다운로드
    const rembgResponse = await fetch(product.rembg_temp_url)
    if (!rembgResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch rembg image' }, { status: 500 })
    }
    const rembgBuffer = Buffer.from(await rembgResponse.arrayBuffer())

    // 2. 이미지 메타데이터 가져오기
    const metadata = await sharp(rembgBuffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    if (originalWidth === 0 || originalHeight === 0) {
      return NextResponse.json({ error: 'Invalid image dimensions' }, { status: 500 })
    }

    // 3. 목표 크기 계산
    const aspectRatio = originalWidth / originalHeight
    let targetWidth: number
    let targetHeight: number

    // scale은 캔버스 높이 기준
    const maxHeight = Math.floor(CANVAS_HEIGHT * scale)
    const maxWidth = Math.floor(CANVAS_WIDTH * scale)

    if (aspectRatio > 1) {
      // 가로가 더 긴 이미지
      targetWidth = Math.min(maxWidth, Math.floor(maxHeight * aspectRatio))
      targetHeight = Math.floor(targetWidth / aspectRatio)
    } else {
      // 세로가 더 긴 이미지
      targetHeight = Math.min(maxHeight, Math.floor(maxWidth / aspectRatio))
      targetWidth = Math.floor(targetHeight * aspectRatio)
    }

    // 4. 위치 계산
    const maxMoveX = CANVAS_WIDTH - targetWidth
    const maxMoveY = CANVAS_HEIGHT - targetHeight
    const left = Math.floor(maxMoveX * positionX)
    const top = Math.floor(maxMoveY * positionY)

    // 5. 이미지 리사이즈
    const resizedBuffer = await sharp(rembgBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: false,
      })
      .png()
      .toBuffer()

    // 6. 투명 캔버스에 합성
    const resultBuffer = await sharp({
      create: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: resizedBuffer,
          left: Math.max(0, left),
          top: Math.max(0, top),
        },
      ])
      .png()
      .toBuffer()

    // 7. R2에 업로드
    const timestamp = Date.now()
    const originalKey = `ad-products/original/${id}_result_${timestamp}.png`
    const compressedKey = `ad-products/compressed/${id}_result_${timestamp}.webp`

    // 원본 PNG 업로드
    const base64Png = resultBuffer.toString('base64')
    const originalUrl = await uploadDataUrlToR2(
      `data:image/png;base64,${base64Png}`,
      originalKey
    )

    // 압축 WebP 업로드
    const webpBuffer = await sharp(resultBuffer)
      .webp({ quality: 85 })
      .toBuffer()
    const base64Webp = webpBuffer.toString('base64')
    const compressedUrl = await uploadDataUrlToR2(
      `data:image/webp;base64,${base64Webp}`,
      compressedKey
    )

    // 8. DB 업데이트
    const updatedProduct = await prisma.ad_products.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        image_url: compressedUrl,
        image_url_original: originalUrl,
        image_width: CANVAS_WIDTH,
        image_height: CANVAS_HEIGHT,
        completed_at: new Date(),
      },
    })

    // 캐시 무효화
    invalidateProductsCache(user.id)

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('이미지 처리 오류:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}
