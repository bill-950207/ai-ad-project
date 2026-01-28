/**
 * 온보딩 플로우 Context
 *
 * 대시보드에서 광고 생성 시작 시 제품/아바타 준비 상태를 확인하고
 * 필요한 경우 등록/생성 플로우를 안내하는 온보딩 상태 관리
 */

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { SelectedAvatarInfo, AiAvatarOptions } from '@/components/video-ad/avatar-select-modal'

// ============================================================
// 타입 정의
// ============================================================

/** 제품 타입 */
export interface OnboardingProduct {
  id: string
  name: string
  status: string
  image_url: string | null
  rembg_image_url: string | null
  source_image_url: string | null
  rembg_temp_url?: string | null
  description?: string | null
  selling_points?: string[] | null
}

/** 아바타 타입 */
export interface OnboardingAvatar {
  id: string
  name: string
  status: string
  image_url: string | null
  options?: {
    gender?: string
    age?: string
    bodyType?: string
  }
}

/** 온보딩 단계 */
export type OnboardingStep =
  | 'video-type'           // 영상 광고 유형 선택
  | 'image-type'           // 이미지 광고 유형 선택
  | 'product'              // 제품 선택/등록
  | 'product-processing'   // 제품 배경 제거 중
  | 'product-editing'      // 제품 크기 조절
  | 'avatar'               // 아바타 선택/생성
  | 'avatar-processing'    // 아바타 생성 중
  | 'complete'             // 완료

/** 광고 대상 유형 */
export type AdTargetType = 'image' | 'video'

/** 영상 광고 유형 */
export type VideoAdType = 'productDescription' | 'productAd'

/** 이미지 광고 유형 */
export type ImageAdType = 'productOnly' | 'holding' | 'using' | 'wearing' | 'lifestyle' | 'unboxing' | 'seasonal'

/** 아바타 선택 모드 */
export type AvatarSelectionMode = 'ai' | 'existing' | 'create'

/** 온보딩 상태 */
export interface OnboardingState {
  // 플로우 상태
  isOpen: boolean
  step: OnboardingStep
  targetType: AdTargetType

  // 영상 광고 유형
  videoAdType: VideoAdType | null

  // 이미지 광고 유형
  imageAdType: ImageAdType | null

  // 제품
  products: OnboardingProduct[]
  selectedProduct: OnboardingProduct | null
  isLoadingProducts: boolean
  newProductId: string | null
  productSourceImageUrl: string | null
  productRembgTempUrl: string | null

  // 제품 등록 폼 상태
  isRegisteringProduct: boolean

  // 아바타
  avatars: OnboardingAvatar[]
  selectedAvatarInfo: SelectedAvatarInfo | null
  isLoadingAvatars: boolean
  avatarSelectionMode: AvatarSelectionMode | null
  aiAvatarOptions: AiAvatarOptions | null
  newAvatarId: string | null

  // 아바타 생성 폼 상태
  isCreatingAvatar: boolean

  // 네비게이션 상태 (페이지 이동 중)
  isNavigating: boolean

  // 에러 상태
  error: string | null
}

/** 온보딩 액션 */
export interface OnboardingActions {
  // 플로우 제어
  startOnboarding: (targetType: AdTargetType) => void
  closeOnboarding: () => void
  goToStep: (step: OnboardingStep) => void

  // 영상 유형 선택
  setVideoAdType: (type: VideoAdType) => void

  // 이미지 유형 선택
  setImageAdType: (type: ImageAdType) => void

  // 제품 관련
  setProducts: (products: OnboardingProduct[]) => void
  setSelectedProduct: (product: OnboardingProduct | null) => void
  setIsLoadingProducts: (loading: boolean) => void
  setIsRegisteringProduct: (registering: boolean) => void
  onProductCreated: (productId: string, sourceImageUrl: string) => void
  onProductProcessingComplete: (rembgTempUrl: string) => void
  onProductEditingComplete: (product: OnboardingProduct) => void

  // 아바타 관련
  setAvatars: (avatars: OnboardingAvatar[]) => void
  setSelectedAvatarInfo: (info: SelectedAvatarInfo | null) => void
  setIsLoadingAvatars: (loading: boolean) => void
  setAvatarSelectionMode: (mode: AvatarSelectionMode | null) => void
  setAiAvatarOptions: (options: AiAvatarOptions | null) => void
  setIsCreatingAvatar: (creating: boolean) => void
  onAvatarCreated: (avatarId: string) => void
  onAvatarProcessingComplete: (avatar: OnboardingAvatar) => void

  // 에러 처리
  setError: (error: string | null) => void

  // 네비게이션 상태
  setIsNavigating: (navigating: boolean) => void

  // 완료 및 이동
  proceedToAdCreation: () => { path: string; params: Record<string, string> }

  // 리셋
  resetOnboarding: () => void
}

type OnboardingContextType = OnboardingState & OnboardingActions

// ============================================================
// Context 생성
// ============================================================

const OnboardingContext = createContext<OnboardingContextType | null>(null)

// ============================================================
// 초기 상태
// ============================================================

const initialState: OnboardingState = {
  isOpen: false,
  step: 'product',
  targetType: 'image',

  videoAdType: null,
  imageAdType: null,

  products: [],
  selectedProduct: null,
  isLoadingProducts: false,
  newProductId: null,
  productSourceImageUrl: null,
  productRembgTempUrl: null,

  isRegisteringProduct: false,

  avatars: [],
  selectedAvatarInfo: null,
  isLoadingAvatars: false,
  avatarSelectionMode: null,
  aiAvatarOptions: null,
  newAvatarId: null,

  isCreatingAvatar: false,

  isNavigating: false,

  error: null,
}

// ============================================================
// Provider 컴포넌트
// ============================================================

interface OnboardingProviderProps {
  children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>(initialState)

  // ============================================================
  // 플로우 제어
  // ============================================================

  const startOnboarding = useCallback((targetType: AdTargetType) => {
    setState(() => ({
      ...initialState,
      isOpen: true,
      targetType,
      // 영상/이미지 광고 모두 유형 선택부터 시작
      step: targetType === 'video' ? 'video-type' : 'image-type',
      // 로딩 상태를 true로 시작하여 빈 목록 깜빡임 방지
      isLoadingProducts: true,
      isLoadingAvatars: true,
    }))
  }, [])

  const closeOnboarding = useCallback(() => {
    // 네비게이션 중에는 닫기 방지
    setState(prev => {
      if (prev.isNavigating) return prev
      return initialState
    })
  }, [])

  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, step, error: null }))
  }, [])

  // ============================================================
  // 영상 유형 선택
  // ============================================================

  const setVideoAdType = useCallback((type: VideoAdType) => {
    setState(prev => ({
      ...prev,
      videoAdType: type,
      step: 'product',
    }))
  }, [])

  // ============================================================
  // 이미지 유형 선택
  // ============================================================

  const setImageAdType = useCallback((type: ImageAdType) => {
    setState(prev => ({
      ...prev,
      imageAdType: type,
      step: 'product',
    }))
  }, [])

  // ============================================================
  // 제품 관련
  // ============================================================

  const setProducts = useCallback((products: OnboardingProduct[]) => {
    setState(prev => ({ ...prev, products }))
  }, [])

  const setSelectedProduct = useCallback((product: OnboardingProduct | null) => {
    setState(prev => ({ ...prev, selectedProduct: product }))
  }, [])

  const setIsLoadingProducts = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoadingProducts: loading }))
  }, [])

  const setIsRegisteringProduct = useCallback((registering: boolean) => {
    setState(prev => ({ ...prev, isRegisteringProduct: registering }))
  }, [])

  const onProductCreated = useCallback((productId: string, sourceImageUrl: string) => {
    setState(prev => ({
      ...prev,
      newProductId: productId,
      productSourceImageUrl: sourceImageUrl,
      step: 'product-processing',
      isRegisteringProduct: false,
    }))
  }, [])

  const onProductProcessingComplete = useCallback((rembgTempUrl: string) => {
    setState(prev => ({
      ...prev,
      productRembgTempUrl: rembgTempUrl,
      step: 'product-editing',
    }))
  }, [])

  const onProductEditingComplete = useCallback((product: OnboardingProduct) => {
    setState(prev => ({
      ...prev,
      selectedProduct: product,
      // productOnly 타입은 아바타 불필요 -> 바로 complete로
      step: prev.imageAdType === 'productOnly' ? 'complete' : 'avatar',
      newProductId: null,
      productSourceImageUrl: null,
      productRembgTempUrl: null,
    }))
  }, [])

  // ============================================================
  // 아바타 관련
  // ============================================================

  const setAvatars = useCallback((avatars: OnboardingAvatar[]) => {
    setState(prev => ({ ...prev, avatars }))
  }, [])

  const setSelectedAvatarInfo = useCallback((info: SelectedAvatarInfo | null) => {
    setState(prev => ({ ...prev, selectedAvatarInfo: info }))
  }, [])

  const setIsLoadingAvatars = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoadingAvatars: loading }))
  }, [])

  const setAvatarSelectionMode = useCallback((mode: AvatarSelectionMode | null) => {
    setState(prev => ({ ...prev, avatarSelectionMode: mode }))
  }, [])

  const setAiAvatarOptions = useCallback((options: AiAvatarOptions | null) => {
    setState(prev => ({ ...prev, aiAvatarOptions: options }))
  }, [])

  const setIsCreatingAvatar = useCallback((creating: boolean) => {
    setState(prev => ({ ...prev, isCreatingAvatar: creating }))
  }, [])

  const onAvatarCreated = useCallback((avatarId: string) => {
    setState(prev => ({
      ...prev,
      newAvatarId: avatarId,
      step: 'avatar-processing',
      isCreatingAvatar: false,
    }))
  }, [])

  const onAvatarProcessingComplete = useCallback((avatar: OnboardingAvatar) => {
    if (!avatar.image_url) return

    setState(prev => ({
      ...prev,
      selectedAvatarInfo: {
        type: 'avatar',
        avatarId: avatar.id,
        avatarName: avatar.name,
        imageUrl: avatar.image_url!,
        displayName: avatar.name,
      },
      step: 'complete',
      newAvatarId: null,
    }))
  }, [])

  // ============================================================
  // 에러 처리
  // ============================================================

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setIsNavigating = useCallback((navigating: boolean) => {
    setState(prev => ({ ...prev, isNavigating: navigating }))
  }, [])

  // ============================================================
  // 완료 및 이동
  // ============================================================

  const proceedToAdCreation = useCallback(() => {
    const { targetType, videoAdType, imageAdType, selectedProduct, selectedAvatarInfo, aiAvatarOptions } = state

    const params: Record<string, string> = {}

    // 제품 ID 추가
    if (selectedProduct) {
      params.productId = selectedProduct.id
    }

    // 아바타 정보 추가
    if (selectedAvatarInfo) {
      if (selectedAvatarInfo.type === 'ai-generated' && aiAvatarOptions) {
        params.avatarType = 'ai'
        params.aiAvatarOptions = JSON.stringify(aiAvatarOptions)
      } else if (selectedAvatarInfo.type === 'outfit') {
        params.avatarType = 'outfit'
        params.avatarId = selectedAvatarInfo.avatarId
        params.outfitId = selectedAvatarInfo.outfitId || ''
      } else {
        params.avatarType = 'avatar'
        params.avatarId = selectedAvatarInfo.avatarId
      }
    }

    // 2단계부터 시작
    params.step = '2'

    // 경로 결정 (fullscreen wizard 페이지로 이동)
    let path = '/image-ad-create'

    if (targetType === 'video') {
      if (videoAdType === 'productDescription') {
        path = '/video-ad-create'
        params.category = 'productDescription'
      } else {
        path = '/video-ad-create'
        params.category = 'productAd'
      }
    } else {
      // 이미지 광고 유형 추가
      if (imageAdType) {
        params.adType = imageAdType
      }
    }

    return { path, params }
  }, [state])

  // ============================================================
  // 리셋
  // ============================================================

  const resetOnboarding = useCallback(() => {
    setState(initialState)
  }, [])

  // ============================================================
  // Context Value
  // ============================================================

  const value: OnboardingContextType = {
    ...state,

    // 플로우 제어
    startOnboarding,
    closeOnboarding,
    goToStep,

    // 영상 유형
    setVideoAdType,

    // 이미지 유형
    setImageAdType,

    // 제품
    setProducts,
    setSelectedProduct,
    setIsLoadingProducts,
    setIsRegisteringProduct,
    onProductCreated,
    onProductProcessingComplete,
    onProductEditingComplete,

    // 아바타
    setAvatars,
    setSelectedAvatarInfo,
    setIsLoadingAvatars,
    setAvatarSelectionMode,
    setAiAvatarOptions,
    setIsCreatingAvatar,
    onAvatarCreated,
    onAvatarProcessingComplete,

    // 에러
    setError,

    // 네비게이션
    setIsNavigating,

    // 완료
    proceedToAdCreation,

    // 리셋
    resetOnboarding,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
