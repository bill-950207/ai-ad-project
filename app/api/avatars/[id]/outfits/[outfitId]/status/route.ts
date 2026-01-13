/**
 * 의상 교체 상태 확인 API 라우트
 *
 * GET /api/avatars/[id]/outfits/[outfitId]/status - 의상 교체 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { getEditQueueStatus, getEditQueueResponse } from '@/lib/kie/client'
import { getOutfitQueueStatus as getFalOutfitQueueStatus, getOutfitQueueResponse as getFalOutfitQueueResponse } from '@/lib/fal/client'

// AI 프로바이더 설정 (기본값: kie, fallback: fal)
const AI_PROVIDER = process.env.OUTFIT_AI_PROVIDER || 'kie'

/** 라우트 파라미터 타입 */
interface RouteParams {
  params: Promise<{ id: string; outfitId: string }>
}

/**
 * GET /api/avatars/[id]/outfits/[outfitId]/status
 *
 * 의상 교체 요청의 현재 상태를 조회합니다.
 * fal.ai 큐 상태를 확인하고 완료 시 UPLOADING 상태로 변경합니다.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: avatarId, outfitId } = await params

    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 의상 조회 (본인 소유 확인)
    const outfit = await prisma.avatar_outfits.findFirst({
      where: {
        id: outfitId,
        avatar_id: avatarId,
        user_id: user.id,
      },
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    // 이미 완료/실패 상태인 경우 바로 반환
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(outfit.status)) {
      return NextResponse.json({ outfit })
    }

    // fal 요청 ID가 없는 경우
    if (!outfit.fal_request_id) {
      return NextResponse.json({ outfit })
    }

    // AI 프로바이더에 따라 큐 상태 확인
    const queueStatus = AI_PROVIDER === 'kie'
      ? await getEditQueueStatus(outfit.fal_request_id)
      : await getFalOutfitQueueStatus(outfit.fal_request_id)

    // 상태에 따른 처리
    if (queueStatus.status === 'COMPLETED') {
      // 결과 조회
      let resultImageUrl: string

      if (AI_PROVIDER === 'kie') {
        const kieResult = await getEditQueueResponse(outfit.fal_request_id)
        resultImageUrl = kieResult.images[0].url
      } else {
        const falResult = await getFalOutfitQueueResponse(outfit.fal_request_id)
        resultImageUrl = falResult.images[0].url
      }

      // UPLOADING 상태로 업데이트
      const updatedOutfit = await prisma.avatar_outfits.update({
        where: { id: outfitId },
        data: { status: 'UPLOADING' },
      })

      return NextResponse.json({
        outfit: updatedOutfit,
        tempImageUrl: resultImageUrl,
      })
    }

    // 진행 중인 경우 상태 업데이트
    let dbStatus: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' = 'IN_PROGRESS'
    if (queueStatus.status === 'IN_QUEUE') {
      dbStatus = 'IN_QUEUE'
    }

    if (outfit.status !== dbStatus) {
      await prisma.avatar_outfits.update({
        where: { id: outfitId },
        data: { status: dbStatus },
      })
    }

    return NextResponse.json({
      outfit: { ...outfit, status: dbStatus },
      queuePosition: queueStatus.queue_position,
    })
  } catch (error) {
    console.error('의상 상태 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to check outfit status' },
      { status: 500 }
    )
  }
}
