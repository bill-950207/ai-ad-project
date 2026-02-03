/**
 * 제품 설명 영상 - 대본 및 첫 프레임 생성 API
 *
 * POST /api/video-ads/product-description/generate-scripts
 * - 제품 정보를 바탕으로 3가지 스타일의 대본 생성
 * - 첫 프레임 이미지 프롬프트 생성 및 이미지 생성 요청
 * - 대본은 즉시 반환, 이미지는 request ID 반환 (비동기)
 * - 이미지 상태는 /image-status 엔드포인트로 폴링
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
import { getGenAI } from '@/lib/gemini'
import {
  submitSeedreamFirstFrameToQueue,
  type SeedreamAspectRatio,
} from '@/lib/fal/client'
import {
  submitFirstFrameToQueue as submitFirstFrameToKieQueue,
} from '@/lib/kie/client'

/** 지원되는 민족성 타입 */
type SupportedEthnicity = 'korean' | 'asian' | 'western' | 'japanese' | 'chinese'

/**
 * 언어 기반 민족성 결정
 * ethnicity가 'any' 또는 undefined인 경우 대본 언어에 맞는 민족성 반환
 */
function resolveEthnicityByLanguage(
  ethnicity: string | undefined,
  language: string
): SupportedEthnicity {
  // 이미 명시적 민족성이면 그대로 반환 (유효한 값인 경우)
  if (ethnicity && ethnicity !== 'any') {
    const validEthnicities: SupportedEthnicity[] = ['korean', 'asian', 'western', 'japanese', 'chinese']
    if (validEthnicities.includes(ethnicity as SupportedEthnicity)) {
      return ethnicity as SupportedEthnicity
    }
  }

  // 언어 기반 민족성 매핑
  // AiAvatarOptions 타입에 정의된 값만 사용: 'korean' | 'asian' | 'western' | 'japanese' | 'chinese' | 'any'
  const languageToEthnicityMap: Record<string, SupportedEthnicity> = {
    'ko': 'korean',
    'ja': 'japanese',
    'zh': 'chinese',
    'en': 'western',
    'es': 'western',  // 스페인어 → 서양인 (타입 제약)
    'pt': 'western',  // 포르투갈어 → 서양인 (타입 제약)
    'fr': 'western',
    'de': 'western',
  }

  const resolvedEthnicity = languageToEthnicityMap[language] || 'western'
  console.log(`[민족성 결정] 언어 기반 결정: ${language} → ${resolvedEthnicity}`)
  return resolvedEthnicity
}

/**
 * 제품 컨텍스트 기반 성별 결정
 * targetGender가 'any'인 경우 Gemini를 통해 제품에 적합한 성별 결정
 */
async function resolveTargetGender(
  targetGender: string | undefined,
  productInfo: string
): Promise<'male' | 'female'> {
  // 이미 명시적 성별이면 그대로 반환
  if (targetGender === 'male') return 'male'
  if (targetGender === 'female') return 'female'

  // 'any' 또는 undefined인 경우 Gemini에게 제품 컨텍스트 기반 결정 요청
  try {
    const prompt = `You are a marketing expert. Based on the product information below, determine which gender would be most appropriate as a product presenter/model in an advertisement video.

=== PRODUCT INFORMATION ===
${productInfo}

=== DECISION CRITERIA ===
Consider:
1. Product's primary target audience (e.g., cosmetics → typically female, power tools → typically male)
2. Product category conventions in advertising
3. Brand positioning and marketing norms
4. If the product is gender-neutral, consider which presenter gender would be more effective for engagement

=== RESPONSE FORMAT ===
Respond with ONLY a JSON object:
{"gender": "male" or "female", "reason": "brief explanation"}

Note: You MUST choose either "male" or "female". Do not respond with "any" or "neutral".`

    const response = await getGenAI().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    })

    const responseText = response.text || ''
    const result = JSON.parse(responseText)

    if (result.gender === 'male' || result.gender === 'female') {
      console.log(`[성별 결정] 제품 기반 결정: ${result.gender} (이유: ${result.reason})`)
      return result.gender
    }
  } catch (error) {
    console.error('[성별 결정] Gemini 호출 실패, 기본값 사용:', error)
  }

  // 기본값: female (광고 업계 관행)
  console.log('[성별 결정] 기본값 사용: female')
  return 'female'
}

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
      // 표정/조명 옵션 (새로 추가)
      expressionPrompt,  // 표정 프롬프트 (영문)
      lightingPrompt,    // 조명 프롬프트 (영문)
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
        // 'any' 성별인 경우 제품 기반으로 성별 사전 결정
        const resolvedGender = await resolveTargetGender(
          aiAvatarOptions.targetGender,
          productInfo.trim()
        )
        // aiAvatarOptions에 결정된 성별 반영 (이후 아바타 프롬프트 생성에서도 사용)
        aiAvatarOptions.targetGender = resolvedGender

        // 'any' 민족성인 경우 언어 기반으로 민족성 결정
        const resolvedEthnicity = resolveEthnicityByLanguage(
          aiAvatarOptions.ethnicity,
          language
        )
        // aiAvatarOptions에 결정된 민족성 반영 (이후 아바타 프롬프트 생성에서도 사용)
        aiAvatarOptions.ethnicity = resolvedEthnicity

        const parts = []
        parts.push(resolvedGender)  // 결정된 성별 사용 (항상 male 또는 female)
        if (aiAvatarOptions.targetAge) parts.push(aiAvatarOptions.targetAge)
        parts.push(resolvedEthnicity)  // 결정된 민족성 사용 (항상 특정 민족)
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
        // 상세 옵션 추가
        height: aiAvatarOptions?.height,
        hairStyle: aiAvatarOptions?.hairStyle,
        hairColor: aiAvatarOptions?.hairColor,
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
        expressionPrompt,  // 표정 프롬프트
        lightingPrompt,    // 조명 프롬프트
      })
      firstFramePrompt = firstFrameResult.prompt
      locationDescription = firstFrameResult.locationDescription
    }

    // 3. 첫 프레임 이미지 생성 (2개)
    type SubmitResult = { requestId: string; provider: 'fal' | 'kie' | 'kie-zimage' }
    let submitResults: SubmitResult[]

    if (isAiGeneratedAvatar) {
      // AI 아바타: 이미지 생성 없이 텍스트 설명만 사용 (Seedream에서 직접 생성)
      console.log('AI 아바타: 텍스트 설명만 사용 (이미지 생성 없음)', aiAvatarOptions)

      // 입력 이미지 배열 구성 (제품 이미지만)
      const aiAvatarImageUrls: string[] = []
      if (effectiveProductImageUrl) {
        aiAvatarImageUrls.push(effectiveProductImageUrl)  // figure 1: 제품
      }

      const submitAiAvatarFirstFrame = async (): Promise<SubmitResult> => {
        try {
          // 제품 이미지만 Seedream에 전달, 아바타는 텍스트 프롬프트로 생성
          console.log('AI 아바타 첫 프레임 생성 (Seedream, 텍스트 기반):', aiAvatarImageUrls.length, '개 이미지')
          const falResponse = await submitSeedreamFirstFrameToQueue(
            aiAvatarImageUrls,
            firstFramePrompt,
            '2:3' as SeedreamAspectRatio
          )
          return { requestId: falResponse.request_id, provider: 'fal' }
        } catch (falError) {
          console.warn('fal.ai Seedream 실패, Kie.ai로 폴백:', falError)
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

    // 이미지 요청 정보를 배열로 변환 (프론트엔드에서 폴링용)
    const imageRequests = submitResults.map((result, index) => ({
      requestId: result.requestId,
      provider: result.provider,
      index,
    }))

    console.log('[generate-scripts] 대본 + 이미지 요청 완료:', {
      scriptsCount: scriptsResult.scripts.length,
      imageRequestsCount: imageRequests.length,
    })

    // 대본과 이미지 요청 ID를 즉시 반환 (이미지 완료 대기 없음)
    return NextResponse.json({
      scripts: scriptsResult.scripts,
      productSummary: scriptsResult.productSummary,
      // 이미지는 아직 생성 중이므로 URL 대신 요청 정보 반환
      imageRequests,  // 프론트엔드에서 /image-status로 폴링
      // 하위 호환성을 위한 필드 (null로 설정)
      firstFrameUrl: null,
      firstFrameUrls: [],
      firstFrameOriginalUrls: [],
      // 기타 정보
      locationDescription,
      firstFramePrompt,
      isAiGeneratedAvatar,
      recommendedOutfit: scriptsResult.recommendedOutfit,
    })
  } catch (error) {
    console.error('대본 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scripts' },
      { status: 500 }
    )
  }
}
