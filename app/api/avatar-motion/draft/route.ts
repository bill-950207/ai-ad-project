/**
 * 아바타 모션 영상 임시 저장 API
 *
 * POST /api/avatar-motion/draft - 마법사 진행 상태 저장 (생성 또는 업데이트)
 * GET /api/avatar-motion/draft - 현재 초안 조회
 * DELETE /api/avatar-motion/draft - 초안 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/avatar-motion/draft
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
      status,  // 상태 업데이트
      wizardStep,
      // Step 1 데이터
      avatarId,
      outfitId,
      avatarImageUrl,
      productId,
      productInfo,
      aiAvatarOptions,
      // Step 2 데이터
      storyMethod,
      // Step 3 데이터
      storyInfo,
      // Step 4 데이터
      aspectRatio,
      duration,
      startFrameUrl,
      endFrameUrl,
      startFrameRequestId,
      endFrameRequestId,
      videoRequestId,
      videoUrl,
    } = body

    // 허용된 상태값 (DRAFT 계열 상태만 허용)
    const allowedStatuses = [
      'DRAFT',
      'GENERATING_STORY',
      'GENERATING_FRAMES',
      'GENERATING_AVATAR',
      'FRAMES_COMPLETED',
      'IN_QUEUE',
      'IN_PROGRESS',
    ]
    const validStatus = status && allowedStatuses.includes(status) ? status : undefined

    // AI 생성 아바타 처리 (avatarId가 'ai-generated'이면 DB에는 null 저장)
    const isAiGeneratedAvatar = avatarId === 'ai-generated'
    const dbAvatarId = isAiGeneratedAvatar ? null : (avatarId || null)

    // 기존 초안 업데이트 또는 새로 생성
    if (id) {
      // 기존 초안 확인
      const existing = await prisma.video_ads.findFirst({
        where: {
          id,
          user_id: user.id,
          category: 'avatarMotion',
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
          avatar_id: dbAvatarId,
          outfit_id: isAiGeneratedAvatar ? null : (outfitId || null),
          avatar_image_url: avatarImageUrl || null,
          product_id: productId || null,
          product_info: productInfo || null,
          ai_avatar_options: isAiGeneratedAvatar ? (aiAvatarOptions ? JSON.stringify(aiAvatarOptions) : null) : null,
          story_method: storyMethod || null,
          story_info: storyInfo || null,
          aspect_ratio: aspectRatio || null,
          duration: duration || null,
          start_frame_url: startFrameUrl || null,
          end_frame_url: endFrameUrl || null,
          start_frame_request_id: startFrameRequestId || null,
          end_frame_request_id: endFrameRequestId || null,
          video_request_id: videoRequestId || null,
          video_url: videoUrl || null,
          updated_at: new Date(),
        },
      })

      return NextResponse.json({ draft: updated })
    } else {
      // 같은 카테고리의 기존 DRAFT 확인 (하나만 유지)
      const existingDraft = await prisma.video_ads.findFirst({
        where: {
          user_id: user.id,
          category: 'avatarMotion',
          status: { in: ['DRAFT', 'GENERATING_STORY', 'GENERATING_FRAMES', 'GENERATING_AVATAR', 'FRAMES_COMPLETED'] },
        },
      })

      if (existingDraft) {
        // 기존 초안 업데이트
        const updated = await prisma.video_ads.update({
          where: { id: existingDraft.id },
          data: {
            ...(validStatus && { status: validStatus }),
            wizard_step: wizardStep,
            avatar_id: dbAvatarId,
            outfit_id: isAiGeneratedAvatar ? null : (outfitId || null),
            avatar_image_url: avatarImageUrl || null,
            product_id: productId || null,
            product_info: productInfo || null,
            ai_avatar_options: isAiGeneratedAvatar ? (aiAvatarOptions ? JSON.stringify(aiAvatarOptions) : null) : null,
            story_method: storyMethod || null,
            story_info: storyInfo || null,
            aspect_ratio: aspectRatio || null,
            duration: duration || null,
            start_frame_url: startFrameUrl || null,
            end_frame_url: endFrameUrl || null,
            start_frame_request_id: startFrameRequestId || null,
            end_frame_request_id: endFrameRequestId || null,
            video_request_id: videoRequestId || null,
            video_url: videoUrl || null,
            updated_at: new Date(),
          },
        })

        return NextResponse.json({ draft: updated })
      }

      // 새 초안 생성
      const draft = await prisma.video_ads.create({
        data: {
          user_id: user.id,
          category: 'avatarMotion',
          status: 'DRAFT',
          wizard_step: wizardStep || 1,
          avatar_id: dbAvatarId,
          outfit_id: isAiGeneratedAvatar ? null : (outfitId || null),
          avatar_image_url: avatarImageUrl || null,
          product_id: productId || null,
          product_info: productInfo || null,
          ai_avatar_options: isAiGeneratedAvatar ? (aiAvatarOptions ? JSON.stringify(aiAvatarOptions) : null) : null,
          story_method: storyMethod || null,
          story_info: storyInfo || null,
          aspect_ratio: aspectRatio || null,
          duration: duration || null,
          start_frame_url: startFrameUrl || null,
          end_frame_url: endFrameUrl || null,
          start_frame_request_id: startFrameRequestId || null,
          end_frame_request_id: endFrameRequestId || null,
          video_request_id: videoRequestId || null,
          video_url: videoUrl || null,
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
 * GET /api/avatar-motion/draft
 *
 * 현재 초안을 조회합니다.
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

    if (id) {
      // 특정 ID로 조회
      const draft = await prisma.video_ads.findFirst({
        where: {
          id,
          user_id: user.id,
          category: 'avatarMotion',
        },
      })

      return NextResponse.json({ draft })
    }

    // 가장 최근 DRAFT 조회
    const draft = await prisma.video_ads.findFirst({
      where: {
        user_id: user.id,
        category: 'avatarMotion',
        status: { in: ['DRAFT', 'GENERATING_STORY', 'GENERATING_FRAMES', 'GENERATING_AVATAR', 'FRAMES_COMPLETED'] },
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
 * DELETE /api/avatar-motion/draft
 *
 * 초안을 삭제합니다.
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

    if (id) {
      // 특정 초안 삭제
      await prisma.video_ads.deleteMany({
        where: {
          id,
          user_id: user.id,
          category: 'avatarMotion',
          status: { in: ['DRAFT', 'GENERATING_STORY', 'GENERATING_FRAMES', 'GENERATING_AVATAR', 'FRAMES_COMPLETED'] },
        },
      })
    } else {
      // 모든 avatarMotion DRAFT 삭제
      await prisma.video_ads.deleteMany({
        where: {
          user_id: user.id,
          category: 'avatarMotion',
          status: { in: ['DRAFT', 'GENERATING_STORY', 'GENERATING_FRAMES', 'GENERATING_AVATAR', 'FRAMES_COMPLETED'] },
        },
      })
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
