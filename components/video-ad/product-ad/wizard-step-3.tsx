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
  Maximize,
  Film,
  Plus,
  Minus,
  Lock,
  Unlock,
  Crown,
  Palette,
} from 'lucide-react'
// Note: Lock is still used for scene count button restrictions
import { useProductAdWizard, RecommendedVideoSettings, SceneElementOptions, createDefaultSceneElement, AspectRatio } from './wizard-context'
import { useLanguage } from '@/contexts/language-context'

// 사용자 플랜 타입
interface UserPlan {
  planType: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'
  displayName: string
}

// FREE 사용자 제한
const FREE_USER_LIMITS = {
  maxDuration: 4,
  maxSceneCount: 3,
}

// 비율 옵션
const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; icon: string; desc: string }[] = [
  { value: '16:9', label: 'Landscape', icon: '▬', desc: 'YouTube, Websites' },
  { value: '9:16', label: 'Portrait', icon: '▮', desc: 'Reels, Shorts, TikTok' },
  { value: '1:1', label: 'Square', icon: '■', desc: 'Instagram Feed' },
]

// 전체 분위기 옵션
const MOOD_OPTIONS = [
  '고급스럽고 우아한',
  '따뜻하고 친근한',
  '모던하고 세련된',
  '역동적이고 에너지틱한',
  '차분하고 편안한',
  '트렌디하고 젊은',
  '클래식하고 전통적인',
]

// 광고 요소 옵션 정의 (간소화: 배경, 분위기만)
const AD_ELEMENT_OPTIONS = {
  background: {
    label: '배경/장소',
    options: [
      '미니멀 스튜디오',
      '고급 인테리어',
      '자연 배경',
      '도시 풍경',
      '추상적 배경',
      '그라데이션 배경',
      '텍스처 배경',
    ],
  },
  mood: {
    label: '분위기/톤',
    options: MOOD_OPTIONS,
  },
}

// 분위기 선택 컴포넌트
interface MoodSelectorProps {
  value: string
  onChange: (value: string) => void
  isAiRecommended?: boolean
}

function MoodSelector({ value, onChange, isAiRecommended }: MoodSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [customValue, setCustomValue] = useState('')

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
          전체 분위기
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
            {value || '영상의 전체 분위기를 선택해주세요'}
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
            {MOOD_OPTIONS.map((option) => (
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
              placeholder="직접 입력..."
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
              적용
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const element = AD_ELEMENT_OPTIONS[elementKey]

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
            {value || 'Select'}
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
              placeholder="직접 입력..."
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
              적용
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
    referenceInfo,
    selectedProduct,
    editableDescription,
    editableSellingPoints,
    // Step 4 (설정)
    aspectRatio,
    setAspectRatio,
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
  const { language } = useLanguage()

  // 중복 호출 방지를 위한 ref
  const isGeneratingRef = useRef(false)

  // 사용자 플랜 정보
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const isFreeUser = userPlan?.planType === 'FREE'

  // 사용자 플랜 정보 로드
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const res = await fetch('/api/user/plan')
        if (res.ok) {
          const data = await res.json()
          setUserPlan(data)
          // FREE 사용자인 경우 씬 개수 조정
          if (data.planType === 'FREE' && sceneCount > FREE_USER_LIMITS.maxSceneCount) {
            setSceneCount(FREE_USER_LIMITS.maxSceneCount)
          }
        }
      } catch (error) {
        console.error('플랜 정보 로드 오류:', error)
      }
    }
    fetchUserPlan()
  }, [setSceneCount, sceneCount])

  // Vidu Q3 모델 강제 설정
  useEffect(() => {
    // 'vidu-q2'도 'vidu'로 마이그레이션 (레거시 드래프트 호환)
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

      if (!res.ok) throw new Error('시나리오 생성 실패')

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
      console.error('시나리오 생성 오류:', error)
    } finally {
      isGeneratingRef.current = false
      setIsGeneratingScenario(false)
    }
  }

  // 참조 분석 기반 시나리오 생성
  const generateFromReference = async () => {
    if (!referenceInfo?.analyzedElements || !selectedProduct || isGeneratingRef.current) return

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
          referenceElements: referenceInfo.analyzedElements,
          referenceDescription: referenceInfo.analyzedDescription,
          count: 1,
          language,  // 사용자 언어 설정 전달
          // sceneCount는 전달하지 않음 - AI가 제품에 맞게 자체 결정
        }),
      })

      if (!res.ok) throw new Error('시나리오 생성 실패')

      const data = await res.json()
      if (data.scenarios.length > 0) {
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
      console.error('시나리오 생성 오류:', error)
    } finally {
      isGeneratingRef.current = false
      setIsGeneratingScenario(false)
    }
  }

  // 초기 로드 시 AI 추천 또는 참조 기반 시나리오 생성
  useEffect(() => {
    if (scenarioMethod === 'ai-auto' && generatedScenarios.length === 0 && !isGeneratingScenario && !isGeneratingRef.current) {
      generateAiScenarios()
    } else if (scenarioMethod === 'reference' && referenceInfo?.analyzedElements && !scenarioInfo && !isGeneratingScenario && !isGeneratingRef.current) {
      generateFromReference()
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
            {scenarioMethod === 'ai-auto' ? 'AI가 최적의 시나리오를 추천하고 있습니다...' : '참조 영상을 분석하여 시나리오를 구성하고 있습니다...'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">시나리오 및 영상 설정</h2>
        <p className="text-muted-foreground mt-2">
          {scenarioMethod === 'direct'
            ? '원하는 광고 분위기와 영상 설정을 선택해주세요'
            : scenarioMethod === 'ai-auto'
              ? 'AI가 추천한 시나리오를 선택하고 영상 설정을 확인하세요'
              : '참조 영상 분석 결과를 기반으로 설정을 확인하세요'}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 시나리오 섹션 */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* AI 추천 시나리오 선택 (ai-auto 모드) */}
      {scenarioMethod === 'ai-auto' && generatedScenarios.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">추천 시나리오</h3>
            <button
              onClick={generateAiScenarios}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              다시 추천
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
                      <h4 className="font-semibold text-foreground">{scenario.title || `시나리오 ${index + 1}`}</h4>
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

      {/* 참조 분석 결과 표시 (reference 모드) */}
      {scenarioMethod === 'reference' && referenceInfo?.analyzedDescription && (
        <div className="p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">참조 영상 분석 결과</span>
          </div>
          <p className="text-sm text-muted-foreground">{referenceInfo.analyzedDescription}</p>
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
        <h3 className="text-base font-semibold text-foreground mb-4">영상 설정</h3>

        {/* AI 추천 설정 알림 */}
        {isVideoSettingsFromScenario && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI 시나리오 추천 설정</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">적용됨</span>
            </div>
            <button
              onClick={unlockVideoSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              수정
            </button>
          </div>
        )}

        {/* 비율 선택 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Maximize className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">영상 비율</h4>
            {isVideoSettingsFromScenario && (
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AI
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setAspectRatio(option.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  aspectRatio === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-medium text-foreground">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 씬 개수 및 씬별 시간 설정 */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">씬 구성</h4>
            {isVideoSettingsFromScenario && (
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AI
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              총 {totalDuration}초
            </span>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            씬 개수를 선택하세요. 각 씬의 상세 설정은 아래에서 할 수 있습니다.
          </p>

          {/* 씬 개수 선택 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-16">씬 개수</span>
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
              STARTER 이상 구독 시 최대 8개 씬, 씬당 최대 8초까지 설정 가능
            </p>
          )}
        </div>

        {/* 씬별 광고 요소 설정 (세로 나열) */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">씬별 광고 요소</h4>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            각 씬마다 시간, 배경, 분위기를 설정하고, 추가 지시사항을 입력할 수 있습니다
          </p>

          {/* 모든 씬 세로 나열 */}
          <div className="space-y-3">
            {Array.from({ length: sceneCount }).map((_, index) => {
              const sceneElement = sceneElements[index] || createDefaultSceneElement()
              const complete = isSceneComplete(index)
              const duration = sceneDurations[index] || 3
              const maxDuration = isFreeUser ? FREE_USER_LIMITS.maxDuration : 16  // Vidu Q3: 최대 16초
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border-2 border-border bg-secondary/20"
                >
                  {/* 씬 헤더: 번호 + 시간 조절 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">씬 {index + 1}</span>
                    </div>
                    {/* 영상 길이 조절 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">영상 길이</span>
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
                      <span className="text-xs text-muted-foreground">초</span>
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
                      추가 지시사항 <span className="text-muted-foreground/60">(선택)</span>
                    </label>
                    <textarea
                      value={sceneElement.additionalPrompt || ''}
                      onChange={(e) => updateSceneElement(index, 'additionalPrompt', e.target.value)}
                      placeholder="예: 제품이 천천히 회전하며 나타남, 백라이트로 실루엣 강조..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* 필수 요소 안내 */}
                  {!complete && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      배경과 분위기는 필수입니다
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

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
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceedToStep4()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 안내 메시지 */}
      {!canProceedToStep4() && scenarioInfo && (
        <p className="text-center text-sm text-muted-foreground">
          {!scenarioInfo.elements.mood
            ? '전체 분위기를 선택해주세요'
            : !aspectRatio
              ? '영상 비율을 선택해주세요'
              : '모든 씬의 배경과 분위기를 설정해주세요'}
        </p>
      )}
    </div>
  )
}
