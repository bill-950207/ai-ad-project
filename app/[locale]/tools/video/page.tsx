import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Film, Sparkles, ArrowRight } from 'lucide-react'
import {
  locales,
  isValidLocale,
  ogLocale,
  videoToolSeoData,
  getToolJsonLd,
  getBreadcrumbJsonLd,
  type Locale,
} from '@/lib/i18n/seo'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

interface Props {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const data = videoToolSeoData[locale]
  const alternateLanguages: Record<string, string> = {}
  locales.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/${loc}/tools/video`
  })
  alternateLanguages['x-default'] = `${siteUrl}/ko/tools/video`

  return {
    title: { absolute: data.title },
    description: data.description,
    keywords: data.keywords,
    authors: [{ name: 'gwanggo', url: siteUrl }],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}/tools/video`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      url: `${siteUrl}/${locale}/tools/video`,
      title: data.ogTitle,
      description: data.ogDescription,
      siteName: 'gwanggo',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: data.ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.ogTitle,
      description: data.ogDescription,
      images: ['/og-image.png'],
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

const content: Record<Locale, {
  heading: string
  subheading: string
  cta: string
  models: Array<{
    name: string
    badge: string
    features: string[]
    specs: string
  }>
  faq: Array<{ q: string; a: string }>
}> = {
  ko: {
    heading: 'AI 영상 생성',
    subheading: '최신 AI 모델로 텍스트와 이미지에서 고품질 영상을 생성하세요',
    cta: '무료로 시작하기',
    models: [
      {
        name: 'Seedance 1.5 Pro',
        badge: 'ByteDance',
        features: ['텍스트 → 영상', '이미지 → 영상', '오디오 자동 생성'],
        specs: '480p~720p · 4~12초 · 6가지 화면 비율',
      },
      {
        name: 'Vidu Q3',
        badge: 'Shengshu Technology (生数科技)',
        features: ['이미지 → 영상', '최대 1080p 고해상도', '움직임 강도 조절'],
        specs: '540p~1080p · 1~16초 · 오디오 지원',
      },
    ],
    faq: [
      { q: 'Seedance 1.5 Pro는 어떤 모델인가요?', a: 'ByteDance(바이트댄스)가 개발한 최신 Text-to-Video / Image-to-Video AI 모델입니다. 텍스트 프롬프트만으로 영상을 생성하거나, 참조 이미지를 함께 사용하여 더 정확한 영상을 만들 수 있습니다.' },
      { q: 'Vidu Q3는 어떤 모델인가요?', a: 'Shengshu Technology(生数科技)가 개발한 Image-to-Video AI 모델입니다. 이미지 한 장에서 최대 1080p, 16초 길이의 고품질 영상을 생성할 수 있으며, 움직임의 강도를 세밀하게 조절할 수 있습니다.' },
      { q: '비용은 얼마인가요?', a: '회원가입 시 무료 크레딧이 제공됩니다. Seedance는 해상도와 길이에 따라 크레딧이 차감되며, Vidu Q3도 해상도·길이 기반으로 크레딧이 사용됩니다.' },
    ],
  },
  en: {
    heading: 'AI Video Generator',
    subheading: 'Generate high-quality videos from text and images with cutting-edge AI models',
    cta: 'Start for Free',
    models: [
      {
        name: 'Seedance 1.5 Pro',
        badge: 'ByteDance',
        features: ['Text → Video', 'Image → Video', 'Auto audio generation'],
        specs: '480p–720p · 4–12 sec · 6 aspect ratios',
      },
      {
        name: 'Vidu Q3',
        badge: 'Shengshu Technology',
        features: ['Image → Video', 'Up to 1080p HD', 'Movement amplitude control'],
        specs: '540p–1080p · 1–16 sec · Audio support',
      },
    ],
    faq: [
      { q: 'What is Seedance 1.5 Pro?', a: 'Seedance 1.5 Pro is a state-of-the-art Text-to-Video and Image-to-Video AI model developed by ByteDance. Generate videos from text prompts alone, or use reference images for more precise results.' },
      { q: 'What is Vidu Q3?', a: 'Vidu Q3 is an Image-to-Video AI model by Shengshu Technology. It generates up to 1080p, 16-second high-quality videos from a single image with fine-grained movement control.' },
      { q: 'How much does it cost?', a: 'Free credits are provided upon sign up. Credits are consumed based on resolution and duration for both Seedance and Vidu Q3.' },
    ],
  },
  ja: {
    heading: 'AI動画生成',
    subheading: '最新AIモデルでテキストと画像から高品質な動画を生成',
    cta: '無料で始める',
    models: [
      {
        name: 'Seedance 1.5 Pro',
        badge: 'ByteDance（バイトダンス）',
        features: ['テキスト→動画', '画像→動画', 'オーディオ自動生成'],
        specs: '480p〜720p · 4〜12秒 · 6種類のアスペクト比',
      },
      {
        name: 'Vidu Q3',
        badge: 'Shengshu Technology（生数科技）',
        features: ['画像→動画', '最大1080p高解像度', 'モーション強度調整'],
        specs: '540p〜1080p · 1〜16秒 · オーディオ対応',
      },
    ],
    faq: [
      { q: 'Seedance 1.5 Proとは？', a: 'ByteDance（バイトダンス）が開発した最新のText-to-Video / Image-to-Video AIモデルです。テキストプロンプトだけで動画を生成したり、参照画像を使ってより精度の高い動画を作成できます。' },
      { q: 'Vidu Q3とは？', a: 'Shengshu Technology（生数科技）が開発したImage-to-Video AIモデルです。1枚の画像から最大1080p、16秒の高品質動画を生成でき、モーションの強度を細かく調整できます。' },
      { q: '料金はいくらですか？', a: '会員登録時に無料クレジットが提供されます。SeedanceとVidu Q3ともに解像度と長さに応じてクレジットが消費されます。' },
    ],
  },
  zh: {
    heading: 'AI视频生成',
    subheading: '使用最新AI模型从文字和图片生成高质量视频',
    cta: '免费开始',
    models: [
      {
        name: 'Seedance 1.5 Pro',
        badge: 'ByteDance（字节跳动）',
        features: ['文字→视频', '图片→视频', '自动生成音频'],
        specs: '480p~720p · 4~12秒 · 6种画面比例',
      },
      {
        name: 'Vidu Q3',
        badge: 'Shengshu Technology（生数科技）',
        features: ['图片→视频', '最高1080p高清', '运动幅度控制'],
        specs: '540p~1080p · 1~16秒 · 支持音频',
      },
    ],
    faq: [
      { q: 'Seedance 1.5 Pro是什么模型？', a: 'Seedance 1.5 Pro是ByteDance（字节跳动）开发的最新Text-to-Video / Image-to-Video AI模型。可以仅通过文字提示生成视频，也可以结合参考图片制作更精确的视频。' },
      { q: 'Vidu Q3是什么模型？', a: 'Vidu Q3是Shengshu Technology（生数科技）开发的Image-to-Video AI模型。可以从一张图片生成最高1080p、16秒的高质量视频，并能精细控制运动幅度。' },
      { q: '费用是多少？', a: '注册时提供免费积分。Seedance和Vidu Q3都根据分辨率和时长消耗积分。' },
    ],
  },
}

export default async function VideoToolPage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const t = content[locale]
  const toolJsonLd = getToolJsonLd(locale, siteUrl, 'video')
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
  const breadcrumbJsonLd = getBreadcrumbJsonLd(siteUrl, [
    { name: locale === 'ko' ? '홈' : locale === 'ja' ? 'ホーム' : locale === 'zh' ? '首页' : 'Home', url: `${siteUrl}/${locale}` },
    { name: t.heading, url: `${siteUrl}/${locale}/tools/video` },
  ])

  return (
    <>
      {toolJsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
              <Film className="w-4 h-4" />
              AI Video Generation
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              {t.heading}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.subheading}
            </p>
            <Link
              href="/dashboard/ai-tools/video"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-8 py-3 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              {t.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Models */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.models.map((model) => (
              <article
                key={model.name}
                className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-foreground">{model.name}</h2>
                  <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    {model.badge}
                  </span>
                </div>
                <ul className="space-y-2 mb-4">
                  {model.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                  {model.specs}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ (SEO) */}
        <section className="mx-auto max-w-3xl px-6 pb-20">
          <div className="space-y-6">
            {t.faq.map((item) => (
              <div key={item.q}>
                <h3 className="text-base font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
