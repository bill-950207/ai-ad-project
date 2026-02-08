'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * 페이지뷰 추적 (App Router SPA 네비게이션 대응)
 */
function PostHogPageView() {
  const pathname = usePathname()
  const posthogClient = usePostHog()

  useEffect(() => {
    if (pathname && posthogClient) {
      posthogClient.capture('$pageview', { $current_url: window.origin + pathname })
    }
  }, [pathname, posthogClient])

  return null
}

/**
 * Supabase 사용자 식별
 */
function PostHogUserIdentifier() {
  const posthogClient = usePostHog()
  const identifiedRef = useRef(false)

  useEffect(() => {
    if (identifiedRef.current) return

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && posthogClient) {
        posthogClient.identify(user.id, {
          email: user.email,
        })
        identifiedRef.current = true
      }
    })
  }, [posthogClient])

  return null
}

/**
 * PostHog Provider
 *
 * Production 환경에서만 PostHog 초기화
 * 비-production 환경에서는 children만 렌더링
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!IS_PRODUCTION || !POSTHOG_KEY) {
    return <>{children}</>
  }

  // PostHog 초기화 (한 번만)
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      person_profiles: 'identified_only',
    })
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      <PostHogUserIdentifier />
      {children}
    </PHProvider>
  )
}
