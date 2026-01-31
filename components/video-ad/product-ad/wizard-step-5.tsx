'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCredits } from '@/contexts/credit-context'
import { InsufficientCreditsModal } from '@/components/ui/insufficient-credits-modal'
import {
  ArrowLeft,
  Loader2,
  Video,
  Download,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Check,
  MessageSquarePlus,
  X,
  Play,
  Clock,
  GripVertical,
  Crown,
  Lock,
  Coins,
  History,
  ChevronDown,
} from 'lucide-react'
import Image from 'next/image'
import { useProductAdWizard, SceneVideoSegment, VideoResolution } from './wizard-context'
import { VIDU_CREDIT_COST_PER_SECOND } from '@/lib/credits'

// 사용자 플랜 타입
interface UserPlan {
  planType: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'
  displayName: string
}

// FREE 사용자 제한
const FREE_USER_LIMITS = {
  maxResolution: '540p' as VideoResolution,
}

// Vidu Q3 해상도 옵션 (중앙 상수 사용)
const RESOLUTION_OPTIONS: { value: VideoResolution; label: string; desc: string; creditsPerSecond: number }[] = [
  { value: '540p', label: 'SD (540p)', desc: '빠른 생성', creditsPerSecond: VIDU_CREDIT_COST_PER_SECOND['540p'] },
  { value: '720p', label: 'HD (720p)', desc: '표준 화질', creditsPerSecond: VIDU_CREDIT_COST_PER_SECOND['720p'] },
  { value: '1080p', label: 'FHD (1080p)', desc: '고품질', creditsPerSecond: VIDU_CREDIT_COST_PER_SECOND['1080p'] },
]
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

// 비율에 따른 aspect ratio 클래스 반환
function getAspectRatioClass(ratio: string | null): string {
  switch (ratio) {
    case '16:9': return 'aspect-video'
    case '9:16': return 'aspect-[9/16]'
    case '1:1': return 'aspect-square'
    default: return 'aspect-video'
  }
}

// 영상 재생성 모달 컴포넌트
function VideoRegenerateModal({
  isOpen,
  onClose,
  onConfirm,
  sceneIndex,
  videoUrl,
  currentDuration,
  isLoading,
  resolution,
  aspectRatio,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (additionalPrompt: string, duration: number) => void
  sceneIndex: number
  videoUrl?: string
  currentDuration: number
  isLoading: boolean
  resolution: VideoResolution
  aspectRatio: string | null
}) {
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [duration, setDuration] = useState(currentDuration)

  // 현재 해상도의 크레딧/초 계산
  const creditsPerSecond = RESOLUTION_OPTIONS.find(o => o.value === resolution)?.creditsPerSecond ?? 8
  const estimatedCredits = duration * creditsPerSecond
  const resolutionLabel = RESOLUTION_OPTIONS.find(o => o.value === resolution)?.label ?? resolution

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

          {/* 현재 씬 영상 미리보기 */}
          {videoUrl && (
            <div className="flex justify-center rounded-lg overflow-hidden bg-black">
              <div className={`relative ${getAspectRatioClass(aspectRatio)} w-full max-w-[240px]`}>
                <video
                  src={videoUrl}
                  controls
                  className="absolute inset-0 w-full h-full object-contain"
                  preload="metadata"
                />
              </div>
            </div>
          )}

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

          {/* 예상 크레딧 표시 */}
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="w-4 h-4 text-primary" />
              <span>{resolutionLabel} / {duration}초</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <span>{estimatedCredits}</span>
              <span className="text-xs font-normal text-muted-foreground">크레딧</span>
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

interface SceneVideoStatus {
  sceneIndex: number
  originalSceneIndex: number  // 드래그앤드롭 후에도 원래 씬 인덱스 유지
  requestId: string
  status: 'generating' | 'completed' | 'failed'
  videoUrl?: string
  errorMessage?: string
}

// 씬 버전 타입
interface SceneVersion {
  id: string
  video_ad_id: string
  scene_index: number
  version: number
  video_url: string
  prompt?: string
  duration?: number
  resolution?: string
  request_id?: string
  is_active: boolean
  created_at: string
}

// 드래그 가능한 씬 영상 카드 컴포넌트
function SortableVideoCard({
  sceneVideo,
  onRegenerate,
  onDownload,
  isRegenerating,
  isMergingVideos,
  regeneratingSceneIndex,
  aspectRatio,
  versions,
  onVersionSelect,
  isLoadingVersions,
}: {
  sceneVideo: SceneVideoStatus
  onRegenerate: (sceneIndex: number, originalSceneIndex: number) => void
  onDownload: (url: string, index: number) => void
  isRegenerating: boolean
  isMergingVideos: boolean
  regeneratingSceneIndex: number | null
  aspectRatio: string | null
  versions?: SceneVersion[]
  onVersionSelect?: (versionId: string) => void
  isLoadingVersions?: boolean
}) {
  const [showVersionDropdown, setShowVersionDropdown] = useState(false)
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
      className="w-full"
    >
      <div className={`bg-secondary/20 rounded-xl overflow-hidden border-2 transition-all ${
        isDragging ? 'ring-2 ring-primary shadow-lg border-primary' :
        isCompleted ? 'border-border/50' :
        isFailed ? 'border-red-500/30' :
        'border-border/50'
      }`}>
        {/* 씬 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border/30">
          <div className="flex items-center gap-2">
            {/* 드래그 핸들 */}
            {canDrag && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-secondary/50 rounded transition-colors"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <div className={`w-2.5 h-2.5 rounded-full ${
              isCompleted ? 'bg-green-500' :
              isGenerating || isRegenerating ? 'bg-primary animate-pulse' :
              isFailed ? 'bg-red-500' : 'bg-muted'
            }`} />
            <span className="text-base font-medium text-foreground">씬 {sceneVideo.sceneIndex + 1}</span>
            {/* 버전 히스토리 버튼 (완료된 영상이고 버전이 있을 때만) */}
            {isCompleted && versions && versions.length > 1 && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowVersionDropdown(!showVersionDropdown)
                  }}
                  disabled={isLoadingVersions}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
                  title="버전 히스토리"
                >
                  {isLoadingVersions ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <History className="w-3 h-3" />
                  )}
                  <span>v{versions.find(v => v.is_active)?.version || 1}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {/* 버전 드롭다운 */}
                {showVersionDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowVersionDropdown(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-border bg-secondary/30">
                        <p className="text-xs font-medium text-foreground">버전 히스토리</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {versions.map((v) => (
                          <button
                            key={v.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!v.is_active && onVersionSelect) {
                                onVersionSelect(v.id)
                              }
                              setShowVersionDropdown(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 transition-colors flex items-center justify-between ${
                              v.is_active ? 'bg-primary/10 text-primary' : 'text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">v{v.version}</span>
                              {v.duration && (
                                <span className="text-xs text-muted-foreground">{v.duration}초</span>
                              )}
                            </div>
                            {v.is_active && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {(isCompleted || isFailed) && !isRegenerating && (
            <button
              onClick={() => onRegenerate(sceneVideo.sceneIndex, sceneVideo.originalSceneIndex)}
              disabled={isMergingVideos || regeneratingSceneIndex !== null}
              className="p-2 bg-secondary/50 text-muted-foreground rounded-lg hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
              title="다시 생성"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 영상 영역 - 고정 비율 컨테이너 */}
        <div className={`relative ${getAspectRatioClass(aspectRatio)} bg-black`}>
          {isCompleted ? (
            <video
              src={sceneVideo.videoUrl}
              controls
              className="absolute inset-0 w-full h-full object-contain"
              preload="metadata"
            />
          ) : isGenerating || isRegenerating ? (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-secondary/30 to-secondary/50">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary/50" />
                </div>
              </div>
              <span className="text-base text-muted-foreground mt-4">
                {isRegenerating ? '재생성 중...' : '생성 중...'}
              </span>
            </div>
          ) : isFailed ? (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-destructive/5 to-destructive/10">
              <AlertCircle className="w-12 h-12 text-destructive mb-3" />
              <span className="text-base text-destructive">생성 실패</span>
              <button
                onClick={() => onRegenerate(sceneVideo.sceneIndex, sceneVideo.originalSceneIndex)}
                className="mt-3 px-4 py-2 text-sm bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : null}
        </div>

        {/* 개별 다운로드 버튼 */}
        {isCompleted && (
          <div className="px-4 py-3 border-t border-border/30">
            <button
              onClick={() => onDownload(sceneVideo.videoUrl!, sceneVideo.sceneIndex)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-secondary/50 text-muted-foreground rounded-lg hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function WizardStep5() {
  const router = useRouter()
  const { credits, refreshCredits } = useCredits()
  const {
    draftId,
    scenarioInfo,
    aspectRatio,
    sceneDurations,
    updateSceneDuration,
    videoResolution,
    setVideoResolution,
    sceneCount,
    sceneKeyframes,
    sceneVideoSegments,
    setSceneVideoSegments,
    reorderSceneVideoSegments,
    finalVideoUrl,
    setFinalVideoUrl,
    isGeneratingVideo,
    setIsGeneratingVideo,
    generationProgress,
    setGenerationProgress,
    goToPrevStep,
    saveDraft,
  } = useProductAdWizard()

  // 사용자 플랜 정보
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const isFreeUser = userPlan?.planType === 'FREE'

  const [error, setError] = useState<string | null>(null)
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)
  const [sceneVideoStatuses, setSceneVideoStatuses] = useState<SceneVideoStatus[]>([])
  const [isMergingVideos, setIsMergingVideos] = useState(false)
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null)
  const [modalSceneInfo, setModalSceneInfo] = useState<{ sceneIndex: number; originalSceneIndex: number } | null>(null)
  const [isMergingPrompt, setIsMergingPrompt] = useState(false)

  // 씬 버전 히스토리 상태
  const [sceneVersions, setSceneVersions] = useState<Record<number, SceneVersion[]>>({})
  const [isLoadingVersions, setIsLoadingVersions] = useState<Record<number, boolean>>({})
  const [isSwitchingVersion, setIsSwitchingVersion] = useState<number | null>(null)
  const transitionPollingRef = useRef<NodeJS.Timeout | null>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressStartTimeRef = useRef<number>(0)
  const progressTotalDurationRef = useRef<number>(0)
  const isTransitionPollingActiveRef = useRef(false)
  const hasAttemptedMultiSceneResumeRef = useRef(false)  // 폴링 재개 시도 여부

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

  // 사용자 플랜 정보 로드
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const res = await fetch('/api/user/plan')
        if (res.ok) {
          const data = await res.json()
          setUserPlan(data)
          // FREE 사용자인 경우 기본값 조정
          if (data.planType === 'FREE' && videoResolution !== FREE_USER_LIMITS.maxResolution) {
            setVideoResolution(FREE_USER_LIMITS.maxResolution)
          }
        }
      } catch (error) {
        console.error('플랜 정보 로드 오류:', error)
      }
    }
    fetchUserPlan()
  }, [videoResolution, setVideoResolution])

  // 총 영상 길이 및 예상 크레딧 계산
  const totalDuration = sceneDurations.slice(0, sceneCount).reduce((sum, d) => sum + d, 0)
  const estimatedCredits = (() => {
    const option = RESOLUTION_OPTIONS.find(o => o.value === videoResolution)
    if (!option) return 0
    return option.creditsPerSecond * totalDuration
  })()

  // Vidu Q3 전용 모드 (항상 멀티씬 워크플로우 사용)
  const isMultiSceneMode = true  // Vidu만 사용하므로 항상 true

  const hasCompletedVideos = finalVideoUrl !== null || sceneVideoStatuses.filter(s => s.status === 'completed').length > 0

  // ============================================================
  // 씬 버전 관리 함수들
  // ============================================================

  // 씬 버전 히스토리 조회 및 활성 버전으로 UI 동기화
  const fetchSceneVersions = useCallback(async () => {
    if (!draftId) return

    try {
      const res = await fetch(`/api/product-ad/scene-version?videoAdId=${draftId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.groupedByScene) {
          setSceneVersions(data.groupedByScene)

          // 활성 버전 URL로 sceneVideoStatuses 동기화 (새로고침 후 복원)
          const groupedByScene = data.groupedByScene as Record<number, SceneVersion[]>
          setSceneVideoStatuses(prev => {
            if (prev.length === 0) return prev

            return prev.map(status => {
              const versions = groupedByScene[status.sceneIndex]
              if (versions && versions.length > 0) {
                const activeVersion = versions.find((v: SceneVersion) => v.is_active)
                if (activeVersion && activeVersion.video_url) {
                  // 활성 버전의 URL로 업데이트
                  return {
                    ...status,
                    videoUrl: activeVersion.video_url,
                    status: 'completed' as const,
                  }
                }
              }
              return status
            })
          })
        }
      }
    } catch (error) {
      console.error('버전 히스토리 조회 오류:', error)
    }
  }, [draftId])

  // 영상 완료 시 버전 저장
  const saveSceneVersion = useCallback(async (
    sceneIndex: number,
    videoUrl: string,
    requestId?: string,
    prompt?: string,
    duration?: number
  ) => {
    if (!draftId) return

    try {
      const res = await fetch('/api/product-ad/scene-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoAdId: draftId,
          sceneIndex,
          videoUrl,
          prompt,
          duration,
          resolution: videoResolution,
          requestId,
        }),
      })

      if (res.ok) {
        // 버전 히스토리 다시 조회
        await fetchSceneVersions()
      }
    } catch (error) {
      console.error('버전 저장 오류:', error)
    }
  }, [draftId, videoResolution, fetchSceneVersions])

  // 버전 전환 (활성화)
  const switchSceneVersion = useCallback(async (sceneIndex: number, versionId: string) => {
    if (!draftId) return

    setIsSwitchingVersion(sceneIndex)
    setIsLoadingVersions(prev => ({ ...prev, [sceneIndex]: true }))

    try {
      const res = await fetch(`/api/product-ad/scene-version/${versionId}/activate`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        const activatedVersion = data.version

        // sceneVideoStatuses 업데이트 및 Draft 저장
        setSceneVideoStatuses(prev => {
          const updated = prev.map(s =>
            s.sceneIndex === sceneIndex
              ? { ...s, videoUrl: activatedVersion.video_url, status: 'completed' as const }
              : s
          )

          // Draft 저장 (버전 전환 후에도 새로고침 시 유지)
          const sceneVideoUrls = updated.map(s => ({
            sceneIndex: s.sceneIndex,
            requestId: s.requestId,
            videoUrl: s.videoUrl,
            status: s.status,
          }))
          saveDraft({ sceneVideoUrls })

          return updated
        })

        // 버전 히스토리 다시 조회
        await fetchSceneVersions()
      }
    } catch (error) {
      console.error('버전 전환 오류:', error)
    } finally {
      setIsSwitchingVersion(null)
      setIsLoadingVersions(prev => ({ ...prev, [sceneIndex]: false }))
    }
  }, [draftId, fetchSceneVersions, saveDraft])

  // 컴포넌트 마운트 시 버전 히스토리 로드
  useEffect(() => {
    if (draftId) {
      fetchSceneVersions()
    }
  }, [draftId, fetchSceneVersions])

  // ============================================================
  // Kling O1 모드: 씬별 영상 생성
  // ============================================================
  const startMultiSceneVideoGeneration = async () => {
    if (!scenarioInfo?.scenes || sceneKeyframes.length === 0) return

    // 크레딧 체크
    if (credits !== null && credits < estimatedCredits) {
      setShowInsufficientCreditsModal(true)
      return
    }

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
    setSceneVideoStatuses([])
    setFinalVideoUrl(null)

    // 가장 긴 씬 duration 계산 (초 × 10 = 전체 프로그레스 시간)
    const maxDuration = Math.max(...completedKeyframes.map(kf => sceneDurations[kf.sceneIndex] ?? 3))
    const totalProgressTime = maxDuration * 10 * 1000  // 밀리초로 변환

    // 시간 기반 프로그레스 타이머 시작
    progressStartTimeRef.current = Date.now()
    progressTotalDurationRef.current = totalProgressTime

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
    }

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartTimeRef.current
      const progress = Math.min((elapsed / progressTotalDurationRef.current) * 100, 95)  // 최대 95%까지
      setGenerationProgress(Math.round(progress))
    }, 500)  // 0.5초마다 업데이트

    try {
      // 키프레임에 씬 프롬프트, 개별 duration, movementAmplitude 추가
      // ★ videoPrompt가 있으면 영상 생성에 우선 사용 (더 동적인 모션 포함)
      const keyframesWithPrompts = completedKeyframes.map((kf) => {
        const sceneInfo = scenarioInfo.scenes?.find(s => s.index === kf.sceneIndex)
        // videoPrompt가 있으면 영상용으로 사용, 없으면 scenePrompt 사용
        const videoPromptToUse = sceneInfo?.videoPrompt || sceneInfo?.scenePrompt
        return {
          sceneIndex: kf.sceneIndex,
          imageUrl: kf.imageUrl!,
          scenePrompt: videoPromptToUse,  // 영상 생성용 프롬프트
          duration: sceneDurations[kf.sceneIndex] ?? 3,  // 각 씬별 duration
          movementAmplitude: sceneInfo?.movementAmplitude ?? 'auto',  // 카메라/모션 강도 (기본 auto - AI가 콘텐츠에 맞게 결정)
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
        originalSceneIndex: sv.sceneIndex,  // 원래 씬 인덱스 저장
        requestId: sv.requestId,
        status: 'generating',
      }))
      setSceneVideoStatuses(initialStatuses)

      // DB 업데이트 (requestId를 명시적으로 저장하여 새로고침 후 폴링 재개 가능)
      await saveDraft({
        status: 'GENERATING_SCENE_VIDEOS',
        sceneVideoUrls: initialStatuses.map(s => ({
          sceneIndex: s.sceneIndex,
          requestId: s.requestId,
          videoUrl: s.videoUrl,
          status: s.status,
        })),
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

    // 단일 씬 재생성 크레딧 계산 및 체크
    const option = RESOLUTION_OPTIONS.find(o => o.value === videoResolution)
    const singleSceneCredits = option ? option.creditsPerSecond * useDuration : 0
    if (credits !== null && credits < singleSceneCredits) {
      setShowInsufficientCreditsModal(true)
      return
    }

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
      setModalSceneInfo(null)
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

      // 상태 업데이트 및 드래프트 저장을 위한 새 상태 계산
      const updatedStatuses = sceneVideoStatuses.map(s =>
        s.sceneIndex === sceneIndex
          ? { ...s, requestId: sceneVideo.requestId, status: 'generating' as const }
          : s
      )
      setSceneVideoStatuses(updatedStatuses)

      // DB 업데이트 (requestId를 명시적으로 저장하여 새로고침 후 폴링 재개 가능)
      await saveDraft({
        status: 'GENERATING_SCENE_VIDEOS',
        sceneVideoUrls: updatedStatuses.map(s => ({
          sceneIndex: s.sceneIndex,
          requestId: s.requestId,
          videoUrl: s.videoUrl,
          status: s.status,
        })),
      })

      // 단일 씬 폴링 시작 (duration 전달)
      startSingleSceneVideoPolling(sceneIndex, sceneVideo.requestId, useDuration)
    } catch (err) {
      console.error('씬 영상 재생성 오류:', err)
      setSceneVideoStatuses(prev => prev.map(s =>
        s.sceneIndex === sceneIndex
          ? { ...s, status: 'failed', errorMessage: '재생성 실패' }
          : s
      ))
      setRegeneratingSceneIndex(null)
      setIsMergingPrompt(false)
      setModalSceneInfo(null)
      setError('씬 영상 재생성에 실패했습니다.')
    }
  }

  // 모달에서 확인 버튼 클릭 시
  const handleVideoModalConfirm = (additionalPrompt: string, newDuration: number) => {
    if (modalSceneInfo !== null) {
      const { sceneIndex, originalSceneIndex } = modalSceneInfo
      // 변경된 duration을 context에도 저장 (원래 씬 인덱스 사용)
      if (newDuration !== sceneDurations[originalSceneIndex]) {
        updateSceneDuration(originalSceneIndex, newDuration)
      }
      // 영상 재생성 시 sceneIndex(현재 위치)로 상태 업데이트
      regenerateSingleSceneVideo(sceneIndex, additionalPrompt, newDuration)
    }
  }

  // 단일 씬 영상 상태 폴링 (재생성 시)
  const startSingleSceneVideoPolling = useCallback((sceneIndex: number, requestId: string, duration?: number) => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/product-ad/status/${encodeURIComponent(requestId)}?type=video`)
        if (!res.ok) {
          setTimeout(() => pollStatus(), 5000)
          return
        }

        const data = await res.json()

        if (data.status === 'COMPLETED' && data.resultUrl) {
          // 상태 업데이트 및 새 URL 추적
          const updatedUrl = data.resultUrl
          setSceneVideoStatuses(prev => {
            const updated = prev.map(s =>
              s.sceneIndex === sceneIndex
                ? { ...s, status: 'completed' as const, videoUrl: updatedUrl }
                : s
            )

            // Draft 저장 (새로고침 후에도 새 URL 유지)
            // 비동기로 처리하되 상태 업데이트는 먼저 반영
            const sceneVideoUrls = updated.map(s => ({
              sceneIndex: s.sceneIndex,
              requestId: s.requestId,
              videoUrl: s.videoUrl,
              status: s.status,
            }))
            saveDraft({ sceneVideoUrls })

            return updated
          })
          setRegeneratingSceneIndex(null)

          // 버전 저장 (재생성이므로 새 버전으로 저장됨)
          await saveSceneVersion(sceneIndex, updatedUrl, requestId, undefined, duration)
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
  }, [saveSceneVersion, saveDraft])

  // 씬 영상 상태 폴링
  const startSceneVideoPolling = useCallback((statuses: SceneVideoStatus[]) => {
    if (isTransitionPollingActiveRef.current) return

    if (transitionPollingRef.current) {
      clearInterval(transitionPollingRef.current)
    }

    isTransitionPollingActiveRef.current = true
    const collectedUrls: string[] = []
    // 현재 상태를 추적하기 위한 맵 (새로고침 후 복구를 위해)
    const currentStatusMap = new Map<string, SceneVideoStatus>(
      statuses.map(s => [s.requestId, { ...s }])
    )

    const pollStatus = async () => {
      let allCompleted = true
      let hasStatusChange = false

      for (const sceneVideo of statuses) {
        const currentStatus = currentStatusMap.get(sceneVideo.requestId)
        if (currentStatus?.status === 'completed' || currentStatus?.status === 'failed') {
          continue
        }

        try {
          const res = await fetch(`/api/product-ad/status/${encodeURIComponent(sceneVideo.requestId)}?type=video`)
          if (!res.ok) {
            allCompleted = false
            continue
          }

          const data = await res.json()

          if (data.status === 'IN_QUEUE' || data.status === 'IN_PROGRESS') {
            allCompleted = false
          } else if (data.status === 'COMPLETED' && data.resultUrl) {
            // 상태 맵 업데이트
            currentStatusMap.set(sceneVideo.requestId, {
              ...sceneVideo,
              status: 'completed',
              videoUrl: data.resultUrl,
            })
            hasStatusChange = true

            setSceneVideoStatuses(prev => prev.map(s =>
              s.requestId === sceneVideo.requestId
                ? { ...s, status: 'completed', videoUrl: data.resultUrl }
                : s
            ))

            if (!collectedUrls.includes(data.resultUrl)) {
              collectedUrls.push(data.resultUrl)

              // 초기 영상 생성 시 버전으로 저장 (v1)
              const sceneIndex = sceneVideo.sceneIndex
              const duration = sceneDurations[sceneIndex] ?? 3
              saveSceneVersion(sceneIndex, data.resultUrl, sceneVideo.requestId, undefined, duration)
            }
          } else if (data.status === 'FAILED') {
            // 상태 맵 업데이트
            currentStatusMap.set(sceneVideo.requestId, {
              ...sceneVideo,
              status: 'failed',
              errorMessage: data.errorMessage,
            })
            hasStatusChange = true

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

      // 상태 변경이 있으면 드래프트 저장 (새로고침 후 복구 가능하도록)
      if (hasStatusChange) {
        const updatedStatuses = Array.from(currentStatusMap.values())
        saveDraft({
          sceneVideoUrls: updatedStatuses.map(s => ({
            sceneIndex: s.sceneIndex,
            requestId: s.requestId,
            videoUrl: s.videoUrl,
            status: s.status,
          })),
        })
      }

      if (allCompleted) {
        // 폴링 정리
        if (transitionPollingRef.current) {
          clearInterval(transitionPollingRef.current)
          transitionPollingRef.current = null
        }
        isTransitionPollingActiveRef.current = false

        // 프로그레스 타이머 정리
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current)
          progressTimerRef.current = null
        }

        setGenerationProgress(100)
        setIsGeneratingVideo(false)

        // DB 업데이트
        if (collectedUrls.length > 0) {
          await saveDraft({
            videoUrl: collectedUrls[0],
            status: 'COMPLETED',
          })
          // 크레딧 갱신
          refreshCredits()
        }
      }
    }

    transitionPollingRef.current = setInterval(pollStatus, 5000)
    pollStatus()
  }, [setGenerationProgress, setIsGeneratingVideo, saveDraft, saveSceneVersion, sceneDurations])

  // 씬 영상 폴링 및 프로그레스 타이머 정리
  useEffect(() => {
    return () => {
      if (transitionPollingRef.current) {
        clearInterval(transitionPollingRef.current)
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
      isTransitionPollingActiveRef.current = false
    }
  }, [])

  // 자동 합치기 비활성화 - 사용자가 "완료" 버튼을 누르면 합치기 시작

  // 멀티씬 모드: context에서 sceneVideoSegments 복원하여 폴링 재개
  // sceneVideoSegments가 비동기로 로드되므로 의존성 배열에 포함
  useEffect(() => {
    // 이미 폴링 중이거나 재개 시도한 경우 무시
    if (isTransitionPollingActiveRef.current || hasAttemptedMultiSceneResumeRef.current) {
      return
    }

    // sceneVideoSegments에서 generating 상태인 것들 복원
    if (isMultiSceneMode && sceneVideoSegments.length > 0 && sceneVideoStatuses.length === 0) {
      const hasGenerating = sceneVideoSegments.some(s => s.status === 'generating' && s.requestId)
      const hasAnyData = sceneVideoSegments.some(s => s.requestId)

      if (hasAnyData) {
        // 재개 시도 표시 (중복 방지)
        hasAttemptedMultiSceneResumeRef.current = true

        // sceneVideoSegments를 sceneVideoStatuses로 변환
        const restoredStatuses: SceneVideoStatus[] = sceneVideoSegments.map(seg => ({
          sceneIndex: seg.fromSceneIndex,
          originalSceneIndex: seg.fromSceneIndex,  // 원래 씬 인덱스 저장
          requestId: seg.requestId || '',
          status: seg.status as 'generating' | 'completed' | 'failed',
          videoUrl: seg.videoUrl,
        }))
        setSceneVideoStatuses(restoredStatuses)

        // 생성 중인 항목이 있으면 폴링 시작
        if (hasGenerating) {
          setIsGeneratingVideo(true)
          startSceneVideoPolling(restoredStatuses)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneVideoSegments, isMultiSceneMode]) // sceneVideoSegments 로드 시 재개 시도

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

  // 완료된 씬 영상 URL들
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
  // 영상이 합쳐지지 않았다면 먼저 합친 후 이동
  const handleComplete = async () => {
    if (!draftId) return

    // 합쳐진 영상이 없고, 완료된 씬 영상이 2개 이상이면 먼저 합치기
    if (!finalVideoUrl && completedSceneVideoUrls.length >= 2) {
      setError(null)
      setIsMergingVideos(true)

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

        // 크레딧 갱신
        refreshCredits()

        // 상세 페이지로 이동 (replace로 히스토리 대체하여 뒤로가기 시 위저드로 돌아가지 않도록)
        router.replace(`/dashboard/video-ad/${draftId}`)
      } catch (err) {
        console.error('영상 합치기 오류:', err)
        setError(err instanceof Error ? err.message : '영상 합치기에 실패했습니다.')
        setIsMergingVideos(false)
      }
    } else {
      // 이미 합쳐졌거나 씬이 1개면 바로 이동 (replace로 히스토리 대체)
      router.replace(`/dashboard/video-ad/${draftId}`)
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
          {hasCompletedVideos
            ? `${completedSceneVideoUrls.length}개의 씬 영상이 완성되었습니다`
            : `${sceneKeyframes.length}개 씬별 영상을 생성합니다`}
        </p>
      </div>

      {/* 결과 영상 */}
      {hasCompletedVideos ? (
        <div className="space-y-4">
          {/* 씬 전환 영상 목록 */}
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
                      disabled={regeneratingSceneIndex !== null}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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
                            <div className={`grid gap-4 w-full ${
                              sceneVideoStatuses.length === 1 ? 'grid-cols-1 max-w-lg' :
                              sceneVideoStatuses.length === 2 ? 'grid-cols-2 max-w-4xl' :
                              sceneVideoStatuses.length === 3 ? 'grid-cols-3 max-w-5xl' :
                              sceneVideoStatuses.length === 4 ? 'grid-cols-4 max-w-6xl' :
                              'grid-cols-4 max-w-6xl'
                            }`}>
                              {[...sceneVideoStatuses]
                                .sort((a, b) => a.sceneIndex - b.sceneIndex)
                                .map((sceneVideo) => (
                                  <SortableVideoCard
                                    key={sceneVideo.requestId || `scene-${sceneVideo.sceneIndex}`}
                                    sceneVideo={sceneVideo}
                                    onRegenerate={(sceneIndex, originalSceneIndex) => setModalSceneInfo({ sceneIndex, originalSceneIndex })}
                                    onDownload={handleDownload}
                                    isRegenerating={regeneratingSceneIndex === sceneVideo.sceneIndex}
                                    isMergingVideos={isMergingVideos}
                                    regeneratingSceneIndex={regeneratingSceneIndex}
                                    aspectRatio={aspectRatio}
                                    versions={sceneVersions[sceneVideo.sceneIndex]}
                                    onVersionSelect={(versionId) => switchSceneVersion(sceneVideo.sceneIndex, versionId)}
                                    isLoadingVersions={isLoadingVersions[sceneVideo.sceneIndex] || isSwitchingVersion === sceneVideo.sceneIndex}
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
                      disabled={isMergingVideos || regeneratingSceneIndex !== null}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isMergingVideos ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          영상 합치는 중...
                        </>
                      ) : regeneratingSceneIndex !== null ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          씬 재생성 중...
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
                      disabled={isMergingVideos || regeneratingSceneIndex !== null}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-5 h-5" />
                      전체 재생성
                    </button>
                  </div>
                </>
              )}
            </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 키프레임 그리드 (상단) */}
              <div className="flex justify-center w-full">
                <div className={`grid gap-4 ${
                  sceneKeyframes.length === 1 ? 'grid-cols-1 max-w-sm' :
                  sceneKeyframes.length === 2 ? 'grid-cols-2 max-w-lg' :
                  sceneKeyframes.length === 3 ? 'grid-cols-3 max-w-2xl' :
                  sceneKeyframes.length === 4 ? 'grid-cols-4 max-w-3xl' :
                  sceneKeyframes.length <= 6 ? 'grid-cols-3 max-w-2xl' :
                  'grid-cols-4 max-w-3xl'
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
                          className={`relative ${getAspectRatioClass(aspectRatio)} w-full min-w-[160px] rounded-xl overflow-hidden bg-secondary/30 border-2 transition-all ${
                            isSceneCompleted
                              ? 'border-green-500/50'
                              : isSceneFailed
                              ? 'border-red-500/50'
                              : isSceneGenerating
                              ? 'border-primary/50'
                              : 'border-border'
                          }`}
                        >
                          <Image
                            src={kf.imageUrl!}
                            alt={`씬 ${kf.sceneIndex + 1}`}
                            fill
                            className="object-contain"
                          />

                          {/* 오버레이 상태 표시 */}
                          {isSceneGenerating ? (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-white" />
                            </div>
                          ) : isSceneCompleted ? (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          ) : isSceneFailed ? (
                            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                          ) : null}

                          {/* 씬 번호 */}
                          <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                            씬 {kf.sceneIndex + 1}
                          </div>

                          {/* 완료 체크 */}
                          {isSceneCompleted && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* 생성 중 프로그레스 */}
              {isGeneratingVideo && (
                <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">영상을 생성 중입니다...</span>
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

              {/* 영상 품질 선택 */}
              {!isGeneratingVideo && (
                <div className="p-4 bg-secondary/20 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      영상 품질
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {sceneCount}개 씬 x {totalDuration}초 = 예상 {estimatedCredits} 크레딧
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {RESOLUTION_OPTIONS.map((option) => {
                      const isLocked = isFreeUser && option.value !== FREE_USER_LIMITS.maxResolution
                      return (
                        <button
                          key={option.value}
                          onClick={() => !isLocked && setVideoResolution(option.value)}
                          disabled={isLocked}
                          className={`relative p-3 rounded-xl border-2 transition-all ${
                            isLocked
                              ? 'border-border bg-secondary/30 cursor-not-allowed opacity-60'
                              : videoResolution === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {isLocked && (
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Lock className="w-2.5 h-2.5" />
                            </div>
                          )}
                          <div className="text-center">
                            <div className={`font-medium text-sm ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {option.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{option.desc}</div>
                            <div className="text-xs text-primary mt-1">{option.creditsPerSecond} 크레딧/초</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {isFreeUser && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      STARTER 이상 구독 시 HD/FHD 품질 사용 가능
                    </p>
                  )}
                </div>
              )}

              {/* 이전 단계 + 영상 생성 버튼 */}
              {!isGeneratingVideo && !isMergingVideos && regeneratingSceneIndex === null && (
                <div className="flex gap-3">
                  <button
                    onClick={goToPrevStep}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    이전 단계
                  </button>
                  <button
                    onClick={startMultiSceneVideoGeneration}
                    disabled={sceneKeyframes.filter(kf => kf.status === 'completed').length < 1}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Video className="w-5 h-5" />
                    영상 생성 ({estimatedCredits} 크레딧)
                  </button>
                </div>
              )}

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* 영상 재생성 모달 */}
      <VideoRegenerateModal
        isOpen={modalSceneInfo !== null}
        onClose={() => setModalSceneInfo(null)}
        onConfirm={handleVideoModalConfirm}
        sceneIndex={modalSceneInfo?.sceneIndex ?? 0}
        videoUrl={modalSceneInfo !== null ? sceneVideoStatuses.find(s => s.sceneIndex === modalSceneInfo.sceneIndex)?.videoUrl : undefined}
        currentDuration={modalSceneInfo !== null ? (sceneDurations[modalSceneInfo.originalSceneIndex] ?? 3) : 3}
        isLoading={isMergingPrompt}
        resolution={videoResolution}
        aspectRatio={aspectRatio}
      />

      {/* 크레딧 부족 모달 */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        requiredCredits={estimatedCredits}
        availableCredits={credits ?? 0}
        featureName="제품 광고 영상 생성"
      />
    </div>
  )
}
