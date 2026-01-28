'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ImageAdType } from '@/components/ad-product/image-ad-type-modal'
import { ImageAdWizard } from '@/components/image-ad/image-ad-wizard'

function ImageAdCreateContent() {
  const searchParams = useSearchParams()
  // adType 또는 type 파라미터 지원 (온보딩에서는 adType 사용)
  const initialAdType = (searchParams.get('adType') || searchParams.get('type')) as ImageAdType || 'productOnly'
  const initialStep = parseInt(searchParams.get('step') || '1', 10)

  // 온보딩에서 전달된 쿼리 파라미터
  const productId = searchParams.get('productId')
  const avatarType = searchParams.get('avatarType') as 'ai' | 'avatar' | 'outfit' | null
  const avatarId = searchParams.get('avatarId')
  const outfitId = searchParams.get('outfitId')
  const aiAvatarOptions = searchParams.get('aiAvatarOptions')

  return (
    <ImageAdWizard
      initialAdType={initialAdType}
      initialStep={initialStep}
      initialProductId={productId}
      initialAvatarType={avatarType}
      initialAvatarId={avatarId}
      initialOutfitId={outfitId}
      initialAiAvatarOptions={aiAvatarOptions}
    />
  )
}

export default function ImageAdCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ImageAdCreateContent />
    </Suspense>
  )
}
