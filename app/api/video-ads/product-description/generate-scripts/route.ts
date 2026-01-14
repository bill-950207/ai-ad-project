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
import {
  submitSeedreamFirstFrameToQueue,
  getSeedreamEditQueueStatus,
  getSeedreamEditQueueResponse,
  type SeedreamAspectRatio,
} from '@/lib/fal/client'
import {
  submitFirstFrameToQueue as submitFirstFrameToKieQueue,
  getEditQueueStatus as getKieEditQueueStatus,
  getEditQueueResponse as getKieEditQueueResponse,
} from '@/lib/kie/client'

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

    // 3. 첫 프레임 이미지 2개 생성 (fal.ai Seedream 4.5-edit 메인, Kie.ai 폴백) - 병렬 처리
    // 이미지 URL 배열 구성
    const imageUrls: string[] = [finalAvatarImageUrl]
    if (productImageUrl) {
      imageUrls.push(productImageUrl)
    }

    // fal.ai로 요청 제출 시도, 실패 시 Kie.ai 폴백
    type SubmitResult = { requestId: string; provider: 'fal' | 'kie' }

    const submitFirstFrame = async (): Promise<SubmitResult> => {
      try {
        // fal.ai Seedream 4.5 먼저 시도
        const falResponse = await submitSeedreamFirstFrameToQueue(
          imageUrls,
          firstFrameResult.prompt,
          '2:3' as SeedreamAspectRatio
        )
        return { requestId: falResponse.request_id, provider: 'fal' }
      } catch (falError) {
        console.warn('fal.ai Seedream 실패, Kie.ai로 폴백:', falError)
        // Kie.ai 폴백
        const kieResponse = await submitFirstFrameToKieQueue(imageUrls, firstFrameResult.prompt, '2:3')
        return { requestId: kieResponse.request_id, provider: 'kie' }
      }
    }

    // 동일한 프롬프트로 2개의 이미지 요청을 병렬로 제출
    const [submitResult1, submitResult2] = await Promise.all([
      submitFirstFrame(),
      submitFirstFrame(),
    ])

    // 두 이미지 생성 완료까지 병렬로 폴링 (최대 2분)
    const pollForImage = async (result: SubmitResult): Promise<string | null> => {
      const maxAttempts = 40
      let attempts = 0

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000))

        try {
          if (result.provider === 'fal') {
            const status = await getSeedreamEditQueueStatus(result.requestId)
            if (status.status === 'COMPLETED') {
              const response = await getSeedreamEditQueueResponse(result.requestId)
              return response.images[0]?.url || null
            }
          } else {
            const status = await getKieEditQueueStatus(result.requestId)
            if (status.status === 'COMPLETED') {
              const response = await getKieEditQueueResponse(result.requestId)
              return response.images[0]?.url || null
            }
          }
        } catch (err) {
          console.error('첫 프레임 이미지 결과 조회 실패:', err)
          return null
        }

        attempts++
      }
      return null
    }

    // 두 이미지를 병렬로 폴링
    const [firstFrameUrl1, firstFrameUrl2] = await Promise.all([
      pollForImage(submitResult1),
      pollForImage(submitResult2),
    ])

    // 유효한 이미지 URL만 필터링
    const firstFrameUrls = [firstFrameUrl1, firstFrameUrl2].filter((url): url is string => url !== null)

    return NextResponse.json({
      scripts: scriptsResult.scripts,
      productSummary: scriptsResult.productSummary,
      firstFrameUrl: firstFrameUrls[0] || null,  // 하위 호환성
      firstFrameUrls,  // 새 필드: 2개의 이미지 URL 배열
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
