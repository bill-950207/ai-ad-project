import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale, type Locale } from '@/lib/i18n/seo'

/** Accept-Language 헤더에서 선호 언어 감지 */
function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language')
  if (!acceptLanguage) return defaultLocale

  // Accept-Language 파싱 (예: "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q = 'q=1'] = lang.trim().split(';')
      return {
        code: code.split('-')[0].toLowerCase(),
        quality: parseFloat(q.replace('q=', '')) || 1,
      }
    })
    .sort((a, b) => b.quality - a.quality)

  // 지원하는 언어 중 가장 선호하는 언어 찾기
  for (const { code } of languages) {
    if (locales.includes(code as Locale)) {
      return code as Locale
    }
  }

  return defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // 루트에 code 파라미터가 있으면 auth/callback으로 리다이렉트
  // (Supabase 이메일 인증 링크가 루트로 올 경우 처리)
  if (pathname === '/' && searchParams.get('code')) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.search = request.nextUrl.search
    return NextResponse.redirect(callbackUrl)
  }

  // 루트 접근 시 브라우저 언어에 맞게 리다이렉트
  if (pathname === '/') {
    const preferredLocale = getPreferredLocale(request)
    return NextResponse.redirect(new URL(`/${preferredLocale}`, request.url))
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
