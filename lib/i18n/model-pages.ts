/**
 * AI 모델별 SEO 랜딩 페이지 데이터
 *
 * 각 모델 이름으로 검색 시 Google/Naver에 노출되도록
 * 모델별 전용 URL + 고유 콘텐츠를 제공합니다.
 */

import { type Locale } from './seo'

// ============================================================
// 타입 정의
// ============================================================

interface ModelLocaleSeo {
  title: string
  description: string
  keywords: string[]
  subtitle: string
  features: string[]
  faq: Array<{ q: string; a: string }>
}

export interface ModelPageData {
  slug: string
  name: string
  creator: string
  type: 'image' | 'video'
  modes: string[]
  resolutions: string[]
  duration?: string
  creditSummary: Record<Locale, string>
  seo: Record<Locale, ModelLocaleSeo>
}

// ============================================================
// 이미지 모델
// ============================================================

export const IMAGE_MODEL_SLUGS = ['seedream-5', 'flux-2-pro', 'grok-imagine', 'z-image', 'nano-banana-2', 'recraft-v4', 'qwen-image-2', 'flux-kontext'] as const
export type ImageModelSlug = (typeof IMAGE_MODEL_SLUGS)[number]

export const IMAGE_MODELS: Record<ImageModelSlug, ModelPageData> = {
  'seedream-5': {
    slug: 'seedream-5',
    name: 'Seedream 5',
    creator: 'ByteDance',
    type: 'image',
    modes: ['Text to Image', 'Image Edit'],
    resolutions: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    creditSummary: {
      ko: '중화질 2크레딧, 고화질 3크레딧',
      en: '2 credits (medium), 3 credits (high)',
      ja: '中画質2クレジット、高画質3クレジット',
      zh: '中画质2积分，高画质3积分',
    },
    seo: {
      ko: {
        title: 'Seedream 5 AI 이미지 생성기 - ByteDance 최신 모델 무료 사용',
        description: 'ByteDance의 Seedream 5로 고품질 AI 이미지를 생성하세요. 텍스트-이미지, 이미지 편집 지원. 다양한 비율, 중/고화질 선택. Midjourney, DALL-E 대안. 무료 크레딧으로 시작.',
        keywords: ['Seedream 5', 'Seedream', 'ByteDance AI', 'ByteDance Seedream', '바이트댄스 AI', 'Seedream 5 사용법', 'Seedream 5 무료', 'Seedream AI 이미지', 'Seedream 이미지 생성', 'Seedream Pro', 'AI 이미지 생성', 'Midjourney 대안', 'DALL-E 대안', '무료 AI 이미지 생성기'],
        subtitle: 'ByteDance가 개발한 최신 AI 이미지 생성 모델',
        features: [
          '텍스트로 고품질 이미지 생성 (Text to Image)',
          '기존 이미지 편집 및 변환 (Image Edit)',
          '5가지 종횡비 지원 (1:1, 4:3, 3:4, 16:9, 9:16)',
          '중화질/고화질 선택 가능',
          '광고, SNS, 상세페이지용 이미지 최적화',
          '한국어 프롬프트 지원',
        ],
        faq: [
          { q: 'Seedream 5란 무엇인가요?', a: 'Seedream 5는 ByteDance(바이트댄스)가 개발한 최신 AI 이미지 생성 모델입니다. 텍스트 설명만으로 고품질 이미지를 생성하거나, 기존 이미지를 AI로 편집할 수 있습니다. gwanggo에서 무료로 사용할 수 있습니다.' },
          { q: 'Seedream 5는 무료인가요?', a: '네, gwanggo 회원가입 시 제공되는 무료 크레딧으로 Seedream 5를 바로 사용할 수 있습니다. 중화질은 2크레딧, 고화질은 3크레딧이 소모됩니다.' },
          { q: 'Seedream 5와 Midjourney의 차이점은?', a: 'Seedream 5는 웹 브라우저에서 바로 사용 가능하며, Discord 등 별도 프로그램이 필요 없습니다. 이미지 편집 기능도 내장되어 있어 생성 후 바로 수정할 수 있습니다. 광고용 이미지 제작에 특히 최적화되어 있습니다.' },
          { q: 'Seedream 5로 어떤 이미지를 만들 수 있나요?', a: '제품 광고 이미지, SNS 포스트, 쇼핑몰 상세페이지, 배너, 브랜드 콘텐츠 등 다양한 이미지를 만들 수 있습니다. 5가지 종횡비를 지원하여 인스타그램, 페이스북 등 각 플랫폼에 최적화된 크기로 생성 가능합니다.' },
        ],
      },
      en: {
        title: 'Seedream 5 AI Image Generator - ByteDance Latest Model Free',
        description: 'Generate high-quality AI images with ByteDance\'s Seedream 5. Text-to-image and image editing. Multiple aspect ratios. Midjourney, DALL-E alternative. Start free.',
        keywords: ['Seedream 5', 'Seedream', 'ByteDance AI', 'ByteDance Seedream', 'Seedream 5 free', 'Seedream AI image', 'Seedream image generator', 'Seedream Pro', 'AI image generator', 'Midjourney alternative', 'DALL-E alternative', 'free AI image generator'],
        subtitle: 'Latest AI image generation model by ByteDance',
        features: [
          'Generate high-quality images from text (Text to Image)',
          'Edit and transform existing images (Image Edit)',
          '5 aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16)',
          'Medium and high quality options',
          'Optimized for ads, social media, and e-commerce',
          'Multi-language prompt support',
        ],
        faq: [
          { q: 'What is Seedream 5?', a: 'Seedream 5 is the latest AI image generation model developed by ByteDance. It can generate high-quality images from text descriptions or edit existing images with AI. Available for free on gwanggo.' },
          { q: 'Is Seedream 5 free?', a: 'Yes, you can use Seedream 5 immediately with free credits provided at sign-up. Medium quality costs 2 credits, high quality costs 3 credits per image.' },
          { q: 'How does Seedream 5 compare to Midjourney?', a: 'Seedream 5 works directly in your web browser with no Discord or additional software needed. It includes built-in image editing capabilities. Particularly optimized for advertising image creation.' },
          { q: 'What images can I create with Seedream 5?', a: 'Product ads, social media posts, e-commerce detail pages, banners, and brand content. Supports 5 aspect ratios for Instagram, Facebook, and other platforms.' },
        ],
      },
      ja: {
        title: 'Seedream 5 AI画像生成 - ByteDance最新モデル 無料で使える',
        description: 'ByteDanceのSeedream 5で高品質AI画像を生成。テキストから画像生成、画像編集対応。複数のアスペクト比。Midjourney、DALL-E代替。無料クレジットで開始。',
        keywords: ['Seedream 5', 'Seedream', 'ByteDance AI', 'バイトダンスAI', 'Seedream 5 無料', 'Seedream AI画像', 'Seedream 画像生成', 'AI画像生成', 'Midjourney代替', 'DALL-E代替', '無料AI画像生成'],
        subtitle: 'ByteDanceが開発した最新AI画像生成モデル',
        features: [
          'テキストから高品質画像を生成（Text to Image）',
          '既存画像の編集・変換（Image Edit）',
          '5種類のアスペクト比対応（1:1, 4:3, 3:4, 16:9, 9:16）',
          '中画質・高画質の選択可能',
          '広告、SNS、ECサイト向け最適化',
          '多言語プロンプト対応',
        ],
        faq: [
          { q: 'Seedream 5とは？', a: 'Seedream 5はByteDanceが開発した最新のAI画像生成モデルです。テキスト説明から高品質画像を生成したり、既存画像をAIで編集できます。gwanggoで無料で利用可能です。' },
          { q: 'Seedream 5は無料ですか？', a: 'はい、会員登録時に提供される無料クレジットですぐにSeedream 5を使用できます。中画質は2クレジット、高画質は3クレジットです。' },
          { q: 'Seedream 5とMidjourneyの違いは？', a: 'Seedream 5はWebブラウザで直接使用可能で、Discordなどの追加ソフトは不要です。画像編集機能も内蔵。広告用画像制作に特に最適化されています。' },
          { q: 'Seedream 5でどんな画像が作れますか？', a: '商品広告、SNS投稿、ECサイト詳細ページ、バナー、ブランドコンテンツなど。5種類のアスペクト比でInstagram、Facebookなど各プラットフォームに最適化可能。' },
        ],
      },
      zh: {
        title: 'Seedream 5 AI图片生成器 - ByteDance最新模型 免费使用',
        description: '使用ByteDance的Seedream 5生成高质量AI图片。支持文字生图、图片编辑。多种宽高比。Midjourney、DALL-E替代。免费积分立即开始。',
        keywords: ['Seedream 5', 'Seedream', 'ByteDance AI', '字节跳动AI', 'Seedream 5 免费', 'Seedream AI图片', 'Seedream 图片生成', 'AI图片生成', 'Midjourney替代', 'DALL-E替代', '免费AI图片生成'],
        subtitle: 'ByteDance开发的最新AI图片生成模型',
        features: [
          '文字生成高质量图片（Text to Image）',
          '编辑和变换现有图片（Image Edit）',
          '支持5种宽高比（1:1, 4:3, 3:4, 16:9, 9:16）',
          '可选中画质/高画质',
          '广告、社交媒体、电商优化',
          '多语言提示词支持',
        ],
        faq: [
          { q: '什么是Seedream 5？', a: 'Seedream 5是ByteDance（字节跳动）开发的最新AI图片生成模型。可以从文字描述生成高质量图片，也可以用AI编辑现有图片。在gwanggo上免费使用。' },
          { q: 'Seedream 5免费吗？', a: '是的，注册时获得的免费积分可以立即使用Seedream 5。中画质2积分，高画质3积分。' },
          { q: 'Seedream 5和Midjourney有什么区别？', a: 'Seedream 5在网页浏览器中直接使用，无需Discord等额外软件。内置图片编辑功能。特别适合广告图片制作。' },
          { q: 'Seedream 5能创建什么图片？', a: '产品广告、社交媒体帖子、电商详情页、横幅、品牌内容等。支持5种宽高比，适配Instagram、Facebook等各平台。' },
        ],
      },
    },
  },

  'flux-2-pro': {
    slug: 'flux-2-pro',
    name: 'FLUX.2 Pro',
    creator: 'Black Forest Labs',
    type: 'image',
    modes: ['Text to Image'],
    resolutions: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    creditSummary: {
      ko: '기본 1크레딧, 고화질 2크레딧',
      en: '1 credit (basic), 2 credits (high)',
      ja: '基本1クレジット、高画質2クレジット',
      zh: '基本1积分，高画质2积分',
    },
    seo: {
      ko: {
        title: 'FLUX.2 Pro AI 이미지 생성기 - Black Forest Labs 무료 사용',
        description: 'Black Forest Labs의 FLUX.2 Pro로 AI 이미지를 생성하세요. 텍스트-이미지 변환, 다양한 비율 지원. Stable Diffusion 제작팀의 최신작. 1크레딧부터 시작. 무료 체험.',
        keywords: ['FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'FLUX Pro', 'Black Forest Labs', 'BFL FLUX', 'FLUX 이미지 생성', 'FLUX 무료', 'FLUX AI 이미지', 'AI 이미지 생성', 'Stable Diffusion 후속', 'FLUX 사용법', 'Midjourney 대안', 'FLUX.2 Pro 무료'],
        subtitle: 'Stable Diffusion 제작팀 Black Forest Labs의 차세대 AI 이미지 모델',
        features: [
          '텍스트만으로 고품질 이미지 생성',
          'Stable Diffusion 개발팀의 최신 기술',
          '5가지 종횡비 지원',
          '기본/고화질 품질 선택',
          '빠른 생성 속도',
          '1크레딧부터 경제적 가격',
        ],
        faq: [
          { q: 'FLUX.2 Pro란 무엇인가요?', a: 'FLUX.2 Pro는 Stable Diffusion을 만든 Black Forest Labs(BFL)의 최신 AI 이미지 생성 모델입니다. 텍스트 설명을 입력하면 고품질 이미지를 생성합니다. gwanggo에서 웹 브라우저로 바로 사용할 수 있습니다.' },
          { q: 'FLUX.2 Pro 사용 비용은?', a: '기본 화질은 1크레딧, 고화질은 2크레딧입니다. gwanggo 회원가입 시 무료 크레딧이 제공되어 바로 체험할 수 있습니다.' },
          { q: 'FLUX.2 Pro와 Stable Diffusion의 차이점은?', a: 'FLUX.2 Pro는 Stable Diffusion 팀이 새롭게 개발한 차세대 모델로, 더 높은 품질과 텍스트 이해도를 제공합니다. 별도 설치 없이 웹에서 바로 사용 가능합니다.' },
          { q: 'FLUX.2 Pro는 어떤 용도에 적합한가요?', a: '제품 사진, 광고 배너, SNS 콘텐츠, 블로그 이미지 등 다양한 용도에 활용할 수 있습니다. 특히 텍스트 렌더링 품질이 우수하여 로고나 타이포그래피가 포함된 이미지에 강점이 있습니다.' },
        ],
      },
      en: {
        title: 'FLUX.2 Pro AI Image Generator - Black Forest Labs Free',
        description: 'Generate AI images with Black Forest Labs\' FLUX.2 Pro. Text-to-image with multiple aspect ratios. From the creators of Stable Diffusion. Start from 1 credit. Try free.',
        keywords: ['FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'FLUX Pro', 'Black Forest Labs', 'BFL FLUX', 'FLUX image generator', 'FLUX free', 'AI image generator', 'Stable Diffusion successor', 'Midjourney alternative', 'FLUX.2 Pro free'],
        subtitle: 'Next-gen AI image model from Black Forest Labs, creators of Stable Diffusion',
        features: [
          'Generate high-quality images from text',
          'Latest technology from Stable Diffusion creators',
          '5 aspect ratios supported',
          'Basic and high quality options',
          'Fast generation speed',
          'Affordable from just 1 credit',
        ],
        faq: [
          { q: 'What is FLUX.2 Pro?', a: 'FLUX.2 Pro is the latest AI image generation model from Black Forest Labs (BFL), the creators of Stable Diffusion. Enter a text description to generate high-quality images. Use it directly in your browser on gwanggo.' },
          { q: 'How much does FLUX.2 Pro cost?', a: 'Basic quality is 1 credit, high quality is 2 credits per image. Free credits are provided at sign-up for immediate trial.' },
          { q: 'How does FLUX.2 Pro compare to Stable Diffusion?', a: 'FLUX.2 Pro is the next-generation model from the same team, offering higher quality and better text understanding. No installation needed — works directly in web browsers.' },
          { q: 'What is FLUX.2 Pro good for?', a: 'Product photos, ad banners, social media content, blog images, and more. Especially strong in text rendering quality for logos and typography in images.' },
        ],
      },
      ja: {
        title: 'FLUX.2 Pro AI画像生成 - Black Forest Labs 無料で使える',
        description: 'Black Forest LabsのFLUX.2 Proで AI画像を生成。テキストから画像生成、複数アスペクト比対応。Stable Diffusion開発チームの最新作。1クレジットから。無料体験。',
        keywords: ['FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'Black Forest Labs', 'FLUX 画像生成', 'FLUX 無料', 'AI画像生成', 'Stable Diffusion 後継', 'Midjourney代替', 'FLUX.2 Pro 無料'],
        subtitle: 'Stable Diffusion開発チームBlack Forest Labsの次世代AI画像モデル',
        features: [
          'テキストから高品質画像を生成',
          'Stable Diffusion開発チームの最新技術',
          '5種類のアスペクト比対応',
          '基本・高画質の品質選択',
          '高速生成',
          '1クレジットからの手頃な価格',
        ],
        faq: [
          { q: 'FLUX.2 Proとは？', a: 'FLUX.2 ProはStable Diffusionを開発したBlack Forest Labs（BFL）の最新AI画像生成モデルです。テキスト説明から高品質画像を生成します。gwanggoでWebブラウザから直接使用可能。' },
          { q: 'FLUX.2 Proの利用料金は？', a: '基本画質は1クレジット、高画質は2クレジットです。会員登録時に無料クレジットが提供され、すぐに体験できます。' },
          { q: 'FLUX.2 ProとStable Diffusionの違いは？', a: 'FLUX.2 Proは同チームが開発した次世代モデルで、より高い品質とテキスト理解度を提供。インストール不要でWebで直接使用可能。' },
          { q: 'FLUX.2 Proはどんな用途に向いていますか？', a: '商品写真、広告バナー、SNSコンテンツ、ブログ画像など。特にテキストレンダリング品質が優秀で、ロゴやタイポグラフィを含む画像に強みがあります。' },
        ],
      },
      zh: {
        title: 'FLUX.2 Pro AI图片生成器 - Black Forest Labs 免费使用',
        description: '使用Black Forest Labs的FLUX.2 Pro生成AI图片。文字生图，多种宽高比。Stable Diffusion团队最新作品。1积分起。免费试用。',
        keywords: ['FLUX.2 Pro', 'FLUX 2 Pro', 'FLUX AI', 'Black Forest Labs', 'FLUX 图片生成', 'FLUX 免费', 'AI图片生成', 'Stable Diffusion 后继', 'Midjourney替代', 'FLUX.2 Pro 免费'],
        subtitle: 'Stable Diffusion团队Black Forest Labs的下一代AI图片模型',
        features: [
          '文字生成高质量图片',
          'Stable Diffusion开发团队最新技术',
          '支持5种宽高比',
          '基本/高画质可选',
          '快速生成',
          '1积分起的实惠价格',
        ],
        faq: [
          { q: '什么是FLUX.2 Pro？', a: 'FLUX.2 Pro是Stable Diffusion开发团队Black Forest Labs（BFL）的最新AI图片生成模型。输入文字描述即可生成高质量图片。在gwanggo网页浏览器中直接使用。' },
          { q: 'FLUX.2 Pro费用多少？', a: '基本画质1积分，高画质2积分。注册时提供免费积分，可立即体验。' },
          { q: 'FLUX.2 Pro和Stable Diffusion有什么区别？', a: 'FLUX.2 Pro是同一团队开发的下一代模型，提供更高质量和更好的文字理解。无需安装，网页直接使用。' },
          { q: 'FLUX.2 Pro适合什么用途？', a: '产品照片、广告横幅、社交媒体内容、博客图片等。文字渲染质量尤其出色，适合含有Logo和排版的图片。' },
        ],
      },
    },
  },

  'grok-imagine': {
    slug: 'grok-imagine',
    name: 'Grok Imagine Image',
    creator: 'xAI',
    type: 'image',
    modes: ['Text to Image'],
    resolutions: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    creditSummary: {
      ko: '1크레딧',
      en: '1 credit',
      ja: '1クレジット',
      zh: '1积分',
    },
    seo: {
      ko: {
        title: 'Grok Imagine 이미지 생성기 - xAI Grok AI 이미지 무료',
        description: 'Elon Musk의 xAI가 개발한 Grok Imagine Image로 AI 이미지를 생성하세요. 텍스트-이미지 변환, 다양한 비율 지원. 1크레딧으로 경제적. 무료 체험.',
        keywords: ['Grok Imagine', 'Grok Imagine Image', 'Grok AI', 'xAI Grok', 'Grok 이미지 생성', 'Grok 이미지', 'Grok 무료', 'xAI AI 이미지', 'Elon Musk AI', 'Grok 사용법', 'AI 이미지 생성', 'Grok Image', 'Grok AI 이미지 생성기'],
        subtitle: 'Elon Musk의 xAI가 개발한 AI 이미지 생성 모델',
        features: [
          '텍스트만으로 이미지 생성',
          'Elon Musk의 xAI 최신 기술',
          '5가지 종횡비 지원',
          '1크레딧의 경제적 가격',
          '빠르고 간편한 생성 과정',
          '창의적이고 독특한 스타일',
        ],
        faq: [
          { q: 'Grok Imagine Image란?', a: 'Grok Imagine Image는 Elon Musk가 설립한 xAI에서 개발한 AI 이미지 생성 모델입니다. Grok AI의 이미지 생성 기능으로, 텍스트 설명을 입력하면 독특하고 창의적인 이미지를 생성합니다.' },
          { q: 'Grok Imagine은 몇 크레딧인가요?', a: '이미지 1장당 1크레딧으로, gwanggo에서 제공하는 이미지 모델 중 가장 경제적입니다. 무료 회원가입 크레딧으로 바로 체험할 수 있습니다.' },
          { q: 'Grok Imagine의 특징은?', a: 'xAI의 기술력을 기반으로 한 독특한 스타일의 이미지 생성이 가능합니다. 특히 창의적인 프롬프트에 강하며, 다양한 종횡비를 지원하여 여러 플랫폼에 맞는 이미지를 만들 수 있습니다.' },
          { q: 'Grok AI 이미지를 상업적으로 사용할 수 있나요?', a: '네, gwanggo에서 생성한 모든 AI 이미지는 상업적 용도로 자유롭게 사용할 수 있습니다. 광고, SNS, 쇼핑몰 등에 활용하세요.' },
        ],
      },
      en: {
        title: 'Grok Imagine Image Generator - xAI Grok AI Image Free',
        description: 'Generate AI images with Elon Musk\'s xAI Grok Imagine Image. Text-to-image with multiple aspect ratios. Just 1 credit per image. Start free.',
        keywords: ['Grok Imagine', 'Grok Imagine Image', 'Grok AI', 'xAI Grok', 'Grok image generator', 'Grok image', 'Grok free', 'xAI AI image', 'Elon Musk AI', 'AI image generator', 'Grok Image'],
        subtitle: 'AI image generation model by Elon Musk\'s xAI',
        features: [
          'Generate images from text prompts',
          'Latest technology from Elon Musk\'s xAI',
          '5 aspect ratios supported',
          'Just 1 credit per image',
          'Fast and simple generation',
          'Creative and unique styles',
        ],
        faq: [
          { q: 'What is Grok Imagine Image?', a: 'Grok Imagine Image is an AI image generation model developed by xAI, founded by Elon Musk. Enter text descriptions to generate unique, creative images.' },
          { q: 'How much does Grok Imagine cost?', a: 'Just 1 credit per image — the most affordable option on gwanggo. Free credits provided at sign-up.' },
          { q: 'What makes Grok Imagine special?', a: 'Built on xAI\'s technology, Grok Imagine excels at creative and unique image styles. Supports multiple aspect ratios for various platforms.' },
          { q: 'Can I use Grok AI images commercially?', a: 'Yes, all AI images generated on gwanggo can be freely used for commercial purposes including ads, social media, and e-commerce.' },
        ],
      },
      ja: {
        title: 'Grok Imagine画像生成 - xAI Grok AI画像 無料',
        description: 'Elon MuskのxAI Grok Imagine Imageで AI画像を生成。テキストから画像生成、複数アスペクト比対応。1クレジットで経済的。無料体験。',
        keywords: ['Grok Imagine', 'Grok Imagine Image', 'Grok AI', 'xAI Grok', 'Grok 画像生成', 'Grok 無料', 'xAI AI画像', 'AI画像生成', 'Grok Image'],
        subtitle: 'Elon MuskのxAIが開発したAI画像生成モデル',
        features: ['テキストから画像生成', 'Elon MuskのxAI最新技術', '5種類のアスペクト比対応', '1クレジットの手頃な価格', '高速で簡単な生成', 'クリエイティブでユニークなスタイル'],
        faq: [
          { q: 'Grok Imagine Imageとは？', a: 'Grok Imagine ImageはElon Muskが設立したxAIが開発したAI画像生成モデルです。テキスト説明からユニークで創造的な画像を生成します。' },
          { q: 'Grok Imagineの料金は？', a: '画像1枚あたり1クレジット。gwanggoで最も経済的な選択肢です。無料クレジットで即体験可能。' },
          { q: 'Grok Imagineの特徴は？', a: 'xAIの技術を基にしたユニークなスタイルの画像生成が可能。複数のアスペクト比対応で様々なプラットフォームに最適化。' },
          { q: 'Grok AI画像を商用利用できますか？', a: 'はい、gwanggoで生成したすべてのAI画像は商用利用が可能です。広告、SNS、ECサイトなどに活用できます。' },
        ],
      },
      zh: {
        title: 'Grok Imagine图片生成器 - xAI Grok AI图片 免费',
        description: '使用Elon Musk的xAI Grok Imagine Image生成AI图片。文字生图，多种宽高比。每张仅1积分。免费试用。',
        keywords: ['Grok Imagine', 'Grok Imagine Image', 'Grok AI', 'xAI Grok', 'Grok 图片生成', 'Grok 免费', 'xAI AI图片', 'AI图片生成', 'Grok Image'],
        subtitle: 'Elon Musk的xAI开发的AI图片生成模型',
        features: ['文字生成图片', 'Elon Musk的xAI最新技术', '支持5种宽高比', '每张仅1积分', '快速简便', '创意独特的风格'],
        faq: [
          { q: '什么是Grok Imagine Image？', a: 'Grok Imagine Image是Elon Musk创立的xAI开发的AI图片生成模型。输入文字描述即可生成独特创意图片。' },
          { q: 'Grok Imagine费用多少？', a: '每张图片仅1积分，是gwanggo上最经济的选择。注册即获免费积分。' },
          { q: 'Grok Imagine有什么特点？', a: '基于xAI技术，擅长创意独特的图片风格。支持多种宽高比，适配各平台。' },
          { q: 'Grok AI图片能商用吗？', a: '可以，在gwanggo生成的所有AI图片都可以自由商用，包括广告、社交媒体、电商等。' },
        ],
      },
    },
  },

  'z-image': {
    slug: 'z-image',
    name: 'Z-Image',
    creator: 'gwanggo',
    type: 'image',
    modes: ['Text to Image'],
    resolutions: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    creditSummary: {
      ko: '1크레딧',
      en: '1 credit',
      ja: '1クレジット',
      zh: '1积分',
    },
    seo: {
      ko: {
        title: 'Z-Image AI 이미지 생성기 - 텍스트로 이미지 무료 생성',
        description: 'Z-Image로 텍스트를 입력하면 AI가 이미지를 생성합니다. 다양한 비율, 1크레딧으로 저렴하게. 광고, SNS, 쇼핑몰 이미지 제작. 무료 체험.',
        keywords: ['Z-Image', 'Z-Image AI', 'AI 이미지 생성', 'Z-Image 무료', '텍스트 이미지 변환', 'AI 그림 생성기', '무료 AI 이미지', 'AI 이미지 생성기'],
        subtitle: '간편하고 경제적인 AI 텍스트-이미지 생성기',
        features: ['텍스트만 입력하면 이미지 생성', '5가지 종횡비 지원', '1크레딧의 저렴한 가격', '빠른 생성 속도', '다양한 스타일 표현', '광고/SNS 최적화'],
        faq: [
          { q: 'Z-Image란?', a: 'Z-Image는 gwanggo에서 제공하는 텍스트-이미지 AI 생성 도구입니다. 원하는 이미지를 텍스트로 설명하면 AI가 즉시 생성합니다.' },
          { q: 'Z-Image 비용은?', a: '이미지 1장당 1크레딧으로 가장 경제적입니다. 무료 회원가입 크레딧으로 바로 사용 가능합니다.' },
          { q: 'Z-Image로 어떤 이미지를 만들 수 있나요?', a: '광고 배너, SNS 포스트, 제품 이미지, 배경 이미지 등 다양한 용도의 이미지를 생성할 수 있습니다.' },
          { q: 'Z-Image와 다른 모델의 차이점은?', a: 'Z-Image는 간편한 사용성과 경제적 가격이 특징입니다. 빠르게 이미지를 생성하고 싶을 때 추천합니다.' },
        ],
      },
      en: {
        title: 'Z-Image AI Image Generator - Text to Image Free',
        description: 'Generate images from text with Z-Image AI. Multiple aspect ratios, just 1 credit. Create ads, social media, e-commerce images. Start free.',
        keywords: ['Z-Image', 'Z-Image AI', 'AI image generator', 'Z-Image free', 'text to image', 'free AI image', 'AI image maker'],
        subtitle: 'Simple and affordable AI text-to-image generator',
        features: ['Generate images from text', '5 aspect ratios', 'Just 1 credit per image', 'Fast generation', 'Various styles', 'Ad/social media optimized'],
        faq: [
          { q: 'What is Z-Image?', a: 'Z-Image is a text-to-image AI tool provided by gwanggo. Describe the image you want in text and AI generates it instantly.' },
          { q: 'How much does Z-Image cost?', a: '1 credit per image — the most affordable option. Free credits at sign-up.' },
          { q: 'What images can Z-Image create?', a: 'Ad banners, social media posts, product images, backgrounds, and more.' },
          { q: 'How is Z-Image different from other models?', a: 'Z-Image is known for simplicity and affordability. Best for quick image generation.' },
        ],
      },
      ja: {
        title: 'Z-Image AI画像生成 - テキストから画像 無料',
        description: 'Z-Imageでテキストを入力するとAIが画像を生成。複数アスペクト比、1クレジット。広告、SNS、EC画像制作。無料体験。',
        keywords: ['Z-Image', 'Z-Image AI', 'AI画像生成', 'Z-Image 無料', 'テキストから画像', '無料AI画像', 'AI画像生成器'],
        subtitle: 'シンプルで経済的なAIテキスト画像生成ツール',
        features: ['テキストから画像生成', '5種類のアスペクト比', '1クレジットの手頃な価格', '高速生成', '多彩なスタイル', '広告/SNS最適化'],
        faq: [
          { q: 'Z-Imageとは？', a: 'Z-Imageはgwanggoが提供するテキストから画像を生成するAIツールです。' },
          { q: 'Z-Imageの料金は？', a: '画像1枚あたり1クレジット。無料クレジットで即利用可能。' },
          { q: 'Z-Imageでどんな画像が作れますか？', a: '広告バナー、SNS投稿、商品画像、背景画像など。' },
          { q: 'Z-Imageと他のモデルの違いは？', a: 'Z-Imageはシンプルさと手頃な価格が特徴。素早く画像を生成したい時におすすめ。' },
        ],
      },
      zh: {
        title: 'Z-Image AI图片生成器 - 文字转图片 免费',
        description: '用Z-Image输入文字AI即可生成图片。多种宽高比，仅1积分。广告、社交媒体、电商图片制作。免费试用。',
        keywords: ['Z-Image', 'Z-Image AI', 'AI图片生成', 'Z-Image 免费', '文字转图片', '免费AI图片', 'AI图片生成器'],
        subtitle: '简便经济的AI文字转图片工具',
        features: ['输入文字生成图片', '5种宽高比', '每张仅1积分', '快速生成', '多种风格', '广告/社交媒体优化'],
        faq: [
          { q: '什么是Z-Image？', a: 'Z-Image是gwanggo提供的文字生成图片AI工具。描述想要的图片，AI即刻生成。' },
          { q: 'Z-Image费用多少？', a: '每张图片1积分，最经济的选择。注册即获免费积分。' },
          { q: 'Z-Image能创建什么图片？', a: '广告横幅、社交媒体帖子、产品图片、背景图片等。' },
          { q: 'Z-Image和其他模型有什么区别？', a: 'Z-Image以简单和实惠著称，适合快速生成图片。' },
        ],
      },
    },
  },

  'nano-banana-2': {
    slug: 'nano-banana-2',
    name: 'Nano Banana 2',
    creator: 'Google',
    type: 'image',
    modes: ['Text to Image', 'Image Edit'],
    resolutions: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    creditSummary: {
      ko: '기본 2크레딧, 고화질 6크레딧',
      en: '2 credits (basic), 6 credits (high)',
      ja: '基本2クレジット、高画質6クレジット',
      zh: '基本2积分，高画质6积分',
    },
    seo: {
      ko: {
        title: 'Nano Banana 2 AI 이미지 생성기 - Google 최신 모델 무료 사용',
        description: 'Google의 Nano Banana 2로 고품질 AI 이미지를 생성하세요. 텍스트-이미지, 이미지 편집 지원. 다양한 비율, 기본/고화질 선택. Midjourney, DALL-E 대안. 무료 크레딧으로 시작.',
        keywords: ['Nano Banana 2', 'Nano Banana', 'Google AI', 'Google Nano Banana', '구글 AI', 'Nano Banana 2 사용법', 'Nano Banana 2 무료', 'Nano Banana AI 이미지', 'Google 이미지 생성', 'AI 이미지 생성', 'Midjourney 대안', 'DALL-E 대안', '무료 AI 이미지 생성기', 'Google AI 이미지'],
        subtitle: 'Google이 개발한 최신 AI 이미지 생성 모델',
        features: [
          '텍스트로 고품질 이미지 생성 (Text to Image)',
          '기존 이미지 편집 및 변환 (Image Edit)',
          '5가지 종횡비 지원 (1:1, 4:3, 3:4, 16:9, 9:16)',
          '기본/고화질 품질 선택 가능',
          '광고, SNS, 상세페이지용 이미지 최적화',
          'Google의 최신 AI 기술 적용',
        ],
        faq: [
          { q: 'Nano Banana 2란 무엇인가요?', a: 'Nano Banana 2는 Google이 개발한 최신 AI 이미지 생성 모델입니다. 텍스트 설명만으로 고품질 이미지를 생성하거나, 기존 이미지를 AI로 편집할 수 있습니다. gwanggo에서 무료로 사용할 수 있습니다.' },
          { q: 'Nano Banana 2는 무료인가요?', a: '네, gwanggo 회원가입 시 제공되는 무료 크레딧으로 Nano Banana 2를 바로 사용할 수 있습니다. 기본 화질은 2크레딧, 고화질은 6크레딧이 소모됩니다.' },
          { q: 'Nano Banana 2와 Midjourney의 차이점은?', a: 'Nano Banana 2는 웹 브라우저에서 바로 사용 가능하며, Discord 등 별도 프로그램이 필요 없습니다. 이미지 편집 기능도 내장되어 있어 생성 후 바로 수정할 수 있습니다. Google의 최신 AI 기술이 적용되어 높은 품질을 제공합니다.' },
          { q: 'Nano Banana 2로 어떤 이미지를 만들 수 있나요?', a: '제품 광고 이미지, SNS 포스트, 쇼핑몰 상세페이지, 배너, 브랜드 콘텐츠 등 다양한 이미지를 만들 수 있습니다. 5가지 종횡비를 지원하여 인스타그램, 페이스북 등 각 플랫폼에 최적화된 크기로 생성 가능합니다.' },
        ],
      },
      en: {
        title: 'Nano Banana 2 AI Image Generator - Google Latest Model Free',
        description: 'Generate high-quality AI images with Google\'s Nano Banana 2. Text-to-image and image editing. Multiple aspect ratios. Midjourney, DALL-E alternative. Start free.',
        keywords: ['Nano Banana 2', 'Nano Banana', 'Google AI', 'Google Nano Banana', 'Nano Banana 2 free', 'Nano Banana AI image', 'Nano Banana image generator', 'Google image generator', 'AI image generator', 'Midjourney alternative', 'DALL-E alternative', 'free AI image generator'],
        subtitle: 'Latest AI image generation model by Google',
        features: [
          'Generate high-quality images from text (Text to Image)',
          'Edit and transform existing images (Image Edit)',
          '5 aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16)',
          'Basic and high quality options',
          'Optimized for ads, social media, and e-commerce',
          'Powered by Google\'s latest AI technology',
        ],
        faq: [
          { q: 'What is Nano Banana 2?', a: 'Nano Banana 2 is the latest AI image generation model developed by Google. It can generate high-quality images from text descriptions or edit existing images with AI. Available for free on gwanggo.' },
          { q: 'Is Nano Banana 2 free?', a: 'Yes, you can use Nano Banana 2 immediately with free credits provided at sign-up. Basic quality costs 2 credits, high quality costs 6 credits per image.' },
          { q: 'How does Nano Banana 2 compare to Midjourney?', a: 'Nano Banana 2 works directly in your web browser with no Discord or additional software needed. It includes built-in image editing capabilities and is powered by Google\'s latest AI technology for superior quality.' },
          { q: 'What images can I create with Nano Banana 2?', a: 'Product ads, social media posts, e-commerce detail pages, banners, and brand content. Supports 5 aspect ratios for Instagram, Facebook, and other platforms.' },
        ],
      },
      ja: {
        title: 'Nano Banana 2 AI画像生成 - Google最新モデル 無料で使える',
        description: 'GoogleのNano Banana 2で高品質AI画像を生成。テキストから画像生成、画像編集対応。複数のアスペクト比。Midjourney、DALL-E代替。無料クレジットで開始。',
        keywords: ['Nano Banana 2', 'Nano Banana', 'Google AI', 'グーグルAI', 'Nano Banana 2 無料', 'Nano Banana AI画像', 'Google 画像生成', 'AI画像生成', 'Midjourney代替', 'DALL-E代替', '無料AI画像生成'],
        subtitle: 'Googleが開発した最新AI画像生成モデル',
        features: [
          'テキストから高品質画像を生成（Text to Image）',
          '既存画像の編集・変換（Image Edit）',
          '5種類のアスペクト比対応（1:1, 4:3, 3:4, 16:9, 9:16）',
          '基本・高画質の選択可能',
          '広告、SNS、ECサイト向け最適化',
          'Googleの最新AI技術搭載',
        ],
        faq: [
          { q: 'Nano Banana 2とは？', a: 'Nano Banana 2はGoogleが開発した最新のAI画像生成モデルです。テキスト説明から高品質画像を生成したり、既存画像をAIで編集できます。gwanggoで無料で利用可能です。' },
          { q: 'Nano Banana 2は無料ですか？', a: 'はい、会員登録時に提供される無料クレジットですぐにNano Banana 2を使用できます。基本画質は2クレジット、高画質は6クレジットです。' },
          { q: 'Nano Banana 2とMidjourneyの違いは？', a: 'Nano Banana 2はWebブラウザで直接使用可能で、Discordなどの追加ソフトは不要です。画像編集機能も内蔵。Googleの最新AI技術で高品質な画像を生成します。' },
          { q: 'Nano Banana 2でどんな画像が作れますか？', a: '商品広告、SNS投稿、ECサイト詳細ページ、バナー、ブランドコンテンツなど。5種類のアスペクト比でInstagram、Facebookなど各プラットフォームに最適化可能。' },
        ],
      },
      zh: {
        title: 'Nano Banana 2 AI图片生成器 - Google最新模型 免费使用',
        description: '使用Google的Nano Banana 2生成高质量AI图片。支持文字生图、图片编辑。多种宽高比。Midjourney、DALL-E替代。免费积分立即开始。',
        keywords: ['Nano Banana 2', 'Nano Banana', 'Google AI', '谷歌AI', 'Nano Banana 2 免费', 'Nano Banana AI图片', 'Google 图片生成', 'AI图片生成', 'Midjourney替代', 'DALL-E替代', '免费AI图片生成'],
        subtitle: 'Google开发的最新AI图片生成模型',
        features: [
          '文字生成高质量图片（Text to Image）',
          '编辑和变换现有图片（Image Edit）',
          '支持5种宽高比（1:1, 4:3, 3:4, 16:9, 9:16）',
          '可选基本/高画质',
          '广告、社交媒体、电商优化',
          '搭载Google最新AI技术',
        ],
        faq: [
          { q: '什么是Nano Banana 2？', a: 'Nano Banana 2是Google开发的最新AI图片生成模型。可以从文字描述生成高质量图片，也可以用AI编辑现有图片。在gwanggo上免费使用。' },
          { q: 'Nano Banana 2免费吗？', a: '是的，注册时获得的免费积分可以立即使用Nano Banana 2。基本画质2积分，高画质6积分。' },
          { q: 'Nano Banana 2和Midjourney有什么区别？', a: 'Nano Banana 2在网页浏览器中直接使用，无需Discord等额外软件。内置图片编辑功能。搭载Google最新AI技术，提供卓越画质。' },
          { q: 'Nano Banana 2能创建什么图片？', a: '产品广告、社交媒体帖子、电商详情页、横幅、品牌内容等。支持5种宽高比，适配Instagram、Facebook等各平台。' },
        ],
      },
    },
  },
  'recraft-v4': {
    slug: 'recraft-v4',
    name: 'Recraft V4',
    creator: 'Recraft',
    type: 'image',
    modes: ['Text to Image'],
    resolutions: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    creditSummary: {
      ko: '9크레딧',
      en: '9 credits',
      ja: '9クレジット',
      zh: '9积分',
    },
    seo: {
      ko: {
        title: 'Recraft V4 AI 이미지 생성기 - 프로페셔널 디자인 무료 사용',
        description: 'Recraft V4로 전문 디자인급 AI 이미지를 생성하세요. 고품질 벡터/래스터 이미지 생성. 광고, 브랜딩, 마케팅용 이미지 최적화. 무료 크레딧으로 시작.',
        keywords: ['Recraft V4', 'Recraft', 'Recraft AI', 'Recraft V4 무료', 'Recraft AI 이미지', '프로페셔널 AI 이미지', 'AI 디자인 이미지', 'AI 이미지 생성', 'Midjourney 대안', '무료 AI 이미지 생성기', '고품질 AI 이미지'],
        subtitle: 'Recraft가 개발한 프로페셔널 디자인 AI 이미지 생성 모델',
        features: [
          '프로페셔널 디자인급 이미지 생성',
          '고품질 벡터/래스터 이미지 지원',
          '5가지 종횡비 지원 (1:1, 4:3, 3:4, 16:9, 9:16)',
          '광고, 브랜딩, 마케팅용 최적화',
          '텍스트 설명만으로 전문가 수준 이미지 생성',
          '다양한 스타일과 컬러 지원',
        ],
        faq: [
          { q: 'Recraft V4란 무엇인가요?', a: 'Recraft V4는 전문 디자인급 이미지를 생성하는 AI 모델입니다. 텍스트 설명만으로 고품질 벡터 및 래스터 이미지를 생성할 수 있으며, gwanggo에서 무료로 사용할 수 있습니다.' },
          { q: 'Recraft V4는 무료인가요?', a: '네, gwanggo 회원가입 시 제공되는 무료 크레딧으로 Recraft V4를 바로 사용할 수 있습니다. 이미지 1장당 9크레딧이 소모됩니다.' },
          { q: 'Recraft V4는 어떤 용도에 적합한가요?', a: '광고 배너, 브랜드 로고, 마케팅 소재, 소셜 미디어 콘텐츠 등 프로페셔널 디자인이 필요한 모든 작업에 적합합니다.' },
          { q: 'Recraft V4와 다른 모델의 차이점은?', a: 'Recraft V4는 디자인 전문 모델로, 벡터/래스터 이미지 모두에서 뛰어난 품질을 제공합니다. 특히 텍스트 렌더링과 디자인 요소 배치에 강점이 있습니다.' },
        ],
      },
      en: {
        title: 'Recraft V4 AI Image Generator - Professional Design Free',
        description: 'Generate professional design-grade AI images with Recraft V4. High-quality vector and raster images. Optimized for ads, branding, marketing. Start free.',
        keywords: ['Recraft V4', 'Recraft', 'Recraft AI', 'Recraft V4 free', 'professional AI image', 'AI design image', 'AI image generator', 'Midjourney alternative', 'free AI image generator'],
        subtitle: 'Professional design AI image generation model by Recraft',
        features: [
          'Professional design-grade image generation',
          'High-quality vector and raster image support',
          '5 aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16)',
          'Optimized for ads, branding, and marketing',
          'Expert-level images from text descriptions',
          'Diverse styles and color support',
        ],
        faq: [
          { q: 'What is Recraft V4?', a: 'Recraft V4 is an AI model that generates professional design-grade images. Create high-quality vector and raster images from text descriptions. Available for free on gwanggo.' },
          { q: 'Is Recraft V4 free?', a: 'Yes, you can use Recraft V4 immediately with free credits provided at sign-up. Each image costs 9 credits.' },
          { q: 'What is Recraft V4 best for?', a: 'Ad banners, brand logos, marketing materials, social media content, and any work that needs professional design quality.' },
          { q: 'How does Recraft V4 compare to other models?', a: 'Recraft V4 is a design-specialized model excelling in both vector and raster images. It has particular strengths in text rendering and design element placement.' },
        ],
      },
      ja: {
        title: 'Recraft V4 AI画像生成 - プロフェッショナルデザイン 無料で使える',
        description: 'Recraft V4でプロフェッショナルデザインAI画像を生成。高品質ベクター・ラスター画像。広告、ブランディング、マーケティング最適化。無料クレジットで開始。',
        keywords: ['Recraft V4', 'Recraft', 'Recraft AI', 'Recraft V4 無料', 'プロAI画像', 'AIデザイン画像', 'AI画像生成', 'Midjourney代替', '無料AI画像生成'],
        subtitle: 'Recraftが開発したプロフェッショナルデザインAI画像生成モデル',
        features: [
          'プロフェッショナルデザイン級の画像生成',
          '高品質ベクター・ラスター画像対応',
          '5種類のアスペクト比対応（1:1, 4:3, 3:4, 16:9, 9:16）',
          '広告、ブランディング、マーケティング向け最適化',
          'テキスト説明から専門家レベルの画像生成',
          '多様なスタイルとカラー対応',
        ],
        faq: [
          { q: 'Recraft V4とは？', a: 'Recraft V4はプロフェッショナルデザイン級の画像を生成するAIモデルです。テキスト説明から高品質なベクター・ラスター画像を生成できます。gwanggoで無料利用可能。' },
          { q: 'Recraft V4は無料ですか？', a: 'はい、会員登録時の無料クレジットですぐに使用可能。画像1枚あたり9クレジット。' },
          { q: 'Recraft V4はどんな用途に適していますか？', a: '広告バナー、ブランドロゴ、マーケティング素材、SNSコンテンツなど、プロフェッショナルデザインが必要な全作業に最適。' },
          { q: 'Recraft V4と他のモデルの違いは？', a: 'Recraft V4はデザイン専門モデルで、ベクター・ラスター両方で優れた品質。テキストレンダリングとデザイン要素配置に特に強み。' },
        ],
      },
      zh: {
        title: 'Recraft V4 AI图片生成器 - 专业设计 免费使用',
        description: '使用Recraft V4生成专业设计级AI图片。高质量矢量和光栅图片。广告、品牌、营销优化。免费积分立即开始。',
        keywords: ['Recraft V4', 'Recraft', 'Recraft AI', 'Recraft V4 免费', '专业AI图片', 'AI设计图片', 'AI图片生成', 'Midjourney替代', '免费AI图片生成'],
        subtitle: 'Recraft开发的专业设计AI图片生成模型',
        features: [
          '专业设计级图片生成',
          '高质量矢量和光栅图片支持',
          '支持5种宽高比（1:1, 4:3, 3:4, 16:9, 9:16）',
          '广告、品牌、营销优化',
          '文字描述生成专家级图片',
          '多样化风格和配色支持',
        ],
        faq: [
          { q: '什么是Recraft V4？', a: 'Recraft V4是生成专业设计级图片的AI模型。从文字描述创建高质量矢量和光栅图片。在gwanggo上免费使用。' },
          { q: 'Recraft V4免费吗？', a: '是的，注册时获得的免费积分可以立即使用。每张图片9积分。' },
          { q: 'Recraft V4适合什么用途？', a: '广告横幅、品牌标志、营销素材、社交媒体内容等需要专业设计的所有工作。' },
          { q: 'Recraft V4与其他模型有什么区别？', a: 'Recraft V4是设计专用模型，在矢量和光栅图片方面都有卓越品质。在文字渲染和设计元素排列方面特别出色。' },
        ],
      },
    },
  },
  'qwen-image-2': {
    slug: 'qwen-image-2',
    name: 'Qwen Image 2.0',
    creator: 'Alibaba',
    type: 'image',
    modes: ['Text to Image', 'Image Edit'],
    resolutions: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    creditSummary: {
      ko: '기본 1크레딧, 프로 3크레딧',
      en: '1 credit (basic), 3 credits (pro)',
      ja: '基本1クレジット、プロ3クレジット',
      zh: '基本1积分，专业3积分',
    },
    seo: {
      ko: {
        title: 'Qwen Image 2.0 AI 이미지 생성기 - Alibaba 최신 모델 무료 사용',
        description: 'Alibaba의 Qwen Image 2.0으로 AI 이미지를 생성하세요. 텍스트-이미지, 이미지 편집 지원. 기본 1크레딧부터 시작. Midjourney, DALL-E 대안. 무료 크레딧으로 시작.',
        keywords: ['Qwen Image 2.0', 'Qwen Image', 'Alibaba AI', '알리바바 AI', 'Qwen Image 무료', 'Qwen AI 이미지', 'Alibaba 이미지 생성', 'AI 이미지 생성', 'Midjourney 대안', 'DALL-E 대안', '무료 AI 이미지 생성기', '저렴한 AI 이미지'],
        subtitle: 'Alibaba가 개발한 고성능 AI 이미지 생성/편집 모델',
        features: [
          '텍스트로 이미지 생성 (Text to Image)',
          '기존 이미지 AI 편집 (Image Edit)',
          '5가지 종횡비 지원 (1:1, 4:3, 3:4, 16:9, 9:16)',
          '기본/프로 품질 선택 가능',
          '최저 1크레딧으로 이미지 생성',
          '광고, SNS, 상세페이지용 이미지 최적화',
        ],
        faq: [
          { q: 'Qwen Image 2.0이란 무엇인가요?', a: 'Qwen Image 2.0은 Alibaba가 개발한 AI 이미지 생성/편집 모델입니다. 텍스트 설명으로 이미지를 생성하거나 기존 이미지를 편집할 수 있습니다. gwanggo에서 무료로 사용 가능합니다.' },
          { q: 'Qwen Image 2.0은 무료인가요?', a: '네, 회원가입 시 무료 크레딧으로 바로 사용할 수 있습니다. 기본 품질 1크레딧, 프로 품질 3크레딧입니다.' },
          { q: 'Qwen Image 2.0과 다른 모델의 차이점은?', a: 'Qwen Image 2.0은 가성비가 뛰어난 모델로, 기본 1크레딧부터 사용 가능합니다. 이미지 편집 기능도 내장되어 있어 생성 후 바로 수정할 수 있습니다.' },
          { q: 'Qwen Image 2.0으로 어떤 이미지를 만들 수 있나요?', a: '제품 광고, SNS 포스트, 상세페이지, 배너, 브랜드 콘텐츠 등 다양한 이미지를 만들 수 있습니다. 이미지 편집 기능으로 기존 이미지도 AI로 변환 가능합니다.' },
        ],
      },
      en: {
        title: 'Qwen Image 2.0 AI Image Generator - Alibaba Latest Model Free',
        description: 'Generate AI images with Alibaba\'s Qwen Image 2.0. Text-to-image and image editing. Starting from 1 credit. Midjourney, DALL-E alternative. Start free.',
        keywords: ['Qwen Image 2.0', 'Qwen Image', 'Alibaba AI', 'Qwen Image free', 'Qwen AI image', 'Alibaba image generator', 'AI image generator', 'Midjourney alternative', 'DALL-E alternative', 'free AI image generator', 'cheap AI image'],
        subtitle: 'High-performance AI image generation and editing model by Alibaba',
        features: [
          'Generate images from text (Text to Image)',
          'Edit existing images with AI (Image Edit)',
          '5 aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16)',
          'Basic and Pro quality options',
          'Image generation starting from 1 credit',
          'Optimized for ads, social media, and e-commerce',
        ],
        faq: [
          { q: 'What is Qwen Image 2.0?', a: 'Qwen Image 2.0 is an AI image generation and editing model by Alibaba. Generate images from text or edit existing images. Available for free on gwanggo.' },
          { q: 'Is Qwen Image 2.0 free?', a: 'Yes, use it immediately with free credits at sign-up. Basic quality is 1 credit, Pro is 3 credits per image.' },
          { q: 'How does Qwen Image 2.0 compare to other models?', a: 'Qwen Image 2.0 offers excellent value starting at just 1 credit. It includes built-in image editing for post-generation modifications.' },
          { q: 'What images can I create with Qwen Image 2.0?', a: 'Product ads, social media posts, e-commerce pages, banners, brand content, and more. Image editing lets you transform existing images with AI.' },
        ],
      },
      ja: {
        title: 'Qwen Image 2.0 AI画像生成 - Alibaba最新モデル 無料で使える',
        description: 'AlibabaのQwen Image 2.0でAI画像を生成。テキスト→画像、画像編集対応。1クレジットから。Midjourney、DALL-E代替。無料クレジットで開始。',
        keywords: ['Qwen Image 2.0', 'Qwen Image', 'Alibaba AI', 'アリババAI', 'Qwen Image 無料', 'Qwen AI画像', 'Alibaba 画像生成', 'AI画像生成', 'Midjourney代替', 'DALL-E代替', '無料AI画像生成'],
        subtitle: 'Alibabaが開発した高性能AI画像生成・編集モデル',
        features: [
          'テキストから画像生成（Text to Image）',
          '既存画像のAI編集（Image Edit）',
          '5種類のアスペクト比対応（1:1, 4:3, 3:4, 16:9, 9:16）',
          '基本・プロ品質の選択可能',
          '1クレジットから画像生成可能',
          '広告、SNS、ECサイト向け最適化',
        ],
        faq: [
          { q: 'Qwen Image 2.0とは？', a: 'Qwen Image 2.0はAlibabaが開発したAI画像生成・編集モデルです。テキストから画像生成や既存画像の編集が可能。gwanggoで無料利用可能。' },
          { q: 'Qwen Image 2.0は無料ですか？', a: 'はい、会員登録時の無料クレジットですぐに使用可能。基本1クレジット、プロ3クレジット。' },
          { q: 'Qwen Image 2.0と他モデルの違いは？', a: 'Qwen Image 2.0はコスパに優れ、1クレジットから使用可能。画像編集機能内蔵で生成後すぐに修正可能。' },
          { q: 'Qwen Image 2.0でどんな画像が作れますか？', a: '商品広告、SNS投稿、ECサイト詳細ページ、バナー、ブランドコンテンツなど。画像編集機能で既存画像のAI変換も可能。' },
        ],
      },
      zh: {
        title: 'Qwen Image 2.0 AI图片生成器 - 阿里巴巴最新模型 免费使用',
        description: '使用阿里巴巴的Qwen Image 2.0生成AI图片。文字生图、图片编辑。1积分起。Midjourney、DALL-E替代。免费积分立即开始。',
        keywords: ['Qwen Image 2.0', 'Qwen Image', '阿里巴巴AI', 'Alibaba AI', 'Qwen Image 免费', 'Qwen AI图片', '阿里巴巴图片生成', 'AI图片生成', 'Midjourney替代', 'DALL-E替代', '免费AI图片生成'],
        subtitle: '阿里巴巴开发的高性能AI图片生成/编辑模型',
        features: [
          '文字生成图片（Text to Image）',
          'AI编辑现有图片（Image Edit）',
          '支持5种宽高比（1:1, 4:3, 3:4, 16:9, 9:16）',
          '可选基本/专业品质',
          '1积分起即可生成图片',
          '广告、社交媒体、电商优化',
        ],
        faq: [
          { q: '什么是Qwen Image 2.0？', a: 'Qwen Image 2.0是阿里巴巴开发的AI图片生成/编辑模型。可以文字生图或编辑现有图片。在gwanggo上免费使用。' },
          { q: 'Qwen Image 2.0免费吗？', a: '是的，注册时的免费积分可以立即使用。基本1积分，专业3积分。' },
          { q: 'Qwen Image 2.0和其他模型有什么区别？', a: 'Qwen Image 2.0性价比极高，1积分起即可使用。内置图片编辑功能，生成后可直接修改。' },
          { q: 'Qwen Image 2.0能创建什么图片？', a: '产品广告、社交媒体帖子、电商详情页、横幅、品牌内容等。图片编辑功能可以AI变换现有图片。' },
        ],
      },
    },
  },
  'flux-kontext': {
    slug: 'flux-kontext',
    name: 'FLUX Kontext',
    creator: 'BFL',
    type: 'image',
    modes: ['Text to Image', 'Image Edit'],
    resolutions: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    creditSummary: {
      ko: '2크레딧',
      en: '2 credits',
      ja: '2クレジット',
      zh: '2积分',
    },
    seo: {
      ko: {
        title: 'FLUX Kontext AI 이미지 생성기 - 컨텍스트 기반 이미지 편집 무료 사용',
        description: 'BFL의 FLUX Kontext로 컨텍스트 기반 AI 이미지를 생성/편집하세요. 참조 이미지의 일관성 유지. 텍스트-이미지, 이미지 편집 지원. 2크레딧. 무료 크레딧으로 시작.',
        keywords: ['FLUX Kontext', 'FLUX', 'BFL', 'Black Forest Labs', 'FLUX Kontext 무료', 'FLUX AI 이미지', '컨텍스트 이미지 편집', 'AI 이미지 편집', 'AI 이미지 생성', 'Midjourney 대안', 'DALL-E 대안', '무료 AI 이미지 생성기'],
        subtitle: 'BFL이 개발한 컨텍스트 기반 AI 이미지 편집 모델',
        features: [
          '컨텍스트 기반 이미지 편집 (일관성 유지)',
          '텍스트로 이미지 생성 (Text to Image)',
          '참조 이미지 기반 변환 (Image Edit)',
          '5가지 종횡비 지원 (1:1, 4:3, 3:4, 16:9, 9:16)',
          '이미지 2크레딧으로 합리적 가격',
          '광고, SNS, 브랜드 콘텐츠 최적화',
        ],
        faq: [
          { q: 'FLUX Kontext란 무엇인가요?', a: 'FLUX Kontext는 BFL(Black Forest Labs)이 개발한 컨텍스트 기반 AI 이미지 편집 모델입니다. 참조 이미지를 활용하여 일관된 스타일의 이미지를 생성하거나 편집할 수 있습니다. gwanggo에서 무료로 사용 가능합니다.' },
          { q: 'FLUX Kontext는 무료인가요?', a: '네, 회원가입 시 무료 크레딧으로 바로 사용할 수 있습니다. 이미지 1장당 2크레딧입니다.' },
          { q: 'FLUX Kontext의 "컨텍스트" 기능이란?', a: '참조 이미지를 업로드하면 해당 이미지의 스타일, 구도, 요소를 유지하면서 텍스트 프롬프트에 따라 이미지를 변환합니다. 브랜드 일관성을 유지하면서 다양한 변형을 만들 수 있습니다.' },
          { q: 'FLUX Kontext로 어떤 이미지를 만들 수 있나요?', a: '제품 변형 이미지, 시리즈 광고, 브랜드 콘텐츠, SNS 시리즈 등 일관된 스타일이 필요한 이미지를 만들 수 있습니다. 참조 이미지 없이도 텍스트만으로 이미지 생성이 가능합니다.' },
        ],
      },
      en: {
        title: 'FLUX Kontext AI Image Generator - Context-Aware Image Edit Free',
        description: 'Generate and edit context-aware AI images with BFL\'s FLUX Kontext. Maintain consistency with reference images. Text-to-image and image editing. 2 credits. Start free.',
        keywords: ['FLUX Kontext', 'FLUX', 'BFL', 'Black Forest Labs', 'FLUX Kontext free', 'FLUX AI image', 'context image edit', 'AI image edit', 'AI image generator', 'Midjourney alternative', 'DALL-E alternative', 'free AI image generator'],
        subtitle: 'Context-aware AI image editing model by BFL',
        features: [
          'Context-aware image editing (maintain consistency)',
          'Generate images from text (Text to Image)',
          'Reference image-based transformation (Image Edit)',
          '5 aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16)',
          'Affordable at 2 credits per image',
          'Optimized for ads, social media, and brand content',
        ],
        faq: [
          { q: 'What is FLUX Kontext?', a: 'FLUX Kontext is a context-aware AI image editing model by BFL (Black Forest Labs). Generate or edit images while maintaining consistent style from reference images. Available for free on gwanggo.' },
          { q: 'Is FLUX Kontext free?', a: 'Yes, use it immediately with free credits at sign-up. 2 credits per image.' },
          { q: 'What is the "context" feature?', a: 'Upload a reference image and FLUX Kontext transforms it based on text prompts while preserving style, composition, and elements. Create brand-consistent variations.' },
          { q: 'What images can I create with FLUX Kontext?', a: 'Product variations, series ads, brand content, social media series, and any images needing consistent style. Also works as text-to-image without reference.' },
        ],
      },
      ja: {
        title: 'FLUX Kontext AI画像生成 - コンテキスト対応画像編集 無料で使える',
        description: 'BFLのFLUX Kontextでコンテキスト対応AI画像を生成・編集。参照画像の一貫性維持。テキスト→画像、画像編集。2クレジット。無料クレジットで開始。',
        keywords: ['FLUX Kontext', 'FLUX', 'BFL', 'Black Forest Labs', 'FLUX Kontext 無料', 'FLUX AI画像', 'コンテキスト画像編集', 'AI画像編集', 'AI画像生成', 'Midjourney代替', 'DALL-E代替', '無料AI画像生成'],
        subtitle: 'BFLが開発したコンテキスト対応AI画像編集モデル',
        features: [
          'コンテキスト対応画像編集（一貫性維持）',
          'テキストから画像生成（Text to Image）',
          '参照画像ベースの変換（Image Edit）',
          '5種類のアスペクト比対応（1:1, 4:3, 3:4, 16:9, 9:16）',
          '画像1枚2クレジットの合理的価格',
          '広告、SNS、ブランドコンテンツ最適化',
        ],
        faq: [
          { q: 'FLUX Kontextとは？', a: 'FLUX KontextはBFL（Black Forest Labs）が開発したコンテキスト対応AI画像編集モデルです。参照画像の一貫したスタイルで画像を生成・編集。gwanggoで無料利用可能。' },
          { q: 'FLUX Kontextは無料ですか？', a: 'はい、会員登録時の無料クレジットですぐに使用可能。画像1枚2クレジット。' },
          { q: '「コンテキスト」機能とは？', a: '参照画像をアップロードすると、スタイル・構図・要素を維持しながらテキストプロンプトに基づいて画像を変換。ブランドの一貫性を保ちながら多様なバリエーションを作成可能。' },
          { q: 'FLUX Kontextでどんな画像が作れますか？', a: '商品バリエーション、シリーズ広告、ブランドコンテンツ、SNSシリーズなど。参照画像なしでもテキストのみで生成可能。' },
        ],
      },
      zh: {
        title: 'FLUX Kontext AI图片生成器 - 上下文感知图片编辑 免费使用',
        description: '使用BFL的FLUX Kontext生成和编辑上下文感知AI图片。保持参考图片一致性。文字生图、图片编辑。2积分。免费积分立即开始。',
        keywords: ['FLUX Kontext', 'FLUX', 'BFL', 'Black Forest Labs', 'FLUX Kontext 免费', 'FLUX AI图片', '上下文图片编辑', 'AI图片编辑', 'AI图片生成', 'Midjourney替代', 'DALL-E替代', '免费AI图片生成'],
        subtitle: 'BFL开发的上下文感知AI图片编辑模型',
        features: [
          '上下文感知图片编辑（保持一致性）',
          '文字生成图片（Text to Image）',
          '参考图片变换（Image Edit）',
          '支持5种宽高比（1:1, 4:3, 3:4, 16:9, 9:16）',
          '每张图片2积分，价格合理',
          '广告、社交媒体、品牌内容优化',
        ],
        faq: [
          { q: '什么是FLUX Kontext？', a: 'FLUX Kontext是BFL（Black Forest Labs）开发的上下文感知AI图片编辑模型。利用参考图片保持一致风格来生成或编辑图片。在gwanggo上免费使用。' },
          { q: 'FLUX Kontext免费吗？', a: '是的，注册时的免费积分可以立即使用。每张图片2积分。' },
          { q: '"上下文"功能是什么？', a: '上传参考图片后，FLUX Kontext根据文字提示进行变换，同时保持风格、构图和元素。可创建保持品牌一致性的多种变体。' },
          { q: 'FLUX Kontext能创建什么图片？', a: '产品变体、系列广告、品牌内容、社交媒体系列等需要一致风格的图片。也可以不用参考图片，仅凭文字生成。' },
        ],
      },
    },
  },
}

// ============================================================
// 영상 모델
// ============================================================

export const VIDEO_MODEL_SLUGS = ['seedance', 'vidu-q3', 'kling-3', 'grok-video', 'wan-26', 'veo-31', 'hailuo-02', 'ltx-23'] as const
export type VideoModelSlug = (typeof VIDEO_MODEL_SLUGS)[number]

export const VIDEO_MODELS: Record<VideoModelSlug, ModelPageData> = {
  'seedance': {
    slug: 'seedance',
    name: 'Seedance 1.5 Pro',
    creator: 'ByteDance',
    type: 'video',
    modes: ['Text to Video', 'Image to Video'],
    resolutions: ['480p', '720p'],
    duration: '4-12s',
    creditSummary: {
      ko: '480p: 1크레딧/초, 720p: 2크레딧/초',
      en: '480p: 1 cr/sec, 720p: 2 cr/sec',
      ja: '480p: 1cr/秒, 720p: 2cr/秒',
      zh: '480p: 1积分/秒, 720p: 2积分/秒',
    },
    seo: {
      ko: {
        title: 'Seedance 1.5 Pro AI 영상 생성기 - ByteDance 무료 사용',
        description: 'ByteDance의 Seedance 1.5 Pro로 AI 영상을 생성하세요. 텍스트/이미지 → 영상, 480p-720p, 4~12초. Sora, Runway 대안. 무료 크레딧으로 시작.',
        keywords: ['Seedance', 'Seedance 1.5 Pro', 'Seedance Pro', 'Seedance 2.0', 'ByteDance AI', 'ByteDance Seedance', '바이트댄스 AI', 'Seedance 사용법', 'Seedance 무료', 'Seedance AI 영상', 'AI 영상 생성', 'Sora 대안', 'Runway 대안', 'Text to Video', 'Image to Video', 'AI 동영상 만들기'],
        subtitle: 'ByteDance가 개발한 고품질 AI 영상 생성 모델',
        features: [
          '텍스트만으로 영상 생성 (Text to Video)',
          '이미지를 움직이는 영상으로 변환 (Image to Video)',
          '480p, 720p 해상도 지원',
          '4초~12초 길이 선택',
          '부드러운 모션과 일관된 화질',
          'ByteDance의 최신 AI 기술 적용',
        ],
        faq: [
          { q: 'Seedance 1.5 Pro란?', a: 'Seedance 1.5 Pro는 ByteDance(바이트댄스)가 개발한 AI 영상 생성 모델입니다. 텍스트나 이미지를 입력하면 고품질 AI 영상을 생성합니다. Sora, Runway의 대안으로 gwanggo에서 무료로 사용 가능합니다.' },
          { q: 'Seedance 비용은?', a: '480p는 초당 1크레딧, 720p는 초당 2크레딧입니다. 예: 720p 5초 영상 = 10크레딧. 무료 회원가입 크레딧으로 바로 체험 가능합니다.' },
          { q: 'Seedance와 Sora의 차이점은?', a: 'Seedance는 gwanggo에서 웹 브라우저로 바로 사용 가능하며, 대기 시간 없이 바로 생성할 수 있습니다. Text to Video와 Image to Video 모두 지원합니다.' },
          { q: 'Seedance로 어떤 영상을 만들 수 있나요?', a: '제품 광고, SNS 숏폼, 제품 소개 영상, 브랜드 콘텐츠 등을 제작할 수 있습니다. 이미지를 입력하면 정적 사진이 움직이는 영상으로 변환됩니다.' },
        ],
      },
      en: {
        title: 'Seedance 1.5 Pro AI Video Generator - ByteDance Free',
        description: 'Generate AI videos with ByteDance\'s Seedance 1.5 Pro. Text/Image to Video, 480p-720p, 4-12 seconds. Sora, Runway alternative. Start free.',
        keywords: ['Seedance', 'Seedance 1.5 Pro', 'Seedance Pro', 'ByteDance AI', 'ByteDance Seedance', 'Seedance free', 'Seedance AI video', 'AI video generator', 'Sora alternative', 'Runway alternative', 'text to video', 'image to video'],
        subtitle: 'High-quality AI video generation model by ByteDance',
        features: ['Generate videos from text (Text to Video)', 'Convert images to video (Image to Video)', '480p and 720p resolution', '4 to 12 second duration', 'Smooth motion and consistent quality', 'ByteDance\'s latest AI technology'],
        faq: [
          { q: 'What is Seedance 1.5 Pro?', a: 'Seedance 1.5 Pro is an AI video generation model by ByteDance. Generate high-quality videos from text or images. A free Sora & Runway alternative on gwanggo.' },
          { q: 'How much does Seedance cost?', a: '480p: 1 credit/sec, 720p: 2 credits/sec. Example: 720p 5-second video = 10 credits. Free credits at sign-up.' },
          { q: 'How does Seedance compare to Sora?', a: 'Seedance is available directly in web browsers with no waitlist. Supports both Text to Video and Image to Video.' },
          { q: 'What videos can I create with Seedance?', a: 'Product ads, social media shorts, product intros, and brand content. Upload an image to animate it into video.' },
        ],
      },
      ja: {
        title: 'Seedance 1.5 Pro AI動画生成 - ByteDance 無料で使える',
        description: 'ByteDanceのSeedance 1.5 ProでAI動画を生成。テキスト/画像から動画、480p-720p、4~12秒。Sora、Runway代替。無料クレジットで開始。',
        keywords: ['Seedance', 'Seedance 1.5 Pro', 'ByteDance AI', 'バイトダンスAI', 'Seedance 無料', 'AI動画生成', 'Sora代替', 'Runway代替', 'テキストから動画', '画像から動画'],
        subtitle: 'ByteDanceが開発した高品質AI動画生成モデル',
        features: ['テキストから動画生成', '画像を動画に変換', '480p、720p対応', '4〜12秒の長さ', '滑らかなモーション', 'ByteDanceの最新技術'],
        faq: [
          { q: 'Seedance 1.5 Proとは？', a: 'ByteDanceが開発したAI動画生成モデル。テキストや画像から高品質動画を生成。gwanggoで無料で利用可能。Sora・Runway代替。' },
          { q: 'Seedanceの料金は？', a: '480p: 1cr/秒、720p: 2cr/秒。例：720p 5秒動画 = 10クレジット。無料クレジットで即体験。' },
          { q: 'SeedanceとSoraの違いは？', a: 'SeedanceはWebブラウザで直接使用可能。待ち時間なしで即生成。Text to VideoとImage to Video両方対応。' },
          { q: 'Seedanceでどんな動画が作れますか？', a: '商品広告、SNSショート動画、商品紹介、ブランドコンテンツなど。画像を入力すると動く動画に変換。' },
        ],
      },
      zh: {
        title: 'Seedance 1.5 Pro AI视频生成 - ByteDance 免费使用',
        description: '使用ByteDance的Seedance 1.5 Pro生成AI视频。文字/图片转视频，480p-720p，4-12秒。Sora、Runway替代。免费积分开始。',
        keywords: ['Seedance', 'Seedance 1.5 Pro', 'ByteDance AI', '字节跳动AI', 'Seedance 免费', 'AI视频生成', 'Sora替代', 'Runway替代', '文字转视频', '图片转视频'],
        subtitle: 'ByteDance开发的高品质AI视频生成模型',
        features: ['文字生成视频', '图片转视频', '480p、720p分辨率', '4-12秒时长', '流畅动效', 'ByteDance最新技术'],
        faq: [
          { q: '什么是Seedance 1.5 Pro？', a: 'ByteDance开发的AI视频生成模型。从文字或图片生成高质量视频。在gwanggo免费使用。Sora·Runway替代方案。' },
          { q: 'Seedance费用多少？', a: '480p: 1积分/秒，720p: 2积分/秒。例：720p 5秒视频 = 10积分。注册送免费积分。' },
          { q: 'Seedance和Sora有什么区别？', a: 'Seedance在网页浏览器直接使用，无需等待。支持文字转视频和图片转视频。' },
          { q: 'Seedance能创建什么视频？', a: '产品广告、社交媒体短视频、产品介绍、品牌内容等。上传图片即可转换为动态视频。' },
        ],
      },
    },
  },

  'vidu-q3': {
    slug: 'vidu-q3',
    name: 'Vidu Q3',
    creator: 'Shengshu Technology',
    type: 'video',
    modes: ['Image to Video'],
    resolutions: ['540p', '720p', '1080p'],
    duration: '1-16s',
    creditSummary: {
      ko: '540p: 1cr/초, 720p: 2cr/초, 1080p: 3cr/초',
      en: '540p: 1cr/s, 720p: 2cr/s, 1080p: 3cr/s',
      ja: '540p: 1cr/秒, 720p: 2cr/秒, 1080p: 3cr/秒',
      zh: '540p: 1积分/秒, 720p: 2积分/秒, 1080p: 3积分/秒',
    },
    seo: {
      ko: {
        title: 'Vidu Q3 AI 영상 생성기 - 1080p 최대 16초 무료',
        description: 'Shengshu Technology의 Vidu Q3로 이미지를 영상으로 변환. 540p~1080p, 최대 16초. 고해상도 제품 광고 영상 제작. 무료 크레딧으로 시작.',
        keywords: ['Vidu Q3', 'Vidu AI', 'Vidu Q3 영상', 'Vidu Q3 무료', 'Shengshu Technology', 'Image to Video', '이미지 영상 변환', 'AI 영상 생성', '1080p AI 영상', '16초 AI 영상', 'Vidu Q3 사용법', 'AI 제품 영상'],
        subtitle: '최대 1080p, 16초까지 지원하는 고해상도 AI 영상 생성 모델',
        features: ['이미지를 영상으로 변환 (Image to Video)', '540p, 720p, 1080p 해상도 지원', '최대 16초 길이 (업계 최장)', '고해상도 제품 광고에 최적', '부드러운 카메라 움직임', '1초 단위 세밀한 길이 조절'],
        faq: [
          { q: 'Vidu Q3란?', a: 'Vidu Q3는 Shengshu Technology가 개발한 AI 영상 생성 모델입니다. 이미지를 입력하면 최대 1080p, 16초 길이의 고품질 영상을 생성합니다. 특히 제품 광고 영상 제작에 강점이 있습니다.' },
          { q: 'Vidu Q3 비용은?', a: '540p는 초당 1크레딧, 720p는 초당 2크레딧, 1080p는 초당 3크레딧입니다. 예: 1080p 5초 영상 = 15크레딧.' },
          { q: 'Vidu Q3가 다른 영상 모델과 다른 점은?', a: 'Vidu Q3는 최대 16초까지 지원하여 업계에서 가장 긴 영상을 생성할 수 있으며, 1080p 고해상도를 지원합니다. 이미지 기반 영상 생성에 특화되어 제품 사진을 영상으로 만드는 데 최적입니다.' },
          { q: 'Vidu Q3로 제품 광고를 만들 수 있나요?', a: '네, Vidu Q3는 제품 이미지를 고품질 영상으로 변환하는 데 특화되어 있습니다. 1080p 해상도와 최대 16초 길이로 전문적인 제품 광고 영상을 제작할 수 있습니다.' },
        ],
      },
      en: {
        title: 'Vidu Q3 AI Video Generator - 1080p Up to 16 Seconds Free',
        description: 'Convert images to video with Vidu Q3. 540p-1080p, up to 16 seconds. Perfect for product ad videos. Start free.',
        keywords: ['Vidu Q3', 'Vidu AI', 'Vidu Q3 video', 'Vidu Q3 free', 'Shengshu Technology', 'image to video', 'AI video generator', '1080p AI video', '16 second AI video', 'AI product video'],
        subtitle: 'High-resolution AI video generation up to 1080p, 16 seconds',
        features: ['Convert images to video (Image to Video)', '540p, 720p, 1080p resolution', 'Up to 16 seconds (industry longest)', 'Optimized for product ads', 'Smooth camera movements', 'Precise 1-second length control'],
        faq: [
          { q: 'What is Vidu Q3?', a: 'Vidu Q3 is an AI video model by Shengshu Technology. Convert images to high-quality videos up to 1080p, 16 seconds. Especially strong for product ad creation.' },
          { q: 'How much does Vidu Q3 cost?', a: '540p: 1 cr/sec, 720p: 2 cr/sec, 1080p: 3 cr/sec. Example: 1080p 5-second video = 15 credits.' },
          { q: 'What makes Vidu Q3 different?', a: 'Vidu Q3 supports up to 16 seconds (industry longest) and 1080p resolution. Specialized in image-based video generation for product photos.' },
          { q: 'Can I create product ads with Vidu Q3?', a: 'Yes, Vidu Q3 specializes in converting product images to high-quality video ads with 1080p resolution and up to 16-second length.' },
        ],
      },
      ja: {
        title: 'Vidu Q3 AI動画生成 - 1080p 最大16秒 無料',
        description: 'Vidu Q3で画像を動画に変換。540p〜1080p、最大16秒。商品広告動画制作に最適。無料クレジットで開始。',
        keywords: ['Vidu Q3', 'Vidu AI', 'Vidu Q3 動画', 'Vidu Q3 無料', 'Image to Video', '画像から動画', 'AI動画生成', '1080p AI動画', 'AI商品動画'],
        subtitle: '最大1080p、16秒対応の高解像度AI動画生成モデル',
        features: ['画像を動画に変換', '540p、720p、1080p対応', '最大16秒（業界最長）', '商品広告に最適', '滑らかなカメラワーク', '1秒単位の細かい調整'],
        faq: [
          { q: 'Vidu Q3とは？', a: 'Shengshu Technologyが開発したAI動画生成モデル。画像から最大1080p、16秒の高品質動画を生成。商品広告に特に強い。' },
          { q: 'Vidu Q3の料金は？', a: '540p: 1cr/秒、720p: 2cr/秒、1080p: 3cr/秒。例：1080p 5秒 = 15クレジット。' },
          { q: 'Vidu Q3の特徴は？', a: '最大16秒（業界最長）、1080p対応。画像ベースの動画生成に特化。' },
          { q: 'Vidu Q3で商品広告は作れますか？', a: 'はい、商品画像を高品質動画に変換するのが得意です。1080pで最大16秒の広告動画を制作可能。' },
        ],
      },
      zh: {
        title: 'Vidu Q3 AI视频生成 - 1080p 最长16秒 免费',
        description: '用Vidu Q3将图片转为视频。540p-1080p，最长16秒。产品广告视频制作最佳选择。免费积分开始。',
        keywords: ['Vidu Q3', 'Vidu AI', 'Vidu Q3 视频', 'Vidu Q3 免费', '图片转视频', 'AI视频生成', '1080p AI视频', 'AI产品视频'],
        subtitle: '最高1080p、16秒的高分辨率AI视频生成模型',
        features: ['图片转视频', '540p、720p、1080p分辨率', '最长16秒（业内最长）', '产品广告优化', '流畅镜头运动', '1秒精确控制'],
        faq: [
          { q: '什么是Vidu Q3？', a: 'Shengshu Technology开发的AI视频生成模型。从图片生成最高1080p、16秒的高质量视频。产品广告制作特别强。' },
          { q: 'Vidu Q3费用多少？', a: '540p: 1积分/秒，720p: 2积分/秒，1080p: 3积分/秒。例：1080p 5秒 = 15积分。' },
          { q: 'Vidu Q3有什么特点？', a: '最长16秒（业内最长），支持1080p。专注图片转视频。' },
          { q: 'Vidu Q3能制作产品广告吗？', a: '可以，Vidu Q3擅长将产品图片转为高质量广告视频。1080p分辨率，最长16秒。' },
        ],
      },
    },
  },

  'kling-3': {
    slug: 'kling-3',
    name: 'Kling 3.0',
    creator: 'Kuaishou',
    type: 'video',
    modes: ['Text to Video', 'Image to Video'],
    resolutions: ['720p'],
    duration: '5-10s',
    creditSummary: {
      ko: 'Standard: 6cr/초, Pro: 8cr/초',
      en: 'Standard: 6cr/s, Pro: 8cr/s',
      ja: 'Standard: 6cr/秒, Pro: 8cr/秒',
      zh: 'Standard: 6积分/秒, Pro: 8积分/秒',
    },
    seo: {
      ko: {
        title: 'Kling 3.0 AI 영상 생성기 - 쿠아이쇼우 최신 영상 모델 무료',
        description: '쿠아이쇼우(快手)의 Kling 3.0으로 AI 영상을 생성하세요. Standard/Pro 티어, T2V/I2V 지원, 720p. Sora, Runway 대안. 무료 크레딧으로 시작.',
        keywords: ['Kling 3.0', 'Kling 3.0 Pro', 'Kling 3.0 Standard', 'Kling AI', '쿠아이쇼우', '쿠아이쇼우 AI', '快手 AI', 'Kuaishou AI', 'Kuaishou Kling', 'Kling 사용법', 'Kling 무료', 'Kling 영상 생성', 'Kling AI 영상', 'AI 영상 생성', 'Sora 대안', 'Runway 대안'],
        subtitle: '쿠아이쇼우(快手)가 개발한 최신 AI 영상 생성 모델',
        features: [
          '텍스트 → 영상, 이미지 → 영상 모두 지원',
          'Standard와 Pro 두 가지 티어',
          '720p 고화질 영상',
          '5초, 10초 길이 선택',
          '자연스러운 모션과 디테일',
          '쿠아이쇼우의 대규모 학습 데이터 기반',
        ],
        faq: [
          { q: 'Kling 3.0이란?', a: 'Kling 3.0은 쿠아이쇼우(快手/Kuaishou)가 개발한 최신 AI 영상 생성 모델입니다. 텍스트나 이미지를 입력하면 720p 고품질 영상을 생성합니다. Standard와 Pro 두 가지 티어를 제공합니다.' },
          { q: 'Kling 3.0 Standard와 Pro의 차이점은?', a: 'Standard는 초당 6크레딧으로 빠르고 경제적인 영상 생성에 적합합니다. Pro는 초당 8크레딧으로 더 높은 품질과 디테일을 제공합니다. 두 티어 모두 720p 해상도를 지원합니다.' },
          { q: 'Kling 3.0 비용은?', a: 'Standard: 초당 6크레딧 (5초=30cr, 10초=60cr), Pro: 초당 8크레딧 (5초=40cr, 10초=80cr). 무료 회원가입 크레딧으로 체험 가능합니다.' },
          { q: 'Kling 3.0과 Sora의 차이점은?', a: 'Kling 3.0은 gwanggo에서 웹 브라우저로 바로 사용 가능하며, Text to Video와 Image to Video 모두 지원합니다. 특히 사실적인 영상과 자연스러운 모션에 강점이 있습니다.' },
        ],
      },
      en: {
        title: 'Kling 3.0 AI Video Generator - Kuaishou Latest Video Model Free',
        description: 'Generate AI videos with Kuaishou\'s Kling 3.0. Standard/Pro tiers, T2V/I2V, 720p. Sora, Runway alternative. Start free.',
        keywords: ['Kling 3.0', 'Kling 3.0 Pro', 'Kling 3.0 Standard', 'Kling AI', 'Kuaishou', 'Kuaishou AI', 'Kuaishou Kling', 'Kling free', 'Kling video generator', 'AI video generator', 'Sora alternative', 'Runway alternative'],
        subtitle: 'Latest AI video model by Kuaishou',
        features: ['Text to Video and Image to Video', 'Standard and Pro tiers', '720p HD video', '5 or 10 second duration', 'Natural motion and detail', 'Kuaishou\'s large-scale training data'],
        faq: [
          { q: 'What is Kling 3.0?', a: 'Kling 3.0 is the latest AI video model by Kuaishou (快手). Generate 720p videos from text or images. Standard and Pro tiers available.' },
          { q: 'What\'s the difference between Standard and Pro?', a: 'Standard: 6 cr/sec for fast, affordable generation. Pro: 8 cr/sec for higher quality and detail. Both support 720p.' },
          { q: 'How much does Kling 3.0 cost?', a: 'Standard: 6 cr/sec (5s=30cr, 10s=60cr). Pro: 8 cr/sec (5s=40cr, 10s=80cr). Free credits at sign-up.' },
          { q: 'How does Kling 3.0 compare to Sora?', a: 'Kling 3.0 is available directly in browsers with both T2V and I2V support. Known for realistic video and natural motion.' },
        ],
      },
      ja: {
        title: 'Kling 3.0 AI動画生成 - 快手 最新動画モデル 無料',
        description: '快手のKling 3.0でAI動画を生成。Standard/Proティア、T2V/I2V対応、720p。Sora、Runway代替。無料クレジットで開始。',
        keywords: ['Kling 3.0', 'Kling 3.0 Pro', 'Kling 3.0 Standard', 'Kling AI', '快手AI', 'Kuaishou AI', 'Kling 無料', 'AI動画生成', 'Sora代替', 'Runway代替'],
        subtitle: '快手が開発した最新AI動画生成モデル',
        features: ['テキスト→動画、画像→動画', 'StandardとProの2ティア', '720p HD動画', '5秒、10秒の長さ', '自然なモーション', '快手の大規模学習データ'],
        faq: [
          { q: 'Kling 3.0とは？', a: '快手（Kuaishou）が開発した最新AI動画生成モデル。テキストや画像から720p動画を生成。StandardとProの2ティア。' },
          { q: 'StandardとProの違いは？', a: 'Standard: 6cr/秒で高速・経済的。Pro: 8cr/秒でより高品質。両方720p対応。' },
          { q: 'Kling 3.0の料金は？', a: 'Standard: 6cr/秒（5秒=30cr）、Pro: 8cr/秒（5秒=40cr）。無料クレジットで体験可能。' },
          { q: 'Kling 3.0とSoraの違いは？', a: 'Webブラウザで直接使用可能。T2VとI2V両方対応。リアルな映像と自然なモーションが特徴。' },
        ],
      },
      zh: {
        title: 'Kling 3.0 AI视频生成 - 快手最新视频模型 免费',
        description: '使用快手的Kling 3.0生成AI视频。Standard/Pro等级，T2V/I2V支持，720p。Sora、Runway替代。免费积分开始。',
        keywords: ['Kling 3.0', 'Kling 3.0 Pro', 'Kling 3.0 Standard', 'Kling AI', '快手AI', 'Kuaishou AI', 'Kling 免费', 'AI视频生成', 'Sora替代', 'Runway替代'],
        subtitle: '快手开发的最新AI视频生成模型',
        features: ['文字→视频、图片→视频', 'Standard和Pro两个等级', '720p高清视频', '5秒、10秒时长', '自然流畅的动效', '快手大规模训练数据'],
        faq: [
          { q: '什么是Kling 3.0？', a: '快手（Kuaishou）开发的最新AI视频生成模型。从文字或图片生成720p视频。提供Standard和Pro两个等级。' },
          { q: 'Standard和Pro有什么区别？', a: 'Standard: 6积分/秒，快速经济。Pro: 8积分/秒，更高质量。都支持720p。' },
          { q: 'Kling 3.0费用多少？', a: 'Standard: 6积分/秒（5秒=30积分），Pro: 8积分/秒（5秒=40积分）。注册送免费积分。' },
          { q: 'Kling 3.0和Sora有什么区别？', a: '网页浏览器直接使用。支持文字转视频和图片转视频。以逼真画面和自然动效著称。' },
        ],
      },
    },
  },

  'grok-video': {
    slug: 'grok-video',
    name: 'Grok Imagine Video',
    creator: 'xAI',
    type: 'video',
    modes: ['Text to Video', 'Image to Video'],
    resolutions: ['480p', '720p'],
    duration: '1-15s',
    creditSummary: {
      ko: '480p: 2cr/초, 720p: 3cr/초',
      en: '480p: 2cr/s, 720p: 3cr/s',
      ja: '480p: 2cr/秒, 720p: 3cr/秒',
      zh: '480p: 2积分/秒, 720p: 3积分/秒',
    },
    seo: {
      ko: {
        title: 'Grok Imagine Video AI 영상 생성기 - xAI Grok 영상 무료',
        description: 'Elon Musk의 xAI Grok Imagine Video로 AI 영상을 생성하세요. T2V/I2V, 480p-720p, 최대 15초. 무료 크레딧으로 시작.',
        keywords: ['Grok Imagine Video', 'Grok Video', 'Grok AI 영상', 'xAI Grok', 'Grok 영상 생성', 'Grok 무료', 'xAI AI 영상', 'Elon Musk AI 영상', 'Grok AI Video', 'AI 영상 생성', 'Sora 대안'],
        subtitle: 'Elon Musk의 xAI가 개발한 AI 영상 생성 모델',
        features: ['텍스트/이미지 → 영상 변환', 'xAI의 최신 AI 기술', '480p, 720p 해상도', '최대 15초 길이', '창의적인 영상 스타일', '간편한 사용 방법'],
        faq: [
          { q: 'Grok Imagine Video란?', a: 'Grok Imagine Video는 Elon Musk가 설립한 xAI에서 개발한 AI 영상 생성 모델입니다. 텍스트나 이미지를 입력하면 최대 15초 길이의 AI 영상을 생성합니다.' },
          { q: 'Grok Video 비용은?', a: '480p: 초당 2크레딧, 720p: 초당 3크레딧입니다. 예: 720p 5초 영상 = 15크레딧. 무료 회원가입 크레딧으로 바로 체험 가능합니다.' },
          { q: 'Grok Video의 특징은?', a: 'xAI의 기술력을 기반으로 한 독특하고 창의적인 영상 생성이 가능합니다. Text to Video와 Image to Video 모두 지원하며, 최대 15초까지 생성할 수 있습니다.' },
          { q: 'Grok AI 영상을 상업적으로 사용할 수 있나요?', a: '네, gwanggo에서 생성한 모든 AI 영상은 상업적 용도로 자유롭게 사용할 수 있습니다.' },
        ],
      },
      en: {
        title: 'Grok Imagine Video AI Generator - xAI Grok Video Free',
        description: 'Generate AI videos with xAI\'s Grok Imagine Video. T2V/I2V, 480p-720p, up to 15 seconds. Start free.',
        keywords: ['Grok Imagine Video', 'Grok Video', 'Grok AI video', 'xAI Grok', 'Grok video generator', 'Grok free', 'xAI AI video', 'Elon Musk AI', 'AI video generator', 'Sora alternative'],
        subtitle: 'AI video generation model by Elon Musk\'s xAI',
        features: ['Text/Image to Video', 'xAI\'s latest AI technology', '480p and 720p resolution', 'Up to 15 seconds', 'Creative video styles', 'Simple to use'],
        faq: [
          { q: 'What is Grok Imagine Video?', a: 'Grok Imagine Video is an AI video model by xAI, founded by Elon Musk. Generate up to 15-second videos from text or images.' },
          { q: 'How much does Grok Video cost?', a: '480p: 2 cr/sec, 720p: 3 cr/sec. Example: 720p 5s = 15 credits. Free credits at sign-up.' },
          { q: 'What makes Grok Video special?', a: 'Built on xAI technology for creative, unique video generation. Supports both T2V and I2V, up to 15 seconds.' },
          { q: 'Can I use Grok videos commercially?', a: 'Yes, all AI videos generated on gwanggo are free for commercial use.' },
        ],
      },
      ja: {
        title: 'Grok Imagine Video AI動画生成 - xAI Grok動画 無料',
        description: 'xAIのGrok Imagine VideoでAI動画を生成。T2V/I2V、480p-720p、最大15秒。無料クレジットで開始。',
        keywords: ['Grok Imagine Video', 'Grok Video', 'Grok AI動画', 'xAI Grok', 'Grok 動画生成', 'Grok 無料', 'AI動画生成', 'Sora代替'],
        subtitle: 'Elon MuskのxAIが開発したAI動画生成モデル',
        features: ['テキスト/画像→動画', 'xAIの最新技術', '480p、720p対応', '最大15秒', 'クリエイティブな映像', '簡単操作'],
        faq: [
          { q: 'Grok Imagine Videoとは？', a: 'Elon MuskのxAIが開発したAI動画モデル。テキストや画像から最大15秒の動画を生成。' },
          { q: 'Grok Videoの料金は？', a: '480p: 2cr/秒、720p: 3cr/秒。例：720p 5秒 = 15クレジット。無料クレジットで体験。' },
          { q: 'Grok Videoの特徴は？', a: 'xAI技術による独創的な映像生成。T2VとI2V対応、最大15秒。' },
          { q: 'Grok動画は商用利用できますか？', a: 'はい、gwanggoで生成したすべてのAI動画は商用利用可能です。' },
        ],
      },
      zh: {
        title: 'Grok Imagine Video AI视频生成 - xAI Grok视频 免费',
        description: '使用xAI的Grok Imagine Video生成AI视频。T2V/I2V，480p-720p，最长15秒。免费积分开始。',
        keywords: ['Grok Imagine Video', 'Grok Video', 'Grok AI视频', 'xAI Grok', 'Grok 视频生成', 'Grok 免费', 'AI视频生成', 'Sora替代'],
        subtitle: 'Elon Musk的xAI开发的AI视频生成模型',
        features: ['文字/图片→视频', 'xAI最新技术', '480p、720p分辨率', '最长15秒', '创意视频风格', '简单易用'],
        faq: [
          { q: '什么是Grok Imagine Video？', a: 'Elon Musk的xAI开发的AI视频模型。从文字或图片生成最长15秒的视频。' },
          { q: 'Grok Video费用多少？', a: '480p: 2积分/秒，720p: 3积分/秒。例：720p 5秒 = 15积分。注册送免费积分。' },
          { q: 'Grok Video有什么特点？', a: '基于xAI技术的创意视频生成。支持T2V和I2V，最长15秒。' },
          { q: 'Grok视频能商用吗？', a: '可以，在gwanggo生成的所有AI视频都可以自由商用。' },
        ],
      },
    },
  },

  'wan-26': {
    slug: 'wan-26',
    name: 'Wan 2.6',
    creator: 'Alibaba',
    type: 'video',
    modes: ['Text to Video', 'Image to Video'],
    resolutions: ['720p', '1080p'],
    duration: '5-15s',
    creditSummary: {
      ko: '720p: 4cr/초, 1080p: 5cr/초',
      en: '720p: 4cr/s, 1080p: 5cr/s',
      ja: '720p: 4cr/秒, 1080p: 5cr/秒',
      zh: '720p: 4积分/秒, 1080p: 5积分/秒',
    },
    seo: {
      ko: {
        title: 'Wan 2.6 AI 영상 생성기 - 알리바바 AI 영상 모델 무료',
        description: '알리바바의 Wan 2.6으로 AI 영상을 생성하세요. T2V/I2V, 720p-1080p, 5~15초. 고해상도 긴 영상 지원. 무료 크레딧으로 시작.',
        keywords: ['Wan 2.6', 'Wan AI', '알리바바 AI', 'Alibaba Wan', 'Alibaba AI 영상', 'Wan 2.6 사용법', 'Wan 2.6 무료', 'Wan AI 영상', 'AI 영상 생성', '1080p AI 영상', 'Sora 대안', 'Runway 대안'],
        subtitle: '알리바바가 개발한 고해상도 AI 영상 생성 모델',
        features: [
          '텍스트/이미지 → 영상 변환',
          '720p, 1080p 고해상도 지원',
          '최대 15초 길이 (긴 영상 가능)',
          '5가지 종횡비 선택 (16:9, 9:16 등)',
          '알리바바의 대규모 AI 학습 기반',
          '자연스럽고 사실적인 모션',
        ],
        faq: [
          { q: 'Wan 2.6이란?', a: 'Wan 2.6은 알리바바(Alibaba)가 개발한 AI 영상 생성 모델입니다. 텍스트나 이미지를 입력하면 최대 1080p, 15초 길이의 고품질 AI 영상을 생성합니다.' },
          { q: 'Wan 2.6 비용은?', a: '720p: 초당 4크레딧, 1080p: 초당 5크레딧입니다. 예: 1080p 5초 영상 = 25크레딧. 무료 회원가입 크레딧으로 체험 가능합니다.' },
          { q: 'Wan 2.6의 강점은?', a: '1080p 고해상도와 최대 15초의 긴 영상을 지원합니다. 5가지 종횡비를 선택할 수 있어 세로형(9:16) 숏폼부터 가로형(16:9) 광고까지 다양한 형식에 대응합니다.' },
          { q: 'Wan 2.6으로 어떤 영상을 만들 수 있나요?', a: '제품 광고 영상, 인스타그램 릴스, 유튜브 숏츠, 틱톡 영상 등 다양한 콘텐츠를 만들 수 있습니다. 1080p 고해상도로 전문적인 품질을 제공합니다.' },
        ],
      },
      en: {
        title: 'Wan 2.6 AI Video Generator - Alibaba AI Video Model Free',
        description: 'Generate AI videos with Alibaba\'s Wan 2.6. T2V/I2V, 720p-1080p, 5-15 seconds. High resolution, long videos. Start free.',
        keywords: ['Wan 2.6', 'Wan AI', 'Alibaba AI', 'Alibaba Wan', 'Alibaba AI video', 'Wan 2.6 free', 'Wan AI video', 'AI video generator', '1080p AI video', 'Sora alternative', 'Runway alternative'],
        subtitle: 'High-resolution AI video model by Alibaba',
        features: ['Text/Image to Video', '720p and 1080p resolution', 'Up to 15 seconds', '5 aspect ratios (16:9, 9:16, etc.)', 'Alibaba\'s large-scale AI training', 'Natural, realistic motion'],
        faq: [
          { q: 'What is Wan 2.6?', a: 'Wan 2.6 is an AI video model by Alibaba. Generate up to 1080p, 15-second high-quality videos from text or images.' },
          { q: 'How much does Wan 2.6 cost?', a: '720p: 4 cr/sec, 1080p: 5 cr/sec. Example: 1080p 5s = 25 credits. Free credits at sign-up.' },
          { q: 'What are Wan 2.6\'s strengths?', a: 'Supports 1080p and up to 15 seconds. 5 aspect ratios for vertical shorts to horizontal ads.' },
          { q: 'What videos can I create with Wan 2.6?', a: 'Product ads, Instagram Reels, YouTube Shorts, TikTok videos, and more in professional 1080p quality.' },
        ],
      },
      ja: {
        title: 'Wan 2.6 AI動画生成 - アリババ AI動画モデル 無料',
        description: 'アリババのWan 2.6でAI動画を生成。T2V/I2V、720p-1080p、5〜15秒。高解像度・長尺対応。無料クレジットで開始。',
        keywords: ['Wan 2.6', 'Wan AI', 'アリババAI', 'Alibaba Wan', 'Wan 2.6 無料', 'AI動画生成', '1080p AI動画', 'Sora代替', 'Runway代替'],
        subtitle: 'アリババが開発した高解像度AI動画生成モデル',
        features: ['テキスト/画像→動画', '720p、1080p対応', '最大15秒', '5種類のアスペクト比', 'アリババの大規模AI学習', '自然でリアルなモーション'],
        faq: [
          { q: 'Wan 2.6とは？', a: 'アリババが開発したAI動画モデル。テキストや画像から最大1080p、15秒の高品質動画を生成。' },
          { q: 'Wan 2.6の料金は？', a: '720p: 4cr/秒、1080p: 5cr/秒。例：1080p 5秒 = 25クレジット。無料クレジットで体験。' },
          { q: 'Wan 2.6の強みは？', a: '1080p高解像度と最大15秒。5種類のアスペクト比で縦型ショートから横型広告まで対応。' },
          { q: 'Wan 2.6でどんな動画が作れますか？', a: '商品広告、Instagram Reels、YouTube Shorts、TikTok動画など。プロ品質の1080p。' },
        ],
      },
      zh: {
        title: 'Wan 2.6 AI视频生成 - 阿里巴巴AI视频模型 免费',
        description: '使用阿里巴巴的Wan 2.6生成AI视频。T2V/I2V，720p-1080p，5-15秒。高分辨率长视频。免费积分开始。',
        keywords: ['Wan 2.6', 'Wan AI', '阿里巴巴AI', 'Alibaba Wan', 'Wan 2.6 免费', 'AI视频生成', '1080p AI视频', 'Sora替代', 'Runway替代'],
        subtitle: '阿里巴巴开发的高分辨率AI视频生成模型',
        features: ['文字/图片→视频', '720p、1080p分辨率', '最长15秒', '5种宽高比', '阿里巴巴大规模AI训练', '自然逼真的动效'],
        faq: [
          { q: '什么是Wan 2.6？', a: '阿里巴巴开发的AI视频模型。从文字或图片生成最高1080p、15秒的高质量视频。' },
          { q: 'Wan 2.6费用多少？', a: '720p: 4积分/秒，1080p: 5积分/秒。例：1080p 5秒 = 25积分。注册送免费积分。' },
          { q: 'Wan 2.6有什么优势？', a: '支持1080p和最长15秒。5种宽高比，从竖屏短视频到横屏广告都能制作。' },
          { q: 'Wan 2.6能创建什么视频？', a: '产品广告、Instagram Reels、YouTube Shorts、TikTok视频等。专业1080p画质。' },
        ],
      },
    },
  },

  'veo-31': {
    slug: 'veo-31',
    name: 'Google Veo 3.1',
    creator: 'Google',
    type: 'video',
    modes: ['Text to Video', 'Image to Video'],
    resolutions: ['720p', '1080p'],
    duration: '1-8s',
    creditSummary: {
      ko: '720p: 4cr/초, 1080p: 7cr/초',
      en: '720p: 4cr/s, 1080p: 7cr/s',
      ja: '720p: 4cr/秒, 1080p: 7cr/秒',
      zh: '720p: 4积分/秒, 1080p: 7积分/秒',
    },
    seo: {
      ko: {
        title: 'Google Veo 3.1 AI 영상 생성기 - 오디오 포함 영상 생성 무료',
        description: 'Google의 Veo 3.1로 오디오가 포함된 AI 영상을 생성하세요. T2V/I2V, 720p-1080p, 최대 8초. 오디오 자동 생성, 다양한 종횡비 지원. 무료 크레딧으로 시작.',
        keywords: ['Google Veo 3.1', 'Veo 3.1', 'Veo 3', 'Google AI 영상', 'Google Veo', 'Veo AI', 'Veo 3.1 무료', 'Veo 3.1 사용법', 'AI 영상 생성', 'AI 오디오 영상', '1080p AI 영상', 'Sora 대안', 'Runway 대안', 'Google AI Video'],
        subtitle: 'Google이 개발한 오디오 포함 AI 영상 생성 모델',
        features: [
          '텍스트/이미지 → 영상 변환 (T2V, I2V)',
          '오디오 자동 생성 (영상에 맞는 사운드)',
          '720p, 1080p 고해상도 지원',
          '다양한 종횡비 선택 (16:9, 9:16 등)',
          '최대 8초 길이',
          'Google의 최첨단 AI 기술 기반',
        ],
        faq: [
          { q: 'Google Veo 3.1이란?', a: 'Google Veo 3.1은 Google이 개발한 최신 AI 영상 생성 모델입니다. 텍스트나 이미지를 입력하면 오디오가 포함된 고품질 AI 영상을 생성합니다. gwanggo에서 무료로 사용 가능합니다.' },
          { q: 'Veo 3.1 비용은?', a: '720p: 초당 4크레딧, 1080p: 초당 7크레딧입니다. 예: 1080p 5초 영상 = 35크레딧. 무료 회원가입 크레딧으로 체험 가능합니다.' },
          { q: 'Veo 3.1의 오디오 생성 기능이란?', a: 'Veo 3.1은 영상을 생성할 때 영상 내용에 맞는 오디오(음향 효과, 배경음 등)를 자동으로 함께 생성합니다. 별도의 오디오 작업 없이 완성된 영상을 바로 얻을 수 있습니다.' },
          { q: 'Veo 3.1과 Sora의 차이점은?', a: 'Veo 3.1은 Google의 최첨단 AI 기술 기반으로 오디오 자동 생성이 특징입니다. gwanggo에서 웹 브라우저로 바로 사용 가능하며, T2V와 I2V를 모두 지원합니다.' },
        ],
      },
      en: {
        title: 'Google Veo 3.1 AI Video Generator - Video with Audio Free',
        description: 'Generate AI videos with audio using Google\'s Veo 3.1. T2V/I2V, 720p-1080p, up to 8 seconds. Auto audio generation, multiple aspect ratios. Start free.',
        keywords: ['Google Veo 3.1', 'Veo 3.1', 'Veo 3', 'Google AI video', 'Google Veo', 'Veo AI', 'Veo 3.1 free', 'AI video generator', 'AI video with audio', '1080p AI video', 'Sora alternative', 'Runway alternative', 'Google AI Video'],
        subtitle: 'AI video generation with audio by Google',
        features: [
          'Text/Image to Video (T2V, I2V)',
          'Automatic audio generation (matching sound)',
          '720p and 1080p resolution',
          'Multiple aspect ratios (16:9, 9:16, etc.)',
          'Up to 8 seconds',
          'Powered by Google\'s cutting-edge AI',
        ],
        faq: [
          { q: 'What is Google Veo 3.1?', a: 'Google Veo 3.1 is Google\'s latest AI video generation model. Generate high-quality videos with audio from text or images. Available for free on gwanggo.' },
          { q: 'How much does Veo 3.1 cost?', a: '720p: 4 cr/sec, 1080p: 7 cr/sec. Example: 1080p 5s = 35 credits. Free credits at sign-up.' },
          { q: 'What is the audio generation feature?', a: 'Veo 3.1 automatically generates matching audio (sound effects, ambient sounds) along with the video. Get complete videos without separate audio work.' },
          { q: 'How does Veo 3.1 compare to Sora?', a: 'Veo 3.1 is built on Google\'s cutting-edge AI and uniquely offers automatic audio generation. Works directly in browsers on gwanggo with both T2V and I2V support.' },
        ],
      },
      ja: {
        title: 'Google Veo 3.1 AI動画生成 - オーディオ付き動画 無料',
        description: 'GoogleのVeo 3.1でオーディオ付きAI動画を生成。T2V/I2V、720p-1080p、最大8秒。オーディオ自動生成、複数アスペクト比対応。無料クレジットで開始。',
        keywords: ['Google Veo 3.1', 'Veo 3.1', 'Veo 3', 'Google AI動画', 'Google Veo', 'Veo AI', 'Veo 3.1 無料', 'AI動画生成', 'オーディオ付きAI動画', '1080p AI動画', 'Sora代替', 'Runway代替'],
        subtitle: 'Googleが開発したオーディオ付きAI動画生成モデル',
        features: [
          'テキスト/画像→動画（T2V、I2V）',
          'オーディオ自動生成（映像に合ったサウンド）',
          '720p、1080p対応',
          '複数のアスペクト比対応',
          '最大8秒',
          'Googleの最先端AI技術',
        ],
        faq: [
          { q: 'Google Veo 3.1とは？', a: 'Googleが開発した最新AI動画生成モデル。テキストや画像からオーディオ付き高品質動画を生成。gwanggoで無料で利用可能。' },
          { q: 'Veo 3.1の料金は？', a: '720p: 4cr/秒、1080p: 7cr/秒。例：1080p 5秒 = 35クレジット。無料クレジットで体験。' },
          { q: 'オーディオ生成機能とは？', a: 'Veo 3.1は動画生成時に映像内容に合ったオーディオ（効果音、環境音など）を自動生成。別途オーディオ作業なしで完成動画が得られます。' },
          { q: 'Veo 3.1とSoraの違いは？', a: 'Googleの最先端AI基盤で、オーディオ自動生成が特徴。Webブラウザで直接使用可能。T2VとI2V両方対応。' },
        ],
      },
      zh: {
        title: 'Google Veo 3.1 AI视频生成 - 含音频视频 免费',
        description: '使用Google的Veo 3.1生成含音频的AI视频。T2V/I2V，720p-1080p，最长8秒。自动生成音频，多种宽高比。免费积分开始。',
        keywords: ['Google Veo 3.1', 'Veo 3.1', 'Veo 3', 'Google AI视频', 'Google Veo', 'Veo AI', 'Veo 3.1 免费', 'AI视频生成', '含音频AI视频', '1080p AI视频', 'Sora替代', 'Runway替代'],
        subtitle: 'Google开发的含音频AI视频生成模型',
        features: [
          '文字/图片→视频（T2V、I2V）',
          '自动生成音频（匹配画面的音效）',
          '720p、1080p分辨率',
          '多种宽高比支持',
          '最长8秒',
          'Google尖端AI技术驱动',
        ],
        faq: [
          { q: '什么是Google Veo 3.1？', a: 'Google开发的最新AI视频生成模型。从文字或图片生成含音频的高质量视频。在gwanggo上免费使用。' },
          { q: 'Veo 3.1费用多少？', a: '720p: 4积分/秒，1080p: 7积分/秒。例：1080p 5秒 = 35积分。注册送免费积分。' },
          { q: '音频生成功能是什么？', a: 'Veo 3.1在生成视频时会自动生成匹配画面的音频（音效、环境音等）。无需额外音频处理即可获得完整视频。' },
          { q: 'Veo 3.1和Sora有什么区别？', a: '基于Google尖端AI技术，独特的自动音频生成功能。网页浏览器直接使用，支持T2V和I2V。' },
        ],
      },
    },
  },

  'hailuo-02': {
    slug: 'hailuo-02',
    name: 'MiniMax Hailuo-02',
    creator: 'MiniMax',
    type: 'video',
    modes: ['Text to Video', 'Image to Video'],
    resolutions: ['768p', '1080p'],
    duration: '1-6s',
    creditSummary: {
      ko: 'Standard(768p): 2cr/초, Pro(1080p): 3cr/초',
      en: 'Standard(768p): 2cr/s, Pro(1080p): 3cr/s',
      ja: 'Standard(768p): 2cr/秒, Pro(1080p): 3cr/秒',
      zh: 'Standard(768p): 2积分/秒, Pro(1080p): 3积分/秒',
    },
    seo: {
      ko: {
        title: 'MiniMax Hailuo-02 AI 영상 생성기 - Standard/Pro 무료',
        description: 'MiniMax의 Hailuo-02로 AI 영상을 생성하세요. T2V/I2V, Standard(768p)/Pro(1080p), 최대 6초. 경제적인 가격의 고품질 영상. 무료 크레딧으로 시작.',
        keywords: ['Hailuo-02', 'Hailuo 02', 'MiniMax Hailuo', 'MiniMax AI', 'Hailuo AI', 'Hailuo 영상', 'Hailuo 무료', 'Hailuo-02 사용법', 'AI 영상 생성', 'MiniMax 영상', 'Sora 대안', 'Runway 대안', 'Hailuo Video', 'AI 동영상 만들기'],
        subtitle: 'MiniMax가 개발한 경제적인 AI 영상 생성 모델',
        features: [
          '텍스트/이미지 → 영상 변환 (T2V, I2V)',
          'Standard(768p)와 Pro(1080p) 두 가지 티어',
          '최대 6초 길이',
          '경제적인 크레딧 가격',
          '자연스러운 모션 표현',
          '빠른 생성 속도',
        ],
        faq: [
          { q: 'MiniMax Hailuo-02란?', a: 'Hailuo-02는 MiniMax가 개발한 AI 영상 생성 모델입니다. 텍스트나 이미지를 입력하면 고품질 AI 영상을 생성합니다. Standard(768p)와 Pro(1080p) 두 가지 티어를 제공합니다.' },
          { q: 'Hailuo-02 비용은?', a: 'Standard(768p): 초당 2크레딧, Pro(1080p): 초당 3크레딧입니다. 예: Pro 5초 영상 = 15크레딧. 무료 회원가입 크레딧으로 바로 체험 가능합니다.' },
          { q: 'Hailuo-02 Standard와 Pro의 차이점은?', a: 'Standard는 768p 해상도로 초당 2크레딧의 경제적인 가격입니다. Pro는 1080p 고해상도로 초당 3크레딧이며 더 높은 품질을 제공합니다.' },
          { q: 'Hailuo-02로 어떤 영상을 만들 수 있나요?', a: '제품 광고, SNS 숏폼, 브랜드 콘텐츠 등 다양한 영상을 만들 수 있습니다. T2V와 I2V를 모두 지원하여 텍스트 또는 이미지 기반으로 영상을 생성할 수 있습니다.' },
        ],
      },
      en: {
        title: 'MiniMax Hailuo-02 AI Video Generator - Standard/Pro Free',
        description: 'Generate AI videos with MiniMax\'s Hailuo-02. T2V/I2V, Standard(768p)/Pro(1080p), up to 6 seconds. Affordable high-quality video. Start free.',
        keywords: ['Hailuo-02', 'Hailuo 02', 'MiniMax Hailuo', 'MiniMax AI', 'Hailuo AI', 'Hailuo video', 'Hailuo free', 'AI video generator', 'MiniMax video', 'Sora alternative', 'Runway alternative', 'Hailuo Video', 'affordable AI video'],
        subtitle: 'Affordable AI video generation model by MiniMax',
        features: [
          'Text/Image to Video (T2V, I2V)',
          'Standard(768p) and Pro(1080p) tiers',
          'Up to 6 seconds',
          'Affordable credit pricing',
          'Natural motion',
          'Fast generation speed',
        ],
        faq: [
          { q: 'What is MiniMax Hailuo-02?', a: 'Hailuo-02 is an AI video generation model by MiniMax. Generate high-quality videos from text or images. Standard(768p) and Pro(1080p) tiers available.' },
          { q: 'How much does Hailuo-02 cost?', a: 'Standard(768p): 2 cr/sec, Pro(1080p): 3 cr/sec. Example: Pro 5s = 15 credits. Free credits at sign-up.' },
          { q: 'What\'s the difference between Standard and Pro?', a: 'Standard offers 768p at 2 credits/sec for affordable generation. Pro offers 1080p at 3 credits/sec for higher quality.' },
          { q: 'What videos can I create with Hailuo-02?', a: 'Product ads, social media shorts, brand content, and more. Supports both T2V and I2V for text or image-based video generation.' },
        ],
      },
      ja: {
        title: 'MiniMax Hailuo-02 AI動画生成 - Standard/Pro 無料',
        description: 'MiniMaxのHailuo-02でAI動画を生成。T2V/I2V、Standard(768p)/Pro(1080p)、最大6秒。手頃な価格の高品質動画。無料クレジットで開始。',
        keywords: ['Hailuo-02', 'Hailuo 02', 'MiniMax Hailuo', 'MiniMax AI', 'Hailuo AI', 'Hailuo 動画', 'Hailuo 無料', 'AI動画生成', 'MiniMax動画', 'Sora代替', 'Runway代替'],
        subtitle: 'MiniMaxが開発した手頃なAI動画生成モデル',
        features: [
          'テキスト/画像→動画（T2V、I2V）',
          'Standard(768p)とPro(1080p)の2ティア',
          '最大6秒',
          '手頃なクレジット価格',
          '自然なモーション',
          '高速生成',
        ],
        faq: [
          { q: 'MiniMax Hailuo-02とは？', a: 'MiniMaxが開発したAI動画生成モデル。テキストや画像から高品質動画を生成。Standard(768p)とPro(1080p)の2ティア。' },
          { q: 'Hailuo-02の料金は？', a: 'Standard(768p): 2cr/秒、Pro(1080p): 3cr/秒。例：Pro 5秒 = 15クレジット。無料クレジットで体験。' },
          { q: 'StandardとProの違いは？', a: 'Standardは768pで2cr/秒の手頃な価格。Proは1080pで3cr/秒の高品質。' },
          { q: 'Hailuo-02でどんな動画が作れますか？', a: '商品広告、SNSショート動画、ブランドコンテンツなど。T2VとI2V両方対応。' },
        ],
      },
      zh: {
        title: 'MiniMax Hailuo-02 AI视频生成 - Standard/Pro 免费',
        description: '使用MiniMax的Hailuo-02生成AI视频。T2V/I2V，Standard(768p)/Pro(1080p)，最长6秒。经济实惠的高质量视频。免费积分开始。',
        keywords: ['Hailuo-02', 'Hailuo 02', 'MiniMax Hailuo', 'MiniMax AI', 'Hailuo AI', 'Hailuo 视频', 'Hailuo 免费', 'AI视频生成', 'MiniMax视频', 'Sora替代', 'Runway替代'],
        subtitle: 'MiniMax开发的经济实惠AI视频生成模型',
        features: [
          '文字/图片→视频（T2V、I2V）',
          'Standard(768p)和Pro(1080p)两个等级',
          '最长6秒',
          '经济实惠的积分价格',
          '自然流畅的动效',
          '快速生成',
        ],
        faq: [
          { q: '什么是MiniMax Hailuo-02？', a: 'MiniMax开发的AI视频生成模型。从文字或图片生成高质量视频。提供Standard(768p)和Pro(1080p)两个等级。' },
          { q: 'Hailuo-02费用多少？', a: 'Standard(768p): 2积分/秒，Pro(1080p): 3积分/秒。例：Pro 5秒 = 15积分。注册送免费积分。' },
          { q: 'Standard和Pro有什么区别？', a: 'Standard是768p，2积分/秒，经济实惠。Pro是1080p，3积分/秒，更高质量。' },
          { q: 'Hailuo-02能创建什么视频？', a: '产品广告、社交媒体短视频、品牌内容等。支持T2V和I2V两种模式。' },
        ],
      },
    },
  },

  'ltx-23': {
    slug: 'ltx-23',
    name: 'Lightricks LTX-2.3',
    creator: 'Lightricks',
    type: 'video',
    modes: ['Text to Video', 'Image to Video'],
    resolutions: ['720p', '1080p'],
    duration: '1-20s',
    creditSummary: {
      ko: '720p: 4cr/초, 1080p: 5cr/초',
      en: '720p: 4cr/s, 1080p: 5cr/s',
      ja: '720p: 4cr/秒, 1080p: 5cr/秒',
      zh: '720p: 4积分/秒, 1080p: 5积分/秒',
    },
    seo: {
      ko: {
        title: 'LTX-2.3 AI 영상 생성기 - Lightricks 오픈소스 최대 20초 무료',
        description: 'Lightricks의 LTX-2.3으로 AI 영상을 생성하세요. T2V/I2V, 720p-1080p, 최대 20초. 오픈소스 기반, 다양한 종횡비. 무료 크레딧으로 시작.',
        keywords: ['LTX-2.3', 'LTX 2.3', 'Lightricks LTX', 'Lightricks AI', 'LTX Video', 'LTX-2.3 무료', 'LTX-2.3 사용법', 'AI 영상 생성', '20초 AI 영상', '오픈소스 AI 영상', '1080p AI 영상', 'Sora 대안', 'Runway 대안', 'Lightricks 영상'],
        subtitle: 'Lightricks가 개발한 오픈소스 기반 장시간 AI 영상 생성 모델',
        features: [
          '텍스트/이미지 → 영상 변환 (T2V, I2V)',
          '최대 20초 길이 (업계 최장급)',
          '720p, 1080p 고해상도 지원',
          '다양한 종횡비 선택 가능',
          '오픈소스 기반의 투명한 기술',
          '긴 영상에 적합한 일관된 품질',
        ],
        faq: [
          { q: 'LTX-2.3이란?', a: 'LTX-2.3은 Lightricks가 개발한 오픈소스 기반 AI 영상 생성 모델입니다. 텍스트나 이미지를 입력하면 최대 1080p, 20초 길이의 AI 영상을 생성합니다. gwanggo에서 무료로 사용 가능합니다.' },
          { q: 'LTX-2.3 비용은?', a: '720p: 초당 4크레딧, 1080p: 초당 5크레딧입니다. 예: 1080p 10초 영상 = 50크레딧. 무료 회원가입 크레딧으로 체험 가능합니다.' },
          { q: 'LTX-2.3의 최대 영상 길이는?', a: 'LTX-2.3은 최대 20초까지의 영상을 생성할 수 있어 업계에서 가장 긴 영상을 지원하는 모델 중 하나입니다. 제품 소개, 광고 등 긴 콘텐츠 제작에 적합합니다.' },
          { q: 'LTX-2.3이 오픈소스라는 의미는?', a: 'LTX-2.3은 오픈소스로 공개된 모델을 기반으로 하여 기술의 투명성이 보장됩니다. gwanggo에서는 별도 설치 없이 웹 브라우저에서 바로 사용할 수 있습니다.' },
        ],
      },
      en: {
        title: 'LTX-2.3 AI Video Generator - Lightricks Open Source Up to 20s Free',
        description: 'Generate AI videos with Lightricks\' LTX-2.3. T2V/I2V, 720p-1080p, up to 20 seconds. Open source, multiple aspect ratios. Start free.',
        keywords: ['LTX-2.3', 'LTX 2.3', 'Lightricks LTX', 'Lightricks AI', 'LTX Video', 'LTX-2.3 free', 'AI video generator', '20 second AI video', 'open source AI video', '1080p AI video', 'Sora alternative', 'Runway alternative', 'Lightricks video'],
        subtitle: 'Open-source long-form AI video generation model by Lightricks',
        features: [
          'Text/Image to Video (T2V, I2V)',
          'Up to 20 seconds (industry leading)',
          '720p and 1080p resolution',
          'Multiple aspect ratios',
          'Open-source transparency',
          'Consistent quality for long videos',
        ],
        faq: [
          { q: 'What is LTX-2.3?', a: 'LTX-2.3 is an open-source AI video generation model by Lightricks. Generate up to 1080p, 20-second videos from text or images. Available for free on gwanggo.' },
          { q: 'How much does LTX-2.3 cost?', a: '720p: 4 cr/sec, 1080p: 5 cr/sec. Example: 1080p 10s = 50 credits. Free credits at sign-up.' },
          { q: 'What is the maximum video length?', a: 'LTX-2.3 supports up to 20 seconds, making it one of the longest video generators available. Ideal for product intros and ads.' },
          { q: 'What does open source mean for LTX-2.3?', a: 'LTX-2.3 is built on an open-source model ensuring technology transparency. On gwanggo, use it directly in your browser with no setup required.' },
        ],
      },
      ja: {
        title: 'LTX-2.3 AI動画生成 - Lightricks オープンソース 最大20秒 無料',
        description: 'LightricksのLTX-2.3でAI動画を生成。T2V/I2V、720p-1080p、最大20秒。オープンソース、複数アスペクト比対応。無料クレジットで開始。',
        keywords: ['LTX-2.3', 'LTX 2.3', 'Lightricks LTX', 'Lightricks AI', 'LTX Video', 'LTX-2.3 無料', 'AI動画生成', '20秒AI動画', 'オープンソースAI動画', '1080p AI動画', 'Sora代替', 'Runway代替'],
        subtitle: 'Lightricksが開発したオープンソース長時間AI動画生成モデル',
        features: [
          'テキスト/画像→動画（T2V、I2V）',
          '最大20秒（業界最長級）',
          '720p、1080p対応',
          '複数のアスペクト比',
          'オープンソースの透明性',
          '長尺でも一貫した品質',
        ],
        faq: [
          { q: 'LTX-2.3とは？', a: 'Lightricksが開発したオープンソースAI動画生成モデル。テキストや画像から最大1080p、20秒の動画を生成。gwanggoで無料で利用可能。' },
          { q: 'LTX-2.3の料金は？', a: '720p: 4cr/秒、1080p: 5cr/秒。例：1080p 10秒 = 50クレジット。無料クレジットで体験。' },
          { q: '最大動画長は？', a: '最大20秒で、業界最長級。商品紹介や広告などの長尺コンテンツに最適。' },
          { q: 'オープンソースとはどういう意味ですか？', a: 'LTX-2.3はオープンソースモデルを基盤とし、技術の透明性を確保。gwanggoではインストール不要でWebブラウザから直接使用可能。' },
        ],
      },
      zh: {
        title: 'LTX-2.3 AI视频生成 - Lightricks 开源 最长20秒 免费',
        description: '使用Lightricks的LTX-2.3生成AI视频。T2V/I2V，720p-1080p，最长20秒。开源，多种宽高比。免费积分开始。',
        keywords: ['LTX-2.3', 'LTX 2.3', 'Lightricks LTX', 'Lightricks AI', 'LTX Video', 'LTX-2.3 免费', 'AI视频生成', '20秒AI视频', '开源AI视频', '1080p AI视频', 'Sora替代', 'Runway替代'],
        subtitle: 'Lightricks开发的开源长视频AI视频生成模型',
        features: [
          '文字/图片→视频（T2V、I2V）',
          '最长20秒（业内领先）',
          '720p、1080p分辨率',
          '多种宽高比',
          '开源技术透明',
          '长视频一致的质量',
        ],
        faq: [
          { q: '什么是LTX-2.3？', a: 'Lightricks开发的开源AI视频生成模型。从文字或图片生成最高1080p、20秒的视频。在gwanggo上免费使用。' },
          { q: 'LTX-2.3费用多少？', a: '720p: 4积分/秒，1080p: 5积分/秒。例：1080p 10秒 = 50积分。注册送免费积分。' },
          { q: '最长视频时长是多少？', a: '最长20秒，业内领先。适合产品介绍和广告等长内容。' },
          { q: '开源意味着什么？', a: 'LTX-2.3基于开源模型，确保技术透明。在gwanggo无需安装，网页浏览器直接使用。' },
        ],
      },
    },
  },
}

// ============================================================
// 유틸리티
// ============================================================

export function isValidImageModelSlug(slug: string): slug is ImageModelSlug {
  return IMAGE_MODEL_SLUGS.includes(slug as ImageModelSlug)
}

export function isValidVideoModelSlug(slug: string): slug is VideoModelSlug {
  return VIDEO_MODEL_SLUGS.includes(slug as VideoModelSlug)
}
