import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import VideoGenerator from '@/components/ai-tools/video-generator'

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
    title: 'AI 영상 생성 도구 - Seedance 1.5 Pro & Vidu Q3 | gwanggo',
    description: 'Seedance 1.5 Pro(ByteDance)와 Vidu Q3(Shengshu Technology)로 고품질 AI 영상을 생성하세요. 텍스트/이미지 입력으로 최대 1080p, 16초 영상 생성. 광고, 숏폼, 제품 영상에 최적화.',
    keywords: ['AI 영상 생성', 'Seedance 1.5 Pro', 'Vidu Q3', '텍스트 투 비디오', '이미지 투 비디오', 'AI 동영상 만들기', '광고 영상 생성', 'ByteDance', 'Shengshu Technology', '바이트댄스', 'AI 비디오'],
    ogTitle: 'AI 영상 생성 도구 - Seedance 1.5 Pro & Vidu Q3',
    ogDescription: 'ByteDance Seedance 1.5 Pro와 Shengshu Vidu Q3로 텍스트/이미지에서 고품질 AI 영상을 생성하세요.',
  },
  en: {
    title: 'AI Video Generator - Seedance 1.5 Pro & Vidu Q3 | gwanggo',
    description: 'Create high-quality AI videos with Seedance 1.5 Pro (ByteDance) and Vidu Q3 (Shengshu Technology). Generate up to 1080p, 16-second videos from text or images. Optimized for ads, shorts, and product videos.',
    keywords: ['AI video generator', 'Seedance 1.5 Pro', 'Vidu Q3', 'text to video', 'image to video', 'AI video maker', 'ad video generation', 'ByteDance', 'Shengshu Technology', 'AI video creator'],
    ogTitle: 'AI Video Generator - Seedance 1.5 Pro & Vidu Q3',
    ogDescription: 'Generate high-quality AI videos from text or images with ByteDance Seedance 1.5 Pro and Shengshu Vidu Q3.',
  },
  ja: {
    title: 'AI動画生成ツール - Seedance 1.5 Pro & Vidu Q3 | gwanggo',
    description: 'Seedance 1.5 Pro（ByteDance）とVidu Q3（Shengshu Technology）で高品質AI動画を生成。テキスト/画像入力で最大1080p、16秒の動画を作成。広告、ショート動画、商品動画に最適。',
    keywords: ['AI動画生成', 'Seedance 1.5 Pro', 'Vidu Q3', 'テキストから動画', '画像から動画', 'AI動画メーカー', '広告動画生成', 'ByteDance', 'Shengshu Technology', 'バイトダンス'],
    ogTitle: 'AI動画生成ツール - Seedance 1.5 Pro & Vidu Q3',
    ogDescription: 'ByteDance Seedance 1.5 ProとShengshu Vidu Q3でテキスト/画像から高品質AI動画を生成。',
  },
  zh: {
    title: 'AI视频生成工具 - Seedance 1.5 Pro & Vidu Q3 | gwanggo',
    description: '使用Seedance 1.5 Pro（ByteDance/字节跳动）和Vidu Q3（生数科技）生成高质量AI视频。通过文本/图像输入生成最高1080p、16秒视频。适用于广告、短视频、产品视频。',
    keywords: ['AI视频生成', 'Seedance 1.5 Pro', 'Vidu Q3', '文本生成视频', '图像生成视频', 'AI视频制作', '广告视频生成', 'ByteDance', '字节跳动', '生数科技', 'Shengshu Technology'],
    ogTitle: 'AI视频生成工具 - Seedance 1.5 Pro & Vidu Q3',
    ogDescription: '使用ByteDance Seedance 1.5 Pro和生数科技Vidu Q3从文本/图像生成高质量AI视频。',
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
      url: `${siteUrl}/dashboard/ai-tools/${lang}/video`,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@type': 'Organization', name: 'gwanggo', url: siteUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Seedance 1.5 Pro',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: 'Text/Image to Video AI model, up to 720p, 12 seconds',
      creator: { '@type': 'Organization', name: 'ByteDance' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Vidu Q3',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: 'Image to Video AI model, up to 1080p, 16 seconds',
      creator: { '@type': 'Organization', name: 'Shengshu Technology' },
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
    alternateLanguages[langCode] = `${siteUrl}/dashboard/ai-tools/${loc}/video`
  })
  alternateLanguages['x-default'] = `${siteUrl}/dashboard/ai-tools/ko/video`

  return {
    title: { absolute: data.title },
    description: data.description,
    keywords: data.keywords,
    alternates: {
      canonical: `/dashboard/ai-tools/${lang}/video`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      title: data.ogTitle,
      description: data.ogDescription,
      url: `${siteUrl}/dashboard/ai-tools/${lang}/video`,
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

export default async function VideoToolPage({ params }: Props) {
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
      <VideoGenerator />
    </>
  )
}
