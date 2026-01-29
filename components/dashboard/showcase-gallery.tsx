/**
 * 쇼케이스 갤러리 컴포넌트
 *
 * 데이터베이스에서 예시 광고를 불러와 표시합니다.
 * - 이미지와 영상 광고를 혼합하여 표시
 * - 무한 스크롤 지원
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Loader2, Volume2, VolumeX } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useOnboarding } from '@/components/onboarding/onboarding-context'

// ============================================================
// 타입 정의
// ============================================================

interface ShowcaseItem {
  id: string
  type: 'image' | 'video'
  title: string
  description: string | null
  thumbnail_url: string
  media_url: string | null
  ad_type: string | null
  category: string | null
}

// 페이지당 아이템 수
const ITEMS_PER_PAGE = 16 // 인터리브 시 균등 분배를 위해 짝수

// ad_type 번역 키 매핑
const AD_TYPE_TRANSLATION_KEY: Record<string, string> = {
  productOnly: 'productOnly',
  holding: 'holding',
  using: 'using',
  wearing: 'wearing',
  beforeAfter: 'beforeAfter',
  lifestyle: 'lifestyle',
  unboxing: 'unboxing',
  comparison: 'comparison',
  seasonal: 'seasonal',
  productDescription: 'productDescription',
  productAd: 'productAd',
}

// 비디오 광고 타입 폴백 번역
const VIDEO_AD_TYPE_FALLBACK: Record<string, Record<string, string>> = {
  productDescription: {
    ko: '제품 설명 영상',
    en: 'Product Description',
    ja: '商品説明動画',
    zh: '产品说明视频',
  },
  productAd: {
    ko: '제품 광고 영상',
    en: 'Product Ad',
    ja: '商品広告動画',
    zh: '产品广告视频',
  },
}

// ============================================================
// 개별 쇼케이스 카드 컴포넌트
// ============================================================

interface ShowcaseCardProps {
  item: ShowcaseItem
  onClick: () => void
  getAdTypeLabel: (adType: string | null) => string
}

function ShowcaseCard({ item, onClick, getAdTypeLabel }: ShowcaseCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLButtonElement>(null)

  // Intersection Observer로 화면에 보일 때 자동 재생 (모바일 지원)
  useEffect(() => {
    if (item.type !== 'video' || !item.media_url) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play().catch(() => {})
            setIsPlaying(true)
          } else if (videoRef.current) {
            videoRef.current.pause()
            setIsPlaying(false)
            // 화면 밖으로 나가면 음소거로 초기화
            setIsMuted(true)
            videoRef.current.muted = true
          }
        })
      },
      { threshold: 0.5 } // 50% 이상 보일 때 재생
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [item.type, item.media_url])

  // 소리 토글
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation() // 카드 클릭 이벤트 전파 방지
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary/30 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform duration-300 hover:scale-[1.02]"
    >
      {/* 썸네일 이미지 (비디오 재생 중이면 숨김) */}
      <img
        src={item.thumbnail_url}
        alt={item.title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${item.type === 'video' && isPlaying ? 'opacity-0' : ''}`}
        onLoad={() => setImageLoaded(true)}
      />

      {/* 비디오 (화면에 보이면 자동 재생) */}
      {item.type === 'video' && item.media_url && (
        <video
          ref={videoRef}
          src={item.media_url}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
        />
      )}

      {/* 로딩 스켈레톤 */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-secondary/50 animate-pulse" />
      )}

      {/* 비디오: 재생 중이면 소리 토글 버튼, 아니면 재생 아이콘 */}
      {item.type === 'video' && (
        <>
          {/* 재생 아이콘 (재생 중이 아닐 때) */}
          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
            isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
          {/* 소리 토글 버튼 (재생 중일 때) */}
          <button
            onClick={handleToggleMute}
            className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-black/70 ${
              isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3 text-white" />
            ) : (
              <Volume2 className="w-3 h-3 text-white" />
            )}
          </button>
        </>
      )}

      {/* 하단 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* 호버 시 전체 오버레이 */}
      <div className={`absolute inset-0 bg-primary/20 transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* 콘텐츠 */}
      <div className="absolute inset-0 p-3 flex flex-col justify-between">
        {/* 상단: 광고 유형 */}
        <div className="flex items-start">
          {item.ad_type && (
            <span className="px-2 py-1 rounded-lg bg-primary/30 backdrop-blur-sm text-xs font-semibold text-white">
              {getAdTypeLabel(item.ad_type)}
            </span>
          )}
        </div>

        {/* 하단: 제목 & 설명 */}
        <div>
          <h3 className="text-xs font-semibold text-white mb-0.5 line-clamp-1">{item.title}</h3>
          {item.description && (
            <p className={`text-[10px] text-white/70 line-clamp-2 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* 테두리 */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/30 transition-[box-shadow] duration-300" />
    </button>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ShowcaseGallery() {
  const { t, language } = useLanguage()
  const { startOnboarding } = useOnboarding()
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [imageOffset, setImageOffset] = useState(0)
  const [videoOffset, setVideoOffset] = useState(0)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // ad_type을 현재 언어에 맞게 번역
  const getAdTypeLabel = useCallback((adType: string | null): string => {
    if (!adType) return ''

    const translationKey = AD_TYPE_TRANSLATION_KEY[adType]
    if (!translationKey) return adType

    // 이미지 광고 타입 번역 확인
    const imageAdTypeTranslation = t.imageAdTypes?.[translationKey as keyof typeof t.imageAdTypes]
    if (imageAdTypeTranslation && typeof imageAdTypeTranslation === 'object' && 'title' in imageAdTypeTranslation) {
      return imageAdTypeTranslation.title as string
    }

    // 영상 광고 타입 폴백 번역 확인
    const videoFallback = VIDEO_AD_TYPE_FALLBACK[adType]
    if (videoFallback) {
      return videoFallback[language] || videoFallback.ko
    }

    return adType
  }, [t.imageAdTypes, language])

  // 쇼케이스 데이터 로드 (인터리브 모드 - 단일 API 호출)
  const fetchShowcases = useCallback(async (imgOffset: number, vidOffset: number, isInitial: boolean = false) => {
    if (isInitial) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      // 인터리브 모드로 한 번에 조회 (이미지/영상 오프셋 별도 전달)
      const res = await fetch(
        `/api/showcases?interleave=true&limit=${ITEMS_PER_PAGE}&imageOffset=${imgOffset}&videoOffset=${vidOffset}`
      )

      if (res.ok) {
        const data = await res.json()
        const newShowcases: ShowcaseItem[] = data.showcases || []
        const { imageCount, videoCount, nextImageOffset, nextVideoOffset } = data

        if (isInitial) {
          setShowcases(newShowcases)
        } else {
          setShowcases(prev => [...prev, ...newShowcases])
        }

        // 오프셋 업데이트
        setImageOffset(nextImageOffset)
        setVideoOffset(nextVideoOffset)

        // 더 불러올 데이터가 있는지 확인
        setHasMore(nextImageOffset < imageCount || nextVideoOffset < videoCount)
      }
    } catch (error) {
      console.error('쇼케이스 로드 오류:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    fetchShowcases(0, 0, true)
  }, [fetchShowcases])

  // 무한 스크롤 - Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchShowcases(imageOffset, videoOffset)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, imageOffset, videoOffset, fetchShowcases])

  const handleShowcaseClick = (item: ShowcaseItem) => {
    // 쇼케이스 클릭 시 해당 타입의 광고 생성 온보딩 시작
    if (item.type === 'video') {
      startOnboarding('video')
    } else {
      startOnboarding('image')
    }
  }

  // 초기 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground">
            {t.dashboard?.showcase?.browse || '광고 둘러보기'}
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  // 쇼케이스가 없으면 렌더링하지 않음
  if (showcases.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <h2 className="text-sm font-semibold text-foreground">
          {t.dashboard?.showcase?.browse || '광고 둘러보기'}
        </h2>
      </div>

      {/* 그리드 - 이미지와 영상 혼합 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {showcases.map((item) => (
          <ShowcaseCard
            key={item.id}
            item={item}
            onClick={() => handleShowcaseClick(item)}
            getAdTypeLabel={getAdTypeLabel}
          />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-8">
          {isLoadingMore && (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          )}
        </div>
      )}
    </div>
  )
}
