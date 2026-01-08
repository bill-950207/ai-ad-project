/**
 * 광고 제품 카드 컴포넌트
 *
 * 개별 광고 제품을 카드 형태로 표시합니다.
 * 가로 스크롤 목록에서 사용됩니다.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Loader2, Package } from 'lucide-react'

interface AdProduct {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'EDITING' | 'UPLOADING' | 'COMPLETED' | 'FAILED'
  image_url: string | null
  source_image_url: string | null
  rembg_temp_url?: string | null
  rembg_image_url?: string | null  // 배경 제거된 원본 (카드 표시용)
  created_at: string
  error_message?: string | null
}

interface AdProductCardProps {
  product: AdProduct
  onStatusUpdate: (product: AdProduct) => void
}

export function AdProductCard({ product, onStatusUpdate }: AdProductCardProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    if (['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(product.status)) {
      setIsPolling(true)

      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/ad-products/${product.id}/status`)
          if (res.ok) {
            const data = await res.json()
            onStatusUpdate(data.product)

            if (['COMPLETED', 'FAILED'].includes(data.product.status)) {
              setIsPolling(false)
            }
          }
        } catch (error) {
          console.error('상태 폴링 오류:', error)
        }
      }

      const interval = setInterval(pollStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [product.id, product.status, onStatusUpdate])

  const getStatusLabel = () => {
    const statusMap: Record<string, string> = {
      PENDING: t.adProduct.status.pending,
      IN_QUEUE: t.adProduct.status.inQueue,
      IN_PROGRESS: t.adProduct.status.inProgress,
      EDITING: t.adProduct.status.editing || '편집 대기',
      UPLOADING: t.adProduct.status.uploading,
      COMPLETED: t.adProduct.status.completed,
      FAILED: t.adProduct.status.failed,
    }
    return statusMap[product.status] || product.status
  }

  const getStatusColor = () => {
    switch (product.status) {
      case 'COMPLETED':
        return 'text-green-500 bg-green-500/10'
      case 'FAILED':
        return 'text-red-500 bg-red-500/10'
      case 'UPLOADING':
        return 'text-blue-500 bg-blue-500/10'
      case 'EDITING':
        return 'text-purple-500 bg-purple-500/10'
      default:
        return 'text-yellow-500 bg-yellow-500/10'
    }
  }

  const handleCardClick = () => {
    if (product.status === 'COMPLETED') {
      router.push(`/dashboard/image-ad/product/${product.id}`)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={`flex-shrink-0 w-32 bg-card border border-border rounded-xl overflow-hidden ${
        product.status === 'COMPLETED' ? 'cursor-pointer hover:border-primary/50' : ''
      } transition-colors`}
    >
      <div className="aspect-square relative bg-secondary/30 overflow-hidden">
        {/* 카드 이미지: rembg_image_url(배경제거 원본) > image_url(최종 결과) 순으로 표시 */}
        {product.rembg_image_url ? (
          <img
            src={product.rembg_image_url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain p-2"
          />
        ) : product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="absolute inset-[-25%] w-[150%] h-[150%] object-contain"
          />
        ) : product.source_image_url && isPolling ? (
          <>
            <img
              src={product.source_image_url}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isPolling ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Package className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
        )}

        {product.status !== 'COMPLETED' && (
          <div className="absolute top-1 right-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
      </div>
    </div>
  )
}
