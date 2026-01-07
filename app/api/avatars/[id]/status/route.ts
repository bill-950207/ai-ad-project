import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { getQueueStatus, getQueueResponse } from '@/lib/fal/client'
import { uploadImageToR2, generateAvatarFileName } from '@/lib/storage/r2'
import { AvatarStatus } from '@/lib/generated/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/avatars/[id]/status - Poll avatar generation status
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

    // If already completed or failed, return current status
    if (avatar.status === 'COMPLETED' || avatar.status === 'FAILED' || avatar.status === 'CANCELLED') {
      return NextResponse.json({ avatar })
    }

    // If no fal request ID, something went wrong
    if (!avatar.falRequestId) {
      return NextResponse.json({ avatar })
    }

    // Get status from fal.ai
    const falStatus = await getQueueStatus(avatar.falRequestId)

    // Map fal status to our status
    let newStatus: AvatarStatus = avatar.status
    if (falStatus.status === 'IN_QUEUE') {
      newStatus = 'IN_QUEUE'
    } else if (falStatus.status === 'IN_PROGRESS') {
      newStatus = 'IN_PROGRESS'
    } else if (falStatus.status === 'COMPLETED') {
      // Get the response and process it
      try {
        const response = await getQueueResponse(avatar.falRequestId)

        if (response.images && response.images.length > 0) {
          const image = response.images[0]

          // Upload to R2
          const fileName = generateAvatarFileName(avatar.id)
          const r2Url = await uploadImageToR2({
            imageUrl: image.url,
            fileName,
            folder: 'avatars',
          })

          // Update avatar with completed data
          const updatedAvatar = await prisma.avatar.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              imageUrl: r2Url,
              imageWidth: image.width,
              imageHeight: image.height,
              seed: response.seed,
              promptExpanded: response.prompt,
              hasNsfw: response.has_nsfw_concepts?.[0] || false,
              completedAt: new Date(),
            },
          })

          return NextResponse.json({ avatar: updatedAvatar })
        } else {
          // No images in response - mark as failed
          const updatedAvatar = await prisma.avatar.update({
            where: { id },
            data: {
              status: 'FAILED',
              errorMessage: 'No images generated',
            },
          })

          return NextResponse.json({ avatar: updatedAvatar })
        }
      } catch (error) {
        console.error('Error processing completed avatar:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        const updatedAvatar = await prisma.avatar.update({
          where: { id },
          data: {
            status: 'FAILED',
            errorMessage,
          },
        })

        return NextResponse.json({ avatar: updatedAvatar })
      }
    }

    // Update status if changed
    if (newStatus !== avatar.status) {
      const updatedAvatar = await prisma.avatar.update({
        where: { id },
        data: { status: newStatus },
      })

      return NextResponse.json({ avatar: updatedAvatar })
    }

    return NextResponse.json({ avatar })
  } catch (error) {
    console.error('Error checking avatar status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
