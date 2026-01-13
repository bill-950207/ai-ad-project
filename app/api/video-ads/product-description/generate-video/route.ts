/**
 * 제품 설명 영상 - 토킹 비디오 생성 API
 *
 * POST /api/video-ads/product-description/generate-video
 * - Infinitalk (from-audio) API로 토킹 영상 생성
 * - video_ads 레코드 생성 및 큐 제출
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { submitTalkingVideoToQueue } from '@/lib/kie/client'

/** 제품 설명 영상 크레딧 비용 */
const PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST = 10

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
        avatar_id: avatarId,
        category: 'productDescription',
        status: 'IN_QUEUE',
        duration: duration || 30,
        resolution: '480p',
        aspect_ratio: '9:16',
        location_prompt: locationPrompt || null,
        script_style: scriptStyle || null,
        scripts_json: JSON.stringify([{ style: scriptStyle, content: script }]),
        voice_id: voiceId,
        voice_name: voiceName,
        audio_url: audioUrl,
        first_scene_image_url: firstFrameUrl,
      },
    })

    // Kling V1 Avatar API에 립싱크 영상 생성 요청
    // 프롬프트: 말하는 사람의 자연스러운 모습
    const videoPrompt = 'A person speaking naturally to camera with subtle head movements, facial expressions, and gestures. Natural conversation style, maintaining eye contact. The person is talking about a product in an engaging way.'

    const queueResponse = await submitTalkingVideoToQueue(
      firstFrameUrl,
      audioUrl,
      videoPrompt
    )

    // 요청 ID 저장 및 크레딧 차감
    await prisma.$transaction([
      prisma.video_ads.update({
        where: { id: videoAd.id },
        data: {
          kie_request_id: queueResponse.request_id,
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
      requestId: queueResponse.request_id,
    })
  } catch (error) {
    console.error('영상 생성 요청 오류:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
