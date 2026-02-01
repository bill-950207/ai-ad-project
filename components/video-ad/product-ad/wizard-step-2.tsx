'use client'

import { useState, useCallback } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Sparkles,
  Video,
  Upload,
  Link,
  Loader2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import { useProductAdWizard, ScenarioMethod, ReferenceInfo } from './wizard-context'
import { useLanguage } from '@/contexts/language-context'

export function WizardStep2() {
  const { t } = useLanguage()
  const {
    scenarioMethod,
    setScenarioMethod,
    referenceInfo,
    setReferenceInfo,
    isAnalyzingReference,
    setIsAnalyzingReference,
    canProceedToStep3,
    goToNextStep,
    goToPrevStep,
    saveDraftAsync,
    selectedProduct,
  } = useProductAdWizard()

  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [referenceError, setReferenceError] = useState<string | null>(null)

  // 방식 선택
  const handleSelectMethod = (method: ScenarioMethod) => {
    setScenarioMethod(method)
    if (method !== 'reference') {
      setReferenceInfo(null)
      setReferenceError(null)
    }
  }

  // 파일 업로드
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 유효성 검사
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!validTypes.includes(file.type)) {
      setReferenceError(t.productAdWizard?.step2?.errorInvalidFormat || 'Only MP4, WebM, MOV formats are supported')
      return
    }

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setReferenceError(t.productAdWizard?.step2?.errorFileTooLarge || 'File size must be 100MB or less')
      return
    }

    setReferenceError(null)

    // 파일을 URL로 변환 (미리보기용)
    const url = URL.createObjectURL(file)
    setReferenceInfo({
      type: 'file',
      url,
      file,
    })

    // 참조 영상 분석 시작
    await analyzeReference({ type: 'file', url, file })
  }, [setReferenceInfo])

  // YouTube URL 처리
  const handleYoutubeSubmit = useCallback(async () => {
    if (!youtubeUrl.trim()) return

    // YouTube URL 유효성 검사
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/
    if (!youtubeRegex.test(youtubeUrl)) {
      setReferenceError(t.productAdWizard?.step2?.errorInvalidYoutubeUrl || 'Please enter a valid YouTube URL')
      return
    }

    setReferenceError(null)
    setReferenceInfo({
      type: 'youtube',
      url: youtubeUrl,
    })

    // 참조 영상 분석 시작
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

      const res = await fetch('/api/product-ad/analyze-reference', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Analysis failed')
      }

      const data = await res.json()

      setReferenceInfo({
        ...info,
        analyzedElements: data.elements,
        analyzedDescription: data.description,
      })
    } catch (error) {
      console.error('Reference video analysis error:', error)
      setReferenceError(t.productAdWizard?.step2?.errorAnalysisFailed || 'Failed to analyze video. Please try again.')
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
    if (!canProceedToStep3()) return
    goToNextStep()
    saveDraftAsync({ wizardStep: 3 })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">{t.productAdWizard?.step2?.title || 'Choose Ad Configuration Method'}</h2>
        <p className="text-muted-foreground mt-2">
          {t.productAdWizard?.step2?.subtitle || 'Select how you want to configure your ad scenario'}
        </p>
      </div>

      {/* 방식 선택 카드 */}
      <div className="grid gap-4">
        {/* 직접 입력 */}
        <button
          onClick={() => handleSelectMethod('direct')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            scenarioMethod === 'direct'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              scenarioMethod === 'direct' ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              <Edit3 className={`w-5 h-5 ${
                scenarioMethod === 'direct' ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{t.productAdWizard?.step2?.directInput || 'Manual Input'}</h3>
                {scenarioMethod === 'direct' && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t.productAdWizard?.step2?.directInputDesc || 'Configure your ad by manually selecting background, mood, camera angles, etc.'}
              </p>
            </div>
          </div>
        </button>

        {/* AI 추천 */}
        <button
          onClick={() => handleSelectMethod('ai-auto')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            scenarioMethod === 'ai-auto'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              scenarioMethod === 'ai-auto' ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              <Sparkles className={`w-5 h-5 ${
                scenarioMethod === 'ai-auto' ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{t.productAdWizard?.step2?.aiRecommend || 'AI Recommendation'}</h3>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  {t.productAdWizard?.step2?.recommended || 'Recommended'}
                </span>
                {scenarioMethod === 'ai-auto' && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t.productAdWizard?.step2?.aiRecommendDesc || 'AI analyzes product info to recommend the optimal ad scenario'}
              </p>
            </div>
          </div>
        </button>

        {/* 참조 영상 */}
        <div
          className={`p-4 rounded-xl border-2 transition-all ${
            scenarioMethod === 'reference'
              ? 'border-primary bg-primary/5'
              : 'border-border'
          }`}
        >
          <button
            onClick={() => handleSelectMethod('reference')}
            className="w-full text-left"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                scenarioMethod === 'reference' ? 'bg-primary/20' : 'bg-secondary'
              }`}>
                <Video className={`w-5 h-5 ${
                  scenarioMethod === 'reference' ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{t.productAdWizard?.step2?.referenceVideo || 'Reference Video Analysis'}</h3>
                  {scenarioMethod === 'reference' && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.productAdWizard?.step2?.referenceVideoDesc || 'Analyze existing ad videos to extract style'}
                </p>
              </div>
            </div>
          </button>

          {/* 참조 영상 입력 UI */}
          {scenarioMethod === 'reference' && (
            <div className="mt-4 space-y-4 pl-16">
              {/* 이미 참조 영상이 있는 경우 */}
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
                          <p className="text-sm text-muted-foreground">{t.productAdWizard?.step2?.youtubeVideo || 'YouTube Video'}</p>
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
                          <p className="text-sm text-foreground">{t.productAdWizard?.step2?.analyzingVideo || 'Analyzing video...'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 분석 결과 */}
                  {referenceInfo.analyzedDescription && !isAnalyzingReference && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">{t.productAdWizard?.step2?.analysisComplete || 'Analysis Complete'}</span>
                      </div>
                      <p className="text-xs text-foreground">
                        {referenceInfo.analyzedDescription}
                      </p>
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
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">{t.productAdWizard?.step2?.uploadVideoFile || 'Upload Video File'}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t.productAdWizard?.step2?.uploadVideoFormats || 'MP4, WebM, MOV (max 100MB)'}</p>
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
                    <span className="text-xs text-muted-foreground">{t.common?.or || 'or'}</span>
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
                        placeholder={t.productAdWizard?.step2?.youtubeUrlPlaceholder || 'Enter YouTube URL'}
                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <button
                      onClick={handleYoutubeSubmit}
                      disabled={!youtubeUrl.trim()}
                      className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.productAdWizard?.step2?.analyze || 'Analyze'}
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
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3">
        {!isAnalyzingReference && (
          <button
            onClick={goToPrevStep}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common?.prev || 'Previous'}
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceedToStep3()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.common?.next || 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 안내 메시지 */}
      {!canProceedToStep3() && scenarioMethod === 'reference' && (
        <p className="text-center text-sm text-muted-foreground">
          {isAnalyzingReference ? (t.productAdWizard?.step2?.analyzingVideo || 'Analyzing video...') : (t.productAdWizard?.step2?.pleaseUploadReference || 'Please upload a reference video')}
        </p>
      )}
    </div>
  )
}
