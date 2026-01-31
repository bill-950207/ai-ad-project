/**
 * 광고 제품 상세 컴포넌트
 *
 * 제품 이미지와 해당 제품으로 만든 광고 목록을 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Trash2, Plus, Image as ImageIcon, Loader2, RefreshCw, Edit3, X, Check, Tag, DollarSign, Building2, FileText, Sparkles } from 'lucide-react'
import { AdCreationHeader } from '@/components/ui/ad-creation-header'

interface AdProduct {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  image_url: string | null
  source_image_url: string | null
  rembg_image_url?: string | null
  created_at: string
  error_message?: string | null
  description?: string | null
  selling_points?: string[] | null
  price?: string | null
  brand?: string | null
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
  const [isRetrying, setIsRetrying] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    brand: '',
    selling_points: [''],
  })

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/ad-products/${productId}`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data.product)
      } else {
        router.push('/dashboard/ad-products')
      }
    } catch (error) {
      console.error('제품 조회 오류:', error)
      router.push('/dashboard/ad-products')
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

  // 편집 모드 시작
  const handleStartEdit = () => {
    if (!product) return
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      brand: product.brand || '',
      selling_points: product.selling_points?.length ? [...product.selling_points] : [''],
    })
    setIsEditing(true)
  }

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // 셀링포인트 추가
  const handleAddSellingPoint = () => {
    setEditForm(prev => ({
      ...prev,
      selling_points: [...prev.selling_points, ''],
    }))
  }

  // 셀링포인트 삭제
  const handleRemoveSellingPoint = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      selling_points: prev.selling_points.filter((_, i) => i !== index),
    }))
  }

  // 셀링포인트 수정
  const handleChangeSellingPoint = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      selling_points: prev.selling_points.map((sp, i) => i === index ? value : sp),
    }))
  }

  // 저장
  const handleSave = async () => {
    if (!product) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/ad-products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: editForm.price,
          brand: editForm.brand,
          selling_points: editForm.selling_points.filter(sp => sp.trim()),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setProduct(data.product)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('저장 오류:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 배경 제거 상태 폴링
  useEffect(() => {
    if (!product) return
    if (!['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(product.status)) {
      setIsPolling(false)
      return
    }

    setIsPolling(true)

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/ad-products/${productId}/status`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data.product)
          if (['COMPLETED', 'FAILED'].includes(data.product.status)) {
            setIsPolling(false)
          }
        }
      } catch (error) {
        console.error('상태 폴링 오류:', error)
      }
    }

    const interval = setInterval(pollStatus, 1000)
    return () => clearInterval(interval)
  }, [product?.status, productId])

  const handleRetry = async () => {
    if (isRetrying || !product?.source_image_url) return

    setIsRetrying(true)
    try {
      const res = await fetch(`/api/ad-products/${productId}/retry`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setProduct(data.product)
      }
    } catch (error) {
      console.error('재시도 오류:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t.adProduct.confirmDelete)) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/ad-products/${productId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard/ad-products')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateAd = () => {
    router.push('/image-ad-create?type=productOnly')
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
      <AdCreationHeader
        backHref="/dashboard/ad-products"
        title={product.name}
        selectedProduct={{
          name: product.name,
          imageUrl: product.rembg_image_url || product.image_url,
        }}
        rightContent={
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
        }
      />

      {/* 콘텐츠 */}
      <div className="space-y-6">
        {/* 상단: 제품 이미지 + 제품 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 제품 이미지 - 배경 제거된 원본 사용 */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="aspect-square relative bg-[#1a1a2e]">
              {isPolling ? (
                <>
                  {product.source_image_url && (
                    <img
                      src={product.source_image_url}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-contain p-4 opacity-50"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </>
              ) : product.rembg_image_url ? (
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
            {/* 누끼따기 재시도 버튼 */}
            {product.source_image_url && !isPolling && (
              <div className="p-3 border-t border-border">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isRetrying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {t.adProduct.retryRembg || '누끼따기 재시도'}
                </button>
              </div>
            )}
          </div>

          {/* 제품 정보 카드 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t.adProduct.productInfo || '제품 정보'}
              </h3>
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {/* 제품명 */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {t.adProduct.productName || 'Product Name'}
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* 브랜드 & 가격 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t.adProduct.brand || 'Brand'}
                    </label>
                    <input
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder={t.adProduct.brandPlaceholder || '예: 나이키, 애플'}
                      className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t.adProduct.price || 'Price'}
                    </label>
                    <input
                      type="text"
                      value={editForm.price}
                      onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder={t.adProduct.pricePlaceholder || '예: 29,900원'}
                      className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* 설명 */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {t.adProduct.description || '제품 설명'}
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t.adProduct.descriptionPlaceholder || '제품에 대한 간단한 설명을 입력하세요'}
                    rows={3}
                    className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                {/* 셀링 포인트 */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {t.adProduct.sellingPoints || '셀링 포인트'}
                  </label>
                  <div className="space-y-2">
                    {editForm.selling_points.map((sp, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={sp}
                          onChange={(e) => handleChangeSellingPoint(index, e.target.value)}
                          placeholder={t.adProduct.sellingPointPlaceholder || '예: 100% 천연 소재'}
                          className="flex-1 px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {editForm.selling_points.length > 1 && (
                          <button
                            onClick={() => handleRemoveSellingPoint(index)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddSellingPoint}
                      className="w-full py-2 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors border border-dashed border-primary/30"
                    >
                      + {t.adProduct.addSellingPoint || '셀링 포인트 추가'}
                    </button>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex-1 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    {t.common?.cancel || 'Cancel'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !editForm.name.trim()}
                    className="flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {t.common?.save || 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 브랜드 & 가격 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t.adProduct.brand || 'Brand'}</p>
                      <p className="text-sm text-foreground">{product.brand || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t.adProduct.price || 'Price'}</p>
                      <p className="text-sm text-foreground">{product.price || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 설명 */}
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t.adProduct.description || 'Description'}</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{product.description || '-'}</p>
                  </div>
                </div>

                {/* 셀링 포인트 */}
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t.adProduct.sellingPoints || '셀링 포인트'}</p>
                    {product.selling_points && product.selling_points.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {product.selling_points.map((sp, index) => (
                          <li key={index} className="flex items-center gap-1.5 text-sm text-foreground">
                            <Tag className="w-3 h-3 text-primary" />
                            {sp}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-foreground">-</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단: 광고 목록 */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {productAds.map(ad => (
                <div
                  key={ad.id}
                  onClick={() => router.push(`/dashboard/image-ad/${ad.id}`)}
                  className="relative group bg-secondary/30 rounded-lg overflow-hidden aspect-square cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
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
                    <span className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium">
                      {t.imageAdDetail?.viewDetail || 'View Detail'}
                    </span>
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
  )
}
