'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Play,
  Square,
  Loader2,
  RefreshCw,
  Sparkles,
  Clock,
  Image,
  Film,
  Check,
  AlertCircle,
  Download,
  ExternalLink,
  User,
  CheckCircle,
} from 'lucide-react'
import { useAvatarMotionWizard, AspectRatio, GeneratedAvatarOption } from './wizard-context'
import { buildVideoGenerationPrompt } from '@/lib/prompts/avatar-motion'

// 비율 옵션
const ASPECT_RATIO_OPTIONS: { ratio: AspectRatio; label: string; icon: string }[] = [
  { ratio: '9:16', label: '세로', icon: '📱' },
  { ratio: '16:9', label: '가로', icon: '🖥️' },
  { ratio: '1:1', label: '정방형', icon: '⬜' },
]

// 길이 옵션 (초)
const DURATION_OPTIONS = [
  { seconds: 4, label: '4초', description: '빠른 생성' },
  { seconds: 8, label: '8초', description: '기본' },
  { seconds: 12, label: '12초', description: '상세 모션' },
]

// 생성 단계
type GenerationPhase = 'idle' | 'avatar' | 'start-frame' | 'end-frame' | 'done' | 'error'

export function WizardStep4() {
  const router = useRouter()
  const {
    storyInfo,
    selectedProduct,
    selectedAvatarInfo,
    aspectRatio,
    setAspectRatio,
    duration,
    setDuration,
    isGeneratingFrames,
    setIsGeneratingFrames,
    startFrameUrl,
    setStartFrameUrl,
    endFrameUrl,
    setEndFrameUrl,
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
    // 영상 생성 상태
    isGeneratingVideo,
    setIsGeneratingVideo,
    generationProgress,
    setGenerationProgress,
    resultVideoUrl,
    setResultVideoUrl,
    canGenerateVideo,
    goToPrevStep,
    // DB 연동
    saveDraft,
    draftId,
  } = useAvatarMotionWizard()

  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle')
  const [startFrameRequestId, setStartFrameRequestId] = useState<string | null>(null)
  const [endFrameRequestId, setEndFrameRequestId] = useState<string | null>(null)
  const [videoRequestId, setVideoRequestId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 중복 생성 방지를 위한 ref
  const generationStartedRef = useRef(false)

  // AI 아바타가 필요한지 확인
  const needsAiAvatar = selectedAvatarInfo?.type === 'ai-generated'

  // 프레임이 완성되었는지 확인
  const framesCompleted = !!startFrameUrl && !!endFrameUrl

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

  // 프레임 상태 폴링
  const pollFrameStatus = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/avatar-motion/status/${encodeURIComponent(requestId)}?type=frame`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('프레임 상태 조회 오류:', error)
      return null
    }
  }, [])

  // AI 아바타 생성
  const generateAvatar = useCallback(async () => {
    setIsGeneratingAvatars(true)
    resetAiAvatars()

    try {
      const response = await fetch('/api/avatar-motion/generate-avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: 'female',
          ageRange: '20s-30s',
          style: 'casual, friendly, approachable influencer',
          ethnicity: 'East Asian',
          productInfo: selectedProduct
            ? `${selectedProduct.name}: ${selectedProduct.description || 'A consumer product'}`
            : 'A general consumer product',
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
  }, [selectedProduct, setIsGeneratingAvatars, resetAiAvatars, setGeneratedAvatarOptions])

  // 프레임 생성
  const generateFrames = useCallback(async (avatarImageUrl: string | undefined) => {
    if (!storyInfo) return

    setIsGeneratingFrames(true)
    setStartFrameUrl(null)
    setEndFrameUrl(null)

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
          endFramePrompt: storyInfo.endFrame.description,
          aspectRatio,
        }),
      })

      if (!response.ok) {
        throw new Error('프레임 생성 요청 실패')
      }

      const data = await response.json()
      setStartFrameRequestId(data.startFrame.requestId)
      setEndFrameRequestId(data.endFrame.requestId)

      // API가 시작 프레임을 순차적으로 생성하고 완료 후 반환하므로
      // 시작 프레임 imageUrl이 있으면 바로 설정
      const startFrameAlreadyCompleted = data.startFrame.status === 'completed' && data.startFrame.imageUrl

      return {
        startRequestId: data.startFrame.requestId,
        endRequestId: data.endFrame.requestId,
        startFrameImageUrl: startFrameAlreadyCompleted ? data.startFrame.imageUrl : null,
      }
    } catch (error) {
      console.error('프레임 생성 오류:', error)
      throw error
    }
  }, [storyInfo, selectedAvatarInfo, selectedProduct, aspectRatio, needsAiAvatar, selectedAiAvatarDescription, setIsGeneratingFrames, setStartFrameUrl, setEndFrameUrl])

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

        // 프레임 생성 시작 (API에서 시작 프레임 완료 후 반환)
        setGenerationPhase('start-frame')
        const frameIds = await generateFrames(avatarImageUrl || undefined)

        if (!frameIds) throw new Error('프레임 생성 요청 실패')

        // 시작 프레임이 이미 완료된 경우 (API에서 순차 생성)
        if (frameIds.startFrameImageUrl) {
          setStartFrameUrl(frameIds.startFrameImageUrl)
        } else {
          // 시작 프레임 완료 대기 (폴백)
          let startFrameCompleted = false
          while (!startFrameCompleted) {
            await new Promise(resolve => setTimeout(resolve, 3000))
            const status = await pollFrameStatus(frameIds.startRequestId)
            if (status?.status === 'COMPLETED' && status.resultUrl) {
              setStartFrameUrl(status.resultUrl)
              startFrameCompleted = true
            } else if (status?.status === 'FAILED') {
              throw new Error('시작 프레임 생성에 실패했습니다')
            }
          }
        }

        // 끝 프레임 완료 대기 (끝 프레임은 아직 생성 중)
        setGenerationPhase('end-frame')
        let endFrameCompleted = false
        while (!endFrameCompleted) {
          await new Promise(resolve => setTimeout(resolve, 3000))
          const status = await pollFrameStatus(frameIds.endRequestId)
          if (status?.status === 'COMPLETED' && status.resultUrl) {
            setEndFrameUrl(status.resultUrl)
            endFrameCompleted = true
          } else if (status?.status === 'FAILED') {
            throw new Error('끝 프레임 생성에 실패했습니다')
          }
        }

        setIsGeneratingFrames(false)
        setGenerationPhase('done')

        // 프레임 생성 완료 시 DB 저장
        // 이 시점에서 startFrameUrl, endFrameUrl이 아직 로컬 변수로만 존재하므로
        // 별도로 저장 필요
      } else {
        // 아바타 이미 있음 - 프레임만 생성 (API에서 시작 프레임 완료 후 반환)
        setGenerationPhase('start-frame')
        const frameIds = await generateFrames(needsAiAvatar ? selectedAiAvatarUrl || undefined : selectedAvatarInfo?.imageUrl)

        if (!frameIds) throw new Error('프레임 생성 요청 실패')

        // 시작 프레임이 이미 완료된 경우 (API에서 순차 생성)
        if (frameIds.startFrameImageUrl) {
          setStartFrameUrl(frameIds.startFrameImageUrl)
        } else {
          // 시작 프레임 완료 대기 (폴백)
          let startFrameCompleted = false
          while (!startFrameCompleted) {
            await new Promise(resolve => setTimeout(resolve, 3000))
            const status = await pollFrameStatus(frameIds.startRequestId)
            if (status?.status === 'COMPLETED' && status.resultUrl) {
              setStartFrameUrl(status.resultUrl)
              startFrameCompleted = true
            } else if (status?.status === 'FAILED') {
              throw new Error('시작 프레임 생성에 실패했습니다')
            }
          }
        }

        // 끝 프레임 완료 대기 (끝 프레임은 아직 생성 중)
        setGenerationPhase('end-frame')
        let endFrameCompleted = false
        while (!endFrameCompleted) {
          await new Promise(resolve => setTimeout(resolve, 3000))
          const status = await pollFrameStatus(frameIds.endRequestId)
          if (status?.status === 'COMPLETED' && status.resultUrl) {
            setEndFrameUrl(status.resultUrl)
            endFrameCompleted = true
          } else if (status?.status === 'FAILED') {
            throw new Error('끝 프레임 생성에 실패했습니다')
          }
        }

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
  }, [needsAiAvatar, selectedAiAvatarUrl, selectedAvatarInfo, generatedAvatarOptions, generateAvatar, generateFrames, pollAvatarStatus, pollFrameStatus, updateAvatarOption, selectAiAvatar, setIsGeneratingAvatars, setIsGeneratingFrames, setStartFrameUrl, setEndFrameUrl])

  // Step 4 진입 시 자동으로 생성 시작 (한 번만)
  useEffect(() => {
    // 이미 프레임이 완료되었거나, 생성이 시작된 경우 스킵
    if (framesCompleted || generationStartedRef.current) {
      return
    }

    // 생성 시작 표시
    generationStartedRef.current = true
    startGeneration()
  }, []) // 의존성 배열을 비워서 마운트 시 한 번만 실행

  // 에러 발생 시 ref 리셋 (다시 시도 가능하도록)
  useEffect(() => {
    if (generationPhase === 'error') {
      generationStartedRef.current = false
    }
  }, [generationPhase])

  // 프레임 생성 완료 시 DB 저장
  useEffect(() => {
    if (generationPhase === 'done' && startFrameUrl && endFrameUrl && draftId) {
      saveDraft({
        status: 'FRAMES_COMPLETED',
        startFrameUrl,
        endFrameUrl,
      })
    }
  }, [generationPhase, startFrameUrl, endFrameUrl, draftId, saveDraft])

  // 영상 생성
  const handleGenerateVideo = async () => {
    if (!startFrameUrl || !endFrameUrl || !storyInfo) return

    setIsGeneratingVideo(true)
    setGenerationProgress(0)
    setErrorMessage(null)

    try {
      // 영어 영상 프롬프트 생성
      const videoPrompt = buildVideoGenerationPrompt({
        motionPromptEN: storyInfo.motionPromptEN,
        startFrameDescription: storyInfo.startFrame.description,
        endFrameDescription: storyInfo.endFrame.description,
        mood: storyInfo.mood,
        action: storyInfo.action,
        productName: selectedProduct?.name,
        productDescription: selectedProduct?.description || undefined,
        duration,
      })

      console.log('영상 생성 프롬프트:', videoPrompt)

      const response = await fetch('/api/avatar-motion/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startFrameUrl,
          endFrameUrl,
          prompt: videoPrompt,
          aspectRatio,
          duration,
          generateAudio: false,
        }),
      })

      if (!response.ok) {
        throw new Error('영상 생성 요청 실패')
      }

      const data = await response.json()
      setVideoRequestId(data.requestId)

      // 영상 생성 시작 시 DB 저장
      if (draftId) {
        saveDraft({
          status: 'IN_QUEUE',
          videoRequestId: data.requestId,
        })
      }
    } catch (error) {
      console.error('영상 생성 오류:', error)
      setErrorMessage('영상 생성에 실패했습니다. 다시 시도해주세요.')
      setIsGeneratingVideo(false)
    }
  }

  // 영상 생성 폴링
  useEffect(() => {
    if (!videoRequestId || !isGeneratingVideo) return

    const startTime = Date.now()
    const estimatedTime = duration * 15000

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/avatar-motion/status/${encodeURIComponent(videoRequestId)}?type=video`)
        if (!response.ok) return

        const data = await response.json()

        if (data.status === 'COMPLETED' && data.resultUrl) {
          setResultVideoUrl(data.resultUrl)
          setGenerationProgress(100)
          setIsGeneratingVideo(false)
          clearInterval(pollInterval)

          // 영상 생성 완료 시 DB 저장
          if (draftId) {
            saveDraft({
              status: 'COMPLETED',
              videoUrl: data.resultUrl,
            })
          }
        } else if (data.status === 'FAILED') {
          setErrorMessage(data.errorMessage || '영상 생성 실패')
          setIsGeneratingVideo(false)
          clearInterval(pollInterval)
        } else {
          const elapsed = Date.now() - startTime
          const progress = Math.min((elapsed / estimatedTime) * 95, 95)
          setGenerationProgress(progress)
        }
      } catch (error) {
        console.error('영상 상태 조회 오류:', error)
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [videoRequestId, isGeneratingVideo, duration, setResultVideoUrl, setGenerationProgress, setIsGeneratingVideo])

  // 다시 생성
  const handleRetry = () => {
    setGenerationPhase('idle')
    setErrorMessage(null)
    setStartFrameUrl(null)
    setEndFrameUrl(null)
    resetAiAvatars()
    // ref 리셋 후 수동으로 재시작
    generationStartedRef.current = false
    // 다음 틱에서 생성 시작
    setTimeout(() => {
      generationStartedRef.current = true
      startGeneration()
    }, 0)
  }

  // 크레딧 계산
  const calculateCredits = () => {
    if (duration <= 4) return 50
    if (duration <= 8) return 60
    return 75
  }

  // 생성 중 상태 표시
  const getPhaseText = () => {
    switch (generationPhase) {
      case 'avatar':
        return { title: 'AI 아바타 생성 중', description: '제품에 맞는 아바타를 만들고 있어요' }
      case 'start-frame':
        return { title: '시작 프레임 생성 중', description: '영상의 첫 장면을 만들고 있어요' }
      case 'end-frame':
        return { title: '끝 프레임 생성 중', description: '영상의 마지막 장면을 만들고 있어요' }
      default:
        return { title: '준비 중', description: '' }
    }
  }

  // 생성 중 UI
  if (generationPhase !== 'done' && generationPhase !== 'error' && !framesCompleted) {
    const phaseText = getPhaseText()
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              {/* 진행 단계 표시 */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                <div className={`w-2 h-2 rounded-full transition-colors ${generationPhase === 'avatar' || generationPhase === 'start-frame' || generationPhase === 'end-frame' ? 'bg-primary' : 'bg-secondary'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${generationPhase === 'start-frame' || generationPhase === 'end-frame' ? 'bg-primary' : 'bg-secondary'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${generationPhase === 'end-frame' ? 'bg-primary' : 'bg-secondary'}`} />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-8">{phaseText.title}</h3>
            <p className="text-muted-foreground mt-2">{phaseText.description}</p>

            {/* 스토리보드 미리보기 */}
            <div className="mt-8 w-full p-4 bg-secondary/30 rounded-xl">
              <p className="text-xs text-muted-foreground text-center mb-3">생성 중인 스토리보드</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 p-2 bg-card rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Play className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] text-muted-foreground">시작</span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">{storyInfo?.startFrame.description}</p>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex-1 p-2 bg-card rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Square className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] text-muted-foreground">끝</span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">{storyInfo?.endFrame.description}</p>
                </div>
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

        {/* 이전 버튼 */}
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
      {/* 프레임 결과 표시 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-foreground">생성된 프레임</h3>
          </div>
          <button
            onClick={handleRetry}
            disabled={isGeneratingVideo}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            다시 생성
          </button>
        </div>

        {/* AI 아바타 정보 (있는 경우) */}
        {needsAiAvatar && selectedAiAvatarUrl && (
          <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
            <div className="w-12 h-14 rounded-lg overflow-hidden border border-purple-500">
              <img
                src={selectedAiAvatarUrl}
                alt="AI 아바타"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-purple-500 font-medium">AI 아바타</span>
              </div>
              <p className="text-sm text-foreground mt-0.5">{selectedAiAvatarDescription}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* 시작 프레임 */}
          <div>
            <div className="aspect-[9/16] rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent z-10" />
              <img
                src={startFrameUrl || ''}
                alt="시작 프레임"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/80 rounded text-white text-xs font-medium z-20">
                시작
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">생성 완료</span>
            </div>
          </div>

          {/* 끝 프레임 */}
          <div>
            <div className="aspect-[9/16] rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent z-10" />
              <img
                src={endFrameUrl || ''}
                alt="끝 프레임"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/80 rounded text-white text-xs font-medium z-20">
                끝
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">생성 완료</span>
            </div>
          </div>
        </div>
      </div>

      {/* 영상 설정 */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">영상 설정</h3>
        </div>

        {/* 비율 표시 (변경 불가) */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">영상 비율</label>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <div
                key={option.ratio}
                className={`p-3 rounded-lg border text-center ${
                  aspectRatio === option.ratio
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground opacity-50'
                }`}
              >
                <span className="text-xl block mb-1">{option.icon}</span>
                <span className="text-xs">{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 길이 선택 */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            영상 길이
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.seconds}
                onClick={() => setDuration(option.seconds)}
                disabled={isGeneratingVideo}
                className={`p-3 rounded-lg border text-center transition-all ${
                  duration === option.seconds
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                } ${isGeneratingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-medium block">{option.label}</span>
                <span className="text-xs opacity-70">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 가격 및 생성 버튼 */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">예상 크레딧</p>
            <p className="text-2xl font-bold text-primary">{calculateCredits()} 크레딧</p>
          </div>
        </div>

        {/* 생성 중 상태 */}
        {isGeneratingVideo && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">영상 생성 중...</span>
              <span className="text-sm text-primary">{Math.round(generationProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              영상 길이에 따라 1-3분 정도 소요됩니다
            </p>
          </div>
        )}

        {/* 결과 영상 */}
        {resultVideoUrl && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-green-500">
                <Check className="w-5 h-5" />
                <span className="font-medium">영상 생성 완료!</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resultVideoUrl}
                  download
                  className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                  title="다운로드"
                >
                  <Download className="w-4 h-4 text-foreground" />
                </a>
                <a
                  href={resultVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                  title="새 탭에서 열기"
                >
                  <ExternalLink className="w-4 h-4 text-foreground" />
                </a>
              </div>
            </div>
            <video
              src={resultVideoUrl}
              controls
              autoPlay
              loop
              className="w-full rounded-lg"
            />
          </div>
        )}

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{errorMessage}</p>
          </div>
        )}

        {/* 영상 생성 버튼 (아직 생성 안 됐을 때만) */}
        {!resultVideoUrl && (
          <button
            onClick={handleGenerateVideo}
            disabled={!canGenerateVideo() || isGeneratingVideo}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              canGenerateVideo() && !isGeneratingVideo
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isGeneratingVideo ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                영상 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                영상 생성하기
              </>
            )}
          </button>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        {resultVideoUrl ? (
          // 영상 생성 완료: 완료 버튼
          <button
            onClick={() => {
              if (draftId) {
                router.push(`/dashboard/video-ad/${draftId}`)
              } else {
                router.push('/dashboard/video-ad')
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            완료
          </button>
        ) : (
          // 영상 생성 전: 이전 버튼
          <button
            onClick={goToPrevStep}
            disabled={isGeneratingVideo}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </button>
        )}
      </div>
    </div>
  )
}
