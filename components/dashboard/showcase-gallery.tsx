/**
 * 쇼케이스 갤러리 컴포넌트
 *
 * 데이터베이스에서 예시 광고를 불러와 표시합니다.
 * - 이미지와 영상 광고를 혼합하여 표시
 * - 무한 스크롤 지원
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Loader2, Volume2, VolumeX, X, Plus, Image as ImageIcon, Video } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useOnboarding, VideoAdType } from '@/components/onboarding/onboarding-context'

// ============================================================
// 타입 정의
// ============================================================

interface ShowcaseItem {
  id: string
  type: 'image' | 'video' | string
  title: string
  description: string | null
  thumbnail_url: string
  media_url: string | null
  ad_type: string | null
  category: string | null
  product_image_url: string | null
  avatar_image_url: string | null
}

interface GalleryMeta {
  imageCount: number
  videoCount: number
  nextImageOffset: number
  nextVideoOffset: number
}

interface ShowcaseGalleryProps {
  initialData?: ShowcaseItem[]
  initialMeta?: GalleryMeta
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
      <div className="absolute inset-0 p-3 flex flex-col justify-end">
        {/* 하단: 광고 유형 + 제품/아바타 썸네일 */}
        <div className="flex items-end justify-between gap-2">
          {/* 좌측: 미디어 타입 + 광고 유형 */}
          <div className="flex flex-col gap-1 items-start">
            <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white/90">
              {item.type === 'video' ? 'VIDEO' : 'IMAGE'}
            </span>
            {item.ad_type && (
              <span className="px-2 py-1 rounded-lg bg-primary/30 backdrop-blur-sm text-xs font-semibold text-white">
                {getAdTypeLabel(item.ad_type)}
              </span>
            )}
          </div>

          {/* 우측: 제품/아바타 썸네일 */}
          {(item.product_image_url || item.avatar_image_url) && (
            <div className="flex items-center -space-x-2 flex-shrink-0">
              {item.product_image_url && (
                <div className="w-8 h-8 rounded-lg bg-white/90 p-0.5 ring-1 ring-white/20 overflow-hidden">
                  <img
                    src={item.product_image_url}
                    alt="Product"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {item.avatar_image_url && (
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/30">
                  <img
                    src={item.avatar_image_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 테두리 */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/30 transition-[box-shadow] duration-300" />
    </button>
  )
}

// ============================================================
// 라이트박스 모달 컴포넌트
// ============================================================

interface ShowcaseLightboxProps {
  item: ShowcaseItem
  onClose: () => void
  onCreateAd: () => void
  getAdTypeLabel: (adType: string | null) => string
}

function ShowcaseLightbox({ item, onClose, onCreateAd, getAdTypeLabel }: ShowcaseLightboxProps) {
  const { t } = useLanguage()
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

  // 광고 타입 레이블
  const getTypeLabel = () => {
    if (item.type === 'image') {
      return t.showcase?.imageAd || 'Image Ad'
    }
    if (item.ad_type === 'productDescription') {
      return t.showcase?.productDescription || 'Product Description'
    }
    return t.showcase?.productAd || 'Product Ad'
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
              <span>{getTypeLabel()}</span>
            </div>
          </div>

          {/* 광고 서브타입 */}
          {item.ad_type && (
            <div className="mb-3">
              <span className="px-2 py-1 rounded-lg bg-secondary text-xs font-medium text-muted-foreground">
                {getAdTypeLabel(item.ad_type)}
              </span>
            </div>
          )}

          {/* 제품 & 아바타 정보 */}
          {(item.product_image_url || item.avatar_image_url) && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                {t.showcase?.assetsUsed || 'Assets Used'}
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
                      {t.showcase?.product || 'Product'}
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
                      {t.showcase?.avatar || 'Avatar'}
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

          {/* 스페이서 */}
          <div className="flex-1 min-h-2" />

          {/* 광고 만들기 버튼 */}
          <button
            onClick={onCreateAd}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">
              {t.showcase?.createThisAd || 'Create This Ad'}
            </span>
          </button>

          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {t.showcase?.createSimilar || 'Create a similar ad with your own assets'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ShowcaseGallery({ initialData, initialMeta }: ShowcaseGalleryProps) {
  const { t, language } = useLanguage()
  const { startOnboarding, setVideoAdType } = useOnboarding()

  // 초기 데이터가 있으면 사용, 없으면 빈 배열로 시작
  const hasInitialData = initialData && initialData.length > 0
  const [showcases, setShowcases] = useState<ShowcaseItem[]>(initialData || [])
  const [isLoading, setIsLoading] = useState(!hasInitialData)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 초기 메타 정보로 상태 설정
  const [hasMore, setHasMore] = useState(
    initialMeta
      ? initialMeta.nextImageOffset < initialMeta.imageCount ||
        initialMeta.nextVideoOffset < initialMeta.videoCount
      : true
  )
  const [imageOffset, setImageOffset] = useState(initialMeta?.nextImageOffset || 0)
  const [videoOffset, setVideoOffset] = useState(initialMeta?.nextVideoOffset || 0)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 라이트박스 상태
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseItem | null>(null)

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
      console.error('Failed to load showcases:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // 초기 로드 (서버에서 프리페칭된 데이터가 없을 때만)
  useEffect(() => {
    if (!hasInitialData) {
      fetchShowcases(0, 0, true)
    }
  }, [fetchShowcases, hasInitialData])

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

  // 쇼케이스 클릭 시 라이트박스 열기
  const handleShowcaseClick = (item: ShowcaseItem) => {
    setSelectedShowcase(item)
  }

  // 라이트박스에서 광고 만들기 클릭
  const handleCreateAd = (item: ShowcaseItem) => {
    setSelectedShowcase(null) // 라이트박스 닫기
    if (item.type === 'video') {
      startOnboarding('video')
      // 영상 타입 자동 설정
      if (item.ad_type === 'productDescription' || item.ad_type === 'productAd') {
        setTimeout(() => {
          setVideoAdType(item.ad_type as VideoAdType)
        }, 100)
      }
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
            {t.dashboard?.showcase?.browse || 'Browse Ads'}
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
          {t.dashboard?.showcase?.browse || 'Browse Ads'}
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

      {/* 라이트박스 모달 */}
      {selectedShowcase && (
        <ShowcaseLightbox
          item={selectedShowcase}
          onClose={() => setSelectedShowcase(null)}
          onCreateAd={() => handleCreateAd(selectedShowcase)}
          getAdTypeLabel={getAdTypeLabel}
        />
      )}
    </div>
  )
}
