/**
 * Stripe Checkout API
 *
 * POST: Checkout 세션 생성 (구독 결제 페이지로 리디렉션)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { stripe, getStripePriceId, type PlanName, type BillingInterval } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { plan, interval } = body as {
      plan: PlanName
      interval: BillingInterval
    }

    // 필수 파라미터 검증
    if (!plan || !interval) {
      return NextResponse.json(
        { error: 'Plan and interval are required' },
        { status: 400 }
      )
    }

    // Stripe Price ID 가져오기
    const priceId = getStripePriceId(plan, interval)
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan or price not configured' },
        { status: 400 }
      )
    }

    // 기존 Stripe Customer ID 확인
    const subscription = await prisma.subscriptions.findUnique({
      where: { user_id: user.id },
    })

    let customerId = subscription?.stripe_customer_id

    // Customer가 없으면 새로 생성
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id
    }

    // Checkout 세션 생성
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
          interval,
        },
      },
      metadata: {
        userId: user.id,
        plan,
        interval,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
