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

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6
export type AspectRatio = '16:9' | '9:16' | '1:1'

// 스토리 방식 선택 타입
export type StoryMethod = 'direct' | 'ai-auto' | 'reference'

// 참조 영상 정보
export interface ReferenceInfo {
  type: 'file' | 'youtube'
  url: string
  file?: File
  analyzedElements?: string[]
  analyzedDescription?: string
}

// Vidu Q2 해상도 타입
export type VideoResolution = '540p' | '720p' | '1080p'
export type MovementAmplitude = 'auto' | 'small' | 'medium' | 'large'

// 씬 정보 (멀티 씬 시나리오의 각 씬)
export interface SceneInfo {
  sceneIndex: number                // 씬 인덱스 (0부터)
  title: string                     // 씬 제목 (한국어)
  description: string               // 씬 설명 (한국어)
  imageSummary: string              // 이미지 프롬프트 요약 (사용자 언어, 표시용)
  videoSummary: string              // 영상 프롬프트 요약 (사용자 언어, 표시용)
  firstFramePrompt: string          // 첫 프레임 생성용 프롬프트 (영어, AI용)
  motionPromptEN: string            // 영상 모션용 프롬프트 (영어, AI용)
  duration: number                  // 씬 길이 (초, 2-5)
  movementAmplitude: MovementAmplitude  // 움직임 강도
  location: string                  // 배경/장소
  mood: string                      // 분위기
}

// 시나리오 추천 설정 (LLM이 시나리오와 함께 생성)
export interface ScenarioRecommendedSettings {
  aspectRatio: AspectRatio
  sceneCount: number
  sceneDurations: number[]
  movementAmplitudes: MovementAmplitude[]
}

// 시나리오 타입 (LLM 생성 - 멀티 씬 지원)
export interface Scenario {
  id: string
  title: string                     // 시나리오 제목 (한국어)
  description: string               // 1-2문장 설명 (한국어)
  concept: string                   // 컨셉/접근법 설명 (한국어)
  productAppearance: string         // 제품 등장 방식 설명 (한국어)
  mood: string                      // 전체 분위기 키워드
  tags: string[]                    // 태그 배열
  // 멀티 씬 정보
  scenes: SceneInfo[]               // 씬 배열
  totalDuration: number             // 총 길이 (초)
  sceneCount?: number               // 씬 개수
  aspectRatio?: AspectRatio         // 화면 비율
  // AI 추천 설정 (완전 시나리오 생성 시)
  recommendedSettings?: ScenarioRecommendedSettings
  // Legacy (단일 씬 호환)
  firstFramePrompt?: string         // 첫 프레임 생성용 프롬프트 (한국어)
  motionPromptEN?: string           // 영상 모션용 프롬프트 (영어)
  location?: string                 // 장소/배경
}

// 씬 키프레임 (생성된 첫 프레임 이미지)
export interface SceneKeyframe {
  sceneIndex: number
  imageUrl: string | null
  requestId: string | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  error?: string
}

// 씬 비디오 (생성된 영상)
export interface SceneVideo {
  sceneIndex: number
  videoUrl: string | null
  requestId: string | null
  provider: 'wavespeed' | 'fal'
  status: 'pending' | 'generating' | 'completed' | 'failed'
  error?: string
}

// AI 추천 설정
export interface AIRecommendedSettings {
  aspectRatio: AspectRatio
  resolution: VideoResolution
  sceneCount: number
  sceneDurations: number[]          // 각 씬별 시간 (초)
  movementAmplitudes: MovementAmplitude[]  // 각 씬별 움직임 강도
  reasoning: string                 // 추천 이유 설명
}

// 이미지 크기 (영상 생성에 영향)
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

  // Step 1: 기본 정보 (아바타 + 제품 필수)
  step: WizardStep
  selectedProduct: AdProduct | null
  selectedAvatarInfo: SelectedAvatarInfo | null

  // Step 2: 스토리 방식 선택 (직접/AI추천/참고)
  storyMethod: StoryMethod | null
  referenceInfo: ReferenceInfo | null
  isAnalyzingReference: boolean

  // Step 3: 시나리오 입력/선택 (AI 추천 모드에서 LLM 생성 3개 중 선택)
  scenarios: Scenario[]
  selectedScenarioIndex: number | null
  isGeneratingScenarios: boolean
  isModifyingScenario: boolean      // 시나리오 수정 중

  // Step 4: 영상 설정 (멀티 씬)
  aspectRatio: AspectRatio
  imageSize: ImageSize            // 이미지 크기 (영상 크기에 영향)
  resolution: VideoResolution     // Vidu Q2 해상도
  sceneCount: number              // 씬 개수 (1-5)
  sceneDurations: number[]        // 씬별 시간 (초, 1-8)
  movementAmplitudes: MovementAmplitude[]  // 씬별 움직임 강도
  additionalPrompt: string        // 추가 프롬프트 (선택사항)
  useAIRecommendation: boolean    // AI 추천 설정 사용 여부
  aiRecommendedSettings: AIRecommendedSettings | null  // AI 추천 설정

  // Step 5: 씬별 첫 프레임 생성
  isGeneratingFrames: boolean
  sceneKeyframes: SceneKeyframe[]  // 씬별 키프레임 이미지
  startFrameUrl: string | null     // Legacy (단일 씬 호환)

  // AI 아바타 생성 (ai-generated 타입 선택 시)
  isGeneratingAvatars: boolean
  generatedAvatarOptions: GeneratedAvatarOption[]
  selectedAiAvatarIndex: number | null
  selectedAiAvatarUrl: string | null
  selectedAiAvatarDescription: string | null

  // Step 6: 씬별 영상 생성 상태 (Vidu Q2)
  isGeneratingVideo: boolean
  generationProgress: number
  sceneVideos: SceneVideo[]        // 씬별 생성된 영상
  isMergingVideos: boolean         // 영상 병합 중
  videoRequestId: string | null    // Legacy (단일 씬 호환)
  resultVideoUrl: string | null    // 최종 합쳐진 영상 URL

  // Legacy (하위 호환성 유지)
  storyInfo: StoryInfo | null
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

  // Step 1 actions (아바타 + 제품)
  setSelectedProduct: (product: AdProduct | null) => void
  setSelectedAvatarInfo: (info: SelectedAvatarInfo | null) => void

  // Step 2 actions (스토리 방식 + 시나리오 선택)
  setStoryMethod: (method: StoryMethod | null) => void
  setReferenceInfo: (info: ReferenceInfo | null) => void
  setIsAnalyzingReference: (loading: boolean) => void
  setScenarios: (scenarios: Scenario[]) => void
  setSelectedScenarioIndex: (index: number | null) => void
  setIsGeneratingScenarios: (loading: boolean) => void
  setIsModifyingScenario: (loading: boolean) => void
  applyScenarioSettings: (scenarioIndex: number) => void  // 시나리오의 추천 설정 적용
  updateScenario: (index: number, scenario: Scenario) => void  // 수정된 시나리오 업데이트

  // Step 3 actions (영상 설정 - 멀티 씬)
  setAspectRatio: (ratio: AspectRatio) => void
  setImageSize: (size: ImageSize) => void
  setResolution: (resolution: VideoResolution) => void
  setSceneCount: (count: number) => void
  setSceneDurations: (durations: number[]) => void
  setMovementAmplitudes: (amplitudes: MovementAmplitude[]) => void
  setAdditionalPrompt: (prompt: string) => void
  setUseAIRecommendation: (use: boolean) => void
  setAIRecommendedSettings: (settings: AIRecommendedSettings | null) => void
  applyAIRecommendation: () => void  // AI 추천 설정 적용

  // Step 4 actions (씬별 첫 프레임 생성)
  setIsGeneratingFrames: (loading: boolean) => void
  setSceneKeyframes: (keyframes: SceneKeyframe[]) => void
  updateSceneKeyframe: (sceneIndex: number, updates: Partial<SceneKeyframe>) => void
  setStartFrameUrl: (url: string | null) => void
  setVideoRequestId: (id: string | null) => void

  // AI Avatar actions
  setIsGeneratingAvatars: (loading: boolean) => void
  setGeneratedAvatarOptions: (avatars: GeneratedAvatarOption[]) => void
  updateAvatarOption: (index: number, updates: Partial<GeneratedAvatarOption>) => void
  selectAiAvatar: (index: number, imageUrl: string, description: string) => void
  resetAiAvatars: () => void

  // Generation actions (Step 5 - 멀티 씬)
  setIsGeneratingVideo: (generating: boolean) => void
  setGenerationProgress: (progress: number) => void
  setSceneVideos: (videos: SceneVideo[]) => void
  updateSceneVideo: (sceneIndex: number, updates: Partial<SceneVideo>) => void
  setIsMergingVideos: (merging: boolean) => void
  setResultVideoUrl: (url: string | null) => void

  // Validation
  canProceedToStep2: () => boolean   // 아바타 + 제품 선택 완료
  canProceedToStep3: () => boolean   // 스토리 방식 선택 완료
  canProceedToStep4: () => boolean   // 시나리오 입력/선택 완료
  canProceedToStep5: () => boolean   // 영상 설정 완료
  canProceedToStep6: () => boolean   // 모든 씬 프레임 생성 완료
  canGenerateVideo: () => boolean
  canMergeVideos: () => boolean      // 모든 씬 영상 생성 완료

  // Helper
  getSelectedScenario: () => Scenario | null
  getTotalDuration: () => number     // 총 영상 길이 계산
  getEstimatedCredits: () => number  // 예상 크레딧 계산

  // Legacy (하위 호환성)
  setStoryInfo: (info: StoryInfo | null) => void

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

// 기본 스토리 생성 함수 (향후 사용 예정)
const _createDefaultStory = (): StoryInfo => ({
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

  // Step 1 상태 (아바타 + 제품 선택)
  const [step, setStep] = useState<WizardStep>(1)
  const [selectedProduct, setSelectedProduct] = useState<AdProduct | null>(null)
  const [selectedAvatarInfo, setSelectedAvatarInfo] = useState<SelectedAvatarInfo | null>(null)

  // Step 2 상태 (스토리 방식 + 시나리오 선택)
  const [storyMethod, setStoryMethod] = useState<StoryMethod | null>(null)
  const [referenceInfo, setReferenceInfo] = useState<ReferenceInfo | null>(null)
  const [isAnalyzingReference, setIsAnalyzingReference] = useState(false)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number | null>(null)
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false)
  const [isModifyingScenario, setIsModifyingScenario] = useState(false)

  // Step 3 상태 (영상 설정 - 멀티 씬)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [imageSize, setImageSize] = useState<ImageSize>('576x1024')  // 9:16 기본값
  const [resolution, setResolution] = useState<VideoResolution>('720p')
  const [sceneCount, setSceneCount] = useState(3)  // 기본 3씬
  const [sceneDurations, setSceneDurations] = useState<number[]>([5, 5, 5])  // 각 씬 5초
  const [movementAmplitudes, setMovementAmplitudes] = useState<MovementAmplitude[]>(['auto', 'auto', 'auto'])
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('')
  const [useAIRecommendation, setUseAIRecommendation] = useState(false)
  const [aiRecommendedSettings, setAIRecommendedSettings] = useState<AIRecommendedSettings | null>(null)

  // Step 4 상태 (씬별 첫 프레임 생성)
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false)
  const [sceneKeyframes, setSceneKeyframes] = useState<SceneKeyframe[]>([])
  const [startFrameUrl, setStartFrameUrl] = useState<string | null>(null)  // Legacy

  // AI 아바타 상태 (ai-generated 타입 선택 시)
  const [isGeneratingAvatars, setIsGeneratingAvatars] = useState(false)
  const [generatedAvatarOptions, setGeneratedAvatarOptions] = useState<GeneratedAvatarOption[]>([])
  const [selectedAiAvatarIndex, setSelectedAiAvatarIndex] = useState<number | null>(null)
  const [selectedAiAvatarUrl, setSelectedAiAvatarUrl] = useState<string | null>(null)
  const [selectedAiAvatarDescription, setSelectedAiAvatarDescription] = useState<string | null>(null)

  // Step 5 상태 (씬별 영상 생성 - Vidu Q2)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [sceneVideos, setSceneVideos] = useState<SceneVideo[]>([])
  const [isMergingVideos, setIsMergingVideos] = useState(false)
  const [videoRequestId, setVideoRequestId] = useState<string | null>(null)  // Legacy
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null)

  // Legacy (하위 호환성)
  const [storyInfo, setStoryInfo] = useState<StoryInfo | null>(null)

  // ============================================================
  // Actions
  // ============================================================

  // 선택된 시나리오 반환
  const getSelectedScenario = useCallback((): Scenario | null => {
    if (selectedScenarioIndex === null || selectedScenarioIndex < 0 || selectedScenarioIndex >= scenarios.length) {
      return null
    }
    return scenarios[selectedScenarioIndex]
  }, [scenarios, selectedScenarioIndex])

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

  // 씬 키프레임 업데이트
  const updateSceneKeyframe = useCallback((sceneIndex: number, updates: Partial<SceneKeyframe>) => {
    setSceneKeyframes(prev =>
      prev.map(kf =>
        kf.sceneIndex === sceneIndex ? { ...kf, ...updates } : kf
      )
    )
  }, [])

  // 씬 비디오 업데이트
  const updateSceneVideo = useCallback((sceneIndex: number, updates: Partial<SceneVideo>) => {
    setSceneVideos(prev =>
      prev.map(sv =>
        sv.sceneIndex === sceneIndex ? { ...sv, ...updates } : sv
      )
    )
  }, [])

  // AI 추천 설정 적용
  const applyAIRecommendation = useCallback(() => {
    if (!aiRecommendedSettings) return

    setAspectRatio(aiRecommendedSettings.aspectRatio)
    setResolution(aiRecommendedSettings.resolution)
    setSceneCount(aiRecommendedSettings.sceneCount)

    // undefined 체크 후 적용
    if (aiRecommendedSettings.sceneDurations && aiRecommendedSettings.sceneDurations.length > 0) {
      setSceneDurations(aiRecommendedSettings.sceneDurations)
    }
    if (aiRecommendedSettings.movementAmplitudes && aiRecommendedSettings.movementAmplitudes.length > 0) {
      setMovementAmplitudes(aiRecommendedSettings.movementAmplitudes)
    }

    // 이미지 크기도 비율에 맞게 설정
    const sizeMap: Record<AspectRatio, ImageSize> = {
      '16:9': '1024x576',
      '9:16': '576x1024',
      '1:1': '768x768',
    }
    setImageSize(sizeMap[aiRecommendedSettings.aspectRatio])
  }, [aiRecommendedSettings])

  // 시나리오의 추천 설정 적용 (AI 추천 모드에서 시나리오 선택 시)
  const applyScenarioSettings = useCallback((scenarioIndex: number) => {
    const scenario = scenarios[scenarioIndex]
    if (!scenario?.recommendedSettings) return

    const settings = scenario.recommendedSettings
    setAspectRatio(settings.aspectRatio)
    setSceneCount(settings.sceneCount)

    // 씬에서 duration과 movementAmplitude 추출 (recommendedSettings에 없을 수 있음)
    if (settings.sceneDurations && settings.sceneDurations.length > 0) {
      setSceneDurations(settings.sceneDurations)
    } else if (scenario.scenes && scenario.scenes.length > 0) {
      // 씬에서 추출
      const durations = scenario.scenes.map(s => s.duration || 2)
      setSceneDurations(durations)
    }

    if (settings.movementAmplitudes && settings.movementAmplitudes.length > 0) {
      setMovementAmplitudes(settings.movementAmplitudes)
    } else if (scenario.scenes && scenario.scenes.length > 0) {
      // 씬에서 추출
      const amplitudes = scenario.scenes.map(s => (s.movementAmplitude as MovementAmplitude) || 'medium')
      setMovementAmplitudes(amplitudes)
    }

    // 이미지 크기도 비율에 맞게 설정
    const sizeMap: Record<AspectRatio, ImageSize> = {
      '16:9': '1024x576',
      '9:16': '576x1024',
      '1:1': '768x768',
    }
    setImageSize(sizeMap[settings.aspectRatio])
  }, [scenarios])

  // 수정된 시나리오 업데이트
  const updateScenario = useCallback((index: number, scenario: Scenario) => {
    setScenarios(prev => prev.map((s, i) => i === index ? scenario : s))
  }, [])

  // 총 영상 길이 계산
  const getTotalDuration = useCallback(() => {
    if (!sceneDurations || sceneDurations.length === 0) {
      return sceneCount * 2 // 기본값: 씬당 2초
    }
    return sceneDurations.slice(0, sceneCount).reduce((sum, d) => sum + d, 0)
  }, [sceneDurations, sceneCount])

  // 예상 크레딧 계산 (Vidu Q2 기준)
  const getEstimatedCredits = useCallback(() => {
    const totalDuration = getTotalDuration()
    const creditsPerSecond: Record<VideoResolution, number> = {
      '540p': 5,
      '720p': 8,
      '1080p': 12,
    }
    return totalDuration * creditsPerSecond[resolution]
  }, [getTotalDuration, resolution])

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

      // 선택된 시나리오를 storyInfo로 변환 (하위 호환성)
      const selectedScenario = selectedScenarioIndex !== null ? scenarios[selectedScenarioIndex] : null
      const storyInfoForSave: StoryInfo | null = selectedScenario ? {
        title: selectedScenario.title,
        description: selectedScenario.description,
        concept: selectedScenario.concept,
        background: selectedScenario.location,
        mood: selectedScenario.mood,
        motionPromptEN: selectedScenario.motionPromptEN,
        startFrame: {
          id: 'start',
          order: 1,
          description: selectedScenario.firstFramePrompt || '',
        },
      } : null

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
        scenarios,
        selectedScenarioIndex,
        storyInfo: storyInfoForSave,
        aspectRatio,
        imageSize,
        resolution,
        sceneCount,
        sceneDurations,
        movementAmplitudes,
        additionalPrompt,
        sceneKeyframes,
        sceneVideos,
        startFrameUrl,
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
    scenarios,
    selectedScenarioIndex,
    aspectRatio,
    imageSize,
    resolution,
    sceneCount,
    sceneDurations,
    movementAmplitudes,
    additionalPrompt,
    sceneKeyframes,
    sceneVideos,
    startFrameUrl,
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
        const isAiGenerated = draft.avatar_id === 'ai-generated' || (!draft.avatar_id && draft.ai_avatar_options)
        let aiOptions = null
        try {
          aiOptions = draft.ai_avatar_options ? JSON.parse(draft.ai_avatar_options) : null
        } catch {
          // JSON 파싱 실패 시 무시
        }

        if (isAiGenerated && aiOptions) {
          // AI 생성 아바타 복원
          setSelectedAvatarInfo({
            type: 'ai-generated',
            avatarId: '',
            avatarName: 'AI 생성 아바타',
            outfitId: undefined,
            imageUrl: aiOptions.imageUrl || draft.avatar_image_url || '',
            displayName: 'AI 생성 아바타',
          })
          setSelectedAiAvatarIndex(aiOptions.index)
          setSelectedAiAvatarUrl(aiOptions.imageUrl)
          setSelectedAiAvatarDescription(aiOptions.description)
          if (aiOptions.options) {
            setGeneratedAvatarOptions(aiOptions.options)
          }
        } else if (draft.avatar_id && draft.avatar_id !== 'ai-generated') {
          // 일반 아바타 복원 (API로 완전한 정보 불러오기)
          try {
            const avatarRes = await fetch(`/api/avatars/${draft.avatar_id}`)
            if (avatarRes.ok) {
              const avatarData = await avatarRes.json()
              const avatar = avatarData.avatar

              // outfit_id가 있으면 의상 정보도 불러오기
              let outfitImageUrl = draft.avatar_image_url
              if (draft.outfit_id && avatar?.outfits) {
                const outfit = avatar.outfits.find((o: { id: string }) => o.id === draft.outfit_id)
                if (outfit?.image_url) {
                  outfitImageUrl = outfit.image_url
                }
              }

              setSelectedAvatarInfo({
                type: draft.outfit_id ? 'outfit' : 'avatar',
                avatarId: draft.avatar_id,
                avatarName: avatar?.name || '아바타',
                outfitId: draft.outfit_id,
                imageUrl: outfitImageUrl || avatar?.image_url || '',
                displayName: avatar?.name || '아바타',
              })
            }
          } catch (error) {
            console.error('아바타 정보 로드 오류:', error)
            // 최소한의 정보로 설정
            setSelectedAvatarInfo({
              type: draft.outfit_id ? 'outfit' : 'avatar',
              avatarId: draft.avatar_id,
              avatarName: '아바타',
              outfitId: draft.outfit_id,
              imageUrl: draft.avatar_image_url || '',
              displayName: '아바타',
            })
          }
        }
      }

      // 제품 정보 복원 (API로 완전한 정보 불러오기)
      if (draft.product_id) {
        try {
          const productRes = await fetch(`/api/ad-products/${draft.product_id}`)
          if (productRes.ok) {
            const productData = await productRes.json()
            if (productData.product) {
              setSelectedProduct({
                id: productData.product.id,
                name: productData.product.name || '',
                description: productData.product.description || '',
                selling_points: productData.product.selling_points || [],
                rembg_image_url: productData.product.rembg_image_url,
                image_url: productData.product.image_url,
              })
            }
          }
        } catch (error) {
          console.error('제품 정보 로드 오류:', error)
          // 최소한의 정보로 설정
          setSelectedProduct({
            id: draft.product_id,
            name: '제품',
            rembg_image_url: null,
            image_url: null,
          })
        }
      }

      // 스토리 방식 복원
      if (draft.story_method) {
        setStoryMethod(draft.story_method as StoryMethod)
      }

      // 시나리오 정보 복원
      if (draft.scenarios) {
        setScenarios(draft.scenarios as Scenario[])
      }
      if (typeof draft.selected_scenario_index === 'number') {
        setSelectedScenarioIndex(draft.selected_scenario_index)
      }

      // 영상 설정 정보 복원
      if (draft.aspect_ratio) {
        setAspectRatio(draft.aspect_ratio as AspectRatio)
      }
      if (draft.image_size) {
        setImageSize(draft.image_size as ImageSize)
      }
      if (draft.resolution) {
        setResolution(draft.resolution as VideoResolution)
      }
      if (typeof draft.scene_count === 'number') {
        setSceneCount(draft.scene_count)
      }
      if (Array.isArray(draft.scene_durations)) {
        setSceneDurations(draft.scene_durations)
      }
      if (Array.isArray(draft.movement_amplitudes)) {
        setMovementAmplitudes(draft.movement_amplitudes)
      }
      if (draft.additional_prompt) {
        setAdditionalPrompt(draft.additional_prompt)
      }

      // 씬별 키프레임/영상 정보 복원
      if (Array.isArray(draft.scene_keyframes)) {
        setSceneKeyframes(draft.scene_keyframes)
      }
      if (Array.isArray(draft.scene_videos)) {
        setSceneVideos(draft.scene_videos)
      }

      // Legacy 프레임/영상 정보 복원
      if (draft.start_frame_url) {
        setStartFrameUrl(draft.start_frame_url)
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
    // 아바타 + 제품 모두 필수
    return !!selectedAvatarInfo && !!selectedProduct
  }, [selectedAvatarInfo, selectedProduct])

  const canProceedToStep3 = useCallback(() => {
    // 스토리 방식이 선택되어야 함
    return !!storyMethod
  }, [storyMethod])

  const canProceedToStep4 = useCallback(() => {
    // 스토리 방식에 따른 시나리오 입력/선택이 완료되어야 함
    if (!storyMethod) return false

    // 직접 입력: 방식만 선택하면 됨 (Step 3에서 직접 입력)
    if (storyMethod === 'direct') return true

    // AI 추천: 시나리오가 생성되고 선택되어야 함
    if (storyMethod === 'ai-auto') {
      if (isGeneratingScenarios) return false
      return selectedScenarioIndex !== null && scenarios.length > 0
    }

    // 참조 영상: 영상이 분석 완료되어야 함
    if (storyMethod === 'reference') {
      if (isAnalyzingReference) return false
      return referenceInfo !== null && referenceInfo.analyzedDescription !== undefined
    }

    return false
  }, [storyMethod, isGeneratingScenarios, selectedScenarioIndex, scenarios, isAnalyzingReference, referenceInfo])

  const canProceedToStep5 = useCallback(() => {
    // 영상 설정이 완료되어야 함 (기본값이 있으므로 항상 true)
    return canProceedToStep4()
  }, [canProceedToStep4])

  const canProceedToStep6 = useCallback(() => {
    // 모든 씬의 첫 프레임 이미지가 생성되어야 함
    if (isGeneratingFrames) return false
    if (sceneKeyframes.length === 0) return false
    return sceneKeyframes.every(kf => kf.status === 'completed' && kf.imageUrl)
  }, [isGeneratingFrames, sceneKeyframes])

  const canGenerateVideo = useCallback(() => {
    // 모든 씬 키프레임이 완료되어 있고, 영상 생성 중이 아니어야 함
    if (isGeneratingVideo) return false
    return canProceedToStep6()
  }, [isGeneratingVideo, canProceedToStep6])

  const canMergeVideos = useCallback(() => {
    // 모든 씬 영상이 생성되어 있어야 함
    if (isMergingVideos) return false
    if (sceneVideos.length === 0) return false
    return sceneVideos.every(sv => sv.status === 'completed' && sv.videoUrl)
  }, [isMergingVideos, sceneVideos])

  // ============================================================
  // Navigation
  // ============================================================

  const goToStep = useCallback((targetStep: WizardStep) => {
    setStep(targetStep)
  }, [])

  const goToNextStep = useCallback(() => {
    setStep(prev => Math.min(prev + 1, 6) as WizardStep)
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
    // Step 1 상태 (아바타 + 제품)
    setStep(1)
    setSelectedProduct(null)
    setSelectedAvatarInfo(null)
    // Step 2 상태 (스토리 방식 + 시나리오)
    setStoryMethod(null)
    setReferenceInfo(null)
    setIsAnalyzingReference(false)
    setScenarios([])
    setSelectedScenarioIndex(null)
    setIsGeneratingScenarios(false)
    setIsModifyingScenario(false)
    // Step 3 상태 (영상 설정 - 멀티 씬)
    setAspectRatio('9:16')
    setImageSize('576x1024')
    setResolution('720p')
    setSceneCount(3)
    setSceneDurations([5, 5, 5])
    setMovementAmplitudes(['auto', 'auto', 'auto'])
    setAdditionalPrompt('')
    setUseAIRecommendation(false)
    setAIRecommendedSettings(null)
    // Step 4 상태 (씬별 첫 프레임 생성)
    setIsGeneratingFrames(false)
    setSceneKeyframes([])
    setStartFrameUrl(null)
    // AI 아바타 상태 초기화
    setIsGeneratingAvatars(false)
    setGeneratedAvatarOptions([])
    setSelectedAiAvatarIndex(null)
    setSelectedAiAvatarUrl(null)
    setSelectedAiAvatarDescription(null)
    // Step 5 영상 생성 상태
    setIsGeneratingVideo(false)
    setGenerationProgress(0)
    setSceneVideos([])
    setIsMergingVideos(false)
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

    // Step 1 상태 (아바타 + 제품)
    step,
    selectedProduct,
    selectedAvatarInfo,

    // Step 2 상태 (스토리 방식 + 시나리오)
    storyMethod,
    referenceInfo,
    isAnalyzingReference,
    scenarios,
    selectedScenarioIndex,
    isGeneratingScenarios,
    isModifyingScenario,

    // Step 3 상태 (영상 설정 - 멀티 씬)
    aspectRatio,
    imageSize,
    resolution,
    sceneCount,
    sceneDurations,
    movementAmplitudes,
    additionalPrompt,
    useAIRecommendation,
    aiRecommendedSettings,

    // Step 4 상태 (씬별 첫 프레임 생성)
    isGeneratingFrames,
    sceneKeyframes,
    startFrameUrl,

    // AI 아바타 상태
    isGeneratingAvatars,
    generatedAvatarOptions,
    selectedAiAvatarIndex,
    selectedAiAvatarUrl,
    selectedAiAvatarDescription,

    // Step 5 상태 (씬별 영상 생성)
    isGeneratingVideo,
    generationProgress,
    sceneVideos,
    isMergingVideos,
    videoRequestId,
    resultVideoUrl,

    // Legacy (하위 호환성)
    storyInfo,

    // DB 연동 액션
    setDraftId,
    saveDraft,
    loadDraft,

    // Navigation 액션
    goToStep,
    goToNextStep,
    goToPrevStep,

    // Step 1 액션
    setSelectedProduct,
    setSelectedAvatarInfo,

    // Step 2 액션 (스토리 방식 + 시나리오)
    setStoryMethod,
    setReferenceInfo,
    setIsAnalyzingReference,
    setScenarios,
    setSelectedScenarioIndex,
    setIsGeneratingScenarios,
    setIsModifyingScenario,
    applyScenarioSettings,
    updateScenario,

    // Step 3 액션 (영상 설정 - 멀티 씬)
    setAspectRatio,
    setImageSize,
    setResolution,
    setSceneCount,
    setSceneDurations,
    setMovementAmplitudes,
    setAdditionalPrompt,
    setUseAIRecommendation,
    setAIRecommendedSettings,
    applyAIRecommendation,

    // Step 4 액션 (씬별 첫 프레임 생성)
    setIsGeneratingFrames,
    setSceneKeyframes,
    updateSceneKeyframe,
    setStartFrameUrl,
    setVideoRequestId,

    // AI 아바타 액션
    setIsGeneratingAvatars,
    setGeneratedAvatarOptions,
    updateAvatarOption,
    selectAiAvatar,
    resetAiAvatars,

    // Step 5 액션 (씬별 영상 생성)
    setIsGeneratingVideo,
    setGenerationProgress,
    setSceneVideos,
    updateSceneVideo,
    setIsMergingVideos,
    setResultVideoUrl,

    // Validation
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    canProceedToStep5,
    canProceedToStep6,
    canGenerateVideo,
    canMergeVideos,

    // Helper
    getSelectedScenario,
    getTotalDuration,
    getEstimatedCredits,

    // Legacy
    setStoryInfo,

    // Reset
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
