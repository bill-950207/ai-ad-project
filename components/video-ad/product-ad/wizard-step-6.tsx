'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Video,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Clapperboard,
  Check,
  MessageSquarePlus,
  X,
  Play,
  Clock,
  GripVertical,
} from 'lucide-react'
import Image from 'next/image'
import { useProductAdWizard, SceneVideoSegment } from './wizard-context'
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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 영상 재생성 모달 컴포넌트
function VideoRegenerateModal({
  isOpen,
  onClose,
  onConfirm,
  sceneIndex,
  scenePrompt,
  currentDuration,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (additionalPrompt: string, duration: number) => void
  sceneIndex: number
  scenePrompt: string
  currentDuration: number
  isLoading: boolean
}) {
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [duration, setDuration] = useState(currentDuration)

  useEffect(() => {
    if (isOpen) {
      setAdditionalPrompt('')
      setDuration(currentDuration)
    }
  }, [isOpen, currentDuration])

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
            <h3 className="text-lg font-bold text-foreground">씬 {sceneIndex + 1} 영상 다시 생성</h3>
            <p className="text-sm text-muted-foreground mt-1">
              추가 프롬프트를 입력하면 기존 시나리오와 함께 반영됩니다
            </p>
          </div>

          {/* 현재 씬 프롬프트 미리보기 */}
          <div className="p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">현재 씬 프롬프트</p>
            <p className="text-sm text-foreground line-clamp-3">{scenePrompt}</p>
          </div>

          {/* 영상 길이 설정 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4 text-muted-foreground" />
              영상 길이
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  disabled={isLoading}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                    duration === d
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-foreground hover:border-primary/50'
                  } disabled:opacity-50`}
                >
                  {d}초
                </button>
              ))}
            </div>
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
              placeholder="예: 카메라가 천천히 줌인, 더 역동적인 움직임..."
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
              onClick={() => onConfirm(additionalPrompt, duration)}
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

interface VideoStatus {
  requestId: string
  status: 'generating' | 'completed' | 'failed'
  resultUrl?: string
  errorMessage?: string
}

interface SceneVideoStatus {
  sceneIndex: number
  requestId: string
  status: 'generating' | 'completed' | 'failed'
  videoUrl?: string
  errorMessage?: string
}

// 드래그 가능한 씬 영상 카드 컴포넌트
function SortableVideoCard({
  sceneVideo,
  onRegenerate,
  onDownload,
  isRegenerating,
  isMergingVideos,
  regeneratingSceneIndex,
}: {
  sceneVideo: SceneVideoStatus
  onRegenerate: (sceneIndex: number) => void
  onDownload: (url: string, index: number) => void
  isRegenerating: boolean
  isMergingVideos: boolean
  regeneratingSceneIndex: number | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `video-${sceneVideo.sceneIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  const isCompleted = sceneVideo.status === 'completed' && sceneVideo.videoUrl
  const isGenerating = sceneVideo.status === 'generating'
  const isFailed = sceneVideo.status === 'failed'
  const canDrag = isCompleted && !isMergingVideos && regeneratingSceneIndex === null

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <div className={`bg-secondary/20 rounded-xl overflow-hidden border-2 transition-all ${
        isDragging ? 'ring-2 ring-primary shadow-lg border-primary' :
        isCompleted ? 'border-border/50' :
        isFailed ? 'border-red-500/30' :
        'border-border/50'
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
              isCompleted ? 'bg-green-500' :
              isGenerating || isRegenerating ? 'bg-primary animate-pulse' :
              isFailed ? 'bg-red-500' : 'bg-muted'
            }`} />
            <span className="text-sm font-medium text-foreground">씬 {sceneVideo.sceneIndex + 1}</span>
          </div>
          {(isCompleted || isFailed) && !isRegenerating && (
            <button
              onClick={() => onRegenerate(sceneVideo.sceneIndex)}
              disabled={isMergingVideos || regeneratingSceneIndex !== null}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary/50 text-muted-foreground rounded hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
              다시
            </button>
          )}
        </div>

        {/* 영상 영역 */}
        <div className="relative aspect-video bg-black">
          {isCompleted ? (
            <video
              src={sceneVideo.videoUrl}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            />
          ) : isGenerating || isRegenerating ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-secondary/30 to-secondary/50">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-4 h-4 text-primary/50" />
                </div>
              </div>
              <span className="text-sm text-muted-foreground mt-3">
                {isRegenerating ? '재생성 중...' : '생성 중...'}
              </span>
            </div>
          ) : isFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-destructive/5 to-destructive/10">
              <AlertCircle className="w-10 h-10 text-destructive mb-2" />
              <span className="text-sm text-destructive">생성 실패</span>
              <button
                onClick={() => onRegenerate(sceneVideo.sceneIndex)}
                className="mt-2 px-3 py-1.5 text-xs bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : null}
        </div>

        {/* 개별 다운로드 버튼 */}
        {isCompleted && (
          <div className="px-3 py-2 border-t border-border/30">
            <button
              onClick={() => onDownload(sceneVideo.videoUrl!, sceneVideo.sceneIndex)}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-secondary/50 text-muted-foreground rounded-lg hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              다운로드
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function WizardStep6() {
  const router = useRouter()
  const {
    draftId,
    selectedProduct,
    scenarioInfo,
    aspectRatio,
    duration,
    sceneDurations,
    updateSceneDuration,
    videoResolution,
    multiShot,
    videoCount,
    videoModel,
    firstSceneOptions,
    selectedSceneIndex,
    sceneKeyframes,
    sceneVideoSegments,
    setSceneVideoSegments,
    updateSceneVideoSegment,
    reorderSceneVideoSegments,
    finalVideoUrl,
    setFinalVideoUrl,
    isGeneratingVideo,
    setIsGeneratingVideo,
    generationProgress,
    setGenerationProgress,
    videoRequestIds,
    setVideoRequestIds,
    resultVideoUrls,
    setResultVideoUrls,
    addResultVideoUrl,
    goToPrevStep,
    saveDraft,
  } = useProductAdWizard()

  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [videoStatuses, setVideoStatuses] = useState<VideoStatus[]>([])
  const [sceneVideoStatuses, setSceneVideoStatuses] = useState<SceneVideoStatus[]>([])
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
  const [isMergingVideos, setIsMergingVideos] = useState(false)
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null)
  const [modalSceneIndex, setModalSceneIndex] = useState<number | null>(null)
  const [isMergingPrompt, setIsMergingPrompt] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const transitionPollingRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingActiveRef = useRef(false)
  const isTransitionPollingActiveRef = useRef(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

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

  // 드래그 종료 핸들러 (씬 영상 순서 변경)
  const handleVideoDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const sortedStatuses = [...sceneVideoStatuses].sort((a, b) => a.sceneIndex - b.sceneIndex)
      const oldIndex = sortedStatuses.findIndex(s => `video-${s.sceneIndex}` === active.id)
      const newIndex = sortedStatuses.findIndex(s => `video-${s.sceneIndex}` === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        // sceneVideoStatuses 재정렬
        const result = [...sortedStatuses]
        const [removed] = result.splice(oldIndex, 1)
        result.splice(newIndex, 0, removed)
        // sceneIndex 재할당
        const reordered = result.map((s, idx) => ({ ...s, sceneIndex: idx }))
        setSceneVideoStatuses(reordered)
        // context의 segments도 업데이트
        reorderSceneVideoSegments(oldIndex, newIndex)
      }
    }
  }, [sceneVideoStatuses, reorderSceneVideoSegments])

  // 스크롤 상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 멀티씬 모드 확인 (Kling O1 또는 Vidu Q2)
  const isMultiSceneMode = videoModel === 'kling-o1' || videoModel === 'vidu-q2'

  const selectedScene = selectedSceneIndex !== null ? firstSceneOptions[selectedSceneIndex] : null
  const hasCompletedVideos = isMultiSceneMode
    ? (finalVideoUrl !== null || sceneVideoStatuses.filter(s => s.status === 'completed').length > 0)
    : resultVideoUrls.length > 0
  const allVideosCompleted = videoStatuses.length > 0 && videoStatuses.every(v => v.status === 'completed' || v.status === 'failed')

  // ============================================================
  // Kling O1 모드: 씬별 영상 생성
  // ============================================================
  const startMultiSceneVideoGeneration = async () => {
    if (!scenarioInfo?.scenes || sceneKeyframes.length === 0) return

    // 완료된 키프레임만 필터링
    const completedKeyframes = sceneKeyframes
      .filter(kf => kf.status === 'completed' && kf.imageUrl)
      .sort((a, b) => a.sceneIndex - b.sceneIndex)

    if (completedKeyframes.length === 0) {
      setError('최소 1개 이상의 키프레임이 필요합니다.')
      return
    }

    setError(null)
    setIsGeneratingVideo(true)
    setGenerationProgress(0)
    setStatusMessage('씬 영상을 생성하고 있습니다...')
    setSceneVideoStatuses([])
    setFinalVideoUrl(null)

    try {
      // 키프레임에 씬 프롬프트, 개별 duration, movementAmplitude 추가
      const keyframesWithPrompts = completedKeyframes.map((kf) => {
        const sceneInfo = scenarioInfo.scenes?.find(s => s.index === kf.sceneIndex)
        return {
          sceneIndex: kf.sceneIndex,
          imageUrl: kf.imageUrl!,
          scenePrompt: sceneInfo?.scenePrompt,
          duration: sceneDurations[kf.sceneIndex] ?? 3,  // 각 씬별 duration
          movementAmplitude: sceneInfo?.movementAmplitude ?? 'auto',  // 카메라/모션 강도
        }
      })

      const res = await fetch('/api/product-ad/generate-scene-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyframes: keyframesWithPrompts,
          resolution: videoResolution,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '씬 영상 생성 요청 실패')
      }

      const data = await res.json()
      const sceneVideos: { sceneIndex: number; requestId: string; prompt: string }[] = data.sceneVideos

      // 초기 상태 설정
      const initialStatuses: SceneVideoStatus[] = sceneVideos.map(sv => ({
        sceneIndex: sv.sceneIndex,
        requestId: sv.requestId,
        status: 'generating',
      }))
      setSceneVideoStatuses(initialStatuses)

      // DB 업데이트
      await saveDraft({
        status: 'GENERATING_SCENE_VIDEOS',
      })

      // 폴링 시작
      startSceneVideoPolling(initialStatuses)
    } catch (err) {
      console.error('Kling O1 영상 생성 오류:', err)
      setError(err instanceof Error ? err.message : '씬 영상 생성에 실패했습니다.')
      setIsGeneratingVideo(false)
    }
  }

  // 개별 씬 영상 재생성 (추가 프롬프트 및 시간 포함)
  const regenerateSingleSceneVideo = async (sceneIndex: number, additionalPrompt: string = '', sceneDuration?: number) => {
    if (!scenarioInfo?.scenes) return

    const keyframe = sceneKeyframes.find(kf => kf.sceneIndex === sceneIndex && kf.status === 'completed' && kf.imageUrl)
    const sceneInfo = scenarioInfo.scenes.find(s => s.index === sceneIndex)
    if (!keyframe || !sceneInfo) {
      setError('해당 씬의 키프레임을 찾을 수 없습니다.')
      return
    }

    // 전달된 duration 또는 context의 sceneDurations 사용
    const useDuration = sceneDuration ?? sceneDurations[sceneIndex] ?? 3

    setIsMergingPrompt(true)
    setError(null)

    try {
      // 추가 프롬프트가 있으면 LLM으로 합치기
      let finalPrompt = sceneInfo.scenePrompt

      if (additionalPrompt.trim()) {
        const mergeRes = await fetch('/api/product-ad/merge-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalPrompt: sceneInfo.scenePrompt,
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
      setSceneVideoStatuses(prev => prev.map(s =>
        s.sceneIndex === sceneIndex
          ? { ...s, status: 'generating', videoUrl: undefined, requestId: '' }
          : s
      ))

      const res = await fetch('/api/product-ad/generate-scene-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyframes: [{
            sceneIndex,
            imageUrl: keyframe.imageUrl!,
            scenePrompt: finalPrompt,
            duration: useDuration,
            movementAmplitude: sceneInfo.movementAmplitude ?? 'auto',  // 카메라/모션 강도
          }],
          duration: useDuration,
          resolution: videoResolution,
        }),
      })

      if (!res.ok) throw new Error('씬 영상 재생성 요청 실패')

      const data = await res.json()
      const sceneVideo = data.sceneVideos[0]

      setSceneVideoStatuses(prev => prev.map(s =>
        s.sceneIndex === sceneIndex
          ? { ...s, requestId: sceneVideo.requestId, status: 'generating' }
          : s
      ))

      // 단일 씬 폴링 시작
      startSingleSceneVideoPolling(sceneIndex, sceneVideo.requestId)
    } catch (err) {
      console.error('씬 영상 재생성 오류:', err)
      setSceneVideoStatuses(prev => prev.map(s =>
        s.sceneIndex === sceneIndex
          ? { ...s, status: 'failed', errorMessage: '재생성 실패' }
          : s
      ))
      setRegeneratingSceneIndex(null)
      setIsMergingPrompt(false)
      setModalSceneIndex(null)
      setError('씬 영상 재생성에 실패했습니다.')
    }
  }

  // 모달에서 확인 버튼 클릭 시
  const handleVideoModalConfirm = (additionalPrompt: string, newDuration: number) => {
    if (modalSceneIndex !== null) {
      // 변경된 duration을 context에도 저장
      if (newDuration !== sceneDurations[modalSceneIndex]) {
        updateSceneDuration(modalSceneIndex, newDuration)
      }
      regenerateSingleSceneVideo(modalSceneIndex, additionalPrompt, newDuration)
    }
  }

  // 단일 씬 영상 상태 폴링
  const startSingleSceneVideoPolling = useCallback((sceneIndex: number, requestId: string) => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/product-ad/status/${encodeURIComponent(requestId)}?type=video`)
        if (!res.ok) {
          setTimeout(() => pollStatus(), 5000)
          return
        }

        const data = await res.json()

        if (data.status === 'COMPLETED' && data.resultUrl) {
          setSceneVideoStatuses(prev => prev.map(s =>
            s.sceneIndex === sceneIndex
              ? { ...s, status: 'completed', videoUrl: data.resultUrl }
              : s
          ))
          setRegeneratingSceneIndex(null)
        } else if (data.status === 'FAILED') {
          setSceneVideoStatuses(prev => prev.map(s =>
            s.sceneIndex === sceneIndex
              ? { ...s, status: 'failed', errorMessage: data.errorMessage }
              : s
          ))
          setRegeneratingSceneIndex(null)
          setError('씬 영상 재생성에 실패했습니다.')
        } else {
          setTimeout(() => pollStatus(), 5000)
        }
      } catch {
        setTimeout(() => pollStatus(), 5000)
      }
    }

    pollStatus()
  }, [])

  // 씬 영상 상태 폴링
  const startSceneVideoPolling = useCallback((statuses: SceneVideoStatus[]) => {
    if (isTransitionPollingActiveRef.current) return

    if (transitionPollingRef.current) {
      clearInterval(transitionPollingRef.current)
    }

    isTransitionPollingActiveRef.current = true
    let progressValue = 5
    const collectedUrls: string[] = []

    const pollStatus = async () => {
      let allCompleted = true
      let completedCount = 0

      for (const sceneVideo of statuses) {
        if (sceneVideo.status === 'completed' || sceneVideo.status === 'failed') {
          completedCount++
          continue
        }

        try {
          const res = await fetch(`/api/product-ad/status/${encodeURIComponent(sceneVideo.requestId)}?type=video`)
          if (!res.ok) {
            allCompleted = false
            continue
          }

          const data = await res.json()

          if (data.status === 'IN_QUEUE') {
            setStatusMessage(`대기열에서 처리를 기다리는 중... (${completedCount}/${statuses.length})`)
            allCompleted = false
          } else if (data.status === 'IN_PROGRESS') {
            setStatusMessage(`씬 ${sceneVideo.sceneIndex + 1} 영상 생성 중...`)
            allCompleted = false
          } else if (data.status === 'COMPLETED' && data.resultUrl) {
            completedCount++
            setSceneVideoStatuses(prev => prev.map(s =>
              s.requestId === sceneVideo.requestId
                ? { ...s, status: 'completed', videoUrl: data.resultUrl }
                : s
            ))

            if (!collectedUrls.includes(data.resultUrl)) {
              collectedUrls.push(data.resultUrl)
            }
          } else if (data.status === 'FAILED') {
            completedCount++
            setSceneVideoStatuses(prev => prev.map(s =>
              s.requestId === sceneVideo.requestId
                ? { ...s, status: 'failed', errorMessage: data.errorMessage }
                : s
            ))
          } else {
            allCompleted = false
          }
        } catch {
          allCompleted = false
        }
      }

      progressValue = Math.min(5 + (completedCount / statuses.length) * 95, 95)
      setGenerationProgress(Math.round(progressValue))

      if (allCompleted) {
        if (transitionPollingRef.current) {
          clearInterval(transitionPollingRef.current)
          transitionPollingRef.current = null
        }
        isTransitionPollingActiveRef.current = false

        setGenerationProgress(100)
        setIsGeneratingVideo(false)
        setStatusMessage('영상 생성이 완료되었습니다!')

        // DB 업데이트
        if (collectedUrls.length > 0) {
          await saveDraft({
            videoUrl: collectedUrls[0],
            status: 'COMPLETED',
          })
        }
      }
    }

    transitionPollingRef.current = setInterval(pollStatus, 5000)
    pollStatus()
  }, [setGenerationProgress, setIsGeneratingVideo, saveDraft])

  // 씬 영상 폴링 정리
  useEffect(() => {
    return () => {
      if (transitionPollingRef.current) {
        clearInterval(transitionPollingRef.current)
      }
      isTransitionPollingActiveRef.current = false
    }
  }, [])

  // 자동 합치기 비활성화 - 사용자가 "완료" 버튼을 누르면 합치기 시작

  // ============================================================
  // 일반 모드: 영상 생성
  // ============================================================

  // 영상 생성 시작
  const startVideoGeneration = async () => {
    if (!selectedScene?.imageUrl || !scenarioInfo || !selectedProduct) return

    setError(null)
    setIsGeneratingVideo(true)
    setGenerationProgress(0)
    setStatusMessage('영상 생성을 준비하고 있습니다...')
    setVideoStatuses([])
    setVideoRequestIds([])
    setResultVideoUrls([])

    try {
      const res = await fetch('/api/product-ad/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          startFrameUrl: selectedScene.imageUrl,
          productName: selectedProduct.name,
          scenarioElements: scenarioInfo.elements,
          aspectRatio,
          duration,
          multiShot,
          videoCount,
          videoModel,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '영상 생성 요청 실패')
      }

      const data = await res.json()
      const requests: { requestId: string; prompt: string }[] = data.requests || [{ requestId: data.requestId, prompt: data.prompt }]

      // 요청 ID들 저장
      const requestIds = requests.map(r => r.requestId)
      setVideoRequestIds(requestIds)

      // 초기 상태 설정
      const initialStatuses: VideoStatus[] = requestIds.map(id => ({
        requestId: id,
        status: 'generating',
      }))
      setVideoStatuses(initialStatuses)

      // DB 업데이트
      await saveDraft({
        videoRequestId: requestIds[0],
        status: 'GENERATING_VIDEO',
      })

      // 폴링 시작
      startPolling(requestIds)
    } catch (err) {
      console.error('영상 생성 오류:', err)
      setError(err instanceof Error ? err.message : '영상 생성에 실패했습니다.')
      setIsGeneratingVideo(false)
    }
  }

  // 상태 폴링
  const startPolling = useCallback((requestIds: string[]) => {
    // 이미 폴링 중이면 중복 시작 방지
    if (isPollingActiveRef.current) {
      return
    }

    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    isPollingActiveRef.current = true
    let progressValue = 5
    // 완료된 URL을 폴링 루프 내에서 추적 (클로저 문제 해결)
    const collectedUrls: string[] = []

    const pollStatus = async () => {
      let allCompleted = true
      let completedCount = 0

      for (const requestId of requestIds) {
        try {
          const res = await fetch(`/api/product-ad/status/${encodeURIComponent(requestId)}?type=video`)
          if (!res.ok) {
            allCompleted = false
            continue
          }

          const data = await res.json()

          if (data.status === 'IN_QUEUE') {
            setStatusMessage(`대기열에서 처리를 기다리는 중... (${completedCount}/${requestIds.length})`)
            allCompleted = false
          } else if (data.status === 'IN_PROGRESS') {
            setStatusMessage(`영상을 생성하고 있습니다... (${completedCount}/${requestIds.length})`)
            allCompleted = false
          } else if (data.status === 'COMPLETED' && data.resultUrl) {
            completedCount++
            setVideoStatuses(prev => prev.map(v =>
              v.requestId === requestId
                ? { ...v, status: 'completed', resultUrl: data.resultUrl }
                : v
            ))

            // 완료된 URL 수집 및 결과 URL 추가 (중복 방지)
            if (!collectedUrls.includes(data.resultUrl)) {
              collectedUrls.push(data.resultUrl)
              addResultVideoUrl(data.resultUrl)
            }
          } else if (data.status === 'FAILED') {
            completedCount++
            setVideoStatuses(prev => prev.map(v =>
              v.requestId === requestId
                ? { ...v, status: 'failed', errorMessage: data.errorMessage }
                : v
            ))
          } else {
            allCompleted = false
          }
        } catch {
          allCompleted = false
        }
      }

      progressValue = Math.min(5 + (completedCount / requestIds.length) * 95, 95)
      setGenerationProgress(Math.round(progressValue))

      if (allCompleted) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        isPollingActiveRef.current = false

        setGenerationProgress(100)
        setIsGeneratingVideo(false)
        setStatusMessage('영상 생성이 완료되었습니다!')

        // DB 업데이트 (폴링 중 수집한 URL 사용)
        if (collectedUrls.length > 0) {
          await saveDraft({
            videoUrl: collectedUrls[0],
            status: 'COMPLETED',
          })
        }
      }
    }

    pollingRef.current = setInterval(pollStatus, 5000)
    pollStatus()
  }, [setGenerationProgress, setIsGeneratingVideo, setResultVideoUrls, saveDraft])

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      isPollingActiveRef.current = false
    }
  }, [])

  // 이미 생성 중인 영상이 있으면 폴링 재개 (최초 마운트 시에만)
  useEffect(() => {
    // 이미 폴링 중이면 무시
    if (isPollingActiveRef.current) {
      return
    }

    if (videoRequestIds.length > 0 && resultVideoUrls.length === 0 && !isGeneratingVideo) {
      setIsGeneratingVideo(true)
      const initialStatuses: VideoStatus[] = videoRequestIds.map(id => ({
        requestId: id,
        status: 'generating',
      }))
      setVideoStatuses(initialStatuses)
      startPolling(videoRequestIds)
    }
  }, [videoRequestIds, resultVideoUrls.length, isGeneratingVideo, setIsGeneratingVideo, startPolling])

  // 멀티씬 모드: context에서 sceneVideoSegments 복원하여 폴링 재개 (최초 마운트 시에만)
  useEffect(() => {
    // 이미 폴링 중이면 무시
    if (isTransitionPollingActiveRef.current) {
      return
    }

    // sceneVideoSegments에서 generating 상태인 것들 복원
    if (isMultiSceneMode && sceneVideoSegments.length > 0 && sceneVideoStatuses.length === 0) {
      const hasGenerating = sceneVideoSegments.some(s => s.status === 'generating' && s.requestId)
      const hasAnyData = sceneVideoSegments.some(s => s.requestId)

      if (hasAnyData) {
        // sceneVideoSegments를 sceneVideoStatuses로 변환
        const restoredStatuses: SceneVideoStatus[] = sceneVideoSegments.map(seg => ({
          sceneIndex: seg.fromSceneIndex,
          requestId: seg.requestId || '',
          status: seg.status as 'generating' | 'completed' | 'failed',
          videoUrl: seg.videoUrl,
        }))
        setSceneVideoStatuses(restoredStatuses)

        // 생성 중인 항목이 있으면 폴링 시작
        if (hasGenerating) {
          setIsGeneratingVideo(true)
          setStatusMessage('영상 생성을 재개합니다...')
          startSceneVideoPolling(restoredStatuses)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 마운트 시에만 실행

  // sceneVideoStatuses가 변경될 때 context의 sceneVideoSegments에 동기화
  useEffect(() => {
    if (sceneVideoStatuses.length > 0) {
      const segments: SceneVideoSegment[] = sceneVideoStatuses.map((s, idx, arr) => ({
        fromSceneIndex: s.sceneIndex,
        toSceneIndex: idx < arr.length - 1 ? arr[idx + 1].sceneIndex : s.sceneIndex + 1,
        requestId: s.requestId,
        videoUrl: s.videoUrl,
        status: s.status,
      }))
      setSceneVideoSegments(segments)
    }
  }, [sceneVideoStatuses, setSceneVideoSegments])

  // 다운로드
  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `product-ad-${index + 1}-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('다운로드 오류:', err)
    }
  }

  // 전체 다운로드
  const handleDownloadAll = async () => {
    for (let i = 0; i < resultVideoUrls.length; i++) {
      await handleDownload(resultVideoUrls[i], i)
    }
  }

  // 영상 재생성
  const handleRegenerate = () => {
    setResultVideoUrls([])
    setVideoRequestIds([])
    setVideoStatuses([])
    setError(null)
    startVideoGeneration()
  }

  // Kling O1 모드에서 완료된 씬 영상 URL들
  const completedSceneVideoUrls = sceneVideoStatuses
    .filter(s => s.status === 'completed' && s.videoUrl)
    .sort((a, b) => a.sceneIndex - b.sceneIndex)
    .map(s => s.videoUrl!)

  // Kling O1 재생성
  const handleMultiSceneRegenerate = () => {
    setSceneVideoStatuses([])
    setFinalVideoUrl(null)
    setError(null)
    startMultiSceneVideoGeneration()
  }

  // 완료 후 상세 페이지로 이동
  // 멀티씬 모드에서 영상이 합쳐지지 않았다면 먼저 합친 후 이동
  const handleComplete = async () => {
    if (!draftId) return

    // 멀티씬 모드에서 합쳐진 영상이 없고, 완료된 씬 영상이 2개 이상이면 먼저 합치기
    if (isMultiSceneMode && !finalVideoUrl && completedSceneVideoUrls.length >= 2) {
      setError(null)
      setIsMergingVideos(true)
      setStatusMessage('영상을 합치는 중...')

      try {
        const res = await fetch('/api/product-ad/merge-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrls: completedSceneVideoUrls,
            draftId,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || '영상 합치기 실패')
        }

        const data = await res.json()

        // DB 업데이트
        await saveDraft({
          videoUrl: data.mergedVideoUrl,
          status: 'COMPLETED',
        })

        // 상세 페이지로 이동
        router.push(`/dashboard/video-ad/${draftId}`)
      } catch (err) {
        console.error('영상 합치기 오류:', err)
        setError(err instanceof Error ? err.message : '영상 합치기에 실패했습니다.')
        setIsMergingVideos(false)
      }
    } else {
      // 이미 합쳐졌거나 일반 모드면 바로 이동
      router.push(`/dashboard/video-ad/${draftId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          {hasCompletedVideos ? '영상 생성 완료' : '광고 영상 생성'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {isMultiSceneMode
            ? (hasCompletedVideos
                ? `${completedSceneVideoUrls.length}개의 씬 영상이 완성되었습니다`
                : `${sceneKeyframes.length}개 씬별 영상을 생성합니다`)
            : (hasCompletedVideos
                ? `${resultVideoUrls.length}개의 제품 광고 영상이 완성되었습니다`
                : '선택한 첫 씬으로 광고 영상을 생성합니다')
          }
        </p>
      </div>

      {/* 결과 영상 */}
      {hasCompletedVideos ? (
        <div className="space-y-4">
          {/* 완료 배너 */}
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <div className="flex-1">
              <p className="font-medium text-green-600">영상 생성 완료</p>
            </div>
          </div>

          {/* Kling O1 모드: 씬 전환 영상 목록 */}
          {isMultiSceneMode ? (
            <div className="space-y-4">
              {/* 합쳐진 최종 영상이 있으면 표시 */}
              {finalVideoUrl ? (
                <>
                  <div className="relative aspect-video max-h-[400px] bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    <video
                      src={finalVideoUrl}
                      controls
                      className="max-w-full max-h-full"
                    />
                  </div>
                  {/* 액션 버튼 */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleComplete}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                      완료
                    </button>
                    <button
                      onClick={() => handleDownload(finalVideoUrl, 0)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      다운로드
                    </button>
                    <button
                      onClick={() => setFinalVideoUrl(null)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                      개별 영상
                    </button>
                    <button
                      onClick={handleMultiSceneRegenerate}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* 가로 스크롤 씬 영상 리스트 with 드래그앤드롭 */}
                  {sceneVideoStatuses.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        각 씬 영상을 확인하고 재생해보세요
                        {sceneVideoStatuses.filter(s => s.status === 'completed').length >= 2 && (
                          <span className="text-primary ml-1">(드래그하여 순서 변경 가능)</span>
                        )}
                      </p>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleVideoDragEnd}
                      >
                        <SortableContext
                          items={[...sceneVideoStatuses].sort((a, b) => a.sceneIndex - b.sceneIndex).map(s => `video-${s.sceneIndex}`)}
                          strategy={horizontalListSortingStrategy}
                        >
                          <div className="flex justify-center w-full">
                            <div className={`grid gap-6 ${
                              sceneVideoStatuses.length === 1 ? 'grid-cols-1 max-w-md' :
                              sceneVideoStatuses.length === 2 ? 'grid-cols-2 max-w-3xl' :
                              sceneVideoStatuses.length === 3 ? 'grid-cols-3 max-w-5xl' :
                              sceneVideoStatuses.length === 4 ? 'grid-cols-2 max-w-3xl' :
                              sceneVideoStatuses.length === 5 ? 'grid-cols-3 max-w-5xl' :
                              sceneVideoStatuses.length === 6 ? 'grid-cols-3 max-w-5xl' :
                              sceneVideoStatuses.length === 7 ? 'grid-cols-4 max-w-6xl' :
                              'grid-cols-4 max-w-6xl'
                            } justify-items-center`}>
                              {[...sceneVideoStatuses]
                                .sort((a, b) => a.sceneIndex - b.sceneIndex)
                                .map((sceneVideo) => (
                                  <SortableVideoCard
                                    key={sceneVideo.requestId || `scene-${sceneVideo.sceneIndex}`}
                                    sceneVideo={sceneVideo}
                                    onRegenerate={(sceneIndex) => setModalSceneIndex(sceneIndex)}
                                    onDownload={handleDownload}
                                    isRegenerating={regeneratingSceneIndex === sceneVideo.sceneIndex}
                                    isMergingVideos={isMergingVideos}
                                    regeneratingSceneIndex={regeneratingSceneIndex}
                                  />
                                ))}
                            </div>
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleComplete}
                      disabled={isMergingVideos}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isMergingVideos ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          영상 합치는 중...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          완료
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleMultiSceneRegenerate}
                      disabled={isMergingVideos}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-5 h-5" />
                      전체 재생성
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* 일반 모드: 영상 목록 */
            videoStatuses.length > 1 ? (
              <div className="space-y-4">
                {/* 선택된 영상 큰 플레이어 */}
                <div className="relative h-80 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                  {resultVideoUrls[selectedVideoIndex] ? (
                    <video
                      ref={el => { videoRefs.current[selectedVideoIndex] = el }}
                      src={resultVideoUrls[selectedVideoIndex]}
                      controls
                      className="max-w-full max-h-full"
                      poster={selectedScene?.imageUrl}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                      <span className="text-sm text-muted-foreground">영상을 선택해 주세요</span>
                    </div>
                  )}
                </div>

                {/* 영상 썸네일 목록 (완료된 영상 + 로딩 중인 영상) */}
                <div className="flex justify-center w-full">
                <div className={`grid gap-4 ${
                  videoStatuses.length === 1 ? 'grid-cols-1 max-w-md' :
                  videoStatuses.length === 2 ? 'grid-cols-2 max-w-2xl' :
                  videoStatuses.length === 3 ? 'grid-cols-3 max-w-3xl' :
                  videoStatuses.length === 4 ? 'grid-cols-2 max-w-2xl' :
                  videoStatuses.length <= 6 ? 'grid-cols-3 max-w-3xl' :
                  'grid-cols-4 max-w-4xl'
                } justify-items-center w-full`}>
                  {videoStatuses.map((videoStatus, index) => {
                    const isCompleted = videoStatus.status === 'completed' && videoStatus.resultUrl
                    const isGenerating = videoStatus.status === 'generating'
                    const isFailed = videoStatus.status === 'failed'
                    const completedVideos = videoStatuses.filter(v => v.status === 'completed' && v.resultUrl)
                    const completedIndex = completedVideos.findIndex(v => v.requestId === videoStatus.requestId)

                    return (
                      <button
                        key={videoStatus.requestId}
                        onClick={() => isCompleted && completedIndex >= 0 && setSelectedVideoIndex(completedIndex)}
                        disabled={!isCompleted}
                        className={`relative h-32 bg-black rounded-lg overflow-hidden border-2 transition-all ${
                          isCompleted && completedIndex === selectedVideoIndex
                            ? 'border-primary ring-2 ring-primary/20'
                            : isCompleted
                              ? 'border-border hover:border-primary/50'
                              : 'border-border cursor-not-allowed'
                        }`}
                      >
                        {isCompleted ? (
                          <video
                            src={videoStatus.resultUrl}
                            className="w-full h-full object-contain"
                            muted
                          />
                        ) : isGenerating ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                            <span className="text-xs text-muted-foreground">생성 중...</span>
                          </div>
                        ) : isFailed ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10">
                            <AlertCircle className="w-6 h-6 text-destructive mb-2" />
                            <span className="text-xs text-destructive">실패</span>
                          </div>
                        ) : null}
                        <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
                          영상 {index + 1}
                        </div>
                      </button>
                    )
                  })}
                </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownload(resultVideoUrls[selectedVideoIndex], selectedVideoIndex)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    선택 영상 다운로드
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    전체 ({resultVideoUrls.length})
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    완료
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 단일 영상 플레이어 또는 로딩 */}
                <div className="relative h-80 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                  {videoStatuses.length === 1 && videoStatuses[0].status === 'generating' ? (
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                      <span className="text-sm text-muted-foreground">영상 생성 중...</span>
                    </div>
                  ) : videoStatuses.length === 1 && videoStatuses[0].status === 'failed' ? (
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                      <span className="text-sm text-destructive">영상 생성 실패</span>
                    </div>
                  ) : resultVideoUrls[0] ? (
                    <video
                      ref={el => { videoRefs.current[0] = el }}
                      src={resultVideoUrls[0]}
                      controls
                      className="max-w-full max-h-full"
                      poster={selectedScene?.imageUrl}
                    />
                  ) : null}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => resultVideoUrls[0] && handleDownload(resultVideoUrls[0], 0)}
                    disabled={!resultVideoUrls[0]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    영상 다운로드
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    다시 생성
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!resultVideoUrls[0]}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    완료
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <>
          {/* Kling O1 모드: 통합된 영상 생성 UI */}
          {isMultiSceneMode ? (
            <div className="space-y-4">
              {/* 상단 영상 생성 버튼 */}
              {!isGeneratingVideo && (
                <button
                  onClick={startMultiSceneVideoGeneration}
                  disabled={sceneKeyframes.filter(kf => kf.status === 'completed').length < 1}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Video className="w-5 h-5" />
                  씬 영상 {sceneKeyframes.filter(kf => kf.status === 'completed').length}개 생성하기
                </button>
              )}

              {/* 생성 중 프로그레스 */}
              {isGeneratingVideo && (
                <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{statusMessage}</span>
                    <span className="text-foreground font-medium">{generationProgress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 키프레임 그리드 */}
              <div className="flex justify-center w-full">
              <div className={`grid gap-4 ${
                sceneKeyframes.length === 1 ? 'grid-cols-1 max-w-xs' :
                sceneKeyframes.length === 2 ? 'grid-cols-2 max-w-md' :
                sceneKeyframes.length === 3 ? 'grid-cols-3 max-w-xl' :
                sceneKeyframes.length === 4 ? 'grid-cols-4 max-w-2xl' :
                sceneKeyframes.length <= 6 ? 'grid-cols-3 sm:grid-cols-6 max-w-xl sm:max-w-4xl' :
                'grid-cols-4 sm:grid-cols-8 max-w-2xl sm:max-w-5xl'
              } justify-items-center w-full`}>
                {sceneKeyframes
                  .filter(kf => kf.status === 'completed' && kf.imageUrl)
                  .sort((a, b) => a.sceneIndex - b.sceneIndex)
                  .map((kf) => {
                    const sceneVideoStatus = sceneVideoStatuses.find(s => s.sceneIndex === kf.sceneIndex)
                    const isSceneGenerating = sceneVideoStatus?.status === 'generating'
                    const isSceneCompleted = sceneVideoStatus?.status === 'completed' && sceneVideoStatus?.videoUrl
                    const isSceneFailed = sceneVideoStatus?.status === 'failed'

                    return (
                      <div
                        key={kf.sceneIndex}
                        className={`relative aspect-video w-full min-w-[120px] rounded-lg overflow-hidden bg-secondary/30 border-2 transition-all ${
                          isSceneCompleted
                            ? 'border-green-500/50'
                            : isSceneFailed
                            ? 'border-red-500/50'
                            : isSceneGenerating
                            ? 'border-primary/50'
                            : 'border-transparent'
                        }`}
                      >
                        <Image
                          src={kf.imageUrl!}
                          alt={`씬 ${kf.sceneIndex + 1}`}
                          fill
                          className="object-cover"
                        />

                        {/* 오버레이 상태 표시 */}
                        {isSceneGenerating ? (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                          </div>
                        ) : isSceneCompleted ? (
                          <button
                            onClick={() => {
                              const completedVideos = sceneVideoStatuses
                                .filter(s => s.status === 'completed' && s.videoUrl)
                                .sort((a, b) => a.sceneIndex - b.sceneIndex)
                              const idx = completedVideos.findIndex(v => v.sceneIndex === kf.sceneIndex)
                              if (idx >= 0) setSelectedVideoIndex(idx)
                            }}
                            className="absolute inset-0 bg-black/30 flex items-center justify-center hover:bg-black/40 transition-colors group"
                          >
                            <Play className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                          </button>
                        ) : isSceneFailed ? (
                          <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-white" />
                          </div>
                        ) : null}

                        {/* 씬 번호 */}
                        <div className="absolute bottom-0.5 left-0.5 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white">
                          {kf.sceneIndex + 1}
                        </div>

                        {/* 완료 체크 */}
                        {isSceneCompleted && (
                          <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 이전 버튼 */}
              {!isGeneratingVideo && (
                <button
                  onClick={goToPrevStep}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전 단계로
                </button>
              )}
            </div>
          ) : (
            /* 일반 모드: 선택된 첫 씬 미리보기 */
            selectedScene?.imageUrl && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">선택된 첫 씬</h3>
                <div className="relative h-64 rounded-xl overflow-hidden bg-secondary/30">
                  <Image
                    src={selectedScene.imageUrl}
                    alt="선택된 첫 씬"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )
          )}

          {/* 일반 모드 전용: 시나리오 요약 */}
          {!isMultiSceneMode && scenarioInfo && (
            <div className="p-4 bg-secondary/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">시나리오 요약</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {scenarioInfo.elements?.background && (
                  <div>
                    <span className="text-muted-foreground">배경: </span>
                    <span className="text-foreground">{scenarioInfo.elements.background}</span>
                  </div>
                )}
                {scenarioInfo.elements?.mood && (
                  <div>
                    <span className="text-muted-foreground">분위기: </span>
                    <span className="text-foreground">{scenarioInfo.elements.mood}</span>
                  </div>
                )}
                {scenarioInfo.elements?.productPlacement && (
                  <div>
                    <span className="text-muted-foreground">연출: </span>
                    <span className="text-foreground">{scenarioInfo.elements.productPlacement}</span>
                  </div>
                )}
                {scenarioInfo.elements?.lighting && (
                  <div>
                    <span className="text-muted-foreground">조명: </span>
                    <span className="text-foreground">{scenarioInfo.elements.lighting}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 일반 모드 전용: 영상 설정 정보 */}
          {!isMultiSceneMode && (
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <div className="px-3 py-1.5 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">비율: </span>
                <span className="text-foreground font-medium">{aspectRatio}</span>
              </div>
              <div className="px-3 py-1.5 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">길이: </span>
                <span className="text-foreground font-medium">{duration}초</span>
              </div>
              <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                <span className="text-muted-foreground">모델: </span>
                <span className="text-primary font-medium">
                  {videoModel === 'seedance' ? 'Seedance' : videoModel === 'kling2.6' ? 'Kling 2.6' : 'Wan 2.6'}
                </span>
              </div>
              {multiShot && (
                <div className="px-3 py-1.5 bg-primary/10 rounded-lg flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary font-medium">멀티샷</span>
                </div>
              )}
              <div className="px-3 py-1.5 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">생성 개수: </span>
                <span className="text-foreground font-medium">{videoCount}개</span>
              </div>
            </div>
          )}

          {/* 일반 모드 전용: 생성 중 상태 또는 생성 버튼 */}
          {!isMultiSceneMode && (
            <>
              {isGeneratingVideo ? (
                <div className="space-y-4">
                  {/* 프로그레스 바 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{statusMessage}</span>
                      <span className="text-foreground font-medium">{generationProgress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* 개별 영상 상태 */}
                  {videoStatuses.length > 1 && (
                    <div className={`grid gap-3 ${
                      videoStatuses.length <= 3 ? 'grid-cols-1' :
                      videoStatuses.length === 4 ? 'grid-cols-2' :
                      videoStatuses.length <= 6 ? 'grid-cols-3' :
                      'grid-cols-4'
                    }`}>
                      {videoStatuses.map((vs, index) => (
                        <div
                          key={vs.requestId}
                          className={`p-3 rounded-lg border ${
                            vs.status === 'completed'
                              ? 'bg-green-500/10 border-green-500/30'
                              : vs.status === 'failed'
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-secondary/30 border-border'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {vs.status === 'generating' && (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            )}
                            {vs.status === 'completed' && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                            {vs.status === 'failed' && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium">영상 {index + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">
                        {videoCount > 1 ? `${videoCount}개의 영상` : '영상'} 생성 중...
                      </p>
                      <p className="text-sm text-muted-foreground">약 1~3분 소요됩니다</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* 생성 버튼 */
                <button
                  onClick={startVideoGeneration}
                  disabled={!selectedScene?.imageUrl}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Video className="w-5 h-5" />
                  {videoCount > 1 ? `광고 영상 ${videoCount}개 생성하기` : '광고 영상 생성하기'}
                </button>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 이전 버튼 */}
              {!isGeneratingVideo && (
                <button
                  onClick={goToPrevStep}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전 단계로
                </button>
              )}
            </>
          )}
        </>
      )}

      {/* 영상 재생성 모달 */}
      <VideoRegenerateModal
        isOpen={modalSceneIndex !== null}
        onClose={() => setModalSceneIndex(null)}
        onConfirm={handleVideoModalConfirm}
        sceneIndex={modalSceneIndex ?? 0}
        scenePrompt={modalSceneIndex !== null && scenarioInfo?.scenes?.find(s => s.index === modalSceneIndex)?.scenePrompt || ''}
        currentDuration={modalSceneIndex !== null ? (sceneDurations[modalSceneIndex] ?? 3) : 3}
        isLoading={isMergingPrompt}
      />
    </div>
  )
}
