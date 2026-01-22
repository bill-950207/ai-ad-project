/**
 * 제품 설명 영상 마법사 컴포넌트
 *
 * 4단계 마법사:
 * 1. 제품/아바타 선택 + 장소 입력
 * 2. 제품 정보 입력 + 영상 길이/구도 선택
 * 3. 첫 프레임 이미지 선택(2개 중) + 대본 선택/편집 + 음성 선택
 * 4. 영상 생성 (Infinitalk)
 */

'use client'

import { useLanguage } from '@/contexts/language-context'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Edit3,
  Expand,
  Globe,
  Loader2,
  MapPin,
  Minus,
  Package,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Shirt,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AvatarSelectModal, SelectedAvatarInfo } from './avatar-select-modal'

// ============================================================
// 타입 정의
// ============================================================

interface AdProduct {
  id: string
  name: string
  rembg_image_url: string | null
  image_url: string | null
  // 제품 정보 필드
  description: string | null
  selling_points: string[] | null
  brand: string | null
  price: string | null
  source_url: string | null
}

// Avatar interface removed - now using SelectedAvatarInfo from modal

interface Script {
  style: string
  styleName: string
  content: string
  estimatedDuration: number
}

interface Voice {
  id: string
  name: string
  description: string
  gender: 'male' | 'female'
  style: string
  sampleText: string
  previewUrl: string | null
}

type WizardStep = 1 | 2 | 3 | 4
type VideoDuration = 15 | 30 | 60

// 카메라 구도 타입 (셀카는 각도별로 세분화)
type CameraComposition = 'auto' | 'selfie-high' | 'selfie-front' | 'selfie-side' | 'tripod' | 'closeup' | 'fullbody' | 'ugc-closeup'

// 카메라 구도 정보 (예시 이미지 포함)
interface CameraCompositionInfo {
  label: string
  desc: string
  exampleImage: string  // mock 이미지 경로
  category?: 'selfie'   // 셀카 카테고리 표시
}

const cameraCompositionLabels: Record<CameraComposition, CameraCompositionInfo> = {
  auto: {
    label: '자동',
    desc: 'AI가 자연스러운 구도 선택',
    exampleImage: '/images/camera/auto.png',
  },
  'selfie-high': {
    label: '위에서',
    desc: '위에서 아래로 내려다보는 셀카',
    exampleImage: '/images/camera/selfie-high.png',
    category: 'selfie',
  },
  'selfie-front': {
    label: '정면',
    desc: '눈높이에서 정면으로 촬영',
    exampleImage: '/images/camera/selfie-front.png',
    category: 'selfie',
  },
  'selfie-side': {
    label: '측면',
    desc: '약간 측면에서 촬영',
    exampleImage: '/images/camera/selfie-side.png',
    category: 'selfie',
  },
  tripod: {
    label: '삼각대',
    desc: '카메라 설치 후 정면 촬영',
    exampleImage: '/images/camera/tripod.png',
  },
  closeup: {
    label: '클로즈업',
    desc: '얼굴 위주 가까운 촬영',
    exampleImage: '/images/camera/closeup.png',
  },
  fullbody: {
    label: '전신',
    desc: '전신이 보이는 구도',
    exampleImage: '/images/camera/fullbody.png',
  },
  'ugc-closeup': {
    label: 'UGC 클로즈업',
    desc: '인플루언서 스타일, 가슴 위부터 얼굴까지 가깝게',
    exampleImage: '/images/camera/ugc-closeup.png',
  },
}

// 카메라 구도 그룹화 (UI 표시용)
const cameraCompositionGroups = [
  { key: 'basic', label: '기본', compositions: ['auto', 'tripod', 'closeup', 'fullbody'] as CameraComposition[] },
  { key: 'selfie', label: '셀카', compositions: ['selfie-high', 'selfie-front', 'selfie-side'] as CameraComposition[] },
  { key: 'ugc', label: 'UGC', compositions: ['ugc-closeup'] as CameraComposition[] },
]

// 모델 포즈 타입
type ModelPose = 'auto' | 'holding-product' | 'showing-product' | 'using-product' | 'talking-only'

// 모델 포즈 정보
interface ModelPoseInfo {
  label: string
  desc: string
}

const modelPoseLabels: Record<ModelPose, ModelPoseInfo> = {
  auto: {
    label: '자동',
    desc: 'AI가 제품에 맞는 포즈 선택',
  },
  'holding-product': {
    label: '제품 들기',
    desc: '제품을 손에 들고 보여주기',
  },
  'showing-product': {
    label: '제품 제시',
    desc: '제품을 카메라 앞에 제시하기',
  },
  'using-product': {
    label: '제품 사용',
    desc: '제품을 직접 사용하는 모습',
  },
  'talking-only': {
    label: '말로만 설명',
    desc: '제품 없이 말로만 설명하기',
  },
}

// 모델 포즈 목록 (UI 표시용)
const modelPoseOptions: ModelPose[] = ['auto', 'holding-product', 'showing-product', 'using-product', 'talking-only']

// 의상 설정 모드 타입
type OutfitMode = 'keep_original' | 'ai_recommend' | 'preset' | 'custom'

// 의상 프리셋 타입
type OutfitPreset = 'casual_everyday' | 'formal_elegant' | 'professional_business' | 'sporty_athletic' | 'cozy_comfortable' | 'trendy_fashion' | 'minimal_simple'

// AI 추천 의상 정보 타입
interface RecommendedOutfit {
  description: string           // 의상 설명 (영어, 프롬프트용)
  koreanDescription: string     // 의상 설명 (한국어, 사용자 표시용)
  reason: string                // 추천 이유 (한국어)
}

// 의상 프리셋 정보
interface OutfitPresetInfo {
  label: string
  desc: string
}

const outfitPresetLabels: Record<OutfitPreset, OutfitPresetInfo> = {
  casual_everyday: {
    label: '캐주얼',
    desc: '편안한 티셔츠, 청바지 등 일상적인 스타일',
  },
  formal_elegant: {
    label: '포멀/우아',
    desc: '세련된 드레스나 정장, 고급스러운 분위기',
  },
  professional_business: {
    label: '비즈니스',
    desc: '전문적인 비즈니스 정장, 깔끔한 셔츠',
  },
  sporty_athletic: {
    label: '스포티',
    desc: '운동복, 애슬레저 스타일',
  },
  cozy_comfortable: {
    label: '편안한',
    desc: '니트, 가디건 등 따뜻하고 편안한 스타일',
  },
  trendy_fashion: {
    label: '트렌디',
    desc: '최신 유행 스타일, 패셔너블한 룩',
  },
  minimal_simple: {
    label: '미니멀',
    desc: '심플한 단색 의상, 절제된 우아함',
  },
}

// 의상 프리셋 목록
const outfitPresetOptions: OutfitPreset[] = ['casual_everyday', 'formal_elegant', 'professional_business', 'sporty_athletic', 'cozy_comfortable', 'trendy_fashion', 'minimal_simple']

// ============================================================
// 컴포넌트
// ============================================================

interface DraftData {
  id: string
  wizard_step: number
  avatar_id: string | null
  outfit_id: string | null
  avatar_image_url: string | null
  ai_avatar_options: string | null  // AI 아바타 옵션 JSON
  product_id: string | null
  product_info: string | null
  location_prompt: string | null
  duration: number | null
  video_background: string | null
  camera_composition: string | null
  model_pose: string | null
  outfit_mode: string | null
  outfit_preset: string | null
  outfit_custom: string | null
  scripts_json: string | null
  script_style: string | null
  script: string | null
  first_scene_image_url: string | null
  first_frame_urls: string[] | null  // 첫 프레임 이미지 URL 배열 (WebP 압축본, 표시용)
  first_frame_original_urls: string[] | null  // 첫 프레임 원본 이미지 URL 배열 (PNG 원본, 영상 생성용)
  first_frame_prompt: string | null
  voice_id: string | null
  voice_name: string | null
  status: string
}

export function ProductDescriptionWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()

  // URL에서 videoAdId 파라미터 확인 (재개 시)
  const resumeVideoAdId = searchParams.get('videoAdId')

  // 마법사 단계
  const [step, setStep] = useState<WizardStep>(1)

  // 초안 저장 관련
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!resumeVideoAdId)

  // 데이터
  const [products, setProducts] = useState<AdProduct[]>([])
  const [voices, setVoices] = useState<Voice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Step 1: 선택
  const [selectedProduct, setSelectedProduct] = useState<AdProduct | null>(null)
  const [selectedAvatarInfo, setSelectedAvatarInfo] = useState<SelectedAvatarInfo | null>(null)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  // Step 1: 제품 정보 편집 (선택된 제품의 정보를 편집할 수 있도록)
  const [editableDescription, setEditableDescription] = useState('')
  const [editableSellingPoints, setEditableSellingPoints] = useState<string[]>([''])

  // Step 2: 입력
  const [productInfo, setProductInfo] = useState('')
  const [locationPrompt, setLocationPrompt] = useState('')
  const [duration, setDuration] = useState<VideoDuration>(30)
  const [cameraComposition, setCameraComposition] = useState<CameraComposition>('auto')
  const [modelPose, setModelPose] = useState<ModelPose>('auto')
  const [outfitMode, setOutfitMode] = useState<OutfitMode>('keep_original')
  const [outfitPreset, setOutfitPreset] = useState<OutfitPreset | null>(null)
  const [outfitCustom, setOutfitCustom] = useState('')
  const [recommendedOutfit, setRecommendedOutfit] = useState<RecommendedOutfit | null>(null)
  const [scriptLanguage, setScriptLanguage] = useState<'ko' | 'en' | 'ja' | 'zh'>(
    (language as 'ko' | 'en' | 'ja' | 'zh') || 'ko'
  )

  // Step 3: 대본 및 이미지 + 음성 (통합)
  const [scripts, setScripts] = useState<Script[]>([])
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0)
  const [editedScript, setEditedScript] = useState('')
  const [isEditingScript, setIsEditingScript] = useState(false)
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null)  // 선택된 압축 URL (표시용)
  const [firstFrameOriginalUrl, setFirstFrameOriginalUrl] = useState<string | null>(null)  // 선택된 원본 URL (영상 생성용)
  const [firstFrameUrls, setFirstFrameUrls] = useState<string[]>([])  // 2개의 압축 이미지 URL (표시용)
  const [firstFrameOriginalUrls, setFirstFrameOriginalUrls] = useState<string[]>([])  // 2개의 원본 이미지 URL (영상 생성용)
  const [selectedFirstFrameIndex, setSelectedFirstFrameIndex] = useState<number>(0)  // 선택된 이미지 인덱스
  const [locationDescription, setLocationDescription] = useState<string>('')
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false)
  const [firstFramePrompt, setFirstFramePrompt] = useState<string>('')

  // Step 3: 음성 (Step 4에서 통합됨)
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isLoadingVoices, setIsLoadingVoices] = useState(false)

  // Step 5: 영상 생성
  const [videoAdId, setVideoAdId] = useState<string | null>(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  // 초안 복원 중 플래그 (useEffect에서 editedScript 덮어쓰기 방지)
  const isRestoringDraft = useRef(false)

  // ============================================================
  // 데이터 로드
  // ============================================================

  // 특정 언어의 음성 목록 불러오기 (Minimax API)
  const fetchVoicesByLanguage = useCallback(async (lang: 'ko' | 'en' | 'ja' | 'zh') => {
    setIsLoadingVoices(true)
    try {
      const res = await fetch(`/api/minimax-voices?language=${lang}`)
      if (res.ok) {
        const data = await res.json()
        setVoices(data.voices || [])
      }
    } catch (error) {
      console.error('음성 목록 로드 오류:', error)
    } finally {
      setIsLoadingVoices(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, voicesRes] = await Promise.all([
        fetch('/api/ad-products'),
        fetch('/api/minimax-voices?language=ko'),  // 기본값: 한국어 음성 (Minimax)
      ])

      if (productsRes.ok) {
        const data = await productsRes.json()
        const completedProducts = data.products.filter(
          (p: AdProduct & { status: string }) => p.status === 'COMPLETED'
        )
        setProducts(completedProducts)
      }

      if (voicesRes.ok) {
        const data = await voicesRes.json()
        setVoices(data.voices || [])
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 프로그레스바 업데이트 (Infinitalk: 180초 기준)
  useEffect(() => {
    if (!isGeneratingVideo || !generationStartTime) return

    const TOTAL_DURATION = 120 * 1000 // 120초 (Infinitalk 기준)
    const MAX_PROGRESS = 99 // 최대 99%까지만

    const interval = setInterval(() => {
      const elapsed = Date.now() - generationStartTime
      const progress = Math.min((elapsed / TOTAL_DURATION) * 100, MAX_PROGRESS)
      setGenerationProgress(progress)
    }, 100)

    return () => clearInterval(interval)
  }, [isGeneratingVideo, generationStartTime])

  // ============================================================
  // 초안 저장/로드
  // ============================================================

  // 초안 저장 함수 (overrides를 통해 직접 값을 전달할 수 있음 - 상태 업데이트 전에 저장할 때 사용)
  const saveDraft = useCallback(async (currentStep: WizardStep, overrides?: {
    scripts?: Script[]
    locationDescription?: string
    firstFrameUrl?: string | null
    firstFrameUrls?: string[]
    firstFrameOriginalUrls?: string[]
    firstFramePrompt?: string
    editedScript?: string
    selectedScriptIndex?: number
    status?: 'DRAFT' | 'GENERATING_SCRIPTS' | 'GENERATING_AUDIO'
  }) => {
    setIsSavingDraft(true)
    try {
      // overrides가 있으면 overrides 값 사용, 없으면 state 값 사용
      const scriptsToSave = overrides?.scripts ?? scripts
      const locationDescToSave = overrides?.locationDescription ?? locationDescription
      const firstFrameUrlToSave = overrides?.firstFrameUrl !== undefined ? overrides.firstFrameUrl : firstFrameUrl
      const firstFrameUrlsToSave = overrides?.firstFrameUrls ?? firstFrameUrls
      const firstFrameOriginalUrlsToSave = overrides?.firstFrameOriginalUrls ?? firstFrameOriginalUrls
      const firstFramePromptToSave = overrides?.firstFramePrompt ?? firstFramePrompt
      const editedScriptToSave = overrides?.editedScript ?? editedScript
      const scriptIndexToSave = overrides?.selectedScriptIndex ?? selectedScriptIndex

      const res = await fetch('/api/video-ads/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          category: 'productDescription',
          wizardStep: currentStep,
          status: overrides?.status,  // 상태 업데이트 (GENERATING_SCRIPTS, GENERATING_AUDIO 등)
          avatarId: selectedAvatarInfo?.avatarId,
          outfitId: selectedAvatarInfo?.outfitId,
          avatarImageUrl: selectedAvatarInfo?.imageUrl,
          aiAvatarOptions: selectedAvatarInfo?.type === 'ai-generated' ? selectedAvatarInfo.aiOptions : undefined,
          productId: selectedProduct?.id,
          productInfo,
          locationPrompt,
          duration,
          cameraComposition: cameraComposition !== 'auto' ? cameraComposition : null,
          modelPose: modelPose !== 'auto' ? modelPose : null,
          outfitMode: outfitMode !== 'keep_original' ? outfitMode : null,
          outfitPreset: outfitMode === 'preset' ? outfitPreset : null,
          outfitCustom: outfitMode === 'custom' ? outfitCustom : null,
          scriptsJson: scriptsToSave.length > 0 ? JSON.stringify({ scripts: scriptsToSave, locationDescription: locationDescToSave }) : null,
          scriptStyle: scriptsToSave[scriptIndexToSave]?.style,
          script: editedScriptToSave,
          firstSceneImageUrl: firstFrameUrlToSave,
          firstFrameUrls: firstFrameUrlsToSave.length > 0 ? firstFrameUrlsToSave : null,
          firstFrameOriginalUrls: firstFrameOriginalUrlsToSave.length > 0 ? firstFrameOriginalUrlsToSave : null,
          firstFramePrompt: firstFramePromptToSave,
          voiceId: selectedVoice?.id,
          voiceName: selectedVoice?.name,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.draft?.id) {
          setDraftId(data.draft.id)
        }
      }
    } catch (error) {
      console.error('초안 저장 오류:', error)
    } finally {
      setIsSavingDraft(false)
    }
  }, [draftId, selectedAvatarInfo, selectedProduct, productInfo, locationPrompt, duration, cameraComposition, modelPose, outfitMode, outfitPreset, outfitCustom, scripts, selectedScriptIndex, editedScript, firstFrameUrl, firstFrameUrls, firstFrameOriginalUrls, firstFramePrompt, locationDescription, selectedVoice])

  // 기존 초안 또는 진행 중인 영상 광고 로드
  const loadExistingData = useCallback(async () => {
    if (resumeVideoAdId) {
      // URL에서 videoAdId가 있는 경우 해당 데이터 로드
      setIsLoadingDraft(true)
      try {
        const res = await fetch(`/api/video-ads/status/${resumeVideoAdId}`)
        if (res.ok) {
          const statusData = await res.json()

          // 생성 완료된 경우 상세 페이지로 이동
          if (statusData.status === 'COMPLETED') {
            router.replace(`/dashboard/video-ad/${resumeVideoAdId}`)
            return
          }

          // 생성 중인 경우 Step 5로 이동
          if (['IN_QUEUE', 'IN_PROGRESS'].includes(statusData.status)) {
            setVideoAdId(resumeVideoAdId)
            setStep(4)
            setFirstFrameUrl(statusData.firstSceneImageUrl || null)
            setGenerationStatus('영상 생성 중...')
            setIsGeneratingVideo(true)
            setGenerationStartTime(Date.now())
            setGenerationProgress(0)
            setIsLoadingDraft(false)

            // 상태 폴링 시작
            pollVideoStatus(resumeVideoAdId)
            return
          }
        }

        // 초안(DRAFT) 데이터 로드
        const draftRes = await fetch(`/api/video-ads/draft?category=productDescription`)
        if (draftRes.ok) {
          const draftData = await draftRes.json()
          if (draftData.draft && draftData.draft.id === resumeVideoAdId) {
            restoreDraftData(draftData.draft)
          }
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error)
      } finally {
        setIsLoadingDraft(false)
      }
    } else {
      // 기존 초안 확인
      try {
        const res = await fetch('/api/video-ads/draft?category=productDescription')
        if (res.ok) {
          const data = await res.json()
          if (data.draft && data.draft.wizard_step) {
            // 기존 초안이 있으면 복원할지 확인
            const shouldRestore = confirm('이전에 저장된 작업이 있습니다. 이어서 진행하시겠습니까?')
            if (shouldRestore) {
              restoreDraftData(data.draft)
            }
            // 이어서 하지 않아도 초안은 유지 (삭제하지 않음)
          }
        }
      } catch (error) {
        console.error('초안 확인 오류:', error)
      }
    }
  }, [resumeVideoAdId, router])

  // 초안 데이터 복원
  const restoreDraftData = (draft: DraftData) => {
    // 복원 플래그 설정 (useEffect에서 editedScript 덮어쓰기 방지)
    isRestoringDraft.current = true

    setDraftId(draft.id)

    // Step 1 데이터 - 아바타 복원
    if (draft.ai_avatar_options) {
      // AI 아바타 옵션 복원
      try {
        const aiOptions = JSON.parse(draft.ai_avatar_options)
        setSelectedAvatarInfo({
          type: 'ai-generated',
          avatarId: 'ai-generated',
          avatarName: 'AI 생성 모델',
          imageUrl: '',
          displayName: 'AI 자동 생성',
          aiOptions,
        })
      } catch (e) {
        console.error('AI 아바타 옵션 파싱 오류:', e)
      }
    } else if (draft.avatar_id && draft.avatar_image_url) {
      // 기존 아바타/의상 복원
      setSelectedAvatarInfo({
        type: draft.outfit_id ? 'outfit' : 'avatar',
        avatarId: draft.avatar_id,
        avatarName: '',
        outfitId: draft.outfit_id || undefined,
        imageUrl: draft.avatar_image_url,
        displayName: '',
      })
    }

    // 제품 선택 복원
    if (draft.product_id) {
      const product = products.find(p => p.id === draft.product_id)
      if (product) {
        setSelectedProduct(product)
      }
    }

    // Step 2 데이터
    if (draft.product_info) setProductInfo(draft.product_info)
    if (draft.location_prompt) setLocationPrompt(draft.location_prompt)
    if (draft.duration) setDuration(draft.duration as VideoDuration)
    if (draft.camera_composition) setCameraComposition(draft.camera_composition as CameraComposition)
    if (draft.model_pose) setModelPose(draft.model_pose as ModelPose)
    if (draft.outfit_mode) setOutfitMode(draft.outfit_mode as OutfitMode)
    if (draft.outfit_preset) setOutfitPreset(draft.outfit_preset as OutfitPreset)
    if (draft.outfit_custom) setOutfitCustom(draft.outfit_custom)

    // Step 3 데이터 (대본, 첫 프레임)
    if (draft.scripts_json) {
      try {
        const parsedData = JSON.parse(draft.scripts_json)
        // 새로운 형식: { scripts: [...], locationDescription: '...' }
        if (parsedData.scripts && Array.isArray(parsedData.scripts)) {
          setScripts(parsedData.scripts)
          if (parsedData.locationDescription) {
            setLocationDescription(parsedData.locationDescription)
          }
          if (draft.script_style) {
            const idx = parsedData.scripts.findIndex((s: Script) => s.style === draft.script_style)
            if (idx >= 0) setSelectedScriptIndex(idx)
          }
        } else if (Array.isArray(parsedData)) {
          // 이전 형식: [...] (배열만)
          setScripts(parsedData)
          if (draft.script_style) {
            const idx = parsedData.findIndex((s: Script) => s.style === draft.script_style)
            if (idx >= 0) setSelectedScriptIndex(idx)
          }
        }
      } catch (e) {
        console.error('대본 파싱 오류:', e)
      }
    }
    if (draft.script) setEditedScript(draft.script)
    if (draft.first_scene_image_url) setFirstFrameUrl(draft.first_scene_image_url)
    // 첫 프레임 이미지 URL 배열 복원 (압축본 - 표시용)
    if (draft.first_frame_urls && Array.isArray(draft.first_frame_urls)) {
      setFirstFrameUrls(draft.first_frame_urls)
      // 선택된 이미지 인덱스 복원
      if (draft.first_scene_image_url) {
        const selectedIdx = draft.first_frame_urls.indexOf(draft.first_scene_image_url)
        if (selectedIdx >= 0) setSelectedFirstFrameIndex(selectedIdx)
      }
    }
    // 첫 프레임 원본 이미지 URL 배열 복원 (PNG 원본 - 영상 생성용)
    if (draft.first_frame_original_urls && Array.isArray(draft.first_frame_original_urls)) {
      setFirstFrameOriginalUrls(draft.first_frame_original_urls)
      // 선택된 원본 이미지 URL 복원
      if (draft.first_frame_urls && draft.first_scene_image_url) {
        const selectedIdx = draft.first_frame_urls.indexOf(draft.first_scene_image_url)
        if (selectedIdx >= 0 && draft.first_frame_original_urls[selectedIdx]) {
          setFirstFrameOriginalUrl(draft.first_frame_original_urls[selectedIdx])
        }
      }
    }
    if (draft.first_frame_prompt) setFirstFramePrompt(draft.first_frame_prompt)

    // Step 4 데이터
    if (draft.voice_id && draft.voice_name) {
      setSelectedVoice({
        id: draft.voice_id,
        name: draft.voice_name,
        description: '',
        gender: 'female',
        style: '',
        sampleText: '',
        previewUrl: null,
      })
    }

    // 마법사 단계 복원
    if (draft.wizard_step >= 1 && draft.wizard_step <= 5) {
      setStep(draft.wizard_step as WizardStep)
    }
  }

  // 영상 상태 폴링
  const pollVideoStatus = async (id: string): Promise<void> => {
    try {
      const statusRes = await fetch(`/api/video-ads/status/${id}`)
      if (!statusRes.ok) throw new Error('상태 확인 실패')

      const status = await statusRes.json()

      if (status.status === 'COMPLETED') {
        setGenerationStatus('완료!')
        setTimeout(() => {
          router.push(`/dashboard/video-ad/${id}`)
        }, 1000)
        return
      }

      if (status.status === 'FAILED') {
        throw new Error(status.error || '영상 생성 실패')
      }

      if (status.queuePosition) {
        setGenerationStatus(`영상 생성 중... (대기열 ${status.queuePosition}번째)`)
      } else {
        setGenerationStatus('영상 생성 중...')
      }

      await new Promise(resolve => setTimeout(resolve, 3000))
      return pollVideoStatus(id)
    } catch (error) {
      console.error('상태 폴링 오류:', error)
      setGenerationStatus('오류가 발생했습니다')
      setIsGeneratingVideo(false)
    }
  }

  // 초기 로드 시 기존 데이터 확인
  useEffect(() => {
    if (!isLoading) {
      loadExistingData()
    }
  }, [isLoading, loadExistingData])

  // 선택된 제품에서 정보 채우기
  useEffect(() => {
    if (selectedProduct) {
      // 편집 가능한 필드 채우기
      setEditableDescription(selectedProduct.description || '')
      setEditableSellingPoints(
        selectedProduct.selling_points && selectedProduct.selling_points.length > 0
          ? selectedProduct.selling_points
          : ['']
      )

      // 구조화된 제품 정보를 productInfo에 설정
      if (!productInfo) {
        const parts: string[] = []
        parts.push(`제품명: ${selectedProduct.name}`)
        if (selectedProduct.description) parts.push(`설명: ${selectedProduct.description}`)
        if (selectedProduct.selling_points && selectedProduct.selling_points.length > 0) {
          parts.push(`핵심 특징:\n${selectedProduct.selling_points.map(p => `- ${p}`).join('\n')}`)
        }
        setProductInfo(parts.join('\n'))
      }
    }
  }, [selectedProduct, productInfo])

  // 셀링 포인트 관리 함수
  const addSellingPoint = () => {
    if (editableSellingPoints.length < 10) {
      setEditableSellingPoints([...editableSellingPoints, ''])
    }
  }

  const removeSellingPoint = (index: number) => {
    if (editableSellingPoints.length > 1) {
      setEditableSellingPoints(editableSellingPoints.filter((_, i) => i !== index))
    }
  }

  const updateSellingPoint = (index: number, value: string) => {
    const updated = [...editableSellingPoints]
    updated[index] = value
    setEditableSellingPoints(updated)
  }

  // 대본 선택 시 편집 내용 초기화 (초안 복원 중에는 건너뜀)
  useEffect(() => {
    if (isRestoringDraft.current) {
      // 복원 중일 때는 editedScript를 덮어쓰지 않음
      isRestoringDraft.current = false
      return
    }
    if (scripts.length > 0 && selectedScriptIndex >= 0) {
      setEditedScript(scripts[selectedScriptIndex].content)
      setIsEditingScript(false)
    }
  }, [selectedScriptIndex, scripts])

  // ============================================================
  // Step 2 → Step 3: 대본 및 첫 프레임 생성
  // ============================================================

  const generateScriptsAndImage = async () => {
    // 이미 생성 중이면 중복 실행 방지
    if (isGeneratingScripts) return

    // 선택된 제품이 있으면 편집된 정보를 productInfo로 반영
    let currentProductInfo = productInfo
    if (selectedProduct) {
      const parts: string[] = []
      parts.push(`제품명: ${selectedProduct.name}`)
      if (editableDescription) parts.push(`설명: ${editableDescription}`)
      const validPoints = editableSellingPoints.filter(p => p.trim().length > 0)
      if (validPoints.length > 0) {
        parts.push(`핵심 특징:\n${validPoints.map(p => `- ${p}`).join('\n')}`)
      }
      currentProductInfo = parts.join('\n')
      setProductInfo(currentProductInfo)
    }

    if (!selectedAvatarInfo || !currentProductInfo.trim()) return

    // 즉시 UI 전환 (Step 3으로 이동 + 로딩 상태)
    setIsGeneratingScripts(true)
    setStep(3)

    // Step 2 데이터 저장 + GENERATING_SCRIPTS 상태로 변경 (백그라운드에서 실행, 에러 무시)
    saveDraft(2, { status: 'GENERATING_SCRIPTS' }).catch(console.error)

    try {
      const res = await fetch('/api/video-ads/product-description/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct?.id,
          avatarId: selectedAvatarInfo.avatarId,
          avatarImageUrl: selectedAvatarInfo.imageUrl,  // 의상 선택 시 해당 이미지 URL
          productInfo: currentProductInfo.trim(),
          locationPrompt: locationPrompt.trim() || undefined,
          durationSeconds: duration,
          cameraComposition: cameraComposition !== 'auto' ? cameraComposition : undefined,
          modelPose: modelPose !== 'auto' ? modelPose : undefined,
          // 의상 설정
          outfitMode: outfitMode !== 'keep_original' ? outfitMode : undefined,
          outfitPreset: outfitMode === 'preset' ? outfitPreset : undefined,
          outfitCustom: outfitMode === 'custom' && outfitCustom.trim() ? outfitCustom.trim() : undefined,
          language: scriptLanguage,  // 대본 생성 언어
          // AI 아바타 옵션 (AI 생성 아바타일 때만)
          aiAvatarOptions: selectedAvatarInfo.type === 'ai-generated' ? selectedAvatarInfo.aiOptions : undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '대본 생성 실패')
      }

      const data = await res.json()

      const generatedScripts = data.scripts || []
      const generatedFirstFrameUrls: string[] = data.firstFrameUrls || (data.firstFrameUrl ? [data.firstFrameUrl] : [])
      const generatedFirstFrameOriginalUrls: string[] = data.firstFrameOriginalUrls || generatedFirstFrameUrls  // 원본 URL (없으면 압축본 사용)
      const generatedFirstFrameUrl = generatedFirstFrameUrls[0] || null
      const generatedFirstFrameOriginalUrl = generatedFirstFrameOriginalUrls[0] || null
      const generatedLocationDesc = data.locationDescription || ''
      const generatedFirstFramePrompt = data.firstFramePrompt || ''
      const generatedEditedScript = generatedScripts.length > 0 ? generatedScripts[0].content : ''

      setScripts(generatedScripts)
      setFirstFrameUrls(generatedFirstFrameUrls)
      setFirstFrameOriginalUrls(generatedFirstFrameOriginalUrls)
      setFirstFrameUrl(generatedFirstFrameUrl)
      setFirstFrameOriginalUrl(generatedFirstFrameOriginalUrl)
      setSelectedFirstFrameIndex(0)
      setLocationDescription(generatedLocationDesc)
      setFirstFramePrompt(generatedFirstFramePrompt)

      // AI 추천 의상 저장
      if (data.recommendedOutfit) {
        setRecommendedOutfit(data.recommendedOutfit)
      }

      if (generatedScripts.length > 0) {
        setSelectedScriptIndex(0)
        setEditedScript(generatedEditedScript)
      }

      // 대본 언어로 음성 목록 불러오기 (Step 2에서 선택한 언어)
      fetchVoicesByLanguage(scriptLanguage)

      // 생성된 대본과 이미지 정보 저장 + DRAFT 상태로 복원 (API 응답 값을 직접 전달하여 stale closure 문제 방지)
      await saveDraft(3, {
        scripts: generatedScripts,
        locationDescription: generatedLocationDesc,
        firstFrameUrl: generatedFirstFrameUrl,
        firstFrameUrls: generatedFirstFrameUrls,
        firstFrameOriginalUrls: generatedFirstFrameOriginalUrls,
        firstFramePrompt: generatedFirstFramePrompt,
        editedScript: generatedEditedScript,
        selectedScriptIndex: 0,
        status: 'DRAFT',  // 생성 완료 후 DRAFT 상태로 복원
      })
    } catch (error) {
      console.error('대본 생성 오류:', error)
      alert(error instanceof Error ? error.message : '대본 생성 중 오류가 발생했습니다')
      setStep(2)
      // 에러 발생 시 DRAFT 상태로 복원
      saveDraft(2, { status: 'DRAFT' }).catch(console.error)
    } finally {
      setIsGeneratingScripts(false)
    }
  }

  // ============================================================
  // Step 3 → Step 4: 음성 선택 단계로 이동
  // ============================================================

  const proceedToVoiceSelection = async () => {
    if (!editedScript.trim()) {
      alert('대본 내용을 입력해주세요')
      return
    }
    await saveDraft(3)

    // Step 2에서 선택한 언어로 음성 목록 불러오기
    setSelectedVoice(null)  // 음성 선택 초기화
    await fetchVoicesByLanguage(scriptLanguage)

    setStep(4)
  }

  // ============================================================
  // Step 4 → Step 5: TTS 생성 후 영상 생성
  // ============================================================

  const generateVideo = async () => {
    if (!selectedVoice || !editedScript.trim() || !selectedAvatarInfo) return

    // 버튼 클릭 즉시 Step 4로 이동
    setStep(4)
    setIsGeneratingAudio(true)
    setIsGeneratingVideo(true)
    setGenerationStatus('음성을 생성 중입니다...')
    setGenerationStartTime(Date.now())
    setGenerationProgress(0)

    // Step 4 데이터 저장 + GENERATING_AUDIO 상태로 변경
    saveDraft(4, { status: 'GENERATING_AUDIO' }).catch(console.error)

    try {
      // TTS 생성 요청
      const ttsRes = await fetch('/api/video-ads/product-description/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: editedScript,
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
        }),
      })

      if (!ttsRes.ok) {
        const error = await ttsRes.json()
        throw new Error(error.error || '음성 생성 실패')
      }

      const ttsData = await ttsRes.json()
      const audioUrl = ttsData.audioUrl

      setIsGeneratingAudio(false)
      setGenerationStatus('영상을 생성 중입니다...')

      // 영상 생성 요청 (원본 이미지 URL 사용 - 압축본은 표시용으로만)
      const videoRes = await fetch('/api/video-ads/product-description/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct?.id,
          avatarId: selectedAvatarInfo.avatarId,
          firstFrameUrl: firstFrameOriginalUrl || firstFrameUrl,  // 원본 우선, 없으면 압축본 fallback
          audioUrl,
          script: editedScript,
          scriptStyle: scripts[selectedScriptIndex]?.style || 'custom',
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
          locationPrompt: locationPrompt || locationDescription,
          duration,
          // 영상 프롬프트 생성을 위한 추가 정보
          cameraComposition: cameraComposition !== 'auto' ? cameraComposition : undefined,
          productName: selectedProduct?.name,
          productDescription: productInfo,
        }),
      })

      if (!videoRes.ok) {
        const error = await videoRes.json()
        throw new Error(error.error || '영상 생성 요청 실패')
      }

      const videoData = await videoRes.json()
      setVideoAdId(videoData.videoAdId)

      // 영상 생성이 시작되면 초안 삭제 (영상 광고 레코드가 생성됨)
      if (draftId) {
        fetch(`/api/video-ads/draft?id=${draftId}`, { method: 'DELETE' }).catch(console.error)
        setDraftId(null)
      }

      // 상태 폴링
      const pollStatus = async (): Promise<void> => {
        const statusRes = await fetch(`/api/video-ads/status/${videoData.videoAdId}`)
        if (!statusRes.ok) throw new Error('상태 확인 실패')

        const status = await statusRes.json()

        if (status.status === 'COMPLETED') {
          setGenerationStatus('완료!')
          setTimeout(() => {
            router.push(`/dashboard/video-ad/${videoData.videoAdId}`)
          }, 1000)
          return
        }

        if (status.status === 'FAILED') {
          throw new Error(status.error || '영상 생성 실패')
        }

        if (status.queuePosition) {
          setGenerationStatus(`영상 생성 중... (대기열 ${status.queuePosition}번째)`)
        } else {
          setGenerationStatus('영상 생성 중...')
        }

        await new Promise(resolve => setTimeout(resolve, 3000))
        return pollStatus()
      }

      await pollStatus()
    } catch (error) {
      console.error('영상 생성 오류:', error)
      alert(error instanceof Error ? error.message : '영상 생성 중 오류가 발생했습니다')
      setGenerationStatus('')
      // 에러 발생 시 DRAFT 상태로 복원
      saveDraft(4, { status: 'DRAFT' }).catch(console.error)
    } finally {
      setIsGeneratingAudio(false)
      setIsGeneratingVideo(false)
    }
  }

  // ============================================================
  // 음성 미리듣기
  // ============================================================

  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null)

  const playVoicePreview = useCallback(async (voice: Voice) => {
    // 현재 재생 중인 음성이면 정지
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setPlayingVoiceId(null)
      return
    }

    // 다른 음성 재생 중이면 정지
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // 미리듣기 URL이 없으면 실시간 생성
    let previewUrl = voice.previewUrl
    if (!previewUrl) {
      setLoadingPreviewId(voice.id)
      try {
        const res = await fetch(`/api/minimax-voices/preview?voiceId=${voice.id}`)
        if (res.ok) {
          const data = await res.json()
          previewUrl = data.audioUrl
          // 음성 목록에서 해당 음성의 previewUrl 업데이트
          setVoices(prev => prev.map(v =>
            v.id === voice.id ? { ...v, previewUrl: previewUrl } : v
          ))
        }
      } catch (err) {
        console.error('프리뷰 생성 오류:', err)
      } finally {
        setLoadingPreviewId(null)
      }
    }

    if (!previewUrl) {
      return
    }

    // 새 오디오 재생
    const audio = new Audio(previewUrl)
    audioRef.current = audio
    setPlayingVoiceId(voice.id)

    audio.play().catch(err => {
      console.error('오디오 재생 오류:', err)
      setPlayingVoiceId(null)
    })

    audio.onended = () => {
      setPlayingVoiceId(null)
    }

    audio.onerror = () => {
      setPlayingVoiceId(null)
    }
  }, [playingVoiceId])

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // ============================================================
  // 단계별 유효성 검사
  // ============================================================

  const canProceedStep1 = selectedAvatarInfo !== null && selectedProduct !== null
  const canProceedStep2 = productInfo.trim().length > 0
  const canProceedStep3 = editedScript.trim().length > 0 && firstFrameUrl !== null
  const canProceedStep4 = selectedVoice !== null

  // ============================================================
  // 단계 네비게이션 (초안 저장 포함)
  // ============================================================

  const goToStep = async (targetStep: WizardStep) => {
    // 현재 단계의 데이터를 저장
    await saveDraft(step)
    setStep(targetStep)
  }

  // ============================================================
  // 렌더링
  // ============================================================

  // 데이터 로딩 중이거나 진행 중인 영상 광고 로드 중일 때 로딩 표시
  if (isLoading || isLoadingDraft) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          {isLoadingDraft && (
            <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
          )}
        </div>
      </div>
    )
  }

  // 단계 정보
  const STEPS = [
    { step: 1, title: '제품/아바타', description: '제품 및 아바타 선택' },
    { step: 2, title: '영상 정보', description: '영상 정보 입력' },
    { step: 3, title: '대본/음성', description: '대본 및 음성 선택' },
    { step: 4, title: '생성', description: '영상 생성' },
  ]

  // 선택 항목 표시 여부
  const productImageUrl = selectedProduct?.rembg_image_url || selectedProduct?.image_url
  const showSelectedItems = step >= 2 && !isGeneratingVideo && (selectedProduct || selectedAvatarInfo)

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* 헤더 - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* 타이틀 */}
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/dashboard/video-ad"
              className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">제품 설명 영상 만들기</h1>
              <p className="text-xs text-muted-foreground">아바타가 음성으로 제품을 설명하는 영상</p>
            </div>
          </div>

          {/* 단계 표시기 + 선택 항목 */}
          <div className="flex items-center justify-between">
            {/* 왼쪽 여백 */}
            <div className="w-48 hidden lg:block" />

            {/* 중앙: 단계 표시기 */}
            <div className="flex items-center justify-center flex-1 lg:flex-none">
              {STEPS.map(({ step: s, title }, index) => {
                const isCompleted = step > s
                const isCurrent = step === s

                return (
                  <div key={s} className="flex items-center">
                    {/* 단계 원 + 텍스트 */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : isCurrent
                              ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                              : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          s
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                          isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {title}
                      </span>
                    </div>

                    {/* 연결선 */}
                    {index < STEPS.length - 1 && (
                      <div className="w-12 mx-1 -mt-4">
                        <div
                          className={`h-0.5 rounded-full transition-all ${
                            isCompleted ? 'bg-primary' : 'bg-secondary'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 오른쪽: 선택 항목 요약 */}
            <div className="w-48 hidden lg:flex items-center justify-end gap-2">
              {showSelectedItems && (
                <>
                  {/* 제품 */}
                  {selectedProduct && (
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                        {productImageUrl ? (
                          <Image
                            src={productImageUrl}
                            alt={selectedProduct.name}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                        {selectedProduct.name}
                      </p>
                    </div>
                  )}

                  {/* 구분선 */}
                  {selectedProduct && selectedAvatarInfo && (
                    <div className="h-6 w-px bg-border" />
                  )}

                  {/* 아바타 */}
                  {selectedAvatarInfo && (
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                        {selectedAvatarInfo.type === 'ai-generated' ? (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        ) : selectedAvatarInfo.imageUrl ? (
                          <Image
                            src={selectedAvatarInfo.imageUrl}
                            alt={selectedAvatarInfo.displayName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                        {selectedAvatarInfo.displayName}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">

      {/* Step 1: 제품/아바타 선택 */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-6">

          {/* 아바타 선택 (필수) */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <User className="w-4 h-4 inline mr-2" />
              아바타 선택 <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => setShowAvatarModal(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
            >
              {selectedAvatarInfo ? (
                <div className="flex items-center gap-3">
                  {selectedAvatarInfo.type === 'ai-generated' ? (
                    // AI 생성 아바타인 경우 아이콘 표시
                    <div className="w-10 h-14 rounded bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    // 기존 아바타인 경우 이미지 표시
                    <img
                      src={selectedAvatarInfo.imageUrl}
                      alt={selectedAvatarInfo.displayName}
                      className="w-10 h-14 object-cover rounded"
                    />
                  )}
                  <div>
                    <span className="text-foreground block">{selectedAvatarInfo.displayName}</span>
                    {selectedAvatarInfo.type === 'outfit' && (
                      <span className="text-xs text-primary">의상 교체</span>
                    )}
                    {selectedAvatarInfo.type === 'ai-generated' && (
                      <span className="text-xs text-purple-500">AI 자동 생성</span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">아바타를 선택하세요</span>
              )}
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* 아바타 선택 모달 */}
          <AvatarSelectModal
            isOpen={showAvatarModal}
            onClose={() => setShowAvatarModal(false)}
            onSelect={(avatar) => {
              setSelectedAvatarInfo(avatar)
              setShowAvatarModal(false)
            }}
            selectedAvatarId={selectedAvatarInfo?.avatarId}
            selectedOutfitId={selectedAvatarInfo?.outfitId}
            selectedType={selectedAvatarInfo?.type}
          />

          {/* 제품 선택 (필수) */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              제품 선택 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                onClick={() => setShowProductDropdown(!showProductDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
              >
                {selectedProduct ? (
                  <div className="flex items-center gap-3">
                    {(selectedProduct.rembg_image_url || selectedProduct.image_url) && (
                      <img
                        src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                        alt={selectedProduct.name}
                        className="w-10 h-10 object-contain rounded"
                      />
                    )}
                    <span className="text-foreground">{selectedProduct.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">제품을 선택하세요</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {products.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      등록된 제품이 없습니다
                    </div>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product)
                          setShowProductDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                      >
                        {(product.rembg_image_url || product.image_url) && (
                          <img
                            src={product.rembg_image_url || product.image_url || ''}
                            alt={product.name}
                            className="w-10 h-10 object-contain rounded bg-secondary/30"
                          />
                        )}
                        <span className="text-foreground">{product.name}</span>
                        {selectedProduct?.id === product.id && (
                          <Check className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 선택된 제품 정보 편집 (제품 선택 시 바로 표시) */}
            {selectedProduct && (
              <div className="mt-4 p-4 bg-secondary/30 rounded-xl space-y-4">
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
                    <p className="text-xs text-muted-foreground">제품 정보를 확인하고 편집하세요</p>
                  </div>
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">제품 설명</label>
                  <textarea
                    value={editableDescription}
                    onChange={(e) => setEditableDescription(e.target.value)}
                    placeholder="제품에 대한 설명..."
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                {/* 셀링 포인트 */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    셀링 포인트 <span className="text-muted-foreground/70">(예: &quot;24시간 보습&quot;, &quot;피부과 추천&quot;)</span>
                  </label>
                  <div className="space-y-2">
                    {editableSellingPoints.map((point, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => updateSellingPoint(index, e.target.value)}
                          placeholder="제품의 장점이나 특징"
                          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {editableSellingPoints.length > 1 && (
                          <button
                            onClick={() => removeSellingPoint(index)}
                            className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {editableSellingPoints.length < 10 && (
                      <button
                        onClick={addSellingPoint}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        포인트 추가
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 촬영 장소 입력 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              촬영 장소 <span className="text-muted-foreground text-xs">(선택 사항)</span>
            </label>
            <input
              type="text"
              value={locationPrompt}
              onChange={(e) => setLocationPrompt(e.target.value)}
              placeholder="예: 밝은 카페, 현대적인 거실, 야외 공원 등"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-2">
              비워두면 제품에 어울리는 장소를 AI가 자동으로 선택합니다
            </p>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={() => goToStep(2)}
            disabled={!canProceedStep1 || isSavingDraft}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                다음
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: 영상 정보 입력 */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-foreground">영상 정보를 입력하세요</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI가 이 정보를 바탕으로 대본을 생성합니다
            </p>
          </div>

          {/* 대본 언어 선택 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Globe className="w-4 h-4 inline mr-2" />
              대본 언어
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { code: 'ko', label: '한국어' },
                { code: 'en', label: 'English' },
                { code: 'ja', label: '日本語' },
                { code: 'zh', label: '中文' },
              ] as const).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setScriptLanguage(lang.code)}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${scriptLanguage === lang.code
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 영상 길이 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Clock className="w-4 h-4 inline mr-2" />
              영상 길이
              <p className="text-xs text-muted-foreground mt-2">
              대본에 따라 길이가 달라질 수 있습니다
            </p>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([15, 30, 60] as VideoDuration[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-lg border text-sm font-medium transition-colors ${duration === d
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                >
                  {d}초
                </button>
              ))}
            </div>
          </div>

          {/* 카메라 구도 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Camera className="w-4 h-4 inline mr-2" />
              카메라 구도
              <span className="text-xs text-muted-foreground ml-2">(선택 사항)</span>
            </label>
            <div className="space-y-4">
              {cameraCompositionGroups.map((group) => (
                <div key={group.key}>
                  <p className="text-xs text-muted-foreground mb-2">{group.label}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {group.compositions.map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setCameraComposition(comp)}
                        className={`relative group flex flex-col items-center p-2 rounded-lg border transition-colors ${cameraComposition === comp
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                          }`}
                        title={cameraCompositionLabels[comp].desc}
                      >
                        {/* 예시 이미지 (placeholder) */}
                        <div className="w-full aspect-square rounded bg-secondary/50 mb-1.5 flex items-center justify-center overflow-hidden">
                          {/* TODO: 실제 이미지로 교체 */}
                          <Camera className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                        <span className={`text-[11px] font-medium ${cameraComposition === comp ? 'text-primary' : 'text-muted-foreground'}`}>
                          {cameraCompositionLabels[comp].label}
                        </span>
                        {cameraComposition === comp && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                        {/* 호버 시 설명 표시 */}
                        <div className="absolute inset-0 bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                          <p className="text-[10px] text-white text-center leading-tight">
                            {cameraCompositionLabels[comp].desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 모델 포즈 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <User className="w-4 h-4 inline mr-2" />
              모델 포즈
              <span className="text-xs text-muted-foreground ml-2">(선택 사항)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {modelPoseOptions.map((pose) => (
                <button
                  key={pose}
                  type="button"
                  onClick={() => setModelPose(pose)}
                  className={`relative group flex flex-col items-center p-2 rounded-lg border transition-colors ${modelPose === pose
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                    }`}
                  title={modelPoseLabels[pose].desc}
                >
                  {/* 아이콘 placeholder */}
                  <div className="w-full aspect-square rounded bg-secondary/50 mb-1.5 flex items-center justify-center overflow-hidden">
                    <User className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <span className={`text-[11px] font-medium text-center ${modelPose === pose ? 'text-primary' : 'text-muted-foreground'}`}>
                    {modelPoseLabels[pose].label}
                  </span>
                  {modelPose === pose && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                  {/* 호버 시 설명 표시 */}
                  <div className="absolute inset-0 bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-[10px] text-white text-center leading-tight">
                      {modelPoseLabels[pose].desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 의상 설정 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Shirt className="w-4 h-4 inline mr-2" />
              의상 설정
              <span className="text-xs text-muted-foreground ml-2">(선택 사항)</span>
            </label>

            {/* 의상 모드 선택 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setOutfitMode('keep_original')
                  setOutfitPreset(null)
                  setOutfitCustom('')
                }}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  outfitMode === 'keep_original'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                기존 의상 유지
              </button>
              <button
                type="button"
                onClick={() => {
                  setOutfitMode('ai_recommend')
                  setOutfitPreset(null)
                  setOutfitCustom('')
                }}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                  outfitMode === 'ai_recommend'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI 추천
              </button>
              <button
                type="button"
                onClick={() => setOutfitMode('preset')}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  outfitMode === 'preset'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                스타일 선택
              </button>
              <button
                type="button"
                onClick={() => setOutfitMode('custom')}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  outfitMode === 'custom'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                직접 입력
              </button>
            </div>

            {/* AI 추천 설명 */}
            {outfitMode === 'ai_recommend' && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  대본 생성 시 AI가 제품과 아바타에 어울리는 의상을 자동으로 추천합니다.
                </p>
              </div>
            )}

            {/* 프리셋 선택 */}
            {outfitMode === 'preset' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {outfitPresetOptions.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setOutfitPreset(preset)}
                    className={`relative group p-3 rounded-lg border transition-colors text-left ${
                      outfitPreset === preset
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    title={outfitPresetLabels[preset].desc}
                  >
                    <span className={`text-sm font-medium ${outfitPreset === preset ? 'text-primary' : 'text-foreground'}`}>
                      {outfitPresetLabels[preset].label}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {outfitPresetLabels[preset].desc}
                    </p>
                    {outfitPreset === preset && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 직접 입력 */}
            {outfitMode === 'custom' && (
              <input
                type="text"
                value={outfitCustom}
                onChange={(e) => setOutfitCustom(e.target.value)}
                placeholder="원하는 의상을 설명해주세요... (예: 흰색 린넨 셔츠와 베이지 슬랙스)"
                className="w-full px-4 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => goToStep(1)}
              disabled={isSavingDraft}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </button>
            <button
              onClick={generateScriptsAndImage}
              disabled={!canProceedStep2 || isGeneratingScripts}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingScripts ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  대본 생성하기
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 첫 프레임 이미지 선택 + 대본 선택/편집 + 음성 선택 (통합) */}
      {step === 3 && (
        <div className="space-y-6">
          {/* 로딩 중 표시 */}
          {isGeneratingScripts ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-foreground font-medium">대본과 이미지를 생성하고 있습니다...</p>
                <p className="text-sm text-muted-foreground mt-1">잠시만 기다려주세요</p>
              </div>
            </div>
          ) : (
            <>
              {/* 첫 프레임 이미지 선택 (2개 중 1개) */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">첫 프레임 이미지 선택</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      2개의 이미지 중 마음에 드는 것을 선택하세요
                    </p>
                  </div>
                  <button
                    onClick={generateScriptsAndImage}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    다시 생성
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-4 max-w-xl mx-auto">
                  {firstFrameUrls.length > 0 ? (
                    firstFrameUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <button
                          onClick={() => {
                            setSelectedFirstFrameIndex(index)
                            setFirstFrameUrl(url)  // 압축본 (표시용)
                            setFirstFrameOriginalUrl(firstFrameOriginalUrls[index] || url)  // 원본 (영상 생성용)
                          }}
                          className={`relative w-[180px] aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${
                            selectedFirstFrameIndex === index
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`첫 프레임 옵션 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {selectedFirstFrameIndex === index && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                            옵션 {index + 1}
                          </div>
                        </button>
                        {/* 크게 보기 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(firstFrameOriginalUrls[index] || url, '_blank')
                          }}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 rounded text-white text-xs flex items-center gap-1 transition-colors"
                          title="크게 보기"
                        >
                          <Expand className="w-3 h-3" />
                          크게 보기
                        </button>
                      </div>
                    ))
                  ) : firstFrameUrl ? (
                    <div className="relative">
                      <div className="aspect-[2/3] w-[180px] rounded-lg overflow-hidden border border-border">
                        <img
                          src={firstFrameUrl}
                          alt="첫 프레임"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => window.open(firstFrameOriginalUrl || firstFrameUrl, '_blank')}
                        className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 rounded text-white text-xs flex items-center gap-1 transition-colors"
                        title="크게 보기"
                      >
                        <Expand className="w-3 h-3" />
                        크게 보기
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-[2/3] w-[180px] rounded-lg bg-secondary/30 flex items-center justify-center">
                      <p className="text-muted-foreground text-sm text-center px-2">이미지가 생성되면 여기에 표시됩니다</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI 추천 의상 표시 (ai_recommend 모드일 때) */}
              {outfitMode === 'ai_recommend' && recommendedOutfit && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">AI 추천 의상</h2>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-foreground font-medium mb-2">{recommendedOutfit.koreanDescription}</p>
                    <p className="text-sm text-muted-foreground">{recommendedOutfit.reason}</p>
                  </div>
                </div>
              )}

              {/* 대본 선택 + 음성 선택 (2열 레이아웃) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽: 대본 선택/편집 */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">대본 선택</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      3가지 스타일 중 하나를 선택하거나 직접 편집하세요
                    </p>
                  </div>

                  {/* 대본 스타일 선택 */}
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    {scripts.map((script, index) => (
                      <button
                        key={script.style}
                        onClick={() => setSelectedScriptIndex(index)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedScriptIndex === index
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground text-sm">{script.styleName}</span>
                          <span className="text-xs text-muted-foreground">
                            약 {Math.round(script.content.length / 3.7)}초
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {script.content}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* 대본 편집 */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">선택된 대본</label>
                      <button
                        onClick={() => setIsEditingScript(!isEditingScript)}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        {isEditingScript ? '완료' : '편집'}
                      </button>
                    </div>
                    <textarea
                      value={editedScript}
                      onChange={(e) => setEditedScript(e.target.value)}
                      readOnly={!isEditingScript}
                      rows={4}
                      className={`w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground resize-none ${isEditingScript
                          ? 'bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary'
                          : 'bg-secondary/30'
                        }`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {editedScript.length}자 (약 {Math.round(editedScript.length / 3.7)}초)
                    </p>
                  </div>
                </div>

                {/* 오른쪽: 음성 선택 */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">음성 선택</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      대본을 읽어줄 AI 음성을 선택하세요
                    </p>
                  </div>

                  {/* 음성 목록 */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Volume2 className="w-4 h-4 inline mr-1" />
                      AI 음성 {isLoadingVoices && <Loader2 className="w-3 h-3 inline ml-1 animate-spin" />}
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto">
                      {voices.map((voice) => (
                        <div
                          key={voice.id}
                          className={`relative text-left p-3 rounded-lg border transition-colors ${selectedVoice?.id === voice.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                            }`}
                        >
                          <button
                            onClick={() => setSelectedVoice(voice)}
                            className="w-full text-left pr-10"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">{voice.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${voice.gender === 'female'
                                  ? 'bg-pink-500/20 text-pink-500'
                                  : 'bg-blue-500/20 text-blue-500'
                                }`}>
                                {voice.gender === 'female' ? '여성' : '남성'}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{voice.description}</p>
                          </button>

                          {/* 미리듣기 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              playVoicePreview(voice)
                            }}
                            disabled={loadingPreviewId === voice.id}
                            className={`absolute top-1/2 -translate-y-1/2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${playingVoiceId === voice.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary/80 text-foreground hover:bg-primary/20'
                              } disabled:opacity-50`}
                            title={playingVoiceId === voice.id ? '정지' : '미리듣기'}
                          >
                            {loadingPreviewId === voice.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : playingVoiceId === voice.id ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3 ml-0.5" />
                            )}
                          </button>

                          {/* 선택 표시 */}
                          {selectedVoice?.id === voice.id && (
                            <div className="absolute top-1 right-1">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 max-w-2xl mx-auto">
                <button
                  onClick={() => goToStep(2)}
                  disabled={isSavingDraft}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  onClick={generateVideo}
                  disabled={!canProceedStep3 || !selectedVoice}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  영상 생성하기
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: 영상 생성 중 */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {isGeneratingAudio ? '음성을 생성하고 있습니다...' : `영상을 생성하고 있습니다 (${Math.floor(generationProgress)}%)`}
            </h2>
            <p className="text-muted-foreground mb-6">{generationStatus}</p>

            {/* 프로그레스바 (영상 생성 중에만 표시) */}
            {!isGeneratingAudio && (
              <div className="mb-6">
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out relative"
                    style={{ width: `${generationProgress}%` }}
                  >
                    {/* 99%에서 멈춰있을 때 애니메이션 */}
                    {generationProgress >= 99 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                  </div>
                </div>
                {generationProgress >= 99 && (
                  <p className="text-xs text-muted-foreground mt-2">거의 완료되었습니다. 잠시만 기다려주세요...</p>
                )}
              </div>
            )}

            {/* 진행 상태 */}
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-foreground">대본 생성 완료</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-foreground">첫 프레임 이미지 생성 완료</span>
              </div>
              <div className="flex items-center gap-3">
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-foreground">음성 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-foreground">음성 생성 완료</span>
                  </>
                )}
              </div>
              {!isGeneratingAudio && (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-foreground">영상 생성 중... ({Math.floor(generationProgress)}%)</span>
                </div>
              )}
            </div>

            {/* 첫 프레임 미리보기 */}
            {firstFrameUrl && (
              <div className="mt-6">
                <img
                  src={firstFrameUrl}
                  alt="첫 프레임"
                  className="w-32 h-56 object-cover rounded-lg mx-auto"
                />
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
