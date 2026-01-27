/**
 * Stripe 구독 취소 API
 *
 * POST: 현재 구독을 기간 종료 시 취소 예약
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

    // Stripe에서 구독 취소 (기간 종료 시)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // DB 업데이트
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { cancel_at_period_end: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription cancel error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
