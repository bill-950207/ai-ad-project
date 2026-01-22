'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Image,
  Sparkles,
  Package,
  Layers,
  Play,
  Merge,
} from 'lucide-react'
import { useAvatarMotionWizard, SceneVideo } from './wizard-context'

// 생성 상태
type VideoGenerationStatus = 'idle' | 'generating_scenes' | 'merging' | 'completed' | 'error'

export function WizardStep5() {
  const {
    getSelectedScenario,
    sceneKeyframes,
    sceneCount,
    sceneDurations,
    movementAmplitudes,
    resolution,
    aspectRatio,
    additionalPrompt,
    // 씬별 영상
    sceneVideos,
    setSceneVideos,
    updateSceneVideo,
    isMergingVideos,
    setIsMergingVideos,
    // Legacy
    videoRequestId,
    setVideoRequestId,
    isGeneratingVideo,
    setIsGeneratingVideo,
    resultVideoUrl,
    setResultVideoUrl,
    generationProgress,
    setGenerationProgress,
    // Helper
    canMergeVideos,
    getTotalDuration,
    getEstimatedCredits,
    // Navigation
    goToPrevStep,
    saveDraft,
    draftId,
  } = useAvatarMotionWizard()

  const [status, setStatus] = useState<VideoGenerationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentGeneratingScene, setCurrentGeneratingScene] = useState(0)

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

  // 모든 씬 영상 순차 생성
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

    // 씬 비디오 초기화
    const initialVideos: SceneVideo[] = Array.from({ length: sceneCount }, (_, i) => ({
      sceneIndex: i,
      videoUrl: null,
      requestId: null,
      provider: 'wavespeed',
      status: 'pending',
    }))
    setSceneVideos(initialVideos)

    const scenes = selectedScenario?.scenes || []
    const hasMultiScene = scenes.length > 0

    for (let i = 0; i < sceneCount; i++) {
      setCurrentGeneratingScene(i)

      const keyframe = sceneKeyframes[i]
      if (!keyframe?.imageUrl) {
        updateSceneVideo(i, { status: 'failed', error: '프레임 이미지 없음' })
        continue
      }

      // 해당 씬의 모션 프롬프트 가져오기
      const scene = hasMultiScene ? scenes[i] : null
      const motionPrompt = scene?.motionPromptEN || selectedScenario?.motionPromptEN || ''
      const duration = sceneDurations[i] || 5
      const amplitude = movementAmplitudes[i] || 'auto'

      // 상태를 generating으로 업데이트
      updateSceneVideo(i, { status: 'generating' })

      // 영상 생성
      const videoUrl = await generateSceneVideo(i, keyframe.imageUrl, motionPrompt, duration, amplitude)

      if (videoUrl) {
        updateSceneVideo(i, { status: 'completed', videoUrl })
      } else {
        updateSceneVideo(i, { status: 'failed', error: '영상 생성 실패' })
      }

      // 진행률 업데이트
      setGenerationProgress(((i + 1) / sceneCount) * 80) // 80%까지 씬 생성
    }

    setIsGeneratingVideo(false)

    // 모든 씬 영상이 완료되었는지 확인
    const updatedVideos = sceneVideos
    const allCompleted = updatedVideos.every(sv => sv.status === 'completed' && sv.videoUrl)

    if (allCompleted) {
      // 영상 병합 시작
      await mergeVideos()
    } else {
      setStatus('error')
      setErrorMessage('일부 씬 영상 생성에 실패했습니다')
    }
  }, [sceneKeyframes, sceneCount, selectedScenario, sceneDurations, movementAmplitudes, sceneVideos, setSceneVideos, updateSceneVideo, setIsGeneratingVideo, setGenerationProgress, generateSceneVideo])

  // 영상 병합
  const mergeVideos = useCallback(async () => {
    setStatus('merging')
    setIsMergingVideos(true)
    setGenerationProgress(85)

    try {
      // 완료된 씬 영상 URL 수집
      const videoUrls = sceneVideos
        .filter(sv => sv.status === 'completed' && sv.videoUrl)
        .sort((a, b) => a.sceneIndex - b.sceneIndex)
        .map(sv => sv.videoUrl as string)

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
          sceneVideos,
        })
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
  }, [sceneVideos, sceneCount, setIsMergingVideos, setResultVideoUrl, setGenerationProgress, saveDraft])

  // Step 5 진입 시 자동으로 영상 생성 시작
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
                ? '영상 병합 중...'
                : `씬 ${currentGeneratingScene + 1}/${sceneCount} 영상 생성 중...`}
            </h3>
            <p className="text-muted-foreground mt-2">
              {status === 'merging'
                ? '모든 씬 영상을 하나로 합치고 있습니다'
                : 'Vidu Q2가 모션을 생성하고 있습니다'}
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
