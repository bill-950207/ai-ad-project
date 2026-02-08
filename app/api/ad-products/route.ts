/**
 * 광고 제품 API 라우트
 *
 * 광고 제품 목록 조회 및 새 광고 제품 생성을 처리합니다.
 *
 * GET  /api/ad-products - 사용자의 광고 제품 목록 조회
 * POST /api/ad-products - 새 광고 제품 생성 요청 (배경 제거)
 *
 * 캐싱: unstable_cache (5분 TTL) - 사용자별 데이터
 */

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'
import { submitRembgToQueue } from '@/lib/kie/client'
import { uploadAdProductSourceFromDataUrl } from '@/lib/storage/r2'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PRODUCT_CREDIT_COST } from '@/lib/credits'
import { checkUsageLimit } from '@/lib/subscription'
import { isAdminUser } from '@/lib/auth/admin'
import { getUserCacheTag, invalidateProductsCache, DEFAULT_USER_DATA_TTL } from '@/lib/cache/user-data'

/**
 * 제품 목록 조회 함수 (캐싱됨)
 */
function getCachedProducts(userId: string, limit: number, offset: number) {
  const cacheKey = `products-${userId}-l${limit}-o${offset}`

  return unstable_cache(
    async () => {
      const [products, totalCount] = await Promise.all([
        prisma.ad_products.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.ad_products.count({
          where: { user_id: userId },
        }),
      ])

      return { products, totalCount }
    },
    [cacheKey],
    {
      revalidate: DEFAULT_USER_DATA_TTL,
      tags: [getUserCacheTag('products', userId)]
    }
  )()
}

/**
 * GET /api/ad-products
 *
 * 현재 로그인한 사용자의 광고 제품을 조회합니다.
 * 최신순으로 정렬하여 반환합니다.
 *
 * 쿼리 파라미터:
 * - limit: 조회할 개수 (기본값: 50, 최대: 100)
 * - offset: 건너뛸 개수 (기본값: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 페이지네이션 파라미터
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 캐시된 데이터 조회
    const { products, totalCount } = await getCachedProducts(user.id, limit, offset)

    return NextResponse.json({
      products,
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore: offset + products.length < totalCount,
      },
    })
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

    // 슬롯 제한 확인 (플랜별 최대 보유 가능 개수)
    const slotCheck = await checkUsageLimit(user.id, 'product')

    // 슬롯이 꽉 찬 경우 생성 불가
    if (!slotCheck.withinLimit) {
      return NextResponse.json(
        {
          error: 'Slot limit reached',
          slotInfo: {
            used: slotCheck.used,
            limit: slotCheck.limit,
            message: `제품 슬롯이 가득 찼습니다. 현재 ${slotCheck.used}/${slotCheck.limit}개 보유 중. 새로 생성하려면 기존 제품을 삭제해주세요.`,
          },
        },
        { status: 403 }
      )
    }

    // 어드민 여부 확인
    const isAdmin = await isAdminUser(user.id)

    // 크레딧 사전 확인 (무료가 아닌 경우에만) - 어드민은 스킵
    if (PRODUCT_CREDIT_COST > 0 && !isAdmin) {
      const profile = await prisma.profiles.findUnique({
        where: { id: user.id },
        select: { credits: true },
      })

      if (!profile || (profile.credits ?? 0) < PRODUCT_CREDIT_COST) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: PRODUCT_CREDIT_COST,
            available: profile?.credits ?? 0,
          },
          { status: 402 }
        )
      }
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

      // 5. 크레딧 차감 (무료가 아닌 경우에만) - 어드민은 스킵
      if (PRODUCT_CREDIT_COST > 0 && !isAdmin) {
        await prisma.$transaction(async (tx) => {
          const currentProfile = await tx.profiles.findUnique({
            where: { id: user.id },
            select: { credits: true },
          })

          if (!currentProfile || (currentProfile.credits ?? 0) < PRODUCT_CREDIT_COST) {
            throw new Error('INSUFFICIENT_CREDITS')
          }

          await tx.profiles.update({
            where: { id: user.id },
            data: { credits: { decrement: PRODUCT_CREDIT_COST } },
          })
        }, { timeout: 10000 })
      }

      // 캐시 무효화
      invalidateProductsCache(user.id)

      return NextResponse.json({
        product: updatedProduct,
        sourceImageUrl,
        creditUsed: PRODUCT_CREDIT_COST,
        slotInfo: {
          used: slotCheck.used + 1,
          limit: slotCheck.limit,
        },
      }, { status: 201 })
    } catch (uploadError) {
      // 크레딧 부족 에러 처리 (트랜잭션 내에서 발생)
      if (uploadError instanceof Error && uploadError.message === 'INSUFFICIENT_CREDITS') {
        await prisma.ad_products.update({
          where: { id: product.id },
          data: {
            status: 'FAILED',
            error_message: 'Insufficient credits',
          },
        })
        return NextResponse.json(
          { error: 'Insufficient credits (concurrent request detected)' },
          { status: 402 }
        )
      }

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
    // 크레딧 부족 에러가 외부로 전파된 경우
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json(
        { error: 'Insufficient credits (concurrent request detected)' },
        { status: 402 }
      )
    }

    console.error('광고 제품 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to create ad product' },
      { status: 500 }
    )
  }
}
