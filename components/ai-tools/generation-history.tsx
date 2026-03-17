'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, Download, ChevronLeft, ChevronRight, Loader2, XCircle, RotateCcw, X, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

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
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

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
  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/ai-tools/${type}/history?page=${page}&pageSize=8`)
      if (!res.ok) throw new Error('히스토리 조회 실패')

      const data = await res.json()
      setItems(data.items)
      setPagination(data.pagination)
    } catch (error) {
      console.error('History fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [type, page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory, refreshTrigger])

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
    'face-transform': '얼굴 변환',
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
        {items.filter(item => !activeGeneration || item.id !== activeGeneration.id).map((item) => {
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
                  type === 'video' ? (
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl bg-secondary/40 hover:bg-secondary/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground tabular-nums min-w-[3rem] text-center">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasMore}
            className="p-2 rounded-xl bg-secondary/40 hover:bg-secondary/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && selectedItem.status === 'COMPLETED' && selectedItem.result_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-card border border-border/60 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>

            {type === 'video' ? (
              <video
                src={selectedItem.result_url}
                controls
                autoPlay
                className="w-full"
              />
            ) : (
              <img
                src={selectedItem.result_url}
                alt=""
                className="w-full"
              />
            )}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground leading-relaxed">{selectedItem.prompt}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-secondary/60 text-[10px] font-medium text-muted-foreground rounded-md">
                    {modelLabels[selectedItem.model] || selectedItem.model}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {formatDate(selectedItem.created_at)}
                  </span>
                </div>
              </div>
              <a
                href={selectedItem.result_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                {aiToolsT.download || '다운로드'}
              </a>
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
