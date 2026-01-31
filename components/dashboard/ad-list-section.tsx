/**
 * 광고 목록 섹션 컴포넌트
 *
 * 이미지 광고와 영상 광고 목록을 각각 표시합니다.
 * - 3행 x 5열 그리드 (최대 15개)
 * - 15개 초과 시 하단에 흐릿한 그라데이션 + 더보기 버튼
 * - 처리 중인 항목 상태 표시
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, Play, Loader2, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

// ============================================================
// 타입 정의
// ============================================================

interface AdItem {
  id: string
  name: string
  thumbnail: string | null
  status: string
  createdAt: string
}

interface AdListSectionProps {
  type: 'image' | 'video'
  title: string
  viewAllHref: string
}

// API 응답 타입
interface ImageAdResponse {
  id: string
  name?: string
  product?: { name: string }
  images?: { image_url: string }[]
  image_url?: string
  status: string
  created_at: string
}

interface VideoAdResponse {
  id: string
  name?: string
  product?: { name: string }
  thumbnail_url?: string
  status: string
  created_at: string
}

// 처리 중인 상태
const PROCESSING_STATUSES = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS', 'PROCESSING', 'GENERATING']

// 표시 설정
const ITEMS_PER_ROW = 5
const MAX_ROWS = 3
const MAX_VISIBLE_ITEMS = ITEMS_PER_ROW * MAX_ROWS // 15개

// ============================================================
// 개별 광고 카드 컴포넌트
// ============================================================

interface AdCardProps {
  item: AdItem
  type: 'image' | 'video'
  onClick: () => void
}

function AdCard({ item, type, onClick }: AdCardProps) {
  const { t } = useLanguage()
  const isProcessing = PROCESSING_STATUSES.includes(item.status)
  const [imageLoaded, setImageLoaded] = useState(false)

  const getStatusLabel = () => {
    if (item.status === 'COMPLETED') return null
    if (item.status === 'FAILED') return t.videoAd?.status?.failed || 'Failed'
    return t.videoAd?.status?.inProgress || 'Generating'
  }

  const statusLabel = getStatusLabel()

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden bg-secondary/30 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform duration-300 hover:scale-[1.02]"
    >
      {/* 썸네일 */}
      {item.thumbnail && !isProcessing ? (
        <img
          src={item.thumbnail}
          alt={item.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      ) : null}

      {/* 로딩/처리 중 표시 */}
      {(isProcessing || (!item.thumbnail && item.status !== 'FAILED')) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
          <Loader2 className="w-6 h-6 text-primary animate-spin mb-1" />
          <span className="text-[10px] text-muted-foreground">{statusLabel}</span>
        </div>
      )}

      {/* 실패 상태 */}
      {item.status === 'FAILED' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10">
          <span className="text-xs text-red-500">{statusLabel}</span>
        </div>
      )}

      {/* 타입 아이콘 */}
      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-black/50 backdrop-blur-sm flex items-center justify-center">
        {type === 'video' ? (
          <Play className="w-2.5 h-2.5 text-white fill-white" />
        ) : (
          <ImageIcon className="w-2.5 h-2.5 text-white" />
        )}
      </div>

      {/* 하단 그라데이션 오버레이 */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />

      {/* 제목 */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-[10px] font-medium text-white truncate">{item.name}</p>
      </div>

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 테두리 */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/30 transition-[box-shadow] duration-300" />
    </button>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function AdListSection({ type, title, viewAllHref }: AdListSectionProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [items, setItems] = useState<AdItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasProcessing, setHasProcessing] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 광고 데이터 로드
   */
  const fetchAds = useCallback(async () => {
    try {
      const endpoint = type === 'image' ? '/api/image-ads' : '/api/video-ads'
      const res = await fetch(`${endpoint}?limit=${MAX_VISIBLE_ITEMS + 1}`)

      if (res.ok) {
        const data = await res.json()
        const adsArray = data.ads || []

        // 전체 개수 저장
        setTotalCount(data.pagination?.totalCount || adsArray.length)

        // 아이템 변환
        const transformedItems: AdItem[] = adsArray.slice(0, MAX_VISIBLE_ITEMS).map((ad: ImageAdResponse | VideoAdResponse) => ({
          id: ad.id,
          name: ad.name || (ad as ImageAdResponse).product?.name || (type === 'image' ? '이미지 광고' : '영상 광고'),
          thumbnail: type === 'image'
            ? ((ad as ImageAdResponse).images?.[0]?.image_url || (ad as ImageAdResponse).image_url || null)
            : ((ad as VideoAdResponse).thumbnail_url || null),
          status: ad.status,
          createdAt: ad.created_at,
        }))

        setItems(transformedItems)

        // 처리 중인 항목 확인
        const processingExists = transformedItems.some(item => PROCESSING_STATUSES.includes(item.status))
        setHasProcessing(processingExists)
      }
    } catch (error) {
      console.error(`${type} 광고 목록 로드 오류:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [type])

  // 초기 로드
  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  // 처리 중인 항목이 있으면 폴링
  useEffect(() => {
    if (hasProcessing && !isLoading) {
      if (pollingRef.current) return

      pollingRef.current = setInterval(fetchAds, 5000)
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [hasProcessing, isLoading, fetchAds])

  /**
   * 카드 클릭 핸들러
   */
  const handleCardClick = (item: AdItem) => {
    if (type === 'video') {
      router.push(`/dashboard/video-ad/${item.id}`)
    } else {
      router.push(`/dashboard/image-ad/${item.id}`)
    }
  }

  /**
   * 더보기 클릭
   */
  const handleViewAll = () => {
    router.push(viewAllHref)
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // 아이템이 없으면 렌더링하지 않음
  if (items.length === 0) {
    return null
  }

  const showViewMore = totalCount > MAX_VISIBLE_ITEMS

  return (
    <div className="space-y-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span className="text-xs text-muted-foreground">({totalCount})</span>
          {hasProcessing && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px]">{t.dashboard?.recentWork?.processing || '생성 중'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 광고 그리드 + 그라데이션 영역 */}
      <div className="relative">
        {/* 그리드 */}
        <div className="grid grid-cols-5 gap-3">
          {items.map((item) => (
            <AdCard
              key={item.id}
              item={item}
              type={type}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>

        {/* 15개 초과 시 하단 그라데이션 + 더보기 버튼 */}
        {showViewMore && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-2 pointer-events-none">
            <button
              onClick={handleViewAll}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-lg transition-colors"
            >
              <span>{type === 'image' ? '이미지 광고 더보기' : '영상 광고 더보기'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
