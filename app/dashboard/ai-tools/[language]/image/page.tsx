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
    flux2pro: string
    grokImage: string
  }
}> = {
  ko: {
    title: 'AI 이미지 생성 - Seedream 5 · FLUX.2 Pro · Grok Imagine | gwanggo',
    description: 'Seedream 5, FLUX.2 Pro, Grok Imagine Image, Z-Image 등 4종 AI 이미지 모델로 고품질 이미지 생성. 이미지 편집, 텍스트 투 이미지 지원. 광고 배너, 제품 이미지에 최적화.',
    keywords: ['AI 이미지 생성', 'Seedream 5', 'Z-Image', '텍스트 투 이미지', 'AI 이미지 편집', 'AI 그림 생성', '광고 이미지 생성', 'ByteDance', '바이트댄스', 'AI 이미지 메이커', 'Midjourney 대안', 'DALL-E 대안', 'Stable Diffusion 대안', 'GPT Image', 'Flux 대안', 'Ideogram 대안', 'Adobe Firefly 대안', 'Leonardo AI 대안', 'FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'Black Forest Labs', 'Grok Imagine Image', 'xAI', 'Grok AI', 'Grok 이미지'],
    ogTitle: 'AI 이미지 생성 - Seedream 5 · FLUX.2 Pro · Grok Imagine',
    ogDescription: 'Seedream 5, FLUX.2 Pro, Grok Imagine Image, Z-Image 4종 AI 모델로 텍스트/참조 이미지에서 고품질 이미지를 생성하세요.',
    h1: 'AI 이미지 생성',
    subtitle: '4종 AI 모델로 텍스트 또는 참조 이미지에서 고품질 이미지를 생성하세요.',
    breadcrumbHome: '홈',
    breadcrumbAiTools: 'AI 도구',
    breadcrumbImage: '이미지 생성',
    learnMore: '자세히 알아보기',
    faq: [
      { q: 'Seedream 5와 Z-Image의 차이점은 무엇인가요?', a: 'Seedream 5는 ByteDance가 개발한 이미지 편집 모델로 참조 이미지가 필요합니다. 기본/고화질 옵션과 다양한 비율을 지원합니다. Z-Image는 텍스트만으로 이미지를 생성하는 모델로, 참조 이미지 없이 프롬프트만으로 이미지를 생성합니다.' },
      { q: 'FLUX.2 Pro는 어떤 모델인가요?', a: 'FLUX.2 Pro는 Black Forest Labs가 개발한 Text-to-Image AI 모델입니다. 기본 화질 1크레딧, 고화질 2크레딧이며 5가지 비율을 지원합니다.' },
      { q: 'Grok Imagine Image는 어떤 모델인가요?', a: 'Grok Imagine Image는 xAI가 개발한 Text-to-Image AI 모델입니다. 1크레딧으로 빠른 이미지 생성이 가능합니다.' },
      { q: 'AI 이미지 생성에 크레딧이 얼마나 필요한가요?', a: 'Seedream 5는 기본 화질 2크레딧, 고화질 3크레딧입니다. FLUX.2 Pro는 기본 1크레딧, 고화질 2크레딧입니다. Grok Imagine Image는 1크레딧입니다. Z-Image는 1크레딧입니다.' },
      { q: '생성된 이미지를 상업적으로 사용할 수 있나요?', a: '네, gwanggo에서 생성된 모든 AI 이미지는 광고 배너, SNS 콘텐츠, 제품 소개 등 상업적 목적으로 자유롭게 사용할 수 있습니다.' },
      { q: 'Midjourney, DALL-E 대신 Seedream 5를 사용하는 이유는?', a: 'Seedream 5는 ByteDance(바이트댄스)가 개발한 최신 AI 이미지 모델로, Midjourney V7, DALL-E 3, Stable Diffusion 4 등과 비교해 광고 이미지 편집에 특화되어 있습니다. 참조 이미지 기반 편집이 가능하고, 별도 앱 설치 없이 웹에서 바로 사용할 수 있으며, Midjourney보다 저렴한 비용으로 상업용 이미지를 제작할 수 있습니다.' },
    ],
    jsonLdDescriptions: {
      webApp: 'Seedream 5, FLUX.2 Pro, Grok Imagine Image, Z-Image를 사용한 AI 이미지 생성 도구. 텍스트/참조 이미지에서 고품질 이미지를 생성합니다.',
      seedream: 'ByteDance가 개발한 AI 이미지 편집 모델. 참조 이미지 기반 편집, 기본/고화질 지원.',
      zimage: '텍스트에서 이미지를 생성하는 AI 모델. 프롬프트만으로 고품질 이미지 생성.',
      flux2pro: 'Black Forest Labs가 개발한 Text-to-Image AI 모델. 기본/고화질 옵션 지원.',
      grokImage: 'xAI가 개발한 Text-to-Image AI 모델. 빠른 이미지 생성.',
    },
  },
  en: {
    title: 'AI Image Generator - Seedream 5 · FLUX.2 Pro · Grok Imagine | gwanggo',
    description: 'Generate AI images with Seedream 5, FLUX.2 Pro, Grok Imagine, and Z-Image. Image editing and text-to-image. Optimized for ad banners and product images.',
    keywords: ['AI image generator', 'Seedream 5', 'Z-Image', 'text to image', 'AI image editing', 'AI image maker', 'ad image generation', 'ByteDance', 'AI art generator', 'product image AI', 'Midjourney alternative', 'DALL-E alternative', 'Stable Diffusion alternative', 'GPT Image alternative', 'Flux alternative', 'Ideogram alternative', 'Adobe Firefly alternative', 'Leonardo AI alternative', 'FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'Black Forest Labs', 'Grok Imagine Image', 'xAI', 'Grok AI'],
    ogTitle: 'AI Image Generator - Seedream 5 · FLUX.2 Pro · Grok Imagine',
    ogDescription: 'Generate high-quality AI images with Seedream 5, FLUX.2 Pro, Grok Imagine Image, and Z-Image. 4 AI models for text-to-image and image editing.',
    h1: 'AI Image Generator',
    subtitle: 'Create high-quality images from text or reference images with 4 AI models.',
    breadcrumbHome: 'Home',
    breadcrumbAiTools: 'AI Tools',
    breadcrumbImage: 'Image Generator',
    learnMore: 'Learn more',
    faq: [
      { q: 'What is the difference between Seedream 5 and Z-Image?', a: 'Seedream 5, developed by ByteDance, is an image editing model that requires a reference image. It supports basic/high quality options and various aspect ratios. Z-Image is a text-to-image model that generates images from prompts alone, without requiring a reference image.' },
      { q: 'What is FLUX.2 Pro?', a: 'FLUX.2 Pro is a Text-to-Image AI model developed by Black Forest Labs. It costs 1 credit for basic quality and 2 credits for high quality, and supports 5 aspect ratios.' },
      { q: 'What is Grok Imagine Image?', a: 'Grok Imagine Image is a Text-to-Image AI model developed by xAI. It costs 1 credit and offers fast image generation.' },
      { q: 'How many credits does AI image generation cost?', a: 'Seedream 5 costs 2 credits for basic quality and 3 credits for high quality. FLUX.2 Pro costs 1 credit for basic and 2 credits for high quality. Grok Imagine Image costs 1 credit. Z-Image costs 1 credit per image.' },
      { q: 'Can I use generated images commercially?', a: 'Yes, all AI images generated on gwanggo can be freely used for commercial purposes including ad banners, social media content, and product showcases.' },
      { q: 'How does Seedream 5 compare to Midjourney, DALL-E, and Stable Diffusion?', a: 'Seedream 5 by ByteDance is optimized for commercial ad image editing, unlike Midjourney V7, DALL-E 3, or Stable Diffusion 4 which focus on general image generation. It supports reference image-based editing, works directly in the browser without app installation, and is more cost-effective than Midjourney for creating commercial ad images.' },
    ],
    jsonLdDescriptions: {
      webApp: 'AI image generation tool powered by Seedream 5, FLUX.2 Pro, Grok Imagine Image, and Z-Image. Create high-quality images from text or reference images.',
      seedream: 'AI image editing model by ByteDance. Reference image-based editing with basic/high quality options.',
      zimage: 'Text-to-image AI generation model. Create high-quality images from prompts alone.',
      flux2pro: 'Text-to-Image AI model by Black Forest Labs. Basic/high quality options.',
      grokImage: 'Text-to-Image AI model by xAI. Fast image generation.',
    },
  },
  ja: {
    title: 'AI画像生成 - Seedream 5 · FLUX.2 Pro · Grok Imagine | gwanggo',
    description: 'Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Imageの4モデルで高品質AI画像を生成。画像編集、テキストから画像生成に対応。',
    keywords: ['AI画像生成', 'Seedream 5', 'Z-Image', 'テキストから画像', 'AI画像編集', 'AI画像メーカー', '広告画像生成', 'ByteDance', 'バイトダンス', 'AI画像クリエイター', 'Midjourney代替', 'DALL-E代替', 'Stable Diffusion代替', 'GPT Image', 'Flux代替', 'Adobe Firefly代替', 'FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'Black Forest Labs', 'Grok Imagine Image', 'xAI', 'Grok AI', 'Grok AI'],
    ogTitle: 'AI画像生成 - Seedream 5 · FLUX.2 Pro · Grok Imagine',
    ogDescription: 'Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Imageの4モデルでテキスト/参照画像から高品質AI画像を生成。',
    h1: 'AI画像生成',
    subtitle: '4つのAIモデルでテキストまたは参照画像から高品質な画像を生成します。',
    breadcrumbHome: 'ホーム',
    breadcrumbAiTools: 'AIツール',
    breadcrumbImage: '画像生成',
    learnMore: '詳しく見る',
    faq: [
      { q: 'Seedream 5とZ-Imageの違いは何ですか？', a: 'Seedream 5はByteDanceが開発した画像編集モデルで、参照画像が必要です。基本/高画質オプションと様々なアスペクト比に対応します。Z-Imageはテキストから画像を生成するモデルで、参照画像なしでプロンプトのみで画像を生成します。' },
      { q: 'FLUX.2 Proはどんなモデルですか？', a: 'FLUX.2 ProはBlack Forest Labsが開発したText-to-Image AIモデルです。基本画質1クレジット、高画質2クレジットで、5つのアスペクト比に対応します。' },
      { q: 'Grok Imagine Imageはどんなモデルですか？', a: 'Grok Imagine ImageはxAIが開発したText-to-Image AIモデルです。1クレジットで高速な画像生成が可能です。' },
      { q: 'AI画像生成にクレジットはいくら必要ですか？', a: 'Seedream 5は基本画質2クレジット、高画質3クレジットです。FLUX.2 Proは基本1クレジット、高画質2クレジットです。Grok Imagine Imageは1クレジットです。Z-Imageは1クレジットです。' },
      { q: '生成された画像を商用利用できますか？', a: 'はい、gwanggoで生成されたすべてのAI画像は、広告バナー、SNSコンテンツ、商品紹介など商用目的で自由にご利用いただけます。' },
      { q: 'Midjourney、DALL-Eの代わりにSeedream 5を使う理由は？', a: 'Seedream 5はByteDance（バイトダンス）が開発した最新AIモデルで、Midjourney V7、DALL-E 3、Stable Diffusion 4と比較して広告画像編集に特化しています。参照画像ベースの編集が可能で、アプリ不要でブラウザから直接使用でき、Midjourneyより低コストで商用画像を制作できます。' },
    ],
    jsonLdDescriptions: {
      webApp: 'Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Imageを使用したAI画像生成ツール。テキスト/参照画像から高品質画像を生成します。',
      seedream: 'ByteDanceが開発したAI画像編集モデル。参照画像ベースの編集、基本/高画質オプション対応。',
      zimage: 'テキストから画像を生成するAIモデル。プロンプトのみで高品質画像を生成。',
      flux2pro: 'Black Forest Labsが開発したText-to-Image AIモデル。基本/高画質オプション対応。',
      grokImage: 'xAIが開発したText-to-Image AIモデル。高速な画像生成。',
    },
  },
  zh: {
    title: 'AI图像生成 - Seedream 5 · FLUX.2 Pro · Grok Imagine | gwanggo',
    description: '支持Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Image等4种AI图像模型。支持图像编辑和文本生成图像。',
    keywords: ['AI图像生成', 'Seedream 5', 'Z-Image', '文本生成图像', 'AI图像编辑', 'AI图像制作', '广告图像生成', 'ByteDance', '字节跳动', 'AI图片生成器', 'Midjourney替代', 'DALL-E替代', 'Stable Diffusion替代', 'GPT Image', 'Flux替代', 'Adobe Firefly替代', 'FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'Black Forest Labs', 'Grok Imagine Image', 'xAI', 'Grok AI', 'Grok图片'],
    ogTitle: 'AI图像生成 - Seedream 5 · FLUX.2 Pro · Grok Imagine',
    ogDescription: '使用Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Image等4种AI模型从文本/参考图像生成高质量图像。',
    h1: 'AI图像生成',
    subtitle: '使用4种AI模型从文本或参考图像生成高质量图像。',
    breadcrumbHome: '首页',
    breadcrumbAiTools: 'AI工具',
    breadcrumbImage: '图像生成',
    learnMore: '了解更多',
    faq: [
      { q: 'Seedream 5和Z-Image有什么区别？', a: 'Seedream 5是ByteDance（字节跳动）开发的图像编辑模型，需要参考图像。支持基本/高质量选项和多种比例。Z-Image是文本生成图像模型，无需参考图像，仅通过提示词即可生成图像。' },
      { q: 'FLUX.2 Pro是什么模型？', a: 'FLUX.2 Pro是Black Forest Labs开发的Text-to-Image AI模型。基本质量1积分，高质量2积分，支持5种比例。' },
      { q: 'Grok Imagine Image是什么模型？', a: 'Grok Imagine Image是xAI开发的Text-to-Image AI模型。1积分即可快速生成图像。' },
      { q: 'AI图像生成需要多少积分？', a: 'Seedream 5基本质量2积分，高质量3积分。FLUX.2 Pro基本1积分，高质量2积分。Grok Imagine Image 1积分。Z-Image每张1积分。' },
      { q: '生成的图像可以商用吗？', a: '是的，在gwanggo生成的所有AI图像均可自由用于广告横幅、社交媒体内容、产品展示等商业用途。' },
      { q: '为什么选择Seedream 5而不是Midjourney、DALL-E？', a: 'Seedream 5是ByteDance（字节跳动）开发的最新AI模型，与Midjourney V7、DALL-E 3、Stable Diffusion 4相比，更专注于广告图像编辑。支持参考图像编辑，无需安装应用程序即可在浏览器中直接使用，且费用比Midjourney更低。' },
    ],
    jsonLdDescriptions: {
      webApp: '使用Seedream 5、FLUX.2 Pro、Grok Imagine Image和Z-Image的AI图像生成工具。从文本/参考图像生成高质量图像。',
      seedream: 'ByteDance（字节跳动）开发的AI图像编辑模型。基于参考图像的编辑，支持基本/高质量选项。',
      zimage: '文本生成图像的AI模型。仅通过提示词即可生成高质量图像。',
      flux2pro: 'Black Forest Labs开发的Text-to-Image AI模型。支持基本/高质量选项。',
      grokImage: 'xAI开发的Text-to-Image AI模型。快速图像生成。',
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
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'FLUX.2 Pro',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        description: data.jsonLdDescriptions.flux2pro,
        creator: { '@type': 'Organization', name: 'Black Forest Labs' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Grok Imagine Image',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        description: data.jsonLdDescriptions.grokImage,
        creator: { '@type': 'Organization', name: 'xAI' },
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
