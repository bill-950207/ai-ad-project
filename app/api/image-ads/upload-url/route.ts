/**
 * 이미지 광고 업로드 URL 생성 API
 *
 * POST: Presigned URL 생성
 * - 클라이언트에서 직접 R2에 업로드할 수 있는 URL 제공
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImageAdUploadUrls } from '@/lib/storage/r2'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { imageAdId, imageIndex, originalExt = 'png' } = await request.json()

    if (!imageAdId) {
      return NextResponse.json(
        { error: 'imageAdId is required' },
        { status: 400 }
      )
    }

    if (typeof imageIndex !== 'number') {
      return NextResponse.json(
        { error: 'imageIndex is required' },
        { status: 400 }
      )
    }

    // 이미지 광고 소유권 확인
    const { data: imageAd, error: fetchError } = await supabase
      .from('image_ads')
      .select('id')
      .eq('id', imageAdId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !imageAd) {
      return NextResponse.json(
        { error: 'Image ad not found' },
        { status: 404 }
      )
    }

    // Presigned URL 생성
    const uploadUrls = await generateImageAdUploadUrls(imageAdId, imageIndex, originalExt)

    return NextResponse.json({ uploadUrls })
  } catch (error) {
    console.error('이미지 광고 업로드 URL 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URLs' },
      { status: 500 }
    )
  }
}
