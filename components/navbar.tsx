/**
 * 네비게이션 바 컴포넌트
 *
 * 랜딩 페이지 상단의 네비게이션 바를 담당합니다.
 * - 로고 표시
 * - 인증 상태에 따른 버튼 표시 (로그인/회원가입 또는 로그아웃)
 * - Supabase 인증 상태 실시간 구독
 */

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from './ui/button'

// ============================================================
// 컴포넌트
// ============================================================

export function Navbar() {
  const pathname = usePathname()
  // 상태 관리
  const [user, setUser] = useState<User | null>(null)      // 현재 로그인한 사용자
  const [loading, setLoading] = useState(true)              // 로딩 상태
  const supabase = createClient()

  // 사용자 인증 상태 확인 및 구독
  useEffect(() => {
    // 현재 사용자 정보 조회
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // 클린업: 구독 해제
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
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
            <span className="text-xl font-bold text-foreground">ADAI</span>
          </Link>

          {/* 인증 버튼 영역 */}
          <div className="flex items-center space-x-3">
            {loading ? (
              // 로딩 중 - 스켈레톤 표시
              <div className="h-10 w-24 bg-secondary animate-pulse rounded-lg" />
            ) : user ? (
              // 로그인 상태 - 대시보드 버튼 및 로그아웃 버튼
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Link href="/dashboard">
                  <Button variant="default" size="sm">
                    대시보드
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              // 비로그인 상태 - 로그인/회원가입 버튼
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign Up
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
