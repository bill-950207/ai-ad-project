/**
 * 빠른 액션 카드 컴포넌트
 *
 * 대시보드에서 제품/아바타/음악 관리로 빠르게 이동할 수 있는 카드들
 */

'use client'

import Link from 'next/link'
import { Package, User, Music, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface QuickActionCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  accentColor: string
  iconBg: string
  delay?: number
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
  accentColor,
  iconBg,
  delay = 0
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border hover:bg-card/80 transition-all duration-300 animate-[slideUp_0.4s_ease-out_backwards]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 아이콘 */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
        {icon}
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-sm mb-0.5 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {description}
        </p>
      </div>

      {/* 화살표 */}
      <ChevronRight className={`w-5 h-5 text-muted-foreground group-hover:${accentColor} group-hover:translate-x-1 transition-all duration-300`} />

      {/* 호버 악센트 라인 */}
      <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-transparent ${accentColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </Link>
  )
}

export function QuickActions() {
  const { t } = useLanguage()

  const actions = [
    {
      href: '/dashboard/ad-products',
      icon: <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      title: t.dashboard?.quickActions?.product || '광고 제품 등록',
      description: t.dashboard?.quickActions?.productDesc || '광고에 사용할 제품 등록',
      accentColor: 'via-emerald-500',
      iconBg: 'bg-emerald-500/10'
    },
    {
      href: '/dashboard/avatar',
      icon: <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: t.dashboard?.quickActions?.avatar || '아바타 만들기',
      description: t.dashboard?.quickActions?.avatarDesc || 'AI 아바타 생성 및 관리',
      accentColor: 'via-blue-500',
      iconBg: 'bg-blue-500/10'
    },
    {
      href: '/dashboard/music',
      icon: <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      title: t.dashboard?.quickActions?.music || '광고 음악 만들기',
      description: t.dashboard?.quickActions?.musicDesc || '배경 음악 AI 생성',
      accentColor: 'via-purple-500',
      iconBg: 'bg-purple-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map((action, index) => (
        <QuickActionCard
          key={action.href}
          {...action}
          delay={100 + index * 50}
        />
      ))}
    </div>
  )
}
