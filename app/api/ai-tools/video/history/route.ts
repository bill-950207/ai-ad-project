/**
 * AI 도구 - 영상 생성 히스토리 API
 *
 * GET /api/ai-tools/video/history?page=1&pageSize=12
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 페이지네이션
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '12')))
    const skip = (page - 1) * pageSize

    // 조회
    const [items, totalCount] = await Promise.all([
      prisma.tool_generations.findMany({
        where: {
          user_id: user.id,
          type: 'video',
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          model: true,
          prompt: true,
          input_params: true,
          status: true,
          result_url: true,
          thumbnail_url: true,
          error_message: true,
          credits_used: true,
          created_at: true,
        },
      }),
      prisma.tool_generations.count({
        where: {
          user_id: user.id,
          type: 'video',
        },
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('[AI Tools Video History]', error)
    return NextResponse.json(
      { error: '히스토리 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
