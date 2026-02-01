/**
 * 영상 광고 생성 페이지
 *
 * 카테고리에 따라 다른 마법사 컴포넌트를 표시합니다.
 * - productDescription: 제품 설명 영상 마법사
 * - (기본): 기존 영상 광고 생성 폼
 */

'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { ProductDescriptionWizard } from '@/components/video-ad/product-description-wizard'
import { AdCreationHeader } from '@/components/ui/ad-creation-header'
import {
  Sparkles,
  Loader2,
  ChevronDown,
  Check,
  Package,
  User,
  Video,
  Link as LinkIcon,
  FileText,
  Clock,
  Monitor,
  Play,
  RatioIcon,
  Upload,
  X,
} from 'lucide-react'

interface AdProduct {
  id: string
  name: string
  rembg_image_url: string | null
  image_url: string | null
}

interface Avatar {
  id: string
  name: string
  image_url: string | null
}

type VideoDuration = 5 | 10 | 15
type VideoResolution = '720p' | '1080p'
type AspectRatio = '1:1' | '16:9' | '9:16'
type ProductInputMode = 'direct' | 'url'

interface VideoAdGenerationStatus {
  generatingScript?: string
  generatingFirstScene?: string
  generatingFirstSceneQueue?: string
  generatingVideo?: string
  generatingVideoQueue?: string
  completed?: string
  requestFailed?: string
  statusCheckFailed?: string
  generationFailed?: string
  timeout?: string
  localImage?: string
}

interface VideoAdTranslation {
  generationStatus?: VideoAdGenerationStatus
  createAd?: string
  selectProduct?: string
  selectAvatar?: string
  noProductSelected?: string
  noAvatarSelected?: string
  productInfo?: string
  directInput?: string
  urlInput?: string
  productName?: string
  productNamePlaceholder?: string
  productDescription?: string
  productDescriptionPlaceholder?: string
  targetAudience?: string
  targetAudiencePlaceholder?: string
  keyFeatures?: string
  keyFeaturesPlaceholder?: string
  adTone?: string
  adTonePlaceholder?: string
  productUrl?: string
  productUrlPlaceholder?: string
  duration?: string
  resolution?: string
  aspectRatio?: string
  creditsRequired?: string
  generate?: string
  generating?: string
  alerts?: {
    generateError?: string
  }
  [key: string]: unknown
}

function VideoAdCreateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const { t } = useLanguage()

  const videoAdT = t.videoAd as VideoAdTranslation | undefined
  const statusT = videoAdT?.generationStatus

  // 파일 입력 ref - hooks는 항상 동일한 순서로 호출되어야 함
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 기본 상태
  const [products, setProducts] = useState<AdProduct[]>([])
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [selectedProduct, setSelectedProduct] = useState<AdProduct | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 로컬 이미지 파일 상태
  const [localImageFile, setLocalImageFile] = useState<File | null>(null)
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null)

  // 드롭다운 상태
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false)

  // 제품 정보 입력 모드
  const [productInputMode, setProductInputMode] = useState<ProductInputMode>('direct')

  // 제품 정보 (직접 입력)
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [keyFeatures, setKeyFeatures] = useState('')
  const [adTone, setAdTone] = useState('')

  // 제품 정보 (URL 입력)
  const [productUrl, setProductUrl] = useState('')

  // 영상 옵션
  const [duration, setDuration] = useState<VideoDuration>(5)
  const [resolution, setResolution] = useState<VideoResolution>('720p')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')

  // 영상 생성
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'prompts' | 'image' | 'video'>('idle')
  const [firstSceneImageUrl, setFirstSceneImageUrl] = useState<string | null>(null)
  const [productSummary, setProductSummary] = useState<string | null>(null)

  // 데이터 로드
  const fetchData = useCallback(async () => {
    try {
      const [productsRes, avatarsRes] = await Promise.all([
        fetch('/api/ad-products'),
        fetch('/api/avatars'),
      ])

      if (productsRes.ok) {
        const data = await productsRes.json()
        const completedProducts = data.products.filter(
          (p: AdProduct & { status: string }) => p.status === 'COMPLETED'
        )
        setProducts(completedProducts)
      }

      if (avatarsRes.ok) {
        const data = await avatarsRes.json()
        const completedAvatars = data.avatars.filter(
          (a: Avatar & { status: string }) => a.status === 'COMPLETED'
        )
        setAvatars(completedAvatars)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (category !== 'productDescription') {
      fetchData()
    }
  }, [fetchData, category])

  // 선택된 제품에서 이름 가져오기
  useEffect(() => {
    if (selectedProduct && !productName) {
      setProductName(selectedProduct.name)
    }
  }, [selectedProduct, productName])

  // 제품 설명 영상 카테고리인 경우 전용 마법사 표시
  if (category === 'productDescription') {
    return <ProductDescriptionWizard />
  }

  // 로컬 이미지 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLocalImageFile(file)
      setLocalImagePreview(URL.createObjectURL(file))
      setSelectedProduct(null) // 기존 제품 선택 해제
      setShowProductDropdown(false)
    }
  }

  // 로컬 이미지 선택 해제
  const clearLocalImage = () => {
    setLocalImageFile(null)
    if (localImagePreview) {
      URL.revokeObjectURL(localImagePreview)
    }
    setLocalImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 생성 가능 여부
  const canGenerate = () => {
    const hasAsset = selectedProduct || selectedAvatar || localImageFile
    const hasProductInfo = productInputMode === 'url' ? productUrl.trim() : productName.trim()
    return hasAsset && hasProductInfo
  }

  // 영상 생성
  const handleGenerate = async () => {
    if (!canGenerate()) return

    setIsGenerating(true)
    setGenerationPhase('prompts')
    setGenerationStatus(statusT?.generatingScript || 'Generating video script...')
    setFirstSceneImageUrl(null)
    setProductSummary(null)

    try {
      const productInfo = [
        productName && `Product: ${productName}`,
        productDescription && `Description: ${productDescription}`,
        targetAudience && `Target: ${targetAudience}`,
        keyFeatures && `Features: ${keyFeatures}`,
        adTone && `Tone: ${adTone}`,
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/video-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct?.id,
          avatarId: selectedAvatar?.id,
          productInfo: productInfo || undefined,
          productUrl: productInputMode === 'url' ? productUrl : undefined,
          style: adTone || undefined,
          duration,
          resolution,
          aspectRatio,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || (statusT?.requestFailed || 'Video generation request failed'))
      }

      const data = await res.json()
      const { videoAdId, productSummary: summary } = data

      setProductSummary(summary)
      setGenerationPhase('image')
      setGenerationStatus(statusT?.generatingFirstScene || 'Generating first scene image...')

      const pollInterval = 3000
      const maxAttempts = 200

      let attempts = 0
      const pollStatus = async (): Promise<void> => {
        const statusRes = await fetch(`/api/video-ads/status/${videoAdId}`)
        if (!statusRes.ok) {
          throw new Error(statusT?.statusCheckFailed || 'Status check failed')
        }

        const status = await statusRes.json()

        if (status.status === 'COMPLETED') {
          setGenerationStatus(statusT?.completed || 'Completed!')
          router.push(`/dashboard/video-ad/${videoAdId}`)
          return
        }

        if (status.status === 'FAILED') {
          throw new Error(status.error || (statusT?.generationFailed || 'Video generation failed'))
        }

        if (['IMAGE_IN_QUEUE', 'IMAGE_IN_PROGRESS'].includes(status.status)) {
          setGenerationPhase('image')
          if (status.queuePosition) {
            const queueMsg = statusT?.generatingFirstSceneQueue?.replace('{{position}}', status.queuePosition) || `Generating first scene image... (#${status.queuePosition})`
            setGenerationStatus(queueMsg)
          } else {
            setGenerationStatus(statusT?.generatingFirstScene || 'Generating first scene image...')
          }
        } else if (['IN_QUEUE', 'IN_PROGRESS'].includes(status.status)) {
          setGenerationPhase('video')
          if (status.firstSceneImageUrl) {
            setFirstSceneImageUrl(status.firstSceneImageUrl)
          }
          if (status.queuePosition) {
            const queueMsg = statusT?.generatingVideoQueue?.replace('{{position}}', status.queuePosition) || `Generating video... (#${status.queuePosition})`
            setGenerationStatus(queueMsg)
          } else {
            setGenerationStatus(statusT?.generatingVideo || 'Generating video...')
          }
        }

        attempts++
        if (attempts >= maxAttempts) {
          throw new Error(statusT?.timeout || 'Generation timed out')
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
        return pollStatus()
      }

      await pollStatus()
    } catch (error) {
      console.error('Video generation error:', error)
      alert(error instanceof Error ? error.message : t.videoAd.alerts.generateError)
      setGenerationStatus('')
      setGenerationPhase('idle')
    } finally {
      setIsGenerating(false)
    }
  }

  // 번역
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videoAd = t.videoAd as any

  // 크레딧 계산
  const calculateCredits = () => {
    let credits = 5
    if (duration === 10) credits += 3
    if (duration === 15) credits += 6
    if (resolution === '1080p') credits += 2
    return credits
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* 헤더 */}
      <AdCreationHeader
        backHref="/dashboard/video-ad"
        title={videoAdT?.createAd || 'Create Video Ad'}
        selectedProduct={selectedProduct ? {
          name: selectedProduct.name,
          imageUrl: selectedProduct.rembg_image_url || selectedProduct.image_url,
        } : localImagePreview ? {
          name: localImageFile?.name || (statusT?.localImage || 'Local image'),
          imageUrl: localImagePreview,
        } : null}
        selectedAvatar={selectedAvatar ? {
          name: selectedAvatar.name,
          imageUrl: selectedAvatar.image_url,
        } : null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* 왼쪽: 입력 폼 */}
        <div className="space-y-4">
          {/* 제품 선택 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              {videoAd?.selectProduct || 'Select Product'}
            </label>

            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="relative">
              <button
                onClick={() => setShowProductDropdown(!showProductDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
              >
                {localImagePreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={localImagePreview}
                      alt={statusT?.localImage || 'Local image'}
                      className="w-8 h-8 object-contain rounded"
                    />
                    <span className="text-foreground">{localImageFile?.name || (statusT?.localImage || 'Local image')}</span>
                  </div>
                ) : selectedProduct ? (
                  <div className="flex items-center gap-3">
                    {(selectedProduct.rembg_image_url || selectedProduct.image_url) && (
                      <img
                        src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                        alt={selectedProduct.name}
                        className="w-8 h-8 object-contain rounded"
                      />
                    )}
                    <span className="text-foreground">{selectedProduct.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {videoAd?.noProductSelected || 'Select a product'}
                  </span>
                )}
                {localImagePreview ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearLocalImage()
                    }}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* 이미지 파일 선택 옵션 (최상단) */}
                  <button
                    onClick={() => {
                      fileInputRef.current?.click()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded bg-primary/10">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">이미지 파일 선택</span>
                  </button>

                  {products.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      등록된 제품이 없습니다
                    </div>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product)
                          clearLocalImage() // 로컬 이미지 선택 해제
                          setShowProductDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                      >
                        {(product.rembg_image_url || product.image_url) && (
                          <img
                            src={product.rembg_image_url || product.image_url || ''}
                            alt={product.name}
                            className="w-10 h-10 object-contain rounded bg-secondary/30"
                          />
                        )}
                        <span className="text-foreground">{product.name}</span>
                        {selectedProduct?.id === product.id && (
                          <Check className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 아바타 선택 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <User className="w-4 h-4 inline mr-2" />
              {videoAd?.selectAvatar || 'Select Avatar'}
            </label>
            <div className="relative">
              <button
                onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
              >
                {selectedAvatar ? (
                  <div className="flex items-center gap-3">
                    {selectedAvatar.image_url && (
                      <img
                        src={selectedAvatar.image_url}
                        alt={selectedAvatar.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <span className="text-foreground">{selectedAvatar.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {videoAd?.noAvatarSelected || 'Select an avatar'}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {showAvatarDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {avatars.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {videoAd?.noAvatarsCreated || 'No avatars created yet'}
                    </div>
                  ) : (
                    avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => {
                          setSelectedAvatar(avatar)
                          setShowAvatarDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                      >
                        {avatar.image_url && (
                          <img
                            src={avatar.image_url}
                            alt={avatar.name}
                            className="w-10 h-10 object-cover rounded bg-secondary/30"
                          />
                        )}
                        <span className="text-foreground">{avatar.name}</span>
                        {selectedAvatar?.id === avatar.id && (
                          <Check className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 제품 정보 입력 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              <FileText className="w-4 h-4 inline mr-2" />
              {videoAd?.productInfo || 'Product Info'}
            </label>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setProductInputMode('direct')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  productInputMode === 'direct'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                {videoAd?.directInput || 'Direct Input'}
              </button>
              <button
                onClick={() => setProductInputMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  productInputMode === 'url'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                {videoAd?.urlInput || 'URL Input'}
              </button>
            </div>

            {productInputMode === 'url' ? (
              <div className="space-y-3">
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder={videoAd?.productUrlPlaceholder || 'Enter product page URL'}
                  className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  {videoAd?.urlAnalysisHint || 'AI will automatically analyze product info from the URL'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {videoAd?.productName || 'Product Name'} *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={videoAd?.productNamePlaceholder || 'Enter product name'}
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {videoAd?.productDescription || 'Product Description'}
                  </label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder={videoAd?.productDescriptionPlaceholder || 'Describe the main features and benefits'}
                    rows={2}
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {videoAd?.targetAudience || 'Target Audience'}
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder={videoAd?.targetAudiencePlaceholder || 'e.g., Women aged 20-30 with skin concerns'}
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {videoAd?.keyFeatures || 'Key Features'}
                  </label>
                  <input
                    type="text"
                    value={keyFeatures}
                    onChange={(e) => setKeyFeatures(e.target.value)}
                    placeholder={videoAd?.keyFeaturesPlaceholder || 'e.g., Natural ingredients, 24-hour moisturizing'}
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {videoAd?.adTone || 'Ad Tone'}
                  </label>
                  <input
                    type="text"
                    value={adTone}
                    onChange={(e) => setAdTone(e.target.value)}
                    placeholder={videoAd?.adTonePlaceholder || 'e.g., Sophisticated, trustworthy, playful'}
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 영상 옵션 */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                {videoAd?.duration || 'Duration'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([5, 10, 15] as VideoDuration[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      duration === d
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {d}{videoAd?.seconds || 's'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Monitor className="w-4 h-4 inline mr-2" />
                {videoAd?.resolution || 'Resolution'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['720p', '1080p'] as VideoResolution[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      resolution === r
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {r === '720p' ? '720p (HD)' : '1080p (Full HD)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <RatioIcon className="w-4 h-4 inline mr-2" />
                {videoAd?.aspectRatio || 'Aspect Ratio'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      aspectRatio === ratio
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {ratio === '1:1' ? '1:1' : ratio === '16:9' ? '16:9' : '9:16'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 생성 버튼 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                {videoAd?.creditsRequired || 'Credits Required'}
              </span>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{calculateCredits()}</span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate() || isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {videoAd?.generating || 'Generating...'}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {videoAd?.generate || 'Generate Video'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 오른쪽: 미리보기 및 진행 상황 */}
        <div className="space-y-4">
          {/* 미리보기 영역 */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Video className="w-4 h-4" />
                미리보기
              </h3>
            </div>
            <div className={`${
              aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'
            } max-h-[500px] bg-secondary/30 flex items-center justify-center relative overflow-hidden`}>
              {/* 첫 씬 이미지가 있으면 표시 */}
              {firstSceneImageUrl ? (
                <div className="absolute inset-0">
                  <img
                    src={firstSceneImageUrl}
                    alt="First scene"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white text-sm font-medium">첫 씬 이미지 생성 완료</p>
                  </div>
                </div>
              ) : (selectedProduct || selectedAvatar || localImagePreview) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                  <div className="flex gap-4">
                    {localImagePreview ? (
                      <div className="text-center">
                        <img
                          src={localImagePreview}
                          alt="로컬 이미지"
                          className="w-20 h-20 object-contain rounded-lg bg-secondary/50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">로컬 이미지</p>
                      </div>
                    ) : selectedProduct && (selectedProduct.rembg_image_url || selectedProduct.image_url) && (
                      <div className="text-center">
                        <img
                          src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                          alt={selectedProduct.name}
                          className="w-20 h-20 object-contain rounded-lg bg-secondary/50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">제품</p>
                      </div>
                    )}
                    {selectedAvatar && selectedAvatar.image_url && (
                      <div className="text-center">
                        <img
                          src={selectedAvatar.image_url}
                          alt={selectedAvatar.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground mt-1">아바타</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{duration}초</span>
                    <span className="mx-2">·</span>
                    <Monitor className="w-4 h-4" />
                    <span>{resolution}</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Video className="w-12 h-12 mb-2 opacity-50" />
                  <p>제품 또는 아바타를 선택하세요</p>
                </div>
              )}
            </div>
          </div>

          {/* 진행 상황 표시 */}
          {isGenerating && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <h4 className="font-medium text-foreground">생성 진행 상황</h4>

              {/* 진행 단계 */}
              <div className="flex items-center justify-between gap-2">
                {/* Step 1 */}
                <div className={`flex-1 flex items-center gap-2 p-2 rounded-lg ${
                  generationPhase === 'prompts'
                    ? 'bg-primary/20 border border-primary/50'
                    : generationPhase === 'image' || generationPhase === 'video'
                      ? 'bg-green-500/20 border border-green-500/50'
                      : 'bg-secondary/30 border border-border'
                }`}>
                  {generationPhase === 'prompts' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  ) : generationPhase === 'image' || generationPhase === 'video' ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">대본</span>
                </div>

                <div className="text-muted-foreground text-xs">→</div>

                {/* Step 2 */}
                <div className={`flex-1 flex items-center gap-2 p-2 rounded-lg ${
                  generationPhase === 'image'
                    ? 'bg-primary/20 border border-primary/50'
                    : generationPhase === 'video'
                      ? 'bg-green-500/20 border border-green-500/50'
                      : 'bg-secondary/30 border border-border'
                }`}>
                  {generationPhase === 'image' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  ) : generationPhase === 'video' ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">첫 씬</span>
                </div>

                <div className="text-muted-foreground text-xs">→</div>

                {/* Step 3 */}
                <div className={`flex-1 flex items-center gap-2 p-2 rounded-lg ${
                  generationPhase === 'video'
                    ? 'bg-primary/20 border border-primary/50'
                    : 'bg-secondary/30 border border-border'
                }`}>
                  {generationPhase === 'video' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">영상</span>
                </div>
              </div>

              {/* 상태 메시지 */}
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-foreground">{generationStatus}</span>
                </div>
              </div>

              {/* 제품 요약 */}
              {productSummary && (
                <div className="p-3 bg-secondary/30 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">제품 분석 결과</p>
                  <p className="text-sm text-foreground">{productSummary}</p>
                </div>
              )}
            </div>
          )}

          {/* 생성 전 안내 */}
          {!isGenerating && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-3">영상 생성 안내</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  제품 정보를 바탕으로 AI가 광고 대본을 작성합니다
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  제품과 아바타가 함께 있는 첫 씬 이미지를 생성합니다
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  첫 씬 이미지를 바탕으로 영상을 생성합니다 (약 2-5분)
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Suspense로 감싸서 useSearchParams 사용 가능하게 함
export default function VideoAdCreatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <VideoAdCreateContent />
    </Suspense>
  )
}
