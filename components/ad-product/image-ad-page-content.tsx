/**
 * 이미지 광고 페이지 콘텐츠 컴포넌트
 *
 * 상단: 광고 제품 가로 스크롤 목록
 * 하단: 이미지 광고 그리드
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Package, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { AdProductCard } from './ad-product-card'
import { ImageAdTypeModal, ImageAdType } from './image-ad-type-modal'

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

export function ImageAdPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const [products, setProducts] = useState<AdProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTypeModal, setShowTypeModal] = useState(false)

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

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleProductStatusUpdate = (updatedProduct: AdProduct) => {
    setProducts(prev =>
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    )
  }

  const handleRegisterProduct = () => {
    router.push('/dashboard/image-ad/product/new')
  }

  const handleCreateAd = () => {
    setShowTypeModal(true)
  }

  const handleSelectAdType = (type: ImageAdType) => {
    setShowTypeModal(false)
    // TODO: 해당 타입의 이미지 광고 생성 페이지로 이동
    router.push(`/dashboard/image-ad/create?type=${type}`)
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t.adProduct.title}</h1>
        <p className="text-muted-foreground">{t.adProduct.subtitle}</p>
      </div>

      {/* 광고 제품 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t.adProduct.myProducts}</h2>
          <button
            onClick={handleRegisterProduct}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.adProduct.registerProduct}
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
            <p className="text-muted-foreground mb-4">{t.adProduct.emptyProducts}</p>
            <button
              onClick={handleRegisterProduct}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.adProduct.registerProduct}
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

      {/* 이미지 광고 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t.adProduct.myAds}</h2>
          {products.some(p => p.status === 'COMPLETED') && (
            <button
              onClick={handleCreateAd}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.adProduct.createAd}
            </button>
          )}
        </div>

        {/* 빈 상태 */}
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">{t.adProduct.emptyAds}</h3>
          <p className="text-muted-foreground mb-4">
            {products.some(p => p.status === 'COMPLETED')
              ? t.adProduct.createAd
              : t.adProduct.registerProduct}
          </p>
          <button
            onClick={products.some(p => p.status === 'COMPLETED') ? handleCreateAd : handleRegisterProduct}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {products.some(p => p.status === 'COMPLETED') ? t.adProduct.createAd : t.adProduct.registerProduct}
          </button>
        </div>
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
