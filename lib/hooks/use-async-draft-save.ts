'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface AsyncDraftSaveOptions {
  debounceMs?: number
  maxRetries?: number
  retryDelayMs?: number
  onSaveStart?: () => void
  onSaveSuccess?: (draftId: string | null) => void
  onSaveError?: (error: Error, retryCount: number) => void
  onSaveComplete?: () => void
}

export interface AsyncDraftSaveReturn {
  queueSave: (payload: Record<string, unknown>) => void
  isSaving: boolean
  pendingSave: boolean
  lastSaveError: Error | null
  lastSavedAt: Date | null
  cancelPending: () => void
  flushPending: () => Promise<void>
  clearError: () => void
}

export function useAsyncDraftSave(
  saveFn: (data: Record<string, unknown>) => Promise<string | null>,
  options: AsyncDraftSaveOptions = {}
): AsyncDraftSaveReturn {
  const {
    debounceMs = 300,
    maxRetries = 3,
    retryDelayMs = 1000,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
    onSaveComplete,
  } = options

  const [isSaving, setIsSaving] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const [lastSaveError, setLastSaveError] = useState<Error | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // 최신 payload만 저장하기 위한 ref
  const latestPayloadRef = useRef<Record<string, unknown> | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)
  const isSavingRef = useRef(false) // 저장 중복 방지용

  // cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const executeSave = useCallback(async (
    payload: Record<string, unknown>,
    retryCount = 0
  ): Promise<void> => {
    if (isUnmountedRef.current) return

    // 중복 실행 방지
    if (isSavingRef.current) return
    isSavingRef.current = true

    setIsSaving(true)
    setLastSaveError(null)
    onSaveStart?.()

    try {
      const result = await saveFn(payload)

      if (!isUnmountedRef.current) {
        setLastSavedAt(new Date())
        setLastSaveError(null)
        onSaveSuccess?.(result)
      }
    } catch (error) {
      if (isUnmountedRef.current) return

      const err = error as Error

      if (retryCount < maxRetries) {
        // 지수 백오프로 재시도
        const delay = retryDelayMs * Math.pow(1.5, retryCount)
        isSavingRef.current = false
        await new Promise(resolve => setTimeout(resolve, delay))
        return executeSave(payload, retryCount + 1)
      }

      setLastSaveError(err)
      onSaveError?.(err, retryCount)
    } finally {
      if (!isUnmountedRef.current) {
        setIsSaving(false)
        setPendingSave(false)
        isSavingRef.current = false
        onSaveComplete?.()
      }
    }
  }, [saveFn, maxRetries, retryDelayMs, onSaveStart, onSaveSuccess, onSaveError, onSaveComplete])

  const queueSave = useCallback((payload: Record<string, unknown>) => {
    // 이전 대기 중인 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 최신 payload 저장
    latestPayloadRef.current = payload
    setPendingSave(true)

    // 디바운스 후 실행
    debounceTimerRef.current = setTimeout(() => {
      const currentPayload = latestPayloadRef.current
      if (currentPayload && !isSavingRef.current) {
        latestPayloadRef.current = null
        executeSave(currentPayload)
      }
    }, debounceMs)
  }, [debounceMs, executeSave])

  const cancelPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    latestPayloadRef.current = null
    setPendingSave(false)
  }, [])

  // 대기 중인 저장 즉시 실행 (페이지 이탈 등)
  const flushPending = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    const currentPayload = latestPayloadRef.current
    if (currentPayload && !isSavingRef.current) {
      latestPayloadRef.current = null
      await executeSave(currentPayload)
    }
  }, [executeSave])

  const clearError = useCallback(() => {
    setLastSaveError(null)
  }, [])

  return {
    queueSave,
    isSaving,
    pendingSave,
    lastSaveError,
    lastSavedAt,
    cancelPending,
    flushPending,
    clearError,
  }
}
