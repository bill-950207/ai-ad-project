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
    title: 'gwanggo - AI 광고 이미지·영상 자동 생성 | 무료 시작',
    titleTemplate: '%s | gwanggo',
    description: 'AI로 인스타그램, 페이스북, 쇼핑몰 광고 이미지와 제품 영상을 자동 생성. 아바타, BGM까지 원클릭 제작. 무료 크레딧으로 지금 시작하세요.',
    keywords: [
      'AI 광고', 'AI 광고 제작', 'AI 이미지 생성', 'AI 영상 광고', 'AI 아바타',
      '광고 자동화', '마케팅 AI', '제품 광고', 'SNS 광고', '인스타그램 광고',
      '페이스북 광고', '숏폼 광고', 'AI 마케팅 도구', '광고 콘텐츠 생성', '이커머스 광고',
      'AI 상세페이지', 'AI 쇼핑몰 광고', '무료 AI 광고', 'AI 광고 만들기', 'AI 제품 사진',
    ],
    ogTitle: 'gwanggo - AI 광고 콘텐츠 생성 플랫폼',
    ogDescription: 'AI로 전문적인 광고 이미지와 영상을 몇 분 만에 생성하세요. 마케터와 크리에이터를 위한 올인원 AI 광고 솔루션.',
    twitterTitle: 'gwanggo - AI 광고 콘텐츠 생성 플랫폼',
    twitterDescription: 'AI로 전문적인 광고 이미지와 영상을 몇 분 만에 생성하세요.',
  },
  en: {
    title: 'gwanggo - AI Ad Image & Video Generator | Free to Start',
    titleTemplate: '%s | gwanggo',
    description: 'Generate Instagram, Facebook & e-commerce ad images and product videos with AI. Create avatars, background music in one click. Start free today.',
    keywords: [
      'AI advertising', 'AI ad creation', 'AI image generation', 'AI video ads', 'AI avatar',
      'ad automation', 'marketing AI', 'product ads', 'social media ads', 'Instagram ads',
      'Facebook ads', 'short-form ads', 'AI marketing tools', 'ad content generation', 'ecommerce ads',
      'AI product photography', 'free AI ad maker', 'AI commercial video',
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

/** AI 영상 생성 도구 SEO */
export const videoToolSeoData: Record<Locale, {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
}> = {
  ko: {
    title: 'AI 영상 생성 - Seedance · Kling 3.0 · Wan 2.6 · Grok | Sora 대안 무료',
    description: 'Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, Wan 2.6, Vidu Q3 등 5종 AI 영상 모델 지원. Sora, Runway 대안. Seedance 2.0 출시. 무료 크레딧으로 시작.',
    keywords: [
      'AI 영상 생성', 'AI 동영상 만들기', 'AI 비디오 생성기', 'Seedance', 'Seedance 1.5 Pro',
      'Seedance 2.0', 'ByteDance AI', 'ByteDance Seedance', 'Vidu Q3', 'Vidu AI',
      'Kling 3.0', 'Kling 3.0 Pro', 'Kling 3.0 Standard', 'Kling AI', '쿠아이쇼우 AI', '快手 AI',
      'Grok Imagine Video', 'Grok AI', 'xAI Grok', 'Grok 영상 생성',
      'Wan 2.6', 'Wan AI', '알리바바 AI', 'Alibaba Wan',
      'Text to Video', 'Image to Video', '텍스트 영상 변환', '이미지 영상 변환', '무료 AI 영상',
      'AI video generator', 'AI 숏폼 영상', 'AI 동영상 생성기', '바이트댄스 AI',
      'AI 영상 제작', 'AI 영상 편집', '무료 동영상 만들기', 'Seedance Pro',
      'Sora 대안', 'Runway 대안', 'Kling 대안', 'Sora 대체', 'Runway Gen-4 대안',
      'Hailuo AI', 'Pika AI', 'Luma Dream Machine', 'Veo 대안',
      'OpenAI Sora', 'Google Veo', '무료 AI 비디오', 'AI 광고 영상',
    ],
    ogTitle: 'AI 영상 생성 - Seedance · Kling 3.0 · Grok · Wan 2.6 | gwanggo',
    ogDescription: 'Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, Wan 2.6, Vidu Q3로 고품질 AI 영상 생성. Sora, Runway 대안.',
  },
  en: {
    title: 'AI Video Generator - Seedance · Kling 3.0 · Grok · Wan 2.6 | Sora Alternative',
    description: 'Generate AI videos with Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, Wan 2.6, and Vidu Q3. Best Sora, Runway alternative. Seedance 2.0 available. Start free.',
    keywords: [
      'AI video generator', 'AI video maker', 'Seedance', 'Seedance 1.5 Pro', 'Seedance 2.0',
      'ByteDance AI', 'ByteDance Seedance', 'Vidu Q3', 'Vidu AI',
      'Kling 3.0', 'Kling 3.0 Pro', 'Kling 3.0 Standard', 'Kling AI', 'Kuaishou AI',
      'Grok Imagine Video', 'Grok AI', 'xAI Grok', 'Grok video generator',
      'Wan 2.6', 'Wan AI', 'Alibaba Wan', 'Alibaba AI video',
      'text to video', 'image to video', 'free AI video generator', 'AI short video',
      'AI video creation', 'AI video editing', 'text to video AI', 'image to video AI',
      'Sora alternative', 'Runway alternative', 'Kling alternative', 'Runway Gen-4 alternative',
      'OpenAI Sora alternative', 'Hailuo AI', 'Pika alternative',
      'Luma Dream Machine', 'Google Veo alternative', 'free AI video maker',
      'AI ad video', 'AI commercial video', 'best AI video generator 2026',
    ],
    ogTitle: 'AI Video Generator - Seedance · Kling 3.0 · Grok · Wan 2.6 | gwanggo',
    ogDescription: 'Generate AI videos with Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, Wan 2.6, and Vidu Q3. Best Sora & Runway alternative.',
  },
  ja: {
    title: 'AI動画生成 - Seedance · Kling 3.0 · Grok · Wan 2.6 | Sora代替 無料',
    description: 'Seedance 1.5 Pro、Kling 3.0、Grok Imagine Video、Wan 2.6、Vidu Q3の5つのAI動画モデル対応。Sora、Runway代替。Seedance 2.0リリース済み。無料クレジットで開始。',
    keywords: [
      'AI動画生成', 'AI動画メーカー', 'Seedance', 'Seedance 1.5 Pro', 'Seedance 2.0',
      'ByteDance AI', 'Vidu Q3', 'Vidu AI',
      'Kling 3.0', 'Kling 3.0 Pro', 'Kling AI', '快手AI',
      'Grok Imagine Video', 'Grok AI', 'xAI Grok',
      'Wan 2.6', 'Wan AI', 'アリババAI',
      'テキストから動画', '画像から動画', '無料AI動画', 'AIショート動画',
      'AI動画制作', 'AI動画編集', 'バイトダンスAI',
      'Sora代替', 'Runway代替', 'Kling代替', 'Hailuo AI',
      'Pika代替', 'Luma Dream Machine', 'Google Veo', 'OpenAI Sora',
    ],
    ogTitle: 'AI動画生成 - Seedance · Kling 3.0 · Grok · Wan 2.6 | gwanggo',
    ogDescription: 'Seedance 1.5 Pro、Kling 3.0、Grok Imagine Video、Wan 2.6、Vidu Q3で高品質AI動画を生成。Sora・Runway代替。',
  },
  zh: {
    title: 'AI视频生成 - Seedance · Kling 3.0 · Grok · Wan 2.6 | Sora替代 免费',
    description: '支持Seedance 1.5 Pro、Kling 3.0、Grok Imagine Video、Wan 2.6、Vidu Q3等5种AI视频模型。Sora、Runway替代方案。Seedance 2.0已发布。免费积分立即开始。',
    keywords: [
      'AI视频生成', 'AI视频制作', 'Seedance', 'Seedance 1.5 Pro', 'Seedance 2.0',
      'ByteDance AI', '字节跳动AI', 'Vidu Q3', 'Vidu AI',
      'Kling 3.0', 'Kling 3.0 Pro', 'Kling AI', '快手AI',
      'Grok Imagine Video', 'Grok AI', 'xAI Grok',
      'Wan 2.6', 'Wan AI', '阿里巴巴AI',
      '文字转视频', '图片转视频', '免费AI视频', 'AI短视频',
      'AI视频创作', 'AI视频编辑',
      'Sora替代', 'Runway替代', 'Kling替代', 'Hailuo AI',
      'Pika替代', 'Luma Dream Machine', 'Google Veo', 'OpenAI Sora',
    ],
    ogTitle: 'AI视频生成 - Seedance · Kling 3.0 · Grok · Wan 2.6 | gwanggo',
    ogDescription: '使用Seedance 1.5 Pro、Kling 3.0、Grok Imagine Video、Wan 2.6、Vidu Q3生成高质量AI视频。Sora·Runway替代方案。',
  },
}

/** AI 이미지 생성 도구 SEO */
export const imageToolSeoData: Record<Locale, {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
}> = {
  ko: {
    title: 'AI 이미지 생성 - Seedream 5 · FLUX.2 Pro · Grok Imagine | Midjourney 대안 무료',
    description: 'Seedream 5, FLUX.2 Pro, Grok Imagine Image, Z-Image 등 4종 AI 이미지 모델 지원. Midjourney, DALL-E 대안. 다양한 비율과 화질 지원. 무료 크레딧으로 시작.',
    keywords: [
      'AI 이미지 생성', 'AI 그림 생성기', 'AI 이미지 편집', 'Seedream', 'Seedream 5',
      'ByteDance AI', 'ByteDance Seedream', 'Z-Image', 'Text to Image', 'Image Edit',
      'FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'Black Forest Labs', 'BFL FLUX',
      'Grok Imagine Image', 'Grok 이미지 생성', 'xAI Grok', 'Grok AI',
      '텍스트 이미지 생성', 'AI 사진 생성', '무료 AI 이미지', 'AI image generator',
      'AI 그림 그리기', 'AI 이미지 만들기', '무료 AI 그림', '바이트댄스 AI',
      'AI 이미지 제작', 'AI 사진 편집', 'Seedream Pro',
      'Midjourney 대안', 'DALL-E 대안', 'Stable Diffusion 대안', 'Midjourney 대체',
      'GPT Image', 'Flux 대안', 'Ideogram 대안', 'Adobe Firefly 대안',
      'Leonardo AI 대안', 'Recraft 대안', 'Imagen 대안', 'SD4 대안',
      '무료 AI 그림 생성기', 'AI 광고 이미지', 'AI 제품 사진',
    ],
    ogTitle: 'AI 이미지 생성 - Seedream 5 · FLUX.2 Pro · Grok Imagine | gwanggo',
    ogDescription: 'Seedream 5, FLUX.2 Pro, Grok Imagine Image, Z-Image로 고품질 AI 이미지 생성. Midjourney, DALL-E 대안.',
  },
  en: {
    title: 'AI Image Generator - Seedream 5 · FLUX.2 Pro · Grok Imagine | Midjourney Alternative',
    description: 'Generate AI images with Seedream 5, FLUX.2 Pro, Grok Imagine Image, and Z-Image. Best Midjourney, DALL-E alternative. Multiple aspect ratios. Start free.',
    keywords: [
      'AI image generator', 'AI image maker', 'Seedream', 'Seedream 5',
      'ByteDance AI', 'ByteDance Seedream', 'Z-Image', 'text to image',
      'FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'Black Forest Labs',
      'Grok Imagine Image', 'Grok image generator', 'xAI Grok', 'Grok AI',
      'AI image editing', 'free AI image generator', 'AI art generator',
      'AI photo generator', 'AI image creation', 'Seedream Pro',
      'Midjourney alternative', 'DALL-E alternative', 'Stable Diffusion alternative',
      'GPT Image alternative', 'Flux alternative', 'Ideogram alternative',
      'Adobe Firefly alternative', 'Leonardo AI alternative', 'Recraft alternative',
      'Imagen alternative', 'free AI art generator', 'AI ad image', 'AI product photo',
      'best AI image generator 2026',
    ],
    ogTitle: 'AI Image Generator - Seedream 5 · FLUX.2 Pro · Grok Imagine | gwanggo',
    ogDescription: 'Create AI images with Seedream 5, FLUX.2 Pro, Grok Imagine Image, and Z-Image. Best Midjourney & DALL-E alternative.',
  },
  ja: {
    title: 'AI画像生成 - Seedream 5 · FLUX.2 Pro · Grok Imagine | Midjourney代替 無料',
    description: 'Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Imageの4つのAI画像モデル対応。Midjourney、DALL-E代替。無料クレジットで開始。',
    keywords: [
      'AI画像生成', 'AI画像メーカー', 'Seedream', 'Seedream 5',
      'ByteDance AI', 'Z-Image', 'テキストから画像', 'AI画像編集',
      'FLUX.2 Pro', 'FLUX AI', 'Black Forest Labs',
      'Grok Imagine Image', 'Grok AI', 'xAI Grok',
      '無料AI画像', 'AIアート', 'AI写真生成', 'AI画像制作', 'バイトダンスAI',
      'Midjourney代替', 'DALL-E代替', 'Stable Diffusion代替',
      'GPT Image', 'Flux代替', 'Ideogram代替', 'Adobe Firefly代替',
      'Leonardo AI代替', 'Recraft代替',
    ],
    ogTitle: 'AI画像生成 - Seedream 5 · FLUX.2 Pro · Grok Imagine | gwanggo',
    ogDescription: 'Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Imageで高品質AI画像を生成。Midjourney・DALL-E代替。',
  },
  zh: {
    title: 'AI图片生成 - Seedream 5 · FLUX.2 Pro · Grok Imagine | Midjourney替代 免费',
    description: '支持Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Image等4种AI图片模型。Midjourney、DALL-E替代方案。免费积分立即开始。',
    keywords: [
      'AI图片生成', 'AI图片生成器', 'Seedream', 'Seedream 5',
      'ByteDance AI', '字节跳动AI', 'Z-Image', '文字转图片',
      'FLUX.2 Pro', 'FLUX AI', 'Black Forest Labs',
      'Grok Imagine Image', 'Grok AI', 'xAI Grok',
      'AI图片编辑', '免费AI图片', 'AI艺术', 'AI照片生成', 'AI图片制作',
      'Midjourney替代', 'DALL-E替代', 'Stable Diffusion替代',
      'GPT Image', 'Flux替代', 'Ideogram替代', 'Adobe Firefly替代',
      'Leonardo AI替代', 'Recraft替代',
    ],
    ogTitle: 'AI图片生成 - Seedream 5 · FLUX.2 Pro · Grok Imagine | gwanggo',
    ogDescription: '使用Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Image生成高质量AI图片。Midjourney·DALL-E替代方案。',
  },
}

/** AI 도구 JSON-LD (WebApplication) */
export function getToolJsonLd(
  locale: Locale,
  siteUrl: string,
  tool: 'video' | 'image',
) {
  const data = tool === 'video' ? videoToolSeoData[locale] : imageToolSeoData[locale]
  const currency = locale === 'ko' ? 'KRW' : locale === 'ja' ? 'JPY' : locale === 'zh' ? 'CNY' : 'USD'

  const models = tool === 'video'
    ? [
        { name: 'Seedance 1.5 Pro', creator: 'ByteDance', description: 'Text/Image to Video, 480p-720p, 4-12s' },
        { name: 'Vidu Q3', creator: 'Shengshu Technology', description: 'Image to Video, 540p-1080p, 1-16s' },
        { name: 'Kling 3.0', creator: 'Kuaishou', description: 'Text/Image to Video, 720p, Standard/Pro tier, 5-10s' },
        { name: 'Grok Imagine Video', creator: 'xAI', description: 'Text/Image to Video, 480p-720p, up to 15s' },
        { name: 'Wan 2.6', creator: 'Alibaba', description: 'Text/Image to Video, 720p-1080p, 5-15s' },
      ]
    : [
        { name: 'Seedream 5', creator: 'ByteDance', description: 'AI Image Edit, multiple aspect ratios' },
        { name: 'Z-Image', creator: 'gwanggo', description: 'Text to Image, multiple aspect ratios' },
        { name: 'FLUX.2 Pro', creator: 'Black Forest Labs', description: 'Text to Image, multiple aspect ratios, basic/high quality' },
        { name: 'Grok Imagine Image', creator: 'xAI', description: 'Text to Image, multiple aspect ratios' },
      ]

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: data.ogTitle,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: data.ogDescription,
      url: `${siteUrl}/${locale}/tools/${tool}`,
      inLanguage: htmlLang[locale],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: currency,
      },
    },
    ...models.map((model) => ({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: model.name,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: model.description,
      creator: {
        '@type': 'Organization',
        name: model.creator,
      },
      isPartOf: {
        '@type': 'WebApplication',
        name: 'gwanggo',
        url: `${siteUrl}/${locale}`,
      },
    })),
  ]
}

/** 언어별 FAQ 데이터 (FAQPage JSON-LD용) */
export const faqData: Record<Locale, Array<{ question: string; answer: string }>> = {
  ko: [
    {
      question: 'gwanggo는 무료인가요?',
      answer: '네, 회원가입 시 15크레딧이 무료로 제공되어 바로 AI 광고 이미지와 영상을 생성해볼 수 있습니다. 추가 크레딧이 필요하면 Starter, Pro, Business 요금제를 선택할 수 있습니다.',
    },
    {
      question: 'AI 광고 이미지는 어떻게 만드나요?',
      answer: '제품 사진을 업로드하고 원하는 스타일을 선택하면 AI가 자동으로 전문적인 광고 이미지를 생성합니다. 인스타그램, 페이스북 등 다양한 플랫폼에 최적화된 사이즈로 제작할 수 있습니다.',
    },
    {
      question: 'AI로 만든 광고의 저작권은 누구에게 있나요?',
      answer: 'gwanggo에서 생성한 모든 광고 이미지와 영상의 사용 권리는 사용자에게 있습니다. 상업적 용도로 자유롭게 사용하실 수 있습니다.',
    },
    {
      question: '어떤 종류의 광고를 만들 수 있나요?',
      answer: '제품 이미지 광고, 제품 영상 광고, AI 아바타를 활용한 영상, 배경 음악까지 다양한 광고 콘텐츠를 만들 수 있습니다. 쇼핑몰, SNS, 상세페이지 등에 활용 가능합니다.',
    },
  ],
  en: [
    {
      question: 'Is gwanggo free to use?',
      answer: 'Yes, you get 15 free credits when you sign up, allowing you to create AI ad images and videos right away. For more credits, you can choose from Starter, Pro, or Business plans.',
    },
    {
      question: 'How do I create AI ad images?',
      answer: 'Simply upload your product photo and select your desired style. AI will automatically generate professional ad images optimized for Instagram, Facebook, and other platforms.',
    },
    {
      question: 'Who owns the copyright for AI-generated ads?',
      answer: 'You retain full usage rights to all ad images and videos created on gwanggo. You can freely use them for commercial purposes.',
    },
    {
      question: 'What types of ads can I create?',
      answer: 'You can create product image ads, product video ads, AI avatar videos, and background music. Perfect for e-commerce, social media, and product detail pages.',
    },
  ],
  ja: [
    {
      question: 'gwanggoは無料ですか？',
      answer: 'はい、会員登録時に15クレジットが無料で提供され、すぐにAI広告画像と動画を作成できます。追加クレジットが必要な場合は、Starter、Pro、Businessプランを選択できます。',
    },
    {
      question: 'AI広告画像はどのように作りますか？',
      answer: '商品写真をアップロードし、お好みのスタイルを選択すると、AIが自動的にプロフェッショナルな広告画像を生成します。Instagram、Facebookなど様々なプラットフォームに最適化されたサイズで制作できます。',
    },
    {
      question: 'AIで作った広告の著作権は誰にありますか？',
      answer: 'gwanggoで生成したすべての広告画像と動画の使用権はユーザーにあります。商業目的で自由にご使用いただけます。',
    },
    {
      question: 'どのような広告を作れますか？',
      answer: '商品画像広告、商品動画広告、AIアバターを活用した動画、バックグラウンドミュージックなど、様々な広告コンテンツを作成できます。',
    },
  ],
  zh: [
    {
      question: 'gwanggo免费吗？',
      answer: '是的，注册时免费获得15积分，可以立即创建AI广告图片和视频。需要更多积分可以选择Starter、Pro或Business套餐。',
    },
    {
      question: '如何制作AI广告图片？',
      answer: '上传产品照片并选择想要的风格，AI将自动生成专业的广告图片。可以制作适配Instagram、Facebook等各种平台的优化尺寸。',
    },
    {
      question: 'AI生成的广告版权归谁？',
      answer: '在gwanggo上生成的所有广告图片和视频的使用权归用户所有。可以自由用于商业目的。',
    },
    {
      question: '可以制作哪些类型的广告？',
      answer: '可以制作产品图片广告、产品视频广告、AI虚拟形象视频、背景音乐等各种广告内容。适用于电商、社交媒体、产品详情页等。',
    },
  ],
}

/** 언어별 JSON-LD 구조화 데이터 (SoftwareApplication) */
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

/** FAQPage JSON-LD 생성 */
export function getFaqJsonLd(locale: Locale) {
  const faqs = faqData[locale]

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/** BreadcrumbList JSON-LD 생성 */
export function getBreadcrumbJsonLd(siteUrl: string, items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** Organization JSON-LD 생성 */
export function getOrganizationJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'gwanggo',
    url: siteUrl,
    logo: `${siteUrl}/og-image.png`,
  }
}
