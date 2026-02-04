'use client'

import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Sparkles,
  Check,
} from 'lucide-react'
import { useProductAdWizard, ScenarioMethod } from './wizard-context'
import { useLanguage } from '@/contexts/language-context'

export function WizardStep2() {
  const { t } = useLanguage()
  const {
    scenarioMethod,
    setScenarioMethod,
    canProceedToStep3,
    goToNextStep,
    goToPrevStep,
    saveDraftAsync,
  } = useProductAdWizard()

  // 방식 선택
  const handleSelectMethod = (method: ScenarioMethod) => {
    setScenarioMethod(method)
  }

  // 다음 단계로
  const handleNext = () => {
    if (!canProceedToStep3()) return
    goToNextStep()
    saveDraftAsync({ wizardStep: 3 })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">{t.productAdWizard?.step2?.title || 'Choose Ad Configuration Method'}</h2>
        <p className="text-muted-foreground mt-2">
          {t.productAdWizard?.step2?.subtitle || 'Select how you want to configure your ad scenario'}
        </p>
      </div>

      {/* 방식 선택 카드 */}
      <div className="grid gap-4">
        {/* 직접 입력 */}
        <button
          onClick={() => handleSelectMethod('direct')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            scenarioMethod === 'direct'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              scenarioMethod === 'direct' ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              <Edit3 className={`w-5 h-5 ${
                scenarioMethod === 'direct' ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{t.productAdWizard?.step2?.directInput || 'Manual Input'}</h3>
                {scenarioMethod === 'direct' && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t.productAdWizard?.step2?.directInputDesc || 'Configure your ad by manually selecting background, mood, camera angles, etc.'}
              </p>
            </div>
          </div>
        </button>

        {/* AI 추천 */}
        <button
          onClick={() => handleSelectMethod('ai-auto')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            scenarioMethod === 'ai-auto'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              scenarioMethod === 'ai-auto' ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              <Sparkles className={`w-5 h-5 ${
                scenarioMethod === 'ai-auto' ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{t.productAdWizard?.step2?.aiRecommend || 'AI Recommendation'}</h3>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  {t.productAdWizard?.step2?.recommended || 'Recommended'}
                </span>
                {scenarioMethod === 'ai-auto' && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t.productAdWizard?.step2?.aiRecommendDesc || 'AI analyzes product info to recommend the optimal ad scenario'}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={goToPrevStep}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common?.prev || 'Previous'}
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceedToStep3()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.common?.next || 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
