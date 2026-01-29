'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/language-context'

export default function VerifyEmailPage() {
  const { language } = useLanguage()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    if (!email) {
      setError(language === 'ko' ? '이메일 정보가 없습니다.' : 'Email information not found.')
      return
    }

    setIsResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setError(error.message)
      } else {
        setResendSuccess(true)
      }
    } catch {
      setError(language === 'ko' ? '이메일 발송에 실패했습니다.' : 'Failed to send email.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          {/* 아이콘 */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {language === 'ko' ? '이메일 인증이 필요합니다' : 'Email Verification Required'}
          </h1>

          {/* 설명 */}
          <p className="text-muted-foreground mb-2">
            {language === 'ko'
              ? '입력하신 이메일로 인증 링크를 발송했습니다.'
              : 'We sent a verification link to your email.'}
          </p>
          {email && (
            <p className="text-sm text-primary font-medium mb-6">
              {email}
            </p>
          )}
          <p className="text-sm text-muted-foreground mb-8">
            {language === 'ko'
              ? '이메일을 확인하고 링크를 클릭하여 가입을 완료해주세요.'
              : 'Please check your email and click the link to complete registration.'}
          </p>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {resendSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
              {language === 'ko'
                ? '인증 이메일을 다시 발송했습니다.'
                : 'Verification email has been resent.'}
            </div>
          )}

          {/* 재발송 버튼 */}
          <button
            onClick={handleResendEmail}
            disabled={isResending || !email}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {language === 'ko' ? '발송 중...' : 'Sending...'}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {language === 'ko' ? '인증 이메일 재발송' : 'Resend Verification Email'}
              </>
            )}
          </button>

          {/* 다른 이메일로 가입 */}
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ko' ? '다른 이메일로 가입하기' : 'Sign up with different email'}
          </Link>
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            {language === 'ko'
              ? '이메일이 도착하지 않나요? 스팸 폴더를 확인해주세요.'
              : "Didn't receive the email? Check your spam folder."}
          </p>
        </div>
      </div>
    </div>
  )
}
