/**
 * 제품 배경 제거 처리 중 단계
 *
 * 스캔 라인 애니메이션과 함께 배경 제거 진행 상황 표시
 * 완료 시 제품 크기 편집 단계로 전환
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useOnboarding } from '../onboarding-context'

export function ProductScannerStep() {
  const {
    newProductId,
    productSourceImageUrl,
    onProductEditingComplete,
    setError,
    goToStep,
  } = useOnboarding()

  const [scanPosition, setScanPosition] = useState(0)
  const [scanDirection, setScanDirection] = useState<'down' | 'up'>('down')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 스캔 라인 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setScanPosition(prev => {
        if (scanDirection === 'down') {
          if (prev >= 100) {
            setScanDirection('up')
            return 100
          }
          return prev + 2
        } else {
          if (prev <= 0) {
            setScanDirection('down')
            return 0
          }
          return prev - 2
        }
      })
    }, 40)

    return () => clearInterval(interval)
  }, [scanDirection])

  // 상태 폴링
  useEffect(() => {
    if (!newProductId) return

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/ad-products/${newProductId}/status`)
        if (!res.ok) throw new Error('Failed to fetch status')

        const data = await res.json()
        const { product } = data

        if (product.status === 'FAILED') {
          setError(product.error_message || '배경 제거에 실패했습니다')
          goToStep('product')
          return
        }

        if (product.status === 'COMPLETED' && product.rembg_image_url) {
          // 배경 제거 완료, 바로 아바타 단계로 이동
          onProductEditingComplete({
            id: product.id,
            name: product.name,
            status: product.status,
            image_url: product.image_url,
            rembg_image_url: product.rembg_image_url,
            source_image_url: product.source_image_url,
            description: product.description,
            selling_points: product.selling_points,
          })
          return
        }

        // 완료되지 않았으면 계속 폴링
      } catch (err) {
        console.error('상태 폴링 오류:', err)
      }
    }

    // 즉시 한 번 실행
    pollStatus()

    // 1초 간격으로 폴링
    pollingRef.current = setInterval(pollStatus, 1000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [newProductId, onProductEditingComplete, setError, goToStep])

  return (
    <div className="flex flex-col items-center py-8">
      {/* 스캔 애니메이션 컨테이너 */}
      <div className="relative w-64 h-64 bg-secondary/30 rounded-xl overflow-hidden border border-border">
        {/* 원본 이미지 */}
        {productSourceImageUrl && (
          <img
            src={productSourceImageUrl}
            alt="Product"
            className="w-full h-full object-contain opacity-50"
          />
        )}

        {/* 스캔 라인 */}
        <div
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{
            top: `${scanPosition}%`,
            boxShadow: '0 0 20px 5px rgba(var(--primary-rgb), 0.5)',
          }}
        />

        {/* 코너 마커 */}
        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary" />
        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary" />

        {/* 그리드 오버레이 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--primary) 1px, transparent 1px),
              linear-gradient(to bottom, var(--primary) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* 상태 메시지 */}
      <div className="flex items-center gap-2 mt-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          제품 이미지를 분석하고 배경을 제거하고 있습니다...
        </p>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        잠시만 기다려주세요
      </p>
    </div>
  )
}
