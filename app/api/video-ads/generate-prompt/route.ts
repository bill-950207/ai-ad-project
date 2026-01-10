/**
 * 영상 광고 프롬프트 생성 API
 *
 * POST: 제품 정보와 설정을 기반으로 영상 프롬프트 생성 (Gemini 사용)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { summarizeProductInfo, generateVideoPrompt } from '@/lib/gemini/client'

interface RequestBody {
  productInfo?: string        // 직접 입력한 제품 정보
  productName?: string        // 제품명
  productDescription?: string // 제품 설명
  duration: number            // 영상 길이
  style?: string              // 광고 스타일
  additionalInstructions?: string  // 추가 지시사항
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
    const { productInfo, productName, productDescription, duration, style, additionalInstructions } = body

    if (!duration) {
      return NextResponse.json(
        { error: 'Duration is required' },
        { status: 400 }
      )
    }

    // 제품 정보가 없으면 에러
    if (!productInfo && !productName && !productDescription) {
      return NextResponse.json(
        { error: 'Product information is required' },
        { status: 400 }
      )
    }

    // 1. 제품 정보 요약
    const summaryResult = await summarizeProductInfo({
      rawText: productInfo,
      productName,
      productDescription,
    })

    // 2. 영상 프롬프트 생성
    const promptResult = await generateVideoPrompt({
      productSummary: summaryResult.summary,
      duration,
      style: style || summaryResult.suggestedTone,
      additionalInstructions,
    })

    return NextResponse.json({
      success: true,
      summary: summaryResult,
      prompt: promptResult.prompt,
      negativePrompt: promptResult.negativePrompt,
    })
  } catch (error) {
    console.error('프롬프트 생성 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate prompt' },
      { status: 500 }
    )
  }
}
