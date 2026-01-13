/**
 * 제품 설명 영상 마법사 컴포넌트
 *
 * 5단계 마법사:
 * 1. 제품/아바타 선택
 * 2. 제품 정보 + 장소 입력 + 영상 길이 선택
 * 3. 첫 프레임 이미지 확인 + 대본 선택/편집
 * 4. 음성 선택 (ElevenLabs)
 * 5. 영상 생성 (Infinitalk)
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
  FileText,
  Loader2,
  MapPin,
  Minus,
  Package,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react'
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
  voice_id: string
  name: string
  description?: string
  labels?: { gender?: string; age?: string }
  preview_url?: string
}

type WizardStep = 1 | 2 | 3 | 4 | 5
type VideoDuration = 15 | 30 | 60

// 카메라 구도 타입
type CameraComposition = 'auto' | 'selfie' | 'tripod' | 'closeup' | 'fullbody'

const cameraCompositionLabels: Record<CameraComposition, { label: string; desc: string }> = {
  auto: { label: '자동', desc: 'AI가 자연스러운 구도 선택' },
  selfie: { label: '셀카', desc: '카메라를 직접 들고 촬영' },
  tripod: { label: '삼각대', desc: '카메라 설치 후 촬영' },
  closeup: { label: '클로즈업', desc: '얼굴 위주 클로즈업' },
  fullbody: { label: '전신', desc: '전신이 보이는 구도' },
}

// ============================================================
// 컴포넌트
// ============================================================

interface DraftData {
  id: string
  wizard_step: number
  avatar_id: string | null
  outfit_id: string | null
  avatar_image_url: string | null
  product_id: string | null
  product_info: string | null
  location_prompt: string | null
  duration: number | null
  video_background: string | null
  camera_composition: string | null
  scripts_json: string | null
  script_style: string | null
  script: string | null
  first_scene_image_url: string | null
  first_frame_prompt: string | null
  voice_id: string | null
  voice_name: string | null
  status: string
}

export function ProductDescriptionWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

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

  // Step 3: 대본 및 이미지
  const [scripts, setScripts] = useState<Script[]>([])
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0)
  const [editedScript, setEditedScript] = useState('')
  const [isEditingScript, setIsEditingScript] = useState(false)
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null)
  const [locationDescription, setLocationDescription] = useState<string>('')
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false)
  const [firstFramePrompt, setFirstFramePrompt] = useState<string>('')

  // Step 4: 음성
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

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

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, voicesRes] = await Promise.all([
        fetch('/api/ad-products'),
        fetch('/api/voices'),
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

    const TOTAL_DURATION = 180 * 1000 // 180초 (Infinitalk 기준)
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
    firstFramePrompt?: string
    editedScript?: string
    selectedScriptIndex?: number
  }) => {
    setIsSavingDraft(true)
    try {
      // overrides가 있으면 overrides 값 사용, 없으면 state 값 사용
      const scriptsToSave = overrides?.scripts ?? scripts
      const locationDescToSave = overrides?.locationDescription ?? locationDescription
      const firstFrameUrlToSave = overrides?.firstFrameUrl !== undefined ? overrides.firstFrameUrl : firstFrameUrl
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
          avatarId: selectedAvatarInfo?.avatarId,
          outfitId: selectedAvatarInfo?.outfitId,
          avatarImageUrl: selectedAvatarInfo?.imageUrl,
          productId: selectedProduct?.id,
          productInfo,
          locationPrompt,
          duration,
          cameraComposition: cameraComposition !== 'auto' ? cameraComposition : null,
          scriptsJson: scriptsToSave.length > 0 ? JSON.stringify({ scripts: scriptsToSave, locationDescription: locationDescToSave }) : null,
          scriptStyle: scriptsToSave[scriptIndexToSave]?.style,
          script: editedScriptToSave,
          firstSceneImageUrl: firstFrameUrlToSave,
          firstFramePrompt: firstFramePromptToSave,
          voiceId: selectedVoice?.voice_id,
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
  }, [draftId, selectedAvatarInfo, selectedProduct, productInfo, locationPrompt, duration, cameraComposition, scripts, selectedScriptIndex, editedScript, firstFrameUrl, firstFramePrompt, locationDescription, selectedVoice])

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
            setStep(5)
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
            } else {
              // 초안 삭제
              await fetch(`/api/video-ads/draft?category=productDescription`, { method: 'DELETE' })
            }
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

    // Step 1 데이터
    if (draft.avatar_id && draft.avatar_image_url) {
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
    if (draft.first_frame_prompt) setFirstFramePrompt(draft.first_frame_prompt)

    // Step 4 데이터
    if (draft.voice_id && draft.voice_name) {
      setSelectedVoice({
        voice_id: draft.voice_id,
        name: draft.voice_name,
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

  // 편집된 제품 정보를 productInfo로 반영
  const buildProductInfoFromEditable = useCallback(() => {
    const parts: string[] = []
    if (selectedProduct) parts.push(`제품명: ${selectedProduct.name}`)
    if (editableDescription) parts.push(`설명: ${editableDescription}`)
    const validPoints = editableSellingPoints.filter(p => p.trim().length > 0)
    if (validPoints.length > 0) {
      parts.push(`핵심 특징:\n${validPoints.map(p => `- ${p}`).join('\n')}`)
    }
    setProductInfo(parts.join('\n'))
  }, [selectedProduct, editableDescription, editableSellingPoints])

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
    if (!selectedAvatarInfo || !productInfo.trim()) return

    // Step 2 데이터 저장 후 Step 3로 이동
    await saveDraft(2)
    setIsGeneratingScripts(true)
    setStep(3)

    try {
      const res = await fetch('/api/video-ads/product-description/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct?.id,
          avatarId: selectedAvatarInfo.avatarId,
          avatarImageUrl: selectedAvatarInfo.imageUrl,  // 의상 선택 시 해당 이미지 URL
          productInfo: productInfo.trim(),
          locationPrompt: locationPrompt.trim() || undefined,
          durationSeconds: duration,
          cameraComposition: cameraComposition !== 'auto' ? cameraComposition : undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '대본 생성 실패')
      }

      const data = await res.json()

      const generatedScripts = data.scripts || []
      const generatedFirstFrameUrl = data.firstFrameUrl || null
      const generatedLocationDesc = data.locationDescription || ''
      const generatedFirstFramePrompt = data.firstFramePrompt || ''
      const generatedEditedScript = generatedScripts.length > 0 ? generatedScripts[0].content : ''

      setScripts(generatedScripts)
      setFirstFrameUrl(generatedFirstFrameUrl)
      setLocationDescription(generatedLocationDesc)
      setFirstFramePrompt(generatedFirstFramePrompt)

      if (generatedScripts.length > 0) {
        setSelectedScriptIndex(0)
        setEditedScript(generatedEditedScript)
      }

      // 생성된 대본과 이미지 정보 저장 (API 응답 값을 직접 전달하여 stale closure 문제 방지)
      await saveDraft(3, {
        scripts: generatedScripts,
        locationDescription: generatedLocationDesc,
        firstFrameUrl: generatedFirstFrameUrl,
        firstFramePrompt: generatedFirstFramePrompt,
        editedScript: generatedEditedScript,
        selectedScriptIndex: 0,
      })
    } catch (error) {
      console.error('대본 생성 오류:', error)
      alert(error instanceof Error ? error.message : '대본 생성 중 오류가 발생했습니다')
      setStep(2)
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
    setStep(4)
  }

  // ============================================================
  // Step 4 → Step 5: TTS 생성 후 영상 생성
  // ============================================================

  const generateVideo = async () => {
    if (!selectedVoice || !editedScript.trim() || !selectedAvatarInfo) return

    // Step 4 데이터 저장
    await saveDraft(4)

    setIsGeneratingAudio(true)
    setGenerationStatus('음성을 생성 중입니다...')

    try {
      // TTS 생성 요청
      const ttsRes = await fetch('/api/video-ads/product-description/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: editedScript,
          voiceId: selectedVoice.voice_id,
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
      setIsGeneratingVideo(true)
      setStep(5)
      setGenerationStatus('영상을 생성 중입니다...')
      setGenerationStartTime(Date.now())
      setGenerationProgress(0)

      // 영상 생성 요청
      const videoRes = await fetch('/api/video-ads/product-description/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct?.id,
          avatarId: selectedAvatarInfo.avatarId,
          firstFrameUrl,
          audioUrl,
          script: editedScript,
          scriptStyle: scripts[selectedScriptIndex]?.style || 'custom',
          voiceId: selectedVoice.voice_id,
          voiceName: selectedVoice.name,
          locationPrompt: locationPrompt || locationDescription,
          duration,
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
    } finally {
      setIsGeneratingAudio(false)
      setIsGeneratingVideo(false)
    }
  }

  // ============================================================
  // 음성 미리듣기
  // ============================================================

  const playVoicePreview = useCallback((voice: Voice) => {
    // 현재 재생 중인 음성이면 정지
    if (playingVoiceId === voice.voice_id) {
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

    // 미리듣기 URL이 없으면 무시
    if (!voice.preview_url) {
      return
    }

    // 새 오디오 재생
    const audio = new Audio(voice.preview_url)
    audioRef.current = audio
    setPlayingVoiceId(voice.voice_id)

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

  const canProceedStep1 = selectedAvatarInfo !== null
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

  return (
    <div className="h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/video-ad"
          className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">제품 설명 영상 만들기</h1>
          <p className="text-sm text-muted-foreground">아바타가 음성으로 제품을 설명하는 영상</p>
        </div>
      </div>

      {/* 단계 표시 */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex items-center ${s < 5 ? 'flex-1' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step === s
                  ? 'bg-primary text-primary-foreground'
                  : step > s
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary text-muted-foreground'
                }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 5 && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-colors ${step > s ? 'bg-green-500' : 'bg-secondary'
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 제품/아바타 선택 */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-foreground">아바타를 선택하세요</h2>
            <p className="text-sm text-muted-foreground mt-1">
              제품을 설명할 아바타를 선택해주세요. 제품은 선택 사항입니다.
            </p>
          </div>

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
                  <img
                    src={selectedAvatarInfo.imageUrl}
                    alt={selectedAvatarInfo.displayName}
                    className="w-10 h-14 object-cover rounded"
                  />
                  <div>
                    <span className="text-foreground block">{selectedAvatarInfo.displayName}</span>
                    {selectedAvatarInfo.type === 'outfit' && (
                      <span className="text-xs text-primary">의상 교체</span>
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
          />

          {/* 제품 선택 (선택 사항) */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              제품 선택 <span className="text-muted-foreground text-xs">(선택 사항)</span>
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
                  <span className="text-muted-foreground">제품을 선택하세요 (선택 사항)</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedProduct(null)
                      setShowProductDropdown(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border"
                  >
                    <span className="text-muted-foreground">선택 안함</span>
                  </button>
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
          </div>

          {/* 선택된 제품 정보 편집 */}
          {selectedProduct && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  <Edit3 className="w-4 h-4 inline mr-2" />
                  제품 정보 (편집 가능)
                </label>
                <button
                  onClick={buildProductInfoFromEditable}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  정보 반영
                </button>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">제품 설명</label>
                <textarea
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  placeholder="제품에 대한 설명..."
                  rows={2}
                  className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* 셀링 포인트 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  셀링 포인트 <span className="text-muted-foreground/70">(예: "24시간 보습", "피부과 추천")</span>
                </label>
                <div className="space-y-2">
                  {editableSellingPoints.map((point, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updateSellingPoint(index, e.target.value)}
                        placeholder="제품의 장점이나 특징"
                        className="flex-1 px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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

      {/* Step 2: 제품 정보 입력 */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-foreground">제품 정보를 입력하세요</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI가 이 정보를 바탕으로 대본을 생성합니다
            </p>
          </div>

          {/* 제품 정보 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              제품 정보 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={productInfo}
              onChange={(e) => setProductInfo(e.target.value)}
              placeholder="제품명, 특징, 장점 등을 자유롭게 입력해주세요.&#10;예: 프리미엄 에센스 세럼, 비타민C 성분, 피부 톤업 효과, 수분 공급"
              rows={4}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* 장소 프롬프트 */}
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(Object.keys(cameraCompositionLabels) as CameraComposition[]).map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setCameraComposition(comp)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${cameraComposition === comp
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  title={cameraCompositionLabels[comp].desc}
                >
                  {cameraCompositionLabels[comp].label}
                </button>
              ))}
            </div>
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
              disabled={!canProceedStep2}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              대본 생성하기
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 대본 선택/편집 + 첫 프레임 확인 */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 대본 선택/편집 */}
          <div className="space-y-4">
            <div className="text-center lg:text-left mb-4">
              <h2 className="text-lg font-semibold text-foreground">대본을 선택하세요</h2>
              <p className="text-sm text-muted-foreground mt-1">
                3가지 스타일 중 하나를 선택하거나 직접 편집할 수 있습니다
              </p>
            </div>

            {isGeneratingScripts ? (
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-foreground font-medium">대본을 생성하고 있습니다...</p>
                <p className="text-sm text-muted-foreground mt-1">잠시만 기다려주세요</p>
              </div>
            ) : (
              <>
                {/* 대본 스타일 선택 */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  {scripts.map((script, index) => (
                    <button
                      key={script.style}
                      onClick={() => setSelectedScriptIndex(index)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${selectedScriptIndex === index
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{script.styleName}</span>
                        <span className="text-xs text-muted-foreground">
                          {script.content.length}자 (약 {Math.round(script.content.length / 3.7)}초)
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {script.content}
                      </p>
                    </button>
                  ))}
                </div>

                {/* 대본 편집 */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-foreground">
                      선택된 대본
                    </label>
                    <button
                      onClick={() => setIsEditingScript(!isEditingScript)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      {isEditingScript ? '편집 완료' : '편집하기'}
                    </button>
                  </div>
                  <textarea
                    value={editedScript}
                    onChange={(e) => setEditedScript(e.target.value)}
                    readOnly={!isEditingScript}
                    rows={6}
                    className={`w-full px-4 py-3 border border-border rounded-lg text-foreground resize-none ${isEditingScript
                        ? 'bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary'
                        : 'bg-secondary/30'
                      }`}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {editedScript.length}자 (약 {Math.round(editedScript.length / 3.7)}초)
                  </p>
                </div>
              </>
            )}

            {/* 버튼 */}
            {!isGeneratingScripts && (
              <div className="flex gap-3">
                <button
                  onClick={() => goToStep(2)}
                  disabled={isSavingDraft}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  onClick={proceedToVoiceSelection}
                  disabled={!canProceedStep3}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 오른쪽: 첫 프레임 미리보기 */}
          <div className="space-y-4">
            <div className="text-center lg:text-left mb-4">
              <h2 className="text-lg font-semibold text-foreground">첫 프레임 미리보기</h2>
              <p className="text-sm text-muted-foreground mt-1">
                생성된 이미지를 확인하세요
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="h-[480px] bg-secondary/30 flex items-center justify-center relative">
                {isGeneratingScripts ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">이미지 생성 중...</p>
                  </div>
                ) : firstFrameUrl ? (
                  <img
                    src={firstFrameUrl}
                    alt="첫 프레임"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <p className="text-muted-foreground">이미지가 생성되면 여기에 표시됩니다</p>
                )}
              </div>
            </div>

            {/* 이미지 재생성 버튼 */}
            {!isGeneratingScripts && firstFrameUrl && (
              <button
                onClick={generateScriptsAndImage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                대본 & 이미지 다시 생성
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: 음성 선택 */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-foreground">음성을 선택하세요</h2>
            <p className="text-sm text-muted-foreground mt-1">
              대본을 읽어줄 AI 음성을 선택해주세요
            </p>
          </div>

          {/* 음성 목록 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Volume2 className="w-4 h-4 inline mr-2" />
              AI 음성 선택
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {voices.map((voice) => (
                <div
                  key={voice.voice_id}
                  className={`relative text-left p-4 rounded-lg border transition-colors ${selectedVoice?.voice_id === voice.voice_id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  {/* 선택 영역 */}
                  <button
                    onClick={() => setSelectedVoice(voice)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{voice.name}</span>
                      <div className="flex items-center gap-2">
                        {voice.labels?.gender && (
                          <span className={`text-xs px-2 py-0.5 rounded ${voice.labels.gender === 'female'
                              ? 'bg-pink-500/20 text-pink-500'
                              : 'bg-blue-500/20 text-blue-500'
                            }`}>
                            {voice.labels.gender === 'female' ? '여성' : '남성'}
                          </span>
                        )}
                      </div>
                    </div>
                    {voice.description && (
                      <p className="text-xs text-muted-foreground">{voice.description}</p>
                    )}
                  </button>

                  {/* 미리듣기 버튼 */}
                  {voice.preview_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playVoicePreview(voice)
                      }}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${playingVoiceId === voice.voice_id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/80 text-foreground hover:bg-primary/20'
                        }`}
                      title={playingVoiceId === voice.voice_id ? '정지' : '미리듣기'}
                    >
                      {playingVoiceId === voice.voice_id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                  )}

                  {/* 선택 표시 */}
                  {selectedVoice?.voice_id === voice.voice_id && (
                    <div className="absolute bottom-3 right-3">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 선택된 대본 미리보기 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              선택된 대본
            </label>
            <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
              {editedScript}
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => goToStep(3)}
              disabled={isSavingDraft}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </button>
            <button
              onClick={generateVideo}
              disabled={!canProceedStep4 || isGeneratingAudio}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  음성 생성 중...
                </>
              ) : (
                <>
                  영상 생성하기
                  <Play className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: 영상 생성 중 */}
      {step === 5 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">영상을 생성하고 있습니다({Math.floor(generationProgress)}%)</h2>
            <p className="text-muted-foreground mb-6">{generationStatus}</p>

            {/* 프로그레스바 */}
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
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-foreground">음성 생성 완료</span>
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-foreground">영상 생성 중... ({Math.floor(generationProgress)}%)</span>
              </div>
            </div>

            {/* 첫 프레임 미리보기 */}
            {firstFrameUrl && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-2">첫 프레임 미리보기</p>
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
  )
}
