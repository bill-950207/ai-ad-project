import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminRole } from '@/lib/auth/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH: Update a default avatar (admin only)
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

    // Check if avatar exists
    const existing = await prisma.default_avatars.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Default avatar not found' },
        { status: 404 }
      )
    }

    const {
      name,
      description,
      image_url,
      gender,
      age_group,
      style,
      is_active,
      display_order
    } = body

    const updatedAvatar = await prisma.default_avatars.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(image_url !== undefined && { image_url }),
        ...(gender !== undefined && { gender }),
        ...(age_group !== undefined && { age_group }),
        ...(style !== undefined && { style }),
        ...(is_active !== undefined && { is_active }),
        ...(display_order !== undefined && { display_order }),
        updated_at: new Date()
      }
    })

    return NextResponse.json({ data: updatedAvatar })
  } catch (error) {
    console.error('Error updating default avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a default avatar (admin only)
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

    // Check if avatar exists
    const existing = await prisma.default_avatars.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Default avatar not found' },
        { status: 404 }
      )
    }

    await prisma.default_avatars.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting default avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
