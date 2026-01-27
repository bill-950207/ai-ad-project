/**
 * Stripe 구독 재활성화 API
 *
 * POST: 취소 예정인 구독을 다시 활성화 (cancel_at_period_end를 false로)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // 취소 예정이 아닌 경우
    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      )
    }

    // Stripe에서 구독 재활성화 (cancel_at_period_end를 false로)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    // DB 업데이트
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { cancel_at_period_end: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription reactivate error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}
