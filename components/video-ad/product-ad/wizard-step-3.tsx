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
} from 'lucide-react'
import { useProductAdWizard, AdElementOptions, ScenarioInfo, RecommendedVideoSettings } from './wizard-context'

// 광고 요소 옵션 정의
const AD_ELEMENT_OPTIONS: Record<keyof AdElementOptions, { label: string; options: string[] }> = {
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
    options: [
      '고급스럽고 우아한',
      '따뜻하고 친근한',
      '모던하고 세련된',
      '역동적이고 에너지틱한',
      '차분하고 편안한',
      '트렌디하고 젊은',
      '클래식하고 전통적인',
    ],
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

interface ElementSelectorProps {
  elementKey: keyof AdElementOptions
  value: string
  onChange: (value: string) => void
  isAiRecommended?: boolean
  aiReason?: string
}

function ElementSelector({
  elementKey,
  value,
  onChange,
  isAiRecommended,
  aiReason,
}: ElementSelectorProps) {
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          {element.label}
          {isAiRecommended && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </label>
        {aiReason && (
          <span className="text-[10px] text-muted-foreground max-w-[200px] truncate">
            {aiReason}
          </span>
        )}
      </div>

      {/* 선택된 값 표시 또는 선택 버튼 */}
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
            {value || '선택해주세요'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* 옵션 목록 */}
      {isExpanded && (
        <div className="p-2 bg-secondary/30 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {element.options.map((option) => (
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

          {/* 직접 입력 */}
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

export function WizardStep3() {
  const {
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
    canProceedToStep4,
    goToNextStep,
    goToPrevStep,
    saveDraftAsync,
    applyVideoSettingsFromScenario,
  } = useProductAdWizard()

  const [aiReasons, setAiReasons] = useState<Record<string, string>>({})

  // 중복 호출 방지를 위한 ref
  const isGeneratingRef = useRef(false)

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
        }),
      })

      if (!res.ok) throw new Error('시나리오 생성 실패')

      const data = await res.json()
      setGeneratedScenarios(data.scenarios)
      setAiReasons(data.reasons || {})

      // 첫 번째 시나리오 자동 선택
      if (data.scenarios.length > 0) {
        setSelectedScenarioIndex(0)
        setScenarioInfo(data.scenarios[0])
        // AI 추천 영상 설정 적용
        if (data.scenarios[0].videoSettings) {
          applyVideoSettingsFromScenario(data.scenarios[0].videoSettings as RecommendedVideoSettings)
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
        }),
      })

      if (!res.ok) throw new Error('시나리오 생성 실패')

      const data = await res.json()
      if (data.scenarios.length > 0) {
        setScenarioInfo(data.scenarios[0])
        setAiReasons(data.reasons || {})
        // AI 추천 영상 설정 적용
        if (data.scenarios[0].videoSettings) {
          applyVideoSettingsFromScenario(data.scenarios[0].videoSettings as RecommendedVideoSettings)
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
  }

  // 다음 단계로
  const handleNext = () => {
    if (!canProceedToStep4()) return
    goToNextStep()
    saveDraftAsync({ wizardStep: 4 })
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
        <h2 className="text-xl font-bold text-foreground">광고 시나리오 구성</h2>
        <p className="text-muted-foreground mt-2">
          {scenarioMethod === 'direct'
            ? '원하는 광고 스타일을 직접 선택해주세요'
            : scenarioMethod === 'ai-auto'
              ? 'AI가 추천한 시나리오를 선택하거나 수정하세요'
              : '참조 영상 분석 결과를 기반으로 시나리오를 구성했습니다'}
        </p>
      </div>

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

      {/* 시나리오 요소 설정 */}
      {scenarioInfo && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">광고 요소 설정</h3>

          <div className="grid gap-4">
            {(Object.keys(AD_ELEMENT_OPTIONS) as (keyof AdElementOptions)[]).map((key) => (
              <ElementSelector
                key={key}
                elementKey={key}
                value={scenarioInfo.elements[key]}
                onChange={(value) => updateScenarioElement(key, value)}
                isAiRecommended={scenarioMethod !== 'direct' && !!scenarioInfo.elements[key]}
                aiReason={aiReasons[key]}
              />
            ))}
          </div>
        </div>
      )}

      {/* 네비게이션 버튼 */}
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
          배경과 분위기를 선택해주세요
        </p>
      )}
    </div>
  )
}
