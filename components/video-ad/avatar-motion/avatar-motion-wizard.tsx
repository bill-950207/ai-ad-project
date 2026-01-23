'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, Check, Loader2, Package, Sparkles, User } from 'lucide-react'
import { AvatarMotionWizardProvider, useAvatarMotionWizard, WizardStep } from './wizard-context'
import { WizardStep1 } from './wizard-step-1'
import { WizardStep2 } from './wizard-step-2'
import { WizardStep3Scenario } from './wizard-step-3-scenario'
import { WizardStep4Settings } from './wizard-step-4-settings'
import { WizardStep5Frames } from './wizard-step-5-frames'
import { WizardStep6Video } from './wizard-step-6-video'

// 단계 정보 (6단계)
const STEPS = [
  { step: 1 as WizardStep, title: '아바타/제품' },
  { step: 2 as WizardStep, title: '스토리 방식' },
  { step: 3 as WizardStep, title: '시나리오' },
  { step: 4 as WizardStep, title: '영상 설정' },
  { step: 5 as WizardStep, title: '프레임 생성' },
  { step: 6 as WizardStep, title: '영상 생성' },
]

interface WizardHeaderProps {
  onBack?: () => void
}

function WizardHeader({ onBack }: WizardHeaderProps) {
  const { step, selectedProduct, selectedAvatarInfo } = useAvatarMotionWizard()

  const productImageUrl = selectedProduct?.rembg_image_url || selectedProduct?.image_url
  const showSelectedItems = step >= 2 && (selectedProduct || selectedAvatarInfo)

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-4 py-3">
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
            <h1 className="text-lg font-bold text-foreground">아바타 모션 영상 만들기</h1>
            <p className="text-xs text-muted-foreground">아바타가 제품을 들고 자연스럽게 모션하는 영상</p>
          </div>
        </div>

        {/* 단계 표시기 + 선택 항목 */}
        <div className="flex items-center justify-between">
          {/* 왼쪽 여백 */}
          <div className="w-48 hidden lg:block" />

          {/* 중앙: 단계 표시기 */}
          <div className="flex items-center justify-center flex-1 lg:flex-none">
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

                  {/* 연결선 */}
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

          {/* 오른쪽: 선택 항목 요약 */}
          <div className="w-48 hidden lg:flex items-center justify-end gap-2">
            {showSelectedItems && (
              <>
                {/* 제품 */}
                {selectedProduct && (
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      {productImageUrl ? (
                        <Image
                          src={productImageUrl}
                          alt={selectedProduct.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                      {selectedProduct.name}
                    </p>
                  </div>
                )}

                {/* 구분선 */}
                {selectedProduct && selectedAvatarInfo && (
                  <div className="h-6 w-px bg-border" />
                )}

                {/* 아바타 */}
                {selectedAvatarInfo && (
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      {selectedAvatarInfo.type === 'ai-generated' ? (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      ) : selectedAvatarInfo.imageUrl ? (
                        <Image
                          src={selectedAvatarInfo.imageUrl}
                          alt={selectedAvatarInfo.displayName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                      {selectedAvatarInfo.displayName}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function WizardContent() {
  const { step } = useAvatarMotionWizard()
  const prevStepRef = useRef(step)

  // 스텝 변경 시 스크롤 상단으로 이동
  useEffect(() => {
    if (prevStepRef.current !== step) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      prevStepRef.current = step
    }
  }, [step])

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
      {step === 1 && <WizardStep1 />}
      {step === 2 && <WizardStep2 />}
      {step === 3 && <WizardStep3Scenario />}
      {step === 4 && <WizardStep4Settings />}
      {step === 5 && <WizardStep5Frames />}
      {step === 6 && <WizardStep6Video />}
    </div>
  )
}

interface WizardInnerProps {
  onBack?: () => void
  videoAdId?: string
}

function WizardInner({ onBack, videoAdId }: WizardInnerProps) {
  const { loadDraft } = useAvatarMotionWizard()
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

interface AvatarMotionWizardProps {
  onBack?: () => void
  videoAdId?: string
}

export function AvatarMotionWizard({ onBack, videoAdId }: AvatarMotionWizardProps) {
  return (
    <AvatarMotionWizardProvider>
      <WizardInner onBack={onBack} videoAdId={videoAdId} />
    </AvatarMotionWizardProvider>
  )
}
