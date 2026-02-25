/**
 * AI 도구 - 이미지 업로드 Presigned URL API
 *
 * POST /api/ai-tools/upload
 *
 * 클라이언트에서 R2에 직접 업로드할 수 있는 presigned URL을 반환합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePresignedUrl } from '@/lib/storage/r2'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ext = 'png' } = await request.json()

    const validExts = ['png', 'jpg', 'jpeg', 'webp']
    if (!validExts.includes(ext)) {
      return NextResponse.json({ error: '지원하지 않는 이미지 형식입니다' }, { status: 400 })
    }

    const timestamp = Date.now()
    const fileName = `${user.id}_${timestamp}.${ext}`
    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`

    const result = await generatePresignedUrl({
      fileName,
      contentType,
      folder: 'ai-tools',
      type: 'original',
    })

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
    })
  } catch (error) {
    console.error('[AI Tools Upload]', error)
    return NextResponse.json(
      { error: '업로드 URL 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
