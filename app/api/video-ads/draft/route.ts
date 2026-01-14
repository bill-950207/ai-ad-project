/**
 * 영상 광고 임시 저장 API
 *
 * POST /api/video-ads/draft - 마법사 진행 상태 저장 (생성 또는 업데이트)
 * GET /api/video-ads/draft - 현재 카테고리의 임시 저장된 초안 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

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
      status,  // 상태 업데이트 (GENERATING_SCRIPTS, GENERATING_AUDIO, DRAFT 등)
      // Step 1 데이터
      avatarId,
      outfitId,
      avatarImageUrl,
      productId,
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
      firstFrameUrls,  // 첫 프레임 이미지 URL 배열
      firstFramePrompt,
      // Step 4 데이터
      voiceId,
      voiceName,
    } = body

    // 허용된 상태값 (DRAFT 계열 상태만 허용)
    const allowedStatuses = ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_AUDIO']
    const validStatus = status && allowedStatuses.includes(status) ? status : undefined

    // 카테고리 필수
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // 기존 초안 업데이트 또는 새로 생성
    if (id) {
      // 기존 초안 확인 (DRAFT 또는 생성 중 상태)
      const existing = await prisma.video_ads.findFirst({
        where: {
          id,
          user_id: user.id,
          status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_AUDIO'] },
        },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      // 업데이트
      const updated = await prisma.video_ads.update({
        where: { id },
        data: {
          ...(validStatus && { status: validStatus }),
          wizard_step: wizardStep,
          avatar_id: avatarId || null,
          outfit_id: outfitId || null,
          avatar_image_url: avatarImageUrl || null,
          product_id: productId || null,
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
          first_frame_prompt: firstFramePrompt || null,
          voice_id: voiceId || null,
          voice_name: voiceName || null,
          updated_at: new Date(),
        },
      })

      return NextResponse.json({ draft: updated })
    } else {
      // 같은 카테고리의 기존 DRAFT 확인 (하나만 유지, 생성 중 상태도 포함)
      const existingDraft = await prisma.video_ads.findFirst({
        where: {
          user_id: user.id,
          category,
          status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_AUDIO'] },
        },
      })

      if (existingDraft) {
        // 기존 초안 업데이트
        const updated = await prisma.video_ads.update({
          where: { id: existingDraft.id },
          data: {
            ...(validStatus && { status: validStatus }),
            wizard_step: wizardStep,
            avatar_id: avatarId || null,
            outfit_id: outfitId || null,
            avatar_image_url: avatarImageUrl || null,
            product_id: productId || null,
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
            first_frame_prompt: firstFramePrompt || null,
            voice_id: voiceId || null,
            voice_name: voiceName || null,
            updated_at: new Date(),
          },
        })

        return NextResponse.json({ draft: updated })
      }

      // 새 초안 생성
      const draft = await prisma.video_ads.create({
        data: {
          user_id: user.id,
          category,
          status: 'DRAFT',
          wizard_step: wizardStep || 1,
          avatar_id: avatarId || null,
          outfit_id: outfitId || null,
          avatar_image_url: avatarImageUrl || null,
          product_id: productId || null,
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
          first_frame_prompt: firstFramePrompt || null,
          voice_id: voiceId || null,
          voice_name: voiceName || null,
        },
      })

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
 * 현재 카테고리의 임시 저장된 초안을 조회합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // DRAFT 또는 생성 중 상태의 초안 조회
    const draft = await prisma.video_ads.findFirst({
      where: {
        user_id: user.id,
        category,
        status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_AUDIO'] },
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
          status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_AUDIO'] },
        },
      })
    } else if (category) {
      // 카테고리별 초안 삭제 (생성 중 상태도 포함)
      await prisma.video_ads.deleteMany({
        where: {
          user_id: user.id,
          category,
          status: { in: ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_AUDIO'] },
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
