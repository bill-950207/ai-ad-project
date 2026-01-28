/**
 * 이미지 광고 유형 선택 단계
 *
 * 이미지 광고 생성 시 먼저 유형을 선택:
 * 1. 제품만: 제품 중심 이미지
 * 2. 들고 있는: 모델이 제품을 들고 있는 이미지
 * 3. 사용 중: 모델이 제품을 사용하는 이미지
 * 4. 착용: 모델이 제품을 착용한 이미지
 * 5. 라이프스타일: 일상 속 제품 이미지
 * 6. 언박싱: 제품 개봉 이미지
 * 7. 시즌/이벤트: 계절/이벤트 테마 이미지
 */

'use client'

import { ArrowRight, Box, Hand, Sparkles, Shirt, Coffee, Package, Calendar, User, LucideIcon } from 'lucide-react'
import { useOnboarding, ImageAdType } from '../onboarding-context'
import { useLanguage } from '@/contexts/language-context'

interface ImageTypeOption {
  type: ImageAdType
  icon: LucideIcon
  needsModel: boolean
}

const IMAGE_TYPE_OPTIONS: ImageTypeOption[] = [
  { type: 'productOnly', icon: Box, needsModel: false },
  { type: 'holding', icon: Hand, needsModel: true },
  { type: 'using', icon: Sparkles, needsModel: true },
  { type: 'wearing', icon: Shirt, needsModel: true },
  { type: 'lifestyle', icon: Coffee, needsModel: true },
  { type: 'unboxing', icon: Package, needsModel: true },
  { type: 'seasonal', icon: Calendar, needsModel: true },
]

export function ImageTypeStep() {
  const { setImageAdType } = useOnboarding()
  const { t } = useLanguage()

  // 번역 가져오기
  const getTypeTranslation = (type: ImageAdType) => {
    const types = t.imageAdTypes as unknown as Record<string, { title: string; description: string }>
    return types[type] || { title: type, description: '' }
  }

  const handleSelectType = (type: ImageAdType) => {
    setImageAdType(type)
  }

  return (
    <div className="space-y-6">
      {/* 안내 텍스트 */}
      <div className="text-center animate-[fadeIn_0.3s_ease-out]">
        <p className="text-muted-foreground">
          만들고 싶은 이미지 광고 유형을 선택하세요
        </p>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {IMAGE_TYPE_OPTIONS.map((option, index) => {
          const translation = getTypeTranslation(option.type)
          const Icon = option.icon

          return (
            <button
              key={option.type}
              onClick={() => handleSelectType(option.type)}
              className="group relative w-full bg-card border border-border/60 rounded-2xl p-4 text-left overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-[border-color,box-shadow,transform] duration-200 ease-out motion-reduce:transform-none animate-[slideUp_0.4s_ease-out_backwards]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* 호버 시 배경 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              <div className="relative flex items-start gap-4">
                {/* 아이콘 */}
                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 text-primary group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20 transition-[background,color,box-shadow] duration-200">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground tracking-tight">
                      {translation.title}
                    </h3>
                    <ArrowRight
                      className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-[color,transform] duration-200 flex-shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {translation.description}
                  </p>

                  {/* 모델 필요 여부 태그 */}
                  <div className="flex items-center gap-2 mt-2.5">
                    {option.needsModel ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-secondary/80 rounded-lg text-muted-foreground font-medium">
                        <User className="w-3 h-3" aria-hidden="true" />
                        모델 포함
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs px-2 py-1 bg-primary/10 rounded-lg text-primary font-medium">
                        제품만
                      </span>
                    )}
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
