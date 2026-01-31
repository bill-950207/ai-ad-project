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

const METHOD_OPTIONS: {
  method: SettingMethod
  icon: typeof Edit3
  title: string
  description: string
  badge?: string
}[] = [
  {
    method: 'direct',
    icon: Edit3,
    title: 'Direct Input',
    description: 'Manually select all options like pose, background, and lighting',
  },
  {
    method: 'ai-auto',
    icon: Bot,
    title: 'AI Auto Settings',
    description: 'AI analyzes product and avatar to recommend optimal settings',
    badge: 'Recommended',
  },
  {
    method: 'reference',
    icon: ImageIcon,
    title: 'Reference Image',
    description: 'Upload an existing ad image and AI will analyze its style',
  },
]

export function WizardStep2() {
  const {
    settingMethod,
    setSettingMethod,
    referenceUrl,
    setReferenceImage,
    isAnalyzingReference,
    setIsAnalyzingReference,
    analysisResult,
    setAnalysisResult,
    adType,
    selectedProduct,
    goToNextStep,
    goToPrevStep,
  } = useImageAdWizard()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  // 파일 선택 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 로컬 미리보기 생성
    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)
    setReferenceImage(file, null)

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
        throw new Error('업로드 실패')
      }

      const { url } = await uploadRes.json()
      setReferenceImage(file, url)

      // 업로드 성공 후 자동 분석
      await analyzeReference(url)
    } catch (error) {
      console.error('참조 이미지 업로드 오류:', error)
      alert('이미지 업로드 중 오류가 발생했습니다')
      clearReference()
    } finally {
      setIsUploading(false)
    }
  }

  // 참조 이미지 분석
  const analyzeReference = async (imageUrl: string) => {
    setIsAnalyzingReference(true)
    try {
      const res = await fetch('/api/image-ads/analyze-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          adType,
        }),
      })

      if (!res.ok) {
        throw new Error('분석 실패')
      }

      const result = await res.json()
      setAnalysisResult({
        overallStyle: result.overallStyle,
        suggestedPrompt: result.suggestedPrompt,
        analyzedOptions: result.analyzedOptions,
      })
    } catch (error) {
      console.error('참조 이미지 분석 오류:', error)
      alert('이미지 분석 중 오류가 발생했습니다')
    } finally {
      setIsAnalyzingReference(false)
    }
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 설정 방식 선택 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          광고 설정 방식 선택
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          광고의 상세 옵션을 어떤 방식으로 설정할지 선택하세요
        </p>

        <div className="space-y-4">
          {METHOD_OPTIONS.map(({ method, icon: Icon, title, description, badge }) => {
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
            참조 광고 이미지
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            참조할 광고 이미지를 업로드하면 AI가 스타일을 분석합니다
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
                    alt="참조 이미지"
                    className="w-full h-full object-contain"
                  />
                  {(isUploading || isAnalyzingReference) && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                      <span className="text-sm text-white">
                        {isUploading ? '업로드 중...' : '스타일 분석 중...'}
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

              {/* 분석 결과 */}
              {analysisResult && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">AI 분석 결과</span>
                  </div>
                  <p className="text-sm text-foreground">{analysisResult.overallStyle}</p>
                  {analysisResult.suggestedPrompt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      추천 스타일: {analysisResult.suggestedPrompt}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-secondary/30 transition-colors"
            >
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">이미지 업로드</p>
                <p className="text-xs text-muted-foreground mt-1">
                  참조할 광고 이미지를 업로드하세요
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
              <h3 className="font-medium text-foreground mb-1">AI가 최적의 설정을 추천합니다</h3>
              <p className="text-sm text-muted-foreground">
                선택한 제품{selectedProduct ? ` "${selectedProduct.name}"` : ''}과 광고 유형을 분석하여
                포즈, 배경, 조명, 분위기, 의상 등을 자동으로 설정합니다.
                다음 단계에서 AI 추천을 확인하고 필요시 수정할 수 있습니다.
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
          이전 단계
        </button>

        <button
          onClick={goToNextStep}
          disabled={!canProceed()}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            canProceed()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          다음 단계
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 유효성 메시지 */}
      {!canProceed() && settingMethod && (
        <p className="text-center text-sm text-muted-foreground">
          {settingMethod === 'reference' && !referenceUrl && '참조 이미지를 업로드해주세요'}
          {settingMethod === 'reference' && isAnalyzingReference && '이미지 분석 중입니다...'}
          {!settingMethod && '설정 방식을 선택해주세요'}
        </p>
      )}
    </div>
  )
}
