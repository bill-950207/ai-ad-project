'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft, Check, Package, Sparkles, User } from 'lucide-react'
import { ImageAdType } from '@/components/ad-product/image-ad-type-modal'
import { ImageAdWizardProvider, useImageAdWizard, WizardStep } from './wizard-context'
import { WizardStep1 } from './wizard-step-1'
import { WizardStep2 } from './wizard-step-2'
import { WizardStep3 } from './wizard-step-3'
import { WizardStep4 } from './wizard-step-4'

// ============================================================
// 단계 정보
// ============================================================

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const

// ============================================================
// 헤더 컴포넌트 (선택 항목 포함)
// ============================================================

function WizardHeader() {
  const { t } = useLanguage()
  const { step, adType, selectedProduct, selectedAvatarInfo, resultImages, isGenerating } = useImageAdWizard()

  const types = t.imageAdTypes as unknown as Record<string, { title: string }>
  const adTypeTitle = types[adType]?.title || adType

  // 번역된 단계 정보
  const imageAdT = t.imageAd as { wizard?: { steps?: Record<string, { title?: string; description?: string }> }; createTitle?: string } | undefined
  const wizardSteps = imageAdT?.wizard?.steps
  const STEPS = STEP_KEYS.map((key, index) => ({
    step: (index + 1) as WizardStep,
    title: wizardSteps?.[key]?.title || ['Basic Info', 'Settings', 'Options', 'Generate'][index],
    description: wizardSteps?.[key]?.description || ''
  }))

  // 결과 화면 또는 생성 중에는 헤더 숨김
  if (resultImages.length > 0 || isGenerating) {
    return null
  }

  // productOnly 타입이면 제품만 표시
  const isProductOnlyType = adType === 'productOnly'
  const productImageUrl = selectedProduct?.rembg_image_url || selectedProduct?.image_url
  const avatarImageUrl = selectedAvatarInfo?.imageUrl
  const showSelectedItems = step >= 2 && (selectedProduct || selectedAvatarInfo)

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* 상단: 타이틀 + 선택 항목 */}
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/dashboard/image-ad"
            className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground">{imageAdT?.createTitle || 'Create Image Ad'}</h1>
            <p className="text-xs text-muted-foreground">{adTypeTitle}</p>
          </div>

          {/* 스페이서 */}
          <div className="flex-1" />

          {/* 선택 항목 요약 */}
          {showSelectedItems && (
            <div className="hidden sm:flex items-center gap-3">
              {/* 제품 */}
              {selectedProduct && (
                <div className="flex items-center gap-2">
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

              {/* 구분선 */}
              {selectedProduct && selectedAvatarInfo && !isProductOnlyType && (
                <div className="h-8 w-px bg-border" />
              )}

              {/* 아바타 */}
              {selectedAvatarInfo && !isProductOnlyType && (
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0 ring-1 ring-border">
                    {selectedAvatarInfo.type === 'ai-generated' ? (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    ) : avatarImageUrl ? (
                      <Image
                        src={avatarImageUrl}
                        alt={selectedAvatarInfo.displayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 max-w-[80px]">
                    {selectedAvatarInfo.displayName}
                  </p>
                </div>
              )}
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
  const { t } = useLanguage()
  const { step, isLoadingDraft } = useImageAdWizard()

  const imageAdT = t.imageAd as { loadingDraft?: string; pleaseWait?: string } | undefined

  // Draft 로딩 중
  if (isLoadingDraft) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">{imageAdT?.loadingDraft || 'Loading saved work...'}</p>
            <p className="text-sm text-muted-foreground mt-1">{imageAdT?.pleaseWait || 'Please wait'}</p>
          </div>
        </div>
      </div>
    )
  }

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
  initialStep?: number
  initialProductId?: string | null
  initialAvatarType?: 'ai' | 'avatar' | 'outfit' | null
  initialAvatarId?: string | null
  initialOutfitId?: string | null
  initialAiAvatarOptions?: string | null  // JSON string
  initialDraftId?: string | null
}

export function ImageAdWizard({
  initialAdType = 'productOnly',
  initialStep = 1,
  initialProductId,
  initialAvatarType,
  initialAvatarId,
  initialOutfitId,
  initialAiAvatarOptions,
  initialDraftId,
}: ImageAdWizardProps) {
  // Parse AI avatar options if provided as JSON string
  const parsedAiAvatarOptions = initialAiAvatarOptions
    ? (() => {
        try {
          return JSON.parse(initialAiAvatarOptions)
        } catch {
          return null
        }
      })()
    : null

  return (
    <ImageAdWizardProvider
      initialAdType={initialAdType}
      initialStep={initialStep}
      initialProductId={initialProductId}
      initialAvatarType={initialAvatarType}
      initialAvatarId={initialAvatarId}
      initialOutfitId={initialOutfitId}
      initialAiAvatarOptions={parsedAiAvatarOptions}
      initialDraftId={initialDraftId}
    >
      <div className="min-h-full flex flex-col bg-background">
        <WizardHeader />
        <div className="flex-1">
          <WizardContent />
        </div>
      </div>
    </ImageAdWizardProvider>
  )
}
