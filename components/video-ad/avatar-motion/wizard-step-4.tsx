'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Loader2,
  RefreshCw,
  Sparkles,
  Clock,
  Image,
  Film,
  AlertCircle,
  User,
  Lightbulb,
  MapPin,
  Check,
} from 'lucide-react'
import { useAvatarMotionWizard, AspectRatio, ImageSize } from './wizard-context'

// 이미지 크기 옵션 (영상 크기 결정)
const IMAGE_SIZE_OPTIONS: { size: ImageSize; ratio: AspectRatio; label: string; description: string }[] = [
  { size: '576x1024', ratio: '9:16', label: '세로 (9:16)', description: '릴스, 숏츠, TikTok' },
  { size: '1024x576', ratio: '16:9', label: '가로 (16:9)', description: '유튜브, 가로 영상' },
  { size: '768x768', ratio: '1:1', label: '정방형 (1:1)', description: '인스타그램 피드' },
]

// 길이 옵션 (초) - kling-2.6은 5초 또는 10초
const DURATION_OPTIONS = [
  { seconds: 5, label: '5초', description: '짧은 모션' },
  { seconds: 10, label: '10초', description: '풀 모션' },
]

// 생성 단계
type GenerationPhase = 'idle' | 'avatar' | 'frame' | 'done' | 'error'

export function WizardStep4() {
  const {
    storyInfo,
    selectedProduct,
    selectedAvatarInfo,
    locationPrompt,
    aspectRatio,
    setAspectRatio,
    imageSize,
    setImageSize,
    duration,
    setDuration,
    isGeneratingFrames,
    setIsGeneratingFrames,
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
    canProceedToStep5,
    goToNextStep,
    goToPrevStep,
    // DB 연동
    saveDraft,
    draftId,
  } = useAvatarMotionWizard()

  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 중복 생성 방지를 위한 ref
  const generationStartedRef = useRef(false)

  // AI 아바타가 필요한지 확인
  const needsAiAvatar = selectedAvatarInfo?.type === 'ai-generated'

  // 프레임이 완성되었는지 확인
  const frameCompleted = !!startFrameUrl

  // 이미지 크기 변경 시 비율도 업데이트
  const handleImageSizeChange = (newSize: ImageSize) => {
    setImageSize(newSize)
    const option = IMAGE_SIZE_OPTIONS.find(opt => opt.size === newSize)
    if (option) {
      setAspectRatio(option.ratio)
    }
  }

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

  // AI 아바타 생성 (영상 컨텍스트 기반)
  const generateAvatar = useCallback(async () => {
    setIsGeneratingAvatars(true)
    resetAiAvatars()

    try {
      const response = await fetch('/api/avatar-motion/generate-avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct?.name || '',
          productDescription: selectedProduct?.description || '',
          productCategory: '',
          storyInfo: storyInfo ? {
            title: storyInfo.title,
            description: storyInfo.description,
            concept: storyInfo.concept,
            background: storyInfo.background,
            startFrame: storyInfo.startFrame,
            mood: storyInfo.mood,
            action: storyInfo.action,
            motionPromptEN: storyInfo.motionPromptEN,
          } : undefined,
          locationPrompt: locationPrompt || '',
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
  }, [selectedProduct, storyInfo, locationPrompt, setIsGeneratingAvatars, resetAiAvatars, setGeneratedAvatarOptions])

  // 프레임 생성 (첫 프레임만)
  const generateFrame = useCallback(async (avatarImageUrl: string | undefined) => {
    if (!storyInfo) return

    setIsGeneratingFrames(true)
    setStartFrameUrl(null)

    try {
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
          startFramePrompt: storyInfo.startFrame.description,
          aspectRatio,
          imageSize,
          locationPrompt: locationPrompt || '',
        }),
      })

      if (!response.ok) {
        throw new Error('프레임 생성 요청 실패')
      }

      const data = await response.json()

      // API가 첫 프레임 완료 후 반환하므로 바로 설정
      if (data.startFrame.status === 'completed' && data.startFrame.imageUrl) {
        setStartFrameUrl(data.startFrame.imageUrl)
        return data.startFrame.imageUrl
      }

      throw new Error('프레임 생성 실패')
    } catch (error) {
      console.error('프레임 생성 오류:', error)
      throw error
    }
  }, [storyInfo, selectedAvatarInfo, selectedProduct, aspectRatio, imageSize, locationPrompt, needsAiAvatar, selectedAiAvatarDescription, setIsGeneratingFrames, setStartFrameUrl])

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

        // 프레임 생성
        setGenerationPhase('frame')
        await generateFrame(avatarImageUrl || undefined)

        setIsGeneratingFrames(false)
        setGenerationPhase('done')
      } else {
        // 아바타 이미 있음 - 프레임만 생성
        setGenerationPhase('frame')
        await generateFrame(needsAiAvatar ? selectedAiAvatarUrl || undefined : selectedAvatarInfo?.imageUrl)

        setIsGeneratingFrames(false)
        setGenerationPhase('done')
      }
    } catch (error) {
      console.error('생성 오류:', error)
      setErrorMessage(error instanceof Error ? error.message : '생성에 실패했습니다. 다시 시도해주세요.')
      setGenerationPhase('error')
      setIsGeneratingAvatars(false)
      setIsGeneratingFrames(false)
    }
  }, [needsAiAvatar, selectedAiAvatarUrl, selectedAvatarInfo, generatedAvatarOptions, generateAvatar, generateFrame, pollAvatarStatus, updateAvatarOption, selectAiAvatar, setIsGeneratingAvatars, setIsGeneratingFrames])

  // Step 4 진입 시 자동으로 생성 시작 (한 번만)
  useEffect(() => {
    if (frameCompleted || generationStartedRef.current) {
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
    if (generationPhase === 'done' && startFrameUrl && draftId) {
      saveDraft({
        status: 'FRAME_COMPLETED',
        startFrameUrl,
      })
    }
  }, [generationPhase, startFrameUrl, draftId, saveDraft])

  // 다시 생성
  const handleRetry = () => {
    setGenerationPhase('idle')
    setErrorMessage(null)
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
    if (!canProceedToStep5()) return
    await saveDraft({
      wizardStep: 5,
      status: 'GENERATING_VIDEO',
      imageSize,
      duration,
    })
    goToNextStep()
  }

  // 생성 중 상태 표시
  const getPhaseText = () => {
    switch (generationPhase) {
      case 'avatar':
        return { title: 'AI 아바타 생성 중', description: '제품과 스토리에 맞는 아바타를 만들고 있어요' }
      case 'frame':
        return { title: '첫 프레임 생성 중', description: '영상의 첫 장면을 만들고 있어요' }
      default:
        return { title: '준비 중', description: '' }
    }
  }

  // 생성 중 UI
  if (generationPhase !== 'done' && generationPhase !== 'error' && !frameCompleted) {
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
                <div className={`w-2 h-2 rounded-full transition-colors ${generationPhase === 'avatar' || generationPhase === 'frame' ? 'bg-primary' : 'bg-secondary'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${generationPhase === 'frame' ? 'bg-primary' : 'bg-secondary'}`} />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-8">{phaseText.title}</h3>
            <p className="text-muted-foreground mt-2">{phaseText.description}</p>

            {/* 스토리 정보 표시 */}
            <div className="mt-8 w-full space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-2">생성 중인 스토리보드</p>

              {/* 컨셉 */}
              {storyInfo?.concept && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-amber-600 font-medium">컨셉</span>
                  </div>
                  <p className="text-xs text-foreground">{storyInfo.concept}</p>
                </div>
              )}

              {/* 배경 */}
              {storyInfo?.background && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] text-blue-600 font-medium">배경/장소</span>
                  </div>
                  <p className="text-xs text-foreground">{storyInfo.background}</p>
                </div>
              )}

              {/* 첫 프레임 */}
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Play className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] text-green-600 font-medium">첫 프레임</span>
                </div>
                <p className="text-xs text-foreground">{storyInfo?.startFrame.description}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              이 과정은 1-2분 정도 소요됩니다
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

  // 프레임 생성 완료 - 결과 및 영상 설정 UI
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 프레임 결과 + 스토리 정보 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-foreground">첫 프레임 생성 완료</h3>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 생성
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 첫 프레임 이미지 */}
          <div>
            <div className={`rounded-xl overflow-hidden relative ${aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'}`}>
              <img
                src={startFrameUrl || ''}
                alt="첫 프레임"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/80 rounded text-white text-xs font-medium">
                첫 프레임
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">생성 완료</span>
            </div>
          </div>

          {/* 스토리 정보 */}
          <div className="space-y-3">
            {/* AI 아바타 정보 (있는 경우) */}
            {needsAiAvatar && selectedAiAvatarUrl && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3 h-3 text-purple-500" />
                  <span className="text-[10px] text-purple-500 font-medium">AI 아바타</span>
                </div>
                <p className="text-xs text-foreground">{selectedAiAvatarDescription}</p>
              </div>
            )}

            {/* 컨셉 */}
            {storyInfo?.concept && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] text-amber-600 font-medium">컨셉</span>
                </div>
                <p className="text-xs text-foreground line-clamp-2">{storyInfo.concept}</p>
              </div>
            )}

            {/* 배경 */}
            {storyInfo?.background && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] text-blue-600 font-medium">배경/장소</span>
                </div>
                <p className="text-xs text-foreground line-clamp-2">{storyInfo.background}</p>
              </div>
            )}

            {/* 첫 프레임 설명 */}
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <Play className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-600 font-medium">첫 프레임</span>
              </div>
              <p className="text-xs text-foreground line-clamp-3">{storyInfo?.startFrame.description}</p>
            </div>

            {/* 분위기 */}
            {storyInfo?.mood && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">분위기:</span>
                <span className="text-foreground font-medium">{storyInfo.mood}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 영상 설정 */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">영상 설정</h3>
        </div>

        {/* 이미지/영상 크기 선택 */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            <Image className="w-4 h-4 inline mr-1" />
            영상 크기
          </label>
          <div className="grid grid-cols-3 gap-2">
            {IMAGE_SIZE_OPTIONS.map((option) => (
              <button
                key={option.size}
                onClick={() => handleImageSizeChange(option.size)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  imageSize === option.size
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-medium block">{option.label}</span>
                <span className="text-[10px] opacity-70">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 길이 선택 */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            영상 길이
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.seconds}
                onClick={() => setDuration(option.seconds)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  duration === option.seconds
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-medium block">{option.label}</span>
                <span className="text-xs opacity-70">{option.description}</span>
              </button>
            ))}
          </div>
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
          disabled={!canProceedToStep5()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          영상 생성
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
