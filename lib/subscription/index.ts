/**
 * 구독 시스템 모듈
 *
 * 사용량 추적, 플랜 조회, 프리미엄 기능 확인 유틸리티
 */

// 구독/플랜 조회
export {
  getUserPlan,
  getUserSubscription,
  getPlanById,
  getPlanByType,
  getAllPlans,
  type UserPlan,
  type UserSubscription,
} from './queries'

// 슬롯 사용량 (동시 보유 가능 개수 제한)
export {
  checkSlotLimit,
  getSlotSummary,
  // Backward compatibility
  checkUsageLimit,
  getUsageSummary,
  type SlotType,
  type SlotCheckResult,
  type SlotSummary,
  type UsageType,
  type UsageCheckResult,
  type UsageSummary,
} from './usage'

// 프리미엄 기능
export {
  getPlanFeatures,
  getKeyframeCount,
  canRemoveWatermark,
  canUseHdUpscale,
  type PlanFeatures,
} from './features'
