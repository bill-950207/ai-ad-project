/**
 * 관리자 구독 동기화 API
 *
 * 결제가 완료되었지만 webhook 실패로 DB에 구독이 반영되지 않은 사용자를 복구합니다.
 *
 * GET: Stripe의 활성 구독 목록과 DB를 비교하여 누락된 구독을 조회
 * POST: 누락된 구독을 DB에 동기화하고 크레딧 지급
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { checkAdminRole } from '@/lib/auth/admin'
import { plan_type } from '@/lib/generated/prisma/client'
import { recordSubscriptionCredit } from '@/lib/credits/history'

/**
 * GET: 누락된 구독 목록 조회 (미리보기)
 *
 * Stripe에서 활성 구독을 조회하고, DB에 없는 것들을 반환합니다.
 */
export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminRole()
    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    // Stripe에서 활성 구독 전체 조회
    const stripeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    })

    const missing: Array<{
      stripeSubscriptionId: string
      stripeCustomerId: string
      userId: string | null
      email: string | null
      plan: string | null
      status: string
      reason: string
    }> = []

    for (const sub of stripeSubscriptions.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subData = sub as any
      const userId = subData.metadata?.userId

      if (!userId) {
        // metadata에 userId가 없으면 customer에서 찾기
        const customer = await stripe.customers.retrieve(sub.customer as string)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customerData = customer as any
        missing.push({
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          userId: customerData.metadata?.userId || null,
          email: customerData.email || null,
          plan: null,
          status: 'no_metadata',
          reason: 'subscription metadata에 userId 없음',
        })
        continue
      }

      // DB에 이 구독이 있는지 확인
      const dbSubscription = await prisma.subscriptions.findUnique({
        where: { user_id: userId },
      })

      if (!dbSubscription) {
        // DB에 구독 레코드 자체가 없음
        const priceId = subData.items?.data?.[0]?.price?.id
        const planInfo = getPlanFromPriceId(priceId)
        missing.push({
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          userId,
          email: null,
          plan: planInfo?.plan || `unknown (${priceId})`,
          status: 'missing',
          reason: 'DB에 구독 레코드 없음',
        })
      } else if (dbSubscription.status !== 'ACTIVE' || dbSubscription.canceled_at !== null) {
        // DB에 있지만 상태가 비활성
        const priceId = subData.items?.data?.[0]?.price?.id
        const planInfo = getPlanFromPriceId(priceId)
        missing.push({
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          userId,
          email: null,
          plan: planInfo?.plan || `unknown (${priceId})`,
          status: 'inactive',
          reason: `DB 상태: ${dbSubscription.status}, canceled_at: ${dbSubscription.canceled_at}`,
        })
      } else if (dbSubscription.stripe_subscription_id !== sub.id) {
        // Stripe ID 불일치
        const priceId = subData.items?.data?.[0]?.price?.id
        const planInfo = getPlanFromPriceId(priceId)
        missing.push({
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          userId,
          email: null,
          plan: planInfo?.plan || `unknown (${priceId})`,
          status: 'id_mismatch',
          reason: `DB stripe_subscription_id: ${dbSubscription.stripe_subscription_id}`,
        })
      }
    }

    return NextResponse.json({
      totalStripeActive: stripeSubscriptions.data.length,
      missingCount: missing.length,
      missing,
    })
  } catch (error) {
    console.error('sync-subscriptions GET error:', error)
    return NextResponse.json(
      { error: 'Failed to check subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * POST: 누락된 구독을 DB에 동기화
 *
 * body: { userIds?: string[] }
 * - userIds 지정 시: 해당 사용자만 동기화
 * - userIds 미지정 시: 모든 누락된 구독 동기화
 */
export async function POST(request: Request) {
  try {
    const { isAdmin, error } = await checkAdminRole()
    if (!isAdmin) {
      return NextResponse.json(
        { error: error || 'Forbidden' },
        { status: error === 'Unauthorized' ? 401 : 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const targetUserIds = (body as { userIds?: string[] }).userIds

    // Stripe에서 활성 구독 조회
    const stripeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    })

    const results: Array<{
      userId: string
      plan: string
      action: string
      creditsGranted: number
    }> = []

    const errors: Array<{
      stripeSubscriptionId: string
      error: string
    }> = []

    for (const sub of stripeSubscriptions.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subData = sub as any
      const userId = subData.metadata?.userId

      if (!userId) continue

      // 특정 사용자만 처리하는 경우
      if (targetUserIds && !targetUserIds.includes(userId)) continue

      // DB 상태 확인
      const dbSubscription = await prisma.subscriptions.findUnique({
        where: { user_id: userId },
      })

      const needsSync =
        !dbSubscription ||
        dbSubscription.status !== 'ACTIVE' ||
        dbSubscription.canceled_at !== null ||
        dbSubscription.stripe_subscription_id !== sub.id

      if (!needsSync) continue

      // 플랜 정보 가져오기
      const priceId = subData.items?.data?.[0]?.price?.id
      const planInfo = getPlanFromPriceId(priceId)

      if (!planInfo) {
        errors.push({
          stripeSubscriptionId: sub.id,
          error: `Unknown price ID: ${priceId}`,
        })
        continue
      }

      const planRecord = await prisma.plans.findUnique({
        where: { name: planInfo.plan as plan_type },
      })

      if (!planRecord) {
        errors.push({
          stripeSubscriptionId: sub.id,
          error: `Plan not found: ${planInfo.plan}`,
        })
        continue
      }

      try {
        // 기간 정보
        const periodStart = subData.current_period_start || Math.floor(Date.now() / 1000)
        const periodEnd = subData.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

        // 구독 동기화
        await prisma.subscriptions.upsert({
          where: { user_id: userId },
          update: {
            plan_id: planRecord.id,
            status: 'ACTIVE',
            stripe_customer_id: sub.customer as string,
            stripe_subscription_id: sub.id,
            current_period_start: new Date(periodStart * 1000),
            current_period_end: new Date(periodEnd * 1000),
            cancel_at_period_end: subData.cancel_at_period_end ?? false,
            canceled_at: null,
          },
          create: {
            user_id: userId,
            plan_id: planRecord.id,
            status: 'ACTIVE',
            stripe_customer_id: sub.customer as string,
            stripe_subscription_id: sub.id,
            current_period_start: new Date(periodStart * 1000),
            current_period_end: new Date(periodEnd * 1000),
            cancel_at_period_end: subData.cancel_at_period_end ?? false,
          },
        })

        // 크레딧 지급 여부 확인 (이미 지급된 경우 스킵)
        let creditsGranted = 0

        const existingCredit = await prisma.credit_history.findFirst({
          where: {
            user_id: userId,
            transaction_type: 'SUBSCRIPTION',
            description: { contains: '구독' },
            created_at: { gte: new Date(periodStart * 1000) },
          },
        })

        if (!existingCredit) {
          // 크레딧 지급
          await prisma.$transaction(async (tx) => {
            const profile = await tx.profiles.findUnique({
              where: { id: userId },
              select: { credits: true },
            })

            const currentCredits = profile?.credits ?? 0
            const balanceAfter = currentCredits + planRecord.monthly_credits

            await tx.profiles.update({
              where: { id: userId },
              data: { credits: { increment: planRecord.monthly_credits } },
            })

            await recordSubscriptionCredit({
              userId,
              amount: planRecord.monthly_credits,
              balanceAfter,
              description: `${planRecord.display_name || planInfo.plan} 구독 크레딧 (관리자 동기화)`,
            }, tx)
          })

          creditsGranted = planRecord.monthly_credits
        }

        results.push({
          userId,
          plan: planInfo.plan,
          action: dbSubscription ? 'updated' : 'created',
          creditsGranted,
        })
      } catch (err) {
        console.error(`Failed to sync subscription for user ${userId}:`, err)
        errors.push({
          stripeSubscriptionId: sub.id,
          error: `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
      }
    }

    console.log(`Admin sync-subscriptions: ${results.length} synced, ${errors.length} errors`)

    return NextResponse.json({
      synced: results.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('sync-subscriptions POST error:', error)
    return NextResponse.json(
      { error: 'Failed to sync subscriptions' },
      { status: 500 }
    )
  }
}
