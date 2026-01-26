/**
 * 이미지 광고 페이지 콘텐츠 컴포넌트
 *
 * 이미지 광고 목록을 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight, RefreshCw, CreditCard } from 'lucide-react'
import { uploadImageAdImage } from '@/lib/client/image-upload'

interface AdProduct {
  id: string
  name: string
  image_url: string | null
  rembg_image_url: string | null
}

interface ImageAd {
  id: string
  image_url: string | null
  image_urls: string[] | null  // 배치 이미지 URL 배열
  image_url_originals: string[] | null  // 원본 이미지 URL 배열
  num_images: number | null  // 요청된 이미지 개수
  batch_request_ids: Array<{ provider: string; requestId: string }> | null
  product_id: string | null
  avatar_id: string | null
  ad_type: string
  status: 'COMPLETED' | 'IN_QUEUE' | 'IN_PROGRESS' | 'IMAGES_READY' | 'FAILED'
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
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

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

  // 폴링 완료된 광고 ID 추적 (완료/실패 시 더 이상 폴링하지 않음)
  const completedPollingIdsRef = useRef<Set<string>>(new Set())
  // 현재 폴링 중인 광고 ID 추적 (중복 요청 방지)
  const pollingInProgressRef = useRef<Set<string>>(new Set())

  // 진행 중인 광고 폴링 (배치 지원, 비동기 병렬 처리)
  useEffect(() => {
    const inProgressAds = imageAds.filter(
      ad =>
        ['IN_QUEUE', 'IN_PROGRESS'].includes(ad.status) &&
        (ad.batch_request_ids || ad.fal_request_id) &&
        !completedPollingIdsRef.current.has(ad.id) // 이미 완료된 건 제외
    )

    if (inProgressAds.length === 0) return

    const pollSingleAd = async (ad: ImageAd) => {
      // 이미 폴링 중이면 스킵
      if (pollingInProgressRef.current.has(ad.id)) {
        console.log(`[polling] 이미 폴링 중, 스킵: ${ad.id}`)
        return
      }
      // 이미 완료된 건 스킵
      if (completedPollingIdsRef.current.has(ad.id)) {
        console.log(`[polling] 이미 완료됨, 스킵: ${ad.id}`)
        return
      }

      console.log(`[polling] 폴링 시작: ${ad.id}, 현재 상태: ${ad.status}`)
      pollingInProgressRef.current.add(ad.id)

      try {
        // 5초 타임아웃 설정 (R2 업로드 제거로 응답 빨라짐)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const res = await fetch(`/api/image-ads/batch-status/${ad.id}`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (res.ok) {
          const data = await res.json()

          // IMAGES_READY: AI 서비스 이미지 완료 - 클라이언트에서 R2 업로드
          if (data.status === 'IMAGES_READY') {
            console.log(`[polling] IMAGES_READY 수신: ${ad.id}, pendingImages:`, data.pendingImages?.length || 0)

            // 이미 다른 폴링에서 처리 시작했으면 스킵 (동시 요청 중복 방지)
            if (completedPollingIdsRef.current.has(ad.id)) {
              console.log(`[polling] 이미 처리 중, 스킵: ${ad.id}`)
              return
            }
            // 더 이상 폴링하지 않음 - 즉시 등록 (다른 동시 요청보다 먼저)
            completedPollingIdsRef.current.add(ad.id)
            console.log(`[polling] completedPollingIdsRef에 추가: ${ad.id}`)

            // pendingImages가 없으면 이미 DB에서 IMAGES_READY 상태 (다른 요청에서 처리 중)
            if (!data.pendingImages) {
              console.log(`[polling] pendingImages 없음, 스킵: ${ad.id}`)
              return
            }

            // 상태를 업로드 중으로 표시
            setImageAds(prev =>
              prev.map(a =>
                a.id === ad.id ? { ...a, status: 'IMAGES_READY' as const } : a
              )
            )

            // 업로드를 비동기로 분리하여 pollSingleAd가 즉시 완료되도록 함
            // (completedPollingIdsRef가 이미 등록되어 있어 추가 폴링 차단됨)
            const handleUpload = async () => {
              try {
                console.log(`[polling] R2 업로드 시작: ${ad.id}, 이미지 수: ${data.pendingImages.length}`)
                // 각 이미지 R2 업로드 (순차 처리로 네트워크 부하 분산)
                const uploadedUrls: Array<{ index: number; compressedUrl: string; originalUrl: string }> = []
                for (const pending of data.pendingImages as Array<{ index: number; aiServiceUrl: string }>) {
                  console.log(`[polling] 이미지 업로드 중: index=${pending.index}`)
                  const result = await uploadImageAdImage(ad.id, pending.index, pending.aiServiceUrl)
                  uploadedUrls.push({ index: pending.index, ...result })
                  console.log(`[polling] 이미지 업로드 완료: index=${pending.index}`)
                }

                // 정렬
                uploadedUrls.sort((a, b) => a.index - b.index)

                // DB 업데이트 (PATCH API)
                const patchRes = await fetch(`/api/image-ads/${ad.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    updateType: 'batch-urls',
                    imageUrls: uploadedUrls.map(u => u.compressedUrl),
                    imageUrlOriginals: uploadedUrls.map(u => u.originalUrl),
                  }),
                })

                if (patchRes.ok) {
                  console.log(`[polling] PATCH 성공, COMPLETED로 상태 변경: ${ad.id}`)
                  // 로컬 상태 업데이트
                  setImageAds(prev =>
                    prev.map(a =>
                      a.id === ad.id
                        ? {
                            ...a,
                            status: 'COMPLETED' as const,
                            image_urls: uploadedUrls.map(u => u.compressedUrl),
                            image_url_originals: uploadedUrls.map(u => u.originalUrl),
                            image_url: uploadedUrls[0]?.compressedUrl || a.image_url,
                          }
                        : a
                    )
                  )
                } else {
                  console.error(`[polling] PATCH 실패: ${ad.id}`, await patchRes.text())
                  setImageAds(prev =>
                    prev.map(a =>
                      a.id === ad.id ? { ...a, status: 'FAILED' as const } : a
                    )
                  )
                }
              } catch (uploadError) {
                console.error(`[polling] R2 업로드 오류: ${ad.id}`, uploadError)
                setImageAds(prev =>
                  prev.map(a =>
                    a.id === ad.id ? { ...a, status: 'FAILED' as const } : a
                  )
                )
              }
            }

            // await 없이 호출하여 pollSingleAd가 즉시 완료되도록 함
            handleUpload()
            console.log(`[polling] 업로드 시작됨, pollSingleAd 즉시 종료: ${ad.id}`)
          } else if (data.status === 'COMPLETED' && (data.imageUrls || data.imageUrl)) {
            // 이미 완료된 경우 (DB에 이미지 URL 있음)
            completedPollingIdsRef.current.add(ad.id)
            setImageAds(prev =>
              prev.map(a =>
                a.id === ad.id
                  ? {
                      ...a,
                      status: 'COMPLETED' as const,
                      image_urls: data.imageUrls || (data.imageUrl ? [data.imageUrl] : null),
                      image_url: data.imageUrls?.[0] || data.imageUrl || a.image_url,
                    }
                  : a
              )
            )
          } else if (data.status === 'FAILED') {
            // 실패 처리 - 더 이상 폴링하지 않음
            completedPollingIdsRef.current.add(ad.id)
            setImageAds(prev =>
              prev.map(a =>
                a.id === ad.id ? { ...a, status: 'FAILED' as const } : a
              )
            )
          }
        }
      } catch (error) {
        // 타임아웃이나 네트워크 오류는 무시 (다음 폴링에서 재시도)
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('이미지 광고 상태 폴링 오류:', error)
        }
      } finally {
        pollingInProgressRef.current.delete(ad.id)
      }
    }

    const pollStatus = () => {
      // 모든 진행 중인 광고에 대해 비동기 병렬 요청
      inProgressAds.forEach(ad => {
        pollSingleAd(ad)
      })
    }

    const interval = setInterval(pollStatus, 2000)
    pollStatus() // 즉시 한번 실행

    return () => clearInterval(interval)
  }, [imageAds])

  const handleCreateAd = () => {
    // 전체 화면 마법사 페이지로 이동 (Step 1에서 유형 선택)
    router.push('/image-ad-create')
  }

  // 환불 핸들러
  const handleRefund = async (adId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (processingIds.has(adId)) return

    if (!confirm('크레딧을 환불하고 이 광고를 삭제하시겠습니까?')) return

    setProcessingIds(prev => new Set(prev).add(adId))

    try {
      const res = await fetch(`/api/image-ads/${adId}/refund`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        // 목록에서 제거
        setImageAds(prev => prev.filter(ad => ad.id !== adId))
        alert(`${data.refundedCredits} 크레딧이 환불되었습니다.`)
      } else {
        const error = await res.json()
        alert(error.error || '환불에 실패했습니다.')
      }
    } catch (error) {
      console.error('환불 오류:', error)
      alert('환불 중 오류가 발생했습니다.')
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(adId)
        return next
      })
    }
  }

  // 재시도 핸들러
  const handleRetry = async (adId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (processingIds.has(adId)) return

    setProcessingIds(prev => new Set(prev).add(adId))

    try {
      const res = await fetch(`/api/image-ads/${adId}/retry`, {
        method: 'POST',
      })

      if (res.ok) {
        // 완료 목록에서 제거하여 다시 폴링 시작
        completedPollingIdsRef.current.delete(adId)
        // 상태를 IN_QUEUE로 업데이트
        setImageAds(prev =>
          prev.map(ad =>
            ad.id === adId
              ? { ...ad, status: 'IN_QUEUE' as const }
              : ad
          )
        )
      } else {
        const error = await res.json()
        alert(error.error || '재시도에 실패했습니다.')
      }
    } catch (error) {
      console.error('재시도 오류:', error)
      alert('재시도 중 오류가 발생했습니다.')
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(adId)
        return next
      })
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-square bg-secondary/30 rounded-2xl animate-pulse" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageAds.map(ad => {
              const isInProgress = ['IN_QUEUE', 'IN_PROGRESS'].includes(ad.status)
              const isFailed = ad.status === 'FAILED'
              // 하위 호환성: image_urls가 없으면 image_url로 배열 생성
              const imageUrls = ad.image_urls || (ad.image_url ? [ad.image_url] : [])
              const imageCount = imageUrls.length
              const hasMultipleImages = imageCount > 1

              // 이미지 개수에 따른 그리드 클래스
              const getImageGridClass = (count: number) => {
                if (count === 1) return 'grid-cols-1'
                if (count === 2) return 'grid-cols-2'
                if (count === 3) return 'grid-cols-3'
                if (count === 4) return 'grid-cols-2'
                return 'grid-cols-3'
              }

              return (
                <div
                  key={ad.id}
                  onClick={() => ad.status === 'COMPLETED' && router.push(`/dashboard/image-ad/${ad.id}`)}
                  className={`relative group bg-card border border-border rounded-2xl overflow-hidden transition-all ${
                    ad.status === 'COMPLETED'
                      ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg'
                      : ''
                  }`}
                >
                  {imageUrls.length > 0 ? (
                    <div className={`w-full grid ${getImageGridClass(imageCount)} gap-1 p-1`}>
                      {imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className={`aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden rounded-lg ${
                            imageCount === 1 ? 'aspect-square' : ''
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Generated ad ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : isInProgress ? (
                    <div className="w-full aspect-square flex flex-col items-center justify-center bg-secondary/30 gap-3">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        이미지 생성 중... {ad.num_images && ad.num_images > 1 ? `(${ad.num_images}장)` : ''}
                      </span>
                    </div>
                  ) : isFailed ? (
                    <div className="w-full aspect-square flex flex-col items-center justify-center bg-red-500/5 gap-3 p-4">
                      <ImageIcon className="w-10 h-10 text-red-500/50" />
                      <span className="text-sm text-red-500">생성 실패</span>
                      {/* 환불/재시도 버튼 */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => handleRetry(ad.id, e)}
                          disabled={processingIds.has(ad.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingIds.has(ad.id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          재시도
                        </button>
                        <button
                          onClick={(e) => handleRefund(ad.id, e)}
                          disabled={processingIds.has(ad.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          환불
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center bg-secondary/30">
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

                  {/* 이미지 개수 뱃지 (배치인 경우) */}
                  {hasMultipleImages && ad.status === 'COMPLETED' && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 text-xs font-medium bg-white/90 text-black rounded-lg backdrop-blur-sm">
                        {imageCount}장
                      </span>
                    </div>
                  )}

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
