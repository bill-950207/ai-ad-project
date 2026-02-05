/**
 * 광고 제품 등록 폼 컴포넌트
 *
 * 두 가지 입력 모드 지원:
 * 1. URL 입력: 스크래핑으로 제품 정보 자동 수집
 * 2. 직접 입력: 사용자가 직접 모든 정보 입력
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'
import { Upload, X, Loader2, Plus, Minus, Link as LinkIcon, Edit3, Sparkles } from 'lucide-react'
import { AdProductScanner } from './ad-product-scanner'
import { AdCreationHeader } from '@/components/ui/ad-creation-header'
import { SlotLimitModal } from '@/components/ui/slot-limit-modal'

type InputMode = 'url' | 'manual'

interface SlotInfo {
  used: number
  limit: number
  message?: string
}

interface AdProductFormProps {
  /** 모달 모드 여부 */
  isModal?: boolean
  /** 등록 완료 시 콜백 */
  onComplete?: (productId: string) => void
  /** 모달 닫기 콜백 */
  onClose?: () => void
}

export function AdProductForm({ isModal = false, onComplete, onClose }: AdProductFormProps) {
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
    imageSpec?: string
    formHint?: string
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
      fetchFailedGuide?: string
      switchToManual?: string
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
  const [urlFetchFailed, setUrlFetchFailed] = useState(false)

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
    setUrlFetchFailed(false)

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
      setUrlFetchFailed(false)
    } catch (err) {
      console.error('URL 추출 오류:', err)
      setUrlFetchFailed(true)
      setError(null) // 에러는 별도 UI로 표시
    } finally {
      setIsExtractingUrl(false)
    }
  }

  // 수동 입력으로 전환
  const handleSwitchToManual = () => {
    setInputMode('manual')
    setUrlFetchFailed(false)
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
      if (isModal && onComplete) {
        onComplete(productId)
      } else {
        router.push(`/dashboard/ad-products/${productId}`)
      }
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
    <div className={isModal ? '' : 'max-w-lg mx-auto'}>
      {/* 헤더 - 페이지 모드에서만 표시 */}
      {!isModal && (
        <AdCreationHeader
          backHref="/dashboard/ad-products"
          title={t.adProduct.registerProduct}
          selectedProduct={previewUrl ? {
            name: name || (formT?.newProduct || 'New Product'),
            imageUrl: previewUrl,
          } : null}
        />
      )}

      <div className={`space-y-5 ${isModal ? '' : 'bg-card border border-border rounded-xl p-6'}`}>
        {/* 입력 모드 선택 */}
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode('url')}
            disabled={isExtractingUrl}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              inputMode === 'url'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            {formT?.fetchFromUrl || 'Fetch from URL'}
          </button>
          <button
            onClick={() => setInputMode('manual')}
            disabled={isExtractingUrl}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              inputMode === 'manual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            {formT?.manualInput || 'Manual Input'}
          </button>
        </div>

        {/* URL 입력 영역 */}
        {inputMode === 'url' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {formT?.productUrl || 'Product URL'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={productUrl}
                onChange={(e) => {
                  setProductUrl(e.target.value)
                  // URL 수정 시 실패 상태 초기화
                  if (urlFetchFailed) setUrlFetchFailed(false)
                }}
                disabled={isExtractingUrl}
                placeholder="https://example.com/product/..."
                className="flex-1 px-3 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-secondary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleExtractUrl}
                disabled={isExtractingUrl || !productUrl.trim()}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
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
              <p className="text-xs text-emerald-500 font-medium">{formT?.fetchSuccess || 'Successfully fetched info. Please review and modify below.'}</p>
            )}
            {urlFetchFailed && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-500">
                      {validationT?.fetchFailed || 'Unable to fetch info'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {validationT?.fetchFailedGuide || 'Some shopping sites restrict automatic information collection.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSwitchToManual}
                  className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-xl text-sm font-medium transition-all duration-200"
                >
                  {validationT?.switchToManual || 'Switch to manual input'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 상단 안내 문구 */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-violet-500/5 border border-primary/20">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground/80">
              {formT?.formHint || 'Detailed product info helps AI create more relevant ads'}
            </p>
          </div>
        </div>

        {/* 제품 이름 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.adProduct.productName} <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isExtractingUrl}
            placeholder={t.adProduct.productNamePlaceholder}
            className="w-full px-3 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-secondary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* 제품 이미지 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.adProduct.productImage} <span className="text-rose-400">*</span>
          </label>

          {previewUrl ? (
            <div className={`group relative w-36 h-36 bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-2xl overflow-hidden ring-1 ring-border/50 ${isExtractingUrl ? 'opacity-50' : ''}`}>
              <img
                src={previewUrl}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-contain p-2"
              />
              {!isExtractingUrl && (
                <>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
                  <button
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div
              onClick={() => !isExtractingUrl && fileInputRef.current?.click()}
              onDrop={!isExtractingUrl ? handleDrop : undefined}
              onDragOver={!isExtractingUrl ? handleDragOver : undefined}
              className={`group w-36 h-36 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                isExtractingUrl
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:border-primary/60 hover:bg-primary/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center mb-2 transition-colors duration-200 ${!isExtractingUrl ? 'group-hover:bg-primary/20' : ''}`}>
                <Upload className={`w-5 h-5 text-muted-foreground transition-colors duration-200 ${!isExtractingUrl ? 'group-hover:text-primary' : ''}`} />
              </div>
              <p className="text-xs text-muted-foreground/70 text-center px-3">{t.adProduct.selectImage}</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileInputChange}
            disabled={isExtractingUrl}
            className="hidden"
          />

          <p className="text-[10px] text-muted-foreground/60 tracking-wide">
            {formT?.imageSpec || 'PNG, JPG, WEBP / Max 5MB / 256~4096px'}
          </p>
        </div>

        {/* 제품 설명 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {formT?.productDescription || 'Product Description'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isExtractingUrl}
            placeholder={formT?.productDescPlaceholder || 'Enter a detailed description of your product...'}
            rows={2}
            className="w-full px-3 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-secondary/30 transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* 셀링 포인트 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {formT?.sellingPoints || 'Selling Points'}
          </label>
          <div className="space-y-2">
            {sellingPoints.map((point, index) => (
              <div key={index} className="group flex gap-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updateSellingPoint(index, e.target.value)}
                  disabled={isExtractingUrl}
                  placeholder={formT?.sellingPointPlaceholder || 'Enter product advantages or features'}
                  className="flex-1 px-3 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-secondary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {sellingPoints.length > 1 && !isExtractingUrl && (
                  <button
                    onClick={() => removeSellingPoint(index)}
                    className="p-2 text-muted-foreground/40 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {sellingPoints.length < 10 && !isExtractingUrl && (
              <button
                onClick={addSellingPoint}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary/70 hover:text-primary transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {formT?.addSellingPoint || 'Add Selling Point'}
              </button>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-xs text-rose-400 font-medium">{error}</p>
        )}

        {/* 등록 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isExtractingUrl || !name.trim() || (!selectedFile && !previewUrl)}
          className="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
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
