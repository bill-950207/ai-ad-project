/**
 * 영상 광고 임시 저장 API
 *
 * POST /api/video-ads/draft - 마법사 진행 상태 저장 (생성 또는 업데이트)
 * GET /api/video-ads/draft - 현재 카테고리의 임시 저장된 초안 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { invalidateVideoAdsCache } from '@/lib/cache/user-data'

/**
 * POST /api/video-ads/draft
 *
 * 마법사 진행 상태를 저장합니다.
 * - 기존 초안이 있으면 업데이트
 * - 없으면 새로 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,  // 기존 초안 ID (없으면 새로 생성)
      category,
      wizardStep,
      status,  // 상태 업데이트 (DRAFT, GENERATING_IMAGES, GENERATING_AUDIO 등)
      // Step 1 데이터
      avatarId,
      avatarType,  // 'avatar' | 'preset' | 'ai-generated'
      outfitId,
      avatarImageUrl,
      productId,
      aiAvatarOptions,  // AI 아바타 옵션 (avatarId가 'ai-generated'일 때)
      // Step 2 데이터
      productInfo,
      locationPrompt,
      duration,
      videoBackground,
      cameraComposition,
      // Step 3 데이터
      scriptsJson,
      scriptStyle,
      script,
      firstSceneImageUrl,
      firstFrameUrls,  // 첫 프레임 이미지 URL 배열 (WebP 압축본, 표시용)
      firstFrameOriginalUrls,  // 첫 프레임 원본 이미지 URL 배열 (PNG, 영상 생성용)
      firstFramePrompt,
      // 이미지 폴링 데이터
      imageRequests,  // 이미지 생성 요청 정보 [{requestId, provider, index}, ...]
      // Step 4 데이터
      voiceId,
      voiceName,
      ttsTaskId,  // TTS 폴링용 taskId
      // 비디오 타입
      videoType,
    } = body

    // 허용된 상태값 (폴링 가능한 상태만 허용)
    // GENERATING_SCRIPTS는 Gemini API 동기식이므로 저장하지 않음
    // GENERATING_IMAGES, GENERATING_AUDIO는 폴링 가능
    const allowedStatuses = ['DRAFT', 'GENERATING_IMAGES', 'GENERATING_AUDIO']
    const validStatus = status && allowedStatuses.includes(status) ? status : undefined

    // 카테고리 필수
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // AI 생성 아바타 처리 (DB의 avatars FK에 저장 불가하므로 null 처리)
    // 프리셋 아바타는 avatars 테이블의 id를 사용하므로 정상 저장 가능
    const isAiGeneratedAvatar = avatarId === 'ai-generated' || avatarType === 'ai-generated'
    const dbAvatarId = isAiGeneratedAvatar ? null : (avatarId || null)

    // 기존 초안 업데이트 또는 새로 생성
    if (id) {
      // 기존 초안 확인 (DRAFT 또는 생성 중 상태)
      const existing = await prisma.video_ads.findFirst({
        where: {
          id,
          user_id: user.id,
          status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_IMAGES', 'GENERATING_AUDIO'] },
        },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      // 업데이트 (undefined인 필드는 기존 값 유지)
      const updated = await prisma.video_ads.update({
        where: { id },
        data: {
          ...(validStatus && { status: validStatus }),
          ...(wizardStep !== undefined && { wizard_step: wizardStep }),
          ...(avatarId !== undefined && { avatar_id: dbAvatarId }),
          ...(outfitId !== undefined && { outfit_id: isAiGeneratedAvatar ? null : (outfitId || null) }),
          ...(avatarImageUrl !== undefined && { avatar_image_url: avatarImageUrl || null }),
          ...(productId !== undefined && { product_id: productId || null }),
          ...(aiAvatarOptions !== undefined && { ai_avatar_options: isAiGeneratedAvatar ? (aiAvatarOptions ? JSON.stringify(aiAvatarOptions) : null) : null }),
          ...(productInfo !== undefined && { product_info: productInfo || null }),
          ...(locationPrompt !== undefined && { location_prompt: locationPrompt || null }),
          ...(duration !== undefined && { duration: duration || null }),
          ...(videoBackground !== undefined && { video_background: videoBackground || null }),
          ...(cameraComposition !== undefined && { camera_composition: cameraComposition || null }),
          ...(scriptsJson !== undefined && { scripts_json: scriptsJson || null }),
          ...(scriptStyle !== undefined && { script_style: scriptStyle || null }),
          ...(script !== undefined && { script: script || null }),
          ...(firstSceneImageUrl !== undefined && { first_scene_image_url: firstSceneImageUrl || null }),
          ...(firstFrameUrls !== undefined && { first_frame_urls: firstFrameUrls || null }),
          ...(firstFrameOriginalUrls !== undefined && { first_frame_original_urls: firstFrameOriginalUrls || null }),
          ...(firstFramePrompt !== undefined && { first_frame_prompt: firstFramePrompt || null }),
          ...(imageRequests !== undefined && { first_scene_options: imageRequests ? JSON.stringify(imageRequests) : null }),
          ...(voiceId !== undefined && { voice_id: voiceId || null }),
          ...(voiceName !== undefined && { voice_name: voiceName || null }),
          ...(ttsTaskId !== undefined && { kie_request_id: ttsTaskId ? `tts:${ttsTaskId}` : null }),
          ...(videoType !== undefined && { video_type: videoType || null }),
          updated_at: new Date(),
        },
      })

      // 캐시 무효화 (목록에 즉시 반영되도록)
      invalidateVideoAdsCache(user.id)

      return NextResponse.json({ draft: updated })
    } else {
      // 새 초안 생성 (기존 드래프트와 무관하게 항상 새로 생성)
      const draft = await prisma.video_ads.create({
        data: {
          user_id: user.id,
          category,
          status: 'DRAFT',
          wizard_step: wizardStep || 1,
          avatar_id: dbAvatarId,
          outfit_id: isAiGeneratedAvatar ? null : (outfitId || null),
          avatar_image_url: avatarImageUrl || null,
          product_id: productId || null,
          ai_avatar_options: isAiGeneratedAvatar ? (aiAvatarOptions ? JSON.stringify(aiAvatarOptions) : null) : null,
          product_info: productInfo || null,
          location_prompt: locationPrompt || null,
          duration: duration || null,
          video_background: videoBackground || null,
          camera_composition: cameraComposition || null,
          scripts_json: scriptsJson || null,
          script_style: scriptStyle || null,
          script: script || null,
          first_scene_image_url: firstSceneImageUrl || null,
          first_frame_urls: firstFrameUrls || null,
          first_frame_original_urls: firstFrameOriginalUrls || null,
          first_frame_prompt: firstFramePrompt || null,
          first_scene_options: imageRequests ? JSON.stringify(imageRequests) : null,  // 이미지 폴링 요청 정보
          voice_id: voiceId || null,
          voice_name: voiceName || null,
          kie_request_id: ttsTaskId ? `tts:${ttsTaskId}` : null,  // TTS 폴링용 taskId
          video_type: videoType || null,
        },
      })

      // 캐시 무효화 (목록에 즉시 반영되도록)
      invalidateVideoAdsCache(user.id)

      return NextResponse.json({ draft }, { status: 201 })
    }
  } catch (error) {
    console.error('임시 저장 오류:', error)
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/video-ads/draft
 *
 * 임시 저장된 초안을 조회합니다.
 * - id 파라미터: 특정 드래프트 조회
 * - category 파라미터: 해당 카테고리의 가장 최근 드래프트 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')

    // ID로 특정 드래프트 조회
    if (id) {
      const draft = await prisma.video_ads.findFirst({
        where: {
          id,
          user_id: user.id,
          status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_IMAGES', 'GENERATING_AUDIO'] },
        },
      })
      return NextResponse.json({ draft })
    }

    // 카테고리로 가장 최근 드래프트 조회
    if (!category) {
      return NextResponse.json({ error: 'Category or ID is required' }, { status: 400 })
    }

    // DRAFT 또는 생성 중 상태의 초안 조회
    const draft = await prisma.video_ads.findFirst({
      where: {
        user_id: user.id,
        category,
        status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_IMAGES', 'GENERATING_AUDIO'] },
      },
      orderBy: {
        updated_at: 'desc',
      },
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('초안 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/video-ads/draft
 *
 * 임시 저장된 초안을 삭제합니다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')

    if (id) {
      // 특정 초안 삭제 (생성 중 상태도 포함)
      await prisma.video_ads.deleteMany({
        where: {
          id,
          user_id: user.id,
          status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_IMAGES', 'GENERATING_AUDIO'] },
        },
      })
    } else if (category) {
      // 카테고리별 초안 삭제 (생성 중 상태도 포함)
      await prisma.video_ads.deleteMany({
        where: {
          user_id: user.id,
          category,
          status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_IMAGES', 'GENERATING_AUDIO'] },
        },
      })
    } else {
      return NextResponse.json({ error: 'ID or category is required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('초안 삭제 오류:', error)
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    )
  }
}
