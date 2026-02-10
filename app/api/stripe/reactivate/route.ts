/**
 * Stripe 구독 재활성화 API
 *
 * POST: 취소 예정인 구독을 다시 활성화 (cancel_at_period_end를 false로)
 *
 * 트랜잭션 패턴: DB 먼저 업데이트 → Stripe 호출 → 실패 시 DB 롤백
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { applyRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { invalidateUserSubscription } from '@/lib/subscription/cache'

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

    // 이미 취소된 구독은 재활성화 불가 (새로 구독해야 함)
    if (subscription.status === 'CANCELED' || subscription.canceled_at !== null) {
      return NextResponse.json(
        { error: 'Subscription has been canceled. Please subscribe again.' },
        { status: 400 }
      )
    }

    // 취소 예정이 아닌 경우
    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      )
    }

    // 트랜잭션 패턴: DB 먼저 업데이트 (낙관적)
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { cancel_at_period_end: false },
    })

    try {
      // Stripe에서 구독 재활성화 (cancel_at_period_end를 false로)
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false,
      })
    } catch (stripeError) {
      // Stripe 실패 시 DB 롤백
      console.error('Stripe subscription reactivate failed, rolling back DB:', stripeError)
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: { cancel_at_period_end: true },
      })
      throw stripeError
    }

    // 구독 캐시 무효화
    invalidateUserSubscription(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription reactivate error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}
