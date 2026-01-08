/**
 * 광고 제품 스캐너 컴포넌트
 *
 * 배경 제거 중 스캔 애니메이션을 표시합니다.
 * - 원본 이미지 위에 스캔 라인이 위아래로 이동
 * - 완료 시 크기 편집 화면으로 전환
 */

'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { AdProductSizeEditor } from './ad-product-size-editor'

interface AdProductScannerProps {
  productId: string
  sourceImageUrl: string
  onComplete: () => void
}

export function AdProductScanner({ productId, sourceImageUrl, onComplete }: AdProductScannerProps) {
  const { t } = useLanguage()
  const [status, setStatus] = useState<'scanning' | 'editing'>('scanning')
  const [rembgTempUrl, setRembgTempUrl] = useState<string | null>(null)

  useEffect(() => {
    // 이미 편집 중이면 폴링 안함
    if (status === 'editing') return

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/ad-products/${productId}/status`)
        if (res.ok) {
          const data = await res.json()

          // 배경 제거 완료 - 크기 편집 모드로 전환
          if (data.product.status === 'EDITING' && data.product.rembg_temp_url) {
            setRembgTempUrl(data.product.rembg_temp_url)
            setStatus('editing')
            return true
          }

          // 이미 완료된 경우 (다시 접근 시)
          if (data.product.status === 'COMPLETED') {
            onComplete()
            return true
          }

          if (data.product.status === 'FAILED') {
            return true
          }
        }
      } catch (error) {
        console.error('상태 폴링 오류:', error)
      }
      return false
    }

    const interval = setInterval(async () => {
      const isDone = await pollStatus()
      if (isDone) {
        clearInterval(interval)
      }
    }, 2000)

    // 초기 폴링
    pollStatus()

    return () => clearInterval(interval)
  }, [productId, status, onComplete])

  const handleEditComplete = () => {
    onComplete()
  }

  // 크기 편집 모드
  if (status === 'editing' && rembgTempUrl) {
    return (
      <AdProductSizeEditor
        productId={productId}
        rembgImageUrl={rembgTempUrl}
        onComplete={handleEditComplete}
      />
    )
  }

  // 스캐닝 모드
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* 이미지 영역 */}
        <div className="relative aspect-square bg-[#1a1a2e]">
          {/* 원본 이미지 */}
          <img
            src={sourceImageUrl}
            alt="Product"
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* 스캔 라인 애니메이션 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="scan-line" />
          </div>

          {/* 스캔 오버레이 */}
          <div className="absolute inset-0 border-2 border-primary/30 pointer-events-none">
            {/* 코너 마커 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />
          </div>
        </div>

        {/* 상태 */}
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t.adProduct.removingBackgroundDesc}
          </p>
        </div>
      </div>

      {/* CSS for scan animation */}
      <style jsx>{`
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(var(--primary-rgb, 124, 58, 237), 0.3) 20%,
            rgba(var(--primary-rgb, 124, 58, 237), 0.8) 50%,
            rgba(var(--primary-rgb, 124, 58, 237), 0.3) 80%,
            transparent 100%
          );
          box-shadow: 0 0 20px rgba(var(--primary-rgb, 124, 58, 237), 0.5),
                      0 0 40px rgba(var(--primary-rgb, 124, 58, 237), 0.3);
          animation: scan 2s ease-in-out infinite;
        }

        @keyframes scan {
          0% {
            top: 0%;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0%;
          }
        }
      `}</style>
    </div>
  )
}
