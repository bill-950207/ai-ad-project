/**
 * PostHog 이벤트 상수 & 타입 정의
 *
 * Phase 1: 핵심 퍼널 15개 이벤트
 */

// ============================================================
// 이벤트명 상수
// ============================================================

export const ANALYTICS_EVENTS = {
  // Auth (3개)
  AUTH_SIGNUP_COMPLETED: 'auth_signup_completed',
  AUTH_EMAIL_VERIFIED: 'auth_email_verified',
  AUTH_LOGIN_SUCCESS: 'auth_login_success',

  // Onboarding (2개)
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Image Ad (4개)
  IMAGE_AD_WIZARD_STARTED: 'image_ad_wizard_started',
  IMAGE_AD_GENERATION_STARTED: 'image_ad_generation_started',
  IMAGE_AD_GENERATION_COMPLETED: 'image_ad_generation_completed',
  IMAGE_AD_GENERATION_FAILED: 'image_ad_generation_failed',

  // Video Ad (3개)
  VIDEO_AD_WIZARD_STARTED: 'video_ad_wizard_started',
  VIDEO_AD_GENERATION_STARTED: 'video_ad_generation_started',
  VIDEO_AD_GENERATION_COMPLETED: 'video_ad_generation_completed',

  // Subscription (3개)
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  CHECKOUT_INITIATED: 'checkout_initiated',
  CHECKOUT_COMPLETED: 'checkout_completed',
} as const

// ============================================================
// 이벤트별 프로퍼티 타입
// ============================================================

export interface AuthSignupCompletedProps {
  method: 'email' | 'google'
}

export interface AuthEmailVerifiedProps {
  method: 'email' | 'google'
}

export interface AuthLoginSuccessProps {
  method: 'email' | 'google'
}

export interface OnboardingStepCompletedProps {
  step: number
  total_steps: number
}

export interface OnboardingCompletedProps {
  job_title?: string
  industry?: string
}

export interface ImageAdWizardStartedProps {
  ad_type: string
  has_draft: boolean
}

export interface ImageAdGenerationStartedProps {
  ad_type: string
  quality: string
  num_images: number
  aspect_ratio: string
  credits_used: number
}

export interface ImageAdGenerationCompletedProps {
  ad_type: string
  num_images: number
  duration_seconds: number
}

export interface ImageAdGenerationFailedProps {
  ad_type: string
  error: string
}

export interface VideoAdWizardStartedProps {
  wizard_type: 'product_ad' | 'product_description'
}

export interface VideoAdGenerationStartedProps {
  wizard_type: 'product_ad' | 'product_description'
  resolution?: string
  credits_used?: number
}

export interface VideoAdGenerationCompletedProps {
  wizard_type: 'product_ad' | 'product_description'
  duration_seconds?: number
}

export interface PricingPageViewedProps {
  current_plan: string
}

export interface CheckoutInitiatedProps {
  plan: string
  interval: 'monthly' | 'yearly'
}

export interface CheckoutCompletedProps {
  plan: string
  user_id: string
}

// ============================================================
// 이벤트 맵 타입 (type-safe tracking)
// ============================================================

export interface AnalyticsEventMap {
  [ANALYTICS_EVENTS.AUTH_SIGNUP_COMPLETED]: AuthSignupCompletedProps
  [ANALYTICS_EVENTS.AUTH_EMAIL_VERIFIED]: AuthEmailVerifiedProps
  [ANALYTICS_EVENTS.AUTH_LOGIN_SUCCESS]: AuthLoginSuccessProps
  [ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED]: OnboardingStepCompletedProps
  [ANALYTICS_EVENTS.ONBOARDING_COMPLETED]: OnboardingCompletedProps
  [ANALYTICS_EVENTS.IMAGE_AD_WIZARD_STARTED]: ImageAdWizardStartedProps
  [ANALYTICS_EVENTS.IMAGE_AD_GENERATION_STARTED]: ImageAdGenerationStartedProps
  [ANALYTICS_EVENTS.IMAGE_AD_GENERATION_COMPLETED]: ImageAdGenerationCompletedProps
  [ANALYTICS_EVENTS.IMAGE_AD_GENERATION_FAILED]: ImageAdGenerationFailedProps
  [ANALYTICS_EVENTS.VIDEO_AD_WIZARD_STARTED]: VideoAdWizardStartedProps
  [ANALYTICS_EVENTS.VIDEO_AD_GENERATION_STARTED]: VideoAdGenerationStartedProps
  [ANALYTICS_EVENTS.VIDEO_AD_GENERATION_COMPLETED]: VideoAdGenerationCompletedProps
  [ANALYTICS_EVENTS.PRICING_PAGE_VIEWED]: PricingPageViewedProps
  [ANALYTICS_EVENTS.CHECKOUT_INITIATED]: CheckoutInitiatedProps
  [ANALYTICS_EVENTS.CHECKOUT_COMPLETED]: CheckoutCompletedProps
}
