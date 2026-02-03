/**
 * 쇼케이스 API
 *
 * GET /api/showcases - 쇼케이스 목록 조회
 *
 * 캐싱: unstable_cache (5분 TTL) - 관리자가 관리하는 공개 데이터
 * random=true일 경우 캐싱 비활성화 (매번 다른 순서 필요)
 */

import { unstable_cache } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 5분 캐시 (관리자 수정 빈도 낮음)
const CACHE_TTL = 300

/**
 * 인터리브 모드 쇼케이스 조회 (캐싱됨)
 */
const getInterleavedShowcases = unstable_cache(
  async (itemsPerType: number, imageOffset: number, videoOffset: number) => {
    const [images, videos, imageCount, videoCount] = await Promise.all([
      prisma.ad_showcases.findMany({
        where: { is_active: true, type: 'image' },
        orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
        skip: imageOffset,
        take: itemsPerType
      }),
      prisma.ad_showcases.findMany({
        where: { is_active: true, type: 'video' },
        orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
        skip: videoOffset,
        take: itemsPerType
      }),
      prisma.ad_showcases.count({ where: { is_active: true, type: 'image' } }),
      prisma.ad_showcases.count({ where: { is_active: true, type: 'video' } })
    ])

    // 인터리브 (이미지, 영상, 이미지, 영상...)
    const interleaved: typeof images = []
    const maxLen = Math.max(images.length, videos.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < images.length) interleaved.push(images[i])
      if (i < videos.length) interleaved.push(videos[i])
    }

    return {
      showcases: interleaved,
      totalCount: imageCount + videoCount,
      imageCount,
      videoCount,
      nextImageOffset: imageOffset + images.length,
      nextVideoOffset: videoOffset + videos.length
    }
  },
  ['showcases-interleaved'],
  { revalidate: CACHE_TTL, tags: ['showcases'] }
)

/**
 * 단일 타입 쇼케이스 조회 (캐싱됨)
 */
const getShowcases = unstable_cache(
  async (type: string | null, limit: number, offset: number) => {
    const whereClause = {
      is_active: true,
      ...(type && { type })
    }

    const [showcases, totalCount] = await Promise.all([
      prisma.ad_showcases.findMany({
        where: whereClause,
        orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
        skip: offset,
        take: limit
      }),
      prisma.ad_showcases.count({
        where: whereClause
      })
    ])

    return { showcases, totalCount }
  },
  ['showcases-single'],
  { revalidate: CACHE_TTL, tags: ['showcases'] }
)

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
      const imageOffset = parseInt(searchParams.get('imageOffset') || String(Math.floor(offset / 2)), 10)
      const videoOffset = parseInt(searchParams.get('videoOffset') || String(Math.floor(offset / 2)), 10)

      // random=true일 경우 캐싱 없이 직접 조회
      if (random) {
        const [images, videos, imageCount, videoCount] = await Promise.all([
          prisma.ad_showcases.findMany({
            where: { is_active: true, type: 'image' },
            orderBy: { created_at: 'desc' },
            skip: imageOffset,
            take: itemsPerType
          }),
          prisma.ad_showcases.findMany({
            where: { is_active: true, type: 'video' },
            orderBy: { created_at: 'desc' },
            skip: videoOffset,
            take: itemsPerType
          }),
          prisma.ad_showcases.count({ where: { is_active: true, type: 'image' } }),
          prisma.ad_showcases.count({ where: { is_active: true, type: 'video' } })
        ])

        // 랜덤 셔플
        const shuffledImages = images.sort(() => Math.random() - 0.5)
        const shuffledVideos = videos.sort(() => Math.random() - 0.5)

        // 인터리브
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
          nextImageOffset: imageOffset + shuffledImages.length,
          nextVideoOffset: videoOffset + shuffledVideos.length
        })
      }

      // 캐시된 데이터 사용
      const data = await getInterleavedShowcases(itemsPerType, imageOffset, videoOffset)
      return NextResponse.json(data)
    }

    // 단일 타입 조회
    if (random) {
      // random=true일 경우 캐싱 없이 직접 조회
      const whereClause = {
        is_active: true,
        ...(type && { type })
      }

      const [showcases, totalCount] = await Promise.all([
        prisma.ad_showcases.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.ad_showcases.count({
          where: whereClause
        })
      ])

      const result = showcases.sort(() => Math.random() - 0.5)
      return NextResponse.json({ showcases: result, totalCount })
    }

    // 캐시된 데이터 사용
    const data = await getShowcases(type, limit, offset)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching showcases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
