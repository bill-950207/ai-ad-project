'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  Package,
  User,
  Sparkles,
  ChevronDown,
  Check,
  Loader2,
  ArrowRight,
  Minus,
  Plus,
} from 'lucide-react'
import { AvatarSelectModal } from '@/components/video-ad/avatar-select-modal'
import { useAvatarMotionWizard, AdProduct } from './wizard-context'

export function WizardStep1() {
  const { t } = useLanguage()
  const {
    selectedProduct,
    setSelectedProduct,
    selectedAvatarInfo,
    setSelectedAvatarInfo,
    canProceedToStep2,
    goToNextStep,
    saveDraft,
    isSaving,
  } = useAvatarMotionWizard()

  // 로컬 상태
  const [products, setProducts] = useState<AdProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  // 제품 정보 편집 상태
  const [editableDescription, setEditableDescription] = useState('')
  const [editableSellingPoints, setEditableSellingPoints] = useState<string[]>([''])

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

  // 선택된 제품 정보 채우기
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

  // 다음 단계로 이동 (DB 저장 포함)
  const handleNext = async () => {
    if (!canProceedToStep2()) return

    // 편집된 제품 정보로 업데이트
    if (selectedProduct) {
      const updatedProduct = {
        ...selectedProduct,
        description: editableDescription || selectedProduct.description,
        selling_points: editableSellingPoints.filter(Boolean).length > 0
          ? editableSellingPoints.filter(Boolean)
          : selectedProduct.selling_points,
      }
      setSelectedProduct(updatedProduct)
    }

    // DB에 저장
    await saveDraft({ wizardStep: 2 })
    goToNextStep()
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
      {/* 설명 */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <h3 className="font-medium text-foreground mb-2">아바타 모션 영상이란?</h3>
        <p className="text-sm text-muted-foreground">
          모델이 영화를 촬영하듯 제품과 함께 연기하는 짧은 영상을 만듭니다.
          AI가 제품과 모델에 맞는 시나리오를 제안하고, 영화적인 첫 장면을 생성한 후 자연스러운 모션 영상으로 완성합니다.
        </p>
      </div>

      {/* 아바타 선택 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          <User className="w-4 h-4 inline mr-2" />
          아바타 선택
          <span className="text-red-500 ml-1">*</span>
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
                  <span className="text-xs text-primary">의상 교체</span>
                )}
                {selectedAvatarInfo.type === 'ai-generated' && (
                  <span className="text-xs text-purple-500">AI 자동 생성</span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">아바타를 선택하세요</span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* 제품 선택 (필수) */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          <Package className="w-4 h-4 inline mr-2" />
          제품 선택
          <span className="text-red-500 ml-1">*</span>
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
                <span className="text-muted-foreground">제품을 선택하세요</span>
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
                <p className="text-xs text-muted-foreground">제품 정보를 확인하고 편집하세요</p>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">제품 설명</label>
              <textarea
                value={editableDescription}
                onChange={(e) => setEditableDescription(e.target.value)}
                placeholder="제품에 대한 설명..."
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* 셀링 포인트 */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                셀링 포인트 <span className="text-muted-foreground/70">(예: &quot;24시간 보습&quot;, &quot;피부과 추천&quot;)</span>
              </label>
              <div className="space-y-2">
                {editableSellingPoints.map((point, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateSellingPoint(index, e.target.value)}
                      placeholder="제품의 장점이나 특징"
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
                    포인트 추가
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 다음 단계 버튼 */}
      <button
        onClick={handleNext}
        disabled={!canProceedToStep2() || isSaving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            저장 중...
          </>
        ) : (
          <>
            다음
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* 유효성 메시지 */}
      {!canProceedToStep2() && (
        <p className="text-center text-sm text-muted-foreground">
          {!selectedAvatarInfo && !selectedProduct
            ? '아바타와 제품을 선택해주세요'
            : !selectedAvatarInfo
            ? '아바타를 선택해주세요'
            : '제품을 선택해주세요'}
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
