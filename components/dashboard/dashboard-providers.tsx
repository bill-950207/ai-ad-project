/**
 * 대시보드 프로바이더
 *
 * 대시보드 전역에서 사용되는 Context Provider들을 관리합니다.
 * - CreditProvider: 크레딧 상태 관리 및 갱신
 * - OnboardingProvider: 온보딩 플로우 상태 관리
 * - ErrorBoundary: 클라이언트 컴포넌트 에러 처리
 */

'use client'

import { ReactNode } from 'react'
import { CreditProvider } from '@/contexts/credit-context'
import { OnboardingProvider } from '@/components/onboarding/onboarding-context'
import { ErrorBoundary } from '@/components/ui/error-boundary'

interface DashboardProvidersProps {
  children: ReactNode
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <CreditProvider>
      <OnboardingProvider>
        <ErrorBoundary
          showRetry
          showGoBack
          showGoHome
          onError={(error, errorInfo) => {
            // 프로덕션에서는 에러 모니터링 서비스로 전송
            if (process.env.NODE_ENV === 'development') {
              console.error('DashboardProviders ErrorBoundary:', error, errorInfo)
            }
          }}
        >
          {children}
        </ErrorBoundary>
      </OnboardingProvider>
    </CreditProvider>
  )
}
