'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  MapPin,
  Palette,
  Clock,
  Layers,
  Upload,
  Link,
  X,
  AlertCircle,
  MessageSquare,
  Monitor,
  Smartphone,
  Square,
  Video,
  ImageIcon,
} from 'lucide-react'
import {
  useAvatarMotionWizard,
  Scenario,
  ReferenceInfo,
  SceneInfo,
} from './wizard-context'
import { WizardNavigation } from './wizard-navigation-button'

export function WizardStep3Scenario() {
  const {
    selectedProduct,
    selectedAvatarInfo,
    storyMethod,
    referenceInfo,
    setReferenceInfo,
    isAnalyzingReference,
    setIsAnalyzingReference,
    scenarios,
    setScenarios,
    selectedScenarioIndex,
    setSelectedScenarioIndex,
    isGeneratingScenarios,
    setIsGeneratingScenarios,
    isModifyingScenario,
    setIsModifyingScenario,
    updateScenario,
    applyScenarioSettings,
    canProceedToStep4,
    goToNextStep,
    goToPrevStep,
    saveDraftAsync,
  } = useAvatarMotionWizard()

  // 참조 영상 관련 상태
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [referenceError, setReferenceError] = useState<string | null>(null)

  // 시나리오 수정 관련 상태
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [modifyingIndex, setModifyingIndex] = useState<number | null>(null)
  const [modifyRequest, setModifyRequest] = useState('')

  // 중복 요청 방지를 위한 ref
  const scenarioRequestedRef = useRef(false)

  // AI 추천 모드일 때 자동 시나리오 생성
  useEffect(() => {
    if (storyMethod === 'ai-auto' && scenarios.length === 0 && !scenarioRequestedRef.current) {
      generateScenarios(false)
    }
  }, [storyMethod, scenarios.length])

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
          generateCompleteSettings: true,
          multiScene: true,
        }),
      })

      if (!res.ok) {
        throw new Error('시나리오 생성 실패')
      }

      const data = await res.json()

      if (data.scenarios && data.scenarios.length > 0) {
        setScenarios(data.scenarios)
      }
    } catch (error) {
      console.error('시나리오 생성 오류:', error)
      if (!isManualRefresh) {
        scenarioRequestedRef.current = false
      }
    } finally {
      setIsGeneratingScenarios(false)
    }
  }, [selectedProduct, selectedAvatarInfo, setScenarios, setIsGeneratingScenarios])

  // 시나리오 새로고침
  const handleRefreshScenarios = () => {
    scenarioRequestedRef.current = false
    setScenarios([])
    setSelectedScenarioIndex(null)
    generateScenarios(true)
  }

  // 시나리오 선택 (설정도 함께 적용)
  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index)
    applyScenarioSettings(index)
  }

  // 시나리오 수정 요청 모달 열기
  const handleOpenModifyModal = (index: number) => {
    setModifyingIndex(index)
    setModifyRequest('')
    setShowModifyModal(true)
  }

  // 시나리오 수정 요청 제출
  const handleSubmitModify = async () => {
    if (modifyingIndex === null || !modifyRequest.trim()) return

    setIsModifyingScenario(true)
    setShowModifyModal(false)

    try {
      const scenario = scenarios[modifyingIndex]

      const res = await fetch('/api/avatar-motion/modify-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          modificationRequest: modifyRequest,
          productName: selectedProduct?.name || '',
          productDescription: selectedProduct?.description || '',
        }),
      })

      if (!res.ok) {
        throw new Error('시나리오 수정 실패')
      }

      const data = await res.json()
      if (data.scenario) {
        updateScenario(modifyingIndex, data.scenario)
        if (selectedScenarioIndex === modifyingIndex) {
          applyScenarioSettings(modifyingIndex)
        }
      }
    } catch (error) {
      console.error('시나리오 수정 오류:', error)
    } finally {
      setIsModifyingScenario(false)
      setModifyingIndex(null)
      setModifyRequest('')
    }
  }

  // 파일 업로드 (참조 영상)
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!validTypes.includes(file.type)) {
      setReferenceError('MP4, WebM, MOV 형식의 영상만 지원합니다')
      return
    }

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      setReferenceError('파일 크기는 100MB 이하여야 합니다')
      return
    }

    setReferenceError(null)

    const url = URL.createObjectURL(file)
    setReferenceInfo({
      type: 'file',
      url,
      file,
    })

    await analyzeReference({ type: 'file', url, file })
  }, [setReferenceInfo])

  // YouTube URL 처리
  const handleYoutubeSubmit = useCallback(async () => {
    if (!youtubeUrl.trim()) return

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/
    if (!youtubeRegex.test(youtubeUrl)) {
      setReferenceError('올바른 YouTube URL을 입력해주세요')
      return
    }

    setReferenceError(null)
    setReferenceInfo({
      type: 'youtube',
      url: youtubeUrl,
    })

    await analyzeReference({ type: 'youtube', url: youtubeUrl })
  }, [youtubeUrl, setReferenceInfo])

  // 참조 영상 분석
  const analyzeReference = async (info: ReferenceInfo) => {
    setIsAnalyzingReference(true)

    try {
      const formData = new FormData()
      formData.append('type', info.type)

      if (info.type === 'file' && info.file) {
        formData.append('file', info.file)
      } else {
        formData.append('url', info.url)
      }

      if (selectedProduct) {
        formData.append('productName', selectedProduct.name)
        formData.append('productDescription', selectedProduct.description || '')
      }

      const res = await fetch('/api/avatar-motion/analyze-reference', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('분석 실패')
      }

      const data = await res.json()

      setReferenceInfo({
        ...info,
        analyzedElements: data.elements,
        analyzedDescription: data.description,
      })
    } catch (error) {
      console.error('참조 영상 분석 오류:', error)
      setReferenceError('영상 분석에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsAnalyzingReference(false)
    }
  }

  // 참조 영상 제거
  const handleRemoveReference = () => {
    setReferenceInfo(null)
    setYoutubeUrl('')
    setReferenceError(null)
  }

  // 다음 단계로
  const handleNext = () => {
    if (!canProceedToStep4()) return
    goToNextStep()
    saveDraftAsync({ wizardStep: 4 })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          {storyMethod === 'direct' && '시나리오 직접 입력'}
          {storyMethod === 'ai-auto' && 'AI 추천 시나리오 선택'}
          {storyMethod === 'reference' && '참조 영상 업로드'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {storyMethod === 'direct' && '광고 시나리오의 세부 사항을 직접 입력해주세요'}
          {storyMethod === 'ai-auto' && '제품과 아바타에 맞는 AI 추천 시나리오 중 하나를 선택하세요'}
          {storyMethod === 'reference' && '분석할 참조 영상을 업로드해주세요'}
        </p>
      </div>

      {/* 직접 입력 모드 */}
      {storyMethod === 'direct' && (
        <DirectInputForm />
      )}

      {/* AI 추천 모드 */}
      {storyMethod === 'ai-auto' && (
        <div className="space-y-4">
          {/* 시나리오 생성 중 */}
          {isGeneratingScenarios && (
            <div className="bg-secondary/30 rounded-xl p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-foreground mb-1">AI가 시나리오를 생성 중입니다</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct ? `"${selectedProduct.name}"` : '제품'}에 맞는 시나리오와 설정을 만들고 있습니다...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 시나리오 수정 중 */}
          {isModifyingScenario && (
            <div className="bg-secondary/30 rounded-xl p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-foreground mb-1">시나리오를 수정 중입니다</h3>
                  <p className="text-sm text-muted-foreground">
                    요청하신 내용을 반영하여 시나리오를 개선하고 있습니다...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 시나리오 목록 */}
          {!isGeneratingScenarios && !isModifyingScenario && scenarios.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  AI가 추천하는 3가지 시나리오 중 하나를 선택하세요
                </p>
                <button
                  onClick={handleRefreshScenarios}
                  disabled={isGeneratingScenarios}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 생성
                </button>
              </div>

              <div className="grid gap-4">
                {scenarios.map((scenario, index) => (
                  <DetailedScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    index={index}
                    isSelected={selectedScenarioIndex === index}
                    onSelect={() => handleSelectScenario(index)}
                    onModify={() => handleOpenModifyModal(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 참조 영상 모드 */}
      {storyMethod === 'reference' && (
        <div className="space-y-4">
          {referenceInfo ? (
            <div className="relative">
              {/* 영상 미리보기 */}
              <div className="rounded-lg overflow-hidden bg-black/10 aspect-video">
                {referenceInfo.type === 'file' ? (
                  <video
                    src={referenceInfo.url}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                    <div className="text-center">
                      <Video className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">YouTube 영상</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs mt-1">
                        {referenceInfo.url}
                      </p>
                    </div>
                  </div>
                )}

                {/* 분석 중 오버레이 */}
                {isAnalyzingReference && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-foreground">영상 분석 중...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 분석 결과 */}
              {referenceInfo.analyzedDescription && !isAnalyzingReference && (
                <div className="mt-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">분석 완료</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {referenceInfo.analyzedDescription}
                  </p>
                  {referenceInfo.analyzedElements && referenceInfo.analyzedElements.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {referenceInfo.analyzedElements.map((element, i) => (
                        <span key={i} className="px-2 py-1 bg-green-500/10 text-xs text-green-700 rounded">
                          {element}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 제거 버튼 */}
              <button
                onClick={handleRemoveReference}
                className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ) : (
            <>
              {/* 파일 업로드 */}
              <div>
                <label className="block">
                  <div className="flex items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="text-center">
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-foreground font-medium">영상 파일 업로드</p>
                      <p className="text-sm text-muted-foreground mt-1">MP4, WebM, MOV (최대 100MB)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 구분선 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">또는</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* YouTube URL 입력 */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="YouTube URL 입력"
                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button
                  onClick={handleYoutubeSubmit}
                  disabled={!youtubeUrl.trim()}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  분석
                </button>
              </div>
            </>
          )}

          {/* 에러 메시지 */}
          {referenceError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{referenceError}</p>
            </div>
          )}
        </div>
      )}

      {/* 네비게이션 버튼 - 조건 충족 시 아래에서 올라옴 */}
      <WizardNavigation
        onPrev={goToPrevStep}
        onNext={handleNext}
        canProceed={canProceedToStep4()}
        loading={false}
        showNext={canProceedToStep4()}
        showPrev={!isGeneratingScenarios && !isAnalyzingReference && !isModifyingScenario}
      />

      {/* 시나리오 수정 모달 */}
      {showModifyModal && (
        <div className="fixed inset-0 !m-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">시나리오 수정 요청</h3>
                  <p className="text-sm text-muted-foreground">어떤 점을 수정하고 싶은지 입력해주세요</p>
                </div>
              </div>

              <textarea
                value={modifyRequest}
                onChange={(e) => setModifyRequest(e.target.value)}
                placeholder="예: 더 밝은 분위기로 바꿔주세요, 제품이 더 일찍 등장하게 해주세요, 실내보다 야외 배경으로 변경해주세요..."
                rows={4}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModifyModal(false)}
                  className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitModify}
                  disabled={!modifyRequest.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  수정 요청
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 직접 입력 폼 (추후 구현)
function DirectInputForm() {
  return (
    <div className="bg-secondary/30 rounded-xl p-6">
      <p className="text-center text-muted-foreground">
        직접 입력 기능은 다음 단계(영상 설정)에서 세부 설정을 진행합니다.
      </p>
    </div>
  )
}

// 상세 시나리오 카드 컴포넌트
interface DetailedScenarioCardProps {
  scenario: Scenario
  index: number
  isSelected: boolean
  onSelect: () => void
  onModify: () => void
}

function DetailedScenarioCard({ scenario, index, isSelected, onSelect, onModify }: DetailedScenarioCardProps) {

  // 인덱스에 따른 아이콘 색상
  const colorClasses = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-amber-500',
  ]
  const colorClass = colorClasses[index % colorClasses.length]

  // 비율 아이콘 가져오기
  const getAspectRatioIcon = (ratio?: string) => {
    switch (ratio) {
      case '9:16': return <Smartphone className="w-3.5 h-3.5" />
      case '16:9': return <Monitor className="w-3.5 h-3.5" />
      case '1:1': return <Square className="w-3.5 h-3.5" />
      default: return <Smartphone className="w-3.5 h-3.5" />
    }
  }

  // 설정 요약
  const settings = scenario.recommendedSettings
  const sceneCount = settings?.sceneCount || scenario.scenes?.length || 1
  const totalDuration = scenario.totalDuration || settings?.sceneDurations?.reduce((a, b) => a + b, 0) || 0
  const aspectRatio = settings?.aspectRatio || '9:16'

  return (
    <div
      className={`rounded-xl border-2 transition-all overflow-hidden ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* 수정 요청 버튼 (우측 상단) */}
      <div className="flex justify-end px-4 pt-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onModify()
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          수정 요청
        </button>
      </div>

      {/* 메인 카드 (클릭 가능) */}
      <button
        onClick={onSelect}
        className="w-full px-5 pb-5 text-left"
      >
        <div className="flex items-start gap-4">
          {/* 시나리오 번호 */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-lg">{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-lg text-foreground">{scenario.title}</h4>
              {isSelected && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  <Check className="w-3 h-3" />
                  선택됨
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {scenario.description}
            </p>

            {/* 설정 요약 배지 */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full text-foreground">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium">{sceneCount}</span>개 씬
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full text-foreground">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                총 <span className="font-medium">{totalDuration}</span>초
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full text-foreground">
                {getAspectRatioIcon(aspectRatio)}
                {aspectRatio === '9:16' ? '세로' : aspectRatio === '16:9' ? '가로' : '정사각'}
                <span className="text-muted-foreground">({aspectRatio})</span>
              </span>
            </div>

            {/* 장소/분위기 태그 */}
            <div className="flex flex-wrap gap-2 mt-3">
              {scenario.location && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-xs text-blue-600 rounded">
                  <MapPin className="w-3 h-3" />
                  {scenario.location}
                </span>
              )}
              {scenario.mood && (
                <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-xs text-purple-600 rounded">
                  <Palette className="w-3 h-3" />
                  {scenario.mood}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* 씬 상세 정보 (가로 스크롤) */}
      {scenario.scenes && scenario.scenes.length > 0 && (
        <div className="border-t border-border pt-4 pb-4">
          <div className="px-5 mb-2 text-xs text-muted-foreground">
            씬 구성 ({scenario.scenes.length}개)
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {scenario.scenes.map((scene, i) => (
              <SceneInfoCard key={i} scene={scene} sceneNumber={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 씬 정보 카드 (가로 스크롤용 컴팩트 디자인)
interface SceneInfoCardProps {
  scene: SceneInfo
  sceneNumber: number
}

function SceneInfoCard({ scene, sceneNumber }: SceneInfoCardProps) {
  return (
    <div className="flex-shrink-0 w-56 p-3 bg-secondary/30 rounded-lg border border-border/50">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{sceneNumber}</span>
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
            {scene.title}
          </span>
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
          {scene.duration}초
        </span>
      </div>

      {/* 설명 */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {scene.description}
      </p>

      {/* 이미지/모션 요약 (있을 때만 표시) */}
      <div className="space-y-1.5">
        {scene.imageSummary && (
          <div className="flex items-start gap-1.5 text-xs">
            <ImageIcon className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
            <span className="text-foreground/70 line-clamp-2">{scene.imageSummary}</span>
          </div>
        )}
        {scene.videoSummary && (
          <div className="flex items-start gap-1.5 text-xs">
            <Video className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
            <span className="text-foreground/70 line-clamp-2">{scene.videoSummary}</span>
          </div>
        )}
      </div>

      {/* 장소/분위기 태그 */}
      {(scene.location || scene.mood) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {scene.location && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-secondary text-[10px] text-muted-foreground rounded">
              <MapPin className="w-2.5 h-2.5" />
              {scene.location}
            </span>
          )}
          {scene.mood && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-secondary text-[10px] text-muted-foreground rounded">
              <Palette className="w-2.5 h-2.5" />
              {scene.mood}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
