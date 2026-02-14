import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'gwanggo 개인정보처리방침. AI 광고 제작 플랫폼 gwanggo의 개인정보 수집·이용·보호 정책을 확인하세요.',
  alternates: {
    canonical: '/legal/privacy',
  },
  openGraph: {
    title: '개인정보처리방침 | gwanggo',
    url: `${siteUrl}/legal/privacy`,
    type: 'website',
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
