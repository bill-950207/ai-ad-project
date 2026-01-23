'use client'

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardNavigationButtonProps {
  direction: 'next' | 'prev'
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  show?: boolean  // 버튼 표시 여부 (애니메이션용)
  label?: string
  className?: string
}

export function WizardNavigationButton({
  direction,
  onClick,
  disabled = false,
  loading = false,
  show = true,
  label,
  className,
}: WizardNavigationButtonProps) {
  const isNext = direction === 'next'
  const defaultLabel = isNext ? '다음' : '이전'

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading || !show}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ease-out',
        isNext
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // 애니메이션: show가 true가 되면 아래에서 올라옴
        show
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isNext ? '저장 중...' : '로딩 중...'}
        </>
      ) : (
        <>
          {!isNext && <ArrowLeft className="w-4 h-4" />}
          {label || defaultLabel}
          {isNext && <ArrowRight className="w-4 h-4" />}
        </>
      )}
    </button>
  )
}

interface WizardNavigationProps {
  onPrev?: () => void
  onNext?: () => void
  canProceed?: boolean
  loading?: boolean
  showNext?: boolean  // 다음 버튼 표시 조건
  showPrev?: boolean  // 이전 버튼 표시
  nextLabel?: string
  prevLabel?: string
  className?: string
}

export function WizardNavigation({
  onPrev,
  onNext,
  canProceed = true,
  loading = false,
  showNext = true,
  showPrev = true,
  nextLabel,
  prevLabel,
  className,
}: WizardNavigationProps) {
  return (
    <div
      className={cn(
        'flex gap-3 mt-6 transition-all duration-300',
        // 컨테이너도 다음 버튼이 보일 때만 높이 확보
        showNext ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden',
        className
      )}
    >
      {showPrev && onPrev && (
        <WizardNavigationButton
          direction="prev"
          onClick={onPrev}
          show={showPrev}
          label={prevLabel}
          className="flex-1"
        />
      )}
      {onNext && (
        <WizardNavigationButton
          direction="next"
          onClick={onNext}
          disabled={!canProceed}
          loading={loading}
          show={showNext}
          label={nextLabel}
          className="flex-1"
        />
      )}
    </div>
  )
}
