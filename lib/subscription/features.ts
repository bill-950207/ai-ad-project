/**
 * 플랜별 프리미엄 기능 확인 유틸리티
 */

import { getUserPlan } from './queries'

export interface PlanFeatures {
  keyframeCount: number  // 1 또는 2
  watermarkFree: boolean
  hdUpscale: boolean
}

/**
 * 사용자의 플랜에서 사용 가능한 프리미엄 기능 조회
 */
export async function getPlanFeatures(userId: string): Promise<PlanFeatures> {
  const plan = await getUserPlan(userId)

  return {
    keyframeCount: plan.keyframeCount,
    watermarkFree: plan.watermarkFree,
    hdUpscale: plan.hdUpscale,
  }
}

/**
 * 키프레임 생성 개수 확인
 */
export async function getKeyframeCount(userId: string): Promise<number> {
  const plan = await getUserPlan(userId)
  return plan.keyframeCount
}

/**
 * 워터마크 제거 가능 여부 확인
 */
export async function canRemoveWatermark(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return plan.watermarkFree
}

/**
 * HD 업스케일 가능 여부 확인
 */
export async function canUseHdUpscale(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return plan.hdUpscale
}
