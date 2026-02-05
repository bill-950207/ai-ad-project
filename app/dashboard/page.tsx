import { getCurrentUser } from '@/lib/auth/cached'
import { prisma } from '@/lib/db'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

// 이미지 광고 타입 순서 (표시 순서)
const IMAGE_AD_TYPES = [
  'productOnly',
  'holding',
  'using',
  'wearing',
  'lifestyle',
  'beforeAfter',
  'unboxing',
  'comparison',
  'seasonal'
]

// 영상 광고 타입 순서
const VIDEO_AD_TYPES = [
  'productDescription',
  'productAd'
]

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // 서버에서 쇼케이스 데이터 미리 조회 (카드 배경 + 카테고리별 갤러리)
  const [
    cardImageShowcases,
    cardVideoShowcases,
    allImageShowcases,
    allVideoShowcases
  ] = await Promise.all([
    // 카드 배경용 이미지
    prisma.ad_showcases.findMany({
      where: { is_active: true, type: 'image' },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { thumbnail_url: true }
    }),
    // 카드 배경용 영상
    prisma.ad_showcases.findMany({
      where: { is_active: true, type: 'video' },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: { media_url: true }
    }),
    // 갤러리용 이미지 (카테고리별 최대 10개씩)
    prisma.ad_showcases.findMany({
      where: { is_active: true, type: 'image' },
      orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        thumbnail_url: true,
        media_url: true,
        ad_type: true,
        category: true,
        product_image_url: true,
        avatar_image_url: true
      }
    }),
    // 갤러리용 영상 (카테고리별 최대 10개씩)
    prisma.ad_showcases.findMany({
      where: { is_active: true, type: 'video' },
      orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        thumbnail_url: true,
        media_url: true,
        ad_type: true,
        category: true,
        product_image_url: true,
        avatar_image_url: true
      }
    })
  ])

  // 카드 배경용 URL 배열 (랜덤 셔플)
  const imageUrls = cardImageShowcases
    .map(s => s.thumbnail_url)
    .sort(() => Math.random() - 0.5)

  const videoUrls = cardVideoShowcases
    .filter(s => s.media_url)
    .map(s => s.media_url as string)
    .sort(() => Math.random() - 0.5)

  // 이미지 쇼케이스를 ad_type별로 그룹화 (최대 10개씩)
  const imageCategories = IMAGE_AD_TYPES.map(adType => ({
    adType,
    items: allImageShowcases
      .filter(s => s.ad_type === adType)
      .slice(0, 10)
  })).filter(category => category.items.length > 0)

  // 영상 쇼케이스를 ad_type별로 그룹화 (최대 10개씩)
  const videoCategories = VIDEO_AD_TYPES.map(adType => ({
    adType,
    items: allVideoShowcases
      .filter(s => s.ad_type === adType)
      .slice(0, 10)
  })).filter(category => category.items.length > 0)

  return (
    <DashboardContent
      userEmail={user?.email}
      initialImageShowcases={imageUrls}
      initialVideoShowcases={videoUrls}
      imageCategories={imageCategories}
      videoCategories={videoCategories}
    />
  )
}
