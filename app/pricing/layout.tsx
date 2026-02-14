import type { Metadata } from 'next'
import { getBreadcrumbJsonLd } from '@/lib/i18n/seo'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

export const metadata: Metadata = {
  title: '요금제 - AI 광고 제작 플랜',
  description: 'gwanggo 요금제 비교: Free(15크레딧), Starter(100크레딧), Pro(300크레딧), Business(1000크레딧). AI 광고 이미지·영상 생성, 아바타, 음악 제작. 무료로 시작하세요.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: '요금제 - AI 광고 제작 플랜 | gwanggo',
    description: 'AI 광고 이미지·영상 생성 요금제 비교. Free, Starter, Pro, Business 플랜 중 맞는 요금제를 선택하세요.',
    url: `${siteUrl}/pricing`,
    type: 'website',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumbJsonLd = getBreadcrumbJsonLd(siteUrl, [
    { name: '홈', url: siteUrl },
    { name: '요금제', url: `${siteUrl}/pricing` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  )
}
