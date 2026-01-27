/**
 * 씬 영상 버전 관리 API
 *
 * POST: 새 버전 저장 (재생성 시)
 * GET: 특정 video_ad의 모든 씬 버전 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

interface SaveVersionRequest {
  videoAdId: string
  sceneIndex: number
  videoUrl: string
  prompt?: string
  duration?: number
  resolution?: string
  requestId?: string
}

/**
 * POST: 새 씬 버전 저장
 * - 기존 활성 버전을 비활성화하고 새 버전을 활성화
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: SaveVersionRequest = await request.json()
    const {
      videoAdId,
      sceneIndex,
      videoUrl,
      prompt,
      duration,
      resolution,
      requestId,
    } = body

    if (!videoAdId || sceneIndex === undefined || !videoUrl) {
      return NextResponse.json(
        { error: 'videoAdId, sceneIndex, and videoUrl are required' },
        { status: 400 }
      )
    }

    // video_ad 소유권 확인
    const videoAd = await prisma.video_ads.findFirst({
      where: {
        id: videoAdId,
        user_id: user.id,
      },
    })

    if (!videoAd) {
      return NextResponse.json(
        { error: 'Video ad not found' },
        { status: 404 }
      )
    }

    // 트랜잭션으로 버전 관리
    const result = await prisma.$transaction(async (tx) => {
      // 현재 씬의 최대 버전 번호 조회
      const maxVersion = await tx.video_ad_scene_versions.aggregate({
        where: {
          video_ad_id: videoAdId,
          scene_index: sceneIndex,
        },
        _max: {
          version: true,
        },
      })

      const newVersion = (maxVersion._max.version ?? 0) + 1

      // 기존 활성 버전들을 모두 비활성화
      await tx.video_ad_scene_versions.updateMany({
        where: {
          video_ad_id: videoAdId,
          scene_index: sceneIndex,
          is_active: true,
        },
        data: {
          is_active: false,
        },
      })

      // 새 버전 생성 (활성화 상태)
      const newSceneVersion = await tx.video_ad_scene_versions.create({
        data: {
          video_ad_id: videoAdId,
          scene_index: sceneIndex,
          version: newVersion,
          video_url: videoUrl,
          prompt,
          duration,
          resolution,
          request_id: requestId,
          is_active: true,
        },
      })

      return newSceneVersion
    })

    return NextResponse.json({
      success: true,
      version: result,
    })
  } catch (error) {
    console.error('씬 버전 저장 오류:', error)
    return NextResponse.json(
      { error: 'Failed to save scene version' },
      { status: 500 }
    )
  }
}

/**
 * GET: 특정 video_ad의 모든 씬 버전 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoAdId = searchParams.get('videoAdId')

    if (!videoAdId) {
      return NextResponse.json(
        { error: 'videoAdId is required' },
        { status: 400 }
      )
    }

    // video_ad 소유권 확인
    const videoAd = await prisma.video_ads.findFirst({
      where: {
        id: videoAdId,
        user_id: user.id,
      },
    })

    if (!videoAd) {
      return NextResponse.json(
        { error: 'Video ad not found' },
        { status: 404 }
      )
    }

    // 모든 씬 버전 조회 (씬 인덱스, 버전 순으로 정렬)
    const versions = await prisma.video_ad_scene_versions.findMany({
      where: {
        video_ad_id: videoAdId,
      },
      orderBy: [
        { scene_index: 'asc' },
        { version: 'desc' },  // 최신 버전이 먼저
      ],
    })

    // 씬별로 그룹화
    const groupedByScene: Record<number, typeof versions> = {}
    for (const version of versions) {
      if (!groupedByScene[version.scene_index]) {
        groupedByScene[version.scene_index] = []
      }
      groupedByScene[version.scene_index].push(version)
    }

    return NextResponse.json({
      versions,
      groupedByScene,
    })
  } catch (error) {
    console.error('씬 버전 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to get scene versions' },
      { status: 500 }
    )
  }
}
