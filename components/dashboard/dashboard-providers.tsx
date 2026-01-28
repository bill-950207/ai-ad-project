/**
 * 대시보드 프로바이더
 *
 * 대시보드 전역에서 사용되는 Context Provider들을 관리합니다.
 */

'use client'

import { ReactNode } from 'react'
import { OnboardingProvider } from '@/components/onboarding/onboarding-context'

interface DashboardProvidersProps {
  children: ReactNode
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  )
}
