'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  Package,
  User,
  Box,
  Hand,
  Sparkles,
  Shirt,
  Coffee,
  Calendar,
  ChevronDown,
  Check,
  Loader2,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react'
import { ImageAdType, PRODUCT_ONLY_TYPES } from '@/components/ad-product/image-ad-type-modal'
import { AvatarSelectModal } from '@/components/video-ad/avatar-select-modal'
import { ProductCreateModal } from '@/components/video-ad/product-create-modal'
import { useImageAdWizard, AdProduct } from './wizard-context'

// 카테고리 목록 (아이콘 포함)
const AD_TYPE_LIST: { type: ImageAdType; icon: typeof Box }[] = [
  { type: 'productOnly', icon: Box },
  { type: 'holding', icon: Hand },
  { type: 'using', icon: Sparkles },
  { type: 'wearing', icon: Shirt },
  { type: 'lifestyle', icon: Coffee },
  { type: 'unboxing', icon: Package },
  { type: 'seasonal', icon: Calendar },
]

export function WizardStep1() {
  const { t } = useLanguage()
  const {
    adType,
    setAdType,
    selectedProduct,
    setSelectedProduct,
    selectedAvatarInfo,
    setSelectedAvatarInfo,
    productUsageMethod,
    setProductUsageMethod,
    canProceedToStep2,
    goToNextStep,
  } = useImageAdWizard()

  // 로컬 상태
  const [products, setProducts] = useState<AdProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showProductCreateModal, setShowProductCreateModal] = useState(false)

  // 제품 정보 편집 상태
  const [editableDescription, setEditableDescription] = useState('')
  const [editableSellingPoints, setEditableSellingPoints] = useState<string[]>([''])

  const isProductOnly = PRODUCT_ONLY_TYPES.includes(adType)
  const isWearingType = adType === 'wearing'
  const isSeasonalType = adType === 'seasonal'
  const isUsingType = adType === 'using'
  // 아바타 섹션을 숨길 유형 (제품만 단독 촬영)
  const hideAvatarSection = isProductOnly
  // 아바타가 선택사항인 유형 (seasonal)
  const isAvatarOptional = isSeasonalType

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
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // 제품 선택 시 편집 가능한 필드 채우기
  useEffect(() => {
    if (selectedProduct) {
      setEditableDescription(selectedProduct.description || '')
      setEditableSellingPoints(
        selectedProduct.selling_points && selectedProduct.selling_points.length > 0
          ? selectedProduct.selling_points
          : ['']
      )
    } else {
      setEditableDescription('')
      setEditableSellingPoints([''])
    }
  }, [selectedProduct])

  // 셀링 포인트 관리 함수
  const addSellingPoint = () => {
    if (editableSellingPoints.length < 10) {
      setEditableSellingPoints([...editableSellingPoints, ''])
    }
  }

  const removeSellingPoint = (index: number) => {
    if (editableSellingPoints.length > 1) {
      setEditableSellingPoints(editableSellingPoints.filter((_, i) => i !== index))
    }
  }

  const updateSellingPoint = (index: number, value: string) => {
    const updated = [...editableSellingPoints]
    updated[index] = value
    setEditableSellingPoints(updated)
  }

  // 새 제품 생성 완료 시 처리
  const handleProductCreated = (newProduct: AdProduct) => {
    setProducts(prev => [newProduct, ...prev])
    setSelectedProduct(newProduct)
    setShowProductCreateModal(false)
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

  // imageAd.wizard 번역
  const imageAdT = t.imageAd as {
    wizard?: {
      selectAdType?: string
      optional?: string
      changeOutfit?: string
      aiGenerated?: string
      selectAvatar?: string
      noProducts?: string
      registerProduct?: string
      newProduct?: string
      productInfo?: string
      productDescription?: string
      productDescPlaceholder?: string
      sellingPoints?: string
      sellingPointsPlaceholder?: string
      addPoint?: string
      usageMethod?: string
      usageMethodLabel?: string
      usageMethodPlaceholder?: string
      nextStep?: string
      prevStep?: string
    }
    validation?: {
      selectProduct?: string
      selectAvatar?: string
      enterUsageMethod?: string
    }
  } | undefined
  const wizardT = imageAdT?.wizard
  const validationT = imageAdT?.validation

  // 다음 단계 유효성 메시지
  const getValidationMessage = () => {
    const selectProduct = validationT?.selectProduct || 'Please select a product'
    const selectAvatar = validationT?.selectAvatar || 'Please select an avatar'
    const enterUsageMethod = validationT?.enterUsageMethod || 'Please enter product usage method'

    // productOnly: 제품만 필수
    if (isProductOnly) {
      if (!selectedProduct) {
        return selectProduct
      }
    }
    // seasonal: 제품 필수, 아바타 선택사항
    else if (isSeasonalType) {
      if (!selectedProduct) {
        return selectProduct
      }
    }
    // wearing: 제품 + 아바타 모두 필수
    else if (isWearingType) {
      if (!selectedProduct) {
        return selectProduct
      }
      if (!selectedAvatarInfo) {
        return selectAvatar
      }
    }
    // using: 제품 + 아바타 + 사용 방법 필수
    else if (isUsingType) {
      if (!selectedProduct) {
        return selectProduct
      }
      if (!selectedAvatarInfo) {
        return selectAvatar
      }
      if (!productUsageMethod.trim()) {
        return enterUsageMethod
      }
    }
    // 그 외: 제품 + 아바타 모두 필수
    else {
      if (!selectedProduct) {
        return selectProduct
      }
      if (!selectedAvatarInfo) {
        return selectAvatar
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 광고 유형 선택 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="block text-sm font-medium text-foreground mb-3">
          {wizardT?.selectAdType || 'Select Ad Type'} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {AD_TYPE_LIST.map(({ type, icon: Icon }) => {
            const title = types[type]?.title || type
            const isActive = adType === type
            return (
              <button
                key={type}
                onClick={() => handleAdTypeChange(type)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium text-center">{title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 아바타 선택 (제품 단독 제외) */}
      {!hideAvatarSection && (
        <div className="bg-card border border-border rounded-xl p-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            <User className="w-4 h-4 inline mr-2" />
            {imageAdCreate.selectAvatar}
            {isAvatarOptional ? (
              <span className="text-muted-foreground ml-1 text-xs">{wizardT?.optional || '(Optional)'}</span>
            ) : (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <button
            onClick={() => setShowAvatarModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
          >
            {selectedAvatarInfo ? (
              <div className="flex items-center gap-3">
                {selectedAvatarInfo.type === 'ai-generated' ? (
                  <div className="w-10 h-14 rounded bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <img
                    src={selectedAvatarInfo.imageUrl}
                    alt={selectedAvatarInfo.displayName}
                    className="w-10 h-14 object-cover rounded"
                  />
                )}
                <div>
                  <span className="text-foreground block">{selectedAvatarInfo.displayName}</span>
                  {selectedAvatarInfo.type === 'outfit' && (
                    <span className="text-xs text-primary">{wizardT?.changeOutfit || 'Change Outfit'}</span>
                  )}
                  {selectedAvatarInfo.type === 'ai-generated' && (
                    <span className="text-xs text-purple-500">{wizardT?.aiGenerated || 'AI Generated'}</span>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">{wizardT?.selectAvatar || 'Select avatar'}</span>
            )}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* 제품 선택 (착용샷에서는 선택사항) */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          <Package className="w-4 h-4 inline mr-2" />
          {imageAdCreate.selectProduct}
          {isWearingType ? (
            <span className="text-muted-foreground text-xs ml-1">{wizardT?.optional || '(Optional)'}</span>
          ) : (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        <div className="relative">
          <button
            onClick={() => setShowProductDropdown(!showProductDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
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
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground text-sm mb-3">{wizardT?.noProducts || 'No products registered'}</p>
                    <button
                      onClick={() => {
                        setShowProductDropdown(false)
                        setShowProductCreateModal(true)
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {wizardT?.registerProduct || 'Register Product'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 새 제품 추가 버튼 */}
                    <button
                      onClick={() => {
                        setShowProductDropdown(false)
                        setShowProductCreateModal(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border text-primary"
                    >
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{wizardT?.newProduct || 'New Product'}</span>
                    </button>
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product)
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
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 선택된 제품 정보 편집 */}
          {selectedProduct && (
            <div className="mt-4 p-4 bg-secondary/30 rounded-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">{selectedProduct.name}</h4>
                  <p className="text-xs text-muted-foreground">{wizardT?.productInfo || 'Check and edit product information'}</p>
                </div>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{wizardT?.productDescription || 'Product Description'}</label>
                <textarea
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  placeholder={wizardT?.productDescPlaceholder || 'Describe your product...'}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* 셀링 포인트 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {wizardT?.sellingPoints || 'Selling Points'}
                </label>
                <div className="space-y-2">
                  {editableSellingPoints.map((point, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updateSellingPoint(index, e.target.value)}
                        placeholder={wizardT?.sellingPointsPlaceholder || 'Product advantages or features'}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      {editableSellingPoints.length > 1 && (
                        <button
                          onClick={() => removeSellingPoint(index)}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {editableSellingPoints.length < 10 && (
                    <button
                      onClick={addSellingPoint}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {wizardT?.addPoint || 'Add Point'}
                    </button>
                  )}
                </div>
              </div>

              {/* 제품 사용 방법 (using 타입 전용) */}
              {isUsingType && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {wizardT?.usageMethod || 'Usage Method'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productUsageMethod}
                    onChange={(e) => setProductUsageMethod(e.target.value)}
                    placeholder={wizardT?.usageMethodPlaceholder || 'Enter how the product is used in the scene'}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}
            </div>
          )}
      </div>

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
          {wizardT?.nextStep || 'Next Step'}
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

      {/* 제품 등록 모달 */}
      <ProductCreateModal
        isOpen={showProductCreateModal}
        onClose={() => setShowProductCreateModal(false)}
        onProductCreated={handleProductCreated}
      />
    </div>
  )
}
