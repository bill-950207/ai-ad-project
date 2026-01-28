import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminRole } from '@/lib/auth/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get a single showcase (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { isAdmin, error } = await checkAdminRole()

    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    const { id } = await params

    const showcase = await prisma.ad_showcases.findUnique({
      where: { id }
    })

    if (!showcase) {
      return NextResponse.json(
        { error: 'Showcase not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: showcase })
  } catch (error) {
    console.error('Error fetching showcase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update a showcase (admin only)
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

    // Check if showcase exists
    const existing = await prisma.ad_showcases.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Showcase not found' },
        { status: 404 }
      )
    }

    // Validate type if provided
    if (body.type && !['image', 'video'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "image" or "video"' },
        { status: 400 }
      )
    }

    const showcase = await prisma.ad_showcases.update({
      where: { id },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.thumbnail_url !== undefined && { thumbnail_url: body.thumbnail_url }),
        ...(body.media_url !== undefined && { media_url: body.media_url }),
        ...(body.ad_type !== undefined && { ad_type: body.ad_type }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        ...(body.display_order !== undefined && { display_order: body.display_order }),
        updated_at: new Date()
      }
    })

    return NextResponse.json({ data: showcase })
  } catch (error) {
    console.error('Error updating showcase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a showcase (admin only)
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

    // Check if showcase exists
    const existing = await prisma.ad_showcases.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Showcase not found' },
        { status: 404 }
      )
    }

    await prisma.ad_showcases.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting showcase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
