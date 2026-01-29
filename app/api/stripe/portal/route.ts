/**
 * Stripe Customer Portal API
 *
 * POST: Customer Portal 세션 생성 (구독 관리 페이지로 리디렉션)
 *
 * 조건: 활성 구독(ACTIVE 또는 TRIALING)이 있어야 함
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

    // 구독 정보에서 Stripe Customer ID 가져오기
    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: user.id },
    })

    // 구독이 없거나 Stripe Customer ID가 없는 경우
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // 취소된 구독(CANCELED 또는 canceled_at 존재)은 Portal 접근 불가
    const validStatuses = ['ACTIVE', 'TRIALING', 'PAST_DUE']
    if (!validStatuses.includes(subscription.status) || subscription.canceled_at !== null) {
      return NextResponse.json(
        { error: 'Subscription has been canceled. Please subscribe again to manage your billing.' },
        { status: 400 }
      )
    }

    // Customer Portal 세션 생성
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/dashboard/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
