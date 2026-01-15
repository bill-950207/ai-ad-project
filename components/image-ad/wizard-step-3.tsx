'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  Bot,
  Edit3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { CATEGORY_OPTIONS } from '@/lib/image-ad/category-options'
import { useImageAdWizard } from './wizard-context'

export function WizardStep3() {
  const { t, language } = useLanguage()
  const {
    adType,
    selectedProduct,
    selectedAvatarInfo,
    settingMethod,
    analysisResult,
    categoryOptions,
    setCategoryOptions,
    customOptions,
    setCustomOptions,
    customInputActive,
    setCustomInputActive,
    additionalPrompt,
    setAdditionalPrompt,
    aiStrategy,
    setAiStrategy,
    aiReasons,
    setAiReasons,
    isAiRecommending,
    setIsAiRecommending,
    hasLoadedAiRecommendation,
    setHasLoadedAiRecommendation,
    updateCategoryOption,
    updateCustomOption,
    toggleCustomInput,
    goToNextStep,
    goToPrevStep,
  } = useImageAdWizard()

  // AI 자동 설정 로드 (Step 3 진입 시)
  useEffect(() => {
    if (settingMethod === 'ai-auto' && !hasLoadedAiRecommendation) {
      loadAiRecommendation()
    } else if (settingMethod === 'reference' && analysisResult?.analyzedOptions) {
      applyAnalysisResult()
    }
  }, [settingMethod, hasLoadedAiRecommendation])

  // AI 추천 로드
  const loadAiRecommendation = async () => {
    setIsAiRecommending(true)
    setHasLoadedAiRecommendation(true)

    try {
      const res = await fetch('/api/image-ads/recommend-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adType,
          productName: selectedProduct?.name,
          productDescription: selectedProduct?.description,
          language,
        }),
      })

      if (!res.ok) {
        throw new Error('추천 생성 실패')
      }

      const result = await res.json()

      // 추천된 옵션 적용
      if (result.recommendedOptions) {
        const newCategoryOptions: Record<string, string> = {}
        const newCustomOptions: Record<string, string> = {}
        const newCustomInputActive: Record<string, boolean> = {}
        const newAiReasons: Record<string, string> = {}

        for (const [key, option] of Object.entries(result.recommendedOptions)) {
          const opt = option as { value: string; customText?: string; reason: string }

          if (opt.value === '__custom__' && opt.customText) {
            newCategoryOptions[key] = '__custom__'
            newCustomOptions[key] = opt.customText
            newCustomInputActive[key] = true
          } else {
            newCategoryOptions[key] = opt.value
            newCustomInputActive[key] = false
          }

          newAiReasons[key] = opt.reason
        }

        setCategoryOptions(newCategoryOptions)
        setCustomOptions(newCustomOptions)
        setCustomInputActive(newCustomInputActive)
        setAiReasons(newAiReasons)
      }

      if (result.overallStrategy) {
        setAiStrategy(result.overallStrategy)
      }

      // 추가 설명 적용
      if (result.suggestedPrompt) {
        setAdditionalPrompt(result.suggestedPrompt)
      }
    } catch (error) {
      console.error('AI 자동 설정 오류:', error)
    } finally {
      setIsAiRecommending(false)
    }
  }

  // 참조 이미지 분석 결과 적용
  const applyAnalysisResult = () => {
    if (!analysisResult?.analyzedOptions) return

    const newCategoryOptions: Record<string, string> = {}
    const newCustomOptions: Record<string, string> = {}
    const newCustomInputActive: Record<string, boolean> = {}
    const newAiReasons: Record<string, string> = {}

    for (const opt of analysisResult.analyzedOptions) {
      if (opt.type === 'custom' && opt.customText) {
        newCategoryOptions[opt.key] = '__custom__'
        newCustomOptions[opt.key] = opt.customText
        newCustomInputActive[opt.key] = true
      } else {
        newCategoryOptions[opt.key] = opt.value
        newCustomInputActive[opt.key] = false
      }

      newAiReasons[opt.key] = `참조 이미지에서 분석됨 (신뢰도: ${Math.round(opt.confidence * 100)}%)`
    }

    setCategoryOptions(newCategoryOptions)
    setCustomOptions(newCustomOptions)
    setCustomInputActive(newCustomInputActive)
    setAiReasons(newAiReasons)

    if (analysisResult.overallStyle) {
      setAiStrategy(analysisResult.overallStyle)
    }
  }

  // AI 재추천
  const handleRefreshAiRecommendation = () => {
    setHasLoadedAiRecommendation(false)
    loadAiRecommendation()
  }

  // 번역
  const imageAdCreate = t.imageAdCreate as {
    categoryOptions?: {
      groups: Record<string, string>
      options: Record<string, string>
    }
    additionalPrompt?: string
    additionalPromptPlaceholder?: string
  }

  const categoryConfig = CATEGORY_OPTIONS[adType]

  if (!categoryConfig) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        해당 광고 유형에 대한 옵션이 없습니다.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* AI 추천 로딩 */}
      {isAiRecommending && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-foreground mb-1">AI가 최적의 설정을 분석 중입니다</h3>
              <p className="text-sm text-muted-foreground">
                {selectedProduct ? `"${selectedProduct.name}"` : '제품'}에 맞는 광고 설정을 추천하고 있습니다...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI 전략 설명 */}
      {aiStrategy && !isAiRecommending && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-primary">
                  {settingMethod === 'reference' ? 'AI 분석 결과' : 'AI 추천 전략'}
                </h3>
                {settingMethod === 'ai-auto' && (
                  <button
                    onClick={handleRefreshAiRecommendation}
                    disabled={isAiRecommending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    다시 추천
                  </button>
                )}
              </div>
              <p className="text-sm text-foreground">{aiStrategy}</p>
            </div>
          </div>
        </div>
      )}

      {/* 상세 옵션 */}
      {!isAiRecommending && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">상세 옵션 설정</h2>
            {settingMethod === 'direct' && (
              <button
                onClick={loadAiRecommendation}
                disabled={isAiRecommending}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/80 to-primary text-primary-foreground text-sm rounded-lg hover:from-primary hover:to-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bot className="w-4 h-4" />
                AI 자동 설정
              </button>
            )}
          </div>

          {categoryConfig.groups.map((group) => {
            const groupLabel = imageAdCreate.categoryOptions?.groups?.[group.key] || group.labelKey
            const isCustomActive = customInputActive[group.key] || categoryOptions[group.key] === '__custom__'

            return (
              <div key={group.key}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">
                      {groupLabel}
                    </label>
                    {aiReasons[group.key] && (
                      <span
                        className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded cursor-help"
                        title={aiReasons[group.key]}
                      >
                        AI
                      </span>
                    )}
                  </div>
                  {group.allowCustom && (
                    <button
                      onClick={() => {
                        if (isCustomActive) {
                          toggleCustomInput(group.key, false)
                          updateCategoryOption(group.key, group.defaultValue)
                        } else {
                          toggleCustomInput(group.key, true)
                        }
                      }}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                        isCustomActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      직접 입력
                    </button>
                  )}
                </div>

                {isCustomActive ? (
                  <input
                    type="text"
                    value={customOptions[group.key] || ''}
                    onChange={(e) => updateCustomOption(group.key, e.target.value)}
                    placeholder={`${groupLabel}을(를) 직접 입력하세요...`}
                    className="w-full px-4 py-2.5 text-sm bg-secondary/50 border border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const optionLabel = imageAdCreate.categoryOptions?.options?.[option.labelKey] || option.labelKey
                      const isSelected = categoryOptions[group.key] === option.key

                      return (
                        <button
                          key={option.key}
                          onClick={() => {
                            updateCategoryOption(group.key, option.key)
                            toggleCustomInput(group.key, false)
                          }}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-secondary/30'
                          }`}
                        >
                          {optionLabel}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* AI 이유 툴팁 (선택된 옵션에 표시) */}
                {aiReasons[group.key] && !isCustomActive && (
                  <p className="mt-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                    {aiReasons[group.key]}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 추가 프롬프트 */}
      {!isAiRecommending && (
        <div className="bg-card border border-border rounded-xl p-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            {imageAdCreate.additionalPrompt || '추가 설명 (선택)'}
          </label>
          <textarea
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder={imageAdCreate.additionalPromptPlaceholder || '원하는 스타일이나 분위기를 자유롭게 설명해주세요...'}
            rows={4}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between pt-4">
        <button
          onClick={goToPrevStep}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium border border-border hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          이전 단계
        </button>

        <button
          onClick={goToNextStep}
          disabled={isAiRecommending}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            !isAiRecommending
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          다음 단계
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
