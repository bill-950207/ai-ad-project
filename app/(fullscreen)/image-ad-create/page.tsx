'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ImageAdType } from '@/components/ad-product/image-ad-type-modal'
import { ImageAdWizard } from '@/components/image-ad/image-ad-wizard'

function ImageAdCreateContent() {
  const searchParams = useSearchParams()
  const initialAdType = (searchParams.get('type') as ImageAdType) || 'productOnly'

  return <ImageAdWizard initialAdType={initialAdType} />
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
