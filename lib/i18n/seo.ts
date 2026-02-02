/**
 * 다국어 SEO 메타데이터
 */

export const locales = ['ko', 'en', 'ja', 'zh'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ko'

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

/** 언어별 HTML lang 속성 */
export const htmlLang: Record<Locale, string> = {
  ko: 'ko',
  en: 'en',
  ja: 'ja',
  zh: 'zh-CN',
}

/** 언어별 Open Graph locale */
export const ogLocale: Record<Locale, string> = {
  ko: 'ko_KR',
  en: 'en_US',
  ja: 'ja_JP',
  zh: 'zh_CN',
}

/** 언어별 SEO 메타데이터 */
export const seoData: Record<Locale, {
  title: string
  titleTemplate: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  twitterTitle: string
  twitterDescription: string
}> = {
  ko: {
    title: 'gwanggo - AI 광고 이미지·영상 생성 플랫폼',
    titleTemplate: '%s | gwanggo',
    description: 'AI로 광고 이미지와 영상을 몇 분 만에 생성. 아바타, 제품 광고, 음악까지 원클릭 제작.',
    keywords: [
      'AI 광고', 'AI 광고 제작', 'AI 이미지 생성', 'AI 영상 광고', 'AI 아바타',
      '광고 자동화', '마케팅 AI', '제품 광고', 'SNS 광고', '인스타그램 광고',
      '페이스북 광고', '숏폼 광고', 'AI 마케팅 도구', '광고 콘텐츠 생성', '이커머스 광고',
    ],
    ogTitle: 'gwanggo - AI 광고 콘텐츠 생성 플랫폼',
    ogDescription: 'AI로 전문적인 광고 이미지와 영상을 몇 분 만에 생성하세요. 마케터와 크리에이터를 위한 올인원 AI 광고 솔루션.',
    twitterTitle: 'gwanggo - AI 광고 콘텐츠 생성 플랫폼',
    twitterDescription: 'AI로 전문적인 광고 이미지와 영상을 몇 분 만에 생성하세요.',
  },
  en: {
    title: 'gwanggo - AI Ad Image & Video Generator',
    titleTemplate: '%s | gwanggo',
    description: 'Create ad images and videos in minutes with AI. One-click production of avatars, product ads, and music.',
    keywords: [
      'AI advertising', 'AI ad creation', 'AI image generation', 'AI video ads', 'AI avatar',
      'ad automation', 'marketing AI', 'product ads', 'social media ads', 'Instagram ads',
      'Facebook ads', 'short-form ads', 'AI marketing tools', 'ad content generation', 'ecommerce ads',
    ],
    ogTitle: 'gwanggo - AI Ad Content Creation Platform',
    ogDescription: 'Create professional ad images and videos in minutes with AI. All-in-one AI advertising solution for marketers and creators.',
    twitterTitle: 'gwanggo - AI Ad Content Creation Platform',
    twitterDescription: 'Create professional ad images and videos in minutes with AI.',
  },
  ja: {
    title: 'gwanggo - AI広告画像・動画生成プラットフォーム',
    titleTemplate: '%s | gwanggo',
    description: 'AIで広告画像と動画を数分で作成。アバター、商品広告、音楽までワンクリックで制作。',
    keywords: [
      'AI広告', 'AI広告制作', 'AI画像生成', 'AI動画広告', 'AIアバター',
      '広告自動化', 'マーケティングAI', '商品広告', 'SNS広告', 'Instagram広告',
      'Facebook広告', 'ショート動画広告', 'AIマーケティングツール', '広告コンテンツ生成', 'EC広告',
    ],
    ogTitle: 'gwanggo - AI広告コンテンツ生成プラットフォーム',
    ogDescription: 'AIでプロフェッショナルな広告画像と動画を数分で作成。マーケターとクリエイターのためのオールインワンAI広告ソリューション。',
    twitterTitle: 'gwanggo - AI広告コンテンツ生成プラットフォーム',
    twitterDescription: 'AIでプロフェッショナルな広告画像と動画を数分で作成。',
  },
  zh: {
    title: 'gwanggo - AI广告图片·视频生成平台',
    titleTemplate: '%s | gwanggo',
    description: '用AI几分钟内生成广告图片和视频。一键制作虚拟形象、产品广告、音乐。',
    keywords: [
      'AI广告', 'AI广告制作', 'AI图片生成', 'AI视频广告', 'AI虚拟形象',
      '广告自动化', '营销AI', '产品广告', '社交媒体广告', 'Instagram广告',
      'Facebook广告', '短视频广告', 'AI营销工具', '广告内容生成', '电商广告',
    ],
    ogTitle: 'gwanggo - AI广告内容生成平台',
    ogDescription: '用AI几分钟内生成专业的广告图片和视频。面向营销人员和创作者的一站式AI广告解决方案。',
    twitterTitle: 'gwanggo - AI广告内容生成平台',
    twitterDescription: '用AI几分钟内生成专业的广告图片和视频。',
  },
}

/** 언어별 JSON-LD 구조화 데이터 */
export function getJsonLd(locale: Locale, siteUrl: string) {
  const data = seoData[locale]

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'gwanggo',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: data.ogDescription,
    url: `${siteUrl}/${locale}`,
    inLanguage: htmlLang[locale],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: locale === 'ko' ? 'KRW' : locale === 'ja' ? 'JPY' : locale === 'zh' ? 'CNY' : 'USD',
      description: locale === 'ko' ? '무료 체험 제공' :
                   locale === 'ja' ? '無料トライアル提供' :
                   locale === 'zh' ? '提供免费试用' : 'Free trial available',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    featureList: locale === 'ko' ? [
      'AI 이미지 광고 생성',
      'AI 영상 광고 생성',
      'AI 아바타 생성',
      'AI 배경 음악 생성',
      '제품 광고 자동화',
    ] : locale === 'ja' ? [
      'AI画像広告生成',
      'AI動画広告生成',
      'AIアバター生成',
      'AIバックグラウンドミュージック生成',
      '商品広告自動化',
    ] : locale === 'zh' ? [
      'AI图片广告生成',
      'AI视频广告生成',
      'AI虚拟形象生成',
      'AI背景音乐生成',
      '产品广告自动化',
    ] : [
      'AI image ad generation',
      'AI video ad generation',
      'AI avatar generation',
      'AI background music generation',
      'Product ad automation',
    ],
  }
}
