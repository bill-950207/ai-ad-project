/**
 * 네비게이션 바 컴포넌트
 *
 * 랜딩 페이지 상단의 네비게이션 바를 담당합니다.
 * - 로고 표시
 * - 네비게이션 링크 (Features, Gallery)
 * - 언어 선택기
 * - 인증 상태에 따른 버튼 표시 (로그인/회원가입 또는 사용자 메뉴)
 * - 스크롤 시 배경 변화
 * - 모바일 메뉴 지원
 */

'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { locales, type Locale } from '@/lib/i18n/seo'
import { User } from '@supabase/supabase-js'
import { Button } from './ui/button'
import { useLanguage } from '@/contexts/language-context'
import { Language } from '@/lib/i18n'
import { LayoutDashboard, LogOut, ChevronDown, Menu, X, Globe, Image, Video, CreditCard } from 'lucide-react'
import NextImage from 'next/image'

// ============================================================
// 언어 옵션
// ============================================================

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

// ============================================================
// 컴포넌트
// ============================================================

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()

  // 현재 URL이 다국어 랜딩페이지인지 확인
  const isLocaleLandingPage = pathname ? locales.some(loc => pathname === `/${loc}`) : false
  const currentLocaleFromUrl = pathname ? locales.find(loc => pathname === `/${loc}`) : null

  // 언어 변경 핸들러
  const handleLanguageChange = (newLang: Locale) => {
    setLanguage(newLang)
    setShowLangMenu(false)

    // 랜딩페이지일 경우 URL도 변경
    if (isLocaleLandingPage) {
      router.push(`/${newLang}`)
    }
  }

  // 상태 관리
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 사용자 인증 상태 확인 및 구독
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setShowMenu(false)
    setMobileMenuOpen(false)
  }

  // 사용자 이니셜 추출
  const getUserInitials = () => {
    if (!user?.email) return 'U'
    return user.email.charAt(0).toUpperCase()
  }

  // 현재 언어 정보
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[1]

  // 네비게이션 링크
  const navLinks = [
    { href: '#features', label: t.landing?.featuresTitle || 'Features' },
    { href: '#workflow', label: t.landing?.workflowTitle || 'How it works' },
    { href: '#gallery', label: t.landing?.galleryTitle || 'Gallery' },
    { href: '/pricing', label: t.landing?.pricing || 'Pricing' },
  ]

  // 대시보드 및 인증 페이지에서는 Navbar 숨김
  if (pathname?.startsWith('/dashboard') || pathname === '/login' || pathname === '/signup' || pathname === '/onboarding' || pathname === '/verify-email') {
    return null
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-lg border-b border-border shadow-lg shadow-black/5'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <Link href="/" className="flex items-center group">
              <NextImage
                src="/logo-full-dark-lg.png"
                alt="gwanggo"
                width={120}
                height={36}
                className="h-9 w-auto"
                priority
              />
            </Link>

            {/* 데스크톱 네비게이션 */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                link.href.startsWith('#') ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            {/* 우측 영역 */}
            <div className="flex items-center gap-2">
              {/* 언어 선택기 */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentLang.flag}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-background/95 backdrop-blur-lg shadow-xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                          language === lang.code
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 인증 버튼 영역 - 데스크톱 */}
              <div className="hidden md:flex items-center gap-2">
                {loading ? (
                  <div className="h-9 w-9 bg-secondary animate-pulse rounded-full" />
                ) : user ? (
                  // 로그인 상태 - 대시보드 버튼 + 아바타 드롭다운
                  <>
                    <Link href="/dashboard">
                      <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25">
                        <LayoutDashboard className="w-4 h-4 mr-1.5" />
                        {t.landing?.dashboard || 'Dashboard'}
                      </Button>
                    </Link>
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex items-center gap-1 p-1 rounded-full hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-background">
                          <span className="text-white font-semibold text-sm">
                            {getUserInitials()}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showMenu && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background/95 backdrop-blur-lg shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-4 py-3 border-b border-border">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.email}
                            </p>
                          </div>

                          <div className="pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              {t.common?.logout || 'Logout'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // 비로그인 상태
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        {t.landing?.login || 'Login'}
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25">
                        {t.landing?.signUp || 'Sign Up'}
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* 모바일 메뉴 버튼 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-foreground" />
                ) : (
                  <Menu className="w-5 h-5 text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 메뉴 */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
        mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* 백드롭 */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* 메뉴 패널 */}
        <div className={`absolute top-16 left-0 right-0 bg-background border-b border-border shadow-xl transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="p-4 space-y-3">
            {/* 네비게이션 링크 */}
            {navLinks.map((link) => {
              const IconComponent = link.href === '#features' ? Image
                : link.href === '/pricing' ? CreditCard
                : Video

              return link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-foreground rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <IconComponent className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{link.label}</span>
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-foreground rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <IconComponent className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              )
            })}

            {/* 구분선 */}
            <div className="border-t border-border my-3" />

            {/* 인증 영역 */}
            {loading ? (
              <div className="h-12 bg-secondary animate-pulse rounded-xl" />
            ) : user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {getUserInitials()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate flex-1">
                    {user.email}
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-foreground rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{t.landing?.dashboard || 'Dashboard'}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t.common?.logout || 'Logout'}</span>
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {t.landing?.login || 'Login'}
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-primary to-purple-600">
                    {t.landing?.signUp || 'Sign Up'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
