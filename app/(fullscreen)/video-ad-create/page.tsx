'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ProductDescriptionWizard } from '@/components/video-ad/product-description-wizard'
import { AvatarMotionWizard } from '@/components/video-ad/avatar-motion'

function VideoAdCreateContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get('category')

  // 아바타 모션 영상
  if (category === 'avatarMotion') {
    return <AvatarMotionWizard onBack={() => router.push('/dashboard/video-ad')} />
  }

  // 제품 설명 영상
  if (category === 'productDescription') {
    return <ProductDescriptionWizard />
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
