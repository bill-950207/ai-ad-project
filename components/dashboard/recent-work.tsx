/**
 * 최근 작업 컴포넌트
 *
 * 사용자가 최근에 생성한 이미지 광고와 영상 광고를 표시합니다.
 * - 최근 6개 항목만 표시
 * - 생성 중인 항목은 진행 상태 표시
 * - 각 항목 클릭 시 상세 페이지로 이동
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, Loader2, ArrowRight, Play } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

// ============================================================
// 타입 정의
// ============================================================

interface RecentItem {
  id: string
  type: 'image' | 'video'
  name: string
  thumbnail: string | null
  status: string
  createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RecentWorkProps {
  // 최근 작업이 없으면 컴포넌트가 null을 반환하여 자동으로 숨김
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

// ============================================================
// 개별 작업 카드 컴포넌트
// ============================================================

interface WorkCardProps {
  item: RecentItem
  onClick: () => void
}

function WorkCard({ item, onClick }: WorkCardProps) {
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
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground">{statusLabel}</span>
        </div>
      )}

      {/* 실패 상태 */}
      {item.status === 'FAILED' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10">
          <span className="text-sm text-red-500">{statusLabel}</span>
        </div>
      )}

      {/* 타입 아이콘 */}
      <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-black/50 backdrop-blur-sm flex items-center justify-center">
        {item.type === 'video' ? (
          <Play className="w-3 h-3 text-white fill-white" />
        ) : (
          <ImageIcon className="w-3 h-3 text-white" />
        )}
      </div>

      {/* 하단 그라데이션 오버레이 */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

      {/* 제목 */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-xs font-medium text-white truncate">{item.name}</p>
        <p className="text-[10px] text-white/60 mt-0.5">
          {new Date(item.createdAt).toLocaleDateString()}
        </p>
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

export function RecentWork(_props: RecentWorkProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [items, setItems] = useState<RecentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasProcessing, setHasProcessing] = useState(false)

  /**
   * 최근 작업 데이터 로드
   */
  const fetchRecentWork = useCallback(async () => {
    try {
      // 이미지 광고와 영상 광고를 병렬로 조회
      const [imageRes, videoRes] = await Promise.all([
        fetch('/api/image-ads?limit=6'),
        fetch('/api/video-ads?limit=6'),
      ])

      const imageData = imageRes.ok ? await imageRes.json() : { ads: [] }
      const videoData = videoRes.ok ? await videoRes.json() : { ads: [] }

      // 이미지 광고 변환
      const imageItems: RecentItem[] = ((imageData.ads || []) as ImageAdResponse[]).map((ad) => ({
        id: ad.id,
        type: 'image' as const,
        name: ad.name || ad.product?.name || 'Image Ad',
        thumbnail: ad.images?.[0]?.image_url || ad.image_url || null,
        status: ad.status,
        createdAt: ad.created_at,
      }))

      // 영상 광고 변환
      const videoItems: RecentItem[] = ((videoData.ads || []) as VideoAdResponse[]).map((ad) => ({
        id: ad.id,
        type: 'video' as const,
        name: ad.name || ad.product?.name || 'Video Ad',
        thumbnail: ad.thumbnail_url || null,
        status: ad.status,
        createdAt: ad.created_at,
      }))

      // 날짜순 정렬 후 최근 6개만
      const combined = [...imageItems, ...videoItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)

      setItems(combined)

      // 처리 중인 항목이 있는지 확인
      const processingExists = combined.some(item => PROCESSING_STATUSES.includes(item.status))
      setHasProcessing(processingExists)
    } catch (error) {
      console.error('Failed to load recent work:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    fetchRecentWork()
  }, [fetchRecentWork])

  // 처리 중인 항목이 있으면 폴링
  useEffect(() => {
    if (!hasProcessing) return

    const interval = setInterval(fetchRecentWork, 5000) // 5초 간격
    return () => clearInterval(interval)
  }, [hasProcessing, fetchRecentWork])

  /**
   * 카드 클릭 핸들러
   */
  const handleCardClick = (item: RecentItem) => {
    if (item.type === 'video') {
      router.push(`/dashboard/video-ad/${item.id}`)
    } else {
      router.push(`/dashboard/image-ad/${item.id}`)
    }
  }

  /**
   * 전체 보기 클릭
   */
  const handleViewAll = () => {
    router.push('/dashboard/image-ad')
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {t.dashboard?.recentWork?.title || 'Recent Work'}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // 작업이 없으면 렌더링하지 않음 (부모에서 Showcase 표시)
  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {t.dashboard?.recentWork?.title || 'Recent Work'}
          </h2>
          {hasProcessing && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">{t.dashboard?.recentWork?.processing || 'In Progress'}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{t.dashboard?.recentWork?.viewAll || 'View All'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 작업 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <WorkCard
            key={`${item.type}-${item.id}`}
            item={item}
            onClick={() => handleCardClick(item)}
          />
        ))}
      </div>
    </div>
  )
}
