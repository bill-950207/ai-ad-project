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
  const isSavingRef = useRef(false)

  // 최신 saveFn을 참조하기 위한 ref (클로저 문제 해결)
  const saveFnRef = useRef(saveFn)
  const optionsRef = useRef({ onSaveStart, onSaveSuccess, onSaveError, onSaveComplete, maxRetries, retryDelayMs })

  useEffect(() => {
    saveFnRef.current = saveFn
  }, [saveFn])

  useEffect(() => {
    optionsRef.current = { onSaveStart, onSaveSuccess, onSaveError, onSaveComplete, maxRetries, retryDelayMs }
  }, [onSaveStart, onSaveSuccess, onSaveError, onSaveComplete, maxRetries, retryDelayMs])

  // mount/unmount 처리 (React Strict Mode 대응)
  useEffect(() => {
    isUnmountedRef.current = false
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
    if (isSavingRef.current) return
    isSavingRef.current = true

    setIsSaving(true)
    setLastSaveError(null)
    optionsRef.current.onSaveStart?.()

    try {
      const result = await saveFnRef.current(payload)

      if (!isUnmountedRef.current) {
        setLastSavedAt(new Date())
        setLastSaveError(null)
        optionsRef.current.onSaveSuccess?.(result)
      }
    } catch (error) {
      if (isUnmountedRef.current) return

      const err = error as Error
      const { maxRetries: max, retryDelayMs: delay } = optionsRef.current

      if (retryCount < max) {
        const waitTime = delay * Math.pow(1.5, retryCount)
        isSavingRef.current = false
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return executeSave(payload, retryCount + 1)
      }

      setLastSaveError(err)
      optionsRef.current.onSaveError?.(err, retryCount)
    } finally {
      if (!isUnmountedRef.current) {
        setIsSaving(false)
        setPendingSave(false)
        isSavingRef.current = false
        optionsRef.current.onSaveComplete?.()
      }
    }
  }, [])

  const executeSaveRef = useRef(executeSave)
  useEffect(() => {
    executeSaveRef.current = executeSave
  }, [executeSave])

  const queueSave = useCallback((payload: Record<string, unknown>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    latestPayloadRef.current = payload
    setPendingSave(true)

    debounceTimerRef.current = setTimeout(() => {
      const currentPayload = latestPayloadRef.current
      if (currentPayload && !isSavingRef.current) {
        latestPayloadRef.current = null
        executeSaveRef.current(currentPayload)
      }
    }, debounceMs)
  }, [debounceMs])

  const cancelPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    latestPayloadRef.current = null
    setPendingSave(false)
  }, [])

  const flushPending = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    const currentPayload = latestPayloadRef.current
    if (currentPayload && !isSavingRef.current) {
      latestPayloadRef.current = null
      await executeSaveRef.current(currentPayload)
    }
  }, [])

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
