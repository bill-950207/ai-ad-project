/**
 * URL에서 제품 정보 추출 API
 *
 * POST: URL에서 제품 정보 추출 (Gemini 사용)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractProductFromUrl } from '@/lib/gemini/client'

interface RequestBody {
  url: string
}

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

    // 요청 바디 파싱
    const body: RequestBody = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // URL 유효성 검사
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // URL에서 제품 정보 추출
    const result = await extractProductFromUrl(url)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('URL 추출 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract product info' },
      { status: 500 }
    )
  }
}
