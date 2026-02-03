import { getCurrentUser } from '@/lib/auth/cached'
import { ProfileContent } from '@/components/dashboard/profile-content'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  return <ProfileContent user={user} />
}
