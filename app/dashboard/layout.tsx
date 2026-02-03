import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/cached'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await getAuthenticatedUser()

  if (!authUser) {
    redirect('/login')
  }

  if (!authUser.isOnboarded) {
    redirect('/onboarding')
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
