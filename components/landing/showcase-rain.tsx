/**
 * 쇼케이스 레인 컴포넌트
 *
 * 히어로 섹션 배경에 쇼케이스 썸네일이 대각선으로 흐르는 효과
 *
 * 성능 최적화 v2:
 * - 열 수 감소: 5개 → 3개 (애니메이션 60% 감소)
 * - 아이템 수 감소: 25개 → 12개 (이미지 8 + 영상 4)
 * - 스켈레톤 로드 후 완전 언마운트 (GPU 메모리 해제)
 * - content-visibility: auto로 오프스크린 렌더링 최적화
 * - 그라데이션 오버레이 통합 (5개 → 1개)
 */

'use client'

import { useEffect, useState, useMemo } from 'react'

interface ShowcaseItem {
  id: string
  thumbnail_url: string
}

// 열 설정 (3개로 감소)
const COLUMN_CONFIG = [
  { speed: 25, direction: 1 },   // 느림, 아래로
  { speed: 18, direction: -1 },  // 중간, 위로
  { speed: 22, direction: 1 },   // 중간, 아래로
]

// 각 열의 스켈레톤 카드 개수
const SKELETON_CARDS_PER_COLUMN = 4

// 스켈레톤 카드 컴포넌트 (단순화)
function SkeletonCard() {
  return (
    <div
      className="rounded-xl bg-secondary/20 flex-shrink-0"
      style={{ aspectRatio: '3/4' }}
    />
  )
}

// 개별 카드 컴포넌트 (최소화)
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

export function ShowcaseRain() {
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // 쇼케이스 데이터 로드 (이미지 + 영상)
  useEffect(() => {
    const fetchShowcases = async () => {
      try {
        const [imageRes, videoRes] = await Promise.all([
          fetch('/api/showcases?type=image&limit=8&random=true'),
          fetch('/api/showcases?type=video&limit=4&random=true'),
        ])

        const imageData = imageRes.ok ? await imageRes.json() : { showcases: [] }
        const videoData = videoRes.ok ? await videoRes.json() : { showcases: [] }

        const combined = [
          ...(imageData.showcases || []),
          ...(videoData.showcases || []),
        ]

        if (combined.length > 0) {
          setShowcases(combined)
          setIsLoaded(true)
        }
      } catch (error) {
        console.error('쇼케이스 로드 오류:', error)
      }
    }
    fetchShowcases()
  }, [])

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
        {/* 스켈레톤 - 로드 후 완전 언마운트 */}
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

      {/* 통합 오버레이 (기존 5개 → 1개) */}
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
