'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, Download, ChevronLeft, ChevronRight, Loader2, XCircle, RotateCcw } from 'lucide-react'
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
  type: 'video' | 'image'
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

export default function GenerationHistory({
  type,
  refreshTrigger,
  activeGeneration,
  onActiveComplete,
  onActiveError,
  onRetry,
}: GenerationHistoryProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [items, setItems] = useState<HistoryItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

  // Active generation polling state
  const [activeStatus, setActiveStatus] = useState<string>('PENDING')
  const [activeResultUrl, setActiveResultUrl] = useState<string | null>(null)
  const [activeError, setActiveError] = useState<string | null>(null)

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
    .filter(item => ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(item.status))
    .map(item => item.id)

  const processingIdsKey = processingItemIds.join(',')

  useEffect(() => {
    if (!processingIdsKey) return

    const ids = processingIdsKey.split(',')

    const pollAndRefresh = async () => {
      // 각 아이템의 status API 호출 → FAL.ai 등 provider 상태 확인 후 DB 업데이트
      await Promise.all(
        ids.map(id =>
          fetch(`/api/ai-tools/status/${id}`).catch(() => {})
        )
      )
      // DB 업데이트 반영을 위해 히스토리 다시 조회
      fetchHistory()
    }

    pollAndRefresh()
    const intervalId = setInterval(pollAndRefresh, 3000)

    return () => clearInterval(intervalId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingIdsKey, fetchHistory])

  // Active generation polling
  useEffect(() => {
    if (!activeGeneration) return

    let active = true
    let intervalId: ReturnType<typeof setInterval>

    setActiveStatus('PENDING')
    setActiveResultUrl(null)
    setActiveError(null)

    let failCount = 0

    const poll = async () => {
      if (!active) return
      try {
        const res = await fetch(`/api/ai-tools/status/${activeGeneration.id}`)
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const modelLabels: Record<string, string> = {
    'seedance-1.5-pro': 'Seedance 1.5 Pro',
    'vidu-q3': 'Vidu Q3',
    'seedream-5': 'Seedream 5',
    'seedream-4.5': 'Seedream 4.5',
    'z-image': 'Z-Image',
  }


  const isActiveProcessing = activeStatus === 'PENDING' || activeStatus === 'IN_QUEUE' || activeStatus === 'IN_PROGRESS'
  const hasActiveGeneration = !!activeGeneration

  if (isLoading && items.length === 0 && !hasActiveGeneration) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (items.length === 0 && !hasActiveGeneration) {
    return (
      <div className="text-center py-12">
        <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {aiToolsT.noHistory || '생성 히스토리가 없습니다'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Clock className="w-5 h-5" />
        {aiToolsT.history || '생성 히스토리'}
      </h3>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Active Generation Card */}
        {hasActiveGeneration && (
          <div
            className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
              activeStatus === 'COMPLETED'
                ? 'border-border/80 cursor-pointer hover:border-primary/30 hover:shadow-glow-sm'
                : activeStatus === 'FAILED'
                  ? 'border-red-500/30'
                  : 'border-border/80'
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
            <div className="relative aspect-video bg-secondary/30">
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
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-[10px] text-red-400/70">
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
                      className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium rounded-md transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {aiToolsT.retry || '재시도'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Generating...
                  </span>
                </div>
              )}

              {/* Model badge */}
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-md">
                {modelLabels[activeGeneration.model] || activeGeneration.model}
              </span>

              {/* Reference image */}
              {activeGeneration.referenceImageUrl && (
                <img
                  src={activeGeneration.referenceImageUrl}
                  alt=""
                  className="absolute bottom-2 left-2 w-7 h-7 rounded-md border border-white/30 object-cover shadow-sm"
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
        {items.map((item) => {
          const refImgUrl = getReferenceImageUrl(item.input_params)
          const isProcessing = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(item.status)
          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
                isProcessing
                  ? 'border-border/80'
                  : 'border-border/80 cursor-pointer hover:border-primary/30 hover:shadow-glow-sm'
              }`}
            >
              {/* Thumbnail / Preview */}
              <div className="relative aspect-video bg-secondary/30">
                {item.status === 'COMPLETED' && item.result_url ? (
                  type === 'video' ? (
                    <video
                      src={item.result_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.thumbnail_url || item.result_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )
                ) : item.status === 'FAILED' ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-[10px] text-red-400/70">
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
                        className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium rounded-md transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {aiToolsT.retry || '재시도'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs font-medium text-muted-foreground">
                      Generating...
                    </span>
                  </div>
                )}

                {/* Model badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-md">
                  {modelLabels[item.model] || item.model}
                </span>

                {/* Reference image */}
                {refImgUrl && (
                  <img
                    src={refImgUrl}
                    alt=""
                    className="absolute bottom-2 left-2 w-7 h-7 rounded-md border border-white/30 object-cover shadow-sm"
                  />
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-muted-foreground truncate">
                  {item.prompt || '-'}
                </p>
                {isProcessing ? null : (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.credits_used} {aiToolsT.credits || '크레딧'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasMore}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && selectedItem.status === 'COMPLETED' && selectedItem.result_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-2xl w-full mx-4 overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
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
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{selectedItem.prompt}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {modelLabels[selectedItem.model]} | {formatDate(selectedItem.created_at)}
                </p>
              </div>
              <a
                href={selectedItem.result_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                {aiToolsT.download || '다운로드'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
