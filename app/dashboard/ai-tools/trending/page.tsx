import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function TrendingRedirectPage() {
  const cookieStore = await cookies()
  const lang = cookieStore.get('preferred-language')?.value || 'ko'
  redirect(`/dashboard/ai-tools/${lang}/trending`)
}
