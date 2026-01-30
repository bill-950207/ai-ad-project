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
  titleKey: string
  defaultTitle: string
  defaultTitleKo: string
  defaultDescription: string
  defaultDescriptionKo: string
}

// ============================================================
// 기능 목록 - 단색 아이콘, AI 표현 최소화
// ============================================================

const features: Feature[] = [
  {
    icon: <ImageIcon className="w-5 h-5" />,
    titleKey: 'imageAd',
    defaultTitle: 'Image Ads',
    defaultTitleKo: '이미지 광고',
    defaultDescription: 'Create stunning product photos and lifestyle images in seconds',
    defaultDescriptionKo: '제품 사진과 라이프스타일 이미지를 빠르게 제작하세요',
  },
  {
    icon: <Video className="w-5 h-5" />,
    titleKey: 'videoAd',
    defaultTitle: 'Video Ads',
    defaultTitleKo: '영상 광고',
    defaultDescription: 'Generate professional video ads with avatars and dynamic scenes',
    defaultDescriptionKo: '아바타와 다이나믹한 장면으로 영상 광고를 만드세요',
  },
  {
    icon: <User className="w-5 h-5" />,
    titleKey: 'avatar',
    defaultTitle: 'Digital Avatars',
    defaultTitleKo: '디지털 아바타',
    defaultDescription: 'Create realistic digital avatars that represent your brand',
    defaultDescriptionKo: '브랜드를 대표하는 리얼한 디지털 아바타를 만드세요',
  },
  {
    icon: <Music className="w-5 h-5" />,
    titleKey: 'bgMusic',
    defaultTitle: 'Background Music',
    defaultTitleKo: '배경 음악',
    defaultDescription: 'Generate custom background music that matches your ad mood',
    defaultDescriptionKo: '광고 분위기에 맞는 배경 음악을 생성하세요',
  },
]

const benefits = [
  {
    icon: <Zap className="w-4 h-4" />,
    titleKo: '빠른 제작',
    title: 'Fast Creation',
    descriptionKo: '몇 분 만에 광고 완성',
    description: 'Generate ads in minutes',
  },
  {
    icon: <Palette className="w-4 h-4" />,
    titleKo: '맞춤 설정',
    title: 'Customizable',
    descriptionKo: '원하는 대로 조정 가능',
    description: 'Fine-tune every aspect',
  },
  {
    icon: <Clock className="w-4 h-4" />,
    titleKo: '시간 절약',
    title: 'Save Time',
    descriptionKo: '반복 작업 자동화',
    description: 'Automate repetitive tasks',
  },
  {
    icon: <Globe className="w-4 h-4" />,
    titleKo: '다국어 지원',
    title: 'Multi-Language',
    descriptionKo: '여러 언어로 광고 제작',
    description: 'Create ads in any language',
  },
]

// ============================================================
// 기능 카드 컴포넌트
// ============================================================

interface FeatureCardProps {
  feature: Feature
  language: string
}

function FeatureCard({ feature, language }: FeatureCardProps) {
  const isKo = language === 'ko'

  return (
    <div className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
      {/* 아이콘 - 단색 */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {feature.icon}
      </div>

      {/* 제목 */}
      <h3 className="text-base font-semibold text-foreground mb-2">
        {isKo ? feature.defaultTitleKo : feature.defaultTitle}
      </h3>

      {/* 설명 */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {isKo ? feature.defaultDescriptionKo : feature.defaultDescription}
      </p>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function FeaturesSection() {
  const { language } = useLanguage()
  const isKo = language === 'ko'

  return (
    <section id="features" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* 섹션 헤더 - 그라데이션 제거 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground">
            {isKo ? '광고 제작에 필요한 모든 것' : 'Everything You Need'}
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground text-lg">
            {isKo
              ? '전문 광고 콘텐츠 제작을 위한 도구를 제공합니다'
              : 'All the tools you need to create professional advertising content'}
          </p>
        </div>

        {/* 기능 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {features.map((feature) => (
            <FeatureCard key={feature.titleKey} feature={feature} language={language} />
          ))}
        </div>

        {/* 장점 섹션 - 단순화 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-xl border border-border bg-secondary/30">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                {benefit.icon}
              </div>
              <h4 className="font-medium text-foreground text-sm mb-0.5">
                {isKo ? benefit.titleKo : benefit.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isKo ? benefit.descriptionKo : benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
