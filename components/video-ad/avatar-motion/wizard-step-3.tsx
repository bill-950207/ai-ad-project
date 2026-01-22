'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Monitor,
  Smartphone,
  Square,
  Clock,
  Sparkles,
  Film,
  MapPin,
  Palette,
  Package,
  MessageSquare,
  Wand2,
  Settings,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
  Layers,
} from 'lucide-react'
import {
  useAvatarMotionWizard,
  AspectRatio,
  ImageSize,
  VideoResolution,
  MovementAmplitude,
} from './wizard-context'

// 화면 비율 옵션
const ASPECT_RATIO_OPTIONS: {
  value: AspectRatio
  imageSize: ImageSize
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: '9:16',
    imageSize: '576x1024',
    label: '세로 (9:16)',
    description: '릴스, 숏폼',
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    value: '16:9',
    imageSize: '1024x576',
    label: '가로 (16:9)',
    description: '유튜브, 와이드',
    icon: <Monitor className="w-5 h-5" />,
  },
  {
    value: '1:1',
    imageSize: '768x768',
    label: '정사각 (1:1)',
    description: '인스타, 피드',
    icon: <Square className="w-5 h-5" />,
  },
]

// 해상도 옵션 (Vidu Q2)
const RESOLUTION_OPTIONS: {
  value: VideoResolution
  label: string
  description: string
  creditPerSec: number
}[] = [
  {
    value: '540p',
    label: '540p',
    description: '경제적, 테스트용',
    creditPerSec: 5,
  },
  {
    value: '720p',
    label: '720p',
    description: '표준 화질',
    creditPerSec: 8,
  },
  {
    value: '1080p',
    label: '1080p',
    description: '고화질',
    creditPerSec: 12,
  },
]

// 씬 개수 옵션
const SCENE_COUNT_OPTIONS = [
  { value: 2, label: '2 씬', description: '짧은 광고' },
  { value: 3, label: '3 씬', description: '표준' },
  { value: 4, label: '4 씬', description: '스토리텔링' },
  { value: 5, label: '5 씬', description: '상세한 흐름' },
]

// 움직임 강도 옵션
const MOVEMENT_OPTIONS: {
  value: MovementAmplitude
  label: string
  description: string
}[] = [
  { value: 'auto', label: '자동', description: 'AI 자동 결정' },
  { value: 'small', label: '작게', description: '미세한 움직임' },
  { value: 'medium', label: '중간', description: '자연스러운 움직임' },
  { value: 'large', label: '크게', description: '역동적인 움직임' },
]

export function WizardStep3() {
  const {
    aspectRatio,
    setAspectRatio,
    setImageSize,
    resolution,
    setResolution,
    sceneCount,
    setSceneCount,
    sceneDurations,
    setSceneDurations,
    movementAmplitudes,
    setMovementAmplitudes,
    additionalPrompt,
    setAdditionalPrompt,
    useAIRecommendation,
    setUseAIRecommendation,
    aiRecommendedSettings,
    setAIRecommendedSettings,
    applyAIRecommendation,
    getSelectedScenario,
    getTotalDuration,
    getEstimatedCredits,
    canProceedToStep4,
    goToNextStep,
    goToPrevStep,
    saveDraft,
    isSaving,
  } = useAvatarMotionWizard()

  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  const selectedScenario = getSelectedScenario()

  // 화면 비율 변경
  const handleAspectRatioChange = (option: typeof ASPECT_RATIO_OPTIONS[0]) => {
    setAspectRatio(option.value)
    setImageSize(option.imageSize)
  }

  // 씬 개수 변경
  const handleSceneCountChange = (count: number) => {
    setSceneCount(count)
    // 씬 개수에 맞게 배열 조정
    const newDurations = [...sceneDurations]
    const newAmplitudes = [...movementAmplitudes]

    while (newDurations.length < count) {
      newDurations.push(5)
      newAmplitudes.push('auto')
    }
    while (newDurations.length > count) {
      newDurations.pop()
      newAmplitudes.pop()
    }

    setSceneDurations(newDurations)
    setMovementAmplitudes(newAmplitudes)
  }

  // 씬별 시간 변경
  const handleSceneDurationChange = (index: number, duration: number) => {
    const newDurations = [...sceneDurations]
    newDurations[index] = Math.max(1, Math.min(8, duration))
    setSceneDurations(newDurations)
  }

  // 씬별 움직임 강도 변경
  const handleMovementAmplitudeChange = (index: number, amplitude: MovementAmplitude) => {
    const newAmplitudes = [...movementAmplitudes]
    newAmplitudes[index] = amplitude
    setMovementAmplitudes(newAmplitudes)
  }

  // AI 추천 설정 요청
  const handleRequestAIRecommendation = async () => {
    if (!selectedScenario) return

    setIsLoadingRecommendation(true)
    try {
      const response = await fetch('/api/avatar-motion/recommend-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioTitle: selectedScenario.title,
          scenarioDescription: selectedScenario.description,
          scenarioConcept: selectedScenario.concept,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.recommendation) {
          setAIRecommendedSettings(data.recommendation)
          setUseAIRecommendation(true)
          applyAIRecommendation()
        }
      }
    } catch (error) {
      console.error('AI 추천 설정 오류:', error)
    } finally {
      setIsLoadingRecommendation(false)
    }
  }

  // 다음 단계로 이동 (DB 저장 포함)
  const handleNext = async () => {
    if (!canProceedToStep4()) return
    await saveDraft({ wizardStep: 4, status: 'GENERATING_FRAMES' })
    goToNextStep()
  }

  const totalDuration = getTotalDuration()
  const estimatedCredits = getEstimatedCredits()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 선택된 시나리오 요약 */}
      {selectedScenario && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-primary">{selectedScenario.title}</h3>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  선택됨
                </span>
              </div>
              <p className="text-sm text-foreground mb-2">{selectedScenario.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {selectedScenario.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedScenario.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  {selectedScenario.mood}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {selectedScenario.productAppearance.slice(0, 30)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 영상 설정 헤더 */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          영상 설정
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          영상의 화면 비율, 씬 구성, 해상도를 설정하세요
        </p>
      </div>

      {/* AI 추천 설정 버튼 */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground mb-1">AI 추천 설정</h3>
            <p className="text-sm text-muted-foreground mb-3">
              시나리오에 맞는 최적의 영상 설정을 AI가 자동으로 추천해 드립니다.
            </p>
            <button
              onClick={handleRequestAIRecommendation}
              disabled={isLoadingRecommendation || !selectedScenario}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoadingRecommendation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 추천 받기
                </>
              )}
            </button>
          </div>
        </div>
        {aiRecommendedSettings && (
          <div className="mt-3 p-3 bg-background/50 rounded-lg text-sm text-muted-foreground">
            <strong className="text-foreground">AI 추천 이유:</strong> {aiRecommendedSettings.reasoning}
          </div>
        )}
      </div>

      {/* 화면 비율 선택 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">화면 비율</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAspectRatioChange(option)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                aspectRatio === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                aspectRatio === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {option.icon}
              </div>
              <div className="font-medium text-foreground text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 씬 개수 선택 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">씬 개수</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SCENE_COUNT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSceneCountChange(option.value)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                sceneCount === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`text-xl font-bold ${
                sceneCount === option.value
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}>
                {option.value}
              </div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 씬별 시간 설정 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">씬별 시간 설정</span>
          </div>
          <span className="text-sm text-muted-foreground">
            총 {totalDuration}초
          </span>
        </div>
        <div className="space-y-2">
          {Array.from({ length: sceneCount }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <div className="w-20 text-sm font-medium text-foreground">
                씬 {i + 1}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={sceneDurations[i] || 5}
                  onChange={(e) => handleSceneDurationChange(i, parseInt(e.target.value))}
                  className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="w-16 px-2 py-1 bg-background border border-border rounded text-center text-sm font-medium">
                  {sceneDurations[i] || 5}초
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 해상도 선택 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">영상 해상도</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {RESOLUTION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setResolution(option.value)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                resolution === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`text-lg font-bold ${
                resolution === option.value
                  ? 'text-primary'
                  : 'text-foreground'
              }`}>
                {option.label}
              </div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
              <div className="text-xs text-primary mt-1">{option.creditPerSec} 크레딧/초</div>
            </button>
          ))}
        </div>
      </div>

      {/* 고급 설정 (접을 수 있음) */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Zap className="w-4 h-4 text-muted-foreground" />
            고급 설정
          </span>
          {showAdvancedSettings ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showAdvancedSettings && (
          <div className="p-4 space-y-4">
            {/* 씬별 움직임 강도 */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">씬별 움직임 강도</div>
              <div className="space-y-2">
                {Array.from({ length: sceneCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-16 text-sm text-muted-foreground">씬 {i + 1}</div>
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      {MOVEMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleMovementAmplitudeChange(i, opt.value)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            movementAmplitudes[i] === opt.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 추가 프롬프트 입력 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">추가 지시사항</span>
                <span className="text-xs text-muted-foreground">(선택사항)</span>
              </div>
              <textarea
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="영상에 추가로 반영하고 싶은 내용이 있다면 입력하세요. 예: 더 밝은 조명, 역동적인 움직임, 미소 강조 등"
                rows={3}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 설정 요약 */}
      <div className="p-4 bg-secondary/30 rounded-xl">
        <div className="text-xs text-muted-foreground mb-2">현재 설정</div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-foreground">
            <Monitor className="w-4 h-4 text-primary" />
            {ASPECT_RATIO_OPTIONS.find(o => o.value === aspectRatio)?.label}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Layers className="w-4 h-4 text-primary" />
            {sceneCount}개 씬
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            총 {totalDuration}초
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Play className="w-4 h-4 text-primary" />
            {resolution}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">예상 크레딧</span>
            <span className="font-semibold text-primary">{estimatedCredits} 크레딧</span>
          </div>
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={goToPrevStep}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceedToStep4() || isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              다음
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
