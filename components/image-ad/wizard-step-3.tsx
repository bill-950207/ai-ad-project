'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  Bot,
  Edit3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react'
import { CATEGORY_OPTIONS } from '@/lib/image-ad/category-options'
import { useImageAdWizard } from './wizard-context'

export function WizardStep3() {
  const { t, language } = useLanguage()
  const {
    adType,
    selectedProduct,
    selectedAvatarInfo,
    setSelectedAvatarInfo,
    productUsageMethod,  // 제품 사용 방법 (using 타입 전용)
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
    generatedScenarios,
    setGeneratedScenarios,
    selectedScenarioIndex,
    setSelectedScenarioIndex,
    updateCategoryOption,
    updateCustomOption,
    toggleCustomInput,
    goToNextStep,
    goToPrevStep,
  } = useImageAdWizard()

  // 중복 요청 방지를 위한 ref
  const aiRecommendationRequestedRef = useRef(false)

  // 시나리오 옵션 적용 헬퍼 함수
  const applyScenarioOptions = useCallback((scenario: {
    title: string
    description: string
    recommendedOptions: Record<string, { value: string; customText?: string; reason: string }>
    overallStrategy: string
    suggestedPrompt?: string
    // AI 추천 아바타용 구조화된 옵션
    recommendedAvatarStyle?: {
      avatarPrompt: string
      avatarDescription: string
      gender?: 'male' | 'female' | 'any'
      age?: 'young' | 'middle' | 'mature' | 'any'
      style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
      ethnicity?: 'korean' | 'asian' | 'western' | 'any'
      bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'any'
    }
  }, index: number) => {
    const newCategoryOptions: Record<string, string> = {}
    const newCustomOptions: Record<string, string> = {}
    const newCustomInputActive: Record<string, boolean> = {}
    const newAiReasons: Record<string, string> = {}

    for (const [key, opt] of Object.entries(scenario.recommendedOptions)) {
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
    setAiStrategy(scenario.overallStrategy)
    setSelectedScenarioIndex(index)
    if (scenario.suggestedPrompt) {
      setAdditionalPrompt(scenario.suggestedPrompt)
    }

    // AI 추천 아바타 옵션 업데이트
    if (selectedAvatarInfo?.type === 'ai-generated' && scenario.recommendedAvatarStyle) {
      const style = scenario.recommendedAvatarStyle
      const current = selectedAvatarInfo.aiOptions || {
        targetGender: 'any' as const,
        targetAge: 'any' as const,
        style: 'any' as const,
        ethnicity: 'any' as const,
        bodyType: 'any' as const,
      }

      // 사용자가 'any'로 설정한 필드만 LLM 추천값으로 업데이트
      const updatedOptions = {
        targetGender: (current.targetGender === 'any' && style.gender && style.gender !== 'any')
          ? (style.gender as 'male' | 'female' | 'any') : current.targetGender,
        targetAge: (current.targetAge === 'any' && style.age && style.age !== 'any')
          ? (style.age as 'young' | 'middle' | 'mature' | 'any') : current.targetAge,
        style: (current.style === 'any' && style.style && style.style !== 'any')
          ? (style.style as 'natural' | 'professional' | 'casual' | 'elegant' | 'any') : current.style,
        ethnicity: (current.ethnicity === 'any' && style.ethnicity && style.ethnicity !== 'any')
          ? (style.ethnicity as 'korean' | 'asian' | 'western' | 'any') : current.ethnicity,
        bodyType: (current.bodyType === 'any' && style.bodyType && style.bodyType !== 'any')
          ? (style.bodyType as 'slim' | 'average' | 'athletic' | 'curvy' | 'any') : current.bodyType,
      }

      setSelectedAvatarInfo({
        ...selectedAvatarInfo,
        aiOptions: updatedOptions,
      })
    }
  }, [setCategoryOptions, setCustomOptions, setCustomInputActive, setAiReasons, setAiStrategy, setAdditionalPrompt, setSelectedScenarioIndex, selectedAvatarInfo, setSelectedAvatarInfo])

  // AI 추천 로드 (3개 시나리오 생성)
  const loadAiRecommendation = useCallback(async (isManualRefresh = false) => {
    // 수동 새로고침이 아닌 경우, 중복 요청 체크
    if (!isManualRefresh && aiRecommendationRequestedRef.current) {
      return
    }
    aiRecommendationRequestedRef.current = true

    setIsAiRecommending(true)
    setHasLoadedAiRecommendation(true)

    try {
      // 아바타 정보 구성
      const avatarInfo = selectedAvatarInfo ? {
        type: selectedAvatarInfo.type,
        avatarName: selectedAvatarInfo.avatarName,
        outfitName: selectedAvatarInfo.outfitName,
        aiOptions: selectedAvatarInfo.aiOptions,
        // 실제 아바타 선택 시 스타일 정보 전달
        avatarStyle: selectedAvatarInfo.avatarOptions ? {
          vibe: selectedAvatarInfo.avatarOptions.vibe,
          bodyType: selectedAvatarInfo.avatarOptions.bodyType,
          height: selectedAvatarInfo.avatarOptions.height,
          gender: selectedAvatarInfo.avatarOptions.gender,
        } : undefined,
      } : undefined

      const res = await fetch('/api/image-ads/recommend-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adType,
          productName: selectedProduct?.name,
          productDescription: selectedProduct?.description,
          productSellingPoints: selectedProduct?.selling_points,  // 셀링 포인트 전달
          language,
          multiple: true,  // 다중 시나리오 모드
          hasAvatar: !!selectedAvatarInfo,
          avatarInfo,  // 아바타 상세 정보 (type, avatarName, outfitName, aiOptions)
          productImageUrl: selectedProduct?.rembg_image_url || selectedProduct?.image_url,  // 제품 이미지 URL
          productUsageMethod: adType === 'using' ? productUsageMethod : undefined,  // using 타입일 때만 전달
        }),
      })

      if (!res.ok) {
        throw new Error('Recommendation generation failed')
      }

      const result = await res.json()

      // 다중 시나리오 모드: 3개 시나리오 저장 및 첫 번째 시나리오 자동 선택
      if (result.scenarios && result.scenarios.length > 0) {
        setGeneratedScenarios(result.scenarios)
        // 첫 번째 시나리오의 옵션을 직접 적용 (비동기 상태 업데이트 문제 방지)
        const firstScenario = result.scenarios[0]
        applyScenarioOptions(firstScenario, 0)
      }
    } catch (error) {
      console.error('AI auto settings error:', error)
      // 에러 시 ref 리셋하여 재시도 가능하게
      if (!isManualRefresh) {
        aiRecommendationRequestedRef.current = false
      }
    } finally {
      setIsAiRecommending(false)
    }
  }, [adType, selectedProduct, selectedAvatarInfo, productUsageMethod, language, setIsAiRecommending, setHasLoadedAiRecommendation, setGeneratedScenarios, applyScenarioOptions])

  // 참조 이미지 분석 결과 적용
  const applyAnalysisResult = useCallback(() => {
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

      // AI 추천처럼 상세한 이유 표시 (reason 필드 사용)
      newAiReasons[opt.key] = opt.reason || `Analyzed from reference image (confidence: ${Math.round(opt.confidence * 100)}%)`
    }

    setCategoryOptions(newCategoryOptions)
    setCustomOptions(newCustomOptions)
    setCustomInputActive(newCustomInputActive)
    setAiReasons(newAiReasons)

    if (analysisResult.overallStyle) {
      setAiStrategy(analysisResult.overallStyle)
    }

    // 추가 설명(additionalPrompt)에 suggestedPrompt 적용
    if (analysisResult.suggestedPrompt) {
      setAdditionalPrompt(analysisResult.suggestedPrompt)
    }
  }, [analysisResult, setCategoryOptions, setCustomOptions, setCustomInputActive, setAiReasons, setAiStrategy, setAdditionalPrompt])

  // AI 자동 설정 로드 (Step 3 진입 시)
  useEffect(() => {
    if (settingMethod === 'ai-auto' && !hasLoadedAiRecommendation) {
      loadAiRecommendation(false)
    } else if (settingMethod === 'reference' && analysisResult?.analyzedOptions) {
      applyAnalysisResult()
    }
  }, [settingMethod, hasLoadedAiRecommendation, loadAiRecommendation, analysisResult])

  // AI 재추천 (수동 새로고침)
  const handleRefreshAiRecommendation = () => {
    aiRecommendationRequestedRef.current = false // ref 리셋
    setHasLoadedAiRecommendation(false)
    setGeneratedScenarios([]) // 기존 시나리오 초기화
    loadAiRecommendation(true) // 수동 새로고침임을 표시
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
        {t.imageAd?.options?.noOptions || 'No options available for this ad type.'}
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
              <h3 className="font-medium text-foreground mb-1">{t.imageAd?.options?.aiAnalyzing || 'AI is analyzing optimal settings'}</h3>
              <p className="text-sm text-muted-foreground">
                {(t.imageAd?.options?.aiAnalyzingDesc || 'Analyzing {product} product and avatar characteristics...').replace('{product}', selectedProduct?.name || 'product')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI 추천 시나리오 선택 (ai-auto 모드) */}
      {settingMethod === 'ai-auto' && generatedScenarios.length > 0 && !isAiRecommending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {t.imageAd?.options?.recommendedScenario || 'Recommended Scenario'}
            </h3>
            <button
              onClick={handleRefreshAiRecommendation}
              disabled={isAiRecommending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {t.imageAd?.options?.reRecommend || 'Re-recommend'}
            </button>
          </div>

          <div className="grid gap-3">
            {generatedScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => applyScenarioOptions(scenario, index)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedScenarioIndex === index
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{scenario.title}</h4>
                      {selectedScenarioIndex === index && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {scenario.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
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
                  {settingMethod === 'reference' ? t.imageAd?.options?.analysisResult || 'AI Analysis Results' : t.imageAd?.options?.selectedStrategy || 'Selected Scenario Strategy'}
                </h3>
                {settingMethod === 'ai-auto' && generatedScenarios.length === 0 && (
                  <button
                    onClick={handleRefreshAiRecommendation}
                    disabled={isAiRecommending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t.imageAd?.options?.reRecommend || 'Re-recommend'}
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
            <h2 className="text-lg font-semibold text-foreground">{t.imageAd?.options?.title || 'Detailed Options'}</h2>
            {settingMethod === 'direct' && (
              <button
                onClick={() => loadAiRecommendation(true)}
                disabled={isAiRecommending}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/80 to-primary text-primary-foreground text-sm rounded-lg hover:from-primary hover:to-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bot className="w-4 h-4" />
                {t.imageAd?.options?.aiAutoSettings || 'AI Auto Settings'}
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
                      {t.imageAd?.options?.manualInput || 'Manual Input'}
                    </button>
                  )}
                </div>

                {isCustomActive ? (
                  <input
                    type="text"
                    value={customOptions[group.key] || ''}
                    onChange={(e) => updateCustomOption(group.key, e.target.value)}
                    placeholder={(t.imageAd?.options?.selectPlaceholder || 'Select {label}').replace('{label}', groupLabel)}
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
            {t.imageAd?.options?.additionalDesc || imageAdCreate.additionalPrompt || 'Additional Description (Optional)'}
          </label>
          <textarea
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder={t.imageAd?.options?.additionalPlaceholder || imageAdCreate.additionalPromptPlaceholder || 'Freely describe your desired style or atmosphere...'}
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
          {t.imageAd?.wizard?.prevStep || 'Previous Step'}
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
          {t.imageAd?.wizard?.nextStep || 'Next Step'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
