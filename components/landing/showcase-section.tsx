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

import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react'
import { Play, Image as ImageIcon, Video, Volume2, VolumeX, X, Plus } from 'lucide-react'
import Image from 'next/image'

// 메모리 최적화: 비디오 요소 제거, 썸네일만 표시
import { useLanguage } from '@/contexts/language-context'
import { optimizeThumbnailUrl, optimizeLightboxUrl } from '@/lib/image/optimize'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

// 이미지 광고 타입 키
const IMAGE_AD_TYPE_KEYS = [
  'productOnly', 'holding', 'using', 'wearing', 'lifestyle',
  'unboxing', 'seasonal', 'comparison', 'beforeAfter'
] as const

// 영상 광고 타입 키
const VIDEO_AD_TYPE_KEYS = ['productDescription', 'productAd'] as const

// ============================================================
// 쇼케이스 컨텍스트 (클릭 핸들러만 전달)
// ============================================================

interface ShowcaseContextType {
  onShowcaseClick: (item: ShowcaseItem) => void
}

const VideoContext = createContext<ShowcaseContextType>({
  onShowcaseClick: () => {},
})

// ============================================================
// 개별 쇼케이스 카드 컴포넌트
// ============================================================

interface ShowcaseCardProps {
  item: ShowcaseItem
}

function ShowcaseCard({ item }: ShowcaseCardProps) {
  const { t } = useLanguage()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { onShowcaseClick } = useContext(VideoContext)

  const isVideo = item.type === 'video' && item.media_url

  // 화면에 보일 때만 비디오 표시 (메모리 최적화)
  useEffect(() => {
    if (!isVideo) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [isVideo])

  // 비디오 재생/정지
  useEffect(() => {
    if (!videoRef.current) return
    if (isVisible) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isVisible])

  // 광고 서브타입 레이블 가져오기
  const getAdTypeLabel = (): string | null => {
    if (!item.ad_type) return null

    if (IMAGE_AD_TYPE_KEYS.includes(item.ad_type as typeof IMAGE_AD_TYPE_KEYS[number])) {
      const adTypeKey = item.ad_type as typeof IMAGE_AD_TYPE_KEYS[number]
      const typeData = t.imageAdTypes[adTypeKey]
      if (typeData && typeof typeData === 'object' && 'title' in typeData) {
        return typeData.title
      }
    }

    if (VIDEO_AD_TYPE_KEYS.includes(item.ad_type as typeof VIDEO_AD_TYPE_KEYS[number])) {
      const adTypeKey = item.ad_type as typeof VIDEO_AD_TYPE_KEYS[number]
      const typeData = t.videoAdTypes[adTypeKey]
      if (typeData && typeof typeData === 'object' && 'title' in typeData) {
        return typeData.title
      }
    }

    return item.ad_type
  }

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={() => onShowcaseClick(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onShowcaseClick(item); } }}
      className="group relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* 미디어 컨테이너 */}
      <div className="relative w-full">
        {/* 썸네일 이미지 - next/image로 자동 리사이징 */}
        <Image
          src={item.thumbnail_url}
          alt={item.title}
          width={320}
          height={400}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className="w-full h-auto block"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-out',
            objectPosition: 'top'
          }}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* 비디오 - 보일 때만 렌더링 (메모리 최적화) */}
        {isVideo && isVisible && (
          <video
            ref={videoRef}
            src={item.media_url!}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'top' }}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        )}

        {/* 로딩 스켈레톤 */}
        {!imageLoaded && (
          <div className="w-full aspect-[4/5] bg-gray-300 dark:bg-gray-700 animate-pulse" />
        )}

        {/* 비디오 재생 아이콘 - 재생 중이 아닐 때만 */}
        {isVideo && !isVisible && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center" aria-hidden="true">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        )}

        {/* 호버 시 오버레이 (CSS만 사용) */}
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* 하단 어두운 그라데이션 */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

        {/* 하단 좌측: 타입 배지 (메인 타입 + 서브타입) */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none">
          {/* 메인 타입 배지 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-white">
            {item.type === 'video' ? (
              <Video className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ImageIcon className="w-3 h-3" aria-hidden="true" />
            )}
            <span>{item.type === 'video' ? 'Video' : 'Image'}</span>
          </div>
          {/* 서브타입 배지 */}
          {getAdTypeLabel() && (
            <div className="px-2 py-0.5 rounded-full bg-primary/30 backdrop-blur-sm text-[10px] text-white/90 w-fit">
              {getAdTypeLabel()}
            </div>
          )}
        </div>

        {/* 하단 우측: 제품 & 아바타 썸네일 */}
        {(item.product_image_url || item.avatar_image_url) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
            {item.avatar_image_url && (
              <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg flex-shrink-0 ring-2 ring-white/30">
                <img
                  src={optimizeThumbnailUrl(item.avatar_image_url)}
                  alt="Avatar"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}
            {item.product_image_url && (
              <div className="w-9 h-9 rounded-lg bg-white/95 p-0.5 shadow-lg flex-shrink-0">
                <img
                  src={optimizeThumbnailUrl(item.product_image_url)}
                  alt="Product"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        )}

        {/* 테두리 */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-white/30 transition-[box-shadow] duration-300 pointer-events-none" />
      </div>
    </div>
  )
}

// ============================================================
// 라이트박스 모달 컴포넌트
// ============================================================

interface ShowcaseLightboxProps {
  item: ShowcaseItem
  onClose: () => void
}

function ShowcaseLightbox({ item, onClose }: ShowcaseLightboxProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 비디오 자동 재생
  useEffect(() => {
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [item.type])

  // 광고 타입에 따른 대시보드 URL (온보딩 팝업 자동 오픈)
  const getCreateUrl = () => {
    if (item.type === 'image') {
      return '/dashboard?create=image'
    }
    // 영상 광고 타입에 따라 분기
    if (item.ad_type === 'productDescription') {
      return '/dashboard?create=video&videoType=productDescription'
    }
    return '/dashboard?create=video&videoType=productAd'
  }

  // "이 광고 만들기" 버튼 클릭
  const handleCreateClick = async () => {
    setIsCheckingAuth(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 로그인된 사용자: 대시보드로 이동 (온보딩 팝업 자동 오픈)
        router.push(getCreateUrl())
      } else {
        // 비로그인 사용자: 로그인 페이지로 이동
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setIsCheckingAuth(false)
    }
  }

  // 광고 타입 레이블
  const getAdTypeLabel = () => {
    if (item.type === 'image') {
      return t.showcase.imageAd
    }
    if (item.ad_type === 'productDescription') {
      return t.showcase.productDescription
    }
    return t.showcase.productAd
  }

  return (
    <div
      className="fixed inset-0 z-50 !m-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 미디어 영역 */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[250px] md:min-h-0 md:max-h-[85vh]">
          {item.type === 'video' && item.media_url ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={item.media_url}
                className="w-full h-full object-contain max-h-[50vh] md:max-h-[85vh]"
                controls
                autoPlay
                loop
                playsInline
                muted={isMuted}
              />
              {/* 음소거 토글 */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted
                    setIsMuted(!isMuted)
                  }
                }}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <img
              src={optimizeLightboxUrl(item.thumbnail_url)}
              alt={item.title}
              className="w-full h-full object-contain max-h-[50vh] md:max-h-[85vh]"
            />
          )}
        </div>

        {/* 정보 영역 */}
        <div className="w-full md:w-72 p-5 flex flex-col flex-shrink-0 max-h-[40vh] md:max-h-[85vh] overflow-y-auto">
            {/* 광고 타입 배지 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {item.type === 'video' ? (
                  <Video className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{getAdTypeLabel()}</span>
              </div>
            </div>

            {/* 제품 & 아바타 정보 */}
            {(item.product_image_url || item.avatar_image_url) && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {t.showcase.assetsUsed}
                </p>
                <div className="flex items-center gap-2">
                  {item.product_image_url && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-12 h-12 rounded-lg bg-secondary/50 p-0.5 border border-border">
                        <img
                          src={optimizeThumbnailUrl(item.product_image_url)}
                          alt="Product"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {t.showcase.product}
                      </span>
                    </div>
                  )}
                  {item.product_image_url && item.avatar_image_url && (
                    <div className="text-muted-foreground text-sm">+</div>
                  )}
                  {item.avatar_image_url && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border">
                        <img
                          src={optimizeThumbnailUrl(item.avatar_image_url)}
                          alt="Avatar"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {t.showcase.avatar}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 설명 */}
            {item.description && (
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* 스페이서 - 모바일에서는 최소화 */}
            <div className="flex-1 min-h-2" />

            {/* 광고 만들기 버튼 */}
            <button
              onClick={handleCreateClick}
              disabled={isCheckingAuth}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {isCheckingAuth ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">
                    {t.showcase.createThisAd}
                  </span>
                </>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {t.showcase.createSimilar}
            </p>
          </div>
      </div>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface ShowcaseSectionProps {
  initialShowcases?: ShowcaseItem[]
}

export function ShowcaseSection({ initialShowcases = [] }: ShowcaseSectionProps) {
  const { t } = useLanguage()
  const [showcases, setShowcases] = useState<ShowcaseItem[]>(initialShowcases)
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video'>('all')
  const [isLoading, setIsLoading] = useState(initialShowcases.length === 0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(initialShowcases.length > 0 ? 2 : 1) // 초기 데이터 있으면 2페이지부터
  const [isTransitioning, setIsTransitioning] = useState(false)
  const ITEMS_PER_PAGE = 20

  // 무한 스크롤 감지용 ref
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 라이트박스 상태
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseItem | null>(null)

  // 쇼케이스 클릭 핸들러
  const handleShowcaseClick = useCallback((item: ShowcaseItem) => {
    setSelectedShowcase(item)
  }, [])

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
      console.error('Failed to load showcases:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // 초기 로드 (initialShowcases가 없을 때만)
  useEffect(() => {
    if (initialShowcases.length === 0) {
      fetchShowcases(1, false)
    }
  }, [initialShowcases.length])

  // 무한 스크롤 - IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchShowcases(nextPage, true)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isLoading, page])

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
      onShowcaseClick: handleShowcaseClick,
    }}>
      <section id="gallery" className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          {/* 섹션 헤더 */}
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground">
              {t.showcase.title}
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              {t.showcase.subtitle}
            </p>
          </div>

          {/* 탭 필터 */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-lg bg-secondary/50 border border-border">
              {(['all', 'image', 'video'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  disabled={isTransitioning}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    activeTab === tab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  } ${isTransitioning ? 'cursor-not-allowed' : ''}`}
                >
                  {tab === 'all' ? t.showcase.tabAll : tab === 'image' ? t.showcase.tabImage : t.showcase.tabVideo}
                </button>
              ))}
            </div>
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
                className={`showcase-masonry transition-[opacity,transform] duration-200 ${
                  isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
                }`}
              >
                {filteredShowcases.map((item) => (
                  <ShowcaseCard key={item.id} item={item} />
                ))}
              </div>

              {/* 무한 스크롤 감지 영역 */}
              <div ref={loadMoreRef} className="h-10 mt-8">
                {isLoadingMore && (
                  <div className="flex justify-center items-center gap-2 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">{t.showcase.loading}</span>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </section>

      {/* 라이트박스 모달 */}
      {selectedShowcase && (
        <ShowcaseLightbox
          item={selectedShowcase}
          onClose={() => setSelectedShowcase(null)}
        />
      )}
    </VideoContext.Provider>
  )
}
