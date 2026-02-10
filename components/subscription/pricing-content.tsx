'use client'

import { useState, useEffect } from 'react'
import { Check, X, Sparkles, Zap, Building2, Infinity, Crown, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useTrack } from '@/lib/analytics/track'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

type BillingInterval = 'monthly' | 'yearly'

interface PlanLimits {
  avatars: string
  music: string
  products: string
  credits: string
  imageEstimate?: string
  videoEstimate?: string
}

interface PlanTranslation {
  description: string
  valueHighlight?: string
  features: string[]
  limits: PlanLimits
}

interface Plan {
  name: string
  displayName: string
  priceMonthly: number
  priceYearly: number
  icon: React.ReactNode
  popular?: boolean
  bestValue?: boolean
  tier: number
}

// Static plan data (non-translatable)
const basePlans: Plan[] = [
  {
    name: 'FREE',
    displayName: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    icon: <Sparkles className="w-5 h-5" />,
    tier: 0,
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    priceMonthly: 9.99,
    priceYearly: 99.90,
    icon: <Zap className="w-5 h-5" />,
    popular: true,
    tier: 1,
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    priceMonthly: 29.99,
    priceYearly: 299.90,
    icon: <Crown className="w-5 h-5" />,
    bestValue: true,
    tier: 2,
  },
  {
    name: 'BUSINESS',
    displayName: 'Business',
    priceMonthly: 99.99,
    priceYearly: 999.90,
    icon: <Building2 className="w-5 h-5" />,
    tier: 3,
  },
]

// Fallback translations (English)
const fallbackPlanTranslations: Record<string, PlanTranslation> = {
  free: {
    description: 'Perfect to get started',
    features: [
      'AI Avatar Generation',
      'AI Background Music',
      'Auto Background Removal',
      '1 Image at a Time',
      'Shortest Video Only',
      'Watermark Included',
    ],
    limits: {
      avatars: 'Up to 3',
      music: 'Up to 5',
      products: 'Up to 3',
      credits: '20 Credits (One-time)',
      imageEstimate: '~7 Ad Images',
    },
  },
  starter: {
    description: 'For individual creators',
    valueHighlight: '4x More Affordable',
    features: [
      'All Free Features',
      'No Watermark',
      'HD Upscaling',
      'Up to 5 Images at Once',
      'Custom Video Length',
      'Priority Queue',
    ],
    limits: {
      avatars: 'Up to 9',
      music: 'Up to 15',
      products: 'Up to 9',
      credits: '120 Credits/mo',
      imageEstimate: '~60 Ad Images',
      videoEstimate: '~12 Ad Videos',
    },
  },
  pro: {
    description: 'For professionals',
    valueHighlight: '$0.14 per Image',
    features: [
      'All Starter Features',
      'Top Priority Processing',
      'High Quality Images',
      '3 Videos at Once',
      'Pro Templates',
      'Premium Support',
    ],
    limits: {
      avatars: 'Up to 30',
      music: 'Up to 50',
      products: 'Up to 30',
      credits: '420 Credits/mo',
      imageEstimate: '~210 Ad Images',
      videoEstimate: '~42 Ad Videos',
    },
  },
  business: {
    description: 'For teams and enterprises',
    valueHighlight: '$0.12 per Image',
    features: [
      'All Pro Features',
      'Unlimited Content',
      'Dedicated Support',
      'API Access',
      'Team Collaboration',
      'Custom Branding',
      'Priority Updates',
    ],
    limits: {
      avatars: 'Unlimited',
      music: 'Unlimited',
      products: 'Unlimited',
      credits: '1,600 Credits/mo',
      imageEstimate: '~800 Ad Images',
      videoEstimate: '~160 Ad Videos',
    },
  },
}

// Get plan tier by name
const getPlanTier = (planName: string): number => {
  const plan = basePlans.find(p => p.name === planName)
  return plan?.tier ?? 0
}

export function PricingContent() {
  const { t } = useLanguage()
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const track = useTrack()
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlanType, setCurrentPlanType] = useState<string>('FREE')
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Translation type
  type PricingPageT = {
    title?: string
    subtitle?: string
    loadError?: string
    checkoutError?: string
    processingError?: string
    monthlyBilling?: string
    yearlyBilling?: string
    save?: string
    free?: string
    perMonth?: string
    yearlySavings?: string
    avatars?: string
    music?: string
    products?: string
    credits?: string
    currentPlan?: string
    popular?: string
    bestValue?: string
    cannotDowngrade?: string
    upgrade?: string
    processing?: string
    subscribe?: string
    cancelAnytime?: string
    keepContent?: string
    creditsRollOver?: string
    allPlansCancelable?: string
    watermarkIncluded?: string
  }
  const pricingT = t.pricingPage as PricingPageT | undefined

  // Get translated plan data
  const getPlanTranslation = (planName: string): PlanTranslation => {
    const key = planName.toLowerCase()
    const pricingPlans = (t.pricing as { plans?: Record<string, PlanTranslation> })?.plans
    return pricingPlans?.[key] || fallbackPlanTranslations[key] || fallbackPlanTranslations.free
  }

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
        const planType = data.planType || 'FREE'
        setCurrentPlanType(planType)
        track(ANALYTICS_EVENTS.PRICING_PAGE_VIEWED, { current_plan: planType })
      } catch (err) {
        console.error('Failed to fetch current plan:', err)
        setError(pricingT?.loadError || 'Unable to load plan info.')
      } finally {
        setPageLoading(false)
      }
    }

    fetchCurrentPlan()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentTier = getPlanTier(currentPlanType)

  const handleSubscribe = async (planName: string) => {
    const planTier = getPlanTier(planName)

    // 현재 플랜이거나 낮은 플랜이면 무시
    if (planTier <= currentTier) return

    setLoading(planName)
    setError(null)

    track(ANALYTICS_EVENTS.CHECKOUT_INITIATED, { plan: planName, interval })

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
        setError(data.error || (pricingT?.checkoutError || 'Unable to open checkout page.'))
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(pricingT?.processingError || 'An error occurred during checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const getPrice = (plan: Plan) => {
    if (plan.priceMonthly === 0) return pricingT?.free || 'Free'
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

  const isUnlimited = (value: string) => value === 'Unlimited' || value === '무제한' || value === '無制限' || value === '无限'

  const getButtonState = (plan: Plan) => {
    const isCurrentPlan = plan.name === currentPlanType
    const isLowerOrEqual = plan.tier <= currentTier
    const isHigher = plan.tier > currentTier

    if (isCurrentPlan) {
      return {
        text: pricingT?.currentPlan || 'Current Plan',
        disabled: true,
        className: 'bg-primary/20 text-primary border-2 border-primary cursor-default',
      }
    }

    if (isLowerOrEqual && !isCurrentPlan) {
      return {
        text: pricingT?.cannotDowngrade || 'Cannot Downgrade',
        disabled: true,
        className: 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50',
      }
    }

    if (isHigher) {
      return {
        text: loading === plan.name ? (pricingT?.processing || 'Processing...') : (pricingT?.upgrade || 'Upgrade'),
        disabled: loading === plan.name,
        className: plan.popular
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02]'
          : plan.bestValue
          ? 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-[1.02]'
          : 'bg-secondary text-foreground hover:bg-secondary/80',
      }
    }

    return {
      text: pricingT?.subscribe || 'Subscribe',
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
        <h1 className="text-2xl font-bold text-foreground mb-2">{pricingT?.title || 'Choose a Plan'}</h1>
        <p className="text-muted-foreground">
          {pricingT?.subtitle || 'Select the plan that fits your needs. You can upgrade anytime.'}
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
            {pricingT?.monthlyBilling || 'Monthly'}
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              interval === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {pricingT?.yearlyBilling || 'Yearly'}
            <span className="ml-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {basePlans.map((plan) => {
          const buttonState = getButtonState(plan)
          const isCurrentPlan = plan.name === currentPlanType
          const planT = getPlanTranslation(plan.name)

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
                  {pricingT?.currentPlan || 'Current Plan'}
                </div>
              )}
              {!isCurrentPlan && plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  {pricingT?.popular || 'Popular'}
                </div>
              )}
              {!isCurrentPlan && plan.bestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {pricingT?.bestValue || 'Best Value'}
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
                {planT.description}
              </p>

              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {getPrice(plan)}
                </span>
                {plan.priceMonthly > 0 && (
                  <span className="text-muted-foreground">{pricingT?.perMonth || '/mo'}</span>
                )}
                {interval === 'yearly' && getYearlySavings(plan) && (
                  <div className="mt-1">
                    <span className="text-sm font-semibold text-green-500">
                      {(pricingT?.yearlySavings || 'Save ${amount}/year!').replace('{amount}', getYearlySavings(plan)?.toFixed(2) || '')}
                    </span>
                  </div>
                )}
              </div>

              {/* Value Highlight Badge */}
              {planT.valueHighlight && (
                <div className="mb-4 inline-flex items-center gap-1 bg-green-500/10 text-green-600 text-xs font-medium px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {planT.valueHighlight}
                </div>
              )}

              {/* Limits */}
              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{pricingT?.avatars || 'Avatars'}</span>
                  <span className={`font-medium ${isUnlimited(planT.limits.avatars) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {isUnlimited(planT.limits.avatars) && <Infinity className="w-4 h-4" />}
                    {planT.limits.avatars}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{pricingT?.music || 'Music'}</span>
                  <span className={`font-medium ${isUnlimited(planT.limits.music) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {isUnlimited(planT.limits.music) && <Infinity className="w-4 h-4" />}
                    {planT.limits.music}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{pricingT?.products || 'Products'}</span>
                  <span className={`font-medium ${isUnlimited(planT.limits.products) ? 'text-purple-500 flex items-center gap-1' : 'text-foreground'}`}>
                    {isUnlimited(planT.limits.products) && <Infinity className="w-4 h-4" />}
                    {planT.limits.products}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{pricingT?.credits || 'Credits'}</span>
                  <span className="font-semibold text-primary">{planT.limits.credits}</span>
                </div>
                {/* Credit Estimates - Image and Video separately */}
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
                  const isLimitation = feature.toLowerCase().includes('watermark') || feature.includes('워터마크') || feature.includes('ウォーターマーク') || feature.includes('水印')
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
                    {pricingT?.processing || 'Processing...'}
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
          <span>{pricingT?.cancelAnytime || 'Cancel Anytime'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span>{pricingT?.keepContent || 'Keep Your Content Forever'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span>{pricingT?.creditsRollOver || 'Credits Roll Over'}</span>
        </div>
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-8 max-w-2xl mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          {pricingT?.allPlansCancelable || 'All paid plans can be canceled at any time. You can continue using the service until the next billing date, and your content will be kept.'}
        </p>
      </div>
    </div>
  )
}
