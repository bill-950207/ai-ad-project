/**
 * 히어로 섹션 컴포넌트
 *
 * 랜딩 페이지의 메인 히어로 섹션
 * - 동적 그라데이션 배경
 * - 대담한 타이포그래피
 * - 세련된 CTA 버튼과 통계
 */

'use client'

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { Sparkles, ArrowRight, Play, Zap, Users, TrendingUp } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export function HeroSection() {
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const heroRef = useRef<HTMLElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100vh] overflow-hidden flex items-center justify-center px-4 py-20"
    >
      {/* 동적 배경 */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-30 transition-all duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, hsl(270 76% 62%) 0%, hsl(186 100% 50%) 100%)',
            left: `calc(${mousePosition.x * 100}% - 400px)`,
            top: `calc(${mousePosition.y * 100}% - 400px)`,
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] animate-pulse [animation-delay:1s]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl text-center relative z-10">
        {/* AI 배지 */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm px-5 py-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          <span>{t.landing.badge}</span>
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        </div>

        {/* 메인 헤드라인 */}
        <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9]">
          <span className="block text-foreground/90">{t.landing.headline}</span>
          <span className="block mt-2 gradient-brand-text">{t.landing.headlineHighlight}</span>
          <span className="block text-foreground/90">{t.landing.headlineEnd}</span>
        </h1>

        {/* 서브 헤드라인 */}
        <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          {t.landing.subheadline}
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-20">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="group relative inline-flex items-center justify-center gap-3 h-14 rounded-full px-10 text-lg font-semibold overflow-hidden transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 gradient-brand" />
            <span className="relative text-white">{t.landing.ctaStart}</span>
            <ArrowRight className="relative h-5 w-5 text-white transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="#gallery"
            className="group inline-flex items-center justify-center gap-3 h-14 rounded-full px-10 text-lg font-semibold border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/30 transition-all duration-300"
          >
            <Play className="h-5 w-5 text-primary" />
            <span>{t.landing.ctaDemo}</span>
          </Link>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <StatCard icon={<Zap className="h-5 w-5" />} value="10K+" label={t.landing.statsAds} />
          <StatCard icon={<Users className="h-5 w-5" />} value="500+" label={t.landing.statsUsers} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} value="98%" label={t.landing.statsSatisfaction} />
        </div>
      </div>

      {/* 스크롤 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50" />
        </div>
      </div>
    </section>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="group relative p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-primary/20 transition-all duration-300">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-primary">{icon}</div>
          <div className="text-3xl font-bold text-foreground">{value}</div>
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
