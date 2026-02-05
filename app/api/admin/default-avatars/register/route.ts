import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminRole } from '@/lib/auth/admin'

// POST: Register an existing avatar as a default/preset avatar (admin only)
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
    const { avatarId, name, description } = body

    if (!avatarId) {
      return NextResponse.json(
        { error: 'Missing required field: avatarId' },
        { status: 400 }
      )
    }

    // Find the source avatar
    const sourceAvatar = await prisma.avatars.findUnique({
      where: { id: avatarId }
    })

    if (!sourceAvatar) {
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      )
    }

    if (!sourceAvatar.image_url) {
      return NextResponse.json(
        { error: 'Avatar has no image URL' },
        { status: 400 }
      )
    }

    // Get the next display order
    const maxOrder = await prisma.default_avatars.aggregate({
      _max: { display_order: true }
    })
    const nextOrder = (maxOrder._max.display_order ?? 0) + 1

    // Extract options from avatar (stored as JSON)
    const options = sourceAvatar.options as Record<string, string> | null

    // Create default avatar from source avatar
    const defaultAvatar = await prisma.default_avatars.create({
      data: {
        name: name || sourceAvatar.name,
        description: description || null,
        image_url: sourceAvatar.image_url,
        gender: options?.gender || null,
        age_group: options?.age || null,
        style: options?.outfitStyle || null,
        is_active: true,
        display_order: nextOrder
      }
    })

    return NextResponse.json({ data: defaultAvatar }, { status: 201 })
  } catch (error) {
    console.error('Error registering avatar as default:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
