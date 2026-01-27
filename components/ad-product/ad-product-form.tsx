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
import { Upload, X, Loader2, Plus, Minus, Link as LinkIcon, Edit3, ImagePlus } from 'lucide-react'
import { AdProductScanner } from './ad-product-scanner'
import { AdCreationHeader } from '@/components/ui/ad-creation-header'

type InputMode = 'url' | 'manual'

export function AdProductForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalPhotosRef = useRef<HTMLInputElement>(null)

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
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([])
  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState<File[]>([])

  // 스캐너 모드 상태
  const [scannerMode, setScannerMode] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)

  // 이미지 유효성 검사 상수
  const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_MEGAPIXELS = 16 * 1000000 // 16MP
  const MAX_DIMENSION = 4096 // 4096px
  const MIN_DIMENSION = 256 // 256px

  const validateImage = useCallback((file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        resolve('지원되지 않는 형식입니다. PNG, JPG, WEBP만 가능합니다.')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        resolve(`파일 크기가 너무 큽니다. 최대 5MB까지 가능합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
        return
      }

      const img = new Image()
      img.onload = () => {
        const { width, height } = img
        const megapixels = width * height

        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          resolve(`이미지가 너무 작습니다. 최소 ${MIN_DIMENSION}px 이상이어야 합니다. (현재: ${width}x${height})`)
          return
        }

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          resolve(`이미지가 너무 큽니다. 최대 ${MAX_DIMENSION}px 이하여야 합니다. (현재: ${width}x${height})`)
          return
        }

        if (megapixels > MAX_MEGAPIXELS) {
          resolve(`이미지 해상도가 너무 높습니다. 최대 16MP까지 가능합니다. (현재: ${(megapixels / 1000000).toFixed(1)}MP)`)
          return
        }

        resolve(null)
      }

      img.onerror = () => {
        resolve('이미지를 읽을 수 없습니다.')
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

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

  // 추가 사진 관리
  const handleAdditionalPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 5 - additionalPhotoFiles.length
    const filesToAdd = files.slice(0, remaining)

    for (const file of filesToAdd) {
      const validationError = await validateImage(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setAdditionalPhotoFiles([...additionalPhotoFiles, ...filesToAdd])
    setError(null)
  }

  const removeAdditionalPhoto = (index: number) => {
    setAdditionalPhotoFiles(additionalPhotoFiles.filter((_, i) => i !== index))
    setAdditionalPhotos(additionalPhotos.filter((_, i) => i !== index))
  }

  // URL에서 정보 추출
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
        const error = await res.json()
        throw new Error(error.error || '정보를 가져올 수 없습니다')
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
      setError(err instanceof Error ? err.message : '정보를 가져올 수 없습니다')
    } finally {
      setIsExtractingUrl(false)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('제품 이름을 입력해주세요')
      return
    }

    if (!selectedFile && !previewUrl) {
      setError('제품 이미지를 선택해주세요')
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

      if (!createRes.ok) {
        const error = await createRes.json()
        throw new Error(error.error || 'Failed to create product')
      }

      const { product, sourceImageUrl: uploadedSourceUrl } = await createRes.json()

      // 스캐너 모드로 전환
      setProductId(product.id)
      setSourceImageUrl(uploadedSourceUrl)
      setScannerMode(true)
    } catch (err) {
      console.error('등록 오류:', err)
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
          name: name || '새 제품',
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
            URL로 가져오기
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
            직접 입력
          </button>
        </div>

        {/* URL 입력 영역 */}
        {inputMode === 'url' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              제품 URL
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
                    <span>분석 중...</span>
                  </>
                ) : (
                  '정보 가져오기'
                )}
              </button>
            </div>
            {urlExtracted && (
              <p className="text-sm text-green-500">정보를 성공적으로 가져왔습니다. 아래에서 확인 및 수정하세요.</p>
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
            PNG, JPG, WEBP / 최대 5MB / 256~4096px
          </p>
        </div>

        {/* 제품 설명 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            제품 설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="제품에 대한 상세 설명을 입력하세요..."
            rows={3}
            className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        {/* 셀링 포인트 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            셀링 포인트
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            예: "24시간 지속되는 보습력", "피부과 전문의 추천", "무향료/무색소"
          </p>
          <div className="space-y-2">
            {sellingPoints.map((point, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updateSellingPoint(index, e.target.value)}
                  placeholder={`제품의 장점이나 특징을 입력하세요`}
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
                셀링 포인트 추가
              </button>
            )}
          </div>
        </div>

        {/* 추가 사진 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            추가 사진 <span className="text-muted-foreground text-xs">(최대 5장)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {additionalPhotoFiles.map((file, index) => (
              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`추가 사진 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeAdditionalPhoto(index)}
                  className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {additionalPhotoFiles.length < 5 && (
              <button
                onClick={() => additionalPhotosRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
              </button>
            )}
          </div>
          <input
            ref={additionalPhotosRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleAdditionalPhotosChange}
            className="hidden"
          />
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
              <span>처리 중...</span>
            </>
          ) : (
            t.adProduct.register
          )}
        </button>
      </div>
    </div>
  )
}
