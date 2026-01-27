/**
 * 씬 버전 활성화 API
 *
 * POST: 특정 버전을 활성화 (해당 씬의 다른 버전들은 비활성화)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST: 특정 씬 버전 활성화
 * - 해당 씬의 다른 모든 버전을 비활성화하고 선택된 버전을 활성화
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: versionId } = await params

    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      )
    }

    // 버전 정보 조회
    const version = await prisma.video_ad_scene_versions.findUnique({
      where: { id: versionId },
      include: {
        video_ads: {
          select: {
            id: true,
            user_id: true,
          },
        },
      },
    })

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // 소유권 확인
    if (version.video_ads.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // 이미 활성화된 버전이면 성공 반환
    if (version.is_active) {
      return NextResponse.json({
        success: true,
        message: 'Version is already active',
        version,
      })
    }

    // 트랜잭션으로 버전 활성화
    const result = await prisma.$transaction(async (tx) => {
      // 해당 씬의 모든 활성 버전 비활성화
      await tx.video_ad_scene_versions.updateMany({
        where: {
          video_ad_id: version.video_ad_id,
          scene_index: version.scene_index,
          is_active: true,
        },
        data: {
          is_active: false,
        },
      })

      // 선택된 버전 활성화
      const activatedVersion = await tx.video_ad_scene_versions.update({
        where: { id: versionId },
        data: { is_active: true },
      })

      return activatedVersion
    })

    return NextResponse.json({
      success: true,
      version: result,
    })
  } catch (error) {
    console.error('씬 버전 활성화 오류:', error)
    return NextResponse.json(
      { error: 'Failed to activate scene version' },
      { status: 500 }
    )
  }
}
