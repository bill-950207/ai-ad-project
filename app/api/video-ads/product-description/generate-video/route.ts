/**
 * 제품 설명 영상 - 토킹 비디오 생성 API
 *
 * POST /api/video-ads/product-description/generate-video
 * - WaveSpeed InfiniteTalk API로 토킹 영상 생성
 * - video_ads 레코드 생성 및 큐 제출
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { submitInfiniteTalkToQueue } from '@/lib/wavespeed/client'
import { PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST } from '@/lib/credits'
import { recordCreditUse } from '@/lib/credits/history'
import { uploadExternalImageToR2 } from '@/lib/image/compress'

/** 카메라 구도별 프롬프트 설명 */
const CAMERA_COMPOSITION_PROMPTS: Record<string, string> = {
  'selfie-high': 'looking up at camera from below, high angle shot from above',
  'selfie-front': 'eye level straight-on angle, front facing camera',
  'selfie-side': 'three-quarter angle, slightly from the side',
  'tripod': 'camera mounted on tripod, stable professional framing, presenting to fixed camera',
  'closeup': 'close-up framing on face and upper body, intimate speaking distance',
  'fullbody': 'full body visible in frame, wider shot showing complete posture',
  'ugc-closeup': 'UGC style medium close-up, chest to head framing, casual influencer vlog aesthetic',
  'ugc-selfie': 'POV selfie camera perspective, looking directly at camera, intimate selfie angle at eye level, NO phone visible, natural pose presenting product',
}

/** 대본 스타일별 표정/제스처 프롬프트 */
const SCRIPT_STYLE_PROMPTS: Record<string, string> = {
  'formal': 'professional demeanor, confident posture, measured hand gestures, trustworthy expression, composed speaking style',
  'casual': 'relaxed friendly expression, natural conversational gestures, approachable demeanor, casual speaking manner',
  'energetic': 'enthusiastic expression, animated hand gestures, bright smile, excited speaking style, dynamic energy',
  'custom': 'natural expression, conversational gestures, engaging demeanor',
}

/** 비디오 타입별 모션 프롬프트 */
const VIDEO_TYPE_MOTION_PROMPTS: Record<string, string> = {
  'UGC': 'casual natural gestures, authentic reactions, mobile vlog style movement, engaging energy, relatable influencer vibe',
  'podcast': 'conversational gestures, thoughtful pauses, nodding, leaning in when making points, intimate storytelling movements, seated comfortably',
  'expert': 'professional presenting gestures, pointing to emphasize, confident posture, measured deliberate movements, educational hand motions, authoritative stance',
}

/**
 * 영상 생성 프롬프트 생성
 */
function generateVideoPrompt(params: {
  cameraComposition?: string
  scriptStyle?: string
  locationPrompt?: string
  productName?: string
  productDescription?: string
  videoType?: string
}): string {
  const parts: string[] = []

  // 기본 영상 설명
  parts.push('A person speaking naturally to camera')

  // 카메라 구도
  if (params.cameraComposition && CAMERA_COMPOSITION_PROMPTS[params.cameraComposition]) {
    parts.push(CAMERA_COMPOSITION_PROMPTS[params.cameraComposition])
  } else {
    parts.push('natural framing, maintaining eye contact with camera')
  }

  // 대본 스타일에 따른 표정/제스처
  const stylePrompt = SCRIPT_STYLE_PROMPTS[params.scriptStyle || 'custom'] || SCRIPT_STYLE_PROMPTS.custom
  parts.push(stylePrompt)

  // 비디오 타입별 모션 프롬프트
  const videoTypeMotion = VIDEO_TYPE_MOTION_PROMPTS[params.videoType || 'UGC'] || VIDEO_TYPE_MOTION_PROMPTS['UGC']
  parts.push(videoTypeMotion)

  // 제품 관련 동작
  if (params.productName) {
    parts.push(`presenting and discussing ${params.productName}, holding product naturally`)
  } else {
    parts.push('talking about a product in an engaging way')
  }

  // 기본 동작 설명
  parts.push('subtle head movements, natural facial expressions, lip-sync to speech')

  // 장소 분위기 (있을 경우)
  if (params.locationPrompt) {
    // 장소 프롬프트에서 핵심 단어 추출 (너무 길면 줄임)
    const shortLocation = params.locationPrompt.length > 50
      ? params.locationPrompt.substring(0, 50) + '...'
      : params.locationPrompt
    parts.push(`in ${shortLocation}`)
  }

  return parts.join('. ')
}

/**
 * POST /api/video-ads/product-description/generate-video
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
      firstFrameUrl,
      audioUrl,
      script,
      scriptStyle,
      voiceId,
      voiceName,
      locationPrompt,
      duration,
      resolution = '480p',
      // 영상 프롬프트 생성을 위한 추가 정보
      cameraComposition,
      productName,
      productDescription,
      // 비디오 타입 (UGC, podcast, expert)
      videoType = 'UGC',
      // 드래프트 ID (영상 생성 시작 시 삭제)
      draftId,
    } = body

    if (!avatarId) {
      return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 })
    }

    if (!firstFrameUrl) {
      return NextResponse.json({ error: 'First frame URL is required' }, { status: 400 })
    }

    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 })
    }

    // AI 생성 아바타인지 확인 (avatarId가 'ai-generated'일 경우 DB에는 null 저장)
    const isAiGeneratedAvatar = avatarId === 'ai-generated'
    const dbAvatarId = isAiGeneratedAvatar ? null : avatarId

    // 크레딧 확인
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
    })

    const creditCost = PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST[resolution as keyof typeof PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST] || PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST['480p']
    if (!profile || (profile.credits ?? 0) < creditCost) {
      return NextResponse.json({
        error: 'Insufficient credits',
        required: creditCost,
        available: profile?.credits ?? 0,
      }, { status: 402 })
    }

    // 첫 프레임 이미지 R2 업로드 (WebP 압축)
    let compressedFirstFrameUrl = firstFrameUrl
    try {
      const tempId = `pd-${user.id.slice(0, 8)}-${Date.now()}`
      const uploadResult = await uploadExternalImageToR2(
        firstFrameUrl,
        'video-ads/product-description',
        tempId,
        { quality: 85 }
      )
      compressedFirstFrameUrl = uploadResult.compressedUrl
      console.log('First frame compressed:', compressedFirstFrameUrl)
    } catch (compressError) {
      console.warn('First frame compression failed, using original:', compressError)
      // 압축 실패 시 원본 URL 사용
    }

    // video_ads 레코드 생성
    const videoAd = await prisma.video_ads.create({
      data: {
        user_id: user.id,
        product_id: productId || null,
        avatar_id: dbAvatarId,  // AI 생성 아바타일 경우 null
        category: 'productDescription',
        status: 'IN_QUEUE',
        duration: duration || 30,
        resolution: resolution,
        aspect_ratio: '9:16',
        location_prompt: locationPrompt || null,
        camera_composition: cameraComposition || null,
        script: script || null,  // 대본 저장
        script_style: scriptStyle || null,
        scripts_json: JSON.stringify([{ style: scriptStyle, content: script }]),
        voice_id: voiceId,
        voice_name: voiceName,
        audio_url: audioUrl,
        first_scene_image_url: compressedFirstFrameUrl,
      },
    })

    // 영상 생성 프롬프트 (입력 정보 기반으로 동적 생성)
    const videoPrompt = generateVideoPrompt({
      cameraComposition,
      scriptStyle,
      locationPrompt,
      productName,
      productDescription,
      videoType,
    })
    console.log('Generated video prompt:', videoPrompt)

    // WaveSpeed InfiniteTalk로 영상 생성
    console.log('WaveSpeed InfiniteTalk 시도 중...')
    const queueResponse = await submitInfiniteTalkToQueue(
      firstFrameUrl,
      audioUrl,
      videoPrompt,
      resolution
    )
    const requestId = queueResponse.request_id
    const provider = 'wavespeed' as const
    console.log('WaveSpeed InfiniteTalk 성공:', requestId)

    // 크레딧 차감 및 요청 ID 저장 (트랜잭션으로 원자적 처리 + 히스토리 기록)
    // provider 정보를 kie_request_id 필드에 prefix로 저장 (wavespeed: 또는 kie:)
    try {
      await prisma.$transaction(async (tx) => {
        const currentProfile = await tx.profiles.findUnique({
          where: { id: user.id },
          select: { credits: true },
        })

        if (!currentProfile || (currentProfile.credits ?? 0) < creditCost) {
          throw new Error('INSUFFICIENT_CREDITS')
        }

        const balanceAfter = (currentProfile.credits ?? 0) - creditCost

        await tx.video_ads.update({
          where: { id: videoAd.id },
          data: {
            kie_request_id: `${provider}:${requestId}`,
            status: 'IN_PROGRESS',
          },
        })

        await tx.profiles.update({
          where: { id: user.id },
          data: { credits: { decrement: creditCost } },
        })

        // 크레딧 히스토리 기록
        await recordCreditUse({
          userId: user.id,
          featureType: 'VIDEO_PRODUCT_DESC',
          amount: creditCost,
          balanceAfter,
          relatedEntityId: videoAd.id,
          description: `제품설명 영상 생성 (${resolution})`,
        }, tx)
      }, { timeout: 10000 })
    } catch (creditError) {
      // 크레딧 부족 시 생성된 레코드 실패 처리
      if (creditError instanceof Error && creditError.message === 'INSUFFICIENT_CREDITS') {
        await prisma.video_ads.update({
          where: { id: videoAd.id },
          data: { status: 'FAILED', error_message: 'Insufficient credits' },
        })
        return NextResponse.json(
          { error: 'Insufficient credits (concurrent request detected)' },
          { status: 402 }
        )
      }
      throw creditError
    }

    // 드래프트 삭제 (서버 측에서 확실하게 처리)
    if (draftId) {
      try {
        await prisma.video_ads.deleteMany({
          where: {
            id: draftId,
            user_id: user.id,
            category: 'productDescription',
            status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_IMAGES', 'GENERATING_AUDIO'] },
          },
        })
      } catch (e) {
        console.error('드래프트 삭제 오류 (무시됨):', e)
      }
    }

    return NextResponse.json({
      videoAdId: videoAd.id,
      requestId: requestId,
      provider,
    })
  } catch (error) {
    console.error('영상 생성 요청 오류:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
