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
import { useCredits } from '@/contexts/credit-context'
import { PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST } from '@/lib/credits'
import { InsufficientCreditsModal } from '@/components/ui/insufficient-credits-modal'
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
  GraduationCap,
  Loader2,
  MapPin,
  Mic,
  Minus,
  Monitor,
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
import { ProductCreateModal, AdProduct as ModalAdProduct } from './product-create-modal'
import { useAsyncDraftSave } from '@/lib/hooks/use-async-draft-save'

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

// 이미지 생성 요청 정보 (비동기 폴링용)
interface ImageRequest {
  requestId: string
  provider: 'fal' | 'kie' | 'kie-zimage'
  index: number
}

interface Voice {
  id: string
  voice_id?: string
  name: string
  description: string
  gender: 'male' | 'female' | 'unknown' | string
  style: string
  sampleText?: string
  previewUrl: string | null
  preview_url?: string | null
  labels?: Record<string, string>
  category?: string
}

type WizardStep = 1 | 2 | 3 | 4
type VideoDuration = 15 | 30 | 60
type VideoResolution = '480p' | '720p'
type VideoType = 'UGC' | 'podcast' | 'expert'

// 영상 타입 정보
interface VideoTypeInfo {
  label: string
  desc: string
  icon: 'User' | 'Mic' | 'GraduationCap'
  recommendedCompositions: ('auto' | 'selfie-high' | 'selfie-front' | 'selfie-side' | 'tripod' | 'closeup' | 'fullbody' | 'ugc-closeup' | 'ugc-selfie')[]
  recommendedPoses: ('auto' | 'holding-product' | 'showing-product' | 'using-product' | 'talking-only')[]
  recommendedOutfits: ('casual_everyday' | 'formal_elegant' | 'professional_business' | 'sporty_athletic' | 'cozy_comfortable' | 'trendy_fashion' | 'minimal_simple')[]
}

const videoTypeLabels: Record<VideoType, VideoTypeInfo> = {
  UGC: {
    label: 'UGC Style',
    desc: 'Natural like an influencer',
    icon: 'User',
    recommendedCompositions: ['ugc-selfie', 'ugc-closeup', 'selfie-front', 'selfie-high'],
    recommendedPoses: ['holding-product', 'showing-product', 'using-product'],
    recommendedOutfits: ['casual_everyday', 'trendy_fashion', 'cozy_comfortable'],
  },
  podcast: {
    label: 'Podcast',
    desc: 'Intimate like a conversation',
    icon: 'Mic',
    recommendedCompositions: ['tripod', 'closeup', 'selfie-front'],
    recommendedPoses: ['talking-only', 'holding-product'],
    recommendedOutfits: ['cozy_comfortable', 'casual_everyday', 'minimal_simple'],
  },
  expert: {
    label: 'Expert Explanation',
    desc: 'Professional explanation',
    icon: 'GraduationCap',
    recommendedCompositions: ['tripod', 'fullbody', 'selfie-front'],
    recommendedPoses: ['talking-only', 'showing-product'],
    recommendedOutfits: ['professional_business', 'formal_elegant', 'minimal_simple'],
  },
}

const videoTypeOptions: VideoType[] = ['UGC', 'podcast', 'expert']

// 카메라 구도 타입 (영상 스타일별로 다른 옵션 제공)
type CameraComposition =
  // 공통
  | 'auto' | 'closeup'
  // UGC용 (셀카 스타일)
  | 'selfie-high' | 'selfie-front' | 'selfie-side' | 'ugc-closeup' | 'ugc-selfie'
  // Podcast용 (웹캠/데스크 스타일)
  | 'webcam' | 'medium-shot' | 'three-quarter'
  // Expert용 (전문가 스타일)
  | 'tripod' | 'fullbody' | 'presenter'

// 카메라 구도 정보
interface CameraCompositionInfo {
  label: string
  desc: string
  exampleImage: string
}

const cameraCompositionLabels: Record<CameraComposition, CameraCompositionInfo> = {
  // Common
  auto: {
    label: 'Auto',
    desc: 'AI selects natural composition',
    exampleImage: '/images/camera/auto.png',
  },
  closeup: {
    label: 'Close-up',
    desc: 'Face-focused close shot',
    exampleImage: '/images/camera/closeup.png',
  },
  // UGC
  'selfie-high': {
    label: 'Selfie (High Angle)',
    desc: 'Looking down from above',
    exampleImage: '/images/camera/selfie-high.png',
  },
  'selfie-front': {
    label: 'Selfie (Front)',
    desc: 'Eye level front shot',
    exampleImage: '/images/camera/selfie-front.png',
  },
  'selfie-side': {
    label: 'Selfie (Side)',
    desc: 'Slightly from the side',
    exampleImage: '/images/camera/selfie-side.png',
  },
  'ugc-closeup': {
    label: 'Influencer Close-up',
    desc: 'Chest to face close shot',
    exampleImage: '/images/camera/ugc-closeup.png',
  },
  'ugc-selfie': {
    label: 'UGC Selfie',
    desc: 'Phone selfie composition',
    exampleImage: '/images/camera/ugc-selfie.png',
  },
  // Podcast
  webcam: {
    label: 'Webcam Front',
    desc: 'Standard podcast style',
    exampleImage: '/images/camera/webcam.png',
  },
  'medium-shot': {
    label: 'Medium Shot',
    desc: 'Upper body visible',
    exampleImage: '/images/camera/medium-shot.png',
  },
  'three-quarter': {
    label: '3/4 View',
    desc: 'Slightly angled view',
    exampleImage: '/images/camera/three-quarter.png',
  },
  // Expert
  tripod: {
    label: 'Front (Tripod)',
    desc: 'Stable front shot',
    exampleImage: '/images/camera/tripod.png',
  },
  fullbody: {
    label: 'Full Body',
    desc: 'Full body visible',
    exampleImage: '/images/camera/fullbody.png',
  },
  presenter: {
    label: 'Presenter',
    desc: 'Speaker/presenter style',
    exampleImage: '/images/camera/presenter.png',
  },
}

// 영상 스타일별 카메라 구도 옵션
const cameraCompositionsByVideoType: Record<VideoType, CameraComposition[]> = {
  UGC: ['auto', 'selfie-front', 'selfie-high', 'selfie-side', 'ugc-selfie', 'ugc-closeup'],
  podcast: ['auto', 'webcam', 'medium-shot', 'closeup', 'three-quarter'],
  expert: ['auto', 'tripod', 'medium-shot', 'closeup', 'fullbody', 'presenter'],
}

// 영상 스타일별 기본 카메라 구도
const defaultCameraByVideoType: Record<VideoType, CameraComposition> = {
  UGC: 'auto',
  podcast: 'webcam',
  expert: 'tripod',
}

// 모델 포즈 타입 (영상 스타일별로 다른 옵션 제공)
type ModelPose =
  // 공통
  | 'auto' | 'talking-only' | 'showing-product'
  // UGC용
  | 'holding-product' | 'using-product' | 'reaction'
  // Podcast용
  | 'desk-presenter' | 'casual-chat'
  // Expert용
  | 'demonstrating' | 'presenting' | 'explaining'

// 모델 포즈 정보
interface ModelPoseInfo {
  label: string
  desc: string
}

const modelPoseLabels: Record<ModelPose, ModelPoseInfo> = {
  // Common
  auto: {
    label: 'Auto',
    desc: 'AI selects pose for product',
  },
  'talking-only': {
    label: 'Talking Only',
    desc: 'Explain without product',
  },
  'showing-product': {
    label: 'Showing Product',
    desc: 'Show product to camera',
  },
  // UGC
  'holding-product': {
    label: 'Holding Product',
    desc: 'Hold product naturally',
  },
  'using-product': {
    label: 'Using Product',
    desc: 'Demonstrate using product',
  },
  reaction: {
    label: 'Reaction',
    desc: 'React to product',
  },
  // Podcast
  'desk-presenter': {
    label: 'At Desk',
    desc: 'Present at desk',
  },
  'casual-chat': {
    label: 'Casual Chat',
    desc: 'Natural conversation style',
  },
  // Expert
  demonstrating: {
    label: 'Demonstrating',
    desc: 'Demonstrate features',
  },
  presenting: {
    label: 'Presenter',
    desc: 'Expert presentation pose',
  },
  explaining: {
    label: 'Explaining',
    desc: 'Serious explanation',
  },
}

// 영상 스타일별 모델 포즈 옵션
const modelPosesByVideoType: Record<VideoType, ModelPose[]> = {
  UGC: ['auto', 'holding-product', 'using-product', 'showing-product', 'reaction'],
  podcast: ['auto', 'desk-presenter', 'casual-chat', 'showing-product', 'talking-only'],
  expert: ['auto', 'presenting', 'explaining', 'demonstrating', 'showing-product', 'talking-only'],
}

// 영상 스타일별 기본 모델 포즈
const defaultPoseByVideoType: Record<VideoType, ModelPose> = {
  UGC: 'auto',
  podcast: 'desk-presenter',
  expert: 'presenting',
}

// 의상 설정 모드 타입
type OutfitMode = 'keep_original' | 'ai_recommend' | 'preset' | 'custom'

// 의상 프리셋 타입
type OutfitPreset = 'casual_everyday' | 'formal_elegant' | 'professional_business' | 'sporty_athletic' | 'cozy_comfortable' | 'trendy_fashion' | 'minimal_simple'

// AI 추천 의상 정보 타입
interface RecommendedOutfit {
  description: string           // 의상 설명 (영어, 프롬프트용)
  localizedDescription: string  // 의상 설명 (사용자 선택 언어로 표시)
  reason: string                // 추천 이유 (사용자 선택 언어)
}

// 의상 프리셋 정보
interface OutfitPresetInfo {
  label: string
  desc: string
}

const outfitPresetLabels: Record<OutfitPreset, OutfitPresetInfo> = {
  casual_everyday: {
    label: 'Casual',
    desc: 'Comfortable t-shirts, jeans, everyday style',
  },
  formal_elegant: {
    label: 'Formal/Elegant',
    desc: 'Sophisticated dress or suit, luxurious atmosphere',
  },
  professional_business: {
    label: 'Business',
    desc: 'Professional business suit, clean shirt',
  },
  sporty_athletic: {
    label: 'Sporty',
    desc: 'Athletic wear, athleisure style',
  },
  cozy_comfortable: {
    label: 'Cozy',
    desc: 'Knits, cardigans, warm and comfortable style',
  },
  trendy_fashion: {
    label: 'Trendy',
    desc: 'Latest fashion trends, fashionable look',
  },
  minimal_simple: {
    label: 'Minimal',
    desc: 'Simple solid colors, restrained elegance',
  },
}

// 의상 프리셋 목록
const outfitPresetOptions: OutfitPreset[] = ['casual_everyday', 'formal_elegant', 'professional_business', 'sporty_athletic', 'cozy_comfortable', 'trendy_fashion', 'minimal_simple']

// ============================================================
// 배경/장소 프리셋 (영상 스타일별로 다른 옵션 제공)
// ============================================================
type LocationPreset =
  // UGC용 (일상적, 자연스러운)
  | 'living_room' | 'bedroom' | 'cafe' | 'outdoor' | 'bathroom'
  // Podcast용 (전문적이면서 캐주얼)
  | 'home_office' | 'study' | 'podcast_studio'
  // Expert용 (권위적, 전문적)
  | 'studio' | 'office' | 'meeting_room' | 'minimal'
  // 공통
  | 'custom'

interface LocationPresetInfo {
  label: string
  desc: string
  promptValue: string  // 프롬프트에 사용될 영문 설명
}

const locationPresetLabels: Record<LocationPreset, LocationPresetInfo> = {
  // UGC
  living_room: {
    label: 'Living Room',
    desc: 'Warm home interior background',
    promptValue: 'cozy modern living room with warm ambient lighting, comfortable sofa visible in background',
  },
  bedroom: {
    label: 'Bedroom',
    desc: 'Comfortable bedroom atmosphere',
    promptValue: 'cozy bedroom setting with soft bedding visible, intimate and relaxed atmosphere',
  },
  cafe: {
    label: 'Cafe',
    desc: 'Trendy cafe atmosphere',
    promptValue: 'trendy cafe interior with warm lighting, coffee shop atmosphere, blurred background elements',
  },
  outdoor: {
    label: 'Outdoor',
    desc: 'Natural light outdoor background',
    promptValue: 'bright outdoor setting with natural daylight, greenery in soft focus background',
  },
  bathroom: {
    label: 'Bathroom',
    desc: 'For beauty/skincare products',
    promptValue: 'clean modern bathroom with bright lighting, mirror and vanity visible, skincare routine setting',
  },
  // Podcast
  home_office: {
    label: 'Home Office',
    desc: 'Clean desk/workspace',
    promptValue: 'clean home office setup with minimal desk, organized bookshelf, natural light from window',
  },
  study: {
    label: 'Study',
    desc: 'Intellectual space with bookshelves',
    promptValue: 'intellectual study room with bookshelves in background, warm desk lamp lighting, scholarly atmosphere',
  },
  podcast_studio: {
    label: 'Podcast Studio',
    desc: 'Professional space with mic/lighting',
    promptValue: 'professional podcast studio setup with acoustic panels, warm ambient lighting, content creator atmosphere',
  },
  // Expert
  studio: {
    label: 'Studio',
    desc: 'Simple solid background',
    promptValue: 'professional studio setting with soft gradient background, clean and minimal',
  },
  office: {
    label: 'Office',
    desc: 'Professional office environment',
    promptValue: 'professional corporate office with modern furniture, clean lines, business environment',
  },
  meeting_room: {
    label: 'Meeting Room',
    desc: 'Presentation/seminar atmosphere',
    promptValue: 'professional meeting room with presentation setup, corporate environment, authority setting',
  },
  minimal: {
    label: 'Minimal',
    desc: 'Clean white/gray background',
    promptValue: 'clean minimal white or light gray background, simple and distraction-free',
  },
  // Common
  custom: {
    label: 'Custom',
    desc: 'Describe your own location',
    promptValue: '',
  },
}

// 영상 스타일별 추천 장소 프리셋
const locationPresetsByVideoType: Record<VideoType, LocationPreset[]> = {
  UGC: ['living_room', 'bedroom', 'cafe', 'outdoor', 'bathroom', 'custom'],
  podcast: ['home_office', 'study', 'podcast_studio', 'living_room', 'custom'],
  expert: ['studio', 'office', 'meeting_room', 'minimal', 'custom'],
}

// 영상 스타일별 기본 장소
const defaultLocationByVideoType: Record<VideoType, LocationPreset> = {
  UGC: 'living_room',
  podcast: 'home_office',
  expert: 'studio',
}

// ============================================================
// 컴포넌트
// ============================================================

interface DraftData {
  id: string
  category: string
  wizard_step: number
  avatar_id: string | null
  outfit_id: string | null
  avatar_image_url: string | null
  ai_avatar_options: string | null  // AI 아바타 옵션 JSON
  product_id: string | null
  product_info: string | null
  location_prompt: string | null
  duration: number | null
  resolution: string | null
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
  first_scene_options: string | null  // 이미지 폴링 요청 정보 JSON
  voice_id: string | null
  voice_name: string | null
  video_type: string | null  // 비디오 타입 (UGC, podcast, expert)
  kie_request_id: string | null  // TTS taskId ('tts:{taskId}' 형식)
  status: string
}

interface ProductDescriptionWizardProps {
  initialProductId?: string | null
  initialAvatarType?: 'ai' | 'avatar' | 'outfit' | null
  initialAvatarId?: string | null
  initialOutfitId?: string | null
  initialAiAvatarOptions?: string | null
  initialStep?: number
}

export function ProductDescriptionWizard(props: ProductDescriptionWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const { credits, refreshCredits } = useCredits()

  // URL에서 videoAdId 파라미터 확인 (재개 시)
  const resumeVideoAdId = searchParams.get('videoAdId')

  // 온보딩에서 전달된 쿼리 파라미터 (props 우선, searchParams 폴백)
  const initialProductId = props.initialProductId ?? searchParams.get('productId')
  const initialAvatarType = props.initialAvatarType ?? searchParams.get('avatarType') as 'ai' | 'avatar' | 'outfit' | null
  const initialAvatarId = props.initialAvatarId ?? searchParams.get('avatarId')
  const initialOutfitId = props.initialOutfitId ?? searchParams.get('outfitId')
  const initialAiAvatarOptions = props.initialAiAvatarOptions ?? searchParams.get('aiAvatarOptions')
  const initialStep = props.initialStep ?? parseInt(searchParams.get('step') || '1', 10)

  // 마법사 단계 (온보딩에서 전달된 initialStep 사용)
  const [step, setStep] = useState<WizardStep>(initialStep as WizardStep)

  // 초안 저장 관련
  const [draftId, setDraftId] = useState<string | null>(null)
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
  const [showProductCreateModal, setShowProductCreateModal] = useState(false)

  // Step 1: 제품 정보 편집 (선택된 제품의 정보를 편집할 수 있도록)
  const [editableDescription, setEditableDescription] = useState('')
  const [editableSellingPoints, setEditableSellingPoints] = useState<string[]>([''])

  // Step 2: 입력
  const [productInfo, setProductInfo] = useState('')
  const [locationPrompt, setLocationPrompt] = useState('')  // custom 장소 입력용
  const [duration, setDuration] = useState<VideoDuration>(30)
  const [resolution, setResolution] = useState<VideoResolution>('480p')
  const [cameraComposition, setCameraComposition] = useState<CameraComposition>('auto')
  const [modelPose, setModelPose] = useState<ModelPose>('auto')
  const [outfitMode, setOutfitMode] = useState<OutfitMode>('keep_original')
  const [outfitPreset, setOutfitPreset] = useState<OutfitPreset | null>(null)
  const [outfitCustom, setOutfitCustom] = useState('')
  const [recommendedOutfit, setRecommendedOutfit] = useState<RecommendedOutfit | null>(null)
  const [scriptLanguage, setScriptLanguage] = useState<'ko' | 'en' | 'ja' | 'zh'>(
    (language as 'ko' | 'en' | 'ja' | 'zh') || 'ko'
  )
  const [videoType, setVideoType] = useState<VideoType>('UGC')

  // 새 옵션: 배경/장소
  const [locationPreset, setLocationPreset] = useState<LocationPreset>('living_room')

  // videoType 변경 시 해당 스타일에 맞는 기본값으로 자동 변경
  useEffect(() => {
    // 장소 프리셋 체크
    const availableLocations = locationPresetsByVideoType[videoType]
    if (!availableLocations.includes(locationPreset)) {
      setLocationPreset(defaultLocationByVideoType[videoType])
    }

    // 카메라 구도 체크
    const availableCameras = cameraCompositionsByVideoType[videoType]
    if (!availableCameras.includes(cameraComposition)) {
      setCameraComposition(defaultCameraByVideoType[videoType])
    }

    // 모델 포즈 체크
    const availablePoses = modelPosesByVideoType[videoType]
    if (!availablePoses.includes(modelPose)) {
      setModelPose(defaultPoseByVideoType[videoType])
    }
  }, [videoType, locationPreset, cameraComposition, modelPose])

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

  // 이미지 비동기 로딩 상태
  const [imageRequests, setImageRequests] = useState<ImageRequest[]>([])  // 이미지 생성 요청 정보
  const [isLoadingImages, setIsLoadingImages] = useState(false)  // 이미지 로딩 중 여부
  const imagePollingRef = useRef<NodeJS.Timeout | null>(null)  // 폴링 타이머 ref
  const isImagePollingInProgressRef = useRef(false)  // 중복 요청 방지
  // startImagePolling 함수 참조 (restoreDraftData에서 사용)
  type StartImagePollingFn = (
    requests: ImageRequest[],
    generatedScripts: Script[],
    generatedLocationDesc: string,
    generatedFirstFramePrompt: string,
    generatedEditedScript: string
  ) => Promise<void>
  const startImagePollingRef = useRef<StartImagePollingFn | null>(null)

  // Step 3: 음성 (Step 4에서 통합됨)
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isLoadingVoices, setIsLoadingVoices] = useState(false)

  // Step 5: 영상 생성
  const [videoAdId, setVideoAdId] = useState<string | null>(null)
  const [videoRequestId, setVideoRequestId] = useState<string | null>(null)
  const [videoProvider, setVideoProvider] = useState<'wavespeed' | 'kie' | null>(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)

  // 초안 복원 중 플래그 (useEffect에서 editedScript 덮어쓰기 방지)
  const isRestoringDraft = useRef(false)

  // saveDraft 직후 loadExistingData 스킵용 flag (URL 업데이트 후 불필요한 재로드 방지)
  const skipNextLoadRef = useRef(false)

  // ============================================================
  // 데이터 로드
  // ============================================================

  // 특정 언어의 음성 목록 불러오기 (ElevenLabs API)
  const fetchVoicesByLanguage = useCallback(async (lang: 'ko' | 'en' | 'ja' | 'zh') => {
    setIsLoadingVoices(true)
    try {
      const res = await fetch(`/api/voices?language=${lang}`)
      if (res.ok) {
        const data = await res.json()
        setVoices(data.voices || [])
      }
    } catch (error) {
      console.error('Failed to load voice list:', error)
    } finally {
      setIsLoadingVoices(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, voicesRes] = await Promise.all([
        fetch('/api/ad-products'),
        fetch('/api/voices?language=ko'),  // 기본값: 한국어 음성 (ElevenLabs)
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
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 온보딩에서 전달된 초기 데이터 로드
  useEffect(() => {
    // 초기 제품 로드 (재개 중이 아닌 경우에만)
    if (initialProductId && !resumeVideoAdId) {
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
              brand: data.product.brand,
              price: data.product.price,
              source_url: data.product.source_url,
            })
            // 제품 정보도 함께 설정
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

    // 초기 아바타 설정 (재개 중이 아닌 경우에만)
    if (!resumeVideoAdId) {
      if (initialAvatarType === 'ai' && initialAiAvatarOptions) {
        // AI 추천 아바타
        try {
          const options = JSON.parse(initialAiAvatarOptions)
          setSelectedAvatarInfo({
            type: 'ai-generated',
            avatarId: '',
            avatarName: 'AI 추천',
            imageUrl: '',
            displayName: 'AI 추천 아바타',
            aiOptions: options,
          })
        } catch {
          console.error('AI 아바타 옵션 파싱 오류')
        }
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
          .catch(err => console.error('Failed to load initial avatars:', err))
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
          .catch(err => console.error('Failed to load initial outfits:', err))
      }
    }
  }, [initialProductId, initialAvatarType, initialAvatarId, initialOutfitId, initialAiAvatarOptions, resumeVideoAdId])

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
  // 비동기 초안 저장
  // ============================================================

  // 비동기 저장 함수 (안정적인 참조 유지)
  const asyncSaveFn = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/video-ads/draft', {
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
        currentUrl.searchParams.set('draftId', data.draft.id)
        window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search)
      }

      return data.draft.id
    }
    return null
  }, [])

  // 비동기 Draft 저장 훅
  const {
    queueSave,
    isSaving,
    pendingSave,
  } = useAsyncDraftSave(asyncSaveFn, {
    debounceMs: 300,
    maxRetries: 3,
    retryDelayMs: 1000,
  })

  // 페이지 이탈 방지 (저장 대기 중일 때)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSave || isSaving) {
        e.preventDefault()
        e.returnValue = '저장되지 않은 변경사항이 있습니다.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pendingSave, isSaving])

  // 최신 상태를 참조하기 위한 ref (클로저 문제 해결)
  const stateRef = useRef({
    draftId, selectedAvatarInfo, selectedProduct, productInfo, locationPrompt,
    duration, resolution, cameraComposition, modelPose, outfitMode, outfitPreset, outfitCustom,
    scripts, selectedScriptIndex, editedScript, firstFrameUrl, firstFrameUrls,
    firstFrameOriginalUrls, firstFramePrompt, locationDescription, selectedVoice, videoType,
    imageRequests,  // 이미지 폴링 요청 정보
  })
  useEffect(() => {
    stateRef.current = {
      draftId, selectedAvatarInfo, selectedProduct, productInfo, locationPrompt,
      duration, resolution, cameraComposition, modelPose, outfitMode, outfitPreset, outfitCustom,
      scripts, selectedScriptIndex, editedScript, firstFrameUrl, firstFrameUrls,
      firstFrameOriginalUrls, firstFramePrompt, locationDescription, selectedVoice, videoType,
      imageRequests,  // 이미지 폴링 요청 정보
    }
  }, [draftId, selectedAvatarInfo, selectedProduct, productInfo, locationPrompt,
    duration, resolution, cameraComposition, modelPose, outfitMode, outfitPreset, outfitCustom,
    scripts, selectedScriptIndex, editedScript, firstFrameUrl, firstFrameUrls,
    firstFrameOriginalUrls, firstFramePrompt, locationDescription, selectedVoice, videoType, imageRequests])

  // 비동기 Draft 저장 (단계 전환 시 사용)
  const saveDraftAsync = useCallback((currentStep: WizardStep, overrides?: {
    scripts?: Script[]
    locationDescription?: string
    firstFrameUrl?: string | null
    firstFrameUrls?: string[]
    firstFrameOriginalUrls?: string[]
    firstFramePrompt?: string
    editedScript?: string
    selectedScriptIndex?: number
    imageRequests?: ImageRequest[]  // 이미지 폴링 요청 정보
    ttsTaskId?: string | null  // TTS 폴링용 taskId
    status?: 'DRAFT' | 'GENERATING_IMAGES' | 'GENERATING_AUDIO'
  }) => {
    const state = stateRef.current

    // overrides가 있으면 overrides 값 사용, 없으면 state 값 사용
    const scriptsToSave = overrides?.scripts ?? state.scripts
    const locationDescToSave = overrides?.locationDescription ?? state.locationDescription
    const firstFrameUrlToSave = overrides?.firstFrameUrl !== undefined ? overrides.firstFrameUrl : state.firstFrameUrl
    const firstFrameUrlsToSave = overrides?.firstFrameUrls ?? state.firstFrameUrls
    const firstFrameOriginalUrlsToSave = overrides?.firstFrameOriginalUrls ?? state.firstFrameOriginalUrls
    const firstFramePromptToSave = overrides?.firstFramePrompt ?? state.firstFramePrompt
    const editedScriptToSave = overrides?.editedScript ?? state.editedScript
    const scriptIndexToSave = overrides?.selectedScriptIndex ?? state.selectedScriptIndex
    const imageRequestsToSave = overrides?.imageRequests ?? state.imageRequests

    const payload = {
      id: state.draftId,
      category: 'productDescription',
      wizardStep: currentStep,
      status: overrides?.status,
      avatarId: state.selectedAvatarInfo?.avatarId,
      outfitId: state.selectedAvatarInfo?.outfitId,
      avatarImageUrl: state.selectedAvatarInfo?.imageUrl,
      aiAvatarOptions: state.selectedAvatarInfo?.type === 'ai-generated' ? state.selectedAvatarInfo.aiOptions : undefined,
      productId: state.selectedProduct?.id,
      productInfo: state.productInfo,
      locationPrompt: state.locationPrompt,
      duration: state.duration,
      resolution: state.resolution,
      cameraComposition: state.cameraComposition !== 'auto' ? state.cameraComposition : null,
      modelPose: state.modelPose !== 'auto' ? state.modelPose : null,
      outfitMode: state.outfitMode !== 'keep_original' ? state.outfitMode : null,
      outfitPreset: state.outfitMode === 'preset' ? state.outfitPreset : null,
      outfitCustom: state.outfitMode === 'custom' ? state.outfitCustom : null,
      scriptsJson: scriptsToSave.length > 0 ? JSON.stringify({ scripts: scriptsToSave, locationDescription: locationDescToSave }) : null,
      scriptStyle: scriptsToSave[scriptIndexToSave]?.style,
      script: editedScriptToSave,
      firstSceneImageUrl: firstFrameUrlToSave,
      firstFrameUrls: firstFrameUrlsToSave.length > 0 ? firstFrameUrlsToSave : null,
      firstFrameOriginalUrls: firstFrameOriginalUrlsToSave.length > 0 ? firstFrameOriginalUrlsToSave : null,
      firstFramePrompt: firstFramePromptToSave,
      imageRequests: imageRequestsToSave.length > 0 ? imageRequestsToSave : null,  // 이미지 폴링 요청 정보
      ttsTaskId: overrides?.ttsTaskId,  // TTS 폴링용 taskId
      voiceId: state.selectedVoice?.id,
      voiceName: state.selectedVoice?.name,
      videoType: state.videoType,
    }

    queueSave(payload)
  }, [queueSave])

  // 기존 초안 또는 진행 중인 영상 광고 로드
  const loadExistingData = useCallback(async () => {
    // saveDraft 직후 호출 시 스킵 (이미 Context에 최신 상태가 있음)
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false
      return
    }

    // URL에서 draftId 쿼리 파라미터 확인
    const draftIdParam = searchParams.get('draftId')

    if (resumeVideoAdId) {
      // URL에서 videoAdId가 있는 경우 해당 데이터 로드
      setIsLoadingDraft(true)
      try {
        const res = await fetch(`/api/video-ads/status/${resumeVideoAdId}`, { cache: 'no-store' })
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

            // requestId와 provider가 있으면 직접 AI 서비스 폴링
            if (statusData.requestId && statusData.provider) {
              setVideoRequestId(statusData.requestId)
              setVideoProvider(statusData.provider)
              pollVideoStatus(statusData.requestId, statusData.provider, resumeVideoAdId)
            }
            return
          }
        }

        // 초안(DRAFT) 데이터 로드
        const draftRes = await fetch(`/api/video-ads/draft?id=${resumeVideoAdId}`, { cache: 'no-store' })
        if (draftRes.ok) {
          const draftData = await draftRes.json()
          if (draftData.draft) {
            restoreDraftData(draftData.draft)
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoadingDraft(false)
      }
    } else if (draftIdParam) {
      // URL에 draftId 쿼리 파라미터가 있으면 해당 드래프트 로드
      setIsLoadingDraft(true)
      try {
        const res = await fetch(`/api/video-ads/draft?id=${draftIdParam}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.draft) {
            restoreDraftData(data.draft)
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      } finally {
        setIsLoadingDraft(false)
      }
    } else {
      // 새로운 영상 생성 (draftId 없이 접근한 경우)
      // 기존 초안 확인하지 않고 새로 시작
    }
  }, [resumeVideoAdId, router, searchParams])

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
    if (draft.resolution) setResolution(draft.resolution as VideoResolution)
    if (draft.camera_composition) setCameraComposition(draft.camera_composition as CameraComposition)
    if (draft.model_pose) setModelPose(draft.model_pose as ModelPose)
    if (draft.outfit_mode) setOutfitMode(draft.outfit_mode as OutfitMode)
    if (draft.outfit_preset) setOutfitPreset(draft.outfit_preset as OutfitPreset)
    if (draft.outfit_custom) setOutfitCustom(draft.outfit_custom)
    if (draft.video_type) setVideoType(draft.video_type as VideoType)

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
        console.error('Script parsing error:', e)
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

    // 이미지 폴링 상태 복원 (GENERATING_IMAGES 상태일 때)
    let restoredImageRequests: ImageRequest[] = []
    if (draft.first_scene_options) {
      try {
        restoredImageRequests = JSON.parse(draft.first_scene_options)
        if (Array.isArray(restoredImageRequests) && restoredImageRequests.length > 0) {
          setImageRequests(restoredImageRequests)
        }
      } catch (e) {
        console.error('이미지 요청 정보 파싱 오류:', e)
      }
    }

    // 마법사 단계 복원
    if (draft.wizard_step >= 1 && draft.wizard_step <= 5) {
      setStep(draft.wizard_step as WizardStep)
    }

    // GENERATING_IMAGES 상태이면 이미지 폴링 재개
    if (draft.status === 'GENERATING_IMAGES' && restoredImageRequests.length > 0) {
      console.log('[드래프트 복원] 이미지 폴링 재개:', restoredImageRequests)
      setIsLoadingImages(true)

      // scripts 데이터 파싱
      let restoredScripts: Script[] = []
      let restoredLocationDesc = ''
      if (draft.scripts_json) {
        try {
          const parsedData = JSON.parse(draft.scripts_json)
          if (parsedData.scripts && Array.isArray(parsedData.scripts)) {
            restoredScripts = parsedData.scripts
            restoredLocationDesc = parsedData.locationDescription || ''
          } else if (Array.isArray(parsedData)) {
            restoredScripts = parsedData
          }
        } catch (e) {
          console.error('대본 파싱 오류 (폴링 재개용):', e)
        }
      }

      // 이미지 폴링 재개 (setTimeout으로 상태 업데이트 후 실행, ref 사용)
      setTimeout(() => {
        if (startImagePollingRef.current) {
          startImagePollingRef.current(
            restoredImageRequests,
            restoredScripts,
            restoredLocationDesc,
            draft.first_frame_prompt || '',
            draft.script || ''
          )
        }
      }, 500)  // ref가 초기화될 시간을 위해 약간 지연
    }

    // GENERATING_SCRIPTS 상태 복구 처리
    // 스크립트 생성은 동기식이므로 중간에 페이지를 떠나면 복구할 수 없음
    // Step 2로 폴백하고 DRAFT 상태로 변경
    if (draft.status === 'GENERATING_SCRIPTS') {
      console.log('[드래프트 복원] GENERATING_SCRIPTS 상태 감지 - Step 2로 폴백')
      setStep(2)
      // 백그라운드에서 상태를 DRAFT로 업데이트
      fetch('/api/video-ads/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draft.id,
          category: draft.category,
          wizardStep: 2,
          status: 'DRAFT',
        }),
      }).catch(console.error)
    }

    // GENERATING_IMAGES 상태인데 imageRequests가 없는 경우 처리
    // 이미지 요청 정보가 손실되어 폴링을 재개할 수 없음
    // Step 2로 폴백하고 DRAFT 상태로 변경
    if (draft.status === 'GENERATING_IMAGES' && restoredImageRequests.length === 0) {
      console.log('[드래프트 복원] GENERATING_IMAGES 상태이나 imageRequests 없음 - Step 2로 폴백')
      setStep(2)
      // 백그라운드에서 상태를 DRAFT로 업데이트
      fetch('/api/video-ads/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draft.id,
          category: draft.category,
          wizardStep: 2,
          status: 'DRAFT',
        }),
      }).catch(console.error)
    }

    // GENERATING_AUDIO 상태 복구 처리
    // TTS taskId가 있으면 폴링 재개, 없으면 Step 3으로 폴백
    if (draft.status === 'GENERATING_AUDIO') {
      // kie_request_id에서 TTS taskId 추출 (형식: 'tts:{taskId}')
      const ttsTaskId = draft.kie_request_id?.startsWith('tts:')
        ? draft.kie_request_id.substring(4)
        : null

      if (ttsTaskId) {
        console.log('[드래프트 복원] GENERATING_AUDIO 상태 - TTS 폴링 재개:', ttsTaskId)
        // Step 4로 이동하고 TTS 폴링 재개
        setStep(4)
        setIsGeneratingAudio(true)
        setIsGeneratingVideo(true)
        setGenerationStatus('음성을 생성 중입니다...')
        setGenerationStartTime(Date.now())
        setGenerationProgress(0)

        // TTS 폴링 재개 (setTimeout으로 상태 업데이트 후 실행)
        setTimeout(() => {
          pollTTSStatus(ttsTaskId)
        }, 500)
      } else {
        // TTS taskId가 없으면 Step 3으로 폴백
        console.log('[드래프트 복원] GENERATING_AUDIO 상태이나 ttsTaskId 없음 - Step 3으로 폴백')
        setStep(3)
        // 백그라운드에서 상태를 DRAFT로 업데이트
        fetch('/api/video-ads/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: draft.id,
            category: draft.category,
            wizardStep: 3,
            status: 'DRAFT',
          }),
        }).catch(console.error)
      }
    }
  }

  // 영상 상태 폴링 (AI 서비스 직접 조회)
  const pollVideoStatus = async (
    reqId: string,
    provider: 'wavespeed' | 'kie',
    adId: string
  ): Promise<void> => {
    try {
      const statusRes = await fetch(
        `/api/video-ads/product-description/video-status?requestId=${reqId}&provider=${provider}&videoAdId=${adId}`
      )
      if (!statusRes.ok) throw new Error('상태 확인 실패')

      const status = await statusRes.json()

      if (status.status === 'COMPLETED') {
        setGenerationStatus('완료!')
        // 크레딧 갱신
        refreshCredits()
        setTimeout(() => {
          // replace 사용: 뒤로가기 시 생성 페이지가 아닌 목록 페이지로 이동
          router.replace(`/dashboard/video-ad/${adId}`)
        }, 1000)
        return
      }

      if (status.status === 'FAILED') {
        throw new Error(status.error || 'Video generation failed')
      }

      if (status.queuePosition) {
        setGenerationStatus(`영상 생성 중... (대기열 ${status.queuePosition}번째)`)
      } else {
        setGenerationStatus('영상 생성 중...')
      }

      await new Promise(resolve => setTimeout(resolve, 3000))
      return pollVideoStatus(reqId, provider, adId)
    } catch (error) {
      console.error('Status polling error:', error)
      setGenerationStatus('오류가 발생했습니다')
      setIsGeneratingVideo(false)
      // 영상 재개 중 에러 발생 시 목록 페이지로 이동
      setTimeout(() => {
        router.replace('/dashboard/video-ad')
      }, 2000)
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

  // AI 아바타 선택 시 의상 모드 자동 변경
  useEffect(() => {
    // AI 아바타인데 '기존 의상 유지' 모드라면 'AI 추천'으로 자동 변경
    if (selectedAvatarInfo?.type === 'ai-generated' && outfitMode === 'keep_original') {
      setOutfitMode('ai_recommend')
    }
  }, [selectedAvatarInfo?.type, outfitMode])

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

  // 새 제품 생성 완료 시 처리
  const handleProductCreated = (newProduct: ModalAdProduct) => {
    // 목록에 새 제품 추가 및 자동 선택
    const productWithFields: AdProduct = {
      ...newProduct,
      description: newProduct.description || null,
      selling_points: newProduct.selling_points || null,
      brand: null,
      price: null,
      source_url: null,
    }
    setProducts(prev => [productWithFields, ...prev])
    setSelectedProduct(productWithFields)
    setShowProductCreateModal(false)
  }

  // 대본 예상 시간 계산 (언어별 다른 계산 방식 적용)
  const estimateScriptDuration = (text: string): number => {
    if (scriptLanguage === 'en') {
      // 영어: 단어 수 기준 (약 2.5 단어/초)
      const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length
      return Math.round(wordCount / 2.5)
    } else if (scriptLanguage === 'ja') {
      // 일본어: 글자 수 기준 (약 4.5 글자/초)
      return Math.round(text.length / 4.5)
    } else if (scriptLanguage === 'zh') {
      // 중국어: 글자 수 기준 (약 4.0 글자/초)
      return Math.round(text.length / 4.0)
    } else {
      // 한국어 기본: 글자 수 기준 (약 5.0 글자/초, 여유 있게 3.7로 계산)
      return Math.round(text.length / 3.7)
    }
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
  // 이미지 폴링 함수 (비동기 이미지 로딩)
  // ============================================================

  const startImagePolling = useCallback(async (
    requests: ImageRequest[],
    generatedScripts: Script[],
    generatedLocationDesc: string,
    generatedFirstFramePrompt: string,
    generatedEditedScript: string
  ) => {
    // 기존 폴링 타이머 정리
    if (imagePollingRef.current) {
      clearInterval(imagePollingRef.current)
    }

    // 이미지 폴링 시작 시 드래프트 저장 (GENERATING_IMAGES 상태)
    saveDraftAsync(3, {
      scripts: generatedScripts,
      locationDescription: generatedLocationDesc,
      firstFramePrompt: generatedFirstFramePrompt,
      editedScript: generatedEditedScript,
      selectedScriptIndex: 0,
      imageRequests: requests,
      status: 'GENERATING_IMAGES',
    })

    const maxAttempts = 40  // 최대 40회 (2분)
    let attempts = 0

    const pollImages = async () => {
      // 이전 요청이 진행 중이면 스킵
      if (isImagePollingInProgressRef.current) return

      isImagePollingInProgressRef.current = true
      attempts++
      console.log(`[이미지 폴링] 시도 ${attempts}/${maxAttempts}`)

      try {
        const res = await fetch(`/api/video-ads/product-description/image-status?requests=${encodeURIComponent(JSON.stringify(requests))}`)
        if (!res.ok) {
          console.error('Failed to check image status:', res.status)
          return
        }

        const data = await res.json()
        console.log('[이미지 폴링] 응답:', data)

        if (data.allCompleted) {
          // 모든 이미지 완료 - 폴링 중지
          if (imagePollingRef.current) {
            clearInterval(imagePollingRef.current)
            imagePollingRef.current = null
          }

          // 완료된 이미지 URL 추출
          const completedUrls = data.results
            .filter((r: { status: string; imageUrl: string | null }) => r.status === 'COMPLETED' && r.imageUrl)
            .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
            .map((r: { imageUrl: string }) => r.imageUrl)

          if (completedUrls.length > 0) {
            // R2 업로드 요청
            const uploadRes = await fetch('/api/video-ads/product-description/image-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrls: completedUrls }),
            })

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json()
              const uploadedUrls = uploadData.uploadResults
                .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
                .map((r: { compressedUrl: string }) => r.compressedUrl)
              const originalUrls = uploadData.uploadResults
                .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
                .map((r: { originalUrl: string }) => r.originalUrl)

              setFirstFrameUrls(uploadedUrls)
              setFirstFrameOriginalUrls(originalUrls)
              setFirstFrameUrl(uploadedUrls[0] || null)
              setFirstFrameOriginalUrl(originalUrls[0] || null)
              setSelectedFirstFrameIndex(0)

              // 이미지 로딩 완료 후 draft 저장
              saveDraftAsync(3, {
                scripts: generatedScripts,
                locationDescription: generatedLocationDesc,
                firstFrameUrl: uploadedUrls[0] || null,
                firstFrameUrls: uploadedUrls,
                firstFrameOriginalUrls: originalUrls,
                firstFramePrompt: generatedFirstFramePrompt,
                editedScript: generatedEditedScript,
                selectedScriptIndex: 0,
                status: 'DRAFT',
              })
            } else {
              // 업로드 실패 시 원본 URL 사용
              setFirstFrameUrls(completedUrls)
              setFirstFrameOriginalUrls(completedUrls)
              setFirstFrameUrl(completedUrls[0] || null)
              setFirstFrameOriginalUrl(completedUrls[0] || null)
              setSelectedFirstFrameIndex(0)

              // R2 업로드 실패해도 원본 URL로 DB 저장
              saveDraftAsync(3, {
                scripts: generatedScripts,
                locationDescription: generatedLocationDesc,
                firstFrameUrl: completedUrls[0] || null,
                firstFrameUrls: completedUrls,
                firstFrameOriginalUrls: completedUrls,
                firstFramePrompt: generatedFirstFramePrompt,
                editedScript: generatedEditedScript,
                selectedScriptIndex: 0,
                status: 'DRAFT',
              })
            }
          } else {
            // 모든 이미지가 완료되었지만 성공한 것이 없는 경우 (모두 실패)
            console.error('[이미지 폴링] 모든 이미지 생성 실패')
            // Step 2로 폴백하여 사용자가 다시 시도할 수 있게 함
            saveDraftAsync(2, {
              status: 'DRAFT',
            })
          }

          setIsLoadingImages(false)
          setImageRequests([])
          console.log('[이미지 폴링] 완료!')
        } else if (data.anyFailed || attempts >= maxAttempts) {
          // 실패 또는 타임아웃
          if (imagePollingRef.current) {
            clearInterval(imagePollingRef.current)
            imagePollingRef.current = null
          }
          setIsLoadingImages(false)
          setImageRequests([])
          console.error('[이미지 폴링] 실패 또는 타임아웃')

          // 실패 시에도 DRAFT 상태로 변경하여 사용자가 다시 시도할 수 있게 함
          saveDraftAsync(2, {
            status: 'DRAFT',
          })
        }
      } catch (error) {
        console.error('[이미지 폴링] 오류:', error)
      } finally {
        isImagePollingInProgressRef.current = false
      }
    }

    // 첫 폴링 (3초 후)
    setTimeout(pollImages, 3000)
    // 이후 3초 간격으로 폴링
    imagePollingRef.current = setInterval(pollImages, 3000)
  }, [saveDraftAsync])

  // startImagePolling ref 업데이트 (restoreDraftData에서 사용)
  useEffect(() => {
    startImagePollingRef.current = startImagePolling
  }, [startImagePolling])

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (imagePollingRef.current) {
        clearInterval(imagePollingRef.current)
      }
    }
  }, [])

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

    // 참고: GENERATING_SCRIPTS 상태는 저장하지 않음 (Gemini API는 동기식이므로 폴링 불가)
    // 중간에 페이지를 떠나면 Step 2로 복원됨
    try {
      const res = await fetch('/api/video-ads/product-description/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct?.id,
          avatarId: selectedAvatarInfo.avatarId,
          avatarImageUrl: selectedAvatarInfo.imageUrl,  // 의상 선택 시 해당 이미지 URL
          productInfo: currentProductInfo.trim(),
          // 배경/장소 설정
          locationPreset,  // 장소 프리셋
          locationPrompt: locationPreset === 'custom' ? locationPrompt.trim() : locationPresetLabels[locationPreset].promptValue,
          durationSeconds: duration,
          cameraComposition: cameraComposition !== 'auto' ? cameraComposition : undefined,
          modelPose: modelPose !== 'auto' ? modelPose : undefined,
          // 의상 설정
          outfitMode: outfitMode !== 'keep_original' ? outfitMode : undefined,
          outfitPreset: outfitMode === 'preset' ? outfitPreset : undefined,
          outfitCustom: outfitMode === 'custom' && outfitCustom.trim() ? outfitCustom.trim() : undefined,
          language: scriptLanguage,  // 대본 생성 언어
          videoType,  // 비디오 타입 (UGC, podcast, expert)
          // AI 아바타 옵션 (AI 생성 아바타일 때만)
          aiAvatarOptions: selectedAvatarInfo.type === 'ai-generated' ? selectedAvatarInfo.aiOptions : undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Script generation failed')
      }

      const data = await res.json()

      // 대본 즉시 설정 (이미지 로딩 전)
      const generatedScripts = data.scripts || []
      const generatedLocationDesc = data.locationDescription || ''
      const generatedFirstFramePrompt = data.firstFramePrompt || ''
      const generatedEditedScript = generatedScripts.length > 0 ? generatedScripts[0].content : ''

      setScripts(generatedScripts)
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

      // 이미지 요청 정보가 있으면 폴링 시작
      const receivedImageRequests: ImageRequest[] = data.imageRequests || []
      if (receivedImageRequests.length > 0) {
        setImageRequests(receivedImageRequests)
        setIsLoadingImages(true)
        // 이미지 폴링 시작 (백그라운드에서 실행)
        startImagePolling(receivedImageRequests, generatedScripts, generatedLocationDesc, generatedFirstFramePrompt, generatedEditedScript)
      } else {
        // 하위 호환성: imageRequests가 없으면 기존 방식 (이미 완료된 이미지)
        const generatedFirstFrameUrls: string[] = data.firstFrameUrls || (data.firstFrameUrl ? [data.firstFrameUrl] : [])
        const generatedFirstFrameOriginalUrls: string[] = data.firstFrameOriginalUrls || generatedFirstFrameUrls
        setFirstFrameUrls(generatedFirstFrameUrls)
        setFirstFrameOriginalUrls(generatedFirstFrameOriginalUrls)
        setFirstFrameUrl(generatedFirstFrameUrls[0] || null)
        setFirstFrameOriginalUrl(generatedFirstFrameOriginalUrls[0] || null)
        setSelectedFirstFrameIndex(0)

        // 생성된 대본과 이미지 정보 저장
        saveDraftAsync(3, {
          scripts: generatedScripts,
          locationDescription: generatedLocationDesc,
          firstFrameUrl: generatedFirstFrameUrls[0] || null,
          firstFrameUrls: generatedFirstFrameUrls,
          firstFrameOriginalUrls: generatedFirstFrameOriginalUrls,
          firstFramePrompt: generatedFirstFramePrompt,
          editedScript: generatedEditedScript,
          selectedScriptIndex: 0,
          status: 'DRAFT',
        })
      }
    } catch (error) {
      console.error('Script generation error:', error)
      alert(error instanceof Error ? error.message : '대본 생성 중 오류가 발생했습니다')
      setStep(2)
      // 에러 발생 시 DRAFT 상태로 복원
      saveDraftAsync(2, { status: 'DRAFT' })    } finally {
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
    saveDraftAsync(3)

    // Step 2에서 선택한 언어로 음성 목록 불러오기
    setSelectedVoice(null)  // 음성 선택 초기화
    await fetchVoicesByLanguage(scriptLanguage)

    setStep(4)
  }

  // ============================================================
  // Step 4 → Step 5: TTS 생성 후 영상 생성
  // ============================================================

  // TTS 완료 후 영상 생성 진행
  const proceedToVideoGeneration = async (audioUrl: string) => {
    setIsGeneratingAudio(false)
    setGenerationStatus('영상을 생성 중입니다...')

    // 영상 생성 요청 (원본 이미지 URL 사용 - 압축본은 표시용으로만)
    const videoRes = await fetch('/api/video-ads/product-description/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct?.id,
        avatarId: selectedAvatarInfo?.avatarId,
        firstFrameUrl: firstFrameOriginalUrl || firstFrameUrl,  // 원본 우선, 없으면 압축본 fallback
        audioUrl,
        script: editedScript,
        scriptStyle: scripts[selectedScriptIndex]?.style || 'custom',
        voiceId: selectedVoice?.id,
        voiceName: selectedVoice?.name,
        locationPrompt: locationPrompt || locationDescription,
        duration,
        resolution,
        // 영상 프롬프트 생성을 위한 추가 정보
        cameraComposition: cameraComposition !== 'auto' ? cameraComposition : undefined,
        productName: selectedProduct?.name,
        productDescription: productInfo,
        videoType,  // 비디오 타입 (UGC, podcast, expert)
      }),
    })

    if (!videoRes.ok) {
      const error = await videoRes.json()
      throw new Error(error.error || 'Failed to request video generation')
    }

    const videoData = await videoRes.json()
    setVideoAdId(videoData.videoAdId)
    setVideoRequestId(videoData.requestId)
    setVideoProvider(videoData.provider)

    // 영상 생성이 시작되면 초안 삭제 (영상 광고 레코드가 생성됨)
    if (draftId) {
      fetch(`/api/video-ads/draft?id=${draftId}`, { method: 'DELETE' }).catch(console.error)
      setDraftId(null)
    }

    // AI 서비스 직접 상태 폴링
    pollVideoStatus(videoData.requestId, videoData.provider, videoData.videoAdId)
  }

  // TTS 폴링 함수
  const pollTTSStatus = async (taskId: string) => {
    const maxAttempts = 60  // 최대 60회 (2분)
    let attempts = 0

    const poll = async () => {
      attempts++
      try {
        const res = await fetch(`/api/video-ads/product-description/tts-status?taskId=${taskId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('TTS 상태 확인 실패')

        const data = await res.json()

        if (data.status === 'COMPLETED') {
          console.log('[TTS 폴링] 완료:', data.audioUrl)
          await proceedToVideoGeneration(data.audioUrl)
          return
        }

        if (data.status === 'FAILED') {
          throw new Error(data.error || 'TTS 생성 실패')
        }

        // 계속 폴링
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)  // 2초 간격
        } else {
          throw new Error('TTS 생성 시간 초과')
        }
      } catch (error) {
        console.error('[TTS 폴링] 오류:', error)
        setIsGeneratingAudio(false)
        setIsGeneratingVideo(false)
        setGenerationError(error instanceof Error ? error.message : '음성 생성 실패')
        // Step 3으로 폴백
        setStep(3)
        saveDraftAsync(3, { status: 'DRAFT', ttsTaskId: null })
      }
    }

    poll()
  }

  const generateVideo = async () => {
    if (!selectedVoice || !editedScript.trim() || !selectedAvatarInfo) return

    // 크레딧 체크
    const requiredCredits = PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST[resolution]
    if (credits !== null && credits < requiredCredits) {
      setShowInsufficientCreditsModal(true)
      return
    }

    // 버튼 클릭 즉시 Step 4로 이동
    setStep(4)
    setIsGeneratingAudio(true)
    setIsGeneratingVideo(true)
    setGenerationStatus('음성을 생성 중입니다...')
    setGenerationStartTime(Date.now())
    setGenerationProgress(0)

    try {
      // TTS 작업 제출 (taskId만 반환, 완료 대기 X)
      const ttsRes = await fetch('/api/video-ads/product-description/tts-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: editedScript,
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
          languageCode: scriptLanguage,
        }),
      })

      if (!ttsRes.ok) {
        const error = await ttsRes.json()
        throw new Error(error.error || 'TTS 작업 제출 실패')
      }

      const ttsData = await ttsRes.json()
      const ttsTaskId = ttsData.taskId

      // GENERATING_AUDIO 상태 + ttsTaskId 저장 (복구용)
      saveDraftAsync(4, { status: 'GENERATING_AUDIO', ttsTaskId })

      // TTS 폴링 시작 (완료 시 proceedToVideoGeneration 호출)
      pollTTSStatus(ttsTaskId)
    } catch (error) {
      console.error('TTS submit error:', error)
      setGenerationError(error instanceof Error ? error.message : 'TTS 작업 제출 실패')
      setIsGeneratingAudio(false)
      setIsGeneratingVideo(false)
      // Step 3으로 돌아가기
      setStep(3)
      saveDraftAsync(3, { status: 'DRAFT' })
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
        audioRef.current.oncanplaythrough = null
        audioRef.current.onended = null
        audioRef.current.onerror = null
        audioRef.current = null
      }
      setPlayingVoiceId(null)
      return
    }

    // 다른 음성 재생 중이면 정지 및 정리
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.oncanplaythrough = null
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }

    setLoadingPreviewId(voice.id)

    // previewUrl이 없으면 API를 통해 실시간 생성
    let previewUrl = voice.previewUrl

    if (!previewUrl) {
      try {
        console.log(`[Preview] 프리뷰 생성 요청: voice=${voice.id}, language=${scriptLanguage}`)
        const res = await fetch(`/api/minimax-voices/preview?voiceId=${voice.id}&language=${scriptLanguage}`)
        if (!res.ok) {
          throw new Error(`프리뷰 생성 실패: ${res.status}`)
        }
        const data = await res.json()
        previewUrl = data.audioUrl
        console.log(`[Preview] 프리뷰 생성 완료: ${previewUrl}`)
      } catch (err) {
        console.error('프리뷰 생성 오류:', err)
        setLoadingPreviewId(null)
        return
      }
    }

    if (!previewUrl) {
      console.warn('프리뷰 URL을 가져올 수 없습니다:', voice.id)
      setLoadingPreviewId(null)
      return
    }

    // 새 오디오 재생
    const audio = new Audio(previewUrl)
    audioRef.current = audio

    audio.oncanplaythrough = () => {
      setLoadingPreviewId(null)
      setPlayingVoiceId(voice.id)
      audio.play().catch(err => {
        console.error('Audio playback error:', err)
        setPlayingVoiceId(null)
      })
    }

    audio.onended = () => {
      setPlayingVoiceId(null)
    }

    audio.onerror = () => {
      setLoadingPreviewId(null)
      setPlayingVoiceId(null)
      console.error('Audio load error:', voice.id)
    }

    // 오디오 로드 시작
    audio.load()
  }, [playingVoiceId, scriptLanguage])

  // 오디오 정리 함수
  const stopAudioPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.oncanplaythrough = null
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
    setPlayingVoiceId(null)
    setLoadingPreviewId(null)
  }, [])

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      stopAudioPreview()
    }
  }, [stopAudioPreview])

  // 스텝 변경 시 오디오 정리 (음성 선택 스텝에서 벗어날 때)
  useEffect(() => {
    // 스텝이 변경될 때마다 오디오 중단
    stopAudioPreview()
  }, [step, stopAudioPreview])

  // 브라우저 페이지 이탈 시 오디오 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopAudioPreview()
    }

    const handleVisibilityChange = () => {
      // 탭이 숨겨질 때 (다른 탭으로 이동 등) 오디오 중단
      if (document.hidden) {
        stopAudioPreview()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [stopAudioPreview])

  // ============================================================
  // 단계별 유효성 검사
  // ============================================================

  const canProceedStep1 = selectedAvatarInfo !== null && selectedProduct !== null
  const canProceedStep2 = productInfo.trim().length > 0
  const canProceedStep3 = editedScript.trim().length > 0 && firstFrameUrl !== null && !isLoadingImages
  const canProceedStep4 = selectedVoice !== null

  // ============================================================
  // 단계 네비게이션 (초안 저장 포함)
  // ============================================================

  const goToStep = (targetStep: WizardStep) => {
    // 즉시 단계 이동 후 백그라운드에서 저장
    setStep(targetStep)
    saveDraftAsync(targetStep)
    // 스크롤 최상단으로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
            <p className="text-sm text-muted-foreground">{(t.productDescWizard as Record<string, string>)?.loadingDraft || 'Loading saved data...'}</p>
          )}
        </div>
      </div>
    )
  }

  // Step info
  const STEPS = [
    { step: 1, title: 'Product/Avatar', description: 'Select product and avatar' },
    { step: 2, title: 'Video Info', description: 'Enter video information' },
    { step: 3, title: 'Script/Voice', description: 'Select script and voice' },
    { step: 4, title: 'Generate', description: 'Generate video' },
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

          {/* 제품 등록 모달 */}
          <ProductCreateModal
            isOpen={showProductCreateModal}
            onClose={() => setShowProductCreateModal(false)}
            onProductCreated={handleProductCreated}
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
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground text-sm mb-3">등록된 제품이 없습니다</p>
                      <button
                        onClick={() => {
                          setShowProductDropdown(false)
                          setShowProductCreateModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        제품 등록하기
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* 새 제품 추가 버튼 */}
                      <button
                        onClick={() => {
                          setShowProductDropdown(false)
                          setShowProductCreateModal(true)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border text-primary"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="font-medium">새 제품 등록</span>
                      </button>
                      {products.map((product) => (
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
                      ))}
                    </>
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
                    placeholder={t.productDescWizard.placeholders.productDescription}
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
                          placeholder={t.productDescWizard.placeholders.sellingPoint}
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

          {/* 다음 버튼 */}
          <button
            onClick={() => goToStep(2)}
            disabled={!canProceedStep1}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
            <ArrowRight className="w-4 h-4" />
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

          {/* Script language selection */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Globe className="w-4 h-4 inline mr-2" />
              {t.productDescriptionVideo?.scriptLanguage || 'Script Language'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { code: 'ko', label: 'Korean' },
                { code: 'en', label: 'English' },
                { code: 'ja', label: 'Japanese' },
                { code: 'zh', label: 'Chinese' },
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

          {/* Video resolution */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Monitor className="w-4 h-4 inline mr-2" />
              {t.productDescriptionVideo?.resolution || 'Video Resolution'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: '480p', label: '480p', desc: t.productDescriptionVideo?.fastGeneration || 'Fast generation' },
                { value: '720p', label: '720p', desc: t.productDescriptionVideo?.highQuality || 'High quality' },
              ] as const).map((r) => (
                <button
                  key={r.value}
                  onClick={() => setResolution(r.value)}
                  className={`py-3 rounded-lg border text-sm font-medium transition-colors ${resolution === r.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                >
                  <div>{r.label}</div>
                  <div className="text-xs opacity-70">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 영상 스타일 선택 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Sparkles className="w-4 h-4 inline mr-2" />
              영상 스타일
            </label>
            <div className="grid grid-cols-3 gap-3">
              {videoTypeOptions.map((type) => {
                const info = videoTypeLabels[type]
                const IconComponent = type === 'UGC' ? User : type === 'podcast' ? Mic : GraduationCap
                return (
                  <button
                    key={type}
                    onClick={() => setVideoType(type)}
                    className={`relative p-4 rounded-xl border text-center transition-colors ${videoType === type
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <IconComponent className={`w-6 h-6 mx-auto mb-2 ${videoType === type ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className={`font-medium text-sm ${videoType === type ? 'text-primary' : 'text-foreground'}`}>
                      {info.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {info.desc}
                    </div>
                    {videoType === type && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 배경/장소 프리셋 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <MapPin className="w-4 h-4 inline mr-2" />
              배경/장소
              <span className="text-xs text-muted-foreground ml-2">(선택 사항)</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {locationPresetsByVideoType[videoType].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setLocationPreset(preset)
                    if (preset !== 'custom') {
                      setLocationPrompt('')
                    }
                  }}
                  className={`relative group p-3 rounded-lg border transition-colors text-left ${
                    locationPreset === preset
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  title={locationPresetLabels[preset].desc}
                >
                  <span className={`text-sm font-medium ${locationPreset === preset ? 'text-primary' : 'text-foreground'}`}>
                    {locationPresetLabels[preset].label}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {locationPresetLabels[preset].desc}
                  </p>
                  {locationPreset === preset && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 직접 입력 필드 */}
            {locationPreset === 'custom' && (
              <input
                type="text"
                value={locationPrompt}
                onChange={(e) => setLocationPrompt(e.target.value)}
                placeholder={t.productDescWizard.placeholders.locationDescription}
                className="mt-3 w-full px-4 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            )}
          </div>

          {/* 카메라 구도 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Camera className="w-4 h-4 inline mr-2" />
              카메라 구도
              <span className="text-xs text-muted-foreground ml-2">(선택 사항)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {cameraCompositionsByVideoType[videoType].map((comp) => (
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
                  <div className="w-full aspect-square rounded bg-secondary/50 mb-1.5 flex items-center justify-center overflow-hidden">
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
                  <div className="absolute inset-0 bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-[10px] text-white text-center leading-tight">
                      {cameraCompositionLabels[comp].desc}
                    </p>
                  </div>
                </button>
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {modelPosesByVideoType[videoType].map((pose) => (
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
            <div className={`grid grid-cols-2 ${selectedAvatarInfo?.type === 'ai-generated' ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} gap-2 mb-4`}>
              {/* 기존 의상 유지 - AI 아바타가 아닐 때만 표시 */}
              {selectedAvatarInfo?.type !== 'ai-generated' && (
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
              )}
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
                placeholder={t.productDescWizard.placeholders.outfitDescription}
                className="w-full px-4 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => goToStep(1)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
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
                    disabled={isLoadingImages}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingImages ? 'animate-spin' : ''}`} />
                    {isLoadingImages ? '이미지 생성 중...' : '다시 생성'}
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-4 max-w-xl mx-auto">
                  {isLoadingImages ? (
                    // 이미지 로딩 중 스켈레톤 표시
                    <>
                      {[0, 1].map((index) => (
                        <div key={index} className="relative">
                          <div className="w-[180px] aspect-[2/3] rounded-lg overflow-hidden border-2 border-border bg-secondary/30 animate-pulse flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-muted-foreground text-sm">이미지 생성 중...</p>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                            옵션 {index + 1}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : firstFrameUrls.length > 0 ? (
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
                          title={t.common?.viewLarge || 'View Large'}
                        >
                          <Expand className="w-3 h-3" />
                          {t.common?.viewLarge || 'View Large'}
                        </button>
                      </div>
                    ))
                  ) : firstFrameUrl ? (
                    <div className="relative">
                      <div className="aspect-[2/3] w-[180px] rounded-lg overflow-hidden border border-border">
                        <img
                          src={firstFrameUrl}
                          alt={t.productDescWizard?.firstFrame || 'First Frame'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => window.open(firstFrameOriginalUrl || firstFrameUrl, '_blank')}
                        className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 rounded text-white text-xs flex items-center gap-1 transition-colors"
                        title={t.common?.viewLarge || 'View Large'}
                      >
                        <Expand className="w-3 h-3" />
                        {t.common?.viewLarge || 'View Large'}
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-[2/3] w-[180px] rounded-lg bg-secondary/30 flex items-center justify-center">
                      <p className="text-muted-foreground text-sm text-center px-2">이미지가 생성되면 여기에 표시됩니다</p>
                    </div>
                  )}
                </div>
              </div>

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
                            약 {estimateScriptDuration(script.content)}초
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {script.content}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Script editing */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">{t.productDescriptionVideo?.selectedScript || 'Selected Script'}</label>
                      <button
                        onClick={() => setIsEditingScript(!isEditingScript)}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        {isEditingScript ? (t.common?.done || 'Done') : (t.common?.edit || 'Edit')}
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
                      {editedScript.length} {t.productDescriptionVideo?.characters || 'chars'} (~{estimateScriptDuration(editedScript)}{t.productDescriptionVideo?.seconds || 's'})
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
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
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
                                {voice.gender === 'female' ? (t.common?.female || 'Female') : (t.common?.male || 'Male')}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{voice.description}</p>
                          </button>

                          {/* Preview button */}
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
                            title={playingVoiceId === voice.id ? (t.common?.stop || 'Stop') : (t.common?.preview || 'Preview')}
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  onClick={generateVideo}
                  disabled={!canProceedStep3 || !selectedVoice || isLoadingImages}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingImages ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      이미지 로딩 중...
                    </>
                  ) : (
                    <>
                      영상 생성하기 ({PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST[resolution]} 크레딧)
                      <Play className="w-4 h-4" />
                    </>
                  )}
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
                  alt={t.productDescWizard?.firstFrame || 'First Frame'}
                  className="w-32 h-56 object-cover rounded-lg mx-auto"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 크레딧 부족 모달 */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        requiredCredits={PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST[resolution]}
        availableCredits={credits ?? 0}
        featureName="제품 설명 영상 생성"
      />
      </div>
    </div>
  )
}
