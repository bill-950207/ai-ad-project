'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { ProductAdWizardProvider, useProductAdWizard, WizardStep } from './wizard-context'
import { WizardStep1 } from './wizard-step-1'
import { WizardStep2 } from './wizard-step-2'
import { WizardStep3 } from './wizard-step-3'
import { WizardStep4 } from './wizard-step-4'
import { WizardStep5 } from './wizard-step-5'
import { WizardStep6 } from './wizard-step-6'

// 단계 정보
const STEPS = [
  { step: 1 as WizardStep, title: '제품 선택' },
  { step: 2 as WizardStep, title: '설정 방식' },
  { step: 3 as WizardStep, title: '시나리오' },
  { step: 4 as WizardStep, title: '설정' },
  { step: 5 as WizardStep, title: '첫 씬' },
  { step: 6 as WizardStep, title: '영상 생성' },
]

interface WizardHeaderProps {
  onBack?: () => void
}

function WizardHeader({ onBack }: WizardHeaderProps) {
  const { step } = useProductAdWizard()

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* 타이틀 */}
        <div className="flex items-center gap-3 mb-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-foreground">제품 광고 영상 만들기</h1>
            <p className="text-xs text-muted-foreground">제품의 매력을 담은 시네마틱 광고 영상</p>
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
                  <div className="w-10 mx-1 -mt-4">
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

function WizardContent() {
  const { step } = useProductAdWizard()

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
      {step === 1 && <WizardStep1 />}
      {step === 2 && <WizardStep2 />}
      {step === 3 && <WizardStep3 />}
      {step === 4 && <WizardStep4 />}
      {step === 5 && <WizardStep5 />}
      {step === 6 && <WizardStep6 />}
    </div>
  )
}

interface WizardInnerProps {
  onBack?: () => void
  videoAdId?: string
}

function WizardInner({ onBack, videoAdId }: WizardInnerProps) {
  const { loadDraft } = useProductAdWizard()
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!videoAdId)
  const loadAttemptedRef = useRef(false)

  useEffect(() => {
    if (videoAdId && !loadAttemptedRef.current) {
      loadAttemptedRef.current = true
      setIsLoadingDraft(true)
      loadDraft(videoAdId).finally(() => {
        setIsLoadingDraft(false)
      })
    }
  }, [videoAdId, loadDraft])

  if (isLoadingDraft) {
    return (
      <div className="min-h-full flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">진행 상태를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col bg-background">
      <WizardHeader onBack={onBack} />
      <WizardContent />
    </div>
  )
}

interface ProductAdWizardProps {
  onBack?: () => void
  videoAdId?: string
}

export function ProductAdWizard({ onBack, videoAdId }: ProductAdWizardProps) {
  return (
    <ProductAdWizardProvider>
      <WizardInner onBack={onBack} videoAdId={videoAdId} />
    </ProductAdWizardProvider>
  )
}
