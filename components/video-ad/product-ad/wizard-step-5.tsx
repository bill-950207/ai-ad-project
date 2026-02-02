'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCredits } from '@/contexts/credit-context'
import { useLanguage } from '@/contexts/language-context'
import { InsufficientCreditsModal } from '@/components/ui/insufficient-credits-modal'
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

// FREE 사용자 제한 (Vidu Q2 Turbo는 540p 미지원)
const FREE_USER_LIMITS = {
  maxResolution: '720p' as VideoResolution,
}

// 번역된 해상도 옵션을 가져오는 함수 (Vidu Q2: 720p, 1080p만 지원)
function getResolutionOptions(t: Record<string, unknown>) {
  const step5T = (t.productAdWizard as Record<string, unknown>)?.step5 as Record<string, unknown> || {}
  const resT = step5T.resolutionOptions as Record<string, string> || {}
  return [
    { value: '720p' as VideoResolution, label: 'HD (720p)', desc: resT.hdDesc || 'Standard quality', creditsPerSecond: VIDU_CREDIT_COST_PER_SECOND['720p'] },
    { value: '1080p' as VideoResolution, label: 'FHD (1080p)', desc: resT.fhdDesc || 'High quality', creditsPerSecond: VIDU_CREDIT_COST_PER_SECOND['1080p'] },
  ]
}
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
  const { t } = useLanguage()
  const resolutionOptions = getResolutionOptions(t)
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [duration, setDuration] = useState(currentDuration)

  // 현재 해상도의 크레딧/초 계산
  const creditsPerSecond = resolutionOptions.find(o => o.value === resolution)?.creditsPerSecond ?? 8
  const estimatedCredits = duration * creditsPerSecond
  const resolutionLabel = resolutionOptions.find(o => o.value === resolution)?.label ?? resolution

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
            <h3 className="text-lg font-bold text-foreground">{t.productAdWizard?.step5?.regenerateSceneVideo || 'Regenerate Scene Video'} {sceneIndex + 1}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t.productAdWizard?.step5?.regenerateDesc || 'Additional prompts will be applied with the existing scenario'}
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
              {t.productAdWizard?.step5?.videoDuration || 'Video Duration'}
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
                  {d}{t.common?.secondsShort || 's'}
                </button>
              ))}
            </div>
          </div>

          {/* 예상 크레딧 표시 */}
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="w-4 h-4 text-primary" />
              <span>{resolutionLabel} / {duration}{t.common?.secondsShort || 's'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <span>{estimatedCredits}</span>
              <span className="text-xs font-normal text-muted-foreground">{t.common?.credits || 'Credits'}</span>
            </div>
          </div>

          {/* 추가 프롬프트 입력 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquarePlus className="w-4 h-4 text-muted-foreground" />
              {t.productAdWizard?.step5?.additionalPrompt || 'Additional Prompt'}
              <span className="text-xs text-muted-foreground font-normal">({t.common?.optional || 'Optional'})</span>
            </label>
            <textarea
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder={t.productAdWizard?.step5?.additionalPromptPlaceholder || 'E.g., camera slowly zooms in, more dynamic motion...'}
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
              {t.common?.cancel || 'Cancel'}
            </button>
            <button
              onClick={() => onConfirm(additionalPrompt, duration)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.common?.processing || 'Processing...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {t.productAdWizard?.step5?.regenerate || 'Regenerate'}
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
  const { t } = useLanguage()
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
            <span className="text-base font-medium text-foreground">{t.productAdWizard?.step5?.scene || 'Scene'} {sceneVideo.sceneIndex + 1}</span>
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
                  title={t.productAdWizard?.step5?.versionHistory || 'Version History'}
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
                        <p className="text-xs font-medium text-foreground">{t.productAdWizard?.step5?.versionHistory || 'Version History'}</p>
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
                                <span className="text-xs text-muted-foreground">{v.duration}{t.common?.secondsShort || 's'}</span>
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
              title={t.productAdWizard?.step5?.regenerate || 'Regenerate'}
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
                {isRegenerating ? (t.productAdWizard?.step5?.regenerating || 'Regenerating...') : (t.productAdWizard?.step5?.generating || 'Generating...')}
              </span>
            </div>
          ) : isFailed ? (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-destructive/5 to-destructive/10">
              <AlertCircle className="w-12 h-12 text-destructive mb-3" />
              <span className="text-base text-destructive">{t.productAdWizard?.step5?.generationFailed || 'Generation Failed'}</span>
              <button
                onClick={() => onRegenerate(sceneVideo.sceneIndex, sceneVideo.originalSceneIndex)}
                className="mt-3 px-4 py-2 text-sm bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
              >
                {t.common?.retry || 'Retry'}
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
              {t.common?.download || 'Download'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function WizardStep5() {
  const { t } = useLanguage()
  const resolutionOptions = getResolutionOptions(t)
  const router = useRouter()
  const { credits, refreshCredits } = useCredits()
  const {
    draftId,
    selectedProduct,
    scenarioInfo,
    aspectRatio,
    duration,
    sceneDurations,
    updateSceneDuration,
    videoResolution,
    setVideoResolution,
    sceneCount,
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

  // 사용자 플랜 정보
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const isFreeUser = userPlan?.planType === 'FREE'

  const [error, setError] = useState<string | null>(null)
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [videoStatuses, setVideoStatuses] = useState<VideoStatus[]>([])
  const [sceneVideoStatuses, setSceneVideoStatuses] = useState<SceneVideoStatus[]>([])
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
  const [isMergingVideos, setIsMergingVideos] = useState(false)
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null)
  const [modalSceneInfo, setModalSceneInfo] = useState<{ sceneIndex: number; originalSceneIndex: number } | null>(null)
  const [isMergingPrompt, setIsMergingPrompt] = useState(false)

  // 씬 버전 히스토리 상태
  const [sceneVersions, setSceneVersions] = useState<Record<number, SceneVersion[]>>({})
  const [isLoadingVersions, setIsLoadingVersions] = useState<Record<number, boolean>>({})
  const [isSwitchingVersion, setIsSwitchingVersion] = useState<number | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const transitionPollingRef = useRef<NodeJS.Timeout | null>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressStartTimeRef = useRef<number>(0)
  const progressTotalDurationRef = useRef<number>(0)
  const isPollingActiveRef = useRef(false)
  const isTransitionPollingActiveRef = useRef(false)
  const hasAttemptedMultiSceneResumeRef = useRef(false)  // 멀티씬 폴링 재개 시도 여부
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
        console.error('Error loading plan info:', error)
      }
    }
    fetchUserPlan()
  }, [videoResolution, setVideoResolution])

  // 총 영상 길이 및 예상 크레딧 계산
  const totalDuration = sceneDurations.slice(0, sceneCount).reduce((sum, d) => sum + d, 0)
  const estimatedCredits = (() => {
    const option = resolutionOptions.find(o => o.value === videoResolution)
    if (!option) return 0
    return option.creditsPerSecond * totalDuration
  })()

  // Vidu Q3 전용 모드 (항상 멀티씬)
  const isMultiSceneMode = videoModel === 'vidu'

  const selectedScene = selectedSceneIndex !== null ? firstSceneOptions[selectedSceneIndex] : null
  const hasCompletedVideos = isMultiSceneMode
    ? (finalVideoUrl !== null || sceneVideoStatuses.filter(s => s.status === 'completed').length > 0)
    : resultVideoUrls.length > 0
  const allVideosCompleted = videoStatuses.length > 0 && videoStatuses.every(v => v.status === 'completed' || v.status === 'failed')

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
      console.error('Error fetching version history:', error)
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
      console.error('Error saving version:', error)
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
      console.error('Error switching version:', error)
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
      setError(t.productAdWizard?.step5?.errorMinKeyframe || 'At least 1 keyframe is required.')
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
        throw new Error(errorData.error || 'Failed to request scene video generation')
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

      // DB 업데이트
      await saveDraft({
        status: 'GENERATING_SCENE_VIDEOS',
      })

      // 폴링 시작
      startSceneVideoPolling(initialStatuses)
    } catch (err) {
      console.error('Error generating Kling O1 video:', err)
      setError(err instanceof Error ? err.message : (t.productAdWizard?.step5?.errorSceneGeneration || 'Failed to generate scene videos.'))
      setIsGeneratingVideo(false)
    }
  }

  // 개별 씬 영상 재생성 (추가 프롬프트 및 시간 포함)
  const regenerateSingleSceneVideo = async (sceneIndex: number, additionalPrompt: string = '', sceneDuration?: number) => {
    if (!scenarioInfo?.scenes) return

    const keyframe = sceneKeyframes.find(kf => kf.sceneIndex === sceneIndex && kf.status === 'completed' && kf.imageUrl)
    const sceneInfo = scenarioInfo.scenes.find(s => s.index === sceneIndex)
    if (!keyframe || !sceneInfo) {
      setError(t.productAdWizard?.step5?.errorKeyframeNotFound || 'Keyframe not found for this scene.')
      return
    }

    // 전달된 duration 또는 context의 sceneDurations 사용
    const useDuration = sceneDuration ?? sceneDurations[sceneIndex] ?? 3

    // 단일 씬 재생성 크레딧 계산 및 체크
    const option = resolutionOptions.find(o => o.value === videoResolution)
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

      if (!res.ok) throw new Error('Failed to request scene video regeneration')

      const data = await res.json()
      const sceneVideo = data.sceneVideos[0]

      setSceneVideoStatuses(prev => prev.map(s =>
        s.sceneIndex === sceneIndex
          ? { ...s, requestId: sceneVideo.requestId, status: 'generating' }
          : s
      ))

      // 단일 씬 폴링 시작 (duration 전달)
      startSingleSceneVideoPolling(sceneIndex, sceneVideo.requestId, useDuration)
    } catch (err) {
      console.error('Error regenerating scene video:', err)
      setSceneVideoStatuses(prev => prev.map(s =>
        s.sceneIndex === sceneIndex
          ? { ...s, status: 'failed', errorMessage: 'Regeneration failed' }
          : s
      ))
      setRegeneratingSceneIndex(null)
      setIsMergingPrompt(false)
      setModalSceneInfo(null)
      setError(t.productAdWizard?.step5?.errorSceneRegeneration || 'Failed to regenerate scene video.')
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
          setError(t.productAdWizard?.step5?.errorSceneRegeneration || 'Failed to regenerate scene video.')
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

    const pollStatus = async () => {
      let allCompleted = true

      for (const sceneVideo of statuses) {
        if (sceneVideo.status === 'completed' || sceneVideo.status === 'failed') {
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

  // ============================================================
  // 일반 모드: 영상 생성
  // ============================================================

  // 영상 생성 시작
  const startVideoGeneration = async () => {
    if (!selectedScene?.imageUrl || !scenarioInfo || !selectedProduct) return

    // 크레딧 체크
    if (credits !== null && credits < estimatedCredits) {
      setShowInsufficientCreditsModal(true)
      return
    }

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
        throw new Error(errorData.error || 'Failed to request video generation')
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
      console.error('Error generating video:', err)
      setError(err instanceof Error ? err.message : (t.productAdWizard?.step5?.errorVideoGeneration || 'Failed to generate video.'))
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
          // 크레딧 갱신
          refreshCredits()
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
          setStatusMessage('영상 생성을 재개합니다...')
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
      console.error('Error downloading video:', err)
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
      setStatusMessage(t.productAdWizard?.step5?.mergingVideos || 'Merging videos...')

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
          throw new Error(errorData.error || 'Failed to merge videos')
        }

        const data = await res.json()

        // DB 업데이트
        await saveDraft({
          videoUrl: data.mergedVideoUrl,
          status: 'COMPLETED',
        })

        // 크레딧 갱신
        refreshCredits()

        // 상세 페이지로 이동
        router.push(`/dashboard/video-ad/${draftId}`)
      } catch (err) {
        console.error('Error merging videos:', err)
        setError(err instanceof Error ? err.message : (t.productAdWizard?.step5?.errorMergeVideo || 'Failed to merge videos.'))
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
          {hasCompletedVideos ? (t.productAdWizard?.step5?.titleComplete || 'Video Generation Complete') : (t.productAdWizard?.step5?.title || 'Generate Ad Video')}
        </h2>
        <p className="text-muted-foreground mt-2">
          {isMultiSceneMode
            ? (hasCompletedVideos
                ? (t.productAdWizard?.step5?.sceneVideosComplete?.replace('{count}', String(completedSceneVideoUrls.length)) || `${completedSceneVideoUrls.length} scene videos completed`)
                : (t.productAdWizard?.step5?.generatingSceneVideos?.replace('{count}', String(sceneKeyframes.length)) || `Generating videos for ${sceneKeyframes.length} scenes`))
            : (hasCompletedVideos
                ? (t.productAdWizard?.step5?.videosComplete?.replace('{count}', String(resultVideoUrls.length)) || `${resultVideoUrls.length} product ad videos completed`)
                : (t.productAdWizard?.step5?.subtitleGenerate || 'Generate ad video from the selected first scene'))
          }
        </p>
      </div>

      {/* 결과 영상 */}
      {hasCompletedVideos ? (
        <div className="space-y-4">
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
                      disabled={regeneratingSceneIndex !== null}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                      {t.common?.complete || 'Complete'}
                    </button>
                    <button
                      onClick={() => handleDownload(finalVideoUrl, 0)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      {t.common?.download || 'Download'}
                    </button>
                    <button
                      onClick={() => setFinalVideoUrl(null)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                      {t.productAdWizard?.step5?.individualVideos || 'Individual Videos'}
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
                        {t.productAdWizard?.step5?.reviewSceneVideos || 'Review and play each scene video'}
                        {sceneVideoStatuses.filter(s => s.status === 'completed').length >= 2 && (
                          <span className="text-primary ml-1">({t.productAdWizard?.step5?.dragToReorder || 'Drag to reorder'})</span>
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
                          {t.productAdWizard?.step5?.mergingVideos || 'Merging videos...'}
                        </>
                      ) : regeneratingSceneIndex !== null ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t.productAdWizard?.step5?.regeneratingScene || 'Regenerating scene...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          {t.common?.complete || 'Complete'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleMultiSceneRegenerate}
                      disabled={isMergingVideos || regeneratingSceneIndex !== null}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-5 h-5" />
                      {t.productAdWizard?.step5?.regenerateAll || 'Regenerate All'}
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
                      <span className="text-sm text-muted-foreground">{t.productAdWizard?.step5?.selectVideo || 'Please select a video'}</span>
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
                        className={`relative w-full ${getAspectRatioClass(aspectRatio)} bg-black rounded-lg overflow-hidden border-2 transition-all ${
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
                            className="absolute inset-0 w-full h-full object-contain"
                            muted
                          />
                        ) : isGenerating ? (
                          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-secondary/50">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                            <span className="text-xs text-muted-foreground">{t.productAdWizard?.step5?.generating || 'Generating...'}</span>
                          </div>
                        ) : isFailed ? (
                          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-destructive/10">
                            <AlertCircle className="w-6 h-6 text-destructive mb-2" />
                            <span className="text-xs text-destructive">{t.common?.failed || 'Failed'}</span>
                          </div>
                        ) : null}
                        <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
                          {t.productAdWizard?.step5?.video || 'Video'} {index + 1}
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
                    {t.productAdWizard?.step5?.downloadSelected || 'Download Selected'}
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    {t.common?.all || 'All'} ({resultVideoUrls.length})
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
                    {t.common?.complete || 'Complete'}
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
                      <span className="text-sm text-muted-foreground">{t.productAdWizard?.step5?.generatingVideo || 'Generating video...'}</span>
                    </div>
                  ) : videoStatuses.length === 1 && videoStatuses[0].status === 'failed' ? (
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                      <span className="text-sm text-destructive">{t.productAdWizard?.step5?.generationFailed || 'Video generation failed'}</span>
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
                    {t.productAdWizard?.step5?.downloadVideo || 'Download Video'}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {t.productAdWizard?.step5?.regenerate || 'Regenerate'}
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!resultVideoUrls[0]}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    {t.common?.complete || 'Complete'}
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
                            alt={`${t.productAdWizard?.step5?.scene || 'Scene'} ${kf.sceneIndex + 1}`}
                            fill
                            className="object-contain"
                          />

                          {/* 오버레이 상태 표시 */}
                          {isSceneGenerating ? (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-white" />
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
                              <Play className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                            </button>
                          ) : isSceneFailed ? (
                            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                          ) : null}

                          {/* 씬 번호 */}
                          <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                            {t.productAdWizard?.step5?.scene || 'Scene'} {kf.sceneIndex + 1}
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
                    <span className="text-muted-foreground">{t.productAdWizard?.step5?.generatingVideo || 'Generating video...'}</span>
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
                      {t.productAdWizard?.step5?.videoQuality || 'Video Quality'}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {sceneCount} {t.productAdWizard?.step5?.scenes || 'scenes'} x {totalDuration}{t.common?.secondsShort || 's'} = {t.productAdWizard?.step5?.estimated || 'Estimated'} {estimatedCredits} {t.common?.credits || 'Credits'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    {resolutionOptions.map((option) => {
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
                            <div className="text-xs text-primary mt-1">{option.creditsPerSecond} {t.common?.credits || 'Credits'}/{t.common?.secondsShort || 's'}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {isFreeUser && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {t.productAdWizard?.step5?.upgradeForQuality || 'Subscribe to STARTER or higher for HD/FHD quality'}
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
                    {t.productAdWizard?.step5?.prevStep || 'Previous Step'}
                  </button>
                  <button
                    onClick={startMultiSceneVideoGeneration}
                    disabled={sceneKeyframes.filter(kf => kf.status === 'completed').length < 1}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Video className="w-5 h-5" />
                    {t.productAdWizard?.step5?.generateVideo || 'Generate Video'} ({estimatedCredits} {t.common?.credits || 'Credits'})
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
          ) : (
            /* 일반 모드: 선택된 첫 씬 미리보기 */
            selectedScene?.imageUrl && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">{t.productAdWizard?.step5?.selectedFirstScene || 'Selected First Scene'}</h3>
                <div className="relative h-64 rounded-xl overflow-hidden bg-secondary/30">
                  <Image
                    src={selectedScene.imageUrl}
                    alt={t.productAdWizard?.step5?.selectedFirstScene || 'Selected First Scene'}
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
                <span className="text-sm font-medium text-foreground">{t.productAdWizard?.step5?.scenarioSummary || 'Scenario Summary'}</span>
              </div>
              <div className="text-sm">
                {scenarioInfo.elements?.mood && (
                  <div>
                    <span className="text-muted-foreground">{t.productAdWizard?.step5?.mood || 'Mood'}: </span>
                    <span className="text-foreground">{scenarioInfo.elements.mood}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 일반 모드 전용: 영상 설정 정보 */}
          {!isMultiSceneMode && (
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <div className="px-3 py-1.5 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">{t.productAdWizard?.step5?.ratio || 'Ratio'}: </span>
                <span className="text-foreground font-medium">{aspectRatio}</span>
              </div>
              <div className="px-3 py-1.5 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">{t.productAdWizard?.step5?.duration || 'Duration'}: </span>
                <span className="text-foreground font-medium">{duration}{t.common?.secondsShort || 's'}</span>
              </div>
              <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                <span className="text-muted-foreground">{t.productAdWizard?.step5?.model || 'Model'}: </span>
                <span className="text-primary font-medium">
                  {videoModel === 'seedance' ? 'Seedance' : videoModel === 'kling2.6' ? 'Kling 2.6' : 'Wan 2.6'}
                </span>
              </div>
              {multiShot && (
                <div className="px-3 py-1.5 bg-primary/10 rounded-lg flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary font-medium">{t.productAdWizard?.step5?.multiShot || 'Multi-shot'}</span>
                </div>
              )}
              <div className="px-3 py-1.5 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">{t.productAdWizard?.step5?.count || 'Count'}: </span>
                <span className="text-foreground font-medium">{videoCount}</span>
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
                            <span className="text-sm font-medium">{t.productAdWizard?.step5?.video || 'Video'} {index + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">
                        {t.productAdWizard?.step5?.generatingVideos?.replace('{count}', String(videoCount)) || `Generating ${videoCount > 1 ? videoCount + ' videos' : 'video'}...`}
                      </p>
                      <p className="text-sm text-muted-foreground">{t.productAdWizard?.step5?.estimatedTime || 'Takes about 1-3 minutes'}</p>
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
                  {videoCount > 1 ? (t.productAdWizard?.step5?.generateMultiple?.replace('{count}', String(videoCount)) || `Generate ${videoCount} Ad Videos`) : (t.productAdWizard?.step5?.generateSingle || 'Generate Ad Video')}
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
              {!isGeneratingVideo && !isMergingVideos && regeneratingSceneIndex === null && (
                <button
                  onClick={goToPrevStep}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.productAdWizard?.step5?.prevStep || 'Previous Step'}
                </button>
              )}
            </>
          )}
        </>
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
        featureName={t.productAdWizard?.step5?.featureName || 'Product Ad Video Generation'}
      />
    </div>
  )
}
