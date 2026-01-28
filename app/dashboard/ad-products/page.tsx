/**
 * 광고 제품 관리 페이지
 *
 * 사용자의 광고 제품 목록을 관리합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Package } from 'lucide-react'
import { AdProductCard } from '@/components/ad-product/ad-product-card'

interface AdProduct {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  image_url: string | null
  source_image_url: string | null
  rembg_temp_url?: string | null
  rembg_image_url?: string | null
  created_at: string
  error_message?: string | null
}

export default function AdProductsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [products, setProducts] = useState<AdProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const handleProductDelete = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const handleProductRetry = (product: AdProduct) => {
    setProducts(prev => prev.filter(p => p.id !== product.id))
    const params = new URLSearchParams()
    if (product.name) params.set('name', product.name)
    if (product.source_image_url) params.set('imageUrl', product.source_image_url)
    router.push(`/dashboard/ad-products/new?${params.toString()}`)
  }

  const handleRegisterProduct = () => {
    router.push('/dashboard/ad-products/new')
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.adProduct.title}</h1>
          <p className="text-muted-foreground">{t.adProduct.subtitle}</p>
        </div>
        <button
          onClick={handleRegisterProduct}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.adProduct.registerProduct}
        </button>
      </div>

      {/* 광고 제품 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-square bg-secondary/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">{t.adProduct.emptyProducts}</h3>
          <p className="text-muted-foreground mb-6">광고에 사용할 제품을 등록해주세요</p>
          <button
            onClick={handleRegisterProduct}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            {t.adProduct.registerProduct}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <AdProductCard
              key={product.id}
              product={product}
              onStatusUpdate={handleProductStatusUpdate}
              onDelete={handleProductDelete}
              onRetry={handleProductRetry}
            />
          ))}
        </div>
      )}
    </div>
  )
}
