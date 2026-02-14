import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

export const metadata: Metadata = {
  title: '이용약관',
  description: 'gwanggo 서비스 이용약관. AI 광고 이미지·영상 생성 플랫폼 gwanggo의 이용 조건을 확인하세요.',
  alternates: {
    canonical: '/legal/terms',
  },
  openGraph: {
    title: '이용약관 | gwanggo',
    url: `${siteUrl}/legal/terms`,
    type: 'website',
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
