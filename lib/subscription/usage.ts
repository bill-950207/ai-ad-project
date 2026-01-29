/**
 * 슬롯 사용량 유틸리티
 *
 * avatar_limit/music_limit/product_limit은 슬롯 제한(동시 보유 가능 개수)
 * 월간 생성 횟수 제한이 아님 - 크레딧이 있으면 무제한 생성 가능
 * 실제 보유 수량은 DB COUNT로 확인
 */

import { prisma } from '@/lib/db'
import { getUserPlan } from './queries'

export type SlotType = 'avatar' | 'music' | 'product'

export interface SlotCheckResult {
  withinLimit: boolean
  used: number
  limit: number  // -1 = 무제한
  remaining: number  // -1 = 무제한
}

export interface SlotSummary {
  avatars: { used: number; limit: number }
  music: { used: number; limit: number }
  products: { used: number; limit: number }
}

/**
 * 사용자의 실제 보유 수량 조회 (DB COUNT)
 */
async function getActualCounts(userId: string) {
  const [avatarCount, musicCount, productCount] = await Promise.all([
    prisma.avatars.count({ where: { user_id: userId } }),
    prisma.ad_music.count({ where: { user_id: userId } }),
    prisma.ad_products.count({ where: { user_id: userId } }),
  ])

  return {
    avatar_count: avatarCount,
    music_count: musicCount,
    product_count: productCount,
  }
}

/**
 * 슬롯 제한 확인
 * @returns withinLimit이 true면 슬롯 여유 있음, false면 슬롯 부족
 */
export async function checkSlotLimit(
  userId: string,
  type: SlotType
): Promise<SlotCheckResult> {
  const [plan, counts] = await Promise.all([
    getUserPlan(userId),
    getActualCounts(userId),
  ])

  let used: number
  let limit: number

  switch (type) {
    case 'avatar':
      used = counts.avatar_count
      limit = plan.avatarLimit
      break
    case 'music':
      used = counts.music_count
      limit = plan.musicLimit
      break
    case 'product':
      used = counts.product_count
      limit = plan.productLimit
      break
    default:
      throw new Error(`Unknown slot type: ${type}`)
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
  }
}

/**
 * 전체 슬롯 사용량 요약
 */
export async function getSlotSummary(userId: string): Promise<SlotSummary> {
  const [plan, counts] = await Promise.all([
    getUserPlan(userId),
    getActualCounts(userId),
  ])

  return {
    avatars: {
      used: counts.avatar_count,
      limit: plan.avatarLimit,
    },
    music: {
      used: counts.music_count,
      limit: plan.musicLimit,
    },
    products: {
      used: counts.product_count,
      limit: plan.productLimit,
    },
  }
}

// Backward compatibility aliases
export type UsageType = SlotType
export type UsageCheckResult = SlotCheckResult
export type UsageSummary = SlotSummary & { credits: { used: number; limit: number }; period: string }
export const checkUsageLimit = checkSlotLimit
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const [plan, summary] = await Promise.all([
    getUserPlan(userId),
    getSlotSummary(userId),
  ])

  return {
    ...summary,
    credits: {
      used: 0, // 크레딧 사용량은 별도 추적 필요시 구현
      limit: plan.monthlyCredits,
    },
    period: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
    }),
  }
}

// incrementUsage는 더 이상 필요 없음 - 실제 아이템 생성/삭제가 DB COUNT에 반영됨
// resetUsage도 더 이상 필요 없음 - 슬롯 제한은 리셋 개념이 없음
