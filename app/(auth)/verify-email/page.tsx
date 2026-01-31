'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/language-context'

export default function VerifyEmailPage() {
  const { t } = useLanguage()
  const authT = t.auth as {
    emailNotFound: string
    emailSendFailed: string
    verifyEmailTitle: string
    verifyEmailSent: string
    verifyEmailCheck: string
    verifyEmailNotReceived: string
    sending: string
    resendEmail: string
    signupWithDifferentEmail: string
    verifyEmailNote: string
  }
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    if (!email) {
      setError(authT.emailNotFound)
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
      setError(authT.emailSendFailed)
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
            {authT.verifyEmailTitle}
          </h1>

          {/* 설명 */}
          <p className="text-muted-foreground mb-2">
            {authT.verifyEmailSent}
          </p>
          {email && (
            <p className="text-sm text-primary font-medium mb-6">
              {email}
            </p>
          )}
          <p className="text-sm text-muted-foreground mb-8">
            {authT.verifyEmailCheck}
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
              {authT.verifyEmailSent}
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
                {authT.sending}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {authT.resendEmail}
              </>
            )}
          </button>

          {/* 다른 이메일로 가입 */}
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {authT.signupWithDifferentEmail}
          </Link>
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            {authT.verifyEmailNote}
          </p>
        </div>
      </div>
    </div>
  )
}
