import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET: List active default avatars (public endpoint)
export async function GET() {
  try {
    const defaultAvatars = await prisma.default_avatars.findMany({
      where: {
        is_active: true
      },
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        image_url: true,
        gender: true,
        age_group: true,
        style: true
      }
    })

    return NextResponse.json({ data: defaultAvatars })
  } catch (error) {
    console.error('Error fetching default avatars:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
