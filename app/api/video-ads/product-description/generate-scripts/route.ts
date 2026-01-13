/**
 * 제품 설명 영상 - 대본 및 첫 프레임 생성 API
 *
 * POST /api/video-ads/product-description/generate-scripts
 * - 제품 정보를 바탕으로 3가지 스타일의 대본 생성
 * - 첫 프레임 이미지 프롬프트 생성 및 이미지 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { generateProductScripts, generateFirstFramePrompt } from '@/lib/gemini/client'
import { submitFirstFrameToQueue, getEditQueueStatus, getEditQueueResponse } from '@/lib/kie/client'

/**
 * POST /api/video-ads/product-description/generate-scripts
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      productId,
      avatarId,
      avatarImageUrl,  // 의상 선택 시 사용되는 이미지 URL (선택적)
      productInfo,
      locationPrompt,
      durationSeconds,
      cameraComposition,  // 카메라 구도 (selfie, tripod, closeup, fullbody)
    } = body

    if (!avatarId) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 })
    }

    if (!productInfo?.trim()) {
      return NextResponse.json({ error: 'Product info is required' }, { status: 400 })
    }

    // 아바타 조회
    const avatar = await prisma.avatars.findFirst({
      where: {
        id: avatarId,
        user_id: user.id,
        status: 'COMPLETED',
      },
    })

    if (!avatar || !avatar.image_url) {
      return NextResponse.json({ error: 'Avatar not found or has no image' }, { status: 404 })
    }

    // 사용할 아바타 이미지 URL (의상이 선택된 경우 해당 URL 사용)
    const finalAvatarImageUrl = avatarImageUrl || avatar.image_url

    // 제품 이미지 URL (선택 사항)
    let productImageUrl: string | undefined
    if (productId) {
      const product = await prisma.ad_products.findFirst({
        where: {
          id: productId,
          user_id: user.id,
          status: 'COMPLETED',
        },
      })
      productImageUrl = product?.rembg_image_url || product?.image_url || undefined
    }

    // 1. 대본 생성 (Gemini)
    const scriptsResult = await generateProductScripts({
      productInfo: productInfo.trim(),
      durationSeconds: durationSeconds || 30,
    })

    // 2. 첫 프레임 프롬프트 생성 (Gemini)
    const firstFrameResult = await generateFirstFramePrompt({
      productInfo: productInfo.trim(),
      avatarImageUrl: finalAvatarImageUrl,
      locationPrompt: locationPrompt?.trim() || undefined,
      productImageUrl,
      cameraComposition,  // 카메라 구도 전달
    })

    // 3. 첫 프레임 이미지 생성 (Kie Seedream 4.5-edit)
    // 이미지 URL 배열 구성
    const imageUrls: string[] = [finalAvatarImageUrl]
    if (productImageUrl) {
      imageUrls.push(productImageUrl)
    }

    const queueResponse = await submitFirstFrameToQueue(
      imageUrls,
      firstFrameResult.prompt,
      '2:3' // 세로 비율 (9:16에 가까운)
    )

    // 이미지 생성 완료까지 폴링 (최대 2분)
    const maxAttempts = 40
    let attempts = 0
    let firstFrameUrl: string | null = null

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000))

      const status = await getEditQueueStatus(queueResponse.request_id)

      if (status.status === 'COMPLETED') {
        try {
          const result = await getEditQueueResponse(queueResponse.request_id)
          firstFrameUrl = result.images[0]?.url || null
        } catch (err) {
          console.error('첫 프레임 이미지 결과 조회 실패:', err)
        }
        break
      }

      attempts++
    }

    return NextResponse.json({
      scripts: scriptsResult.scripts,
      productSummary: scriptsResult.productSummary,
      firstFrameUrl,
      locationDescription: firstFrameResult.locationDescription,
      firstFramePrompt: firstFrameResult.prompt,
    })
  } catch (error) {
    console.error('대본 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scripts' },
      { status: 500 }
    )
  }
}
