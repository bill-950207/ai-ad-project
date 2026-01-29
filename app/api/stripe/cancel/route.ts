/**
 * Stripe 구독 취소 API
 *
 * POST: 현재 구독을 기간 종료 시 취소 예약
 *
 * 트랜잭션 패턴: DB 먼저 업데이트 → Stripe 호출 → 실패 시 DB 롤백
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { applyRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

// Stripe API Rate Limit: 분당 5회
const STRIPE_RATE_LIMIT = {
  interval: 60 * 1000,
  maxRequests: 5,
}

export async function POST() {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate Limit 체크
    const rateLimitResult = applyRateLimit(`stripe:${user.id}`, STRIPE_RATE_LIMIT)
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult.reset)
    }

    // 현재 구독 조회
    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: user.id },
    })

    if (!subscription || !subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // 이미 취소된 구독인 경우 (Soft Delete)
    if (subscription.status === 'CANCELED' || subscription.canceled_at !== null) {
      return NextResponse.json(
        { error: 'Subscription has already been canceled' },
        { status: 400 }
      )
    }

    // 이미 취소 예정인 경우
    if (subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is already scheduled for cancellation' },
        { status: 400 }
      )
    }

    // 트랜잭션 패턴: DB 먼저 업데이트 (낙관적)
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { cancel_at_period_end: true },
    })

    try {
      // Stripe에서 구독 취소 (기간 종료 시)
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    } catch (stripeError) {
      // Stripe 실패 시 DB 롤백
      console.error('Stripe subscription cancel failed, rolling back DB:', stripeError)
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: { cancel_at_period_end: false },
      })
      throw stripeError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription cancel error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
