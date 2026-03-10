import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ImageGenerator from '@/components/ai-tools/image-generator'

const validLanguages = ['ko', 'en', 'ja', 'zh'] as const
type Lang = (typeof validLanguages)[number]

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

const ogLocale: Record<Lang, string> = {
  ko: 'ko_KR', en: 'en_US', ja: 'ja_JP', zh: 'zh_CN',
}

const IMAGE_MODEL_SLUGS = [
  'seedream-5', 'flux-2-pro', 'grok-image', 'z-image', 'nano-banana-2',
] as const
type ModelSlug = (typeof IMAGE_MODEL_SLUGS)[number]

interface ModelMeta {
  name: string
  creator: string
  description: Record<Lang, string>
  title: Record<Lang, string>
  keywords: Record<Lang, string[]>
  jsonLdDescription: Record<Lang, string>
  faq: Record<Lang, { q: string; a: string }[]>
  features: Record<Lang, string[]>
}

const MODELS: Record<ModelSlug, ModelMeta> = {
  'seedream-5': {
    name: 'Seedream 5',
    creator: 'ByteDance',
    description: {
      ko: 'ByteDance Seedream 5로 참조 이미지 기반 AI 이미지 편집. 기본/고화질 지원. 광고 배너에 최적화.',
      en: 'AI image editing with ByteDance Seedream 5 based on reference images. Basic/high quality. Optimized for ad banners.',
      ja: 'ByteDance Seedream 5で参照画像ベースのAI画像編集。基本/高画質対応。広告バナーに最適。',
      zh: '使用ByteDance Seedream 5基于参考图像进行AI图像编辑。支持基本/高质量。适用于广告横幅。',
    },
    title: {
      ko: 'Seedream 5 AI 이미지 생성 | gwanggo',
      en: 'Seedream 5 AI Image Generator | gwanggo',
      ja: 'Seedream 5 AI画像生成 | gwanggo',
      zh: 'Seedream 5 AI图像生成 | gwanggo',
    },
    keywords: {
      ko: ['Seedream 5', 'ByteDance', '바이트댄스', 'AI 이미지 생성', 'AI 이미지 편집', 'Midjourney 대안'],
      en: ['Seedream 5', 'ByteDance', 'AI image generator', 'AI image editing', 'Midjourney alternative'],
      ja: ['Seedream 5', 'ByteDance', 'バイトダンス', 'AI画像生成', 'AI画像編集', 'Midjourney代替'],
      zh: ['Seedream 5', 'ByteDance', '字节跳动', 'AI图像生成', 'AI图像编辑', 'Midjourney替代'],
    },
    jsonLdDescription: {
      ko: 'ByteDance가 개발한 AI 이미지 편집 모델. 참조 이미지 기반 편집, 기본/고화질 지원.',
      en: 'AI image editing model by ByteDance. Reference image-based editing with basic/high quality.',
      ja: 'ByteDanceが開発したAI画像編集モデル。参照画像ベースの編集、基本/高画質対応。',
      zh: 'ByteDance开发的AI图像编辑模型。基于参考图像编辑，支持基本/高质量。',
    },
    faq: {
      ko: [
        { q: 'Seedream 5란 무엇인가요?', a: 'Seedream 5는 ByteDance가 개발한 AI 이미지 생성 모델입니다. 텍스트 투 이미지 생성과 참조 이미지 기반 편집을 모두 지원하며, 광고 배너 제작에 최적화되어 있습니다.' },
        { q: 'Seedream 5 크레딧은 얼마인가요?', a: '중화질(기본) 이미지 생성은 2크레딧, 고화질 이미지 생성은 3크레딧이 소모됩니다. 용도에 따라 화질을 선택하여 크레딧을 효율적으로 사용할 수 있습니다.' },
        { q: '어떤 비율의 이미지를 만들 수 있나요?', a: '1:1(정사각형), 4:3(가로), 3:4(세로), 16:9(와이드), 9:16(세로 와이드) 등 5가지 비율을 지원합니다. 광고 배너, SNS 포스트, 스토리 등 다양한 용도에 맞게 선택 가능합니다.' },
        { q: 'Seedream 5의 이미지 편집 기능은 어떻게 사용하나요?', a: '참조 이미지를 업로드한 후 텍스트 프롬프트로 원하는 편집 내용을 입력하면 됩니다. 기존 이미지의 스타일을 유지하면서 원하는 부분만 변경할 수 있어 광고 소재 제작에 효과적입니다.' },
      ],
      en: [
        { q: 'What is Seedream 5?', a: 'Seedream 5 is an AI image generation model developed by ByteDance. It supports both text-to-image generation and reference image-based editing, optimized for creating ad banners and marketing visuals.' },
        { q: 'How much does Seedream 5 cost?', a: 'Medium quality (basic) image generation costs 2 credits, and high quality costs 3 credits. You can choose quality based on your needs to use credits efficiently.' },
        { q: 'What aspect ratios are supported?', a: 'Five aspect ratios are available: 1:1 (square), 4:3 (landscape), 3:4 (portrait), 16:9 (widescreen), and 9:16 (vertical). These cover ad banners, social media posts, stories, and more.' },
        { q: 'How does the image editing feature work?', a: 'Upload a reference image and enter a text prompt describing your desired edits. Seedream 5 preserves the original style while modifying specific elements, making it effective for ad creative production.' },
      ],
      ja: [
        { q: 'Seedream 5とは何ですか？', a: 'Seedream 5はByteDanceが開発したAI画像生成モデルです。テキストから画像生成と参照画像ベースの編集の両方に対応しており、広告バナー制作に最適化されています。' },
        { q: 'Seedream 5のクレジットはいくらですか？', a: '中画質（基本）画像生成は2クレジット、高画質画像生成は3クレジットが必要です。用途に合わせて画質を選択し、クレジットを効率的に使えます。' },
        { q: 'どのアスペクト比に対応していますか？', a: '1:1（正方形）、4:3（横長）、3:4（縦長）、16:9（ワイドスクリーン）、9:16（縦ワイド）の5種類に対応しています。広告バナー、SNS投稿、ストーリーなど様々な用途に対応できます。' },
        { q: 'Seedream 5の画像編集機能はどう使いますか？', a: '参照画像をアップロードし、テキストプロンプトで編集内容を入力します。元の画像のスタイルを維持しながら特定の部分を変更でき、広告素材制作に効果的です。' },
      ],
      zh: [
        { q: '什么是Seedream 5？', a: 'Seedream 5是ByteDance开发的AI图像生成模型。它同时支持文本转图像生成和基于参考图像的编辑功能，专为广告横幅制作而优化。' },
        { q: 'Seedream 5需要多少积分？', a: '中等质量（基本）图像生成需要2积分，高质量图像生成需要3积分。您可以根据需求选择质量等级，高效使用积分。' },
        { q: '支持哪些宽高比？', a: '支持5种宽高比：1:1（正方形）、4:3（横版）、3:4（竖版）、16:9（宽屏）和9:16（竖屏宽幅）。适用于广告横幅、社交媒体帖子、故事等多种用途。' },
        { q: 'Seedream 5的图像编辑功能如何使用？', a: '上传参考图像后输入文本提示词描述所需编辑内容。Seedream 5会保留原始风格的同时修改特定元素，非常适合广告素材制作。' },
      ],
    },
    features: {
      ko: ['ByteDance 개발 최신 AI 이미지 모델', '텍스트 투 이미지 + 참조 이미지 편집 지원', '1:1, 4:3, 3:4, 16:9, 9:16 비율 지원', '중화질(2cr) / 고화질(3cr) 선택 가능', '광고 배너 및 마케팅 소재 제작 최적화'],
      en: ['Latest AI image model by ByteDance', 'Text-to-image + reference image editing', '5 aspect ratios: 1:1, 4:3, 3:4, 16:9, 9:16', 'Medium (2cr) / High quality (3cr) options', 'Optimized for ad banners and marketing creatives'],
      ja: ['ByteDance開発の最新AI画像モデル', 'テキストから画像生成＋参照画像編集対応', '1:1, 4:3, 3:4, 16:9, 9:16の5比率対応', '中画質(2cr) / 高画質(3cr)選択可能', '広告バナー・マーケティング素材制作に最適'],
      zh: ['ByteDance开发的最新AI图像模型', '文本转图像 + 参考图像编辑', '支持1:1, 4:3, 3:4, 16:9, 9:16五种比例', '中等质量(2积分) / 高质量(3积分)可选', '广告横幅和营销素材制作优化'],
    },
  },
  'flux-2-pro': {
    name: 'FLUX.2 Pro',
    creator: 'Black Forest Labs',
    description: {
      ko: 'Black Forest Labs FLUX.2 Pro로 고품질 텍스트 투 이미지 생성. 기본/고화질, 5가지 비율 지원.',
      en: 'Generate high-quality text-to-image with Black Forest Labs FLUX.2 Pro. Basic/high quality, 5 aspect ratios.',
      ja: 'Black Forest Labs FLUX.2 Proで高品質なテキストから画像を生成。基本/高画質、5つの比率対応。',
      zh: '使用Black Forest Labs FLUX.2 Pro生成高质量文本转图像。基本/高质量，5种比例。',
    },
    title: {
      ko: 'FLUX.2 Pro AI 이미지 생성 | gwanggo',
      en: 'FLUX.2 Pro AI Image Generator | gwanggo',
      ja: 'FLUX.2 Pro AI画像生成 | gwanggo',
      zh: 'FLUX.2 Pro AI图像生成 | gwanggo',
    },
    keywords: {
      ko: ['FLUX.2 Pro', 'FLUX 2 Pro', 'Black Forest Labs', 'AI 이미지 생성', '텍스트 투 이미지'],
      en: ['FLUX.2 Pro', 'FLUX 2 Pro', 'Black Forest Labs', 'AI image generator', 'text to image'],
      ja: ['FLUX.2 Pro', 'FLUX 2 Pro', 'Black Forest Labs', 'AI画像生成', 'テキストから画像'],
      zh: ['FLUX.2 Pro', 'FLUX 2 Pro', 'Black Forest Labs', 'AI图像生成', '文本生成图像'],
    },
    jsonLdDescription: {
      ko: 'Black Forest Labs가 개발한 Text-to-Image AI 모델. 기본/고화질 옵션 지원.',
      en: 'Text-to-Image AI model by Black Forest Labs. Basic/high quality options.',
      ja: 'Black Forest Labsが開発したText-to-Image AIモデル。基本/高画質オプション対応。',
      zh: 'Black Forest Labs开发的Text-to-Image AI模型。支持基本/高质量选项。',
    },
    faq: {
      ko: [
        { q: 'FLUX.2 Pro란 무엇인가요?', a: 'FLUX.2 Pro는 Black Forest Labs가 개발한 텍스트 투 이미지 AI 모델입니다. 프롬프트 해석 능력이 뛰어나고 사실적인 고품질 이미지를 생성하며, 다양한 스타일의 이미지 제작이 가능합니다.' },
        { q: 'FLUX.2 Pro 크레딧은 얼마인가요?', a: '기본 화질은 2크레딧, 고화질은 3크레딧이 소모됩니다. 테스트용에는 기본 화질을, 최종 결과물에는 고화질을 추천합니다.' },
        { q: 'FLUX.2 Pro로 어떤 이미지를 만들 수 있나요?', a: '사실적인 사진부터 일러스트, 디지털 아트까지 다양한 스타일의 이미지를 생성할 수 있습니다. 5가지 비율(1:1, 4:3, 3:4, 16:9, 9:16)을 지원하여 다양한 광고 포맷에 활용 가능합니다.' },
      ],
      en: [
        { q: 'What is FLUX.2 Pro?', a: 'FLUX.2 Pro is a text-to-image AI model developed by Black Forest Labs. It excels at prompt interpretation and produces realistic, high-quality images across various styles and artistic directions.' },
        { q: 'How much does FLUX.2 Pro cost?', a: 'Basic quality costs 2 credits and high quality costs 3 credits. We recommend basic quality for testing and high quality for final deliverables.' },
        { q: 'What types of images can I create with FLUX.2 Pro?', a: 'You can generate realistic photos, illustrations, and digital art in various styles. It supports 5 aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16) suitable for different ad formats and marketing materials.' },
      ],
      ja: [
        { q: 'FLUX.2 Proとは何ですか？', a: 'FLUX.2 ProはBlack Forest Labsが開発したテキストから画像を生成するAIモデルです。プロンプト解釈能力が優れており、リアルで高品質な画像を様々なスタイルで生成できます。' },
        { q: 'FLUX.2 Proのクレジットはいくらですか？', a: '基本画質は2クレジット、高画質は3クレジットが必要です。テスト用には基本画質、最終成果物には高画質をおすすめします。' },
        { q: 'FLUX.2 Proでどんな画像が作れますか？', a: 'リアルな写真からイラスト、デジタルアートまで様々なスタイルの画像を生成できます。5つの比率（1:1, 4:3, 3:4, 16:9, 9:16）に対応し、様々な広告フォーマットに活用できます。' },
      ],
      zh: [
        { q: '什么是FLUX.2 Pro？', a: 'FLUX.2 Pro是Black Forest Labs开发的文本转图像AI模型。它在提示词理解方面表现出色，能够生成逼真、高质量的多种风格图像。' },
        { q: 'FLUX.2 Pro需要多少积分？', a: '基本质量需要2积分，高质量需要3积分。建议测试时使用基本质量，最终成品使用高质量。' },
        { q: 'FLUX.2 Pro能创建哪些类型的图像？', a: '可以生成逼真照片、插画、数字艺术等各种风格的图像。支持5种宽高比（1:1, 4:3, 3:4, 16:9, 9:16），适用于不同的广告格式和营销素材。' },
      ],
    },
    features: {
      ko: ['Black Forest Labs 개발 고성능 이미지 모델', '뛰어난 프롬프트 해석 및 텍스트 렌더링', '5가지 비율 지원 (1:1, 4:3, 3:4, 16:9, 9:16)', '기본(2cr) / 고화질(3cr) 선택 가능', '사실적인 사진부터 일러스트까지 다양한 스타일'],
      en: ['High-performance image model by Black Forest Labs', 'Excellent prompt interpretation and text rendering', '5 aspect ratios: 1:1, 4:3, 3:4, 16:9, 9:16', 'Basic (2cr) / High quality (3cr) options', 'Realistic photos to illustrations in various styles'],
      ja: ['Black Forest Labs開発の高性能画像モデル', '優れたプロンプト解釈とテキストレンダリング', '5つの比率対応（1:1, 4:3, 3:4, 16:9, 9:16）', '基本(2cr) / 高画質(3cr)選択可能', 'リアルな写真からイラストまで多彩なスタイル'],
      zh: ['Black Forest Labs开发的高性能图像模型', '出色的提示词理解和文字渲染', '支持5种比例（1:1, 4:3, 3:4, 16:9, 9:16）', '基本(2积分) / 高质量(3积分)可选', '从逼真照片到插画的多种风格'],
    },
  },
  'grok-image': {
    name: 'Grok Imagine Image',
    creator: 'xAI',
    description: {
      ko: 'xAI Grok Imagine Image로 빠른 AI 이미지 생성. 1크레딧으로 텍스트에서 이미지 생성.',
      en: 'Fast AI image generation with xAI Grok Imagine Image. Generate images from text for 1 credit.',
      ja: 'xAI Grok Imagine Imageで高速AI画像生成。1クレジットでテキストから画像を生成。',
      zh: '使用xAI Grok Imagine Image快速生成AI图像。1积分从文本生成图像。',
    },
    title: {
      ko: 'Grok Imagine Image AI 이미지 생성 | gwanggo',
      en: 'Grok Imagine Image AI Generator | gwanggo',
      ja: 'Grok Imagine Image AI画像生成 | gwanggo',
      zh: 'Grok Imagine Image AI图像生成 | gwanggo',
    },
    keywords: {
      ko: ['Grok Imagine Image', 'xAI', 'Grok 이미지', 'AI 이미지 생성'],
      en: ['Grok Imagine Image', 'xAI', 'Grok image', 'AI image generator'],
      ja: ['Grok Imagine Image', 'xAI', 'Grok画像', 'AI画像生成'],
      zh: ['Grok Imagine Image', 'xAI', 'Grok图片', 'AI图像生成'],
    },
    jsonLdDescription: {
      ko: 'xAI가 개발한 Text-to-Image AI 모델. 빠른 이미지 생성.',
      en: 'Text-to-Image AI model by xAI. Fast image generation.',
      ja: 'xAIが開発したText-to-Image AIモデル。高速な画像生成。',
      zh: 'xAI开发的Text-to-Image AI模型。快速图像生成。',
    },
    faq: {
      ko: [
        { q: 'Grok Imagine이란 무엇인가요?', a: 'Grok Imagine은 xAI가 개발한 텍스트 투 이미지 AI 모델입니다. 빠른 생성 속도가 특징이며, 텍스트 프롬프트만으로 다양한 스타일의 이미지를 즉시 생성할 수 있습니다.' },
        { q: 'Grok Imagine 크레딧은 얼마인가요?', a: '이미지 1장당 1크레딧으로 생성할 수 있습니다. 가장 저렴한 비용으로 AI 이미지를 생성할 수 있어 빠른 아이디어 테스트에 적합합니다.' },
        { q: 'Grok Imagine으로 어떤 이미지를 만들 수 있나요?', a: '텍스트 프롬프트 기반으로 다양한 스타일의 이미지를 생성합니다. 빠른 생성 속도 덕분에 여러 변형을 빠르게 테스트하고 최적의 결과물을 선택할 수 있습니다.' },
      ],
      en: [
        { q: 'What is Grok Imagine?', a: 'Grok Imagine is a text-to-image AI model developed by xAI. Known for its fast generation speed, it can instantly create images in various styles from text prompts alone.' },
        { q: 'How much does Grok Imagine cost?', a: 'Each image costs only 1 credit to generate. It is the most affordable option, making it ideal for quick idea testing and rapid prototyping of visual concepts.' },
        { q: 'What types of images can I create with Grok Imagine?', a: 'Grok Imagine generates diverse image styles from text prompts. Its fast speed allows you to quickly test multiple variations and select the best result for your project.' },
      ],
      ja: [
        { q: 'Grok Imagineとは何ですか？', a: 'Grok ImagineはxAIが開発したテキストから画像を生成するAIモデルです。高速な生成速度が特徴で、テキストプロンプトだけで様々なスタイルの画像を瞬時に生成できます。' },
        { q: 'Grok Imagineのクレジットはいくらですか？', a: '画像1枚あたり1クレジットで生成できます。最も低コストでAI画像を生成でき、アイデアの素早いテストに最適です。' },
        { q: 'Grok Imagineでどんな画像が作れますか？', a: 'テキストプロンプトベースで多様なスタイルの画像を生成します。高速な生成速度のおかげで、複数のバリエーションを素早くテストし、最適な結果を選べます。' },
      ],
      zh: [
        { q: '什么是Grok Imagine？', a: 'Grok Imagine是xAI开发的文本转图像AI模型。以快速生成速度著称，仅通过文本提示词即可即时创建各种风格的图像。' },
        { q: 'Grok Imagine需要多少积分？', a: '每张图像仅需1积分即可生成。这是最经济实惠的选择，非常适合快速测试创意和视觉概念原型制作。' },
        { q: 'Grok Imagine能创建哪些类型的图像？', a: 'Grok Imagine基于文本提示词生成多种风格的图像。其快速的生成速度让您能迅速测试多个变体，选出最佳结果。' },
      ],
    },
    features: {
      ko: ['xAI 개발 텍스트 투 이미지 모델', '업계 최고 수준의 빠른 생성 속도', '이미지당 1크레딧 최저 비용', '다양한 스타일의 이미지 생성 가능'],
      en: ['Text-to-image model by xAI', 'Industry-leading fast generation speed', 'Lowest cost at 1 credit per image', 'Diverse image style generation'],
      ja: ['xAI開発のテキストから画像モデル', '業界トップクラスの高速生成', '1クレジットの最低コスト', '多様なスタイルの画像生成が可能'],
      zh: ['xAI开发的文本转图像模型', '行业领先的快速生成速度', '每张1积分的最低成本', '多样化的图像风格生成'],
    },
  },
  'z-image': {
    name: 'Z-Image',
    creator: 'gwanggo',
    description: {
      ko: 'Z-Image로 텍스트에서 AI 이미지 생성. 프롬프트만으로 고품질 이미지 생성.',
      en: 'Generate AI images from text with Z-Image. High-quality images from prompts alone.',
      ja: 'Z-Imageでテキストから AI画像を生成。プロンプトのみで高品質画像を生成。',
      zh: '使用Z-Image从文本生成AI图像。仅通过提示词生成高质量图像。',
    },
    title: {
      ko: 'Z-Image AI 이미지 생성 | gwanggo',
      en: 'Z-Image AI Image Generator | gwanggo',
      ja: 'Z-Image AI画像生成 | gwanggo',
      zh: 'Z-Image AI图像生成 | gwanggo',
    },
    keywords: {
      ko: ['Z-Image', 'AI 이미지 생성', '텍스트 투 이미지'],
      en: ['Z-Image', 'AI image generator', 'text to image'],
      ja: ['Z-Image', 'AI画像生成', 'テキストから画像'],
      zh: ['Z-Image', 'AI图像生成', '文本生成图像'],
    },
    jsonLdDescription: {
      ko: '텍스트에서 이미지를 생성하는 AI 모델. 프롬프트만으로 고품질 이미지 생성.',
      en: 'Text-to-image AI model. High-quality images from prompts alone.',
      ja: 'テキストから画像を生成するAIモデル。プロンプトのみで高品質画像を生成。',
      zh: '文本生成图像的AI模型。仅通过提示词生成高质量图像。',
    },
    faq: {
      ko: [
        { q: 'Z-Image란 무엇인가요?', a: 'Z-Image는 gwanggo 플랫폼의 자체 텍스트 투 이미지 AI 모델입니다. 프롬프트만으로 고품질 이미지를 생성할 수 있으며, 무료 요금제 사용자도 부담 없이 사용할 수 있습니다.' },
        { q: 'Z-Image 크레딧은 얼마인가요?', a: '이미지 1장당 1크레딧으로 생성할 수 있습니다. 무료 요금제에서도 제공되는 크레딧으로 충분히 활용 가능하여 입문자에게 추천합니다.' },
        { q: 'Z-Image로 어떤 이미지를 만들 수 있나요?', a: '텍스트 프롬프트를 입력하면 다양한 스타일의 이미지를 생성합니다. 광고 소재, SNS 콘텐츠, 블로그 이미지 등 다양한 용도로 활용할 수 있습니다.' },
      ],
      en: [
        { q: 'What is Z-Image?', a: 'Z-Image is gwanggo platform\'s own text-to-image AI model. It generates high-quality images from prompts alone and is accessible even for free-tier users without budget concerns.' },
        { q: 'How much does Z-Image cost?', a: 'Each image costs only 1 credit. Free plan users can fully utilize it with their included credits, making it perfect for beginners getting started with AI image generation.' },
        { q: 'What types of images can I create with Z-Image?', a: 'Enter a text prompt to generate images in various styles. Z-Image is versatile for ad creatives, social media content, blog images, and other visual materials.' },
      ],
      ja: [
        { q: 'Z-Imageとは何ですか？', a: 'Z-Imageはgwanggoプラットフォームの自社テキストから画像AIモデルです。プロンプトだけで高品質な画像を生成でき、無料プランのユーザーも気軽に利用できます。' },
        { q: 'Z-Imageのクレジットはいくらですか？', a: '画像1枚あたり1クレジットで生成できます。無料プランでも付与されるクレジットで十分活用でき、初心者におすすめです。' },
        { q: 'Z-Imageでどんな画像が作れますか？', a: 'テキストプロンプトを入力すると様々なスタイルの画像を生成します。広告素材、SNSコンテンツ、ブログ画像など多様な用途に活用できます。' },
      ],
      zh: [
        { q: '什么是Z-Image？', a: 'Z-Image是gwanggo平台自有的文本转图像AI模型。仅通过提示词即可生成高质量图像，免费版用户也能无负担地使用。' },
        { q: 'Z-Image需要多少积分？', a: '每张图像仅需1积分。免费计划用户也能充分利用附赠的积分，非常适合初学者入门AI图像生成。' },
        { q: 'Z-Image能创建哪些类型的图像？', a: '输入文本提示词即可生成各种风格的图像。可用于广告素材、社交媒体内容、博客图片等多种用途。' },
      ],
    },
    features: {
      ko: ['gwanggo 플랫폼 자체 이미지 생성 모델', '이미지당 1크레딧 저렴한 비용', '무료 요금제 사용자도 이용 가능', '프롬프트만으로 고품질 이미지 생성'],
      en: ['gwanggo platform\'s own image generation model', 'Affordable at 1 credit per image', 'Available for free-tier users', 'High-quality images from prompts alone'],
      ja: ['gwanggoプラットフォーム自社画像生成モデル', '1クレジットの手頃な価格', '無料プランユーザーも利用可能', 'プロンプトのみで高品質画像生成'],
      zh: ['gwanggo平台自有图像生成模型', '每张1积分的实惠价格', '免费版用户也可使用', '仅通过提示词生成高质量图像'],
    },
  },
  'nano-banana-2': {
    name: 'Nano Banana 2',
    creator: 'Google',
    description: {
      ko: 'Google Gemini 기반 Nano Banana 2로 AI 이미지 생성. 1K~4K 고품질 이미지, 편집 모드 지원.',
      en: 'Generate AI images with Google Gemini-based Nano Banana 2. 1K-4K high-quality images with edit mode.',
      ja: 'Google GeminiベースのNano Banana 2でAI画像を生成。1K〜4K高品質画像、編集モード対応。',
      zh: '使用基于Google Gemini的Nano Banana 2生成AI图像。1K~4K高质量图像，支持编辑模式。',
    },
    title: {
      ko: 'Nano Banana 2 AI 이미지 생성 - Google Gemini | gwanggo',
      en: 'Nano Banana 2 AI Image Generator - Google Gemini | gwanggo',
      ja: 'Nano Banana 2 AI画像生成 - Google Gemini | gwanggo',
      zh: 'Nano Banana 2 AI图像生成 - Google Gemini | gwanggo',
    },
    keywords: {
      ko: ['Nano Banana 2', 'Google Gemini Image', 'AI 이미지 생성', '4K AI 이미지'],
      en: ['Nano Banana 2', 'Google Gemini Image', 'AI image generator', '4K AI image'],
      ja: ['Nano Banana 2', 'Google Gemini Image', 'AI画像生成', '4K AI画像'],
      zh: ['Nano Banana 2', 'Google Gemini Image', 'AI图像生成', '4K AI图像'],
    },
    jsonLdDescription: {
      ko: 'Google Gemini 기반 AI 이미지 생성 모델. 1K~4K 고품질 이미지 생성 지원.',
      en: 'Google Gemini-based AI image generation model. 1K-4K high-quality image generation.',
      ja: 'Google GeminiベースのAI画像生成モデル。1K〜4K高品質画像生成対応。',
      zh: '基于Google Gemini的AI图像生成模型。支持1K~4K高质量图像生成。',
    },
    faq: {
      ko: [
        { q: 'Nano Banana 2란 무엇인가요?', a: 'Nano Banana 2는 Google Gemini를 기반으로 한 AI 이미지 생성 모델입니다. 텍스트 투 이미지 생성과 편집 모드를 모두 지원하며, 1K부터 4K까지 다양한 해상도의 이미지를 생성할 수 있습니다.' },
        { q: 'Nano Banana 2 크레딧은 얼마인가요?', a: '기본 화질은 2크레딧, 고화질(4K)은 6크레딧이 소모됩니다. 4K 해상도 지원으로 대형 인쇄물이나 고해상도 디스플레이 광고에 적합합니다.' },
        { q: 'Nano Banana 2로 어떤 이미지를 만들 수 있나요?', a: 'Google Gemini의 강력한 언어 이해 능력을 기반으로 복잡한 프롬프트도 정확하게 반영한 이미지를 생성합니다. 광고 소재, 제품 이미지, 일러스트 등 다양한 스타일이 가능합니다.' },
        { q: 'Nano Banana 2의 편집 모드는 어떻게 사용하나요?', a: '기존 이미지를 업로드하고 텍스트 프롬프트로 편집 지시를 입력하면 됩니다. Gemini의 멀티모달 능력으로 이미지 내용을 이해하고 정확한 편집을 수행하여, 기존 소재를 재활용할 때 유용합니다.' },
      ],
      en: [
        { q: 'What is Nano Banana 2?', a: 'Nano Banana 2 is an AI image generation model based on Google Gemini. It supports both text-to-image generation and edit mode, capable of producing images from 1K to 4K resolution.' },
        { q: 'How much does Nano Banana 2 cost?', a: 'Basic quality costs 2 credits and high quality (4K) costs 6 credits. With 4K resolution support, it is ideal for large print materials and high-resolution display ads.' },
        { q: 'What types of images can I create with Nano Banana 2?', a: 'Powered by Google Gemini\'s strong language understanding, it accurately reflects complex prompts into images. It handles ad creatives, product images, illustrations, and various artistic styles.' },
        { q: 'How does the edit mode work in Nano Banana 2?', a: 'Upload an existing image and enter text prompts describing your edits. Gemini\'s multimodal capability understands image content and performs precise modifications, making it great for repurposing existing assets.' },
      ],
      ja: [
        { q: 'Nano Banana 2とは何ですか？', a: 'Nano Banana 2はGoogle Geminiをベースにした AI画像生成モデルです。テキストから画像生成と編集モードの両方に対応し、1Kから4Kまでの解像度で画像を生成できます。' },
        { q: 'Nano Banana 2のクレジットはいくらですか？', a: '基本画質は2クレジット、高画質（4K）は6クレジットが必要です。4K解像度対応で、大型印刷物や高解像度ディスプレイ広告に最適です。' },
        { q: 'Nano Banana 2でどんな画像が作れますか？', a: 'Google Geminiの強力な言語理解力で、複雑なプロンプトも正確に反映した画像を生成します。広告素材、商品画像、イラストなど多彩なスタイルに対応しています。' },
        { q: 'Nano Banana 2の編集モードはどう使いますか？', a: '既存の画像をアップロードし、テキストプロンプトで編集指示を入力します。Geminiのマルチモーダル能力で画像内容を理解し、正確な編集を行えるため、既存素材の再活用に便利です。' },
      ],
      zh: [
        { q: '什么是Nano Banana 2？', a: 'Nano Banana 2是基于Google Gemini的AI图像生成模型。同时支持文本转图像生成和编辑模式，能够生成从1K到4K各种分辨率的图像。' },
        { q: 'Nano Banana 2需要多少积分？', a: '基本质量需要2积分，高质量（4K）需要6积分。支持4K分辨率，非常适合大型印刷品和高分辨率展示广告。' },
        { q: 'Nano Banana 2能创建哪些类型的图像？', a: '借助Google Gemini强大的语言理解能力，能将复杂的提示词准确反映到图像中。可制作广告素材、产品图片、插画等多种风格的作品。' },
        { q: 'Nano Banana 2的编辑模式如何使用？', a: '上传现有图像并输入文本提示词描述编辑内容。Gemini的多模态能力能理解图像内容并进行精确修改，非常适合重新利用现有素材。' },
      ],
    },
    features: {
      ko: ['Google Gemini 기반 AI 이미지 모델', '텍스트 투 이미지 + 편집 모드 지원', '1K~4K 고해상도 이미지 생성', '기본(2cr) / 고화질 4K(6cr) 선택 가능', '복잡한 프롬프트도 정확하게 반영'],
      en: ['Google Gemini-based AI image model', 'Text-to-image + edit mode support', '1K to 4K high-resolution image generation', 'Basic (2cr) / High quality 4K (6cr) options', 'Accurate reflection of complex prompts'],
      ja: ['Google GeminiベースのAI画像モデル', 'テキストから画像＋編集モード対応', '1K〜4K高解像度画像生成', '基本(2cr) / 高画質4K(6cr)選択可能', '複雑なプロンプトも正確に反映'],
      zh: ['基于Google Gemini的AI图像模型', '文本转图像 + 编辑模式支持', '1K~4K高分辨率图像生成', '基本(2积分) / 高质量4K(6积分)可选', '准确反映复杂的提示词'],
    },
  },
}

const commonI18n: Record<Lang, {
  breadcrumbHome: string
  breadcrumbAiTools: string
  breadcrumbImage: string
  features: string
  faqTitle: string
  relatedModels: string
}> = {
  ko: { breadcrumbHome: '홈', breadcrumbAiTools: 'AI 도구', breadcrumbImage: '이미지 생성', features: '주요 기능', faqTitle: '자주 묻는 질문', relatedModels: '다른 이미지 생성 모델' },
  en: { breadcrumbHome: 'Home', breadcrumbAiTools: 'AI Tools', breadcrumbImage: 'Image Generator', features: 'Key Features', faqTitle: 'Frequently Asked Questions', relatedModels: 'Other Image Generation Models' },
  ja: { breadcrumbHome: 'ホーム', breadcrumbAiTools: 'AIツール', breadcrumbImage: '画像生成', features: '主な機能', faqTitle: 'よくある質問', relatedModels: '他の画像生成モデル' },
  zh: { breadcrumbHome: '首页', breadcrumbAiTools: 'AI工具', breadcrumbImage: '图像生成', features: '主要功能', faqTitle: '常见问题', relatedModels: '其他图像生成模型' },
}

interface Props {
  params: Promise<{ language: string; model: string }>
}

export async function generateStaticParams() {
  return validLanguages.flatMap((language) =>
    IMAGE_MODEL_SLUGS.map((model) => ({ language, model }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language, model } = await params

  if (!validLanguages.includes(language as Lang)) return {}
  if (!IMAGE_MODEL_SLUGS.includes(model as ModelSlug)) return {}

  const lang = language as Lang
  const slug = model as ModelSlug
  const m = MODELS[slug]

  const alternateLanguages: Record<string, string> = {}
  validLanguages.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/dashboard/ai-tools/${loc}/image/${slug}`
  })
  alternateLanguages['x-default'] = `${siteUrl}/dashboard/ai-tools/ko/image/${slug}`

  return {
    title: { absolute: m.title[lang] },
    description: m.description[lang],
    keywords: m.keywords[lang],
    alternates: {
      canonical: `/dashboard/ai-tools/${lang}/image/${slug}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[lang],
      alternateLocale: validLanguages.filter((l) => l !== lang).map((l) => ogLocale[l]),
      title: m.title[lang],
      description: m.description[lang],
      url: `${siteUrl}/dashboard/ai-tools/${lang}/image/${slug}`,
      siteName: 'gwanggo',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: m.name, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title[lang],
      description: m.description[lang],
      images: ['/og-image.png'],
      creator: '@gwanggo_io',
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

export default async function ImageModelPage({ params }: Props) {
  const { language, model } = await params

  if (!validLanguages.includes(language as Lang)) notFound()
  if (!IMAGE_MODEL_SLUGS.includes(model as ModelSlug)) notFound()

  const lang = language as Lang
  const slug = model as ModelSlug
  const m = MODELS[slug]
  const common = commonI18n[lang]

  const jsonLdApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: m.name,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description: m.jsonLdDescription[lang],
    url: `${siteUrl}/dashboard/ai-tools/${lang}/image/${slug}`,
    creator: { '@type': 'Organization', name: m.creator },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: common.breadcrumbHome, item: `${siteUrl}/dashboard` },
      { '@type': 'ListItem', position: 2, name: common.breadcrumbAiTools },
      { '@type': 'ListItem', position: 3, name: common.breadcrumbImage, item: `${siteUrl}/dashboard/ai-tools/${lang}/image` },
      { '@type': 'ListItem', position: 4, name: m.name, item: `${siteUrl}/dashboard/ai-tools/${lang}/image/${slug}` },
    ],
  }

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: m.faq[lang].map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const relatedModels = IMAGE_MODEL_SLUGS.filter((s) => s !== slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

      <div className="mb-4">
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li><Link href="/dashboard" className="hover:text-foreground transition-colors">{common.breadcrumbHome}</Link></li>
            <li>/</li>
            <li>{common.breadcrumbAiTools}</li>
            <li>/</li>
            <li><Link href={`/dashboard/ai-tools/${lang}/image`} className="hover:text-foreground transition-colors">{common.breadcrumbImage}</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">{m.name}</li>
          </ol>
        </nav>
        <div>
          <h1 className="text-xl font-bold">{m.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{m.description[lang]}</p>
        </div>
      </div>

      <ImageGenerator initialModel={slug} />

      {/* SEO Content Section */}
      <section className="mt-12 space-y-10">
        {/* Features */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{m.name} — {common.features}</h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
            {m.features[lang].map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{common.faqTitle}</h2>
          <div className="space-y-4">
            {m.faq[lang].map((item, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium">{item.q}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Models */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{common.relatedModels}</h2>
          <div className="flex flex-wrap gap-2">
            {relatedModels.map((relSlug) => (
              <Link
                key={relSlug}
                href={`/dashboard/ai-tools/${lang}/image/${relSlug}`}
                className="inline-block rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                {MODELS[relSlug].name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
