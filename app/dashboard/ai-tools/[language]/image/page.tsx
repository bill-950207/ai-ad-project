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

const i18n: Record<Lang, {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  h1: string
  subtitle: string
  breadcrumbHome: string
  breadcrumbAiTools: string
  breadcrumbImage: string
  learnMore: string
  faq: { q: string; a: string }[]
  jsonLdDescriptions: {
    webApp: string
    seedream: string
    zimage: string
  }
}> = {
  ko: {
    title: 'AI 이미지 생성 도구 - Seedream 5 & Z-Image | gwanggo',
    description: 'Seedream 5(ByteDance)와 Z-Image로 고품질 AI 이미지를 생성하세요. 이미지 편집, 텍스트 투 이미지 지원. 광고 배너, 제품 이미지, SNS 콘텐츠에 최적화.',
    keywords: ['AI 이미지 생성', 'Seedream 5', 'Z-Image', '텍스트 투 이미지', 'AI 이미지 편집', 'AI 그림 생성', '광고 이미지 생성', 'ByteDance', '바이트댄스', 'AI 이미지 메이커'],
    ogTitle: 'AI 이미지 생성 도구 - Seedream 5 & Z-Image',
    ogDescription: 'ByteDance Seedream 5와 Z-Image로 텍스트/참조 이미지에서 고품질 AI 이미지를 생성하세요.',
    h1: 'AI 이미지 생성',
    subtitle: 'Seedream 5와 Z-Image로 텍스트 또는 참조 이미지에서 고품질 이미지를 생성하세요.',
    breadcrumbHome: '홈',
    breadcrumbAiTools: 'AI 도구',
    breadcrumbImage: '이미지 생성',
    learnMore: '자세히 알아보기',
    faq: [
      { q: 'Seedream 5와 Z-Image의 차이점은 무엇인가요?', a: 'Seedream 5는 ByteDance가 개발한 이미지 편집 모델로 참조 이미지가 필요합니다. 기본/고화질 옵션과 다양한 비율을 지원합니다. Z-Image는 텍스트만으로 이미지를 생성하는 모델로, 참조 이미지 없이 프롬프트만으로 이미지를 생성합니다.' },
      { q: 'AI 이미지 생성에 크레딧이 얼마나 필요한가요?', a: 'Seedream 5는 기본 화질 2크레딧, 고화질 3크레딧입니다. Z-Image는 1크레딧입니다.' },
      { q: '생성된 이미지를 상업적으로 사용할 수 있나요?', a: '네, gwanggo에서 생성된 모든 AI 이미지는 광고 배너, SNS 콘텐츠, 제품 소개 등 상업적 목적으로 자유롭게 사용할 수 있습니다.' },
    ],
    jsonLdDescriptions: {
      webApp: 'Seedream 5와 Z-Image를 사용한 AI 이미지 생성 도구. 텍스트/참조 이미지에서 고품질 이미지를 생성합니다.',
      seedream: 'ByteDance가 개발한 AI 이미지 편집 모델. 참조 이미지 기반 편집, 기본/고화질 지원.',
      zimage: '텍스트에서 이미지를 생성하는 AI 모델. 프롬프트만으로 고품질 이미지 생성.',
    },
  },
  en: {
    title: 'AI Image Generator - Seedream 5 & Z-Image | gwanggo',
    description: 'Create high-quality AI images with Seedream 5 (ByteDance) and Z-Image. Image editing and text-to-image generation. Optimized for ad banners, product images, and social media content.',
    keywords: ['AI image generator', 'Seedream 5', 'Z-Image', 'text to image', 'AI image editing', 'AI image maker', 'ad image generation', 'ByteDance', 'AI art generator', 'product image AI'],
    ogTitle: 'AI Image Generator - Seedream 5 & Z-Image',
    ogDescription: 'Generate high-quality AI images from text or reference images with ByteDance Seedream 5 and Z-Image.',
    h1: 'AI Image Generator',
    subtitle: 'Create high-quality images from text or reference images with Seedream 5 and Z-Image.',
    breadcrumbHome: 'Home',
    breadcrumbAiTools: 'AI Tools',
    breadcrumbImage: 'Image Generator',
    learnMore: 'Learn more',
    faq: [
      { q: 'What is the difference between Seedream 5 and Z-Image?', a: 'Seedream 5, developed by ByteDance, is an image editing model that requires a reference image. It supports basic/high quality options and various aspect ratios. Z-Image is a text-to-image model that generates images from prompts alone, without requiring a reference image.' },
      { q: 'How many credits does AI image generation cost?', a: 'Seedream 5 costs 2 credits for basic quality and 3 credits for high quality. Z-Image costs 1 credit per image.' },
      { q: 'Can I use generated images commercially?', a: 'Yes, all AI images generated on gwanggo can be freely used for commercial purposes including ad banners, social media content, and product showcases.' },
    ],
    jsonLdDescriptions: {
      webApp: 'AI image generation tool powered by Seedream 5 and Z-Image. Create high-quality images from text or reference images.',
      seedream: 'AI image editing model by ByteDance. Reference image-based editing with basic/high quality options.',
      zimage: 'Text-to-image AI generation model. Create high-quality images from prompts alone.',
    },
  },
  ja: {
    title: 'AI画像生成ツール - Seedream 5 & Z-Image | gwanggo',
    description: 'Seedream 5（ByteDance）とZ-Imageで高品質AI画像を生成。画像編集、テキストから画像生成に対応。広告バナー、商品画像、SNSコンテンツに最適。',
    keywords: ['AI画像生成', 'Seedream 5', 'Z-Image', 'テキストから画像', 'AI画像編集', 'AI画像メーカー', '広告画像生成', 'ByteDance', 'バイトダンス', 'AI画像クリエイター'],
    ogTitle: 'AI画像生成ツール - Seedream 5 & Z-Image',
    ogDescription: 'ByteDance Seedream 5とZ-Imageでテキスト/参照画像から高品質AI画像を生成。',
    h1: 'AI画像生成',
    subtitle: 'Seedream 5とZ-Imageでテキストまたは参照画像から高品質な画像を生成します。',
    breadcrumbHome: 'ホーム',
    breadcrumbAiTools: 'AIツール',
    breadcrumbImage: '画像生成',
    learnMore: '詳しく見る',
    faq: [
      { q: 'Seedream 5とZ-Imageの違いは何ですか？', a: 'Seedream 5はByteDanceが開発した画像編集モデルで、参照画像が必要です。基本/高画質オプションと様々なアスペクト比に対応します。Z-Imageはテキストから画像を生成するモデルで、参照画像なしでプロンプトのみで画像を生成します。' },
      { q: 'AI画像生成にクレジットはいくら必要ですか？', a: 'Seedream 5は基本画質2クレジット、高画質3クレジットです。Z-Imageは1クレジットです。' },
      { q: '生成された画像を商用利用できますか？', a: 'はい、gwanggoで生成されたすべてのAI画像は、広告バナー、SNSコンテンツ、商品紹介など商用目的で自由にご利用いただけます。' },
    ],
    jsonLdDescriptions: {
      webApp: 'Seedream 5とZ-Imageを使用したAI画像生成ツール。テキスト/参照画像から高品質画像を生成します。',
      seedream: 'ByteDanceが開発したAI画像編集モデル。参照画像ベースの編集、基本/高画質オプション対応。',
      zimage: 'テキストから画像を生成するAIモデル。プロンプトのみで高品質画像を生成。',
    },
  },
  zh: {
    title: 'AI图像生成工具 - Seedream 5 & Z-Image | gwanggo',
    description: '使用Seedream 5（ByteDance/字节跳动）和Z-Image生成高质量AI图像。支持图像编辑和文本生成图像。适用于广告横幅、产品图片、社交媒体内容。',
    keywords: ['AI图像生成', 'Seedream 5', 'Z-Image', '文本生成图像', 'AI图像编辑', 'AI图像制作', '广告图像生成', 'ByteDance', '字节跳动', 'AI图片生成器'],
    ogTitle: 'AI图像生成工具 - Seedream 5 & Z-Image',
    ogDescription: '使用ByteDance Seedream 5和Z-Image从文本/参考图像生成高质量AI图像。',
    h1: 'AI图像生成',
    subtitle: '使用Seedream 5和Z-Image从文本或参考图像生成高质量图像。',
    breadcrumbHome: '首页',
    breadcrumbAiTools: 'AI工具',
    breadcrumbImage: '图像生成',
    learnMore: '了解更多',
    faq: [
      { q: 'Seedream 5和Z-Image有什么区别？', a: 'Seedream 5是ByteDance（字节跳动）开发的图像编辑模型，需要参考图像。支持基本/高质量选项和多种比例。Z-Image是文本生成图像模型，无需参考图像，仅通过提示词即可生成图像。' },
      { q: 'AI图像生成需要多少积分？', a: 'Seedream 5基本质量2积分，高质量3积分。Z-Image每张1积分。' },
      { q: '生成的图像可以商用吗？', a: '是的，在gwanggo生成的所有AI图像均可自由用于广告横幅、社交媒体内容、产品展示等商业用途。' },
    ],
    jsonLdDescriptions: {
      webApp: '使用Seedream 5和Z-Image的AI图像生成工具。从文本/参考图像生成高质量图像。',
      seedream: 'ByteDance（字节跳动）开发的AI图像编辑模型。基于参考图像的编辑，支持基本/高质量选项。',
      zimage: '文本生成图像的AI模型。仅通过提示词即可生成高质量图像。',
    },
  },
}

function getJsonLd(lang: Lang) {
  const data = i18n[lang]
  return {
    tools: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: data.ogTitle,
        description: data.jsonLdDescriptions.webApp,
        url: `${siteUrl}/dashboard/ai-tools/${lang}/image`,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        inLanguage: lang === 'zh' ? 'zh-CN' : lang,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        creator: { '@type': 'Organization', name: 'gwanggo', url: siteUrl },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Seedream 5',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        description: data.jsonLdDescriptions.seedream,
        creator: { '@type': 'Organization', name: 'ByteDance' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Z-Image',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        description: data.jsonLdDescriptions.zimage,
      },
    ],
    faq: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: data.breadcrumbHome, item: `${siteUrl}/dashboard` },
        { '@type': 'ListItem', position: 2, name: data.breadcrumbAiTools },
        { '@type': 'ListItem', position: 3, name: data.breadcrumbImage, item: `${siteUrl}/dashboard/ai-tools/${lang}/image` },
      ],
    },
  }
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
      locale: ogLocale[lang],
      alternateLocale: validLanguages.filter((l) => l !== lang).map((l) => ogLocale[l]),
      title: data.ogTitle,
      description: data.ogDescription,
      url: `${siteUrl}/dashboard/ai-tools/${lang}/image`,
      siteName: 'gwanggo',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: data.ogTitle, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.ogTitle,
      description: data.ogDescription,
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

export default async function ImageToolPage({ params }: Props) {
  const { language } = await params

  if (!validLanguages.includes(language as Lang)) {
    notFound()
  }

  const lang = language as Lang
  const data = i18n[lang]
  const jsonLd = getJsonLd(lang)

  return (
    <>
      {/* JSON-LD */}
      {jsonLd.tools.map((item, idx) => (
        <script key={`tool-${idx}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.breadcrumb) }} />

      {/* SEO visible content */}
      <div className="mb-4">
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li><Link href="/dashboard" className="hover:text-foreground transition-colors">{data.breadcrumbHome}</Link></li>
            <li>/</li>
            <li>{data.breadcrumbAiTools}</li>
            <li>/</li>
            <li className="text-foreground font-medium">{data.breadcrumbImage}</li>
          </ol>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{data.h1}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data.subtitle}</p>
          </div>
          <Link
            href={`/${lang}/tools/image`}
            className="text-xs text-primary hover:underline hidden sm:inline-flex"
          >
            {data.learnMore} &rarr;
          </Link>
        </div>
      </div>

      <ImageGenerator />
    </>
  )
}
