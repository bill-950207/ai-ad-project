import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'
import { prisma } from '@/lib/db'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 프로필 확인 및 온보딩 상태 체크
  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { is_onboarded: true },
    })

    // 프로필이 없거나 온보딩이 완료되지 않은 경우
    if (!profile || !profile.is_onboarded) {
      redirect('/onboarding')
    }
  } catch (error) {
    console.error('Profile check error:', error)
    // 오류 발생 시에도 대시보드 접근 허용 (graceful degradation)
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
