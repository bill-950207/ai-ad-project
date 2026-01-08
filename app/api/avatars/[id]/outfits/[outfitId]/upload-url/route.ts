/**
 * 의상 결과 이미지 업로드 URL API 라우트
 *
 * POST /api/avatars/[id]/outfits/[outfitId]/upload-url - 업로드 URL 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { generateOutfitResultUploadUrls } from '@/lib/storage/r2'

/** 라우트 파라미터 타입 */
interface RouteParams {
  params: Promise<{ id: string; outfitId: string }>
}

/**
 * POST /api/avatars/[id]/outfits/[outfitId]/upload-url
 *
 * 의상 결과 이미지 업로드용 presigned URL을 생성합니다.
 *
 * 요청 본문:
 * - originalExt: 원본 이미지 확장자 (기본: 'png')
 *
 * 응답:
 * - original: { uploadUrl, publicUrl, key }
 * - compressed: { uploadUrl, publicUrl, key }
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
    const body = await request.json().catch(() => ({}))
    const { originalExt = 'png' } = body as { originalExt?: string }

    // 지원하는 확장자 검증
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp']
    if (!allowedExtensions.includes(originalExt.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid image extension' },
        { status: 400 }
      )
    }

    // Presigned URL 생성
    const uploadUrls = await generateOutfitResultUploadUrls(
      outfit.id,
      originalExt.toLowerCase()
    )

    return NextResponse.json({ uploadUrls })
  } catch (error) {
    console.error('업로드 URL 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URLs' },
      { status: 500 }
    )
  }
}
