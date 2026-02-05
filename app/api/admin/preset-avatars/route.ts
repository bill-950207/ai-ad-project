import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminRole } from '@/lib/auth/admin'

/**
 * GET /api/admin/preset-avatars
 *
 * 전체 프리셋 아바타 목록 조회 (관리자 전용)
 */
export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminRole()

    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    const presetAvatars = await prisma.preset_avatars.findMany({
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' }
      ],
      include: {
        avatars: {
          select: {
            id: true,
            name: true,
            image_url: true,
            image_url_original: true,
            options: true,
            status: true,
            user_id: true,
          }
        }
      }
    })

    const data = presetAvatars.map(preset => ({
      id: preset.id,
      avatar_id: preset.avatar_id,
      display_order: preset.display_order,
      is_active: preset.is_active,
      created_at: preset.created_at,
      avatar: preset.avatars,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching preset avatars:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/preset-avatars
 *
 * 아바타를 프리셋으로 등록 (관리자 전용)
 */
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, error } = await checkAdminRole()

    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    const body = await request.json()
    const { avatarId } = body

    if (!avatarId) {
      return NextResponse.json(
        { error: 'Missing required field: avatarId' },
        { status: 400 }
      )
    }

    // 원본 아바타 확인
    const sourceAvatar = await prisma.avatars.findUnique({
      where: { id: avatarId }
    })

    if (!sourceAvatar) {
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      )
    }

    if (sourceAvatar.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Avatar is not completed yet' },
        { status: 400 }
      )
    }

    if (!sourceAvatar.image_url) {
      return NextResponse.json(
        { error: 'Avatar has no image URL' },
        { status: 400 }
      )
    }

    // 이미 프리셋으로 등록되어 있는지 확인
    const existingPreset = await prisma.preset_avatars.findUnique({
      where: { avatar_id: avatarId }
    })

    if (existingPreset) {
      return NextResponse.json(
        { error: 'Avatar is already registered as preset' },
        { status: 409 }
      )
    }

    // 다음 display_order 계산
    const maxOrder = await prisma.preset_avatars.aggregate({
      _max: { display_order: true }
    })
    const nextOrder = (maxOrder._max.display_order ?? 0) + 1

    // 프리셋 아바타 생성 및 원본 아바타 is_preset 업데이트
    const [presetAvatar] = await prisma.$transaction([
      prisma.preset_avatars.create({
        data: {
          avatar_id: avatarId,
          display_order: nextOrder,
          is_active: true,
        },
        include: {
          avatars: true
        }
      }),
      prisma.avatars.update({
        where: { id: avatarId },
        data: { is_preset: true }
      })
    ])

    return NextResponse.json({ data: presetAvatar }, { status: 201 })
  } catch (error) {
    console.error('Error registering preset avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
