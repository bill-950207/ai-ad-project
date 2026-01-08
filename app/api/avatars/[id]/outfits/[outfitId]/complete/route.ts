/**
 * 의상 교체 완료 API 라우트
 *
 * POST /api/avatars/[id]/outfits/[outfitId]/complete - 클라이언트 업로드 완료 처리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/** 라우트 파라미터 타입 */
interface RouteParams {
  params: Promise<{ id: string; outfitId: string }>
}

/**
 * POST /api/avatars/[id]/outfits/[outfitId]/complete
 *
 * 클라이언트에서 R2 업로드 완료 후 호출합니다.
 * 의상 레코드에 최종 이미지 URL을 저장하고 COMPLETED 상태로 변경합니다.
 *
 * 요청 본문:
 * - originalUrl: R2에 업로드된 원본 이미지 URL
 * - compressedUrl: R2에 업로드된 압축 이미지 URL
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: avatarId, outfitId } = await params

    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 의상 조회 (본인 소유 확인)
    const outfit = await prisma.avatar_outfits.findFirst({
      where: {
        id: outfitId,
        avatar_id: avatarId,
        user_id: user.id,
      },
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    // UPLOADING 상태가 아니면 거부
    if (outfit.status !== 'UPLOADING') {
      return NextResponse.json(
        { error: 'Outfit is not in uploading state' },
        { status: 400 }
      )
    }

    // 요청 본문 파싱
    const { originalUrl, compressedUrl } = await request.json()

    if (!originalUrl || !compressedUrl) {
      return NextResponse.json(
        { error: 'Both originalUrl and compressedUrl are required' },
        { status: 400 }
      )
    }

    // 의상 레코드 업데이트
    const updatedOutfit = await prisma.avatar_outfits.update({
      where: { id: outfitId },
      data: {
        image_url: compressedUrl,
        image_url_original: originalUrl,
        status: 'COMPLETED',
        completed_at: new Date(),
      },
    })

    return NextResponse.json({ outfit: updatedOutfit })
  } catch (error) {
    console.error('의상 완료 처리 오류:', error)
    return NextResponse.json(
      { error: 'Failed to complete outfit' },
      { status: 500 }
    )
  }
}
