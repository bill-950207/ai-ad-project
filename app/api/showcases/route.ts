import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'image' | 'video' | null (all)
    const limit = parseInt(searchParams.get('limit') || '15', 10)

    const showcases = await prisma.ad_showcases.findMany({
      where: {
        is_active: true,
        ...(type && { type })
      },
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json({ data: showcases })
  } catch (error) {
    console.error('Error fetching showcases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
