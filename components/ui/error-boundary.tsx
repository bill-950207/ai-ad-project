/**
 * Error Boundary 컴포넌트
 *
 * React 컴포넌트 트리에서 발생하는 JavaScript 에러를 캐치하고
 * 폴백 UI를 표시합니다.
 *
 * 주요 기능:
 * - 하위 컴포넌트 에러 캐치
 * - 다국어 지원 에러 메시지
 * - 재시도 및 뒤로가기 옵션
 * - 에러 로깅 (개발 환경)
 */

'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react'
import { Button } from './button'

// ============================================================
// 타입 정의
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode
  /** 폴백 UI를 커스텀할 경우 사용 */
  fallback?: ReactNode
  /** 에러 발생 시 콜백 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** 재시도 버튼 표시 여부 */
  showRetry?: boolean
  /** 뒤로가기 버튼 표시 여부 */
  showGoBack?: boolean
  /** 홈으로 버튼 표시 여부 */
  showGoHome?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ============================================================
// 기본 에러 UI 컴포넌트
// ============================================================

interface DefaultErrorFallbackProps {
  error: Error | null
  onRetry: () => void
  showRetry: boolean
  showGoBack: boolean
  showGoHome: boolean
}

function DefaultErrorFallback({
  error,
  onRetry,
  showRetry,
  showGoBack,
  showGoHome,
}: DefaultErrorFallbackProps) {
  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      {/* 에러 아이콘 */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
          <AlertTriangle className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
      </div>

      {/* 에러 메시지 */}
      <h2 className="text-xl font-bold text-foreground mb-2">
        오류가 발생했습니다
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        예기치 않은 문제가 발생했습니다. 다시 시도해 주세요.
      </p>

      {/* 개발 환경에서만 에러 상세 표시 */}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-6 w-full max-w-lg text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
            에러 상세 정보 (개발 모드)
          </summary>
          <pre className="mt-2 p-4 bg-secondary/50 rounded-lg text-xs text-red-400 overflow-auto max-h-40">
            {error.message}
            {error.stack && (
              <>
                {'\n\n'}
                {error.stack}
              </>
            )}
          </pre>
        </details>
      )}

      {/* 액션 버튼 */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {showRetry && (
          <Button onClick={onRetry} variant="default" className="gap-2">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            다시 시도
          </Button>
        )}
        {showGoBack && (
          <Button onClick={handleGoBack} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            뒤로 가기
          </Button>
        )}
        {showGoHome && (
          <Button onClick={handleGoHome} variant="ghost" className="gap-2">
            <Home className="w-4 h-4" aria-hidden="true" />
            홈으로
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Error Boundary 클래스 컴포넌트
// ============================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // 커스텀 에러 핸들러 호출
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    const {
      children,
      fallback,
      showRetry = true,
      showGoBack = true,
      showGoHome = true,
    } = this.props
    const { hasError, error } = this.state

    if (hasError) {
      // 커스텀 폴백이 있으면 사용
      if (fallback) {
        return fallback
      }

      // 기본 에러 UI
      return (
        <DefaultErrorFallback
          error={error}
          onRetry={this.handleRetry}
          showRetry={showRetry}
          showGoBack={showGoBack}
          showGoHome={showGoHome}
        />
      )
    }

    return children
  }
}

// ============================================================
// 편의 훅: 에러 바운더리 리셋 트리거
// ============================================================

/**
 * 에러 바운더리를 리셋하는 래퍼 컴포넌트
 * 특정 키가 변경되면 에러 상태를 리셋합니다.
 */
interface ErrorBoundaryWithResetProps extends ErrorBoundaryProps {
  resetKey?: string | number
}

export function ErrorBoundaryWithReset({
  resetKey,
  ...props
}: ErrorBoundaryWithResetProps) {
  return <ErrorBoundary key={resetKey} {...props} />
}
