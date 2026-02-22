'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import type {
  SeedanceV2AspectRatio,
  SeedanceV2Resolution,
  CinematicScenarioInfo,
} from '@/lib/byteplus/types'

// ============================================================
// 타입
// ============================================================

export type CinematicWizardStep = 1 | 2 | 3

export interface AdProduct {
  id: string
  name: string
  description?: string | null
  selling_points?: string[] | null
  image_url?: string | null
  rembg_image_url?: string | null
  additional_images?: string[] | null
  status?: string
}

interface CinematicWizardState {
  // Step 1: 제품
  selectedProduct: AdProduct | null
  editableDescription: string
  editableSellingPoints: string[]
  // Step 2: 시나리오 & 설정
  scenarios: CinematicScenarioInfo[]
  selectedScenarioIndex: number | null
  customPrompt: string
  aspectRatio: SeedanceV2AspectRatio
  resolution: SeedanceV2Resolution
  duration: number
  generateAudio: boolean
  // Step 3: 생성
  requestId: string | null
  videoUrl: string | null
  generationStatus: 'idle' | 'generating' | 'completed' | 'failed'
  errorMessage: string | null
  // 드래프트
  draftId: string | null
}

interface CinematicWizardActions {
  step: CinematicWizardStep
  setStep: (step: CinematicWizardStep) => void
  goToNextStep: () => void
  goToPrevStep: () => void
  // Step 1
  setSelectedProduct: (product: AdProduct | null) => void
  setEditableDescription: (desc: string) => void
  setEditableSellingPoints: (points: string[]) => void
  addSellingPoint: () => void
  removeSellingPoint: (index: number) => void
  updateSellingPoint: (index: number, value: string) => void
  canProceedToStep2: () => boolean
  // Step 2
  setScenarios: (scenarios: CinematicScenarioInfo[]) => void
  setSelectedScenarioIndex: (index: number | null) => void
  setCustomPrompt: (prompt: string) => void
  setAspectRatio: (ratio: SeedanceV2AspectRatio) => void
  setResolution: (resolution: SeedanceV2Resolution) => void
  setDuration: (duration: number) => void
  setGenerateAudio: (audio: boolean) => void
  canProceedToStep3: () => boolean
  getEffectivePrompt: () => string
  // Step 3
  setRequestId: (id: string | null) => void
  setVideoUrl: (url: string | null) => void
  setGenerationStatus: (status: 'idle' | 'generating' | 'completed' | 'failed') => void
  setErrorMessage: (msg: string | null) => void
  // 드래프트
  draftId: string | null
  isSaving: boolean
  pendingSave: boolean
  saveDraftAsync: (options?: { wizardStep?: number; forceNew?: boolean }) => void
  loadDraft: (videoAdId: string) => Promise<void>
}

type CinematicWizardContextType = CinematicWizardState & CinematicWizardActions

// ============================================================
// 컨텍스트
// ============================================================

const CinematicWizardContext = createContext<CinematicWizardContextType | null>(null)

export function useCinematicWizard() {
  const ctx = useContext(CinematicWizardContext)
  if (!ctx) {
    throw new Error('useCinematicWizard must be used within CinematicWizardProvider')
  }
  return ctx
}

// ============================================================
// Provider
// ============================================================

interface ProviderProps {
  children: ReactNode
  initialProductId?: string | null
  initialStep?: number
}

export function CinematicWizardProvider({ children, initialProductId, initialStep = 1 }: ProviderProps) {
  const [step, setStep] = useState<CinematicWizardStep>((initialStep as CinematicWizardStep) || 1)

  // Step 1 state
  const [selectedProduct, setSelectedProduct] = useState<AdProduct | null>(null)
  const [editableDescription, setEditableDescription] = useState('')
  const [editableSellingPoints, setEditableSellingPoints] = useState<string[]>([''])

  // Step 2 state
  const [scenarios, setScenarios] = useState<CinematicScenarioInfo[]>([])
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<SeedanceV2AspectRatio>('16:9')
  const [resolution, setResolution] = useState<SeedanceV2Resolution>('720p')
  const [duration, setDuration] = useState(8)
  const [generateAudio, setGenerateAudio] = useState(false)

  // Step 3 state
  const [requestId, setRequestId] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 드래프트 state
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // initialProductId 처리
  const initialProductIdRef = useRef(initialProductId)
  const productLoadedRef = useRef(false)

  if (initialProductIdRef.current && !productLoadedRef.current) {
    productLoadedRef.current = true
    // 제품 목록에서 로드할 때 wizard-step-1에서 처리
  }

  // Step navigation
  const goToNextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, 3) as CinematicWizardStep)
  }, [])

  const goToPrevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1) as CinematicWizardStep)
  }, [])

  // Selling points
  const addSellingPoint = useCallback(() => {
    setEditableSellingPoints((prev) => [...prev, ''])
  }, [])

  const removeSellingPoint = useCallback((index: number) => {
    setEditableSellingPoints((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateSellingPoint = useCallback((index: number, value: string) => {
    setEditableSellingPoints((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  // Validation
  const canProceedToStep2 = useCallback(() => {
    return !!selectedProduct
  }, [selectedProduct])

  const canProceedToStep3 = useCallback((): boolean => {
    // 시나리오가 선택되었거나 직접 입력 프롬프트가 있어야 함
    const hasScenario = selectedScenarioIndex !== null && !!scenarios[selectedScenarioIndex]
    const hasCustomPrompt = customPrompt.trim().length > 0
    return hasScenario || hasCustomPrompt
  }, [selectedScenarioIndex, scenarios, customPrompt])

  // 유효 프롬프트 (시나리오 선택 or 직접 입력)
  const getEffectivePrompt = useCallback(() => {
    if (selectedScenarioIndex !== null && scenarios[selectedScenarioIndex]) {
      return scenarios[selectedScenarioIndex].multiShotPrompt
    }
    return customPrompt
  }, [selectedScenarioIndex, scenarios, customPrompt])

  // 드래프트 저장
  const saveDraftAsync = useCallback(
    (options?: { wizardStep?: number; forceNew?: boolean }) => {
      setPendingSave(true)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true)
        try {
          const scenarioData = selectedScenarioIndex !== null && scenarios[selectedScenarioIndex]
            ? JSON.stringify(scenarios[selectedScenarioIndex])
            : null

          const res = await fetch('/api/cinematic-ad/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoAdId: options?.forceNew ? undefined : draftId,
              productId: selectedProduct?.id,
              wizardStep: options?.wizardStep || step,
              scenarioInfo: scenarioData,
              scenarioMethod: selectedScenarioIndex !== null ? 'ai-auto' : 'direct',
              prompt: getEffectivePrompt() || undefined,
              aspectRatio,
              resolution,
              duration,
              generateAudio,
              forceNew: options?.forceNew,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            if (data.id) {
              setDraftId(data.id)
            }
          }
        } catch (error) {
          console.error('Draft save error:', error)
        } finally {
          setIsSaving(false)
          setPendingSave(false)
        }
      }, 500)
    },
    [
      draftId, selectedProduct, step, scenarios, selectedScenarioIndex,
      customPrompt, aspectRatio, resolution, duration, generateAudio,
      getEffectivePrompt,
    ]
  )

  // 드래프트 로드
  const loadDraft = useCallback(async (videoAdId: string) => {
    try {
      const res = await fetch(`/api/cinematic-ad/draft`)
      if (!res.ok) return

      const data = await res.json()
      const draft = data.draft

      if (!draft || draft.id !== videoAdId) return

      setDraftId(draft.id)

      if (draft.wizard_step) {
        setStep(Math.min(draft.wizard_step, 3) as CinematicWizardStep)
      }

      if (draft.aspect_ratio) setAspectRatio(draft.aspect_ratio as SeedanceV2AspectRatio)
      if (draft.resolution) setResolution(draft.resolution as SeedanceV2Resolution)
      if (draft.duration) setDuration(draft.duration)
      if (draft.generate_audio !== null && draft.generate_audio !== undefined) {
        setGenerateAudio(draft.generate_audio)
      }

      if (draft.scenario_info) {
        try {
          const scenario = JSON.parse(draft.scenario_info) as CinematicScenarioInfo
          setScenarios([scenario])
          setSelectedScenarioIndex(0)
        } catch {
          // ignore parse error
        }
      }

      if (draft.prompt && draft.scenario_method === 'direct') {
        setCustomPrompt(draft.prompt)
      }

      // 제품 로드는 Step 1에서 product_id로 처리
      if (draft.product_id) {
        try {
          const prodRes = await fetch(`/api/ad-products/${draft.product_id}`)
          if (prodRes.ok) {
            const prodData = await prodRes.json()
            if (prodData.product) {
              setSelectedProduct(prodData.product)
              setEditableDescription(prodData.product.description || '')
              setEditableSellingPoints(
                prodData.product.selling_points?.length > 0
                  ? prodData.product.selling_points
                  : ['']
              )
            }
          }
        } catch {
          // ignore product load error
        }
      }
    } catch (error) {
      console.error('Draft load error:', error)
    }
  }, [])

  const value: CinematicWizardContextType = {
    // State
    step,
    selectedProduct,
    editableDescription,
    editableSellingPoints,
    scenarios,
    selectedScenarioIndex,
    customPrompt,
    aspectRatio,
    resolution,
    duration,
    generateAudio,
    requestId,
    videoUrl,
    generationStatus,
    errorMessage,
    draftId,
    isSaving,
    pendingSave,
    // Actions
    setStep,
    goToNextStep,
    goToPrevStep,
    setSelectedProduct,
    setEditableDescription,
    setEditableSellingPoints,
    addSellingPoint,
    removeSellingPoint,
    updateSellingPoint,
    canProceedToStep2,
    setScenarios,
    setSelectedScenarioIndex,
    setCustomPrompt,
    setAspectRatio,
    setResolution,
    setDuration,
    setGenerateAudio,
    canProceedToStep3,
    getEffectivePrompt,
    setRequestId,
    setVideoUrl,
    setGenerationStatus,
    setErrorMessage,
    saveDraftAsync,
    loadDraft,
  }

  return (
    <CinematicWizardContext.Provider value={value}>
      {children}
    </CinematicWizardContext.Provider>
  )
}
