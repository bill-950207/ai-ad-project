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
  Copy,
  Palette,
} from 'lucide-react'
import { useProductAdWizard, ScenarioInfo, RecommendedVideoSettings, SceneElementOptions, createDefaultSceneElement, AspectRatio, VideoResolution } from './wizard-context'

// 사용자 플랜 타입
interface UserPlan {
  planType: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'
  displayName: string
}

// FREE 사용자 제한
const FREE_USER_LIMITS = {
  maxResolution: '540p' as VideoResolution,
  maxDuration: 4,
  maxSceneCount: 3,
}

// Vidu Q2 해상도 옵션
const RESOLUTION_OPTIONS: { value: VideoResolution; label: string; desc: string; creditsPerSecond: number }[] = [
  { value: '540p', label: 'SD (540p)', desc: '빠른 생성', creditsPerSecond: 5 },
  { value: '720p', label: 'HD (720p)', desc: '표준 화질', creditsPerSecond: 8 },
  { value: '1080p', label: 'FHD (1080p)', desc: '고품질', creditsPerSecond: 12 },
]

// 크레딧 계산 함수 (씬별 시간 합계 사용)
const calculateCredits = (sceneDurations: number[], resolution: VideoResolution): number => {
  const option = RESOLUTION_OPTIONS.find(o => o.value === resolution)
  if (!option) return 0
  const totalDuration = sceneDurations.reduce((sum, d) => sum + d, 0)
  return option.creditsPerSecond * totalDuration
}

// 비율 옵션
const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; icon: string; desc: string }[] = [
  { value: '16:9', label: '가로형', icon: '▬', desc: '유튜브, 웹사이트' },
  { value: '9:16', label: '세로형', icon: '▮', desc: '릴스, 숏츠, 틱톡' },
  { value: '1:1', label: '정방형', icon: '■', desc: '인스타그램 피드' },
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

// 광고 요소 옵션 정의
const AD_ELEMENT_OPTIONS: Record<keyof SceneElementOptions, { label: string; options: string[] }> = {
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
  cameraAngle: {
    label: '카메라 구도',
    options: [
      '정면 클로즈업',
      '45도 각도',
      '측면 샷',
      '탑다운 뷰',
      '로우앵글',
      '극적인 앵글',
      '매크로 샷',
    ],
  },
  productPlacement: {
    label: '제품 배치/연출',
    options: [
      '중앙 배치',
      '플로팅 효과',
      '회전하는 모션',
      '언박싱 연출',
      '사용 장면',
      '비교 배치',
      '디테일 강조',
    ],
  },
  lighting: {
    label: '조명 스타일',
    options: [
      '스튜디오 조명',
      '자연광',
      '드라마틱 조명',
      '소프트 라이트',
      '백라이트',
      '네온 조명',
      '골든 아워',
    ],
  },
  colorTone: {
    label: '색상 톤',
    options: [
      '밝고 화사한',
      '따뜻한 톤',
      '차가운 톤',
      '모노톤',
      '비비드 컬러',
      '파스텔 톤',
      '다크 톤',
    ],
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
  elementKey: keyof SceneElementOptions
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
            {value || '선택'}
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
    videoResolution,
    setVideoResolution,
    sceneCount,
    setSceneCount,
    sceneElements,
    setSceneElements,
    updateSceneElement,
    applySceneElementToAll,
    videoModel,
    setVideoModel,
    isVideoSettingsFromScenario,
    unlockVideoSettings,
    applyVideoSettingsFromScenario,
    // Navigation
    canProceedToStep4,
    goToNextStep,
    goToPrevStep,
    saveDraft,
  } = useProductAdWizard()

  // 중복 호출 방지를 위한 ref
  const isGeneratingRef = useRef(false)

  // 사용자 플랜 정보
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const isFreeUser = userPlan?.planType === 'FREE'

  // 현재 선택된 씬 탭
  const [activeSceneTab, setActiveSceneTab] = useState(0)

  // 사용자 플랜 정보 로드
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const res = await fetch('/api/user/plan')
        if (res.ok) {
          const data = await res.json()
          setUserPlan(data)
          // FREE 사용자인 경우 기본값 조정
          if (data.planType === 'FREE') {
            setVideoResolution(FREE_USER_LIMITS.maxResolution)
            if (sceneCount > FREE_USER_LIMITS.maxSceneCount) {
              setSceneCount(FREE_USER_LIMITS.maxSceneCount)
            }
          }
        }
      } catch (error) {
        console.error('플랜 정보 로드 오류:', error)
      }
    }
    fetchUserPlan()
  }, [setVideoResolution, setSceneCount, sceneCount])

  // Vidu Q2 모델 강제 설정
  useEffect(() => {
    if (videoModel !== 'vidu-q2') {
      setVideoModel('vidu-q2')
    }
  }, [videoModel, setVideoModel])

  // 씬 개수 변경 시 탭 인덱스 조정
  useEffect(() => {
    if (activeSceneTab >= sceneCount) {
      setActiveSceneTab(sceneCount - 1)
    }
  }, [sceneCount, activeSceneTab])

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
          sceneCount,  // 씬 개수 전달 (씬별 요소 생성용)
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
          sceneCount,
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
  const handleNext = async () => {
    if (!canProceedToStep4()) return
    await saveDraft({
      wizardStep: 4,
      aspectRatio,
    })
    goToNextStep()
  }

  // 총 영상 길이 계산
  const totalDuration = sceneDurations.slice(0, sceneCount).reduce((sum, d) => sum + d, 0)

  // 예상 크레딧 계산
  const estimatedCredits = calculateCredits(sceneDurations.slice(0, sceneCount), videoResolution)

  // 현재 씬 요소
  const currentSceneElement = sceneElements[activeSceneTab] || createDefaultSceneElement()

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
            씬 개수를 선택하고, 각 씬의 영상 길이를 조절하세요 (1~8초)
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
              STARTER 이상 구독 시 최대 8개 씬까지 생성 가능
            </p>
          )}

          {/* 씬별 영상 길이 */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(sceneCount, 7)}, 1fr)` }}>
            {Array.from({ length: sceneCount }).map((_, index) => {
              const duration = sceneDurations[index] || 3
              const maxDuration = isFreeUser ? FREE_USER_LIMITS.maxDuration : 8
              return (
                <div
                  key={index}
                  className="flex flex-col items-center p-2 rounded-xl border-2 border-border bg-secondary/20"
                >
                  <span className="text-xs text-muted-foreground mb-1">씬 {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateSceneDuration(index, duration - 1)}
                      disabled={duration <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-lg font-bold text-foreground">{duration}</span>
                    <button
                      onClick={() => updateSceneDuration(index, duration + 1)}
                      disabled={duration >= maxDuration}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">초</span>
                </div>
              )
            })}
          </div>
          {isFreeUser && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Crown className="w-3 h-3" />
              STARTER 이상 구독 시 씬당 최대 8초까지 설정 가능
            </p>
          )}
        </div>

        {/* 씬별 광고 요소 설정 */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">씬별 광고 요소</h4>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            각 씬마다 배경, 분위기, 카메라 앵글 등을 개별 설정할 수 있습니다
          </p>

          {/* 씬 탭 */}
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {Array.from({ length: sceneCount }).map((_, index) => {
              const complete = isSceneComplete(index)
              return (
                <button
                  key={index}
                  onClick={() => setActiveSceneTab(index)}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    activeSceneTab === index
                      ? 'bg-primary text-primary-foreground'
                      : complete
                        ? 'bg-green-500/10 text-green-600 border border-green-500/30 hover:bg-green-500/20'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  씬 {index + 1}
                  {complete && activeSceneTab !== index && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* 선택된 씬 설정 패널 */}
          <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-foreground">씬 {activeSceneTab + 1} 설정</h5>
              <button
                onClick={() => applySceneElementToAll(activeSceneTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                모든 씬에 적용
              </button>
            </div>

            {/* 필수 요소 (배경, 분위기) */}
            <div className="grid grid-cols-2 gap-4">
              <CompactElementSelector
                elementKey="background"
                value={currentSceneElement.background}
                onChange={(value) => updateSceneElement(activeSceneTab, 'background', value)}
              />
              <CompactElementSelector
                elementKey="mood"
                value={currentSceneElement.mood}
                onChange={(value) => updateSceneElement(activeSceneTab, 'mood', value)}
              />
            </div>

            {/* 선택 요소 (카메라, 배치, 조명, 색상) */}
            <div className="grid grid-cols-2 gap-4">
              <CompactElementSelector
                elementKey="cameraAngle"
                value={currentSceneElement.cameraAngle}
                onChange={(value) => updateSceneElement(activeSceneTab, 'cameraAngle', value)}
              />
              <CompactElementSelector
                elementKey="productPlacement"
                value={currentSceneElement.productPlacement}
                onChange={(value) => updateSceneElement(activeSceneTab, 'productPlacement', value)}
              />
              <CompactElementSelector
                elementKey="lighting"
                value={currentSceneElement.lighting}
                onChange={(value) => updateSceneElement(activeSceneTab, 'lighting', value)}
              />
              <CompactElementSelector
                elementKey="colorTone"
                value={currentSceneElement.colorTone}
                onChange={(value) => updateSceneElement(activeSceneTab, 'colorTone', value)}
              />
            </div>

            {/* 필수 요소 안내 */}
            {!isSceneComplete(activeSceneTab) && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                배경과 분위기는 필수 선택입니다
              </p>
            )}
          </div>

          {/* 씬 완료 상태 요약 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>완료된 씬:</span>
            {Array.from({ length: sceneCount }).map((_, index) => (
              <span
                key={index}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                  isSceneComplete(index)
                    ? 'bg-green-500/20 text-green-600'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {index + 1}
              </span>
            ))}
          </div>
        </div>

        {/* 영상 해상도 선택 */}
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">영상 품질</h4>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {RESOLUTION_OPTIONS.map((option) => {
              const isLocked = isFreeUser && option.value !== FREE_USER_LIMITS.maxResolution
              return (
                <button
                  key={option.value}
                  onClick={() => !isLocked && setVideoResolution(option.value)}
                  disabled={isLocked}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isLocked
                      ? 'border-border bg-secondary/30 cursor-not-allowed opacity-60'
                      : videoResolution === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                  }`}
                >
                  {isLocked && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span>STARTER+</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className={`font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                    <div className="text-xs text-primary mt-2">{option.creditsPerSecond} 크레딧/초</div>
                  </div>
                </button>
              )
            })}
          </div>
          {isFreeUser && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Crown className="w-3 h-3" />
              STARTER 이상 구독 시 HD/FHD 품질 사용 가능
            </p>
          )}
        </div>

        {/* 예상 크레딧 */}
        {aspectRatio && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">예상 크레딧</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sceneCount}개 씬 x 총 {totalDuration}초 x {RESOLUTION_OPTIONS.find(o => o.value === videoResolution)?.creditsPerSecond || 0} 크레딧/초
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{estimatedCredits}</p>
                <p className="text-xs text-muted-foreground">크레딧</p>
              </div>
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
