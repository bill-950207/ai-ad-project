/**
 * Stripe 가격 ID 설정
 *
 * Stripe 대시보드에서 Products를 생성한 후 여기에 Price ID를 설정합니다.
 * 환경변수로 관리하여 테스트/프로덕션 환경을 분리합니다.
 */

export const STRIPE_PRICES = {
  STARTER: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
  },
  PRO: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
  BUSINESS: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '',
  },
} as const

export type PlanName = keyof typeof STRIPE_PRICES
export type BillingInterval = 'monthly' | 'yearly'

/**
 * 플랜 이름과 결제 주기로 Stripe Price ID 가져오기
 */
export function getStripePriceId(
  plan: PlanName,
  interval: BillingInterval
): string | null {
  const prices = STRIPE_PRICES[plan]
  if (!prices) return null

  const priceId = prices[interval]
  return priceId || null
}

/**
 * Stripe Price ID로 플랜 정보 역조회
 */
export function getPlanFromPriceId(
  priceId: string
): { plan: PlanName; interval: BillingInterval } | null {
  for (const [plan, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId) {
      return { plan: plan as PlanName, interval: 'monthly' }
    }
    if (prices.yearly === priceId) {
      return { plan: plan as PlanName, interval: 'yearly' }
    }
  }
  return null
}
