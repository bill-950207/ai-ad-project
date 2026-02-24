'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle, XCircle, Download, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface GenerationResultProps {
  generationId: string | null
  type: 'video' | 'image'
  onComplete?: () => void
  onError?: () => void
}

type Status = 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export default function GenerationResult({ generationId, type, onComplete, onError }: GenerationResultProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [status, setStatus] = useState<Status>('PENDING')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pollStatus = useCallback(async () => {
    if (!generationId) return

    try {
      const res = await fetch(`/api/ai-tools/status/${generationId}`)
      if (!res.ok) throw new Error('상태 조회 실패')

      const data = await res.json()
      setStatus(data.status)

      if (data.status === 'COMPLETED' && data.resultUrl) {
        setResultUrl(data.resultUrl)
        onComplete?.()
      } else if (data.status === 'FAILED') {
        setError(data.error || '생성에 실패했습니다')
        onError?.()
      }
    } catch {
      // Silently retry on network errors
    }
  }, [generationId, onComplete, onError])

  useEffect(() => {
    if (!generationId) return

    setStatus('PENDING')
    setResultUrl(null)
    setError(null)

    // Initial poll
    pollStatus()

    // Set up polling interval
    const interval = setInterval(() => {
      pollStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [generationId, pollStatus])

  // Stop polling when complete or failed
  useEffect(() => {
    if (status === 'COMPLETED' || status === 'FAILED') {
      // Polling will stop as the effect cleanup runs
    }
  }, [status])

  if (!generationId) return null

  const statusMessages: Record<Status, string> = {
    PENDING: aiToolsT.statusPending || '요청 처리 중...',
    IN_QUEUE: aiToolsT.statusInQueue || '대기열에서 대기 중...',
    IN_PROGRESS: aiToolsT.statusInProgress || '생성 중...',
    COMPLETED: aiToolsT.statusCompleted || '완료!',
    FAILED: aiToolsT.statusFailed || '실패',
  }

  const isProcessing = status === 'PENDING' || status === 'IN_QUEUE' || status === 'IN_PROGRESS'

  return (
    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden">
      {/* Status Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        {isProcessing && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        {status === 'COMPLETED' && <CheckCircle className="w-5 h-5 text-green-500" />}
        {status === 'FAILED' && <XCircle className="w-5 h-5 text-red-500" />}
        <span className="text-sm font-medium text-foreground">
          {statusMessages[status]}
        </span>
      </div>

      {/* Result */}
      {status === 'COMPLETED' && resultUrl && (
        <div className="p-4">
          {type === 'video' ? (
            <video
              src={resultUrl}
              controls
              autoPlay
              loop
              className="w-full rounded-xl bg-black/20"
            />
          ) : (
            <img
              src={resultUrl}
              alt="Generated"
              className="w-full rounded-xl bg-black/20"
            />
          )}

          <div className="flex gap-2 mt-3">
            <a
              href={resultUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              {aiToolsT.download || '다운로드'}
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'FAILED' && (
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <RotateCcw className="w-4 h-4" />
            <span>{error || '생성에 실패했습니다. 다시 시도해주세요.'}</span>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {isProcessing && (
        <div className="px-5 py-4">
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  )
}
