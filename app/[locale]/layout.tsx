import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  locales,
  isValidLocale,
  seoData,
  ogLocale,
  getJsonLd,
  getFaqJsonLd,
  getBreadcrumbJsonLd,
  type Locale,
} from '@/lib/i18n/seo'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  if (!isValidLocale(locale)) {
    notFound()
  }

  const data = seoData[locale]
  const alternateLanguages: Record<string, string> = {}

  locales.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/${loc}`
  })
  alternateLanguages['x-default'] = `${siteUrl}/ko`

  return {
    title: {
      default: data.title,
      template: data.titleTemplate,
    },
    description: data.description,
    keywords: data.keywords,
    authors: [{ name: 'gwanggo', url: siteUrl }],
    creator: 'gwanggo',
    publisher: 'gwanggo',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      url: `${siteUrl}/${locale}`,
      title: data.ogTitle,
      description: data.ogDescription,
      siteName: 'gwanggo',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: data.ogTitle,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.twitterTitle,
      description: data.twitterDescription,
      images: ['/og-image.png'],
      creator: '@gwanggo_io',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    category: 'technology',
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!isValidLocale(locale)) {
    notFound()
  }

  const validLocale = locale as Locale
  const jsonLd = getJsonLd(validLocale, siteUrl)
  const faqJsonLd = getFaqJsonLd(validLocale)
  const localeName = locale === 'ko' ? '홈' : locale === 'ja' ? 'ホーム' : locale === 'zh' ? '首页' : 'Home'
  const breadcrumbJsonLd = getBreadcrumbJsonLd(siteUrl, [
    { name: localeName, url: `${siteUrl}/${locale}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  )
}
