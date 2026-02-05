import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/preset-avatars
 *
 * 활성화된 프리셋 아바타 목록 조회 (공개 API)
 * preset_avatars 테이블을 avatars 테이블과 조인하여 아바타 정보 반환
 */
export async function GET() {
  try {
    const presetAvatars = await prisma.preset_avatars.findMany({
      where: {
        is_active: true
      },
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
          }
        }
      }
    })

    // 아바타 정보를 플랫하게 변환하여 반환
    const data = presetAvatars
      .filter(preset => preset.avatars.status === 'COMPLETED')
      .map(preset => ({
        id: preset.avatars.id,  // avatar_id를 id로 사용 (FK 호환)
        presetId: preset.id,
        name: preset.avatars.name,
        image_url: preset.avatars.image_url,
        image_url_original: preset.avatars.image_url_original,
        options: preset.avatars.options,
        display_order: preset.display_order,
        type: 'preset' as const,  // 프리셋 아바타임을 명시
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
