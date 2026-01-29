'use client'

import { X, AlertTriangle, ArrowUpRight, Trash2 } from 'lucide-react'
import Link from 'next/link'

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

const SLOT_TYPE_CONFIG: Record<SlotType, {
  title: string
  icon: string
  managePath: string
  manageLabel: string
}> = {
  avatar: {
    title: '아바타',
    icon: '👤',
    managePath: '/dashboard/avatar',
    manageLabel: '아바타 관리',
  },
  music: {
    title: '음악',
    icon: '🎵',
    managePath: '/dashboard/music',
    manageLabel: '음악 관리',
  },
  product: {
    title: '제품',
    icon: '📦',
    managePath: '/dashboard/ad-products',
    manageLabel: '제품 관리',
  },
}

export function SlotLimitModal({
  isOpen,
  onClose,
  slotType,
  slotInfo,
  onManageItems,
}: SlotLimitModalProps) {
  if (!isOpen) return null

  const config = SLOT_TYPE_CONFIG[slotType]

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
            <h2 className="text-xl font-bold text-foreground">슬롯이 가득 찼습니다</h2>
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
          {/* Usage Display */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{config.icon}</span>
              <span className="text-sm text-muted-foreground">{config.title} 슬롯</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-bold text-foreground">{slotInfo.used}</span>
              <span className="text-muted-foreground">/ {slotInfo.limit}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full transition-all"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Message */}
          <p className="text-muted-foreground text-center mb-6">
            {slotInfo.message || `현재 ${config.title} 슬롯이 가득 찼습니다. 새로 생성하려면 기존 항목을 삭제하거나 플랜을 업그레이드하세요.`}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {/* Upgrade Button */}
            <Link
              href="/dashboard/pricing"
              className="w-full py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              onClick={onClose}
            >
              <ArrowUpRight className="w-4 h-4" />
              플랜 업그레이드
            </Link>

            {/* Manage Items Button */}
            <Link
              href={config.managePath}
              onClick={(e) => {
                if (onManageItems) {
                  e.preventDefault()
                  onManageItems()
                }
                onClose()
              }}
              className="w-full py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              기존 {config.title} 삭제하기
            </Link>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
