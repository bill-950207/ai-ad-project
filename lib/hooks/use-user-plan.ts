/**
 * 사용자 플랜 정보 훅
 *
 * 플랜 정보를 가져오고 로딩 상태를 관리합니다.
 * 로딩 중에는 FREE 플랜(가장 제한적)으로 가정하여
 * 옵션이 열렸다가 닫히는 UX 문제를 방지합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

// 플랜 타입 (클라이언트에서 사용 가능한 형태)
export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'

export interface UserPlan {
  planType: PlanType
  displayName: string
  avatarLimit: number
  musicLimit: number
  productLimit: number
  monthlyCredits: number
  keyframeCount: number
  watermarkFree: boolean
  hdUpscale: boolean
}

// FREE 플랜 기본값 (로딩 중 사용)
const FREE_PLAN_DEFAULTS: UserPlan = {
  planType: 'FREE',
  displayName: 'Free',
  avatarLimit: 1,
  musicLimit: 1,
  productLimit: 3,
  monthlyCredits: 15,
  keyframeCount: 1,
  watermarkFree: false,
  hdUpscale: false,
}

interface UseUserPlanResult {
  /** 사용자 플랜 정보 (로딩 중에는 FREE 기본값) */
  userPlan: UserPlan
  /** 플랜 정보 로딩 중 여부 */
  isLoading: boolean
  /** FREE 플랜 여부 (로딩 중에는 true) */
  isFreeUser: boolean
  /** 플랜 정보 다시 가져오기 */
  refetch: () => Promise<void>
  /** 로딩 완료 여부 */
  isLoaded: boolean
}

/**
 * 사용자 플랜 정보를 가져오는 훅
 *
 * @example
 * ```tsx
 * const { userPlan, isFreeUser, isLoading } = useUserPlan()
 *
 * // isFreeUser는 로딩 중에도 true (가장 제한적인 상태)
 * // 로딩 완료 후 실제 플랜에 따라 업데이트됨
 * const isLocked = isFreeUser && option === 'premium'
 * ```
 */
export function useUserPlan(): UseUserPlanResult {
  const [userPlan, setUserPlan] = useState<UserPlan>(FREE_PLAN_DEFAULTS)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchUserPlan = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/user/plan')
      if (res.ok) {
        const data = await res.json()
        setUserPlan(data)
      }
    } catch (error) {
      console.error('Failed to fetch user plan:', error)
      // 에러 시 FREE 플랜 유지
    } finally {
      setIsLoading(false)
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchUserPlan()
  }, [fetchUserPlan])

  // 로딩 중에는 FREE로 가정 (가장 제한적)
  const isFreeUser = isLoading || userPlan.planType === 'FREE'

  return {
    userPlan,
    isLoading,
    isFreeUser,
    refetch: fetchUserPlan,
    isLoaded,
  }
}
