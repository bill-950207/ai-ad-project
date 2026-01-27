/**
 * 네비게이션 바 컴포넌트
 *
 * 랜딩 페이지 상단의 네비게이션 바를 담당합니다.
 * - 로고 표시
 * - 인증 상태에 따른 버튼 표시 (로그인/회원가입 또는 사용자 메뉴)
 * - Supabase 인증 상태 실시간 구독
 */

'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from './ui/button'
import { useLanguage } from '@/contexts/language-context'
import { LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'

// ============================================================
// 컴포넌트
// ============================================================

export function Navbar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  // 상태 관리
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setShowMenu(false)
  }

  // 사용자 이니셜 추출
  const getUserInitials = () => {
    if (!user?.email) return 'U'
    return user.email.charAt(0).toUpperCase()
  }

  // 대시보드에서는 Navbar 숨김
  if (pathname?.startsWith('/dashboard')) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AD</span>
            </div>
            <span className="text-xl font-bold text-foreground">AIAD</span>
          </Link>

          {/* 인증 버튼 영역 */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="h-10 w-10 bg-secondary animate-pulse rounded-full" />
            ) : user ? (
              // 로그인 상태 - 아바타 + 드롭다운 메뉴
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-secondary/50 transition-colors"
                >
                  {/* 사용자 아바타 */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {getUserInitials()}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* 드롭다운 메뉴 */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-lg py-2">
                    {/* 사용자 정보 */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* 메뉴 항목들 */}
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                        {t.landing.dashboard}
                      </Link>
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.common.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 비로그인 상태 - 로그인/회원가입 버튼
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t.landing.login}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    {t.landing.signUp}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
