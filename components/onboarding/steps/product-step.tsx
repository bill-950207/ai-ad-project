/**
 * 제품 선택/등록 단계
 *
 * 기존 제품이 있으면 선택하거나 새 제품 등록
 * 기존 제품이 없으면 바로 등록 폼 표시
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Package, Plus, Check, Loader2, Upload, X, Link as LinkIcon, Edit3, Minus, ImagePlus, ChevronLeft } from 'lucide-react'
import { useOnboarding, OnboardingProduct } from '../onboarding-context'

// 이미지 유효성 검사 상수
const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_MEGAPIXELS = 16 * 1000000 // 16MP
const MAX_DIMENSION = 4096 // 4096px
const MIN_DIMENSION = 256 // 256px

type InputMode = 'url' | 'manual'
type ViewMode = 'list' | 'form'

export function ProductStep() {
  const {
    products,
    selectedProduct,
    isLoadingProducts,
    isRegisteringProduct,
    setProducts,
    setSelectedProduct,
    setIsLoadingProducts,
    setIsRegisteringProduct,
    onProductCreated,
    setError,
  } = useOnboarding()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [inputMode, setInputMode] = useState<InputMode>('manual')

  // 폼 상태
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalPhotosRef = useRef<HTMLInputElement>(null)
  const [productUrl, setProductUrl] = useState('')
  const [isExtractingUrl, setIsExtractingUrl] = useState(false)
  const [urlExtracted, setUrlExtracted] = useState(false)
  const [name, setName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [sellingPoints, setSellingPoints] = useState<string[]>([''])
  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState<File[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  // 제품 목록 로드
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true)
      try {
        const res = await fetch('/api/ad-products')
        if (!res.ok) throw new Error('Failed to fetch products')
        const data = await res.json()
        // COMPLETED 상태인 제품만 필터링
        const completedProducts = (data.products || []).filter(
          (p: OnboardingProduct) => p.status === 'COMPLETED'
        )
        setProducts(completedProducts)

        // 제품이 없으면 바로 등록 폼 표시
        if (completedProducts.length === 0) {
          setViewMode('form')
        }
      } catch (err) {
        console.error('제품 로드 오류:', err)
        setError('제품 목록을 불러올 수 없습니다')
      } finally {
        setIsLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [setProducts, setIsLoadingProducts, setError])

  // 이미지 유효성 검사
  const validateImage = useCallback((file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        resolve('지원되지 않는 형식입니다. PNG, JPG, WEBP만 가능합니다.')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        resolve(`파일 크기가 너무 큽니다. 최대 5MB까지 가능합니다.`)
        return
      }

      const img = new Image()
      img.onload = () => {
        const { width, height } = img
        const megapixels = width * height

        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          resolve(`이미지가 너무 작습니다. 최소 ${MIN_DIMENSION}px 이상이어야 합니다.`)
          return
        }

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          resolve(`이미지가 너무 큽니다. 최대 ${MAX_DIMENSION}px 이하여야 합니다.`)
          return
        }

        if (megapixels > MAX_MEGAPIXELS) {
          resolve(`이미지 해상도가 너무 높습니다. 최대 16MP까지 가능합니다.`)
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

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = await validateImage(file)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setFormError(null)
  }, [validateImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
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
        setFormError(validationError)
        return
      }
    }

    setAdditionalPhotoFiles([...additionalPhotoFiles, ...filesToAdd])
    setFormError(null)
  }

  const removeAdditionalPhoto = (index: number) => {
    setAdditionalPhotoFiles(additionalPhotoFiles.filter((_, i) => i !== index))
  }

  // URL에서 정보 추출
  const handleExtractUrl = async () => {
    if (!productUrl.trim()) {
      setFormError('URL을 입력해주세요')
      return
    }

    setIsExtractingUrl(true)
    setFormError(null)

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
      setFormError(err instanceof Error ? err.message : '정보를 가져올 수 없습니다')
    } finally {
      setIsExtractingUrl(false)
    }
  }

  // 제품 등록 제출
  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError('제품 이름을 입력해주세요')
      return
    }

    if (!selectedFile && !previewUrl) {
      setFormError('제품 이미지를 선택해주세요')
      return
    }

    setIsRegisteringProduct(true)
    setFormError(null)

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
        imageData.sourceImageUrl = previewUrl
      }

      const validSellingPoints = sellingPoints.filter(p => p.trim().length > 0)

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
        throw new Error(error.error || '제품 등록에 실패했습니다')
      }

      const { product, sourceImageUrl } = await createRes.json()
      onProductCreated(product.id, sourceImageUrl)
    } catch (err) {
      console.error('등록 오류:', err)
      setFormError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setIsRegisteringProduct(false)
    }
  }

  // 제품 선택
  const handleSelectProduct = (product: OnboardingProduct) => {
    setSelectedProduct(product)
  }

  // 로딩 중
  if (isLoadingProducts) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">제품 목록을 불러오는 중...</p>
      </div>
    )
  }

  // 제품 목록 뷰
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {/* 새 제품 등록 버튼 */}
        <button
          onClick={() => setViewMode('form')}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/50 rounded-xl text-primary hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">새 제품 등록하기</span>
        </button>

        {/* 기존 제품 목록 */}
        {products.length > 0 && (
          <>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">또는 기존 제품 선택</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((product) => {
                const isSelected = selectedProduct?.id === product.id
                const imageUrl = product.rembg_image_url || product.image_url

                return (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain bg-secondary/30"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* 선택 표시 */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}

                    {/* 제품명 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate font-medium">
                        {product.name}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // 제품 등록 폼 뷰
  return (
    <div className="space-y-4">
      {/* 뒤로가기 (제품이 있는 경우만) */}
      {products.length > 0 && (
        <button
          onClick={() => setViewMode('list')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          제품 목록으로 돌아가기
        </button>
      )}

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
          제품 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 프리미엄 보습 크림"
          className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* 제품 이미지 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          제품 이미지 <span className="text-red-500">*</span>
        </label>

        {previewUrl ? (
          <div className="relative aspect-square max-w-[200px] bg-secondary/30 rounded-lg overflow-hidden">
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
            className="aspect-square max-w-[200px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-secondary/20 transition-colors"
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">클릭 또는 드래그</p>
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
          rows={2}
          className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* 셀링 포인트 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          셀링 포인트
        </label>
        <div className="space-y-2">
          {sellingPoints.map((point, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={point}
                onChange={(e) => updateSellingPoint(index, e.target.value)}
                placeholder="예: 24시간 지속되는 보습력"
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
          {sellingPoints.length < 5 && (
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
            <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden">
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
              className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors"
            >
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
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
      {formError && (
        <p className="text-sm text-red-500">{formError}</p>
      )}

      {/* 등록 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={isRegisteringProduct || !name.trim() || (!selectedFile && !previewUrl)}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isRegisteringProduct ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>등록 중...</span>
          </>
        ) : (
          '제품 등록하기'
        )}
      </button>
    </div>
  )
}
