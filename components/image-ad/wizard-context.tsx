'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { ImageAdType } from '@/components/ad-product/image-ad-type-modal'
import { SelectedAvatarInfo, AiAvatarOptions } from '@/components/video-ad/avatar-select-modal'
import { getDefaultOptions } from '@/lib/image-ad/category-options'

// ============================================================
// 타입 정의
// ============================================================

export interface AdProduct {
  id: string
  name: string
  rembg_image_url: string | null
  image_url: string | null
  description?: string | null
  selling_points?: string[] | null
}

export type WizardStep = 1 | 2 | 3 | 4
export type SettingMethod = 'direct' | 'ai-auto' | 'reference'
export type AspectRatio = '1:1' | '16:9' | '9:16'
export type Quality = 'medium' | 'high'

export interface AnalysisResult {
  overallStyle: string
  suggestedPrompt: string
  analyzedOptions?: Array<{
    key: string
    type: 'preset' | 'custom'
    value: string
    customText?: string
    confidence: number
    reason?: string  // AI가 이 옵션을 선택한 이유
  }>
}

export interface AiScenario {
  title: string
  description: string
  recommendedOptions: Record<string, {
    value: string
    customText?: string
    reason: string
  }>
  overallStrategy: string
  suggestedPrompt?: string
}

export interface ImageAdWizardState {
  // Step 1: 기본 정보
  step: WizardStep
  adType: ImageAdType
  selectedProduct: AdProduct | null
  localImageFile: File | null
  localImageUrl: string | null
  selectedAvatarInfo: SelectedAvatarInfo | null
  productUsageMethod: string  // 제품 사용 방법 (using 타입 전용)

  // Step 2: 설정 방식
  settingMethod: SettingMethod | null
  referenceFile: File | null
  referenceUrl: string | null
  isAnalyzingReference: boolean
  analysisResult: AnalysisResult | null

  // Step 3: 상세 옵션
  categoryOptions: Record<string, string>
  customOptions: Record<string, string>
  customInputActive: Record<string, boolean>
  additionalPrompt: string
  aiStrategy: string | null
  aiReasons: Record<string, string>
  isAiRecommending: boolean
  hasLoadedAiRecommendation: boolean
  generatedScenarios: AiScenario[]  // 생성된 3개 시나리오
  selectedScenarioIndex: number | null  // 선택된 시나리오 인덱스

  // Step 4: 생성 설정
  aspectRatio: AspectRatio
  quality: Quality
  numImages: number

  // 생성 상태
  isGenerating: boolean
  generationProgress: number
  resultImages: string[]
  resultAdIds: string[]
}

export interface ImageAdWizardActions {
  // Step navigation
  goToStep: (step: WizardStep) => void
  goToNextStep: () => void
  goToPrevStep: () => void

  // Step 1 actions
  setAdType: (type: ImageAdType) => void
  setSelectedProduct: (product: AdProduct | null) => void
  setLocalImage: (file: File | null, url: string | null) => void
  setSelectedAvatarInfo: (info: SelectedAvatarInfo | null) => void
  setProductUsageMethod: (method: string) => void

  // Step 2 actions
  setSettingMethod: (method: SettingMethod | null) => void
  setReferenceImage: (file: File | null, url: string | null) => void
  setIsAnalyzingReference: (loading: boolean) => void
  setAnalysisResult: (result: AnalysisResult | null) => void

  // Step 3 actions
  setCategoryOptions: (options: Record<string, string>) => void
  setCustomOptions: (options: Record<string, string>) => void
  setCustomInputActive: (active: Record<string, boolean>) => void
  setAdditionalPrompt: (prompt: string) => void
  setAiStrategy: (strategy: string | null) => void
  setAiReasons: (reasons: Record<string, string>) => void
  setIsAiRecommending: (loading: boolean) => void
  setHasLoadedAiRecommendation: (loaded: boolean) => void
  setGeneratedScenarios: (scenarios: AiScenario[]) => void
  setSelectedScenarioIndex: (index: number | null) => void
  selectScenario: (index: number) => void  // 시나리오 선택 시 옵션 자동 적용
  updateCategoryOption: (key: string, value: string) => void
  updateCustomOption: (key: string, value: string) => void
  toggleCustomInput: (key: string, active: boolean) => void

  // Step 4 actions
  setAspectRatio: (ratio: AspectRatio) => void
  setQuality: (quality: Quality) => void
  setNumImages: (num: number) => void

  // Generation actions
  setIsGenerating: (generating: boolean) => void
  setGenerationProgress: (progress: number) => void
  setResultImages: (images: string[]) => void
  setResultAdIds: (ids: string[]) => void

  // Validation
  canProceedToStep2: () => boolean
  canProceedToStep3: () => boolean
  canProceedToStep4: () => boolean
  canGenerate: () => boolean

  // Reset
  resetWizard: () => void
}

type ImageAdWizardContextType = ImageAdWizardState & ImageAdWizardActions

// ============================================================
// Context 생성
// ============================================================

const ImageAdWizardContext = createContext<ImageAdWizardContextType | null>(null)

// ============================================================
// Provider 컴포넌트
// ============================================================

interface ImageAdWizardProviderProps {
  children: ReactNode
  initialAdType?: ImageAdType
  initialStep?: number
  initialProductId?: string | null
  initialAvatarType?: 'ai' | 'avatar' | 'outfit' | null
  initialAvatarId?: string | null
  initialOutfitId?: string | null
  initialAiAvatarOptions?: AiAvatarOptions | null
}

export function ImageAdWizardProvider({
  children,
  initialAdType = 'productOnly',
  initialStep = 1,
  initialProductId,
  initialAvatarType,
  initialAvatarId,
  initialOutfitId,
  initialAiAvatarOptions,
}: ImageAdWizardProviderProps) {
  // Step 1 상태
  const [step, setStep] = useState<WizardStep>((initialStep >= 1 && initialStep <= 4 ? initialStep : 1) as WizardStep)
  const [adType, setAdTypeState] = useState<ImageAdType>(initialAdType)
  const [selectedProduct, setSelectedProduct] = useState<AdProduct | null>(null)
  const [localImageFile, setLocalImageFile] = useState<File | null>(null)
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null)
  const [selectedAvatarInfo, setSelectedAvatarInfo] = useState<SelectedAvatarInfo | null>(null)
  const [productUsageMethod, setProductUsageMethod] = useState<string>('')

  // Step 2 상태
  const [settingMethod, setSettingMethod] = useState<SettingMethod | null>(null)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null)
  const [isAnalyzingReference, setIsAnalyzingReference] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // Step 3 상태
  const [categoryOptions, setCategoryOptions] = useState<Record<string, string>>(() =>
    getDefaultOptions(initialAdType)
  )
  const [customOptions, setCustomOptions] = useState<Record<string, string>>({})
  const [customInputActive, setCustomInputActive] = useState<Record<string, boolean>>({})
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [aiStrategy, setAiStrategy] = useState<string | null>(null)
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({})
  const [isAiRecommending, setIsAiRecommending] = useState(false)
  const [hasLoadedAiRecommendation, setHasLoadedAiRecommendation] = useState(false)
  const [generatedScenarios, setGeneratedScenarios] = useState<AiScenario[]>([])
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number | null>(null)

  // Step 4 상태
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [quality, setQuality] = useState<Quality>('medium')
  const [numImages, setNumImages] = useState(2)

  // 생성 상태
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [resultImages, setResultImages] = useState<string[]>([])
  const [resultAdIds, setResultAdIds] = useState<string[]>([])

  // ============================================================
  // 초기 데이터 로드 (쿼리 파라미터에서 전달된 경우)
  // ============================================================

  useEffect(() => {
    // 초기 제품 로드
    if (initialProductId) {
      fetch(`/api/ad-products/${initialProductId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.product) {
            setSelectedProduct({
              id: data.product.id,
              name: data.product.name,
              rembg_image_url: data.product.rembg_image_url,
              image_url: data.product.image_url,
              description: data.product.description,
              selling_points: data.product.selling_points,
            })
          }
        })
        .catch(err => console.error('초기 제품 로드 오류:', err))
    }

    // 초기 아바타 설정
    if (initialAvatarType === 'ai' && initialAiAvatarOptions) {
      // AI 추천 아바타
      setSelectedAvatarInfo({
        type: 'ai-generated',
        avatarId: '',
        avatarName: 'AI 추천',
        imageUrl: '',
        displayName: 'AI 추천 아바타',
      })
    } else if (initialAvatarType === 'avatar' && initialAvatarId) {
      // 기존 아바타
      fetch(`/api/avatars/${initialAvatarId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.avatar) {
            setSelectedAvatarInfo({
              type: 'avatar',
              avatarId: data.avatar.id,
              avatarName: data.avatar.name,
              imageUrl: data.avatar.image_url || '',
              displayName: data.avatar.name,
            })
          }
        })
        .catch(err => console.error('초기 아바타 로드 오류:', err))
    } else if (initialAvatarType === 'outfit' && initialAvatarId && initialOutfitId) {
      // 의상 선택
      fetch(`/api/avatars/${initialAvatarId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.avatar) {
            const outfit = data.avatar.outfits?.find((o: { id: string }) => o.id === initialOutfitId)
            setSelectedAvatarInfo({
              type: 'outfit',
              avatarId: data.avatar.id,
              avatarName: data.avatar.name,
              imageUrl: outfit?.result_image_url || data.avatar.image_url || '',
              displayName: outfit?.name || data.avatar.name,
              outfitId: initialOutfitId,
              outfitName: outfit?.name,
            })
          }
        })
        .catch(err => console.error('초기 의상 로드 오류:', err))
    }
  }, [initialProductId, initialAvatarType, initialAvatarId, initialOutfitId, initialAiAvatarOptions])

  // ============================================================
  // Actions
  // ============================================================

  const setAdType = useCallback((type: ImageAdType) => {
    setAdTypeState(type)
    // 광고 유형 변경 시 기본 옵션으로 초기화
    setCategoryOptions(getDefaultOptions(type))
    setCustomOptions({})
    setCustomInputActive({})
    setAiStrategy(null)
    setAiReasons({})
  }, [])

  const setLocalImage = useCallback((file: File | null, url: string | null) => {
    setLocalImageFile(file)
    setLocalImageUrl(url)
  }, [])

  const setReferenceImage = useCallback((file: File | null, url: string | null) => {
    setReferenceFile(file)
    setReferenceUrl(url)
    if (!file) {
      setAnalysisResult(null)
    }
  }, [])

  const updateCategoryOption = useCallback((key: string, value: string) => {
    setCategoryOptions(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateCustomOption = useCallback((key: string, value: string) => {
    setCustomOptions(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleCustomInput = useCallback((key: string, active: boolean) => {
    setCustomInputActive(prev => ({ ...prev, [key]: active }))
    if (active) {
      setCategoryOptions(prev => ({ ...prev, [key]: '__custom__' }))
    }
  }, [])

  // 시나리오 선택 시 해당 시나리오의 옵션을 적용
  const selectScenario = useCallback((index: number) => {
    setSelectedScenarioIndex(index)
    const scenario = generatedScenarios[index]
    if (!scenario) return

    const newCategoryOptions: Record<string, string> = {}
    const newCustomOptions: Record<string, string> = {}
    const newCustomInputActive: Record<string, boolean> = {}
    const newAiReasons: Record<string, string> = {}

    for (const [key, opt] of Object.entries(scenario.recommendedOptions)) {
      if (opt.value === '__custom__' && opt.customText) {
        newCategoryOptions[key] = '__custom__'
        newCustomOptions[key] = opt.customText
        newCustomInputActive[key] = true
      } else {
        newCategoryOptions[key] = opt.value
        newCustomInputActive[key] = false
      }
      newAiReasons[key] = opt.reason
    }

    setCategoryOptions(newCategoryOptions)
    setCustomOptions(newCustomOptions)
    setCustomInputActive(newCustomInputActive)
    setAiReasons(newAiReasons)
    setAiStrategy(scenario.overallStrategy)
    if (scenario.suggestedPrompt) {
      setAdditionalPrompt(scenario.suggestedPrompt)
    }
  }, [generatedScenarios])

  // ============================================================
  // Validation
  // ============================================================

  // 제품만 필요한 유형 (아바타 불필요)
  const isProductOnlyType = ['productOnly'].includes(adType)
  // 아바타만 필요하거나 제품이 선택사항인 유형
  const isSeasonalType = adType === 'seasonal'
  const isWearingType = adType === 'wearing'

  const canProceedToStep2 = useCallback(() => {
    // productOnly: 제품 필수, 아바타 불필요
    if (isProductOnlyType) {
      return !!selectedProduct
    }
    // seasonal: 제품 필수, 아바타 선택사항
    if (isSeasonalType) {
      return !!selectedProduct
    }
    // wearing: 제품 필수 + 아바타 필수
    if (isWearingType) {
      return !!selectedProduct && !!selectedAvatarInfo
    }
    // using: 제품 + 아바타 + 사용 방법 필수
    if (adType === 'using') {
      return !!selectedProduct && !!selectedAvatarInfo && !!productUsageMethod.trim()
    }
    // 그 외: 제품 + 아바타 필수
    return !!selectedProduct && !!selectedAvatarInfo
  }, [isProductOnlyType, isSeasonalType, isWearingType, adType, selectedProduct, selectedAvatarInfo, productUsageMethod])

  const canProceedToStep3 = useCallback(() => {
    // 설정 방식이 선택되어야 함
    if (!settingMethod) return false
    // 참조 이미지 방식이면 이미지가 업로드되어야 함
    if (settingMethod === 'reference') {
      return !!referenceUrl && !isAnalyzingReference
    }
    return true
  }, [settingMethod, referenceUrl, isAnalyzingReference])

  const canProceedToStep4 = useCallback(() => {
    // 상세 옵션은 기본값이 있으므로 항상 진행 가능
    return true
  }, [])

  const canGenerate = useCallback(() => {
    // 생성 중이면 불가
    if (isGenerating) return false
    // Step 4에서만 생성 가능
    if (step !== 4) return false
    return true
  }, [isGenerating, step])

  // ============================================================
  // Navigation
  // ============================================================

  const goToStep = useCallback((targetStep: WizardStep) => {
    setStep(targetStep)
  }, [])

  const goToNextStep = useCallback(() => {
    setStep(prev => Math.min(prev + 1, 4) as WizardStep)
  }, [])

  const goToPrevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1) as WizardStep)
  }, [])

  // ============================================================
  // Reset
  // ============================================================

  const resetWizard = useCallback(() => {
    setStep(1)
    setAdTypeState(initialAdType)
    setSelectedProduct(null)
    setLocalImageFile(null)
    setLocalImageUrl(null)
    setSelectedAvatarInfo(null)
    setProductUsageMethod('')
    setSettingMethod(null)
    setReferenceFile(null)
    setReferenceUrl(null)
    setIsAnalyzingReference(false)
    setAnalysisResult(null)
    setCategoryOptions(getDefaultOptions(initialAdType))
    setCustomOptions({})
    setCustomInputActive({})
    setAdditionalPrompt('')
    setAiStrategy(null)
    setAiReasons({})
    setIsAiRecommending(false)
    setHasLoadedAiRecommendation(false)
    setGeneratedScenarios([])
    setSelectedScenarioIndex(null)
    setAspectRatio('1:1')
    setQuality('medium')
    setNumImages(2)
    setIsGenerating(false)
    setGenerationProgress(0)
    setResultImages([])
    setResultAdIds([])
  }, [initialAdType])

  // ============================================================
  // Context Value
  // ============================================================

  const value: ImageAdWizardContextType = {
    // State
    step,
    adType,
    selectedProduct,
    localImageFile,
    localImageUrl,
    selectedAvatarInfo,
    productUsageMethod,
    settingMethod,
    referenceFile,
    referenceUrl,
    isAnalyzingReference,
    analysisResult,
    categoryOptions,
    customOptions,
    customInputActive,
    additionalPrompt,
    aiStrategy,
    aiReasons,
    isAiRecommending,
    hasLoadedAiRecommendation,
    generatedScenarios,
    selectedScenarioIndex,
    aspectRatio,
    quality,
    numImages,
    isGenerating,
    generationProgress,
    resultImages,
    resultAdIds,

    // Actions
    goToStep,
    goToNextStep,
    goToPrevStep,
    setAdType,
    setSelectedProduct,
    setLocalImage,
    setSelectedAvatarInfo,
    setProductUsageMethod,
    setSettingMethod,
    setReferenceImage,
    setIsAnalyzingReference,
    setAnalysisResult,
    setCategoryOptions,
    setCustomOptions,
    setCustomInputActive,
    setAdditionalPrompt,
    setAiStrategy,
    setAiReasons,
    setIsAiRecommending,
    setHasLoadedAiRecommendation,
    setGeneratedScenarios,
    setSelectedScenarioIndex,
    selectScenario,
    updateCategoryOption,
    updateCustomOption,
    toggleCustomInput,
    setAspectRatio,
    setQuality,
    setNumImages,
    setIsGenerating,
    setGenerationProgress,
    setResultImages,
    setResultAdIds,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    canGenerate,
    resetWizard,
  }

  return (
    <ImageAdWizardContext.Provider value={value}>
      {children}
    </ImageAdWizardContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useImageAdWizard() {
  const context = useContext(ImageAdWizardContext)
  if (!context) {
    throw new Error('useImageAdWizard must be used within ImageAdWizardProvider')
  }
  return context
}
