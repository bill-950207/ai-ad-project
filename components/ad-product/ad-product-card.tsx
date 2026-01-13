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
import { Loader2, Package, Trash2, RefreshCw } from 'lucide-react'

interface AdProduct {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
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
  onDelete?: (productId: string) => void
  onRetry?: (product: AdProduct) => void
}

export function AdProductCard({ product, onStatusUpdate, onDelete, onRetry }: AdProductCardProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isPolling, setIsPolling] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

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

      const interval = setInterval(pollStatus, 1000)
      return () => clearInterval(interval)
    }
  }, [product.id, product.status, onStatusUpdate])

  const handleCardClick = () => {
    if (product.status === 'COMPLETED') {
      router.push(`/dashboard/ad-products/${product.id}`)
    } else if (product.status === 'FAILED') {
      setShowActions(!showActions)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/ad-products/${product.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onDelete?.(product.id)
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRetrying || !product.source_image_url) return

    setIsRetrying(true)
    try {
      // 기존 제품 삭제 후 재시도 콜백 호출
      await fetch(`/api/ad-products/${product.id}`, {
        method: 'DELETE',
      })
      onRetry?.(product)
    } catch (error) {
      console.error('재시도 오류:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={`w-full bg-card border border-border rounded-2xl overflow-hidden ${
        product.status === 'COMPLETED' || product.status === 'FAILED'
          ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg'
          : ''
      } transition-all relative group`}
    >
      <div className="aspect-square relative bg-secondary/30 overflow-hidden">
        {/* 카드 이미지: rembg_image_url(배경제거 원본) > image_url(최종 결과) 순으로 표시 */}
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
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </>
        ) : product.source_image_url && product.status === 'FAILED' ? (
          <img
            src={product.source_image_url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isPolling ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Package className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
        )}

        {/* 실패 상태일 때만 태그 표시 */}
        {product.status === 'FAILED' && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-2 py-1 rounded-lg whitespace-nowrap text-red-500 bg-red-500/10 font-medium">
              {t.adProduct.status.failed}
            </span>
          </div>
        )}

        {/* 완료 상태 호버 오버레이 */}
        {product.status === 'COMPLETED' && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-4 py-2 bg-white text-black rounded-xl text-sm font-medium">
              상세보기
            </span>
          </div>
        )}

        {/* 실패 상태 액션 버튼 오버레이 */}
        {product.status === 'FAILED' && showActions && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying || !product.source_image_url}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isRetrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>재시도</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>삭제</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
      </div>
    </div>
  )
}
