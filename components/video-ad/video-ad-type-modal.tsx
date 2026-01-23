/**
 * 영상 광고 유형 선택 모달
 *
 * 영상 광고 카테고리 중 하나를 선택합니다:
 * 1. 제품 설명 영상 - 아바타가 제품을 말로 설명하는 영상
 * 2. 제품 광고 - 제품만 나오는 시네마틱 광고 영상
 */

'use client'

import { useLanguage } from '@/contexts/language-context'
import { X, Mic, Package } from 'lucide-react'

export type VideoAdCategory =
  | 'productDescription'  // 제품 설명 영상 (음성으로 제품 설명)
  | 'productAd'           // 제품 광고 영상 (시네마틱 제품 영상)

interface VideoAdTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (category: VideoAdCategory) => void
}

interface CategoryInfo {
  category: VideoAdCategory
  icon: typeof Mic
  title: string
  description: string
  features: string[]
}

const CATEGORIES: CategoryInfo[] = [
  {
    category: 'productDescription',
    icon: Mic,
    title: '제품 설명 영상',
    description: '아바타가 음성으로 제품을 설명합니다',
    features: [
      'AI가 자동으로 대본 3가지 스타일 생성',
      '선택한 대본을 음성으로 변환',
      '아바타가 말하는 영상 생성',
    ],
  },
  {
    category: 'productAd',
    icon: Package,
    title: '제품 광고',
    description: '제품만 나오는 시네마틱 광고 영상입니다',
    features: [
      'AI가 최적의 광고 시나리오 추천',
      '제품 이미지로 첫 씬 3가지 생성',
      '선택한 씬으로 영상 자동 생성',
    ],
  },
]

export function VideoAdTypeModal({ isOpen, onClose, onSelect }: VideoAdTypeModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              영상 광고 유형 선택
            </h2>
            <p className="text-sm text-muted-foreground">
              원하는 영상 광고 유형을 선택하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 카테고리 목록 */}
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {CATEGORIES.map(({ category, icon: Icon, title, description, features }) => (
              <button
                key={category}
                onClick={() => onSelect(category)}
                className="flex items-start gap-4 p-4 bg-secondary/30 border border-border rounded-xl hover:border-primary hover:bg-primary/10 transition-colors text-left group"
              >
                {/* 아이콘 */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                {/* 내용 */}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {description}
                  </p>
                  <ul className="space-y-1">
                    {features.map((feature, index) => (
                      <li key={index} className="text-xs text-muted-foreground/80 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 화살표 */}
                <div className="flex-shrink-0 self-center">
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
