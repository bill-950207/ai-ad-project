'use client'

import { useState, useEffect } from 'react'
import { Check, X, Sparkles, Zap, Building2, Infinity, Crown, TrendingUp, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/language-context'

type BillingInterval = 'monthly' | 'yearly'

interface Plan {
  name: string
  displayName: string
  description: string
  descriptionEn: string
  priceMonthly: number
  priceYearly: number
  icon: React.ReactNode
  features: string[]
  featuresEn: string[]
  limits: {
    avatars: string
    avatarsEn: string
    music: string
    musicEn: string
    products: string
    productsEn: string
    credits: string
    creditsEn: string
    imageEstimate?: string
    imageEstimateEn?: string
    videoEstimate?: string
    videoEstimateEn?: string
  }
  popular?: boolean
  bestValue?: boolean
  valueHighlight?: string
  valueHighlightEn?: string
  tier: number
}

const plans: Plan[] = [
  {
    name: 'FREE',
    displayName: 'Free',
    description: '시작하기 좋은 무료 플랜',
    descriptionEn: 'Perfect to get started',
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
    featuresEn: [
      'AI Avatar Generation',
      'AI Background Music',
      'Auto Background Removal',
      '1 Image at a Time',
      'Shortest Video Only',
      'Watermark Included',
    ],
    limits: {
      avatars: '최대 3개',
      avatarsEn: 'Up to 3',
      music: '최대 5개',
      musicEn: 'Up to 5',
      products: '최대 3개',
      productsEn: 'Up to 3',
      credits: '15 크레딧 (1회)',
      creditsEn: '15 Credits (One-time)',
      imageEstimate: '~7개 광고 이미지',
      imageEstimateEn: '~7 Ad Images',
    },
    tier: 0,
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    description: '개인 크리에이터를 위한 플랜',
    descriptionEn: 'For individual creators',
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
    featuresEn: [
      'All Free Features',
      'No Watermark',
      'HD Upscaling',
      'Up to 5 Images at Once',
      'Custom Video Length',
      'Priority Queue',
    ],
    limits: {
      avatars: '최대 9개',
      avatarsEn: 'Up to 9',
      music: '최대 15개',
      musicEn: 'Up to 15',
      products: '최대 9개',
      productsEn: 'Up to 9',
      credits: '120 크레딧/월',
      creditsEn: '120 Credits/mo',
      imageEstimate: '~60개 광고 이미지',
      imageEstimateEn: '~60 Ad Images',
      videoEstimate: '~12개 광고 영상',
      videoEstimateEn: '~12 Ad Videos',
    },
    popular: true,
    valueHighlight: '타사 대비 4배 저렴',
    valueHighlightEn: '4x More Affordable',
    tier: 1,
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    description: '전문가를 위한 프로 플랜',
    descriptionEn: 'For professionals',
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
    featuresEn: [
      'All Starter Features',
      'Top Priority Processing',
      'High Quality Images',
      '3 Videos at Once',
      'Pro Templates',
      'Premium Support',
    ],
    limits: {
      avatars: '최대 30개',
      avatarsEn: 'Up to 30',
      music: '최대 50개',
      musicEn: 'Up to 50',
      products: '최대 30개',
      productsEn: 'Up to 30',
      credits: '420 크레딧/월',
      creditsEn: '420 Credits/mo',
      imageEstimate: '~210개 광고 이미지',
      imageEstimateEn: '~210 Ad Images',
      videoEstimate: '~42개 광고 영상',
      videoEstimateEn: '~42 Ad Videos',
    },
    bestValue: true,
    valueHighlight: '이미지당 $0.14',
    valueHighlightEn: '$0.14 per Image',
    tier: 2,
  },
  {
    name: 'BUSINESS',
    displayName: 'Business',
    description: '팀과 기업을 위한 플랜',
    descriptionEn: 'For teams and enterprises',
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
    featuresEn: [
      'All Pro Features',
      'Unlimited Content',
      'Dedicated Support',
      'API Access',
      'Team Collaboration',
      'Custom Branding',
      'Priority Updates',
    ],
    limits: {
      avatars: '무제한',
      avatarsEn: 'Unlimited',
      music: '무제한',
      musicEn: 'Unlimited',
      products: '무제한',
      productsEn: 'Unlimited',
      credits: '1,600 크레딧/월',
      creditsEn: '1,600 Credits/mo',
      imageEstimate: '~800개 광고 이미지',
      imageEstimateEn: '~800 Ad Images',
      videoEstimate: '~160개 광고 영상',
      videoEstimateEn: '~160 Ad Videos',
    },
    valueHighlight: '이미지당 $0.12',
    valueHighlightEn: '$0.12 per Image',
    tier: 3,
  },
]

export default function PricingPage() {
  const { language } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<boolean | null>(null)

  const isKo = language === 'ko'

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(!!user)
    }
    checkUser()
  }, [supabase.auth])

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      router.push('/signup')
      return
    }

    if (planName === 'FREE') {
      router.push('/dashboard')
      return
    }

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
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  const getPrice = (plan: Plan) => {
    if (plan.priceMonthly === 0) return isKo ? '무료' : 'Free'
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

  const isUnlimited = (value: string) => value === '무제한' || value === 'Unlimited'

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>{isKo ? '합리적인 가격' : 'Simple Pricing'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            {isKo ? '필요에 맞는 플랜을 선택하세요' : 'Choose the Right Plan for You'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isKo
              ? '언제든지 업그레이드하거나 취소할 수 있습니다. 숨겨진 비용 없이 투명하게.'
              : 'Upgrade or cancel anytime. Transparent pricing with no hidden fees.'}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-secondary rounded-xl p-1.5 flex gap-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                interval === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isKo ? '월간 결제' : 'Monthly'}
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                interval === 'yearly'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isKo ? '연간 결제' : 'Yearly'}
              <span className="ml-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card border rounded-2xl p-6 flex flex-col transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? 'border-primary ring-2 ring-primary/20 scale-[1.02]'
                  : plan.bestValue
                  ? 'border-purple-500 ring-2 ring-purple-500/20'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {/* Badges */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  {isKo ? '인기' : 'Popular'}
                </div>
              )}
              {plan.bestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Best Value
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  plan.bestValue
                    ? 'bg-purple-500/10 text-purple-500'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {plan.displayName}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {isKo ? plan.description : plan.descriptionEn}
              </p>

              <div className="mb-4">
                <span className="text-4xl font-bold text-foreground">
                  {getPrice(plan)}
                </span>
                {plan.priceMonthly > 0 && (
                  <span className="text-muted-foreground">/{isKo ? '월' : 'mo'}</span>
                )}
                {interval === 'yearly' && getYearlySavings(plan) && (
                  <div className="mt-1">
                    <span className="text-sm font-semibold text-green-500">
                      {isKo ? `연 $${getYearlySavings(plan)?.toFixed(2)} 절약!` : `Save $${getYearlySavings(plan)?.toFixed(2)}/year`}
                    </span>
                  </div>
                )}
              </div>

              {/* Value Highlight Badge */}
              {plan.valueHighlight && (
                <div className="mb-4 inline-flex items-center gap-1 bg-green-500/10 text-green-600 text-xs font-medium px-2.5 py-1 rounded-full w-fit">
                  <TrendingUp className="w-3 h-3" />
                  {isKo ? plan.valueHighlight : plan.valueHighlightEn}
                </div>
              )}

              {/* Limits */}
              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isKo ? '아바타' : 'Avatars'}</span>
                  <span className={`font-medium ${isUnlimited(plan.limits.avatars) || isUnlimited(plan.limits.avatarsEn) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {(isUnlimited(plan.limits.avatars) || isUnlimited(plan.limits.avatarsEn)) && <Infinity className="w-4 h-4" />}
                    {isKo ? plan.limits.avatars : plan.limits.avatarsEn}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isKo ? '음악' : 'Music'}</span>
                  <span className={`font-medium ${isUnlimited(plan.limits.music) || isUnlimited(plan.limits.musicEn) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {(isUnlimited(plan.limits.music) || isUnlimited(plan.limits.musicEn)) && <Infinity className="w-4 h-4" />}
                    {isKo ? plan.limits.music : plan.limits.musicEn}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isKo ? '제품' : 'Products'}</span>
                  <span className={`font-medium ${isUnlimited(plan.limits.products) || isUnlimited(plan.limits.productsEn) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {(isUnlimited(plan.limits.products) || isUnlimited(plan.limits.productsEn)) && <Infinity className="w-4 h-4" />}
                    {isKo ? plan.limits.products : plan.limits.productsEn}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isKo ? '크레딧' : 'Credits'}</span>
                  <span className="font-semibold text-primary">
                    {isKo ? plan.limits.credits : plan.limits.creditsEn}
                  </span>
                </div>
                {(plan.limits.imageEstimate || plan.limits.videoEstimate) && (
                  <div className="pt-2 space-y-1 border-t border-border/50 mt-2">
                    {plan.limits.imageEstimate && (
                      <div className="text-xs text-muted-foreground text-right">
                        {isKo ? plan.limits.imageEstimate : plan.limits.imageEstimateEn}
                      </div>
                    )}
                    {plan.limits.videoEstimate && (
                      <div className="text-xs text-muted-foreground text-right">
                        {isKo ? plan.limits.videoEstimate : plan.limits.videoEstimateEn}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-grow">
                {(isKo ? plan.features : plan.featuresEn).map((feature, idx) => {
                  const isLimitation = feature === '워터마크 포함' || feature === 'Watermark Included'
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
                disabled={loading === plan.name}
                className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
                    : plan.bestValue
                    ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {loading === plan.name ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isKo ? '시작하기' : 'Get Started'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>{isKo ? '언제든 취소 가능' : 'Cancel Anytime'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>{isKo ? '생성 콘텐츠 영구 보관' : 'Keep Your Content Forever'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>{isKo ? '크레딧 다음 달 이월' : 'Credits Roll Over'}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">
            {isKo
              ? '아직 결정이 어려우신가요? 무료로 시작해보세요!'
              : "Not sure yet? Start for free!"}
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
          >
            <span>{isKo ? '무료로 시작하기' : 'Start Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
