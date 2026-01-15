'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft, Check } from 'lucide-react'
import { ImageAdType } from '@/components/ad-product/image-ad-type-modal'
import { ImageAdWizardProvider, useImageAdWizard, WizardStep } from './wizard-context'
import { WizardStep1 } from './wizard-step-1'
import { WizardStep2 } from './wizard-step-2'
import { WizardStep3 } from './wizard-step-3'
import { WizardStep4 } from './wizard-step-4'

// ============================================================
// 단계 정보
// ============================================================

const STEPS: { step: WizardStep; title: string; description: string }[] = [
  { step: 1, title: '기본 정보', description: '유형, 제품, 아바타' },
  { step: 2, title: '설정 방식', description: '직접/AI/참조' },
  { step: 3, title: '상세 옵션', description: '포즈, 배경, 조명' },
  { step: 4, title: '생성', description: '비율, 퀄리티, 가격' },
]

// ============================================================
// 헤더 컴포넌트
// ============================================================

function WizardHeader() {
  const { t } = useLanguage()
  const { step, adType, isGenerating, resultImages } = useImageAdWizard()

  const types = t.imageAdTypes as unknown as Record<string, { title: string }>
  const adTypeTitle = types[adType]?.title || adType

  // 결과 화면에서는 헤더 숨김
  if (resultImages.length > 0) {
    return null
  }

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* 타이틀 */}
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/dashboard/image-ad"
            className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">이미지 광고 생성</h1>
            <p className="text-xs text-muted-foreground">{adTypeTitle}</p>
          </div>
        </div>

        {/* 단계 표시기 */}
        <div className="flex items-center justify-center">
          {STEPS.map(({ step: s, title }, index) => {
            const isCompleted = step > s
            const isCurrent = step === s

            return (
              <div key={s} className="flex items-center">
                {/* 단계 원 + 텍스트 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                          : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      s
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                      isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {title}
                  </span>
                </div>

                {/* 연결선 - 원의 세로 중간에 위치 */}
                {index < STEPS.length - 1 && (
                  <div className="w-12 mx-1 -mt-4">
                    <div
                      className={`h-0.5 rounded-full transition-all ${
                        isCompleted ? 'bg-primary' : 'bg-secondary'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 컨텐츠 컴포넌트
// ============================================================

function WizardContent() {
  const { step } = useImageAdWizard()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {step === 1 && <WizardStep1 />}
      {step === 2 && <WizardStep2 />}
      {step === 3 && <WizardStep3 />}
      {step === 4 && <WizardStep4 />}
    </div>
  )
}

// ============================================================
// 메인 마법사 컴포넌트
// ============================================================

interface ImageAdWizardProps {
  initialAdType?: ImageAdType
}

export function ImageAdWizard({ initialAdType = 'productOnly' }: ImageAdWizardProps) {
  return (
    <ImageAdWizardProvider initialAdType={initialAdType}>
      <div className="min-h-full flex flex-col bg-background">
        <WizardHeader />
        <div className="flex-1">
          <WizardContent />
        </div>
      </div>
    </ImageAdWizardProvider>
  )
}
