'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

type OnboardingFormT = {
  settingUp?: string
  welcome?: string
  askName?: string
  name?: string
  namePlaceholder?: string
  companyOptional?: string
  companyPlaceholder?: string
  askRole?: string
  roleDescription?: string
  askIndustry?: string
  industryDescription?: string
  almostDone?: string
  finalQuestions?: string
  teamSize?: string
  howDidYouFind?: string
  onboardingFailed?: string
  genericError?: string
  prev?: string
  next?: string
  start?: string
  rightSide?: {
    step1Title?: string
    step1Desc?: string
    step2Title?: string
    step2Desc?: string
    step3Title?: string
    step3Desc?: string
    step4Title?: string
    step4Desc?: string
  }
  jobTitles?: Record<string, string>
  industries?: Record<string, string>
  teamSizes?: Record<string, string>
  referralSources?: Record<string, string>
}

// Job title options
const JOB_TITLE_VALUES = ['ceo', 'marketer', 'designer', 'developer', 'pm', 'freelancer', 'student', 'other']

// Industry options
const INDUSTRY_VALUES = ['ecommerce', 'beauty', 'fashion', 'food', 'tech', 'health', 'education', 'finance', 'agency', 'other']

// Team size options
const TEAM_SIZE_VALUES = ['1', '2-10', '11-50', '51-200', '201+']

// Referral source options
const REFERRAL_SOURCE_VALUES = ['search', 'sns', 'friend', 'ad', 'blog', 'event', 'other']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const formT = t.onboardingForm as OnboardingFormT | undefined

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
        throw new Error(data.error || formT?.onboardingFailed || 'Onboarding failed')
      }

      // 대시보드로 이동
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : (formT?.genericError || 'An error occurred'))
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
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-background">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">AD</span>
            </div>
            <span className="text-2xl font-bold text-foreground">ADAI</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{formT?.settingUp || 'Setting up'}</span>
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
                  {formT?.welcome || 'Welcome! 👋'}
                </h1>
                <p className="text-muted-foreground">
                  {formT?.askName || 'First, tell us your name.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {formT?.name || 'Name'} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={formT?.namePlaceholder || 'John Doe'}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {formT?.companyOptional || 'Company (Optional)'}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={formT?.companyPlaceholder || 'Company or brand name'}
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
                  {(formT?.askRole || "What's your role, {{name}}?").replace('{{name}}', name)}
                </h1>
                <p className="text-muted-foreground">
                  {formT?.roleDescription || 'Help us serve you better.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {JOB_TITLE_VALUES.map((jobValue) => (
                  <button
                    key={jobValue}
                    onClick={() => setJobTitle(jobValue)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      jobTitle === jobValue
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {formT?.jobTitles?.[jobValue] || jobValue}
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
                  {formT?.askIndustry || 'What industry are you in?'}
                </h1>
                <p className="text-muted-foreground">
                  {formT?.industryDescription || 'For personalized recommendations.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {INDUSTRY_VALUES.map((indValue) => (
                  <button
                    key={indValue}
                    onClick={() => setIndustry(indValue)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      industry === indValue
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {formT?.industries?.[indValue] || indValue}
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
                  {formT?.almostDone || 'Almost done! 🎉'}
                </h1>
                <p className="text-muted-foreground">
                  {formT?.finalQuestions || 'Just a few more questions. (Optional)'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {formT?.teamSize || 'Team Size'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZE_VALUES.map((sizeValue) => (
                    <button
                      key={sizeValue}
                      onClick={() => setTeamSize(sizeValue)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        teamSize === sizeValue
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {formT?.teamSizes?.[sizeValue] || sizeValue}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {formT?.howDidYouFind || 'How did you find ADAI?'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {REFERRAL_SOURCE_VALUES.map((sourceValue) => (
                    <button
                      key={sourceValue}
                      onClick={() => setReferralSource(sourceValue)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        referralSource === sourceValue
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {formT?.referralSources?.[sourceValue] || sourceValue}
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
                {formT?.prev || 'Previous'}
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                {formT?.next || 'Next'}
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
                    {formT?.start || 'Get Started'}
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Decoration */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-primary/20 to-purple-900/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 z-10" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center z-20 max-w-lg px-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm border border-primary/30">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {step === 1 && (formT?.rightSide?.step1Title || 'Answer a few questions')}
                  {step === 2 && (formT?.rightSide?.step2Title || 'Preparing your personalized experience')}
                  {step === 3 && (formT?.rightSide?.step3Title || 'Almost there!')}
                  {step === 4 && (formT?.rightSide?.step4Title || 'Ready to go!')}
                </h3>
                <p className="text-muted-foreground">
                  {step === 1 && (formT?.rightSide?.step1Desc || 'Quick setup for a better experience')}
                  {step === 2 && (formT?.rightSide?.step2Desc || "We'll recommend features suited to your role")}
                  {step === 3 && (formT?.rightSide?.step3Desc || "We'll prepare templates for your industry")}
                  {step === 4 && (formT?.rightSide?.step4Desc || '5 free credits are waiting for you!')}
                </p>
              </div>
            </div>

            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
        </div>
      </div>
    </div>
  )
}
