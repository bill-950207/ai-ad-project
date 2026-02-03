/**
 * 개별 쇼케이스 썸네일 최적화 API
 *
 * POST /api/admin/convert-thumbnails-to-webp/[id]
 * - 특정 쇼케이스의 썸네일 이미지를 리사이징(1024x1024) + WebP 압축
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { fetchImageAsBuffer, resizeAndCompressToWebp } from '@/lib/image/compress'
import { uploadBufferToR2 } from '@/lib/storage/r2'

// 썸네일 최적화 사이즈
const THUMBNAIL_MAX_WIDTH = 1024
const THUMBNAIL_MAX_HEIGHT = 1024

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // 해당 쇼케이스 조회
    const showcase = await prisma.ad_showcases.findUnique({
      where: { id },
      select: {
        id: true,
        thumbnail_url: true,
        title: true,
      },
    })

    if (!showcase) {
      return NextResponse.json({ error: 'Showcase not found' }, { status: 404 })
    }

    // 이미 최적화된 경우 체크
    if (showcase.thumbnail_url.includes('/optimized/')) {
      return NextResponse.json({
        success: true,
        message: 'Already optimized',
        alreadyOptimized: true,
        thumbnail_url: showcase.thumbnail_url,
      })
    }

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

    return NextResponse.json({
      success: true,
      message: `Optimized "${showcase.title}" (${THUMBNAIL_MAX_WIDTH}x${THUMBNAIL_MAX_HEIGHT} WebP)`,
      oldUrl: showcase.thumbnail_url,
      newUrl,
      thumbnail_url: newUrl,
    })
  } catch (error) {
    console.error('Optimize single thumbnail error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
