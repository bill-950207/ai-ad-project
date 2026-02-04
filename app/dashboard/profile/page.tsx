import { getCurrentUser } from '@/lib/auth/cached'
import { ProfileContent } from '@/components/dashboard/profile-content'
import { prisma } from '@/lib/db'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  // DB에서 프로필 이름 조회
  let profileName: string | null = null
  if (user?.id) {
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { name: true }
    })
    profileName = profile?.name ?? null
  }

  return <ProfileContent user={user} profileName={profileName} />
}
