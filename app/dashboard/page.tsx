import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 서버에서 쇼케이스 데이터 미리 조회
  const [imageShowcases, videoShowcases] = await Promise.all([
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
    })
  ])

  // 썸네일 URL 배열로 변환 (랜덤 셔플)
  const imageUrls = imageShowcases
    .map(s => s.thumbnail_url)
    .sort(() => Math.random() - 0.5)

  const videoUrls = videoShowcases
    .filter(s => s.media_url)
    .map(s => s.media_url as string)
    .sort(() => Math.random() - 0.5)

  return (
    <DashboardContent
      userEmail={user?.email}
      initialImageShowcases={imageUrls}
      initialVideoShowcases={videoUrls}
    />
  )
}
