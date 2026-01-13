/**
 * 이미지 광고 생성 페이지
 *
 * 왼쪽: 사이드바 (제품/아바타 선택, 프롬프트 입력, 옵션)
 * 오른쪽: 결과 미리보기 (생성 전: 예시 이미지 슬라이드, 생성 후: 결과 이미지)
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  ChevronDown,
  Check,
  Package,
  User,
  Image as ImageIcon,
  Box,
  Hand,
  Shirt,
  ArrowLeftRight,
  Coffee,
  Scale,
  Calendar,
  X,
  Upload,
} from 'lucide-react'
import { ImageAdType, PRODUCT_ONLY_TYPES } from '@/components/ad-product/image-ad-type-modal'
import { CATEGORY_OPTIONS, buildPromptFromOptions, getDefaultOptions } from '@/lib/image-ad/category-options'
import { AvatarSelectModal, SelectedAvatarInfo } from '@/components/video-ad/avatar-select-modal'

// 카테고리 목록 (아이콘 포함)
const AD_TYPE_LIST: { type: ImageAdType; icon: typeof Box }[] = [
  { type: 'productOnly', icon: Box },
  { type: 'holding', icon: Hand },
  { type: 'using', icon: Sparkles },
  { type: 'wearing', icon: Shirt },
  { type: 'beforeAfter', icon: ArrowLeftRight },
  { type: 'lifestyle', icon: Coffee },
  { type: 'unboxing', icon: Package },
  { type: 'comparison', icon: Scale },
  { type: 'seasonal', icon: Calendar },
]

// ============================================================
// 타입 정의
// ============================================================

interface AdProduct {
  id: string
  name: string
  rembg_image_url: string | null
  image_url: string | null
}


// 카테고리별 예시 이미지 (실제로는 R2나 public에서 로드)
const EXAMPLE_IMAGES: Record<ImageAdType, string[]> = {
  productOnly: [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
  ],
  holding: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
  ],
  using: [
    'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400',
  ],
  wearing: [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
  ],
  beforeAfter: [
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
  ],
  lifestyle: [
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
  ],
  unboxing: [
    'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400',
  ],
  comparison: [
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
  ],
  seasonal: [
    'https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=400',
  ],
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function ImageAdCreatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()

  const adType = (searchParams.get('type') as ImageAdType) || 'productOnly'
  const isProductOnly = PRODUCT_ONLY_TYPES.includes(adType)

  // 파일 입력 ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 상태
  const [products, setProducts] = useState<AdProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<AdProduct | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImages, setResultImages] = useState<string[]>([])
  const [recentAds, setRecentAds] = useState<{ id: string; image_url: string; created_at: string }[]>([])
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  // 로컬 이미지 파일 상태
  const [localImageFile, setLocalImageFile] = useState<File | null>(null)
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null)

  // 퀄리티 및 생성 개수 상태
  type Quality = 'medium' | 'high'
  const [quality, setQuality] = useState<Quality>('medium')
  const [numImages, setNumImages] = useState(2)
  const [showQualityDropdown, setShowQualityDropdown] = useState(false)

  // 드롭다운 상태
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // 아바타 선택 모달 상태
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [selectedAvatarInfo, setSelectedAvatarInfo] = useState<SelectedAvatarInfo | null>(null)

  const isWearingType = adType === 'wearing'

  // 예시 이미지 슬라이드
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const exampleImages = EXAMPLE_IMAGES[adType] || []

  // 카테고리별 구조화된 옵션 상태
  const [categoryOptions, setCategoryOptions] = useState<Record<string, string>>(() =>
    getDefaultOptions(adType)
  )

  // 추가 프롬프트 (자유 입력)
  const [additionalPrompt, setAdditionalPrompt] = useState('')

  // 이미지 비율 상태
  type AspectRatio = '1:1' | '16:9' | '9:16'
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')

  // 비율에 따른 이미지 사이즈 매핑
  const getImageSize = (ratio: AspectRatio): '1024x1024' | '1536x1024' | '1024x1536' => {
    switch (ratio) {
      case '1:1': return '1024x1024'
      case '16:9': return '1536x1024'
      case '9:16': return '1024x1536'
    }
  }

  // 비율별 aspect-ratio CSS
  const getAspectClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '1:1': return 'aspect-square'
      case '16:9': return 'aspect-[16/9]'
      case '9:16': return 'aspect-[9/16]'
    }
  }

  // 데이터 로드
  const fetchData = useCallback(async () => {
    try {
      const productsRes = await fetch('/api/ad-products')

      if (productsRes.ok) {
        const data = await productsRes.json()
        const completedProducts = data.products.filter(
          (p: AdProduct & { status: string }) => p.status === 'COMPLETED'
        )
        setProducts(completedProducts)
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 선택된 제품의 최근 광고 로드
  const fetchRecentAds = useCallback(async (productId: string) => {
    try {
      const res = await fetch(`/api/image-ads?productId=${productId}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setRecentAds(data.ads || [])
      }
    } catch (error) {
      console.error('최근 광고 로드 오류:', error)
    }
  }, [])


  useEffect(() => {
    fetchData()
  }, [fetchData])

  // adType 변경 시 카테고리 옵션 초기화
  useEffect(() => {
    setCategoryOptions(getDefaultOptions(adType))
    setAdditionalPrompt('')
  }, [adType])

  // 선택된 제품이 변경되면 최근 광고 로드
  useEffect(() => {
    if (selectedProduct) {
      fetchRecentAds(selectedProduct.id)
    } else {
      setRecentAds([])
    }
  }, [selectedProduct, fetchRecentAds])

  // 예시 이미지 자동 슬라이드
  useEffect(() => {
    if (resultImages.length > 0 || exampleImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % exampleImages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [resultImages.length, exampleImages.length])

  // 프로그레스바 업데이트 (Seedream: 60초 기준)
  useEffect(() => {
    if (!isGenerating || !generationStartTime) return

    const TOTAL_DURATION = 60 * 1000 // 60초 (Seedream 기준)
    const MAX_PROGRESS = 99 // 최대 99%까지만

    const interval = setInterval(() => {
      const elapsed = Date.now() - generationStartTime
      const progress = Math.min((elapsed / TOTAL_DURATION) * 100, MAX_PROGRESS)
      setGenerationProgress(progress)
    }, 100)

    return () => clearInterval(interval)
  }, [isGenerating, generationStartTime])

  // 크레딧 계산
  const calculateCredits = () => {
    const creditPerImage = quality === 'medium' ? 1 : 2
    return creditPerImage * numImages
  }

  // 광고 유형 제목
  const getAdTypeTitle = () => {
    const types = t.imageAdTypes as unknown as Record<string, { title: string }>
    return types[adType]?.title || adType
  }

  // 아바타 선택 핸들러 (모달에서 호출)
  const handleAvatarSelect = (avatar: SelectedAvatarInfo) => {
    setSelectedAvatarInfo(avatar)
    setShowAvatarModal(false)
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
    // 착용샷: 아바타(의상 포함) 필수 (제품 불필요)
    if (isWearingType) {
      return !!selectedAvatarInfo
    }
    // 제품 단독: 제품 또는 로컬 이미지 필수
    if (isProductOnly) {
      return !!selectedProduct || !!localImageFile
    }
    // 나머지: (제품 또는 로컬 이미지) + 아바타 필수
    return (!!selectedProduct || !!localImageFile) && !!selectedAvatarInfo
  }

  // 생성 핸들러
  const handleGenerate = async () => {
    if (!canGenerate()) return

    setIsGenerating(true)
    setResultImages([])
    setGenerationStartTime(Date.now())
    setGenerationProgress(0)

    try {
      // 구조화된 옵션으로 프롬프트 생성
      const generatedPrompt = buildPromptFromOptions(adType, categoryOptions, additionalPrompt)

      // API 요청 데이터 구성
      const requestBody = {
        adType,
        productId: isWearingType ? undefined : selectedProduct?.id,
        avatarIds: selectedAvatarInfo ? [selectedAvatarInfo.avatarId] : [],
        outfitId: selectedAvatarInfo?.outfitId,
        prompt: generatedPrompt,
        imageSize: getImageSize(aspectRatio),
        quality,
        numImages,
      }

      // 이미지 광고 생성 요청
      const createRes = await fetch('/api/image-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!createRes.ok) {
        const error = await createRes.json()
        throw new Error(error.error || '생성 요청 실패')
      }

      const { requestId } = await createRes.json()

      // 폴링으로 결과 대기
      const pollInterval = 1000
      const maxAttempts = 90 // 최대 3분
      let attempts = 0

      const pollStatus = async (): Promise<string[]> => {
        const statusRes = await fetch(`/api/image-ads/status/${requestId}`)
        if (!statusRes.ok) {
          throw new Error('상태 확인 실패')
        }

        const status = await statusRes.json()

        if (status.status === 'COMPLETED') {
          return status.imageUrls || [status.imageUrl]
        } else if (status.status === 'FAILED') {
          throw new Error(status.error || '생성 실패')
        }

        // 아직 진행 중
        attempts++
        if (attempts >= maxAttempts) {
          throw new Error('생성 시간 초과')
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
        return pollStatus()
      }

      const imageUrls = await pollStatus()
      setResultImages(imageUrls)
    } catch (error) {
      console.error('생성 오류:', error)
      alert(error instanceof Error ? error.message : '생성 중 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  const imageAdCreate = t.imageAdCreate as {
    title: string
    selectProduct: string
    selectAvatar: string
    prompt: string
    generate: string
    generating: string
    result: string
    exampleImages: string
    noProductSelected: string
    noAvatarSelected: string
    creditsRequired: string
    aspectRatio?: string
    aspectRatios?: Record<string, string>
    quality?: string
    qualityOptions?: {
      medium: { label: string; description: string }
      high: { label: string; description: string }
    }
    numImages?: string
    recentAds?: string
    additionalPrompt?: string
    additionalPromptPlaceholder?: string
    options: {
      background: string
      lighting: string
      mood: string
      angle: string
      backgrounds: Record<string, string>
      lightings: Record<string, string>
      moods: Record<string, string>
      angles: Record<string, string>
    }
    categoryOptions?: {
      groups: Record<string, string>
      options: Record<string, string>
    }
  }

  // 비율 옵션 (번역이 없을 경우 기본값)
  const ratioOptions: Record<AspectRatio, string> = {
    '1:1': imageAdCreate.aspectRatios?.['1:1'] || '1:1 (정사각형)',
    '16:9': imageAdCreate.aspectRatios?.['16:9'] || '16:9 (가로형)',
    '9:16': imageAdCreate.aspectRatios?.['9:16'] || '9:16 (세로형)',
  }

  // 퀄리티 옵션 (번역이 없을 경우 기본값)
  const qualityOptions: Record<Quality, { label: string; description: string }> = {
    medium: {
      label: imageAdCreate.qualityOptions?.medium.label || '보통',
      description: imageAdCreate.qualityOptions?.medium.description || '더 빠르게 생성돼요',
    },
    high: {
      label: imageAdCreate.qualityOptions?.high.label || '높음',
      description: imageAdCreate.qualityOptions?.high.description || '더 높은 퀄리티로 나와요',
    },
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
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/image-ad"
          className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {imageAdCreate.title} - {getAdTypeTitle()}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* 왼쪽: 사이드바 */}
        <div className="space-y-4">
          {/* 카테고리 탭 */}
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {AD_TYPE_LIST.map(({ type, icon: Icon }) => {
                const types = t.imageAdTypes as unknown as Record<string, { title: string }>
                const title = types[type]?.title || type
                const isActive = adType === type
                return (
                  <button
                    key={type}
                    onClick={() => router.push(`/dashboard/image-ad/create?type=${type}`)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 제품 선택 (착용샷 제외) */}
          {!isWearingType && (
            <div className="bg-card border border-border rounded-xl p-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                <Package className="w-4 h-4 inline mr-2" />
                {imageAdCreate.selectProduct}
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
                        alt="로컬 이미지"
                        className="w-8 h-8 object-contain rounded"
                      />
                      <span className="text-foreground">{localImageFile?.name || '로컬 이미지'}</span>
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
                    <span className="text-muted-foreground">{imageAdCreate.noProductSelected}</span>
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
          )}

          {/* 아바타 선택 (모델 필요 타입만) */}
          {!isProductOnly && (
            <div className="bg-card border border-border rounded-xl p-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-2" />
                {imageAdCreate.selectAvatar}
                {isWearingType && (
                  <span className="text-xs text-muted-foreground ml-2">(의상 선택 가능)</span>
                )}
              </label>

              <button
                onClick={() => setShowAvatarModal(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
              >
                {selectedAvatarInfo ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedAvatarInfo.imageUrl}
                      alt={selectedAvatarInfo.displayName}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <div>
                      <span className="text-foreground block">{selectedAvatarInfo.displayName}</span>
                      {selectedAvatarInfo.type === 'outfit' && (
                        <span className="text-xs text-primary">의상 교체</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">{imageAdCreate.noAvatarSelected}</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* 아바타 선택 모달 */}
          <AvatarSelectModal
            isOpen={showAvatarModal}
            onClose={() => setShowAvatarModal(false)}
            onSelect={handleAvatarSelect}
            selectedAvatarId={selectedAvatarInfo?.avatarId}
            selectedOutfitId={selectedAvatarInfo?.outfitId}
          />

          {/* 카테고리별 구조화된 옵션 */}
          {CATEGORY_OPTIONS[adType] && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              {CATEGORY_OPTIONS[adType].groups.map((group) => {
                const groupLabel = (imageAdCreate.categoryOptions as {
                  groups: Record<string, string>
                  options: Record<string, string>
                })?.groups?.[group.key] || group.labelKey

                return (
                  <div key={group.key}>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {groupLabel}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const optionLabel = (imageAdCreate.categoryOptions as {
                          groups: Record<string, string>
                          options: Record<string, string>
                        })?.options?.[option.labelKey] || option.labelKey

                        const isSelected = categoryOptions[group.key] === option.key

                        return (
                          <button
                            key={option.key}
                            onClick={() =>
                              setCategoryOptions((prev) => ({
                                ...prev,
                                [group.key]: option.key,
                              }))
                            }
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            {optionLabel}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 추가 프롬프트 (선택) */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              {(imageAdCreate as { additionalPrompt?: string }).additionalPrompt || '추가 설명 (선택)'}
            </label>
            <textarea
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder={(imageAdCreate as { additionalPromptPlaceholder?: string }).additionalPromptPlaceholder || '원하는 스타일이나 분위기를 자유롭게 설명해주세요...'}
              rows={3}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* 이미지 비율 선택 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              {imageAdCreate.aspectRatio || '이미지 비율'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ratioOptions) as [AspectRatio, string][]).map(([ratio, label]) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                    aspectRatio === ratio
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div
                    className={`border-2 ${
                      aspectRatio === ratio ? 'border-primary' : 'border-muted-foreground'
                    } ${
                      ratio === '1:1'
                        ? 'w-8 h-8'
                        : ratio === '16:9'
                          ? 'w-10 h-6'
                          : 'w-6 h-10'
                    } rounded`}
                  />
                  <span
                    className={`text-xs ${
                      aspectRatio === ratio ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 퀄리티 및 생성 개수 */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {/* 퀄리티 선택 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {imageAdCreate.quality || '퀄리티'}
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowQualityDropdown(!showQualityDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
                >
                  <div>
                    <span className="text-foreground">{qualityOptions[quality].label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({quality === 'medium' ? '1' : '2'} 크레딧/장)
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>

                {showQualityDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                    {(Object.entries(qualityOptions) as [Quality, { label: string; description: string }][]).map(([key, opt]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setQuality(key)
                          setShowQualityDropdown(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                      >
                        <div>
                          <span className="text-foreground">{opt.label}</span>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                        {quality === key && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 생성 개수 선택 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {imageAdCreate.numImages || '생성 개수'}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumImages(num)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      numImages === num
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {num}장
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 생성 버튼 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{imageAdCreate.creditsRequired}</span>
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
                  {imageAdCreate.generating}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {imageAdCreate.generate}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 오른쪽: 결과 미리보기 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground">
              {resultImages.length > 0 ? imageAdCreate.result : imageAdCreate.exampleImages}
            </h3>
          </div>

          <div className="flex-1 relative bg-secondary/30 overflow-y-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <p className="text-muted-foreground">{imageAdCreate.generating}</p>

                {/* 프로그레스바 */}
                <div className="w-full max-w-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">{Math.floor(generationProgress)}%</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-out relative"
                      style={{ width: `${generationProgress}%` }}
                    >
                      {/* 99%에서 멈춰있을 때 애니메이션 */}
                      {generationProgress >= 99 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      )}
                    </div>
                  </div>
                  {generationProgress >= 99 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">거의 완료되었습니다. 잠시만 기다려주세요...</p>
                  )}
                </div>
              </div>
            ) : resultImages.length > 0 ? (
              <div className="p-4 space-y-6">
                {/* 결과 이미지 그리드 */}
                <div className={`grid gap-4 ${
                  resultImages.length === 1
                    ? 'grid-cols-1'
                    : resultImages.length === 2
                      ? 'grid-cols-2'
                      : resultImages.length <= 4
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                }`}>
                  {resultImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative bg-secondary/50 rounded-lg overflow-hidden group cursor-pointer"
                    >
                      <img
                        src={img}
                        alt={`Generated ${index + 1}`}
                        className={`w-full object-contain ${getAspectClass(aspectRatio)}`}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                        >
                          원본 보기
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 최근 생성된 광고 섹션 */}
                {recentAds.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      {imageAdCreate.recentAds || '최근 생성된 광고'}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {recentAds.slice(0, 8).map((ad) => (
                        <div
                          key={ad.id}
                          className="relative bg-secondary/50 rounded-lg overflow-hidden aspect-square"
                        >
                          <img
                            src={ad.image_url}
                            alt="Recent ad"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : exampleImages.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {exampleImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Example ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                      index === currentExampleIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}

                {/* 슬라이드 인디케이터 */}
                {exampleImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {exampleImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentExampleIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentExampleIndex ? 'bg-primary' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-2" />
                <p>예시 이미지가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
