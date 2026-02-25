import { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n/seo'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date()

  // 언어별 대체 URL 생성 헬퍼 (x-default 포함)
  const getLanguageAlternates = (path: string = '') => {
    const languages: Record<string, string> = {}
    locales.forEach((locale) => {
      const langCode = locale === 'ko' ? 'ko-KR' : locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'zh-CN'
      languages[langCode] = `${siteUrl}/${locale}${path}`
    })
    languages['x-default'] = `${siteUrl}/ko${path}`
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

  // AI 도구 페이지 (다국어)
  const toolPaths = ['/tools/video', '/tools/image']
  const toolPages: MetadataRoute.Sitemap = toolPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: {
        languages: getLanguageAlternates(path),
      },
    }))
  )

  // 대시보드 AI 도구 페이지 (다국어)
  const getDashboardToolAlternates = (tool: string) => {
    const languages: Record<string, string> = {}
    locales.forEach((locale) => {
      const langCode = locale === 'ko' ? 'ko-KR' : locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'zh-CN'
      languages[langCode] = `${siteUrl}/dashboard/ai-tools/${locale}/${tool}`
    })
    languages['x-default'] = `${siteUrl}/dashboard/ai-tools/ko/${tool}`
    return languages
  }

  const dashboardToolTypes = ['video', 'image']
  const dashboardToolPages: MetadataRoute.Sitemap = dashboardToolTypes.flatMap((tool) =>
    locales.map((locale) => ({
      url: `${siteUrl}/dashboard/ai-tools/${locale}/${tool}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: {
        languages: getDashboardToolAlternates(tool),
      },
    }))
  )

  // 기타 페이지 (언어 독립적 - locale 라우트가 없으므로 alternates 미포함)
  const otherPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
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

  return [...landingPages, ...toolPages, ...dashboardToolPages, ...otherPages]
}
