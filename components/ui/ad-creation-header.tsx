/**
 * 광고 생성 페이지 공통 헤더 컴포넌트
 *
 * 이미지/영상 광고 생성 페이지에서 공통으로 사용하는 헤더입니다.
 * - 좌측: 뒤로가기 버튼 + 타이틀 + 설명
 * - 우측: 선택된 제품/아바타 썸네일
 */

'use client'

import { ArrowLeft, Package, User, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface SelectedProduct {
  name: string
  imageUrl: string | null
}

interface SelectedAvatar {
  name: string
  imageUrl: string | null
  isAiGenerated?: boolean
}

interface AdCreationHeaderProps {
  /** 뒤로가기 링크 URL */
  backHref: string
  /** 페이지 타이틀 */
  title: string
  /** 타이틀 아래 설명 (선택) */
  description?: string
  /** 선택된 제품 정보 (선택) */
  selectedProduct?: SelectedProduct | null
  /** 선택된 아바타 정보 (선택) */
  selectedAvatar?: SelectedAvatar | null
  /** sticky 여부 (기본값: false) */
  sticky?: boolean
  /** 추가 우측 콘텐츠 (선택) */
  rightContent?: React.ReactNode
}

export function AdCreationHeader({
  backHref,
  title,
  description,
  selectedProduct,
  selectedAvatar,
  sticky = false,
  rightContent,
}: AdCreationHeaderProps) {
  const hasSelectedItems = selectedProduct || selectedAvatar

  return (
    <div
      className={`${
        sticky
          ? 'sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border'
          : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* 좌측: 뒤로가기 + 타이틀 */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backHref}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>

        {/* 우측: 선택된 제품/아바타 또는 커스텀 콘텐츠 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {rightContent}

          {hasSelectedItems && (
            <div className="flex items-center gap-3">
              {/* 선택된 제품 */}
              {selectedProduct && (
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0 border border-border">
                    {selectedProduct.imageUrl ? (
                      <Image
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        fill
                        className="object-contain p-0.5"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">제품</p>
                    <p className="text-sm font-medium text-foreground truncate max-w-[80px]">
                      {selectedProduct.name}
                    </p>
                  </div>
                </div>
              )}

              {/* 구분선 */}
              {selectedProduct && selectedAvatar && (
                <div className="h-8 w-px bg-border hidden sm:block" />
              )}

              {/* 선택된 아바타 */}
              {selectedAvatar && (
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0 border border-border">
                    {selectedAvatar.isAiGenerated ? (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    ) : selectedAvatar.imageUrl ? (
                      <Image
                        src={selectedAvatar.imageUrl}
                        alt={selectedAvatar.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">아바타</p>
                    <p className="text-sm font-medium text-foreground truncate max-w-[80px]">
                      {selectedAvatar.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
