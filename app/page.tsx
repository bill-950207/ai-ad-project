import { redirect } from 'next/navigation'
import { defaultLocale } from '@/lib/i18n/seo'

/**
 * 루트 페이지 - 기본 언어로 리다이렉트
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`)
}
