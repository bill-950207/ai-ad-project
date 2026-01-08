/**
 * Supabase 서버 클라이언트
 *
 * 서버 사이드 (서버 컴포넌트, API 라우트)에서 사용하는 Supabase 클라이언트입니다.
 * Next.js의 cookies API를 사용하여 인증 상태를 관리합니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 서버용 Supabase 클라이언트 생성
 *
 * 서버 컴포넌트나 API 라우트에서 Supabase에 접근할 때 사용합니다.
 * 쿠키를 통해 사용자 세션을 관리합니다.
 *
 * @returns Supabase 서버 클라이언트 인스턴스
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 모든 쿠키 조회
        getAll() {
          return cookieStore.getAll()
        },
        // 쿠키 설정
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 서버 컴포넌트에서 setAll이 호출된 경우
            // 미들웨어에서 세션 갱신을 처리하므로 무시해도 됨
          }
        },
      },
    }
  )
}
