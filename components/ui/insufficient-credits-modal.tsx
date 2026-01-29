'use client'

import { X, AlertTriangle, ArrowUpRight, Coins } from 'lucide-react'
import Link from 'next/link'

interface InsufficientCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  requiredCredits: number
  availableCredits: number
  featureName?: string // 예: "제품 설명 영상", "아바타 모션 영상"
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  requiredCredits,
  availableCredits,
  featureName = '이 기능',
}: InsufficientCreditsModalProps) {
  if (!isOpen) return null

  const shortfall = requiredCredits - availableCredits

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
            <h2 className="text-xl font-bold text-foreground">크레딧이 부족합니다</h2>
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
              <span className="font-medium text-foreground">크레딧 현황</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">필요 크레딧</span>
                <span className="text-lg font-bold text-foreground">{requiredCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">보유 크레딧</span>
                <span className="text-lg font-bold text-red-500">{availableCredits}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">부족한 크레딧</span>
                  <span className="text-lg font-bold text-yellow-500">-{shortfall}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <p className="text-muted-foreground text-center mb-6">
            {featureName}을(를) 사용하려면 <span className="text-foreground font-medium">{shortfall}크레딧</span>이 더 필요합니다.
            플랜을 업그레이드하면 더 많은 크레딧을 받을 수 있습니다.
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
