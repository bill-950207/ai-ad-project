/**
 * 제품 크기 편집 단계
 *
 * 배경 제거된 제품 이미지를 아바타 위에 오버레이하여
 * 크기를 비교하면서 조절할 수 있습니다.
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react'
import { useOnboarding, OnboardingProduct } from '../onboarding-context'
import { useLanguage } from '@/contexts/language-context'

// Translation type for product editor step
type ProductEditorStepT = {
  loadingImage?: string
  compareAndAdjust?: string
  reset?: string
  saving?: string
  complete?: string
  imageLoadFailed?: string
  imageProcessingFailed?: string
  cannotFetchProduct?: string
  errorOccurred?: string
}

// 기본값
const DEFAULT_SCALE = 1.0
const MIN_SCALE = 0.1
const MAX_SCALE = 1.2
const SCALE_STEP = 0.05

// 참조 아바타 이미지
const REFERENCE_AVATAR_URL = 'https://pub-ec68419ff8bc464ca734a0ddb80a2823.r2.dev/avatars/compressed/5e0f3953-0983-492c-9f47-0410e584849e_1767873505794.webp'

export function ProductEditorStep() {
  const { t } = useLanguage()
  const editorT = t.onboarding?.productEditorStep as ProductEditorStepT | undefined

  const {
    newProductId,
    productRembgTempUrl,
    onProductEditingComplete,
  } = useOnboarding()

  const canvasRef = useRef<HTMLDivElement>(null)
  const [productImage, setProductImage] = useState<HTMLImageElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [scale, setScale] = useState(DEFAULT_SCALE)

  // 위치는 가운데 고정
  const positionX = 0.5
  const positionY = 0.5

  // 이미지 로드
  useEffect(() => {
    if (!productRembgTempUrl) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setProductImage(img)
      setIsLoading(false)
    }
    img.onerror = () => {
      setEditorError(editorT?.imageLoadFailed || 'Image load failed')
      setIsLoading(false)
    }
    img.src = productRembgTempUrl
  }, [productRembgTempUrl])

  // 캔버스 표시 크기 계산
  const getDisplaySize = useCallback(() => {
    if (!canvasRef.current) return { width: 0, height: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }, [])

  // 제품 표시 크기 계산
  const getProductDisplaySize = useCallback(() => {
    if (!productImage) return { width: 0, height: 0 }

    const displaySize = getDisplaySize()
    const aspectRatio = productImage.width / productImage.height

    const maxHeight = displaySize.height * scale
    const maxWidth = displaySize.width * scale

    let width, height
    if (aspectRatio > 1) {
      width = Math.min(maxWidth, maxHeight * aspectRatio)
      height = width / aspectRatio
    } else {
      height = Math.min(maxHeight, maxWidth / aspectRatio)
      width = height * aspectRatio
    }

    return { width, height }
  }, [productImage, scale, getDisplaySize])

  // 제품 위치 계산
  const getProductPosition = useCallback(() => {
    const displaySize = getDisplaySize()
    const productSize = getProductDisplaySize()

    const x = (displaySize.width - productSize.width) * positionX
    const y = (displaySize.height - productSize.height) * positionY

    return { x, y }
  }, [positionX, positionY, getDisplaySize, getProductDisplaySize])

  // 확대
  const handleZoomIn = () => {
    setScale(Math.min(MAX_SCALE, scale + SCALE_STEP))
  }

  // 축소
  const handleZoomOut = () => {
    setScale(Math.max(MIN_SCALE, scale - SCALE_STEP))
  }

  // 리셋
  const handleReset = () => {
    setScale(DEFAULT_SCALE)
  }

  // 저장
  const handleSave = async () => {
    if (!productImage || !newProductId) return

    setIsSaving(true)
    setEditorError(null)

    try {
      const res = await fetch(`/api/ad-products/${newProductId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scale,
          positionX,
          positionY,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || (editorT?.imageProcessingFailed || 'Image processing failed'))
      }

      // 완료된 제품 정보 가져오기
      const productRes = await fetch(`/api/ad-products/${newProductId}`)
      if (!productRes.ok) throw new Error(editorT?.cannotFetchProduct || 'Cannot fetch product info')

      const productData = await productRes.json()
      const product: OnboardingProduct = productData.product

      onProductEditingComplete(product)
    } catch (err) {
      console.error('Save error:', err)
      setEditorError(err instanceof Error ? err.message : (editorT?.errorOccurred || 'An error occurred'))
    } finally {
      setIsSaving(false)
    }
  }

  const productSize = getProductDisplaySize()
  const productPosition = getProductPosition()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">{editorT?.loadingImage || 'Loading image...'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 안내 메시지 */}
      <p className="text-sm text-muted-foreground text-center">
        {editorT?.compareAndAdjust || 'Adjust product size while comparing with avatar'}
      </p>

      {/* 편집 영역 */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-xs">
          <div
            ref={canvasRef}
            className="relative aspect-[1024/1536] bg-[#1a1a2e] rounded-lg overflow-hidden"
          >
            {/* 참조 아바타 (배경) */}
            <img
              src={REFERENCE_AVATAR_URL}
              alt="Reference Avatar"
              className="absolute inset-0 w-full h-full object-contain opacity-70"
            />

            {/* 제품 이미지 (오버레이) */}
            {productImage && productRembgTempUrl && (
              <div
                className="absolute select-none"
                style={{
                  left: productPosition.x,
                  top: productPosition.y,
                  width: productSize.width,
                  height: productSize.height,
                }}
              >
                <img
                  src={productRembgTempUrl}
                  alt="Product"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  draggable={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-foreground" />
          </button>

          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-foreground" />
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors ml-1"
            title={editorT?.reset || 'Reset'}
          >
            <RotateCcw className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <input
          type="range"
          min={MIN_SCALE * 100}
          max={MAX_SCALE * 100}
          value={scale * 100}
          onChange={(e) => setScale(Number(e.target.value) / 100)}
          className="flex-1 accent-primary"
        />
      </div>

      {/* 에러 메시지 */}
      {editorError && (
        <p className="text-sm text-red-500 text-center">{editorError}</p>
      )}

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{editorT?.saving || 'Saving...'}</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>{editorT?.complete || 'Complete'}</span>
          </>
        )}
      </button>
    </div>
  )
}
