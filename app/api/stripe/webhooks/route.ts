/**
 * Stripe Webhooks API
 *
 * POST: Stripe 웹훅 이벤트 처리
 *
 * 처리 이벤트:
 * - checkout.session.completed: 구독 시작
 * - customer.subscription.updated: 플랜 변경
 * - customer.subscription.deleted: 구독 취소
 * - invoice.payment_succeeded: 결제 성공 (월 크레딧 지급)
 * - invoice.payment_failed: 결제 실패
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { plan_type, subscription_status } from '@/lib/generated/prisma/client'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// =====================================================
// 이벤트 중복 처리 방지 (멱등성)
// =====================================================
const processedEvents = new Map<string, number>()
const MAX_CACHE_SIZE = 1000
const EVENT_TTL = 60 * 60 * 1000 // 1시간

function isEventProcessed(eventId: string): boolean {
  const timestamp = processedEvents.get(eventId)
  if (!timestamp) return false
  if (Date.now() - timestamp > EVENT_TTL) {
    processedEvents.delete(eventId)
    return false
  }
  return true
}

function markEventProcessed(eventId: string): void {
  // 캐시 크기 제한 - 가장 오래된 항목 제거
  if (processedEvents.size >= MAX_CACHE_SIZE) {
    const oldestKey = processedEvents.keys().next().value
    if (oldestKey) processedEvents.delete(oldestKey)
  }
  processedEvents.set(eventId, Date.now())
}

// 주기적 캐시 정리 (만료된 항목 제거)
function cleanupExpiredEvents(): void {
  const now = Date.now()
  const keysToDelete: string[] = []
  processedEvents.forEach((timestamp, eventId) => {
    if (now - timestamp > EVENT_TTL) {
      keysToDelete.push(eventId)
    }
  })
  keysToDelete.forEach((key) => processedEvents.delete(key))
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

    // 중복 이벤트 검사 (멱등성)
    if (isEventProcessed(event.id)) {
      console.log(`Event already processed: ${event.id}`)
      return NextResponse.json({ received: true, duplicate: true })
    }
    markEventProcessed(event.id)

    // 주기적으로 만료된 이벤트 정리 (10% 확률로 실행)
    if (Math.random() < 0.1) {
      cleanupExpiredEvents()
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

  // 구독 생성 또는 업데이트
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

  // 첫 결제 시 월 크레딧 지급
  await prisma.profiles.update({
    where: { id: userId },
    data: {
      credits: { increment: planRecord.monthly_credits },
    },
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
  if (subData.status === 'canceled') {
    status = 'CANCELED'
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
    },
  })

  console.log(`Subscription updated: ${subData.id}, status: ${status}`)
}

/**
 * 구독 삭제 처리 - Free 플랜으로 다운그레이드
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

  // 구독 레코드 삭제 (Free 플랜으로 자동 전환)
  await prisma.subscriptions.delete({
    where: { id: existingSubscription.id },
  })

  console.log(`Subscription deleted: ${subData.id}, user downgraded to FREE`)
}

/**
 * 결제 성공 처리 - 로깅만 (크레딧은 Cron에서 매월 1일 일괄 지급)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any

  // 첫 결제는 checkout.session.completed에서 처리하므로 스킵
  if (invoiceData.billing_reason === 'subscription_create') {
    return
  }

  // 구독 갱신 결제인 경우 로깅
  if (invoiceData.billing_reason === 'subscription_cycle') {
    const subscriptionId = invoiceData.subscription as string
    console.log(
      `Subscription renewed: ${subscriptionId}. Monthly credits will be distributed via Cron on the 1st.`
    )
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

  console.log(`Payment failed for subscription: ${subscriptionId}`)
}
