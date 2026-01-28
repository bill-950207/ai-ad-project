/**
 * 쇼케이스 등록 API
 *
 * 이미지 광고 또는 영상 광고를 쇼케이스로 등록합니다.
 * 어드민 권한 필요
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminRole } from '@/lib/auth/admin'
import { prisma } from '@/lib/db'

interface RegisterShowcaseBody {
  type: 'image' | 'video'
  adId: string
  title: string
  description?: string
  thumbnailUrl: string
  mediaUrl?: string
  adType?: string
  category?: string
  productImageUrl?: string
  avatarImageUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    // 어드민 권한 확인
    const { isAdmin, error } = await checkAdminRole()

    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: RegisterShowcaseBody = await request.json()
    const { type, adId, title, description, thumbnailUrl, mediaUrl, adType, category, productImageUrl, avatarImageUrl } = body

    // 필수 필드 검증
    if (!type || !adId || !title || !thumbnailUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: type, adId, title, thumbnailUrl' },
        { status: 400 }
      )
    }

    // 이미 등록된 쇼케이스인지 확인 (같은 광고 중복 등록 방지)
    const existingShowcase = await prisma.ad_showcases.findFirst({
      where: {
        title,
        thumbnail_url: thumbnailUrl,
      }
    })

    if (existingShowcase) {
      return NextResponse.json(
        { error: 'This ad is already registered as a showcase' },
        { status: 409 }
      )
    }

    // 현재 가장 높은 display_order 조회
    const maxOrderResult = await prisma.ad_showcases.aggregate({
      _max: {
        display_order: true
      }
    })
    const nextOrder = (maxOrderResult._max.display_order || 0) + 1

    // 쇼케이스 생성
    const showcase = await prisma.ad_showcases.create({
      data: {
        type,
        title,
        description: description || null,
        thumbnail_url: thumbnailUrl,
        media_url: mediaUrl || null,
        ad_type: adType || null,
        category: category || null,
        product_image_url: productImageUrl || null,
        avatar_image_url: avatarImageUrl || null,
        is_active: true,
        display_order: nextOrder,
      }
    })

    return NextResponse.json({
      success: true,
      data: showcase
    }, { status: 201 })
  } catch (error) {
    console.error('Error registering showcase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
