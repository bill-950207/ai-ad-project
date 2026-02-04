'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  Plus,
  Minus,
  Lock,
  Unlock,
  Crown,
  Palette,
} from 'lucide-react'
// Note: Lock is still used for scene count button restrictions
import { useProductAdWizard, RecommendedVideoSettings, SceneElementOptions, createDefaultSceneElement } from './wizard-context'
import { useLanguage } from '@/contexts/language-context'
import { useUserPlan } from '@/lib/hooks/use-user-plan'

// FREE 사용자 제한
const FREE_USER_LIMITS = {
  maxDuration: 4,
  maxSceneCount: 3,
}

// 번역된 옵션을 가져오는 헬퍼 함수
function getMoodOptions(t: Record<string, unknown>) {
  const step3T = (t.productAdWizard as Record<string, unknown>)?.step3 as Record<string, unknown> || {}
  const moodT = step3T.moodOptions as Record<string, string> || {}
  return [
    moodT.luxuryElegant || 'Luxurious & Elegant',
    moodT.warmFriendly || 'Warm & Friendly',
    moodT.modernSophisticated || 'Modern & Sophisticated',
    moodT.dynamicEnergetic || 'Dynamic & Energetic',
    moodT.calmRelaxed || 'Calm & Relaxed',
    moodT.trendyYoung || 'Trendy & Young',
    moodT.classicTraditional || 'Classic & Traditional',
  ]
}

function getAdElementOptions(t: Record<string, unknown>) {
  const step3T = (t.productAdWizard as Record<string, unknown>)?.step3 as Record<string, unknown> || {}
  const adElementsT = step3T.adElements as Record<string, unknown> || {}
  const backgroundsT = adElementsT.backgrounds as Record<string, string> || {}
  const moodOptions = getMoodOptions(t)

  return {
    background: {
      label: (adElementsT.backgroundLabel as string) || 'Background/Location',
      options: [
        backgroundsT.minimalStudio || 'Minimal Studio',
        backgroundsT.luxuryInterior || 'Luxury Interior',
        backgroundsT.naturalBackground || 'Natural Background',
        backgroundsT.cityscape || 'Cityscape',
        backgroundsT.abstractBackground || 'Abstract Background',
        backgroundsT.gradientBackground || 'Gradient Background',
        backgroundsT.textureBackground || 'Texture Background',
      ],
    },
    mood: {
      label: (adElementsT.moodLabel as string) || 'Mood/Tone',
      options: moodOptions,
    },
  }
}

// 분위기 선택 컴포넌트
interface MoodSelectorProps {
  value: string
  onChange: (value: string) => void
  isAiRecommended?: boolean
}

function MoodSelector({ value, onChange, isAiRecommended }: MoodSelectorProps) {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const moodOptions = getMoodOptions(t)

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim())
      setCustomValue('')
      setIsExpanded(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          {t.productAdWizard?.step3?.overallMood || 'Overall Mood'}
          {isAiRecommended && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </label>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-3 rounded-lg border text-left transition-all ${
          value
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || (t.productAdWizard?.step3?.selectMoodPlaceholder || 'Select the overall mood for the video')}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 bg-secondary/30 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {moodOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option)
                  setIsExpanded(false)
                }}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                  value === option
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-secondary'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={t.common?.customInput || 'Custom input...'}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomSubmit()
                }
              }}
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customValue.trim()}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {t.common?.apply || 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 컴팩트 요소 선택기 (씬별 설정용)
interface CompactElementSelectorProps {
  elementKey: 'background' | 'mood'
  value: string
  onChange: (value: string) => void
}

function CompactElementSelector({
  elementKey,
  value,
  onChange,
}: CompactElementSelectorProps) {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const adElementOptions = getAdElementOptions(t)
  const element = adElementOptions[elementKey]

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim())
      setCustomValue('')
      setIsExpanded(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {element.label}
      </label>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-2 rounded-lg border text-left text-sm transition-all ${
          value
            ? 'border-primary/50 bg-primary/5'
            : 'border-border hover:border-primary/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || (t.common?.select || 'Select')}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 bg-secondary/30 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-1">
            {element.options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option)
                  setIsExpanded(false)
                }}
                className={`px-2 py-1.5 rounded text-xs text-left transition-all ${
                  value === option
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-secondary'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 pt-1.5 border-t border-border">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={t.common?.customInput || 'Custom input...'}
              className="flex-1 px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomSubmit()
                }
              }}
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customValue.trim()}
              className="px-2 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {t.common?.apply || 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function WizardStep3() {
  const {
    // Step 3 (시나리오)
    scenarioMethod,
    scenarioInfo,
    setScenarioInfo,
    isGeneratingScenario,
    setIsGeneratingScenario,
    generatedScenarios,
    setGeneratedScenarios,
    selectedScenarioIndex,
    setSelectedScenarioIndex,
    updateScenarioElement,
    selectedProduct,
    editableDescription,
    editableSellingPoints,
    // Step 4 (설정)
    sceneDurations,
    updateSceneDuration,
    sceneCount,
    setSceneCount,
    sceneElements,
    setSceneElements,
    updateSceneElement,
    videoModel,
    setVideoModel,
    isVideoSettingsFromScenario,
    unlockVideoSettings,
    // Navigation
    canProceedToStep4,
    goToNextStep,
    goToPrevStep,
    saveDraftAsync,
    applyVideoSettingsFromScenario,
  } = useProductAdWizard()

  // i18n
  const { language, t } = useLanguage()

  // 중복 호출 방지를 위한 ref
  const isGeneratingRef = useRef(false)

  // 사용자 플랜 정보 (로딩 중에는 FREE로 가정하여 UX 개선)
  const { isFreeUser, isLoaded: isPlanLoaded } = useUserPlan()

  // 플랜 로드 완료 후 FREE 사용자인 경우 씬 개수 조정
  useEffect(() => {
    if (isPlanLoaded && isFreeUser && sceneCount > FREE_USER_LIMITS.maxSceneCount) {
      setSceneCount(FREE_USER_LIMITS.maxSceneCount)
    }
  }, [isPlanLoaded, isFreeUser, setSceneCount, sceneCount])

  // Vidu Q3 모델 강제 설정
  useEffect(() => {
    if (videoModel !== 'vidu') {
      setVideoModel('vidu')
    }
  }, [videoModel, setVideoModel])

  // AI 추천 시나리오 생성
  const generateAiScenarios = async () => {
    if (!selectedProduct || isGeneratingRef.current) return

    isGeneratingRef.current = true
    setIsGeneratingScenario(true)
    try {
      const res = await fetch('/api/product-ad/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.name,
          productDescription: editableDescription || selectedProduct.description,
          sellingPoints: editableSellingPoints.filter(p => p.trim()) || selectedProduct.selling_points,
          productImageUrl: selectedProduct.rembg_image_url || selectedProduct.image_url,
          count: 3,
          language,  // 사용자 언어 설정 전달
          // sceneCount는 전달하지 않음 - AI가 제품에 맞게 자체 결정
        }),
      })

      if (!res.ok) throw new Error('Scenario generation failed')

      const data = await res.json()
      setGeneratedScenarios(data.scenarios)

      // 첫 번째 시나리오 자동 선택
      if (data.scenarios.length > 0) {
        setSelectedScenarioIndex(0)
        const scenario = data.scenarios[0]
        setScenarioInfo(scenario)

        // AI 추천 영상 설정 적용
        if (scenario.videoSettings) {
          applyVideoSettingsFromScenario(scenario.videoSettings as RecommendedVideoSettings)
        }

        // AI가 생성한 씬별 요소 적용
        if (scenario.sceneElements && Array.isArray(scenario.sceneElements)) {
          setSceneElements(scenario.sceneElements as SceneElementOptions[])
        }
      }
    } catch (error) {
      console.error('Scenario generation error:', error)
    } finally {
      isGeneratingRef.current = false
      setIsGeneratingScenario(false)
    }
  }

  // 초기 로드 시 AI 추천 시나리오 생성
  useEffect(() => {
    if (scenarioMethod === 'ai-auto' && generatedScenarios.length === 0 && !isGeneratingScenario && !isGeneratingRef.current) {
      generateAiScenarios()
    } else if (scenarioMethod === 'direct' && !scenarioInfo) {
      // 직접 입력 모드: 빈 시나리오로 시작
      setScenarioInfo({
        title: '',
        description: '',
        elements: {
          background: '',
          mood: '',
          cameraAngle: '',
          productPlacement: '',
          lighting: '',
          colorTone: '',
        },
      })
      // 기본 씬 요소 초기화
      setSceneElements(Array(sceneCount).fill(null).map(() => createDefaultSceneElement()))
    }
  }, [scenarioMethod])

  // 시나리오 선택
  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index)
    const scenario = generatedScenarios[index]
    setScenarioInfo(scenario)

    // AI 추천 영상 설정 적용
    if (scenario.videoSettings) {
      applyVideoSettingsFromScenario(scenario.videoSettings as RecommendedVideoSettings)
    }

    // AI가 생성한 씬별 요소 적용
    if (scenario.sceneElements && Array.isArray(scenario.sceneElements)) {
      setSceneElements(scenario.sceneElements as SceneElementOptions[])
    }
  }

  // 다음 단계로
  const handleNext = () => {
    if (!canProceedToStep4()) return
    goToNextStep()
    saveDraftAsync({ wizardStep: 4 })
  }

  // 총 영상 길이 계산
  const totalDuration = sceneDurations.slice(0, sceneCount).reduce((sum, d) => sum + d, 0)

  // 필수 요소 채워졌는지 확인 (씬별)
  const isSceneComplete = (index: number) => {
    const elem = sceneElements[index]
    return elem && !!elem.background && !!elem.mood
  }

  // 로딩 상태
  if (isGeneratingScenario) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground font-medium">
            {t.productAdWizard?.step3?.aiRecommending || 'AI is recommending the optimal scenario...'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t.common?.pleaseWait || 'Please wait'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">{t.productAdWizard?.step3?.title || 'Scenario & Video Settings'}</h2>
        <p className="text-muted-foreground mt-2">
          {scenarioMethod === 'direct'
            ? (t.productAdWizard?.step3?.subtitleDirect || 'Select your desired ad mood and video settings')
            : (t.productAdWizard?.step3?.subtitleAi || 'Select AI recommended scenario and review video settings')}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 시나리오 섹션 */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* AI 추천 시나리오 선택 (ai-auto 모드) */}
      {scenarioMethod === 'ai-auto' && generatedScenarios.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{t.productAdWizard?.step3?.recommendedScenarios || 'Recommended Scenarios'}</h3>
            <button
              onClick={generateAiScenarios}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.productAdWizard?.step3?.regenerate || 'Regenerate'}
            </button>
          </div>

          <div className="grid gap-3">
            {generatedScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => handleSelectScenario(index)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedScenarioIndex === index
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{scenario.title || `${t.productAdWizard?.step3?.scenario || 'Scenario'} ${index + 1}`}</h4>
                      {selectedScenarioIndex === index && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {scenario.description}
                    </p>
                    {/* 분위기 미리보기 */}
                    {scenario.elements?.mood && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded">
                          {scenario.elements.mood}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 전체 분위기 선택 */}
      {scenarioInfo && (
        <MoodSelector
          value={scenarioInfo.elements.mood}
          onChange={(value) => updateScenarioElement('mood', value)}
          isAiRecommended={scenarioMethod !== 'direct' && !!scenarioInfo.elements.mood}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 영상 설정 섹션 */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      <div className="pt-4 border-t border-border">
        <h3 className="text-base font-semibold text-foreground mb-4">{t.productAdWizard?.step3?.videoSettings || 'Video Settings'}</h3>

        {/* AI 추천 설정 알림 */}
        {isVideoSettingsFromScenario && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t.productAdWizard?.step3?.aiRecommendedSettings || 'AI Scenario Recommended Settings'}</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{t.productAdWizard?.step3?.applied || 'Applied'}</span>
            </div>
            <button
              onClick={unlockVideoSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              {t.common?.edit || 'Edit'}
            </button>
          </div>
        )}

        {/* 비율 선택 - 정방형(1:1) 고정 */}
        {/* 비율 선택 UI 숨김 - 1:1 고정 */}

        {/* 씬 개수 및 씬별 시간 설정 */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">{t.productAdWizard?.step3?.sceneComposition || 'Scene Composition'}</h4>
            {isVideoSettingsFromScenario && (
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AI
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {t.productAdWizard?.step3?.totalDuration || 'Total'} {totalDuration}{t.productAdWizard?.step3?.seconds || 's'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {t.productAdWizard?.step3?.sceneCountHint || 'Select the number of scenes. Detailed settings for each scene are available below.'}
          </p>

          {/* 씬 개수 선택 */}
          {!isPlanLoaded ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-16">{t.productAdWizard?.step3?.sceneCount || 'Scenes'}</span>
                <div className="flex gap-1.5 flex-1">
                  {[2, 3, 4, 5, 6, 7, 8].map((count) => {
                    const isLocked = isFreeUser && count > FREE_USER_LIMITS.maxSceneCount
                    return (
                      <button
                        key={count}
                        onClick={() => !isLocked && setSceneCount(count)}
                        disabled={isLocked}
                        className={`relative flex-1 h-12 rounded-xl border-2 transition-all font-bold text-lg ${
                          isLocked
                            ? 'border-border bg-secondary/30 cursor-not-allowed opacity-60 text-muted-foreground'
                            : sceneCount === count
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 text-foreground'
                        }`}
                      >
                        {count}
                        {isLocked && (
                          <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              {isFreeUser && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {t.productAdWizard?.step3?.upgradeHint || 'Subscribe to STARTER or higher for up to 8 scenes and 8 seconds per scene'}
                </p>
              )}
            </>
          )}
        </div>

        {/* 씬별 광고 요소 설정 (세로 나열) */}
        {isPlanLoaded && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">{t.productAdWizard?.step3?.sceneAdElements || 'Scene Ad Elements'}</h4>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {t.productAdWizard?.step3?.sceneElementsHint || 'Set duration, background, and mood for each scene, and add optional instructions'}
          </p>

          {/* 모든 씬 세로 나열 */}
          <div className="space-y-3">
            {Array.from({ length: sceneCount }).map((_, index) => {
              const sceneElement = sceneElements[index] || createDefaultSceneElement()
              const complete = isSceneComplete(index)
              const duration = sceneDurations[index] || 3
              const maxDuration = isFreeUser ? FREE_USER_LIMITS.maxDuration : 8
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border-2 border-border bg-secondary/20"
                >
                  {/* 씬 헤더: 번호 + 시간 조절 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{t.productAdWizard?.step3?.scene || 'Scene'} {index + 1}</span>
                    </div>
                    {/* 영상 길이 조절 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t.productAdWizard?.step3?.videoDuration || 'Duration'}</span>
                      <div className="flex items-center gap-1 bg-background rounded-lg border border-border px-1">
                        <button
                          onClick={() => updateSceneDuration(index, duration - 1)}
                          disabled={duration <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-foreground">{duration}</span>
                        <button
                          onClick={() => updateSceneDuration(index, duration + 1)}
                          disabled={duration >= maxDuration}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">{t.productAdWizard?.step3?.seconds || 's'}</span>
                    </div>
                  </div>

                  {/* 배경 + 분위기 (필수) */}
                  <div className="grid grid-cols-2 gap-3">
                    <CompactElementSelector
                      elementKey="background"
                      value={sceneElement.background}
                      onChange={(value) => updateSceneElement(index, 'background', value)}
                    />
                    <CompactElementSelector
                      elementKey="mood"
                      value={sceneElement.mood}
                      onChange={(value) => updateSceneElement(index, 'mood', value)}
                    />
                  </div>

                  {/* 추가 지시사항 (선택) */}
                  <div className="mt-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      {t.productAdWizard?.step3?.additionalInstructions || 'Additional Instructions'} <span className="text-muted-foreground/60">({t.common?.optional || 'Optional'})</span>
                    </label>
                    <textarea
                      value={sceneElement.additionalPrompt || ''}
                      onChange={(e) => updateSceneElement(index, 'additionalPrompt', e.target.value)}
                      placeholder={t.productAdWizard?.step3?.additionalInstructionsPlaceholder || 'E.g., Product slowly rotates while appearing, backlit silhouette...'}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* 필수 요소 안내 */}
                  {!complete && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      {t.productAdWizard?.step3?.requiredHint || 'Background and mood are required'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 네비게이션 버튼 */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      <div className="flex gap-3 pt-4">
        <button
          onClick={goToPrevStep}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common?.prev || 'Previous'}
        </button>
        <button
          onClick={handleNext}
          disabled={!isPlanLoaded || !canProceedToStep4()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.common?.next || 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 안내 메시지 */}
      {!canProceedToStep4() && scenarioInfo && (
        <p className="text-center text-sm text-muted-foreground">
          {!scenarioInfo.elements.mood
            ? (t.productAdWizard?.step3?.selectMood || 'Please select the overall mood')
            : (t.productAdWizard?.step3?.setAllScenes || 'Please set background and mood for all scenes')}
        </p>
      )}
    </div>
  )
}
