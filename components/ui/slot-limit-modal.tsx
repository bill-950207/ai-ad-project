'use client'

import { AlertTriangle, ArrowUpRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { Modal, ModalHeader, ModalBody } from './modal'
import { Button } from './button'

export type SlotType = 'avatar' | 'music' | 'product'

interface SlotInfo {
  used: number
  limit: number
  message?: string
}

interface SlotLimitModalProps {
  isOpen: boolean
  onClose: () => void
  slotType: SlotType
  slotInfo: SlotInfo
  /** 기존 항목 삭제 페이지로 이동 */
  onManageItems?: () => void
}

const SLOT_TYPE_PATHS: Record<SlotType, string> = {
  avatar: '/dashboard/avatar',
  music: '/dashboard/music',
  product: '/dashboard/ad-products',
}

const SLOT_TYPE_ICONS: Record<SlotType, string> = {
  avatar: '👤',
  music: '🎵',
  product: '📦',
}

export function SlotLimitModal({
  isOpen,
  onClose,
  slotType,
  slotInfo,
  onManageItems,
}: SlotLimitModalProps) {
  const { t } = useLanguage()

  const slotTitle = t.slotTypes[slotType]
  const managePath = SLOT_TYPE_PATHS[slotType]
  const icon = SLOT_TYPE_ICONS[slotType]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      ariaLabel={t.modal.slotLimit.title}
    >
      <ModalHeader
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
        onClose={onClose}
      >
        {t.modal.slotLimit.title}
      </ModalHeader>

      <ModalBody>
        {/* Usage Display */}
        <div className="bg-secondary/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg">{icon}</span>
            <span className="text-sm text-muted-foreground">{slotTitle} {t.modal.slotLimit.slot}</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-bold text-foreground">{slotInfo.used}</span>
            <span className="text-muted-foreground">/ {slotInfo.limit}</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-warning rounded-full transition-all"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Message */}
        <p className="text-muted-foreground text-center mb-6">
          {slotInfo.message || t.modal.slotLimit.defaultMessage}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/dashboard/pricing" onClick={onClose} className="block">
            <Button variant="gradient" className="w-full py-3">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              {t.modal.slotLimit.upgrade}
            </Button>
          </Link>

          <Link
            href={managePath}
            onClick={(e) => {
              if (onManageItems) {
                e.preventDefault()
                onManageItems()
              }
              onClose()
            }}
            className="block"
          >
            <Button variant="secondary" className="w-full py-3">
              <Trash2 className="w-4 h-4 mr-2" />
              {t.modal.slotLimit.deleteExisting}
            </Button>
          </Link>

          <Button
            onClick={onClose}
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
