'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ProductDescriptionWizard } from '@/components/video-ad/product-description-wizard'
import { AvatarMotionWizard } from '@/components/video-ad/avatar-motion'
import { ProductAdWizard } from '@/components/video-ad/product-ad/product-ad-wizard'
import { CinematicAdWizard } from '@/components/video-ad/cinematic-ad'

function VideoAdCreateContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get('category')
  const videoAdId = searchParams.get('videoAdId')

  // 온보딩에서 전달된 쿼리 파라미터
  const productId = searchParams.get('productId')
  const avatarType = searchParams.get('avatarType') as 'ai' | 'avatar' | 'outfit' | null
  const avatarId = searchParams.get('avatarId')
  const outfitId = searchParams.get('outfitId')
  const aiAvatarOptions = searchParams.get('aiAvatarOptions')
  const initialStep = parseInt(searchParams.get('step') || '1', 10)

  // 아바타 모션 영상
  if (category === 'avatarMotion') {
    return (
      <AvatarMotionWizard
        onBack={() => router.push('/dashboard/video-ad')}
        videoAdId={videoAdId || undefined}
      />
    )
  }

  // 제품 광고 영상
  if (category === 'productAd') {
    return (
      <ProductAdWizard
        videoAdId={videoAdId || undefined}
        initialProductId={productId}
        initialStep={initialStep}
      />
    )
  }

  // AI 시네마틱 광고 영상
  if (category === 'cinematicAd') {
    return (
      <CinematicAdWizard
        videoAdId={videoAdId || undefined}
        initialProductId={productId}
        initialStep={initialStep}
      />
    )
  }

  // 제품 설명 영상
  if (category === 'productDescription') {
    return (
      <ProductDescriptionWizard
        initialProductId={productId}
        initialAvatarType={avatarType}
        initialAvatarId={avatarId}
        initialOutfitId={outfitId}
        initialAiAvatarOptions={aiAvatarOptions}
        initialStep={initialStep}
      />
    )
  }

  // 기본값: 제품 설명 영상
  return <ProductDescriptionWizard />
}

export default function VideoAdCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <VideoAdCreateContent />
    </Suspense>
  )
}
