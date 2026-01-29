'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  RefreshCw,
  ImageIcon,
  AlertCircle,
  Sparkles,
  X,
  MessageSquarePlus,
  GripVertical,
  Coins,
} from 'lucide-react'
import Image from 'next/image'
import { useProductAdWizard, SceneKeyframe, SceneInfo } from './wizard-context'
import { uploadSceneKeyframeImage } from '@/lib/client/image-upload'
import { useCredits } from '@/contexts/credit-context'
import { KEYFRAME_CREDIT_COST } from '@/lib/credits'
import { InsufficientCreditsModal } from '@/components/ui/insufficient-credits-modal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 재생성 모달 컴포넌트
function RegenerateModal({
  isOpen,
  onClose,
  onConfirm,
  sceneIndex,
  scenePrompt,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (additionalPrompt: string) => void
  sceneIndex: number
  scenePrompt: string
  isLoading: boolean
}) {
  const [additionalPrompt, setAdditionalPrompt] = useState('')

  useEffect(() => {
    if (isOpen) {
      setAdditionalPrompt('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">씬 {sceneIndex + 1} 다시 생성</h3>
            <p className="text-sm text-muted-foreground mt-1">
              추가 프롬프트를 입력하면 기존 시나리오와 함께 반영됩니다
            </p>
          </div>

          {/* 현재 씬 프롬프트 미리보기 */}
          <div className="p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">현재 씬 프롬프트</p>
            <p className="text-sm text-foreground line-clamp-3">{scenePrompt}</p>
          </div>

          {/* 추가 프롬프트 입력 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquarePlus className="w-4 h-4 text-muted-foreground" />
              추가 프롬프트
              <span className="text-xs text-muted-foreground font-normal">(선택)</span>
            </label>
            <textarea
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="예: 더 밝은 조명으로, 배경을 심플하게..."
              className="w-full px-3 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={() => onConfirm(additionalPrompt)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  다시 생성
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 비율에 따른 aspect ratio 클래스 반환
function getAspectRatioClass(ratio: string | null): string {
  switch (ratio) {
    case '16:9': return 'aspect-video'
    case '9:16': return 'aspect-[9/16]'
    case '1:1': return 'aspect-square'
    default: return 'aspect-video'
  }
}

// 드래그 가능한 키프레임 카드 컴포넌트
function SortableKeyframeCard({
  kf,
  onRegenerate,
  isRegenerating,
  isGeneratingKeyframes,
  aspectRatio,
}: {
  kf: SceneKeyframe
  onRegenerate: (sceneIndex: number) => void
  isRegenerating: boolean
  isGeneratingKeyframes: boolean
  aspectRatio: string | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `keyframe-${kf.sceneIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  const canDrag = kf.status === 'completed' && !isGeneratingKeyframes

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full min-w-[200px]"
    >
      <div className={`relative rounded-xl overflow-hidden border-2 bg-secondary/20 ${
        isDragging ? 'ring-2 ring-primary shadow-lg' :
        kf.status === 'completed'
          ? 'border-green-500/50'
          : kf.status === 'failed'
          ? 'border-red-500/50'
          : 'border-border'
      }`}>
        {/* 씬 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border/30">
          <div className="flex items-center gap-2">
            {/* 드래그 핸들 */}
            {canDrag && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 hover:bg-secondary/50 rounded transition-colors"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <div className={`w-2 h-2 rounded-full ${
              kf.status === 'completed' ? 'bg-green-500' :
              kf.status === 'failed' ? 'bg-red-500' :
              'bg-primary animate-pulse'
            }`} />
            <span className="text-sm font-medium text-foreground">씬 {kf.sceneIndex + 1}</span>
          </div>
          {(kf.status === 'completed' || kf.status === 'failed') && (
            <button
              onClick={() => onRegenerate(kf.sceneIndex)}
              disabled={isRegenerating || isGeneratingKeyframes}
              className="p-1.5 bg-secondary/50 text-muted-foreground rounded hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
              title="다시 생성"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* 이미지 영역 */}
        <div className={`relative ${getAspectRatioClass(aspectRatio)} bg-black/20`}>
          {kf.status === 'completed' && kf.imageUrl ? (
            <Image
              src={kf.imageUrl}
              alt={`씬 ${kf.sceneIndex + 1}`}
              fill
              className="object-contain"
            />
          ) : kf.status === 'failed' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-destructive/5 to-destructive/10">
              <AlertCircle className="w-10 h-10 text-destructive mb-2" />
              <span className="text-sm text-destructive">생성 실패</span>
              <button
                onClick={() => onRegenerate(kf.sceneIndex)}
                className="mt-2 px-3 py-1.5 text-xs bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-secondary/30 to-secondary/50">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-primary/50" />
                </div>
              </div>
              <span className="text-sm text-muted-foreground mt-3">생성 중...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export function WizardStep4() {
  const {
    aspectRatio,
    sceneCount,
    sceneElements,  // 씬별 광고 요소 추가
    selectedProduct,
    scenarioInfo,
    setScenarioInfo,
    sceneKeyframes,
    setSceneKeyframes,
    updateSceneKeyframe,
    reorderSceneKeyframes,
    isGeneratingKeyframes,
    setIsGeneratingKeyframes,
    canProceedToStep5,
    goToNextStep,
    goToPrevStep,
    saveDraftAsync,
    isVideoSettingsFromScenario,
    unlockVideoSettings,
  } = useProductAdWizard()

  const { refreshCredits } = useCredits()

  const [error, setError] = useState<string | null>(null)
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null)
  const [modalSceneIndex, setModalSceneIndex] = useState<number | null>(null)
  const [isMergingPrompt, setIsMergingPrompt] = useState(false)
  const keyframePollingRef = useRef<NodeJS.Timeout | null>(null)

  // 크레딧 부족 모달 상태
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)
  const [creditsInfo, setCreditsInfo] = useState<{ required: number; available: number } | null>(null)

  // 폴링 최적화를 위한 ref
  const pollingInProgressRef = useRef<Set<number>>(new Set())  // 현재 폴링 중인 씬 인덱스
  const completedPollingRef = useRef<Set<number>>(new Set())   // 완료된 씬 인덱스
  const isCancelledRef = useRef(false)  // 폴링 취소 플래그

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = sceneKeyframes.findIndex(kf => `keyframe-${kf.sceneIndex}` === active.id)
      const newIndex = sceneKeyframes.findIndex(kf => `keyframe-${kf.sceneIndex}` === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSceneKeyframes(oldIndex, newIndex)
      }
    }
  }, [sceneKeyframes, reorderSceneKeyframes])

  // 스크롤 상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 컴포넌트 마운트 시 진행 중인 키프레임이 있으면 폴링 재개
  useEffect(() => {
    const generatingKeyframes = sceneKeyframes.filter(kf => kf.status === 'generating' && kf.requestId)
    if (generatingKeyframes.length > 0) {
      // 진행 중인 키프레임이 있으면 생성 상태 및 폴링 재개
      setIsGeneratingKeyframes(true)
      startKeyframePolling(sceneKeyframes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 마운트 시에만 실행

  // 멀티씬 시나리오 생성 및 키프레임 이미지 생성
  const generateAllKeyframes = async () => {
    if (!selectedProduct || !scenarioInfo) return

    setError(null)
    setIsGeneratingKeyframes(true)
    setSceneKeyframes([])

    try {
      // 1. 멀티씬 시나리오 생성 (씬별 요소 전달)
      const multiSceneRes = await fetch('/api/product-ad/generate-multi-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          sellingPoints: selectedProduct.selling_points,
          productImageUrl: selectedProduct.rembg_image_url || selectedProduct.image_url,
          sceneElements,  // 씬별 광고 요소 (신규)
          overallMood: scenarioInfo?.elements?.mood,  // 전체 분위기
          scenarioDescription: scenarioInfo?.description,
          sceneCount,
          totalDuration: sceneCount * 5,
        }),
      })

      if (!multiSceneRes.ok) throw new Error('멀티씬 시나리오 생성 실패')

      const multiSceneData = await multiSceneRes.json()
      const scenes: SceneInfo[] = multiSceneData.scenes

      // 시나리오에 씬 정보 저장
      setScenarioInfo({
        ...scenarioInfo,
        scenes,
      })

      // 2. 키프레임 이미지 생성 요청
      const keyframeRes = await fetch('/api/product-ad/generate-keyframes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageUrl: selectedProduct.rembg_image_url || selectedProduct.image_url,
          scenes: scenes.map(s => ({
            index: s.index,
            scenePrompt: s.scenePrompt,
          })),
          aspectRatio,
        }),
      })

      // 크레딧 부족 (402)
      if (keyframeRes.status === 402) {
        const errorData = await keyframeRes.json()
        setCreditsInfo({
          required: errorData.required || sceneCount * KEYFRAME_CREDIT_COST,
          available: errorData.available || 0,
        })
        setShowInsufficientCreditsModal(true)
        setIsGeneratingKeyframes(false)
        return
      }

      if (!keyframeRes.ok) throw new Error('키프레임 생성 요청 실패')

      const keyframeData = await keyframeRes.json()

      // 크레딧 갱신
      refreshCredits()

      // 초기 키프레임 상태 설정
      const initialKeyframes: SceneKeyframe[] = keyframeData.requests.map((req: { sceneIndex: number; requestId: string }) => ({
        sceneIndex: req.sceneIndex,
        requestId: req.requestId,
        status: 'generating' as const,
      }))

      setSceneKeyframes(initialKeyframes)

      // 키프레임 생성 시작 시 저장 (이탈 후 복구 지원)
      saveDraftAsync({ status: 'GENERATING_SCENES' })

      // 폴링 시작
      startKeyframePolling(initialKeyframes)
    } catch (err) {
      console.error('멀티씬 키프레임 생성 오류:', err)
      setError('멀티씬 키프레임 생성에 실패했습니다. 다시 시도해주세요.')
      setIsGeneratingKeyframes(false)
    }
  }

  // 개별 씬 키프레임 재생성 (추가 프롬프트 포함)
  const regenerateSingleKeyframe = async (sceneIndex: number, additionalPrompt: string = '') => {
    if (!selectedProduct || !scenarioInfo?.scenes) return

    const scene = scenarioInfo.scenes.find(s => s.index === sceneIndex)
    if (!scene) return

    setIsMergingPrompt(true)
    setError(null)

    try {
      // 추가 프롬프트가 있으면 LLM으로 합치기
      let finalPrompt = scene.scenePrompt
      if (additionalPrompt.trim()) {
        const mergeRes = await fetch('/api/product-ad/merge-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalPrompt: scene.scenePrompt,
            additionalPrompt: additionalPrompt.trim(),
          }),
        })

        if (mergeRes.ok) {
          const mergeData = await mergeRes.json()
          finalPrompt = mergeData.mergedPrompt || finalPrompt
        }
      }

      setIsMergingPrompt(false)
      setModalSceneIndex(null)
      setRegeneratingSceneIndex(sceneIndex)

      // 해당 씬만 generating 상태로 변경
      updateSceneKeyframe(sceneIndex, { status: 'generating', imageUrl: undefined, requestId: undefined })

      const keyframeRes = await fetch('/api/product-ad/generate-keyframes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageUrl: selectedProduct.rembg_image_url || selectedProduct.image_url,
          scenes: [{
            index: sceneIndex,
            scenePrompt: finalPrompt,
          }],
          aspectRatio,
        }),
      })

      if (!keyframeRes.ok) throw new Error('키프레임 재생성 요청 실패')

      const keyframeData = await keyframeRes.json()
      const request = keyframeData.requests[0]

      updateSceneKeyframe(sceneIndex, {
        requestId: request.requestId,
        status: 'generating',
      })

      // 단일 씬 폴링 시작
      startSingleKeyframePolling(sceneIndex, request.requestId)
    } catch (err) {
      console.error('키프레임 재생성 오류:', err)
      updateSceneKeyframe(sceneIndex, { status: 'failed' })
      setRegeneratingSceneIndex(null)
      setIsMergingPrompt(false)
      setModalSceneIndex(null)
      setError('키프레임 재생성에 실패했습니다.')
    }
  }

  // 모달에서 확인 버튼 클릭 시
  const handleModalConfirm = (additionalPrompt: string) => {
    if (modalSceneIndex !== null) {
      regenerateSingleKeyframe(modalSceneIndex, additionalPrompt)
    }
  }

  // 전체 키프레임 상태 폴링 (비동기 병렬 처리, 타임아웃, 중복 요청 방지)
  const startKeyframePolling = useCallback((keyframes: SceneKeyframe[]) => {
    if (keyframePollingRef.current) {
      clearInterval(keyframePollingRef.current)
    }

    // 폴링 시작 시 초기화
    isCancelledRef.current = false
    completedPollingRef.current = new Set()
    pollingInProgressRef.current = new Set()

    const pollSingleKeyframe = async (kf: SceneKeyframe): Promise<{ sceneIndex: number; completed: boolean; failed: boolean }> => {
      // 이미 완료된 건 스킵
      if (completedPollingRef.current.has(kf.sceneIndex)) {
        return { sceneIndex: kf.sceneIndex, completed: true, failed: false }
      }
      // 이미 폴링 중이면 스킵
      if (pollingInProgressRef.current.has(kf.sceneIndex)) {
        return { sceneIndex: kf.sceneIndex, completed: false, failed: false }
      }
      // 이미 완료/실패 상태면 스킵
      if (kf.status === 'completed' || kf.status === 'failed') {
        completedPollingRef.current.add(kf.sceneIndex)
        return { sceneIndex: kf.sceneIndex, completed: true, failed: kf.status === 'failed' }
      }

      pollingInProgressRef.current.add(kf.sceneIndex)

      try {
        // 3초 타임아웃 설정
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const res = await fetch(`/api/product-ad/status/${encodeURIComponent(kf.requestId!)}?type=image`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          return { sceneIndex: kf.sceneIndex, completed: false, failed: false }
        }

        const data = await res.json()

        if (data.status === 'COMPLETED' && data.resultUrl) {
          completedPollingRef.current.add(kf.sceneIndex)

          // 클라이언트에서 R2로 업로드 (WebP 압축 포함)
          try {
            const uploadResult = await uploadSceneKeyframeImage(kf.requestId!, data.resultUrl)
            updateSceneKeyframe(kf.sceneIndex, {
              status: 'completed',
              imageUrl: uploadResult.compressedUrl,  // WebP 이미지 표시
            })
          } catch (uploadError) {
            console.error('이미지 R2 업로드 오류:', uploadError)
            // 업로드 실패 시 원본 URL 사용
            updateSceneKeyframe(kf.sceneIndex, {
              status: 'completed',
              imageUrl: data.resultUrl,
            })
          }
          return { sceneIndex: kf.sceneIndex, completed: true, failed: false }
        } else if (data.status === 'FAILED') {
          completedPollingRef.current.add(kf.sceneIndex)
          updateSceneKeyframe(kf.sceneIndex, { status: 'failed' })
          return { sceneIndex: kf.sceneIndex, completed: true, failed: true }
        }

        return { sceneIndex: kf.sceneIndex, completed: false, failed: false }
      } catch (error) {
        // 타임아웃 오류는 무시 (다음 폴링에서 재시도)
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('키프레임 상태 폴링 오류:', error)
        }
        return { sceneIndex: kf.sceneIndex, completed: false, failed: false }
      } finally {
        pollingInProgressRef.current.delete(kf.sceneIndex)
      }
    }

    const pollStatus = async () => {
      if (isCancelledRef.current) return

      // 모든 키프레임에 대해 비동기 병렬 요청
      const results = await Promise.all(keyframes.map(kf => pollSingleKeyframe(kf)))

      const allCompleted = results.every(r => r.completed)
      const hasError = results.some(r => r.failed)

      if (allCompleted) {
        if (keyframePollingRef.current) {
          clearInterval(keyframePollingRef.current)
          keyframePollingRef.current = null
        }
        setIsGeneratingKeyframes(false)

        // 키프레임 완료 시 저장은 useEffect에서 처리 (최신 상태 보장)

        if (hasError) {
          setError('일부 키프레임 생성에 실패했습니다. 실패한 씬은 다시 생성할 수 있습니다.')
        }
      }
    }

    keyframePollingRef.current = setInterval(pollStatus, 3000)
    pollStatus()
  }, [updateSceneKeyframe, setIsGeneratingKeyframes])

  // 단일 키프레임 상태 폴링 (타임아웃, 중복 요청 방지)
  const startSingleKeyframePolling = useCallback((sceneIndex: number, requestId: string) => {
    // 개별 폴링용 ref
    let isPollingInProgress = false
    let isCancelled = false

    const pollStatus = async () => {
      if (isCancelled) return
      if (isPollingInProgress) {
        // 이전 요청이 진행 중이면 다음 폴링 예약
        setTimeout(() => pollStatus(), 3000)
        return
      }

      isPollingInProgress = true

      try {
        // 3초 타임아웃 설정
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const res = await fetch(`/api/product-ad/status/${encodeURIComponent(requestId)}?type=image`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          isPollingInProgress = false
          if (!isCancelled) {
            setTimeout(() => pollStatus(), 3000)
          }
          return
        }

        const data = await res.json()

        if (data.status === 'COMPLETED' && data.resultUrl) {
          isCancelled = true

          // 클라이언트에서 R2로 업로드 (WebP 압축 포함)
          try {
            const uploadResult = await uploadSceneKeyframeImage(requestId, data.resultUrl)
            updateSceneKeyframe(sceneIndex, {
              status: 'completed',
              imageUrl: uploadResult.compressedUrl,  // WebP 이미지 표시
            })
          } catch (uploadError) {
            console.error('이미지 R2 업로드 오류:', uploadError)
            // 업로드 실패 시 원본 URL 사용
            updateSceneKeyframe(sceneIndex, {
              status: 'completed',
              imageUrl: data.resultUrl,
            })
          }
          setRegeneratingSceneIndex(null)
        } else if (data.status === 'FAILED') {
          isCancelled = true
          updateSceneKeyframe(sceneIndex, { status: 'failed' })
          setRegeneratingSceneIndex(null)
          setError('키프레임 재생성에 실패했습니다.')
        } else {
          isPollingInProgress = false
          if (!isCancelled) {
            setTimeout(() => pollStatus(), 3000)
          }
        }
      } catch (error) {
        // 타임아웃 오류는 무시 (다음 폴링에서 재시도)
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('키프레임 재생성 폴링 오류:', error)
        }
        isPollingInProgress = false
        if (!isCancelled) {
          setTimeout(() => pollStatus(), 3000)
        }
      }
    }

    pollStatus()
  }, [updateSceneKeyframe])

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      isCancelledRef.current = true
      if (keyframePollingRef.current) {
        clearInterval(keyframePollingRef.current)
      }
      pollingInProgressRef.current.clear()
      completedPollingRef.current.clear()
    }
  }, [])

  // 키프레임 완료 시 자동 저장 (useEffect로 최신 상태 보장)
  const hasSavedCompletionRef = useRef(false)
  useEffect(() => {
    const allCompleted = sceneKeyframes.length > 0 && sceneKeyframes.every(kf => kf.status === 'completed' || kf.status === 'failed')
    if (allCompleted && !hasSavedCompletionRef.current) {
      hasSavedCompletionRef.current = true
      saveDraftAsync({ status: 'SCENES_COMPLETED' })
    }
    // 새로 생성 시작하면 플래그 리셋
    if (isGeneratingKeyframes) {
      hasSavedCompletionRef.current = false
    }
  }, [sceneKeyframes, isGeneratingKeyframes, saveDraftAsync])

  // 다음 단계로
  const handleNext = () => {
    if (!canProceedToStep5()) return
    goToNextStep()
    saveDraftAsync({
      wizardStep: 5,
      status: 'SCENES_COMPLETED',
    })
  }

  const hasKeyframes = sceneKeyframes.length > 0
  const allKeyframesCompleted = hasKeyframes && sceneKeyframes.every(kf => kf.status === 'completed')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">씬 키프레임 생성</h2>
        <p className="text-muted-foreground mt-2">
          각 씬의 키프레임 이미지를 생성합니다
        </p>
      </div>

      {/* 키프레임 생성 버튼 */}
      {!hasKeyframes && !isGeneratingKeyframes && (
        <button
          onClick={generateAllKeyframes}
          className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <h4 className="font-medium text-foreground">
                {sceneCount}개 씬 키프레임 생성하기
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                AI가 {sceneCount}개 씬의 키프레임 이미지를 생성합니다
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-primary">
                <Coins className="w-4 h-4" />
                <span className="font-medium">{sceneCount * KEYFRAME_CREDIT_COST} 크레딧</span>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* 키프레임 생성 중 초기 로딩 */}
      {isGeneratingKeyframes && sceneKeyframes.length === 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h4 className="font-medium text-foreground mb-1">씬 키프레임 생성 중</h4>
              <p className="text-sm text-muted-foreground">AI가 {sceneCount}개 씬의 키프레임을 생성하고 있습니다...</p>
            </div>
          </div>
        </div>
      )}

      {/* 생성된 키프레임 목록 (가로 스크롤 리스트) */}
      {hasKeyframes && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">생성된 키프레임</h3>
              <span className="text-xs text-muted-foreground">
                ({sceneKeyframes.filter(k => k.status === 'completed').length}/{sceneKeyframes.length})
              </span>
            </div>
            {allKeyframesCompleted && (
              <button
                onClick={generateAllKeyframes}
                disabled={isGeneratingKeyframes}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingKeyframes ? 'animate-spin' : ''}`} />
                전체 다시 생성
              </button>
            )}
          </div>

          {/* 그리드 레이아웃 with 드래그앤드롭 */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sceneKeyframes.map(kf => `keyframe-${kf.sceneIndex}`)}
              strategy={rectSortingStrategy}
            >
              <div className="flex justify-center w-full">
                <div className={`grid gap-6 ${
                  sceneKeyframes.length === 1 ? 'grid-cols-1 max-w-md' :
                  sceneKeyframes.length === 2 ? 'grid-cols-2 max-w-3xl' :
                  sceneKeyframes.length === 3 ? 'grid-cols-3 max-w-5xl' :
                  sceneKeyframes.length === 4 ? 'grid-cols-2 max-w-3xl' :
                  sceneKeyframes.length === 5 ? 'grid-cols-3 max-w-5xl' :
                  sceneKeyframes.length === 6 ? 'grid-cols-3 max-w-5xl' :
                  sceneKeyframes.length === 7 ? 'grid-cols-4 max-w-6xl' :
                  'grid-cols-4 max-w-6xl'
                } justify-items-center`}>
                  {sceneKeyframes.map((kf) => (
                    <SortableKeyframeCard
                      key={`keyframe-${kf.sceneIndex}`}
                      kf={kf}
                      onRegenerate={(sceneIndex) => setModalSceneIndex(sceneIndex)}
                      isRegenerating={regeneratingSceneIndex === kf.sceneIndex}
                      isGeneratingKeyframes={isGeneratingKeyframes}
                      aspectRatio={aspectRatio}
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>

          {/* 씬 순서 인디케이터 (스크롤 힌트) */}
          {sceneKeyframes.length > 2 && (
            <div className="flex items-center justify-center gap-1.5">
              {sceneKeyframes.map((kf) => (
                <div
                  key={kf.sceneIndex}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    kf.status === 'completed'
                      ? 'bg-green-500'
                      : kf.status === 'failed'
                      ? 'bg-red-500'
                      : 'bg-primary/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={goToPrevStep}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceedToStep5()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 안내 메시지 */}
      {hasKeyframes && !allKeyframesCompleted && !isGeneratingKeyframes && (
        <p className="text-center text-sm text-muted-foreground">
          모든 씬 키프레임이 완료되면 다음 단계로 진행할 수 있습니다
        </p>
      )}

      {/* 재생성 모달 */}
      <RegenerateModal
        isOpen={modalSceneIndex !== null}
        onClose={() => setModalSceneIndex(null)}
        onConfirm={handleModalConfirm}
        sceneIndex={modalSceneIndex ?? 0}
        scenePrompt={modalSceneIndex !== null && scenarioInfo?.scenes?.[modalSceneIndex]?.scenePrompt || ''}
        isLoading={isMergingPrompt}
      />

      {/* 크레딧 부족 모달 */}
      {creditsInfo && (
        <InsufficientCreditsModal
          isOpen={showInsufficientCreditsModal}
          onClose={() => setShowInsufficientCreditsModal(false)}
          requiredCredits={creditsInfo.required}
          availableCredits={creditsInfo.available}
          featureName="씬 키프레임 생성"
        />
      )}
    </div>
  )
}
