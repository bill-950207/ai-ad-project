/**
 * 대시보드 콘텐츠 컴포넌트
 *
 * 대시보드 메인 페이지의 콘텐츠를 담당합니다.
 * - 페이지 제목 및 설명
 * - 광고 생성 버튼 (이미지 광고, 영상 광고)
 * - 최근 작업 (기존 유저) 또는 쇼케이스 갤러리 (신규 유저)
 */

'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Video, ArrowRight, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useOnboarding } from '@/components/onboarding/onboarding-context'
import { OnboardingFlowModal } from '@/components/onboarding/onboarding-flow-modal'
import { RecentAdsSection } from './recent-ads-section'
import { ShowcaseGallery } from './showcase-gallery'

// ============================================================
// 타입 정의
// ============================================================

interface DashboardContentProps {
  userEmail?: string
}

// 예시 이미지/영상 URL (실제 서비스에서는 CDN이나 R2 URL 사용)
const IMAGE_AD_EXAMPLES = [
  '/examples/image-ad-1.webp',
  '/examples/image-ad-2.webp',
  '/examples/image-ad-3.webp',
]

// 영상 광고 예시 비디오
const VIDEO_AD_EXAMPLE = '/examples/video-ad-example.mp4'

// ============================================================
// 배경 이미지 슬라이더 컴포넌트
// ============================================================

interface BackgroundSliderProps {
  images: string[]
  interval?: number
}

function BackgroundSlider({ images, interval = 4000 }: BackgroundSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [hasAnyLoaded, setHasAnyLoaded] = useState(false)

  // 이미지 프리로드
  useEffect(() => {
    images.forEach((src) => {
      const img = new window.Image()
      img.onload = () => {
        setLoadedImages((prev) => new Set(prev).add(src))
        setHasAnyLoaded(true)
      }
      img.src = src
    })
  }, [images])

  // 슬라이드 타이머
  useEffect(() => {
    if (!hasAnyLoaded) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [images.length, interval, hasAnyLoaded])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 이미지 슬라이드 */}
      {hasAnyLoaded && images.map((src, index) => (
        <div
          key={src}
          className={`
            absolute inset-0 bg-cover bg-center
            transition-opacity duration-1000 ease-in-out
            ${index === currentIndex && loadedImages.has(src) ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      {/* 하단 텍스트 가독성을 위한 최소 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* 노이즈 텍스처 (미묘한 그레인) */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }} />
    </div>
  )
}

// ============================================================
// 광고 생성 카드 컴포넌트
// ============================================================

interface AdCreationCardProps {
  type: 'image' | 'video'
  title: string
  description: string
  images?: string[]
  videoUrl?: string
  gradientFrom: string
  icon: React.ReactNode
  onClick: () => void
  delay?: number
}

function AdCreationCard({
  type,
  title,
  description,
  images,
  videoUrl,
  gradientFrom,
  icon,
  onClick,
  delay = 0,
}: AdCreationCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl text-left aspect-square w-full max-w-[280px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background animate-[slideUp_0.5s_ease-out_backwards]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 배경 - 이미지 또는 비디오 */}
      {type === 'video' && videoUrl ? (
        <div className="absolute inset-0 overflow-hidden">
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* 하단 텍스트 가독성을 위한 최소 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ) : images ? (
        <BackgroundSlider images={images} interval={5000} />
      ) : null}

      {/* 폴백 그라데이션 (이미지 없을 때) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} via-card to-card -z-10`} />

      {/* 호버 시 밝아지는 효과 */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />

      {/* 컨텐츠 */}
      <div className="relative z-10 h-full p-4 flex flex-col justify-between">
        {/* 상단 */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20 group-hover:bg-white/20 group-hover:scale-105 transition-[background-color,transform] duration-300">
            {icon}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-medium text-white/80">
            <Sparkles className="w-2.5 h-2.5" />
            AI
          </div>
        </div>

        {/* 하단 */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-[color,transform] duration-300" />
          </div>
          <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {/* 테두리 */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-[box-shadow] duration-300" />

      {/* 호버 시 하단 악센트 라인 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DashboardContent({ userEmail: _userEmail }: DashboardContentProps) {
  const { t } = useLanguage()
  const { startOnboarding } = useOnboarding()

  return (
    <div className="space-y-10">
      {/* 페이지 헤더 */}
      <div className="animate-[fadeIn_0.4s_ease-out]">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
          {t.dashboard.title}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t.dashboard.subtitle}
        </p>
      </div>

      {/* 광고 생성 카드 */}
      <div className="flex flex-wrap gap-5">
        <AdCreationCard
          type="image"
          title={t.nav.imageAd}
          description={t.imageAd.subtitle}
          images={IMAGE_AD_EXAMPLES}
          gradientFrom="from-violet-600/40"
          icon={<ImageIcon className="w-5 h-5 text-white" />}
          onClick={() => startOnboarding('image')}
          delay={100}
        />
        <AdCreationCard
          type="video"
          title={t.nav.videoAd}
          description={t.videoAd.subtitle}
          videoUrl={VIDEO_AD_EXAMPLE}
          gradientFrom="from-rose-600/40"
          icon={<Video className="w-5 h-5 text-white" />}
          onClick={() => startOnboarding('video')}
          delay={200}
        />
      </div>

      {/* 최근 생성 광고 + 쇼케이스 갤러리 */}
      <div className="animate-[fadeIn_0.4s_ease-out_0.3s_backwards] space-y-8">
        {/* 최근 생성 광고 - 이미지+영상 혼합, 최근 5개 */}
        <RecentAdsSection />

        {/* 쇼케이스 갤러리 - 이미지/영상 각각 5x3 그리드 */}
        <ShowcaseGallery />
      </div>

      {/* 온보딩 플로우 모달 */}
      <OnboardingFlowModal />
    </div>
  )
}
