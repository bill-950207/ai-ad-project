import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
        profile = await prisma.profiles.create({
          data: {
            id: user.id,
            email: user.email,
            is_onboarded: false,
            credits: 5, // 기본 크레딧
          },
          select: {
            id: true,
            email: true,
            is_onboarded: true,
            name: true,
            credits: true,
          },
        })
      }

      // 온보딩 미완료 시 온보딩 페이지로 이동
      if (!profile.is_onboarded) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // 온보딩 완료 시 대시보드로 이동
      return NextResponse.redirect(`${origin}${next}`)

    } catch (dbError) {
      console.error('DB 처리 오류:', dbError)
      // DB 오류가 발생해도 일단 대시보드로 이동
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
