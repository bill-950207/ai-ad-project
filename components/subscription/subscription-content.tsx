'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CreditCard,
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface SubscriptionData {
  subscription: {
    planType: string
    displayName: string
    avatarLimit: number
    musicLimit: number
    productLimit: number
    monthlyCredits: number
    keyframeCount: number
    watermarkFree: boolean
    hdUpscale: boolean
    subscriptionId: string | null
    status: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
  }
  usage: {
    avatars: { used: number; limit: number }
    music: { used: number; limit: number }
    products: { used: number; limit: number }
    period: string
  }
  features: {
    keyframeCount: number
    watermarkFree: boolean
    hdUpscale: boolean
  }
}

export function SubscriptionContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // 성공 메시지 표시
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }

    fetchSubscription()
  }, [searchParams])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Failed to open portal:', error)
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">구독 정보를 불러올 수 없습니다.</p>
      </div>
    )
  }

  const { subscription, usage, features } = data
  const isPaid = subscription.planType !== 'FREE'

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getUsagePercent = (used: number, limit: number) => {
    if (limit === -1) return 0 // 무제한
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-yellow-500'
    return 'bg-primary'
  }

  return (
    <div>
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-500">구독이 성공적으로 시작되었습니다!</p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-foreground mb-2">구독 관리</h1>
      <p className="text-muted-foreground mb-8">
        현재 플랜과 사용량을 확인하고 관리하세요.
      </p>

      <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Current Plan */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">현재 플랜</h3>
            {subscription.cancelAtPeriodEnd && (
              <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                취소 예정
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {subscription.displayName}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPaid ? '유료 구독' : '무료 플랜'}
              </p>
            </div>
          </div>

          {isPaid && (
            <div className="space-y-3 mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">다음 결제일:</span>
                <span className="text-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? '취소됨'
                    : formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">월 크레딧:</span>
                <span className="text-foreground">
                  {subscription.monthlyCredits} 크레딧
                </span>
              </div>
            </div>
          )}

          {/* Plan Features */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-medium text-foreground mb-3">포함 기능</p>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-foreground">
                키프레임 {features.keyframeCount}개 생성
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {features.hdUpscale ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              )}
              <span
                className={
                  features.hdUpscale ? 'text-foreground' : 'text-muted-foreground'
                }
              >
                HD 업스케일
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {features.watermarkFree ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              )}
              <span
                className={
                  features.watermarkFree ? 'text-foreground' : 'text-muted-foreground'
                }
              >
                워터마크 제거
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isPaid ? (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="flex-1 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                구독 관리
              </button>
            ) : (
              <Link
                href="/dashboard/pricing"
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-center"
              >
                업그레이드
              </Link>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">이번 달 사용량</h3>
            <span className="text-xs text-muted-foreground">
              {usage.period}
            </span>
          </div>

          <div className="space-y-6">
            {/* Avatar Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground">아바타 생성</span>
                <span className="text-muted-foreground">
                  {usage.avatars.used} /{' '}
                  {usage.avatars.limit === -1 ? '무제한' : usage.avatars.limit}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getUsageColor(
                    getUsagePercent(usage.avatars.used, usage.avatars.limit)
                  )}`}
                  style={{
                    width: `${
                      usage.avatars.limit === -1
                        ? 0
                        : getUsagePercent(usage.avatars.used, usage.avatars.limit)
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Music Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground">음악 생성</span>
                <span className="text-muted-foreground">
                  {usage.music.used} /{' '}
                  {usage.music.limit === -1 ? '무제한' : usage.music.limit}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getUsageColor(
                    getUsagePercent(usage.music.used, usage.music.limit)
                  )}`}
                  style={{
                    width: `${
                      usage.music.limit === -1
                        ? 0
                        : getUsagePercent(usage.music.used, usage.music.limit)
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Product Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground">제품 등록</span>
                <span className="text-muted-foreground">
                  {usage.products.used} /{' '}
                  {usage.products.limit === -1 ? '무제한' : usage.products.limit}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getUsageColor(
                    getUsagePercent(usage.products.used, usage.products.limit)
                  )}`}
                  style={{
                    width: `${
                      usage.products.limit === -1
                        ? 0
                        : getUsagePercent(usage.products.used, usage.products.limit)
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Usage Info */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              제한을 초과하면 크레딧이 차감됩니다. 더 많은 생성이 필요하시면{' '}
              <Link href="/dashboard/pricing" className="text-primary hover:underline">
                플랜을 업그레이드
              </Link>
              하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
