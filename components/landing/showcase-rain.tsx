/**
 * 쇼케이스 레인 컴포넌트
 *
 * 히어로 섹션 배경에 쇼케이스 썸네일이 대각선으로 흐르는 효과
 *
 * 성능 최적화 v8:
 * - 썸네일 이미지는 바로 표시
 * - 영상만 1초 후 재생 (LCP 개선)
 * - next/image로 자동 WebP 변환
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

/** 영상 재생 지연 시간 (ms) */
const VIDEO_PLAY_DELAY = 1000

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
      className="rounded-xl bg-gray-300 dark:bg-gray-700 flex-shrink-0"
      style={{
        aspectRatio: '3/4',
        backfaceVisibility: 'hidden',
      }}
    />
  )
}

// 개별 카드 컴포넌트 - 이미지 또는 영상
function RainCard({ item, canPlayVideo }: { item: ShowcaseItem; canPlayVideo: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const isVideo = item.type === 'video' && item.media_url

  return (
    <div
      className="relative rounded-xl overflow-hidden flex-shrink-0 bg-gray-300 dark:bg-gray-700"
      style={{
        aspectRatio: '3/4',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0,0,0)',
      }}
    >
      {/* 썸네일 이미지 (항상 표시) */}
      <Image
        src={item.thumbnail_url}
        alt=""
        fill
        sizes="180px"
        className="object-cover object-top"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
      {/* 영상인 경우 비디오 오버레이 (지연 후 재생) */}
      {isVideo && canPlayVideo && (
        <video
          src={item.media_url!}
          className="absolute inset-0 w-full h-full object-cover object-top"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      <div
        className="absolute inset-0 bg-background/40"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      />
    </div>
  )
}

export function ShowcaseRain({ showcases = [] }: ShowcaseRainProps) {
  // 영상 재생 지연 상태 - 썸네일은 바로 보이고, 영상만 1초 후 재생
  const [canPlayVideo, setCanPlayVideo] = useState(false)

  // 1초 후 영상 재생 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanPlayVideo(true)
    }, VIDEO_PLAY_DELAY)

    return () => clearTimeout(timer)
  }, [])

  const hasData = showcases.length > 0

  // 열별로 쇼케이스 분배 (4열, 2배 복제로 무한 스크롤 효과)
  const columns = useMemo(() => {
    if (showcases.length === 0) return []

    const cols: ShowcaseItem[][] = [[], [], [], []]
    showcases.forEach((item, index) => {
      cols[index % 4].push(item)
    })

    // 2배 복제로 끊김 없는 애니메이션
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
        {!hasData && (
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

        {/* 실제 쇼케이스 - 바로 표시 */}
        {hasData && columns.map((column, colIndex) => (
          <div
            key={colIndex}
            className="flex flex-col gap-5 w-[150px] sm:w-[180px] flex-shrink-0 animate-fade-in"
            style={{
              animation: `showcase-flow-${COLUMN_CONFIG[colIndex].direction > 0 ? 'down' : 'up'} ${COLUMN_CONFIG[colIndex].speed}s linear infinite, fade-in 0.6s ease-out ${colIndex * 0.1}s both`,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          >
            {column.map((item, itemIndex) => (
              <RainCard
                key={`${item.id}-${itemIndex}`}
                item={item}
                canPlayVideo={canPlayVideo}
              />
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
