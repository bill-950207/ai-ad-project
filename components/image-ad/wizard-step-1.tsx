'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  Package,
  User,
  Box,
  Hand,
  Sparkles,
  Shirt,
  ArrowLeftRight,
  Coffee,
  Scale,
  Calendar,
  ChevronDown,
  Check,
  Upload,
  X,
  Loader2,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'
import { ImageAdType, PRODUCT_ONLY_TYPES } from '@/components/ad-product/image-ad-type-modal'
import { AvatarSelectModal } from '@/components/video-ad/avatar-select-modal'
import { useImageAdWizard, AdProduct } from './wizard-context'

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

export function WizardStep1() {
  const { t } = useLanguage()
  const {
    adType,
    setAdType,
    selectedProduct,
    setSelectedProduct,
    localImageFile,
    localImageUrl,
    setLocalImage,
    selectedAvatarInfo,
    setSelectedAvatarInfo,
    canProceedToStep2,
    goToNextStep,
  } = useImageAdWizard()

  // 로컬 상태
  const [products, setProducts] = useState<AdProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isProductOnly = PRODUCT_ONLY_TYPES.includes(adType)
  const isWearingType = adType === 'wearing'

  // 제품 데이터 로드
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-products')
      if (res.ok) {
        const data = await res.json()
        const completedProducts = data.products.filter(
          (p: AdProduct & { status: string }) => p.status === 'COMPLETED'
        )
        setProducts(completedProducts)
      }
    } catch (error) {
      console.error('제품 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLocalImage(file, url)
      setSelectedProduct(null) // 로컬 이미지 선택 시 제품 선택 해제
    }
  }

  // 로컬 이미지 삭제
  const clearLocalImage = () => {
    if (localImageUrl) {
      URL.revokeObjectURL(localImageUrl)
    }
    setLocalImage(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 광고 유형 변경
  const handleAdTypeChange = (type: ImageAdType) => {
    setAdType(type)
    // 유형 변경 시 아바타/제품 선택 초기화 가능 여부 체크
    if (PRODUCT_ONLY_TYPES.includes(type)) {
      setSelectedAvatarInfo(null)
    }
  }

  // 번역
  const imageAdCreate = t.imageAdCreate as {
    title: string
    selectProduct: string
    selectAvatar: string
    noProductSelected: string
    noAvatarSelected: string
  }

  const types = t.imageAdTypes as unknown as Record<string, { title: string; description: string }>

  // 다음 단계 유효성 메시지
  const getValidationMessage = () => {
    if (isProductOnly) {
      if (!selectedProduct && !localImageFile) {
        return '제품을 선택하거나 이미지를 업로드해주세요'
      }
    } else if (isWearingType) {
      if (!selectedAvatarInfo) {
        return '아바타를 선택해주세요'
      }
    } else {
      if (!selectedProduct && !localImageFile) {
        return '제품을 선택하거나 이미지를 업로드해주세요'
      }
      if (!selectedAvatarInfo) {
        return '아바타를 선택해주세요'
      }
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 광고 유형 선택 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          광고 유형 선택
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {AD_TYPE_LIST.map(({ type, icon: Icon }) => {
            const title = types[type]?.title || type
            const isActive = adType === type
            return (
              <button
                key={type}
                onClick={() => handleAdTypeChange(type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-secondary/30'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">{title}</span>
              </button>
            )
          })}
        </div>
        {types[adType]?.description && (
          <p className="mt-4 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
            {types[adType].description}
          </p>
        )}
      </div>

      {/* 제품 선택 (착용샷에서는 선택사항) */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5" />
            {imageAdCreate.selectProduct}
            {isWearingType && (
              <span className="text-xs font-normal text-muted-foreground ml-2">(선택사항)</span>
            )}
          </h2>
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          {/* 제품 선택 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowProductDropdown(!showProductDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 border border-border rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {selectedProduct ? (
                  <>
                    <div className="w-10 h-10 bg-secondary rounded-lg overflow-hidden">
                      <img
                        src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                        alt={selectedProduct.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-medium text-foreground">{selectedProduct.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{imageAdCreate.noProductSelected}</span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProductDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
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
                        clearLocalImage()
                        setShowProductDropdown(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors ${
                        selectedProduct?.id === product.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="w-10 h-10 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.rembg_image_url || product.image_url || ''}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
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

          {/* 또는 구분선 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">또는</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 이미지 직접 업로드 */}
          {localImageUrl ? (
            <div className="relative">
              <div className="w-full aspect-video bg-secondary/30 rounded-xl overflow-hidden">
                <img
                  src={localImageUrl}
                  alt="업로드된 이미지"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={clearLocalImage}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-secondary/30 transition-colors"
            >
              <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">이미지 직접 업로드</p>
                <p className="text-xs text-muted-foreground mt-1">제품 이미지를 직접 업로드하세요</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 아바타 선택 (제품 단독 제외) */}
      {!isProductOnly && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <User className="w-5 h-5" />
            {imageAdCreate.selectAvatar}
          </h2>

          {selectedAvatarInfo ? (
            <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
              <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden">
                <img
                  src={selectedAvatarInfo.imageUrl}
                  alt={selectedAvatarInfo.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{selectedAvatarInfo.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAvatarInfo.type === 'ai-generated' ? 'AI 생성 아바타' : '기본 아바타'}
                </p>
              </div>
              <button
                onClick={() => setShowAvatarModal(true)}
                className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                변경
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAvatarModal(true)}
              className="w-full flex items-center justify-center gap-3 py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-secondary/30 transition-colors"
            >
              <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">아바타 선택하기</p>
                <p className="text-xs text-muted-foreground mt-1">광고에 등장할 모델을 선택하세요</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* 다음 단계 버튼 */}
      <div className="flex justify-end pt-4">
        <button
          onClick={goToNextStep}
          disabled={!canProceedToStep2()}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            canProceedToStep2()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          다음 단계
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 유효성 메시지 */}
      {getValidationMessage() && (
        <p className="text-center text-sm text-muted-foreground">
          {getValidationMessage()}
        </p>
      )}

      {/* 아바타 선택 모달 */}
      <AvatarSelectModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSelect={(info) => {
          setSelectedAvatarInfo(info)
          setShowAvatarModal(false)
        }}
        selectedAvatarId={selectedAvatarInfo?.avatarId}
        selectedOutfitId={selectedAvatarInfo?.outfitId}
        selectedType={selectedAvatarInfo?.type}
      />
    </div>
  )
}
