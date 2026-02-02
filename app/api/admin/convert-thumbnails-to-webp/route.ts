/**
 * 쇼케이스 썸네일 WebP 변환 API
 *
 * webp가 아닌 썸네일 이미지를 webp로 변환하여 R2에 업로드하고 DB를 업데이트합니다.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { fetchImageAsBuffer, compressToWebp } from '@/lib/image/compress'
import { uploadBufferToR2 } from '@/lib/storage/r2'

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

    // webp가 아닌 thumbnail_url을 가진 showcase 조회
    const showcases = await prisma.ad_showcases.findMany({
      where: {
        NOT: {
          thumbnail_url: {
            endsWith: '.webp',
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
        message: 'No thumbnails to convert',
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

    // 각 썸네일 변환
    for (const showcase of showcases) {
      try {
        // 1. 이미지 다운로드
        const imageBuffer = await fetchImageAsBuffer(showcase.thumbnail_url)

        // 2. WebP로 압축
        const webpBuffer = await compressToWebp(imageBuffer, { quality: 85 })

        // 3. R2에 업로드
        const timestamp = Date.now()
        const key = `showcases/thumbnails/${showcase.id}_${timestamp}.webp`
        const newUrl = await uploadBufferToR2(webpBuffer, key, 'image/webp')

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
        console.error(`Failed to convert thumbnail for ${showcase.id}:`, error)
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
      message: `Converted ${converted} thumbnails, ${failed} failed`,
      converted,
      failed,
      total: showcases.length,
      results,
    })
  } catch (error) {
    console.error('Convert thumbnails error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
