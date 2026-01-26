/**
 * Stripe 서버 클라이언트
 */

import Stripe from 'stripe'

// 빌드 시점에는 환경 변수가 없을 수 있으므로 지연 초기화
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// 하위 호환성을 위한 export
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return Reflect.get(getStripe(), prop)
  },
})
