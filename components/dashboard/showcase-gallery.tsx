/**
 * 쇼케이스 갤러리 컴포넌트
 *
 * 데이터베이스에서 예시 광고를 불러와 표시합니다.
 * - 이미지 광고 예시 섹션 (3행 x 5열)
 * - 영상 광고 예시 섹션 (3행 x 5열)
 * - 각 섹션 15개 초과 시 더보기 버튼 표시
 */

'use client'

import { useState, useEffect } from 'react'
import { Play, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
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

// 표시 설정
const ITEMS_PER_ROW = 5
const MAX_ROWS = 3
const MAX_VISIBLE_ITEMS = ITEMS_PER_ROW * MAX_ROWS // 15개

// ============================================================
// 개별 쇼케이스 카드 컴포넌트
// ============================================================

interface ShowcaseCardProps {
  item: ShowcaseItem
  onClick: () => void
}

function ShowcaseCard({ item, onClick }: ShowcaseCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary/30 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform duration-300 hover:scale-[1.02]"
    >
      {/* 썸네일 이미지 */}
      <img
        src={item.thumbnail_url}
        alt={item.title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
      />

      {/* 로딩 스켈레톤 */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-secondary/50 animate-pulse" />
      )}

      {/* 비디오 표시 아이콘 */}
      {item.type === 'video' && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
      )}

      {/* 하단 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* 호버 시 전체 오버레이 */}
      <div className={`absolute inset-0 bg-primary/20 transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* 콘텐츠 */}
      <div className="absolute inset-0 p-3 flex flex-col justify-between">
        {/* 상단: 카테고리 & 광고 유형 */}
        <div className="flex items-start justify-between gap-1">
          {item.category && (
            <span className="px-1.5 py-0.5 rounded-md bg-white/10 backdrop-blur-sm text-[9px] font-medium text-white/80 truncate max-w-[60px]">
              {item.category}
            </span>
          )}
          {item.ad_type && (
            <span className="px-1.5 py-0.5 rounded-md bg-primary/20 backdrop-blur-sm text-[9px] font-medium text-white truncate max-w-[60px]">
              {item.ad_type}
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
// 쇼케이스 섹션 컴포넌트
// ============================================================

interface ShowcaseSectionProps {
  type: 'image' | 'video'
  title: string
  items: ShowcaseItem[]
  totalCount: number
  onItemClick: (item: ShowcaseItem) => void
  onViewMore?: () => void
}

function ShowcaseSection({ type, title, items, totalCount, onItemClick, onViewMore }: ShowcaseSectionProps) {
  const showViewMore = totalCount > MAX_VISIBLE_ITEMS

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-primary/60 rounded-full" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-[10px] text-muted-foreground/60">({totalCount})</span>
      </div>

      {/* 그리드 + 그라데이션 영역 */}
      <div className="relative">
        <div className="grid grid-cols-5 gap-3">
          {items.slice(0, MAX_VISIBLE_ITEMS).map((item) => (
            <ShowcaseCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>

        {/* 15개 초과 시 하단 그라데이션 + 더보기 버튼 */}
        {showViewMore && onViewMore && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-2 pointer-events-none">
            <button
              onClick={onViewMore}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-lg transition-colors"
            >
              <span>{type === 'image' ? '이미지 예시 더보기' : '영상 예시 더보기'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ShowcaseGallery() {
  const { t } = useLanguage()
  const { startOnboarding } = useOnboarding()
  const [imageShowcases, setImageShowcases] = useState<ShowcaseItem[]>([])
  const [videoShowcases, setVideoShowcases] = useState<ShowcaseItem[]>([])
  const [imageTotalCount, setImageTotalCount] = useState(0)
  const [videoTotalCount, setVideoTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // 쇼케이스 데이터 로드
  useEffect(() => {
    const fetchShowcases = async () => {
      try {
        const [imageRes, videoRes] = await Promise.all([
          fetch(`/api/showcases?type=image&limit=${MAX_VISIBLE_ITEMS + 1}`),
          fetch(`/api/showcases?type=video&limit=${MAX_VISIBLE_ITEMS + 1}`),
        ])

        if (imageRes.ok) {
          const data = await imageRes.json()
          setImageShowcases(data.showcases || [])
          setImageTotalCount(data.totalCount || 0)
        }

        if (videoRes.ok) {
          const data = await videoRes.json()
          setVideoShowcases(data.showcases || [])
          setVideoTotalCount(data.totalCount || 0)
        }
      } catch (error) {
        console.error('쇼케이스 로드 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShowcases()
  }, [])

  const handleShowcaseClick = (item: ShowcaseItem) => {
    // 쇼케이스 클릭 시 해당 타입의 광고 생성 온보딩 시작
    if (item.type === 'video') {
      startOnboarding('video')
    } else {
      startOnboarding('image')
    }
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground">
            {t.dashboard?.showcase?.title || '이런 광고를 만들 수 있어요'}
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  // 쇼케이스가 없으면 렌더링하지 않음
  if (imageShowcases.length === 0 && videoShowcases.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground">
            {t.dashboard?.showcase?.title || '이런 광고를 만들 수 있어요'}
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>AI Generated</span>
        </div>
      </div>

      {/* 이미지 광고 예시 */}
      <ShowcaseSection
        type="image"
        title="이미지 광고 예시"
        items={imageShowcases}
        totalCount={imageTotalCount}
        onItemClick={handleShowcaseClick}
      />

      {/* 영상 광고 예시 */}
      <ShowcaseSection
        type="video"
        title="영상 광고 예시"
        items={videoShowcases}
        totalCount={videoTotalCount}
        onItemClick={handleShowcaseClick}
      />

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => startOnboarding('image')}
          className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <span>{t.dashboard?.showcase?.cta || '나만의 광고 만들기'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
