'use client'

import { useState, useEffect } from 'react'
import { Check, X, Sparkles, Zap, Building2, Infinity, Crown, TrendingUp, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/language-context'

type BillingInterval = 'monthly' | 'yearly'

interface PlanData {
  name: string
  displayName: string
  priceMonthly: number
  priceYearly: number
  icon: React.ReactNode
  popular?: boolean
  bestValue?: boolean
  tier: number
  translationKey: 'free' | 'starter' | 'pro' | 'business'
}

interface PlanTranslation {
  description: string
  valueHighlight: string
  features: string[]
  limits: {
    avatars: string
    music: string
    products: string
    credits: string
    imageEstimate: string
    videoEstimate: string
  }
}

const planData: PlanData[] = [
  {
    name: 'FREE',
    displayName: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    icon: <Sparkles className="w-5 h-5" />,
    tier: 0,
    translationKey: 'free',
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    priceMonthly: 9.99,
    priceYearly: 99.90,
    icon: <Zap className="w-5 h-5" />,
    popular: true,
    tier: 1,
    translationKey: 'starter',
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    priceMonthly: 29.99,
    priceYearly: 299.90,
    icon: <Crown className="w-5 h-5" />,
    bestValue: true,
    tier: 2,
    translationKey: 'pro',
  },
  {
    name: 'BUSINESS',
    displayName: 'Business',
    priceMonthly: 99.99,
    priceYearly: 999.90,
    icon: <Building2 className="w-5 h-5" />,
    tier: 3,
    translationKey: 'business',
  },
]

export default function PricingPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<boolean | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pricingT = t.pricingPage as any

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

  const getPrice = (plan: PlanData) => {
    if (plan.priceMonthly === 0) return pricingT.free
    const price = interval === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12
    return `$${price.toFixed(2)}`
  }

  const getYearlySavings = (plan: PlanData) => {
    if (plan.priceMonthly === 0) return null
    const monthlyCost = plan.priceMonthly * 12
    const yearlyCost = plan.priceYearly
    const savings = monthlyCost - yearlyCost
    return savings > 0 ? savings : null
  }

  const isUnlimited = (value: string) => {
    const unlimitedValues = ['무제한', 'Unlimited', '無制限', '无限']
    return unlimitedValues.includes(value)
  }

  const getPlanTranslation = (key: string): PlanTranslation => {
    return pricingT.plans?.[key] || {
      description: '',
      valueHighlight: '',
      features: [],
      limits: {
        avatars: '',
        music: '',
        products: '',
        credits: '',
        imageEstimate: '',
        videoEstimate: '',
      }
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>{pricingT.badge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            {pricingT.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {pricingT.subtitle}
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
              {pricingT.monthly}
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                interval === 'yearly'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {pricingT.yearly}
              <span className="ml-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planData.map((plan) => {
            const planT = getPlanTranslation(plan.translationKey)
            return (
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
                    {pricingT.popular}
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
                  {planT.description}
                </p>

                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">
                    {getPrice(plan)}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-muted-foreground">/{pricingT.perMonth}</span>
                  )}
                  {interval === 'yearly' && getYearlySavings(plan) && (
                    <div className="mt-1">
                      <span className="text-sm font-semibold text-green-500">
                        {pricingT.yearlySavings.replace('{{amount}}', getYearlySavings(plan)?.toFixed(2) || '0')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Value Highlight Badge */}
                {planT.valueHighlight && (
                  <div className="mb-4 inline-flex items-center gap-1 bg-green-500/10 text-green-600 text-xs font-medium px-2.5 py-1 rounded-full w-fit">
                    <TrendingUp className="w-3 h-3" />
                    {planT.valueHighlight}
                  </div>
                )}

                {/* Limits */}
                <div className="space-y-2 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pricingT.avatars}</span>
                    <span className={`font-medium ${isUnlimited(planT.limits.avatars) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                      {isUnlimited(planT.limits.avatars) && <Infinity className="w-4 h-4" />}
                      {planT.limits.avatars}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pricingT.music}</span>
                    <span className={`font-medium ${isUnlimited(planT.limits.music) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                      {isUnlimited(planT.limits.music) && <Infinity className="w-4 h-4" />}
                      {planT.limits.music}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pricingT.products}</span>
                    <span className={`font-medium ${isUnlimited(planT.limits.products) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                      {isUnlimited(planT.limits.products) && <Infinity className="w-4 h-4" />}
                      {planT.limits.products}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pricingT.credits}</span>
                    <span className="font-semibold text-primary">
                      {planT.limits.credits}
                    </span>
                  </div>
                  {(planT.limits.imageEstimate || planT.limits.videoEstimate) && (
                    <div className="pt-2 space-y-1 border-t border-border/50 mt-2">
                      {planT.limits.imageEstimate && (
                        <div className="text-xs text-muted-foreground text-right">
                          {planT.limits.imageEstimate}
                        </div>
                      )}
                      {planT.limits.videoEstimate && (
                        <div className="text-xs text-muted-foreground text-right">
                          {planT.limits.videoEstimate}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-grow">
                  {planT.features.map((feature, idx) => {
                    const watermarkPatterns = ['워터마크 포함', 'Watermark Included', '透かし付き', '含水印']
                    const isLimitation = watermarkPatterns.some(p => feature.includes(p))
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
                      <span>{pricingT.getStarted}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>{pricingT.cancelAnytime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>{pricingT.keepContent}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>{pricingT.creditsRollOver}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">
            {pricingT.ctaText}
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
          >
            <span>{pricingT.startFree}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
