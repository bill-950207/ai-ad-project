/**
 * 이미지 편집 모달 컴포넌트
 *
 * 사용자가 프롬프트를 입력하여 기존 이미지를 수정할 수 있는 모달입니다.
 * 편집 완료 시 기존 레코드를 업데이트합니다 (새 레코드 생성하지 않음).
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Wand2,
  Loader2,
  Coins,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { IMAGE_EDIT_CREDIT_COST } from '@/lib/credits'
import { useCredits } from '@/contexts/credit-context'
import { InsufficientCreditsModal } from '@/components/ui/insufficient-credits-modal'
import { useLanguage } from '@/contexts/language-context'

interface ImageEditModalProps {
  isOpen: boolean
  onClose: () => void
  imageAdId: string
  imageUrl: string
  imageIndex?: number
  quality?: 'medium' | 'high'
  onEditComplete?: (newImageIndex: number, newImageUrl: string) => void
}

export function ImageEditModal({
  isOpen,
  onClose,
  imageAdId,
  imageUrl,
  imageIndex = 0,
  quality = 'medium',
  onEditComplete,
}: ImageEditModalProps) {
  const { t } = useLanguage()
  const { refreshCredits } = useCredits()
  const [editPrompt, setEditPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)
  const [creditsInfo, setCreditsInfo] = useState<{ required: number; available: number } | null>(null)
  const [editSummary, setEditSummary] = useState<string | null>(null)
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(imageIndex)

  const creditCost = IMAGE_EDIT_CREDIT_COST[quality]

  // imageIndex prop 변경 시 업데이트
  useEffect(() => {
    setCurrentImageIndex(imageIndex)
  }, [imageIndex])

  // 기존 레코드 업데이트 (편집된 이미지를 새로 추가)
  const updateImageAd = useCallback(async (newImageUrl: string, newOriginalUrl: string): Promise<number | null> => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/image-ads/${imageAdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageIndex: currentImageIndex,
          imageUrl: newImageUrl,
          imageUrlOriginal: newOriginalUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Update failed')
      }

      const data = await res.json()
      console.log('Image ad edit complete (original preserved):', {
        imageAdId,
        originalIndex: currentImageIndex,
        newImageIndex: data.newImageIndex,
      })
      return data.newImageIndex as number
    } catch (err) {
      console.error('Update error:', err)
      setError(err instanceof Error ? err.message : t.imageEdit?.updateError || 'Error during update')
      return null
    } finally {
      setIsUpdating(false)
    }
  }, [imageAdId, currentImageIndex])

  // 상태 폴링 (60초 기준 프로그래스)
  const pollStatus = useCallback(async (reqId: string) => {
    const maxDuration = 60000 // 60초
    const maxAttempts = 90
    const startTime = Date.now()
    let attempts = 0

    const poll = async (): Promise<{ imageUrl: string } | null> => {
      try {
        const res = await fetch(`/api/image-ads/status/${reqId}`)
        if (!res.ok) {
          throw new Error('Status check failed')
        }

        const status = await res.json()

        if (status.status === 'COMPLETED') {
          return {
            imageUrl: status.imageUrl,
          }
        } else if (status.status === 'FAILED') {
          throw new Error(status.error || 'Image generation failed')
        }

        attempts++
        if (attempts >= maxAttempts) {
          throw new Error('Image generation timed out')
        }

        // 60초 기준으로 진행률 업데이트
        const elapsed = Date.now() - startTime
        setProgress(Math.min((elapsed / maxDuration) * 100, 99))

        await new Promise(resolve => setTimeout(resolve, 1000))
        return poll()
      } catch (err) {
        throw err
      }
    }

    return poll()
  }, [])

  // 편집 요청 제출
  const handleSubmit = async () => {
    if (!editPrompt.trim()) {
      setError(t.imageEdit?.enterEditContent || 'Please enter edit content')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setEditSummary(null)
    setResultImageUrl(null)

    try {
      const res = await fetch(`/api/image-ads/${imageAdId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editPrompt: editPrompt.trim(),
          imageIndex: currentImageIndex,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 402) {
          setCreditsInfo({
            required: data.required || creditCost,
            available: data.available || 0,
          })
          setShowInsufficientCreditsModal(true)
          setIsSubmitting(false)
          return
        }
        throw new Error(data.error || 'Edit request failed')
      }

      const result = await res.json()

      setEditSummary(result.editSummary)
      setIsSubmitting(false)

      // 폴링 시작
      setIsPolling(true)
      setProgress(0)

      const pollResult = await pollStatus(result.requestId)

      if (pollResult) {
        setResultImageUrl(pollResult.imageUrl)
        setProgress(100)

        // 편집된 이미지를 새로 추가 (원본 이미지 URL 유지)
        const newImageIndex = await updateImageAd(pollResult.imageUrl, imageUrl)

        if (newImageIndex !== null && onEditComplete) {
          onEditComplete(newImageIndex, pollResult.imageUrl)
        }

        // 크레딧 갱신
        refreshCredits()
      }

      setIsPolling(false)
    } catch (err) {
      console.error('Edit error:', err)
      setError(err instanceof Error ? err.message : t.imageEdit?.editError || 'Error during edit')
      setIsSubmitting(false)
      setIsPolling(false)
    }
  }

  // 완료 후 처리
  const handleComplete = () => {
    onClose()
  }

  // 모달 닫기
  const handleClose = () => {
    if (isSubmitting || isPolling || isUpdating) {
      if (!confirm(t.imageEdit?.confirmClose || 'Edit is in progress. Are you sure you want to close?')) {
        return
      }
    }
    setEditPrompt('')
    setError(null)
    setEditSummary(null)
    setResultImageUrl(null)
    setProgress(0)
    onClose()
  }

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !isPolling && !isUpdating) {
        handleClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, isSubmitting, isPolling, isUpdating])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 m-0 flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t.imageEdit?.title || 'Edit Image'}</h2>
              <p className="text-sm text-muted-foreground">{t.imageEdit?.subtitle || 'Edit image with AI'}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isPolling || isUpdating}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-6">
          {/* 현재 이미지 & 결과 이미지 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t.imageEdit?.originalImage || 'Original Image'}</p>
              <div className="aspect-square bg-secondary/30 rounded-xl overflow-hidden">
                <img
                  src={imageUrl}
                  alt={t.imageEdit?.originalImage || 'Original Image'}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {resultImageUrl ? t.imageEdit?.editedImage || 'Edited Image' : t.imageEdit?.editResult || 'Edit Result'}
              </p>
              <div className="aspect-square bg-secondary/30 rounded-xl overflow-hidden relative">
                {resultImageUrl ? (
                  <img
                    src={resultImageUrl}
                    alt={t.imageEdit?.editedImage || 'Edited Image'}
                    className="w-full h-full object-contain"
                  />
                ) : isPolling || isUpdating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <div className="text-center">
                      <p className="text-sm text-foreground">
                        {isUpdating ? t.imageEdit?.saving || 'Saving...' : t.imageEdit?.generating || 'Generating image...'}
                      </p>
                      {!isUpdating && (
                        <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</p>
                      )}
                    </div>
                    {/* 프로그레스 바 */}
                    {!isUpdating && (
                      <div className="w-3/4 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 수정 요약 */}
          {editSummary && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{t.imageEdit?.editSummary || 'Edit Summary'}</span>
              </div>
              <p className="text-sm text-foreground">{editSummary}</p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            </div>
          )}

          {/* 편집 프롬프트 입력 (결과가 없을 때만) */}
          {!resultImageUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t.imageEdit?.promptLabel || 'Enter what you want to edit'}
              </label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder={t.imageEdit?.promptPlaceholder || 'e.g., Change background to beach / Make expression brighter / Make lighting warmer'}
                disabled={isSubmitting || isPolling || isUpdating}
                className="w-full h-24 px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
              />
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/20">
          {/* 크레딧 정보 */}
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{t.imageEdit?.estimatedCost || 'Estimated cost:'}</span>
            <span className="font-medium text-primary">{creditCost} {t.common?.credits || 'credits'}</span>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            {resultImageUrl ? (
              <>
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t.common?.complete || 'Complete'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting || isPolling || isUpdating}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  {t.common?.cancel || 'Cancel'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isPolling || isUpdating || !editPrompt.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.imageEdit?.processing || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      {t.imageEdit?.startEdit || 'Start Edit'}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 크레딧 부족 모달 */}
      {creditsInfo && (
        <InsufficientCreditsModal
          isOpen={showInsufficientCreditsModal}
          onClose={() => setShowInsufficientCreditsModal(false)}
          requiredCredits={creditsInfo.required}
          availableCredits={creditsInfo.available}
          featureName={t.imageEdit?.title || 'Edit Image'}
        />
      )}
    </div>
  )
}
