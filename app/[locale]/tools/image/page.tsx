import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ImagePlus, Sparkles, ArrowRight, ChevronRight, Zap, Upload, Wand2, Download } from 'lucide-react'
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
  comparisonHeaders: [string, string, string]
  comparisonRows: [string, string, string][]
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
    badge: 'AI 이미지 생성 도구',
    heading: 'AI 이미지 생성',
    subheading: 'ByteDance Seedream 5와 Z-Image로 고품질 AI 이미지를 생성하세요. Midjourney, DALL-E 대안.',
    intro: 'gwanggo의 AI 이미지 생성 도구는 ByteDance(바이트댄스)의 Seedream 5 모델과 Z-Image 모델을 지원합니다. Seedream 5는 참조 이미지를 기반으로 AI가 이미지를 편집하는 Image Edit 모델이며, Z-Image는 텍스트 프롬프트만으로 이미지를 생성하는 Text-to-Image 모델입니다. Midjourney V7, DALL-E 3, Stable Diffusion 4, GPT Image, Flux, Ideogram, Adobe Firefly 등 다양한 AI 이미지 모델의 대안으로, 광고 이미지 제작에 특화되어 있습니다. 다양한 화면 비율과 화질 옵션을 지원하며, 회원가입 시 무료 크레딧이 제공됩니다.',
    cta: '무료로 시작하기',
    modelsTitle: '지원 모델',
    models: [
      {
        name: 'Seedream 5',
        badge: 'ByteDance (바이트댄스)',
        desc: 'ByteDance(바이트댄스)가 개발한 AI 이미지 편집(Image Edit) 모델입니다. 참조 이미지를 업로드하고 텍스트 프롬프트로 편집 지시를 내리면, AI가 이미지를 원하는 대로 변환합니다.',
        features: ['이미지 편집 (Image Edit)', '참조 이미지 기반 AI 변환', '1:1~21:9 등 8가지 화면 비율', '기본/고화질 선택 가능'],
        specs: '화면 비율: 1:1, 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 21:9 | 화질: 기본(2크레딧), 고화질(3크레딧)',
      },
      {
        name: 'Z-Image',
        badge: 'Text to Image',
        desc: 'Z-Image는 텍스트 프롬프트만 입력하면 고품질 이미지를 생성하는 Text-to-Image AI 모델입니다. 참조 이미지 없이도 사용할 수 있어, 빠르게 아이디어를 시각화하거나 광고 소재를 만들 수 있습니다.',
        features: ['텍스트 → 이미지 (Text to Image)', '참조 이미지 불필요', '5가지 화면 비율 지원', '빠른 생성 속도'],
        specs: '화면 비율: 1:1, 4:3, 3:4, 16:9, 9:16 | 비용: 1크레딧',
      },
    ],
    howItWorksTitle: '사용 방법',
    steps: [
      { icon: 'prompt', title: '프롬프트 입력', desc: '생성·편집할 이미지를 텍스트로 설명합니다' },
      { icon: 'upload', title: '이미지 업로드 (Seedream)', desc: 'Seedream 5 사용 시 참조 이미지를 업로드' },
      { icon: 'generate', title: 'AI 이미지 생성', desc: 'AI가 자동으로 고품질 이미지를 생성합니다' },
      { icon: 'download', title: '다운로드', desc: '완성된 이미지를 바로 다운로드하세요' },
    ],
    useCasesTitle: '활용 사례',
    useCases: [
      '광고 이미지 제작 · SNS 마케팅 소재',
      '제품 사진 편집 · 쇼핑몰 상세페이지',
      '브랜딩 디자인 · 로고, 배너 시안',
      '콘텐츠 제작 · 블로그, 프레젠테이션 이미지',
    ],
    comparisonTitle: '모델 비교',
    comparisonHeaders: ['항목', 'Seedream 5', 'Z-Image'],
    comparisonRows: [
      ['개발사', 'ByteDance (바이트댄스)', 'gwanggo'],
      ['입력 방식', '텍스트 + 참조 이미지 (필수)', '텍스트만 (프롬프트)'],
      ['기능', '이미지 편집 (Image Edit)', '이미지 생성 (Text to Image)'],
      ['화면 비율', '8가지 (1:1~21:9)', '5가지 (1:1~9:16)'],
      ['비용', '기본 2크레딧, 고화질 3크레딧', '1크레딧'],
    ],
    faqTitle: '자주 묻는 질문',
    faq: [
      { q: 'Seedream 5는 어떤 모델인가요?', a: 'Seedream 5는 ByteDance(바이트댄스)가 개발한 AI 이미지 편집 모델입니다. 참조 이미지를 업로드하고 텍스트 프롬프트로 편집 지시를 내리면, AI가 이미지를 원하는 스타일로 변환합니다. 1:1부터 21:9까지 8가지 화면 비율과 기본/고화질 옵션을 지원합니다.' },
      { q: 'Z-Image는 어떤 모델인가요?', a: 'Z-Image는 Text-to-Image AI 모델로, 텍스트 프롬프트만 입력하면 고품질 이미지를 자동 생성합니다. 참조 이미지 없이 사용할 수 있어, 빠르게 아이디어를 시각화하거나 광고 소재, 블로그 이미지 등을 만들 수 있습니다.' },
      { q: 'Seedream 5와 Z-Image의 차이는 무엇인가요?', a: 'Seedream 5는 참조 이미지를 기반으로 편집하는 Image Edit 모델이고, Z-Image는 텍스트만으로 새 이미지를 생성하는 Text-to-Image 모델입니다. 기존 이미지를 수정하려면 Seedream 5를, 새 이미지를 만들려면 Z-Image를 선택하세요.' },
      { q: 'AI 이미지 생성 비용은 얼마인가요?', a: '회원가입 시 15크레딧이 무료로 제공됩니다. Seedream 5는 기본 화질 2크레딧, 고화질 3크레딧이며, Z-Image는 1크레딧입니다.' },
      { q: '생성된 이미지의 저작권은 누구에게 있나요?', a: 'gwanggo에서 생성한 모든 AI 이미지의 사용 권리는 사용자에게 있습니다. 광고, SNS, 쇼핑몰 등 상업적 용도로 자유롭게 사용하실 수 있습니다.' },
      { q: 'Midjourney, DALL-E와 비교하면 어떤가요?', a: 'Seedream 5는 Midjourney V7, DALL-E 3, Stable Diffusion 4, GPT Image, Flux, Ideogram 3.0, Adobe Firefly, Leonardo AI 등과 비교해 광고 이미지 편집에 특화된 모델입니다. 참조 이미지 기반의 정밀한 편집이 가능하고, 별도 앱 설치 없이 웹에서 바로 사용할 수 있으며, 상업적 이용이 자유롭습니다.' },
    ],
    otherToolTitle: 'AI 영상 생성도 사용해보세요',
    otherToolDesc: 'ByteDance Seedance 1.5 Pro와 Vidu Q3로 텍스트·이미지에서 고품질 AI 영상을 생성할 수 있습니다.',
    otherToolCta: 'AI 영상 생성 바로가기',
    pricingCta: '요금제 보기',
    bottomCta: '지금 바로 AI 이미지를 만들어보세요',
    bottomCtaDesc: '회원가입 시 15크레딧 무료 제공. Seedream 5와 Z-Image로 고품질 AI 이미지를 생성하세요.',
  },
  en: {
    breadcrumbHome: 'Home',
    badge: 'AI Image Generation Tool',
    heading: 'AI Image Generator',
    subheading: 'Create high-quality AI images with ByteDance Seedream 5 and Z-Image. Best Midjourney & DALL-E alternative.',
    intro: 'gwanggo\'s AI image generator supports ByteDance\'s Seedream 5 and Z-Image models. Seedream 5 is an Image Edit model that transforms images using reference photos and text prompts. Z-Image is a Text-to-Image model that generates images from text alone. A powerful alternative to Midjourney V7, DALL-E 3, Stable Diffusion 4, GPT Image, Flux, Ideogram, and Adobe Firefly, optimized for commercial ad image creation. Multiple aspect ratios and quality options available. Free credits on sign up.',
    cta: 'Start for Free',
    modelsTitle: 'Supported Models',
    models: [
      {
        name: 'Seedream 5',
        badge: 'ByteDance',
        desc: 'AI image editing model developed by ByteDance. Upload a reference image and describe your edits with text prompts. The AI transforms the image to match your vision.',
        features: ['Image editing (Image Edit)', 'Reference image-based AI transformation', '8 aspect ratios from 1:1 to 21:9', 'Basic/High quality options'],
        specs: 'Aspect ratios: 1:1, 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 21:9 | Quality: Basic (2 credits), High (3 credits)',
      },
      {
        name: 'Z-Image',
        badge: 'Text to Image',
        desc: 'Text-to-Image AI model that generates high-quality images from text prompts alone. No reference image needed—perfect for quickly visualizing ideas or creating ad creatives.',
        features: ['Text → Image (Text to Image)', 'No reference image required', '5 aspect ratios supported', 'Fast generation speed'],
        specs: 'Aspect ratios: 1:1, 4:3, 3:4, 16:9, 9:16 | Cost: 1 credit',
      },
    ],
    howItWorksTitle: 'How It Works',
    steps: [
      { icon: 'prompt', title: 'Enter a Prompt', desc: 'Describe the image you want to create or edit' },
      { icon: 'upload', title: 'Upload Image (Seedream)', desc: 'Upload a reference image for Seedream 5' },
      { icon: 'generate', title: 'AI Generates Image', desc: 'AI automatically creates a high-quality image' },
      { icon: 'download', title: 'Download', desc: 'Download your finished image instantly' },
    ],
    useCasesTitle: 'Use Cases',
    useCases: [
      'Ad creative production and social media marketing',
      'Product photo editing for e-commerce',
      'Branding design — logos, banners, mockups',
      'Content creation — blog posts, presentations',
    ],
    comparisonTitle: 'Model Comparison',
    comparisonHeaders: ['Feature', 'Seedream 5', 'Z-Image'],
    comparisonRows: [
      ['Developer', 'ByteDance', 'gwanggo'],
      ['Input', 'Text + Reference image (required)', 'Text only (prompt)'],
      ['Function', 'Image editing (Image Edit)', 'Image generation (Text to Image)'],
      ['Aspect Ratios', '8 options (1:1–21:9)', '5 options (1:1–9:16)'],
      ['Cost', 'Basic 2 credits, High 3 credits', '1 credit'],
    ],
    faqTitle: 'Frequently Asked Questions',
    faq: [
      { q: 'What is Seedream 5?', a: 'Seedream 5 is an AI image editing model developed by ByteDance. Upload a reference image and describe your edits with text prompts. Supports 8 aspect ratios from 1:1 to 21:9 with basic and high quality options.' },
      { q: 'What is Z-Image?', a: 'Z-Image is a Text-to-Image AI model that generates high-quality images from text prompts alone. No reference image required—ideal for quickly visualizing ideas, creating ad creatives, or blog images.' },
      { q: 'What is the difference between Seedream 5 and Z-Image?', a: 'Seedream 5 is an Image Edit model that modifies existing images based on a reference, while Z-Image is a Text-to-Image model that creates new images from text. Use Seedream 5 to modify existing images, Z-Image to create new ones.' },
      { q: 'How much does AI image generation cost?', a: 'You get 15 free credits on sign up. Seedream 5 costs 2 credits (basic) or 3 credits (high quality). Z-Image costs 1 credit per generation.' },
      { q: 'Who owns the copyright of generated images?', a: 'You retain full usage rights to all AI images created on gwanggo. You can freely use them for commercial purposes including ads, social media, and e-commerce.' },
      { q: 'How does Seedream 5 compare to Midjourney, DALL-E, and other AI image tools?', a: 'Seedream 5 by ByteDance is optimized for commercial ad image editing, compared to Midjourney V7, DALL-E 3, Stable Diffusion 4, GPT Image, Flux, Ideogram 3.0, Adobe Firefly, and Leonardo AI. It features reference image-based precise editing, works directly in the browser without any app installation, and offers full commercial usage rights.' },
    ],
    otherToolTitle: 'Also try AI Video Generation',
    otherToolDesc: 'Create high-quality AI videos with ByteDance Seedance 1.5 Pro and Vidu Q3.',
    otherToolCta: 'Go to AI Video Generator',
    pricingCta: 'View Pricing',
    bottomCta: 'Create AI images now',
    bottomCtaDesc: '15 free credits on sign up. Generate high-quality AI images with Seedream 5 and Z-Image.',
  },
  ja: {
    breadcrumbHome: 'ホーム',
    badge: 'AI画像生成ツール',
    heading: 'AI画像生成',
    subheading: 'ByteDance Seedream 5とZ-Imageで高品質なAI画像を生成。Midjourney・DALL-E代替。',
    intro: 'gwanggoのAI画像生成ツールは、ByteDance（バイトダンス）のSeedream 5モデルとZ-Imageモデルに対応しています。Seedream 5は参照画像をベースにAIが画像を編集するImage Editモデル、Z-Imageはテキストプロンプトのみで画像を生成するText-to-Imageモデルです。Midjourney V7、DALL-E 3、Stable Diffusion 4、GPT Image、Flux、Ideogram、Adobe Fireflyの代替として、広告画像制作に特化しています。多様なアスペクト比と画質オプションに対応。会員登録時に無料クレジット付与。',
    cta: '無料で始める',
    modelsTitle: '対応モデル',
    models: [
      {
        name: 'Seedream 5',
        badge: 'ByteDance（バイトダンス）',
        desc: 'ByteDance（バイトダンス）が開発したAI画像編集（Image Edit）モデル。参照画像をアップロードし、テキストプロンプトで編集指示を出すと、AIが画像を目的通りに変換します。',
        features: ['画像編集（Image Edit）', '参照画像ベースのAI変換', '1:1〜21:9の8種類のアスペクト比', '基本/高画質選択可能'],
        specs: 'アスペクト比: 1:1, 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 21:9 | 画質: 基本(2クレジット), 高画質(3クレジット)',
      },
      {
        name: 'Z-Image',
        badge: 'Text to Image',
        desc: 'テキストプロンプトのみで高品質な画像を生成するText-to-Image AIモデル。参照画像なしで使用でき、アイデアの視覚化や広告素材の制作に最適です。',
        features: ['テキスト→画像（Text to Image）', '参照画像不要', '5種類のアスペクト比対応', '高速生成'],
        specs: 'アスペクト比: 1:1, 4:3, 3:4, 16:9, 9:16 | 料金: 1クレジット',
      },
    ],
    howItWorksTitle: '使い方',
    steps: [
      { icon: 'prompt', title: 'プロンプト入力', desc: '作成・編集したい画像をテキストで説明' },
      { icon: 'upload', title: '画像アップロード（Seedream）', desc: 'Seedream 5使用時に参照画像をアップロード' },
      { icon: 'generate', title: 'AI画像生成', desc: 'AIが自動で高品質な画像を生成' },
      { icon: 'download', title: 'ダウンロード', desc: '完成した画像をすぐダウンロード' },
    ],
    useCasesTitle: '活用シーン',
    useCases: [
      '広告画像制作・SNSマーケティング素材',
      '商品写真編集・ECサイト商品ページ',
      'ブランディングデザイン・ロゴ、バナー',
      'コンテンツ制作・ブログ、プレゼンテーション',
    ],
    comparisonTitle: 'モデル比較',
    comparisonHeaders: ['項目', 'Seedream 5', 'Z-Image'],
    comparisonRows: [
      ['開発元', 'ByteDance（バイトダンス）', 'gwanggo'],
      ['入力方式', 'テキスト + 参照画像（必須）', 'テキストのみ（プロンプト）'],
      ['機能', '画像編集（Image Edit）', '画像生成（Text to Image）'],
      ['アスペクト比', '8種類（1:1〜21:9）', '5種類（1:1〜9:16）'],
      ['料金', '基本2クレジット、高画質3クレジット', '1クレジット'],
    ],
    faqTitle: 'よくある質問',
    faq: [
      { q: 'Seedream 5とは何ですか？', a: 'Seedream 5はByteDance（バイトダンス）が開発したAI画像編集モデルです。参照画像をアップロードし、テキストプロンプトで編集指示を出すと、AIが画像を目的のスタイルに変換します。1:1から21:9まで8種類のアスペクト比と基本/高画質オプションに対応。' },
      { q: 'Z-Imageとは何ですか？', a: 'Z-ImageはText-to-Image AIモデルで、テキストプロンプトのみで高品質な画像を自動生成します。参照画像なしで使用でき、アイデアの視覚化、広告素材、ブログ画像などの制作に最適です。' },
      { q: 'Seedream 5とZ-Imageの違いは？', a: 'Seedream 5は参照画像をベースに編集するImage Editモデル、Z-Imageはテキストから新しい画像を生成するText-to-Imageモデルです。既存の画像を修正するにはSeedream 5を、新しい画像を作るにはZ-Imageを選んでください。' },
      { q: 'AI画像生成の料金はいくらですか？', a: '会員登録時に15クレジットが無料で付与されます。Seedream 5は基本画質2クレジット、高画質3クレジット。Z-Imageは1クレジットです。' },
      { q: '生成された画像の著作権は誰にありますか？', a: 'gwanggoで生成したすべてのAI画像の使用権はユーザーにあります。広告、SNS、ECサイトなど商業目的で自由にご使用いただけます。' },
      { q: 'Midjourney、DALL-Eなど他のAI画像ツールとの比較は？', a: 'Seedream 5はByteDance（バイトダンス）が開発した最新モデルで、Midjourney V7、DALL-E 3、Stable Diffusion 4、GPT Image、Flux、Ideogram 3.0、Adobe Firefly、Leonardo AIと比較して広告画像編集に特化しています。参照画像ベースの精密編集が可能で、アプリ不要でブラウザから直接使用でき、商用利用が自由です。' },
    ],
    otherToolTitle: 'AI動画生成もお試しください',
    otherToolDesc: 'ByteDance Seedance 1.5 ProとVidu Q3でテキスト・画像から高品質なAI動画を生成できます。',
    otherToolCta: 'AI動画生成へ',
    pricingCta: '料金プランを見る',
    bottomCta: '今すぐAI画像を作成しましょう',
    bottomCtaDesc: '会員登録で15クレジット無料。Seedream 5とZ-Imageで高品質なAI画像を生成。',
  },
  zh: {
    breadcrumbHome: '首页',
    badge: 'AI图片生成工具',
    heading: 'AI图片生成',
    subheading: '使用ByteDance Seedream 5和Z-Image生成高质量AI图片。Midjourney、DALL-E替代方案。',
    intro: 'gwanggo的AI图片生成工具支持ByteDance（字节跳动）的Seedream 5模型和Z-Image模型。Seedream 5是基于参考图片进行AI编辑的Image Edit模型，Z-Image是仅通过文字提示生成图片的Text-to-Image模型。作为Midjourney V7、DALL-E 3、Stable Diffusion 4、GPT Image、Flux、Ideogram、Adobe Firefly的替代方案，专为广告图片制作优化。支持多种画面比例和画质选项。注册即送免费积分。',
    cta: '免费开始',
    modelsTitle: '支持模型',
    models: [
      {
        name: 'Seedream 5',
        badge: 'ByteDance（字节跳动）',
        desc: 'ByteDance（字节跳动）开发的AI图片编辑（Image Edit）模型。上传参考图片并通过文字提示进行编辑指示，AI将图片按您的要求进行变换。',
        features: ['图片编辑（Image Edit）', '基于参考图片的AI变换', '1:1~21:9共8种画面比例', '基础/高画质可选'],
        specs: '画面比例: 1:1, 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 21:9 | 画质: 基础(2积分), 高画质(3积分)',
      },
      {
        name: 'Z-Image',
        badge: 'Text to Image',
        desc: '仅通过文字提示即可生成高质量图片的Text-to-Image AI模型。无需参考图片，非常适合快速将想法可视化或制作广告素材。',
        features: ['文字→图片（Text to Image）', '无需参考图片', '支持5种画面比例', '快速生成'],
        specs: '画面比例: 1:1, 4:3, 3:4, 16:9, 9:16 | 费用: 1积分',
      },
    ],
    howItWorksTitle: '使用方法',
    steps: [
      { icon: 'prompt', title: '输入提示词', desc: '用文字描述您想要创建或编辑的图片' },
      { icon: 'upload', title: '上传图片（Seedream）', desc: '使用Seedream 5时上传参考图片' },
      { icon: 'generate', title: 'AI生成图片', desc: 'AI自动生成高质量图片' },
      { icon: 'download', title: '下载', desc: '立即下载您的成品图片' },
    ],
    useCasesTitle: '应用场景',
    useCases: [
      '广告图片制作·社交媒体营销素材',
      '产品图片编辑·电商详情页',
      '品牌设计·Logo、横幅、样稿',
      '内容创作·博客、演示文稿图片',
    ],
    comparisonTitle: '模型对比',
    comparisonHeaders: ['项目', 'Seedream 5', 'Z-Image'],
    comparisonRows: [
      ['开发商', 'ByteDance（字节跳动）', 'gwanggo'],
      ['输入方式', '文字 + 参考图片（必须）', '仅文字（提示词）'],
      ['功能', '图片编辑（Image Edit）', '图片生成（Text to Image）'],
      ['画面比例', '8种（1:1~21:9）', '5种（1:1~9:16）'],
      ['费用', '基础2积分，高画质3积分', '1积分'],
    ],
    faqTitle: '常见问题',
    faq: [
      { q: 'Seedream 5是什么模型？', a: 'Seedream 5是ByteDance（字节跳动）开发的AI图片编辑模型。上传参考图片并通过文字提示进行编辑，AI将图片按您想要的风格进行变换。支持从1:1到21:9的8种画面比例和基础/高画质选项。' },
      { q: 'Z-Image是什么模型？', a: 'Z-Image是Text-to-Image AI模型，仅输入文字提示即可自动生成高质量图片。无需参考图片，非常适合快速将想法可视化、制作广告素材或博客图片。' },
      { q: 'Seedream 5和Z-Image有什么区别？', a: 'Seedream 5是基于参考图片进行编辑的Image Edit模型，Z-Image是从文字生成新图片的Text-to-Image模型。要修改现有图片用Seedream 5，要创建新图片用Z-Image。' },
      { q: 'AI图片生成费用是多少？', a: '注册时免费获得15积分。Seedream 5基础画质2积分、高画质3积分，Z-Image每次1积分。' },
      { q: '生成图片的版权归谁？', a: '在gwanggo上生成的所有AI图片的使用权归用户所有。可以自由用于广告、社交媒体、电商等商业目的。' },
      { q: '与Midjourney、DALL-E等其他AI图片工具相比如何？', a: 'Seedream 5是ByteDance（字节跳动）开发的最新模型，与Midjourney V7、DALL-E 3、Stable Diffusion 4、GPT Image、Flux、Ideogram 3.0、Adobe Firefly、Leonardo AI相比，更专注于广告图片编辑。支持参考图片精确编辑，无需安装应用程序，可直接在浏览器中使用，且商业使用完全自由。' },
    ],
    otherToolTitle: '也试试AI视频生成',
    otherToolDesc: '使用ByteDance Seedance 1.5 Pro和Vidu Q3从文字和图片生成高质量AI视频。',
    otherToolCta: '前往AI视频生成',
    pricingCta: '查看价格',
    bottomCta: '立即制作AI图片',
    bottomCtaDesc: '注册即送15免费积分。使用Seedream 5和Z-Image生成高质量AI图片。',
  },
}

const stepIcons = {
  prompt: Zap,
  upload: Upload,
  generate: Wand2,
  download: Download,
}

export default async function ImageToolPage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const t = i18n[locale]
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
    { name: t.breadcrumbHome, url: `${siteUrl}/${locale}` },
    { name: t.heading, url: `${siteUrl}/${locale}/tools/image` },
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
              <ImagePlus className="w-4 h-4" />
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
              <Link href={`/${locale}/tools/video`} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
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
              <Link href="/dashboard/ai-tools/image" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-8 py-3 text-white font-medium hover:opacity-90 transition-opacity">
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
