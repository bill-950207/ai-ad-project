'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Clock, Download, ChevronLeft, ChevronRight, Loader2, XCircle, RotateCcw, X, Sparkles, Play, Pause } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

// ============================================================
// 트렌딩 비교 플레이어 (원본 vs 생성본 동시 재생)
// ============================================================

function TrendingComparisonPlayer({
  resultUrl,
  inputParams,
}: {
  resultUrl: string
  inputParams: Record<string, unknown> | null
}) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const originalRef = useRef<HTMLVideoElement>(null)
  const resultRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const sourceVideoUrl = (inputParams?.sourceVideoUrl as string) || ''
  const segments = (inputParams?.segments as Array<{
    type: string
    startTime: number
    endTime: number
  }>) || []
  const transformSegments = segments.filter((s) => s.type === 'transform')

  // 동기 재생/정지
  const togglePlay = useCallback(() => {
    if (!originalRef.current || !resultRef.current) return
    if (isPlaying) {
      originalRef.current.pause()
      resultRef.current.pause()
    } else {
      originalRef.current.play()
      resultRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  // 시간 동기화
  const handleTimeUpdate = useCallback(() => {
    if (originalRef.current) {
      setCurrentTime(originalRef.current.currentTime)
    }
  }, [])

  const handleLoaded = useCallback(() => {
    if (resultRef.current) {
      setDuration(resultRef.current.duration)
    }
  }, [])

  // 시크 바 클릭
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    const time = pct * duration
    if (originalRef.current) originalRef.current.currentTime = time
    if (resultRef.current) resultRef.current.currentTime = time
    setCurrentTime(time)
  }, [duration])

  // 영상 끝 처리
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-0">
      {/* 동영상 비교 영역 — 동일 높이 강제 */}
      <div className="flex bg-black" style={{ height: '60vh' }}>
        {/* 원본 */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium rounded-md">
            {aiToolsT.originalVideo || '원본'}
          </div>
          {sourceVideoUrl ? (
            <video
              ref={originalRef}
              src={sourceVideoUrl}
              className="h-full object-contain"
              muted
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
            />
          ) : (
            <div className="h-full aspect-[9/16] bg-secondary/20 flex items-center justify-center text-xs text-muted-foreground">
              {aiToolsT.noOriginal || '원본 없음'}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="w-px bg-white/10" />

        {/* 생성본 */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-violet-500/80 backdrop-blur-sm text-white text-[10px] font-medium rounded-md">
            {aiToolsT.transformResult || '변환 결과'}
          </div>
          <video
            ref={resultRef}
            src={resultUrl}
            className="h-full object-contain"
            muted
            playsInline
            onLoadedMetadata={handleLoaded}
            onEnded={handleEnded}
          />
        </div>
      </div>

      {/* 재생 컨트롤 + 진행 바 */}
      <div className="px-4 py-3 space-y-2.5 bg-card">
        {/* 진행 바 (변환 구간 표시) */}
        <div
          className="relative h-2 bg-secondary/30 rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          {/* 재생 위치 (아래 레이어) */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/15 rounded-full transition-[width] duration-100"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />

          {/* 변환 구간 하이라이트 (위 레이어 — 항상 보임) */}
          {duration > 0 && transformSegments.map((seg, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 bg-violet-500/70 rounded-sm z-[1]"
              style={{
                left: `${(seg.startTime / duration) * 100}%`,
                width: `${((seg.endTime - seg.startTime) / duration) * 100}%`,
              }}
            />
          ))}

          {/* 인디케이터 원 (최상위) */}
          {duration > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-primary z-[2]"
              style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
            />
          )}
        </div>

        {/* 컨트롤 행 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>
          </div>

          {/* 변환 구간 범례 */}
          {transformSegments.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-3 h-2 bg-violet-500/70 rounded-sm" />
              {aiToolsT.transformSegmentCount || '변환 구간'} ({transformSegments.length})
            </div>
          )}
        </div>

        {/* 변환 구간 상세 — 사용된 대상 이미지 표시 */}
        {transformSegments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/30">
            {transformSegments.map((seg, i) => {
              const targetImg = (seg as Record<string, unknown>).targetImageUrl as string | undefined
              return (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-secondary/30 rounded-lg">
                  {targetImg && (
                    <img
                      src={targetImg}
                      alt=""
                      className="w-7 h-7 rounded-md object-cover border border-violet-400/30"
                    />
                  )}
                  <div className="text-[10px]">
                    <div className="text-violet-400 font-medium">{aiToolsT.segmentNumber || '구간'} {i + 1}</div>
                    <div className="text-muted-foreground tabular-nums">
                      {fmtTime(seg.startTime)} ~ {fmtTime(seg.endTime)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface HistoryItem {
  id: string
  model: string
  prompt: string | null
  input_params: Record<string, unknown> | null
  status: string
  result_url: string | null
  thumbnail_url: string | null
  error_message: string | null
  credits_used: number
  created_at: string
}

interface Pagination {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

export interface ActiveGeneration {
  id: string
  model: string
  prompt: string
  referenceImageUrl?: string
}

interface GenerationHistoryProps {
  type: 'video' | 'image' | 'trending'
  refreshTrigger?: number
  activeGeneration?: ActiveGeneration | null
  onActiveComplete?: () => void
  onActiveError?: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRetry?: (data: any) => void
}

function getReferenceImageUrl(params: Record<string, unknown> | null): string | null {
  if (!params) return null
  if (typeof params.imageUrl === 'string') return params.imageUrl
  if (Array.isArray(params.imageUrls) && params.imageUrls.length > 0 && typeof params.imageUrls[0] === 'string')
    return params.imageUrls[0]
  if (typeof params.image === 'string') return params.image
  return null
}

/* Shimmer skeleton for loading cards */
function SkeletonCard() {
  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-secondary/40" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-secondary/60 rounded-full w-3/4" />
        <div className="h-2.5 bg-secondary/40 rounded-full w-1/2" />
      </div>
    </div>
  )
}

export default function GenerationHistory({
  type,
  refreshTrigger,
  activeGeneration,
  onActiveComplete,
  onActiveError,
  onRetry,
}: GenerationHistoryProps) {
  const { t, language } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [items, setItems] = useState<HistoryItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState<HistoryItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollSentinelRef = useRef<HTMLDivElement>(null)
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const searchParams = useSearchParams()
  const [autoOpenHandled, setAutoOpenHandled] = useState(false)

  // URL의 ?result=ID 파라미터로 자동 팝업 오픈
  useEffect(() => {
    if (autoOpenHandled || allItems.length === 0) return
    const resultId = searchParams.get('result')
    if (!resultId) return
    const item = allItems.find((i) => i.id === resultId && i.status === 'COMPLETED' && i.result_url)
    if (item) {
      setSelectedItem(item)
      setAutoOpenHandled(true)
    }
  }, [allItems, searchParams, autoOpenHandled])

  // Active generation polling state
  const [activeStatus, setActiveStatus] = useState<string>('PENDING')
  const [activeResultUrl, setActiveResultUrl] = useState<string | null>(null)
  const [, setActiveError] = useState<string | null>(null)

  // Refs for callbacks to avoid stale closures
  const onActiveCompleteRef = useRef(onActiveComplete)
  const onActiveErrorRef = useRef(onActiveError)
  useEffect(() => { onActiveCompleteRef.current = onActiveComplete }, [onActiveComplete])
  useEffect(() => { onActiveErrorRef.current = onActiveError }, [onActiveError])

  // Fetch history
  const fetchHistory = useCallback(async (targetPage?: number) => {
    const p = targetPage ?? page
    if (p === 1) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const res = await fetch(`/api/ai-tools/${type}/history?page=${p}&pageSize=12`)
      if (!res.ok) throw new Error('히스토리 조회 실패')

      const data = await res.json()
      setItems(data.items)
      setPagination(data.pagination)

      if (p === 1) {
        setAllItems(data.items)
      } else {
        setAllItems((prev) => {
          const existingIds = new Set(prev.map((item: HistoryItem) => item.id))
          const newItems = data.items.filter((item: HistoryItem) => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      }
      setHasMore(data.pagination.hasMore)
    } catch (error) {
      console.error('History fetch error:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [type, page])

  useEffect(() => {
    setPage(1)
    setAllItems([])
    setHasMore(true)
    fetchHistory(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, refreshTrigger])

  // 페이지 변경 시 추가 로드
  useEffect(() => {
    if (page > 1) fetchHistory(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // 무한 스크롤 — IntersectionObserver
  useEffect(() => {
    if (!scrollSentinelRef.current || !hasMore || isLoadingMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setPage((p) => p + 1)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(scrollSentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore])

  // Poll provider status for in-progress items, then refresh history
  const processingItemIds = items
    .filter(item => ['PENDING', 'IN_QUEUE', 'IN_PROGRESS', 'COMPOSITING'].includes(item.status))
    .map(item => item.id)

  const processingIdsKey = processingItemIds.join(',')

  useEffect(() => {
    if (!processingIdsKey) return

    const ids = processingIdsKey.split(',')

    const statusBaseUrl = type === 'trending'
      ? '/api/ai-tools/trending/status'
      : '/api/ai-tools/status'

    const pollAndRefresh = async () => {
      await Promise.all(
        ids.map(id =>
          fetch(`${statusBaseUrl}/${id}`).catch(() => {})
        )
      )
      fetchHistory()
    }

    pollAndRefresh()
    const intervalId = setInterval(pollAndRefresh, 3000)

    return () => clearInterval(intervalId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingIdsKey, fetchHistory])

  // Active generation polling
  useEffect(() => {
    if (!activeGeneration || !activeGeneration.id) return

    let active = true
    let intervalId: ReturnType<typeof setInterval>

    setActiveStatus('PENDING')
    setActiveResultUrl(null)
    setActiveError(null)

    let failCount = 0

    const poll = async () => {
      if (!active) return
      try {
        const activeStatusUrl = type === 'trending'
          ? `/api/ai-tools/trending/status/${activeGeneration.id}`
          : `/api/ai-tools/status/${activeGeneration.id}`
        const res = await fetch(activeStatusUrl)
        if (!active) return

        if (!res.ok) {
          failCount++
          console.warn(`[poll] status ${res.status} (fail #${failCount})`)
          if (failCount >= 10) {
            setActiveStatus('FAILED')
            setActiveError('상태 확인에 실패했습니다')
            clearInterval(intervalId)
            onActiveErrorRef.current?.()
          }
          return
        }

        failCount = 0
        const data = await res.json()
        if (!active) return

        setActiveStatus(data.status)
        if (data.status === 'COMPLETED' && data.resultUrl) {
          setActiveResultUrl(data.resultUrl)
          clearInterval(intervalId)
          onActiveCompleteRef.current?.()
        } else if (data.status === 'FAILED') {
          setActiveError(data.error || '생성에 실패했습니다')
          clearInterval(intervalId)
          onActiveErrorRef.current?.()
        }
      } catch (err) {
        failCount++
        console.warn('[poll] network error', err)
        if (failCount >= 10) {
          setActiveStatus('FAILED')
          setActiveError('네트워크 오류가 발생했습니다')
          clearInterval(intervalId)
          onActiveErrorRef.current?.()
        }
      }
    }

    poll()
    intervalId = setInterval(poll, 3000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGeneration?.id])

  const localeMap: Record<string, string> = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' }
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(localeMap[language] || 'ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const modelLabels: Record<string, string> = {
    'seedance-1.5-pro': 'Seedance 1.5 Pro',
    'vidu-q3': 'Vidu Q3',
    'kling-3': 'Kling 3.0',
    'kling-3-mc': 'Kling 3.0 MC',
    'grok-video': 'Grok Video',
    'wan-2.6': 'Wan 2.6',
    'veo-3.1': 'Veo 3.1',
    'hailuo-02': 'Hailuo-02',
    'ltx-2.3': 'LTX 2.3',
    'seedream-5': 'Seedream 5',
    'seedream-4.5': 'Seedream 4.5',
    'z-image': 'Z-Image',
    'flux-2-pro': 'FLUX.2 Pro',
    'grok-image': 'Grok Imagine',
    'nano-banana-2': 'Nano Banana 2',
    'recraft-v4': 'Recraft V4',
    'qwen-image-2': 'Qwen Image 2.0',
    'flux-kontext': 'FLUX Kontext',
    'face-transform': '모션 컨트롤',
  }

  const hasActiveGeneration = !!activeGeneration

  // Loading state with skeleton
  if (isLoading && items.length === 0 && !hasActiveGeneration) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          {aiToolsT.history || '생성 히스토리'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Empty state
  if (items.length === 0 && !hasActiveGeneration) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {aiToolsT.noHistory || '생성 히스토리가 없습니다'}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {type === 'image'
            ? (aiToolsT.noHistoryImageHint || '모델을 선택하고 이미지를 생성해보세요')
            : type === 'trending'
            ? (aiToolsT.noHistoryTrendingHint || '트렌딩 도구를 사용해보세요')
            : (aiToolsT.noHistoryVideoHint || '모델을 선택하고 영상을 생성해보세요')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Clock className="w-5 h-5 text-muted-foreground" />
        {aiToolsT.history || '생성 히스토리'}
      </h3>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Active Generation Card */}
        {hasActiveGeneration && (
          <div
            className={`group bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
              activeStatus === 'COMPLETED'
                ? 'border-border/60 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5'
                : activeStatus === 'FAILED'
                  ? 'border-red-500/30 bg-red-500/[0.02]'
                  : 'border-primary/30 ring-1 ring-primary/10'
            }`}
            onClick={() => {
              if (activeStatus === 'COMPLETED' && activeResultUrl) {
                setSelectedItem({
                  id: activeGeneration.id,
                  model: activeGeneration.model,
                  prompt: activeGeneration.prompt,
                  input_params: null,
                  status: 'COMPLETED',
                  result_url: activeResultUrl,
                  thumbnail_url: null,
                  error_message: null,
                  credits_used: 0,
                  created_at: new Date().toISOString(),
                })
              }
            }}
          >
            {/* Thumbnail / Progress */}
            <div className={`relative bg-secondary/20 ${
              activeStatus === 'COMPLETED' && activeResultUrl ? 'aspect-video' : 'aspect-[4/3]'
            }`}>
              {activeStatus === 'COMPLETED' && activeResultUrl ? (
                type === 'video' ? (
                  <video
                    src={activeResultUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={activeResultUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )
              ) : activeStatus === 'FAILED' ? (
                <div className="flex flex-col items-center justify-center h-full gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-[10px] font-medium text-red-400/80">
                    {aiToolsT.generationFailed || '생성 실패'}
                  </span>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRetry({
                          model: activeGeneration.model,
                          prompt: activeGeneration.prompt,
                          ...(activeGeneration.referenceImageUrl ? { imageUrl: activeGeneration.referenceImageUrl } : {}),
                        })
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {aiToolsT.retry || '재시도'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {aiToolsT.generating || 'Generating...'}
                  </span>
                  {/* Animated gradient bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/50 overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-primary/60 via-primary to-primary/60 animate-[shimmer_1.5s_ease-in-out_infinite]"
                      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
                    />
                  </div>
                </div>
              )}

              {/* Model badge */}
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium rounded-lg">
                {modelLabels[activeGeneration.model] || activeGeneration.model}
              </span>

              {/* Reference image */}
              {activeGeneration.referenceImageUrl && (
                <img
                  src={activeGeneration.referenceImageUrl}
                  alt=""
                  className="absolute bottom-2 left-2 w-8 h-8 rounded-lg border-2 border-white/20 object-cover shadow-md"
                />
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-xs text-muted-foreground truncate">
                {activeGeneration.prompt || '-'}
              </p>
            </div>
          </div>
        )}

        {/* History Items */}
        {allItems.filter(item => {
          if (activeGeneration && item.id === activeGeneration.id) return false
          if (type === 'trending' && item.status === 'FAILED') return false
          return true
        }).map((item) => {
          const refImgUrl = getReferenceImageUrl(item.input_params)
          const isProcessing = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS', 'COMPOSITING'].includes(item.status)
          return (
            <div
              key={item.id}
              onClick={() => !isProcessing && setSelectedItem(item)}
              className={`group bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
                isProcessing
                  ? 'border-border/50 opacity-80'
                  : item.status === 'FAILED'
                    ? 'border-red-500/20 cursor-pointer hover:border-red-500/30'
                    : 'border-border/50 cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5'
              }`}
            >
              {/* Thumbnail / Preview */}
              <div className={`relative bg-secondary/20 overflow-hidden ${
                item.status === 'COMPLETED' && item.result_url ? 'aspect-video' : 'aspect-[4/3]'
              }`}>
                {item.status === 'COMPLETED' && item.result_url ? (
                  (type === 'video' || type === 'trending') ? (
                    <video
                      src={item.result_url}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.thumbnail_url || item.result_url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )
                ) : item.status === 'FAILED' ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-[10px] font-medium text-red-400/80">
                      {aiToolsT.generationFailed || '생성 실패'}
                    </span>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRetry({
                            model: item.model,
                            prompt: item.prompt,
                            ...item.input_params,
                          })
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {aiToolsT.retry || '재시도'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <Sparkles className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {aiToolsT.generating || 'Generating...'}
                    </span>
                  </div>
                )}

                {/* Model badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium rounded-lg">
                  {modelLabels[item.model] || item.model}
                </span>

                {/* Reference image */}
                {refImgUrl && (
                  <img
                    src={refImgUrl}
                    alt=""
                    className="absolute bottom-2 left-2 w-8 h-8 rounded-lg border-2 border-white/20 object-cover shadow-md"
                  />
                )}

                {/* Hover overlay for completed items */}
                {item.status === 'COMPLETED' && item.result_url && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-muted-foreground truncate">
                  {item.prompt || '-'}
                </p>
                {isProcessing ? null : (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground/70">
                      {formatDate(item.created_at)}
                    </span>
                    {item.credits_used > 0 && (
                      <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                        {item.credits_used} {aiToolsT.credits || '크레딧'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 무한 스크롤 센티넬 */}
      {hasMore && (
        <div ref={scrollSentinelRef} className="flex justify-center py-4">
          {isLoadingMore && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && selectedItem.status === 'COMPLETED' && selectedItem.result_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={`bg-[#0a0a0f] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative ${
              type === 'trending' ? 'max-w-4xl max-h-[88vh]' : 'max-w-2xl'
            } w-full flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/60 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-auto">
              {type === 'trending' ? (
                <TrendingComparisonPlayer
                  resultUrl={selectedItem.result_url}
                  inputParams={selectedItem.input_params}
                />
              ) : (type === 'video') ? (
                <video src={selectedItem.result_url} controls autoPlay className="w-full" />
              ) : (
                <img src={selectedItem.result_url} alt="" className="w-full" />
              )}
            </div>

            {/* 하단 정보 */}
            <div className="p-4 border-t border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-violet-500/15 border border-violet-500/20 text-[10px] font-medium text-violet-300 rounded-md">
                      {modelLabels[selectedItem.model] || selectedItem.model}
                    </span>
                    <span className="text-[11px] text-white/30 tabular-nums">
                      {formatDate(selectedItem.created_at)}
                    </span>
                    <span className="text-[11px] text-white/20">
                      {selectedItem.credits_used}cr
                    </span>
                  </div>
                </div>
                <a
                  href={selectedItem.result_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  {aiToolsT.download || '다운로드'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shimmer animation keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  )
}
