import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminRole } from '@/lib/auth/admin'

// GET: List all showcases (admin only)
export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminRole()

    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    const showcases = await prisma.ad_showcases.findMany({
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' }
      ]
    })

    return NextResponse.json({ data: showcases })
  } catch (error) {
    console.error('Error fetching admin showcases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new showcase (admin only)
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
      type,
      title,
      description,
      thumbnail_url,
      media_url,
      ad_type,
      category,
      is_active = true,
      display_order = 0
    } = body

    // Validate required fields
    if (!type || !title || !thumbnail_url) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, thumbnail_url' },
        { status: 400 }
      )
    }

    if (!['image', 'video'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "image" or "video"' },
        { status: 400 }
      )
    }

    const showcase = await prisma.ad_showcases.create({
      data: {
        type,
        title,
        description,
        thumbnail_url,
        media_url,
        ad_type,
        category,
        is_active,
        display_order
      }
    })

    return NextResponse.json({ data: showcase }, { status: 201 })
  } catch (error) {
    console.error('Error creating showcase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
