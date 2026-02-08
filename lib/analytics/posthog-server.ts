/**
 * PostHog 서버사이드 클라이언트
 *
 * 서버 컴포넌트, API 라우트, 웹훅에서 이벤트 추적에 사용
 * Prisma 싱글톤 패턴과 동일한 방식으로 구현
 */

import { PostHog } from 'posthog-node'
import { AnalyticsEventMap } from './events'

const globalForPostHog = globalThis as unknown as {
  posthogServer: PostHog | undefined
}

function createPostHogClient(): PostHog | null {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!apiKey || process.env.NODE_ENV !== 'production') {
    return null
  }

  return new PostHog(apiKey, {
    host: host || 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
}

const posthogServer = globalForPostHog.posthogServer ?? createPostHogClient() ?? undefined

if (process.env.NODE_ENV === 'production' && posthogServer) {
  globalForPostHog.posthogServer = posthogServer
}

/**
 * 서버사이드 이벤트 캡처 (type-safe)
 */
export function captureServerEvent<K extends keyof AnalyticsEventMap>(
  distinctId: string,
  event: K,
  properties: AnalyticsEventMap[K]
): void {
  if (!posthogServer) return

  posthogServer.capture({
    distinctId,
    event,
    properties,
  })
}
