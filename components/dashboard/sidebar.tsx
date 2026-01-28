/**
 * 대시보드 사이드바 컴포넌트
 *
 * 대시보드 레이아웃의 좌측 사이드바를 담당합니다.
 * - 네비게이션 메뉴 (광고 생성 도구, 광고 워크플로우)
 * - 크레딧 표시
 * - 사용자 프로필 메뉴
 * - 언어 설정
 * - 로그아웃 기능
 */

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useLanguage } from '@/contexts/language-context'
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
  Package
} from 'lucide-react'

// ============================================================
// 타입 정의
// ============================================================

/** 네비게이션 아이템 타입 */
interface NavItem {
  labelKey: 'adCreationTools' | 'adWorkflow'  // 번역 키
  icon: React.ReactNode                        // 아이콘
  children: { labelKey: string; href: string; icon: React.ReactNode }[]  // 하위 메뉴 (항상 표시)
}

// ============================================================
// 상수 정의
// ============================================================

/** 네비게이션 메뉴 구조 */
const navItems: NavItem[] = [
  {
    labelKey: 'adCreationTools',  // 광고 생성 도구
    icon: <Wand2 className="w-4 h-4" />,
    children: [
      { labelKey: 'avatarGeneration', href: '/dashboard/avatar', icon: <Sparkles className="w-4 h-4" /> },  // 아바타 생성
      { labelKey: 'musicGeneration', href: '/dashboard/music', icon: <Music className="w-4 h-4" /> },        // 음악 생성
      { labelKey: 'adProducts', href: '/dashboard/ad-products', icon: <Package className="w-4 h-4" /> },  // 광고 제품
    ]
  },
  {
    labelKey: 'adWorkflow',  // 광고 워크플로우
    icon: <Workflow className="w-4 h-4" />,
    children: [
      { labelKey: 'imageAd', href: '/dashboard/image-ad', icon: <Image className="w-4 h-4" /> },  // 이미지 광고
      { labelKey: 'videoAd', href: '/dashboard/video-ad', icon: <Video className="w-4 h-4" /> },  // 영상 광고
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

  // 상태 관리
  const [user, setUser] = useState<User | null>(null)              // 현재 사용자
  const [showProfileMenu, setShowProfileMenu] = useState(false)    // 프로필 메뉴 표시 여부
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)  // 언어 메뉴 표시 여부
  const [credits, setCredits] = useState<number | null>(null)
  const [planType, setPlanType] = useState<string>('FREE')         // 현재 플랜
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 사용자 정보, 크레딧, 플랜 조회 (단일 API 호출로 N+1 최적화)
  useEffect(() => {
    const fetchUserData = async () => {
      // 1. 인증 정보 조회 (필수)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) return

      // 2. 구독 API에서 크레딧 + 플랜 한 번에 조회
      // 기존: profiles 쿼리 + subscription API = 2회 호출
      // 개선: subscription API 1회로 통합 (이미 profile.credits 포함)
      try {
        const res = await fetch('/api/subscription')
        if (res.ok) {
          const data = await res.json()
          setCredits(data.profile?.credits ?? 0)
          setPlanType(data.subscription?.planType || 'FREE')
        }
      } catch {
        // 구독 API 실패 시 기본값 유지
      }
    }
    fetchUserData()
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

  // ESC 키로 메뉴 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showLanguageMenu) {
          setShowLanguageMenu(false)
        } else if (showProfileMenu) {
          setShowProfileMenu(false)
        }
      }
    }
    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [showProfileMenu, showLanguageMenu])

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  /**
   * 언어 변경 핸들러
   */
  const handleLanguageChange = (code: Language) => {
    setLanguage(code)
    setShowLanguageMenu(false)
    setShowProfileMenu(false)
  }

  /**
   * 사용자 표시 이름 가져오기
   * 우선순위: full_name > name > 이메일 ID
   */
  const getUserDisplayName = () => {
    if (!user) return 'User'
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.user_metadata?.name) return user.user_metadata.name
    return user.email?.split('@')[0] || 'User'
  }

  /**
   * 네비게이션 라벨 가져오기 (번역)
   */
  const getNavLabel = (key: string) => {
    return t.nav[key as keyof typeof t.nav] || key
  }

  return (
    <aside className="w-64 bg-card border-r border-border h-screen fixed left-0 top-0 flex flex-col">
      {/* 로고 */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link
          href="/dashboard"
          aria-label="ADAI 대시보드 홈"
          className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-lg"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-400 rounded-lg flex items-center justify-center" aria-hidden="true">
            <span className="text-white font-bold text-sm">AD</span>
          </div>
          <span className="text-xl font-bold text-foreground">ADAI</span>
        </Link>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.labelKey}>
            {/* 상위 메뉴 라벨 (항상 표시) */}
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground">
              {item.icon}
              <span>{getNavLabel(item.labelKey)}</span>
            </div>

            {/* 하위 메뉴 아이템 (항상 표시) */}
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    pathname === child.href || pathname?.startsWith(child.href + '/')
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {child.icon}
                  <span>{getNavLabel(child.labelKey)}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 사용자 프로필 섹션 */}
      <div className="border-t border-border p-4" ref={menuRef}>
        {/* 크레딧 표시 */}
        <div className="flex items-center justify-between px-3 py-2 mb-2 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>{t.common.credits}</span>
          </div>
          <span className="text-sm font-semibold text-primary">{credits ?? '-'}</span>
        </div>

        {/* 프로필 버튼 */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            aria-label={`${getUserDisplayName()} 프로필 메뉴`}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-primary" />
                </div>
                {/* 플랜 뱃지 */}
                <span className={cn(
                  "absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap",
                  planType === 'FREE' && "bg-gray-600 text-gray-100",
                  planType === 'STARTER' && "bg-blue-600 text-blue-100",
                  planType === 'PRO' && "bg-purple-600 text-purple-100",
                  planType === 'BUSINESS' && "bg-amber-600 text-amber-100"
                )}>
                  {planType}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
            </div>
            <ChevronUp className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              showProfileMenu ? "rotate-180" : ""
            )} />
          </button>

          {/* 프로필 드롭다운 메뉴 */}
          {showProfileMenu && (
            <div
              role="menu"
              aria-label="프로필 메뉴"
              className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
            >
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary/50 focus-visible:outline-none focus-visible:bg-secondary/50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <UserIcon className="w-4 h-4" aria-hidden="true" />
                  <span>{t.common.myProfile}</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary/50 focus-visible:outline-none focus-visible:bg-secondary/50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  <span>{t.common.settings}</span>
                </Link>
                <Link
                  href="/dashboard/subscription"
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary/50 focus-visible:outline-none focus-visible:bg-secondary/50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                  <span>{t.common.subscription || '구독 관리'}</span>
                </Link>

                {/* 언어 서브메뉴 */}
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    role="menuitem"
                    aria-expanded={showLanguageMenu}
                    aria-haspopup="menu"
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-secondary/50 focus-visible:outline-none focus-visible:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Languages className="w-4 h-4" aria-hidden="true" />
                      <span>{t.common.language}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {languages.find(l => l.code === language)?.label}
                    </span>
                  </button>

                  {showLanguageMenu && (
                    <div role="menu" aria-label="언어 선택" className="border-t border-border bg-secondary/20">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          role="menuitem"
                          aria-current={language === lang.code ? 'true' : undefined}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={cn(
                            "w-full flex items-center gap-3 px-8 py-2 text-sm focus-visible:outline-none transition-colors",
                            language === lang.code
                              ? "text-primary bg-primary/10"
                              : "text-foreground hover:bg-secondary/50 focus-visible:bg-secondary/50"
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border my-1" />

                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 focus-visible:outline-none focus-visible:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>{t.common.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
