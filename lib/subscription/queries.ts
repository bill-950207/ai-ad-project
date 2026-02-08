/**
 * 구독 조회 유틸리티
 */

import { prisma } from '@/lib/db'
import { plan_type } from '@/lib/generated/prisma/client'
import { isAdminUser } from '@/lib/auth/admin'

export interface UserPlan {
  planType: plan_type
  displayName: string
  avatarLimit: number
  musicLimit: number
  productLimit: number
  monthlyCredits: number
  keyframeCount: number
  watermarkFree: boolean
  hdUpscale: boolean
}

export interface UserSubscription extends UserPlan {
  subscriptionId: string | null
  status: string
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

// Free 플랜 기본값
const FREE_PLAN: UserPlan = {
  planType: plan_type.FREE,
  displayName: 'Free',
  avatarLimit: 3,
  musicLimit: 5,
  productLimit: 3,
  monthlyCredits: 15, // 가입 시 1회 지급
  keyframeCount: 1,
  watermarkFree: false,
  hdUpscale: false,
}

/**
 * 유효한 구독 상태인지 확인
 * ACTIVE 또는 TRIALING 상태이고, canceled_at이 null인 경우에만 유효
 */
function isValidSubscription(subscription: { status: string; canceled_at: Date | null }): boolean {
  const validStatuses = ['ACTIVE', 'TRIALING']
  return validStatuses.includes(subscription.status) && subscription.canceled_at === null
}

// 어드민 전용 무제한 플랜
const ADMIN_PLAN: UserPlan = {
  planType: plan_type.BUSINESS,
  displayName: 'Admin',
  avatarLimit: -1,
  musicLimit: -1,
  productLimit: -1,
  monthlyCredits: 999999,
  keyframeCount: 10,
  watermarkFree: true,
  hdUpscale: true,
}

/**
 * 사용자의 현재 플랜 정보 조회
 * 어드민은 무제한 플랜 반환
 * 구독이 없거나 취소된 경우 Free 플랜 반환
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  // 어드민은 무제한
  if (await isAdminUser(userId)) {
    return ADMIN_PLAN
  }

  const subscription = await prisma.subscriptions.findUnique({
    where: { user_id: userId },
    include: { plan: true },
  })

  // 구독이 없거나, 유효하지 않은 상태(CANCELED, PAST_DUE 등)이면 Free 플랜
  if (!subscription || !isValidSubscription(subscription)) {
    return FREE_PLAN
  }

  return {
    planType: subscription.plan.name,
    displayName: subscription.plan.display_name,
    avatarLimit: subscription.plan.avatar_limit,
    musicLimit: subscription.plan.music_limit,
    productLimit: subscription.plan.product_limit,
    monthlyCredits: subscription.plan.monthly_credits,
    keyframeCount: subscription.plan.keyframe_count,
    watermarkFree: subscription.plan.watermark_free,
    hdUpscale: subscription.plan.hd_upscale,
  }
}

/**
 * 사용자의 전체 구독 정보 조회
 * 취소된 구독도 메타데이터는 반환 (UI에서 "취소됨" 표시용)
 * 단, 플랜 기능은 Free 플랜으로 제한됨
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const subscription = await prisma.subscriptions.findUnique({
    where: { user_id: userId },
    include: { plan: true },
  })

  // 구독이 없으면 Free 플랜
  if (!subscription) {
    return {
      ...FREE_PLAN,
      subscriptionId: null,
      status: 'ACTIVE', // Free 플랜은 항상 활성
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    }
  }

  // 취소된 구독(CANCELED 또는 canceled_at 존재)이면 Free 플랜 기능 + 구독 메타데이터
  if (!isValidSubscription(subscription)) {
    return {
      ...FREE_PLAN,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeCustomerId: subscription.stripe_customer_id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
    }
  }

  // 유효한 구독
  return {
    planType: subscription.plan.name,
    displayName: subscription.plan.display_name,
    avatarLimit: subscription.plan.avatar_limit,
    musicLimit: subscription.plan.music_limit,
    productLimit: subscription.plan.product_limit,
    monthlyCredits: subscription.plan.monthly_credits,
    keyframeCount: subscription.plan.keyframe_count,
    watermarkFree: subscription.plan.watermark_free,
    hdUpscale: subscription.plan.hd_upscale,
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    stripeCustomerId: subscription.stripe_customer_id,
    stripeSubscriptionId: subscription.stripe_subscription_id,
  }
}

/**
 * 플랜 ID로 플랜 정보 조회
 */
export async function getPlanById(planId: string) {
  return prisma.plans.findUnique({
    where: { id: planId },
  })
}

/**
 * 플랜 타입으로 플랜 정보 조회
 */
export async function getPlanByType(planType: plan_type) {
  return prisma.plans.findUnique({
    where: { name: planType },
  })
}

/**
 * 모든 플랜 조회
 */
export async function getAllPlans() {
  return prisma.plans.findMany({
    orderBy: { price_monthly: 'asc' },
  })
}
