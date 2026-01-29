import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'image' | 'video' | null (all)
    const limit = parseInt(searchParams.get('limit') || '15', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const random = searchParams.get('random') === 'true'
    const interleave = searchParams.get('interleave') === 'true' // 이미지/영상 인터리브 모드

    // 인터리브 모드: 이미지와 영상을 번갈아 배치
    if (interleave) {
      const itemsPerType = Math.ceil(limit / 2)
      // 별도의 이미지/영상 오프셋 파라미터 지원 (정확한 페이지네이션)
      const imageOffset = parseInt(searchParams.get('imageOffset') || String(Math.floor(offset / 2)), 10)
      const videoOffset = parseInt(searchParams.get('videoOffset') || String(Math.floor(offset / 2)), 10)

      const [images, videos, imageCount, videoCount] = await Promise.all([
        prisma.ad_showcases.findMany({
          where: { is_active: true, type: 'image' },
          orderBy: random
            ? { created_at: 'desc' }
            : [{ display_order: 'asc' }, { created_at: 'desc' }],
          skip: imageOffset,
          take: itemsPerType
        }),
        prisma.ad_showcases.findMany({
          where: { is_active: true, type: 'video' },
          orderBy: random
            ? { created_at: 'desc' }
            : [{ display_order: 'asc' }, { created_at: 'desc' }],
          skip: videoOffset,
          take: itemsPerType
        }),
        prisma.ad_showcases.count({ where: { is_active: true, type: 'image' } }),
        prisma.ad_showcases.count({ where: { is_active: true, type: 'video' } })
      ])

      // 랜덤 셔플
      const shuffledImages = random ? images.sort(() => Math.random() - 0.5) : images
      const shuffledVideos = random ? videos.sort(() => Math.random() - 0.5) : videos

      // 인터리브 (이미지, 영상, 이미지, 영상...)
      const interleaved: typeof images = []
      const maxLen = Math.max(shuffledImages.length, shuffledVideos.length)
      for (let i = 0; i < maxLen; i++) {
        if (i < shuffledImages.length) interleaved.push(shuffledImages[i])
        if (i < shuffledVideos.length) interleaved.push(shuffledVideos[i])
      }

      return NextResponse.json({
        showcases: interleaved,
        totalCount: imageCount + videoCount,
        imageCount,
        videoCount,
        // 다음 페이지를 위한 오프셋
        nextImageOffset: imageOffset + shuffledImages.length,
        nextVideoOffset: videoOffset + shuffledVideos.length
      })
    }

    // 기존 로직: 단일 타입 조회
    const whereClause = {
      is_active: true,
      ...(type && { type })
    }

    const [showcases, totalCount] = await Promise.all([
      prisma.ad_showcases.findMany({
        where: whereClause,
        orderBy: random
          ? { created_at: 'desc' }
          : [{ display_order: 'asc' }, { created_at: 'desc' }],
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
