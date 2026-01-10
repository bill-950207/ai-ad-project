/**
 * 이미지 광고 상세 컴포넌트
 *
 * 생성된 이미지 광고와 관련 제품, 아바타, 옵션 정보를 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import {
  ArrowLeft,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Package,
  User,
  Shirt,
  Settings2,
} from 'lucide-react'

interface AdProduct {
  id: string
  name: string
  image_url: string | null
  rembg_image_url: string | null
}

interface Avatar {
  id: string
  name: string
  image_url: string | null
}

interface Outfit {
  id: string
  name: string
  image_url: string | null
}

interface ImageAd {
  id: string
  image_url: string | null
  ad_type: string
  status: string
  prompt: string | null
  image_size: string | null
  quality: string | null
  created_at: string
  product_id: string | null
  avatar_id: string | null
  outfit_id: string | null
  ad_products: AdProduct | null
  avatars: Avatar | null
  avatar_outfits: Outfit | null
}

interface ImageAdDetailProps {
  imageAdId: string
}

export function ImageAdDetail({ imageAdId }: ImageAdDetailProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [imageAd, setImageAd] = useState<ImageAd | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchImageAd = useCallback(async () => {
    try {
      const res = await fetch(`/api/image-ads/${imageAdId}`)
      if (res.ok) {
        const data = await res.json()
        setImageAd(data.imageAd)
      } else {
        router.push('/dashboard/image-ad')
      }
    } catch (error) {
      console.error('이미지 광고 조회 오류:', error)
      router.push('/dashboard/image-ad')
    } finally {
      setIsLoading(false)
    }
  }, [imageAdId, router])

  useEffect(() => {
    fetchImageAd()
  }, [fetchImageAd])

  const handleDelete = async () => {
    if (!confirm(t.imageAdDetail?.confirmDelete || '이 이미지 광고를 삭제하시겠습니까?')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/image-ads/${imageAdId}`, {
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

  const handleDownload = async () => {
    if (!imageAd?.image_url) return

    try {
      const res = await fetch(imageAd.image_url)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-ad-${imageAdId}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('다운로드 오류:', error)
    }
  }

  const getAdTypeTitle = (adType: string): string => {
    const types = t.imageAdTypes as Record<string, { title?: string }>
    return types?.[adType]?.title || adType
  }

  const getQualityLabel = (quality: string | null): string => {
    if (!quality) return '-'
    const qualityOptions = (t.imageAdCreate as Record<string, unknown>)?.qualityOptions as Record<string, { label?: string }> | undefined
    return qualityOptions?.[quality]?.label || quality
  }

  const getAspectRatioLabel = (size: string | null): string => {
    if (!size) return '-'
    const ratios = (t.imageAdCreate as Record<string, unknown>)?.aspectRatios as Record<string, string> | undefined
    // Convert size format (e.g., "square_hd" -> "1:1")
    const sizeToRatio: Record<string, string> = {
      'square_hd': '1:1',
      'landscape_16_9': '16:9',
      'portrait_9_16': '9:16',
    }
    const ratio = sizeToRatio[size] || size
    return ratios?.[ratio] || ratio
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!imageAd) {
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
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t.imageAdDetail?.title || '이미지 광고 상세'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {getAdTypeTitle(imageAd.ad_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {imageAd.image_url && (
            <>
              <a
                href={imageAd.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t.imageAdDetail?.viewOriginal || '원본 보기'}
              </a>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                {t.imageAdDetail?.download || '다운로드'}
              </button>
            </>
          )}
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
            {t.adProduct?.delete || '삭제'}
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 생성된 이미지 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="aspect-square relative bg-[#1a1a2e]">
            {imageAd.image_url ? (
              <img
                src={imageAd.image_url}
                alt="Generated ad"
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-4">
          {/* 관련 제품 */}
          {imageAd.ad_products && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.product || '광고 제품'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                  {(imageAd.ad_products.rembg_image_url || imageAd.ad_products.image_url) ? (
                    <img
                      src={imageAd.ad_products.rembg_image_url || imageAd.ad_products.image_url || ''}
                      alt={imageAd.ad_products.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{imageAd.ad_products.name}</p>
                  <button
                    onClick={() => router.push(`/dashboard/image-ad/product/${imageAd.product_id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t.imageAdDetail?.viewProduct || '제품 상세보기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 관련 아바타 */}
          {imageAd.avatars && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.avatar || '아바타'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-secondary/30 overflow-hidden flex-shrink-0">
                  {imageAd.avatars.image_url ? (
                    <img
                      src={imageAd.avatars.image_url}
                      alt={imageAd.avatars.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{imageAd.avatars.name}</p>
                  <button
                    onClick={() => router.push(`/dashboard/avatar/${imageAd.avatar_id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t.imageAdDetail?.viewAvatar || '아바타 상세보기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 관련 의상 (착용샷인 경우) */}
          {imageAd.avatar_outfits && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shirt className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.outfit || '의상'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                  {imageAd.avatar_outfits.image_url ? (
                    <img
                      src={imageAd.avatar_outfits.image_url}
                      alt={imageAd.avatar_outfits.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="font-medium text-foreground">{imageAd.avatar_outfits.name}</p>
              </div>
            </div>
          )}

          {/* 생성 옵션 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">
                {t.imageAdDetail?.options || '생성 옵션'}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.adType || '광고 유형'}
                </span>
                <span className="text-foreground">{getAdTypeTitle(imageAd.ad_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.aspectRatio || '이미지 비율'}
                </span>
                <span className="text-foreground">{getAspectRatioLabel(imageAd.image_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.quality || '퀄리티'}
                </span>
                <span className="text-foreground">{getQualityLabel(imageAd.quality)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.createdAt || '생성일'}
                </span>
                <span className="text-foreground">
                  {new Date(imageAd.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* 프롬프트 */}
          {imageAd.prompt && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-medium text-foreground mb-2">
                {t.imageAdDetail?.prompt || '프롬프트'}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {imageAd.prompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
