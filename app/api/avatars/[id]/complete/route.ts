/**
 * 아바타 업로드 완료 API 라우트
 *
 * 클라이언트에서 R2 업로드 완료 후 호출하여
 * 이미지 URL을 저장하고 아바타 상태를 COMPLETED로 변경합니다.
 *
 * POST /api/avatars/[id]/complete - 업로드 완료 처리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/** 라우트 파라미터 타입 */
interface RouteParams {
  params: Promise<{ id: string }>
}

/** 요청 본문 타입 */
interface CompleteRequestBody {
  originalUrl: string     // 원본 이미지 URL (재가공용)
  compressedUrl: string   // 압축 이미지 URL (조회용)
}

/**
 * POST /api/avatars/[id]/complete
 *
 * 클라이언트에서 R2 업로드 완료 후 호출합니다.
 * 업로드된 이미지 URL을 저장하고 아바타 상태를 완료로 변경합니다.
 *
 * 요청 본문:
 * - originalUrl: 원본 이미지 R2 URL
 * - compressedUrl: 압축 이미지 R2 URL
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 아바타 조회 (본인 소유 확인)
    const avatar = await prisma.avatars.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // UPLOADING 상태인 경우에만 완료 처리 가능
    if (avatar.status !== 'UPLOADING') {
      return NextResponse.json(
        { error: 'Avatar is not in uploading state' },
        { status: 400 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json() as CompleteRequestBody

    if (!body.originalUrl || !body.compressedUrl) {
      return NextResponse.json(
        { error: 'Missing image URLs' },
        { status: 400 }
      )
    }

    // URL 형식 검증 (R2 공개 URL인지 확인)
    const r2PublicUrl = process.env.R2_PUBLIC_URL
    if (r2PublicUrl) {
      if (!body.originalUrl.startsWith(r2PublicUrl) ||
          !body.compressedUrl.startsWith(r2PublicUrl)) {
        return NextResponse.json(
          { error: 'Invalid image URL format' },
          { status: 400 }
        )
      }
    }

    // 아바타 레코드 업데이트 (완료)
    const updatedAvatar = await prisma.avatars.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        image_url: body.compressedUrl,           // 압축 WebP URL (조회용)
        image_url_original: body.originalUrl,    // 원본 URL (재가공용)
        completed_at: new Date(),                // 완료 시간
      },
    })

    return NextResponse.json({ avatar: updatedAvatar })
  } catch (error) {
    console.error('아바타 완료 처리 오류:', error)
    return NextResponse.json(
      { error: 'Failed to complete avatar' },
      { status: 500 }
    )
  }
}
