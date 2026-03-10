import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowLeft, Check, ChevronRight, Play, Clock, Monitor, Film, Zap, Layers, Wand2 } from 'lucide-react'
import { VIDEO_MODELS, VIDEO_MODEL_SLUGS, isValidVideoModelSlug } from '@/lib/i18n/model-pages'
import { locales, isValidLocale, type Locale, htmlLang, ogLocale, getBreadcrumbJsonLd } from '@/lib/i18n/seo'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

interface Props {
  params: Promise<{ locale: string; model: string }>
}

// ---------------------------------------------------------------------------
// Static params: all locale x model combinations
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    VIDEO_MODEL_SLUGS.map((model) => ({ locale, model })),
  )
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, model } = await params
  if (!isValidLocale(locale)) notFound()
  if (!isValidVideoModelSlug(model)) notFound()

  const data = VIDEO_MODELS[model]
  const seo = data.seo[locale]

  const alternateLanguages: Record<string, string> = {}
  locales.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/${loc}/tools/video/${model}`
  })
  alternateLanguages['x-default'] = `${siteUrl}/ko/tools/video/${model}`

  return {
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: 'gwanggo', url: siteUrl }],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}/tools/video/${model}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      url: `${siteUrl}/${locale}/tools/video/${model}`,
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
  breadcrumbHome: string
  breadcrumbVideo: string
  backToOverview: string
  createdBy: string
  featuresTitle: string
  specsTitle: string
  specsModes: string
  specsResolutions: string
  specsDuration: string
  specsCredits: string
  faqTitle: string
  ctaTitle: string
  ctaButton: string
  ctaDesc: string
  otherModelsTitle: string
  overviewLink: string
  pricingCta: string
}> = {
  ko: {
    breadcrumbHome: '홈',
    breadcrumbVideo: 'AI 영상 생성',
    backToOverview: '영상 모델 전체 보기',
    createdBy: '개발사',
    featuresTitle: '주요 기능',
    specsTitle: '상세 스펙',
    specsModes: '지원 모드',
    specsResolutions: '해상도',
    specsDuration: '영상 길이',
    specsCredits: '크레딧 비용',
    faqTitle: '자주 묻는 질문',
    ctaTitle: '지금 바로 시작하세요',
    ctaButton: '무료로 시작하기',
    ctaDesc: '회원가입 시 20크레딧 무료 제공',
    otherModelsTitle: '다른 AI 영상 모델',
    overviewLink: '모든 AI 영상 모델 비교하기',
    pricingCta: '요금제 보기',
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbVideo: 'AI Video Generator',
    backToOverview: 'View all video models',
    createdBy: 'Created by',
    featuresTitle: 'Key Features',
    specsTitle: 'Specifications',
    specsModes: 'Modes',
    specsResolutions: 'Resolutions',
    specsDuration: 'Duration',
    specsCredits: 'Credits',
    faqTitle: 'Frequently Asked Questions',
    ctaTitle: 'Get started now',
    ctaButton: 'Start for Free',
    ctaDesc: '20 free credits on sign up',
    otherModelsTitle: 'Other AI Video Models',
    overviewLink: 'Compare all AI video models',
    pricingCta: 'View Pricing',
  },
  ja: {
    breadcrumbHome: 'ホーム',
    breadcrumbVideo: 'AI動画生成',
    backToOverview: '動画モデル一覧を見る',
    createdBy: '開発元',
    featuresTitle: '主な機能',
    specsTitle: '詳細スペック',
    specsModes: '対応モード',
    specsResolutions: '解像度',
    specsDuration: '動画長',
    specsCredits: 'クレジット',
    faqTitle: 'よくある質問',
    ctaTitle: '今すぐ始めましょう',
    ctaButton: '無料で始める',
    ctaDesc: '会員登録で20クレジット無料',
    otherModelsTitle: '他のAI動画モデル',
    overviewLink: 'すべてのAI動画モデルを比較する',
    pricingCta: '料金プランを見る',
  },
  zh: {
    breadcrumbHome: '首页',
    breadcrumbVideo: 'AI视频生成',
    backToOverview: '查看所有视频模型',
    createdBy: '开发商',
    featuresTitle: '核心功能',
    specsTitle: '详细规格',
    specsModes: '支持模式',
    specsResolutions: '分辨率',
    specsDuration: '视频时长',
    specsCredits: '积分费用',
    faqTitle: '常见问题',
    ctaTitle: '立即开始',
    ctaButton: '免费开始',
    ctaDesc: '注册即送20免费积分',
    otherModelsTitle: '其他AI视频模型',
    overviewLink: '比较所有AI视频模型',
    pricingCta: '查看价格',
  },
}

// Feature icons mapped by index position (6 features)
const featureIcons = [Film, Play, Monitor, Clock, Wand2, Layers]

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function VideoModelPage({ params }: Props) {
  const { locale, model: modelSlug } = await params
  if (!isValidLocale(locale)) notFound()
  if (!isValidVideoModelSlug(modelSlug)) notFound()

  const model = VIDEO_MODELS[modelSlug]
  const seo = model.seo[locale]
  const t = i18nLabels[locale]

  // ---- JSON-LD: SoftwareApplication ----
  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: model.name,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    description: seo.description,
    url: `${siteUrl}/${locale}/tools/video/${modelSlug}`,
    inLanguage: htmlLang[locale],
    creator: {
      '@type': 'Organization',
      name: model.creator,
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

  // ---- JSON-LD: FAQPage ----
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: seo.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  // ---- JSON-LD: BreadcrumbList ----
  const breadcrumbJsonLd = getBreadcrumbJsonLd(siteUrl, [
    { name: t.breadcrumbHome, url: `${siteUrl}/${locale}` },
    { name: t.breadcrumbVideo, url: `${siteUrl}/${locale}/tools/video` },
    { name: model.name, url: `${siteUrl}/${locale}/tools/video/${modelSlug}` },
  ])

  // Other models for cross-links
  const otherModels = VIDEO_MODEL_SLUGS.filter((s) => s !== modelSlug).map(
    (s) => VIDEO_MODELS[s],
  )

  return (
    <>
      {/* JSON-LD scripts */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="min-h-screen bg-background">
        {/* Back to overview + Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-4 pt-6">
          <div className="flex items-center justify-between">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
                  {t.breadcrumbHome}
                </Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
              <li>
                <Link href={`/${locale}/tools/video`} className="hover:text-foreground transition-colors">
                  {t.breadcrumbVideo}
                </Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
              <li className="text-foreground font-medium">{model.name}</li>
            </ol>
            <Link
              href={`/${locale}/tools/video`}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.backToOverview}
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            {/* Creator badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              {t.createdBy}: {model.creator}
            </div>

            {/* Model name */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {model.name}
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {seo.subtitle}
            </p>

            {/* Mode badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {model.modes.map((mode) => (
                <span
                  key={mode}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  <Play className="w-3.5 h-3.5" />
                  {mode}
                </span>
              ))}
            </div>

            {/* Key specs: duration + resolutions */}
            {model.duration && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  {model.duration}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-primary" />
                  {model.resolutions.join(' / ')}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Features Section - 2x3 grid */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t.featuresTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seo.features.map((feature, i) => {
                const Icon = featureIcons[i % featureIcons.length]
                return (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-6 flex items-start gap-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{feature}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Specs Section */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t.specsTitle}</h2>
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Modes */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.specsModes}</h3>
                  <div className="flex flex-wrap gap-2">
                    {model.modes.map((mode) => (
                      <span key={mode} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resolutions */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.specsResolutions}</h3>
                  <div className="flex flex-wrap gap-2">
                    {model.resolutions.map((res) => (
                      <span key={res} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground font-medium">
                        <Monitor className="w-3.5 h-3.5 text-primary" />
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                {model.duration && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.specsDuration}</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground font-medium">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {model.duration}
                    </span>
                  </div>
                )}

                {/* Credits */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.specsCredits}</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground font-medium">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    {model.creditSummary[locale]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t.faqTitle}</h2>
            <div className="space-y-6">
              {seo.faq.map((item) => (
                <div key={item.q} className="border-b border-border/40 pb-6 last:border-0">
                  <h3 className="text-base font-semibold text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                {t.ctaTitle}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">{t.ctaDesc}</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/dashboard/ai-tools/${locale}/video`}
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
          </div>
        </section>

        {/* Cross-links Section */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t.otherModelsTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherModels.map((m) => (
                <Link
                  key={m.slug}
                  href={`/${locale}/tools/video/${m.slug}`}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{m.name}</h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.creator}</span>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {m.modes.map((mode) => (
                      <span key={mode} className="inline-flex items-center gap-1">
                        <Play className="w-3 h-3" /> {mode}
                      </span>
                    ))}
                    {m.duration && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {m.duration}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Monitor className="w-3 h-3" /> {m.resolutions.join(', ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Overview link */}
            <div className="mt-6 text-center">
              <Link
                href={`/${locale}/tools/video`}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.overviewLink}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
