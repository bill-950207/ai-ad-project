/**
 * 이미지 광고 편집 API
 *
 * POST: 기존 이미지를 수정하여 새로운 이미지 생성
 * - 편집할 이미지를 입력으로 사용
 * - 유저의 편집 요청과 기존 프롬프트를 LLM으로 합성
 * - 기존 레코드를 업데이트 (새 레코드 생성하지 않음)
 * - 크레딧 차감
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { mergeEditPrompt } from '@/lib/gemini/client'
import { submitSeedreamEditToQueue, type SeedreamAspectRatio } from '@/lib/fal/client'

/** 이미지 편집 크레딧 비용 (퀄리티별) */
const IMAGE_EDIT_CREDIT_COST = {
  medium: 2,
  high: 3,
} as const

interface RouteContext {
  params: Promise<{ id: string }>
}

interface EditRequestBody {
  editPrompt: string  // 유저가 입력한 수정 요청
  imageIndex?: number  // 배치 이미지 중 편집할 이미지 인덱스 (기본: 0)
}

// 이미지 크기를 aspect ratio로 변환
function imageSizeToAspectRatio(size: string | null): SeedreamAspectRatio {
  switch (size) {
    case '1024x1024':
      return '1:1'
    case '1536x1024':
      return '3:2'
    case '1024x1536':
      return '2:3'
    default:
      return '1:1'
  }
}

// POST: 이미지 편집
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
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
    const body: EditRequestBody = await request.json()
    const { editPrompt, imageIndex = 0 } = body

    if (!editPrompt || editPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Edit prompt is required' },
        { status: 400 }
      )
    }

    // 기존 이미지 광고 조회
    const { data: originalAd, error: findError } = await supabase
      .from('image_ads')
      .select(`
        id,
        prompt,
        image_url,
        image_urls,
        image_url_original,
        image_url_originals,
        ad_type,
        image_size,
        quality,
        selected_options,
        product_id,
        avatar_id,
        outfit_id,
        status
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (findError || !originalAd) {
      return NextResponse.json(
        { error: 'Image ad not found' },
        { status: 404 }
      )
    }

    // 상태 확인 (대소문자 무관하게 처리)
    const status = String(originalAd.status).toUpperCase()
    if (status !== 'COMPLETED') {
      console.log('이미지 편집 시도 - 상태 확인:', { id, status: originalAd.status, normalizedStatus: status })
      return NextResponse.json(
        { error: `Can only edit completed image ads (current status: ${originalAd.status})` },
        { status: 400 }
      )
    }

    if (!originalAd.prompt) {
      return NextResponse.json(
        { error: 'Original prompt not found' },
        { status: 400 }
      )
    }

    // 크레딧 비용 계산
    const quality = (originalAd.quality as 'medium' | 'high') || 'medium'
    const creditCost = IMAGE_EDIT_CREDIT_COST[quality] || IMAGE_EDIT_CREDIT_COST.medium

    // 크레딧 확인
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
    })

    if (!profile || (profile.credits ?? 0) < creditCost) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: creditCost, available: profile?.credits ?? 0 },
        { status: 402 }
      )
    }

    // 현재 이미지 URL 결정 (편집할 이미지)
    const imageUrls = originalAd.image_urls || (originalAd.image_url ? [originalAd.image_url] : [])
    const currentImageUrl = imageUrls[imageIndex] || imageUrls[0]

    if (!currentImageUrl) {
      return NextResponse.json(
        { error: 'No image found to edit' },
        { status: 400 }
      )
    }

    // LLM으로 프롬프트 합성
    console.log('프롬프트 합성 시작:', { originalPrompt: originalAd.prompt.slice(0, 100), editPrompt })

    const mergedResult = await mergeEditPrompt({
      originalPrompt: originalAd.prompt,
      userEditRequest: editPrompt,
      currentImageUrl,
    })

    console.log('프롬프트 합성 완료:', { mergedPrompt: mergedResult.mergedPrompt.slice(0, 100), editSummary: mergedResult.editSummary })

    // 편집할 이미지를 입력으로 사용 (기존 이미지 기반 수정)
    const inputImageUrls: string[] = [currentImageUrl]

    // Seedream 4.5 Edit으로 이미지 생성
    const aspectRatio = imageSizeToAspectRatio(originalAd.image_size)
    const seedreamQuality = quality === 'high' ? 'high' : 'basic'

    const queueResponse = await submitSeedreamEditToQueue({
      prompt: mergedResult.mergedPrompt,
      image_urls: inputImageUrls,
      aspect_ratio: aspectRatio,
      quality: seedreamQuality,
    })

    // 크레딧 차감
    await prisma.profiles.update({
      where: { id: user.id },
      data: {
        credits: { decrement: creditCost },
      },
    })

    console.log('이미지 편집 크레딧 차감:', { userId: user.id, cost: creditCost })

    return NextResponse.json({
      success: true,
      requestId: `fal:${queueResponse.request_id}`,
      imageAdId: id,
      imageIndex,
      editSummary: mergedResult.editSummary,
      creditUsed: creditCost,
    })
  } catch (error) {
    console.error('이미지 편집 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
