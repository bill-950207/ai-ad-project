'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Loader2, ImageIcon, Plus, Minus, Check, AlertCircle, Link as LinkIcon, Edit3 } from 'lucide-react'
import { SlotLimitModal } from '@/components/ui/slot-limit-modal'

type InputMode = 'url' | 'manual'

// 제품 정보 인터페이스 (wizard-context와 동일)
export interface AdProduct {
  id: string
  name: string
  rembg_image_url: string | null
  image_url: string | null
  description?: string | null
  selling_points?: string[] | null
}

interface ProductCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onProductCreated: (product: AdProduct) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MIN_DIMENSION = 256
const MAX_DIMENSION = 4096
const MAX_PIXELS = 16 * 1024 * 1024 // 16MP

export function ProductCreateModal({ isOpen, onClose, onProductCreated }: ProductCreateModalProps) {
  // 입력 모드 (URL / 직접 입력)
  const [inputMode, setInputMode] = useState<InputMode>('manual')

  // URL 입력 관련
  const [productUrl, setProductUrl] = useState('')
  const [isExtractingUrl, setIsExtractingUrl] = useState(false)
  const [urlExtracted, setUrlExtracted] = useState(false)
  // URL에서 가져온 이미지 URL (파일 업로드가 아닌 경우)
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sellingPoints, setSellingPoints] = useState<string[]>([''])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSlotLimitModal, setShowSlotLimitModal] = useState(false)
  const [slotInfo, setSlotInfo] = useState<{ used: number; limit: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 모달이 닫힐 때 폼 초기화
  useEffect(() => {
    if (!isOpen) {
      setInputMode('manual')
      setProductUrl('')
      setIsExtractingUrl(false)
      setUrlExtracted(false)
      setSourceImageUrl(null)
      setName('')
      setDescription('')
      setSellingPoints([''])
      setImagePreview(null)
      setImageDataUrl(null)
      setError(null)
      setIsSubmitting(false)
      setIsPolling(false)
      setShowSlotLimitModal(false)
      setSlotInfo(null)
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isOpen])

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // 이미지 유효성 검사
  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.size > MAX_FILE_SIZE) {
        setError('이미지 크기는 5MB 이하여야 합니다')
        resolve(false)
        return
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('PNG, JPG, WEBP 형식만 지원됩니다')
        resolve(false)
        return
      }

      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        const { width, height } = img

        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          setError(`이미지는 최소 ${MIN_DIMENSION}x${MIN_DIMENSION}px 이상이어야 합니다`)
          resolve(false)
          return
        }

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          setError(`이미지는 최대 ${MAX_DIMENSION}x${MAX_DIMENSION}px 이하여야 합니다`)
          resolve(false)
          return
        }

        if (width * height > MAX_PIXELS) {
          setError('이미지 총 픽셀 수가 16MP를 초과합니다')
          resolve(false)
          return
        }

        resolve(true)
      }
      img.onerror = () => {
        setError('이미지를 읽을 수 없습니다')
        resolve(false)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // 파일을 DataURL로 변환
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 이미지 처리
  const handleImageFile = async (file: File) => {
    setError(null)
    const isValid = await validateImage(file)
    if (!isValid) return

    try {
      const dataUrl = await fileToDataUrl(file)
      setImageDataUrl(dataUrl)
      setImagePreview(dataUrl)
      // 파일 업로드 시 URL에서 가져온 이미지 초기화
      setSourceImageUrl(null)
    } catch {
      setError('이미지 처리 중 오류가 발생했습니다')
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageFile(file)
  }

  // 셀링 포인트 관리
  const addSellingPoint = () => {
    if (sellingPoints.length < 10) {
      setSellingPoints([...sellingPoints, ''])
    }
  }

  const removeSellingPoint = (index: number) => {
    if (sellingPoints.length > 1) {
      setSellingPoints(sellingPoints.filter((_, i) => i !== index))
    }
  }

  const updateSellingPoint = (index: number, value: string) => {
    const updated = [...sellingPoints]
    updated[index] = value
    setSellingPoints(updated)
  }

  // URL에서 제품 정보 추출
  const handleExtractUrl = async () => {
    if (!productUrl.trim()) {
      setError('URL을 입력해주세요')
      return
    }

    setIsExtractingUrl(true)
    setError(null)

    try {
      const res = await fetch('/api/ad-products/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl.trim() }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '정보를 가져올 수 없습니다')
      }

      const data = await res.json()
      const info = data.productInfo

      // 추출된 정보로 필드 채우기
      if (info.title) setName(info.title)
      if (info.description) setDescription(info.description)
      if (info.features && info.features.length > 0) {
        setSellingPoints(info.features)
      }
      if (info.imageUrl) {
        setSourceImageUrl(info.imageUrl)
        setImagePreview(info.imageUrl)
        // URL에서 가져온 이미지는 imageDataUrl이 아닌 sourceImageUrl 사용
        setImageDataUrl(null)
      }

      setUrlExtracted(true)
    } catch (err) {
      console.error('URL 추출 오류:', err)
      setError(err instanceof Error ? err.message : '정보를 가져올 수 없습니다')
    } finally {
      setIsExtractingUrl(false)
    }
  }

  // 제품 상태 폴링
  const pollProductStatus = async (productId: string) => {
    try {
      const res = await fetch(`/api/ad-products/${productId}/status`)
      if (!res.ok) return

      const data = await res.json()
      // API는 { product: { status: ... } } 형식으로 반환
      const status = data.product?.status

      if (status === 'COMPLETED') {
        // 폴링 중지 및 완료 처리
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setIsPolling(false)

        // status API에서 이미 전체 product 정보를 반환하므로 바로 사용
        onProductCreated(data.product)
        onClose()
      } else if (status === 'FAILED') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setIsPolling(false)
        setError(data.product?.error_message || '제품 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } catch (err) {
      console.error('제품 상태 조회 실패:', err)
    }
  }

  // 제품 등록
  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('제품 이름을 입력해주세요')
      return
    }

    // 이미지 필수 체크 (파일 업로드 또는 URL에서 가져온 이미지)
    if (!imageDataUrl && !sourceImageUrl) {
      setError('제품 이미지를 업로드해주세요')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const filteredSellingPoints = sellingPoints.filter(sp => sp.trim())

      // 이미지 데이터 (파일 업로드 vs URL에서 가져온 이미지)
      const imageData: { imageDataUrl?: string; sourceImageUrl?: string } = {}
      if (imageDataUrl) {
        imageData.imageDataUrl = imageDataUrl
      } else if (sourceImageUrl) {
        imageData.sourceImageUrl = sourceImageUrl
      }

      const res = await fetch('/api/ad-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ...imageData,
          description: description.trim() || undefined,
          sellingPoints: filteredSellingPoints.length > 0 ? filteredSellingPoints : undefined,
          sourceUrl: inputMode === 'url' ? productUrl.trim() : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 402) {
          setError('크레딧이 부족합니다')
        } else if (res.status === 403) {
          // 제품 슬롯 한도 도달 - 모달 표시
          if (data.slotInfo) {
            setSlotInfo(data.slotInfo)
            setShowSlotLimitModal(true)
          } else {
            setError('제품 등록 한도에 도달했습니다')
          }
        } else {
          setError(data.error || '제품 등록에 실패했습니다')
        }
        setIsSubmitting(false)
        return
      }

      const data = await res.json()
      const productId = data.product.id

      // 제품이 바로 완료될 수 있으므로 상태 확인
      if (data.product.status === 'COMPLETED') {
        onProductCreated(data.product)
        onClose()
        return
      }

      // 폴링 시작
      setIsSubmitting(false)
      setIsPolling(true)

      pollingRef.current = setInterval(() => {
        pollProductStatus(productId)
      }, 2000)

    } catch (err) {
      console.error('제품 등록 실패:', err)
      setError('제품 등록 중 오류가 발생했습니다')
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isSubmitting && !isPolling ? onClose : undefined}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card rounded-t-2xl">
          <h2 className="text-lg font-bold text-foreground">새 제품 등록</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting || isPolling}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4 space-y-4">
          {isPolling ? (
            /* 처리 중 상태 */
            <div className="py-12 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="처리 중"
                    className="w-full h-full object-contain rounded-lg"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <p className="text-foreground font-medium mb-2">배경 제거 중...</p>
              <p className="text-sm text-muted-foreground">
                잠시만 기다려주세요
              </p>
            </div>
          ) : (
            <>
              {/* 입력 모드 선택 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('url')}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    inputMode === 'url'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  URL로 가져오기
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    inputMode === 'manual'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  직접 입력
                </button>
              </div>

              {/* URL 입력 영역 */}
              {inputMode === 'url' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    제품 URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://example.com/product/..."
                      className="flex-1 px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      disabled={isSubmitting || isExtractingUrl}
                    />
                    <button
                      onClick={handleExtractUrl}
                      disabled={isExtractingUrl || !productUrl.trim() || isSubmitting}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {isExtractingUrl ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          분석 중
                        </>
                      ) : (
                        '정보 가져오기'
                      )}
                    </button>
                  </div>
                  {urlExtracted && (
                    <p className="text-xs text-green-500">정보를 가져왔습니다. 아래에서 확인 및 수정하세요.</p>
                  )}
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 제품 이름 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  제품 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 수분 크림 300ml"
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isSubmitting}
                />
              </div>

              {/* 제품 이미지 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  제품 이미지 <span className="text-red-500">*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative cursor-pointer border-2 border-dashed rounded-lg transition-colors
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    ${imagePreview ? 'p-2' : 'p-8'}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {imagePreview ? (
                    <div className="relative aspect-square max-w-[200px] mx-auto">
                      <img
                        src={imagePreview}
                        alt="제품 미리보기"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setImagePreview(null)
                          setImageDataUrl(null)
                          setSourceImageUrl(null)
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        클릭하거나 이미지를 드래그하세요
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        PNG, JPG, WEBP (최대 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 제품 설명 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  제품 설명 <span className="text-muted-foreground text-xs">(선택)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="제품에 대한 설명을 입력하세요..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* 셀링 포인트 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  셀링 포인트 <span className="text-muted-foreground text-xs">(선택)</span>
                </label>
                <div className="space-y-2">
                  {sellingPoints.map((point, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updateSellingPoint(index, e.target.value)}
                        placeholder="예: 24시간 보습"
                        className="flex-1 px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={isSubmitting}
                      />
                      {sellingPoints.length > 1 && (
                        <button
                          onClick={() => removeSellingPoint(index)}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                          disabled={isSubmitting}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {sellingPoints.length < 10 && (
                    <button
                      onClick={addSellingPoint}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                      포인트 추가
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        {!isPolling && (
          <div className="sticky bottom-0 flex gap-3 p-4 border-t border-border bg-card rounded-b-2xl">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-foreground bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim() || (!imageDataUrl && !sourceImageUrl)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  등록하기
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 슬롯 한도 도달 모달 */}
      {slotInfo && (
        <SlotLimitModal
          isOpen={showSlotLimitModal}
          onClose={() => {
            setShowSlotLimitModal(false)
            onClose()
          }}
          slotType="product"
          slotInfo={slotInfo}
        />
      )}
    </div>
  )
}
