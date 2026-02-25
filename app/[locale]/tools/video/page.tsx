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
  comparisonHeaders: [string, string, string, string, string]
  comparisonRows: [string, string, string, string, string][]
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
    subheading: 'ByteDance Seedance 1.5 Pro와 Vidu Q3로 고품질 AI 영상 생성. Sora, Runway 대안. Seedance 2.0 출시.',
    intro: 'gwanggo의 AI 영상 생성 도구는 ByteDance(바이트댄스)의 Seedance 1.5 Pro와 Shengshu Technology(生数科技)의 Vidu Q3 모델을 지원합니다. OpenAI Sora, Runway Gen-4, Kling 3.0, Hailuo, Pika, Luma Dream Machine 등 주요 AI 영상 모델의 대안으로, 광고 영상 제작에 특화되어 있습니다. 텍스트 프롬프트만으로 영상을 생성하거나, 참조 이미지를 활용하여 더 정밀한 AI 동영상을 만들 수 있습니다. 480p부터 1080p까지 다양한 해상도와 최대 16초 길이의 영상을 지원합니다. ByteDance의 Seedance 2.0도 2026년 2월에 출시되어 곧 지원 예정입니다.',
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
    comparisonHeaders: ['항목', 'Seedance 1.5 Pro', 'Vidu Q3', '개발사', '입력 방식'],
    comparisonRows: [
      ['개발사', 'ByteDance (바이트댄스)', 'Shengshu Technology (生数科技)', '', ''],
      ['입력 방식', '텍스트 / 이미지', '이미지 (필수)', '', ''],
      ['해상도', '480p, 720p', '540p, 720p, 1080p', '', ''],
      ['영상 길이', '4초, 8초, 12초', '1~16초 (1초 단위)', '', ''],
      ['오디오', '자동 생성 지원', '지원', '', ''],
    ],
    faqTitle: '자주 묻는 질문',
    faq: [
      { q: 'Seedance 1.5 Pro는 어떤 모델인가요?', a: 'Seedance 1.5 Pro는 ByteDance(바이트댄스)가 개발한 최신 AI 영상 생성 모델입니다. Text-to-Video(텍스트에서 영상)와 Image-to-Video(이미지에서 영상) 두 가지 방식을 모두 지원하며, 프롬프트만으로 4~12초 길이의 영상을 자동 생성합니다.' },
      { q: 'Vidu Q3는 어떤 모델인가요?', a: 'Vidu Q3는 Shengshu Technology(生数科技)가 개발한 Image-to-Video AI 모델입니다. 한 장의 이미지에서 최대 1080p, 16초 길이의 고품질 영상을 생성할 수 있으며, 움직임의 강도를 Auto, Small, Medium, Large 4단계로 세밀하게 조절할 수 있습니다.' },
      { q: 'AI 영상 생성 비용은 얼마인가요?', a: '회원가입 시 15크레딧이 무료로 제공됩니다. Seedance 1.5 Pro는 해상도(480p: 1크레딧/초, 720p: 2크레딧/초)와 길이에 따라, Vidu Q3는 해상도(540p: 1크레딧/초, 720p: 2크레딧/초, 1080p: 3크레딧/초)와 길이에 따라 크레딧이 차감됩니다.' },
      { q: '생성된 영상의 저작권은 누구에게 있나요?', a: 'gwanggo에서 생성한 모든 AI 영상의 사용 권리는 사용자에게 있습니다. 상업적 용도(광고, SNS, 쇼핑몰 등)로 자유롭게 사용하실 수 있습니다.' },
      { q: 'Text-to-Video와 Image-to-Video의 차이는 무엇인가요?', a: 'Text-to-Video는 텍스트 설명만으로 영상을 생성하는 방식이고, Image-to-Video는 참조 이미지를 기반으로 영상을 만드는 방식입니다. Image-to-Video는 원하는 시각적 스타일을 더 정확하게 반영할 수 있습니다. Seedance 1.5 Pro는 두 방식 모두 지원하고, Vidu Q3는 Image-to-Video 전용입니다.' },
      { q: 'Sora, Runway, Kling과 비교하면 어떤가요?', a: 'Seedance 1.5 Pro는 OpenAI Sora, Runway Gen-4, Kling 3.0(Kuaishou), Hailuo(MiniMax), Pika, Luma Dream Machine, Google Veo 등과 비교해 광고 영상 제작에 특화되어 있습니다. 텍스트와 이미지 모두 입력 가능하고, 오디오 자동 생성을 지원하며, 별도 앱 설치 없이 웹에서 바로 사용할 수 있습니다.' },
      { q: 'Seedance 2.0이란 무엇인가요?', a: 'ByteDance의 Seedance 2.0은 2026년 2월 12일에 공식 출시되었습니다. 멀티모달 오디오-비디오 통합 생성, 최대 15초 멀티샷 출력, 대폭 향상된 영상 품질 등이 특징입니다. 중국에서는 CapCut/剪映을 통해 제공되며, gwanggo에서도 Seedance 2.0 지원을 준비하고 있습니다.' },
    ],
    otherToolTitle: 'AI 이미지 생성도 사용해보세요',
    otherToolDesc: 'ByteDance Seedream 5와 Z-Image로 고품질 AI 이미지를 생성할 수 있습니다.',
    otherToolCta: 'AI 이미지 생성 바로가기',
    pricingCta: '요금제 보기',
    bottomCta: '지금 바로 AI 영상을 만들어보세요',
    bottomCtaDesc: '회원가입 시 15크레딧 무료 제공. Seedance 1.5 Pro와 Vidu Q3로 고품질 AI 영상을 생성하세요.',
  },
  en: {
    breadcrumbHome: 'Home',
    badge: 'AI Video Generation Tool',
    heading: 'AI Video Generator',
    subheading: 'Create high-quality AI videos with ByteDance Seedance 1.5 Pro and Vidu Q3. Best Sora & Runway alternative. Seedance 2.0 now available.',
    intro: 'gwanggo\'s AI video generator supports ByteDance\'s Seedance 1.5 Pro and Shengshu Technology\'s Vidu Q3 models. A powerful alternative to OpenAI Sora, Runway Gen-4, Kling 3.0, Hailuo, Pika, and Luma Dream Machine, optimized for commercial ad video creation. Generate videos from text prompts alone, or use reference images for more precise AI video creation. Supports resolutions from 480p to 1080p and up to 16 seconds. ByteDance\'s Seedance 2.0 has launched in February 2026 and will be supported on gwanggo soon.',
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
    comparisonHeaders: ['Feature', 'Seedance 1.5 Pro', 'Vidu Q3', '', ''],
    comparisonRows: [
      ['Developer', 'ByteDance', 'Shengshu Technology', '', ''],
      ['Input', 'Text / Image', 'Image (required)', '', ''],
      ['Resolution', '480p, 720p', '540p, 720p, 1080p', '', ''],
      ['Duration', '4s, 8s, 12s', '1–16s (1s increments)', '', ''],
      ['Audio', 'Auto generation', 'Supported', '', ''],
    ],
    faqTitle: 'Frequently Asked Questions',
    faq: [
      { q: 'What is Seedance 1.5 Pro?', a: 'Seedance 1.5 Pro is the latest AI video generation model developed by ByteDance. It supports both Text-to-Video and Image-to-Video, generating 4–12 second videos automatically from prompts.' },
      { q: 'What is Vidu Q3?', a: 'Vidu Q3 is an Image-to-Video AI model by Shengshu Technology. It creates up to 1080p, 16-second high-quality videos from a single image, with four levels of movement amplitude control (Auto, Small, Medium, Large).' },
      { q: 'How much does AI video generation cost?', a: 'You get 15 free credits on sign up. Seedance 1.5 Pro costs 1 credit/sec at 480p, 2 credits/sec at 720p. Vidu Q3 costs 1 credit/sec at 540p, 2 at 720p, and 3 at 1080p.' },
      { q: 'Who owns the copyright of generated videos?', a: 'You retain full usage rights to all AI videos created on gwanggo. You can freely use them for commercial purposes including ads, social media, and e-commerce.' },
      { q: 'What is the difference between Text-to-Video and Image-to-Video?', a: 'Text-to-Video generates videos from text descriptions alone, while Image-to-Video creates videos based on a reference image. Image-to-Video allows more precise visual style control. Seedance 1.5 Pro supports both, while Vidu Q3 is Image-to-Video only.' },
      { q: 'How does Seedance compare to Sora, Runway, Kling, and other AI video tools?', a: 'Seedance 1.5 Pro by ByteDance is optimized for ad video creation, compared to OpenAI Sora, Runway Gen-4, Kling 3.0 (Kuaishou), Hailuo (MiniMax), Pika, Luma Dream Machine, and Google Veo. It supports both text and image input, auto audio generation, and works directly in the browser without any app installation.' },
      { q: 'What is Seedance 2.0?', a: 'ByteDance officially launched Seedance 2.0 on February 12, 2026, featuring unified multimodal audio-video generation, up to 15-second multi-shot output, and significantly improved video quality. It is available via CapCut/Jianying in China, and gwanggo is preparing to support Seedance 2.0 soon.' },
    ],
    otherToolTitle: 'Also try AI Image Generation',
    otherToolDesc: 'Create high-quality AI images with ByteDance Seedream 5 and Z-Image.',
    otherToolCta: 'Go to AI Image Generator',
    pricingCta: 'View Pricing',
    bottomCta: 'Create AI videos now',
    bottomCtaDesc: '15 free credits on sign up. Generate high-quality AI videos with Seedance 1.5 Pro and Vidu Q3.',
  },
  ja: {
    breadcrumbHome: 'ホーム',
    badge: 'AI動画生成ツール',
    heading: 'AI動画生成',
    subheading: 'ByteDance Seedance 1.5 ProとVidu Q3で高品質AI動画を生成。Sora・Runway代替。Seedance 2.0リリース。',
    intro: 'gwanggoのAI動画生成ツールは、ByteDance（バイトダンス）のSeedance 1.5 ProとShengshu Technology（生数科技）のVidu Q3モデルに対応しています。OpenAI Sora、Runway Gen-4、Kling 3.0、Hailuo、Pika、Luma Dream Machineの代替として、広告動画制作に特化しています。テキストプロンプトだけで動画を生成したり、参照画像を活用してより精密なAI動画を作成できます。480pから1080pまでの解像度と最大16秒の動画に対応。ByteDanceのSeedance 2.0も2026年2月にリリースされ、gwanggoでも対応準備中です。',
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
    comparisonHeaders: ['項目', 'Seedance 1.5 Pro', 'Vidu Q3', '', ''],
    comparisonRows: [
      ['開発元', 'ByteDance（バイトダンス）', 'Shengshu Technology（生数科技）', '', ''],
      ['入力方式', 'テキスト / 画像', '画像（必須）', '', ''],
      ['解像度', '480p, 720p', '540p, 720p, 1080p', '', ''],
      ['動画長', '4秒, 8秒, 12秒', '1〜16秒（1秒単位）', '', ''],
      ['オーディオ', '自動生成対応', '対応', '', ''],
    ],
    faqTitle: 'よくある質問',
    faq: [
      { q: 'Seedance 1.5 Proとは何ですか？', a: 'Seedance 1.5 ProはByteDance（バイトダンス）が開発した最新のAI動画生成モデルです。Text-to-Video（テキストから動画）とImage-to-Video（画像から動画）の両方に対応し、プロンプトのみで4〜12秒の動画を自動生成します。' },
      { q: 'Vidu Q3とは何ですか？', a: 'Vidu Q3はShengshu Technology（生数科技）が開発したImage-to-Video AIモデルです。1枚の画像から最大1080p、16秒の高品質動画を生成でき、Auto、Small、Medium、Largeの4段階でモーション強度を細かく調整できます。' },
      { q: 'AI動画生成の料金はいくらですか？', a: '会員登録時に15クレジットが無料で付与されます。Seedance 1.5 Proは解像度（480p: 1クレジット/秒、720p: 2クレジット/秒）と長さに応じて、Vidu Q3は解像度（540p: 1クレジット/秒、720p: 2クレジット/秒、1080p: 3クレジット/秒）に応じてクレジットが消費されます。' },
      { q: '生成された動画の著作権は誰にありますか？', a: 'gwanggoで生成したすべてのAI動画の使用権はユーザーにあります。広告、SNS、ECサイトなど商業目的で自由にご使用いただけます。' },
      { q: 'Text-to-VideoとImage-to-Videoの違いは？', a: 'Text-to-Videoはテキスト説明のみで動画を生成する方式、Image-to-Videoは参照画像をベースに動画を作る方式です。Seedance 1.5 Proは両方対応、Vidu Q3はImage-to-Video専用です。' },
      { q: 'Sora、Runway、Klingなど他のAI動画ツールとの比較は？', a: 'Seedance 1.5 ProはByteDance（バイトダンス）が開発した最新モデルで、OpenAI Sora、Runway Gen-4、Kling 3.0（快手）、Hailuo（MiniMax）、Pika、Luma Dream Machine、Google Veoと比較して広告動画制作に特化しています。テキストと画像の両方入力対応、オーディオ自動生成、アプリ不要でブラウザから直接使用可能です。' },
      { q: 'Seedance 2.0とは何ですか？', a: 'ByteDanceのSeedance 2.0は2026年2月12日に正式リリースされました。マルチモーダル音声動画統合生成、最大15秒のマルチショット出力、大幅に向上した動画品質が特徴です。中国ではCapCut/剪映で提供され、gwanggoでもSeedance 2.0対応を準備中です。' },
    ],
    otherToolTitle: 'AI画像生成もお試しください',
    otherToolDesc: 'ByteDance Seedream 5とZ-Imageで高品質なAI画像を生成できます。',
    otherToolCta: 'AI画像生成へ',
    pricingCta: '料金プランを見る',
    bottomCta: '今すぐAI動画を作成しましょう',
    bottomCtaDesc: '会員登録で15クレジット無料。Seedance 1.5 ProとVidu Q3で高品質なAI動画を生成。',
  },
  zh: {
    breadcrumbHome: '首页',
    badge: 'AI视频生成工具',
    heading: 'AI视频生成',
    subheading: '使用ByteDance Seedance 1.5 Pro和Vidu Q3生成高质量AI视频。Sora、Runway替代方案。Seedance 2.0已发布。',
    intro: 'gwanggo的AI视频生成工具支持ByteDance（字节跳动）的Seedance 1.5 Pro和Shengshu Technology（生数科技）的Vidu Q3模型。作为OpenAI Sora、Runway Gen-4、Kling 3.0、Hailuo、Pika、Luma Dream Machine的替代方案，专为广告视频制作优化。仅通过文字提示即可生成视频，也可以结合参考图片制作更精确的AI视频。支持480p到1080p多种分辨率，最长16秒。ByteDance的Seedance 2.0已于2026年2月发布，gwanggo即将支持。',
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
    comparisonHeaders: ['项目', 'Seedance 1.5 Pro', 'Vidu Q3', '', ''],
    comparisonRows: [
      ['开发商', 'ByteDance（字节跳动）', 'Shengshu Technology（生数科技）', '', ''],
      ['输入方式', '文字 / 图片', '图片（必须）', '', ''],
      ['分辨率', '480p, 720p', '540p, 720p, 1080p', '', ''],
      ['视频时长', '4秒, 8秒, 12秒', '1~16秒（1秒为单位）', '', ''],
      ['音频', '自动生成', '支持', '', ''],
    ],
    faqTitle: '常见问题',
    faq: [
      { q: 'Seedance 1.5 Pro是什么模型？', a: 'Seedance 1.5 Pro是ByteDance（字节跳动）开发的最新AI视频生成模型。同时支持Text-to-Video（文字转视频）和Image-to-Video（图片转视频），仅通过提示词即可自动生成4~12秒的视频。' },
      { q: 'Vidu Q3是什么模型？', a: 'Vidu Q3是Shengshu Technology（生数科技）开发的Image-to-Video AI模型。可以从一张图片生成最高1080p、16秒的高质量视频，并通过Auto、Small、Medium、Large四个级别精细控制运动幅度。' },
      { q: 'AI视频生成费用是多少？', a: '注册时免费获得15积分。Seedance 1.5 Pro按分辨率（480p: 1积分/秒, 720p: 2积分/秒）和时长收费，Vidu Q3按分辨率（540p: 1积分/秒, 720p: 2积分/秒, 1080p: 3积分/秒）和时长收费。' },
      { q: '生成视频的版权归谁？', a: '在gwanggo上生成的所有AI视频的使用权归用户所有。可以自由用于广告、社交媒体、电商等商业目的。' },
      { q: 'Text-to-Video和Image-to-Video有什么区别？', a: 'Text-to-Video仅通过文字描述生成视频，Image-to-Video基于参考图片创建视频。Seedance 1.5 Pro两种方式都支持，Vidu Q3专用于Image-to-Video。' },
      { q: '与Sora、Runway、Kling等其他AI视频工具相比如何？', a: 'Seedance 1.5 Pro是ByteDance（字节跳动）开发的最新模型，与OpenAI Sora、Runway Gen-4、Kling 3.0（快手）、Hailuo（MiniMax）、Pika、Luma Dream Machine、Google Veo相比，更专注于广告视频制作。支持文本和图像双重输入、自动音频生成，无需安装应用程序即可在浏览器中直接使用。' },
      { q: 'Seedance 2.0是什么？', a: 'ByteDance的Seedance 2.0已于2026年2月12日正式发布，提供多模态音视频统合生成、最长15秒多镜头输出、大幅提升的视频质量等重大升级。在中国通过剪映/CapCut提供，gwanggo也正在准备支持Seedance 2.0。' },
    ],
    otherToolTitle: '也试试AI图片生成',
    otherToolDesc: '使用ByteDance Seedream 5和Z-Image生成高质量AI图片。',
    otherToolCta: '前往AI图片生成',
    pricingCta: '查看价格',
    bottomCta: '立即制作AI视频',
    bottomCtaDesc: '注册即送15免费积分。使用Seedance 1.5 Pro和Vidu Q3生成高质量AI视频。',
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
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.comparisonTitle}</h2>
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.comparisonHeaders[0]}</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">{t.comparisonHeaders[1]}</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">{t.comparisonHeaders[2]}</th>
                </tr>
              </thead>
              <tbody>
                {t.comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{row[0]}</td>
                    <td className="px-4 py-3 text-foreground">{row[1]}</td>
                    <td className="px-4 py-3 text-foreground">{row[2]}</td>
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
