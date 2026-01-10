/**
 * 광고 제품 상세 컴포넌트
 *
 * 제품 이미지와 해당 제품으로 만든 광고 목록을 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft, Trash2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react'

interface AdProduct {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'EDITING' | 'UPLOADING' | 'COMPLETED' | 'FAILED'
  image_url: string | null
  source_image_url: string | null
  rembg_image_url?: string | null  // 배경 제거된 원본 (표시용)
  created_at: string
  error_message?: string | null
}

interface ImageAd {
  id: string
  image_url: string | null
  product_id: string | null
  avatar_id: string | null
  ad_type: string
  status: string
  created_at: string
}

interface AdProductDetailProps {
  productId: string
}

export function AdProductDetail({ productId }: AdProductDetailProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [product, setProduct] = useState<AdProduct | null>(null)
  const [productAds, setProductAds] = useState<ImageAd[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdsLoading, setIsAdsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/ad-products/${productId}`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data.product)
      } else {
        router.push('/dashboard/image-ad')
      }
    } catch (error) {
      console.error('제품 조회 오류:', error)
      router.push('/dashboard/image-ad')
    } finally {
      setIsLoading(false)
    }
  }, [productId, router])

  const fetchProductAds = useCallback(async () => {
    try {
      const res = await fetch(`/api/image-ads?productId=${productId}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setProductAds(data.ads || [])
      }
    } catch (error) {
      console.error('제품 광고 조회 오류:', error)
    } finally {
      setIsAdsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
    fetchProductAds()
  }, [fetchProduct, fetchProductAds])

  const handleDelete = async () => {
    if (!confirm(t.adProduct.confirmDelete)) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/ad-products/${productId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard/image-ad')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateAd = () => {
    router.push('/dashboard/image-ad/create?type=productOnly')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/image-ad')}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {t.adProduct.delete}
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 제품 이미지 - 배경 제거된 원본 사용 */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="aspect-square relative bg-[#1a1a2e]">
              {product.rembg_image_url ? (
                <img
                  src={product.rembg_image_url}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />
              ) : product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 광고 목록 */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t.adProduct.myProductAds}</h2>
              {productAds.length > 0 && (
                <button
                  onClick={handleCreateAd}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t.adProduct.createAd}
                </button>
              )}
            </div>

            {isAdsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-secondary/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : productAds.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground mb-4">{t.adProduct.emptyAds}</p>
                <button
                  onClick={handleCreateAd}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t.adProduct.createAd}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {productAds.map(ad => (
                  <div
                    key={ad.id}
                    className="relative group bg-secondary/30 rounded-lg overflow-hidden aspect-square cursor-pointer"
                  >
                    {ad.image_url ? (
                      <img
                        src={ad.image_url}
                        alt="Generated ad"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={ad.image_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(t.imageAdCreate as { viewOriginal?: string })?.viewOriginal || '원본 보기'}
                      </a>
                    </div>
                    {/* 광고 타입 뱃지 */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs font-medium bg-black/50 text-white rounded">
                        {(t.imageAdTypes as Record<string, { title?: string }>)?.[ad.ad_type]?.title || ad.ad_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
