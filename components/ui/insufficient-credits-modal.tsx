'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle, ArrowUpRight, Coins, Loader2, Save } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface InsufficientCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  requiredCredits: number
  availableCredits: number
  featureName?: string
  onSaveDraft?: () => Promise<string | null>
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  requiredCredits,
  availableCredits,
  featureName,
  onSaveDraft,
}: InsufficientCreditsModalProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const shortfall = requiredCredits - availableCredits

  const handleUpgrade = async () => {
    if (onSaveDraft) {
      setIsSaving(true)
      try {
        const draftId = await onSaveDraft()
        if (draftId) {
          // 저장 성공 - draftId를 URL에 포함하여 pricing 페이지로 이동
          // 돌아올 때 복원할 수 있도록 returnUrl에 draftId 포함
          const returnUrl = encodeURIComponent(`/image-ad-create?draftId=${draftId}`)
          router.push(`/dashboard/pricing?returnUrl=${returnUrl}`)
        } else {
          // 저장 실패해도 이동
          router.push('/dashboard/pricing')
        }
      } catch (error) {
        console.error('Draft 저장 오류:', error)
        router.push('/dashboard/pricing')
      } finally {
        setIsSaving(false)
      }
    } else {
      router.push('/dashboard/pricing')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t.modal.insufficientCredits.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Credits Display */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">{t.modal.insufficientCredits.creditStatus}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.modal.insufficientCredits.required}</span>
                <span className="text-lg font-bold text-foreground">{requiredCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.modal.insufficientCredits.available}</span>
                <span className="text-lg font-bold text-red-500">{availableCredits}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.modal.insufficientCredits.shortfall}</span>
                  <span className="text-lg font-bold text-yellow-500">-{shortfall}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <p className="text-muted-foreground text-center mb-6">
            {featureName || t.common.thisFeature} {t.modal.insufficientCredits.message}
          </p>

          {/* Save Notice */}
          {onSaveDraft && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-primary/5 rounded-lg">
              <Save className="w-4 h-4 text-primary" />
              <span>{t.modal.insufficientCredits.autoSave}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Upgrade Button */}
            <button
              onClick={handleUpgrade}
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.common.saving}
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  {t.modal.insufficientCredits.upgrade}
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors font-medium disabled:opacity-50"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
