'use client'

import { useState } from 'react'
import {
  X,
  Calendar,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface SubscriptionManageModalProps {
  isOpen: boolean
  onClose: () => void
  subscription: {
    displayName: string
    planType: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    stripeSubscriptionId: string | null
    monthlyCredits: number
  }
}

export function SubscriptionManageModal({
  isOpen,
  onClose,
  subscription,
}: SubscriptionManageModalProps) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [reactivateLoading, setReactivateLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleOpenPortal = async () => {
    setPortalLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.url) {
        window.location.href = result.url
      } else {
        setError(result.error || '결제 정보 페이지를 열 수 없습니다.')
      }
    } catch (err) {
      console.error('Failed to open portal:', err)
      setError('결제 정보 페이지를 열 수 없습니다.')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || '구독 취소에 실패했습니다.')
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err)
      setError('구독 취소에 실패했습니다.')
    } finally {
      setCancelLoading(false)
      setShowCancelConfirm(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setReactivateLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stripe/reactivate', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || '구독 재활성화에 실패했습니다.')
      }
    } catch (err) {
      console.error('Failed to reactivate subscription:', err)
      setError('구독 재활성화에 실패했습니다.')
    } finally {
      setReactivateLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">구독 관리</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Toast */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}

          {/* Plan Info */}
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">현재 플랜</p>
            <p className="text-2xl font-bold text-foreground">
              {subscription.displayName}
            </p>
            <p className="text-sm text-primary mt-1">
              월 {subscription.monthlyCredits} 크레딧 포함
            </p>
          </div>

          {/* Subscription Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">구독 시작일</span>
              </div>
              <span className="font-medium text-foreground">
                {formatDate(subscription.currentPeriodStart)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">다음 결제일</span>
              </div>
              <span className="font-medium text-foreground">
                {subscription.cancelAtPeriodEnd
                  ? '취소 예정'
                  : formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-500 mb-3">
                  {formatDate(subscription.currentPeriodEnd)}에 구독이 종료됩니다.
                  그때까지 현재 플랜의 혜택을 이용할 수 있습니다.
                </p>
                <button
                  onClick={handleReactivateSubscription}
                  disabled={reactivateLoading}
                  className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {reactivateLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  구독 유지하기
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Upgrade Button */}
            <Link
              href="/dashboard/pricing"
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              onClick={onClose}
            >
              <ArrowUpRight className="w-4 h-4" />
              플랜 업그레이드
            </Link>

            {/* Stripe Portal Button */}
            <button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="w-full py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              결제 정보 관리
            </button>

            {/* Cancel Button */}
            {!subscription.cancelAtPeriodEnd && (
              <>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-3 text-red-500 hover:bg-red-500/10 rounded-xl font-medium transition-colors"
                  >
                    구독 취소
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-500 mb-1">
                          구독을 취소하시겠습니까?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(subscription.currentPeriodEnd)}까지 현재 플랜을
                          이용할 수 있으며, 이후 Free 플랜으로 전환됩니다.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="flex-1 py-2 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
                      >
                        {cancelLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          '구독 취소'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
