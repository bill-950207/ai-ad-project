import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/dashboard/ai-tools/'],
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/onboarding',
          '/verify-email',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
