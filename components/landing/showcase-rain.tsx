/**
 * 쇼케이스 레인 컴포넌트
 *
 * 히어로 섹션 배경에 쇼케이스 이미지/영상이 대각선으로 흐르는 효과
 * - API에서 쇼케이스 데이터 로드
 * - 여러 열로 구성, 각 열 다른 속도로 흐름
 * - 대각선(기울어진) 방향으로 애니메이션
 * - 영상은 화면에 보일 때 자동 재생
 */

'use client'

import { useEffect, useState, useMemo, useRef } from 'react'

interface ShowcaseItem {
  id: string
  thumbnail_url: string
  media_url: string | null
  type: 'image' | 'video'
}

// 열 설정 (속도, 방향)
const COLUMN_CONFIG = [
  { speed: 25, direction: 1 },   // 느림, 아래로
  { speed: 18, direction: -1 },  // 중간, 위로
  { speed: 30, direction: 1 },   // 아주 느림, 아래로
  { speed: 22, direction: -1 },  // 중간, 위로
  { speed: 15, direction: 1 },   // 빠름, 아래로
]

// 각 열의 스켈레톤 카드 개수
const SKELETON_CARDS_PER_COLUMN = 6

// 스켈레톤 카드 컴포넌트
function SkeletonCard() {
  return (
    <div
      className="relative rounded-xl overflow-hidden bg-secondary/30 flex-shrink-0 animate-pulse"
      style={{ aspectRatio: '3/4' }}
    >
      {/* 그라데이션 shimmer 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-secondary/40 to-secondary/20" />
      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  )
}

// 개별 카드 컴포넌트 (영상 자동 재생 지원)
function RainCard({ item }: { item: ShowcaseItem }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // IntersectionObserver로 가시성 감지
  useEffect(() => {
    if (item.type !== 'video' || !item.media_url) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting)
        })
      },
      { threshold: 0.2 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [item.type, item.media_url])

  // 재생 상태 관리
  useEffect(() => {
    if (!videoRef.current || item.type !== 'video') return

    if (isVisible) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isVisible, item.type])

  return (
    <div
      ref={cardRef}
      className="relative rounded-xl overflow-hidden bg-secondary/30 flex-shrink-0"
      style={{ aspectRatio: '3/4' }}
    >
      {/* 썸네일 이미지 (영상일 때는 폴백) */}
      <img
        src={item.thumbnail_url}
        alt=""
        className="w-full h-full object-cover object-top"
        loading="lazy"
      />

      {/* 영상 오버레이 */}
      {item.type === 'video' && item.media_url && (
        <video
          ref={videoRef}
          src={item.media_url}
          className="absolute inset-0 w-full h-full object-cover object-top"
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}

      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  )
}

export function ShowcaseRain() {
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // 쇼케이스 데이터 로드
  useEffect(() => {
    const fetchShowcases = async () => {
      try {
        const [imageRes, videoRes] = await Promise.all([
          fetch('/api/showcases?type=image&limit=15&random=true'),
          fetch('/api/showcases?type=video&limit=10&random=true'),
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

  // 열별로 쇼케이스 분배
  const columns = useMemo(() => {
    if (showcases.length === 0) return []

    const cols: ShowcaseItem[][] = Array.from({ length: 5 }, () => [])

    // 각 열에 아이템 분배 (순환)
    showcases.forEach((item, index) => {
      const colIndex = index % 5
      cols[colIndex].push(item)
    })

    // 각 열의 아이템을 3배로 복제 (끊김 없는 무한 스크롤)
    return cols.map(col => [...col, ...col, ...col])
  }, [showcases])

  // 스켈레톤 열 생성 (로딩 중 표시)
  const skeletonColumns = useMemo(() => {
    return COLUMN_CONFIG.map(() =>
      // 3배 복제하여 무한 스크롤 효과
      Array.from({ length: SKELETON_CARDS_PER_COLUMN * 3 }, (_, i) => i)
    )
  }, [])

  const showSkeleton = !isLoaded || showcases.length === 0

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 기울어진 컨테이너 */}
      <div
        className="absolute inset-0 flex gap-4 justify-center"
        style={{
          transform: 'rotate(-12deg) scale(1.3)',
          transformOrigin: 'center center',
        }}
      >
        {/* 스켈레톤 레인 - 로딩 중 표시, 로드 후 페이드아웃 */}
        <div
          className="absolute inset-0 flex gap-4 justify-center"
          style={{
            opacity: showSkeleton ? 1 : 0,
            transition: 'opacity 500ms ease-out',
            pointerEvents: showSkeleton ? 'auto' : 'none',
          }}
        >
          {skeletonColumns.map((column, colIndex) => (
            <div
              key={`skeleton-${colIndex}`}
              className="flex flex-col gap-4 w-[140px] sm:w-[160px] flex-shrink-0"
              style={{
                animation: `showcase-flow-${COLUMN_CONFIG[colIndex].direction > 0 ? 'down' : 'up'} ${COLUMN_CONFIG[colIndex].speed}s linear infinite`,
              }}
            >
              {column.map((_, cardIndex) => (
                <SkeletonCard key={`skeleton-${colIndex}-${cardIndex}`} />
              ))}
            </div>
          ))}
        </div>

        {/* 실제 쇼케이스 레인 - 로드 후 페이드인 */}
        <div
          className="absolute inset-0 flex gap-4 justify-center"
          style={{
            opacity: showSkeleton ? 0 : 1,
            transition: 'opacity 500ms ease-in',
          }}
        >
          {columns.map((column, colIndex) => (
            <div
              key={colIndex}
              className="flex flex-col gap-4 w-[140px] sm:w-[160px] flex-shrink-0"
              style={{
                animation: `showcase-flow-${COLUMN_CONFIG[colIndex].direction > 0 ? 'down' : 'up'} ${COLUMN_CONFIG[colIndex].speed}s linear infinite`,
              }}
            >
              {column.map((item, itemIndex) => (
                <RainCard key={`${item.id}-${itemIndex}`} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 상단 페이드 */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent z-10" />

      {/* 하단 페이드 */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />

      {/* 좌측 페이드 */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />

      {/* 우측 페이드 */}
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      {/* 중앙 콘텐츠 영역 - 부드러운 원형 그라데이션 */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.5) 40%, transparent 70%)',
        }}
      />
    </div>
  )
}
