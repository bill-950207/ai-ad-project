'use client'

import { useState, useEffect } from 'react'
import { Package, ArrowRight, Loader2, Plus, Check, ChevronDown, Minus } from 'lucide-react'
import { useProductAdWizard, AdProduct } from './wizard-context'
import { ProductCreateModal } from '../product-create-modal'

export function WizardStep1() {
  const {
    draftId,
    selectedProduct,
    setSelectedProduct,
    editableDescription,
    setEditableDescription,
    editableSellingPoints,
    setEditableSellingPoints,
    addSellingPoint,
    removeSellingPoint,
    updateSellingPoint,
    canProceedToStep2,
    goToNextStep,
    saveDraftAsync,
  } = useProductAdWizard()

  const [products, setProducts] = useState<AdProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showProductCreateModal, setShowProductCreateModal] = useState(false)

  // 제품 목록 불러오기
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/ad-products')
        if (res.ok) {
          const data = await res.json()
          // COMPLETED 상태인 제품만 필터링
          const completedProducts = data.products?.filter(
            (p: AdProduct & { status: string }) => p.status === 'COMPLETED'
          ) || []
          setProducts(completedProducts)
        }
      } catch (error) {
        console.error('제품 목록 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // 제품 선택 시 편집 가능한 필드 초기화
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
  }, [selectedProduct, setEditableDescription, setEditableSellingPoints])

  // 제품 선택
  const handleSelectProduct = (product: AdProduct | null) => {
    setSelectedProduct(product)
    setShowProductDropdown(false)
  }

  // 새 제품 생성 완료 시 처리
  const handleProductCreated = (newProduct: AdProduct) => {
    // 목록에 새 제품 추가 및 자동 선택
    setProducts(prev => [newProduct, ...prev])
    setSelectedProduct(newProduct)
    setShowProductCreateModal(false)
  }

  // 다음 단계로
  const handleNext = () => {
    if (!canProceedToStep2()) return
    // 먼저 다음 단계로 이동 후 백그라운드에서 저장
    goToNextStep()
    // draftId가 없으면 새로 생성 (기존 DRAFT 덮어쓰기 방지)
    saveDraftAsync({ wizardStep: 2, forceNew: !draftId })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">광고할 제품 선택</h2>
        <p className="text-muted-foreground mt-2">
          영상 광고로 만들 제품을 선택하고 정보를 확인해주세요
        </p>
      </div>

      {/* 제품 선택 드롭다운 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          <Package className="w-4 h-4 inline mr-2" />
          제품 선택
        </label>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowProductDropdown(!showProductDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
            >
              {selectedProduct ? (
                <div className="flex items-center gap-3">
                  {(selectedProduct.rembg_image_url || selectedProduct.image_url) && (
                    <img
                      src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                      alt={selectedProduct.name}
                      className="w-10 h-10 object-contain rounded bg-secondary/30"
                    />
                  )}
                  <span className="text-foreground font-medium">{selectedProduct.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">제품을 선택하세요</span>
              )}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProductDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground text-sm mb-3">등록된 제품이 없습니다</p>
                    <button
                      onClick={() => {
                        setShowProductDropdown(false)
                        setShowProductCreateModal(true)
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      제품 등록하기
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
                      <span className="font-medium">새 제품 등록</span>
                    </button>
                    {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                    >
                      {(product.rembg_image_url || product.image_url) && (
                        <img
                          src={product.rembg_image_url || product.image_url || ''}
                          alt={product.name}
                          className="w-10 h-10 object-contain rounded bg-secondary/30"
                        />
                      )}
                      <span className="text-foreground flex-1 text-left">{product.name}</span>
                      {selectedProduct?.id === product.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

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
                rows={3}
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

      {/* 네비게이션 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!canProceedToStep2()}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 안내 메시지 */}
      {!canProceedToStep2() && (
        <p className="text-center text-sm text-muted-foreground">
          제품을 선택해주세요
        </p>
      )}

      {/* 제품 등록 모달 */}
      <ProductCreateModal
        isOpen={showProductCreateModal}
        onClose={() => setShowProductCreateModal(false)}
        onProductCreated={handleProductCreated}
      />
    </div>
  )
}
