'use client'

import { useState, useEffect } from 'react'
import { Check, X, Sparkles, Zap, Building2, Infinity, Crown, TrendingUp, Loader2, AlertCircle } from 'lucide-react'

type BillingInterval = 'monthly' | 'yearly'

interface Plan {
  name: string
  displayName: string
  description: string
  priceMonthly: number
  priceYearly: number
  icon: React.ReactNode
  features: string[]
  limits: {
    avatars: string
    music: string
    products: string
    credits: string
    imageEstimate?: string
    videoEstimate?: string
  }
  popular?: boolean
  bestValue?: boolean
  valueHighlight?: string
  tier: number // 플랜 등급 (비교용)
}

const plans: Plan[] = [
  {
    name: 'FREE',
    displayName: 'Free',
    description: '시작하기 좋은 무료 플랜',
    priceMonthly: 0,
    priceYearly: 0,
    icon: <Sparkles className="w-5 h-5" />,
    features: [
      'AI 아바타 생성',
      'AI 배경 음악 생성',
      '제품 배경 자동 제거',
      '이미지 1장씩 생성',
      '영상 최단 길이만',
      '워터마크 포함',
    ],
    limits: {
      avatars: '최대 3개',
      music: '최대 5개',
      products: '최대 3개',
      credits: '15 크레딧 (1회)',
      imageEstimate: '~7개 광고 이미지',
    },
    tier: 0,
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    description: '개인 크리에이터를 위한 플랜',
    priceMonthly: 9.99,
    priceYearly: 99.90,
    icon: <Zap className="w-5 h-5" />,
    features: [
      '모든 Free 기능 포함',
      '워터마크 제거',
      'HD 고화질 업스케일',
      '이미지 최대 5장 동시 생성',
      '영상 길이 선택 가능',
      '우선 생성 대기열',
    ],
    limits: {
      avatars: '최대 9개',
      music: '최대 15개',
      products: '최대 9개',
      credits: '120 크레딧/월',
      imageEstimate: '~60개 광고 이미지',
      videoEstimate: '~12개 광고 영상',
    },
    popular: true,
    valueHighlight: '타사 대비 4배 저렴',
    tier: 1,
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    description: '전문가를 위한 프로 플랜',
    priceMonthly: 29.99,
    priceYearly: 299.90,
    icon: <Crown className="w-5 h-5" />,
    features: [
      '모든 Starter 기능 포함',
      '최우선 생성 처리',
      'High 품질 이미지 생성',
      '영상 3개 동시 생성',
      '전문가 템플릿',
      '프리미엄 고객 지원',
    ],
    limits: {
      avatars: '최대 30개',
      music: '최대 50개',
      products: '최대 30개',
      credits: '420 크레딧/월',
      imageEstimate: '~210개 광고 이미지',
      videoEstimate: '~42개 광고 영상',
    },
    bestValue: true,
    valueHighlight: '이미지당 $0.14',
    tier: 2,
  },
  {
    name: 'BUSINESS',
    displayName: 'Business',
    description: '팀과 기업을 위한 플랜',
    priceMonthly: 99.99,
    priceYearly: 999.90,
    icon: <Building2 className="w-5 h-5" />,
    features: [
      '모든 Pro 기능 포함',
      '무제한 콘텐츠 생성',
      '전용 고객 지원',
      'API 액세스',
      '팀 협업 기능',
      '맞춤 브랜딩 옵션',
      '우선 기능 업데이트',
    ],
    limits: {
      avatars: 'Unlimited',
      music: 'Unlimited',
      products: 'Unlimited',
      credits: '1,600 크레딧/월',
      imageEstimate: '~800개 광고 이미지',
      videoEstimate: '~160개 광고 영상',
    },
    valueHighlight: '이미지당 $0.12',
    tier: 3,
  },
]

// 플랜 이름으로 tier 가져오기
const getPlanTier = (planName: string): number => {
  const plan = plans.find(p => p.name === planName)
  return plan?.tier ?? 0
}

export function PricingContent() {
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlanType, setCurrentPlanType] = useState<string>('FREE')
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 현재 사용자의 플랜 정보 가져오기
    const fetchCurrentPlan = async () => {
      try {
        setError(null)
        const response = await fetch('/api/user/plan')
        if (!response.ok) {
          throw new Error('Failed to fetch plan')
        }
        const data = await response.json()
        setCurrentPlanType(data.planType || 'FREE')
      } catch (err) {
        console.error('Failed to fetch current plan:', err)
        setError('플랜 정보를 불러올 수 없습니다.')
      } finally {
        setPageLoading(false)
      }
    }

    fetchCurrentPlan()
  }, [])

  const currentTier = getPlanTier(currentPlanType)

  const handleSubscribe = async (planName: string) => {
    const planTier = getPlanTier(planName)

    // 현재 플랜이거나 낮은 플랜이면 무시
    if (planTier <= currentTier) return

    setLoading(planName)
    setError(null)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName, interval }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || '결제 페이지를 열 수 없습니다.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(null)
    }
  }

  const getPrice = (plan: Plan) => {
    if (plan.priceMonthly === 0) return 'Free'
    const price = interval === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12
    return `$${price.toFixed(2)}`
  }

  const getYearlySavings = (plan: Plan) => {
    if (plan.priceMonthly === 0) return null
    const monthlyCost = plan.priceMonthly * 12
    const yearlyCost = plan.priceYearly
    const savings = monthlyCost - yearlyCost
    return savings > 0 ? savings : null
  }

  const isUnlimited = (value: string) => value === 'Unlimited'

  const getButtonState = (plan: Plan) => {
    const isCurrentPlan = plan.name === currentPlanType
    const isLowerOrEqual = plan.tier <= currentTier
    const isHigher = plan.tier > currentTier

    if (isCurrentPlan) {
      return {
        text: 'Current Plan',
        disabled: true,
        className: 'bg-primary/20 text-primary border-2 border-primary cursor-default',
      }
    }

    if (isLowerOrEqual && !isCurrentPlan) {
      return {
        text: 'Downgrade N/A',
        disabled: true,
        className: 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50',
      }
    }

    if (isHigher) {
      return {
        text: loading === plan.name ? 'Processing...' : 'Upgrade',
        disabled: loading === plan.name,
        className: plan.popular
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02]'
          : plan.bestValue
          ? 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-[1.02]'
          : 'bg-secondary text-foreground hover:bg-secondary/80',
      }
    }

    return {
      text: 'Subscribe',
      disabled: false,
      className: 'bg-secondary text-foreground hover:bg-secondary/80',
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">플랜 선택</h1>
        <p className="text-muted-foreground">
          필요에 맞는 플랜을 선택하세요. 언제든지 업그레이드할 수 있습니다.
        </p>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
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

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-secondary rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            월간 결제
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              interval === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            연간 결제
            <span className="ml-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const buttonState = getButtonState(plan)
          const isCurrentPlan = plan.name === currentPlanType

          return (
            <div
              key={plan.name}
              className={`relative bg-card border rounded-xl p-6 flex flex-col ${
                isCurrentPlan
                  ? 'border-primary ring-2 ring-primary/30'
                  : plan.popular
                  ? 'border-primary ring-2 ring-primary/20'
                  : plan.bestValue
                  ? 'border-purple-500 ring-2 ring-purple-500/20'
                  : 'border-border'
              }`}
            >
              {/* Badges */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  현재 플랜
                </div>
              )}
              {!isCurrentPlan && plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  인기
                </div>
              )}
              {!isCurrentPlan && plan.bestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Best Value
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isCurrentPlan
                    ? 'bg-primary/20 text-primary'
                    : plan.bestValue
                    ? 'bg-purple-500/10 text-purple-500'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.displayName}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {plan.description}
              </p>

              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {getPrice(plan)}
                </span>
                {plan.priceMonthly > 0 && (
                  <span className="text-muted-foreground">/월</span>
                )}
                {interval === 'yearly' && getYearlySavings(plan) && (
                  <div className="mt-1">
                    <span className="text-sm font-semibold text-green-500">
                      연 ${getYearlySavings(plan)?.toFixed(2)} 절약!
                    </span>
                  </div>
                )}
              </div>

              {/* Value Highlight Badge */}
              {plan.valueHighlight && (
                <div className="mb-4 inline-flex items-center gap-1 bg-green-500/10 text-green-600 text-xs font-medium px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {plan.valueHighlight}
                </div>
              )}

              {/* Limits */}
              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">아바타</span>
                  <span className={`font-medium ${isUnlimited(plan.limits.avatars) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {isUnlimited(plan.limits.avatars) && <Infinity className="w-4 h-4" />}
                    {plan.limits.avatars}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">음악</span>
                  <span className={`font-medium ${isUnlimited(plan.limits.music) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {isUnlimited(plan.limits.music) && <Infinity className="w-4 h-4" />}
                    {plan.limits.music}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">제품</span>
                  <span className={`font-medium ${isUnlimited(plan.limits.products) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {isUnlimited(plan.limits.products) && <Infinity className="w-4 h-4" />}
                    {plan.limits.products}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">크레딧</span>
                  <span className="font-semibold text-primary">{plan.limits.credits}</span>
                </div>
                {/* Credit Estimates - Image and Video separately */}
                {(plan.limits.imageEstimate || plan.limits.videoEstimate) && (
                  <div className="pt-2 space-y-1 border-t border-border/50 mt-2">
                    {plan.limits.imageEstimate && (
                      <div className="text-xs text-muted-foreground text-right">
                        {plan.limits.imageEstimate}
                      </div>
                    )}
                    {plan.limits.videoEstimate && (
                      <div className="text-xs text-muted-foreground text-right">
                        {plan.limits.videoEstimate}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-grow">
                {plan.features.map((feature, idx) => {
                  const isLimitation = feature === '워터마크 포함'
                  return (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {isLimitation ? (
                        <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={isLimitation ? 'text-muted-foreground' : 'text-foreground'}>
                        {feature}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={buttonState.disabled}
                className={`w-full py-2.5 rounded-lg font-medium transition-all ${buttonState.className}`}
              >
                {loading === plan.name ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    처리 중...
                  </span>
                ) : (
                  buttonState.text
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Trust Badges */}
      <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span>언제든 취소 가능</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span>생성 콘텐츠 영구 보관</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span>크레딧 다음 달 이월</span>
        </div>
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-8 max-w-2xl mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          모든 유료 플랜은 언제든지 취소할 수 있습니다. 취소 시 다음 결제일까지 서비스를 이용할 수 있으며,
          생성한 콘텐츠는 계속 보관됩니다.
        </p>
      </div>
    </div>
  )
}
