/**
 * 광고 제품 등록 폼 컴포넌트
 *
 * 제품 이름과 이미지를 입력받아 등록합니다.
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react'
import { uploadSourceImage } from '@/lib/client/ad-product-upload'
import { AdProductScanner } from './ad-product-scanner'

export function AdProductForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 스캐너 모드 상태
  const [scannerMode, setScannerMode] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }, [])

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t.adProduct.productNamePlaceholder)
      return
    }

    if (!selectedFile) {
      setError(t.adProduct.selectImage)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 1. 이미지를 Data URL로 변환
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      // 2. 제품 생성 (이미지 Data URL과 함께)
      const createRes = await fetch('/api/ad-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          imageDataUrl: dataUrl,
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
      router.push(`/dashboard/image-ad/product/${productId}`)
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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t.adProduct.registerProduct}</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* 제품 이름 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t.adProduct.productName}
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
            {t.adProduct.productImage}
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
            accept="image/*"
            onChange={handleFileInputChange}
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
          disabled={isSubmitting || !name.trim() || !selectedFile}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            t.adProduct.register
          )}
        </button>
      </div>
    </div>
  )
}
