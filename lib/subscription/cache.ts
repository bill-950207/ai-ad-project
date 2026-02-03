/**
 * 구독/요금제 데이터 캐싱
 *
 * - 플랜 목록: 인메모리 캐시 (5분 TTL) - 거의 변경되지 않음
 * - 사용자 구독: unstable_cache (5분 TTL) - 사용자별 데이터
 */

import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/db'
import { plan_type } from '@/lib/generated/prisma/client'

// 캐시 TTL (5분)
const CACHE_TTL = 300

// 인메모리 플랜 캐시
let plansCache: {
  data: Awaited<ReturnType<typeof prisma.plans.findMany>> | null
  timestamp: number
} = {
  data: null,
  timestamp: 0,
}

/**
 * 모든 플랜 조회 (인메모리 캐시)
 */
export async function getCachedAllPlans() {
  const now = Date.now()
  const isExpired = now - plansCache.timestamp > CACHE_TTL * 1000

  if (!plansCache.data || isExpired) {
    plansCache.data = await prisma.plans.findMany({
      orderBy: { price_monthly: 'asc' },
    })
    plansCache.timestamp = now
  }

  return plansCache.data
}

/**
 * 플랜 타입으로 조회 (인메모리 캐시)
 */
export async function getCachedPlanByType(planType: plan_type) {
  const plans = await getCachedAllPlans()
  return plans.find(p => p.name === planType) || null
}

/**
 * 사용자 구독 캐시 태그
 */
export function getUserSubscriptionTag(userId: string): string {
  return `user-subscription-${userId}`
}

/**
 * 사용자 구독 캐시 무효화
 */
export function invalidateUserSubscription(userId: string): void {
  revalidateTag(getUserSubscriptionTag(userId))
}

/**
 * 사용자 구독 조회 (캐싱됨)
 */
export function getCachedUserSubscription(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.subscriptions.findUnique({
        where: { user_id: userId },
        include: { plan: true },
      })
    },
    [`subscription-${userId}`],
    {
      revalidate: CACHE_TTL,
      tags: [getUserSubscriptionTag(userId)]
    }
  )()
}

/**
 * 플랜 캐시 강제 갱신 (관리자용)
 */
export function invalidatePlansCache(): void {
  plansCache.data = null
  plansCache.timestamp = 0
}
