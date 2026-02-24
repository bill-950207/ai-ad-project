import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ImagePlus, Sparkles, ArrowRight } from 'lucide-react'
import {
  locales,
  isValidLocale,
  ogLocale,
  imageToolSeoData,
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

  const data = imageToolSeoData[locale]
  const alternateLanguages: Record<string, string> = {}
  locales.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/${loc}/tools/image`
  })
  alternateLanguages['x-default'] = `${siteUrl}/ko/tools/image`

  return {
    title: { absolute: data.title },
    description: data.description,
    keywords: data.keywords,
    authors: [{ name: 'gwanggo', url: siteUrl }],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}/tools/image`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      url: `${siteUrl}/${locale}/tools/image`,
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
    heading: 'AI 이미지 생성',
    subheading: '최신 AI 모델로 텍스트에서 이미지 생성, 이미지 편집까지',
    cta: '무료로 시작하기',
    models: [
      {
        name: 'Seedream 4.5',
        badge: 'ByteDance',
        features: ['이미지 편집 (Image Edit)', '참조 이미지 기반 변환', '기본/고화질 선택'],
        specs: '8가지 화면 비율 · 기본·고화질 · 참조 이미지 필수',
      },
      {
        name: 'Z-Image',
        badge: 'Text to Image',
        features: ['텍스트 → 이미지', '프롬프트만으로 생성', '빠른 생성 속도'],
        specs: '5가지 화면 비율 · 1크레딧 · 참조 이미지 불필요',
      },
    ],
    faq: [
      { q: 'Seedream 4.5는 어떤 모델인가요?', a: 'ByteDance(바이트댄스)가 개발한 AI 이미지 편집 모델입니다. 참조 이미지를 업로드하고 텍스트 프롬프트로 지시하면 이미지를 원하는 대로 편집할 수 있습니다. 1:1부터 21:9까지 8가지 화면 비율과 기본/고화질을 지원합니다.' },
      { q: 'Z-Image는 어떤 모델인가요?', a: 'Z-Image는 Text-to-Image AI 모델로, 텍스트 프롬프트만 입력하면 고품질 이미지를 생성합니다. 참조 이미지 없이도 사용할 수 있어 빠르게 아이디어를 시각화할 수 있습니다.' },
      { q: '비용은 얼마인가요?', a: '회원가입 시 무료 크레딧이 제공됩니다. Seedream 4.5는 화질에 따라 2~3크레딧, Z-Image는 1크레딧입니다.' },
    ],
  },
  en: {
    heading: 'AI Image Generator',
    subheading: 'Generate images from text and edit with reference images using cutting-edge AI',
    cta: 'Start for Free',
    models: [
      {
        name: 'Seedream 4.5',
        badge: 'ByteDance',
        features: ['Image editing', 'Reference image-based transformation', 'Basic/High quality'],
        specs: '8 aspect ratios · Basic & High quality · Reference image required',
      },
      {
        name: 'Z-Image',
        badge: 'Text to Image',
        features: ['Text → Image', 'Prompt-only generation', 'Fast generation speed'],
        specs: '5 aspect ratios · 1 credit · No reference image needed',
      },
    ],
    faq: [
      { q: 'What is Seedream 4.5?', a: 'Seedream 4.5 is an AI image editing model developed by ByteDance. Upload a reference image and describe your edits with text prompts. Supports 8 aspect ratios from 1:1 to 21:9 with basic and high quality options.' },
      { q: 'What is Z-Image?', a: 'Z-Image is a Text-to-Image AI model. Simply enter a text prompt to generate high-quality images. No reference image required—perfect for quickly visualizing ideas.' },
      { q: 'How much does it cost?', a: 'Free credits are provided upon sign up. Seedream 4.5 costs 2–3 credits depending on quality, and Z-Image costs 1 credit per generation.' },
    ],
  },
  ja: {
    heading: 'AI画像生成',
    subheading: '最新AIモデルでテキストから画像生成、画像編集まで',
    cta: '無料で始める',
    models: [
      {
        name: 'Seedream 4.5',
        badge: 'ByteDance（バイトダンス）',
        features: ['画像編集（Image Edit）', '参照画像ベースの変換', '基本/高画質選択'],
        specs: '8種類のアスペクト比 · 基本・高画質 · 参照画像必須',
      },
      {
        name: 'Z-Image',
        badge: 'Text to Image',
        features: ['テキスト→画像', 'プロンプトのみで生成', '高速生成'],
        specs: '5種類のアスペクト比 · 1クレジット · 参照画像不要',
      },
    ],
    faq: [
      { q: 'Seedream 4.5とは？', a: 'ByteDance（バイトダンス）が開発したAI画像編集モデルです。参照画像をアップロードし、テキストプロンプトで指示すると画像を自在に編集できます。1:1から21:9まで8種類のアスペクト比と基本/高画質に対応。' },
      { q: 'Z-Imageとは？', a: 'Z-ImageはText-to-Image AIモデルで、テキストプロンプトを入力するだけで高品質な画像を生成します。参照画像なしで使用でき、アイデアを素早く視覚化できます。' },
      { q: '料金はいくらですか？', a: '会員登録時に無料クレジットが提供されます。Seedream 4.5は画質に応じて2〜3クレジット、Z-Imageは1クレジットです。' },
    ],
  },
  zh: {
    heading: 'AI图片生成',
    subheading: '使用最新AI模型从文字生成图片、编辑图片',
    cta: '免费开始',
    models: [
      {
        name: 'Seedream 4.5',
        badge: 'ByteDance（字节跳动）',
        features: ['图片编辑（Image Edit）', '参考图片变换', '基础/高画质选择'],
        specs: '8种画面比例 · 基础·高画质 · 需要参考图片',
      },
      {
        name: 'Z-Image',
        badge: 'Text to Image',
        features: ['文字→图片', '仅需提示词生成', '快速生成'],
        specs: '5种画面比例 · 1积分 · 无需参考图片',
      },
    ],
    faq: [
      { q: 'Seedream 4.5是什么模型？', a: 'Seedream 4.5是ByteDance（字节跳动）开发的AI图片编辑模型。上传参考图片并通过文字提示进行编辑。支持从1:1到21:9的8种画面比例和基础/高画质选项。' },
      { q: 'Z-Image是什么模型？', a: 'Z-Image是Text-to-Image AI模型，只需输入文字提示即可生成高质量图片。无需参考图片，非常适合快速将想法可视化。' },
      { q: '费用是多少？', a: '注册时提供免费积分。Seedream 4.5根据画质消耗2~3积分，Z-Image每次1积分。' },
    ],
  },
}

export default async function ImageToolPage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const t = content[locale]
  const toolJsonLd = getToolJsonLd(locale, siteUrl, 'image')
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
    { name: t.heading, url: `${siteUrl}/${locale}/tools/image` },
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
              <ImagePlus className="w-4 h-4" />
              AI Image Generation
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              {t.heading}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.subheading}
            </p>
            <Link
              href="/dashboard/ai-tools/image"
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
