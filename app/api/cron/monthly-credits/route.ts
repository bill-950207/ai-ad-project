/**
 * 월간 크레딧 지급 Cron API
 *
 * Vercel Cron으로 매월 1일 00:00 UTC에 실행
 * - 활성 구독자에게 플랜별 월 크레딧 지급
 * - 사용량(usage_tracking) 리셋
 *
 * 스케줄: "0 0 1 * *" (매월 1일 00:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subscription_status } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Cron: Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Cron: Starting monthly credits distribution...')

    // 현재 월의 시작일 계산
    const currentPeriod = new Date()
    currentPeriod.setUTCDate(1)
    currentPeriod.setUTCHours(0, 0, 0, 0)

    // 활성 구독자 조회 (ACTIVE 또는 TRIALING 상태)
    const activeSubscriptions = await prisma.subscriptions.findMany({
      where: {
        status: {
          in: [subscription_status.ACTIVE, subscription_status.TRIALING],
        },
      },
      include: {
        plan: true,
      },
    })

    console.log(`Cron: Found ${activeSubscriptions.length} active subscriptions`)

    let processedCount = 0
    let errorCount = 0
    const results: { userId: string; planName: string; credits: number; success: boolean }[] = []

    // 각 구독자에게 크레딧 지급 및 사용량 리셋
    for (const subscription of activeSubscriptions) {
      try {
        const creditsToGrant = subscription.plan.monthly_credits

        // 크레딧 지급 및 사용량 리셋 트랜잭션
        await prisma.$transaction([
          // 크레딧 지급
          prisma.profiles.update({
            where: { id: subscription.user_id },
            data: {
              credits: { increment: creditsToGrant },
            },
          }),
          // 사용량 리셋 (새 기간의 레코드 생성 또는 업데이트)
          prisma.usage_tracking.upsert({
            where: {
              user_id_period: {
                user_id: subscription.user_id,
                period: currentPeriod,
              },
            },
            update: {
              avatar_count: 0,
              music_count: 0,
              product_count: 0,
            },
            create: {
              user_id: subscription.user_id,
              period: currentPeriod,
              avatar_count: 0,
              music_count: 0,
              product_count: 0,
            },
          }),
        ])

        results.push({
          userId: subscription.user_id,
          planName: subscription.plan.display_name,
          credits: creditsToGrant,
          success: true,
        })

        processedCount++
        console.log(
          `Cron: Granted ${creditsToGrant} credits to user ${subscription.user_id} (${subscription.plan.display_name})`
        )
      } catch (error) {
        errorCount++
        results.push({
          userId: subscription.user_id,
          planName: subscription.plan.display_name,
          credits: 0,
          success: false,
        })
        console.error(`Cron: Error processing user ${subscription.user_id}:`, error)
      }
    }

    console.log(
      `Cron: Monthly credits distribution completed. Processed: ${processedCount}, Errors: ${errorCount}`
    )

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      period: currentPeriod.toISOString(),
      summary: {
        totalSubscriptions: activeSubscriptions.length,
        processed: processedCount,
        errors: errorCount,
      },
      results,
    })
  } catch (error) {
    console.error('Cron: Fatal error in monthly credits distribution:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
