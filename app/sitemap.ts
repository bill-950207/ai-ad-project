import { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n/seo'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.io'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date()

  // 언어별 대체 URL 생성 헬퍼
  const getLanguageAlternates = (path: string = '') => {
    const languages: Record<string, string> = {}
    locales.forEach((locale) => {
      const langCode = locale === 'ko' ? 'ko-KR' : locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'zh-CN'
      languages[langCode] = `${siteUrl}/${locale}${path}`
    })
    return languages
  }

  // 다국어 랜딩페이지
  const landingPages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1,
    alternates: {
      languages: getLanguageAlternates(),
    },
  }))

  // 기타 페이지 (언어 독립적)
  const otherPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/legal/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  return [...landingPages, ...otherPages]
}
