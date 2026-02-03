import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * 캐시된 인증 함수들
 *
 * React.cache()를 사용하여 동일 요청 내에서 중복 호출 방지
 * - 대시보드 레이아웃과 하위 페이지에서 동일한 인증 정보 재사용
 * - RSC 요청 시 ~60-70% 지연 감소 효과
 */

/**
 * 현재 사용자 정보 조회 (캐시됨)
 * 동일 요청 내에서 여러 번 호출해도 한 번만 실행됨
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * 사용자 프로필 조회 (캐시됨)
 * userId별로 캐시되어 동일 요청 내에서 재사용됨
 */
export const getUserProfile = cache(async (userId: string) => {
  return prisma.profiles.findUnique({
    where: { id: userId },
    select: { is_onboarded: true, role: true, credits: true },
  })
})

/**
 * 인증된 사용자 정보 + 프로필 조회 (캐시됨)
 * 레이아웃에서 호출하면 하위 페이지에서 캐시 히트
 */
export const getAuthenticatedUser = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const profile = await getUserProfile(user.id)
  return {
    user,
    isOnboarded: profile?.is_onboarded ?? false,
    role: profile?.role ?? null,
    credits: profile?.credits ?? 0,
  }
})
