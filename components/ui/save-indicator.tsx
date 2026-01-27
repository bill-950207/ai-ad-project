'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react'

interface SaveIndicatorProps {
  isSaving: boolean
  pendingSave: boolean
  lastSaveError: Error | null
  lastSavedAt: Date | null
  onRetry?: () => void
  onDismiss?: () => void
}

export function SaveIndicator({
  isSaving,
  pendingSave,
  lastSaveError,
  lastSavedAt,
  onRetry,
  onDismiss,
}: SaveIndicatorProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [prevSavedAt, setPrevSavedAt] = useState<Date | null>(null)

  // 저장 성공 시 잠깐 표시 후 숨김
  useEffect(() => {
    if (lastSavedAt && lastSavedAt !== prevSavedAt && !isSaving && !pendingSave && !lastSaveError) {
      setPrevSavedAt(lastSavedAt)
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastSavedAt, prevSavedAt, isSaving, pendingSave, lastSaveError])

  // 아무 상태도 없으면 렌더링 안 함
  if (!isSaving && !pendingSave && !lastSaveError && !showSuccess) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* 저장 중 / 대기 중 */}
      {(isSaving || pendingSave) && !lastSaveError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/90 backdrop-blur rounded-lg shadow-lg border border-border">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-foreground">
            {isSaving ? '저장 중...' : '저장 대기 중'}
          </span>
        </div>
      )}

      {/* 저장 성공 */}
      {showSuccess && !isSaving && !pendingSave && !lastSaveError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg shadow-lg">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">저장됨</span>
        </div>
      )}

      {/* 저장 실패 */}
      {lastSaveError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">저장 실패</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 p-1 hover:bg-red-500/10 rounded transition-colors"
              title="재시도"
            >
              <RefreshCw className="w-3.5 h-3.5 text-red-500" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-1 text-xs text-red-500 hover:underline"
            >
              닫기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
