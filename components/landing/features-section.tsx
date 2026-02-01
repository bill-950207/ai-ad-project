/**
 * 기능 소개 섹션 컴포넌트
 *
 * 플랫폼의 주요 기능을 소개합니다.
 * - 이미지 광고 생성
 * - 영상 광고 생성
 * - 디지털 아바타
 * - 배경 음악 생성
 */

'use client'

import { Image as ImageIcon, Video, User, Music, Zap, Palette, Clock, Globe } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

// ============================================================
// 타입 정의
// ============================================================

interface Feature {
  icon: React.ReactNode
  key: 'imageAd' | 'videoAd' | 'avatar' | 'bgMusic'
}

interface Benefit {
  icon: React.ReactNode
  key: 'fast' | 'customizable' | 'saveTime' | 'multiLanguage'
}

// ============================================================
// 기능 목록 - 단색 아이콘, AI 표현 최소화
// ============================================================

const features: Feature[] = [
  { icon: <ImageIcon className="w-5 h-5" />, key: 'imageAd' },
  { icon: <Video className="w-5 h-5" />, key: 'videoAd' },
  { icon: <User className="w-5 h-5" />, key: 'avatar' },
  { icon: <Music className="w-5 h-5" />, key: 'bgMusic' },
]

const benefits: Benefit[] = [
  { icon: <Zap className="w-4 h-4" />, key: 'fast' },
  { icon: <Palette className="w-4 h-4" />, key: 'customizable' },
  { icon: <Clock className="w-4 h-4" />, key: 'saveTime' },
  { icon: <Globe className="w-4 h-4" />, key: 'multiLanguage' },
]

// ============================================================
// 기능 카드 컴포넌트
// ============================================================

interface FeatureCardProps {
  feature: Feature
  items: Record<string, { title: string; description: string }>
}

function FeatureCard({ feature, items }: FeatureCardProps) {
  return (
    <div className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
      {/* 아이콘 - 단색 */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {feature.icon}
      </div>

      {/* 제목 */}
      <h3 className="text-base font-semibold text-foreground mb-2">
        {items[feature.key]?.title}
      </h3>

      {/* 설명 */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {items[feature.key]?.description}
      </p>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function FeaturesSection() {
  const { t } = useLanguage()
  const featuresT = t.features as {
    title: string
    subtitle: string
    items: Record<string, { title: string; description: string }>
    benefits: Record<string, { title: string; description: string }>
  }

  return (
    <section id="features" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* 섹션 헤더 - 그라데이션 제거 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground">
            {featuresT.title}
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground text-lg">
            {featuresT.subtitle}
          </p>
        </div>

        {/* 기능 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {features.map((feature) => (
            <FeatureCard key={feature.key} feature={feature} items={featuresT.items} />
          ))}
        </div>

        {/* 장점 섹션 - 단순화 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-xl border border-border bg-secondary/30">
          {benefits.map((benefit) => (
            <div key={benefit.key} className="text-center">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                {benefit.icon}
              </div>
              <h4 className="font-medium text-foreground text-sm mb-0.5">
                {featuresT.benefits[benefit.key]?.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {featuresT.benefits[benefit.key]?.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
