'use client'

import { useState, useEffect, useRef } from 'react'
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
import { useLanguage } from '@/contexts/language-context'

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
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Translation type
  type SubscriptionPageT = {
    title?: string
    subtitle?: string
    loadError?: string
    subscriptionSuccess?: string
    currentPlan?: string
    paid?: string
    free?: string
    manage?: string
    nextPayment?: string
    cancelScheduled?: string
    monthlyCredits?: string
    credits?: string
    cancelWarning?: string
    cancelWarningDesc?: string
    keyframe?: string
    keyframeGenerate?: string
    hdUpscale?: string
    available?: string
    notSupported?: string
    watermark?: string
    removed?: string
    included?: string
    upgradePlan?: string
    yourCredits?: string
    availableCredits?: string
    monthlyUsage?: string
    monthlyCreditsInfo?: string
    freeGenerationLimits?: string
    freeGenerationDesc?: string
    avatarGeneration?: string
    musicGeneration?: string
    productRegistration?: string
    unlimited?: string
    usageInfo?: string
    upgradePlanLink?: string
  }
  const subT = t.subscriptionPage as SubscriptionPageT | undefined

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const isSuccess = searchParams.get('success') === 'true'

    if (isSuccess && sessionId) {
      // 결제 완료: Stripe 세션을 검증하고 구독 동기화 후 데이터 조회
      verifyAndFetch(sessionId)
    } else {
      fetchSubscription()
    }

    // cleanup: 컴포넌트 언마운트 시 폴링 정리
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  /**
   * 결제 완료 후: 세션 검증 → 구독 동기화 → 데이터 조회
   * webhook이 아직 도착하지 않았거나 실패한 경우에도 구독이 반영됩니다.
   */
  const verifyAndFetch = async (sessionId: string) => {
    try {
      setError(null)
      const verifyResponse = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.json()
        if (verifyResult.verified) {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 5000)
        }
      }
    } catch (err) {
      console.error('Session verification failed:', err)
      // 검증 실패해도 일반 조회로 폴백
    }

    // 검증 후 구독 데이터 조회 (결과를 직접 반환받아 클로저 문제 방지)
    const subscriptionData = await fetchSubscription()

    // 조회 결과가 여전히 FREE면 폴링으로 재시도 (webhook 지연 대응)
    if (!subscriptionData || subscriptionData.subscription.planType === 'FREE') {
      let retries = 0
      const maxRetries = 5

      pollIntervalRef.current = setInterval(async () => {
        retries++
        try {
          const response = await fetch('/api/subscription')
          if (response.ok) {
            const result = await response.json()
            if (result.subscription?.planType !== 'FREE') {
              setData(result)
              setShowSuccess(true)
              setTimeout(() => setShowSuccess(false), 5000)
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              return
            }
          }
        } catch {
          // 폴링 실패 무시
        }

        if (retries >= maxRetries && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      }, 2000)
    }
  }

  const fetchSubscription = async (): Promise<SubscriptionData | null> => {
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
      return result
    } catch (err) {
      console.error('Failed to fetch subscription:', err)
      setError(subT?.loadError || 'Unable to load subscription info. Please try again.')
      return null
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
        <p className="text-muted-foreground">{subT?.loadError || 'Unable to load subscription info.'}</p>
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
          <p className="text-green-500 font-medium">{subT?.subscriptionSuccess || 'Your subscription has started successfully!'}</p>
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
        <h1 className="text-3xl font-bold text-foreground mb-2">{subT?.title || 'Subscription Management'}</h1>
        <p className="text-muted-foreground">
          {subT?.subtitle || 'Check and manage your current plan and usage.'}
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
                  <p className="text-sm text-muted-foreground mb-1">{subT?.currentPlan || 'Current Plan'}</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-foreground">
                      {subscription.displayName}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPlanBadgeColor(subscription.planType)}`}>
                      {isPaid ? (subT?.paid || 'Paid') : (subT?.free || 'Free')}
                    </span>
                  </div>
                </div>
                {isPaid && (
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-foreground transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    {subT?.manage || 'Manage'}
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
                        <span className="text-sm">{subT?.nextPayment || 'Next Payment'}</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {subscription.cancelAtPeriodEnd
                          ? (subT?.cancelScheduled || 'Cancellation Scheduled')
                          : formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm">{subT?.monthlyCredits || 'Monthly Credits'}</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {subscription.monthlyCredits} {subT?.credits || 'credits'}
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
                      <p className="font-medium text-yellow-500">{subT?.cancelWarning || 'Cancellation Scheduled'}</p>
                      <p className="text-sm text-yellow-500/80">
                        {(subT?.cancelWarningDesc || 'Your plan will switch to Free on {date}.').replace('{date}', formatDate(subscription.currentPeriodEnd))}
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
                    <p className="text-sm font-medium text-foreground">{subT?.keyframe || 'Keyframes'}</p>
                    <p className="text-xs text-muted-foreground">{(subT?.keyframeGenerate || '{count} generated').replace('{count}', String(features.keyframeCount))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${features.hdUpscale ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <TrendingUp className={`w-4 h-4 ${features.hdUpscale ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{subT?.hdUpscale || 'HD Upscale'}</p>
                    <p className="text-xs text-muted-foreground">{features.hdUpscale ? (subT?.available || 'Available') : (subT?.notSupported || 'Not Supported')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${features.watermarkFree ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <CheckCircle className={`w-4 h-4 ${features.watermarkFree ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{subT?.watermark || 'Watermark'}</p>
                    <p className="text-xs text-muted-foreground">{features.watermarkFree ? (subT?.removed || 'Removed') : (subT?.included || 'Included')}</p>
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
                  {subT?.upgradePlan || 'Upgrade Plan'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Credits Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">{subT?.yourCredits || 'Your Credits'}</h3>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-primary mb-2">
              {profile?.credits || 0}
            </p>
            <p className="text-sm text-muted-foreground">{subT?.availableCredits || 'Available credits'}</p>
          </div>

          {isPaid && monthlyCreditsLimit > 0 && (
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{subT?.monthlyUsage || "This month's credit usage"}</span>
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
                {(subT?.monthlyCreditsInfo || '{credits} credits are provided on the 1st of each month').replace('{credits}', String(monthlyCreditsLimit))}
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
              <h3 className="text-lg font-semibold text-foreground">{subT?.freeGenerationLimits || 'Free Generation Limits'}</h3>
              <p className="text-sm text-muted-foreground">{subT?.freeGenerationDesc || 'Free generation included in your plan'}</p>
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
                  <p className="font-medium text-foreground">{subT?.avatarGeneration || 'Avatar Generation'}</p>
                  <p className="text-sm text-muted-foreground">
                    {usage.avatars.used} / {usage.avatars.limit === -1 ? (subT?.unlimited || 'Unlimited') : usage.avatars.limit}
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
                  <p className="font-medium text-foreground">{subT?.musicGeneration || 'Music Generation'}</p>
                  <p className="text-sm text-muted-foreground">
                    {usage.music.used} / {usage.music.limit === -1 ? (subT?.unlimited || 'Unlimited') : usage.music.limit}
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
                  <p className="font-medium text-foreground">{subT?.productRegistration || 'Product Registration'}</p>
                  <p className="text-sm text-muted-foreground">
                    {usage.products.used} / {usage.products.limit === -1 ? (subT?.unlimited || 'Unlimited') : usage.products.limit}
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
              {subT?.usageInfo || 'Credits are deducted when limits are exceeded. Need more?'}{' '}
              <Link href="/dashboard/pricing" className="text-primary hover:underline font-medium">
                {subT?.upgradePlanLink || 'Upgrade your plan'}
              </Link>
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
