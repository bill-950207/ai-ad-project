'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { useAsyncDraftSave } from '@/lib/hooks/use-async-draft-save'

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
export type ScenarioMethod = 'direct' | 'ai-auto' | 'reference'
export type AspectRatio = '16:9' | '9:16' | '1:1' | null
export type VideoModel = 'vidu'
export type VideoResolution = '540p' | '720p' | '1080p'

// 광고 요소 옵션들 (전체 영상용 - 레거시)
export interface AdElementOptions {
  background: string        // 배경/장소
  mood: string              // 분위기/톤
  cameraAngle: string       // 카메라 구도
  productPlacement: string  // 제품 배치/연출 방식
  lighting: string          // 조명 스타일
  colorTone: string         // 색상 톤
}

// 씬별 광고 요소 (Step 3에서 씬별로 개별 설정)
export interface SceneElementOptions {
  // 사용자 설정 가능 (UI 표시) - LLM이 자유롭게 생성
  background: string                                           // 배경/장소
  mood: string                                                 // 분위기/톤
  additionalPrompt: string                                     // 추가 지시사항
  // AI 생성 (UI에 표시하지 않음)
  movementAmplitude?: 'auto' | 'small' | 'medium' | 'large'    // 카메라 움직임 속도 (Vidu용)
  imagePrompt?: string                                         // Seedream용 영어 프롬프트
  videoPrompt?: string                                         // Vidu용 영어 프롬프트
}

// 기본 씬 요소 생성
export function createDefaultSceneElement(): SceneElementOptions {
  return {
    background: '',
    mood: '',
    additionalPrompt: '',
    movementAmplitude: 'auto',  // AI가 콘텐츠에 맞게 자동 결정
  }
}

// AI 추천 영상 설정
export interface RecommendedVideoSettings {
  aspectRatio: '16:9' | '9:16' | '1:1'
  sceneCount: number
  sceneDurations: number[]
}

// 시나리오 요소 (간소화 - mood만 필수)
export interface ScenarioElements {
  mood: string  // 전체 분위기/톤
}

// 시나리오 정보
export interface ScenarioInfo {
  title: string
  description: string
  elements: ScenarioElements | AdElementOptions  // 새 형식: mood만, 레거시 호환: 6개 전부
  videoSettings?: RecommendedVideoSettings  // AI 추천 영상 설정
  sceneElements?: SceneElementOptions[]     // AI 추천 씬별 광고 요소
  scenes?: SceneInfo[]          // 개별 씬 배열 (Kling O1 멀티씬용)
  firstScenePrompt?: string     // LLM이 생성한 첫 씬 프롬프트 (레거시)
  videoPrompt?: string          // LLM이 생성한 영상 프롬프트 (레거시)
  motionDescription?: string    // 모션 설명 (레거시)
}

// 첫 씬 옵션 (첫 번째 씬의 변형 선택용)
export interface FirstSceneOption {
  index: number
  requestId: string
  imageUrl?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
}

// 개별 씬 정보 (시나리오의 각 씬)
export interface SceneInfo {
  index: number
  scenePrompt: string        // 이 씬의 이미지 생성 프롬프트 (Seedream)
  videoPrompt?: string       // 이 씬의 영상 생성 프롬프트 (Vidu) - 별도 모션 포함
  transitionPrompt?: string  // 이 씬에서 다음 씬으로의 전환 프롬프트
  duration: number           // 전환 영상 길이 (3-10초)
  movementAmplitude?: 'auto' | 'small' | 'medium' | 'large'  // 카메라/모션 강도
}

// 씬 키프레임 상태 (각 씬의 이미지 생성 상태)
export interface SceneKeyframe {
  sceneIndex: number
  requestId?: string
  imageUrl?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
}

// 씬 전환 영상 세그먼트 상태 (Kling O1로 생성된 전환 영상)
export interface SceneVideoSegment {
  fromSceneIndex: number
  toSceneIndex: number
  requestId?: string
  videoUrl?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
}

// 참조 영상 정보
export interface ReferenceInfo {
  type: 'file' | 'youtube'
  url: string
  file?: File
  analyzedElements?: Partial<AdElementOptions>
  analyzedDescription?: string
}

export interface ProductAdWizardState {
  // DB 연동
  draftId: string | null
  isSaving: boolean
  pendingSave: boolean
  lastSaveError: Error | null
  lastSavedAt: Date | null

  // Step 1: 제품 선택
  step: WizardStep
  selectedProduct: AdProduct | null
  editableDescription: string
  editableSellingPoints: string[]

  // Step 2: 시나리오 설정 방식
  scenarioMethod: ScenarioMethod | null
  referenceInfo: ReferenceInfo | null
  isAnalyzingReference: boolean

  // Step 3: 시나리오 구성
  scenarioInfo: ScenarioInfo | null
  isGeneratingScenario: boolean
  generatedScenarios: ScenarioInfo[]  // AI 추천 시나리오들
  selectedScenarioIndex: number | null

  // Step 4: 영상 설정
  aspectRatio: AspectRatio
  duration: number  // 4, 8, 12초 (Vidu: 1-8초) - 레거시, sceneDurations 사용
  sceneDurations: number[]  // 각 씬별 영상 길이 (초)
  videoResolution: VideoResolution  // 영상 해상도 (540p, 720p, 1080p)
  sceneCount: number  // 씬 개수 (2-8)
  sceneElements: SceneElementOptions[]  // 씬별 광고 요소 (배경, 카메라앵글, 조명 등)
  multiShot: boolean  // 멀티샷 모드
  videoCount: number  // 생성할 영상 개수 (1-3)
  videoModel: VideoModel  // 영상 생성 모델
  isVideoSettingsFromScenario: boolean  // AI 시나리오에서 가져온 설정인지 여부
  isGeneratingScenes: boolean
  firstSceneOptions: FirstSceneOption[]
  selectedSceneIndex: number | null

  // Step 4-5: 멀티씬 키프레임 (Kling O1용)
  sceneKeyframes: SceneKeyframe[]         // 모든 씬의 키프레임 이미지
  isGeneratingKeyframes: boolean          // 키프레임 생성 중 여부

  // Step 5: 영상 생성
  isGeneratingVideo: boolean
  generationProgress: number
  videoRequestIds: string[]  // 여러 영상 요청 ID
  resultVideoUrls: string[]  // 여러 영상 결과 URL

  // Step 5: 멀티씬 영상 세그먼트 (Kling O1용)
  sceneVideoSegments: SceneVideoSegment[]  // 씬 전환 영상들
  finalVideoUrl: string | null             // FFmpeg로 합친 최종 영상
}

export interface ProductAdWizardActions {
  // DB 연동
  setDraftId: (id: string | null) => void
  saveDraft: (additionalData?: Record<string, unknown>) => Promise<string | null>
  saveDraftAsync: (additionalData?: Record<string, unknown>) => void
  loadDraft: (draftId: string) => Promise<boolean>
  clearSaveError: () => void
  flushPendingSave: () => Promise<void>

  // Step navigation
  goToStep: (step: WizardStep) => void
  goToNextStep: () => void
  goToPrevStep: () => void

  // Step 1 actions
  setSelectedProduct: (product: AdProduct | null) => void
  setEditableDescription: (desc: string) => void
  setEditableSellingPoints: (points: string[]) => void
  addSellingPoint: () => void
  removeSellingPoint: (index: number) => void
  updateSellingPoint: (index: number, value: string) => void

  // Step 2 actions
  setScenarioMethod: (method: ScenarioMethod | null) => void
  setReferenceInfo: (info: ReferenceInfo | null) => void
  setIsAnalyzingReference: (loading: boolean) => void

  // Step 3 actions
  setScenarioInfo: (info: ScenarioInfo | null) => void
  setIsGeneratingScenario: (loading: boolean) => void
  setGeneratedScenarios: (scenarios: ScenarioInfo[]) => void
  setSelectedScenarioIndex: (index: number | null) => void
  updateScenarioElement: (key: keyof AdElementOptions, value: string) => void

  // Step 4 actions
  setAspectRatio: (ratio: AspectRatio) => void
  setDuration: (seconds: number) => void
  setSceneDurations: (durations: number[]) => void
  updateSceneDuration: (sceneIndex: number, duration: number) => void
  setVideoResolution: (resolution: VideoResolution) => void
  setSceneCount: (count: number) => void
  setSceneElements: (elements: SceneElementOptions[]) => void
  updateSceneElement: (sceneIndex: number, key: keyof SceneElementOptions, value: string) => void
  applySceneElementToAll: (sourceIndex: number) => void  // 일괄 적용
  setMultiShot: (enabled: boolean) => void
  setVideoCount: (count: number) => void
  setVideoModel: (model: VideoModel) => void
  applyVideoSettingsFromScenario: (settings: RecommendedVideoSettings) => void  // 시나리오 영상 설정 적용
  unlockVideoSettings: () => void  // 영상 설정 잠금 해제
  setIsGeneratingScenes: (loading: boolean) => void
  setFirstSceneOptions: (options: FirstSceneOption[]) => void
  updateFirstSceneOption: (index: number, updates: Partial<FirstSceneOption>) => void
  setSelectedSceneIndex: (index: number | null) => void

  // Step 4-5 멀티씬 actions
  setSceneKeyframes: (keyframes: SceneKeyframe[]) => void
  updateSceneKeyframe: (sceneIndex: number, updates: Partial<SceneKeyframe>) => void
  reorderSceneKeyframes: (oldIndex: number, newIndex: number) => void
  setIsGeneratingKeyframes: (loading: boolean) => void

  // Step 5 actions
  setIsGeneratingVideo: (generating: boolean) => void
  setGenerationProgress: (progress: number) => void
  setVideoRequestIds: (ids: string[]) => void
  addVideoRequestId: (id: string) => void
  setResultVideoUrls: (urls: string[]) => void
  addResultVideoUrl: (url: string) => void

  // Step 5 멀티씬 actions
  setSceneVideoSegments: (segments: SceneVideoSegment[]) => void
  updateSceneVideoSegment: (fromIndex: number, updates: Partial<SceneVideoSegment>) => void
  reorderSceneVideoSegments: (oldIndex: number, newIndex: number) => void
  setFinalVideoUrl: (url: string | null) => void

  // Validation
  canProceedToStep2: () => boolean
  canProceedToStep3: () => boolean
  canProceedToStep4: () => boolean
  canProceedToStep5: () => boolean
  canGenerateVideo: () => boolean

  // Reset
  resetWizard: () => void
}

type ProductAdWizardContextType = ProductAdWizardState & ProductAdWizardActions

// ============================================================
// Context 생성
// ============================================================

const ProductAdWizardContext = createContext<ProductAdWizardContextType | null>(null)

// ============================================================
// 기본 시나리오 생성
// ============================================================

const createDefaultScenario = (): ScenarioInfo => ({
  title: '',
  description: '',
  elements: {
    mood: '',
  },
})

// ============================================================
// Provider 컴포넌트
// ============================================================

interface ProductAdWizardProviderProps {
  children: ReactNode
  initialProductId?: string | null
  initialStep?: number
}

export function ProductAdWizardProvider({ children, initialProductId, initialStep }: ProductAdWizardProviderProps) {
  // DB 연동 상태
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // saveDraft 직후 loadDraft 스킵용 flag (URL 업데이트 후 불필요한 재로드 방지)
  const skipNextLoadRef = useRef(false)

  // Step 1 상태 (온보딩에서 전달된 initialStep 사용)
  const [step, setStep] = useState<WizardStep>((initialStep || 1) as WizardStep)
  const [selectedProduct, setSelectedProduct] = useState<AdProduct | null>(null)
  const [editableDescription, setEditableDescription] = useState('')
  const [editableSellingPoints, setEditableSellingPoints] = useState<string[]>([''])

  // Step 2 상태
  const [scenarioMethod, setScenarioMethod] = useState<ScenarioMethod | null>(null)
  const [referenceInfo, setReferenceInfo] = useState<ReferenceInfo | null>(null)
  const [isAnalyzingReference, setIsAnalyzingReference] = useState(false)

  // Step 3 상태
  const [scenarioInfo, setScenarioInfo] = useState<ScenarioInfo | null>(null)
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false)
  const [generatedScenarios, setGeneratedScenarios] = useState<ScenarioInfo[]>([])
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number | null>(null)

  // Step 4 상태
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(null)
  const [duration, setDuration] = useState(3)  // 기본 3초 (레거시)
  const [sceneDurations, setSceneDurations] = useState<number[]>([3, 3, 3])  // 각 씬별 기본 3초
  const [videoResolution, setVideoResolution] = useState<VideoResolution>('720p')  // 영상 해상도
  const [sceneCount, setSceneCountState] = useState(3)  // 씬 개수 기본 3
  const [sceneElements, setSceneElements] = useState<SceneElementOptions[]>([
    createDefaultSceneElement(),
    createDefaultSceneElement(),
    createDefaultSceneElement(),
  ])  // 씬별 광고 요소 (기본 3개 씬)
  const [multiShot, setMultiShot] = useState(false)
  const [videoModel, setVideoModel] = useState<VideoModel>('vidu')  // 기본 Vidu Q3
  const [videoCount, setVideoCount] = useState(1)
  const [isVideoSettingsFromScenario, setIsVideoSettingsFromScenario] = useState(false)  // AI 시나리오 영상 설정 적용 여부
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false)
  const [firstSceneOptions, setFirstSceneOptions] = useState<FirstSceneOption[]>([])
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null)

  // Step 4-5 멀티씬 상태 (Kling O1용)
  const [sceneKeyframes, setSceneKeyframes] = useState<SceneKeyframe[]>([])
  const [isGeneratingKeyframes, setIsGeneratingKeyframes] = useState(false)

  // Step 5 상태
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [videoRequestIds, setVideoRequestIds] = useState<string[]>([])
  const [resultVideoUrls, setResultVideoUrls] = useState<string[]>([])

  // Step 5 멀티씬 상태 (Kling O1용)
  const [sceneVideoSegments, setSceneVideoSegments] = useState<SceneVideoSegment[]>([])
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)

  // 온보딩에서 전달된 초기 제품 로드
  useEffect(() => {
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
            // 편집 가능한 필드도 함께 설정
            if (data.product.description) {
              setEditableDescription(data.product.description)
            }
            if (data.product.selling_points?.length) {
              setEditableSellingPoints(data.product.selling_points)
            }
          }
        })
        .catch(err => console.error('Failed to load initial products:', err))
    }
  }, [initialProductId])

  // Helper functions for video arrays
  const addVideoRequestId = useCallback((id: string) => {
    setVideoRequestIds(prev => [...prev, id])
  }, [])

  const addResultVideoUrl = useCallback((url: string) => {
    setResultVideoUrls(prev => [...prev, url])
  }, [])

  // 셀링 포인트 관리 함수
  const addSellingPoint = useCallback(() => {
    if (editableSellingPoints.length < 10) {
      setEditableSellingPoints(prev => [...prev, ''])
    }
  }, [editableSellingPoints.length])

  const removeSellingPoint = useCallback((index: number) => {
    if (editableSellingPoints.length > 1) {
      setEditableSellingPoints(prev => prev.filter((_, i) => i !== index))
    }
  }, [editableSellingPoints.length])

  const updateSellingPoint = useCallback((index: number, value: string) => {
    setEditableSellingPoints(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }, [])

  // 씬 개수 설정 (sceneDurations, sceneElements도 함께 조정)
  const setSceneCount = useCallback((count: number) => {
    setSceneCountState(count)
    setSceneDurations(prev => {
      if (prev.length === count) return prev
      if (prev.length < count) {
        // 씬 추가: 기본 3초로 채움
        return [...prev, ...Array(count - prev.length).fill(3)]
      }
      // 씬 감소: 앞에서부터 유지
      return prev.slice(0, count)
    })
    // sceneElements도 함께 동기화
    setSceneElements(prev => {
      if (prev.length === count) return prev
      if (prev.length < count) {
        // 씬 추가: 마지막 씬의 설정 복사 또는 기본값
        const lastElement = prev[prev.length - 1] || createDefaultSceneElement()
        return [...prev, ...Array(count - prev.length).fill(null).map(() => ({ ...lastElement }))]
      }
      // 씬 감소: 앞에서부터 유지
      return prev.slice(0, count)
    })
  }, [])

  // 개별 씬 시간 업데이트
  const updateSceneDuration = useCallback((sceneIndex: number, duration: number) => {
    setSceneDurations(prev => {
      const updated = [...prev]
      if (sceneIndex >= 0 && sceneIndex < updated.length) {
        updated[sceneIndex] = Math.max(1, Math.min(16, duration))  // 1-16초 범위 (Vidu Q3)
      }
      return updated
    })
  }, [])

  // 씬별 광고 요소 업데이트
  const updateSceneElement = useCallback((sceneIndex: number, key: keyof SceneElementOptions, value: string) => {
    setSceneElements(prev => {
      const updated = [...prev]
      if (sceneIndex >= 0 && sceneIndex < updated.length) {
        updated[sceneIndex] = { ...updated[sceneIndex], [key]: value }
      }
      return updated
    })
  }, [])

  // 특정 씬의 설정을 모든 씬에 일괄 적용
  const applySceneElementToAll = useCallback((sourceIndex: number) => {
    setSceneElements(prev => {
      if (sourceIndex < 0 || sourceIndex >= prev.length) return prev
      const sourceElement = prev[sourceIndex]
      return prev.map(() => ({ ...sourceElement }))
    })
  }, [])

  // AI 시나리오에서 영상 설정 적용
  const applyVideoSettingsFromScenario = useCallback((settings: RecommendedVideoSettings) => {
    setAspectRatio(settings.aspectRatio)
    setSceneCountState(settings.sceneCount)
    setSceneDurations(settings.sceneDurations)
    setIsVideoSettingsFromScenario(true)
  }, [])

  // 영상 설정 잠금 해제 (사용자가 직접 수정할 수 있도록)
  const unlockVideoSettings = useCallback(() => {
    setIsVideoSettingsFromScenario(false)
  }, [])

  // ============================================================
  // Actions
  // ============================================================

  // 시나리오 요소 업데이트 (주로 mood만 사용)
  const updateScenarioElement = useCallback((key: keyof AdElementOptions, value: string) => {
    setScenarioInfo(prev => {
      if (!prev) {
        const newScenario = createDefaultScenario()
        // mood는 항상 존재
        if (key === 'mood') {
          newScenario.elements.mood = value
        }
        return newScenario
      }
      return {
        ...prev,
        elements: { ...prev.elements, [key]: value } as ScenarioElements | AdElementOptions,
      }
    })
  }, [])

  // 첫 씬 옵션 업데이트
  const updateFirstSceneOption = useCallback((index: number, updates: Partial<FirstSceneOption>) => {
    setFirstSceneOptions(prev =>
      prev.map(opt => opt.index === index ? { ...opt, ...updates } : opt)
    )
  }, [])

  // 씬 키프레임 업데이트 (Kling O1용)
  const updateSceneKeyframe = useCallback((sceneIndex: number, updates: Partial<SceneKeyframe>) => {
    setSceneKeyframes(prev =>
      prev.map(kf => kf.sceneIndex === sceneIndex ? { ...kf, ...updates } : kf)
    )
  }, [])

  // 씬 키프레임 순서 변경 (드래그앤드롭)
  const reorderSceneKeyframes = useCallback((oldIndex: number, newIndex: number) => {
    setSceneKeyframes(prev => {
      const result = [...prev]
      const [removed] = result.splice(oldIndex, 1)
      result.splice(newIndex, 0, removed)
      // 순서 변경 후 sceneIndex 재할당
      return result.map((kf, idx) => ({ ...kf, sceneIndex: idx }))
    })
    // scenarioInfo의 scenes도 함께 재정렬
    setScenarioInfo(prev => {
      if (!prev?.scenes) return prev
      const newScenes = [...prev.scenes]
      const [removed] = newScenes.splice(oldIndex, 1)
      newScenes.splice(newIndex, 0, removed)
      return {
        ...prev,
        scenes: newScenes.map((s, idx) => ({ ...s, index: idx })),
      }
    })
  }, [])

  // 씬 전환 영상 세그먼트 업데이트 (Kling O1용)
  const updateSceneVideoSegment = useCallback((fromIndex: number, updates: Partial<SceneVideoSegment>) => {
    setSceneVideoSegments(prev =>
      prev.map(seg => seg.fromSceneIndex === fromIndex ? { ...seg, ...updates } : seg)
    )
  }, [])

  // 씬 영상 세그먼트 순서 변경 (드래그앤드롭)
  const reorderSceneVideoSegments = useCallback((oldIndex: number, newIndex: number) => {
    setSceneVideoSegments(prev => {
      const result = [...prev]
      const [removed] = result.splice(oldIndex, 1)
      result.splice(newIndex, 0, removed)
      // 순서 변경 후 fromSceneIndex 재할당
      return result.map((seg, idx) => ({
        ...seg,
        fromSceneIndex: idx,
        toSceneIndex: idx + 1,
      }))
    })
  }, [])

  // Draft 저장
  const saveDraft = useCallback(async (additionalData?: Record<string, unknown>): Promise<string | null> => {
    setIsSaving(true)
    try {
      const payload = {
        id: draftId,
        category: 'productAd',
        wizardStep: step,
        productId: selectedProduct?.id,
        productInfo: selectedProduct ? JSON.stringify(selectedProduct) : null,
        scenarioMethod,
        referenceInfo: referenceInfo ? JSON.stringify(referenceInfo) : null,
        // 시나리오 정보에 영상 설정과 씬별 요소도 함께 저장
        scenarioInfo: scenarioInfo ? JSON.stringify({
          ...scenarioInfo,
          _videoSettings: { videoResolution, videoModel, sceneCount, sceneDurations },
          _sceneElements: sceneElements,  // 씬별 광고 요소
        }) : null,
        aspectRatio,
        duration,
        firstSceneOptions: firstSceneOptions.length > 0 ? JSON.stringify(firstSceneOptions) : null,
        selectedSceneIndex,
        videoRequestId: videoRequestIds[0] || null,  // 첫 번째 요청 ID (호환성)
        videoUrl: resultVideoUrls[0] || null,  // 첫 번째 결과 URL (호환성)
        videoRequestIds: videoRequestIds.length > 0 ? JSON.stringify(videoRequestIds) : null,
        videoUrls: resultVideoUrls.length > 0 ? JSON.stringify(resultVideoUrls) : null,
        // MultiScene 데이터: 모든 키프레임 상태 저장 (진행 중인 것도 포함)
        sceneKeyframes: sceneKeyframes.length > 0 ? sceneKeyframes : null,
        // 씬 비디오 세그먼트도 전체 저장 (진행 중인 것도 포함하여 재개 가능)
        sceneVideoUrls: sceneVideoSegments.length > 0
          ? sceneVideoSegments.map(s => ({
              sceneIndex: s.fromSceneIndex,
              requestId: s.requestId,
              videoUrl: s.videoUrl,
              status: s.status,
            }))
          : null,
        ...additionalData,
      }

      const res = await fetch('/api/product-ad/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Failed to save draft')
      }

      const data = await res.json()
      if (data.draft?.id) {
        const isNewDraft = !draftId
        setDraftId(data.draft.id)

        // 새 draft 생성 시 URL 업데이트 (replaceState로 리마운트 방지)
        if (isNewDraft && typeof window !== 'undefined') {
          skipNextLoadRef.current = true
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.set('videoAdId', data.draft.id)
          window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search)
        }

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
    draftId, step, selectedProduct, scenarioMethod, referenceInfo,
    scenarioInfo, aspectRatio, duration, sceneDurations, videoResolution, videoModel,
    sceneCount, sceneElements, firstSceneOptions, selectedSceneIndex, videoRequestIds,
    resultVideoUrls, sceneKeyframes, sceneVideoSegments
  ])

  // 비동기 Draft 저장 함수 (안정적인 참조 유지)
  const asyncSaveFn = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/product-ad/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error('Failed to save draft')
    }

    const data = await res.json()
    if (data.draft?.id) {
      const isNewDraft = !payload.id
      setDraftId(data.draft.id)

      // 새 draft 생성 시 URL 업데이트
      if (isNewDraft && typeof window !== 'undefined') {
        skipNextLoadRef.current = true
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('videoAdId', data.draft.id)
        window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search)
      }

      return data.draft.id
    }
    return null
  }, [])

  // 비동기 Draft 저장 훅
  const {
    queueSave,
    isSaving: isAsyncSaving,
    pendingSave,
    lastSaveError,
    lastSavedAt,
    flushPending,
    clearError: clearSaveError,
  } = useAsyncDraftSave(asyncSaveFn, {
    debounceMs: 300,
    maxRetries: 3,
    retryDelayMs: 1000,
  })

  // 비동기 Draft 저장 (단계 전환 시 사용)
  const saveDraftAsync = useCallback((additionalData?: Record<string, unknown>) => {
    const payload = {
      id: draftId,
      category: 'productAd',
      wizardStep: step,
      productId: selectedProduct?.id,
      productInfo: selectedProduct ? JSON.stringify(selectedProduct) : null,
      scenarioMethod,
      referenceInfo: referenceInfo ? JSON.stringify(referenceInfo) : null,
      scenarioInfo: scenarioInfo ? JSON.stringify({
        ...scenarioInfo,
        _videoSettings: { videoResolution, videoModel, sceneCount, sceneDurations },
      }) : null,
      aspectRatio,
      duration,
      firstSceneOptions: firstSceneOptions.length > 0 ? JSON.stringify(firstSceneOptions) : null,
      selectedSceneIndex,
      videoRequestId: videoRequestIds[0] || null,
      videoUrl: resultVideoUrls[0] || null,
      videoRequestIds: videoRequestIds.length > 0 ? JSON.stringify(videoRequestIds) : null,
      videoUrls: resultVideoUrls.length > 0 ? JSON.stringify(resultVideoUrls) : null,
      sceneKeyframes: sceneKeyframes.length > 0 ? sceneKeyframes : null,
      sceneVideoUrls: sceneVideoSegments.length > 0
        ? sceneVideoSegments.map(s => ({
            sceneIndex: s.fromSceneIndex,
            requestId: s.requestId,
            videoUrl: s.videoUrl,
            status: s.status,
          }))
        : null,
      ...additionalData,
    }

    queueSave(payload)
  }, [
    draftId, step, selectedProduct, scenarioMethod, referenceInfo,
    scenarioInfo, aspectRatio, duration, sceneDurations, videoResolution, videoModel,
    sceneCount, firstSceneOptions, selectedSceneIndex, videoRequestIds,
    resultVideoUrls, sceneKeyframes, sceneVideoSegments, queueSave
  ])

  // 대기 중인 저장 즉시 실행
  const flushPendingSave = useCallback(async () => {
    await flushPending()
  }, [flushPending])

  // isSaving 상태 통합 (동기 + 비동기)
  const combinedIsSaving = isSaving || isAsyncSaving

  // Draft 로드
  const loadDraft = useCallback(async (id: string): Promise<boolean> => {
    // saveDraft 직후 호출 시 스킵 (이미 Context에 최신 상태가 있음)
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false
      return true
    }

    try {
      const res = await fetch(`/api/product-ad/draft?id=${id}`)
      if (!res.ok) return false

      const data = await res.json()
      const draft = data.draft
      if (!draft) return false

      setDraftId(draft.id)
      setStep((draft.wizard_step || 1) as WizardStep)

      if (draft.product_info) {
        // JSON으로 저장된 제품 정보 복원
        try {
          const productData = JSON.parse(draft.product_info) as AdProduct
          setSelectedProduct(productData)
        } catch {
          // JSON 파싱 실패 시 (레거시 형식) product_id만 사용
          if (draft.product_id) {
            setSelectedProduct({
              id: draft.product_id,
              name: '',
              rembg_image_url: null,
              image_url: null,
            })
          }
        }
      } else if (draft.product_id) {
        // product_info가 없는 경우 (레거시 호환)
        setSelectedProduct({
          id: draft.product_id,
          name: '',
          rembg_image_url: null,
          image_url: null,
        })
      }

      if (draft.scenario_method) {
        setScenarioMethod(draft.scenario_method as ScenarioMethod)
      }

      if (draft.reference_info) {
        try {
          setReferenceInfo(JSON.parse(draft.reference_info))
        } catch { /* ignore */ }
      }

      if (draft.scenario_info) {
        try {
          const parsed = JSON.parse(draft.scenario_info)
          // 영상 설정 추출 및 복원
          if (parsed._videoSettings) {
            const { videoResolution: vr, videoModel: vm, sceneCount: sc, sceneDurations: sd } = parsed._videoSettings
            if (vr) setVideoResolution(vr as VideoResolution)
            if (vm) setVideoModel(vm as VideoModel)
            if (sc) {
              setSceneCountState(sc)
              // sceneDurations도 함께 복원
              if (sd && Array.isArray(sd)) {
                setSceneDurations(sd)
              } else {
                // sceneDurations가 없으면 sceneCount에 맞게 기본값 생성
                setSceneDurations(Array(sc).fill(3))
              }
            }
          }

          // 씬별 광고 요소 복원
          if (parsed._sceneElements && Array.isArray(parsed._sceneElements)) {
            // 새 형식: 씬별 요소 배열 그대로 복원
            setSceneElements(parsed._sceneElements as SceneElementOptions[])
          } else if (parsed.elements && !parsed._sceneElements) {
            // 레거시 호환: 기존 elements를 새 형식으로 변환
            const legacyElements = parsed.elements as AdElementOptions
            const count = parsed._videoSettings?.sceneCount || 3
            setSceneElements(Array(count).fill(null).map(() => ({
              background: legacyElements.background || '',
              mood: legacyElements.mood || '',
              additionalPrompt: '',
            })))
          }

          // _videoSettings, _sceneElements는 scenarioInfo에서 제거
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _videoSettings, _sceneElements, ...scenarioData } = parsed
          setScenarioInfo(scenarioData as ScenarioInfo)
        } catch { /* ignore */ }
      }

      if (draft.aspect_ratio) setAspectRatio(draft.aspect_ratio as AspectRatio)
      if (draft.duration) setDuration(draft.duration)

      if (draft.first_scene_options) {
        try {
          setFirstSceneOptions(JSON.parse(draft.first_scene_options))
        } catch { /* ignore */ }
      }

      if (draft.selected_scene_index !== null) {
        setSelectedSceneIndex(draft.selected_scene_index)
      }

      // 여러 영상 요청 ID 로드
      if (draft.video_request_ids) {
        try {
          setVideoRequestIds(JSON.parse(draft.video_request_ids))
        } catch {
          if (draft.video_request_id) setVideoRequestIds([draft.video_request_id])
        }
      } else if (draft.video_request_id) {
        setVideoRequestIds([draft.video_request_id])
      }

      // 여러 영상 URL 로드
      if (draft.video_urls) {
        try {
          setResultVideoUrls(JSON.parse(draft.video_urls))
        } catch {
          if (draft.video_url) setResultVideoUrls([draft.video_url])
        }
      } else if (draft.video_url) {
        setResultVideoUrls([draft.video_url])
      }

      // 씬 키프레임 로드 (진행 중인 것도 복원하여 재개 가능)
      if (draft.scene_keyframes) {
        // 문자열인 경우 JSON 파싱 (레거시 호환)
        if (typeof draft.scene_keyframes === 'string') {
          try {
            const parsed = JSON.parse(draft.scene_keyframes)
            if (Array.isArray(parsed)) {
              setSceneKeyframes(parsed as SceneKeyframe[])
            }
          } catch { /* ignore */ }
        } else if (Array.isArray(draft.scene_keyframes)) {
          setSceneKeyframes(draft.scene_keyframes as SceneKeyframe[])
        }
      }

      // 씬 비디오 세그먼트 로드 (진행 중인 것도 복원하여 재개 가능)
      if (draft.scene_video_urls && Array.isArray(draft.scene_video_urls)) {
        const segments: SceneVideoSegment[] = (draft.scene_video_urls as Array<{
          sceneIndex: number
          requestId?: string
          videoUrl?: string
          status?: string
        }>).map((item, idx, arr) => ({
          fromSceneIndex: item.sceneIndex,
          toSceneIndex: idx < arr.length - 1 ? arr[idx + 1].sceneIndex : item.sceneIndex + 1,
          requestId: item.requestId,
          videoUrl: item.videoUrl,
          status: (item.status as SceneVideoSegment['status']) || (item.videoUrl ? 'completed' : 'pending'),
        }))
        setSceneVideoSegments(segments)
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
    return !!selectedProduct
  }, [selectedProduct])

  const canProceedToStep3 = useCallback(() => {
    if (!scenarioMethod) return false
    if (scenarioMethod === 'reference') {
      return !!referenceInfo && !isAnalyzingReference
    }
    return true
  }, [scenarioMethod, referenceInfo, isAnalyzingReference])

  const canProceedToStep4 = useCallback(() => {
    // Step 3 → Step 4 (통합): 시나리오 + 영상 설정 + 씬별 요소 필수
    if (!scenarioInfo) return false
    // 전체 분위기(mood) 필수
    if (!scenarioInfo.elements.mood) return false
    // 비율, 해상도 등 영상 설정 필수
    if (!aspectRatio || !videoResolution) return false
    // 모든 씬의 필수 요소 (background, mood)가 채워져 있어야 함
    if (sceneElements.length === 0) return false
    return sceneElements.every(elem => !!elem.background && !!elem.mood)
  }, [scenarioInfo, aspectRatio, videoResolution, sceneElements])

  const canProceedToStep5 = useCallback(() => {
    // Step 4 → Step 5: 모든 씬 키프레임이 생성되어야 함
    if (isGeneratingKeyframes) return false
    if (sceneKeyframes.length === 0) return false
    return sceneKeyframes.every(kf => kf.status === 'completed' && kf.imageUrl)
  }, [isGeneratingKeyframes, sceneKeyframes])

  const canGenerateVideo = useCallback(() => {
    // Step 6: 영상 생성 가능 조건
    if (isGeneratingVideo) return false
    if (sceneKeyframes.length === 0) return false
    return sceneKeyframes.every(kf => kf.status === 'completed' && kf.imageUrl)
  }, [isGeneratingVideo, sceneKeyframes])

  // ============================================================
  // Navigation
  // ============================================================

  const goToStep = useCallback((targetStep: WizardStep) => {
    setStep(targetStep)
    // 스크롤 최상단으로 이동
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const goToNextStep = useCallback(() => {
    setStep(prev => Math.min(prev + 1, 5) as WizardStep)
    // 스크롤 최상단으로 이동
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const goToPrevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1) as WizardStep)
    // 스크롤 최상단으로 이동
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // ============================================================
  // Reset
  // ============================================================

  const resetWizard = useCallback(() => {
    setDraftId(null)
    setIsSaving(false)
    setStep(1)
    setSelectedProduct(null)
    setEditableDescription('')
    setEditableSellingPoints([''])
    setScenarioMethod(null)
    setReferenceInfo(null)
    setIsAnalyzingReference(false)
    setScenarioInfo(null)
    setIsGeneratingScenario(false)
    setGeneratedScenarios([])
    setSelectedScenarioIndex(null)
    setAspectRatio(null)
    setDuration(3)
    setSceneDurations([3, 3, 3])
    setVideoResolution('720p')
    setSceneCountState(3)
    setSceneElements([
      createDefaultSceneElement(),
      createDefaultSceneElement(),
      createDefaultSceneElement(),
    ])
    setMultiShot(false)
    setVideoCount(1)
    setVideoModel('vidu')
    setIsVideoSettingsFromScenario(false)
    setIsGeneratingScenes(false)
    setFirstSceneOptions([])
    setSelectedSceneIndex(null)
    setSceneKeyframes([])
    setIsGeneratingKeyframes(false)
    setIsGeneratingVideo(false)
    setGenerationProgress(0)
    setVideoRequestIds([])
    setResultVideoUrls([])
    setSceneVideoSegments([])
    setFinalVideoUrl(null)
  }, [])

  // ============================================================
  // Context Value
  // ============================================================

  const value: ProductAdWizardContextType = {
    // State
    draftId,
    isSaving: combinedIsSaving,
    pendingSave,
    lastSaveError,
    lastSavedAt,
    step,
    selectedProduct,
    editableDescription,
    editableSellingPoints,
    scenarioMethod,
    referenceInfo,
    isAnalyzingReference,
    scenarioInfo,
    isGeneratingScenario,
    generatedScenarios,
    selectedScenarioIndex,
    aspectRatio,
    duration,
    sceneDurations,
    videoResolution,
    sceneCount,
    sceneElements,
    multiShot,
    videoCount,
    videoModel,
    isVideoSettingsFromScenario,
    isGeneratingScenes,
    firstSceneOptions,
    selectedSceneIndex,
    sceneKeyframes,
    isGeneratingKeyframes,
    isGeneratingVideo,
    generationProgress,
    videoRequestIds,
    resultVideoUrls,
    sceneVideoSegments,
    finalVideoUrl,

    // Actions
    setDraftId,
    saveDraft,
    saveDraftAsync,
    loadDraft,
    clearSaveError,
    flushPendingSave,
    goToStep,
    goToNextStep,
    goToPrevStep,
    setSelectedProduct,
    setEditableDescription,
    setEditableSellingPoints,
    addSellingPoint,
    removeSellingPoint,
    updateSellingPoint,
    setScenarioMethod,
    setReferenceInfo,
    setIsAnalyzingReference,
    setScenarioInfo,
    setIsGeneratingScenario,
    setGeneratedScenarios,
    setSelectedScenarioIndex,
    updateScenarioElement,
    setAspectRatio,
    setDuration,
    setSceneDurations,
    updateSceneDuration,
    setVideoResolution,
    setSceneCount,
    setSceneElements,
    updateSceneElement,
    applySceneElementToAll,
    setMultiShot,
    setVideoCount,
    setVideoModel,
    applyVideoSettingsFromScenario,
    unlockVideoSettings,
    setIsGeneratingScenes,
    setFirstSceneOptions,
    updateFirstSceneOption,
    setSelectedSceneIndex,
    setSceneKeyframes,
    updateSceneKeyframe,
    reorderSceneKeyframes,
    setIsGeneratingKeyframes,
    setIsGeneratingVideo,
    setGenerationProgress,
    setVideoRequestIds,
    addVideoRequestId,
    setResultVideoUrls,
    addResultVideoUrl,
    setSceneVideoSegments,
    updateSceneVideoSegment,
    reorderSceneVideoSegments,
    setFinalVideoUrl,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    canProceedToStep5,
    canGenerateVideo,
    resetWizard,
  }

  return (
    <ProductAdWizardContext.Provider value={value}>
      {children}
    </ProductAdWizardContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useProductAdWizard() {
  const context = useContext(ProductAdWizardContext)
  if (!context) {
    throw new Error('useProductAdWizard must be used within ProductAdWizardProvider')
  }
  return context
}
