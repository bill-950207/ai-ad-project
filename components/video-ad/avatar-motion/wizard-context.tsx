'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { SelectedAvatarInfo } from '@/components/video-ad/avatar-select-modal'

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

export type WizardStep = 1 | 2 | 3 | 4 | 5
export type StoryMethod = 'direct' | 'ai-auto' | 'reference'
export type AspectRatio = '16:9' | '9:16' | '1:1'

// 이미지 크기 (kling-2.6 영상 생성에 영향)
export type ImageSize = '1024x576' | '576x1024' | '768x768'  // 16:9, 9:16, 1:1

// 스토리보드 프레임 정보
export interface StoryFrame {
  id: string
  order: number
  description: string  // 프레임 설명
  imageUrl?: string    // 생성된 프레임 이미지
  isGenerating?: boolean
}

// 스토리 정보
export interface StoryInfo {
  title: string           // 스토리 제목
  description: string     // 전체 스토리 설명
  concept?: string        // 광고 컨셉 상세 설명
  background?: string     // 배경/장소 상세 설명
  startFrame: StoryFrame  // 시작 프레임 (필수)
  endFrame?: StoryFrame   // 끝 프레임 (선택 - 호환성 유지, kling-2.6에서는 사용 안함)
  mood?: string           // 분위기
  action?: string         // 주요 동작
  emotionalArc?: string   // 감정의 흐름
  motionPromptEN?: string // 영상 생성용 영어 모션 설명 (kling-2.6용)
}

// AI 생성 아바타 옵션
export interface GeneratedAvatarOption {
  index: number
  requestId: string
  description: string
  imageUrl?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
}

export interface AvatarMotionWizardState {
  // DB 연동
  draftId: string | null
  isSaving: boolean

  // Step 1: 기본 정보
  step: WizardStep
  selectedProduct: AdProduct | null
  selectedAvatarInfo: SelectedAvatarInfo | null

  // Step 2: 스토리 설정 방식
  storyMethod: StoryMethod | null
  referenceFile: File | null
  referenceUrl: string | null
  isAnalyzingReference: boolean

  // Step 3: 스토리보드 상세
  locationPrompt: string  // 배경/장소 프롬프트 (빈 문자열이면 AI 자동 선택)
  storyInfo: StoryInfo | null
  isGeneratingStory: boolean
  aiGeneratedStory: StoryInfo | null
  generatedStoryTemplates: Array<{
    id: string
    title: string
    description: string
    concept?: string         // 광고 컨셉 설명
    background?: string      // 배경/장소 상세 설명
    startFrame: string
    endFrame?: string        // 선택적
    mood: string
    action: string
    emotionalArc?: string    // 감정의 흐름
    motionPromptEN?: string  // 영상 생성용 영어 모션 설명
  }>
  selectedStoryTemplateId: string | null

  // Step 4: 프레임 생성 설정
  aspectRatio: AspectRatio
  imageSize: ImageSize        // 이미지 크기 (영상 크기에 영향)
  duration: number            // 초 단위 (5 또는 10)
  isGeneratingFrames: boolean
  startFrameUrl: string | null
  endFrameUrl: string | null  // 호환성 유지 (kling-2.6에서는 사용 안함)

  // AI 아바타 생성 (ai-generated 타입 선택 시)
  isGeneratingAvatars: boolean
  generatedAvatarOptions: GeneratedAvatarOption[]
  selectedAiAvatarIndex: number | null
  selectedAiAvatarUrl: string | null
  selectedAiAvatarDescription: string | null

  // Step 5: 영상 생성 상태
  isGeneratingVideo: boolean
  generationProgress: number
  videoRequestId: string | null  // kling-2.6 작업 ID
  resultVideoUrl: string | null
}

export interface AvatarMotionWizardActions {
  // DB 연동
  setDraftId: (id: string | null) => void
  saveDraft: (additionalData?: Record<string, unknown>) => Promise<string | null>
  loadDraft: (draftId: string) => Promise<boolean>

  // Step navigation
  goToStep: (step: WizardStep) => void
  goToNextStep: () => void
  goToPrevStep: () => void

  // Step 1 actions
  setSelectedProduct: (product: AdProduct | null) => void
  setSelectedAvatarInfo: (info: SelectedAvatarInfo | null) => void

  // Step 2 actions
  setStoryMethod: (method: StoryMethod | null) => void
  setReferenceMedia: (file: File | null, url: string | null) => void
  setIsAnalyzingReference: (loading: boolean) => void

  // Step 3 actions
  setLocationPrompt: (prompt: string) => void
  setStoryInfo: (info: StoryInfo | null) => void
  setIsGeneratingStory: (loading: boolean) => void
  setAiGeneratedStory: (story: StoryInfo | null) => void
  updateStartFrame: (description: string) => void
  updateEndFrame: (description: string) => void
  setGeneratedStoryTemplates: (templates: AvatarMotionWizardState['generatedStoryTemplates']) => void
  setSelectedStoryTemplateId: (id: string | null) => void

  // Step 4 actions
  setAspectRatio: (ratio: AspectRatio) => void
  setImageSize: (size: ImageSize) => void
  setDuration: (seconds: number) => void
  setIsGeneratingFrames: (loading: boolean) => void
  setStartFrameUrl: (url: string | null) => void
  setEndFrameUrl: (url: string | null) => void
  setVideoRequestId: (id: string | null) => void

  // AI Avatar actions
  setIsGeneratingAvatars: (loading: boolean) => void
  setGeneratedAvatarOptions: (avatars: GeneratedAvatarOption[]) => void
  updateAvatarOption: (index: number, updates: Partial<GeneratedAvatarOption>) => void
  selectAiAvatar: (index: number, imageUrl: string, description: string) => void
  resetAiAvatars: () => void

  // Generation actions
  setIsGeneratingVideo: (generating: boolean) => void
  setGenerationProgress: (progress: number) => void
  setResultVideoUrl: (url: string | null) => void

  // Validation
  canProceedToStep2: () => boolean
  canProceedToStep3: () => boolean
  canProceedToStep4: () => boolean
  canProceedToStep5: () => boolean  // 프레임 생성 완료 → 영상 생성 단계
  canGenerateVideo: () => boolean

  // Reset
  resetWizard: () => void
}

type AvatarMotionWizardContextType = AvatarMotionWizardState & AvatarMotionWizardActions

// ============================================================
// Context 생성
// ============================================================

const AvatarMotionWizardContext = createContext<AvatarMotionWizardContextType | null>(null)

// ============================================================
// 기본 스토리 생성
// ============================================================

const createDefaultStory = (): StoryInfo => ({
  title: '',
  description: '',
  startFrame: {
    id: 'start',
    order: 1,
    description: '',
  },
  // endFrame은 선택적 - kling-2.6에서는 사용 안함
})

// ============================================================
// Provider 컴포넌트
// ============================================================

interface AvatarMotionWizardProviderProps {
  children: ReactNode
}

export function AvatarMotionWizardProvider({ children }: AvatarMotionWizardProviderProps) {
  // DB 연동 상태
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Step 1 상태
  const [step, setStep] = useState<WizardStep>(1)
  const [selectedProduct, setSelectedProduct] = useState<AdProduct | null>(null)
  const [selectedAvatarInfo, setSelectedAvatarInfo] = useState<SelectedAvatarInfo | null>(null)

  // Step 2 상태
  const [storyMethod, setStoryMethod] = useState<StoryMethod | null>(null)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null)
  const [isAnalyzingReference, setIsAnalyzingReference] = useState(false)

  // Step 3 상태
  const [locationPrompt, setLocationPrompt] = useState<string>('')
  const [storyInfo, setStoryInfo] = useState<StoryInfo | null>(null)
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)
  const [aiGeneratedStory, setAiGeneratedStory] = useState<StoryInfo | null>(null)
  const [generatedStoryTemplates, setGeneratedStoryTemplates] = useState<AvatarMotionWizardState['generatedStoryTemplates']>([])
  const [selectedStoryTemplateId, setSelectedStoryTemplateId] = useState<string | null>(null)

  // Step 4 상태
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [imageSize, setImageSize] = useState<ImageSize>('576x1024')  // 9:16 기본값
  const [duration, setDuration] = useState(5)  // kling-2.6: 5 또는 10초
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false)
  const [startFrameUrl, setStartFrameUrl] = useState<string | null>(null)
  const [endFrameUrl, setEndFrameUrl] = useState<string | null>(null)  // 호환성 유지

  // AI 아바타 상태
  const [isGeneratingAvatars, setIsGeneratingAvatars] = useState(false)
  const [generatedAvatarOptions, setGeneratedAvatarOptions] = useState<GeneratedAvatarOption[]>([])
  const [selectedAiAvatarIndex, setSelectedAiAvatarIndex] = useState<number | null>(null)
  const [selectedAiAvatarUrl, setSelectedAiAvatarUrl] = useState<string | null>(null)
  const [selectedAiAvatarDescription, setSelectedAiAvatarDescription] = useState<string | null>(null)

  // 영상 생성 상태 (Step 5)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [videoRequestId, setVideoRequestId] = useState<string | null>(null)
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null)

  // ============================================================
  // Actions
  // ============================================================

  const setReferenceMedia = useCallback((file: File | null, url: string | null) => {
    setReferenceFile(file)
    setReferenceUrl(url)
  }, [])

  const updateStartFrame = useCallback((description: string) => {
    setStoryInfo(prev => {
      if (!prev) {
        const newStory = createDefaultStory()
        newStory.startFrame.description = description
        return newStory
      }
      return {
        ...prev,
        startFrame: { ...prev.startFrame, description },
      }
    })
  }, [])

  const updateEndFrame = useCallback((description: string) => {
    setStoryInfo(prev => {
      if (!prev) {
        const newStory = createDefaultStory()
        if (newStory.endFrame) {
          newStory.endFrame.description = description
        }
        return newStory
      }
      const endFrame = prev.endFrame || {
        id: `endframe-${Date.now()}`,
        order: 2,
        description: '',
      }
      return {
        ...prev,
        endFrame: { ...endFrame, description },
      }
    })
  }, [])

  // AI 아바타 옵션 업데이트
  const updateAvatarOption = useCallback((index: number, updates: Partial<GeneratedAvatarOption>) => {
    setGeneratedAvatarOptions(prev =>
      prev.map(avatar =>
        avatar.index === index ? { ...avatar, ...updates } : avatar
      )
    )
  }, [])

  // AI 아바타 선택
  const selectAiAvatar = useCallback((index: number, imageUrl: string, description: string) => {
    setSelectedAiAvatarIndex(index)
    setSelectedAiAvatarUrl(imageUrl)
    setSelectedAiAvatarDescription(description)
  }, [])

  // AI 아바타 초기화
  const resetAiAvatars = useCallback(() => {
    setIsGeneratingAvatars(false)
    setGeneratedAvatarOptions([])
    setSelectedAiAvatarIndex(null)
    setSelectedAiAvatarUrl(null)
    setSelectedAiAvatarDescription(null)
  }, [])

  // Draft 저장
  const saveDraft = useCallback(async (additionalData?: Record<string, unknown>): Promise<string | null> => {
    setIsSaving(true)
    try {
      // AI 아바타 옵션 구성
      const aiAvatarOptions = selectedAvatarInfo?.type === 'ai-generated' ? {
        index: selectedAiAvatarIndex,
        imageUrl: selectedAiAvatarUrl,
        description: selectedAiAvatarDescription,
        options: generatedAvatarOptions,
      } : null

      // 제품 정보 구성
      let productInfo = ''
      if (selectedProduct) {
        productInfo = [
          selectedProduct.name,
          selectedProduct.description,
          selectedProduct.selling_points?.join(', '),
        ].filter(Boolean).join('. ')
      }

      const payload = {
        id: draftId,
        wizardStep: step,
        avatarId: selectedAvatarInfo?.type === 'ai-generated' ? 'ai-generated' : selectedAvatarInfo?.avatarId,
        outfitId: selectedAvatarInfo?.outfitId,
        avatarImageUrl: selectedAvatarInfo?.type === 'ai-generated' ? selectedAiAvatarUrl : selectedAvatarInfo?.imageUrl,
        productId: selectedProduct?.id,
        productInfo: productInfo || null,
        aiAvatarOptions,
        storyMethod,
        locationPrompt: locationPrompt || null,
        storyInfo,
        aspectRatio,
        imageSize,
        duration,
        startFrameUrl,
        endFrameUrl,
        videoRequestId,
        ...additionalData,
      }

      const res = await fetch('/api/avatar-motion/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Failed to save draft')
      }

      const data = await res.json()
      if (data.draft?.id) {
        setDraftId(data.draft.id)
        return data.draft.id
      }
      return null
    } catch (error) {
      console.error('Draft 저장 오류:', error)
      return null
    } finally {
      setIsSaving(false)
    }
  }, [
    draftId,
    step,
    selectedAvatarInfo,
    selectedProduct,
    selectedAiAvatarIndex,
    selectedAiAvatarUrl,
    selectedAiAvatarDescription,
    generatedAvatarOptions,
    storyMethod,
    locationPrompt,
    storyInfo,
    aspectRatio,
    imageSize,
    duration,
    startFrameUrl,
    endFrameUrl,
    videoRequestId,
  ])

  // Draft 로드
  const loadDraft = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/avatar-motion/draft?id=${id}`)
      if (!res.ok) {
        return false
      }

      const data = await res.json()
      const draft = data.draft
      if (!draft) {
        return false
      }

      // 상태 복원
      setDraftId(draft.id)
      setStep((draft.wizard_step || 1) as WizardStep)

      // 아바타 정보 복원
      if (draft.avatar_id || draft.ai_avatar_options) {
        const isAiGenerated = !draft.avatar_id && draft.ai_avatar_options
        let aiOptions = null
        try {
          aiOptions = draft.ai_avatar_options ? JSON.parse(draft.ai_avatar_options) : null
        } catch {
          // JSON 파싱 실패 시 무시
        }

        setSelectedAvatarInfo({
          type: isAiGenerated ? 'ai-generated' : (draft.outfit_id ? 'outfit' : 'avatar'),
          avatarId: draft.avatar_id || '',
          avatarName: isAiGenerated ? 'AI 생성 아바타' : '아바타',
          outfitId: draft.outfit_id,
          imageUrl: draft.avatar_image_url || '',
          displayName: isAiGenerated ? 'AI 생성 아바타' : '아바타',
        })

        if (isAiGenerated && aiOptions) {
          setSelectedAiAvatarIndex(aiOptions.index)
          setSelectedAiAvatarUrl(aiOptions.imageUrl)
          setSelectedAiAvatarDescription(aiOptions.description)
          if (aiOptions.options) {
            setGeneratedAvatarOptions(aiOptions.options)
          }
        }
      }

      // 제품 정보 복원 (간단히 ID만)
      if (draft.product_id) {
        // 제품 정보를 API에서 가져오는 것은 wizard-step-1에서 처리
        // 여기서는 ID만 저장
        setSelectedProduct({
          id: draft.product_id,
          name: '',
          rembg_image_url: null,
          image_url: null,
        })
      }

      // 스토리 정보 복원
      if (draft.story_method) {
        setStoryMethod(draft.story_method as StoryMethod)
      }

      if (draft.location_prompt) {
        setLocationPrompt(draft.location_prompt)
      }

      if (draft.story_info) {
        setStoryInfo(draft.story_info as StoryInfo)
      }

      // Step 4 정보 복원
      if (draft.aspect_ratio) {
        setAspectRatio(draft.aspect_ratio as AspectRatio)
      }
      if (draft.image_size) {
        setImageSize(draft.image_size as ImageSize)
      }
      if (draft.duration) {
        setDuration(draft.duration)
      }
      if (draft.start_frame_url) {
        setStartFrameUrl(draft.start_frame_url)
      }
      if (draft.end_frame_url) {
        setEndFrameUrl(draft.end_frame_url)
      }
      if (draft.video_request_id) {
        setVideoRequestId(draft.video_request_id)
      }
      if (draft.video_url) {
        setResultVideoUrl(draft.video_url)
      }

      return true
    } catch (error) {
      console.error('Draft 로드 오류:', error)
      return false
    }
  }, [])

  // ============================================================
  // Validation
  // ============================================================

  const canProceedToStep2 = useCallback(() => {
    // 아바타 필수, 제품은 선택
    return !!selectedAvatarInfo
  }, [selectedAvatarInfo])

  const canProceedToStep3 = useCallback(() => {
    if (!storyMethod) return false
    if (storyMethod === 'reference') {
      return !!referenceUrl && !isAnalyzingReference
    }
    return true
  }, [storyMethod, referenceUrl, isAnalyzingReference])

  const canProceedToStep4 = useCallback(() => {
    // 스토리 정보가 있고, 시작 프레임 설명이 있어야 함
    if (!storyInfo) return false
    return !!storyInfo.startFrame.description
  }, [storyInfo])

  const canProceedToStep5 = useCallback(() => {
    // 프레임 이미지가 생성되어야 함 (시작 프레임만)
    if (isGeneratingFrames) return false
    return !!startFrameUrl
  }, [isGeneratingFrames, startFrameUrl])

  const canGenerateVideo = useCallback(() => {
    // 프레임 이미지가 생성되어 있고, 영상 생성 중이 아니어야 함
    if (isGeneratingVideo) return false
    return !!startFrameUrl
  }, [isGeneratingVideo, startFrameUrl])

  // ============================================================
  // Navigation
  // ============================================================

  const goToStep = useCallback((targetStep: WizardStep) => {
    setStep(targetStep)
  }, [])

  const goToNextStep = useCallback(() => {
    setStep(prev => Math.min(prev + 1, 5) as WizardStep)
  }, [])

  const goToPrevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1) as WizardStep)
  }, [])

  // ============================================================
  // Reset
  // ============================================================

  const resetWizard = useCallback(() => {
    // DB 연동 상태 초기화
    setDraftId(null)
    setIsSaving(false)
    // Step 1 상태
    setStep(1)
    setSelectedProduct(null)
    setSelectedAvatarInfo(null)
    // Step 2 상태
    setStoryMethod(null)
    setReferenceFile(null)
    setReferenceUrl(null)
    setIsAnalyzingReference(false)
    // Step 3 상태
    setLocationPrompt('')
    setStoryInfo(null)
    setIsGeneratingStory(false)
    setAiGeneratedStory(null)
    setGeneratedStoryTemplates([])
    setSelectedStoryTemplateId(null)
    // Step 4 상태
    setAspectRatio('9:16')
    setImageSize('576x1024')
    setDuration(5)
    setIsGeneratingFrames(false)
    setStartFrameUrl(null)
    setEndFrameUrl(null)
    // AI 아바타 상태 초기화
    setIsGeneratingAvatars(false)
    setGeneratedAvatarOptions([])
    setSelectedAiAvatarIndex(null)
    setSelectedAiAvatarUrl(null)
    setSelectedAiAvatarDescription(null)
    // Step 5 영상 생성 상태
    setIsGeneratingVideo(false)
    setGenerationProgress(0)
    setVideoRequestId(null)
    setResultVideoUrl(null)
  }, [])

  // ============================================================
  // Context Value
  // ============================================================

  const value: AvatarMotionWizardContextType = {
    // DB 연동 상태
    draftId,
    isSaving,

    // State
    step,
    selectedProduct,
    selectedAvatarInfo,
    storyMethod,
    referenceFile,
    referenceUrl,
    isAnalyzingReference,
    locationPrompt,
    storyInfo,
    isGeneratingStory,
    aiGeneratedStory,
    generatedStoryTemplates,
    selectedStoryTemplateId,
    aspectRatio,
    imageSize,
    duration,
    isGeneratingFrames,
    startFrameUrl,
    endFrameUrl,
    // AI 아바타 상태
    isGeneratingAvatars,
    generatedAvatarOptions,
    selectedAiAvatarIndex,
    selectedAiAvatarUrl,
    selectedAiAvatarDescription,
    // 영상 생성 상태
    isGeneratingVideo,
    generationProgress,
    videoRequestId,
    resultVideoUrl,

    // DB 연동 액션
    setDraftId,
    saveDraft,
    loadDraft,

    // Actions
    goToStep,
    goToNextStep,
    goToPrevStep,
    setSelectedProduct,
    setSelectedAvatarInfo,
    setStoryMethod,
    setReferenceMedia,
    setIsAnalyzingReference,
    setLocationPrompt,
    setStoryInfo,
    setIsGeneratingStory,
    setAiGeneratedStory,
    updateStartFrame,
    updateEndFrame,
    setGeneratedStoryTemplates,
    setSelectedStoryTemplateId,
    setAspectRatio,
    setImageSize,
    setDuration,
    setIsGeneratingFrames,
    setStartFrameUrl,
    setEndFrameUrl,
    setVideoRequestId,
    // AI 아바타 액션
    setIsGeneratingAvatars,
    setGeneratedAvatarOptions,
    updateAvatarOption,
    selectAiAvatar,
    resetAiAvatars,
    // 영상 생성 액션
    setIsGeneratingVideo,
    setGenerationProgress,
    setResultVideoUrl,
    // Validation
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    canProceedToStep5,
    canGenerateVideo,
    resetWizard,
  }

  return (
    <AvatarMotionWizardContext.Provider value={value}>
      {children}
    </AvatarMotionWizardContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useAvatarMotionWizard() {
  const context = useContext(AvatarMotionWizardContext)
  if (!context) {
    throw new Error('useAvatarMotionWizard must be used within AvatarMotionWizardProvider')
  }
  return context
}
