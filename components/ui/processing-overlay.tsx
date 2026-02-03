/**
 * ProcessingOverlay 컴포넌트
 *
 * 개별 카드 내부에 처리 중 상태를 표시하는 통일된 오버레이 UI
 */

import { Loader2 } from 'lucide-react'

interface ProcessingOverlayProps {
  /** 상태 메시지 (optional) */
  statusText?: string
  /** 사이즈 (기본값: md) */
  size?: 'sm' | 'md' | 'lg'
}

export function ProcessingOverlay({
  statusText,
  size = 'md',
}: ProcessingOverlayProps) {
  const sizeConfig = {
    sm: {
      icon: 'w-6 h-6',
      blur: 'blur-lg',
      text: 'text-xs mt-2',
    },
    md: {
      icon: 'w-10 h-10',
      blur: 'blur-xl',
      text: 'text-sm mt-3',
    },
    lg: {
      icon: 'w-14 h-14',
      blur: 'blur-2xl',
      text: 'text-base mt-4',
    },
  }

  const config = sizeConfig[size]

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="relative">
        <div className={`absolute inset-0 bg-primary/20 rounded-full ${config.blur} animate-pulse`} />
        <Loader2 className={`${config.icon} text-primary animate-spin relative`} />
      </div>
      {statusText && (
        <span className={`${config.text} text-muted-foreground`}>{statusText}</span>
      )}
    </div>
  )
}
