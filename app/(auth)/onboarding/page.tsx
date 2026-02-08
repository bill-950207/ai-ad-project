'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useTrack } from '@/lib/analytics/track'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import NextImage from 'next/image'

// 직책 키 목록
const JOB_TITLE_KEYS = ['ceo', 'marketer', 'designer', 'developer', 'pm', 'freelancer', 'student', 'other'] as const

// 업종 키 목록
const INDUSTRY_KEYS = ['ecommerce', 'beauty', 'fashion', 'food', 'tech', 'health', 'education', 'finance', 'agency', 'other'] as const

// 팀 규모 키 목록
const TEAM_SIZE_KEYS = ['1', '2-10', '11-50', '51-200', '201+'] as const

// 유입 경로 키 목록
const REFERRAL_SOURCE_KEYS = ['search', 'sns', 'friend', 'ad', 'blog', 'event', 'other'] as const

interface OnboardingTranslation {
  settingUp: string
  step1Title: string
  step1Subtitle: string
  nameLabel: string
  namePlaceholder: string
  companyLabel: string
  companyPlaceholder: string
  step2Title: string
  step2Subtitle: string
  step3Title: string
  step3Subtitle: string
  step4Title: string
  step4Subtitle: string
  teamSizeLabel: string
  referralLabel: string
  previous: string
  next: string
  start: string
  onboardingFailed: string
  errorOccurred: string
  jobTitles: Record<string, string>
  industries: Record<string, string>
  teamSizes: Record<string, string>
  referralSources: Record<string, string>
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const track = useTrack()
  const onboardingT = (t as Record<string, unknown>).authOnboarding as OnboardingTranslation | undefined

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 폼 데이터
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [industry, setIndustry] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [referralSource, setReferralSource] = useState('')

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [supabase, router])

  // 다음 단계로 이동 가능 여부
  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0
      case 2:
        return jobTitle.length > 0
      case 3:
        return industry.length > 0
      case 4:
        return true // 팀 규모와 유입 경로는 선택사항
      default:
        return false
    }
  }

  // 온보딩 완료
  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          company,
          jobTitle,
          industry,
          teamSize,
          referralSource,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || onboardingT?.onboardingFailed || 'Failed to complete onboarding')
      }

      // 온보딩 완료 이벤트
      track(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        job_title: jobTitle || undefined,
        industry: industry || undefined,
      })

      // 대시보드로 이동
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : onboardingT?.errorOccurred || 'An error occurred')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Centered Form */}
      <div className="w-full max-w-md px-8 py-12">
        <div className="w-full">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <NextImage
              src="/logo-full-dark-lg.png"
              alt="gwanggo"
              width={120}
              height={36}
              className="h-9 w-auto"
            />
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{onboardingT?.settingUp || 'Setting up'}</span>
              <span className="text-sm text-muted-foreground">{step}/4</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {onboardingT?.step1Title || 'Nice to meet you! 👋'}
                </h1>
                <p className="text-muted-foreground">
                  {onboardingT?.step1Subtitle || 'First, tell us your name.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {onboardingT?.nameLabel || 'Name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={onboardingT?.namePlaceholder || 'John Doe'}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {onboardingT?.companyLabel || 'Company (optional)'}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={onboardingT?.companyPlaceholder || 'Company or brand name'}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          {/* Step 2: Job Title */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {(onboardingT?.step2Title || "What's your role, {{name}}?").replace('{{name}}', name)}
                </h1>
                <p className="text-muted-foreground">
                  {onboardingT?.step2Subtitle || 'Help us serve you better.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {JOB_TITLE_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setJobTitle(key)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      jobTitle === key
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {onboardingT?.jobTitles?.[key] || key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Industry */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {onboardingT?.step3Title || 'What industry are you in?'}
                </h1>
                <p className="text-muted-foreground">
                  {onboardingT?.step3Subtitle || 'For personalized recommendations.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {INDUSTRY_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setIndustry(key)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      industry === key
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {onboardingT?.industries?.[key] || key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Team Size & Referral */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {onboardingT?.step4Title || 'Almost there! 🎉'}
                </h1>
                <p className="text-muted-foreground">
                  {onboardingT?.step4Subtitle || 'Just a few more questions. (optional)'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {onboardingT?.teamSizeLabel || 'Team size'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZE_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setTeamSize(key)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        teamSize === key
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {onboardingT?.teamSizes?.[key] || key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {onboardingT?.referralLabel || 'How did you hear about gwanggo?'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {REFERRAL_SOURCE_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setReferralSource(key)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        referralSource === key
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {onboardingT?.referralSources?.[key] || key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {onboardingT?.previous || 'Previous'}
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={() => {
                  track(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, { step, total_steps: 4 })
                  setStep(step + 1)
                }}
                disabled={!canProceed()}
              >
                {onboardingT?.next || 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {onboardingT?.start || 'Get Started'}
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
