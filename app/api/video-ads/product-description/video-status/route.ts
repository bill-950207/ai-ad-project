/**
 * 제품 설명 영상 - AI 서비스 직접 상태 조회 API
 *
 * GET /api/video-ads/product-description/video-status?requestId=xxx&provider=wavespeed
 * - video_ads 테이블 조회 없이 AI 서비스(WaveSpeed/Kie.ai)에 직접 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import {
  getInfinitalkQueueStatus as getKieInfinitalkQueueStatus,
  getInfinitalkQueueResponse as getKieInfinitalkQueueResponse,
} from '@/lib/kie/client'
import {
  getInfiniteTalkQueueStatus as getWavespeedInfiniteTalkQueueStatus,
  getInfiniteTalkQueueResponse as getWavespeedInfiniteTalkQueueResponse,
} from '@/lib/wavespeed/client'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')
    const provider = searchParams.get('provider') as 'wavespeed' | 'kie' | null
    const videoAdId = searchParams.get('videoAdId')  // DB 업데이트용 (선택)

    if (!requestId || !provider) {
      return NextResponse.json(
        { error: 'requestId and provider are required' },
        { status: 400 }
      )
    }

    let status: { status: string; queue_position?: number }
    let videoUrl: string | null = null

    // AI 서비스 직접 상태 조회
    try {
      if (provider === 'wavespeed') {
        const wavespeedStatus = await getWavespeedInfiniteTalkQueueStatus(requestId)
        status = { status: wavespeedStatus.status }

        if (wavespeedStatus.status === 'COMPLETED') {
          const result = await getWavespeedInfiniteTalkQueueResponse(requestId)
          if (result.videos && result.videos.length > 0) {
            videoUrl = result.videos[0].url
          }
        }
      } else {
        const kieStatus = await getKieInfinitalkQueueStatus(requestId)
        status = { status: kieStatus.status, queue_position: kieStatus.queue_position }

        if (kieStatus.status === 'COMPLETED') {
          const result = await getKieInfinitalkQueueResponse(requestId)
          if (result.videos && result.videos.length > 0) {
            videoUrl = result.videos[0].url
          }
        }
      }
    } catch (error) {
      console.error(`${provider} 상태 조회 오류:`, error)
      return NextResponse.json({
        status: 'FAILED',
        error: 'Failed to check video status',
      })
    }

    // 완료된 경우 - DB 업데이트 (videoAdId가 있을 경우)
    if (status.status === 'COMPLETED' && videoUrl && videoAdId) {
      await prisma.video_ads.update({
        where: { id: videoAdId, user_id: user.id },
        data: {
          status: 'COMPLETED',
          video_url: videoUrl,
          completed_at: new Date(),
        },
      }).catch(err => {
        console.error('DB 업데이트 오류:', err)
      })
    }

    // 실패한 경우 - DB 업데이트 (videoAdId가 있을 경우)
    if ((status.status === 'FAILED' || (status.status === 'COMPLETED' && !videoUrl)) && videoAdId) {
      await prisma.video_ads.update({
        where: { id: videoAdId, user_id: user.id },
        data: {
          status: 'FAILED',
          error_message: 'No video generated',
        },
      }).catch(err => {
        console.error('DB 업데이트 오류:', err)
      })

      return NextResponse.json({
        status: 'FAILED',
        error: 'No video generated',
      })
    }

    // 완료된 경우 결과 반환
    if (status.status === 'COMPLETED' && videoUrl) {
      return NextResponse.json({
        status: 'COMPLETED',
        videoUrl,
        provider,
      })
    }

    // 진행 중인 경우 상태 반환
    return NextResponse.json({
      status: status.status,
      provider,
      queuePosition: status.queue_position,
    })

  } catch (error) {
    console.error('영상 상태 확인 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
