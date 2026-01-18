/**
 * 제품 설명 영상 - 대본 및 첫 프레임 생성 API
 *
 * POST /api/video-ads/product-description/generate-scripts
 * - 제품 정보를 바탕으로 3가지 스타일의 대본 생성
 * - 첫 프레임 이미지 프롬프트 생성 및 이미지 생성
 * - AI 아바타 선택 시 GPT-Image 1.5로 아바타 포함 이미지 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import {
  generateProductScripts,
  generateFirstFramePrompt,
  generateAiAvatarPrompt,
  type CameraCompositionType,
} from '@/lib/gemini/client'
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
  // AI 아바타용 GPT-Image 1.5 Image-to-Image (kie.ai)
  submitGPTImageToQueue as submitKieGptImageToQueue,
  getGPTImageQueueStatus as getKieGptImageStatus,
  getGPTImageQueueResponse as getKieGptImageResponse,
} from '@/lib/kie/client'
import { uploadExternalImageToR2 } from '@/lib/image/compress'

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
      language = 'ko',  // 대본 생성 언어 (기본값: 한국어)
      // AI 아바타 옵션 (avatarId가 'ai-generated'일 때)
      aiAvatarOptions,
    } = body

    if (!avatarId) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 })
    }

    if (!productInfo?.trim()) {
      return NextResponse.json({ error: 'Product info is required' }, { status: 400 })
    }

    // AI 생성 아바타인지 확인
    const isAiGeneratedAvatar = avatarId === 'ai-generated'

    let finalAvatarImageUrl: string | null = null

    if (!isAiGeneratedAvatar) {
      // 기존 아바타 조회
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
      finalAvatarImageUrl = avatarImageUrl || avatar.image_url
    }

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
      language,  // 대본 생성 언어
    })

    // 2. 첫 프레임 프롬프트 생성 (Gemini) - AI 아바타와 기존 아바타 분기
    let firstFramePrompt: string
    let locationDescription: string

    if (isAiGeneratedAvatar) {
      // AI 아바타: generateAiAvatarPrompt 사용 (아바타 묘사 포함 프롬프트 생성)
      const aiAvatarResult = await generateAiAvatarPrompt({
        productInfo: productInfo.trim(),
        productImageUrl,
        locationPrompt: locationPrompt?.trim() || undefined,
        cameraComposition: cameraComposition as CameraCompositionType | undefined,
        targetGender: aiAvatarOptions?.targetGender,
        targetAge: aiAvatarOptions?.targetAge,
        style: aiAvatarOptions?.style,
        ethnicity: aiAvatarOptions?.ethnicity,
      })
      firstFramePrompt = aiAvatarResult.prompt
      locationDescription = aiAvatarResult.locationDescription
      console.log('AI 아바타 프롬프트 생성:', { prompt: firstFramePrompt, avatar: aiAvatarResult.avatarDescription })
    } else {
      // 기존 아바타: generateFirstFramePrompt 사용
      const firstFrameResult = await generateFirstFramePrompt({
        productInfo: productInfo.trim(),
        avatarImageUrl: finalAvatarImageUrl!,
        locationPrompt: locationPrompt?.trim() || undefined,
        productImageUrl,
        cameraComposition,
      })
      firstFramePrompt = firstFrameResult.prompt
      locationDescription = firstFrameResult.locationDescription
    }

    // 3. 첫 프레임 이미지 생성 (AI 아바타: 3개, 기존 아바타: 2개)
    type SubmitResult = { requestId: string; provider: 'fal' | 'kie' | 'gpt-image' }
    let submitResults: SubmitResult[]

    if (isAiGeneratedAvatar) {
      // AI 아바타: kie.ai GPT-Image 1.5 사용 (제품 이미지를 참조 이미지로 전달)
      const aiInputUrls = productImageUrl ? [productImageUrl] : []

      const submitAiAvatarFirstFrame = async (): Promise<SubmitResult> => {
        const gptResponse = await submitKieGptImageToQueue(
          aiInputUrls,
          firstFramePrompt,
          '2:3',  // 세로 비율
          'medium'  // 품질 medium으로 변경
        )
        return { requestId: gptResponse.request_id, provider: 'gpt-image' }
      }

      // AI 아바타: 3개의 이미지 요청 병렬 제출
      submitResults = await Promise.all([
        submitAiAvatarFirstFrame(),
        submitAiAvatarFirstFrame(),
        submitAiAvatarFirstFrame(),
      ])
    } else {
      // 기존 아바타: Seedream 4.5 또는 Kie.ai 사용
      const imageUrls: string[] = [finalAvatarImageUrl!]
      if (productImageUrl) {
        imageUrls.push(productImageUrl)
      }

      const submitFirstFrame = async (): Promise<SubmitResult> => {
        try {
          // fal.ai Seedream 4.5 먼저 시도
          const falResponse = await submitSeedreamFirstFrameToQueue(
            imageUrls,
            firstFramePrompt,
            '2:3' as SeedreamAspectRatio
          )
          return { requestId: falResponse.request_id, provider: 'fal' }
        } catch (falError) {
          console.warn('fal.ai Seedream 실패, Kie.ai로 폴백:', falError)
          // Kie.ai 폴백
          const kieResponse = await submitFirstFrameToKieQueue(imageUrls, firstFramePrompt, '2:3')
          return { requestId: kieResponse.request_id, provider: 'kie' }
        }
      }

      // 기존 아바타: 2개의 이미지 요청 병렬 제출
      submitResults = await Promise.all([
        submitFirstFrame(),
        submitFirstFrame(),
      ])
    }

    // 이미지 생성 완료까지 병렬로 폴링 (최대 2분)
    const pollForImage = async (result: SubmitResult): Promise<string | null> => {
      const maxAttempts = 40
      let attempts = 0

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000))

        try {
          if (result.provider === 'gpt-image') {
            // kie.ai GPT-Image 1.5 상태 조회
            const status = await getKieGptImageStatus(result.requestId)
            if (status.status === 'COMPLETED') {
              const response = await getKieGptImageResponse(result.requestId)
              return response.images[0]?.url || null
            }
          } else if (result.provider === 'fal') {
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

    // 모든 이미지를 병렬로 폴링
    const polledUrls = await Promise.all(
      submitResults.map(result => pollForImage(result))
    )

    // 유효한 이미지 URL만 필터링
    const rawFirstFrameUrls = polledUrls.filter((url): url is string => url !== null)

    // R2에 원본/압축본 업로드 (병렬 처리)
    const timestamp = Date.now()
    const uploadToR2 = async (url: string, index: number): Promise<{ original: string; compressed: string } | null> => {
      try {
        const result = await uploadExternalImageToR2(
          url,
          'video-ads/first-frame',
          `${user.id}_${timestamp}_${index}`
        )
        console.log(`첫 프레임 이미지 ${index + 1} R2 업로드 완료:`, result.compressedUrl)
        return { original: result.originalUrl, compressed: result.compressedUrl }
      } catch (uploadError) {
        console.error(`첫 프레임 이미지 ${index + 1} R2 업로드 실패:`, uploadError)
        // 업로드 실패 시 원본 URL 사용
        return { original: url, compressed: url }
      }
    }

    const uploadResults = await Promise.all(
      rawFirstFrameUrls.map((url, index) => uploadToR2(url, index))
    )

    // 압축본 URL 배열 (조회용)
    const firstFrameUrls = uploadResults
      .filter((r): r is { original: string; compressed: string } => r !== null)
      .map(r => r.compressed)

    // 원본 URL 배열 (영상 생성용)
    const firstFrameOriginalUrls = uploadResults
      .filter((r): r is { original: string; compressed: string } => r !== null)
      .map(r => r.original)

    return NextResponse.json({
      scripts: scriptsResult.scripts,
      productSummary: scriptsResult.productSummary,
      firstFrameUrl: firstFrameUrls[0] || null,  // 하위 호환성 (압축본)
      firstFrameUrls,  // 압축본 URL 배열 (조회용)
      firstFrameOriginalUrls,  // 원본 URL 배열 (영상 생성용)
      locationDescription,
      firstFramePrompt,
      isAiGeneratedAvatar,  // AI 아바타 사용 여부
    })
  } catch (error) {
    console.error('대본 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scripts' },
      { status: 500 }
    )
  }
}
