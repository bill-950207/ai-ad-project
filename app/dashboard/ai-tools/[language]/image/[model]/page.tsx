import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ImageGenerator from '@/components/ai-tools/image-generator'

const validLanguages = ['ko', 'en', 'ja', 'zh'] as const
type Lang = (typeof validLanguages)[number]

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

const ogLocale: Record<Lang, string> = {
  ko: 'ko_KR', en: 'en_US', ja: 'ja_JP', zh: 'zh_CN',
}

const IMAGE_MODEL_SLUGS = [
  'seedream-5', 'flux-2-pro', 'grok-image', 'z-image', 'nano-banana-2',
] as const
type ModelSlug = (typeof IMAGE_MODEL_SLUGS)[number]

interface ModelMeta {
  name: string
  creator: string
  description: Record<Lang, string>
  title: Record<Lang, string>
  keywords: Record<Lang, string[]>
  jsonLdDescription: Record<Lang, string>
}

const MODELS: Record<ModelSlug, ModelMeta> = {
  'seedream-5': {
    name: 'Seedream 5',
    creator: 'ByteDance',
    description: {
      ko: 'ByteDance Seedream 5로 참조 이미지 기반 AI 이미지 편집. 기본/고화질 지원. 광고 배너에 최적화.',
      en: 'AI image editing with ByteDance Seedream 5 based on reference images. Basic/high quality. Optimized for ad banners.',
      ja: 'ByteDance Seedream 5で参照画像ベースのAI画像編集。基本/高画質対応。広告バナーに最適。',
      zh: '使用ByteDance Seedream 5基于参考图像进行AI图像编辑。支持基本/高质量。适用于广告横幅。',
    },
    title: {
      ko: 'Seedream 5 AI 이미지 생성 | gwanggo',
      en: 'Seedream 5 AI Image Generator | gwanggo',
      ja: 'Seedream 5 AI画像生成 | gwanggo',
      zh: 'Seedream 5 AI图像生成 | gwanggo',
    },
    keywords: {
      ko: ['Seedream 5', 'ByteDance', '바이트댄스', 'AI 이미지 생성', 'AI 이미지 편집', 'Midjourney 대안'],
      en: ['Seedream 5', 'ByteDance', 'AI image generator', 'AI image editing', 'Midjourney alternative'],
      ja: ['Seedream 5', 'ByteDance', 'バイトダンス', 'AI画像生成', 'AI画像編集', 'Midjourney代替'],
      zh: ['Seedream 5', 'ByteDance', '字节跳动', 'AI图像生成', 'AI图像编辑', 'Midjourney替代'],
    },
    jsonLdDescription: {
      ko: 'ByteDance가 개발한 AI 이미지 편집 모델. 참조 이미지 기반 편집, 기본/고화질 지원.',
      en: 'AI image editing model by ByteDance. Reference image-based editing with basic/high quality.',
      ja: 'ByteDanceが開発したAI画像編集モデル。参照画像ベースの編集、基本/高画質対応。',
      zh: 'ByteDance开发的AI图像编辑模型。基于参考图像编辑，支持基本/高质量。',
    },
  },
  'flux-2-pro': {
    name: 'FLUX.2 Pro',
    creator: 'Black Forest Labs',
    description: {
      ko: 'Black Forest Labs FLUX.2 Pro로 고품질 텍스트 투 이미지 생성. 기본/고화질, 5가지 비율 지원.',
      en: 'Generate high-quality text-to-image with Black Forest Labs FLUX.2 Pro. Basic/high quality, 5 aspect ratios.',
      ja: 'Black Forest Labs FLUX.2 Proで高品質なテキストから画像を生成。基本/高画質、5つの比率対応。',
      zh: '使用Black Forest Labs FLUX.2 Pro生成高质量文本转图像。基本/高质量，5种比例。',
    },
    title: {
      ko: 'FLUX.2 Pro AI 이미지 생성 | gwanggo',
      en: 'FLUX.2 Pro AI Image Generator | gwanggo',
      ja: 'FLUX.2 Pro AI画像生成 | gwanggo',
      zh: 'FLUX.2 Pro AI图像生成 | gwanggo',
    },
    keywords: {
      ko: ['FLUX.2 Pro', 'FLUX 2 Pro', 'Black Forest Labs', 'AI 이미지 생성', '텍스트 투 이미지'],
      en: ['FLUX.2 Pro', 'FLUX 2 Pro', 'Black Forest Labs', 'AI image generator', 'text to image'],
      ja: ['FLUX.2 Pro', 'FLUX 2 Pro', 'Black Forest Labs', 'AI画像生成', 'テキストから画像'],
      zh: ['FLUX.2 Pro', 'FLUX 2 Pro', 'Black Forest Labs', 'AI图像生成', '文本生成图像'],
    },
    jsonLdDescription: {
      ko: 'Black Forest Labs가 개발한 Text-to-Image AI 모델. 기본/고화질 옵션 지원.',
      en: 'Text-to-Image AI model by Black Forest Labs. Basic/high quality options.',
      ja: 'Black Forest Labsが開発したText-to-Image AIモデル。基本/高画質オプション対応。',
      zh: 'Black Forest Labs开发的Text-to-Image AI模型。支持基本/高质量选项。',
    },
  },
  'grok-image': {
    name: 'Grok Imagine Image',
    creator: 'xAI',
    description: {
      ko: 'xAI Grok Imagine Image로 빠른 AI 이미지 생성. 1크레딧으로 텍스트에서 이미지 생성.',
      en: 'Fast AI image generation with xAI Grok Imagine Image. Generate images from text for 1 credit.',
      ja: 'xAI Grok Imagine Imageで高速AI画像生成。1クレジットでテキストから画像を生成。',
      zh: '使用xAI Grok Imagine Image快速生成AI图像。1积分从文本生成图像。',
    },
    title: {
      ko: 'Grok Imagine Image AI 이미지 생성 | gwanggo',
      en: 'Grok Imagine Image AI Generator | gwanggo',
      ja: 'Grok Imagine Image AI画像生成 | gwanggo',
      zh: 'Grok Imagine Image AI图像生成 | gwanggo',
    },
    keywords: {
      ko: ['Grok Imagine Image', 'xAI', 'Grok 이미지', 'AI 이미지 생성'],
      en: ['Grok Imagine Image', 'xAI', 'Grok image', 'AI image generator'],
      ja: ['Grok Imagine Image', 'xAI', 'Grok画像', 'AI画像生成'],
      zh: ['Grok Imagine Image', 'xAI', 'Grok图片', 'AI图像生成'],
    },
    jsonLdDescription: {
      ko: 'xAI가 개발한 Text-to-Image AI 모델. 빠른 이미지 생성.',
      en: 'Text-to-Image AI model by xAI. Fast image generation.',
      ja: 'xAIが開発したText-to-Image AIモデル。高速な画像生成。',
      zh: 'xAI开发的Text-to-Image AI模型。快速图像生成。',
    },
  },
  'z-image': {
    name: 'Z-Image',
    creator: 'gwanggo',
    description: {
      ko: 'Z-Image로 텍스트에서 AI 이미지 생성. 프롬프트만으로 고품질 이미지 생성.',
      en: 'Generate AI images from text with Z-Image. High-quality images from prompts alone.',
      ja: 'Z-Imageでテキストから AI画像を生成。プロンプトのみで高品質画像を生成。',
      zh: '使用Z-Image从文本生成AI图像。仅通过提示词生成高质量图像。',
    },
    title: {
      ko: 'Z-Image AI 이미지 생성 | gwanggo',
      en: 'Z-Image AI Image Generator | gwanggo',
      ja: 'Z-Image AI画像生成 | gwanggo',
      zh: 'Z-Image AI图像生成 | gwanggo',
    },
    keywords: {
      ko: ['Z-Image', 'AI 이미지 생성', '텍스트 투 이미지'],
      en: ['Z-Image', 'AI image generator', 'text to image'],
      ja: ['Z-Image', 'AI画像生成', 'テキストから画像'],
      zh: ['Z-Image', 'AI图像生成', '文本生成图像'],
    },
    jsonLdDescription: {
      ko: '텍스트에서 이미지를 생성하는 AI 모델. 프롬프트만으로 고품질 이미지 생성.',
      en: 'Text-to-image AI model. High-quality images from prompts alone.',
      ja: 'テキストから画像を生成するAIモデル。プロンプトのみで高品質画像を生成。',
      zh: '文本生成图像的AI模型。仅通过提示词生成高质量图像。',
    },
  },
  'nano-banana-2': {
    name: 'Nano Banana 2',
    creator: 'Google',
    description: {
      ko: 'Google Gemini 기반 Nano Banana 2로 AI 이미지 생성. 1K~4K 고품질 이미지, 편집 모드 지원.',
      en: 'Generate AI images with Google Gemini-based Nano Banana 2. 1K-4K high-quality images with edit mode.',
      ja: 'Google GeminiベースのNano Banana 2でAI画像を生成。1K〜4K高品質画像、編集モード対応。',
      zh: '使用基于Google Gemini的Nano Banana 2生成AI图像。1K~4K高质量图像，支持编辑模式。',
    },
    title: {
      ko: 'Nano Banana 2 AI 이미지 생성 - Google Gemini | gwanggo',
      en: 'Nano Banana 2 AI Image Generator - Google Gemini | gwanggo',
      ja: 'Nano Banana 2 AI画像生成 - Google Gemini | gwanggo',
      zh: 'Nano Banana 2 AI图像生成 - Google Gemini | gwanggo',
    },
    keywords: {
      ko: ['Nano Banana 2', 'Google Gemini Image', 'AI 이미지 생성', '4K AI 이미지'],
      en: ['Nano Banana 2', 'Google Gemini Image', 'AI image generator', '4K AI image'],
      ja: ['Nano Banana 2', 'Google Gemini Image', 'AI画像生成', '4K AI画像'],
      zh: ['Nano Banana 2', 'Google Gemini Image', 'AI图像生成', '4K AI图像'],
    },
    jsonLdDescription: {
      ko: 'Google Gemini 기반 AI 이미지 생성 모델. 1K~4K 고품질 이미지 생성 지원.',
      en: 'Google Gemini-based AI image generation model. 1K-4K high-quality image generation.',
      ja: 'Google GeminiベースのAI画像生成モデル。1K〜4K高品質画像生成対応。',
      zh: '基于Google Gemini的AI图像生成模型。支持1K~4K高质量图像生成。',
    },
  },
}

const commonI18n: Record<Lang, {
  breadcrumbHome: string
  breadcrumbAiTools: string
  breadcrumbImage: string
}> = {
  ko: { breadcrumbHome: '홈', breadcrumbAiTools: 'AI 도구', breadcrumbImage: '이미지 생성' },
  en: { breadcrumbHome: 'Home', breadcrumbAiTools: 'AI Tools', breadcrumbImage: 'Image Generator' },
  ja: { breadcrumbHome: 'ホーム', breadcrumbAiTools: 'AIツール', breadcrumbImage: '画像生成' },
  zh: { breadcrumbHome: '首页', breadcrumbAiTools: 'AI工具', breadcrumbImage: '图像生成' },
}

interface Props {
  params: Promise<{ language: string; model: string }>
}

export async function generateStaticParams() {
  return validLanguages.flatMap((language) =>
    IMAGE_MODEL_SLUGS.map((model) => ({ language, model }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language, model } = await params

  if (!validLanguages.includes(language as Lang)) return {}
  if (!IMAGE_MODEL_SLUGS.includes(model as ModelSlug)) return {}

  const lang = language as Lang
  const slug = model as ModelSlug
  const m = MODELS[slug]

  const alternateLanguages: Record<string, string> = {}
  validLanguages.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/dashboard/ai-tools/${loc}/image/${slug}`
  })
  alternateLanguages['x-default'] = `${siteUrl}/dashboard/ai-tools/ko/image/${slug}`

  return {
    title: { absolute: m.title[lang] },
    description: m.description[lang],
    keywords: m.keywords[lang],
    alternates: {
      canonical: `/dashboard/ai-tools/${lang}/image/${slug}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[lang],
      alternateLocale: validLanguages.filter((l) => l !== lang).map((l) => ogLocale[l]),
      title: m.title[lang],
      description: m.description[lang],
      url: `${siteUrl}/dashboard/ai-tools/${lang}/image/${slug}`,
      siteName: 'gwanggo',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: m.name, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title[lang],
      description: m.description[lang],
      images: ['/og-image.png'],
      creator: '@gwanggo_io',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function ImageModelPage({ params }: Props) {
  const { language, model } = await params

  if (!validLanguages.includes(language as Lang)) notFound()
  if (!IMAGE_MODEL_SLUGS.includes(model as ModelSlug)) notFound()

  const lang = language as Lang
  const slug = model as ModelSlug
  const m = MODELS[slug]
  const common = commonI18n[lang]

  const jsonLdApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: m.name,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description: m.jsonLdDescription[lang],
    url: `${siteUrl}/dashboard/ai-tools/${lang}/image/${slug}`,
    creator: { '@type': 'Organization', name: m.creator },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: common.breadcrumbHome, item: `${siteUrl}/dashboard` },
      { '@type': 'ListItem', position: 2, name: common.breadcrumbAiTools },
      { '@type': 'ListItem', position: 3, name: common.breadcrumbImage, item: `${siteUrl}/dashboard/ai-tools/${lang}/image` },
      { '@type': 'ListItem', position: 4, name: m.name, item: `${siteUrl}/dashboard/ai-tools/${lang}/image/${slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />

      <div className="mb-4">
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li><Link href="/dashboard" className="hover:text-foreground transition-colors">{common.breadcrumbHome}</Link></li>
            <li>/</li>
            <li>{common.breadcrumbAiTools}</li>
            <li>/</li>
            <li><Link href={`/dashboard/ai-tools/${lang}/image`} className="hover:text-foreground transition-colors">{common.breadcrumbImage}</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">{m.name}</li>
          </ol>
        </nav>
        <div>
          <h1 className="text-xl font-bold">{m.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{m.description[lang]}</p>
        </div>
      </div>

      <ImageGenerator initialModel={slug} />
    </>
  )
}
