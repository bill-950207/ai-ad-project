import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULT_SIGNUP_CREDITS } from '@/lib/credits/constants'
import { recordSignupCredit } from '@/lib/credits/history'
import { captureServerEvent } from '@/lib/analytics/posthog-server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('세션 교환 오류:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }

    const user = sessionData?.user
    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=no_user`)
    }

    // 이메일 인증 상태 확인
    // Google OAuth는 이미 이메일이 검증된 상태이므로 추가 인증 불필요
    const isGoogleAuth = user.app_metadata?.provider === 'google'
    const isEmailVerified = isGoogleAuth || user.email_confirmed_at != null

    // 이메일 미확인 시 인증 페이지로 리다이렉트
    if (!isEmailVerified) {
      const email = user.email ? encodeURIComponent(user.email) : ''
      return NextResponse.redirect(`${origin}/verify-email?email=${email}`)
    }

    try {
      // 프로필 존재 여부 확인
      let profile = await prisma.profiles.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          is_onboarded: true,
          name: true,
          credits: true,
        },
      })

      // 프로필이 없으면 생성 (이메일만 저장, 온보딩 미완료 상태)
      if (!profile) {
        // 트랜잭션으로 프로필 생성 + 크레딧 히스토리 기록
        profile = await prisma.$transaction(async (tx) => {
          const newProfile = await tx.profiles.create({
            data: {
              id: user.id,
              email: user.email,
              is_onboarded: false,
              credits: DEFAULT_SIGNUP_CREDITS,
            },
            select: {
              id: true,
              email: true,
              is_onboarded: true,
              name: true,
              credits: true,
            },
          })

          // 회원가입 크레딧 히스토리 기록
          if (DEFAULT_SIGNUP_CREDITS > 0) {
            await recordSignupCredit({
              userId: user.id,
              amount: DEFAULT_SIGNUP_CREDITS,
              balanceAfter: DEFAULT_SIGNUP_CREDITS,
            }, tx)
          }

          return newProfile
        })

        // 신규 사용자: 이메일 인증 완료 + 회원가입 완료 이벤트
        captureServerEvent(user.id, ANALYTICS_EVENTS.AUTH_EMAIL_VERIFIED, {
          method: isGoogleAuth ? 'google' : 'email',
        })
        captureServerEvent(user.id, ANALYTICS_EVENTS.AUTH_SIGNUP_COMPLETED, {
          method: isGoogleAuth ? 'google' : 'email',
        })
      } else {
        // 기존 사용자: 로그인 성공 이벤트
        captureServerEvent(user.id, ANALYTICS_EVENTS.AUTH_LOGIN_SUCCESS, {
          method: isGoogleAuth ? 'google' : 'email',
        })
      }

      // 온보딩 미완료 시 온보딩 페이지로 이동
      if (!profile.is_onboarded) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // 온보딩 완료 시 대시보드로 이동
      return NextResponse.redirect(`${origin}${next}`)

    } catch (dbError) {
      console.error('DB 처리 오류:', {
        error: dbError,
        userId: user.id,
        email: user.email,
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
      })
      // DB 오류 시 에러 페이지로 이동 (프로필 생성 실패)
      return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
