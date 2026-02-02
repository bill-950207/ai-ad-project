/**
 * 쇼케이스 썸네일 최적화 API
 *
 * 모든 썸네일 이미지를 리사이징(400x600) + WebP 압축하여 R2에 업로드하고 DB를 업데이트합니다.
 * 이미지 크기를 90% 이상 줄여 LCP를 개선합니다.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { fetchImageAsBuffer, resizeAndCompressToWebp } from '@/lib/image/compress'
import { uploadBufferToR2 } from '@/lib/storage/r2'

// 썸네일 최적화 사이즈 (3:4 비율)
const THUMBNAIL_MAX_WIDTH = 400
const THUMBNAIL_MAX_HEIGHT = 533

export async function POST() {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 어드민 권한 확인
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 모든 showcase 조회 (이미 최적화된 것 제외 - optimized 폴더에 있는 것)
    const showcases = await prisma.ad_showcases.findMany({
      where: {
        NOT: {
          thumbnail_url: {
            contains: '/optimized/',
          },
        },
      },
      select: {
        id: true,
        thumbnail_url: true,
        title: true,
      },
    })

    if (showcases.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All thumbnails are already optimized',
        converted: 0,
        failed: 0,
        results: [],
      })
    }

    const results: Array<{
      id: string
      title: string
      oldUrl: string
      newUrl?: string
      error?: string
    }> = []

    let converted = 0
    let failed = 0

    // 각 썸네일 최적화
    for (const showcase of showcases) {
      try {
        // 1. 이미지 다운로드
        const imageBuffer = await fetchImageAsBuffer(showcase.thumbnail_url)

        // 2. 리사이징 + WebP 압축
        const optimizedBuffer = await resizeAndCompressToWebp(imageBuffer, {
          maxWidth: THUMBNAIL_MAX_WIDTH,
          maxHeight: THUMBNAIL_MAX_HEIGHT,
          quality: 85,
        })

        // 3. R2에 업로드 (optimized 폴더에 저장)
        const timestamp = Date.now()
        const key = `showcases/optimized/${showcase.id}_${timestamp}.webp`
        const newUrl = await uploadBufferToR2(optimizedBuffer, key, 'image/webp')

        // 4. DB 업데이트
        await prisma.ad_showcases.update({
          where: { id: showcase.id },
          data: { thumbnail_url: newUrl },
        })

        results.push({
          id: showcase.id,
          title: showcase.title,
          oldUrl: showcase.thumbnail_url,
          newUrl,
        })
        converted++
      } catch (error) {
        console.error(`Failed to optimize thumbnail for ${showcase.id}:`, error)
        results.push({
          id: showcase.id,
          title: showcase.title,
          oldUrl: showcase.thumbnail_url,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Optimized ${converted} thumbnails (${THUMBNAIL_MAX_WIDTH}x${THUMBNAIL_MAX_HEIGHT} WebP), ${failed} failed`,
      converted,
      failed,
      total: showcases.length,
      results,
    })
  } catch (error) {
    console.error('Optimize thumbnails error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
