/**
 * 아바타 모션 프레임 이미지 생성 API
 *
 * POST: 첫 프레임 이미지 생성
 * - 항상 Seedream 4.5 High 사용
 * - Gemini로 프롬프트 개선 후 생성
 * - 선택된 아바타 이미지를 첨부하여 일관성 유지
 * - kling-2.6 image-to-video 모델에서 이 이미지를 첫 프레임으로 사용
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/gemini/client'
import {
  submitSeedreamEditToQueue,
  getSeedreamEditQueueStatus,
  getSeedreamEditQueueResponse,
  type SeedreamAspectRatio,
} from '@/lib/fal/client'
import {
  buildFrameImprovementPrompt,
  AVATAR_MOTION_NEGATIVE_PROMPT,
} from '@/lib/prompts/avatar-motion'
import { uploadExternalImageToR2 } from '@/lib/image/compress'

interface GenerateFramesRequest {
  avatarImageUrl: string           // 선택된 아바타 이미지 URL (필수)
  avatarDescription?: string       // 아바타 설명 (AI 아바타의 경우)
  productImageUrl?: string         // 제품 이미지 URL
  productInfo?: string             // 제품 정보
  startFramePrompt: string         // 첫 프레임 프롬프트 (한국어)
  aspectRatio?: '9:16' | '16:9' | '1:1'
  imageSize?: '1024x576' | '576x1024' | '768x768'  // 이미지 크기 (영상 크기 결정)
  locationPrompt?: string          // 배경/장소 프롬프트 (선택사항)
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

    const body: GenerateFramesRequest = await request.json()
    const {
      avatarImageUrl,
      avatarDescription = '',
      productImageUrl,
      productInfo = '',
      startFramePrompt,
      aspectRatio = '9:16',
      locationPrompt = '',
    } = body

    if (!avatarImageUrl) {
      return NextResponse.json(
        { error: 'Avatar image URL is required' },
        { status: 400 }
      )
    }

    if (!startFramePrompt) {
      return NextResponse.json(
        { error: 'Start frame prompt is required' },
        { status: 400 }
      )
    }

    // 입력 이미지 URL 수집 (아바타 이미지 첨부로 일관성 유지)
    const baseImageUrls: string[] = [avatarImageUrl]
    if (productImageUrl) {
      baseImageUrls.push(productImageUrl)
    }

    // Seedream aspect ratio 매핑
    const falAspectRatio: SeedreamAspectRatio =
      aspectRatio === '1:1' ? '1:1' :
      aspectRatio === '16:9' ? '16:9' : '9:16'

    // 1. Gemini로 첫 프레임 프롬프트 개선
    const startFrameGeminiPrompt = buildFrameImprovementPrompt(
      startFramePrompt,
      avatarDescription,
      productInfo,
      'start',
      aspectRatio,
      locationPrompt
    )

    const startFrameGeminiResponse = await generateText(startFrameGeminiPrompt)
    const startFrameImproved = parsePromptResponse(startFrameGeminiResponse, startFramePrompt)

    // 2. 첫 프레임 생성 및 완료 대기
    console.log('첫 프레임 생성 시작...')
    const startResponse = await submitSeedreamEditToQueue({
      prompt: startFrameImproved.prompt,
      image_urls: baseImageUrls,
      aspect_ratio: falAspectRatio,
      quality: 'high',
    })

    // 첫 프레임 완료 대기 (최대 3분)
    const startFrameResult = await waitForSeedreamCompletion(
      startResponse.request_id,
      180000 // 3분 타임아웃
    )

    if (!startFrameResult.success || !startFrameResult.imageUrl) {
      throw new Error('Failed to generate first frame')
    }

    console.log('첫 프레임 생성 완료 (AI 서비스):', startFrameResult.imageUrl)

    // R2에 원본/압축본 업로드
    let imageUrl = startFrameResult.imageUrl
    let imageUrlOriginal = startFrameResult.imageUrl

    try {
      const timestamp = Date.now()
      const uploadResult = await uploadExternalImageToR2(
        startFrameResult.imageUrl,
        'avatar-motion/frames',
        `${user.id}_${timestamp}`
      )
      imageUrl = uploadResult.compressedUrl
      imageUrlOriginal = uploadResult.originalUrl
      console.log('첫 프레임 R2 업로드 완료:', imageUrl)
    } catch (uploadError) {
      console.error('첫 프레임 R2 업로드 실패, AI 서비스 URL 사용:', uploadError)
      // 업로드 실패 시 원본 URL 그대로 사용
    }

    return NextResponse.json({
      success: true,
      startFrame: {
        requestId: `fal:${startResponse.request_id}`,
        provider: 'fal',
        improvedPrompt: startFrameImproved.prompt,
        imageUrl,  // 압축본 URL (조회용)
        imageUrlOriginal,  // 원본 URL (영상 생성용)
        status: 'completed',
      },
      // endFrame은 더 이상 필요 없음 - kling-2.6에서는 첫 프레임만 사용
    })
  } catch (error) {
    console.error('프레임 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate frame' },
      { status: 500 }
    )
  }
}

/**
 * Seedream 이미지 생성 완료 대기
 */
async function waitForSeedreamCompletion(
  requestId: string,
  timeoutMs: number = 180000
): Promise<{ success: boolean; imageUrl?: string }> {
  const startTime = Date.now()
  const pollInterval = 2000 // 2초 간격

  while (Date.now() - startTime < timeoutMs) {
    try {
      const status = await getSeedreamEditQueueStatus(requestId)

      if (status.status === 'COMPLETED') {
        const result = await getSeedreamEditQueueResponse(requestId)
        if (result.images && result.images.length > 0) {
          return { success: true, imageUrl: result.images[0].url }
        }
        return { success: false }
      }

      // 아직 진행 중이면 대기
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    } catch (error) {
      console.error('Seedream 상태 확인 오류:', error)
      // 일시적 오류는 무시하고 계속 폴링
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  console.error('Seedream 생성 타임아웃')
  return { success: false }
}

/**
 * Gemini 응답에서 프롬프트 파싱
 */
function parsePromptResponse(
  response: string,
  fallbackPrompt: string
): { prompt: string; negativePrompt: string } {
  try {
    // JSON 블록 추출
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      prompt: parsed.prompt || fallbackPrompt,
      negativePrompt: parsed.negativePrompt || AVATAR_MOTION_NEGATIVE_PROMPT,
    }
  } catch {
    console.error('Failed to parse prompt response:', response)
    // Fallback: 기본 영어 변환
    return {
      prompt: buildFallbackEnglishPrompt(fallbackPrompt),
      negativePrompt: AVATAR_MOTION_NEGATIVE_PROMPT,
    }
  }
}

/**
 * Fallback 영어 프롬프트 생성
 */
function buildFallbackEnglishPrompt(koreanPrompt: string): string {
  // 기본 프롬프트 템플릿에 한국어 설명 추가
  return `The same person from reference image 1. ${koreanPrompt}. Natural lighting, photorealistic, UGC style content, shot on 85mm lens at f/1.8, Hyperrealistic photograph, 8K RAW quality`
}
