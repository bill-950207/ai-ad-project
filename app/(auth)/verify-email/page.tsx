'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Send, ArrowLeft, CheckCircle } from 'lucide-react'
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
    sendVerificationEmail?: string
    verifyEmailRequired?: string
    verifyEmailDescription?: string
  }
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendEmail = async () => {
    if (!email) {
      setError(authT.emailNotFound || 'Email not found')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setEmailSent(true)
      }
    } catch {
      setError(authT.emailSendFailed || 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          {/* 아이콘 */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            {emailSent ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <Mail className="w-10 h-10 text-primary" />
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {emailSent
              ? (authT.verifyEmailTitle || 'Check your email')
              : (authT.verifyEmailRequired || 'Email verification required')
            }
          </h1>

          {/* 이메일 주소 */}
          {email && (
            <p className="text-sm text-primary font-medium mb-4">
              {email}
            </p>
          )}

          {/* 설명 */}
          <p className="text-sm text-muted-foreground mb-8">
            {emailSent
              ? (authT.verifyEmailCheck || 'Please check your inbox and click the verification link.')
              : (authT.verifyEmailDescription || 'Click the button below to receive a verification email.')
            }
          </p>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 이메일 보내기/재발송 버튼 */}
          <button
            onClick={handleSendEmail}
            disabled={isSending || !email}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isSending ? (
              <>
                <Send className="w-4 h-4 animate-pulse" />
                {authT.sending || 'Sending...'}
              </>
            ) : emailSent ? (
              <>
                <Send className="w-4 h-4" />
                {authT.resendEmail || 'Resend email'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {authT.sendVerificationEmail || 'Send verification email'}
              </>
            )}
          </button>

          {/* 다른 이메일로 가입 */}
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {authT.signupWithDifferentEmail || 'Sign up with different email'}
          </Link>
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            {authT.verifyEmailNote || 'Check your spam folder if you don\'t see the email.'}
          </p>
        </div>
      </div>
    </div>
  )
}
