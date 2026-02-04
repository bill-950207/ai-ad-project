'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCredits } from '@/contexts/credit-context'
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  Download,
  Check,
  Film,
  Clock,
  MapPin,
  Sparkles,
  Package,
  Layers,
  Play,
  Merge,
} from 'lucide-react'
import { useAvatarMotionWizard, SceneVideo } from './wizard-context'

// 생성 상태
type VideoGenerationStatus = 'idle' | 'generating_scenes' | 'scenes_completed' | 'merging' | 'completed' | 'error'

export function WizardStep6Video() {
  const {
    getSelectedScenario,
    sceneKeyframes,
    sceneCount,
    sceneDurations,
    setSceneDurations,
    movementAmplitudes,
    resolution,
    aspectRatio,
    additionalPrompt,
    // 씬별 영상
    sceneVideos,
    setSceneVideos,
    updateSceneVideo,
    isMergingVideos: _isMergingVideos,
    setIsMergingVideos,
    // Legacy
    videoRequestId: _videoRequestId,
    setVideoRequestId: _setVideoRequestId,
    isGeneratingVideo: _isGeneratingVideo,
    setIsGeneratingVideo,
    resultVideoUrl,
    setResultVideoUrl,
    generationProgress,
    setGenerationProgress,
    // Helper
    canMergeVideos: _canMergeVideos,
    getTotalDuration,
    getEstimatedCredits,
    // Navigation
    goToPrevStep,
    saveDraft,
    draftId,
  } = useAvatarMotionWizard()

  const router = useRouter()
  const { refreshCredits } = useCredits()

  const [status, setStatus] = useState<VideoGenerationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [_currentGeneratingScene, _setCurrentGeneratingScene] = useState(0)

  // 완료 버튼 병합 중 상태 (별도 화면 없이 버튼만 로딩)
  const [isCompletingMerge, setIsCompletingMerge] = useState(false)

  // 씬별 재생성 모달 상태
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null)
  const [regeneratePrompt, setRegeneratePrompt] = useState('')
  const [regenerateDuration, setRegenerateDuration] = useState(3)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // 중복 생성 방지
  const generationStartedRef = useRef(false)

  // 선택된 시나리오 가져오기
  const selectedScenario = getSelectedScenario()

  // 완료된 씬 영상 수
  const completedSceneVideos = sceneVideos.filter(sv => sv.status === 'completed' && sv.videoUrl).length

  // 영상 상태 폴링
  const pollVideoStatus = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/avatar-motion/status/${encodeURIComponent(requestId)}?type=video`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('영상 상태 조회 오류:', error)
      return null
    }
  }, [])

  // 단일 씬 영상 생성
  const generateSceneVideo = useCallback(async (
    sceneIndex: number,
    imageUrl: string,
    motionPrompt: string,
    duration: number,
    amplitude: string
  ): Promise<string | null> => {
    try {
      // 추가 프롬프트 적용
      let finalPrompt = motionPrompt
      if (additionalPrompt) {
        finalPrompt = `${motionPrompt}. Additional instructions: ${additionalPrompt}`
      }

      const response = await fetch('/api/avatar-motion/generate-scene-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneIndex,
          imageUrl,
          prompt: finalPrompt,
          duration,
          resolution,
          movementAmplitude: amplitude,
        }),
      })

      if (!response.ok) {
        throw new Error(`씬 ${sceneIndex + 1} 영상 생성 요청 실패`)
      }

      const data = await response.json()
      const requestId = data.requestId

      // 폴링으로 완료 대기
      let videoUrl: string | null = null
      let attempts = 0
      const maxAttempts = 120 // 최대 10분

      while (!videoUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++

        const statusResult = await pollVideoStatus(requestId)

        if (statusResult?.status === 'COMPLETED' && statusResult.resultUrl) {
          videoUrl = statusResult.resultUrl
        } else if (statusResult?.status === 'FAILED' || statusResult?.errorMessage) {
          throw new Error(statusResult?.errorMessage || `씬 ${sceneIndex + 1} 영상 생성 실패`)
        }
      }

      if (!videoUrl) {
        throw new Error(`씬 ${sceneIndex + 1} 영상 생성 시간 초과`)
      }

      return videoUrl
    } catch (error) {
      console.error(`씬 ${sceneIndex + 1} 영상 생성 오류:`, error)
      return null
    }
  }, [additionalPrompt, resolution, pollVideoStatus])

  // 모든 씬 영상 병렬 생성
  const generateAllSceneVideos = useCallback(async () => {
    if (sceneKeyframes.length < sceneCount) {
      setErrorMessage('프레임 이미지가 부족합니다. 이전 단계를 완료해주세요.')
      setStatus('error')
      return
    }

    setStatus('generating_scenes')
    setIsGeneratingVideo(true)
    setErrorMessage(null)
    setGenerationProgress(0)

    // 씬 비디오 초기화 (모두 generating 상태)
    const initialVideos: SceneVideo[] = Array.from({ length: sceneCount }, (_, i) => ({
      sceneIndex: i,
      videoUrl: null,
      requestId: null,
      provider: 'wavespeed',
      status: 'generating',
    }))
    setSceneVideos(initialVideos)

    const scenes = selectedScenario?.scenes || []
    const hasMultiScene = scenes.length > 0

    // 완료된 영상 URL 추적 (state와 별도로)
    const completedVideoUrls: (string | null)[] = new Array(sceneCount).fill(null)
    let completedCount = 0

    // 모든 씬에 대해 병렬로 영상 생성
    const videoPromises = Array.from({ length: sceneCount }, async (_, i) => {
      const keyframe = sceneKeyframes[i]
      if (!keyframe?.imageUrl) {
        updateSceneVideo(i, { status: 'failed', error: '프레임 이미지 없음' })
        return { index: i, success: false }
      }

      // 해당 씬의 모션 프롬프트 가져오기
      const scene = hasMultiScene ? scenes[i] : null
      const motionPrompt = scene?.motionPromptEN || selectedScenario?.motionPromptEN || ''
      const duration = sceneDurations[i] || 5
      const amplitude = movementAmplitudes[i] || 'auto'

      // 영상 생성
      const videoUrl = await generateSceneVideo(i, keyframe.imageUrl, motionPrompt, duration, amplitude)

      if (videoUrl) {
        completedVideoUrls[i] = videoUrl
        completedCount++
        updateSceneVideo(i, { status: 'completed', videoUrl })
        // 진행률 업데이트 (80%까지 씬 생성)
        setGenerationProgress((completedCount / sceneCount) * 80)
        return { index: i, success: true, videoUrl }
      } else {
        updateSceneVideo(i, { status: 'failed', error: '영상 생성 실패' })
        return { index: i, success: false }
      }
    })

    // 모든 영상 생성 완료 대기
    const results = await Promise.all(videoPromises)

    setIsGeneratingVideo(false)

    // 모든 씬 영상이 완료되었는지 확인
    const allCompleted = results.every(r => r.success)
    const validVideoUrls = completedVideoUrls.filter((url): url is string => url !== null)

    if (allCompleted && validVideoUrls.length === sceneCount) {
      // 모든 씬 생성 완료 - 씬별 확인 화면으로 전환 (자동 병합하지 않음)
      setGenerationProgress(80)
      setStatus('scenes_completed')
    } else {
      setStatus('error')
      setErrorMessage('일부 씬 영상 생성에 실패했습니다')
    }
  }, [sceneKeyframes, sceneCount, selectedScenario, sceneDurations, movementAmplitudes, setSceneVideos, updateSceneVideo, setIsGeneratingVideo, setGenerationProgress, generateSceneVideo])

  // 영상 병합 (URL을 직접 전달받는 버전)
  const mergeVideosWithUrls = useCallback(async (videoUrls: string[]) => {
    setStatus('merging')
    setIsMergingVideos(true)
    setGenerationProgress(85)

    try {
      if (videoUrls.length < sceneCount) {
        throw new Error('병합할 영상이 부족합니다')
      }

      const response = await fetch('/api/avatar-motion/merge-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrls }),
      })

      if (!response.ok) {
        throw new Error('영상 병합 요청 실패')
      }

      const data = await response.json()

      if (data.mergedVideoUrl) {
        setResultVideoUrl(data.mergedVideoUrl)
        setGenerationProgress(100)
        setStatus('completed')

        // DB에 완료 상태 저장
        await saveDraft({
          status: 'COMPLETED',
          videoUrl: data.mergedVideoUrl,
        })

        // 크레딧 갱신
        refreshCredits()
      } else {
        throw new Error('병합된 영상 URL이 없습니다')
      }
    } catch (error) {
      console.error('영상 병합 오류:', error)
      setErrorMessage(error instanceof Error ? error.message : '영상 병합에 실패했습니다')
      setStatus('error')
    } finally {
      setIsMergingVideos(false)
    }
  }, [sceneCount, setIsMergingVideos, setResultVideoUrl, setGenerationProgress, saveDraft])

  // 영상 병합 (state에서 URL을 가져오는 기존 버전 - 재시도용)
  const mergeVideos = useCallback(async () => {
    // 완료된 씬 영상 URL 수집
    const videoUrls = sceneVideos
      .filter(sv => sv.status === 'completed' && sv.videoUrl)
      .sort((a, b) => a.sceneIndex - b.sceneIndex)
      .map(sv => sv.videoUrl as string)

    await mergeVideosWithUrls(videoUrls)
  }, [sceneVideos, mergeVideosWithUrls])

  // 씬별 재생성 모달 열기
  const openRegenerateModal = (sceneIndex: number) => {
    const scene = selectedScenario?.scenes?.[sceneIndex]
    setRegeneratingSceneIndex(sceneIndex)
    setRegeneratePrompt('')
    setRegenerateDuration(sceneDurations[sceneIndex] || scene?.duration || 3)
    setShowRegenerateModal(true)
  }

  // 씬별 재생성 실행
  const handleRegenerateScene = async () => {
    if (regeneratingSceneIndex === null) return

    const sceneIndex = regeneratingSceneIndex
    const keyframe = sceneKeyframes[sceneIndex]
    if (!keyframe?.imageUrl) {
      setErrorMessage('프레임 이미지가 없습니다')
      return
    }

    setIsRegenerating(true)
    setShowRegenerateModal(false)
    updateSceneVideo(sceneIndex, { status: 'generating', videoUrl: null })

    try {
      const scenes = selectedScenario?.scenes || []
      const scene = scenes[sceneIndex]
      let motionPrompt = scene?.motionPromptEN || selectedScenario?.motionPromptEN || ''

      // 사용자 추가 프롬프트 적용
      if (regeneratePrompt.trim()) {
        motionPrompt = `${motionPrompt}. Additional: ${regeneratePrompt}`
      }

      const amplitude = movementAmplitudes[sceneIndex] || 'auto'

      // 영상 재생성
      const videoUrl = await generateSceneVideo(
        sceneIndex,
        keyframe.imageUrl,
        motionPrompt,
        regenerateDuration,
        amplitude
      )

      if (videoUrl) {
        updateSceneVideo(sceneIndex, { status: 'completed', videoUrl })
        // 씬 시간 업데이트
        const newDurations = [...sceneDurations]
        newDurations[sceneIndex] = regenerateDuration
        setSceneDurations(newDurations)
      } else {
        updateSceneVideo(sceneIndex, { status: 'failed', error: '재생성 실패' })
      }
    } catch (error) {
      console.error('씬 재생성 오류:', error)
      updateSceneVideo(sceneIndex, { status: 'failed', error: '재생성 실패' })
    } finally {
      setIsRegenerating(false)
      setRegeneratingSceneIndex(null)
      setRegeneratePrompt('')
    }
  }

  // 완료 버튼 핸들러 (씬 확인 후 병합 → 상세 페이지 이동)
  const handleComplete = async () => {
    const videoUrls = sceneVideos
      .filter(sv => sv.status === 'completed' && sv.videoUrl)
      .sort((a, b) => a.sceneIndex - b.sceneIndex)
      .map(sv => sv.videoUrl as string)

    if (videoUrls.length !== sceneCount) {
      setErrorMessage('모든 씬 영상이 완료되지 않았습니다')
      return
    }

    setIsCompletingMerge(true)
    setErrorMessage(null)

    try {
      // 영상 병합 API 호출
      const response = await fetch('/api/avatar-motion/merge-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrls }),
      })

      if (!response.ok) {
        throw new Error('영상 병합 요청 실패')
      }

      const data = await response.json()

      if (data.mergedVideoUrl) {
        // DB에 완료 상태 저장
        await saveDraft({
          status: 'COMPLETED',
          videoUrl: data.mergedVideoUrl,
        })

        // 크레딧 갱신
        refreshCredits()

        // 상세 페이지로 이동
        if (draftId) {
          router.push(`/dashboard/video-ad/${draftId}`)
        }
      } else {
        throw new Error('병합된 영상 URL이 없습니다')
      }
    } catch (error) {
      console.error('영상 병합 오류:', error)
      setErrorMessage(error instanceof Error ? error.message : '영상 병합에 실패했습니다')
      setIsCompletingMerge(false)
    }
  }

  // Step 6 진입 시 자동으로 영상 생성 시작
  useEffect(() => {
    // 이미 완료된 영상이 있으면 스킵
    if (resultVideoUrl) {
      setStatus('completed')
      return
    }

    // 새로 생성 시작
    if (!generationStartedRef.current) {
      generationStartedRef.current = true
      generateAllSceneVideos()
    }
  }, [])

  // 에러 발생 시 ref 리셋
  useEffect(() => {
    if (status === 'error') {
      generationStartedRef.current = false
    }
  }, [status])

  // 다시 생성
  const handleRetry = () => {
    setStatus('idle')
    setErrorMessage(null)
    setResultVideoUrl(null)
    setSceneVideos([])
    generationStartedRef.current = false
    setTimeout(() => {
      generationStartedRef.current = true
      generateAllSceneVideos()
    }, 0)
  }

  // 영상 다운로드
  const handleDownload = async () => {
    if (!resultVideoUrl) return

    try {
      const response = await fetch(resultVideoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `avatar-motion-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('다운로드 오류:', error)
    }
  }

  // 예상 소요 시간 계산
  const getEstimatedTime = () => {
    const totalDuration = getTotalDuration()
    const minsPerScene = 2
    const totalMins = sceneCount * minsPerScene + 1 // +1 for merging
    return `약 ${totalMins}-${totalMins + 2}분`
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
  if (status === 'generating_scenes' || status === 'merging') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            {/* 애니메이션 로더 */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                {status === 'merging' ? (
                  <Merge className="w-10 h-10 text-primary animate-pulse" />
                ) : (
                  <Film className="w-10 h-10 text-primary animate-pulse" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-8">
              {status === 'merging'
                ? '영상을 합치고 있어요'
                : '씬 영상을 생성하고 있어요'}
            </h3>
            <p className="text-muted-foreground mt-2">
              {status === 'merging'
                ? '모든 장면을 하나로 합치고 있습니다'
                : '각 장면의 모션 영상을 만들고 있어요'}
            </p>

            {/* 진행률 바 */}
            <div className="w-full mt-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>진행률</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>

            {/* 씬별 진행 상태 */}
            <div className="mt-6 w-full">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>씬 영상 생성</span>
                <span>{completedSceneVideos}/{sceneCount}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: sceneCount }, (_, i) => {
                  const sv = sceneVideos[i]
                  let bgColor = 'bg-secondary'
                  if (sv?.status === 'completed') bgColor = 'bg-green-500'
                  else if (sv?.status === 'generating') bgColor = 'bg-primary animate-pulse'
                  else if (sv?.status === 'failed') bgColor = 'bg-red-500'
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded ${bgColor} transition-colors`}
                    />
                  )
                })}
              </div>
            </div>

            {/* 시나리오 정보 표시 */}
            <div className="mt-8 w-full space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-2">생성 중인 영상 정보</p>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Film className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-medium">{selectedScenario.title}</span>
                </div>
                <p className="text-xs text-foreground line-clamp-2">{selectedScenario.description}</p>
              </div>

              {/* 영상 설정 */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded">
                  <Layers className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{sceneCount}개 씬</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">총 {getTotalDuration()}초</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded">
                  <Play className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{resolution}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              예상 소요 시간: {getEstimatedTime()}
            </p>
          </div>
        </div>

        {/* 이전 버튼 (비활성화) */}
        <div className="flex gap-3 mt-6">
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-muted-foreground rounded-lg font-medium opacity-50 cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </button>
        </div>
      </div>
    )
  }

  // 씬별 확인 화면 (병합 전)
  if (status === 'scenes_completed') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">씬 영상 생성 완료</h3>
            <p className="text-sm text-muted-foreground">
              각 씬을 확인하고 필요하면 수정하세요. 완료 버튼을 누르면 영상이 합쳐집니다.
            </p>
          </div>
        </div>

        {/* 씬별 영상 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sceneVideos.map((sv, i) => {
            const scene = selectedScenario?.scenes?.[i]
            const isThisSceneRegenerating = isRegenerating && regeneratingSceneIndex === i

            return (
              <div
                key={i}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* 영상 프리뷰 */}
                <div className={`relative ${aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'}`}>
                  {isThisSceneRegenerating ? (
                    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground mt-2">재생성 중...</p>
                    </div>
                  ) : sv.status === 'completed' && sv.videoUrl ? (
                    <video
                      src={sv.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                      loop
                      muted
                      playsInline
                    />
                  ) : sv.status === 'failed' ? (
                    <div className="absolute inset-0 bg-red-500/10 flex flex-col items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <p className="text-sm text-red-500 mt-2">생성 실패</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* 씬 정보 */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      씬 {i + 1}: {scene?.title || '씬'}
                    </span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      {sceneDurations[i]}초
                    </span>
                  </div>
                  {scene?.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {scene.description}
                    </p>
                  )}

                  {/* 재생성 버튼 */}
                  <button
                    onClick={() => openRegenerateModal(i)}
                    disabled={isRegenerating || isCompletingMerge}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-4 h-4" />
                    수정하기
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 영상 정보 요약 */}
        <div className="bg-secondary/30 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-foreground">
              <Layers className="w-4 h-4 text-primary" />
              {sceneCount}개 씬
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-1.5 text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              총 {getTotalDuration()}초
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-1.5 text-foreground">
              <Play className="w-4 h-4 text-primary" />
              {resolution}
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
            {errorMessage}
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex gap-3">
          {!isCompletingMerge && !isRegenerating && (
            <button
              onClick={goToPrevStep}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </button>
          )}
          <button
            onClick={handleComplete}
            disabled={isRegenerating || isCompletingMerge || completedSceneVideos < sceneCount}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompletingMerge ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                영상 합치는 중...
              </>
            ) : isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                완료
              </>
            )}
          </button>
        </div>

        {/* 씬별 재생성 모달 */}
        {showRegenerateModal && regeneratingSceneIndex !== null && (
          <div className="fixed inset-0 !m-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      씬 {regeneratingSceneIndex + 1} 수정
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      추가 지시사항이나 시간을 조정하세요
                    </p>
                  </div>
                </div>

                {/* 추가 프롬프트 */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    추가 지시사항 (선택)
                  </label>
                  <textarea
                    value={regeneratePrompt}
                    onChange={(e) => setRegeneratePrompt(e.target.value)}
                    placeholder="예: 더 역동적으로, 미소를 더 밝게, 천천히 움직이게..."
                    rows={3}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                {/* 시간 조정 */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    씬 시간
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="2"
                      max="5"
                      value={regenerateDuration}
                      onChange={(e) => setRegenerateDuration(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="w-16 px-2 py-1 bg-background border border-border rounded text-center text-sm font-medium">
                      {regenerateDuration}초
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
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
                    onClick={handleRegenerateScene}
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    재생성
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 에러 UI
  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-red-500/30 rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mt-6">영상 생성에 실패했습니다</h3>
            <p className="text-muted-foreground mt-2 text-center">{errorMessage}</p>
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

  // 완료 UI
  if (status === 'completed' && resultVideoUrl) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 성공 헤더 */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">영상 생성 완료!</h3>
            <p className="text-sm text-muted-foreground">{sceneCount}개 씬이 합쳐진 영상이 성공적으로 생성되었습니다</p>
          </div>
        </div>

        {/* 영상 플레이어 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className={`relative ${aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[70vh] mx-auto' : aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square max-h-[70vh] mx-auto'}`}>
            <video
              src={resultVideoUrl}
              controls
              autoPlay
              loop
              className="w-full h-full object-contain bg-black"
            />
          </div>
        </div>

        {/* 영상 정보 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-3">영상 정보</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">총 길이</span>
              <span className="text-foreground font-medium">{getTotalDuration()}초</span>
            </div>
            <div>
              <span className="text-muted-foreground block">씬 개수</span>
              <span className="text-foreground font-medium">{sceneCount}개</span>
            </div>
            <div>
              <span className="text-muted-foreground block">해상도</span>
              <span className="text-foreground font-medium">{resolution}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">크레딧</span>
              <span className="text-foreground font-medium">{getEstimatedCredits()}</span>
            </div>
          </div>
        </div>

        {/* 씬별 프리뷰 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-3">씬 구성</h4>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {sceneKeyframes.map((kf, i) => (
              <div key={i} className="relative">
                <div className={`rounded overflow-hidden ${aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'}`}>
                  {kf.imageUrl ? (
                    <img
                      src={kf.imageUrl}
                      alt={`씬 ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                  씬 {i + 1} • {sceneDurations[i]}초
                </div>
              </div>
            ))}
          </div>
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

        {/* 하단 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={goToPrevStep}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </button>
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 생성
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            영상 다운로드
          </button>
        </div>
      </div>
    )
  }

  // 기본 UI (로딩)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground mt-4">준비 중...</p>
        </div>
      </div>
    </div>
  )
}
