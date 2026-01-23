'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  RefreshCw,
  Film,
  MapPin,
  Package,
  Palette,
} from 'lucide-react'
import { useAvatarMotionWizard, Scenario } from './wizard-context'

export function WizardStep2() {
  const {
    selectedProduct,
    selectedAvatarInfo,
    scenarios,
    setScenarios,
    selectedScenarioIndex,
    setSelectedScenarioIndex,
    isGeneratingScenarios,
    setIsGeneratingScenarios,
    canProceedToStep3,
    goToNextStep,
    goToPrevStep,
    saveDraft,
    isSaving,
  } = useAvatarMotionWizard()

  // 중복 요청 방지를 위한 ref
  const scenarioRequestedRef = useRef(false)

  // 시나리오 생성 API 호출
  const generateScenarios = useCallback(async (isManualRefresh = false) => {
    if (!selectedProduct || !selectedAvatarInfo) return

    // 수동 새로고침이 아닌 경우, 중복 요청 체크
    if (!isManualRefresh && scenarioRequestedRef.current) {
      return
    }
    scenarioRequestedRef.current = true

    setIsGeneratingScenarios(true)

    try {
      // 아바타 설명 구성
      let avatarDescription = ''
      if (selectedAvatarInfo.type === 'ai-generated') {
        avatarDescription = 'AI 자동 생성 아바타'
      } else if (selectedAvatarInfo.type === 'outfit') {
        avatarDescription = `${selectedAvatarInfo.avatarName} (${selectedAvatarInfo.outfitName || '의상 교체'})`
      } else {
        avatarDescription = selectedAvatarInfo.avatarName || selectedAvatarInfo.displayName || '아바타'
      }

      const res = await fetch('/api/avatar-motion/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.name,
          productDescription: selectedProduct.description || '',
          productSellingPoints: selectedProduct.selling_points || [],
          avatarDescription,
          avatarType: selectedAvatarInfo.type,
          // 멀티 씬 모드 활성화 - 씬별 프롬프트 포함된 시나리오 생성
          multiScene: true,
          sceneCount: 3,
          totalDuration: 15,
        }),
      })

      if (!res.ok) {
        throw new Error('시나리오 생성 실패')
      }

      const data = await res.json()

      if (data.scenarios && data.scenarios.length > 0) {
        setScenarios(data.scenarios)
        // 첫 번째 시나리오 자동 선택
        setSelectedScenarioIndex(0)
      }
    } catch (error) {
      console.error('시나리오 생성 오류:', error)
      // 에러 시 ref 리셋하여 재시도 가능하게
      if (!isManualRefresh) {
        scenarioRequestedRef.current = false
      }
    } finally {
      setIsGeneratingScenarios(false)
    }
  }, [selectedProduct, selectedAvatarInfo, setScenarios, setSelectedScenarioIndex, setIsGeneratingScenarios])

  // Step 2 진입 시 시나리오 자동 생성
  useEffect(() => {
    if (scenarios.length === 0 && !isGeneratingScenarios) {
      generateScenarios(false)
    }
  }, [scenarios.length, isGeneratingScenarios, generateScenarios])

  // 시나리오 새로고침
  const handleRefreshScenarios = () => {
    scenarioRequestedRef.current = false
    setScenarios([])
    setSelectedScenarioIndex(null)
    generateScenarios(true)
  }

  // 시나리오 선택
  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index)
  }

  // 다음 단계로 이동 (DB 저장 포함)
  const handleNext = async () => {
    if (!canProceedToStep3()) return
    await saveDraft({ wizardStep: 3 })
    goToNextStep()
  }

  // 선택된 시나리오
  const selectedScenario = selectedScenarioIndex !== null ? scenarios[selectedScenarioIndex] : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 선택된 정보 요약 */}
      <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
        {selectedAvatarInfo && (
          <div className="flex items-center gap-2">
            {selectedAvatarInfo.type === 'ai-generated' ? (
              <div className="w-8 h-10 rounded bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            ) : (
              <img
                src={selectedAvatarInfo.imageUrl}
                alt={selectedAvatarInfo.displayName}
                className="w-8 h-10 object-cover rounded"
              />
            )}
            <span className="text-sm text-foreground">{selectedAvatarInfo.displayName}</span>
          </div>
        )}
        {selectedProduct && (
          <>
            <span className="text-muted-foreground">+</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary rounded overflow-hidden">
                <img
                  src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm text-foreground">{selectedProduct.name}</span>
            </div>
          </>
        )}
      </div>

      {/* 시나리오 생성 중 */}
      {isGeneratingScenarios && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-foreground mb-1">AI가 시나리오를 생성 중입니다</h3>
              <p className="text-sm text-muted-foreground">
                {selectedProduct ? `"${selectedProduct.name}"` : '제품'}에 맞는 영화적 시나리오를 만들고 있습니다...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 시나리오 선택 */}
      {!isGeneratingScenarios && scenarios.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              시나리오 선택
            </h2>
            <button
              onClick={handleRefreshScenarios}
              disabled={isGeneratingScenarios}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 생성
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            AI가 추천하는 3가지 시나리오 중 하나를 선택하세요.
          </p>

          <div className="grid gap-3">
            {scenarios.map((scenario, index) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                index={index}
                isSelected={selectedScenarioIndex === index}
                onSelect={() => handleSelectScenario(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 선택된 시나리오 상세 */}
      {selectedScenario && !isGeneratingScenarios && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-primary mb-2">
                선택된 시나리오: {selectedScenario.title}
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-foreground">{selectedScenario.concept}</p>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {/* 멀티 씬 시나리오: 첫 씬의 location 또는 전체 location 사용 */}
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedScenario.scenes?.[0]?.location || selectedScenario.location || '다양한 장소'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    {selectedScenario.mood}
                  </span>
                  {/* 멀티 씬일 경우 씬 개수 표시 */}
                  {selectedScenario.scenes && selectedScenario.scenes.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      {selectedScenario.scenes.length}개 씬
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-1 text-muted-foreground">
                  <Package className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{selectedScenario.productAppearance}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          disabled={!canProceedToStep3() || isSaving}
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

      {/* 유효성 메시지 */}
      {!canProceedToStep3() && !isGeneratingScenarios && scenarios.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          시나리오를 선택해주세요
        </p>
      )}
    </div>
  )
}

// 시나리오 카드 컴포넌트
interface ScenarioCardProps {
  scenario: Scenario
  index: number
  isSelected: boolean
  onSelect: () => void
}

function ScenarioCard({ scenario, index, isSelected, onSelect }: ScenarioCardProps) {
  // 인덱스에 따른 아이콘 색상
  const colorClasses = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-amber-500',
  ]
  const colorClass = colorClasses[index % colorClasses.length]

  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* 시나리오 번호 */}
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{scenario.title}</h4>
            {isSelected && (
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {scenario.description}
          </p>
          {/* 태그 */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {/* 멀티 씬 시나리오: 첫 씬의 location 또는 전체 location 사용 */}
            <span className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded">
              {scenario.scenes?.[0]?.location || scenario.location || '다양한 장소'}
            </span>
            <span className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded">
              {scenario.mood}
            </span>
            {/* 멀티 씬일 경우 씬 개수 표시 */}
            {scenario.scenes && scenario.scenes.length > 0 && (
              <span className="px-2 py-0.5 bg-primary/10 text-xs text-primary rounded">
                {scenario.scenes.length}개 씬 · {scenario.totalDuration || scenario.scenes.reduce((sum, s) => sum + s.duration, 0)}초
              </span>
            )}
            {scenario.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
