/**
 * GridSkeleton 컴포넌트
 *
 * 대시보드 페이지의 초기 로딩 시 표시되는 통일된 스켈레톤 UI
 */

interface GridSkeletonProps {
  /** 스켈레톤 개수 (기본값: 8) */
  count?: number
  /** 반응형 컬럼 설정 */
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  /** aspect ratio (기본값: square) */
  aspectRatio?: 'square' | 'video'
}

export function GridSkeleton({
  count = 8,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  aspectRatio = 'square',
}: GridSkeletonProps) {
  const getGridColsClass = () => {
    const classes = []
    if (columns.default) classes.push(`grid-cols-${columns.default}`)
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`)
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
    return classes.join(' ')
  }

  const aspectClass = aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'

  return (
    <div className={`grid ${getGridColsClass()} gap-5`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`${aspectClass} bg-gradient-to-br from-card to-secondary/30 rounded-2xl animate-pulse border border-border/50`}
        />
      ))}
    </div>
  )
}
