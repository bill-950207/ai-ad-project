import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export default async function FullscreenLayout({
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

    if (!profile || !profile.is_onboarded) {
      redirect('/onboarding')
    }
  } catch (error) {
    console.error('프로필 확인 오류:', error)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      {children}
    </div>
  )
}
