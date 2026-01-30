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
import { Play, Image as ImageIcon, Video, ArrowRight, Volume2, VolumeX, X, Plus } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // 광고 서브타입 레이블 가져오기
  const getAdTypeLabel = (): string | null => {
    if (!item.ad_type) return null

    // 이미지 광고 타입 확인
    if (IMAGE_AD_TYPE_KEYS.includes(item.ad_type as typeof IMAGE_AD_TYPE_KEYS[number])) {
      const adTypeKey = item.ad_type as typeof IMAGE_AD_TYPE_KEYS[number]
      const typeData = t.imageAdTypes[adTypeKey]
      if (typeData && typeof typeData === 'object' && 'title' in typeData) {
        return typeData.title
      }
    }

    // 영상 광고 타입 확인
    if (VIDEO_AD_TYPE_KEYS.includes(item.ad_type as typeof VIDEO_AD_TYPE_KEYS[number])) {
      const adTypeKey = item.ad_type as typeof VIDEO_AD_TYPE_KEYS[number]
      const typeData = t.videoAdTypes[adTypeKey]
      if (typeData && typeof typeData === 'object' && 'title' in typeData) {
        return typeData.title
      }
    }

    // 매핑에 없으면 원본 값 반환
    return item.ad_type
  }

  const { onShowcaseClick } = useContext(VideoContext)

  // 화면에 보이면 재생
  const shouldPlay = item.type === 'video' && isVisible

  // Intersection Observer로 화면에 보이는지 감지 - 보이면 바로 재생
  useEffect(() => {
    if (item.type !== 'video' || !item.media_url) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting)
        })
      },
      { threshold: 0.3 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [item.type, item.media_url])

  // 재생 상태 관리
  useEffect(() => {
    if (!videoRef.current || item.type !== 'video') return

    if (shouldPlay) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [shouldPlay, item.type])

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  const handleCardClick = () => {
    onShowcaseClick(item)
  }

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl overflow-hidden bg-secondary/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* 미디어 컨테이너 */}
      <div className="relative w-full">
        {/* 썸네일 이미지 - 항상 표시하여 레이아웃 유지, 크롭 시 상단 표시 */}
        <img
          src={item.thumbnail_url}
          alt={item.title}
          className={`w-full h-auto block object-top ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transition: 'opacity 300ms' }}
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
            }`} aria-hidden="true">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            {/* 음소거 버튼 - 재생 중일 때 */}
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-[opacity,background-color] duration-300 hover:bg-black/70 ${
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
                  src={item.avatar_image_url}
                  alt="Avatar"
                  className="w-full h-full object-cover object-top"
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
  const { language, t } = useLanguage()
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
      return language === 'ko' ? '이미지 광고' : 'Image Ad'
    }
    if (item.ad_type === 'productDescription') {
      return language === 'ko' ? '제품 설명 영상' : 'Product Description Video'
    }
    return language === 'ko' ? '제품 광고 영상' : 'Product Ad Video'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
              src={item.thumbnail_url}
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
                  {language === 'ko' ? '사용된 에셋' : 'Assets Used'}
                </p>
                <div className="flex items-center gap-2">
                  {item.product_image_url && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-12 h-12 rounded-lg bg-secondary/50 p-0.5 border border-border">
                        <img
                          src={item.product_image_url}
                          alt="Product"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {language === 'ko' ? '제품' : 'Product'}
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
                          src={item.avatar_image_url}
                          alt="Avatar"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {language === 'ko' ? '아바타' : 'Avatar'}
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
                    {language === 'ko' ? '이런 광고 만들기' : 'Create This Ad'}
                  </span>
                </>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {language === 'ko'
                ? '비슷한 스타일의 광고를 만들어 보세요'
                : 'Create a similar style ad'}
            </p>
          </div>
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
              {language === 'ko' ? '제작 사례' : 'Gallery'}
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              {language === 'ko'
                ? '실제 제작된 광고 콘텐츠를 확인해 보세요'
                : 'Check out real ad content created with our platform'}
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
                  {tab === 'all' ? (language === 'ko' ? '전체' : 'All') : tab === 'image' ? (language === 'ko' ? '이미지' : 'Images') : (language === 'ko' ? '영상' : 'Videos')}
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
                    <span className="text-sm">{language === 'ko' ? '로딩 중...' : 'Loading...'}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* CTA */}
          <div className="flex justify-center mt-10">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span>{language === 'ko' ? '시작하기' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
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
