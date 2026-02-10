/**
 * Stripe Webhooks API
 *
 * POST: Stripe 웹훅 이벤트 처리
 *
 * 처리 이벤트:
 * - checkout.session.completed: 구독 시작
 * - customer.subscription.updated: 플랜 변경
 * - customer.subscription.deleted: 구독 취소 (Soft Delete)
 * - invoice.payment_succeeded: 결제 성공 (월 크레딧 지급)
 * - invoice.payment_failed: 결제 실패
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { plan_type, subscription_status } from '@/lib/generated/prisma/client'
import { recordSubscriptionCredit } from '@/lib/credits/history'
import { captureServerEvent } from '@/lib/analytics/posthog-server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { invalidateUserSubscription } from '@/lib/subscription/cache'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// =====================================================
// 이벤트 중복 처리 방지 (DB 기반 멱등성)
// =====================================================

/**
 * 이벤트가 이미 처리되었는지 확인 (DB 기반)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const existing = await prisma.webhook_events.findUnique({
      where: { id: eventId },
    })
    return !!existing
  } catch (error) {
    console.error('Error checking event processed status:', error)
    // 오류 발생 시 안전하게 false 반환 (중복 처리 허용)
    return false
  }
}

/**
 * 이벤트를 처리됨으로 표시 (DB에 기록)
 */
async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  try {
    await prisma.webhook_events.create({
      data: {
        id: eventId,
        event_type: eventType,
      },
    })
  } catch (error) {
    // 중복 삽입 시 무시 (이미 처리된 이벤트)
    console.error('Error marking event as processed:', error)
  }
}

/**
 * 오래된 이벤트 정리 (7일 이상)
 */
async function cleanupOldEvents(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const result = await prisma.webhook_events.deleteMany({
      where: {
        processed_at: { lt: sevenDaysAgo },
      },
    })
    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} old webhook events`)
    }
  } catch (error) {
    console.error('Error cleaning up old events:', error)
  }
}
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Webhook 서명 검증
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // 중복 이벤트 검사 (DB 기반 멱등성)
    if (await isEventProcessed(event.id)) {
      console.log(`Event already processed: ${event.id}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // 이벤트 처리됨으로 표시 (처리 전에 먼저 기록하여 중복 방지)
    await markEventProcessed(event.id, event.type)

    // 주기적으로 오래된 이벤트 정리 (10% 확률로 실행)
    if (Math.random() < 0.1) {
      // 비동기로 실행하여 응답 지연 방지
      cleanupOldEvents().catch(console.error)
    }

    // 이벤트 타입별 처리
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Checkout 완료 처리 - 새 구독 생성
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  // Stripe 구독 정보 가져오기
  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subData = stripeSubscription as any
  const priceId = subData.items?.data?.[0]?.price?.id
  const planInfo = getPlanFromPriceId(priceId)

  if (!planInfo) {
    console.error('Unknown price ID:', priceId)
    return
  }

  // DB에서 플랜 ID 조회
  const planRecord = await prisma.plans.findUnique({
    where: { name: planInfo.plan as plan_type },
  })

  if (!planRecord) {
    console.error('Plan not found:', planInfo.plan)
    return
  }

  // 기간 정보 추출 (Stripe API 버전에 따라 다를 수 있음)
  const periodStart = subData.current_period_start || subData.start_date || Math.floor(Date.now() / 1000)
  const periodEnd = subData.current_period_end || subData.ended_at || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  // 구독 생성 또는 업데이트 (재구독 시 canceled_at 초기화)
  await prisma.subscriptions.upsert({
    where: { user_id: userId },
    update: {
      plan_id: planRecord.id,
      status: 'ACTIVE',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subData.id,
      current_period_start: new Date(periodStart * 1000),
      current_period_end: new Date(periodEnd * 1000),
      cancel_at_period_end: subData.cancel_at_period_end ?? false,
      canceled_at: null,  // 재구독 시 초기화
    },
    create: {
      user_id: userId,
      plan_id: planRecord.id,
      status: 'ACTIVE',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subData.id,
      current_period_start: new Date(periodStart * 1000),
      current_period_end: new Date(periodEnd * 1000),
      cancel_at_period_end: subData.cancel_at_period_end ?? false,
    },
  })

  // 첫 결제 시 월 크레딧 지급 (중복 방지: verify-session에서 이미 지급했을 수 있음)
  const creditAlreadyGranted = await prisma.credit_history.findFirst({
    where: {
      user_id: userId,
      transaction_type: 'SUBSCRIPTION',
      description: { contains: '구독 시작 크레딧' },
      created_at: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5분 이내
    },
  })

  if (!creditAlreadyGranted) {
    await prisma.$transaction(async (tx) => {
      const currentProfile = await tx.profiles.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      const currentCredits = currentProfile?.credits ?? 0
      const balanceAfter = currentCredits + planRecord.monthly_credits

      await tx.profiles.update({
        where: { id: userId },
        data: { credits: { increment: planRecord.monthly_credits } },
      })

      // 구독 크레딧 히스토리 기록
      await recordSubscriptionCredit({
        userId,
        amount: planRecord.monthly_credits,
        balanceAfter,
        description: `${planRecord.display_name || planInfo.plan} 구독 시작 크레딧`,
      }, tx)
    })
  }

  // 구독 캐시 무효화
  invalidateUserSubscription(userId)

  captureServerEvent(userId, ANALYTICS_EVENTS.CHECKOUT_COMPLETED, {
    plan: planInfo.plan,
    user_id: userId,
  })

  console.log(`Subscription created for user ${userId}, plan: ${planInfo.plan}`)
}

/**
 * 구독 업데이트 처리 - 플랜 변경, 취소 예약 등
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subData = subscription as any

  const existingSubscription = await prisma.subscriptions.findFirst({
    where: { stripe_subscription_id: subData.id },
  })

  if (!existingSubscription) {
    console.error('Subscription not found:', subData.id)
    return
  }

  const priceId = subData.items?.data?.[0]?.price?.id
  const planInfo = getPlanFromPriceId(priceId)

  if (!planInfo) {
    console.error('Unknown price ID:', priceId)
    return
  }

  // 플랜 정보 조회
  const planRecord = await prisma.plans.findUnique({
    where: { name: planInfo.plan as plan_type },
  })

  if (!planRecord) {
    console.error('Plan not found:', planInfo.plan)
    return
  }

  // 상태 매핑
  let status: subscription_status = 'ACTIVE'
  let canceledAt: Date | null = null

  if (subData.status === 'canceled') {
    status = 'CANCELED'
    canceledAt = new Date()  // 취소 시간 기록
  } else if (subData.status === 'past_due') {
    status = 'PAST_DUE'
  } else if (subData.status === 'trialing') {
    status = 'TRIALING'
  }

  // 기간 정보 추출
  const periodStart = subData.current_period_start || Math.floor(Date.now() / 1000)
  const periodEnd = subData.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  // 구독 정보 업데이트
  await prisma.subscriptions.update({
    where: { id: existingSubscription.id },
    data: {
      plan_id: planRecord.id,
      status,
      current_period_start: new Date(periodStart * 1000),
      current_period_end: new Date(periodEnd * 1000),
      cancel_at_period_end: subData.cancel_at_period_end ?? false,
      // CANCELED 상태면 canceled_at 기록, 아니면 null로 초기화 (재활성화 시)
      canceled_at: canceledAt,
    },
  })

  // 구독 캐시 무효화
  invalidateUserSubscription(existingSubscription.user_id)

  console.log(`Subscription updated: ${subData.id}, status: ${status}`)
}

/**
 * 구독 삭제 처리 - Soft Delete (데이터 보존)
 *
 * 기존: 구독 레코드 완전 삭제
 * 변경: 상태를 CANCELED로 변경하고 canceled_at 기록
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subData = subscription as any

  const existingSubscription = await prisma.subscriptions.findFirst({
    where: { stripe_subscription_id: subData.id },
  })

  if (!existingSubscription) {
    console.error('Subscription not found:', subData.id)
    return
  }

  // Soft Delete: 상태 변경 + 취소 시간 기록 + Stripe 연결 해제
  await prisma.subscriptions.update({
    where: { id: existingSubscription.id },
    data: {
      status: 'CANCELED',
      canceled_at: new Date(),
      stripe_subscription_id: null,  // Stripe 연결 해제 (재구독 시 새 ID 사용)
    },
  })

  // 구독 캐시 무효화
  invalidateUserSubscription(existingSubscription.user_id)

  console.log(`Subscription soft-deleted: ${subData.id}, user downgraded to FREE`)
}

/**
 * 결제 성공 처리 - 구독 갱신 시 월간 크레딧 지급
 *
 * 각 구독자의 결제일(구독 시작일 기준)에 크레딧 지급
 * - 5일 구독자 → 매월 5일 결제 → 5일에 크레딧
 * - 15일 구독자 → 매월 15일 결제 → 15일에 크레딧
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any

  // 첫 결제는 checkout.session.completed에서 처리하므로 스킵
  if (invoiceData.billing_reason === 'subscription_create') {
    return
  }

  // 구독 갱신 결제인 경우 크레딧 지급
  if (invoiceData.billing_reason === 'subscription_cycle') {
    const subscriptionId = invoiceData.subscription as string

    try {
      // 구독 정보 조회 (플랜의 월간 크레딧 포함)
      const subscription = await prisma.subscriptions.findFirst({
        where: { stripe_subscription_id: subscriptionId },
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

      if (!subscription) {
        console.error(`Subscription not found for Stripe ID: ${subscriptionId}`)
        return
      }

      const creditsToGrant = subscription.plan.monthly_credits

      // 크레딧 지급 (트랜잭션으로 히스토리 기록)
      await prisma.$transaction(async (tx) => {
        const currentProfile = await tx.profiles.findUnique({
          where: { id: subscription.user_id },
          select: { credits: true },
        })

        const currentCredits = currentProfile?.credits ?? 0
        const balanceAfter = currentCredits + creditsToGrant

        await tx.profiles.update({
          where: { id: subscription.user_id },
          data: { credits: { increment: creditsToGrant } },
        })

        // 구독 갱신 크레딧 히스토리 기록
        await recordSubscriptionCredit({
          userId: subscription.user_id,
          amount: creditsToGrant,
          balanceAfter,
          description: `${subscription.plan.display_name} 월간 구독 크레딧 갱신`,
        }, tx)
      })

      console.log(
        `Subscription renewed: ${subscriptionId}. Granted ${creditsToGrant} credits to user ${subscription.user_id} (${subscription.plan.display_name})`
      )
    } catch (error) {
      console.error(`Failed to grant credits for subscription ${subscriptionId}:`, error)
      // 에러가 발생해도 웹훅은 성공으로 처리 (Stripe 재시도 방지)
      // 크론 작업이 백업으로 동작
    }
  }
}

/**
 * 결제 실패 처리 - 상태 업데이트
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any
  const subscriptionId = invoiceData.subscription as string

  await prisma.subscriptions.updateMany({
    where: { stripe_subscription_id: subscriptionId },
    data: { status: 'PAST_DUE' },
  })

  // 영향받는 사용자의 구독 캐시 무효화
  const failedSubscription = await prisma.subscriptions.findFirst({
    where: { stripe_subscription_id: subscriptionId },
    select: { user_id: true },
  })
  if (failedSubscription) {
    invalidateUserSubscription(failedSubscription.user_id)
  }

  console.log(`Payment failed for subscription: ${subscriptionId}`)
}
