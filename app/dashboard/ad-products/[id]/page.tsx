import { AdProductDetail } from '@/components/ad-product/ad-product-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdProductDetailPage({ params }: PageProps) {
  const { id } = await params
  return <AdProductDetail productId={id} />
}
