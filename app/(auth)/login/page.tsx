'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'

interface VideoShowcase {
  id: string
  media_url: string | null
}

// 폴백 영상 URL (API 로딩 중에도 바로 표시)
const FALLBACK_VIDEO_URL = '/examples/video-ad-example.mp4'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // 쇼케이스 영상 상태 (폴백 영상으로 초기화하여 바로 표시)
  const [videoUrls, setVideoUrls] = useState<string[]>([FALLBACK_VIDEO_URL])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 다음 영상으로 전환
  const playNextVideo = useCallback(() => {
    if (videoUrls.length > 0) {
      setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length)
    }
  }, [videoUrls.length])

  // 쇼케이스 영상 로드
  useEffect(() => {
    const fetchVideoShowcases = async () => {
      try {
        const res = await fetch('/api/showcases?type=video&limit=5&random=true')
        if (res.ok) {
          const data = await res.json()
          if (data.showcases && data.showcases.length > 0) {
            const urls = data.showcases
              .filter((s: VideoShowcase) => s.media_url)
              .map((s: VideoShowcase) => s.media_url as string)
            // urls가 비어있지 않을 때만 업데이트 (폴백 영상 유지)
            if (urls.length > 0) {
              setVideoUrls(urls)
              setCurrentVideoIndex(0)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load showcase video:', error)
        // 실패 시 폴백 영상 유지
      }
    }
    fetchVideoShowcases()
  }, [])

  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/dashboard')
      } else {
        setCheckingAuth(false)
      }
    }
    checkUser()
  }, [supabase.auth, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // 이메일 미인증 에러 처리
      if (error.message.toLowerCase().includes('email not confirmed')) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        return
      }
      setError(error.message)
      setLoading(false)
      return
    }

    // 이메일 인증 상태 확인 (Google OAuth는 이미 검증됨)
    const user = data.user
    const isGoogleAuth = user?.app_metadata?.provider === 'google'
    const isEmailVerified = isGoogleAuth || user?.email_confirmed_at != null

    if (!isEmailVerified) {
      // 이메일 미인증 시 인증 페이지로 리다이렉트
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      return
    }

    // 프로필/온보딩 상태 확인
    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const { data: profile } = await res.json()
        if (!profile?.is_onboarded) {
          router.push('/onboarding')
          router.refresh()
          return
        }
      } else if (res.status === 404) {
        // 프로필이 없는 경우 온보딩으로
        router.push('/onboarding')
        router.refresh()
        return
      }
    } catch {
      // API 오류 시 대시보드로 (layout에서 체크)
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // 인증 상태 확인 중 로딩 표시
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-background">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center mb-8">
            <NextImage
              src="/logo-full-dark-lg.png"
              alt="gwanggo"
              width={120}
              height={36}
              className="h-9 w-auto"
            />
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">
            Log in to your account to continue
          </p>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-foreground font-medium">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full py-3">
              {loading ? 'Loading...' : 'Log In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Showcase Video */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-primary/20 to-purple-900/30 overflow-hidden">
        {videoUrls.length > 0 ? (
          <>
            {/* 영상 플레이어 */}
            <video
              ref={videoRef}
              key={videoUrls[currentVideoIndex]}
              src={videoUrls[currentVideoIndex]}
              autoPlay
              muted
              playsInline
              onEnded={playNextVideo}
              className="absolute inset-0 w-full h-full object-contain"
            />
            {/* 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 z-10" />
            {/* 텍스트 오버레이 */}
            <div className="absolute bottom-12 left-12 right-12 z-20">
              <h3 className="text-2xl font-bold text-white mb-2">AI-Powered Ad Creation</h3>
              <p className="text-white/70 max-w-sm">
                Create stunning video ads in minutes with our AI technology
              </p>
            </div>
          </>
        ) : (
          /* 로딩 또는 폴백 UI */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 z-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center z-20">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm border border-primary/30">
                    <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">AI-Powered Ad Creation</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Create stunning video ads in minutes with our AI technology
                  </p>
                </div>
              </div>
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
