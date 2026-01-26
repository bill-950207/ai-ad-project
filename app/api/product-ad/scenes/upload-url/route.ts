/**
 * 제품 광고 씬 키프레임 이미지 업로드 URL 생성 API
 *
 * POST: Presigned URL 생성
 * - 클라이언트에서 직접 R2에 업로드할 수 있는 URL 제공
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSceneKeyframeUploadUrls } from '@/lib/storage/r2'

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

    const { sceneId, originalExt = 'png' } = await request.json()

    if (!sceneId) {
      return NextResponse.json(
        { error: 'sceneId is required' },
        { status: 400 }
      )
    }

    // Presigned URL 생성
    const uploadUrls = await generateSceneKeyframeUploadUrls(sceneId, originalExt)

    return NextResponse.json({ uploadUrls })
  } catch (error) {
    console.error('씬 키프레임 업로드 URL 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URLs' },
      { status: 500 }
    )
  }
}
