import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminRole } from '@/lib/auth/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/admin/preset-avatars/[id]
 *
 * 프리셋 아바타 수정 (관리자 전용)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { isAdmin, error } = await checkAdminRole()

    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { display_order, is_active } = body

    const presetAvatar = await prisma.preset_avatars.update({
      where: { id },
      data: {
        ...(display_order !== undefined && { display_order }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
      include: {
        avatars: true
      }
    })

    return NextResponse.json({ data: presetAvatar })
  } catch (error) {
    console.error('Error updating preset avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/preset-avatars/[id]
 *
 * 프리셋 아바타 삭제 (관리자 전용)
 * 원본 아바타는 유지됨
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { isAdmin, error } = await checkAdminRole()

    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    const { id } = await params

    // 프리셋 정보 조회 (avatar_id 확인용)
    const preset = await prisma.preset_avatars.findUnique({
      where: { id }
    })

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset avatar not found' },
        { status: 404 }
      )
    }

    // 프리셋 삭제 및 원본 아바타 is_preset 해제
    await prisma.$transaction([
      prisma.preset_avatars.delete({
        where: { id }
      }),
      prisma.avatars.update({
        where: { id: preset.avatar_id },
        data: { is_preset: false }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting preset avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
