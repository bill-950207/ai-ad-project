/**
 * 쇼케이스 레인 컴포넌트
 *
 * 히어로 섹션 배경에 쇼케이스 썸네일이 대각선으로 흐르는 효과
 *
 * 성능 최적화 v3:
 * - 서버에서 데이터 로드 (props로 전달받음)
 * - API 호출 제거 (클라이언트 fetch 0회)
 * - 열 수 감소: 5개 → 3개
 * - content-visibility: auto로 오프스크린 렌더링 최적화
 */

'use client'

import { useMemo } from 'react'

interface ShowcaseItem {
  id: string
  thumbnail_url: string
}

interface ShowcaseRainProps {
  showcases?: ShowcaseItem[]
}

// 열 설정 (3개)
const COLUMN_CONFIG = [
  { speed: 25, direction: 1 },   // 느림, 아래로
  { speed: 18, direction: -1 },  // 중간, 위로
  { speed: 22, direction: 1 },   // 중간, 아래로
]

// 각 열의 스켈레톤 카드 개수
const SKELETON_CARDS_PER_COLUMN = 4

// 스켈레톤 카드 컴포넌트
function SkeletonCard() {
  return (
    <div
      className="rounded-xl bg-secondary/20 flex-shrink-0"
      style={{ aspectRatio: '3/4' }}
    />
  )
}

// 개별 카드 컴포넌트
function RainCard({ url }: { url: string }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden flex-shrink-0"
      style={{
        aspectRatio: '3/4',
        contentVisibility: 'auto',
        containIntrinsicSize: '160px 213px',
      }}
    >
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover object-top"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-background/40" />
    </div>
  )
}

export function ShowcaseRain({ showcases = [] }: ShowcaseRainProps) {
  const isLoaded = showcases.length > 0

  // 열별로 쇼케이스 분배 (3열, 2배 복제)
  const columns = useMemo(() => {
    if (showcases.length === 0) return []

    const cols: string[][] = [[], [], []]
    showcases.forEach((item, index) => {
      cols[index % 3].push(item.thumbnail_url)
    })

    return cols.map(col => [...col, ...col])
  }, [showcases])

  // 스켈레톤 열 (2배 복제)
  const skeletonColumns = useMemo(() => {
    return COLUMN_CONFIG.map(() =>
      Array.from({ length: SKELETON_CARDS_PER_COLUMN * 2 }, (_, i) => i)
    )
  }, [])

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ contain: 'strict' }}
    >
      {/* 기울어진 컨테이너 */}
      <div
        className="absolute inset-0 flex gap-6 justify-center"
        style={{
          transform: 'rotate(-12deg) scale(1.3)',
          transformOrigin: 'center center',
        }}
      >
        {/* 스켈레톤 - 데이터 없을 때만 표시 */}
        {!isLoaded && (
          <>
            {skeletonColumns.map((column, colIndex) => (
              <div
                key={`skeleton-${colIndex}`}
                className="flex flex-col gap-4 w-[140px] sm:w-[160px] flex-shrink-0"
                style={{
                  animation: `showcase-flow-${COLUMN_CONFIG[colIndex].direction > 0 ? 'down' : 'up'} ${COLUMN_CONFIG[colIndex].speed}s linear infinite`,
                  willChange: 'transform',
                }}
              >
                {column.map((_, cardIndex) => (
                  <SkeletonCard key={cardIndex} />
                ))}
              </div>
            ))}
          </>
        )}

        {/* 실제 쇼케이스 */}
        {isLoaded && columns.map((column, colIndex) => (
          <div
            key={colIndex}
            className="flex flex-col gap-4 w-[140px] sm:w-[160px] flex-shrink-0"
            style={{
              animation: `showcase-flow-${COLUMN_CONFIG[colIndex].direction > 0 ? 'down' : 'up'} ${COLUMN_CONFIG[colIndex].speed}s linear infinite`,
              willChange: 'transform',
            }}
          >
            {column.map((url, itemIndex) => (
              <RainCard key={itemIndex} url={url} />
            ))}
          </div>
        ))}
      </div>

      {/* 통합 오버레이 */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 15%, transparent 85%, hsl(var(--background)) 100%),
            linear-gradient(to right, hsl(var(--background)) 0%, transparent 10%, transparent 90%, hsl(var(--background)) 100%),
            radial-gradient(ellipse 80% 70% at 50% 50%, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.5) 40%, transparent 70%)
          `,
        }}
      />
    </div>
  )
}
