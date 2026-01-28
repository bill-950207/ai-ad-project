/**
 * 대시보드 사이드바 컴포넌트
 *
 * Glassmorphism 디자인 + 반응형 + 접이식 지원
 */

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useLanguage } from '@/contexts/language-context'
import { useSidebar } from '@/contexts/sidebar-context'
import { languages, Language } from '@/lib/i18n'
import {
  Sparkles,
  Music,
  Image,
  Video,
  Workflow,
  Wand2,
  User as UserIcon,
  Settings,
  Languages,
  LogOut,
  CreditCard,
  ChevronUp,
  ChevronLeft,
  Package,
  Menu,
  X
} from 'lucide-react'

// ============================================================
// 타입 정의
// ============================================================

interface NavItem {
  labelKey: 'adCreationTools' | 'adWorkflow'
  icon: React.ReactNode
  children: { labelKey: string; href: string; icon: React.ReactNode }[]
}

// ============================================================
// 상수 정의
// ============================================================

const navItems: NavItem[] = [
  {
    labelKey: 'adCreationTools',
    icon: <Wand2 className="w-4 h-4" />,
    children: [
      { labelKey: 'avatarGeneration', href: '/dashboard/avatar', icon: <Sparkles className="w-4 h-4" /> },
      { labelKey: 'musicGeneration', href: '/dashboard/music', icon: <Music className="w-4 h-4" /> },
      { labelKey: 'adProducts', href: '/dashboard/ad-products', icon: <Package className="w-4 h-4" /> },
    ]
  },
  {
    labelKey: 'adWorkflow',
    icon: <Workflow className="w-4 h-4" />,
    children: [
      { labelKey: 'imageAd', href: '/dashboard/image-ad', icon: <Image className="w-4 h-4" /> },
      { labelKey: 'videoAd', href: '/dashboard/video-ad', icon: <Video className="w-4 h-4" /> },
    ]
  }
]

// ============================================================
// 컴포넌트
// ============================================================

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, isMobile } = useSidebar()

  // 상태 관리
  const [user, setUser] = useState<User | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [planType, setPlanType] = useState<string>('FREE')
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 사용자 정보, 크레딧, 플랜 조회
  useEffect(() => {
    const getUserAndCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()

        if (profile) {
          setCredits(profile.credits ?? 0)
        }

        try {
          const res = await fetch('/api/subscription')
          if (res.ok) {
            const data = await res.json()
            setPlanType(data.subscription?.planType || 'FREE')
          }
        } catch {
          // 구독 API 실패 시 기본값 유지
        }
      }
    }
    getUserAndCredits()
  }, [supabase])

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
        setShowLanguageMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleLanguageChange = (code: Language) => {
    setLanguage(code)
    setShowLanguageMenu(false)
    setShowProfileMenu(false)
  }

  const getUserDisplayName = () => {
    if (!user) return 'User'
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.user_metadata?.name) return user.user_metadata.name
    return user.email?.split('@')[0] || 'User'
  }

  const getNavLabel = (key: string) => {
    return t.nav[key as keyof typeof t.nav] || key
  }

  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileOpen(false)
    }
  }

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className={cn(
          "fixed top-4 left-4 z-50 p-2.5 rounded-xl",
          "bg-card/80 backdrop-blur-sm border border-white/10",
          "hover:bg-white/10 transition-all duration-200",
          "md:hidden",
          isMobileOpen && "opacity-0 pointer-events-none"
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* 모바일 오버레이 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen flex flex-col z-50",
          "bg-card/90 backdrop-blur-xl border-r border-white/5",
          "shadow-[0_0_50px_rgba(139,92,246,0.05)]",
          "transition-all duration-300 ease-out",
          // 데스크톱
          "md:translate-x-0",
          isCollapsed ? "md:w-[72px]" : "md:w-64",
          // 모바일
          "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* 모바일 닫기 버튼 */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors md:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 접기/펼치기 버튼 (데스크톱) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden md:flex absolute -right-3 top-20 z-10",
            "w-6 h-6 items-center justify-center",
            "bg-card border border-border rounded-full",
            "hover:bg-primary/20 hover:border-primary/50 transition-all duration-200",
            "shadow-lg"
          )}
        >
          <ChevronLeft className={cn(
            "w-3.5 h-3.5 transition-transform duration-300",
            isCollapsed && "rotate-180"
          )} />
        </button>

        {/* 로고 */}
        <div className={cn(
          "h-16 flex items-center border-b border-white/5",
          isCollapsed ? "px-3 justify-center" : "px-4"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={handleNavClick}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl opacity-50 blur-md group-hover:opacity-75 transition-opacity" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-primary to-purple-400 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">AD</span>
              </div>
            </div>
            {!isCollapsed && (
              <span className={cn(
                "text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent",
                "group-hover:from-primary group-hover:to-purple-400 transition-all duration-300"
              )}>
                ADAI
              </span>
            )}
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className={cn(
          "flex-1 overflow-y-auto scrollbar-hide",
          isCollapsed ? "p-2" : "p-4",
          "space-y-4"
        )}>
          {navItems.map((item) => (
            <div key={item.labelKey}>
              {/* 상위 메뉴 라벨 */}
              {!isCollapsed && (
                <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.icon}
                  <span>{getNavLabel(item.labelKey)}</span>
                </div>
              )}

              {/* 하위 메뉴 아이템 */}
              <div className={cn(
                "space-y-1",
                !isCollapsed && "ml-2 mt-1"
              )}>
                {item.children.map((child) => (
                  <div key={child.href} className="relative group">
                    <Link
                      href={child.href}
                      onClick={handleNavClick}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl text-sm overflow-hidden",
                        "transition-all duration-200 ease-out",
                        isCollapsed ? "p-3 justify-center" : "px-3 py-2.5",
                        pathname === child.href || pathname?.startsWith(child.href + '/')
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      {/* 호버 그라데이션 배경 */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        "bg-gradient-to-r from-primary/10 via-transparent to-transparent",
                        (pathname === child.href || pathname?.startsWith(child.href + '/')) && "opacity-0"
                      )} />

                      {/* 활성 인디케이터 */}
                      {(pathname === child.href || pathname?.startsWith(child.href + '/')) && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                      )}

                      {/* 아이콘 */}
                      <span className={cn(
                        "relative z-10 transition-transform duration-200",
                        "group-hover:scale-110"
                      )}>
                        {child.icon}
                      </span>

                      {/* 라벨 */}
                      {!isCollapsed && (
                        <span className="relative z-10">{getNavLabel(child.labelKey)}</span>
                      )}
                    </Link>

                    {/* 접힌 상태 툴팁 */}
                    {isCollapsed && (
                      <div className={cn(
                        "absolute left-full ml-3 top-1/2 -translate-y-1/2",
                        "px-2.5 py-1.5 bg-card border border-border rounded-lg text-sm",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                        "pointer-events-none whitespace-nowrap z-50 shadow-lg"
                      )}>
                        {getNavLabel(child.labelKey)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* 사용자 프로필 섹션 */}
        <div className={cn(
          "border-t border-white/5",
          isCollapsed ? "p-2" : "p-4"
        )} ref={menuRef}>
          {/* 크레딧 표시 */}
          {!isCollapsed ? (
            <div className={cn(
              "mb-3 p-3 rounded-xl",
              "bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent",
              "border border-primary/20"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.common.credits}</p>
                    <p className="text-lg font-bold text-foreground">{credits ?? '-'}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/subscription"
                  onClick={handleNavClick}
                  className="text-xs text-primary hover:underline"
                >
                  {t.common.subscription || '구독'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-2 p-2 rounded-xl bg-primary/10 flex flex-col items-center group relative">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary mt-1">{credits ?? '-'}</span>
              {/* 툴팁 */}
              <div className={cn(
                "absolute left-full ml-3 top-1/2 -translate-y-1/2",
                "px-2.5 py-1.5 bg-card border border-border rounded-lg text-sm",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "pointer-events-none whitespace-nowrap z-50 shadow-lg"
              )}>
                {t.common.credits}: {credits ?? '-'}
              </div>
            </div>
          )}

          {/* 프로필 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={cn(
                "w-full flex items-center rounded-xl",
                "bg-white/5 hover:bg-white/10 transition-all duration-200",
                "border border-transparent hover:border-white/10",
                isCollapsed ? "p-2 justify-center" : "gap-3 px-3 py-2.5"
              )}
            >
              {/* 아바타 + 플랜 뱃지 */}
              <div className="relative">
                <div className={cn(
                  "w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30",
                  "flex items-center justify-center ring-2 ring-primary/20"
                )}>
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <span className={cn(
                  "absolute -bottom-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                  planType === 'FREE' && "bg-gray-600 text-gray-100",
                  planType === 'STARTER' && "bg-blue-600 text-blue-100",
                  planType === 'PRO' && "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                  planType === 'BUSINESS' && "bg-amber-600 text-amber-100"
                )}>
                  {planType}
                </span>
              </div>

              {/* 사용자 정보 */}
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <ChevronUp className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    showProfileMenu ? "rotate-180" : ""
                  )} />
                </>
              )}
            </button>

            {/* 프로필 드롭다운 메뉴 */}
            {showProfileMenu && (
              <div className={cn(
                "absolute bottom-full mb-2 bg-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-50",
                isCollapsed ? "left-full ml-2 bottom-0 mb-0" : "left-0 right-0"
              )}>
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/10 transition-colors"
                    onClick={() => { setShowProfileMenu(false); handleNavClick() }}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{t.common.myProfile}</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/10 transition-colors"
                    onClick={() => { setShowProfileMenu(false); handleNavClick() }}
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t.common.settings}</span>
                  </Link>
                  <Link
                    href="/dashboard/subscription"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/10 transition-colors"
                    onClick={() => { setShowProfileMenu(false); handleNavClick() }}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{t.common.subscription || '구독 관리'}</span>
                  </Link>

                  {/* 언어 서브메뉴 */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Languages className="w-4 h-4" />
                        <span>{t.common.language}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {languages.find(l => l.code === language)?.label}
                      </span>
                    </button>

                    {showLanguageMenu && (
                      <div className="border-t border-white/10 bg-white/5">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={cn(
                              "w-full flex items-center gap-3 px-8 py-2 text-sm transition-colors",
                              language === lang.code
                                ? "text-primary bg-primary/10"
                                : "text-foreground hover:bg-white/10"
                            )}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.common.logout}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
