/**
 * 참조 스타일 이미지 분석 API
 *
 * POST /api/image-ads/analyze-reference
 *
 * 참조 이미지를 분석하여 스타일/분위기 요소를 추출하고
 * 해당하는 카테고리 옵션을 자동으로 선택합니다.
 *
 * 제품 이미지, 제품 정보, 아바타 정보를 함께 분석하여
 * 더 정확한 옵션을 추천합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeReferenceStyleImage, ImageAdType, AvatarInfoForScenario } from '@/lib/gemini/client'
import { CATEGORY_OPTIONS } from '@/lib/image-ad/category-options'

interface AnalyzeRequestBody {
  imageUrl: string
  adType: ImageAdType
  // 제품 정보
  productName?: string
  productDescription?: string
  productSellingPoints?: string[]
  productImageUrl?: string
  // 아바타 정보
  hasAvatar?: boolean
  avatarInfo?: AvatarInfoForScenario
  avatarImageUrl?: string  // 실제 아바타 이미지 URL
  // using 타입 전용
  productUsageMethod?: string
  // 출력 언어
  language?: string
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
    const {
      imageUrl,
      adType,
      productName,
      productDescription,
      productSellingPoints,
      productImageUrl,
      hasAvatar,
      avatarInfo,
      avatarImageUrl,
      productUsageMethod,
      language,
    } = body

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

    // Gemini로 이미지 분석 (제품/아바타 컨텍스트 포함)
    const analysisResult = await analyzeReferenceStyleImage({
      imageUrl,
      adType,
      availableOptions,
      // 제품 정보
      productName,
      productDescription,
      productSellingPoints,
      productImageUrl,
      // 아바타 정보
      hasAvatar,
      avatarInfo,
      avatarImageUrl,
      // using 타입 전용
      productUsageMethod,
      // 출력 언어
      language,
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
