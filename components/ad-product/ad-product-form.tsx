/**
 * 광고 제품 등록 폼 컴포넌트
 *
 * 두 가지 입력 모드 지원:
 * 1. URL 입력: 스크래핑/Gemini로 제품 정보 자동 수집
 * 2. 직접 입력: 사용자가 직접 모든 정보 입력
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'
import { Upload, X, Loader2, Plus, Minus, Link as LinkIcon, Edit3 } from 'lucide-react'
import { AdProductScanner } from './ad-product-scanner'
import { AdCreationHeader } from '@/components/ui/ad-creation-header'
import { SlotLimitModal } from '@/components/ui/slot-limit-modal'

type InputMode = 'url' | 'manual'

interface SlotInfo {
  used: number
  limit: number
  message?: string
}

export function AdProductForm() {
  const { t } = useLanguage()
  const { refreshCredits } = useCredits()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 번역 타입
  type AdProductFormT = {
    fetchFromUrl?: string
    manualInput?: string
    productUrl?: string
    fetchInfo?: string
    analyzing?: string
    fetchSuccess?: string
    productDescription?: string
    productDescPlaceholder?: string
    sellingPoints?: string
    sellingPointExample?: string
    sellingPointPlaceholder?: string
    addSellingPoint?: string
    additionalPhotos?: string
    maxPhotos?: string
    processing?: string
    newProduct?: string
    validation?: {
      enterProductName?: string
      selectProductImage?: string
      enterUrl?: string
      invalidFormat?: string
      fileTooLarge?: string
      imageTooSmall?: string
      imageTooLarge?: string
      resolutionTooHigh?: string
      cannotReadImage?: string
      fetchFailed?: string
      slotFull?: string
    }
  }
  const formT = t.adProductForm as AdProductFormT | undefined
  const validationT = formT?.validation

  // 쿼리 파라미터에서 재시도 데이터 가져오기
  const retryName = searchParams.get('name')
  const retryImageUrl = searchParams.get('imageUrl')

  // 입력 모드
  const [inputMode, setInputMode] = useState<InputMode>('manual')

  // URL 입력 관련
  const [productUrl, setProductUrl] = useState('')
  const [isExtractingUrl, setIsExtractingUrl] = useState(false)
  const [urlExtracted, setUrlExtracted] = useState(false)

  // 기본 정보
  const [name, setName] = useState(retryName || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(retryImageUrl)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 제품 정보 필드
  const [description, setDescription] = useState('')
  const [sellingPoints, setSellingPoints] = useState<string[]>([''])

  // 스캐너 모드 상태
  const [scannerMode, setScannerMode] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)

  // 슬롯 제한 모달 상태
  const [showSlotLimitModal, setShowSlotLimitModal] = useState(false)
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null)

  // 이미지 유효성 검사 상수
  const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_MEGAPIXELS = 16 * 1000000 // 16MP
  const MAX_DIMENSION = 4096 // 4096px
  const MIN_DIMENSION = 256 // 256px

  const validateImage = useCallback((file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        resolve(validationT?.invalidFormat || 'Unsupported format. Only PNG, JPG, WEBP are allowed.')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMsg = validationT?.fileTooLarge || 'File size is too large. Maximum 5MB allowed. (Current: {size}MB)'
        resolve(sizeMsg.replace('{size}', (file.size / 1024 / 1024).toFixed(1)))
        return
      }

      const img = new Image()
      img.onload = () => {
        const { width, height } = img
        const megapixels = width * height

        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          const smallMsg = validationT?.imageTooSmall || 'Image is too small. Minimum {min}px required. (Current: {width}x{height})'
          resolve(smallMsg.replace('{min}', String(MIN_DIMENSION)).replace('{width}', String(width)).replace('{height}', String(height)))
          return
        }

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const largeMsg = validationT?.imageTooLarge || 'Image is too large. Maximum {max}px allowed. (Current: {width}x{height})'
          resolve(largeMsg.replace('{max}', String(MAX_DIMENSION)).replace('{width}', String(width)).replace('{height}', String(height)))
          return
        }

        if (megapixels > MAX_MEGAPIXELS) {
          const resMsg = validationT?.resolutionTooHigh || 'Image resolution is too high. Maximum 16MP allowed. (Current: {mp}MP)'
          resolve(resMsg.replace('{mp}', (megapixels / 1000000).toFixed(1)))
          return
        }

        resolve(null)
      }

      img.onerror = () => {
        resolve(validationT?.cannotReadImage || 'Cannot read image.')
      }

      img.src = URL.createObjectURL(file)
    })
  }, [validationT])

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = await validateImage(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }, [validateImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl])

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

  // URL에서 정보 추출
  const handleExtractUrl = async () => {
    if (!productUrl.trim()) {
      setError(validationT?.enterUrl || 'Please enter URL')
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
        const error = await res.json()
        throw new Error(error.error || (validationT?.fetchFailed || 'Unable to fetch info'))
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
        setPreviewUrl(info.imageUrl)
      }

      setUrlExtracted(true)
    } catch (err) {
      console.error('URL 추출 오류:', err)
      setError(err instanceof Error ? err.message : (validationT?.fetchFailed || 'Unable to fetch info'))
    } finally {
      setIsExtractingUrl(false)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(validationT?.enterProductName || 'Please enter product name')
      return
    }

    if (!selectedFile && !previewUrl) {
      setError(validationT?.selectProductImage || 'Please select product image')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const imageData: { imageDataUrl?: string; sourceImageUrl?: string } = {}

      if (selectedFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(selectedFile)
        })
        imageData.imageDataUrl = dataUrl
      } else if (previewUrl && !previewUrl.startsWith('blob:')) {
        // URL로 가져온 이미지인 경우
        imageData.sourceImageUrl = previewUrl
      }

      // 유효한 셀링 포인트만 필터링
      const validSellingPoints = sellingPoints.filter(p => p.trim().length > 0)

      // 제품 생성
      const createRes = await fetch('/api/ad-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ...imageData,
          description: description.trim() || undefined,
          sellingPoints: validSellingPoints.length > 0 ? validSellingPoints : undefined,
          sourceUrl: inputMode === 'url' ? productUrl.trim() : undefined,
        }),
      })

      // 슬롯 제한 초과 (403)
      if (createRes.status === 403) {
        const errorData = await createRes.json()
        if (errorData.slotInfo) {
          setSlotInfo(errorData.slotInfo)
          setShowSlotLimitModal(true)
        } else {
          setError(errorData.error || (validationT?.slotFull || 'Slot is full'))
        }
        return
      }

      if (!createRes.ok) {
        const errorData = await createRes.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const { product, sourceImageUrl: uploadedSourceUrl } = await createRes.json()

      // 크레딧 갱신
      refreshCredits()

      // 스캐너 모드로 전환
      setProductId(product.id)
      setSourceImageUrl(uploadedSourceUrl)
      setScannerMode(true)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScanComplete = () => {
    if (productId) {
      router.push(`/dashboard/ad-products/${productId}`)
    }
  }

  // 스캐너 모드일 때
  if (scannerMode && productId && sourceImageUrl) {
    return (
      <AdProductScanner
        productId={productId}
        sourceImageUrl={sourceImageUrl}
        onComplete={handleScanComplete}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* 헤더 */}
      <AdCreationHeader
        backHref="/dashboard/image-ad"
        title={t.adProduct.registerProduct}
        selectedProduct={previewUrl ? {
          name: name || (formT?.newProduct || 'New Product'),
          imageUrl: previewUrl,
        } : null}
      />

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* 입력 모드 선택 */}
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode('url')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              inputMode === 'url'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            {formT?.fetchFromUrl || 'Fetch from URL'}
          </button>
          <button
            onClick={() => setInputMode('manual')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              inputMode === 'manual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            {formT?.manualInput || 'Manual Input'}
          </button>
        </div>

        {/* URL 입력 영역 */}
        {inputMode === 'url' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              {formT?.productUrl || 'Product URL'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://example.com/product/..."
                className="flex-1 px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleExtractUrl}
                disabled={isExtractingUrl || !productUrl.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isExtractingUrl ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{formT?.analyzing || 'Analyzing...'}</span>
                  </>
                ) : (
                  formT?.fetchInfo || 'Fetch Info'
                )}
              </button>
            </div>
            {urlExtracted && (
              <p className="text-sm text-green-500">{formT?.fetchSuccess || 'Successfully fetched info. Please review and modify below.'}</p>
            )}
          </div>
        )}

        {/* 제품 이름 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t.adProduct.productName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.adProduct.productNamePlaceholder}
            className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* 제품 이미지 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t.adProduct.productImage} <span className="text-red-500">*</span>
          </label>

          {previewUrl ? (
            <div className="relative aspect-square bg-secondary/30 rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <button
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-secondary/20 transition-colors"
            >
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{t.adProduct.selectImage}</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <p className="text-xs text-muted-foreground mt-2">
            {formT?.imageSpec || 'PNG, JPG, WEBP / Max 5MB / 256~4096px'}
          </p>
        </div>

        {/* 제품 설명 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {formT?.productDescription || 'Product Description'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={formT?.productDescPlaceholder || 'Enter a detailed description of your product...'}
            rows={3}
            className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        {/* 셀링 포인트 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {formT?.sellingPoints || 'Selling Points'}
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            {formT?.sellingPointExample || 'e.g., "24-hour lasting moisture", "Dermatologist recommended", "Fragrance-free"'}
          </p>
          <div className="space-y-2">
            {sellingPoints.map((point, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updateSellingPoint(index, e.target.value)}
                  placeholder={formT?.sellingPointPlaceholder || 'Enter product advantages or features'}
                  className="flex-1 px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {sellingPoints.length > 1 && (
                  <button
                    onClick={() => removeSellingPoint(index)}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {sellingPoints.length < 10 && (
              <button
                onClick={addSellingPoint}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {formT?.addSellingPoint || 'Add Selling Point'}
              </button>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* 등록 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim() || (!selectedFile && !previewUrl)}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{formT?.processing || 'Processing...'}</span>
            </>
          ) : (
            t.adProduct.register
          )}
        </button>
      </div>

      {/* 슬롯 제한 모달 */}
      {slotInfo && (
        <SlotLimitModal
          isOpen={showSlotLimitModal}
          onClose={() => setShowSlotLimitModal(false)}
          slotType="product"
          slotInfo={slotInfo}
          onManageItems={() => router.push('/dashboard/ad-products')}
        />
      )}
    </div>
  )
}
