/**
 * 시네마틱 광고 영상 생성 API
 *
 * POST: 크레딧 확인 → 차감 → BytePlus API로 영상 생성 태스크 제출
 * - video_ads 테이블에 상태 업데이트
 * - fal_request_id에 'byteplus:{taskId}' 저장 (multi-provider 폴링 호환)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { createVideoTask } from '@/lib/byteplus/client'
import { SEEDANCE_V2_CREDIT_COST_PER_SECOND } from '@/lib/credits/constants'
import { hasEnoughCredits } from '@/lib/credits/utils'
import { recordCreditUse } from '@/lib/credits/history'
import type { BytePlusVideoInput, SeedanceV2Resolution } from '@/lib/byteplus/types'

interface GenerateVideoRequest {
  videoAdId: string
  prompt: string
  imageUrls?: string[]
  aspectRatio?: string
  resolution?: SeedanceV2Resolution
  duration?: number
  generateAudio?: boolean
}

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

    const body: GenerateVideoRequest = await request.json()
    const {
      videoAdId,
      prompt,
      imageUrls,
      aspectRatio,
      resolution = '720p',
      duration = 8,
      generateAudio = false,
    } = body

    if (!videoAdId || !prompt) {
      return NextResponse.json(
        { error: 'videoAdId and prompt are required' },
        { status: 400 }
      )
    }

    // video_ads 소유권 확인
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

    // 크레딧 계산
    const costPerSecond = SEEDANCE_V2_CREDIT_COST_PER_SECOND[resolution] || 2
    const totalCredits = duration * costPerSecond

    // 크레딧 확인
    const hasCredits = await hasEnoughCredits(user.id, totalCredits)
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: totalCredits },
        { status: 402 }
      )
    }

    // 트랜잭션: 크레딧 차감 + video_ads 상태 업데이트
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // 크레딧 차감
      const profile = await tx.profiles.update({
        where: { id: user.id },
        data: { credits: { decrement: totalCredits } },
        select: { credits: true },
      })

      // 크레딧 히스토리 기록
      await recordCreditUse(
        {
          userId: user.id,
          featureType: 'SEEDANCE_VIDEO',
          amount: totalCredits,
          balanceAfter: profile.credits ?? 0,
          relatedEntityId: videoAdId,
          description: `시네마틱 광고 영상 생성 (${resolution}, ${duration}초)`,
        },
        tx
      )

      // video_ads 상태 업데이트
      await tx.video_ads.update({
        where: { id: videoAdId },
        data: {
          status: 'GENERATING_VIDEO',
          prompt,
          resolution,
          duration,
          aspect_ratio: aspectRatio,
          generate_audio: generateAudio,
          updated_at: new Date(),
        },
      })

      return profile
    })

    // BytePlus API로 영상 생성 태스크 제출
    let taskId: string
    try {
      const result = await createVideoTask({
        prompt,
        imageUrls,
        aspectRatio: aspectRatio as BytePlusVideoInput['aspectRatio'],
        resolution,
        duration,
        generateAudio,
      })
      taskId = result.taskId
    } catch (apiError) {
      // API 실패 시 크레딧 환불
      console.error('BytePlus API 오류:', apiError)

      await prisma.$transaction(async (tx) => {
        const profile = await tx.profiles.update({
          where: { id: user.id },
          data: { credits: { increment: totalCredits } },
          select: { credits: true },
        })

        await tx.video_ads.update({
          where: { id: videoAdId },
          data: {
            status: 'FAILED',
            error_message: apiError instanceof Error ? apiError.message : 'BytePlus API 오류',
            updated_at: new Date(),
          },
        })

        // 환불 히스토리 기록
        const { recordCreditRefund } = await import('@/lib/credits/history')
        await recordCreditRefund(
          {
            userId: user.id,
            featureType: 'SEEDANCE_VIDEO',
            amount: totalCredits,
            balanceAfter: profile.credits ?? 0,
            relatedEntityId: videoAdId,
            description: '시네마틱 광고 영상 생성 실패 - 환불',
          },
          tx
        )
      })

      return NextResponse.json(
        { error: 'Failed to start video generation' },
        { status: 500 }
      )
    }

    // 태스크 ID 저장 (byteplus:taskId 형식)
    await prisma.video_ads.update({
      where: { id: videoAdId },
      data: {
        fal_request_id: `byteplus:${taskId}`,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      requestId: `byteplus:${taskId}`,
      creditsUsed: totalCredits,
      remainingCredits: updatedProfile.credits,
    })
  } catch (error) {
    console.error('시네마틱 영상 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate cinematic video' },
      { status: 500 }
    )
  }
}
