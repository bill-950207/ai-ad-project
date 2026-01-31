'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CreditCard,
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Music,
  Package,
  Coins,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { SubscriptionManageModal } from './subscription-manage-modal'

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
    credits: { used: number; limit: number }
    period: string
  }
  features: {
    keyframeCount: number
    watermarkFree: boolean
    hdUpscale: boolean
  }
  profile: {
    credits: number
  }
}

export function SubscriptionContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
      const response = await fetch('/api/subscription')
      if (!response.ok) {
        throw new Error('API request failed')
      }
      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      setData(result)
    } catch (err) {
      console.error('Failed to fetch subscription:', err)
      setError('구독 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
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

  const { subscription, usage, features, profile } = data
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
    if (limit === -1 || limit === 0) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-yellow-500'
    return 'bg-primary'
  }

  const getPlanGradient = (planType: string) => {
    switch (planType) {
      case 'STARTER':
        return 'from-blue-500/20 to-cyan-500/20'
      case 'PRO':
        return 'from-purple-500/20 to-pink-500/20'
      case 'BUSINESS':
        return 'from-amber-500/20 to-orange-500/20'
      default:
        return 'from-gray-500/20 to-gray-600/20'
    }
  }

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'STARTER':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'PRO':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'BUSINESS':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  // 크레딧 사용량 계산 (이번 달 사용한 크레딧)
  const monthlyCreditsLimit = subscription.monthlyCredits
  const creditsUsed = usage.credits?.used || 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-500 font-medium">구독이 성공적으로 시작되었습니다!</p>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">구독 관리</h1>
        <p className="text-muted-foreground">
          현재 플랜과 사용량을 확인하고 관리하세요.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-2">
          <div className={`bg-gradient-to-br ${getPlanGradient(subscription.planType)} border border-border rounded-2xl p-6 relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

            <div className="relative">
              {/* Header with Manage Button */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">현재 플랜</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-foreground">
                      {subscription.displayName}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPlanBadgeColor(subscription.planType)}`}>
                      {isPaid ? 'Paid' : 'Free'}
                    </span>
                  </div>
                </div>
                {isPaid && (
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-foreground transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    관리
                  </button>
                )}
              </div>

              {/* Plan Details */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {isPaid && (
                  <>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">다음 결제일</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {subscription.cancelAtPeriodEnd
                          ? '취소 예정'
                          : formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm">월 크레딧</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {subscription.monthlyCredits} 크레딧
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Cancel Warning */}
              {subscription.cancelAtPeriodEnd && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-500">구독 취소 예정</p>
                      <p className="text-sm text-yellow-500/80">
                        {formatDate(subscription.currentPeriodEnd)}에 Free 플랜으로 전환됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${features.keyframeCount > 1 ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <Sparkles className={`w-4 h-4 ${features.keyframeCount > 1 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">키프레임</p>
                    <p className="text-xs text-muted-foreground">{features.keyframeCount}개 생성</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${features.hdUpscale ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <TrendingUp className={`w-4 h-4 ${features.hdUpscale ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">HD 업스케일</p>
                    <p className="text-xs text-muted-foreground">{features.hdUpscale ? 'Available' : 'Not available'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${features.watermarkFree ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <CheckCircle className={`w-4 h-4 ${features.watermarkFree ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">워터마크</p>
                    <p className="text-xs text-muted-foreground">{features.watermarkFree ? 'Removed' : 'Included'}</p>
                  </div>
                </div>
              </div>

              {/* Upgrade Button for Free Plan */}
              {!isPaid && (
                <Link
                  href="/dashboard/pricing"
                  className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  플랜 업그레이드
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Credits Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">보유 크레딧</h3>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-primary mb-2">
              {profile?.credits || 0}
            </p>
            <p className="text-sm text-muted-foreground">사용 가능한 크레딧</p>
          </div>

          {isPaid && monthlyCreditsLimit > 0 && (
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">이번 달 크레딧 사용</span>
                <span className="font-medium text-foreground">
                  {creditsUsed} / {monthlyCreditsLimit}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getUsageColor(
                    getUsagePercent(creditsUsed, monthlyCreditsLimit)
                  )}`}
                  style={{
                    width: `${getUsagePercent(creditsUsed, monthlyCreditsLimit)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                매월 1일에 {monthlyCreditsLimit} 크레딧이 지급됩니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Section */}
      <div className="mt-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">무료 생성 한도</h3>
              <p className="text-sm text-muted-foreground">플랜에 포함된 무료 생성량</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Avatar Usage */}
            <div className="bg-secondary/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">아바타 생성</p>
                  <p className="text-sm text-muted-foreground">
                    {usage.avatars.used} / {usage.avatars.limit === -1 ? 'Unlimited' : usage.avatars.limit}
                  </p>
                </div>
              </div>
              {usage.avatars.limit !== -1 && (
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getUsageColor(
                      getUsagePercent(usage.avatars.used, usage.avatars.limit)
                    )}`}
                    style={{
                      width: `${getUsagePercent(usage.avatars.used, usage.avatars.limit)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Music Usage */}
            <div className="bg-secondary/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">음악 생성</p>
                  <p className="text-sm text-muted-foreground">
                    {usage.music.used} / {usage.music.limit === -1 ? 'Unlimited' : usage.music.limit}
                  </p>
                </div>
              </div>
              {usage.music.limit !== -1 && (
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getUsageColor(
                      getUsagePercent(usage.music.used, usage.music.limit)
                    )}`}
                    style={{
                      width: `${getUsagePercent(usage.music.used, usage.music.limit)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Product Usage */}
            <div className="bg-secondary/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">제품 등록</p>
                  <p className="text-sm text-muted-foreground">
                    {usage.products.used} / {usage.products.limit === -1 ? 'Unlimited' : usage.products.limit}
                  </p>
                </div>
              </div>
              {usage.products.limit !== -1 && (
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getUsageColor(
                      getUsagePercent(usage.products.used, usage.products.limit)
                    )}`}
                    style={{
                      width: `${getUsagePercent(usage.products.used, usage.products.limit)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Usage Info */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              제한을 초과하면 크레딧이 차감됩니다. 더 많은 생성이 필요하시면{' '}
              <Link href="/dashboard/pricing" className="text-primary hover:underline font-medium">
                플랜을 업그레이드
              </Link>
              하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Manage Modal */}
      <SubscriptionManageModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        subscription={subscription}
      />
    </div>
  )
}
