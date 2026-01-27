/**
 * 제품 설명 영상 - 대본 및 첫 프레임 생성 API
 *
 * POST /api/video-ads/product-description/generate-scripts
 * - 제품 정보를 바탕으로 3가지 스타일의 대본 생성
 * - 첫 프레임 이미지 프롬프트 생성 및 이미지 생성
 * - AI 아바타/기존 아바타 모두 Seedream 4.5 Edit로 이미지 생성
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
  submitZImageTurboToQueue,
  getZImageTurboQueueStatus,
  getZImageTurboQueueResponse,
  type ZImageAspectRatio,
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
      modelPose,  // 모델 포즈 (holding-product, showing-product, using-product, talking-only)
      // 의상 설정
      outfitMode,  // 의상 모드 (preset, custom)
      outfitPreset,  // 의상 프리셋 (casual_everyday, formal_elegant, etc.)
      outfitCustom,  // 의상 직접 입력 텍스트
      language = 'ko',  // 대본 생성 언어 (기본값: 한국어)
      // AI 아바타 옵션 (avatarId가 'ai-generated'일 때)
      aiAvatarOptions,
      // 비디오 타입 (UGC, podcast, expert)
      videoType = 'UGC',
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
    let avatarDescription: string | undefined  // AI 의상 추천용 아바타 설명
    let avatarBodyType: string | undefined  // 아바타 체형 정보 (일관성 유지용)
    let avatarGender: 'male' | 'female' | undefined  // 아바타 성별 (체형 설명 시 성별에 맞는 표현 사용)

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

      // 아바타 설명 구성 (이름만 - 외모 묘사 제거)
      if (avatar.name) {
        avatarDescription = avatar.name
      }

      // 아바타 체형 및 성별 정보 추출 (options에서)
      if (avatar.options) {
        try {
          const options = typeof avatar.options === 'string'
            ? JSON.parse(avatar.options)
            : avatar.options
          if (options.bodyType) {
            avatarBodyType = options.bodyType
          }
          if (options.gender === 'male' || options.gender === 'female') {
            avatarGender = options.gender
          }
        } catch {
          // options 파싱 실패 시 무시
        }
      }
    } else {
      // AI 아바타 설명 구성
      if (aiAvatarOptions) {
        const parts = []
        if (aiAvatarOptions.targetGender) parts.push(aiAvatarOptions.targetGender)
        if (aiAvatarOptions.targetAge) parts.push(aiAvatarOptions.targetAge)
        if (aiAvatarOptions.ethnicity) parts.push(aiAvatarOptions.ethnicity)
        if (aiAvatarOptions.style) parts.push(aiAvatarOptions.style + ' style')
        if (aiAvatarOptions.bodyType && aiAvatarOptions.bodyType !== 'any') parts.push(aiAvatarOptions.bodyType + ' body type')
        avatarDescription = parts.join(', ')
      }
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

    // 1. 대본 생성 (Gemini) - AI 의상 추천도 함께 요청 가능
    const scriptsResult = await generateProductScripts({
      productInfo: productInfo.trim(),
      durationSeconds: durationSeconds || 30,
      language,  // 대본 생성 언어
      videoType,  // 비디오 타입 (UGC, podcast, expert)
      // AI 의상 추천 요청 시 추가 파라미터
      requestOutfitRecommendation: outfitMode === 'ai_recommend',
      avatarDescription: outfitMode === 'ai_recommend' ? avatarDescription : undefined,
      productImageUrl: outfitMode === 'ai_recommend' ? productImageUrl : undefined,
    })

    // 2. 첫 프레임 프롬프트 생성 (Gemini) - AI 아바타와 기존 아바타 분기
    let firstFramePrompt: string
    let locationDescription: string

    // AI 추천 의상 사용 시 outfitCustom에 AI가 추천한 의상 설명 사용
    const effectiveOutfitCustom = outfitMode === 'ai_recommend' && scriptsResult.recommendedOutfit
      ? scriptsResult.recommendedOutfit.description
      : outfitMode === 'custom' ? outfitCustom : undefined

    // "말로만 설명" 포즈일 때는 제품 이미지 제외 (아바타만 등장)
    const isTalkingOnlyPose = modelPose === 'talking-only'
    const effectiveProductImageUrl = isTalkingOnlyPose ? undefined : productImageUrl

    if (isAiGeneratedAvatar) {
      // AI 아바타: generateAiAvatarPrompt 사용 (아바타 묘사 포함 프롬프트 생성)
      const aiAvatarResult = await generateAiAvatarPrompt({
        productInfo: productInfo.trim(),
        productImageUrl: effectiveProductImageUrl,
        locationPrompt: locationPrompt?.trim() || undefined,
        cameraComposition: cameraComposition as CameraCompositionType | undefined,
        modelPose,
        outfitPreset: outfitMode === 'preset' ? outfitPreset : undefined,
        outfitCustom: effectiveOutfitCustom,
        targetGender: aiAvatarOptions?.targetGender,
        targetAge: aiAvatarOptions?.targetAge,
        style: aiAvatarOptions?.style,
        ethnicity: aiAvatarOptions?.ethnicity,
        bodyType: aiAvatarOptions?.bodyType,  // 체형 옵션
        videoType,  // 비디오 타입 (UGC, podcast, expert)
        language,  // 대본 언어 (인종 자동 설정용)
      })
      firstFramePrompt = aiAvatarResult.prompt
      locationDescription = aiAvatarResult.locationDescription
      console.log('AI 아바타 프롬프트 생성:', { prompt: firstFramePrompt, avatar: aiAvatarResult.avatarDescription, videoType, isTalkingOnlyPose })
    } else {
      // 기존 아바타: generateFirstFramePrompt 사용
      const firstFrameResult = await generateFirstFramePrompt({
        productInfo: productInfo.trim(),
        avatarImageUrl: finalAvatarImageUrl!,
        locationPrompt: locationPrompt?.trim() || undefined,
        productImageUrl: effectiveProductImageUrl,
        cameraComposition,
        modelPose,
        outfitPreset: outfitMode === 'preset' ? outfitPreset : undefined,
        outfitCustom: effectiveOutfitCustom,
        videoType,  // 비디오 타입 (UGC, podcast, expert)
        bodyType: avatarBodyType,  // 아바타 체형 정보 (일관성 유지)
        avatarGender,  // 아바타 성별 (체형 설명 시 성별에 맞는 표현 사용)
      })
      firstFramePrompt = firstFrameResult.prompt
      locationDescription = firstFrameResult.locationDescription
    }

    // 3. 첫 프레임 이미지 생성 (2개)
    type SubmitResult = { requestId: string; provider: 'fal' | 'kie' | 'kie-zimage' }
    let submitResults: SubmitResult[]

    if (isAiGeneratedAvatar) {
      // AI 아바타: 제품 이미지가 있으면 Seedream 4.5 Edit, 없으면 z-image-turbo 사용
      const aiAvatarImageUrls: string[] = effectiveProductImageUrl ? [effectiveProductImageUrl] : []
      const useTextToImage = aiAvatarImageUrls.length === 0

      const submitAiAvatarFirstFrame = async (): Promise<SubmitResult> => {
        if (useTextToImage) {
          // 이미지 입력이 없으면 z-image-turbo (텍스트-to-이미지) 사용
          console.log('AI 아바타 + 이미지 없음: z-image-turbo 모델 사용')
          const zImageResponse = await submitZImageTurboToQueue(
            firstFramePrompt,
            '3:4' as ZImageAspectRatio  // 2:3에 가장 가까운 비율
          )
          return { requestId: zImageResponse.request_id, provider: 'kie-zimage' }
        }

        try {
          // 이미지 입력이 있으면 fal.ai Seedream 4.5 먼저 시도
          const falResponse = await submitSeedreamFirstFrameToQueue(
            aiAvatarImageUrls,
            firstFramePrompt,
            '2:3' as SeedreamAspectRatio
          )
          return { requestId: falResponse.request_id, provider: 'fal' }
        } catch (falError) {
          console.warn('fal.ai Seedream 실패, Kie.ai로 폴백:', falError)
          // Kie.ai Seedream 4.5 Edit 폴백
          const kieResponse = await submitFirstFrameToKieQueue(aiAvatarImageUrls, firstFramePrompt, '2:3')
          return { requestId: kieResponse.request_id, provider: 'kie' }
        }
      }

      // AI 아바타: 2개의 이미지 요청 병렬 제출
      submitResults = await Promise.all([
        submitAiAvatarFirstFrame(),
        submitAiAvatarFirstFrame(),
      ])
    } else {
      // 기존 아바타: Seedream 4.5 또는 Kie.ai 사용 (talking-only일 때는 제품 이미지 제외)
      const imageUrls: string[] = [finalAvatarImageUrl!]
      if (effectiveProductImageUrl) {
        imageUrls.push(effectiveProductImageUrl)
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
          if (result.provider === 'fal') {
            const status = await getSeedreamEditQueueStatus(result.requestId)
            if (status.status === 'COMPLETED') {
              const response = await getSeedreamEditQueueResponse(result.requestId)
              return response.images[0]?.url || null
            }
          } else if (result.provider === 'kie-zimage') {
            // z-image-turbo (텍스트-to-이미지)
            const status = await getZImageTurboQueueStatus(result.requestId)
            if (status.status === 'COMPLETED') {
              const response = await getZImageTurboQueueResponse(result.requestId)
              return response.images[0]?.url || null
            }
          } else {
            // kie Seedream 4.5 Edit
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
      recommendedOutfit: scriptsResult.recommendedOutfit,  // AI 추천 의상 (요청 시에만)
    })
  } catch (error) {
    console.error('대본 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scripts' },
      { status: 500 }
    )
  }
}
