import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'image' | 'video' | null (all)
    const limit = parseInt(searchParams.get('limit') || '15', 10)

    const whereClause = {
      is_active: true,
      ...(type && { type })
    }

    const [showcases, totalCount] = await Promise.all([
      prisma.ad_showcases.findMany({
        where: whereClause,
        orderBy: [
          { display_order: 'asc' },
          { created_at: 'desc' }
        ],
        take: limit
      }),
      prisma.ad_showcases.count({
        where: whereClause
      })
    ])

    return NextResponse.json({ showcases, totalCount })
  } catch (error) {
    console.error('Error fetching showcases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
