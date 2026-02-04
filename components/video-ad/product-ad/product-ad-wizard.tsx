'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Check, Loader2, Package } from 'lucide-react'
import { ProductAdWizardProvider, useProductAdWizard, WizardStep } from './wizard-context'
import { WizardStep1 } from './wizard-step-1'
import { WizardStep2 } from './wizard-step-2'
import { WizardStep3 } from './wizard-step-3'
import { WizardStep4 } from './wizard-step-4'
import { WizardStep5 } from './wizard-step-5'
import { useLanguage } from '@/contexts/language-context'

// Step titles will be translated in the component
function useStepTitles() {
  const { t } = useLanguage()
  return [
    { step: 1 as WizardStep, title: t.productAdWizard?.steps?.selectProduct || 'Select Product' },
    { step: 2 as WizardStep, title: t.productAdWizard?.steps?.configMethod || 'Config Method' },
    { step: 3 as WizardStep, title: t.productAdWizard?.steps?.scenarioSettings || 'Scenario & Settings' },
    { step: 4 as WizardStep, title: t.productAdWizard?.steps?.firstScene || 'First Scene' },
    { step: 5 as WizardStep, title: t.productAdWizard?.steps?.generateVideo || 'Generate Video' },
  ]
}

function WizardHeader() {
  const { step, selectedProduct, isGeneratingVideo, resultVideoUrls } = useProductAdWizard()
  const { t } = useLanguage()
  const STEPS = useStepTitles()

  // 결과 화면 또는 생성 중에는 헤더 숨김
  if (resultVideoUrls.length > 0 || isGeneratingVideo) {
    return null
  }

  const productImageUrl = selectedProduct?.rembg_image_url || selectedProduct?.image_url
  const showSelectedProduct = step >= 2 && selectedProduct

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* 상단: 타이틀 + 선택 항목 */}
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/dashboard/video-ad"
            className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground">{t.videoAd?.createTitle || 'Create Video Ad'}</h1>
            <p className="text-xs text-muted-foreground">{t.productAdWizard?.header?.subtitle || 'Cinematic ad video'}</p>
          </div>

          {/* 스페이서 */}
          <div className="flex-1" />

          {/* 선택 항목 요약 */}
          {showSelectedProduct && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0 ring-1 ring-border">
                {productImageUrl ? (
                  <Image
                    src={productImageUrl}
                    alt={selectedProduct.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-[80px]">
                {selectedProduct.name}
              </p>
            </div>
          )}
        </div>

        {/* 하단: 단계 표시기 */}
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

                {/* 연결선 */}
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
    </div>
  )
}

interface WizardInnerProps {
  videoAdId?: string
}

function WizardInner({ videoAdId }: WizardInnerProps) {
  const { loadDraft, isSaving, pendingSave } = useProductAdWizard()
  const { t } = useLanguage()
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

  // 페이지 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSave || isSaving) {
        e.preventDefault()
        e.returnValue = t.common?.unsavedChanges || 'You have unsaved changes.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pendingSave, isSaving, t])

  if (isLoadingDraft) {
    return (
      <div className="min-h-full flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t.productAdWizard?.loading || 'Loading progress...'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col bg-background">
      <WizardHeader />
      <WizardContent />
    </div>
  )
}

interface ProductAdWizardProps {
  videoAdId?: string
  initialProductId?: string | null
  initialStep?: number
}

export function ProductAdWizard({ videoAdId, initialProductId, initialStep = 1 }: ProductAdWizardProps) {
  return (
    <ProductAdWizardProvider initialProductId={initialProductId} initialStep={initialStep}>
      <WizardInner videoAdId={videoAdId} />
    </ProductAdWizardProvider>
  )
}
