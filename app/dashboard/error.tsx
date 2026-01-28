/**
 * 대시보드 에러 페이지
 *
 * Next.js App Router의 에러 바운더리로,
 * 대시보드 라우트에서 발생하는 에러를 처리합니다.
 */

'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  const { t } = useLanguage()

  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 에러 모니터링 서비스로 전송)
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      {/* 에러 아이콘 */}
      <div className="relative mb-6 animate-[bounce_0.6s_ease-out]">
        <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
          <AlertTriangle className="w-10 h-10 text-white" aria-hidden="true" />
        </div>
      </div>

      {/* 에러 메시지 */}
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {t.common.error}
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {t.common.errorDescription}
      </p>

      {/* 개발 환경에서만 에러 상세 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-8 w-full max-w-lg text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
            에러 상세 정보 (개발 모드)
          </summary>
          <div className="mt-2 p-4 bg-secondary/50 rounded-lg overflow-auto">
            <p className="text-xs text-red-400 font-mono mb-2">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
            {error.stack && (
              <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-auto">
                {error.stack}
              </pre>
            )}
          </div>
        </details>
      )}

      {/* 액션 버튼 */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {t.common.retry}
        </Button>
        <Button
          onClick={() => window.location.href = '/dashboard'}
          variant="outline"
          className="gap-2"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          {t.common.goHome}
        </Button>
      </div>
    </div>
  )
}
