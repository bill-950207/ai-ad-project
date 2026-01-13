/**
 * 이미지 광고 페이지 콘텐츠 컴포넌트
 *
 * 이미지 광고 목록을 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Image as ImageIcon } from 'lucide-react'
import { ImageAdTypeModal, ImageAdType } from './image-ad-type-modal'

interface ImageAd {
  id: string
  image_url: string | null
  product_id: string | null
  avatar_id: string | null
  ad_type: string
  status: string
  created_at: string
}

export function ImageAdPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const [imageAds, setImageAds] = useState<ImageAd[]>([])
  const [isAdsLoading, setIsAdsLoading] = useState(true)
  const [showTypeModal, setShowTypeModal] = useState(false)

  const fetchImageAds = useCallback(async () => {
    try {
      const res = await fetch('/api/image-ads?limit=20')
      if (res.ok) {
        const data = await res.json()
        setImageAds(data.ads || [])
      }
    } catch (error) {
      console.error('이미지 광고 목록 조회 오류:', error)
    } finally {
      setIsAdsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImageAds()
  }, [fetchImageAds])

  const handleCreateAd = () => {
    setShowTypeModal(true)
  }

  const handleSelectAdType = (type: ImageAdType) => {
    setShowTypeModal(false)
    router.push(`/dashboard/image-ad/create?type=${type}`)
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.imageAd?.title || '이미지 광고'}</h1>
          <p className="text-muted-foreground">{t.imageAd?.subtitle || '이미지 광고를 생성하고 관리하세요'}</p>
        </div>
        <button
          onClick={handleCreateAd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.adProduct.createAd}
        </button>
      </div>

      {/* 이미지 광고 섹션 */}
      <section>
        {isAdsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[4/3] bg-secondary/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : imageAds.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">{t.adProduct.emptyAds}</h3>
            <p className="text-muted-foreground mb-6">{'이미지 광고를 생성해보세요'}</p>
            <button
              onClick={handleCreateAd}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              {t.adProduct.createAd}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imageAds.map(ad => (
              <div
                key={ad.id}
                onClick={() => router.push(`/dashboard/image-ad/${ad.id}`)}
                className="relative group bg-card border border-border rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all"
              >
                {ad.image_url ? (
                  <img
                    src={ad.image_url}
                    alt="Generated ad"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-5 py-2.5 bg-white text-black rounded-xl text-sm font-medium">
                    {t.imageAdDetail?.viewDetail || '상세보기'}
                  </span>
                </div>
                {/* 광고 타입 뱃지 */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1.5 text-xs font-medium bg-black/60 text-white rounded-lg backdrop-blur-sm">
                    {(t.imageAdTypes as Record<string, { title?: string }>)?.[ad.ad_type]?.title || ad.ad_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 광고 유형 선택 모달 */}
      <ImageAdTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelect={handleSelectAdType}
      />
    </div>
  )
}
