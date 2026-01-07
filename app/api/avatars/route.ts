import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { submitToQueue } from '@/lib/fal/client'
import { buildPromptFromOptions, validateAvatarOptions, AvatarOptions } from '@/lib/avatar/prompt-builder'

// GET /api/avatars - List user's avatars
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const avatars = await prisma.avatar.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ avatars })
  } catch (error) {
    console.error('Error fetching avatars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch avatars' },
      { status: 500 }
    )
  }
}

// POST /api/avatars - Create new avatar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, prompt: directPrompt, options } = body as {
      name: string
      prompt?: string
      options?: AvatarOptions
    }

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Validate options if provided
    if (options && !validateAvatarOptions(options)) {
      return NextResponse.json(
        { error: 'Invalid avatar options' },
        { status: 400 }
      )
    }

    // Build prompt from options or use direct prompt
    const prompt = directPrompt || (options ? buildPromptFromOptions(options) : '')

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt or options are required' },
        { status: 400 }
      )
    }

    // Check user credits
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    })

    if (!profile || profile.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Submit to fal.ai queue
    const queueResponse = await submitToQueue(prompt)

    // Create avatar record and deduct credit in transaction
    const avatar = await prisma.$transaction(async (tx) => {
      // Deduct credit
      await tx.profile.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      })

      // Create avatar record
      return tx.avatar.create({
        data: {
          userId: user.id,
          name: name.trim(),
          prompt,
          options: options ? JSON.parse(JSON.stringify(options)) : undefined,
          status: 'IN_QUEUE',
          falRequestId: queueResponse.request_id,
          falResponseUrl: queueResponse.response_url,
          falStatusUrl: queueResponse.status_url,
          falCancelUrl: queueResponse.cancel_url,
        },
      })
    })

    return NextResponse.json({ avatar }, { status: 201 })
  } catch (error) {
    console.error('Error creating avatar:', error)
    return NextResponse.json(
      { error: 'Failed to create avatar' },
      { status: 500 }
    )
  }
}
