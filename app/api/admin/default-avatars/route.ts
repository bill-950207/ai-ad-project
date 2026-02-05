import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminRole } from '@/lib/auth/admin'

// GET: List all default avatars (admin only)
export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminRole()

    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    const defaultAvatars = await prisma.default_avatars.findMany({
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' }
      ]
    })

    return NextResponse.json({ data: defaultAvatars })
  } catch (error) {
    console.error('Error fetching admin default avatars:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new default avatar (admin only)
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
    const {
      name,
      description,
      image_url,
      gender,
      age_group,
      style,
      is_active = true,
      display_order = 0
    } = body

    // Validate required fields
    if (!name || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: name, image_url' },
        { status: 400 }
      )
    }

    const defaultAvatar = await prisma.default_avatars.create({
      data: {
        name,
        description,
        image_url,
        gender,
        age_group,
        style,
        is_active,
        display_order
      }
    })

    return NextResponse.json({ data: defaultAvatar }, { status: 201 })
  } catch (error) {
    console.error('Error creating default avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
