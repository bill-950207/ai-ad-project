/**
 * 광고 제품 카드 컴포넌트
 *
 * 개별 광고 제품을 카드 형태로 표시합니다.
 * 가로 스크롤 목록에서 사용됩니다.
 *
 * 폴링 최적화:
 * - 개별 폴링 제거, 부모(AdProductsPage)에서 순차 폴링 처리
 * - 카드는 props로 전달받은 상태만 렌더링
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Loader2, Package, Trash2, RefreshCw } from 'lucide-react'

/** 처리 중인 상태 목록 */
const PROCESSING_STATUSES = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS']

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
  onDelete?: (productId: string) => void
  onRetry?: (product: AdProduct) => void
}

export function AdProductCard({ product, onDelete, onRetry }: AdProductCardProps) {
  const { t } = useLanguage()
  const router = useRouter()
  // 처리 중인 상태인지 여부 (부모에서 폴링, 카드는 상태만 표시)
  const isPolling = PROCESSING_STATUSES.includes(product.status)
  const [showActions, setShowActions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

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
          ? 'cursor-pointer hover:border-primary/40 hover:shadow-glow-sm'
          : ''
      } transition-all duration-300 relative group`}
    >
      <div className="aspect-square relative bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
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
              className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="w-10 h-10 text-primary animate-spin relative" />
              </div>
            </div>
          </>
        ) : product.source_image_url && product.status === 'FAILED' ? (
          <img
            src={product.source_image_url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
            {isPolling ? (
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="w-10 h-10 text-primary animate-spin relative" />
              </div>
            ) : (
              <Package className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        )}

        {/* 진행 중 상태 태그 표시 */}
        {isPolling && ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(product.status) && (
          <div className="absolute top-3 right-3">
            <span className="text-xs px-2.5 py-1 rounded-lg whitespace-nowrap bg-gradient-to-r from-primary to-accent text-white font-medium animate-pulse backdrop-blur-sm">
              배경 제거 중...
            </span>
          </div>
        )}

        {/* 실패 상태일 때만 태그 표시 */}
        {product.status === 'FAILED' && (
          <div className="absolute top-3 right-3">
            <span className="text-xs px-2.5 py-1 rounded-lg whitespace-nowrap text-destructive bg-destructive/15 border border-destructive/20 font-medium backdrop-blur-sm">
              {t.adProduct.status.failed}
            </span>
          </div>
        )}

        {/* 완료 상태 호버 오버레이 */}
        {product.status === 'COMPLETED' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <span className="px-5 py-2.5 bg-white text-black rounded-xl text-sm font-semibold shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
              상세보기
            </span>
          </div>
        )}

        {/* 실패 상태 액션 버튼 오버레이 */}
        {product.status === 'FAILED' && showActions && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying || !product.source_image_url}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm font-medium hover:shadow-glow-sm disabled:opacity-50 transition-all duration-200"
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
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-all duration-200"
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
