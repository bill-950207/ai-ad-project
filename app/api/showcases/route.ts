import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'image' | 'video' | null (all)
    const limit = parseInt(searchParams.get('limit') || '15', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const random = searchParams.get('random') === 'true'

    const whereClause = {
      is_active: true,
      ...(type && { type })
    }

    const [showcases, totalCount] = await Promise.all([
      prisma.ad_showcases.findMany({
        where: whereClause,
        orderBy: random
          ? { created_at: 'desc' } // 랜덤 정렬 시 일단 최신순으로 가져온 뒤 셔플
          : [
              { display_order: 'asc' },
              { created_at: 'desc' }
            ],
        skip: offset,
        take: limit
      }),
      prisma.ad_showcases.count({
        where: whereClause
      })
    ])

    // 랜덤 옵션이 켜져 있으면 결과를 셔플
    const result = random
      ? showcases.sort(() => Math.random() - 0.5)
      : showcases

    return NextResponse.json({ showcases: result, totalCount })
  } catch (error) {
    console.error('Error fetching showcases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
