/**
 * 월간 크레딧 지급 백업 API (수동 실행용)
 *
 * ⚠️ 주의: 일반적인 크레딧 지급은 Stripe 웹훅(invoice.payment_succeeded)에서 처리됩니다.
 * 이 API는 웹훅 실패 시 수동 복구용으로만 사용하세요.
 *
 * 사용 사례:
 * - Stripe 웹훅 장애로 크레딧이 누락된 경우
 * - 데이터 마이그레이션 후 일괄 지급이 필요한 경우
 *
 * 참고: avatar_limit/music_limit/product_limit은 슬롯 제한(동시 보유 가능 개수)이므로
 * 월간 리셋 대상이 아님. 실제 보유 수량은 DB COUNT로 확인.
 *
 * 스케줄: 없음 (수동 실행만)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subscription_status } from '@/lib/generated/prisma/client'
import { recordSubscriptionCredit } from '@/lib/credits/history'

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
      select: {
        user_id: true,
        plan: {
          select: {
            monthly_credits: true,
            display_name: true,
          },
        },
      },
    })

    console.log(`Cron: Found ${activeSubscriptions.length} active subscriptions`)

    // 배치 트랜잭션으로 모든 구독자에게 크레딧 지급 (N+1 쿼리 방지)
    // 기존: N명 = N+1 쿼리 (1 SELECT + N UPDATE)
    // 개선: N명 = 1 트랜잭션 (모든 UPDATE를 하나의 트랜잭션으로)
    const results: { userId: string; planName: string; credits: number; success: boolean }[] =
      activeSubscriptions.map((subscription) => ({
        userId: subscription.user_id,
        planName: subscription.plan.display_name,
        credits: subscription.plan.monthly_credits,
        success: true, // 트랜잭션 성공 시 모두 성공
      }))

    let processedCount = 0
    let errorCount = 0

    try {
      // 모든 업데이트를 단일 트랜잭션으로 실행 (타임아웃 60초 - 히스토리 기록 포함)
      await prisma.$transaction(
        async (tx) => {
          for (const subscription of activeSubscriptions) {
            // 현재 잔액 조회
            const currentProfile = await tx.profiles.findUnique({
              where: { id: subscription.user_id },
              select: { credits: true },
            })

            const currentCredits = currentProfile?.credits ?? 0
            const balanceAfter = currentCredits + subscription.plan.monthly_credits

            // 크레딧 지급
            await tx.profiles.update({
              where: { id: subscription.user_id },
              data: { credits: { increment: subscription.plan.monthly_credits } },
            })

            // 크레딧 히스토리 기록
            await recordSubscriptionCredit({
              userId: subscription.user_id,
              amount: subscription.plan.monthly_credits,
              balanceAfter,
              description: `${subscription.plan.display_name} 월간 구독 크레딧 (수동 복구)`,
            }, tx)
          }
        },
        { timeout: 60000 }
      )
      processedCount = activeSubscriptions.length

      // 로그 출력
      for (const result of results) {
        console.log(
          `Cron: Granted ${result.credits} credits to user ${result.userId} (${result.planName})`
        )
      }
    } catch (error) {
      // 트랜잭션 실패 시 모든 결과를 실패로 표시
      errorCount = activeSubscriptions.length
      for (const result of results) {
        result.success = false
        result.credits = 0
      }
      console.error('Cron: Batch transaction failed:', error)
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
