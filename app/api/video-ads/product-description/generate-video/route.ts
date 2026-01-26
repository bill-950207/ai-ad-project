/**
 * 제품 설명 영상 - 토킹 비디오 생성 API
 *
 * POST /api/video-ads/product-description/generate-video
 * - WaveSpeed InfiniteTalk API (우선) 또는 Kie.ai Kling Avatar API (fallback)으로 토킹 영상 생성
 * - video_ads 레코드 생성 및 큐 제출
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { submitTalkingVideoToQueue } from '@/lib/kie/client'
import { submitInfiniteTalkToQueue } from '@/lib/wavespeed/client'

/** 제품 설명 영상 크레딧 비용 */
const PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST = 10

/** 카메라 구도별 프롬프트 설명 */
const CAMERA_COMPOSITION_PROMPTS: Record<string, string> = {
  'selfie-high': 'holding phone/camera high, looking up at camera from below, selfie angle from above',
  'selfie-front': 'holding phone at eye level, straight-on selfie angle, front facing camera',
  'selfie-side': 'holding phone slightly to the side, three-quarter selfie angle',
  'tripod': 'camera mounted on tripod, stable professional framing, presenting to fixed camera',
  'closeup': 'close-up framing on face and upper body, intimate speaking distance',
  'fullbody': 'full body visible in frame, wider shot showing complete posture',
  'ugc-closeup': 'UGC style medium close-up, chest to head framing, casual influencer vlog aesthetic',
  'ugc-selfie': 'selfie camera perspective, phone-holding hand NOT visible (cropped below frame edge), looking directly at camera, intimate selfie angle at eye level, if holding product use ONE hand only (free hand not holding phone)',
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

  // 제품 관련 동작 (UGC 셀카일 때는 한 손으로만 제품 들기 명시)
  const isUgcSelfie = params.cameraComposition === 'ugc-selfie'
  if (params.productName) {
    if (isUgcSelfie) {
      parts.push(`holding and presenting ${params.productName} with one hand only (free hand), phone hand stays invisible off-frame`)
    } else {
      parts.push(`presenting and discussing ${params.productName}`)
    }
  } else {
    if (isUgcSelfie) {
      parts.push('talking about a product while holding it with one hand (free hand), phone hand invisible')
    } else {
      parts.push('talking about a product in an engaging way')
    }
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

    if (!profile || (profile.credits ?? 0) < PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
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
        first_scene_image_url: firstFrameUrl,
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

    let requestId: string
    let provider: 'wavespeed' | 'kie' = 'wavespeed'

    // WaveSpeed InfiniteTalk 우선 시도
    try {
      console.log('WaveSpeed InfiniteTalk 시도 중...')
      const queueResponse = await submitInfiniteTalkToQueue(
        firstFrameUrl,
        audioUrl,
        videoPrompt,
        resolution
      )
      requestId = queueResponse.request_id
      provider = 'wavespeed'
      console.log('WaveSpeed InfiniteTalk 성공:', requestId)
    } catch (wavespeedError) {
      // WaveSpeed 실패 시 Kie.ai fallback
      console.warn('WaveSpeed InfiniteTalk 실패, Kie.ai로 fallback:', wavespeedError)

      const queueResponse = await submitTalkingVideoToQueue(
        firstFrameUrl,
        audioUrl,
        videoPrompt
      )
      requestId = queueResponse.request_id
      provider = 'kie'
      console.log('Kie.ai fallback 성공:', requestId)
    }

    // 요청 ID 저장 및 크레딧 차감
    // provider 정보를 kie_request_id 필드에 prefix로 저장 (wavespeed: 또는 kie:)
    await prisma.$transaction([
      prisma.video_ads.update({
        where: { id: videoAd.id },
        data: {
          kie_request_id: `${provider}:${requestId}`,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.profiles.update({
        where: { id: user.id },
        data: {
          credits: { decrement: PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST },
        },
      }),
    ])

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
