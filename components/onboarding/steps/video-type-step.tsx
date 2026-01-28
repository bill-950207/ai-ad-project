/**
 * 영상 광고 유형 선택 단계
 *
 * 영상 광고 생성 시 먼저 유형을 선택:
 * 1. 제품 설명 영상: 아바타가 제품을 소개하는 토킹 영상
 * 2. 제품 광고 영상: 제품 중심의 광고 영상
 */

'use client'

import { Package, User, ArrowRight, LucideIcon } from 'lucide-react'
import { useOnboarding, VideoAdType } from '../onboarding-context'

interface VideoTypeOption {
  type: VideoAdType
  title: string
  description: string
  icon: LucideIcon
  features: string[]
}

const VIDEO_TYPE_OPTIONS: VideoTypeOption[] = [
  {
    type: 'productDescription',
    title: '제품 설명 영상',
    description: '아바타가 제품을 소개하는 토킹 영상',
    icon: User,
    features: [
      '아바타가 직접 제품 설명',
      'AI 음성 및 립싱크',
      '인플루언서 스타일 영상',
    ],
  },
  {
    type: 'productAd',
    title: '제품 광고 영상',
    description: '제품 중심의 시네마틱 광고 영상',
    icon: Package,
    features: [
      '제품 중심 비주얼',
      '다양한 씬 구성',
      '배경 음악 자동 생성',
    ],
  },
]

export function VideoTypeStep() {
  const { setVideoAdType } = useOnboarding()

  const handleSelectType = (type: VideoAdType) => {
    setVideoAdType(type)
  }

  return (
    <div className="space-y-6">
      {/* 안내 텍스트 */}
      <div className="text-center animate-[fadeIn_0.3s_ease-out]">
        <p className="text-muted-foreground">
          만들고 싶은 영상 광고 유형을 선택하세요
        </p>
      </div>

      {/* 카드 리스트 */}
      <div className="space-y-3 max-w-2xl mx-auto">
        {VIDEO_TYPE_OPTIONS.map((option, index) => {
          const Icon = option.icon

          return (
            <button
              key={option.type}
              onClick={() => handleSelectType(option.type)}
              className="group relative w-full bg-card border border-border/60 rounded-2xl p-5 text-left overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-[border-color,box-shadow,transform] duration-200 ease-out motion-reduce:transform-none animate-[slideUp_0.4s_ease-out_backwards]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* 호버 시 배경 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              <div className="relative flex items-start gap-5">
                {/* 아이콘 */}
                <div className="relative w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 text-primary group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20 transition-[background,color,box-shadow] duration-200">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight">
                      {option.title}
                    </h3>
                    <ArrowRight
                      className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-[color,transform] duration-200 flex-shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {option.description}
                  </p>

                  {/* 특징 태그 */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {option.features.map((feature, featureIndex) => (
                      <span
                        key={featureIndex}
                        className="text-xs px-2.5 py-1 bg-secondary/80 rounded-lg text-muted-foreground font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
