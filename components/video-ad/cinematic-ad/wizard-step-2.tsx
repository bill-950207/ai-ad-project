'use client'

import { useState, useCallback } from 'react'
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, Check, RefreshCw,
  Film, Volume2, VolumeX, Coins, Clock, PenLine,
} from 'lucide-react'
import { useCinematicWizard } from './wizard-context'
import { useLanguage } from '@/contexts/language-context'
import { SEEDANCE_V2_CREDIT_COST_PER_SECOND } from '@/lib/credits/constants'
import type { SeedanceV2AspectRatio, SeedanceV2Resolution, CinematicScenarioInfo } from '@/lib/byteplus/types'

const ASPECT_RATIOS: { value: SeedanceV2AspectRatio; label: string; icon: string }[] = [
  { value: '21:9', label: '21:9', icon: '━━━' },
  { value: '16:9', label: '16:9', icon: '▬▬' },
  { value: '4:3', label: '4:3', icon: '▬' },
  { value: '1:1', label: '1:1', icon: '■' },
  { value: '3:4', label: '3:4', icon: '▮' },
  { value: '9:16', label: '9:16', icon: '▯' },
]

const RESOLUTIONS: { value: SeedanceV2Resolution; label: string; desc: string }[] = [
  { value: '480p', label: '480p', desc: 'SD' },
  { value: '720p', label: '720p', desc: 'HD' },
  { value: '1080p', label: '1080p', desc: 'FHD' },
]

export function WizardStep2() {
  const { t, language } = useLanguage()
  const {
    selectedProduct,
    editableDescription,
    editableSellingPoints,
    scenarios,
    setScenarios,
    selectedScenarioIndex,
    setSelectedScenarioIndex,
    customPrompt,
    setCustomPrompt,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    duration,
    setDuration,
    generateAudio,
    setGenerateAudio,
    canProceedToStep3,
    goToNextStep,
    goToPrevStep,
    saveDraftAsync,
  } = useCinematicWizard()

  const cinematicT = t.cinematicAdWizard as Record<string, unknown> | undefined
  const step2T = cinematicT?.step2 as Record<string, string> | undefined

  const [isGenerating, setIsGenerating] = useState(false)
  const [scenarioMode, setScenarioMode] = useState<'ai' | 'direct'>('ai')

  // AI 시나리오 생성
  const handleGenerateScenarios = useCallback(async () => {
    if (!selectedProduct) return
    setIsGenerating(true)

    try {
      const productImageUrl = selectedProduct.rembg_image_url || selectedProduct.image_url

      const res = await fetch('/api/cinematic-ad/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.name,
          productDescription: editableDescription || selectedProduct.description,
          sellingPoints: editableSellingPoints.filter(p => p.trim()),
          productImageUrl,
          count: 3,
          language,
        }),
      })

      if (!res.ok) {
        throw new Error('Scenario generation failed')
      }

      const data = await res.json()
      const generatedScenarios = data.scenarios as CinematicScenarioInfo[]
      setScenarios(generatedScenarios)

      // 첫 번째 시나리오 자동 선택
      if (generatedScenarios.length > 0) {
        setSelectedScenarioIndex(0)
        // 추천 설정 적용
        const rec = generatedScenarios[0].recommendedSettings
        if (rec.aspectRatio) setAspectRatio(rec.aspectRatio)
        if (rec.duration) setDuration(Math.min(Math.max(rec.duration, 4), 15))
      }
    } catch (error) {
      console.error('Scenario generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [
    selectedProduct, editableDescription, editableSellingPoints, language,
    setScenarios, setSelectedScenarioIndex, setAspectRatio, setDuration,
  ])

  // 시나리오 선택 시 추천 설정 적용
  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index)
    const scenario = scenarios[index]
    if (scenario?.recommendedSettings) {
      setAspectRatio(scenario.recommendedSettings.aspectRatio)
      setDuration(Math.min(Math.max(scenario.recommendedSettings.duration, 4), 15))
    }
  }

  // 크레딧 계산
  const costPerSecond = SEEDANCE_V2_CREDIT_COST_PER_SECOND[resolution] || 2
  const estimatedCredits = duration * costPerSecond

  // 다음 단계
  const handleNext = () => {
    if (!canProceedToStep3()) return
    goToNextStep()
    saveDraftAsync({ wizardStep: 3 })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Film className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {step2T?.title || 'Scenario & Settings'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {step2T?.subtitle || 'Set up the scenario and video settings for your cinematic ad'}
        </p>
      </div>

      {/* 시나리오 모드 선택 */}
      <div className="flex gap-2">
        <button
          onClick={() => setScenarioMode('ai')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
            scenarioMode === 'ai'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {step2T?.aiRecommend || 'AI Recommend'}
        </button>
        <button
          onClick={() => setScenarioMode('direct')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
            scenarioMode === 'direct'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          <PenLine className="w-4 h-4" />
          {step2T?.directInput || 'Direct Input'}
        </button>
      </div>

      {/* AI 시나리오 섹션 */}
      {scenarioMode === 'ai' && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              {step2T?.scenarios || 'AI Scenarios'}
            </h3>
            <button
              onClick={handleGenerateScenarios}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {step2T?.generating || 'Generating...'}
                </>
              ) : scenarios.length > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  {step2T?.regenerate || 'Regenerate'}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {step2T?.generate || 'Generate Scenarios'}
                </>
              )}
            </button>
          </div>

          {isGenerating && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {step2T?.aiGenerating || 'AI is creating optimal scenarios...'}
              </p>
            </div>
          )}

          {!isGenerating && scenarios.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {scenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectScenario(index)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    selectedScenarioIndex === index
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-secondary/20 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground text-sm">{scenario.title}</h4>
                        {selectedScenarioIndex === index && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                        <span>{scenario.mood}</span>
                        <span>|</span>
                        <span>{scenario.recommendedSettings.aspectRatio}</span>
                        <span>|</span>
                        <span>{scenario.recommendedSettings.duration}s</span>
                      </div>
                    </div>
                  </div>

                  {/* 멀티샷 브레이크다운 */}
                  {selectedScenarioIndex === index && scenario.shotBreakdown && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {step2T?.shotBreakdown || 'Shot Breakdown'}
                      </p>
                      <div className="space-y-1.5">
                        {scenario.shotBreakdown.map((shot) => (
                          <div key={shot.shotNumber} className="flex gap-2 text-xs">
                            <span className="text-primary font-medium shrink-0">
                              Shot {shot.shotNumber}
                            </span>
                            <span className="text-muted-foreground flex-1">{shot.description}</span>
                            <span className="text-muted-foreground/60 shrink-0">{shot.estimatedDuration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isGenerating && scenarios.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              {step2T?.noScenarios || 'Click "Generate Scenarios" to get AI-recommended scenarios'}
            </div>
          )}
        </div>
      )}

      {/* 직접 입력 */}
      {scenarioMode === 'direct' && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">
            {step2T?.directPrompt || 'Video Prompt'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {step2T?.directPromptHint || 'Describe the video you want to create. Use "Shot 1: ... Shot 2: ..." format for multi-shot.'}
          </p>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={step2T?.promptPlaceholder || 'Shot 1: The product slowly reveals from darkness with dramatic rim lighting. Shot 2: Close-up of product details with soft bokeh background...'}
            rows={6}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>
      )}

      {/* 영상 설정 */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-5">
        <h3 className="font-semibold text-foreground">
          {step2T?.videoSettings || 'Video Settings'}
        </h3>

        {/* 화면 비율 */}
        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            {step2T?.aspectRatio || 'Aspect Ratio'}
          </label>
          <div className="grid grid-cols-6 gap-2">
            {ASPECT_RATIOS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setAspectRatio(value)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all ${
                  aspectRatio === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 영상 길이 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {step2T?.duration || 'Duration'}
            </label>
            <span className="text-sm font-semibold text-foreground">{duration}s</span>
          </div>
          <input
            type="range"
            min={4}
            max={15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
            <span>4s</span>
            <span>15s</span>
          </div>
        </div>

        {/* 해상도 */}
        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            {step2T?.resolution || 'Resolution'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {RESOLUTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setResolution(value)}
                className={`flex flex-col items-center gap-0.5 p-2.5 rounded-lg border transition-all ${
                  resolution === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[10px]">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 오디오 토글 */}
        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
          <div className="flex items-center gap-2">
            {generateAudio ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
            <div>
              <span className="text-sm font-medium text-foreground">
                {step2T?.audioGeneration || 'Audio Generation'}
              </span>
              <p className="text-[10px] text-muted-foreground">
                {step2T?.audioHint || 'Native audio with lip-sync support'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setGenerateAudio(!generateAudio)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              generateAudio ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                generateAudio ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* 예상 크레딧 */}
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              {step2T?.estimatedCredits || 'Estimated Credits'}
            </span>
          </div>
          <span className="font-bold text-primary text-lg">{estimatedCredits}</span>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="flex justify-between">
        <button
          onClick={goToPrevStep}
          className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common?.prev || 'Previous'}
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceedToStep3()}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.common?.next || 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
