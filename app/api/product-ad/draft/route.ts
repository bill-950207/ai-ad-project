/**
 * 제품 광고 영상 임시 저장 API
 *
 * POST /api/product-ad/draft - 마법사 진행 상태 저장 (생성 또는 업데이트)
 * GET /api/product-ad/draft - 현재 초안 조회
 * DELETE /api/product-ad/draft - 초안 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/product-ad/draft
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
      forceNew,  // true면 기존 초안 무시하고 새로 생성
      status,  // 상태 업데이트
      wizardStep,
      // Step 1 데이터
      productId,
      productInfo,
      // Step 2 데이터
      scenarioMethod,
      referenceInfo,
      // Step 3 데이터
      scenarioInfo,
      // Step 4 데이터
      aspectRatio,
      duration,
      firstSceneOptions,
      selectedSceneIndex,
      startFrameUrl,
      // Step 5 데이터
      videoRequestId,
      videoUrl,
      // MultiScene 데이터 (Kling O1 / Vidu Q2)
      sceneKeyframes,
      sceneVideoUrls,
    } = body

    // 허용된 상태값
    const allowedStatuses = [
      'DRAFT',
      'GENERATING_SCENARIO',
      'GENERATING_SCENES',
      'SCENES_COMPLETED',
      'GENERATING_VIDEO',
      'GENERATING_SCENE_VIDEOS',  // 멀티씬 영상 생성 중
      'IN_QUEUE',
      'IN_PROGRESS',
      'COMPLETED',
    ]
    const validStatus = status && allowedStatuses.includes(status) ? status : undefined

    // 기존 초안 업데이트 또는 새로 생성
    if (id) {
      // 기존 초안 확인
      const existing = await prisma.video_ads.findFirst({
        where: {
          id,
          user_id: user.id,
          category: 'productAd',
        },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      // 업데이트
      // 참고: scenarioInfo, referenceInfo, firstSceneOptions는 이미 클라이언트에서 JSON.stringify됨
      const updated = await prisma.video_ads.update({
        where: { id },
        data: {
          ...(validStatus && { status: validStatus }),
          wizard_step: wizardStep,
          product_id: productId || null,
          product_info: productInfo || null,
          scenario_method: scenarioMethod || null,
          reference_info: typeof referenceInfo === 'string' ? referenceInfo : (referenceInfo ? JSON.stringify(referenceInfo) : null),
          scenario_info: typeof scenarioInfo === 'string' ? scenarioInfo : (scenarioInfo ? JSON.stringify(scenarioInfo) : null),
          aspect_ratio: aspectRatio || null,
          duration: duration || null,
          first_scene_options: typeof firstSceneOptions === 'string' ? firstSceneOptions : (firstSceneOptions ? JSON.stringify(firstSceneOptions) : null),
          selected_scene_index: selectedSceneIndex ?? null,
          start_frame_url: startFrameUrl || null,
          video_request_id: videoRequestId || null,
          video_url: videoUrl || null,
          scene_keyframes: sceneKeyframes || undefined,
          scene_video_urls: sceneVideoUrls || undefined,
          updated_at: new Date(),
        },
      })

      return NextResponse.json({ draft: updated })
    } else {
      // forceNew가 아닌 경우에만 기존 DRAFT 확인
      if (!forceNew) {
        const existingDraft = await prisma.video_ads.findFirst({
          where: {
            user_id: user.id,
            category: 'productAd',
            status: { in: ['DRAFT', 'GENERATING_SCENARIO', 'GENERATING_SCENES', 'SCENES_COMPLETED'] },
          },
        })

        if (existingDraft) {
          // 기존 초안 업데이트
          // 참고: scenarioInfo, referenceInfo, firstSceneOptions는 이미 클라이언트에서 JSON.stringify됨
          const updated = await prisma.video_ads.update({
            where: { id: existingDraft.id },
            data: {
              ...(validStatus && { status: validStatus }),
              wizard_step: wizardStep,
              product_id: productId || null,
              product_info: productInfo || null,
              scenario_method: scenarioMethod || null,
              reference_info: typeof referenceInfo === 'string' ? referenceInfo : (referenceInfo ? JSON.stringify(referenceInfo) : null),
              scenario_info: typeof scenarioInfo === 'string' ? scenarioInfo : (scenarioInfo ? JSON.stringify(scenarioInfo) : null),
              aspect_ratio: aspectRatio || null,
              duration: duration || null,
              first_scene_options: typeof firstSceneOptions === 'string' ? firstSceneOptions : (firstSceneOptions ? JSON.stringify(firstSceneOptions) : null),
              selected_scene_index: selectedSceneIndex ?? null,
              start_frame_url: startFrameUrl || null,
              video_request_id: videoRequestId || null,
              video_url: videoUrl || null,
              scene_keyframes: sceneKeyframes || undefined,
              scene_video_urls: sceneVideoUrls || undefined,
              updated_at: new Date(),
            },
          })

          return NextResponse.json({ draft: updated })
        }
      }

      // 새 초안 생성
      // 참고: scenarioInfo, referenceInfo, firstSceneOptions는 이미 클라이언트에서 JSON.stringify됨
      const draft = await prisma.video_ads.create({
        data: {
          user_id: user.id,
          category: 'productAd',
          status: 'DRAFT',
          wizard_step: wizardStep || 1,
          product_id: productId || null,
          product_info: productInfo || null,
          scenario_method: scenarioMethod || null,
          reference_info: typeof referenceInfo === 'string' ? referenceInfo : (referenceInfo ? JSON.stringify(referenceInfo) : null),
          scenario_info: typeof scenarioInfo === 'string' ? scenarioInfo : (scenarioInfo ? JSON.stringify(scenarioInfo) : null),
          aspect_ratio: aspectRatio || null,
          duration: duration || null,
          first_scene_options: typeof firstSceneOptions === 'string' ? firstSceneOptions : (firstSceneOptions ? JSON.stringify(firstSceneOptions) : null),
          selected_scene_index: selectedSceneIndex ?? null,
          start_frame_url: startFrameUrl || null,
          video_request_id: videoRequestId || null,
          video_url: videoUrl || null,
          scene_keyframes: sceneKeyframes || undefined,
          scene_video_urls: sceneVideoUrls || undefined,
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
 * GET /api/product-ad/draft
 *
 * 현재 초안을 조회합니다.
 */
// 필요한 필드만 선택 (성능 최적화)
const DRAFT_SELECT = {
  id: true,
  user_id: true,
  product_id: true,
  status: true,
  wizard_step: true,
  product_info: true,
  scenario_method: true,
  reference_info: true,
  scenario_info: true,
  aspect_ratio: true,
  duration: true,
  first_scene_options: true,
  selected_scene_index: true,
  start_frame_url: true,
  video_request_id: true,
  video_url: true,
  scene_keyframes: true,
  scene_video_urls: true,
  category: true,
  created_at: true,
  updated_at: true,
}

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
      // 특정 ID로 조회 (findUnique 사용 - 더 빠름)
      const draft = await prisma.video_ads.findUnique({
        where: { id },
        select: DRAFT_SELECT,
      })

      // 권한 확인
      if (draft && (draft.user_id !== user.id || draft.category !== 'productAd')) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json({ draft })
    }

    // 가장 최근 DRAFT 조회
    const draft = await prisma.video_ads.findFirst({
      where: {
        user_id: user.id,
        category: 'productAd',
        status: { in: ['DRAFT', 'GENERATING_SCENARIO', 'GENERATING_SCENES', 'SCENES_COMPLETED'] },
      },
      select: DRAFT_SELECT,
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
 * DELETE /api/product-ad/draft
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
          category: 'productAd',
          status: { in: ['DRAFT', 'GENERATING_SCENARIO', 'GENERATING_SCENES', 'SCENES_COMPLETED'] },
        },
      })
    } else {
      // 모든 productAd DRAFT 삭제
      await prisma.video_ads.deleteMany({
        where: {
          user_id: user.id,
          category: 'productAd',
          status: { in: ['DRAFT', 'GENERATING_SCENARIO', 'GENERATING_SCENES', 'SCENES_COMPLETED'] },
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
