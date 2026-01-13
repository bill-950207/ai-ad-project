'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

// 직책 옵션
const JOB_TITLES = [
  { value: 'ceo', label: '대표/CEO' },
  { value: 'marketer', label: '마케터' },
  { value: 'designer', label: '디자이너' },
  { value: 'developer', label: '개발자' },
  { value: 'pm', label: 'PM/기획자' },
  { value: 'freelancer', label: '프리랜서' },
  { value: 'student', label: '학생' },
  { value: 'other', label: '기타' },
]

// 업종 옵션
const INDUSTRIES = [
  { value: 'ecommerce', label: '이커머스/온라인쇼핑' },
  { value: 'beauty', label: '뷰티/화장품' },
  { value: 'fashion', label: '패션/의류' },
  { value: 'food', label: '식품/F&B' },
  { value: 'tech', label: 'IT/테크' },
  { value: 'health', label: '건강/헬스케어' },
  { value: 'education', label: '교육' },
  { value: 'finance', label: '금융/핀테크' },
  { value: 'agency', label: '광고/마케팅 에이전시' },
  { value: 'other', label: '기타' },
]

// 팀 규모 옵션
const TEAM_SIZES = [
  { value: '1', label: '1인 (개인)' },
  { value: '2-10', label: '2-10명' },
  { value: '11-50', label: '11-50명' },
  { value: '51-200', label: '51-200명' },
  { value: '201+', label: '200명 이상' },
]

// 유입 경로 옵션
const REFERRAL_SOURCES = [
  { value: 'search', label: '검색 (구글, 네이버 등)' },
  { value: 'sns', label: 'SNS (인스타그램, 유튜브 등)' },
  { value: 'friend', label: '지인 추천' },
  { value: 'ad', label: '온라인 광고' },
  { value: 'blog', label: '블로그/아티클' },
  { value: 'event', label: '행사/세미나' },
  { value: 'other', label: '기타' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

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
        throw new Error(data.error || '온보딩 완료에 실패했습니다')
      }

      // 대시보드로 이동
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
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
              <span className="text-sm text-muted-foreground">설정 진행중</span>
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
                  반갑습니다! 👋
                </h1>
                <p className="text-muted-foreground">
                  먼저 이름을 알려주세요.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  회사명 (선택)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="회사 또는 브랜드명"
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
                  {name}님의 역할은요?
                </h1>
                <p className="text-muted-foreground">
                  더 나은 서비스를 위해 알려주세요.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {JOB_TITLES.map((job) => (
                  <button
                    key={job.value}
                    onClick={() => setJobTitle(job.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      jobTitle === job.value
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {job.label}
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
                  어떤 분야에서 일하시나요?
                </h1>
                <p className="text-muted-foreground">
                  맞춤형 추천을 위해 알려주세요.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.value}
                    onClick={() => setIndustry(ind.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      industry === ind.value
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {ind.label}
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
                  거의 다 왔어요! 🎉
                </h1>
                <p className="text-muted-foreground">
                  마지막으로 몇 가지만 더 알려주세요. (선택)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  팀 규모
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZES.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setTeamSize(size.value)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        teamSize === size.value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  ADAI를 어떻게 알게 되셨나요?
                </label>
                <div className="flex flex-wrap gap-2">
                  {REFERRAL_SOURCES.map((source) => (
                    <button
                      key={source.value}
                      onClick={() => setReferralSource(source.value)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        referralSource === source.value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {source.label}
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
                이전
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                다음
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
                    시작하기
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
                  {step === 1 && '몇 가지 질문에 답해주세요'}
                  {step === 2 && '맞춤형 경험을 준비중이에요'}
                  {step === 3 && '거의 다 됐어요!'}
                  {step === 4 && '시작할 준비가 됐어요!'}
                </h3>
                <p className="text-muted-foreground">
                  {step === 1 && '더 나은 서비스 경험을 위해 간단한 설정을 진행합니다'}
                  {step === 2 && '역할에 맞는 기능을 추천해 드릴게요'}
                  {step === 3 && '업종에 맞는 템플릿을 준비해 드릴게요'}
                  {step === 4 && '5개의 무료 크레딧이 기다리고 있어요!'}
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
