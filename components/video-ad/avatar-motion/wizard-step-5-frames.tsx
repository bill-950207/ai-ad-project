'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  User,
  MapPin,
  Check,
  Film,
  Clock,
  Monitor,
  Package,
  Layers,
  ImageIcon,
  MessageSquare,
  RotateCw,
} from 'lucide-react'
import { useAvatarMotionWizard, SceneKeyframe } from './wizard-context'

// 생성 단계
type GenerationPhase = 'idle' | 'avatar' | 'frames' | 'done' | 'error'

export function WizardStep5Frames() {
  const {
    selectedProduct,
    selectedAvatarInfo,
    getSelectedScenario,
    aspectRatio,
    imageSize,
    sceneCount,
    sceneDurations,
    additionalPrompt,
    isGeneratingFrames,
    setIsGeneratingFrames,
    // 씬별 키프레임
    sceneKeyframes,
    setSceneKeyframes,
    updateSceneKeyframe,
    // Legacy
    startFrameUrl,
    setStartFrameUrl,
    // AI 아바타 상태
    isGeneratingAvatars,
    setIsGeneratingAvatars,
    generatedAvatarOptions,
    setGeneratedAvatarOptions,
    updateAvatarOption,
    selectedAiAvatarUrl,
    selectedAiAvatarDescription,
    selectAiAvatar,
    resetAiAvatars,
    // Navigation
    canProceedToStep6,
    goToNextStep,
    goToPrevStep,
    getTotalDuration,
    // DB 연동
    saveDraft,
    draftId,
  } = useAvatarMotionWizard()

  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentGeneratingScene, setCurrentGeneratingScene] = useState(0)

  // 프레임 재생성 관련 상태
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null)
  const [regeneratePrompt, setRegeneratePrompt] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)

  // 중복 생성 방지를 위한 ref
  const generationStartedRef = useRef(false)

  // 선택된 시나리오 가져오기
  const selectedScenario = getSelectedScenario()

  // AI 아바타가 필요한지 확인
  const needsAiAvatar = selectedAvatarInfo?.type === 'ai-generated'

  // 모든 프레임이 완성되었는지 확인
  const allFramesCompleted = sceneKeyframes.length >= sceneCount &&
    sceneKeyframes.every(kf => kf.status === 'completed' && kf.imageUrl)

  // AI 아바타 상태 폴링
  const pollAvatarStatus = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/avatar-motion/status/${encodeURIComponent(requestId)}?type=frame`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('아바타 상태 조회 오류:', error)
      return null
    }
  }, [])

  // AI 아바타 생성 (시나리오 기반)
  const generateAvatar = useCallback(async () => {
    if (!selectedScenario) return

    setIsGeneratingAvatars(true)
    resetAiAvatars()

    try {
      // 멀티 씬의 첫 번째 씬 정보 사용
      const firstScene = selectedScenario.scenes?.[0]

      const response = await fetch('/api/avatar-motion/generate-avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct?.name || '',
          productDescription: selectedProduct?.description || '',
          productCategory: '',
          storyInfo: {
            title: selectedScenario.title,
            description: selectedScenario.description,
            concept: selectedScenario.concept,
            background: firstScene?.location || selectedScenario.location,
            startFrame: {
              id: 'start',
              order: 1,
              description: firstScene?.firstFramePrompt || selectedScenario.firstFramePrompt,
            },
            mood: firstScene?.mood || selectedScenario.mood,
            motionPromptEN: firstScene?.motionPromptEN || selectedScenario.motionPromptEN,
          },
          locationPrompt: firstScene?.location || selectedScenario.location,
        }),
      })

      if (!response.ok) {
        throw new Error('아바타 생성 요청 실패')
      }

      const data = await response.json()
      setGeneratedAvatarOptions([{
        index: 0,
        requestId: data.avatar.requestId,
        description: data.avatar.description,
        status: 'generating' as const,
      }])
      return data.avatar.requestId
    } catch (error) {
      console.error('아바타 생성 오류:', error)
      throw error
    }
  }, [selectedProduct, selectedScenario, setIsGeneratingAvatars, resetAiAvatars, setGeneratedAvatarOptions])

  // 단일 씬 프레임 생성
  const generateSceneFrame = useCallback(async (
    sceneIndex: number,
    firstFramePrompt: string,
    avatarImageUrl: string | undefined
  ): Promise<string | null> => {
    try {
      // 프롬프트 구성
      let framePrompt = firstFramePrompt
      if (additionalPrompt) {
        framePrompt = `${framePrompt}\n\n추가 지시: ${additionalPrompt}`
      }

      const scene = selectedScenario?.scenes?.[sceneIndex]

      const response = await fetch('/api/avatar-motion/generate-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarImageUrl: avatarImageUrl || selectedAvatarInfo?.imageUrl,
          avatarDescription: needsAiAvatar ? selectedAiAvatarDescription : '',
          productImageUrl: selectedProduct?.rembg_image_url || selectedProduct?.image_url,
          productInfo: selectedProduct
            ? `${selectedProduct.name}: ${selectedProduct.description || ''}`
            : '',
          startFramePrompt: framePrompt,
          aspectRatio,
          imageSize,
          locationPrompt: scene?.location || selectedScenario?.location || '',
        }),
      })

      if (!response.ok) {
        throw new Error(`씬 ${sceneIndex + 1} 프레임 생성 요청 실패`)
      }

      const data = await response.json()

      if (data.startFrame.status === 'completed' && data.startFrame.imageUrl) {
        return data.startFrame.imageUrl
      }

      return null
    } catch (error) {
      console.error(`씬 ${sceneIndex + 1} 프레임 생성 오류:`, error)
      return null
    }
  }, [selectedScenario, selectedAvatarInfo, selectedProduct, aspectRatio, imageSize, additionalPrompt, needsAiAvatar, selectedAiAvatarDescription])

  // 모든 씬 프레임 병렬 생성
  const generateAllSceneFrames = useCallback(async (avatarImageUrl: string | undefined) => {
    if (!selectedScenario) return

    setIsGeneratingFrames(true)

    // 씬 키프레임 초기화 (모두 generating 상태)
    const initialKeyframes: SceneKeyframe[] = Array.from({ length: sceneCount }, (_, i) => ({
      sceneIndex: i,
      imageUrl: null,
      requestId: null,
      status: 'generating',
    }))
    setSceneKeyframes(initialKeyframes)

    // 멀티 씬이 있으면 사용, 없으면 기존 시나리오의 firstFramePrompt 사용
    const scenes = selectedScenario.scenes || []
    const hasMultiScene = scenes.length > 0

    // 모든 씬에 대해 병렬로 프레임 생성
    const framePromises = Array.from({ length: sceneCount }, async (_, i) => {
      // 해당 씬의 firstFramePrompt 가져오기
      const scene = hasMultiScene ? scenes[i] : null
      const framePrompt = scene?.firstFramePrompt || selectedScenario.firstFramePrompt || ''

      // 프레임 생성
      const imageUrl = await generateSceneFrame(i, framePrompt, avatarImageUrl)

      if (imageUrl) {
        updateSceneKeyframe(i, { status: 'completed', imageUrl })
        // 첫 씬은 Legacy startFrameUrl에도 저장
        if (i === 0) {
          setStartFrameUrl(imageUrl)
        }
        return { index: i, success: true, imageUrl }
      } else {
        updateSceneKeyframe(i, { status: 'failed', error: '프레임 생성 실패' })
        return { index: i, success: false }
      }
    })

    // 모든 프레임 생성 완료 대기
    await Promise.all(framePromises)

    setIsGeneratingFrames(false)
  }, [selectedScenario, sceneCount, setIsGeneratingFrames, setSceneKeyframes, updateSceneKeyframe, setStartFrameUrl, generateSceneFrame])

  // 전체 생성 프로세스 시작
  const startGeneration = useCallback(async () => {
    setErrorMessage(null)

    try {
      if (needsAiAvatar && !selectedAiAvatarUrl) {
        // AI 아바타 생성 필요
        setGenerationPhase('avatar')
        const avatarRequestId = await generateAvatar()

        // 아바타 생성 완료 대기
        let avatarCompleted = false
        let avatarImageUrl: string | null = null
        while (!avatarCompleted) {
          await new Promise(resolve => setTimeout(resolve, 3000))
          const status = await pollAvatarStatus(avatarRequestId)
          if (status?.status === 'COMPLETED' && status.resultUrl) {
            avatarImageUrl = status.resultUrl
            avatarCompleted = true
            updateAvatarOption(0, { status: 'completed', imageUrl: status.resultUrl })
            selectAiAvatar(0, status.resultUrl, generatedAvatarOptions[0]?.description || '')
            setIsGeneratingAvatars(false)
          } else if (status?.status === 'FAILED') {
            throw new Error('아바타 생성에 실패했습니다')
          }
        }

        // 모든 씬 프레임 생성
        setGenerationPhase('frames')
        await generateAllSceneFrames(avatarImageUrl || undefined)

        setGenerationPhase('done')
      } else {
        // 아바타 이미 있음 - 프레임만 생성
        setGenerationPhase('frames')
        await generateAllSceneFrames(needsAiAvatar ? selectedAiAvatarUrl || undefined : selectedAvatarInfo?.imageUrl)

        setGenerationPhase('done')
      }
    } catch (error) {
      console.error('생성 오류:', error)
      setErrorMessage(error instanceof Error ? error.message : '생성에 실패했습니다. 다시 시도해주세요.')
      setGenerationPhase('error')
      setIsGeneratingAvatars(false)
      setIsGeneratingFrames(false)
    }
  }, [needsAiAvatar, selectedAiAvatarUrl, selectedAvatarInfo, generatedAvatarOptions, generateAvatar, generateAllSceneFrames, pollAvatarStatus, updateAvatarOption, selectAiAvatar, setIsGeneratingAvatars, setIsGeneratingFrames])

  // Step 5 진입 시 자동으로 생성 시작 (한 번만)
  useEffect(() => {
    if (allFramesCompleted || generationStartedRef.current) {
      return
    }
    generationStartedRef.current = true
    startGeneration()
  }, [])

  // 에러 발생 시 ref 리셋
  useEffect(() => {
    if (generationPhase === 'error') {
      generationStartedRef.current = false
    }
  }, [generationPhase])

  // 프레임 생성 완료 시 DB 저장
  useEffect(() => {
    if (generationPhase === 'done' && allFramesCompleted && draftId) {
      saveDraft({
        status: 'FRAME_COMPLETED',
        sceneKeyframes,
        startFrameUrl: sceneKeyframes[0]?.imageUrl || null,
      })
    }
  }, [generationPhase, allFramesCompleted, sceneKeyframes, draftId, saveDraft])

  // 다시 생성
  const handleRetry = () => {
    setGenerationPhase('idle')
    setErrorMessage(null)
    setSceneKeyframes([])
    setStartFrameUrl(null)
    resetAiAvatars()
    generationStartedRef.current = false
    setTimeout(() => {
      generationStartedRef.current = true
      startGeneration()
    }, 0)
  }

  // 영상 생성 단계로 이동
  const handleGoToVideoGeneration = async () => {
    if (!canProceedToStep6()) return
    await saveDraft({
      wizardStep: 6,
      status: 'GENERATING_VIDEO',
    })
    goToNextStep()
  }

  // 단일 프레임 재생성 (이전 이미지 참조)
  const regenerateSingleFrame = useCallback(async (sceneIndex: number, additionalInstruction: string) => {
    if (!selectedScenario) return

    setIsRegenerating(true)
    updateSceneKeyframe(sceneIndex, { status: 'generating' })

    try {
      const scene = selectedScenario.scenes?.[sceneIndex]
      let framePrompt = scene?.firstFramePrompt || selectedScenario.firstFramePrompt || ''

      // 사용자 추가 지시사항 추가
      if (additionalInstruction.trim()) {
        framePrompt = `${framePrompt}\n\n사용자 수정 요청: ${additionalInstruction}`
      }
      if (additionalPrompt) {
        framePrompt = `${framePrompt}\n\n추가 지시: ${additionalPrompt}`
      }

      // 기존 이미지를 참조하여 수정 생성 (reference_image 활용)
      const existingImageUrl = sceneKeyframes[sceneIndex]?.imageUrl

      const response = await fetch('/api/avatar-motion/generate-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarImageUrl: needsAiAvatar ? selectedAiAvatarUrl : selectedAvatarInfo?.imageUrl,
          avatarDescription: needsAiAvatar ? selectedAiAvatarDescription : '',
          productImageUrl: selectedProduct?.rembg_image_url || selectedProduct?.image_url,
          productInfo: selectedProduct
            ? `${selectedProduct.name}: ${selectedProduct.description || ''}`
            : '',
          startFramePrompt: framePrompt,
          aspectRatio,
          imageSize,
          locationPrompt: scene?.location || selectedScenario?.location || '',
          referenceImageUrl: existingImageUrl, // 기존 이미지를 참조로 전달
          isRegeneration: true,
        }),
      })

      if (!response.ok) {
        throw new Error('프레임 재생성 실패')
      }

      const data = await response.json()

      if (data.startFrame.status === 'completed' && data.startFrame.imageUrl) {
        updateSceneKeyframe(sceneIndex, { status: 'completed', imageUrl: data.startFrame.imageUrl })
        if (sceneIndex === 0) {
          setStartFrameUrl(data.startFrame.imageUrl)
        }
      } else {
        throw new Error('프레임 이미지를 받지 못했습니다')
      }
    } catch (error) {
      console.error('프레임 재생성 오류:', error)
      updateSceneKeyframe(sceneIndex, { status: 'failed', error: '재생성 실패' })
    } finally {
      setIsRegenerating(false)
      setShowRegenerateModal(false)
      setRegeneratingSceneIndex(null)
      setRegeneratePrompt('')
    }
  }, [selectedScenario, sceneKeyframes, selectedAvatarInfo, selectedProduct, selectedAiAvatarUrl, selectedAiAvatarDescription, aspectRatio, imageSize, additionalPrompt, needsAiAvatar, updateSceneKeyframe, setStartFrameUrl])

  // 프레임 재생성 모달 열기
  const handleOpenRegenerateModal = (sceneIndex: number) => {
    setRegeneratingSceneIndex(sceneIndex)
    setRegeneratePrompt('')
    setShowRegenerateModal(true)
  }

  // 프레임 재생성 요청
  const handleRegenerateSubmit = () => {
    if (regeneratingSceneIndex === null) return
    regenerateSingleFrame(regeneratingSceneIndex, regeneratePrompt)
  }

  // 생성 중 상태 표시
  const getPhaseText = () => {
    switch (generationPhase) {
      case 'avatar':
        return { title: 'AI 아바타 생성 중', description: '시나리오에 맞는 아바타를 만들고 있어요' }
      case 'frames':
        return {
          title: '씬 이미지를 생성하고 있어요',
          description: '각 장면의 이미지를 만들고 있어요'
        }
      default:
        return { title: '준비 중', description: '' }
    }
  }

  // 시나리오가 없는 경우
  if (!selectedScenario) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-red-500/30 rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">시나리오가 선택되지 않았습니다</h3>
            <p className="text-muted-foreground mt-2">이전 단계로 돌아가 시나리오를 선택해주세요.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={goToPrevStep}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </button>
        </div>
      </div>
    )
  }

  // 생성 중 UI
  if (generationPhase !== 'done' && generationPhase !== 'error' && !allFramesCompleted) {
    const phaseText = getPhaseText()
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              {/* 진행 단계 표시 */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                <div className={`w-2 h-2 rounded-full transition-colors ${generationPhase === 'avatar' || generationPhase === 'frames' ? 'bg-primary' : 'bg-secondary'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${generationPhase === 'frames' ? 'bg-primary' : 'bg-secondary'}`} />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-8">{phaseText.title}</h3>
            <p className="text-muted-foreground mt-2">{phaseText.description}</p>

            {/* 씬별 진행 상태 */}
            {generationPhase === 'frames' && (
              <div className="mt-6 w-full max-w-xs">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>씬 프레임 생성</span>
                  <span>{sceneKeyframes.filter(kf => kf.status === 'completed').length}/{sceneCount}</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: sceneCount }, (_, i) => {
                    const kf = sceneKeyframes[i]
                    let bgColor = 'bg-secondary'
                    if (kf?.status === 'completed') bgColor = 'bg-green-500'
                    else if (kf?.status === 'generating') bgColor = 'bg-primary animate-pulse'
                    else if (kf?.status === 'failed') bgColor = 'bg-red-500'
                    return (
                      <div
                        key={i}
                        className={`flex-1 h-2 rounded ${bgColor} transition-colors`}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* 시나리오 정보 표시 */}
            <div className="mt-8 w-full space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-2">생성 중인 시나리오</p>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Film className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-medium">{selectedScenario.title}</span>
                </div>
                <p className="text-xs text-foreground">{selectedScenario.description}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 px-2 py-1 bg-secondary rounded">
                  <Layers className="w-3 h-3" />
                  {sceneCount}개 씬
                </span>
                <span className="flex items-center gap-1 px-2 py-1 bg-secondary rounded">
                  <Clock className="w-3 h-3" />
                  총 {getTotalDuration()}초
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              이 과정은 {sceneCount * 30}초 ~ {sceneCount * 60}초 정도 소요됩니다
            </p>
          </div>
        </div>

        {/* 이전 버튼 */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={goToPrevStep}
            disabled={isGeneratingAvatars || isGeneratingFrames}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </button>
        </div>
      </div>
    )
  }

  // 에러 UI
  if (generationPhase === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-red-500/30 rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mt-6">프레임 생성에 실패했습니다</h3>
            <p className="text-muted-foreground mt-2">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={goToPrevStep}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </button>
        </div>
      </div>
    )
  }

  // 프레임 생성 완료 - 결과 UI
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <h3 className="font-medium text-foreground">모든 씬 프레임 생성 완료</h3>
          <span className="text-sm text-muted-foreground">({sceneKeyframes.filter(kf => kf.status === 'completed').length}/{sceneCount}개)</span>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 생성
        </button>
      </div>

      {/* 씬별 프레임 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sceneKeyframes.map((kf, i) => {
          const scene = selectedScenario.scenes?.[i]
          const isThisRegenerating = isRegenerating && regeneratingSceneIndex === i
          return (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* 프레임 이미지 */}
              <div className={`relative ${aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'}`}>
                {isThisRegenerating ? (
                  <div className="w-full h-full bg-secondary flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground mt-2">재생성 중...</span>
                  </div>
                ) : kf.imageUrl ? (
                  <img
                    src={kf.imageUrl}
                    alt={`씬 ${i + 1} 프레임`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs font-medium">
                  씬 {i + 1}
                </div>
                {kf.status === 'completed' && !isThisRegenerating && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* 씬 정보 */}
              <div className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  <span>{sceneDurations[i] || 5}초</span>
                  {scene?.mood && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{scene.mood}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-foreground line-clamp-2 mb-2">
                  {scene?.description || scene?.title || `씬 ${i + 1}`}
                </p>
                {/* 재생성 버튼 */}
                <button
                  onClick={() => handleOpenRegenerateModal(i)}
                  disabled={isRegenerating}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded border border-border transition-colors disabled:opacity-50"
                >
                  <RotateCw className="w-3 h-3" />
                  재생성
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 시나리오 정보 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">{selectedScenario.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{selectedScenario.description}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              {needsAiAvatar && selectedAiAvatarUrl && (
                <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-600 rounded">
                  <User className="w-3 h-3" />
                  AI 아바타
                </span>
              )}
              <span className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {selectedScenario.scenes?.[0]?.location || selectedScenario.location}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                {selectedScenario.mood}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-muted-foreground">
                <Package className="w-3 h-3" />
                {selectedScenario.productAppearance?.slice(0, 20)}...
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 영상 설정 요약 */}
      <div className="p-4 bg-secondary/30 rounded-xl">
        <div className="text-xs text-muted-foreground mb-2">영상 설정</div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-foreground">
            <Monitor className="w-4 h-4 text-primary" />
            {aspectRatio === '9:16' ? '세로 (9:16)' : aspectRatio === '16:9' ? '가로 (16:9)' : '정사각 (1:1)'}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Layers className="w-4 h-4 text-primary" />
            {sceneCount}개 씬
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            총 {getTotalDuration()}초
          </span>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={goToPrevStep}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          이전
        </button>
        <button
          onClick={handleGoToVideoGeneration}
          disabled={!canProceedToStep6() || isRegenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          영상 생성
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 프레임 재생성 모달 */}
      {showRegenerateModal && regeneratingSceneIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <RotateCw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">씬 {regeneratingSceneIndex + 1} 프레임 재생성</h3>
                  <p className="text-sm text-muted-foreground">수정하고 싶은 점을 입력하면 기존 이미지를 참조하여 재생성합니다</p>
                </div>
              </div>

              {/* 현재 이미지 미리보기 */}
              {sceneKeyframes[regeneratingSceneIndex]?.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={sceneKeyframes[regeneratingSceneIndex].imageUrl!}
                    alt={`현재 씬 ${regeneratingSceneIndex + 1}`}
                    className="w-full h-auto max-h-48 object-contain bg-secondary"
                  />
                </div>
              )}

              <textarea
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                placeholder="예: 배경을 더 밝게, 제품을 더 크게, 아바타 표정을 더 밝게..."
                rows={3}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRegenerateModal(false)
                    setRegeneratingSceneIndex(null)
                    setRegeneratePrompt('')
                  }}
                  className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRegenerateSubmit}
                  disabled={isRegenerating}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      재생성 중...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-4 h-4" />
                      재생성
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
