import { ImageAdDetail } from '@/components/image-ad/image-ad-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ImageAdDetailPage({ params }: PageProps) {
  const { id } = await params
  return <ImageAdDetail imageAdId={id} />
}
