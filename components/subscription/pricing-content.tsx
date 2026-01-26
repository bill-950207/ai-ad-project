'use client'

import { useState } from 'react'
import { Check, Sparkles, Zap, Building2, Infinity, Crown } from 'lucide-react'

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
      '기본 키프레임 1개',
    ],
    limits: {
      avatars: '3회/월',
      music: '5회/월',
      products: '3회/월',
      credits: '0 크레딧',
    },
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
      'HD 고화질 업스케일',
      '키프레임 2개 생성',
      '고급 아바타 스타일',
      '우선 생성 대기열',
    ],
    limits: {
      avatars: '9회/월',
      music: '15회/월',
      products: '9회/월',
      credits: '100 크레딧/월',
      imageEstimate: '~50개 광고 이미지',
      videoEstimate: '~10개 광고 영상',
    },
    popular: true,
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
      '워터마크 완전 제거',
      '최우선 생성 처리',
      '고급 편집 도구',
      '다양한 출력 포맷',
      '전문가 템플릿',
    ],
    limits: {
      avatars: '30회/월',
      music: '50회/월',
      products: '30회/월',
      credits: '330 크레딧/월',
      imageEstimate: '~165개 광고 이미지',
      videoEstimate: '~33개 광고 영상',
    },
    bestValue: true,
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
      avatars: '무제한',
      music: '무제한',
      products: '무제한',
      credits: '1,200 크레딧/월',
      imageEstimate: '~600개 광고 이미지',
      videoEstimate: '~120개 광고 영상',
    },
  },
]

export function PricingContent() {
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planName: string) => {
    if (planName === 'FREE') return

    setLoading(planName)
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
        console.error('Checkout failed:', data.error)
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(null)
    }
  }

  const getPrice = (plan: Plan) => {
    if (plan.priceMonthly === 0) return '무료'
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

  const isUnlimited = (value: string) => value === '무제한'

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">플랜 선택</h1>
        <p className="text-muted-foreground">
          필요에 맞는 플랜을 선택하세요. 언제든지 업그레이드하거나 다운그레이드할 수 있습니다.
        </p>
      </div>

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
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-card border rounded-xl p-6 flex flex-col ${
              plan.popular
                ? 'border-primary ring-2 ring-primary/20'
                : plan.bestValue
                ? 'border-purple-500 ring-2 ring-purple-500/20'
                : 'border-border'
            }`}
          >
            {/* Badges */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                인기
              </div>
            )}
            {plan.bestValue && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                Best Value
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                plan.bestValue ? 'bg-purple-500/10 text-purple-500' : 'bg-primary/10 text-primary'
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

            <div className="mb-6">
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
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.name)}
              disabled={plan.name === 'FREE' || loading === plan.name}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                plan.name === 'FREE'
                  ? 'bg-secondary text-muted-foreground cursor-default'
                  : plan.popular
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : plan.bestValue
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              } disabled:opacity-50`}
            >
              {loading === plan.name
                ? '처리 중...'
                : plan.name === 'FREE'
                ? '현재 플랜'
                : '구독하기'}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-12 max-w-2xl mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          모든 유료 플랜은 언제든지 취소할 수 있습니다. 취소 시 다음 결제일까지 서비스를 이용할 수 있으며,
          생성한 콘텐츠는 계속 보관됩니다.
        </p>
      </div>
    </div>
  )
}
