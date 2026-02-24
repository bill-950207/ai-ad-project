import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VideoGenerator from '@/components/ai-tools/video-generator'

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
  breadcrumbVideo: string
  learnMore: string
  faq: { q: string; a: string }[]
  jsonLdDescriptions: {
    webApp: string
    seedance: string
    vidu: string
  }
}> = {
  ko: {
    title: 'AI 영상 생성 도구 - Seedance 1.5 Pro & Vidu Q3 | gwanggo',
    description: 'Seedance 1.5 Pro(ByteDance)와 Vidu Q3(Shengshu Technology)로 고품질 AI 영상을 생성하세요. 텍스트/이미지 입력으로 최대 1080p, 16초 영상 생성. 광고, 숏폼, 제품 영상에 최적화.',
    keywords: ['AI 영상 생성', 'Seedance 1.5 Pro', 'Vidu Q3', '텍스트 투 비디오', '이미지 투 비디오', 'AI 동영상 만들기', '광고 영상 생성', 'ByteDance', 'Shengshu Technology', '바이트댄스', 'AI 비디오'],
    ogTitle: 'AI 영상 생성 도구 - Seedance 1.5 Pro & Vidu Q3',
    ogDescription: 'ByteDance Seedance 1.5 Pro와 Shengshu Vidu Q3로 텍스트/이미지에서 고품질 AI 영상을 생성하세요.',
    h1: 'AI 영상 생성',
    subtitle: 'Seedance 1.5 Pro와 Vidu Q3로 텍스트 또는 이미지에서 고품질 영상을 생성하세요.',
    breadcrumbHome: '홈',
    breadcrumbAiTools: 'AI 도구',
    breadcrumbVideo: '영상 생성',
    learnMore: '자세히 알아보기',
    faq: [
      { q: 'Seedance 1.5 Pro와 Vidu Q3의 차이점은 무엇인가요?', a: 'Seedance 1.5 Pro는 ByteDance가 개발한 모델로 텍스트 또는 이미지에서 최대 720p, 12초 영상을 생성합니다. Vidu Q3는 Shengshu Technology가 개발한 모델로 이미지 입력 필수이며 최대 1080p, 16초 영상을 생성합니다.' },
      { q: 'AI 영상 생성에 크레딧이 얼마나 필요한가요?', a: 'Seedance 1.5 Pro는 480p 기준 초당 1크레딧, 720p 기준 초당 2크레딧입니다. Vidu Q3는 540p 초당 1크레딧, 720p 초당 2크레딧, 1080p 초당 3크레딧입니다.' },
      { q: '생성된 영상을 상업적으로 사용할 수 있나요?', a: '네, gwanggo에서 생성된 모든 AI 영상은 광고, SNS, 제품 소개 등 상업적 목적으로 자유롭게 사용할 수 있습니다.' },
    ],
    jsonLdDescriptions: {
      webApp: 'Seedance 1.5 Pro와 Vidu Q3를 사용한 AI 영상 생성 도구. 텍스트/이미지에서 고품질 영상을 생성합니다.',
      seedance: 'ByteDance가 개발한 텍스트/이미지 투 비디오 AI 모델. 최대 720p, 12초 영상 생성 지원.',
      vidu: 'Shengshu Technology가 개발한 이미지 투 비디오 AI 모델. 최대 1080p, 16초 영상 생성 지원.',
    },
  },
  en: {
    title: 'AI Video Generator - Seedance 1.5 Pro & Vidu Q3 | gwanggo',
    description: 'Create high-quality AI videos with Seedance 1.5 Pro (ByteDance) and Vidu Q3 (Shengshu Technology). Generate up to 1080p, 16-second videos from text or images. Optimized for ads, shorts, and product videos.',
    keywords: ['AI video generator', 'Seedance 1.5 Pro', 'Vidu Q3', 'text to video', 'image to video', 'AI video maker', 'ad video generation', 'ByteDance', 'Shengshu Technology', 'AI video creator'],
    ogTitle: 'AI Video Generator - Seedance 1.5 Pro & Vidu Q3',
    ogDescription: 'Generate high-quality AI videos from text or images with ByteDance Seedance 1.5 Pro and Shengshu Vidu Q3.',
    h1: 'AI Video Generator',
    subtitle: 'Create high-quality videos from text or images with Seedance 1.5 Pro and Vidu Q3.',
    breadcrumbHome: 'Home',
    breadcrumbAiTools: 'AI Tools',
    breadcrumbVideo: 'Video Generator',
    learnMore: 'Learn more',
    faq: [
      { q: 'What is the difference between Seedance 1.5 Pro and Vidu Q3?', a: 'Seedance 1.5 Pro, developed by ByteDance, generates videos up to 720p and 12 seconds from text or images. Vidu Q3, developed by Shengshu Technology, requires image input and generates videos up to 1080p and 16 seconds.' },
      { q: 'How many credits does AI video generation cost?', a: 'Seedance 1.5 Pro costs 1 credit/sec at 480p and 2 credits/sec at 720p. Vidu Q3 costs 1 credit/sec at 540p, 2 credits/sec at 720p, and 3 credits/sec at 1080p.' },
      { q: 'Can I use generated videos commercially?', a: 'Yes, all AI videos generated on gwanggo can be freely used for commercial purposes including ads, social media, and product showcases.' },
    ],
    jsonLdDescriptions: {
      webApp: 'AI video generation tool powered by Seedance 1.5 Pro and Vidu Q3. Create high-quality videos from text or images.',
      seedance: 'Text/Image to Video AI model by ByteDance. Supports up to 720p, 12-second video generation.',
      vidu: 'Image to Video AI model by Shengshu Technology. Supports up to 1080p, 16-second video generation.',
    },
  },
  ja: {
    title: 'AI動画生成ツール - Seedance 1.5 Pro & Vidu Q3 | gwanggo',
    description: 'Seedance 1.5 Pro（ByteDance）とVidu Q3（Shengshu Technology）で高品質AI動画を生成。テキスト/画像入力で最大1080p、16秒の動画を作成。広告、ショート動画、商品動画に最適。',
    keywords: ['AI動画生成', 'Seedance 1.5 Pro', 'Vidu Q3', 'テキストから動画', '画像から動画', 'AI動画メーカー', '広告動画生成', 'ByteDance', 'Shengshu Technology', 'バイトダンス'],
    ogTitle: 'AI動画生成ツール - Seedance 1.5 Pro & Vidu Q3',
    ogDescription: 'ByteDance Seedance 1.5 ProとShengshu Vidu Q3でテキスト/画像から高品質AI動画を生成。',
    h1: 'AI動画生成',
    subtitle: 'Seedance 1.5 ProとVidu Q3でテキストまたは画像から高品質な動画を生成します。',
    breadcrumbHome: 'ホーム',
    breadcrumbAiTools: 'AIツール',
    breadcrumbVideo: '動画生成',
    learnMore: '詳しく見る',
    faq: [
      { q: 'Seedance 1.5 ProとVidu Q3の違いは何ですか？', a: 'Seedance 1.5 ProはByteDanceが開発したモデルで、テキストまたは画像から最大720p、12秒の動画を生成します。Vidu Q3はShengshu Technologyが開発したモデルで、画像入力が必須で最大1080p、16秒の動画を生成します。' },
      { q: 'AI動画生成にクレジットはいくら必要ですか？', a: 'Seedance 1.5 Proは480pで秒あたり1クレジット、720pで秒あたり2クレジットです。Vidu Q3は540pで秒あたり1クレジット、720pで秒あたり2クレジット、1080pで秒あたり3クレジットです。' },
      { q: '生成された動画を商用利用できますか？', a: 'はい、gwanggoで生成されたすべてのAI動画は、広告、SNS、商品紹介など商用目的で自由にご利用いただけます。' },
    ],
    jsonLdDescriptions: {
      webApp: 'Seedance 1.5 ProとVidu Q3を使用したAI動画生成ツール。テキスト/画像から高品質動画を生成します。',
      seedance: 'ByteDanceが開発したテキスト/画像から動画を生成するAIモデル。最大720p、12秒の動画生成に対応。',
      vidu: 'Shengshu Technologyが開発した画像から動画を生成するAIモデル。最大1080p、16秒の動画生成に対応。',
    },
  },
  zh: {
    title: 'AI视频生成工具 - Seedance 1.5 Pro & Vidu Q3 | gwanggo',
    description: '使用Seedance 1.5 Pro（ByteDance/字节跳动）和Vidu Q3（生数科技）生成高质量AI视频。通过文本/图像输入生成最高1080p、16秒视频。适用于广告、短视频、产品视频。',
    keywords: ['AI视频生成', 'Seedance 1.5 Pro', 'Vidu Q3', '文本生成视频', '图像生成视频', 'AI视频制作', '广告视频生成', 'ByteDance', '字节跳动', '生数科技', 'Shengshu Technology'],
    ogTitle: 'AI视频生成工具 - Seedance 1.5 Pro & Vidu Q3',
    ogDescription: '使用ByteDance Seedance 1.5 Pro和生数科技Vidu Q3从文本/图像生成高质量AI视频。',
    h1: 'AI视频生成',
    subtitle: '使用Seedance 1.5 Pro和Vidu Q3从文本或图像生成高质量视频。',
    breadcrumbHome: '首页',
    breadcrumbAiTools: 'AI工具',
    breadcrumbVideo: '视频生成',
    learnMore: '了解更多',
    faq: [
      { q: 'Seedance 1.5 Pro和Vidu Q3有什么区别？', a: 'Seedance 1.5 Pro是ByteDance（字节跳动）开发的模型，可从文本或图像生成最高720p、12秒的视频。Vidu Q3是生数科技开发的模型，需要图像输入，可生成最高1080p、16秒的视频。' },
      { q: 'AI视频生成需要多少积分？', a: 'Seedance 1.5 Pro在480p下每秒1积分，720p下每秒2积分。Vidu Q3在540p下每秒1积分，720p下每秒2积分，1080p下每秒3积分。' },
      { q: '生成的视频可以商用吗？', a: '是的，在gwanggo生成的所有AI视频均可自由用于广告、社交媒体、产品展示等商业用途。' },
    ],
    jsonLdDescriptions: {
      webApp: '使用Seedance 1.5 Pro和Vidu Q3的AI视频生成工具。从文本/图像生成高质量视频。',
      seedance: 'ByteDance（字节跳动）开发的文本/图像转视频AI模型。支持最高720p、12秒视频生成。',
      vidu: '生数科技开发的图像转视频AI模型。支持最高1080p、16秒视频生成。',
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
        url: `${siteUrl}/dashboard/ai-tools/${lang}/video`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        inLanguage: lang === 'zh' ? 'zh-CN' : lang,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        creator: { '@type': 'Organization', name: 'gwanggo', url: siteUrl },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Seedance 1.5 Pro',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        description: data.jsonLdDescriptions.seedance,
        creator: { '@type': 'Organization', name: 'ByteDance' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Vidu Q3',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        description: data.jsonLdDescriptions.vidu,
        creator: { '@type': 'Organization', name: 'Shengshu Technology' },
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
        { '@type': 'ListItem', position: 3, name: data.breadcrumbVideo, item: `${siteUrl}/dashboard/ai-tools/${lang}/video` },
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
      locale: ogLocale[lang],
      alternateLocale: validLanguages.filter((l) => l !== lang).map((l) => ogLocale[l]),
      title: data.ogTitle,
      description: data.ogDescription,
      url: `${siteUrl}/dashboard/ai-tools/${lang}/video`,
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

export default async function VideoToolPage({ params }: Props) {
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
            <li className="text-foreground font-medium">{data.breadcrumbVideo}</li>
          </ol>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{data.h1}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data.subtitle}</p>
          </div>
          <Link
            href={`/${lang}/tools/video`}
            className="text-xs text-primary hover:underline hidden sm:inline-flex"
          >
            {data.learnMore} &rarr;
          </Link>
        </div>
      </div>

      <VideoGenerator />
    </>
  )
}
