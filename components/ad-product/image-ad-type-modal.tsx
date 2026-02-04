/**
 * 이미지 광고 유형 선택 모달
 *
 * 7가지 광고 유형 중 하나를 선택합니다:
 * 1. 제품 단독, 2. 제품 홀딩, 3. 제품 사용, 4. 착용샷
 * 5. 라이프스타일, 6. 언박싱/리뷰, 7. 시즌/테마
 */

'use client'

import { useLanguage } from '@/contexts/language-context'
import { X, Hand, Sparkles, Shirt, Coffee, Package, Calendar, Box } from 'lucide-react'

export type ImageAdType =
  | 'productOnly'
  | 'holding'
  | 'using'
  | 'wearing'
  | 'lifestyle'
  | 'unboxing'
  | 'seasonal'

// 모델이 필요 없는 타입
export const PRODUCT_ONLY_TYPES: ImageAdType[] = ['productOnly']

// 모델이 필요한 타입
export const MODEL_REQUIRED_TYPES: ImageAdType[] = [
  'holding', 'using', 'wearing',
  'lifestyle', 'unboxing', 'seasonal'
]

interface ImageAdTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: ImageAdType) => void
}

const AD_TYPES: { type: ImageAdType; icon: typeof Hand }[] = [
  { type: 'productOnly', icon: Box },
  { type: 'holding', icon: Hand },
  { type: 'using', icon: Sparkles },
  { type: 'wearing', icon: Shirt },
  { type: 'lifestyle', icon: Coffee },
  { type: 'unboxing', icon: Package },
  { type: 'seasonal', icon: Calendar },
]

export function ImageAdTypeModal({ isOpen, onClose, onSelect }: ImageAdTypeModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  const getTypeTranslation = (type: ImageAdType) => {
    const types = t.imageAdTypes as unknown as Record<string, { title: string; description: string; examples: string }>
    return types[type] || { title: type, description: '', examples: '' }
  }

  return (
    <div
      className="fixed inset-0 z-50 !m-0 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {(t.imageAdTypes as { selectType: string }).selectType}
            </h2>
            <p className="text-sm text-muted-foreground">
              {(t.imageAdTypes as { selectTypeDesc: string }).selectTypeDesc}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 그리드 */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AD_TYPES.map(({ type, icon: Icon }) => {
              const translation = getTypeTranslation(type)
              return (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  className="flex flex-col items-center p-4 bg-secondary/30 border border-border rounded-xl hover:border-primary hover:bg-primary/10 transition-colors text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">
                    {translation.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {translation.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {translation.examples}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
