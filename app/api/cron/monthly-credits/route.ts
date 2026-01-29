/**
 * 월간 크레딧 지급 Cron API
 *
 * Vercel Cron으로 매월 1일 00:00 UTC에 실행
 * - 활성 구독자에게 플랜별 월 크레딧 지급
 *
 * 참고: avatar_limit/music_limit/product_limit은 슬롯 제한(동시 보유 가능 개수)이므로
 * 월간 리셋 대상이 아님. 실제 보유 수량은 DB COUNT로 확인.
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

    // 활성 구독자 조회
    // 조건:
    // - 상태: ACTIVE 또는 TRIALING
    // - Soft Delete 되지 않음: canceled_at이 null
    // 참고: cancel_at_period_end=true인 경우에도 기간 내에는 크레딧 지급
    const activeSubscriptions = await prisma.subscriptions.findMany({
      where: {
        status: {
          in: [subscription_status.ACTIVE, subscription_status.TRIALING],
        },
        canceled_at: null,  // Soft Delete 된 구독 제외
      },
      include: {
        plan: true,
      },
    })

    console.log(`Cron: Found ${activeSubscriptions.length} active subscriptions`)

    let processedCount = 0
    let errorCount = 0
    const results: { userId: string; planName: string; credits: number; success: boolean }[] = []

    // 각 구독자에게 크레딧 지급
    for (const subscription of activeSubscriptions) {
      try {
        const creditsToGrant = subscription.plan.monthly_credits

        // 크레딧 지급
        await prisma.profiles.update({
          where: { id: subscription.user_id },
          data: {
            credits: { increment: creditsToGrant },
          },
        })

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
