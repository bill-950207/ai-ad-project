/**
 * 영상 광고 페이지 콘텐츠 컴포넌트
 *
 * 상단: 광고 제품 가로 스크롤 목록
 * 하단: 영상 광고 그리드
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Package, Video, Play, Loader2 } from 'lucide-react'
import { AdProductCard } from '../ad-product/ad-product-card'

interface AdProduct {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'EDITING' | 'UPLOADING' | 'COMPLETED' | 'FAILED'
  image_url: string | null
  source_image_url: string | null
  rembg_temp_url?: string | null
  rembg_image_url?: string | null
  created_at: string
  error_message?: string | null
}

interface VideoAd {
  id: string
  video_url: string | null
  thumbnail_url: string | null
  product_id: string | null
  avatar_id: string | null
  duration: number | null
  resolution: string | null
  status: string
  created_at: string
}

export function VideoAdPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const [products, setProducts] = useState<AdProduct[]>([])
  const [videoAds, setVideoAds] = useState<VideoAd[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdsLoading, setIsAdsLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('광고 제품 목록 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchVideoAds = useCallback(async () => {
    try {
      const res = await fetch('/api/video-ads?limit=20')
      if (res.ok) {
        const data = await res.json()
        setVideoAds(data.videos || [])
      }
    } catch (error) {
      console.error('영상 광고 목록 조회 오류:', error)
    } finally {
      setIsAdsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchVideoAds()
  }, [fetchProducts, fetchVideoAds])

  const handleProductStatusUpdate = (updatedProduct: AdProduct) => {
    setProducts(prev =>
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    )
  }

  const handleRegisterProduct = () => {
    router.push('/dashboard/image-ad/product/new')
  }

  const handleCreateVideoAd = () => {
    router.push('/dashboard/video-ad/create')
  }

  const handleVideoClick = (videoId: string) => {
    router.push(`/dashboard/video-ad/${videoId}`)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'PENDING': { label: t.videoAd?.status?.pending || '대기 중', className: 'bg-yellow-500/20 text-yellow-500' },
      'IN_QUEUE': { label: t.videoAd?.status?.inQueue || '큐 대기', className: 'bg-blue-500/20 text-blue-500' },
      'IN_PROGRESS': { label: t.videoAd?.status?.inProgress || '생성 중', className: 'bg-purple-500/20 text-purple-500' },
      'COMPLETED': { label: t.videoAd?.status?.completed || '완료', className: 'bg-green-500/20 text-green-500' },
      'FAILED': { label: t.videoAd?.status?.failed || '실패', className: 'bg-red-500/20 text-red-500' },
    }
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500/20 text-gray-500' }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t.videoAd?.title || '영상 광고'}</h1>
        <p className="text-muted-foreground">{t.videoAd?.subtitle || 'AI로 영상 광고를 제작하세요'}</p>
      </div>

      {/* 광고 제품 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t.adProduct?.myProducts || '내 광고 제품'}</h2>
          <button
            onClick={handleRegisterProduct}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.adProduct?.registerProduct || '광고 제품 등록'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-shrink-0 w-32 h-40 bg-secondary/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4">{t.adProduct?.emptyProducts || '등록된 광고 제품이 없습니다'}</p>
            <button
              onClick={handleRegisterProduct}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.adProduct?.registerProduct || '광고 제품 등록'}
            </button>
          </div>
        ) : (
          <div className="relative group">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {products.map(product => (
                <AdProductCard
                  key={product.id}
                  product={product}
                  onStatusUpdate={handleProductStatusUpdate}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 영상 광고 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t.videoAd?.myVideos || '내 영상 광고'}</h2>
          <button
            onClick={handleCreateVideoAd}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.videoAd?.createAd || '영상 광고 생성'}
          </button>
        </div>

        {isAdsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-video bg-secondary/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : videoAds.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{t.videoAd?.emptyAds || '생성된 영상 광고가 없습니다'}</h3>
            <p className="text-muted-foreground mb-4">
              {products.some(p => p.status === 'COMPLETED')
                ? (t.videoAd?.createFirstAd || '첫 영상 광고를 만들어보세요')
                : (t.adProduct?.registerProduct || '광고 제품을 먼저 등록해주세요')}
            </p>
            <button
              onClick={products.some(p => p.status === 'COMPLETED') ? handleCreateVideoAd : handleRegisterProduct}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {products.some(p => p.status === 'COMPLETED')
                ? (t.videoAd?.createAd || '영상 광고 생성')
                : (t.adProduct?.registerProduct || '광고 제품 등록')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoAds.map(video => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video.id)}
                className="relative group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              >
                {/* 비디오 썸네일 또는 플레이스홀더 */}
                <div className="aspect-video relative bg-[#1a1a2e]">
                  {video.video_url && video.status === 'COMPLETED' ? (
                    <>
                      <video
                        src={video.video_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause()
                          e.currentTarget.currentTime = 0
                        }}
                      />
                      {/* 재생 아이콘 오버레이 */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-6 h-6 text-black ml-1" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {video.status === 'IN_PROGRESS' || video.status === 'IN_QUEUE' ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      ) : (
                        <Video className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {video.duration && <span>{video.duration}초</span>}
                      {video.resolution && <span>{video.resolution}</span>}
                    </div>
                    {getStatusBadge(video.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
