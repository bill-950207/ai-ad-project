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
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-brand-text">{t.adProduct.title}</span>
          </h1>
          <p className="text-muted-foreground text-lg">{t.adProduct.subtitle}</p>
        </div>
        <button
          onClick={handleRegisterProduct}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          {t.adProduct.registerProduct}
        </button>
      </div>

      {/* 광고 제품 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-square bg-gradient-to-br from-card to-secondary/30 rounded-2xl animate-pulse border border-border/50" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border rounded-2xl p-16 text-center">
          {/* 배경 글로우 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
              <Package className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">{t.adProduct.emptyProducts}</h3>
            <p className="text-muted-foreground mb-8">광고에 사용할 제품을 등록해주세요</p>
            <button
              onClick={handleRegisterProduct}
              className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow transition-all duration-300"
            >
              {t.adProduct.registerProduct}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
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
