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

const VIDEO_MODEL_SLUGS = [
  'seedance-1.5-pro', 'kling-3', 'grok-video', 'wan-2.6',
  'vidu-q3', 'veo-3.1', 'hailuo-02', 'ltx-2.3',
] as const
type ModelSlug = (typeof VIDEO_MODEL_SLUGS)[number]

interface ModelMeta {
  name: string
  creator: string
  description: Record<Lang, string>
  title: Record<Lang, string>
  keywords: Record<Lang, string[]>
  jsonLdDescription: Record<Lang, string>
}

const MODELS: Record<ModelSlug, ModelMeta> = {
  'seedance-1.5-pro': {
    name: 'Seedance 1.5 Pro',
    creator: 'ByteDance',
    description: {
      ko: 'ByteDance Seedance 1.5 Pro로 텍스트/이미지에서 고품질 AI 영상 생성. 최대 720p, 12초. 광고, 숏폼에 최적화.',
      en: 'Generate AI videos with ByteDance Seedance 1.5 Pro from text or images. Up to 720p, 12 seconds. Optimized for ads and shorts.',
      ja: 'ByteDance Seedance 1.5 Proでテキスト/画像から高品質AI動画を生成。最大720p、12秒。広告・ショート動画に最適。',
      zh: '使用ByteDance Seedance 1.5 Pro从文本/图像生成高质量AI视频。最高720p、12秒。适用于广告和短视频。',
    },
    title: {
      ko: 'Seedance 1.5 Pro AI 영상 생성 | gwanggo',
      en: 'Seedance 1.5 Pro AI Video Generator | gwanggo',
      ja: 'Seedance 1.5 Pro AI動画生成 | gwanggo',
      zh: 'Seedance 1.5 Pro AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Seedance 1.5 Pro', 'ByteDance', '바이트댄스', 'AI 영상 생성', '텍스트 투 비디오', 'Sora 대안'],
      en: ['Seedance 1.5 Pro', 'ByteDance', 'AI video generator', 'text to video', 'Sora alternative'],
      ja: ['Seedance 1.5 Pro', 'ByteDance', 'バイトダンス', 'AI動画生成', 'テキストから動画', 'Sora代替'],
      zh: ['Seedance 1.5 Pro', 'ByteDance', '字节跳动', 'AI视频生成', '文本生成视频', 'Sora替代'],
    },
    jsonLdDescription: {
      ko: 'ByteDance가 개발한 텍스트/이미지 투 비디오 AI 모델. 최대 720p, 12초 영상 생성.',
      en: 'Text/Image to Video AI model by ByteDance. Up to 720p, 12-second video generation.',
      ja: 'ByteDanceが開発したテキスト/画像から動画を生成するAIモデル。最大720p、12秒。',
      zh: 'ByteDance开发的文本/图像转视频AI模型。最高720p、12秒视频生成。',
    },
  },
  'kling-3': {
    name: 'Kling 3.0',
    creator: 'Kuaishou',
    description: {
      ko: 'Kuaishou Kling 3.0으로 AI 영상 생성. Standard/Pro 등급, 720p, 5~10초. 멀티샷 지원.',
      en: 'Generate AI videos with Kuaishou Kling 3.0. Standard/Pro tiers, 720p, 5-10 seconds. Multi-shot support.',
      ja: 'Kuaishou Kling 3.0でAI動画を生成。Standard/Proティア、720p、5〜10秒。マルチショット対応。',
      zh: '使用Kuaishou Kling 3.0生成AI视频。Standard/Pro等级，720p，5~10秒。支持多镜头。',
    },
    title: {
      ko: 'Kling 3.0 AI 영상 생성 | gwanggo',
      en: 'Kling 3.0 AI Video Generator | gwanggo',
      ja: 'Kling 3.0 AI動画生成 | gwanggo',
      zh: 'Kling 3.0 AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Kling 3.0', 'Kuaishou', '쿠아이쇼우', '快手', 'AI 영상 생성', '멀티샷 영상'],
      en: ['Kling 3.0', 'Kuaishou', 'AI video generator', 'multi-shot video', 'Kling alternative'],
      ja: ['Kling 3.0', 'Kuaishou', '快手AI', 'AI動画生成', 'マルチショット動画'],
      zh: ['Kling 3.0', 'Kuaishou', '快手', 'AI视频生成', '多镜头视频'],
    },
    jsonLdDescription: {
      ko: 'Kuaishou가 개발한 Text/Image to Video AI 모델. Standard/Pro 등급, 720p, 5~10초.',
      en: 'Text/Image to Video AI model by Kuaishou. Standard/Pro tiers, 720p, 5-10s.',
      ja: 'Kuaishouが開発したText/Image to Video AIモデル。Standard/Proティア、720p、5〜10秒。',
      zh: 'Kuaishou（快手）开发的Text/Image to Video AI模型。Standard/Pro等级，720p，5~10秒。',
    },
  },
  'grok-video': {
    name: 'Grok Imagine Video',
    creator: 'xAI',
    description: {
      ko: 'xAI Grok Imagine Video로 AI 영상 생성. 480p~720p, 최대 15초.',
      en: 'Generate AI videos with xAI Grok Imagine Video. 480p-720p, up to 15 seconds.',
      ja: 'xAI Grok Imagine VideoでAI動画を生成。480p〜720p、最大15秒。',
      zh: '使用xAI Grok Imagine Video生成AI视频。480p~720p，最长15秒。',
    },
    title: {
      ko: 'Grok Imagine Video AI 영상 생성 | gwanggo',
      en: 'Grok Imagine Video AI Generator | gwanggo',
      ja: 'Grok Imagine Video AI動画生成 | gwanggo',
      zh: 'Grok Imagine Video AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Grok Imagine Video', 'xAI', 'Grok 영상', 'AI 영상 생성'],
      en: ['Grok Imagine Video', 'xAI', 'Grok video', 'AI video generator'],
      ja: ['Grok Imagine Video', 'xAI', 'Grok動画', 'AI動画生成'],
      zh: ['Grok Imagine Video', 'xAI', 'Grok视频', 'AI视频生成'],
    },
    jsonLdDescription: {
      ko: 'xAI가 개발한 Text/Image to Video AI 모델. 480p~720p, 최대 15초.',
      en: 'Text/Image to Video AI model by xAI. 480p-720p, up to 15s.',
      ja: 'xAIが開発したText/Image to Video AIモデル。480p〜720p、最大15秒。',
      zh: 'xAI开发的Text/Image to Video AI模型。480p~720p，最长15秒。',
    },
  },
  'wan-2.6': {
    name: 'Wan 2.6',
    creator: 'Alibaba',
    description: {
      ko: 'Alibaba Wan 2.6으로 시네마틱 AI 영상 생성. 720p~1080p, 5~15초.',
      en: 'Generate cinematic AI videos with Alibaba Wan 2.6. 720p-1080p, 5-15 seconds.',
      ja: 'Alibaba Wan 2.6でシネマティックAI動画を生成。720p〜1080p、5〜15秒。',
      zh: '使用Alibaba Wan 2.6生成电影级AI视频。720p~1080p，5~15秒。',
    },
    title: {
      ko: 'Wan 2.6 AI 영상 생성 | gwanggo',
      en: 'Wan 2.6 AI Video Generator | gwanggo',
      ja: 'Wan 2.6 AI動画生成 | gwanggo',
      zh: 'Wan 2.6 AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Wan 2.6', 'Alibaba', '알리바바', 'AI 영상 생성', '시네마틱 영상'],
      en: ['Wan 2.6', 'Alibaba', 'AI video generator', 'cinematic video'],
      ja: ['Wan 2.6', 'Alibaba', 'アリババ', 'AI動画生成', 'シネマティック動画'],
      zh: ['Wan 2.6', 'Alibaba', '阿里巴巴', 'AI视频生成', '电影级视频'],
    },
    jsonLdDescription: {
      ko: 'Alibaba가 개발한 Text/Image to Video AI 모델. 720p~1080p, 5~15초.',
      en: 'Text/Image to Video AI model by Alibaba. 720p-1080p, 5-15s.',
      ja: 'Alibabaが開発したText/Image to Video AIモデル。720p〜1080p、5〜15秒。',
      zh: 'Alibaba开发的Text/Image to Video AI模型。720p~1080p，5~15秒。',
    },
  },
  'vidu-q3': {
    name: 'Vidu Q3',
    creator: 'Shengshu Technology',
    description: {
      ko: 'Shengshu Vidu Q3로 이미지에서 고품질 AI 영상 생성. 최대 1080p, 16초.',
      en: 'Generate AI videos from images with Shengshu Vidu Q3. Up to 1080p, 16 seconds.',
      ja: 'Shengshu Vidu Q3で画像から高品質AI動画を生成。最大1080p、16秒。',
      zh: '使用Shengshu Vidu Q3从图像生成高质量AI视频。最高1080p、16秒。',
    },
    title: {
      ko: 'Vidu Q3 AI 영상 생성 | gwanggo',
      en: 'Vidu Q3 AI Video Generator | gwanggo',
      ja: 'Vidu Q3 AI動画生成 | gwanggo',
      zh: 'Vidu Q3 AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Vidu Q3', 'Shengshu Technology', 'AI 영상 생성', '이미지 투 비디오'],
      en: ['Vidu Q3', 'Shengshu Technology', 'AI video generator', 'image to video'],
      ja: ['Vidu Q3', 'Shengshu Technology', 'AI動画生成', '画像から動画'],
      zh: ['Vidu Q3', '生数科技', 'AI视频生成', '图像生成视频'],
    },
    jsonLdDescription: {
      ko: 'Shengshu Technology가 개발한 이미지 투 비디오 AI 모델. 최대 1080p, 16초.',
      en: 'Image to Video AI model by Shengshu Technology. Up to 1080p, 16s.',
      ja: 'Shengshu Technologyが開発した画像から動画を生成するAIモデル。最大1080p、16秒。',
      zh: '生数科技开发的图像转视频AI模型。最高1080p、16秒。',
    },
  },
  'veo-3.1': {
    name: 'Veo 3.1',
    creator: 'Google',
    description: {
      ko: 'Google Veo 3.1로 AI 영상 생성. 720p~1080p, 오디오 자동 생성 지원.',
      en: 'Generate AI videos with Google Veo 3.1. 720p-1080p with automatic audio generation.',
      ja: 'Google Veo 3.1でAI動画を生成。720p〜1080p、オーディオ自動生成対応。',
      zh: '使用Google Veo 3.1生成AI视频。720p~1080p，支持自动音频生成。',
    },
    title: {
      ko: 'Veo 3.1 AI 영상 생성 - Google AI Video | gwanggo',
      en: 'Veo 3.1 AI Video Generator - Google AI Video | gwanggo',
      ja: 'Veo 3.1 AI動画生成 - Google AI Video | gwanggo',
      zh: 'Veo 3.1 AI视频生成 - Google AI Video | gwanggo',
    },
    keywords: {
      ko: ['Veo 3.1', 'Google AI Video', 'Google 영상 생성', 'AI 영상 생성', '오디오 포함 영상'],
      en: ['Veo 3.1', 'Google AI Video', 'AI video generator', 'video with audio'],
      ja: ['Veo 3.1', 'Google AI Video', 'Google動画生成', 'AI動画生成', 'オーディオ付き動画'],
      zh: ['Veo 3.1', 'Google AI Video', 'Google视频生成', 'AI视频生成', '带音频视频'],
    },
    jsonLdDescription: {
      ko: 'Google이 개발한 AI 영상 생성 모델. 720p~1080p, 오디오 자동 생성 지원.',
      en: 'AI video generation model by Google. 720p-1080p with automatic audio generation.',
      ja: 'Googleが開発したAI動画生成モデル。720p〜1080p、オーディオ自動生成対応。',
      zh: 'Google开发的AI视频生成模型。720p~1080p，支持自动音频生成。',
    },
  },
  'hailuo-02': {
    name: 'Hailuo-02',
    creator: 'MiniMax',
    description: {
      ko: 'MiniMax Hailuo-02로 AI 영상 생성. Standard/Pro 등급, 768p~1080p.',
      en: 'Generate AI videos with MiniMax Hailuo-02. Standard/Pro tiers, 768p-1080p.',
      ja: 'MiniMax Hailuo-02でAI動画を生成。Standard/Proティア、768p〜1080p。',
      zh: '使用MiniMax Hailuo-02生成AI视频。Standard/Pro等级，768p~1080p。',
    },
    title: {
      ko: 'Hailuo-02 AI 영상 생성 - MiniMax | gwanggo',
      en: 'Hailuo-02 AI Video Generator - MiniMax | gwanggo',
      ja: 'Hailuo-02 AI動画生成 - MiniMax | gwanggo',
      zh: 'Hailuo-02 AI视频生成 - MiniMax | gwanggo',
    },
    keywords: {
      ko: ['Hailuo-02', 'MiniMax', 'Hailuo AI', 'AI 영상 생성'],
      en: ['Hailuo-02', 'MiniMax', 'Hailuo AI', 'AI video generator'],
      ja: ['Hailuo-02', 'MiniMax', 'Hailuo AI', 'AI動画生成'],
      zh: ['Hailuo-02', 'MiniMax', 'Hailuo AI', 'AI视频生成'],
    },
    jsonLdDescription: {
      ko: 'MiniMax가 개발한 AI 영상 생성 모델. Standard/Pro 등급, 768p~1080p.',
      en: 'AI video generation model by MiniMax. Standard/Pro tiers, 768p-1080p.',
      ja: 'MiniMaxが開発したAI動画生成モデル。Standard/Proティア、768p〜1080p。',
      zh: 'MiniMax开发的AI视频生成模型。Standard/Pro等级，768p~1080p。',
    },
  },
  'ltx-2.3': {
    name: 'LTX 2.3',
    creator: 'Lightricks',
    description: {
      ko: 'Lightricks LTX 2.3으로 AI 영상 생성. 720p~1080p, 최대 20초. 오픈소스 모델.',
      en: 'Generate AI videos with Lightricks LTX 2.3. 720p-1080p, up to 20 seconds. Open source model.',
      ja: 'Lightricks LTX 2.3でAI動画を生成。720p〜1080p、最大20秒。オープンソースモデル。',
      zh: '使用Lightricks LTX 2.3生成AI视频。720p~1080p，最长20秒。开源模型。',
    },
    title: {
      ko: 'LTX 2.3 AI 영상 생성 - Lightricks | gwanggo',
      en: 'LTX 2.3 AI Video Generator - Lightricks | gwanggo',
      ja: 'LTX 2.3 AI動画生成 - Lightricks | gwanggo',
      zh: 'LTX 2.3 AI视频生成 - Lightricks | gwanggo',
    },
    keywords: {
      ko: ['LTX 2.3', 'Lightricks', 'AI 영상 생성', '오픈소스 AI 영상'],
      en: ['LTX 2.3', 'Lightricks', 'AI video generator', 'open source AI video'],
      ja: ['LTX 2.3', 'Lightricks', 'AI動画生成', 'オープンソースAI動画'],
      zh: ['LTX 2.3', 'Lightricks', 'AI视频生成', '开源AI视频'],
    },
    jsonLdDescription: {
      ko: 'Lightricks가 개발한 오픈소스 AI 영상 생성 모델. 720p~1080p, 최대 20초.',
      en: 'Open source AI video generation model by Lightricks. 720p-1080p, up to 20 seconds.',
      ja: 'Lightricksが開発したオープンソースAI動画生成モデル。720p〜1080p、最大20秒。',
      zh: 'Lightricks开发的开源AI视频生成模型。720p~1080p，最长20秒。',
    },
  },
}

const commonI18n: Record<Lang, {
  breadcrumbHome: string
  breadcrumbAiTools: string
  breadcrumbVideo: string
}> = {
  ko: { breadcrumbHome: '홈', breadcrumbAiTools: 'AI 도구', breadcrumbVideo: '영상 생성' },
  en: { breadcrumbHome: 'Home', breadcrumbAiTools: 'AI Tools', breadcrumbVideo: 'Video Generator' },
  ja: { breadcrumbHome: 'ホーム', breadcrumbAiTools: 'AIツール', breadcrumbVideo: '動画生成' },
  zh: { breadcrumbHome: '首页', breadcrumbAiTools: 'AI工具', breadcrumbVideo: '视频生成' },
}

interface Props {
  params: Promise<{ language: string; model: string }>
}

export async function generateStaticParams() {
  return validLanguages.flatMap((language) =>
    VIDEO_MODEL_SLUGS.map((model) => ({ language, model }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language, model } = await params

  if (!validLanguages.includes(language as Lang)) return {}
  if (!VIDEO_MODEL_SLUGS.includes(model as ModelSlug)) return {}

  const lang = language as Lang
  const slug = model as ModelSlug
  const m = MODELS[slug]

  const alternateLanguages: Record<string, string> = {}
  validLanguages.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/dashboard/ai-tools/${loc}/video/${slug}`
  })
  alternateLanguages['x-default'] = `${siteUrl}/dashboard/ai-tools/ko/video/${slug}`

  return {
    title: { absolute: m.title[lang] },
    description: m.description[lang],
    keywords: m.keywords[lang],
    alternates: {
      canonical: `/dashboard/ai-tools/${lang}/video/${slug}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[lang],
      alternateLocale: validLanguages.filter((l) => l !== lang).map((l) => ogLocale[l]),
      title: m.title[lang],
      description: m.description[lang],
      url: `${siteUrl}/dashboard/ai-tools/${lang}/video/${slug}`,
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

export default async function VideoModelPage({ params }: Props) {
  const { language, model } = await params

  if (!validLanguages.includes(language as Lang)) notFound()
  if (!VIDEO_MODEL_SLUGS.includes(model as ModelSlug)) notFound()

  const lang = language as Lang
  const slug = model as ModelSlug
  const m = MODELS[slug]
  const common = commonI18n[lang]

  const jsonLdApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: m.name,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    description: m.jsonLdDescription[lang],
    url: `${siteUrl}/dashboard/ai-tools/${lang}/video/${slug}`,
    creator: { '@type': 'Organization', name: m.creator },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: common.breadcrumbHome, item: `${siteUrl}/dashboard` },
      { '@type': 'ListItem', position: 2, name: common.breadcrumbAiTools },
      { '@type': 'ListItem', position: 3, name: common.breadcrumbVideo, item: `${siteUrl}/dashboard/ai-tools/${lang}/video` },
      { '@type': 'ListItem', position: 4, name: m.name, item: `${siteUrl}/dashboard/ai-tools/${lang}/video/${slug}` },
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
            <li><Link href={`/dashboard/ai-tools/${lang}/video`} className="hover:text-foreground transition-colors">{common.breadcrumbVideo}</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">{m.name}</li>
          </ol>
        </nav>
        <div>
          <h1 className="text-xl font-bold">{m.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{m.description[lang]}</p>
        </div>
      </div>

      <VideoGenerator initialModel={slug} />
    </>
  )
}
