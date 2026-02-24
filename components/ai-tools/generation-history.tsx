'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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

interface GenerationHistoryProps {
  type: 'video' | 'image'
  refreshTrigger?: number
}

export default function GenerationHistory({ type, refreshTrigger }: GenerationHistoryProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [items, setItems] = useState<HistoryItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

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
    'seedream-4.5': 'Seedream 4.5',
    'z-image': 'Z-Image',
  }

  const statusColors: Record<string, string> = {
    COMPLETED: 'text-green-400',
    FAILED: 'text-red-400',
    IN_PROGRESS: 'text-yellow-400',
    IN_QUEUE: 'text-blue-400',
    PENDING: 'text-muted-foreground',
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
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
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="bg-card border border-border/80 rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-glow-sm transition-all duration-200"
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className={`text-xs font-medium ${statusColors[item.status] || ''}`}>
                    {item.status}
                  </span>
                </div>
              )}

              {/* Model badge */}
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-md">
                {modelLabels[item.model] || item.model}
              </span>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-xs text-muted-foreground truncate">
                {item.prompt || '-'}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(item.created_at)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {item.credits_used} {aiToolsT.credits || '크레딧'}
                </span>
              </div>
            </div>
          </div>
        ))}
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
