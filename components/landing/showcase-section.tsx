/**
 * 랜딩 페이지 쇼케이스 섹션
 *
 * 데이터베이스에서 쇼케이스 광고를 불러와 표시합니다.
 * - 이미지/영상 광고 탭 전환
 * - 더보기 버튼으로 추가 로드
 * - CSS columns 기반 메이슨리 레이아웃 (이미지 원본 비율 유지)
 * - 화면에 보이는 영상 자동 재생, 호버 시 해당 영상 재생
 */

'use client'

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { Play, Image as ImageIcon, Video, Sparkles, ArrowRight, Volume2, VolumeX, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import Link from 'next/link'

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
  product_image_url: string | null
  avatar_image_url: string | null
}

// ============================================================
// 비디오 재생 컨텍스트
// ============================================================

interface VideoContextType {
  activeVideoId: string | null
  hoveredVideoId: string | null
  setHoveredVideoId: (id: string | null) => void
  registerVisibleVideo: (id: string) => void
  unregisterVisibleVideo: (id: string) => void
}

const VideoContext = createContext<VideoContextType>({
  activeVideoId: null,
  hoveredVideoId: null,
  setHoveredVideoId: () => {},
  registerVisibleVideo: () => {},
  unregisterVisibleVideo: () => {},
})

// ============================================================
// 개별 쇼케이스 카드 컴포넌트
// ============================================================

interface ShowcaseCardProps {
  item: ShowcaseItem
}

function ShowcaseCard({ item }: ShowcaseCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const { activeVideoId, hoveredVideoId, setHoveredVideoId, registerVisibleVideo, unregisterVisibleVideo } = useContext(VideoContext)

  // 이 비디오가 재생되어야 하는지 확인
  const shouldPlay = item.type === 'video' && (
    hoveredVideoId === item.id ||
    (hoveredVideoId === null && activeVideoId === item.id)
  )

  // Intersection Observer로 화면에 보이는지 감지
  useEffect(() => {
    if (item.type !== 'video' || !item.media_url) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            registerVisibleVideo(item.id)
          } else {
            unregisterVisibleVideo(item.id)
          }
        })
      },
      { threshold: 0.5 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      observer.disconnect()
      unregisterVisibleVideo(item.id)
    }
  }, [item.type, item.media_url, item.id, registerVisibleVideo, unregisterVisibleVideo])

  // 재생 상태 관리
  useEffect(() => {
    if (!videoRef.current || item.type !== 'video') return

    if (shouldPlay) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsMuted(true)
      videoRef.current.muted = true
    }
  }, [shouldPlay, item.type])

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (item.type === 'video') {
      setHoveredVideoId(item.id)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (item.type === 'video') {
      setHoveredVideoId(null)
    }
  }

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl overflow-hidden bg-secondary/30 cursor-pointer"
    >
      {/* 미디어 컨테이너 */}
      <div className="relative w-full">
        {/* 썸네일 이미지 - 항상 표시하여 레이아웃 유지, 크롭 시 상단 표시 */}
        <img
          src={item.thumbnail_url}
          alt={item.title}
          className={`w-full h-auto block transition-opacity duration-300 object-top ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectPosition: 'top' }}
          onLoad={() => setImageLoaded(true)}
        />

        {/* 비디오 - 썸네일 위에 오버레이, 크롭 시 상단 표시 */}
        {item.type === 'video' && item.media_url && (
          <video
            ref={videoRef}
            src={item.media_url}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              shouldPlay ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ objectPosition: 'top' }}
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
          />
        )}

        {/* 로딩 스켈레톤 */}
        {!imageLoaded && (
          <div className="w-full aspect-[4/5] bg-secondary/50 animate-pulse" />
        )}

        {/* 비디오 컨트롤 */}
        {item.type === 'video' && (
          <>
            {/* 재생 아이콘 - 재생 중이 아닐 때 */}
            <div className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
              shouldPlay ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            {/* 음소거 버튼 - 재생 중일 때 */}
            <button
              onClick={handleToggleMute}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-black/70 ${
                shouldPlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </>
        )}

        {/* 호버 시 오버레이 */}
        <div className={`absolute inset-0 bg-primary/20 transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />

        {/* 하단 어두운 그라데이션 */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

        {/* 하단 좌측: 타입 배지 */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-white pointer-events-none">
          {item.type === 'video' ? (
            <Video className="w-3 h-3" />
          ) : (
            <ImageIcon className="w-3 h-3" />
          )}
          <span>{item.type === 'video' ? 'Video' : 'Image'}</span>
        </div>

        {/* 하단 우측: 제품 & 아바타 썸네일 */}
        {(item.product_image_url || item.avatar_image_url) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
            {item.avatar_image_url && (
              <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg flex-shrink-0 ring-2 ring-white/30">
                <img
                  src={item.avatar_image_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {item.product_image_url && (
              <div className="w-9 h-9 rounded-lg bg-white/95 p-0.5 shadow-lg flex-shrink-0">
                <img
                  src={item.product_image_url}
                  alt="Product"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        )}

        {/* 테두리 */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-white/30 transition-all duration-300 pointer-events-none" />
      </div>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ShowcaseSection() {
  const { language, t } = useLanguage()
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const ITEMS_PER_PAGE = 12

  // 비디오 재생 상태 관리
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const visibleVideosRef = useRef<Set<string>>(new Set())

  const registerVisibleVideo = (id: string) => {
    visibleVideosRef.current.add(id)
    // 호버 중인 비디오가 없으면 첫 번째 보이는 비디오를 활성화
    if (hoveredVideoId === null && activeVideoId === null) {
      setActiveVideoId(id)
    }
  }

  const unregisterVisibleVideo = (id: string) => {
    visibleVideosRef.current.delete(id)
    // 현재 활성 비디오가 화면에서 벗어나면 다음 보이는 비디오로 전환
    if (activeVideoId === id) {
      const nextVisible = Array.from(visibleVideosRef.current)[0] || null
      setActiveVideoId(nextVisible)
    }
  }

  // 호버 상태 변경 시 활성 비디오 업데이트
  useEffect(() => {
    if (hoveredVideoId === null) {
      // 호버 해제 시 보이는 비디오 중 첫 번째로 전환
      const firstVisible = Array.from(visibleVideosRef.current)[0] || null
      setActiveVideoId(firstVisible)
    }
  }, [hoveredVideoId])

  // 쇼케이스 데이터 로드
  const fetchShowcases = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      const offset = (pageNum - 1) * ITEMS_PER_PAGE
      const limit = Math.ceil(ITEMS_PER_PAGE / 2)

      const [imageRes, videoRes] = await Promise.all([
        fetch(`/api/showcases?type=image&limit=${limit}&offset=${Math.floor(offset / 2)}&random=true`),
        fetch(`/api/showcases?type=video&limit=${limit}&offset=${Math.floor(offset / 2)}&random=true`),
      ])

      const imageData = imageRes.ok ? await imageRes.json() : { showcases: [] }
      const videoData = videoRes.ok ? await videoRes.json() : { showcases: [] }

      // 이미지와 영상을 번갈아 배치
      const combined: ShowcaseItem[] = []
      const maxLen = Math.max(imageData.showcases?.length || 0, videoData.showcases?.length || 0)
      for (let i = 0; i < maxLen; i++) {
        if (videoData.showcases?.[i]) combined.push(videoData.showcases[i])
        if (imageData.showcases?.[i]) combined.push(imageData.showcases[i])
      }

      // 더 불러올 데이터가 있는지 확인
      const totalFetched = (imageData.showcases?.length || 0) + (videoData.showcases?.length || 0)
      if (totalFetched < ITEMS_PER_PAGE || combined.length === 0) {
        setHasMore(false)
      }

      if (append) {
        setShowcases(prev => {
          const existingIds = new Set(prev.map(s => s.id))
          const newItems = combined.filter(s => !existingIds.has(s.id))
          if (newItems.length === 0) {
            setHasMore(false)
          }
          return [...prev, ...newItems]
        })
      } else {
        setShowcases(combined)
      }
    } catch (error) {
      console.error('쇼케이스 로드 오류:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    fetchShowcases(1, false)
  }, [])

  // 더보기 버튼 클릭
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchShowcases(nextPage, true)
    }
  }

  // 탭 변경 핸들러 (부드러운 전환)
  const handleTabChange = (tab: 'all' | 'image' | 'video') => {
    if (tab === activeTab || isTransitioning) return

    setIsTransitioning(true)
    // 페이드 아웃 후 탭 변경
    setTimeout(() => {
      setActiveTab(tab)
      // 약간의 딜레이 후 페이드 인
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 200)
  }

  // 탭 변경 시 필터링
  const filteredShowcases = activeTab === 'all'
    ? showcases
    : showcases.filter(s => s.type === activeTab)

  // 쇼케이스가 없으면 렌더링하지 않음
  if (!isLoading && showcases.length === 0) {
    return null
  }

  return (
    <VideoContext.Provider value={{
      activeVideoId,
      hoveredVideoId,
      setHoveredVideoId,
      registerVisibleVideo,
      unregisterVisibleVideo,
    }}>
      <section id="gallery" className="px-4 py-20 sm:py-28 bg-gradient-to-b from-background via-secondary/20 to-background overflow-hidden">
        <div className="mx-auto max-w-7xl">
          {/* 섹션 헤더 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI Generated</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {t.landing?.galleryTitle || 'See What AI Can Create'}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              {t.landing?.gallerySubtitle || 'Professional ad content generated by our AI in minutes'}
            </p>
          </div>

          {/* 탭 필터 */}
          <div className="flex justify-center gap-2 mb-10">
            {(['all', 'image', 'video'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                disabled={isTransitioning}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                } ${isTransitioning ? 'cursor-not-allowed' : ''}`}
              >
                {tab === 'all' ? 'All' : tab === 'image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>

          {/* 로딩 */}
          {isLoading ? (
            <div className="showcase-masonry">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-secondary/50 animate-pulse"
                  style={{ aspectRatio: i % 2 === 0 ? '3/4' : '4/5' }}
                />
              ))}
            </div>
          ) : (
            <>
              {/* 메이슨리 그리드 - 항상 4열 유지 */}
              <div
                className={`showcase-masonry transition-all duration-200 ${
                  isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
                }`}
              >
                {filteredShowcases.map((item) => (
                  <ShowcaseCard key={item.id} item={item} />
                ))}
              </div>

              {/* 더보기 버튼 */}
              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/50 text-foreground font-medium hover:bg-secondary transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>{language === 'ko' ? '로딩 중...' : 'Loading...'}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>{language === 'ko' ? '더 보기' : 'Load More'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* CTA */}
          <div className="flex justify-center mt-10">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              <span>{t.landing?.ctaStart || 'Start Creating'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </VideoContext.Provider>
  )
}
