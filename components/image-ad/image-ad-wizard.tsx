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

const STEPS: { step: WizardStep; title: string; description: string }[] = [
  { step: 1, title: 'Basic Info', description: 'Type, Product, Avatar' },
  { step: 2, title: 'Settings', description: 'Direct/AI/Reference' },
  { step: 3, title: 'Options', description: 'Pose, Background, Lighting' },
  { step: 4, title: 'Generate', description: 'Ratio, Quality, Price' },
]

// ============================================================
// 헤더 컴포넌트 (선택 항목 포함)
// ============================================================

function WizardHeader() {
  const { t } = useLanguage()
  const { step, adType, selectedProduct, selectedAvatarInfo, resultImages, isGenerating } = useImageAdWizard()

  const types = t.imageAdTypes as unknown as Record<string, { title: string }>
  const adTypeTitle = types[adType]?.title || adType

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

        {/* 단계 표시기 + 선택 항목 */}
        <div className="flex items-center justify-between">
          {/* 왼쪽 여백 (선택 항목과 균형 맞추기) */}
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
                {selectedProduct && selectedAvatarInfo && !isProductOnlyType && (
                  <div className="h-6 w-px bg-border" />
                )}

                {/* 아바타 */}
                {selectedAvatarInfo && !isProductOnlyType && (
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      {selectedAvatarInfo.type === 'ai-generated' ? (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
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

// ============================================================
// 컨텐츠 컴포넌트
// ============================================================

function WizardContent() {
  const { step, isLoadingDraft } = useImageAdWizard()

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
            <p className="text-lg font-medium text-foreground">저장된 작업을 불러오는 중...</p>
            <p className="text-sm text-muted-foreground mt-1">잠시만 기다려주세요</p>
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
