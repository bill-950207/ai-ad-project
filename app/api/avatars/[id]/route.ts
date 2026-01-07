import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { cancelQueueRequest } from '@/lib/fal/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/avatars/[id] - Get single avatar
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const avatar = await prisma.avatar.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    return NextResponse.json({ avatar })
  } catch (error) {
    console.error('Error fetching avatar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch avatar' },
      { status: 500 }
    )
  }
}

// DELETE /api/avatars/[id] - Delete avatar
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const avatar = await prisma.avatar.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // Try to cancel if still in queue
    if (avatar.status === 'IN_QUEUE' && avatar.falRequestId) {
      try {
        await cancelQueueRequest(avatar.falRequestId)
      } catch {
        // Ignore cancel errors
      }
    }

    await prisma.avatar.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting avatar:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
