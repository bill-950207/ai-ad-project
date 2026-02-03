/**
 * 광고 제품 관리 페이지
 *
 * 사용자의 광고 제품 목록을 관리합니다.
 *
 * 폴링 최적화:
 * - 처리 중인 제품들을 순차적으로 폴링 (이전 완료 후 다음 요청)
 * - 동시 API 요청 최소화
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Package } from 'lucide-react'
import { AdProductCard } from '@/components/ad-product/ad-product-card'
import { GridSkeleton } from '@/components/ui/grid-skeleton'

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

/** 처리 중인 상태 목록 */
const PROCESSING_STATUSES = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS']

export default function AdProductsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [products, setProducts] = useState<AdProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Failed to fetch ad product list:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  /**
   * 처리 중인 제품들을 순차적으로 폴링
   * 이전 요청 완료 후 다음 요청 (동시 요청 방지)
   */
  useEffect(() => {
    const processingProducts = products.filter(p => PROCESSING_STATUSES.includes(p.status))

    if (processingProducts.length > 0 && !isLoading) {
      // 이미 폴링 중이면 중복 생성 방지
      if (pollingRef.current) return

      pollingRef.current = setInterval(async () => {
        // 현재 처리 중인 제품들을 순차적으로 폴링
        const currentProcessing = products.filter(p => PROCESSING_STATUSES.includes(p.status))

        for (const product of currentProcessing) {
          try {
            const res = await fetch(`/api/ad-products/${product.id}/status`)
            if (res.ok) {
              const data = await res.json()
              // 상태가 변경되었으면 해당 제품만 업데이트
              setProducts(prev => prev.map(p =>
                p.id === product.id ? data.product : p
              ))
            }
          } catch (error) {
            console.error('Product status polling error:', error)
          }
        }
      }, 2000) // 2초 간격
    } else {
      // 처리 중인 제품이 없으면 폴링 중지
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [products, isLoading])

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
        <GridSkeleton count={8} columns={{ default: 2, sm: 3, md: 3, lg: 4 }} />
      ) : products.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">{t.adProduct.emptyProducts}</h3>
          <p className="text-muted-foreground mb-6">{t.adProduct.emptyDescription || 'Register products to use in your ads'}</p>
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
              onDelete={handleProductDelete}
              onRetry={handleProductRetry}
            />
          ))}
        </div>
      )}
    </div>
  )
}
