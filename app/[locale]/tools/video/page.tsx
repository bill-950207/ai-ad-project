import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Film, Sparkles, ArrowRight, ChevronRight, Zap, Upload, Play, Download } from 'lucide-react'
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

const i18n: Record<Locale, {
  breadcrumbHome: string
  badge: string
  heading: string
  subheading: string
  intro: string
  cta: string
  modelsTitle: string
  models: Array<{
    name: string
    badge: string
    desc: string
    features: string[]
    specs: string
  }>
  howItWorksTitle: string
  steps: Array<{ icon: 'prompt' | 'upload' | 'generate' | 'download'; title: string; desc: string }>
  useCasesTitle: string
  useCases: string[]
  comparisonTitle: string
  comparisonHeaders: [string, string, string, string, string, string]
  comparisonRows: [string, string, string, string, string, string][]
  faqTitle: string
  faq: Array<{ q: string; a: string }>
  otherToolTitle: string
  otherToolDesc: string
  otherToolCta: string
  pricingCta: string
  bottomCta: string
  bottomCtaDesc: string
}> = {
  ko: {
    breadcrumbHome: '홈',
    badge: 'AI 영상 생성 도구',
    heading: 'AI 영상 생성',
    subheading: 'Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, Wan 2.6, Vidu Q3로 고품질 AI 영상 생성. Sora, Runway 대안.',
    intro: 'gwanggo의 AI 영상 생성 도구는 ByteDance(바이트댄스)의 Seedance 1.5 Pro, Shengshu Technology(生数科技)의 Vidu Q3 모델을 지원합니다. Kling 3.0(쿠아이쇼우/快手)의 Standard·Pro 등급, xAI의 Grok Imagine Video, 알리바바의 Wan 2.6 모델도 지원합니다. OpenAI Sora, Runway Gen-4, Hailuo, Pika, Luma Dream Machine 등 주요 AI 영상 모델의 대안으로, 광고 영상 제작에 특화되어 있습니다. 텍스트 프롬프트만으로 영상을 생성하거나, 참조 이미지를 활용하여 더 정밀한 AI 동영상을 만들 수 있습니다. 480p부터 1080p까지 다양한 해상도와 최대 16초 길이의 영상을 지원합니다.',
    cta: '무료로 시작하기',
    modelsTitle: '지원 모델',
    models: [
      {
        name: 'Seedance 1.5 Pro',
        badge: 'ByteDance (바이트댄스)',
        desc: 'ByteDance가 개발한 최신 Text-to-Video / Image-to-Video AI 모델입니다. 텍스트만으로 영상을 생성하거나, 참조 이미지와 함께 사용하여 보다 정밀한 결과를 얻을 수 있습니다.',
        features: ['텍스트 → 영상 (Text to Video)', '이미지 → 영상 (Image to Video)', '오디오 자동 생성', '6가지 화면 비율 지원'],
        specs: '해상도: 480p, 720p | 길이: 4초, 8초, 12초',
      },
      {
        name: 'Vidu Q3',
        badge: 'Shengshu Technology (生数科技)',
        desc: 'Shengshu Technology(生数科技)가 개발한 고해상도 Image-to-Video AI 모델입니다. 이미지 한 장에서 최대 1080p, 16초 길이의 영상을 생성하며, 움직임 강도를 세밀하게 조절할 수 있습니다.',
        features: ['이미지 → 영상 (Image to Video)', '최대 1080p Full HD', '1~16초 자유 설정', '움직임 강도 조절 (Auto/Small/Medium/Large)'],
        specs: '해상도: 540p, 720p, 1080p | 길이: 1~16초',
      },
      {
        name: 'Kling 3.0',
        badge: 'Kuaishou (쿠아이쇼우)',
        desc: 'Kuaishou(쿠아이쇼우/快手)가 개발한 Text-to-Video / Image-to-Video AI 모델입니다. Standard와 Pro 등급을 지원하며, 텍스트만으로 또는 이미지와 함께 5~10초 길이의 영상을 생성합니다.',
        features: ['텍스트 → 영상 (Text to Video)', '이미지 → 영상 (Image to Video)', 'Standard / Pro 등급 선택', '3가지 화면 비율 (16:9, 9:16, 1:1)'],
        specs: '해상도: 720p | 길이: 5초, 10초 | Standard: 6크레딧/초, Pro: 8크레딧/초',
      },
      {
        name: 'Grok Imagine Video',
        badge: 'xAI',
        desc: 'xAI(일론 머스크)가 개발한 Grok Imagine Video AI 모델입니다. 텍스트만으로 또는 이미지와 함께 최대 15초 길이의 영상을 생성할 수 있습니다.',
        features: ['텍스트 → 영상 (Text to Video)', '이미지 → 영상 (Image to Video)', '480p / 720p 해상도', '최대 15초 지원'],
        specs: '해상도: 480p, 720p | 길이: 1~15초 | 480p: 2크레딧/초, 720p: 3크레딧/초',
      },
      {
        name: 'Wan 2.6',
        badge: 'Alibaba (알리바바)',
        desc: '알리바바(Alibaba)가 개발한 Wan 2.6 AI 영상 생성 모델입니다. 텍스트만으로 또는 이미지와 함께 최대 1080p, 15초 길이의 고품질 영상을 생성합니다.',
        features: ['텍스트 → 영상 (Text to Video)', '이미지 → 영상 (Image to Video)', '최대 1080p Full HD', '5가지 화면 비율 지원'],
        specs: '해상도: 720p, 1080p | 길이: 5초, 10초, 15초 | 720p: 4크레딧/초, 1080p: 5크레딧/초',
      },
    ],
    howItWorksTitle: '사용 방법',
    steps: [
      { icon: 'prompt', title: '프롬프트 입력', desc: '생성할 영상을 텍스트로 설명합니다' },
      { icon: 'upload', title: '이미지 업로드 (선택)', desc: '참조 이미지를 함께 업로드하면 더 정밀한 결과' },
      { icon: 'generate', title: 'AI 영상 생성', desc: 'AI가 자동으로 고품질 영상을 생성합니다' },
      { icon: 'download', title: '다운로드', desc: '완성된 영상을 바로 다운로드하세요' },
    ],
    useCasesTitle: '활용 사례',
    useCases: [
      '제품 소개 영상 · 쇼핑몰 상세페이지 동영상',
      'SNS 숏폼 콘텐츠 · 인스타그램 릴스, 틱톡',
      '광고 소재 제작 · 프로모션 영상',
      '프레젠테이션 · 기획안 시각화',
    ],
    comparisonTitle: '모델 비교',
    comparisonHeaders: ['항목', 'Seedance 1.5 Pro', 'Vidu Q3', 'Kling 3.0', 'Grok Video', 'Wan 2.6'],
    comparisonRows: [
      ['개발사', 'ByteDance', 'Shengshu', 'Kuaishou (快手)', 'xAI', 'Alibaba'],
      ['입력 방식', '텍스트 / 이미지', '이미지 (필수)', '텍스트 / 이미지', '텍스트 / 이미지', '텍스트 / 이미지'],
      ['해상도', '480p, 720p', '540p~1080p', '720p', '480p, 720p', '720p, 1080p'],
      ['영상 길이', '4~12초', '1~16초', '5초, 10초', '1~15초', '5~15초'],
      ['비용(크레딧/초)', '1~2', '1~3', '6(Std), 8(Pro)', '2~3', '4~5'],
    ],
    faqTitle: '자주 묻는 질문',
    faq: [
      { q: 'Seedance 1.5 Pro는 어떤 모델인가요?', a: 'Seedance 1.5 Pro는 ByteDance(바이트댄스)가 개발한 최신 AI 영상 생성 모델입니다. Text-to-Video(텍스트에서 영상)와 Image-to-Video(이미지에서 영상) 두 가지 방식을 모두 지원하며, 프롬프트만으로 4~12초 길이의 영상을 자동 생성합니다.' },
      { q: 'Vidu Q3는 어떤 모델인가요?', a: 'Vidu Q3는 Shengshu Technology(生数科技)가 개발한 Image-to-Video AI 모델입니다. 한 장의 이미지에서 최대 1080p, 16초 길이의 고품질 영상을 생성할 수 있으며, 움직임의 강도를 Auto, Small, Medium, Large 4단계로 세밀하게 조절할 수 있습니다.' },
      { q: 'AI 영상 생성 비용은 얼마인가요?', a: '회원가입 시 15크레딧이 무료로 제공됩니다. Seedance 1.5 Pro는 480p: 1크레딧/초, 720p: 2크레딧/초, Vidu Q3는 540p: 1크레딧/초, 720p: 2크레딧/초, 1080p: 3크레딧/초, Kling 3.0은 Standard: 6크레딧/초, Pro: 8크레딧/초, Grok Video는 480p: 2크레딧/초, 720p: 3크레딧/초, Wan 2.6은 720p: 4크레딧/초, 1080p: 5크레딧/초입니다.' },
      { q: '생성된 영상의 저작권은 누구에게 있나요?', a: 'gwanggo에서 생성한 모든 AI 영상의 사용 권리는 사용자에게 있습니다. 상업적 용도(광고, SNS, 쇼핑몰 등)로 자유롭게 사용하실 수 있습니다.' },
      { q: 'Text-to-Video와 Image-to-Video의 차이는 무엇인가요?', a: 'Text-to-Video는 텍스트 설명만으로 영상을 생성하는 방식이고, Image-to-Video는 참조 이미지를 기반으로 영상을 만드는 방식입니다. Image-to-Video는 원하는 시각적 스타일을 더 정확하게 반영할 수 있습니다. Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, Wan 2.6은 두 방식 모두 지원하고, Vidu Q3는 Image-to-Video 전용입니다.' },
      { q: 'Sora, Runway와 비교하면 어떤가요?', a: 'gwanggo는 Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, Wan 2.6, Vidu Q3 등 5종의 AI 영상 모델을 지원합니다. OpenAI Sora, Runway Gen-4, Hailuo(MiniMax), Pika, Luma Dream Machine, Google Veo 등과 비교해 광고 영상 제작에 특화되어 있습니다. 별도 앱 설치 없이 웹에서 바로 사용할 수 있습니다.' },
      { q: 'Seedance 2.0이란 무엇인가요?', a: 'ByteDance의 Seedance 2.0은 2026년 2월 12일에 공식 출시되었습니다. 멀티모달 오디오-비디오 통합 생성, 최대 15초 멀티샷 출력, 대폭 향상된 영상 품질 등이 특징입니다. 중국에서는 CapCut/剪映을 통해 제공되며, gwanggo에서도 Seedance 2.0 지원을 준비하고 있습니다.' },
      { q: 'Kling 3.0은 어떤 모델인가요?', a: 'Kling 3.0은 Kuaishou(쿠아이쇼우/快手)가 개발한 AI 영상 생성 모델입니다. Standard와 Pro 두 가지 등급을 지원하며, 텍스트만으로 또는 이미지와 함께 720p, 5~10초 길이의 영상을 생성합니다. Standard는 초당 6크레딧, Pro는 초당 8크레딧입니다.' },
      { q: 'Grok Imagine Video는 어떤 모델인가요?', a: 'Grok Imagine Video는 xAI(일론 머스크)가 개발한 AI 영상 생성 모델입니다. 텍스트만으로 또는 이미지와 함께 480p~720p, 최대 15초 길이의 영상을 생성할 수 있습니다.' },
      { q: 'Wan 2.6은 어떤 모델인가요?', a: 'Wan 2.6은 알리바바(Alibaba)가 개발한 AI 영상 생성 모델입니다. 텍스트만으로 또는 이미지와 함께 720p~1080p, 5~15초 길이의 고품질 영상을 생성합니다. 5가지 화면 비율을 지원합니다.' },
    ],
    otherToolTitle: 'AI 이미지 생성도 사용해보세요',
    otherToolDesc: 'Seedream 5, FLUX.2 Pro, Grok Imagine Image, Z-Image로 고품질 AI 이미지를 생성할 수 있습니다.',
    otherToolCta: 'AI 이미지 생성 바로가기',
    pricingCta: '요금제 보기',
    bottomCta: '지금 바로 AI 영상을 만들어보세요',
    bottomCtaDesc: '회원가입 시 15크레딧 무료 제공. 5종 AI 모델로 고품질 영상을 생성하세요.',
  },
  en: {
    breadcrumbHome: 'Home',
    badge: 'AI Video Generation Tool',
    heading: 'AI Video Generator',
    subheading: 'Generate AI videos with Seedance 1.5 Pro, Kling 3.0, Grok Video, Wan 2.6 & Vidu Q3. Best Sora & Runway alternative.',
    intro: 'gwanggo\'s AI video generator supports 5 models: ByteDance\'s Seedance 1.5 Pro, Shengshu Technology\'s Vidu Q3, Kuaishou\'s Kling 3.0 (Standard & Pro tiers), xAI\'s Grok Imagine Video, and Alibaba\'s Wan 2.6. A powerful alternative to OpenAI Sora, Runway Gen-4, Hailuo, Pika, and Luma Dream Machine, optimized for commercial ad video creation. Generate videos from text prompts alone, or use reference images for more precise AI video creation. Supports resolutions from 480p to 1080p and up to 16 seconds.',
    cta: 'Start for Free',
    modelsTitle: 'Supported Models',
    models: [
      {
        name: 'Seedance 1.5 Pro',
        badge: 'ByteDance',
        desc: 'ByteDance\'s latest Text-to-Video and Image-to-Video AI model. Generate videos from text alone or combine with reference images for more precise results.',
        features: ['Text → Video (Text to Video)', 'Image → Video (Image to Video)', 'Auto audio generation', '6 aspect ratios supported'],
        specs: 'Resolution: 480p, 720p | Duration: 4s, 8s, 12s',
      },
      {
        name: 'Vidu Q3',
        badge: 'Shengshu Technology',
        desc: 'High-resolution Image-to-Video AI model by Shengshu Technology. Generate up to 1080p, 16-second videos from a single image with fine-grained movement control.',
        features: ['Image → Video (Image to Video)', 'Up to 1080p Full HD', '1–16 seconds freely adjustable', 'Movement amplitude control (Auto/Small/Medium/Large)'],
        specs: 'Resolution: 540p, 720p, 1080p | Duration: 1–16s',
      },
      {
        name: 'Kling 3.0',
        badge: 'Kuaishou',
        desc: 'Text-to-Video and Image-to-Video AI model by Kuaishou. Supports Standard and Pro tiers, generating 5–10 second videos from text alone or with a reference image.',
        features: ['Text → Video (Text to Video)', 'Image → Video (Image to Video)', 'Standard / Pro tier selection', '3 aspect ratios (16:9, 9:16, 1:1)'],
        specs: 'Resolution: 720p | Duration: 5s, 10s | Standard: 6 credits/sec, Pro: 8 credits/sec',
      },
      {
        name: 'Grok Imagine Video',
        badge: 'xAI',
        desc: 'Grok Imagine Video AI model by xAI (Elon Musk). Generate videos up to 15 seconds from text alone or with a reference image.',
        features: ['Text → Video (Text to Video)', 'Image → Video (Image to Video)', '480p / 720p resolution', 'Up to 15 seconds'],
        specs: 'Resolution: 480p, 720p | Duration: 1–15s | 480p: 2 credits/sec, 720p: 3 credits/sec',
      },
      {
        name: 'Wan 2.6',
        badge: 'Alibaba',
        desc: 'Wan 2.6 AI video generation model by Alibaba. Generate high-quality videos up to 1080p and 15 seconds from text alone or with a reference image.',
        features: ['Text → Video (Text to Video)', 'Image → Video (Image to Video)', 'Up to 1080p Full HD', '5 aspect ratios supported'],
        specs: 'Resolution: 720p, 1080p | Duration: 5s, 10s, 15s | 720p: 4 credits/sec, 1080p: 5 credits/sec',
      },
    ],
    howItWorksTitle: 'How It Works',
    steps: [
      { icon: 'prompt', title: 'Enter a Prompt', desc: 'Describe the video you want to create in text' },
      { icon: 'upload', title: 'Upload Image (Optional)', desc: 'Add a reference image for more precise results' },
      { icon: 'generate', title: 'AI Generates Video', desc: 'AI automatically creates a high-quality video' },
      { icon: 'download', title: 'Download', desc: 'Download your finished video instantly' },
    ],
    useCasesTitle: 'Use Cases',
    useCases: [
      'Product showcase videos for e-commerce',
      'Social media short-form content (Instagram Reels, TikTok)',
      'Ad creative production and promotional videos',
      'Presentations and concept visualization',
    ],
    comparisonTitle: 'Model Comparison',
    comparisonHeaders: ['Feature', 'Seedance 1.5 Pro', 'Vidu Q3', 'Kling 3.0', 'Grok Video', 'Wan 2.6'],
    comparisonRows: [
      ['Developer', 'ByteDance', 'Shengshu', 'Kuaishou', 'xAI', 'Alibaba'],
      ['Input', 'Text / Image', 'Image (required)', 'Text / Image', 'Text / Image', 'Text / Image'],
      ['Resolution', '480p, 720p', '540p–1080p', '720p', '480p, 720p', '720p, 1080p'],
      ['Duration', '4–12s', '1–16s', '5s, 10s', '1–15s', '5–15s'],
      ['Cost (credits/sec)', '1–2', '1–3', '6(Std), 8(Pro)', '2–3', '4–5'],
    ],
    faqTitle: 'Frequently Asked Questions',
    faq: [
      { q: 'What is Seedance 1.5 Pro?', a: 'Seedance 1.5 Pro is the latest AI video generation model developed by ByteDance. It supports both Text-to-Video and Image-to-Video, generating 4–12 second videos automatically from prompts.' },
      { q: 'What is Vidu Q3?', a: 'Vidu Q3 is an Image-to-Video AI model by Shengshu Technology. It creates up to 1080p, 16-second high-quality videos from a single image, with four levels of movement amplitude control (Auto, Small, Medium, Large).' },
      { q: 'How much does AI video generation cost?', a: 'You get 15 free credits on sign up. Seedance 1.5 Pro: 1 credit/sec at 480p, 2 at 720p. Vidu Q3: 1 credit/sec at 540p, 2 at 720p, 3 at 1080p. Kling 3.0: Standard 6 credits/sec, Pro 8 credits/sec. Grok Video: 2 credits/sec at 480p, 3 at 720p. Wan 2.6: 4 credits/sec at 720p, 5 at 1080p.' },
      { q: 'Who owns the copyright of generated videos?', a: 'You retain full usage rights to all AI videos created on gwanggo. You can freely use them for commercial purposes including ads, social media, and e-commerce.' },
      { q: 'What is the difference between Text-to-Video and Image-to-Video?', a: 'Text-to-Video generates videos from text descriptions alone, while Image-to-Video creates videos based on a reference image. Image-to-Video allows more precise visual style control. Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, and Wan 2.6 support both, while Vidu Q3 is Image-to-Video only.' },
      { q: 'How does gwanggo compare to Sora, Runway, and other AI video tools?', a: 'gwanggo supports 5 AI video models: Seedance 1.5 Pro, Kling 3.0, Grok Imagine Video, Wan 2.6, and Vidu Q3. Compared to OpenAI Sora, Runway Gen-4, Hailuo (MiniMax), Pika, Luma Dream Machine, and Google Veo, gwanggo is optimized for ad video creation and works directly in the browser without any app installation.' },
      { q: 'What is Seedance 2.0?', a: 'ByteDance officially launched Seedance 2.0 on February 12, 2026, featuring unified multimodal audio-video generation, up to 15-second multi-shot output, and significantly improved video quality. It is available via CapCut/Jianying in China, and gwanggo is preparing to support Seedance 2.0 soon.' },
      { q: 'What is Kling 3.0?', a: 'Kling 3.0 is an AI video generation model by Kuaishou. It supports Standard and Pro tiers, generating 720p videos of 5–10 seconds from text alone or with a reference image. Standard costs 6 credits/sec and Pro costs 8 credits/sec.' },
      { q: 'What is Grok Imagine Video?', a: 'Grok Imagine Video is an AI video generation model by xAI (Elon Musk). It generates 480p–720p videos up to 15 seconds from text alone or with a reference image.' },
      { q: 'What is Wan 2.6?', a: 'Wan 2.6 is an AI video generation model by Alibaba. It generates high-quality 720p–1080p videos of 5–15 seconds from text alone or with a reference image. Supports 5 aspect ratios.' },
    ],
    otherToolTitle: 'Also try AI Image Generation',
    otherToolDesc: 'Create AI images with Seedream 5, FLUX.2 Pro, Grok Imagine Image, and Z-Image.',
    otherToolCta: 'Go to AI Image Generator',
    pricingCta: 'View Pricing',
    bottomCta: 'Create AI videos now',
    bottomCtaDesc: '15 free credits on sign up. Generate videos with 5 AI models.',
  },
  ja: {
    breadcrumbHome: 'ホーム',
    badge: 'AI動画生成ツール',
    heading: 'AI動画生成',
    subheading: 'Seedance 1.5 Pro、Kling 3.0、Grok Video、Wan 2.6、Vidu Q3で高品質AI動画を生成。Sora・Runway代替。',
    intro: 'gwanggoのAI動画生成ツールは、ByteDance（バイトダンス）のSeedance 1.5 Pro、Shengshu Technology（生数科技）のVidu Q3モデルに対応しています。Kling 3.0（Kuaishou/快手）のStandard・Proグレード、xAIのGrok Imagine Video、AlibabaのWan 2.6モデルにも対応。OpenAI Sora、Runway Gen-4、Hailuo、Pika、Luma Dream Machineの代替として、広告動画制作に特化しています。テキストプロンプトだけで動画を生成したり、参照画像を活用してより精密なAI動画を作成できます。480pから1080pまでの解像度と最大16秒の動画に対応。',
    cta: '無料で始める',
    modelsTitle: '対応モデル',
    models: [
      {
        name: 'Seedance 1.5 Pro',
        badge: 'ByteDance（バイトダンス）',
        desc: 'ByteDanceが開発した最新のText-to-Video / Image-to-Video AIモデル。テキストのみで動画を生成、または参照画像と組み合わせてより精密な結果を得られます。',
        features: ['テキスト→動画（Text to Video）', '画像→動画（Image to Video）', 'オーディオ自動生成', '6種類のアスペクト比対応'],
        specs: '解像度: 480p, 720p | 長さ: 4秒, 8秒, 12秒',
      },
      {
        name: 'Vidu Q3',
        badge: 'Shengshu Technology（生数科技）',
        desc: 'Shengshu Technology（生数科技）が開発した高解像度Image-to-Video AIモデル。1枚の画像から最大1080p、16秒の動画を生成し、モーション強度を細かく調整可能。',
        features: ['画像→動画（Image to Video）', '最大1080p Full HD', '1〜16秒自由設定', 'モーション強度調整（Auto/Small/Medium/Large）'],
        specs: '解像度: 540p, 720p, 1080p | 長さ: 1〜16秒',
      },
      {
        name: 'Kling 3.0',
        badge: 'Kuaishou（快手）',
        desc: 'Kuaishou（快手）が開発したText-to-Video / Image-to-Video AIモデル。StandardとProの2グレードに対応し、テキストのみまたは画像と組み合わせて5〜10秒の動画を生成します。',
        features: ['テキスト→動画（Text to Video）', '画像→動画（Image to Video）', 'Standard / Proグレード選択', '3種類のアスペクト比（16:9, 9:16, 1:1）'],
        specs: '解像度: 720p | 長さ: 5秒, 10秒 | Standard: 6クレジット/秒, Pro: 8クレジット/秒',
      },
      {
        name: 'Grok Imagine Video',
        badge: 'xAI',
        desc: 'xAI（イーロン・マスク）が開発したGrok Imagine Video AIモデル。テキストのみまたは画像と組み合わせて最大15秒の動画を生成できます。',
        features: ['テキスト→動画（Text to Video）', '画像→動画（Image to Video）', '480p / 720p解像度', '最大15秒対応'],
        specs: '解像度: 480p, 720p | 長さ: 1〜15秒 | 480p: 2クレジット/秒, 720p: 3クレジット/秒',
      },
      {
        name: 'Wan 2.6',
        badge: 'Alibaba（アリババ）',
        desc: 'Alibaba（アリババ）が開発したWan 2.6 AI動画生成モデル。テキストのみまたは画像と組み合わせて最大1080p、15秒の高品質動画を生成します。',
        features: ['テキスト→動画（Text to Video）', '画像→動画（Image to Video）', '最大1080p Full HD', '5種類のアスペクト比対応'],
        specs: '解像度: 720p, 1080p | 長さ: 5秒, 10秒, 15秒 | 720p: 4クレジット/秒, 1080p: 5クレジット/秒',
      },
    ],
    howItWorksTitle: '使い方',
    steps: [
      { icon: 'prompt', title: 'プロンプト入力', desc: '作成したい動画をテキストで説明' },
      { icon: 'upload', title: '画像アップロード（任意）', desc: '参照画像で精度の高い結果を' },
      { icon: 'generate', title: 'AI動画生成', desc: 'AIが自動で高品質な動画を生成' },
      { icon: 'download', title: 'ダウンロード', desc: '完成した動画をすぐダウンロード' },
    ],
    useCasesTitle: '活用シーン',
    useCases: [
      '商品紹介動画・ECサイト商品ページ',
      'SNSショート動画・Instagramリール、TikTok',
      '広告素材制作・プロモーション動画',
      'プレゼンテーション・企画の視覚化',
    ],
    comparisonTitle: 'モデル比較',
    comparisonHeaders: ['項目', 'Seedance 1.5 Pro', 'Vidu Q3', 'Kling 3.0', 'Grok Video', 'Wan 2.6'],
    comparisonRows: [
      ['開発元', 'ByteDance', 'Shengshu', 'Kuaishou（快手）', 'xAI', 'Alibaba'],
      ['入力方式', 'テキスト / 画像', '画像（必須）', 'テキスト / 画像', 'テキスト / 画像', 'テキスト / 画像'],
      ['解像度', '480p, 720p', '540p〜1080p', '720p', '480p, 720p', '720p, 1080p'],
      ['動画長', '4〜12秒', '1〜16秒', '5秒, 10秒', '1〜15秒', '5〜15秒'],
      ['コスト（クレジット/秒）', '1〜2', '1〜3', '6(Std), 8(Pro)', '2〜3', '4〜5'],
    ],
    faqTitle: 'よくある質問',
    faq: [
      { q: 'Seedance 1.5 Proとは何ですか？', a: 'Seedance 1.5 ProはByteDance（バイトダンス）が開発した最新のAI動画生成モデルです。Text-to-Video（テキストから動画）とImage-to-Video（画像から動画）の両方に対応し、プロンプトのみで4〜12秒の動画を自動生成します。' },
      { q: 'Vidu Q3とは何ですか？', a: 'Vidu Q3はShengshu Technology（生数科技）が開発したImage-to-Video AIモデルです。1枚の画像から最大1080p、16秒の高品質動画を生成でき、Auto、Small、Medium、Largeの4段階でモーション強度を細かく調整できます。' },
      { q: 'AI動画生成の料金はいくらですか？', a: '会員登録時に15クレジットが無料で付与されます。Seedance 1.5 Pro: 480p 1クレジット/秒、720p 2クレジット/秒。Vidu Q3: 540p 1クレジット/秒、720p 2クレジット/秒、1080p 3クレジット/秒。Kling 3.0: Standard 6クレジット/秒、Pro 8クレジット/秒。Grok Video: 480p 2クレジット/秒、720p 3クレジット/秒。Wan 2.6: 720p 4クレジット/秒、1080p 5クレジット/秒。' },
      { q: '生成された動画の著作権は誰にありますか？', a: 'gwanggoで生成したすべてのAI動画の使用権はユーザーにあります。広告、SNS、ECサイトなど商業目的で自由にご使用いただけます。' },
      { q: 'Text-to-VideoとImage-to-Videoの違いは？', a: 'Text-to-Videoはテキスト説明のみで動画を生成する方式、Image-to-Videoは参照画像をベースに動画を作る方式です。Seedance 1.5 Pro、Kling 3.0、Grok Imagine Video、Wan 2.6は両方対応、Vidu Q3はImage-to-Video専用です。' },
      { q: 'Sora、Runwayなど他のAI動画ツールとの比較は？', a: 'gwanggoはSeedance 1.5 Pro、Kling 3.0、Grok Imagine Video、Wan 2.6、Vidu Q3の5種類のAI動画モデルに対応しています。OpenAI Sora、Runway Gen-4、Hailuo（MiniMax）、Pika、Luma Dream Machine、Google Veoと比較して広告動画制作に特化しています。アプリ不要でブラウザから直接使用可能です。' },
      { q: 'Seedance 2.0とは何ですか？', a: 'ByteDanceのSeedance 2.0は2026年2月12日に正式リリースされました。マルチモーダル音声動画統合生成、最大15秒のマルチショット出力、大幅に向上した動画品質が特徴です。中国ではCapCut/剪映で提供され、gwanggoでもSeedance 2.0対応を準備中です。' },
      { q: 'Kling 3.0とは何ですか？', a: 'Kling 3.0はKuaishou（快手）が開発したAI動画生成モデルです。StandardとProの2グレードに対応し、テキストのみまたは画像と組み合わせて720p、5〜10秒の動画を生成します。Standardは6クレジット/秒、Proは8クレジット/秒です。' },
      { q: 'Grok Imagine Videoとは何ですか？', a: 'Grok Imagine VideoはxAI（イーロン・マスク）が開発したAI動画生成モデルです。テキストのみまたは画像と組み合わせて480p〜720p、最大15秒の動画を生成できます。' },
      { q: 'Wan 2.6とは何ですか？', a: 'Wan 2.6はAlibaba（アリババ）が開発したAI動画生成モデルです。テキストのみまたは画像と組み合わせて720p〜1080p、5〜15秒の高品質動画を生成します。5種類のアスペクト比に対応しています。' },
    ],
    otherToolTitle: 'AI画像生成もお試しください',
    otherToolDesc: 'Seedream 5、FLUX.2 Pro、Grok Imagine Image、Z-Imageで高品質なAI画像を生成できます。',
    otherToolCta: 'AI画像生成へ',
    pricingCta: '料金プランを見る',
    bottomCta: '今すぐAI動画を作成しましょう',
    bottomCtaDesc: '会員登録で15クレジット無料。5種類のAIモデルで高品質な動画を生成。',
  },
  zh: {
    breadcrumbHome: '首页',
    badge: 'AI视频生成工具',
    heading: 'AI视频生成',
    subheading: '使用Seedance 1.5 Pro、Kling 3.0、Grok Video、Wan 2.6和Vidu Q3生成高质量AI视频。Sora、Runway替代方案。',
    intro: 'gwanggo的AI视频生成工具支持ByteDance（字节跳动）的Seedance 1.5 Pro、Shengshu Technology（生数科技）的Vidu Q3模型。同时支持Kling 3.0（快手）的Standard·Pro等级、xAI的Grok Imagine Video、阿里巴巴的Wan 2.6模型。作为OpenAI Sora、Runway Gen-4、Hailuo、Pika、Luma Dream Machine的替代方案，专为广告视频制作优化。仅通过文字提示即可生成视频，也可以结合参考图片制作更精确的AI视频。支持480p到1080p多种分辨率，最长16秒。',
    cta: '免费开始',
    modelsTitle: '支持模型',
    models: [
      {
        name: 'Seedance 1.5 Pro',
        badge: 'ByteDance（字节跳动）',
        desc: 'ByteDance开发的最新Text-to-Video / Image-to-Video AI模型。可以仅通过文字生成视频，也可以结合参考图片获得更精确的结果。',
        features: ['文字→视频（Text to Video）', '图片→视频（Image to Video）', '自动生成音频', '支持6种画面比例'],
        specs: '分辨率: 480p, 720p | 时长: 4秒, 8秒, 12秒',
      },
      {
        name: 'Vidu Q3',
        badge: 'Shengshu Technology（生数科技）',
        desc: 'Shengshu Technology（生数科技）开发的高分辨率Image-to-Video AI模型。可以从一张图片生成最高1080p、16秒的视频，并精细控制运动幅度。',
        features: ['图片→视频（Image to Video）', '最高1080p Full HD', '1~16秒自由设定', '运动幅度控制（Auto/Small/Medium/Large）'],
        specs: '分辨率: 540p, 720p, 1080p | 时长: 1~16秒',
      },
      {
        name: 'Kling 3.0',
        badge: '快手（Kuaishou）',
        desc: '快手（Kuaishou）开发的Text-to-Video / Image-to-Video AI模型。支持Standard和Pro两个等级，可以仅通过文字或结合图片生成5~10秒的视频。',
        features: ['文字→视频（Text to Video）', '图片→视频（Image to Video）', 'Standard / Pro等级选择', '3种画面比例（16:9, 9:16, 1:1）'],
        specs: '分辨率: 720p | 时长: 5秒, 10秒 | Standard: 6积分/秒, Pro: 8积分/秒',
      },
      {
        name: 'Grok Imagine Video',
        badge: 'xAI',
        desc: 'xAI（埃隆·马斯克）开发的Grok Imagine Video AI模型。可以仅通过文字或结合图片生成最长15秒的视频。',
        features: ['文字→视频（Text to Video）', '图片→视频（Image to Video）', '480p / 720p分辨率', '最长15秒'],
        specs: '分辨率: 480p, 720p | 时长: 1~15秒 | 480p: 2积分/秒, 720p: 3积分/秒',
      },
      {
        name: 'Wan 2.6',
        badge: '阿里巴巴（Alibaba）',
        desc: '阿里巴巴（Alibaba）开发的Wan 2.6 AI视频生成模型。可以仅通过文字或结合图片生成最高1080p、15秒的高质量视频。',
        features: ['文字→视频（Text to Video）', '图片→视频（Image to Video）', '最高1080p Full HD', '支持5种画面比例'],
        specs: '分辨率: 720p, 1080p | 时长: 5秒, 10秒, 15秒 | 720p: 4积分/秒, 1080p: 5积分/秒',
      },
    ],
    howItWorksTitle: '使用方法',
    steps: [
      { icon: 'prompt', title: '输入提示词', desc: '用文字描述您想要创建的视频' },
      { icon: 'upload', title: '上传图片（可选）', desc: '添加参考图片以获得更精确的结果' },
      { icon: 'generate', title: 'AI生成视频', desc: 'AI自动生成高质量视频' },
      { icon: 'download', title: '下载', desc: '立即下载您的成品视频' },
    ],
    useCasesTitle: '应用场景',
    useCases: [
      '产品展示视频·电商详情页动画',
      '社交媒体短视频·Instagram Reels、TikTok',
      '广告素材制作·推广视频',
      '演示文稿·方案可视化',
    ],
    comparisonTitle: '模型对比',
    comparisonHeaders: ['项目', 'Seedance 1.5 Pro', 'Vidu Q3', 'Kling 3.0', 'Grok Video', 'Wan 2.6'],
    comparisonRows: [
      ['开发商', 'ByteDance', 'Shengshu', '快手（Kuaishou）', 'xAI', 'Alibaba'],
      ['输入方式', '文字 / 图片', '图片（必须）', '文字 / 图片', '文字 / 图片', '文字 / 图片'],
      ['分辨率', '480p, 720p', '540p~1080p', '720p', '480p, 720p', '720p, 1080p'],
      ['视频时长', '4~12秒', '1~16秒', '5秒, 10秒', '1~15秒', '5~15秒'],
      ['费用（积分/秒）', '1~2', '1~3', '6(Std), 8(Pro)', '2~3', '4~5'],
    ],
    faqTitle: '常见问题',
    faq: [
      { q: 'Seedance 1.5 Pro是什么模型？', a: 'Seedance 1.5 Pro是ByteDance（字节跳动）开发的最新AI视频生成模型。同时支持Text-to-Video（文字转视频）和Image-to-Video（图片转视频），仅通过提示词即可自动生成4~12秒的视频。' },
      { q: 'Vidu Q3是什么模型？', a: 'Vidu Q3是Shengshu Technology（生数科技）开发的Image-to-Video AI模型。可以从一张图片生成最高1080p、16秒的高质量视频，并通过Auto、Small、Medium、Large四个级别精细控制运动幅度。' },
      { q: 'AI视频生成费用是多少？', a: '注册时免费获得15积分。Seedance 1.5 Pro: 480p 1积分/秒、720p 2积分/秒。Vidu Q3: 540p 1积分/秒、720p 2积分/秒、1080p 3积分/秒。Kling 3.0: Standard 6积分/秒、Pro 8积分/秒。Grok Video: 480p 2积分/秒、720p 3积分/秒。Wan 2.6: 720p 4积分/秒、1080p 5积分/秒。' },
      { q: '生成视频的版权归谁？', a: '在gwanggo上生成的所有AI视频的使用权归用户所有。可以自由用于广告、社交媒体、电商等商业目的。' },
      { q: 'Text-to-Video和Image-to-Video有什么区别？', a: 'Text-to-Video仅通过文字描述生成视频，Image-to-Video基于参考图片创建视频。Seedance 1.5 Pro、Kling 3.0、Grok Imagine Video、Wan 2.6两种方式都支持，Vidu Q3专用于Image-to-Video。' },
      { q: '与Sora、Runway等其他AI视频工具相比如何？', a: 'gwanggo支持Seedance 1.5 Pro、Kling 3.0、Grok Imagine Video、Wan 2.6、Vidu Q3等5种AI视频模型。与OpenAI Sora、Runway Gen-4、Hailuo（MiniMax）、Pika、Luma Dream Machine、Google Veo相比，更专注于广告视频制作。无需安装应用程序即可在浏览器中直接使用。' },
      { q: 'Seedance 2.0是什么？', a: 'ByteDance的Seedance 2.0已于2026年2月12日正式发布，提供多模态音视频统合生成、最长15秒多镜头输出、大幅提升的视频质量等重大升级。在中国通过剪映/CapCut提供，gwanggo也正在准备支持Seedance 2.0。' },
      { q: 'Kling 3.0是什么模型？', a: 'Kling 3.0是快手（Kuaishou）开发的AI视频生成模型。支持Standard和Pro两个等级，可以仅通过文字或结合图片生成720p、5~10秒的视频。Standard 6积分/秒，Pro 8积分/秒。' },
      { q: 'Grok Imagine Video是什么模型？', a: 'Grok Imagine Video是xAI（埃隆·马斯克）开发的AI视频生成模型。可以仅通过文字或结合图片生成480p~720p、最长15秒的视频。' },
      { q: 'Wan 2.6是什么模型？', a: 'Wan 2.6是阿里巴巴（Alibaba）开发的AI视频生成模型。可以仅通过文字或结合图片生成720p~1080p、5~15秒的高质量视频。支持5种画面比例。' },
    ],
    otherToolTitle: '也试试AI图片生成',
    otherToolDesc: '使用Seedream 5、FLUX.2 Pro、Grok Imagine Image和Z-Image生成高质量AI图片。',
    otherToolCta: '前往AI图片生成',
    pricingCta: '查看价格',
    bottomCta: '立即制作AI视频',
    bottomCtaDesc: '注册即送15免费积分。5种AI模型生成高质量视频。',
  },
}

const stepIcons = {
  prompt: Zap,
  upload: Upload,
  generate: Play,
  download: Download,
}

export default async function VideoToolPage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const t = i18n[locale]
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
    { name: t.breadcrumbHome, url: `${siteUrl}/${locale}` },
    { name: t.heading, url: `${siteUrl}/${locale}/tools/video` },
  ])

  return (
    <>
      {toolJsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mx-auto max-w-5xl px-6 pt-6">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li><Link href={`/${locale}`} className="hover:text-foreground transition-colors">{t.breadcrumbHome}</Link></li>
            <li><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-foreground font-medium">{t.heading}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
              <Film className="w-4 h-4" />
              {t.badge}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              {t.heading}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.subheading}
            </p>
            <p className="mt-6 text-sm text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t.intro}
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
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.modelsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.models.map((model) => (
              <article key={model.name} className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-bold text-foreground">{model.name}</h3>
                  <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{model.badge}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{model.desc}</p>
                <ul className="space-y-2 mb-4">
                  {model.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">{model.specs}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.howItWorksTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.steps.map((step, i) => {
              const Icon = stepIcons[step.icon]
              return (
                <div key={i} className="rounded-xl border border-border/60 bg-card p-5 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.comparisonTitle}</h2>
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30">
                  {t.comparisonHeaders.map((header, i) => (
                    <th key={i} className={`px-4 py-3 text-left font-medium ${i === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-muted-foreground' : 'text-foreground'}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">{t.useCasesTitle}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.useCases.map((uc) => (
              <li key={uc} className="flex items-start gap-2 text-sm text-foreground bg-card rounded-lg border border-border/60 p-4">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {uc}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.faqTitle}</h2>
          <div className="space-y-6">
            {t.faq.map((item) => (
              <div key={item.q} className="border-b border-border/40 pb-6 last:border-0">
                <h3 className="text-base font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-link */}
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <div className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">{t.otherToolTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.otherToolDesc}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href={`/${locale}/tools/image`} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
                {t.otherToolCta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-20">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">{t.bottomCta}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">{t.bottomCtaDesc}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard/ai-tools/video" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-8 py-3 text-white font-medium hover:opacity-90 transition-opacity">
                <Sparkles className="w-4 h-4" /> {t.cta}
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                {t.pricingCta}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
