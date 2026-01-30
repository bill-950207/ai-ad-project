/**
 * 쇼케이스 레인 컴포넌트
 *
 * 히어로 섹션 배경에 쇼케이스 썸네일이 대각선으로 흐르는 효과
 *
 * 성능 최적화 v6:
 * - 영상 자동 재생 (muted, loop, playsInline)
 * - 이미지 작은 크기로 렌더링 (width/height 명시)
 * - 카드 크기 증가로 DOM 요소 감소
 */

'use client'

import { useMemo } from 'react'

interface ShowcaseItem {
  id: string
  type: 'image' | 'video'
  thumbnail_url: string
  media_url: string | null
}

interface ShowcaseRainProps {
  showcases?: ShowcaseItem[]
}

// 열 설정 (4개) - 속도 느리게 조정
const COLUMN_CONFIG = [
  { speed: 35, direction: 1 },
  { speed: 28, direction: -1 },
  { speed: 40, direction: 1 },
  { speed: 32, direction: -1 },
]

// 각 열의 스켈레톤 카드 개수
const SKELETON_CARDS_PER_COLUMN = 3

// 스켈레톤 카드 컴포넌트
function SkeletonCard() {
  return (
    <div
      className="rounded-xl bg-secondary/20 flex-shrink-0"
      style={{
        aspectRatio: '3/4',
        backfaceVisibility: 'hidden',
      }}
    />
  )
}

// 개별 카드 컴포넌트 - 이미지 또는 영상
function RainCard({ item }: { item: ShowcaseItem }) {
  const isVideo = item.type === 'video' && item.media_url

  return (
    <div
      className="relative rounded-xl overflow-hidden flex-shrink-0"
      style={{
        aspectRatio: '3/4',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0,0,0)',
      }}
    >
      {isVideo ? (
        <video
          src={item.media_url!}
          poster={item.thumbnail_url}
          className="w-full h-full object-cover object-top"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          src={item.thumbnail_url}
          alt=""
          width={120}
          height={160}
          className="w-full h-full object-cover object-top"
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  )
}

export function ShowcaseRain({ showcases = [] }: ShowcaseRainProps) {
  const isLoaded = showcases.length > 0

  // 열별로 쇼케이스 분배 (4열, 2배 복제)
  const columns = useMemo(() => {
    if (showcases.length === 0) return []

    const cols: ShowcaseItem[][] = [[], [], [], []]
    showcases.forEach((item, index) => {
      cols[index % 4].push(item)
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
        className="absolute inset-0 flex gap-5 justify-center"
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
                className="flex flex-col gap-5 w-[150px] sm:w-[180px] flex-shrink-0"
                style={{
                  animation: `showcase-flow-${COLUMN_CONFIG[colIndex].direction > 0 ? 'down' : 'up'} ${COLUMN_CONFIG[colIndex].speed}s linear infinite`,
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
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
            className="flex flex-col gap-5 w-[150px] sm:w-[180px] flex-shrink-0"
            style={{
              animation: `showcase-flow-${COLUMN_CONFIG[colIndex].direction > 0 ? 'down' : 'up'} ${COLUMN_CONFIG[colIndex].speed}s linear infinite`,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          >
            {column.map((item, itemIndex) => (
              <RainCard key={`${item.id}-${itemIndex}`} item={item} />
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
