/**
 * 이미지 광고 임시 저장 API
 *
 * POST /api/image-ad/draft - 마법사 진행 상태 저장 (생성 또는 업데이트)
 * GET /api/image-ad/draft - 현재 초안 조회
 * DELETE /api/image-ad/draft - 초안 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/image-ad/draft
 *
 * 마법사 진행 상태를 저장합니다.
 * - 기존 초안이 있으면 업데이트
 * - 없으면 새로 생성
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
      id,  // 기존 초안 ID (없으면 새로 생성)
      wizardStep,
      wizardState,  // 전체 위저드 상태 JSON
      // 기본 필드들
      adType,
      productId,
      avatarId: rawAvatarId,
      outfitId,
      imageSize,
      quality,
      numImages,
      forceNew,  // true면 항상 새 draft 생성
    } = body

    // AI 생성 아바타의 경우 avatar_id는 null로 저장 (UUID가 아니므로)
    const avatarId = rawAvatarId === 'ai-generated' ? null : rawAvatarId

    // 기존 초안 업데이트 (id가 있고 forceNew가 아닐 때)
    if (id && !forceNew) {
      const existing = await prisma.image_ads.findFirst({
        where: {
          id,
          user_id: user.id,
          status: 'DRAFT',
        },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      const updated = await prisma.image_ads.update({
        where: { id },
        data: {
          wizard_step: wizardStep,
          wizard_state: wizardState,
          ad_type: adType || existing.ad_type,
          product_id: productId || null,
          avatar_id: avatarId || null,
          outfit_id: outfitId || null,
          image_size: imageSize || null,
          quality: quality || null,
          num_images: numImages || null,
          updated_at: new Date(),
        },
      })

      return NextResponse.json({ draft: updated })
    }

    // forceNew가 아닌 경우에만 기존 DRAFT 확인 (같은 adType)
    if (!forceNew) {
      const existingDraft = await prisma.image_ads.findFirst({
        where: {
          user_id: user.id,
          status: 'DRAFT',
          ad_type: adType,
        },
        orderBy: { updated_at: 'desc' },
      })

      if (existingDraft) {
        // 기존 초안 업데이트
        const updated = await prisma.image_ads.update({
          where: { id: existingDraft.id },
          data: {
            wizard_step: wizardStep,
            wizard_state: wizardState,
            product_id: productId || null,
            avatar_id: avatarId || null,
            outfit_id: outfitId || null,
            image_size: imageSize || null,
            quality: quality || null,
            num_images: numImages || null,
            updated_at: new Date(),
          },
        })

        return NextResponse.json({ draft: updated })
      }
    }

    // 새 초안 생성 (forceNew이거나 기존 draft가 없을 때)
    const draft = await prisma.image_ads.create({
      data: {
        user_id: user.id,
        ad_type: adType || 'productOnly',
        status: 'DRAFT',
        wizard_step: wizardStep || 1,
        wizard_state: wizardState,
        product_id: productId || null,
        avatar_id: avatarId || null,
        outfit_id: outfitId || null,
        image_size: imageSize || null,
        quality: quality || null,
        num_images: numImages || null,
      },
    })

    return NextResponse.json({ draft }, { status: 201 })
  } catch (error) {
    console.error('이미지 광고 임시 저장 오류:', error)
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/image-ad/draft
 *
 * 현재 초안을 조회합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const adType = searchParams.get('adType')

    if (id) {
      // 특정 ID로 조회
      const draft = await prisma.image_ads.findUnique({
        where: { id },
        include: {
          ad_products: true,
          avatars: true,
          avatar_outfits: true,
        },
      })

      if (!draft || draft.user_id !== user.id || draft.status !== 'DRAFT') {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      return NextResponse.json({ draft })
    }

    // 가장 최근 DRAFT 조회 (adType 필터 옵션)
    const draft = await prisma.image_ads.findFirst({
      where: {
        user_id: user.id,
        status: 'DRAFT',
        ...(adType && { ad_type: adType }),
      },
      include: {
        ad_products: true,
        avatars: true,
        avatar_outfits: true,
      },
      orderBy: { updated_at: 'desc' },
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('이미지 광고 초안 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/image-ad/draft
 *
 * 초안을 삭제합니다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // 특정 초안 삭제
      await prisma.image_ads.deleteMany({
        where: {
          id,
          user_id: user.id,
          status: 'DRAFT',
        },
      })
    } else {
      // 모든 DRAFT 삭제
      await prisma.image_ads.deleteMany({
        where: {
          user_id: user.id,
          status: 'DRAFT',
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('이미지 광고 초안 삭제 오류:', error)
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    )
  }
}
