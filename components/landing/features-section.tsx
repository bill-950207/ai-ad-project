/**
 * 기능 소개 섹션 컴포넌트
 *
 * 플랫폼의 주요 기능을 소개합니다.
 * - 이미지 광고 생성
 * - 영상 광고 생성
 * - AI 아바타
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
  titleKey: string
  descriptionKey: string
  defaultTitle: string
  defaultDescription: string
  gradient: string
}

// ============================================================
// 기능 목록
// ============================================================

const features: Feature[] = [
  {
    icon: <ImageIcon className="w-6 h-6" />,
    titleKey: 'imageAd',
    descriptionKey: 'imageAdDesc',
    defaultTitle: 'Image Ads',
    defaultDescription: 'Create stunning product photos and lifestyle images with AI in seconds',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: <Video className="w-6 h-6" />,
    titleKey: 'videoAd',
    descriptionKey: 'videoAdDesc',
    defaultTitle: 'Video Ads',
    defaultDescription: 'Generate professional video ads with AI avatars and dynamic scenes',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: <User className="w-6 h-6" />,
    titleKey: 'aiAvatar',
    descriptionKey: 'aiAvatarDesc',
    defaultTitle: 'AI Avatars',
    defaultDescription: 'Create realistic digital avatars that represent your brand',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Music className="w-6 h-6" />,
    titleKey: 'bgMusic',
    descriptionKey: 'bgMusicDesc',
    defaultTitle: 'Background Music',
    defaultDescription: 'Generate custom background music that matches your ad mood',
    gradient: 'from-emerald-500 to-teal-500',
  },
]

const benefits = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Lightning Fast',
    description: 'Generate ads in minutes, not days',
  },
  {
    icon: <Palette className="w-5 h-5" />,
    title: 'Fully Customizable',
    description: 'Fine-tune every aspect of your ads',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Save Time',
    description: 'Automate repetitive creative tasks',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Multi-Language',
    description: 'Create ads in multiple languages',
  },
]

// ============================================================
// 기능 카드 컴포넌트
// ============================================================

interface FeatureCardProps {
  feature: Feature
  index: number
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  return (
    <div
      className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 아이콘 */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {feature.icon}
      </div>

      {/* 제목 */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {feature.defaultTitle}
      </h3>

      {/* 설명 */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {feature.defaultDescription}
      </p>

      {/* 호버 시 그라데이션 배경 */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function FeaturesSection() {
  const { t } = useLanguage()

  return (
    <section className="px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need to Create
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent"> Amazing Ads</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Our AI-powered platform provides all the tools you need to create professional advertising content
          </p>
        </div>

        {/* 기능 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <FeatureCard key={feature.titleKey} feature={feature} index={index} />
          ))}
        </div>

        {/* 장점 섹션 */}
        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 rounded-3xl blur-3xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                  {benefit.icon}
                </div>
                <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
