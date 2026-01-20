'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  Download,
  Check,
  Play,
  Film,
  Clock,
  Lightbulb,
  MapPin,
  Image,
} from 'lucide-react'
import { useAvatarMotionWizard } from './wizard-context'

// 생성 상태
type VideoGenerationStatus = 'idle' | 'generating' | 'completed' | 'error'

export function WizardStep5() {
  const {
    storyInfo,
    startFrameUrl,
    duration,
    imageSize,
    aspectRatio,
    videoRequestId,
    setVideoRequestId,
    isGeneratingVideo,
    setIsGeneratingVideo,
    resultVideoUrl,
    setResultVideoUrl,
    generationProgress,
    setGenerationProgress,
    goToPrevStep,
    saveDraft,
    draftId,
  } = useAvatarMotionWizard()

  const [status, setStatus] = useState<VideoGenerationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  // 중복 생성 방지
  const generationStartedRef = useRef(false)

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

  // 영상 생성 시작
  const startVideoGeneration = useCallback(async () => {
    if (!startFrameUrl || !storyInfo) {
      setErrorMessage('프레임 이미지가 없습니다. 이전 단계를 완료해주세요.')
      setStatus('error')
      return
    }

    setStatus('generating')
    setIsGeneratingVideo(true)
    setErrorMessage(null)
    setGenerationProgress(0)
    setPollCount(0)

    try {
      // 영상 생성 API 호출
      const response = await fetch('/api/avatar-motion/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startFrameUrl,
          prompt: storyInfo.motionPromptEN || storyInfo.startFrame.description,
          duration,
          generateAudio: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '영상 생성 요청 실패')
      }

      const data = await response.json()
      const requestId = data.requestId

      setVideoRequestId(requestId)

      // DB에 영상 생성 시작 상태 저장
      await saveDraft({
        status: 'GENERATING_VIDEO',
        videoRequestId: requestId,
      })

      // 영상 생성 완료까지 폴링
      let videoUrl: string | null = null
      let attempts = 0
      const maxAttempts = 120 // 최대 10분 (5초 간격)

      while (!videoUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5초 간격
        attempts++
        setPollCount(attempts)
        setGenerationProgress(Math.min((attempts / maxAttempts) * 100, 95))

        const statusResult = await pollVideoStatus(requestId)

        if (statusResult?.status === 'COMPLETED' && statusResult.resultUrl) {
          videoUrl = statusResult.resultUrl
        } else if (statusResult?.status === 'FAILED' || statusResult?.errorMessage) {
          throw new Error(statusResult?.errorMessage || '영상 생성에 실패했습니다')
        }
      }

      if (!videoUrl) {
        throw new Error('영상 생성 시간이 초과되었습니다')
      }

      // 성공
      setResultVideoUrl(videoUrl)
      setGenerationProgress(100)
      setStatus('completed')
      setIsGeneratingVideo(false)

      // DB에 완료 상태 저장
      await saveDraft({
        status: 'COMPLETED',
        videoUrl,
      })

    } catch (error) {
      console.error('영상 생성 오류:', error)
      setErrorMessage(error instanceof Error ? error.message : '영상 생성에 실패했습니다')
      setStatus('error')
      setIsGeneratingVideo(false)
    }
  }, [startFrameUrl, storyInfo, duration, setVideoRequestId, setIsGeneratingVideo, setResultVideoUrl, setGenerationProgress, saveDraft, pollVideoStatus])

  // Step 5 진입 시 자동으로 영상 생성 시작
  useEffect(() => {
    // 이미 완료된 영상이 있으면 스킵
    if (resultVideoUrl) {
      setStatus('completed')
      return
    }

    // 이미 생성 중이면 폴링 재개
    if (videoRequestId && !resultVideoUrl) {
      generationStartedRef.current = true
      resumePolling(videoRequestId)
      return
    }

    // 새로 생성 시작
    if (!generationStartedRef.current) {
      generationStartedRef.current = true
      startVideoGeneration()
    }
  }, [])

  // 폴링 재개 (페이지 새로고침 시)
  const resumePolling = useCallback(async (requestId: string) => {
    setStatus('generating')
    setIsGeneratingVideo(true)

    try {
      let videoUrl: string | null = null
      let attempts = 0
      const maxAttempts = 120

      while (!videoUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++
        setPollCount(attempts)
        setGenerationProgress(Math.min((attempts / maxAttempts) * 100, 95))

        const statusResult = await pollVideoStatus(requestId)

        if (statusResult?.status === 'COMPLETED' && statusResult.resultUrl) {
          videoUrl = statusResult.resultUrl
        } else if (statusResult?.status === 'FAILED' || statusResult?.errorMessage) {
          throw new Error(statusResult?.errorMessage || '영상 생성에 실패했습니다')
        }
      }

      if (!videoUrl) {
        throw new Error('영상 생성 시간이 초과되었습니다')
      }

      setResultVideoUrl(videoUrl)
      setGenerationProgress(100)
      setStatus('completed')
      setIsGeneratingVideo(false)

      await saveDraft({
        status: 'COMPLETED',
        videoUrl,
      })

    } catch (error) {
      console.error('영상 생성 오류:', error)
      setErrorMessage(error instanceof Error ? error.message : '영상 생성에 실패했습니다')
      setStatus('error')
      setIsGeneratingVideo(false)
    }
  }, [pollVideoStatus, setResultVideoUrl, setGenerationProgress, setIsGeneratingVideo, saveDraft])

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
    setVideoRequestId(null)
    generationStartedRef.current = false
    setTimeout(() => {
      generationStartedRef.current = true
      startVideoGeneration()
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
    const baseMins = duration === 10 ? 3 : 2
    return `약 ${baseMins}-${baseMins + 2}분`
  }

  // 생성 중 UI
  if (status === 'generating') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-8">
            {/* 애니메이션 로더 */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Film className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-8">영상 생성 중...</h3>
            <p className="text-muted-foreground mt-2">
              AI가 모션을 생성하고 있습니다
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

            {/* 스토리 정보 표시 */}
            <div className="mt-8 w-full space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-2">생성 중인 영상 정보</p>

              {/* 첫 프레임 미리보기 */}
              {startFrameUrl && (
                <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                    <img src={startFrameUrl} alt="첫 프레임" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Image className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-600 font-medium">첫 프레임</span>
                    </div>
                    <p className="text-xs text-foreground line-clamp-2">{storyInfo?.startFrame.description}</p>
                  </div>
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

              {/* 영상 설정 */}
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{duration}초</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded">
                  <Film className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{aspectRatio}</span>
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
            <p className="text-sm text-muted-foreground">아바타 모션 영상이 성공적으로 생성되었습니다</p>
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
              <span className="text-muted-foreground block">길이</span>
              <span className="text-foreground font-medium">{duration}초</span>
            </div>
            <div>
              <span className="text-muted-foreground block">비율</span>
              <span className="text-foreground font-medium">{aspectRatio}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">크기</span>
              <span className="text-foreground font-medium">{imageSize}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">스토리</span>
              <span className="text-foreground font-medium">{storyInfo?.title || '커스텀'}</span>
            </div>
          </div>
        </div>

        {/* 스토리 정보 */}
        {storyInfo && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-foreground">스토리보드</h4>

            {storyInfo.concept && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] text-amber-600 font-medium">컨셉</span>
                </div>
                <p className="text-xs text-foreground">{storyInfo.concept}</p>
              </div>
            )}

            {storyInfo.background && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] text-blue-600 font-medium">배경/장소</span>
                </div>
                <p className="text-xs text-foreground">{storyInfo.background}</p>
              </div>
            )}

            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <Play className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-600 font-medium">첫 프레임</span>
              </div>
              <p className="text-xs text-foreground">{storyInfo.startFrame.description}</p>
            </div>
          </div>
        )}

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
