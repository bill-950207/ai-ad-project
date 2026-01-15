/**
 * 범용 이미지 업로드 API
 *
 * POST /api/upload - 이미지 파일을 R2에 업로드
 *
 * 지원 타입:
 * - reference-style: 참조 스타일 이미지
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadBufferToR2 } from '@/lib/storage/r2'

// 허용되는 업로드 타입
type UploadType = 'reference-style'

// MIME 타입별 확장자 매핑
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * POST /api/upload
 *
 * FormData로 이미지를 받아 R2에 업로드합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as UploadType | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Upload type is required' }, { status: 400 })
    }

    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // MIME 타입 확인
    const ext = MIME_TO_EXT[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // 파일을 버퍼로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 타입별 저장 경로 설정
    let folder: string
    switch (type) {
      case 'reference-style':
        folder = 'reference-styles'
        break
      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    // R2 키 생성
    const timestamp = Date.now()
    const key = `${folder}/original/${user.id}_${timestamp}.${ext}`

    // R2에 업로드
    const publicUrl = await uploadBufferToR2(buffer, key, file.type)

    return NextResponse.json({
      url: publicUrl,
      key,
    })
  } catch (error) {
    console.error('업로드 오류:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
