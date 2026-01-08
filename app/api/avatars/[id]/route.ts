/**
 * 개별 아바타 API 라우트
 *
 * 특정 아바타의 조회 및 삭제를 처리합니다.
 *
 * GET    /api/avatars/[id] - 단일 아바타 조회
 * DELETE /api/avatars/[id] - 아바타 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { cancelQueueRequest } from '@/lib/fal/client'

/** 라우트 파라미터 타입 */
interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/avatars/[id]
 *
 * 특정 아바타의 상세 정보를 조회합니다.
 * 본인의 아바타만 조회 가능합니다.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    return NextResponse.json({ avatar })
  } catch (error) {
    console.error('아바타 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch avatar' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/avatars/[id]
 *
 * 특정 아바타를 삭제합니다.
 * 본인의 아바타만 삭제 가능합니다.
 * 큐에서 대기 중인 경우 fal.ai 요청도 취소합니다.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // 큐에서 대기 중인 경우 fal.ai 요청 취소 시도
    if (avatar.status === 'IN_QUEUE' && avatar.fal_request_id) {
      try {
        await cancelQueueRequest(avatar.fal_request_id)
      } catch {
        // 취소 실패는 무시 (이미 처리 시작되었을 수 있음)
      }
    }

    // 아바타 레코드 삭제
    await prisma.avatars.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('아바타 삭제 오류:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
