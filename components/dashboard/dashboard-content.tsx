/**
 * 대시보드 콘텐츠 컴포넌트
 *
 * 대시보드 메인 페이지의 콘텐츠를 담당합니다.
 * - 페이지 제목 및 설명
 * - 빠른 통계 카드 (크레딧, 총 광고 수, 이번 달 광고)
 * - 빠른 액션 버튼
 */

'use client'

import { useLanguage } from '@/contexts/language-context'
import { Coins, ImageIcon, Calendar, Sparkles, Video, Music, User } from 'lucide-react'
import Link from 'next/link'

// ============================================================
// 타입 정의
// ============================================================

/** 컴포넌트 Props */
interface DashboardContentProps {
  userEmail?: string  // 사용자 이메일 (선택적)
}

/** 통계 카드 아이템 */
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  accentColor: 'primary' | 'accent' | 'success'
}

/** 빠른 액션 아이템 */
interface QuickActionProps {
  icon: React.ReactNode
  label: string
  description: string
  href: string
}

// ============================================================
// 서브 컴포넌트
// ============================================================

function StatCard({ icon, label, value, accentColor }: StatCardProps) {
  const accentClasses = {
    primary: 'from-primary/20 to-primary/5 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
    accent: 'from-accent/20 to-accent/5 group-hover:shadow-[0_0_20px_hsl(var(--accent)/0.3)]',
    success: 'from-success/20 to-success/5 group-hover:shadow-[0_0_20px_hsl(var(--success)/0.3)]',
  }

  const iconClasses = {
    primary: 'text-primary',
    accent: 'text-accent',
    success: 'text-success',
  }

  return (
    <div className={`
      group relative overflow-hidden
      bg-gradient-to-br ${accentClasses[accentColor]}
      bg-card border border-border rounded-2xl p-6
      transition-all duration-300
      hover:border-${accentColor}/30
    `}>
      {/* 배경 글로우 */}
      <div className={`
        absolute -top-12 -right-12 w-32 h-32 rounded-full
        bg-${accentColor}/10 blur-2xl
        transition-opacity duration-300 opacity-0 group-hover:opacity-100
      `} />

      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-xl bg-${accentColor}/10 ${iconClasses[accentColor]}`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        </div>
        <p className="text-4xl font-bold text-foreground tracking-tight">{value}</p>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, description, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="
        group relative overflow-hidden
        bg-card border border-border rounded-2xl p-5
        transition-all duration-300
        hover:border-primary/30 hover:shadow-glow-sm
        cursor-pointer
      ">
        {/* Hover 시 그라데이션 오버레이 */}
        <div className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          bg-gradient-to-br from-primary/5 to-accent/5
          transition-opacity duration-300
        " />

        <div className="relative flex items-center gap-4">
          <div className="
            p-3 rounded-xl
            bg-gradient-to-br from-primary/20 to-accent/20
            text-foreground
            transition-transform duration-300 group-hover:scale-110
          ">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
              {label}
            </h4>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          </div>
          <div className="
            w-8 h-8 rounded-full
            bg-muted/50 flex items-center justify-center
            text-muted-foreground
            transition-all duration-300
            group-hover:bg-primary group-hover:text-white
            group-hover:translate-x-1
          ">
            →
          </div>
        </div>
      </div>
    </Link>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DashboardContent({ userEmail: _userEmail }: DashboardContentProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-10">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-brand-text">{t.dashboard.title}</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          {t.dashboard.subtitle}
        </p>
      </div>

      {/* 빠른 통계 카드 */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          통계
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            icon={<Coins className="w-5 h-5" />}
            label={t.dashboard.creditsRemaining}
            value={5}
            accentColor="primary"
          />
          <StatCard
            icon={<ImageIcon className="w-5 h-5" />}
            label={t.dashboard.totalAds}
            value={0}
            accentColor="accent"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label={t.dashboard.thisMonth}
            value={0}
            accentColor="success"
          />
        </div>
      </section>

      {/* 빠른 액션 */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          빠른 시작
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            icon={<ImageIcon className="w-5 h-5" />}
            label="이미지 광고"
            description="AI로 제품 이미지 광고 생성하기"
            href="/dashboard/image-ad"
          />
          <QuickAction
            icon={<Video className="w-5 h-5" />}
            label="영상 광고"
            description="AI 아바타로 영상 광고 만들기"
            href="/dashboard/video-ad"
          />
          <QuickAction
            icon={<Music className="w-5 h-5" />}
            label="광고 음악"
            description="브랜드에 맞는 음악 생성하기"
            href="/dashboard/music"
          />
          <QuickAction
            icon={<User className="w-5 h-5" />}
            label="AI 아바타"
            description="나만의 AI 아바타 만들기"
            href="/dashboard/avatar"
          />
        </div>
      </section>
    </div>
  )
}
