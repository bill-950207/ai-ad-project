import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ImageGenerator from '@/components/ai-tools/image-generator'

const validLanguages = ['ko', 'en', 'ja', 'zh'] as const
type Lang = (typeof validLanguages)[number]

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

const i18n: Record<Lang, {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
}> = {
  ko: {
    title: 'AI 이미지 생성 도구 - Seedream 4.5 & Z-Image | gwanggo',
    description: 'Seedream 4.5(ByteDance)와 Z-Image로 고품질 AI 이미지를 생성하세요. 이미지 편집, 텍스트 투 이미지 지원. 광고 배너, 제품 이미지, SNS 콘텐츠에 최적화.',
    keywords: ['AI 이미지 생성', 'Seedream 4.5', 'Z-Image', '텍스트 투 이미지', 'AI 이미지 편집', 'AI 그림 생성', '광고 이미지 생성', 'ByteDance', '바이트댄스', 'AI 이미지 메이커'],
    ogTitle: 'AI 이미지 생성 도구 - Seedream 4.5 & Z-Image',
    ogDescription: 'ByteDance Seedream 4.5와 Z-Image로 텍스트/참조 이미지에서 고품질 AI 이미지를 생성하세요.',
  },
  en: {
    title: 'AI Image Generator - Seedream 4.5 & Z-Image | gwanggo',
    description: 'Create high-quality AI images with Seedream 4.5 (ByteDance) and Z-Image. Image editing and text-to-image generation. Optimized for ad banners, product images, and social media content.',
    keywords: ['AI image generator', 'Seedream 4.5', 'Z-Image', 'text to image', 'AI image editing', 'AI image maker', 'ad image generation', 'ByteDance', 'AI art generator', 'product image AI'],
    ogTitle: 'AI Image Generator - Seedream 4.5 & Z-Image',
    ogDescription: 'Generate high-quality AI images from text or reference images with ByteDance Seedream 4.5 and Z-Image.',
  },
  ja: {
    title: 'AI画像生成ツール - Seedream 4.5 & Z-Image | gwanggo',
    description: 'Seedream 4.5（ByteDance）とZ-Imageで高品質AI画像を生成。画像編集、テキストから画像生成に対応。広告バナー、商品画像、SNSコンテンツに最適。',
    keywords: ['AI画像生成', 'Seedream 4.5', 'Z-Image', 'テキストから画像', 'AI画像編集', 'AI画像メーカー', '広告画像生成', 'ByteDance', 'バイトダンス', 'AI画像クリエイター'],
    ogTitle: 'AI画像生成ツール - Seedream 4.5 & Z-Image',
    ogDescription: 'ByteDance Seedream 4.5とZ-Imageでテキスト/参照画像から高品質AI画像を生成。',
  },
  zh: {
    title: 'AI图像生成工具 - Seedream 4.5 & Z-Image | gwanggo',
    description: '使用Seedream 4.5（ByteDance/字节跳动）和Z-Image生成高质量AI图像。支持图像编辑和文本生成图像。适用于广告横幅、产品图片、社交媒体内容。',
    keywords: ['AI图像生成', 'Seedream 4.5', 'Z-Image', '文本生成图像', 'AI图像编辑', 'AI图像制作', '广告图像生成', 'ByteDance', '字节跳动', 'AI图片生成器'],
    ogTitle: 'AI图像生成工具 - Seedream 4.5 & Z-Image',
    ogDescription: '使用ByteDance Seedream 4.5和Z-Image从文本/参考图像生成高质量AI图像。',
  },
}

function getJsonLd(lang: Lang) {
  const data = i18n[lang]
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: data.ogTitle,
      description: data.description,
      url: `${siteUrl}/dashboard/ai-tools/${lang}/image`,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@type': 'Organization', name: 'gwanggo', url: siteUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Seedream 4.5',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      description: 'AI image editing model with reference image support',
      creator: { '@type': 'Organization', name: 'ByteDance' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Z-Image',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      description: 'Text-to-image AI generation model',
    },
  ]
}

interface Props {
  params: Promise<{ language: string }>
}

export async function generateStaticParams() {
  return validLanguages.map((language) => ({ language }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language } = await params

  if (!validLanguages.includes(language as Lang)) {
    return {}
  }

  const lang = language as Lang
  const data = i18n[lang]

  const alternateLanguages: Record<string, string> = {}
  validLanguages.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/dashboard/ai-tools/${loc}/image`
  })
  alternateLanguages['x-default'] = `${siteUrl}/dashboard/ai-tools/ko/image`

  return {
    title: { absolute: data.title },
    description: data.description,
    keywords: data.keywords,
    alternates: {
      canonical: `/dashboard/ai-tools/${lang}/image`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      title: data.ogTitle,
      description: data.ogDescription,
      url: `${siteUrl}/dashboard/ai-tools/${lang}/image`,
      siteName: 'gwanggo',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: data.ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.ogTitle,
      description: data.ogDescription,
      images: ['/og-image.png'],
    },
    robots: { index: true, follow: true },
  }
}

export default async function ImageToolPage({ params }: Props) {
  const { language } = await params

  if (!validLanguages.includes(language as Lang)) {
    notFound()
  }

  const lang = language as Lang
  const jsonLd = getJsonLd(lang)

  return (
    <>
      {jsonLd.map((item, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <ImageGenerator />
    </>
  )
}
