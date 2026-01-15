/**
 * 이미지 광고 페이지 콘텐츠 컴포넌트
 *
 * 이미지 광고 목록을 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface AdProduct {
  id: string
  name: string
  image_url: string | null
  rembg_image_url: string | null
}

interface ImageAd {
  id: string
  image_url: string | null
  product_id: string | null
  avatar_id: string | null
  ad_type: string
  status: 'COMPLETED' | 'IN_QUEUE' | 'IN_PROGRESS' | 'FAILED'
  fal_request_id: string | null
  created_at: string
  ad_products: AdProduct | null
}

interface PaginationInfo {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

const PAGE_SIZE = 12

export function ImageAdPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const [imageAds, setImageAds] = useState<ImageAd[]>([])
  const [isAdsLoading, setIsAdsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  const fetchImageAds = useCallback(async (page: number = 1) => {
    setIsAdsLoading(true)
    try {
      const res = await fetch(`/api/image-ads?page=${page}&pageSize=${PAGE_SIZE}`)
      if (res.ok) {
        const data = await res.json()
        setImageAds(data.ads || [])
        setPagination(data.pagination || null)
      }
    } catch (error) {
      console.error('이미지 광고 목록 조회 오류:', error)
    } finally {
      setIsAdsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImageAds(currentPage)
  }, [fetchImageAds, currentPage])

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 진행 중인 광고 폴링
  useEffect(() => {
    const inProgressAds = imageAds.filter(
      ad => ['IN_QUEUE', 'IN_PROGRESS'].includes(ad.status) && ad.fal_request_id
    )

    if (inProgressAds.length === 0) return

    const pollStatus = async () => {
      for (const ad of inProgressAds) {
        if (!ad.fal_request_id) continue

        try {
          const res = await fetch(`/api/image-ads/status/${ad.fal_request_id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.status === 'COMPLETED' && data.imageUrl) {
              // 상태 업데이트
              setImageAds(prev =>
                prev.map(a =>
                  a.id === ad.id
                    ? { ...a, status: 'COMPLETED' as const, image_url: data.imageUrl }
                    : a
                )
              )
            } else if (data.status === 'FAILED') {
              setImageAds(prev =>
                prev.map(a =>
                  a.id === ad.id ? { ...a, status: 'FAILED' as const } : a
                )
              )
            }
          }
        } catch (error) {
          console.error('이미지 광고 상태 폴링 오류:', error)
        }
      }
    }

    const interval = setInterval(pollStatus, 2000)
    pollStatus() // 즉시 한번 실행

    return () => clearInterval(interval)
  }, [imageAds])

  const handleCreateAd = () => {
    // 전체 화면 마법사 페이지로 이동 (Step 1에서 유형 선택)
    router.push('/image-ad-create')
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
            {imageAds.map(ad => {
              const isInProgress = ['IN_QUEUE', 'IN_PROGRESS'].includes(ad.status)
              const isFailed = ad.status === 'FAILED'

              return (
                <div
                  key={ad.id}
                  onClick={() => ad.status === 'COMPLETED' && router.push(`/dashboard/image-ad/${ad.id}`)}
                  className={`relative group bg-card border border-border rounded-2xl overflow-hidden aspect-[4/3] transition-all ${
                    ad.status === 'COMPLETED'
                      ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg'
                      : ''
                  }`}
                >
                  {ad.image_url ? (
                    <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
                      <img
                        src={ad.image_url}
                        alt="Generated ad"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : isInProgress ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/30 gap-3">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">이미지 생성 중...</span>
                    </div>
                  ) : isFailed ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-500/5 gap-2">
                      <ImageIcon className="w-10 h-10 text-red-500/50" />
                      <span className="text-sm text-red-500">생성 실패</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* 호버 오버레이 - 완료된 경우만 */}
                  {ad.status === 'COMPLETED' && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-5 py-2.5 bg-white text-black rounded-xl text-sm font-medium">
                        {t.imageAdDetail?.viewDetail || '상세보기'}
                      </span>
                    </div>
                  )}

                  {/* 광고 타입 뱃지 */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1.5 text-xs font-medium bg-black/60 text-white rounded-lg backdrop-blur-sm">
                      {(t.imageAdTypes as Record<string, { title?: string }>)?.[ad.ad_type]?.title || ad.ad_type}
                    </span>
                  </div>

                  {/* 진행 중 상태 뱃지 */}
                  {isInProgress && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1.5 text-xs font-medium bg-primary/80 text-white rounded-lg backdrop-blur-sm animate-pulse">
                        생성 중...
                      </span>
                    </div>
                  )}

                  {/* 실패 상태 뱃지 */}
                  {isFailed && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1.5 text-xs font-medium bg-red-500/80 text-white rounded-lg backdrop-blur-sm">
                        실패
                      </span>
                    </div>
                  )}

                  {/* 제품 이미지 (좌측 하단) */}
                  {ad.ad_products && (ad.ad_products.rembg_image_url || ad.ad_products.image_url) && (
                    <div className="absolute bottom-3 left-3">
                      <div className="w-14 h-14 rounded-xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-md overflow-hidden flex items-center justify-center">
                        <img
                          src={ad.ad_products.rembg_image_url || ad.ad_products.image_url || ''}
                          alt={ad.ad_products.name}
                          className="w-11 h-11 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {/* 페이지 버튼들 */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // 첫 페이지, 마지막 페이지, 현재 페이지 주변 2페이지만 표시
                  if (page === 1 || page === pagination.totalPages) return true
                  if (Math.abs(page - currentPage) <= 1) return true
                  return false
                })
                .map((page, index, arr) => {
                  // 생략 부호(...) 표시
                  const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsisBefore && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary text-foreground'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  )
                })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* 총 개수 표시 */}
            <span className="ml-4 text-sm text-muted-foreground">
              총 {pagination.totalCount}개
            </span>
          </div>
        )}
      </section>

    </div>
  )
}
