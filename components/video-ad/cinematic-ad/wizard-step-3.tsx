'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft, Loader2, Download, RefreshCw, Coins,
  CheckCircle, XCircle, Film, Clock, Ratio, Volume2, VolumeX,
  ExternalLink,
} from 'lucide-react'
import { useCinematicWizard } from './wizard-context'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'
import { SEEDANCE_V2_CREDIT_COST_PER_SECOND } from '@/lib/credits/constants'
import Link from 'next/link'

export function WizardStep3() {
  const { t } = useLanguage()
  const { refreshCredits } = useCredits()
  const {
    draftId,
    selectedProduct,
    scenarios,
    selectedScenarioIndex,
    customPrompt,
    aspectRatio,
    resolution,
    duration,
    generateAudio,
    requestId,
    setRequestId,
    videoUrl,
    setVideoUrl,
    generationStatus,
    setGenerationStatus,
    errorMessage,
    setErrorMessage,
    getEffectivePrompt,
    goToPrevStep,
  } = useCinematicWizard()

  const cinematicT = t.cinematicAdWizard as Record<string, unknown> | undefined
  const step3T = cinematicT?.step3 as Record<string, string> | undefined

  const [isSubmitting, setIsSubmitting] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 크레딧 계산
  const costPerSecond = SEEDANCE_V2_CREDIT_COST_PER_SECOND[resolution] || 2
  const estimatedCredits = duration * costPerSecond

  // 선택된 시나리오 정보
  const selectedScenario = selectedScenarioIndex !== null ? scenarios[selectedScenarioIndex] : null

  // 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // 상태 폴링
  const startPolling = useCallback((reqId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/product-ad/status/${encodeURIComponent(reqId)}?type=video`
        )
        if (!res.ok) return

        const data = await res.json()

        if (data.status === 'COMPLETED' && data.resultUrl) {
          setGenerationStatus('completed')
          setVideoUrl(data.resultUrl)
          refreshCredits()
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        } else if (data.status === 'FAILED') {
          setGenerationStatus('failed')
          setErrorMessage(data.errorMessage || 'Video generation failed')
          refreshCredits()
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
        // IN_QUEUE, IN_PROGRESS: 계속 폴링
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000) // 5초 간격 폴링
  }, [setGenerationStatus, setVideoUrl, setErrorMessage, refreshCredits])

  // 영상 생성
  const handleGenerate = async () => {
    if (isSubmitting || generationStatus === 'generating') return
    setIsSubmitting(true)
    setGenerationStatus('generating')
    setErrorMessage(null)

    try {
      const prompt = getEffectivePrompt()
      if (!prompt) {
        throw new Error('No prompt available')
      }

      // 제품 이미지 URL
      const imageUrls: string[] = []
      if (selectedProduct?.rembg_image_url) {
        imageUrls.push(selectedProduct.rembg_image_url)
      } else if (selectedProduct?.image_url) {
        imageUrls.push(selectedProduct.image_url)
      }

      const res = await fetch('/api/cinematic-ad/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoAdId: draftId,
          prompt,
          imageUrls,
          aspectRatio,
          resolution,
          duration,
          generateAudio,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        if (res.status === 402) {
          throw new Error('Insufficient credits')
        }
        throw new Error(error.error || 'Failed to start generation')
      }

      const data = await res.json()
      setRequestId(data.requestId)
      refreshCredits()

      // 폴링 시작
      startPolling(data.requestId)
    } catch (error) {
      console.error('Video generation error:', error)
      setGenerationStatus('failed')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate video')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 재생성
  const handleRegenerate = () => {
    setVideoUrl(null)
    setRequestId(null)
    setGenerationStatus('idle')
    setErrorMessage(null)
  }

  // 다운로드
  const handleDownload = async () => {
    if (!videoUrl) return
    try {
      const res = await fetch(videoUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cinematic-ad-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  // 완료 상태
  if (generationStatus === 'completed' && videoUrl) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {step3T?.titleComplete || 'Video Generation Complete'}
          </h2>
        </div>

        {/* 영상 플레이어 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full aspect-video bg-black"
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            {step3T?.download || 'Download Video'}
          </button>
          <button
            onClick={handleRegenerate}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {step3T?.regenerate || 'Regenerate'}
          </button>
          <Link
            href="/dashboard/video-ad"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {step3T?.toDashboard || 'Dashboard'}
          </Link>
        </div>
      </div>
    )
  }

  // 생성 중 상태
  if (generationStatus === 'generating') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <Film className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {step3T?.generating || 'Generating cinematic video...'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {step3T?.estimatedTime || 'This may take 1-3 minutes'}
            </p>
          </div>

          {/* 요약 정보 */}
          <div className="w-full max-w-sm bg-secondary/30 rounded-lg p-4 space-y-2 mt-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{step3T?.ratio || 'Ratio'}</span>
              <span className="text-foreground">{aspectRatio}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{step3T?.durationLabel || 'Duration'}</span>
              <span className="text-foreground">{duration}s</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{step3T?.resolutionLabel || 'Resolution'}</span>
              <span className="text-foreground">{resolution}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 실패 상태
  if (generationStatus === 'failed') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {step3T?.failed || 'Generation Failed'}
            </h3>
            <p className="text-sm text-red-400 mt-1">
              {errorMessage || 'An unknown error occurred'}
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {step3T?.tryAgain || 'Try Again'}
          </button>
        </div>
      </div>
    )
  }

  // 기본 상태: 생성 확인
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Film className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {step3T?.title || 'Generate Cinematic Video'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {step3T?.subtitle || 'Review settings and generate your cinematic ad video'}
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-foreground">{step3T?.summary || 'Summary'}</h3>

        {/* 제품 */}
        {selectedProduct && (
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                alt={selectedProduct.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h4 className="font-medium text-foreground text-sm">{selectedProduct.name}</h4>
              <p className="text-xs text-muted-foreground">{step3T?.product || 'Product'}</p>
            </div>
          </div>
        )}

        {/* 시나리오 */}
        {selectedScenario && (
          <div className="pb-3 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">{step3T?.scenario || 'Scenario'}</p>
            <p className="text-sm font-medium text-foreground">{selectedScenario.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedScenario.description}</p>
          </div>
        )}

        {/* 직접 입력 프롬프트 */}
        {!selectedScenario && customPrompt && (
          <div className="pb-3 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">{step3T?.prompt || 'Prompt'}</p>
            <p className="text-sm text-foreground line-clamp-3">{customPrompt}</p>
          </div>
        )}

        {/* 설정 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col items-center p-2.5 bg-secondary/20 rounded-lg">
            <Ratio className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">{step3T?.ratio || 'Ratio'}</span>
            <span className="text-sm font-semibold text-foreground">{aspectRatio}</span>
          </div>
          <div className="flex flex-col items-center p-2.5 bg-secondary/20 rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">{step3T?.durationLabel || 'Duration'}</span>
            <span className="text-sm font-semibold text-foreground">{duration}s</span>
          </div>
          <div className="flex flex-col items-center p-2.5 bg-secondary/20 rounded-lg">
            <Film className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">{step3T?.resolutionLabel || 'Resolution'}</span>
            <span className="text-sm font-semibold text-foreground">{resolution}</span>
          </div>
          <div className="flex flex-col items-center p-2.5 bg-secondary/20 rounded-lg">
            {generateAudio ? (
              <Volume2 className="w-4 h-4 text-primary mb-1" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground mb-1" />
            )}
            <span className="text-xs text-muted-foreground">{step3T?.audio || 'Audio'}</span>
            <span className="text-sm font-semibold text-foreground">
              {generateAudio ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* 크레딧 */}
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              {step3T?.creditsRequired || 'Credits Required'}
            </span>
          </div>
          <span className="font-bold text-primary text-lg">{estimatedCredits}</span>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="flex justify-between">
        <button
          onClick={goToPrevStep}
          className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common?.prev || 'Previous'}
        </button>
        <button
          onClick={handleGenerate}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Film className="w-4 h-4" />
          )}
          {step3T?.generate || 'Generate Video'}
        </button>
      </div>
    </div>
  )
}
