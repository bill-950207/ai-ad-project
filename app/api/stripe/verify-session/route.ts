/**
 * Stripe Checkout Session 검증 API
 *
 * POST: 결제 완료 후 세션을 검증하고, webhook이 아직 처리하지 않은 경우
 *       Stripe에서 직접 구독 정보를 가져와 DB에 동기화합니다.
 *
 * 이 엔드포인트는 webhook의 레이스 컨디션을 해결합니다:
 * - 사용자가 결제 완료 후 리다이렉트되었지만 webhook이 아직 미도착
 * - webhook이 실패하여 구독이 DB에 반영되지 않은 경우
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { plan_type } from '@/lib/generated/prisma/client'
import { recordSubscriptionCredit } from '@/lib/credits/history'
import { applyRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

// Rate Limit: 분당 10회
const VERIFY_RATE_LIMIT = {
  interval: 60 * 1000,
  maxRequests: 10,
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate Limit 체크
    const rateLimitResult = applyRateLimit(`verify-session:${user.id}`, VERIFY_RATE_LIMIT)
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult.reset)
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { sessionId } = body as { sessionId: string }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Stripe에서 세션 정보를 먼저 가져와서 subscription ID 확인
    // (기존 구독과 새 구독을 비교하기 위해 필요)

    // Stripe에서 세션 정보 가져오기
    let session
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId)
    } catch {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      )
    }

    // 세션 소유자 확인 (metadata.userId가 현재 사용자와 일치하는지)
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      )
    }

    // 결제 완료 상태 확인
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        verified: false,
        reason: 'Payment not completed',
        paymentStatus: session.payment_status,
      })
    }

    // 구독 ID 확인
    const stripeSubscriptionId = session.subscription as string
    if (!stripeSubscriptionId) {
      return NextResponse.json({
        verified: false,
        reason: 'No subscription in session',
      })
    }

    // Stripe 구독 정보 가져오기
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subData = stripeSubscription as any

    const priceId = subData.items?.data?.[0]?.price?.id
    const planInfo = getPlanFromPriceId(priceId)

    if (!planInfo) {
      console.error('verify-session: Unknown price ID:', priceId)
      return NextResponse.json(
        { error: 'Unknown plan' },
        { status: 400 }
      )
    }

    // DB에서 플랜 레코드 조회
    const planRecord = await prisma.plans.findUnique({
      where: { name: planInfo.plan as plan_type },
    })

    if (!planRecord) {
      console.error('verify-session: Plan not found:', planInfo.plan)
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 400 }
      )
    }

    // 기간 정보 추출
    const periodStart = subData.current_period_start || Math.floor(Date.now() / 1000)
    const periodEnd = subData.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

    // 이미 이 stripe_subscription_id로 구독이 존재하는지 확인
    // (webhook이 이미 처리했지만 다른 사용자의 기존 구독 레코드가 업데이트되지 않은 경우)
    const existingByStripeId = await prisma.subscriptions.findFirst({
      where: { stripe_subscription_id: stripeSubscriptionId },
    })

    if (existingByStripeId && existingByStripeId.user_id === user.id) {
      // webhook이 이미 처리한 경우
      return NextResponse.json({
        verified: true,
        alreadySynced: true,
        planType: planInfo.plan,
      })
    }

    // DB에 구독 동기화 (webhook이 아직 처리하지 않은 경우)
    await prisma.subscriptions.upsert({
      where: { user_id: user.id },
      update: {
        plan_id: planRecord.id,
        status: 'ACTIVE',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subData.id,
        current_period_start: new Date(periodStart * 1000),
        current_period_end: new Date(periodEnd * 1000),
        cancel_at_period_end: subData.cancel_at_period_end ?? false,
        canceled_at: null,
      },
      create: {
        user_id: user.id,
        plan_id: planRecord.id,
        status: 'ACTIVE',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subData.id,
        current_period_start: new Date(periodStart * 1000),
        current_period_end: new Date(periodEnd * 1000),
        cancel_at_period_end: subData.cancel_at_period_end ?? false,
      },
    })

    // 크레딧 지급 (중복 방지: 이미 크레딧이 지급되었는지 확인)
    const creditAlreadyGranted = await prisma.credit_history.findFirst({
      where: {
        user_id: user.id,
        transaction_type: 'SUBSCRIPTION',
        description: { contains: '구독 시작 크레딧' },
        created_at: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5분 이내
      },
    })

    if (!creditAlreadyGranted) {
      await prisma.$transaction(async (tx) => {
        const currentProfile = await tx.profiles.findUnique({
          where: { id: user.id },
          select: { credits: true },
        })

        const currentCredits = currentProfile?.credits ?? 0
        const balanceAfter = currentCredits + planRecord.monthly_credits

        await tx.profiles.update({
          where: { id: user.id },
          data: { credits: { increment: planRecord.monthly_credits } },
        })

        await recordSubscriptionCredit({
          userId: user.id,
          amount: planRecord.monthly_credits,
          balanceAfter,
          description: `${planRecord.display_name || planInfo.plan} 구독 시작 크레딧`,
        }, tx)
      })
    }

    console.log(`verify-session: Subscription synced for user ${user.id}, plan: ${planInfo.plan}`)

    return NextResponse.json({
      verified: true,
      alreadySynced: false,
      planType: planInfo.plan,
    })
  } catch (error) {
    console.error('verify-session error:', error)
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}
