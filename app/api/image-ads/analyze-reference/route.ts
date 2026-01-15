/**
 * 참조 스타일 이미지 분석 API
 *
 * POST /api/image-ads/analyze-reference
 *
 * 참조 이미지를 분석하여 스타일/분위기 요소를 추출하고
 * 해당하는 카테고리 옵션을 자동으로 선택합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeReferenceStyleImage, ImageAdType } from '@/lib/gemini/client'
import { CATEGORY_OPTIONS } from '@/lib/image-ad/category-options'

interface AnalyzeRequestBody {
  imageUrl: string
  adType: ImageAdType
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청 데이터 파싱
    const body: AnalyzeRequestBody = await request.json()
    const { imageUrl, adType } = body

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    if (!adType || !CATEGORY_OPTIONS[adType]) {
      return NextResponse.json({ error: 'Invalid ad type' }, { status: 400 })
    }

    // 현재 광고 유형의 옵션 목록 가져오기
    const categoryOptions = CATEGORY_OPTIONS[adType]
    const availableOptions = categoryOptions.groups.map(group => ({
      key: group.key,
      options: group.options.map(opt => opt.key),
    }))

    // Gemini로 이미지 분석
    const analysisResult = await analyzeReferenceStyleImage({
      imageUrl,
      adType,
      availableOptions,
    })

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('참조 이미지 분석 오류:', error)
    return NextResponse.json(
      { error: 'Failed to analyze reference image' },
      { status: 500 }
    )
  }
}
