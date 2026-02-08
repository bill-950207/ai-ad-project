/**
 * 클라이언트 이벤트 추적
 *
 * useTrack() 훅과 trackEvent() 함수 제공
 */

'use client'

import { usePostHog } from 'posthog-js/react'
import { useCallback } from 'react'
import { AnalyticsEventMap } from './events'

/**
 * Type-safe 이벤트 추적 훅
 *
 * PostHogProvider 내부에서만 사용 가능
 */
export function useTrack() {
  const posthog = usePostHog()

  const track = useCallback(
    <K extends keyof AnalyticsEventMap>(event: K, properties: AnalyticsEventMap[K]) => {
      posthog?.capture(event, properties)
    },
    [posthog]
  )

  return track
}

/**
 * PostHogProvider 컨텍스트 밖에서 사용 가능한 추적 함수
 *
 * posthog-js가 초기화된 후에만 동작
 */
export function trackEvent<K extends keyof AnalyticsEventMap>(
  event: K,
  properties: AnalyticsEventMap[K]
): void {
  if (typeof window === 'undefined') return

  // posthog-js는 window.__posthog에 자동 등록되지 않으므로
  // dynamic import로 가져옴
  import('posthog-js').then((mod) => {
    const posthog = mod.default
    if (posthog.__loaded) {
      posthog.capture(event, properties)
    }
  }).catch(() => {
    // PostHog 미로드 시 무시
  })
}
