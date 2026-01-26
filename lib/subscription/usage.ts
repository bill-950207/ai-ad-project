/**
 * 사용량 추적 유틸리티
 */

import { prisma } from '@/lib/db'
import { getUserPlan } from './queries'
import {
  AVATAR_CREDIT_COST,
  MUSIC_CREDIT_COST,
} from '@/lib/credits'

export type UsageType = 'avatar' | 'music' | 'product'

export interface UsageCheckResult {
  withinLimit: boolean
  used: number
  limit: number  // -1 = 무제한
  remaining: number  // -1 = 무제한
  creditCost?: number  // 제한 초과 시 필요한 크레딧
}

export interface UsageSummary {
  avatars: { used: number; limit: number }
  music: { used: number; limit: number }
  products: { used: number; limit: number }
  period: string
}

/**
 * 현재 월의 시작일 계산
 */
function getCurrentPeriodStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

/**
 * 사용자의 현재 월 사용량 조회 또는 생성
 */
async function getOrCreateUsageTracking(userId: string) {
  const period = getCurrentPeriodStart()

  let usage = await prisma.usage_tracking.findUnique({
    where: {
      user_id_period: {
        user_id: userId,
        period,
      },
    },
  })

  if (!usage) {
    usage = await prisma.usage_tracking.create({
      data: {
        user_id: userId,
        period,
        avatar_count: 0,
        music_count: 0,
        product_count: 0,
      },
    })
  }

  return usage
}

/**
 * 사용량 제한 확인
 * @returns withinLimit이 true면 무료 생성 가능, false면 크레딧 필요
 */
export async function checkUsageLimit(
  userId: string,
  type: UsageType
): Promise<UsageCheckResult> {
  const [plan, usage] = await Promise.all([
    getUserPlan(userId),
    getOrCreateUsageTracking(userId),
  ])

  let used: number
  let limit: number
  let creditCost: number

  switch (type) {
    case 'avatar':
      used = usage.avatar_count
      limit = plan.avatarLimit
      creditCost = AVATAR_CREDIT_COST
      break
    case 'music':
      used = usage.music_count
      limit = plan.musicLimit
      creditCost = MUSIC_CREDIT_COST
      break
    case 'product':
      used = usage.product_count
      limit = plan.productLimit
      creditCost = 0  // 제품 등록은 초과 시 불가 (크레딧으로 추가 불가)
      break
    default:
      throw new Error(`Unknown usage type: ${type}`)
  }

  // -1은 무제한
  if (limit === -1) {
    return {
      withinLimit: true,
      used,
      limit: -1,
      remaining: -1,
    }
  }

  const remaining = Math.max(0, limit - used)
  const withinLimit = used < limit

  return {
    withinLimit,
    used,
    limit,
    remaining,
    creditCost: withinLimit ? undefined : creditCost,
  }
}

/**
 * 사용량 증가
 */
export async function incrementUsage(
  userId: string,
  type: UsageType
): Promise<void> {
  const period = getCurrentPeriodStart()

  // upsert로 레코드가 없으면 생성하면서 증가
  const updateField = {
    avatar: { avatar_count: { increment: 1 } },
    music: { music_count: { increment: 1 } },
    product: { product_count: { increment: 1 } },
  }[type]

  await prisma.usage_tracking.upsert({
    where: {
      user_id_period: {
        user_id: userId,
        period,
      },
    },
    update: updateField,
    create: {
      user_id: userId,
      period,
      avatar_count: type === 'avatar' ? 1 : 0,
      music_count: type === 'music' ? 1 : 0,
      product_count: type === 'product' ? 1 : 0,
    },
  })
}

/**
 * 현재 월 전체 사용량 요약
 */
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const [plan, usage] = await Promise.all([
    getUserPlan(userId),
    getOrCreateUsageTracking(userId),
  ])

  // 기간 문자열 포맷
  const periodStart = getCurrentPeriodStart()
  const periodString = periodStart.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  return {
    avatars: {
      used: usage.avatar_count,
      limit: plan.avatarLimit,
    },
    music: {
      used: usage.music_count,
      limit: plan.musicLimit,
    },
    products: {
      used: usage.product_count,
      limit: plan.productLimit,
    },
    period: periodString,
  }
}

/**
 * 월간 사용량 리셋 (cron 또는 webhook에서 호출)
 * 새 월이 시작되면 자동으로 새 레코드가 생성되므로 특별한 처리 불필요
 * 이 함수는 필요시 수동 리셋용
 */
export async function resetUsage(userId: string): Promise<void> {
  const period = getCurrentPeriodStart()

  await prisma.usage_tracking.upsert({
    where: {
      user_id_period: {
        user_id: userId,
        period,
      },
    },
    update: {
      avatar_count: 0,
      music_count: 0,
      product_count: 0,
    },
    create: {
      user_id: userId,
      period,
      avatar_count: 0,
      music_count: 0,
      product_count: 0,
    },
  })
}
