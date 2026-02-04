'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowUpRight, Coins, Loader2, Save } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { Modal, ModalHeader, ModalBody } from './modal'
import { Button } from './button'

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

  const shortfall = requiredCredits - availableCredits

  const handleUpgrade = async () => {
    if (onSaveDraft) {
      setIsSaving(true)
      try {
        const draftId = await onSaveDraft()
        if (draftId) {
          const returnUrl = encodeURIComponent(`/image-ad-create?draftId=${draftId}`)
          router.push(`/dashboard/pricing?returnUrl=${returnUrl}`)
        } else {
          router.push('/dashboard/pricing')
        }
      } catch (error) {
        console.error('Draft save error:', error)
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      ariaLabel={t.modal.insufficientCredits.title}
    >
      <ModalHeader
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
        onClose={onClose}
      >
        {t.modal.insufficientCredits.title}
      </ModalHeader>

      <ModalBody>
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
              <span className="text-lg font-bold text-destructive">{availableCredits}</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.modal.insufficientCredits.shortfall}</span>
                <span className="text-lg font-bold text-warning">-{shortfall}</span>
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
          <Button
            onClick={handleUpgrade}
            disabled={isSaving}
            variant="gradient"
            className="w-full py-3"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t.common.saving}
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                {t.modal.insufficientCredits.upgrade}
              </>
            )}
          </Button>

          <Button
            onClick={onClose}
            disabled={isSaving}
            variant="ghost"
            className="w-full py-3"
          >
            {t.common.close}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  )
}
