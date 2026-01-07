import { createClient } from '@/lib/supabase/server'
import { ProfileContent } from '@/components/dashboard/profile-content'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <ProfileContent user={user} />
}
