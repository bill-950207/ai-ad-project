/**
 * 최근 생성 광고 섹션 컴포넌트
 *
 * 사용자가 최근에 생성한 광고를 한 줄로 표시합니다.
 * - 이미지 + 영상 광고 혼합
 * - 최대 5개 표시
 * - 생성일 기준 정렬
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, Play, Loader2, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { Badge } from '@/components/ui/badge'
import { GridSkeleton } from '@/components/ui/skeleton'

// ============================================================
// 타입 정의
// ============================================================

interface RecentAdItem {
  id: string
  type: 'image' | 'video'
  name: string
  thumbnail: string | null
  status: string
  createdAt: string
}

// 처리 중인 상태
const PROCESSING_STATUSES = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS', 'PROCESSING', 'GENERATING']

// 표시 설정
const MAX_ITEMS = 5

// ============================================================
// 개별 광고 카드 컴포넌트
// ============================================================

interface RecentAdCardProps {
  item: RecentAdItem
  onClick: () => void
}

function RecentAdCard({ item, onClick }: RecentAdCardProps) {
  const { t } = useLanguage()
  const isProcessing = PROCESSING_STATUSES.includes(item.status)
  const [imageLoaded, setImageLoaded] = useState(false)

  const getStatusLabel = () => {
    if (item.status === 'COMPLETED') return null
    if (item.status === 'FAILED') return t.videoAd?.status?.failed || 'Failed'
    return t.videoAd?.status?.inProgress || 'In Progress'
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
        {item.type === 'video' ? (
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

export function RecentAdsSection() {
  const { t } = useLanguage()
  const router = useRouter()
  const [items, setItems] = useState<RecentAdItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasProcessing, setHasProcessing] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 최근 광고 데이터 로드 (이미지 + 영상 혼합)
   */
  const fetchRecentAds = useCallback(async () => {
    try {
      const [imageRes, videoRes] = await Promise.all([
        fetch('/api/image-ads?limit=5'),
        fetch('/api/video-ads?limit=5'),
      ])

      const allAds: RecentAdItem[] = []

      if (imageRes.ok) {
        const data = await imageRes.json()
        const imageAds = (data.ads || []).map((ad: {
          id: string
          name?: string
          product?: { name: string }
          images?: { image_url: string }[]
          image_url?: string
          status: string
          created_at: string
        }) => ({
          id: ad.id,
          type: 'image' as const,
          name: ad.name || ad.product?.name || 'Image Ad',
          thumbnail: ad.images?.[0]?.image_url || ad.image_url || null,
          status: ad.status,
          createdAt: ad.created_at,
        }))
        allAds.push(...imageAds)
      }

      if (videoRes.ok) {
        const data = await videoRes.json()
        const videoAds = (data.ads || []).map((ad: {
          id: string
          name?: string
          product?: { name: string }
          thumbnail_url?: string
          status: string
          created_at: string
        }) => ({
          id: ad.id,
          type: 'video' as const,
          name: ad.name || ad.product?.name || 'Video Ad',
          thumbnail: ad.thumbnail_url || null,
          status: ad.status,
          createdAt: ad.created_at,
        }))
        allAds.push(...videoAds)
      }

      // 생성일 기준 정렬 후 최근 5개만
      const sortedAds = allAds
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_ITEMS)

      setItems(sortedAds)

      // 처리 중인 항목 확인
      const processingExists = sortedAds.some(item => PROCESSING_STATUSES.includes(item.status))
      setHasProcessing(processingExists)
    } catch (error) {
      console.error('Failed to load recent ads:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    fetchRecentAds()
  }, [fetchRecentAds])

  // 처리 중인 항목이 있으면 폴링
  useEffect(() => {
    if (hasProcessing && !isLoading) {
      if (pollingRef.current) return

      pollingRef.current = setInterval(fetchRecentAds, 5000)
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
  }, [hasProcessing, isLoading, fetchRecentAds])

  /**
   * 카드 클릭 핸들러
   */
  const handleCardClick = (item: RecentAdItem) => {
    if (item.type === 'video') {
      router.push(`/dashboard/video-ad/${item.id}`)
    } else {
      router.push(`/dashboard/image-ad/${item.id}`)
    }
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground">
            {t.dashboard?.recentWork?.title || 'Recent Ads'}
          </h2>
        </div>
        <GridSkeleton
          count={5}
          columns={{ default: 2, sm: 3, md: 4, lg: 5 }}
          aspectRatio="square"
        />
      </div>
    )
  }

  // 아이템이 없으면 렌더링하지 않음
  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground">
            {t.dashboard?.recentWork?.title || 'Recent Ads'}
          </h2>
          {hasProcessing && (
            <Badge variant="primary" size="sm" className="gap-1 bg-primary/10 text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px]">{t.dashboard?.recentWork?.processing || 'In Progress'}</span>
            </Badge>
          )}
        </div>
        <button
          onClick={() => router.push('/dashboard/image-ad')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{t.dashboard?.recentWork?.viewAll || 'View All'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 광고 그리드 - 반응형 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <RecentAdCard
            key={`${item.type}-${item.id}`}
            item={item}
            onClick={() => handleCardClick(item)}
          />
        ))}
      </div>
    </div>
  )
}
