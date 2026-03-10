import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowLeft, ArrowRight, Check, ChevronRight, Layers, Ratio, CreditCard, HelpCircle, ExternalLink } from 'lucide-react'
import { IMAGE_MODELS, IMAGE_MODEL_SLUGS, isValidImageModelSlug } from '@/lib/i18n/model-pages'
import { locales, isValidLocale, type Locale, htmlLang, ogLocale, getBreadcrumbJsonLd } from '@/lib/i18n/seo'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

interface Props {
  params: Promise<{ locale: string; model: string }>
}

// ---------------------------------------------------------------------------
// Static Params
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  const params: { locale: string; model: string }[] = []
  for (const locale of locales) {
    for (const model of IMAGE_MODEL_SLUGS) {
      params.push({ locale, model })
    }
  }
  return params
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, model } = await params
  if (!isValidLocale(locale) || !isValidImageModelSlug(model)) notFound()

  const modelData = IMAGE_MODELS[model]
  const seo = modelData.seo[locale]

  const alternateLanguages: Record<string, string> = {}
  locales.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/${loc}/tools/image/${model}`
  })
  alternateLanguages['x-default'] = `${siteUrl}/ko/tools/image/${model}`

  return {
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: 'gwanggo', url: siteUrl }],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}/tools/image/${model}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      url: `${siteUrl}/${locale}/tools/image/${model}`,
      title: seo.title,
      description: seo.description,
      siteName: 'gwanggo',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
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

// ---------------------------------------------------------------------------
// i18n labels
// ---------------------------------------------------------------------------

const i18nLabels: Record<Locale, {
  home: string
  imageGenerator: string
  createdBy: string
  tryModel: string
  featuresTitle: string
  specsTitle: string
  mode: string
  resolutions: string
  credits: string
  faqTitle: string
  otherModels: string
  overviewLink: string
  backToOverview: string
  ctaTitle: string
  ctaDesc: string
  ctaButton: string
  pricingCta: string
}> = {
  ko: {
    home: '홈',
    imageGenerator: 'AI 이미지 생성',
    createdBy: '개발사',
    tryModel: '사용해보기',
    featuresTitle: '주요 기능',
    specsTitle: '사양',
    mode: '모드',
    resolutions: '종횡비',
    credits: '크레딧',
    faqTitle: '자주 묻는 질문',
    otherModels: '다른 이미지 모델',
    overviewLink: 'AI 이미지 생성 전체 보기',
    backToOverview: 'AI 이미지 생성 도구로 돌아가기',
    ctaTitle: '지금 바로 시작하세요',
    ctaDesc: '회원가입 시 15크레딧 무료 제공. 웹 브라우저에서 바로 사용 가능합니다.',
    ctaButton: '무료로 시작하기',
    pricingCta: '요금제 보기',
  },
  en: {
    home: 'Home',
    imageGenerator: 'AI Image Generator',
    createdBy: 'Created by',
    tryModel: 'Try it now',
    featuresTitle: 'Key Features',
    specsTitle: 'Specifications',
    mode: 'Modes',
    resolutions: 'Aspect Ratios',
    credits: 'Credits',
    faqTitle: 'Frequently Asked Questions',
    otherModels: 'Other Image Models',
    overviewLink: 'View all AI image models',
    backToOverview: 'Back to AI Image Generator',
    ctaTitle: 'Get started now',
    ctaDesc: '15 free credits on sign up. Works directly in your browser.',
    ctaButton: 'Start for Free',
    pricingCta: 'View Pricing',
  },
  ja: {
    home: 'ホーム',
    imageGenerator: 'AI画像生成',
    createdBy: '開発元',
    tryModel: '使ってみる',
    featuresTitle: '主な機能',
    specsTitle: '仕様',
    mode: 'モード',
    resolutions: 'アスペクト比',
    credits: 'クレジット',
    faqTitle: 'よくある質問',
    otherModels: '他の画像モデル',
    overviewLink: 'AI画像生成モデル一覧',
    backToOverview: 'AI画像生成ツールに戻る',
    ctaTitle: '今すぐ始めましょう',
    ctaDesc: '会員登録で15クレジット無料。ブラウザで直接使用可能。',
    ctaButton: '無料で始める',
    pricingCta: '料金プランを見る',
  },
  zh: {
    home: '首页',
    imageGenerator: 'AI图片生成',
    createdBy: '开发商',
    tryModel: '立即试用',
    featuresTitle: '主要功能',
    specsTitle: '规格',
    mode: '模式',
    resolutions: '宽高比',
    credits: '积分',
    faqTitle: '常见问题',
    otherModels: '其他图片模型',
    overviewLink: '查看所有AI图片模型',
    backToOverview: '返回AI图片生成工具',
    ctaTitle: '立即开始',
    ctaDesc: '注册即送15免费积分。网页浏览器直接使用。',
    ctaButton: '免费开始',
    pricingCta: '查看价格',
  },
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function ImageModelPage({ params }: Props) {
  const { locale, model } = await params
  if (!isValidLocale(locale) || !isValidImageModelSlug(model)) notFound()

  const modelData = IMAGE_MODELS[model]
  const seo = modelData.seo[locale]
  const t = i18nLabels[locale]

  // Other models for cross-linking
  const otherModels = IMAGE_MODEL_SLUGS.filter((s) => s !== model).map((s) => IMAGE_MODELS[s])

  // ---------------------------------------------------------------------------
  // JSON-LD: SoftwareApplication
  // ---------------------------------------------------------------------------
  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: modelData.name,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    description: seo.description,
    url: `${siteUrl}/${locale}/tools/image/${model}`,
    inLanguage: htmlLang[locale],
    creator: {
      '@type': 'Organization',
      name: modelData.creator,
    },
    isPartOf: {
      '@type': 'WebApplication',
      name: 'gwanggo',
      url: `${siteUrl}/${locale}`,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: locale === 'ko' ? 'KRW' : locale === 'ja' ? 'JPY' : locale === 'zh' ? 'CNY' : 'USD',
    },
  }

  // ---------------------------------------------------------------------------
  // JSON-LD: FAQPage
  // ---------------------------------------------------------------------------
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: seo.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  // ---------------------------------------------------------------------------
  // JSON-LD: BreadcrumbList
  // ---------------------------------------------------------------------------
  const breadcrumbJsonLd = getBreadcrumbJsonLd(siteUrl, [
    { name: t.home, url: `${siteUrl}/${locale}` },
    { name: t.imageGenerator, url: `${siteUrl}/${locale}/tools/image` },
    { name: modelData.name, url: `${siteUrl}/${locale}/tools/image/${model}` },
  ])

  return (
    <>
      {/* JSON-LD Scripts */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-4 pt-6">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
                {t.home}
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5" /></li>
            <li>
              <Link href={`/${locale}/tools/image`} className="hover:text-foreground transition-colors">
                {t.imageGenerator}
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-foreground font-medium">{modelData.name}</li>
          </ol>
        </nav>

        {/* Back to overview */}
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <Link
            href={`/${locale}/tools/image`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.backToOverview}
          </Link>
        </div>

        {/* ================================================================ */}
        {/* Hero Section */}
        {/* ================================================================ */}
        <section className="relative overflow-hidden py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              {t.createdBy}: {modelData.creator}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {modelData.name}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {seo.subtitle}
            </p>
            <p className="mt-4 text-sm text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {seo.description}
            </p>
            <Link
              href={`/dashboard/ai-tools/${locale}/image`}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-8 py-3 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              {t.tryModel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Features Section - 2x3 grid */}
        {/* ================================================================ */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t.featuresTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {seo.features.map((feature, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-6 flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/* Specs Section */}
        {/* ================================================================ */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t.specsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Modes */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{t.mode}</h3>
              </div>
              <ul className="space-y-1.5">
                {modelData.modes.map((mode) => (
                  <li key={mode} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {mode}
                  </li>
                ))}
              </ul>
            </div>

            {/* Resolutions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Ratio className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{t.resolutions}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelData.resolutions.map((res) => (
                  <span
                    key={res}
                    className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>

            {/* Credits */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{t.credits}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{modelData.creditSummary[locale]}</p>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FAQ Section */}
        {/* ================================================================ */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-8">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t.faqTitle}</h2>
          </div>
          <div className="space-y-6">
            {seo.faq.map((item) => (
              <div key={item.q} className="border-b border-border/40 pb-6 last:border-0">
                <h3 className="text-base font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/* CTA Section */}
        {/* ================================================================ */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">{t.ctaTitle}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">{t.ctaDesc}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/dashboard/ai-tools/${locale}/image`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-8 py-3 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                {t.ctaButton}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {t.pricingCta}
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Cross-links Section */}
        {/* ================================================================ */}
        <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{t.otherModels}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {otherModels.map((m) => (
              <Link
                key={m.slug}
                href={`/${locale}/tools/image/${m.slug}`}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors group"
              >
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                  {m.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{m.creator}</p>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <span>{m.modes.join(', ')}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
          <Link
            href={`/${locale}/tools/image`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t.overviewLink}
          </Link>
        </section>
      </main>
    </>
  )
}
