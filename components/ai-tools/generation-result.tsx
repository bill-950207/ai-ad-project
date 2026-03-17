'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle, XCircle, Download, RotateCcw, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface GenerationResultProps {
  generationId: string | null
  type: 'video' | 'image' | 'trending'
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
      if (!res.ok) throw new Error('Status check failed')

      const data = await res.json()
      setStatus(data.status)

      if (data.status === 'COMPLETED' && data.resultUrl) {
        setResultUrl(data.resultUrl)
        onComplete?.()
      } else if (data.status === 'FAILED') {
        setError(data.error || (aiToolsT.generationFailedRetry || '생성에 실패했습니다. 다시 시도해주세요.'))
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

    pollStatus()

    const interval = setInterval(() => {
      pollStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [generationId, pollStatus])

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
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Status Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
        {isProcessing && (
          <div className="relative">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
        {status === 'COMPLETED' && (
          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        )}
        {status === 'FAILED' && (
          <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
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
              className="w-full rounded-xl bg-black/10"
            />
          ) : (
            <img
              src={resultUrl}
              alt={aiToolsT.generatedAlt || 'Generated'}
              className="w-full rounded-xl bg-black/10"
            />
          )}

          <div className="flex gap-2 mt-3">
            <a
              href={resultUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary/60 hover:bg-secondary text-foreground text-sm font-medium rounded-xl transition-colors"
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
          <div className="flex items-center gap-2.5 text-sm text-red-400">
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{error || (aiToolsT.generationFailedRetry || '생성에 실패했습니다. 다시 시도해주세요.')}</span>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {isProcessing && (
        <div className="px-5 py-4">
          <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/80"
              style={{
                width: status === 'IN_PROGRESS' ? '70%' : status === 'IN_QUEUE' ? '30%' : '10%',
                transition: 'width 1s ease-in-out',
              }}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Sparkles className="w-3 h-3 text-primary/50" />
            <span className="text-[10px] text-muted-foreground/60">
              {type === 'image' ? 'AI is creating your image...' : 'AI is generating your video...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
