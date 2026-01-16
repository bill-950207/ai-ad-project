'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ProductDescriptionWizard } from '@/components/video-ad/product-description-wizard'

function VideoAdCreateContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')

  // 현재는 productDescription만 지원
  if (category === 'productDescription') {
    return <ProductDescriptionWizard />
  }

  // 다른 카테고리는 추후 추가
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
