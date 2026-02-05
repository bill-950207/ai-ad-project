/**
 * 쇼케이스 섹션 컴포넌트
 *
 * 카테고리별로 쇼케이스를 표시합니다.
 * - 이미지 광고: ad_type별 필터 태그
 * - 영상 광고: ad_type별 필터 태그
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX, X, Plus, Image as ImageIcon, Video } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useOnboarding, VideoAdType } from '@/components/onboarding/onboarding-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'

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

interface CategoryGroup {
  adType: string
  items: ShowcaseItem[]
}

interface ShowcaseSectionProps {
  imageCategories: CategoryGroup[]
  videoCategories: CategoryGroup[]
}

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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLButtonElement>(null)

  // Intersection Observer로 화면에 보일 때 자동 재생
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
            setIsMuted(true)
            videoRef.current.muted = true
          }
        })
      },
      { threshold: 0.5 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [item.type, item.media_url])

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      className="group relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] aspect-[3/4] rounded-xl overflow-hidden bg-secondary/30 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
    >
      {/* 썸네일 이미지 */}
      <img
        src={item.thumbnail_url}
        alt={item.title}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
          imageLoaded ? 'opacity-100' : 'opacity-0',
          item.type === 'video' && isPlaying && 'opacity-0'
        )}
        onLoad={() => setImageLoaded(true)}
      />

      {/* 비디오 */}
      {item.type === 'video' && item.media_url && (
        <video
          ref={videoRef}
          src={item.media_url}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            isPlaying ? 'opacity-100' : 'opacity-0'
          )}
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

      {/* 비디오 재생/음소거 버튼 */}
      {item.type === 'video' && (
        <>
          <div className={cn(
            "absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300",
            isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}>
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
          <button
            onClick={handleToggleMute}
            className={cn(
              "absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-black/70",
              isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3 text-white" />
            ) : (
              <Volume2 className="w-3 h-3 text-white" />
            )}
          </button>
        </>
      )}

      {/* 하단 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 콘텐츠 */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        {item.ad_type && (
          <Badge variant="glass" size="sm" className="text-[9px]">
            {getAdTypeLabel(item.ad_type)}
          </Badge>
        )}
      </div>

      {/* 테두리 */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-[box-shadow] duration-300" />
    </button>
  )
}

// ============================================================
// 필터 태그 컴포넌트
// ============================================================

interface FilterTagProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function FilterTag({ label, isActive, onClick }: FilterTagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
        isActive
          ? "bg-white text-black"
          : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}

// ============================================================
// 가로 스크롤 갤러리 컴포넌트
// ============================================================

interface HorizontalGalleryProps {
  items: ShowcaseItem[]
  onItemClick: (item: ShowcaseItem) => void
  getAdTypeLabel: (adType: string | null) => string
}

function HorizontalGallery({ items, onItemClick, getAdTypeLabel }: HorizontalGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      el?.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll, items])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (items.length === 0) return null

  return (
    <div className="relative group/gallery">
      {/* 스크롤 버튼 - 좌 */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition-all opacity-0 group-hover/gallery:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {/* 스크롤 버튼 - 우 */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition-all opacity-0 group-hover/gallery:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}

      {/* 카드 컨테이너 */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item) => (
          <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
            <ShowcaseCard item={item} onClick={() => onItemClick(item)} getAdTypeLabel={getAdTypeLabel} />
          </div>
        ))}
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
  onCreateAd: () => void
  getAdTypeLabel: (adType: string | null) => string
}

function ShowcaseLightbox({ item, onClose, onCreateAd, getAdTypeLabel }: ShowcaseLightboxProps) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [item.type])

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
    <Modal isOpen={true} onClose={onClose} size="xl" ariaLabel={item.title} className="max-w-5xl">
      <div className="flex flex-col md:flex-row max-h-[90vh]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 bg-black flex items-center justify-center min-h-[250px] md:min-h-0 md:max-h-[85vh] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
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
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted
                    setIsMuted(!isMuted)
                  }
                }}
                className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
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

        <div className="w-full md:w-72 p-5 flex flex-col flex-shrink-0 max-h-[40vh] md:max-h-[85vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="primary" className="gap-1.5 bg-primary/10 text-primary">
              {item.type === 'video' ? (
                <Video className="w-3.5 h-3.5" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              <span>{getTypeLabel()}</span>
            </Badge>
          </div>

          {item.ad_type && (
            <div className="mb-3">
              <Badge variant="secondary" size="sm">
                {getAdTypeLabel(item.ad_type)}
              </Badge>
            </div>
          )}

          {(item.product_image_url || item.avatar_image_url) && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                {t.showcase?.assetsUsed || 'Assets Used'}
              </p>
              <div className="flex items-center gap-2">
                {item.product_image_url && (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-12 h-12 rounded-lg bg-secondary/50 p-0.5 border border-border">
                      <img src={item.product_image_url} alt="Product" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t.showcase?.product || 'Product'}</span>
                  </div>
                )}
                {item.product_image_url && item.avatar_image_url && (
                  <div className="text-muted-foreground text-sm">+</div>
                )}
                {item.avatar_image_url && (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border">
                      <img src={item.avatar_image_url} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t.showcase?.avatar || 'Avatar'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {item.description && (
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
          )}

          <div className="flex-1 min-h-2" />

          <Button onClick={onCreateAd} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            <span className="text-sm">{t.showcase?.createThisAd || 'Create This Ad'}</span>
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {t.showcase?.createSimilar || 'Create a similar ad with your own assets'}
          </p>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// 광고 타입 섹션 컴포넌트
// ============================================================

interface AdTypeSectionProps {
  type: 'image' | 'video'
  title: string
  description: string
  categories: CategoryGroup[]
  getAdTypeLabel: (adType: string | null) => string
  onItemClick: (item: ShowcaseItem) => void
}

function AdTypeSection({ type, title, description, categories, getAdTypeLabel, onItemClick }: AdTypeSectionProps) {
  const { t } = useLanguage()
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // 전체 아이템
  const allItems = categories.flatMap(c => c.items)

  // 필터된 아이템
  const filteredItems = activeFilter === 'all'
    ? allItems
    : categories.find(c => c.adType === activeFilter)?.items || []

  if (allItems.length === 0) return null

  return (
    <div className="space-y-5">
      {/* 섹션 헤더 */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      </div>

      {/* 필터 태그 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <FilterTag
          label={t.common?.all || '전체'}
          isActive={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        />
        {categories.map((category) => (
          <FilterTag
            key={category.adType}
            label={getAdTypeLabel(category.adType)}
            isActive={activeFilter === category.adType}
            onClick={() => setActiveFilter(category.adType)}
          />
        ))}
      </div>

      {/* 갤러리 */}
      <HorizontalGallery items={filteredItems} onItemClick={onItemClick} getAdTypeLabel={getAdTypeLabel} />
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ShowcaseSection({ imageCategories, videoCategories }: ShowcaseSectionProps) {
  const { t, language } = useLanguage()
  const { startOnboarding, setVideoAdType } = useOnboarding()
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseItem | null>(null)

  // ad_type을 현재 언어에 맞게 번역
  const getAdTypeLabel = useCallback((adType: string | null): string => {
    if (!adType) return ''

    const translationKey = AD_TYPE_TRANSLATION_KEY[adType]
    if (!translationKey) return adType

    const imageAdTypeTranslation = t.imageAdTypes?.[translationKey as keyof typeof t.imageAdTypes]
    if (imageAdTypeTranslation && typeof imageAdTypeTranslation === 'object' && 'title' in imageAdTypeTranslation) {
      return imageAdTypeTranslation.title as string
    }

    const videoAdTypeTranslation = t.videoAdTypes?.[translationKey as keyof typeof t.videoAdTypes]
    if (videoAdTypeTranslation && typeof videoAdTypeTranslation === 'object' && 'title' in videoAdTypeTranslation) {
      return videoAdTypeTranslation.title as string
    }

    const videoFallback = VIDEO_AD_TYPE_FALLBACK[adType]
    if (videoFallback) {
      return videoFallback[language] || videoFallback.ko
    }

    return adType
  }, [t.imageAdTypes, t.videoAdTypes, language])

  // 라이트박스에서 광고 만들기 클릭
  const handleCreateAd = (item: ShowcaseItem) => {
    setSelectedShowcase(null)
    if (item.type === 'video') {
      startOnboarding('video')
      if (item.ad_type === 'productDescription' || item.ad_type === 'productAd') {
        setTimeout(() => {
          setVideoAdType(item.ad_type as VideoAdType)
        }, 100)
      }
    } else {
      startOnboarding('image')
    }
  }

  // 쇼케이스가 없으면 렌더링하지 않음
  const hasImageShowcase = imageCategories.some(c => c.items.length > 0)
  const hasVideoShowcase = videoCategories.some(c => c.items.length > 0)

  if (!hasImageShowcase && !hasVideoShowcase) return null

  return (
    <div className="space-y-12 pt-8 mt-8 border-t border-border/30">
      {/* 이미지 광고 섹션 */}
      {hasImageShowcase && (
        <AdTypeSection
          type="image"
          title={t.dashboard?.showcase?.imageTitle || '이미지 광고 예시'}
          description={t.dashboard?.showcase?.imageDesc || '다양한 스타일의 AI 이미지 광고를 살펴보세요'}
          categories={imageCategories}
          getAdTypeLabel={getAdTypeLabel}
          onItemClick={setSelectedShowcase}
        />
      )}

      {/* 영상 광고 섹션 */}
      {hasVideoShowcase && (
        <AdTypeSection
          type="video"
          title={t.dashboard?.showcase?.videoTitle || '영상 광고 예시'}
          description={t.dashboard?.showcase?.videoDesc || '다양한 스타일의 AI 영상 광고를 살펴보세요'}
          categories={videoCategories}
          getAdTypeLabel={getAdTypeLabel}
          onItemClick={setSelectedShowcase}
        />
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
