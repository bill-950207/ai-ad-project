import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

// 쇼케이스 갤러리 초기 로드 개수
const GALLERY_ITEMS_PER_PAGE = 16

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 서버에서 쇼케이스 데이터 미리 조회 (카드 배경 + 갤러리)
  const itemsPerType = Math.ceil(GALLERY_ITEMS_PER_PAGE / 2)

  const [
    cardImageShowcases,
    cardVideoShowcases,
    galleryImages,
    galleryVideos,
    galleryImageCount,
    galleryVideoCount
  ] = await Promise.all([
    // 카드 배경용
    prisma.ad_showcases.findMany({
      where: { is_active: true, type: 'image' },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { thumbnail_url: true }
    }),
    prisma.ad_showcases.findMany({
      where: { is_active: true, type: 'video' },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: { media_url: true }
    }),
    // 갤러리용 (인터리브)
    prisma.ad_showcases.findMany({
      where: { is_active: true, type: 'image' },
      orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
      take: itemsPerType,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        thumbnail_url: true,
        media_url: true,
        ad_type: true,
        category: true
      }
    }),
    prisma.ad_showcases.findMany({
      where: { is_active: true, type: 'video' },
      orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
      take: itemsPerType,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        thumbnail_url: true,
        media_url: true,
        ad_type: true,
        category: true
      }
    }),
    prisma.ad_showcases.count({ where: { is_active: true, type: 'image' } }),
    prisma.ad_showcases.count({ where: { is_active: true, type: 'video' } })
  ])

  // 카드 배경용 URL 배열 (랜덤 셔플)
  const imageUrls = cardImageShowcases
    .map(s => s.thumbnail_url)
    .sort(() => Math.random() - 0.5)

  const videoUrls = cardVideoShowcases
    .filter(s => s.media_url)
    .map(s => s.media_url as string)
    .sort(() => Math.random() - 0.5)

  // 갤러리용 인터리브 (이미지, 영상, 이미지, 영상...)
  const galleryShowcases: typeof galleryImages = []
  const maxLen = Math.max(galleryImages.length, galleryVideos.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < galleryImages.length) galleryShowcases.push(galleryImages[i])
    if (i < galleryVideos.length) galleryShowcases.push(galleryVideos[i])
  }

  return (
    <DashboardContent
      userEmail={user?.email}
      initialImageShowcases={imageUrls}
      initialVideoShowcases={videoUrls}
      initialGalleryShowcases={galleryShowcases}
      initialGalleryMeta={{
        imageCount: galleryImageCount,
        videoCount: galleryVideoCount,
        nextImageOffset: galleryImages.length,
        nextVideoOffset: galleryVideos.length
      }}
    />
  )
}
