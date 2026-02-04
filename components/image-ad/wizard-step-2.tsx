'use client'

import { useRef, useState } from 'react'
import {
  Edit3,
  Bot,
  ImageIcon,
  Upload,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
} from 'lucide-react'
import { useImageAdWizard, SettingMethod } from './wizard-context'
import { compressImage } from '@/lib/image/compress-client'
import { useLanguage } from '@/contexts/language-context'

export function WizardStep2() {
  const { t, language } = useLanguage()
  const {
    settingMethod,
    setSettingMethod,
    referenceUrl,
    setReferenceImage,
    isAnalyzingReference,
    analysisResult,
    setAnalysisResult,
    selectedProduct,
    goToNextStep,
    goToPrevStep,
  } = useImageAdWizard()

  // Method options with i18n
  const methodOptions: {
    method: SettingMethod
    icon: typeof Edit3
    title: string
    description: string
    badge?: string
  }[] = [
    {
      method: 'direct',
      icon: Edit3,
      title: t.imageAd?.method?.manual || 'Manual Input',
      description: t.imageAd?.method?.manualDesc || 'Select all options manually: pose, background, lighting, etc.',
    },
    {
      method: 'ai-auto',
      icon: Bot,
      title: t.imageAd?.method?.ai || 'AI Auto Settings',
      description: t.imageAd?.method?.aiDesc || 'AI analyzes product and avatar to recommend optimal settings',
      badge: t.imageAd?.method?.recommended || 'Recommended',
    },
    {
      method: 'reference',
      icon: ImageIcon,
      title: t.imageAd?.method?.reference || 'Reference Image',
      description: t.imageAd?.method?.referenceDesc || 'Upload an existing ad image for AI to analyze the style',
    },
  ]

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // 파일 처리 공통 함수
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(t.imageAd?.method?.invalidFileType || 'Please upload an image file')
      return
    }

    // 로컬 미리보기 생성
    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)
    setReferenceImage(file, null)
    // 이전 분석 결과 초기화
    setAnalysisResult(null)

    try {
      setIsUploading(true)

      // 이미지 압축
      const compressedFile = await compressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
      })

      // 업로드
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('type', 'reference-style')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await uploadRes.json()
      setReferenceImage(file, url)
      // 분석은 Next Step 클릭 시 수행
    } catch (error) {
      console.error('Reference image upload error:', error)
      alert(t.imageAd?.method?.uploadError || 'An error occurred while uploading the image')
      clearReference()
    } finally {
      setIsUploading(false)
    }
  }

  // 파일 선택 핸들러 (업로드만, 분석은 Next Step 클릭 시)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await processFile(file)
  }

  // 참조 이미지 삭제
  const clearReference = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
    }
    setLocalPreview(null)
    setReferenceImage(null, null)
    setAnalysisResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 설정 방식 선택
  const handleMethodSelect = (method: SettingMethod) => {
    setSettingMethod(method)
    if (method !== 'reference') {
      clearReference()
    }
  }

  // 다음 단계로 진행 가능 여부
  const canProceed = () => {
    if (!settingMethod) return false
    if (settingMethod === 'reference') {
      return !!referenceUrl && !isAnalyzingReference && !isUploading
    }
    return true
  }

  // Next Step 클릭 핸들러
  const handleNextStep = async () => {
    // reference 모드: Step 3으로 이동 후 거기서 분석 (프로그레스 화면 표시)
    goToNextStep()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 설정 방식 선택 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {t.imageAd?.method?.title || 'Select Setting Method'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t.imageAd?.method?.subtitle || 'Choose how to configure detailed options for your ad'}
        </p>

        <div className="space-y-4">
          {methodOptions.map(({ method, icon: Icon, title, description, badge }) => {
            const isSelected = settingMethod === method
            return (
              <button
                key={method}
                onClick={() => handleMethodSelect(method)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {title}
                      </h3>
                      {badge && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 참조 이미지 업로드 (reference 선택 시) */}
      {settingMethod === 'reference' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {t.imageAd?.method?.referenceTitle || 'Reference Ad Image'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t.imageAd?.method?.referenceSubtitle || 'Upload a reference ad image for AI to analyze the style'}
          </p>

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {localPreview || referenceUrl ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="w-full aspect-video bg-secondary/30 rounded-xl overflow-hidden">
                  <img
                    src={localPreview || referenceUrl || ''}
                    alt={t.imageAd?.method?.referenceAlt || 'Reference image'}
                    className="w-full h-full object-contain"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                      <span className="text-sm text-white">
                        {t.imageAd?.method?.uploading || 'Uploading...'}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={clearReference}
                  disabled={isUploading || isAnalyzingReference}
                  className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 분석 결과 또는 분석 대기 메시지 */}
              {analysisResult ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{t.imageAd?.method?.aiAnalysis || 'AI Analysis Results'}</span>
                  </div>
                  <p className="text-sm text-foreground">{analysisResult.overallStyle}</p>
                  {analysisResult.suggestedPrompt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t.imageAd?.method?.recommendedStyle || 'Recommended Style:'} {analysisResult.suggestedPrompt}
                    </p>
                  )}
                </div>
              ) : referenceUrl && !isUploading && (
                <div className="bg-secondary/50 border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t.imageAd?.method?.willAnalyzeOnNext || 'AI will analyze this image with product info when you click Next Step'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed rounded-xl transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/30'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isDragging ? 'bg-primary/20' : 'bg-secondary/50'
              }`}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${isDragging ? 'text-primary' : 'text-foreground'}`}>
                  {isDragging
                    ? (t.imageAd?.method?.dropHere || 'Drop image here')
                    : (t.imageAd?.method?.uploadImage || 'Upload Image')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.imageAd?.method?.dragOrClick || 'Drag & drop or click to select'}
                </p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* AI 자동 설정 안내 */}
      {settingMethod === 'ai-auto' && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">{t.imageAd?.method?.aiWillRecommend || 'AI will recommend optimal settings'}</h3>
              <p className="text-sm text-muted-foreground">
                {(t.imageAd?.method?.aiWillAnalyze || 'Based on {product} product, AI will recommend the best ad settings.').replace('{product}', selectedProduct?.name || '')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between pt-4">
        <button
          onClick={goToPrevStep}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium border border-border hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t.imageAd?.wizard?.prevStep || 'Previous Step'}
        </button>

        <button
          onClick={handleNextStep}
          disabled={!canProceed() || isAnalyzingReference}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            canProceed() && !isAnalyzingReference
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isAnalyzingReference ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.imageAd?.method?.analyzing || 'Analyzing style...'}
            </>
          ) : (
            <>
              {t.imageAd?.wizard?.nextStep || 'Next Step'}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* 유효성 메시지 */}
      {!canProceed() && settingMethod && (
        <p className="text-center text-sm text-muted-foreground">
          {settingMethod === 'reference' && !referenceUrl && (t.imageAd?.method?.uploadRequired || 'Please upload a reference image')}
          {settingMethod === 'reference' && isAnalyzingReference && (t.imageAd?.method?.analyzingImage || 'Analyzing image...')}
          {!settingMethod && (t.imageAd?.method?.selectMethod || 'Please select a setting method')}
        </p>
      )}
    </div>
  )
}
