'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect, useState } from 'react'

// Fallback translations for global error (can't use context here)
const errorTranslations: Record<string, { title: string; description: string; retry: string }> = {
  ko: {
    title: '문제가 발생했습니다',
    description: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    retry: '다시 시도'
  },
  en: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again later.',
    retry: 'Try again'
  },
  ja: {
    title: '問題が発生しました',
    description: '予期しないエラーが発生しました。しばらくしてからもう一度お試しください。',
    retry: 'もう一度試す'
  },
  zh: {
    title: '出现问题',
    description: '发生了意外错误。请稍后重试。',
    retry: '重试'
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [lang, setLang] = useState('en')

  useEffect(() => {
    Sentry.captureException(error)
    // Try to get language from localStorage
    const savedLang = typeof window !== 'undefined' ? localStorage.getItem('adai-language') : null
    if (savedLang && errorTranslations[savedLang]) {
      setLang(savedLang)
    }
  }, [error])

  const t = errorTranslations[lang] || errorTranslations.en

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">{t.title}</h2>
            <p className="text-muted-foreground mb-6">
              {t.description}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              {t.retry}
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
