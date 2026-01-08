/**
 * 광고 제품 크기 편집 컴포넌트
 *
 * 배경 제거된 제품 이미지를 아바타와 비교하면서
 * 크기와 위치를 조절할 수 있습니다.
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react'

interface AdProductSizeEditorProps {
  productId: string
  rembgImageUrl: string // 배경 제거된 원본 이미지 URL
  onComplete: () => void
}

// 캔버스 크기 (아바타와 동일)
const CANVAS_WIDTH = 1024
const CANVAS_HEIGHT = 1536

// 기본값
const DEFAULT_SCALE = 0.8  // 캔버스 대비 80%
const MIN_SCALE = 0.3
const MAX_SCALE = 1.2
const SCALE_STEP = 0.05

export function AdProductSizeEditor({ productId, rembgImageUrl, onComplete }: AdProductSizeEditorProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const canvasRef = useRef<HTMLDivElement>(null)
  const productRef = useRef<HTMLDivElement>(null)

  // 제품 이미지 상태
  const [productImage, setProductImage] = useState<HTMLImageElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 변환 상태 (캔버스 비율 기준, 0-1)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [positionX, setPositionX] = useState(0.5) // 0 = 왼쪽, 1 = 오른쪽
  const [positionY, setPositionY] = useState(0.5) // 0 = 위, 1 = 아래

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 아바타 이미지 URL (참조용)
  const referenceAvatarUrl = 'https://pub-ec68419ff8bc464ca734a0ddb80a2823.r2.dev/avatars/compressed/5e0f3953-0983-492c-9f47-0410e584849e_1767873505794.webp'

  // 이미지 로드
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setProductImage(img)
      setIsLoading(false)
    }
    img.onerror = () => {
      setError('이미지 로드 실패')
      setIsLoading(false)
    }
    img.src = rembgImageUrl
  }, [rembgImageUrl])

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

    // scale은 캔버스 높이 기준
    const maxHeight = displaySize.height * scale
    const maxWidth = displaySize.width * scale

    let width, height
    if (aspectRatio > 1) {
      // 가로가 더 긴 이미지
      width = Math.min(maxWidth, maxHeight * aspectRatio)
      height = width / aspectRatio
    } else {
      // 세로가 더 긴 이미지
      height = Math.min(maxHeight, maxWidth / aspectRatio)
      width = height * aspectRatio
    }

    return { width, height }
  }, [productImage, scale, getDisplaySize])

  // 제품 위치 계산 (픽셀)
  const getProductPosition = useCallback(() => {
    const displaySize = getDisplaySize()
    const productSize = getProductDisplaySize()

    const x = (displaySize.width - productSize.width) * positionX
    const y = (displaySize.height - productSize.height) * positionY

    return { x, y }
  }, [positionX, positionY, getDisplaySize, getProductDisplaySize])

  // 드래그 시작
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    setDragStart({ x: clientX, y: clientY })
  }, [])

  // 드래그 중
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !canvasRef.current) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const displaySize = getDisplaySize()
    const productSize = getProductDisplaySize()

    const deltaX = clientX - dragStart.x
    const deltaY = clientY - dragStart.y

    // 이동 가능한 범위 계산
    const maxMoveX = displaySize.width - productSize.width
    const maxMoveY = displaySize.height - productSize.height

    if (maxMoveX > 0) {
      const newX = positionX + deltaX / maxMoveX
      setPositionX(Math.max(0, Math.min(1, newX)))
    }

    if (maxMoveY > 0) {
      const newY = positionY + deltaY / maxMoveY
      setPositionY(Math.max(0, Math.min(1, newY)))
    }

    setDragStart({ x: clientX, y: clientY })
  }, [isDragging, dragStart, positionX, positionY, getDisplaySize, getProductDisplaySize])

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 드래그 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove)
      window.addEventListener('touchend', handleDragEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

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
    setPositionX(0.5)
    setPositionY(0.5)
  }

  // 저장
  const handleSave = async () => {
    if (!productImage) return

    setIsSaving(true)
    setError(null)

    try {
      // 서버에 처리 요청
      const res = await fetch(`/api/ad-products/${productId}/process`, {
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
        throw new Error(data.error || 'Failed to process image')
      }

      onComplete()
    } catch (err) {
      console.error('저장 오류:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const productSize = getProductDisplaySize()
  const productPosition = getProductPosition()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {t.adProduct?.adjustSize || '제품 크기 조절'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.adProduct?.adjustSizeDesc || '아바타와 비교하면서 제품 크기를 조절하세요'}
          </p>
        </div>

        {/* 편집 영역 */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 제품 편집 캔버스 */}
            <div className="relative">
              <p className="text-xs text-muted-foreground mb-2 text-center">제품</p>
              <div
                ref={canvasRef}
                className="relative aspect-[1024/1536] bg-[#1a1a2e] rounded-lg overflow-hidden"
              >
                {/* 격자 패턴 (투명 영역 표시) */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #2a2a3e 25%, transparent 25%),
                      linear-gradient(-45deg, #2a2a3e 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #2a2a3e 75%),
                      linear-gradient(-45deg, transparent 75%, #2a2a3e 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  }}
                />

                {/* 제품 이미지 */}
                {productImage && (
                  <div
                    ref={productRef}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    className={`absolute cursor-move select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                      left: productPosition.x,
                      top: productPosition.y,
                      width: productSize.width,
                      height: productSize.height,
                    }}
                  >
                    <img
                      src={rembgImageUrl}
                      alt="Product"
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 참조 아바타 */}
            <div className="relative">
              <p className="text-xs text-muted-foreground mb-2 text-center">참조 아바타</p>
              <div className="relative aspect-[1024/1536] bg-[#1a1a2e] rounded-lg overflow-hidden">
                <img
                  src={referenceAvatarUrl}
                  alt="Reference Avatar"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* 컨트롤 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 축소 */}
              <button
                onClick={handleZoomOut}
                disabled={scale <= MIN_SCALE}
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ZoomOut className="w-5 h-5 text-foreground" />
              </button>

              {/* 크기 표시 */}
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>

              {/* 확대 */}
              <button
                onClick={handleZoomIn}
                disabled={scale >= MAX_SCALE}
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ZoomIn className="w-5 h-5 text-foreground" />
              </button>

              {/* 리셋 */}
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors ml-2"
              >
                <RotateCcw className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* 슬라이더 */}
            <input
              type="range"
              min={MIN_SCALE * 100}
              max={MAX_SCALE * 100}
              value={scale * 100}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="flex-1 mx-4 accent-primary"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{t.adProduct?.complete || '완료'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
