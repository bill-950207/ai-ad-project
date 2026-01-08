/**
 * 아바타 이미지 업로드 URL API 라우트
 *
 * 클라이언트에서 R2에 직접 이미지를 업로드할 수 있는
 * presigned URL을 생성합니다.
 *
 * POST /api/avatars/[id]/upload-url - 업로드 URL 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { generateAvatarUploadUrls } from '@/lib/storage/r2'

/** 라우트 파라미터 타입 */
interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/avatars/[id]/upload-url
 *
 * 아바타 이미지 업로드용 presigned URL을 생성합니다.
 * 원본 이미지와 압축 이미지를 위한 두 개의 URL을 반환합니다.
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

    // 아바타가 이미 완료된 경우 업로드 거부
    if (avatar.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Avatar already has an image' },
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
    const uploadUrls = await generateAvatarUploadUrls(
      avatar.id,
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
