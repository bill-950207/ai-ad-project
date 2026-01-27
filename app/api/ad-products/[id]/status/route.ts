/**
 * 광고 제품 상태 조회 API 라우트
 *
 * 배경 제거 상태를 폴링합니다.
 * Kie.ai rembg 처리가 완료되면 COMPLETED 상태로 전환하고
 * 배경 제거된 이미지를 R2에 저장합니다.
 *
 * GET /api/ad-products/[id]/status - 배경 제거 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { getRembgQueueStatus, getRembgQueueResponse } from '@/lib/kie/client'
import { ad_product_status } from '@/lib/generated/prisma/client'
import { uploadBufferToR2 } from '@/lib/storage/r2'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/ad-products/[id]/status
 *
 * 광고 제품 배경 제거 상태를 조회합니다.
 * 클라이언트에서 2초 간격으로 폴링하여 진행 상황을 확인합니다.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // 이미 완료/실패 상태인 경우 현재 상태 반환
    if (['COMPLETED', 'FAILED'].includes(product.status)) {
      return NextResponse.json({ product })
    }

    // Kie.ai 요청 ID가 없는 경우 (fal_request_id 필드에 taskId 저장)
    if (!product.fal_request_id) {
      return NextResponse.json({ product })
    }

    // Kie.ai에서 현재 상태 조회
    const kieStatus = await getRembgQueueStatus(product.fal_request_id)

    let newStatus: ad_product_status = product.status

    if (kieStatus.status === 'IN_QUEUE') {
      newStatus = 'IN_QUEUE'
    } else if (kieStatus.status === 'IN_PROGRESS') {
      newStatus = 'IN_PROGRESS'
    } else if (kieStatus.status === 'COMPLETED') {
      // 배경 제거 완료 - EDITING 상태로 전환
      try {
        const response = await getRembgQueueResponse(product.fal_request_id)

        if (response.image && response.image.url) {
          // 1. Kie.ai 결과 이미지 다운로드
          const rembgImageResponse = await fetch(response.image.url)
          if (!rembgImageResponse.ok) {
            throw new Error('Failed to fetch rembg image')
          }
          const rembgBuffer = Buffer.from(await rembgImageResponse.arrayBuffer())

          // 2. WebP로 변환
          const sharp = (await import('sharp')).default
          const webpBuffer = await sharp(rembgBuffer)
            .webp({ quality: 85 })
            .toBuffer()

          // 3. R2 키 생성 (PNG 원본 + WebP 압축본)
          const timestamp = Date.now()
          const pngKey = `ad-products/rembg/original/${id}_${timestamp}.png`
          const webpKey = `ad-products/rembg/compressed/${id}_${timestamp}.webp`

          // 4. PNG 원본과 WebP 압축본을 병렬로 R2에 업로드
          const [originalUrl, compressedUrl] = await Promise.all([
            uploadBufferToR2(rembgBuffer, pngKey, 'image/png'),
            uploadBufferToR2(webpBuffer, webpKey, 'image/webp'),
          ])

          // 5. DB 업데이트 - COMPLETED 상태로 전환
          const updatedProduct = await prisma.ad_products.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              image_url: compressedUrl,           // WebP (카드 표시용)
              image_url_original: originalUrl,    // PNG (AI 모델용)
              rembg_image_url: compressedUrl,     // WebP (하위 호환)
            },
          })

          return NextResponse.json({ product: updatedProduct })
        } else {
          const updatedProduct = await prisma.ad_products.update({
            where: { id },
            data: {
              status: 'FAILED',
              error_message: 'No image generated',
            },
          })

          return NextResponse.json({ product: updatedProduct })
        }
      } catch (error) {
        console.error('배경 제거 완료 처리 오류:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        const updatedProduct = await prisma.ad_products.update({
          where: { id },
          data: {
            status: 'FAILED',
            error_message: errorMessage,
          },
        })

        return NextResponse.json({ product: updatedProduct })
      }
    }

    // 상태가 변경된 경우 DB 업데이트
    if (newStatus !== product.status) {
      const updatedProduct = await prisma.ad_products.update({
        where: { id },
        data: { status: newStatus },
      })

      return NextResponse.json({ product: updatedProduct })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('광고 제품 상태 확인 오류:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
