import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VideoGenerator from '@/components/ai-tools/video-generator'

const validLanguages = ['ko', 'en', 'ja', 'zh'] as const
type Lang = (typeof validLanguages)[number]

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'

const ogLocale: Record<Lang, string> = {
  ko: 'ko_KR', en: 'en_US', ja: 'ja_JP', zh: 'zh_CN',
}

const VIDEO_MODEL_SLUGS = [
  'seedance-1.5-pro', 'kling-3', 'kling-3-mc', 'grok-video', 'wan-2.6',
  'vidu-q3', 'veo-3.1', 'hailuo-02', 'ltx-2.3',
] as const
type ModelSlug = (typeof VIDEO_MODEL_SLUGS)[number]

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
  'seedance-1.5-pro': {
    name: 'Seedance 1.5 Pro',
    creator: 'ByteDance',
    description: {
      ko: 'ByteDance Seedance 1.5 Pro로 텍스트/이미지에서 고품질 AI 영상 생성. 최대 720p, 12초. 광고, 숏폼에 최적화.',
      en: 'Generate AI videos with ByteDance Seedance 1.5 Pro from text or images. Up to 720p, 12 seconds. Optimized for ads and shorts.',
      ja: 'ByteDance Seedance 1.5 Proでテキスト/画像から高品質AI動画を生成。最大720p、12秒。広告・ショート動画に最適。',
      zh: '使用ByteDance Seedance 1.5 Pro从文本/图像生成高质量AI视频。最高720p、12秒。适用于广告和短视频。',
    },
    title: {
      ko: 'Seedance 1.5 Pro AI 영상 생성 | gwanggo',
      en: 'Seedance 1.5 Pro AI Video Generator | gwanggo',
      ja: 'Seedance 1.5 Pro AI動画生成 | gwanggo',
      zh: 'Seedance 1.5 Pro AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Seedance 1.5 Pro', 'ByteDance', '바이트댄스', 'AI 영상 생성', '텍스트 투 비디오', 'Sora 대안'],
      en: ['Seedance 1.5 Pro', 'ByteDance', 'AI video generator', 'text to video', 'Sora alternative'],
      ja: ['Seedance 1.5 Pro', 'ByteDance', 'バイトダンス', 'AI動画生成', 'テキストから動画', 'Sora代替'],
      zh: ['Seedance 1.5 Pro', 'ByteDance', '字节跳动', 'AI视频生成', '文本生成视频', 'Sora替代'],
    },
    jsonLdDescription: {
      ko: 'ByteDance가 개발한 텍스트/이미지 투 비디오 AI 모델. 최대 720p, 12초 영상 생성.',
      en: 'Text/Image to Video AI model by ByteDance. Up to 720p, 12-second video generation.',
      ja: 'ByteDanceが開発したテキスト/画像から動画を生成するAIモデル。最大720p、12秒。',
      zh: 'ByteDance开发的文本/图像转视频AI模型。最高720p、12秒视频生成。',
    },
    faq: {
      ko: [
        { q: 'Seedance 1.5 Pro란 무엇인가요?', a: 'Seedance 1.5 Pro는 ByteDance가 개발한 텍스트/이미지 투 비디오 AI 모델입니다. 텍스트 프롬프트나 이미지를 입력하면 최대 720p, 12초 길이의 고품질 AI 영상을 생성합니다. 광고, 숏폼, SNS 콘텐츠 제작에 최적화되어 있습니다.' },
        { q: 'Seedance 1.5 Pro 크레딧은 얼마인가요?', a: '480p 해상도에서 초당 1크레딧, 720p 해상도에서 초당 2크레딧이 소모됩니다. 예를 들어 720p로 10초 영상을 생성하면 20크레딧이 필요합니다. 무료 회원가입 시 15크레딧이 지급됩니다.' },
        { q: 'Seedance 1.5 Pro로 어떤 영상을 만들 수 있나요?', a: '제품 광고 영상, SNS 숏폼 콘텐츠, 브랜드 홍보 영상 등 다양한 형식의 영상을 만들 수 있습니다. 텍스트만으로 영상을 생성하거나, 제품 이미지를 업로드해서 해당 이미지 기반 영상을 생성할 수 있습니다.' },
        { q: 'Seedance 1.5 Pro는 Sora와 비교해서 어떤가요?', a: 'Seedance 1.5 Pro는 ByteDance의 최신 영상 생성 모델로, Sora 대비 가성비가 뛰어나며 아시아 시장에 특화된 결과물을 제공합니다. 특히 제품 광고와 숏폼 콘텐츠에서 높은 품질을 보여줍니다.' },
      ],
      en: [
        { q: 'What is Seedance 1.5 Pro?', a: 'Seedance 1.5 Pro is a text/image-to-video AI model developed by ByteDance. It generates high-quality AI videos up to 720p resolution and 12 seconds in length from text prompts or images. It is optimized for ads, short-form content, and social media.' },
        { q: 'How much does Seedance 1.5 Pro cost in credits?', a: 'It costs 1 credit per second at 480p resolution and 2 credits per second at 720p. For example, a 10-second video at 720p requires 20 credits. New users receive 15 free credits upon signup.' },
        { q: 'What kind of videos can I create with Seedance 1.5 Pro?', a: 'You can create product ad videos, social media short-form content, brand promotional videos, and more. Generate videos from text prompts alone or upload product images to create image-based videos.' },
        { q: 'How does Seedance 1.5 Pro compare to Sora?', a: 'Seedance 1.5 Pro is ByteDance\'s latest video generation model, offering excellent value compared to Sora with results particularly suited for Asian markets. It excels in product advertising and short-form content quality.' },
      ],
      ja: [
        { q: 'Seedance 1.5 Proとは何ですか？', a: 'Seedance 1.5 ProはByteDanceが開発したテキスト/画像から動画を生成するAIモデルです。テキストプロンプトや画像から最大720p、12秒の高品質AI動画を生成します。広告、ショート動画、SNSコンテンツ制作に最適化されています。' },
        { q: 'Seedance 1.5 Proのクレジットはいくらですか？', a: '480p解像度で1秒あたり1クレジット、720p解像度で1秒あたり2クレジットが消費されます。例えば720pで10秒の動画を生成すると20クレジットが必要です。新規登録時に15クレジットが無料で付与されます。' },
        { q: 'Seedance 1.5 Proでどんな動画が作れますか？', a: '商品広告動画、SNSショート動画、ブランドプロモーション動画など、様々な形式の動画を作成できます。テキストだけで動画を生成したり、商品画像をアップロードして画像ベースの動画を生成できます。' },
        { q: 'Seedance 1.5 ProはSoraと比べてどうですか？', a: 'Seedance 1.5 ProはByteDanceの最新動画生成モデルで、Soraに比べてコストパフォーマンスに優れ、アジア市場に特化した結果を提供します。特に商品広告やショート動画で高い品質を発揮します。' },
      ],
      zh: [
        { q: '什么是Seedance 1.5 Pro？', a: 'Seedance 1.5 Pro是ByteDance（字节跳动）开发的文本/图像转视频AI模型。通过输入文本提示或图像，可生成最高720p、12秒的高质量AI视频。专为广告、短视频和社交媒体内容优化。' },
        { q: 'Seedance 1.5 Pro需要多少积分？', a: '480p分辨率每秒消耗1积分，720p分辨率每秒消耗2积分。例如生成720p的10秒视频需要20积分。新用户注册即送15免费积分。' },
        { q: 'Seedance 1.5 Pro可以制作什么样的视频？', a: '可以制作产品广告视频、社交媒体短视频、品牌宣传视频等多种格式。支持纯文本生成视频，也可以上传产品图片生成基于图像的视频。' },
        { q: 'Seedance 1.5 Pro与Sora相比如何？', a: 'Seedance 1.5 Pro是ByteDance最新的视频生成模型，与Sora相比性价比更高，特别适合亚洲市场。在产品广告和短视频内容制作方面表现出色。' },
      ],
    },
    features: {
      ko: ['텍스트 또는 이미지에서 최대 720p AI 영상 생성', '최대 12초 길이 영상 지원', '480p 초당 1크레딧 / 720p 초당 2크레딧의 합리적 가격', 'ByteDance 최신 AI 기술 기반 고품질 결과물', '광고 및 숏폼 콘텐츠 제작에 최적화'],
      en: ['Generate up to 720p AI videos from text or images', 'Support for videos up to 12 seconds long', 'Affordable pricing: 1 credit/s at 480p, 2 credits/s at 720p', 'High-quality results powered by ByteDance\'s latest AI', 'Optimized for ads and short-form content creation'],
      ja: ['テキストまたは画像から最大720pのAI動画を生成', '最大12秒の動画に対応', '480p 1秒1クレジット / 720p 1秒2クレジットの手頃な価格', 'ByteDance最新AI技術による高品質な結果', '広告・ショート動画コンテンツ制作に最適化'],
      zh: ['从文本或图像生成最高720p AI视频', '支持最长12秒视频', '实惠价格：480p每秒1积分 / 720p每秒2积分', '基于ByteDance最新AI技术的高质量效果', '专为广告和短视频内容制作优化'],
    },
  },
  'kling-3': {
    name: 'Kling 3.0',
    creator: 'Kuaishou',
    description: {
      ko: 'Kuaishou Kling 3.0으로 AI 영상 생성. Standard/Pro 등급, 720p, 5~10초. 멀티샷 지원.',
      en: 'Generate AI videos with Kuaishou Kling 3.0. Standard/Pro tiers, 720p, 5-10 seconds. Multi-shot support.',
      ja: 'Kuaishou Kling 3.0でAI動画を生成。Standard/Proティア、720p、5〜10秒。マルチショット対応。',
      zh: '使用Kuaishou Kling 3.0生成AI视频。Standard/Pro等级，720p，5~10秒。支持多镜头。',
    },
    title: {
      ko: 'Kling 3.0 AI 영상 생성 | gwanggo',
      en: 'Kling 3.0 AI Video Generator | gwanggo',
      ja: 'Kling 3.0 AI動画生成 | gwanggo',
      zh: 'Kling 3.0 AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Kling 3.0', 'Kuaishou', '쿠아이쇼우', '快手', 'AI 영상 생성', '멀티샷 영상'],
      en: ['Kling 3.0', 'Kuaishou', 'AI video generator', 'multi-shot video', 'Kling alternative'],
      ja: ['Kling 3.0', 'Kuaishou', '快手AI', 'AI動画生成', 'マルチショット動画'],
      zh: ['Kling 3.0', 'Kuaishou', '快手', 'AI视频生成', '多镜头视频'],
    },
    jsonLdDescription: {
      ko: 'Kuaishou가 개발한 Text/Image to Video AI 모델. Standard/Pro 등급, 720p, 5~10초.',
      en: 'Text/Image to Video AI model by Kuaishou. Standard/Pro tiers, 720p, 5-10s.',
      ja: 'Kuaishouが開発したText/Image to Video AIモデル。Standard/Proティア、720p、5〜10秒。',
      zh: 'Kuaishou（快手）开发的Text/Image to Video AI模型。Standard/Pro等级，720p，5~10秒。',
    },
    faq: {
      ko: [
        { q: 'Kling 3.0이란 무엇인가요?', a: 'Kling 3.0은 Kuaishou(쿠아이쇼우/快手)가 개발한 텍스트/이미지 투 비디오 AI 모델입니다. Standard와 Pro 두 가지 등급을 제공하며, 최대 720p 해상도로 5~10초 길이의 영상을 생성합니다. 멀티샷 기능을 지원합니다.' },
        { q: 'Kling 3.0 크레딧은 얼마인가요?', a: 'Standard 등급은 초당 6크레딧, Pro 등급은 초당 8크레딧이 소모됩니다. Pro 등급은 더 높은 품질과 디테일을 제공합니다. 무료 회원가입 시 15크레딧이 지급됩니다.' },
        { q: 'Kling 3.0으로 어떤 영상을 만들 수 있나요?', a: '제품 홍보 영상, 브랜드 광고, SNS 콘텐츠 등 다양한 영상을 제작할 수 있습니다. 멀티샷 기능으로 여러 장면을 연결한 스토리텔링 영상도 가능합니다.' },
        { q: 'Kling 3.0의 Standard와 Pro 차이는 무엇인가요?', a: 'Standard는 빠른 생성 속도와 합리적인 크레딧 비용(초당 6크레딧)을 제공합니다. Pro는 초당 8크레딧으로 더 높은 영상 품질, 세밀한 디테일, 자연스러운 움직임을 보장합니다.' },
      ],
      en: [
        { q: 'What is Kling 3.0?', a: 'Kling 3.0 is a text/image-to-video AI model developed by Kuaishou. It offers Standard and Pro tiers, generating videos up to 720p resolution and 5-10 seconds in length. It supports multi-shot functionality for storytelling.' },
        { q: 'How much does Kling 3.0 cost in credits?', a: 'Standard tier costs 6 credits per second, while Pro tier costs 8 credits per second. Pro tier delivers higher quality and finer details. New users receive 15 free credits upon signup.' },
        { q: 'What kind of videos can I create with Kling 3.0?', a: 'You can create product promotional videos, brand ads, social media content, and more. The multi-shot feature allows you to connect multiple scenes for storytelling videos.' },
        { q: 'What is the difference between Kling 3.0 Standard and Pro?', a: 'Standard offers faster generation speed and affordable credits (6 credits/s). Pro costs 8 credits/s but delivers higher video quality, finer details, and more natural motion.' },
      ],
      ja: [
        { q: 'Kling 3.0とは何ですか？', a: 'Kling 3.0はKuaishou（快手）が開発したテキスト/画像から動画を生成するAIモデルです。StandardとProの2つのティアを提供し、最大720p解像度で5〜10秒の動画を生成します。マルチショット機能に対応しています。' },
        { q: 'Kling 3.0のクレジットはいくらですか？', a: 'Standardティアは1秒あたり6クレジット、Proティアは1秒あたり8クレジットが消費されます。Proティアはより高い品質と細かいディテールを提供します。新規登録時に15クレジットが無料で付与されます。' },
        { q: 'Kling 3.0でどんな動画が作れますか？', a: '商品プロモーション動画、ブランド広告、SNSコンテンツなど様々な動画を制作できます。マルチショット機能で複数のシーンを繋げたストーリーテリング動画も可能です。' },
        { q: 'Kling 3.0のStandardとProの違いは何ですか？', a: 'Standardは速い生成速度と手頃なクレジット（1秒6クレジット）を提供します。Proは1秒8クレジットですが、より高い動画品質、細かいディテール、自然な動きを実現します。' },
      ],
      zh: [
        { q: '什么是Kling 3.0？', a: 'Kling 3.0是Kuaishou（快手）开发的文本/图像转视频AI模型。提供Standard和Pro两个等级，生成最高720p分辨率、5~10秒的视频。支持多镜头功能。' },
        { q: 'Kling 3.0需要多少积分？', a: 'Standard等级每秒消耗6积分，Pro等级每秒消耗8积分。Pro等级提供更高质量和更精细的细节。新用户注册即送15免费积分。' },
        { q: 'Kling 3.0可以制作什么样的视频？', a: '可以制作产品宣传视频、品牌广告、社交媒体内容等多种视频。多镜头功能可以连接多个场景制作叙事视频。' },
        { q: 'Kling 3.0的Standard和Pro有什么区别？', a: 'Standard提供更快的生成速度和实惠的积分价格（每秒6积分）。Pro每秒8积分，但提供更高的视频质量、更精细的细节和更自然的运动效果。' },
      ],
    },
    features: {
      ko: ['텍스트 또는 이미지에서 720p AI 영상 생성', 'Standard/Pro 두 가지 품질 등급 선택', '5~10초 길이 영상 지원', '멀티샷 기능으로 스토리텔링 영상 제작', 'Kuaishou(快手) 최신 AI 기술 기반'],
      en: ['Generate 720p AI videos from text or images', 'Choose between Standard and Pro quality tiers', 'Support for 5-10 second videos', 'Multi-shot feature for storytelling videos', 'Powered by Kuaishou\'s latest AI technology'],
      ja: ['テキストまたは画像から720pのAI動画を生成', 'Standard/Proの2つの品質ティアから選択', '5〜10秒の動画に対応', 'マルチショット機能でストーリーテリング動画を制作', 'Kuaishou（快手）最新AI技術搭載'],
      zh: ['从文本或图像生成720p AI视频', 'Standard/Pro两种质量等级可选', '支持5~10秒视频', '多镜头功能制作叙事视频', '基于Kuaishou（快手）最新AI技术'],
    },
  },
  'kling-3-mc': {
    name: 'Kling 3.0 Motion Control',
    creator: 'Kuaishou',
    description: {
      ko: 'Kuaishou Kling 3.0 Motion Control로 모션 경로 기반 AI 영상 생성. 카메라/객체 움직임 제어.',
      en: 'Generate motion-controlled AI videos with Kuaishou Kling 3.0. Camera and object trajectory control.',
      ja: 'Kuaishou Kling 3.0 Motion Controlでモーション経路ベースのAI動画を生成。カメラ/オブジェクトの動き制御。',
      zh: '使用Kuaishou Kling 3.0 Motion Control生成运动控制AI视频。相机和物体轨迹控制。',
    },
    title: {
      ko: 'Kling 3.0 Motion Control AI 영상 생성 | gwanggo',
      en: 'Kling 3.0 Motion Control AI Video Generator | gwanggo',
      ja: 'Kling 3.0 Motion Control AI動画生成 | gwanggo',
      zh: 'Kling 3.0 Motion Control AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Kling 3.0 Motion Control', 'Kuaishou', '모션 컨트롤', 'AI 영상 생성', '카메라 경로'],
      en: ['Kling 3.0 Motion Control', 'Kuaishou', 'motion control', 'AI video generator', 'camera trajectory'],
      ja: ['Kling 3.0 Motion Control', 'Kuaishou', 'モーションコントロール', 'AI動画生成', 'カメラ経路'],
      zh: ['Kling 3.0 Motion Control', 'Kuaishou', '运动控制', 'AI视频生成', '相机轨迹'],
    },
    jsonLdDescription: {
      ko: 'Kuaishou가 개발한 모션 컨트롤 AI 영상 생성 모델. 카메라/객체 움직임 경로 제어.',
      en: 'Motion Control AI video generation model by Kuaishou. Camera and object trajectory control.',
      ja: 'Kuaishouが開発したモーションコントロールAI動画生成モデル。カメラ/オブジェクトの動き経路制御。',
      zh: 'Kuaishou开发的运动控制AI视频生成模型。相机和物体轨迹控制。',
    },
    faq: {
      ko: [
        { q: 'Kling 3.0 Motion Control이란 무엇인가요?', a: 'Kling 3.0 Motion Control은 Kuaishou가 개발한 모션 경로 기반 AI 영상 생성 모델입니다. 카메라와 객체의 움직임 경로를 직접 지정하여 원하는 방향과 속도로 영상을 생성할 수 있습니다. 이미지 입력이 필수입니다.' },
        { q: 'Kling 3.0 MC 크레딧은 얼마인가요?', a: 'Standard 등급은 초당 6크레딧, Pro 등급은 초당 8크레딧이 소모됩니다. 일반 Kling 3.0과 동일한 크레딧 체계이며, 모션 컨트롤 기능이 추가된 고급 모드입니다.' },
        { q: 'Kling 3.0 MC로 어떤 영상을 만들 수 있나요?', a: '카메라 줌인/줌아웃, 패닝, 틸트 등 정교한 카메라 움직임이 필요한 제품 광고 영상을 만들 수 있습니다. 객체의 이동 경로도 지정 가능하여 역동적인 영상 제작이 가능합니다.' },
        { q: '일반 Kling 3.0과 Motion Control 버전의 차이는 무엇인가요?', a: '일반 Kling 3.0은 AI가 자동으로 카메라 움직임을 결정하지만, Motion Control은 사용자가 카메라/객체 움직임 경로를 직접 그려서 지정합니다. 이미지 입력이 필수이며, 더 정밀한 영상 연출이 가능합니다.' },
      ],
      en: [
        { q: 'What is Kling 3.0 Motion Control?', a: 'Kling 3.0 Motion Control is a motion-path-based AI video generation model by Kuaishou. You can specify camera and object movement trajectories to generate videos with desired direction and speed. Image input is required.' },
        { q: 'How much does Kling 3.0 MC cost in credits?', a: 'Standard tier costs 6 credits per second and Pro tier costs 8 credits per second. It uses the same credit structure as regular Kling 3.0, with added motion control capabilities.' },
        { q: 'What kind of videos can I create with Kling 3.0 MC?', a: 'You can create product ad videos requiring precise camera movements like zoom in/out, panning, and tilting. Object movement paths can also be specified for dynamic video production.' },
        { q: 'What is the difference between Kling 3.0 and Motion Control version?', a: 'Regular Kling 3.0 lets AI decide camera movements automatically, while Motion Control allows you to draw camera/object movement paths manually. Image input is required, enabling more precise video direction.' },
      ],
      ja: [
        { q: 'Kling 3.0 Motion Controlとは何ですか？', a: 'Kling 3.0 Motion ControlはKuaishouが開発したモーション経路ベースのAI動画生成モデルです。カメラとオブジェクトの動き経路を直接指定して、望む方向と速度で動画を生成できます。画像入力が必須です。' },
        { q: 'Kling 3.0 MCのクレジットはいくらですか？', a: 'Standardティアは1秒あたり6クレジット、Proティアは1秒あたり8クレジットです。通常のKling 3.0と同じクレジット体系で、モーションコントロール機能が追加された上級モードです。' },
        { q: 'Kling 3.0 MCでどんな動画が作れますか？', a: 'カメラのズームイン/ズームアウト、パンニング、ティルトなど精密なカメラの動きが必要な商品広告動画を作成できます。オブジェクトの移動経路も指定でき、ダイナミックな動画制作が可能です。' },
        { q: '通常のKling 3.0とMotion Control版の違いは何ですか？', a: '通常のKling 3.0はAIが自動的にカメラの動きを決定しますが、Motion Controlはユーザーがカメラ/オブジェクトの動き経路を直接描いて指定します。画像入力が必須で、より精密な動画演出が可能です。' },
      ],
      zh: [
        { q: '什么是Kling 3.0 Motion Control？', a: 'Kling 3.0 Motion Control是Kuaishou（快手）开发的基于运动路径的AI视频生成模型。您可以指定相机和物体的运动轨迹，按照期望的方向和速度生成视频。需要图像输入。' },
        { q: 'Kling 3.0 MC需要多少积分？', a: 'Standard等级每秒6积分，Pro等级每秒8积分。与普通Kling 3.0使用相同的积分体系，增加了运动控制功能的高级模式。' },
        { q: 'Kling 3.0 MC可以制作什么样的视频？', a: '可以制作需要精确相机运动（如缩放、平移、倾斜）的产品广告视频。还可以指定物体移动路径，制作动态视频。' },
        { q: '普通Kling 3.0和Motion Control版有什么区别？', a: '普通Kling 3.0由AI自动决定相机运动，而Motion Control允许用户手动绘制相机/物体运动路径。需要图像输入，可以实现更精确的视频导演效果。' },
      ],
    },
    features: {
      ko: ['카메라 움직임 경로 직접 제어 (줌, 패닝, 틸트)', '객체 이동 경로 지정 가능', 'Standard/Pro 두 가지 품질 등급', '720p 해상도, 5~10초 길이 지원', '이미지 기반 정밀 영상 연출'],
      en: ['Direct camera movement path control (zoom, pan, tilt)', 'Object movement trajectory specification', 'Standard and Pro quality tiers', '720p resolution, 5-10 second videos', 'Image-based precise video direction'],
      ja: ['カメラの動き経路を直接制御（ズーム、パン、ティルト）', 'オブジェクトの移動経路を指定可能', 'Standard/Proの2つの品質ティア', '720p解像度、5〜10秒対応', '画像ベースの精密な動画演出'],
      zh: ['直接控制相机运动路径（缩放、平移、倾斜）', '可指定物体移动轨迹', 'Standard/Pro两种质量等级', '720p分辨率，5~10秒视频', '基于图像的精确视频导演'],
    },
  },
  'grok-video': {
    name: 'Grok Imagine Video',
    creator: 'xAI',
    description: {
      ko: 'xAI Grok Imagine Video로 AI 영상 생성. 480p~720p, 최대 15초.',
      en: 'Generate AI videos with xAI Grok Imagine Video. 480p-720p, up to 15 seconds.',
      ja: 'xAI Grok Imagine VideoでAI動画を生成。480p〜720p、最大15秒。',
      zh: '使用xAI Grok Imagine Video生成AI视频。480p~720p，最长15秒。',
    },
    title: {
      ko: 'Grok Imagine Video AI 영상 생성 | gwanggo',
      en: 'Grok Imagine Video AI Generator | gwanggo',
      ja: 'Grok Imagine Video AI動画生成 | gwanggo',
      zh: 'Grok Imagine Video AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Grok Imagine Video', 'xAI', 'Grok 영상', 'AI 영상 생성'],
      en: ['Grok Imagine Video', 'xAI', 'Grok video', 'AI video generator'],
      ja: ['Grok Imagine Video', 'xAI', 'Grok動画', 'AI動画生成'],
      zh: ['Grok Imagine Video', 'xAI', 'Grok视频', 'AI视频生成'],
    },
    jsonLdDescription: {
      ko: 'xAI가 개발한 Text/Image to Video AI 모델. 480p~720p, 최대 15초.',
      en: 'Text/Image to Video AI model by xAI. 480p-720p, up to 15s.',
      ja: 'xAIが開発したText/Image to Video AIモデル。480p〜720p、最大15秒。',
      zh: 'xAI开发的Text/Image to Video AI模型。480p~720p，最长15秒。',
    },
    faq: {
      ko: [
        { q: 'Grok Imagine Video란 무엇인가요?', a: 'Grok Imagine Video는 일론 머스크의 xAI가 개발한 텍스트/이미지 투 비디오 AI 모델입니다. 480p~720p 해상도로 최대 15초 길이의 영상을 생성할 수 있으며, Grok AI의 강력한 언어 이해력을 바탕으로 프롬프트 해석 능력이 뛰어납니다.' },
        { q: 'Grok Video 크레딧은 얼마인가요?', a: '초당 2~3크레딧이 소모됩니다. 해상도에 따라 비용이 달라지며, 최대 15초까지 생성 가능합니다. 무료 회원가입 시 15크레딧이 지급되어 바로 체험해볼 수 있습니다.' },
        { q: 'Grok Video로 어떤 영상을 만들 수 있나요?', a: '텍스트 프롬프트만으로 창의적인 영상을 생성하거나, 이미지를 기반으로 영상을 만들 수 있습니다. 특히 복잡한 프롬프트를 정확하게 해석하여 의도에 맞는 영상을 생성하는 데 강점이 있습니다.' },
        { q: 'Grok Video의 특징은 무엇인가요?', a: 'xAI의 Grok 기술을 기반으로 뛰어난 프롬프트 이해력을 제공합니다. 최대 15초로 다른 모델 대비 긴 영상 생성이 가능하며, 480p~720p 해상도를 지원하여 다양한 용도로 활용할 수 있습니다.' },
      ],
      en: [
        { q: 'What is Grok Imagine Video?', a: 'Grok Imagine Video is a text/image-to-video AI model developed by Elon Musk\'s xAI. It generates videos at 480p-720p resolution up to 15 seconds long, with excellent prompt interpretation powered by Grok AI\'s strong language understanding.' },
        { q: 'How much does Grok Video cost in credits?', a: 'It costs 2-3 credits per second depending on resolution. Videos can be up to 15 seconds long. New users receive 15 free credits upon signup to try it immediately.' },
        { q: 'What kind of videos can I create with Grok Video?', a: 'You can generate creative videos from text prompts alone or create videos based on images. It excels at accurately interpreting complex prompts to produce videos matching your intent.' },
        { q: 'What makes Grok Video special?', a: 'Built on xAI\'s Grok technology, it offers superior prompt understanding. It supports up to 15 seconds, longer than many competitors, with 480p-720p resolution for versatile use cases.' },
      ],
      ja: [
        { q: 'Grok Imagine Videoとは何ですか？', a: 'Grok Imagine VideoはイーロンマスクのxAIが開発したテキスト/画像から動画を生成するAIモデルです。480p〜720p解像度で最大15秒の動画を生成でき、Grok AIの強力な言語理解力によりプロンプト解釈能力に優れています。' },
        { q: 'Grok Videoのクレジットはいくらですか？', a: '1秒あたり2〜3クレジットが消費されます。解像度によりコストが異なり、最大15秒まで生成可能です。新規登録時に15クレジットが無料で付与されます。' },
        { q: 'Grok Videoでどんな動画が作れますか？', a: 'テキストプロンプトだけで創造的な動画を生成したり、画像をベースに動画を作成できます。特に複雑なプロンプトを正確に解釈して意図に合った動画を生成する点に強みがあります。' },
        { q: 'Grok Videoの特徴は何ですか？', a: 'xAIのGrok技術をベースに優れたプロンプト理解力を提供します。最大15秒と他のモデルに比べて長い動画生成が可能で、480p〜720p解像度に対応しています。' },
      ],
      zh: [
        { q: '什么是Grok Imagine Video？', a: 'Grok Imagine Video是埃隆·马斯克的xAI开发的文本/图像转视频AI模型。可生成480p~720p分辨率、最长15秒的视频，基于Grok AI强大的语言理解能力，提示词解读能力出色。' },
        { q: 'Grok Video需要多少积分？', a: '每秒消耗2~3积分，根据分辨率不同费用有所变化。最长可生成15秒视频。新用户注册即送15免费积分。' },
        { q: 'Grok Video可以制作什么样的视频？', a: '可以仅通过文本提示生成创意视频，也可以基于图像制作视频。特别擅长准确解读复杂提示词，生成符合意图的视频。' },
        { q: 'Grok Video有什么特点？', a: '基于xAI的Grok技术提供卓越的提示词理解力。支持最长15秒，比许多竞品更长，支持480p~720p分辨率，适用于多种场景。' },
      ],
    },
    features: {
      ko: ['텍스트 또는 이미지에서 480p~720p AI 영상 생성', '최대 15초의 긴 영상 생성 지원', 'xAI Grok 기반 뛰어난 프롬프트 해석력', '초당 2~3크레딧의 합리적 가격', '복잡한 프롬프트도 정확하게 반영'],
      en: ['Generate 480p-720p AI videos from text or images', 'Support for up to 15-second long videos', 'Superior prompt interpretation powered by xAI Grok', 'Affordable at 2-3 credits per second', 'Accurate reflection of complex prompts'],
      ja: ['テキストまたは画像から480p〜720pのAI動画を生成', '最大15秒の長尺動画に対応', 'xAI Grokベースの優れたプロンプト解釈力', '1秒2〜3クレジットの手頃な価格', '複雑なプロンプトも正確に反映'],
      zh: ['从文本或图像生成480p~720p AI视频', '支持最长15秒视频生成', '基于xAI Grok的卓越提示词解读能力', '每秒2~3积分的合理价格', '准确反映复杂提示词'],
    },
  },
  'wan-2.6': {
    name: 'Wan 2.6',
    creator: 'Alibaba',
    description: {
      ko: 'Alibaba Wan 2.6으로 시네마틱 AI 영상 생성. 720p~1080p, 5~15초.',
      en: 'Generate cinematic AI videos with Alibaba Wan 2.6. 720p-1080p, 5-15 seconds.',
      ja: 'Alibaba Wan 2.6でシネマティックAI動画を生成。720p〜1080p、5〜15秒。',
      zh: '使用Alibaba Wan 2.6生成电影级AI视频。720p~1080p，5~15秒。',
    },
    title: {
      ko: 'Wan 2.6 AI 영상 생성 | gwanggo',
      en: 'Wan 2.6 AI Video Generator | gwanggo',
      ja: 'Wan 2.6 AI動画生成 | gwanggo',
      zh: 'Wan 2.6 AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Wan 2.6', 'Alibaba', '알리바바', 'AI 영상 생성', '시네마틱 영상'],
      en: ['Wan 2.6', 'Alibaba', 'AI video generator', 'cinematic video'],
      ja: ['Wan 2.6', 'Alibaba', 'アリババ', 'AI動画生成', 'シネマティック動画'],
      zh: ['Wan 2.6', 'Alibaba', '阿里巴巴', 'AI视频生成', '电影级视频'],
    },
    jsonLdDescription: {
      ko: 'Alibaba가 개발한 Text/Image to Video AI 모델. 720p~1080p, 5~15초.',
      en: 'Text/Image to Video AI model by Alibaba. 720p-1080p, 5-15s.',
      ja: 'Alibabaが開発したText/Image to Video AIモデル。720p〜1080p、5〜15秒。',
      zh: 'Alibaba开发的Text/Image to Video AI模型。720p~1080p，5~15秒。',
    },
    faq: {
      ko: [
        { q: 'Wan 2.6이란 무엇인가요?', a: 'Wan 2.6은 Alibaba(알리바바)가 개발한 시네마틱 AI 영상 생성 모델입니다. 720p~1080p 해상도로 5~15초 길이의 영화 같은 품질의 영상을 생성합니다. 영화적 연출과 자연스러운 움직임에 특화되어 있습니다.' },
        { q: 'Wan 2.6 크레딧은 얼마인가요?', a: '초당 4~5크레딧이 소모됩니다. 1080p 고해상도를 지원하는 만큼 높은 품질의 영상을 생성할 수 있습니다. 무료 회원가입 시 15크레딧이 지급됩니다.' },
        { q: 'Wan 2.6으로 어떤 영상을 만들 수 있나요?', a: '시네마틱 느낌의 제품 광고, 브랜드 프로모션 영상, 고급스러운 분위기의 홍보 영상 등을 제작할 수 있습니다. 특히 1080p 고해상도로 전문적인 품질의 영상을 만들 수 있습니다.' },
        { q: 'Wan 2.6의 시네마틱 품질이란 무엇인가요?', a: 'Wan 2.6은 영화적 색감, 자연스러운 조명 표현, 부드러운 카메라 움직임을 특징으로 합니다. Alibaba의 대규모 학습 데이터를 기반으로 영화 수준의 시각적 품질을 제공하며, 최대 15초까지 긴 영상도 생성 가능합니다.' },
      ],
      en: [
        { q: 'What is Wan 2.6?', a: 'Wan 2.6 is a cinematic AI video generation model developed by Alibaba. It generates movie-quality videos at 720p-1080p resolution, 5-15 seconds long. It specializes in cinematic direction and natural motion.' },
        { q: 'How much does Wan 2.6 cost in credits?', a: 'It costs 4-5 credits per second. With 1080p high-resolution support, it delivers high-quality cinematic videos. New users receive 15 free credits upon signup.' },
        { q: 'What kind of videos can I create with Wan 2.6?', a: 'You can create cinematic product ads, brand promotion videos, and premium-quality promotional content. The 1080p high resolution enables professional-grade video production.' },
        { q: 'What does cinematic quality mean for Wan 2.6?', a: 'Wan 2.6 features film-grade color grading, natural lighting, and smooth camera movements. Based on Alibaba\'s massive training data, it delivers movie-level visual quality with videos up to 15 seconds long.' },
      ],
      ja: [
        { q: 'Wan 2.6とは何ですか？', a: 'Wan 2.6はAlibaba（アリババ）が開発したシネマティックAI動画生成モデルです。720p〜1080p解像度で5〜15秒の映画品質の動画を生成します。映画的な演出と自然な動きに特化しています。' },
        { q: 'Wan 2.6のクレジットはいくらですか？', a: '1秒あたり4〜5クレジットが消費されます。1080p高解像度をサポートしており、高品質な動画を生成できます。新規登録時に15クレジットが無料で付与されます。' },
        { q: 'Wan 2.6でどんな動画が作れますか？', a: 'シネマティックな商品広告、ブランドプロモーション動画、高級感のあるPR動画などを制作できます。特に1080p高解像度でプロフェッショナルな品質の動画が作れます。' },
        { q: 'Wan 2.6のシネマティック品質とは何ですか？', a: 'Wan 2.6は映画的な色彩、自然な照明表現、滑らかなカメラの動きが特徴です。Alibabaの大規模な学習データに基づき、映画レベルの視覚品質を提供し、最大15秒の長尺動画も生成可能です。' },
      ],
      zh: [
        { q: '什么是Wan 2.6？', a: 'Wan 2.6是Alibaba（阿里巴巴）开发的电影级AI视频生成模型。以720p~1080p分辨率生成5~15秒的电影品质视频。专注于电影级导演效果和自然运动。' },
        { q: 'Wan 2.6需要多少积分？', a: '每秒消耗4~5积分。支持1080p高分辨率，可生成高质量视频。新用户注册即送15免费积分。' },
        { q: 'Wan 2.6可以制作什么样的视频？', a: '可以制作电影感的产品广告、品牌宣传视频、高端质感的推广视频等。特别是1080p高分辨率可以制作专业级视频。' },
        { q: 'Wan 2.6的电影级品质是什么意思？', a: 'Wan 2.6以电影级色彩、自然光照表现和流畅的相机运动为特色。基于阿里巴巴的大规模训练数据，提供电影级视觉质量，最长可生成15秒视频。' },
      ],
    },
    features: {
      ko: ['720p~1080p 고해상도 시네마틱 AI 영상 생성', '5~15초의 긴 영상 지원', '영화적 색감과 자연스러운 조명 표현', 'Alibaba 대규모 AI 기술 기반', '제품 광고 및 브랜드 프로모션에 최적화'],
      en: ['Cinematic AI video generation at 720p-1080p', 'Support for 5-15 second long videos', 'Film-grade color grading and natural lighting', 'Powered by Alibaba\'s large-scale AI technology', 'Optimized for product ads and brand promotions'],
      ja: ['720p〜1080p高解像度シネマティックAI動画生成', '5〜15秒の長尺動画に対応', '映画的な色彩と自然な照明表現', 'Alibaba大規模AI技術搭載', '商品広告・ブランドプロモーションに最適化'],
      zh: ['720p~1080p高分辨率电影级AI视频生成', '支持5~15秒视频', '电影级色彩和自然光照表现', '基于阿里巴巴大规模AI技术', '产品广告和品牌推广优化'],
    },
  },
  'vidu-q3': {
    name: 'Vidu Q3',
    creator: 'Shengshu Technology',
    description: {
      ko: 'Shengshu Vidu Q3로 이미지에서 고품질 AI 영상 생성. 최대 1080p, 16초.',
      en: 'Generate AI videos from images with Shengshu Vidu Q3. Up to 1080p, 16 seconds.',
      ja: 'Shengshu Vidu Q3で画像から高品質AI動画を生成。最大1080p、16秒。',
      zh: '使用Shengshu Vidu Q3从图像生成高质量AI视频。最高1080p、16秒。',
    },
    title: {
      ko: 'Vidu Q3 AI 영상 생성 | gwanggo',
      en: 'Vidu Q3 AI Video Generator | gwanggo',
      ja: 'Vidu Q3 AI動画生成 | gwanggo',
      zh: 'Vidu Q3 AI视频生成 | gwanggo',
    },
    keywords: {
      ko: ['Vidu Q3', 'Shengshu Technology', 'AI 영상 생성', '이미지 투 비디오'],
      en: ['Vidu Q3', 'Shengshu Technology', 'AI video generator', 'image to video'],
      ja: ['Vidu Q3', 'Shengshu Technology', 'AI動画生成', '画像から動画'],
      zh: ['Vidu Q3', '生数科技', 'AI视频生成', '图像生成视频'],
    },
    jsonLdDescription: {
      ko: 'Shengshu Technology가 개발한 이미지 투 비디오 AI 모델. 최대 1080p, 16초.',
      en: 'Image to Video AI model by Shengshu Technology. Up to 1080p, 16s.',
      ja: 'Shengshu Technologyが開発した画像から動画を生成するAIモデル。最大1080p、16秒。',
      zh: '生数科技开发的图像转视频AI模型。最高1080p、16秒。',
    },
    faq: {
      ko: [
        { q: 'Vidu Q3란 무엇인가요?', a: 'Vidu Q3는 Shengshu Technology(생수과기)가 개발한 이미지 투 비디오 AI 모델입니다. 제품 이미지를 업로드하면 540p~1080p 해상도로 최대 16초 길이의 AI 영상을 생성합니다. gwanggo의 제품 광고 영상 전용 모델입니다.' },
        { q: 'Vidu Q3 크레딧은 얼마인가요?', a: '540p에서 초당 1크레딧, 720p에서 초당 2크레딧, 1080p에서 초당 3크레딧이 소모됩니다. 해상도별로 합리적인 가격 체계를 제공하여 예산에 맞게 선택할 수 있습니다.' },
        { q: 'Vidu Q3로 어떤 영상을 만들 수 있나요?', a: '제품 이미지를 기반으로 제품 광고 영상, 제품 소개 영상, e커머스용 제품 영상 등을 만들 수 있습니다. 최대 16초까지 지원하여 상세한 제품 소개 영상 제작이 가능합니다.' },
        { q: 'Vidu Q3는 텍스트 프롬프트도 지원하나요?', a: 'Vidu Q3는 이미지 투 비디오 전용 모델로, 이미지 입력이 필수입니다. 텍스트 프롬프트만으로 영상을 생성하려면 Seedance 1.5 Pro, Kling 3.0, Grok Video 등 다른 모델을 사용해주세요.' },
      ],
      en: [
        { q: 'What is Vidu Q3?', a: 'Vidu Q3 is an image-to-video AI model developed by Shengshu Technology. Upload a product image to generate AI videos at 540p-1080p resolution, up to 16 seconds long. It is the dedicated product ad video model on gwanggo.' },
        { q: 'How much does Vidu Q3 cost in credits?', a: 'It costs 1 credit/s at 540p, 2 credits/s at 720p, and 3 credits/s at 1080p. The tiered pricing lets you choose based on your budget and quality needs.' },
        { q: 'What kind of videos can I create with Vidu Q3?', a: 'You can create product ad videos, product showcase videos, and e-commerce product videos from product images. With up to 16 seconds, you can create detailed product introduction videos.' },
        { q: 'Does Vidu Q3 support text prompts?', a: 'Vidu Q3 is an image-to-video only model, requiring image input. For text-only video generation, use other models like Seedance 1.5 Pro, Kling 3.0, or Grok Video.' },
      ],
      ja: [
        { q: 'Vidu Q3とは何ですか？', a: 'Vidu Q3はShengshu Technology（生数科技）が開発した画像から動画を生成するAIモデルです。商品画像をアップロードすると540p〜1080p解像度で最大16秒のAI動画を生成します。gwanggoの商品広告動画専用モデルです。' },
        { q: 'Vidu Q3のクレジットはいくらですか？', a: '540pで1秒1クレジット、720pで1秒2クレジット、1080pで1秒3クレジットが消費されます。解像度別の合理的な価格体系で予算に合わせて選択できます。' },
        { q: 'Vidu Q3でどんな動画が作れますか？', a: '商品画像をベースに商品広告動画、商品紹介動画、ECサイト用商品動画などを作成できます。最大16秒まで対応しており、詳細な商品紹介動画の制作が可能です。' },
        { q: 'Vidu Q3はテキストプロンプトにも対応していますか？', a: 'Vidu Q3は画像から動画への専用モデルで、画像入力が必須です。テキストプロンプトのみで動画を生成するには、Seedance 1.5 Pro、Kling 3.0、Grok Videoなど他のモデルをご利用ください。' },
      ],
      zh: [
        { q: '什么是Vidu Q3？', a: 'Vidu Q3是生数科技开发的图像转视频AI模型。上传产品图片即可生成540p~1080p分辨率、最长16秒的AI视频。是gwanggo的产品广告视频专用模型。' },
        { q: 'Vidu Q3需要多少积分？', a: '540p每秒1积分、720p每秒2积分、1080p每秒3积分。分辨率分级的合理价格体系，可根据预算选择。' },
        { q: 'Vidu Q3可以制作什么样的视频？', a: '可以基于产品图片制作产品广告视频、产品展示视频、电商产品视频等。支持最长16秒，可制作详细的产品介绍视频。' },
        { q: 'Vidu Q3支持文本提示吗？', a: 'Vidu Q3是图像转视频专用模型，需要图像输入。如需仅通过文本生成视频，请使用Seedance 1.5 Pro、Kling 3.0或Grok Video等其他模型。' },
      ],
    },
    features: {
      ko: ['이미지에서 540p~1080p AI 영상 생성', '최대 16초의 긴 영상 지원', '540p 1크레딧/초, 720p 2크레딧/초, 1080p 3크레딧/초', '제품 광고 영상 전용 최적화 모델', 'e커머스 및 SNS 제품 홍보에 적합'],
      en: ['Generate 540p-1080p AI videos from images', 'Support for up to 16-second videos', '1 credit/s at 540p, 2 credits/s at 720p, 3 credits/s at 1080p', 'Dedicated model optimized for product ad videos', 'Ideal for e-commerce and social media product promotion'],
      ja: ['画像から540p〜1080pのAI動画を生成', '最大16秒の動画に対応', '540p 1クレジット/秒、720p 2クレジット/秒、1080p 3クレジット/秒', '商品広告動画専用最適化モデル', 'ECサイト・SNS商品プロモーションに最適'],
      zh: ['从图像生成540p~1080p AI视频', '支持最长16秒视频', '540p 1积分/秒、720p 2积分/秒、1080p 3积分/秒', '产品广告视频专用优化模型', '适合电商和社交媒体产品推广'],
    },
  },
  'veo-3.1': {
    name: 'Veo 3.1',
    creator: 'Google',
    description: {
      ko: 'Google Veo 3.1로 AI 영상 생성. 720p~1080p, 오디오 자동 생성 지원.',
      en: 'Generate AI videos with Google Veo 3.1. 720p-1080p with automatic audio generation.',
      ja: 'Google Veo 3.1でAI動画を生成。720p〜1080p、オーディオ自動生成対応。',
      zh: '使用Google Veo 3.1生成AI视频。720p~1080p，支持自动音频生成。',
    },
    title: {
      ko: 'Veo 3.1 AI 영상 생성 - Google AI Video | gwanggo',
      en: 'Veo 3.1 AI Video Generator - Google AI Video | gwanggo',
      ja: 'Veo 3.1 AI動画生成 - Google AI Video | gwanggo',
      zh: 'Veo 3.1 AI视频生成 - Google AI Video | gwanggo',
    },
    keywords: {
      ko: ['Veo 3.1', 'Google AI Video', 'Google 영상 생성', 'AI 영상 생성', '오디오 포함 영상'],
      en: ['Veo 3.1', 'Google AI Video', 'AI video generator', 'video with audio'],
      ja: ['Veo 3.1', 'Google AI Video', 'Google動画生成', 'AI動画生成', 'オーディオ付き動画'],
      zh: ['Veo 3.1', 'Google AI Video', 'Google视频生成', 'AI视频生成', '带音频视频'],
    },
    jsonLdDescription: {
      ko: 'Google이 개발한 AI 영상 생성 모델. 720p~1080p, 오디오 자동 생성 지원.',
      en: 'AI video generation model by Google. 720p-1080p with automatic audio generation.',
      ja: 'Googleが開発したAI動画生成モデル。720p〜1080p、オーディオ自動生成対応。',
      zh: 'Google开发的AI视频生成模型。720p~1080p，支持自动音频生成。',
    },
    faq: {
      ko: [
        { q: 'Veo 3.1이란 무엇인가요?', a: 'Veo 3.1은 Google이 개발한 최신 AI 영상 생성 모델입니다. 텍스트 또는 이미지에서 720p~1080p 해상도의 영상을 생성하며, 가장 큰 특징은 영상에 맞는 오디오(효과음, 배경음)를 자동으로 생성하는 기능입니다.' },
        { q: 'Veo 3.1 크레딧은 얼마인가요?', a: '초당 4~7크레딧이 소모됩니다. 해상도와 오디오 포함 여부에 따라 비용이 달라집니다. Google의 최첨단 기술을 사용하는 만큼 프리미엄 품질을 제공합니다.' },
        { q: 'Veo 3.1로 어떤 영상을 만들 수 있나요?', a: '오디오가 포함된 제품 광고 영상, 브랜드 홍보 영상, SNS 콘텐츠 등을 만들 수 있습니다. 영상과 함께 효과음과 배경음이 자동 생성되어 별도의 오디오 편집 없이 완성된 영상을 얻을 수 있습니다.' },
        { q: 'Veo 3.1의 자동 오디오 생성이란 무엇인가요?', a: 'Veo 3.1은 생성된 영상의 내용을 분석하여 적절한 효과음과 배경음악을 자동으로 생성합니다. 예를 들어 물이 흐르는 장면에는 물소리가, 도시 장면에는 도시 소음이 자연스럽게 추가됩니다.' },
      ],
      en: [
        { q: 'What is Veo 3.1?', a: 'Veo 3.1 is Google\'s latest AI video generation model. It generates 720p-1080p videos from text or images, with its standout feature being automatic audio generation (sound effects and background sounds) that matches the video content.' },
        { q: 'How much does Veo 3.1 cost in credits?', a: 'It costs 4-7 credits per second depending on resolution and audio inclusion. As Google\'s cutting-edge technology, it delivers premium quality results.' },
        { q: 'What kind of videos can I create with Veo 3.1?', a: 'You can create product ads with audio, brand promotional videos, social media content, and more. Sound effects and background audio are auto-generated alongside the video, eliminating the need for separate audio editing.' },
        { q: 'What is Veo 3.1\'s automatic audio generation?', a: 'Veo 3.1 analyzes generated video content and creates appropriate sound effects and background music automatically. For example, water scenes get water sounds, and city scenes get urban ambient noise naturally added.' },
      ],
      ja: [
        { q: 'Veo 3.1とは何ですか？', a: 'Veo 3.1はGoogleが開発した最新のAI動画生成モデルです。テキストまたは画像から720p〜1080p解像度の動画を生成し、最大の特徴は動画に合ったオーディオ（効果音、背景音）を自動生成する機能です。' },
        { q: 'Veo 3.1のクレジットはいくらですか？', a: '1秒あたり4〜7クレジットが消費されます。解像度とオーディオの有無によってコストが異なります。Googleの最先端技術によるプレミアム品質を提供します。' },
        { q: 'Veo 3.1でどんな動画が作れますか？', a: 'オーディオ付きの商品広告動画、ブランドPR動画、SNSコンテンツなどを作成できます。動画と一緒に効果音や背景音が自動生成されるため、別途オーディオ編集なしで完成した動画が得られます。' },
        { q: 'Veo 3.1の自動オーディオ生成とは何ですか？', a: 'Veo 3.1は生成された動画の内容を分析し、適切な効果音とBGMを自動生成します。例えば水が流れるシーンには水の音が、都市のシーンには都市の環境音が自然に追加されます。' },
      ],
      zh: [
        { q: '什么是Veo 3.1？', a: 'Veo 3.1是Google开发的最新AI视频生成模型。从文本或图像生成720p~1080p分辨率的视频，最大特色是自动生成与视频内容匹配的音频（音效和背景音）。' },
        { q: 'Veo 3.1需要多少积分？', a: '每秒消耗4~7积分，根据分辨率和是否包含音频而有所不同。作为Google的尖端技术，提供优质效果。' },
        { q: 'Veo 3.1可以制作什么样的视频？', a: '可以制作带音频的产品广告视频、品牌宣传视频、社交媒体内容等。音效和背景音随视频自动生成，无需单独音频编辑即可获得完整视频。' },
        { q: 'Veo 3.1的自动音频生成是什么？', a: 'Veo 3.1会分析生成的视频内容，自动创建合适的音效和背景音乐。例如流水场景会添加水声，城市场景会自然添加城市环境音。' },
      ],
    },
    features: {
      ko: ['텍스트 또는 이미지에서 720p~1080p AI 영상 생성', '영상에 맞는 오디오(효과음, BGM) 자동 생성', 'Google 최첨단 AI 기술 기반 프리미엄 품질', '별도 오디오 편집 없이 완성된 영상 제작', '광고, 브랜드 프로모션, SNS 콘텐츠에 최적화'],
      en: ['Generate 720p-1080p AI videos from text or images', 'Automatic audio generation (sound effects, BGM) matching video', 'Premium quality powered by Google\'s cutting-edge AI', 'Complete videos without separate audio editing', 'Optimized for ads, brand promotions, and social media'],
      ja: ['テキストまたは画像から720p〜1080pのAI動画を生成', '動画に合ったオーディオ（効果音、BGM）を自動生成', 'Google最先端AI技術によるプレミアム品質', '別途オーディオ編集不要で完成した動画を制作', '広告・ブランドプロモーション・SNSコンテンツに最適化'],
      zh: ['从文本或图像生成720p~1080p AI视频', '自动生成匹配视频的音频（音效、BGM）', '基于Google尖端AI技术的优质效果', '无需单独音频编辑即可制作完整视频', '广告、品牌推广和社交媒体优化'],
    },
  },
  'hailuo-02': {
    name: 'Hailuo-02',
    creator: 'MiniMax',
    description: {
      ko: 'MiniMax Hailuo-02로 AI 영상 생성. Standard/Pro 등급, 768p~1080p.',
      en: 'Generate AI videos with MiniMax Hailuo-02. Standard/Pro tiers, 768p-1080p.',
      ja: 'MiniMax Hailuo-02でAI動画を生成。Standard/Proティア、768p〜1080p。',
      zh: '使用MiniMax Hailuo-02生成AI视频。Standard/Pro等级，768p~1080p。',
    },
    title: {
      ko: 'Hailuo-02 AI 영상 생성 - MiniMax | gwanggo',
      en: 'Hailuo-02 AI Video Generator - MiniMax | gwanggo',
      ja: 'Hailuo-02 AI動画生成 - MiniMax | gwanggo',
      zh: 'Hailuo-02 AI视频生成 - MiniMax | gwanggo',
    },
    keywords: {
      ko: ['Hailuo-02', 'MiniMax', 'Hailuo AI', 'AI 영상 생성'],
      en: ['Hailuo-02', 'MiniMax', 'Hailuo AI', 'AI video generator'],
      ja: ['Hailuo-02', 'MiniMax', 'Hailuo AI', 'AI動画生成'],
      zh: ['Hailuo-02', 'MiniMax', 'Hailuo AI', 'AI视频生成'],
    },
    jsonLdDescription: {
      ko: 'MiniMax가 개발한 AI 영상 생성 모델. Standard/Pro 등급, 768p~1080p.',
      en: 'AI video generation model by MiniMax. Standard/Pro tiers, 768p-1080p.',
      ja: 'MiniMaxが開発したAI動画生成モデル。Standard/Proティア、768p〜1080p。',
      zh: 'MiniMax开发的AI视频生成模型。Standard/Pro等级，768p~1080p。',
    },
    faq: {
      ko: [
        { q: 'Hailuo-02란 무엇인가요?', a: 'Hailuo-02는 MiniMax가 개발한 AI 영상 생성 모델입니다. Standard와 Pro 두 가지 등급을 제공하며, 768p~1080p 해상도의 고품질 영상을 생성합니다. 자연스러운 움직임과 높은 시각적 품질이 특징입니다.' },
        { q: 'Hailuo-02 크레딧은 얼마인가요?', a: '초당 2~3크레딧이 소모됩니다. Standard와 Pro 등급에 따라 비용이 달라지며, 가성비가 뛰어난 AI 영상 생성 모델입니다. 무료 회원가입 시 15크레딧이 지급됩니다.' },
        { q: 'Hailuo-02로 어떤 영상을 만들 수 있나요?', a: '제품 광고 영상, 브랜드 콘텐츠, SNS 숏폼 영상 등 다양한 형식의 영상을 제작할 수 있습니다. 특히 자연스러운 인물 움직임과 사실적인 배경 표현에 강점이 있습니다.' },
        { q: 'Hailuo-02의 Standard와 Pro 차이는 무엇인가요?', a: 'Standard는 768p 해상도로 빠른 생성과 합리적 비용을 제공합니다. Pro는 1080p 해상도로 더 높은 디테일과 시각적 품질을 보장하며, 전문적인 광고 영상 제작에 적합합니다.' },
      ],
      en: [
        { q: 'What is Hailuo-02?', a: 'Hailuo-02 is an AI video generation model developed by MiniMax. It offers Standard and Pro tiers, generating high-quality videos at 768p-1080p resolution. It features natural motion and high visual quality.' },
        { q: 'How much does Hailuo-02 cost in credits?', a: 'It costs 2-3 credits per second depending on the tier. It offers excellent value among AI video generation models. New users receive 15 free credits upon signup.' },
        { q: 'What kind of videos can I create with Hailuo-02?', a: 'You can create product ads, brand content, social media short-form videos, and more. It particularly excels in natural human motion and realistic background rendering.' },
        { q: 'What is the difference between Hailuo-02 Standard and Pro?', a: 'Standard offers 768p resolution with fast generation and affordable cost. Pro delivers 1080p resolution with higher detail and visual quality, suitable for professional ad video production.' },
      ],
      ja: [
        { q: 'Hailuo-02とは何ですか？', a: 'Hailuo-02はMiniMaxが開発したAI動画生成モデルです。StandardとProの2つのティアを提供し、768p〜1080p解像度の高品質動画を生成します。自然な動きと高い視覚品質が特徴です。' },
        { q: 'Hailuo-02のクレジットはいくらですか？', a: '1秒あたり2〜3クレジットが消費されます。ティアによってコストが異なり、コストパフォーマンスに優れたAI動画生成モデルです。新規登録時に15クレジットが無料で付与されます。' },
        { q: 'Hailuo-02でどんな動画が作れますか？', a: '商品広告動画、ブランドコンテンツ、SNSショート動画など様々な形式の動画を制作できます。特に自然な人物の動きとリアルな背景表現に強みがあります。' },
        { q: 'Hailuo-02のStandardとProの違いは何ですか？', a: 'Standardは768p解像度で高速生成と手頃なコストを提供します。Proは1080p解像度でより高いディテールと視覚品質を保証し、プロフェッショナルな広告動画制作に適しています。' },
      ],
      zh: [
        { q: '什么是Hailuo-02？', a: 'Hailuo-02是MiniMax开发的AI视频生成模型。提供Standard和Pro两个等级，生成768p~1080p分辨率的高质量视频。以自然运动和高视觉质量为特色。' },
        { q: 'Hailuo-02需要多少积分？', a: '每秒消耗2~3积分，根据等级不同费用有所变化。是性价比出色的AI视频生成模型。新用户注册即送15免费积分。' },
        { q: 'Hailuo-02可以制作什么样的视频？', a: '可以制作产品广告视频、品牌内容、社交媒体短视频等多种格式。特别擅长自然的人物动作和逼真的背景表现。' },
        { q: 'Hailuo-02的Standard和Pro有什么区别？', a: 'Standard提供768p分辨率，快速生成且价格合理。Pro提供1080p分辨率，更高的细节和视觉质量，适合专业广告视频制作。' },
      ],
    },
    features: {
      ko: ['768p~1080p 고해상도 AI 영상 생성', 'Standard/Pro 두 가지 품질 등급 선택', '초당 2~3크레딧의 뛰어난 가성비', '자연스러운 인물 움직임 및 사실적 배경', 'MiniMax 최신 AI 기술 기반'],
      en: ['High-resolution AI video generation at 768p-1080p', 'Choose between Standard and Pro quality tiers', 'Excellent value at 2-3 credits per second', 'Natural human motion and realistic backgrounds', 'Powered by MiniMax\'s latest AI technology'],
      ja: ['768p〜1080p高解像度AI動画生成', 'Standard/Proの2つの品質ティアから選択', '1秒2〜3クレジットの優れたコスパ', '自然な人物の動きとリアルな背景', 'MiniMax最新AI技術搭載'],
      zh: ['768p~1080p高分辨率AI视频生成', 'Standard/Pro两种质量等级可选', '每秒2~3积分的出色性价比', '自然的人物动作和逼真背景', '基于MiniMax最新AI技术'],
    },
  },
  'ltx-2.3': {
    name: 'LTX 2.3',
    creator: 'Lightricks',
    description: {
      ko: 'Lightricks LTX 2.3으로 AI 영상 생성. 720p~1080p, 최대 20초. 오픈소스 모델.',
      en: 'Generate AI videos with Lightricks LTX 2.3. 720p-1080p, up to 20 seconds. Open source model.',
      ja: 'Lightricks LTX 2.3でAI動画を生成。720p〜1080p、最大20秒。オープンソースモデル。',
      zh: '使用Lightricks LTX 2.3生成AI视频。720p~1080p，最长20秒。开源模型。',
    },
    title: {
      ko: 'LTX 2.3 AI 영상 생성 - Lightricks | gwanggo',
      en: 'LTX 2.3 AI Video Generator - Lightricks | gwanggo',
      ja: 'LTX 2.3 AI動画生成 - Lightricks | gwanggo',
      zh: 'LTX 2.3 AI视频生成 - Lightricks | gwanggo',
    },
    keywords: {
      ko: ['LTX 2.3', 'Lightricks', 'AI 영상 생성', '오픈소스 AI 영상'],
      en: ['LTX 2.3', 'Lightricks', 'AI video generator', 'open source AI video'],
      ja: ['LTX 2.3', 'Lightricks', 'AI動画生成', 'オープンソースAI動画'],
      zh: ['LTX 2.3', 'Lightricks', 'AI视频生成', '开源AI视频'],
    },
    jsonLdDescription: {
      ko: 'Lightricks가 개발한 오픈소스 AI 영상 생성 모델. 720p~1080p, 최대 20초.',
      en: 'Open source AI video generation model by Lightricks. 720p-1080p, up to 20 seconds.',
      ja: 'Lightricksが開発したオープンソースAI動画生成モデル。720p〜1080p、最大20秒。',
      zh: 'Lightricks开发的开源AI视频生成模型。720p~1080p，最长20秒。',
    },
    faq: {
      ko: [
        { q: 'LTX 2.3이란 무엇인가요?', a: 'LTX 2.3은 Lightricks가 개발한 오픈소스 AI 영상 생성 모델입니다. 720p~1080p 해상도로 최대 20초 길이의 영상을 생성할 수 있습니다. 오픈소스 모델 중 최고 수준의 품질을 제공합니다.' },
        { q: 'LTX 2.3 크레딧은 얼마인가요?', a: '초당 4~5크레딧이 소모됩니다. 최대 20초까지 생성 가능하여 다른 모델 대비 가장 긴 영상을 만들 수 있습니다. 무료 회원가입 시 15크레딧이 지급됩니다.' },
        { q: 'LTX 2.3으로 어떤 영상을 만들 수 있나요?', a: '제품 소개 영상, 브랜드 스토리 영상, 긴 형식의 광고 콘텐츠 등을 제작할 수 있습니다. 최대 20초까지 지원하여 스토리텔링이 필요한 영상에 특히 적합합니다.' },
        { q: 'LTX 2.3이 오픈소스라는 것은 어떤 의미인가요?', a: 'LTX 2.3은 Lightricks가 오픈소스로 공개한 모델로, 투명한 기술 기반 위에 구축되었습니다. 커뮤니티의 지속적인 개선을 통해 빠르게 발전하고 있으며, gwanggo에서 편리하게 사용할 수 있습니다.' },
      ],
      en: [
        { q: 'What is LTX 2.3?', a: 'LTX 2.3 is an open-source AI video generation model developed by Lightricks. It generates videos at 720p-1080p resolution, up to 20 seconds long. It delivers top-tier quality among open-source models.' },
        { q: 'How much does LTX 2.3 cost in credits?', a: 'It costs 4-5 credits per second. With support for up to 20 seconds, it can create the longest videos compared to other models. New users receive 15 free credits upon signup.' },
        { q: 'What kind of videos can I create with LTX 2.3?', a: 'You can create product showcase videos, brand story videos, long-form ad content, and more. With up to 20-second support, it is especially suited for videos requiring storytelling.' },
        { q: 'What does it mean that LTX 2.3 is open source?', a: 'LTX 2.3 is open-sourced by Lightricks, built on transparent technology. It evolves rapidly through community improvements and is conveniently accessible on gwanggo.' },
      ],
      ja: [
        { q: 'LTX 2.3とは何ですか？', a: 'LTX 2.3はLightricksが開発したオープンソースAI動画生成モデルです。720p〜1080p解像度で最大20秒の動画を生成できます。オープンソースモデルの中でトップクラスの品質を提供します。' },
        { q: 'LTX 2.3のクレジットはいくらですか？', a: '1秒あたり4〜5クレジットが消費されます。最大20秒まで生成可能で、他のモデルと比べて最も長い動画を作れます。新規登録時に15クレジットが無料で付与されます。' },
        { q: 'LTX 2.3でどんな動画が作れますか？', a: '商品紹介動画、ブランドストーリー動画、長尺の広告コンテンツなどを制作できます。最大20秒対応で、ストーリーテリングが必要な動画に特に適しています。' },
        { q: 'LTX 2.3がオープンソースとはどういう意味ですか？', a: 'LTX 2.3はLightricksがオープンソースとして公開したモデルで、透明な技術基盤の上に構築されています。コミュニティの継続的な改善により急速に進化しており、gwanggoで便利に利用できます。' },
      ],
      zh: [
        { q: '什么是LTX 2.3？', a: 'LTX 2.3是Lightricks开发的开源AI视频生成模型。可生成720p~1080p分辨率、最长20秒的视频。在开源模型中提供顶级质量。' },
        { q: 'LTX 2.3需要多少积分？', a: '每秒消耗4~5积分。支持最长20秒，可制作比其他模型更长的视频。新用户注册即送15免费积分。' },
        { q: 'LTX 2.3可以制作什么样的视频？', a: '可以制作产品介绍视频、品牌故事视频、长格式广告内容等。支持最长20秒，特别适合需要叙事的视频。' },
        { q: 'LTX 2.3是开源意味着什么？', a: 'LTX 2.3是Lightricks开源发布的模型，建立在透明的技术基础之上。通过社区持续改进快速发展，可在gwanggo上便捷使用。' },
      ],
    },
    features: {
      ko: ['720p~1080p 고해상도 AI 영상 생성', '최대 20초로 가장 긴 영상 지원', '오픈소스 모델 기반 투명한 기술', '초당 4~5크레딧의 합리적 가격', '스토리텔링 영상 및 브랜드 콘텐츠에 최적화'],
      en: ['High-resolution AI video generation at 720p-1080p', 'Longest video support at up to 20 seconds', 'Transparent technology based on open-source model', 'Affordable at 4-5 credits per second', 'Optimized for storytelling videos and brand content'],
      ja: ['720p〜1080p高解像度AI動画生成', '最大20秒で最長の動画に対応', 'オープンソースモデルベースの透明な技術', '1秒4〜5クレジットの手頃な価格', 'ストーリーテリング動画・ブランドコンテンツに最適化'],
      zh: ['720p~1080p高分辨率AI视频生成', '最长支持20秒视频', '基于开源模型的透明技术', '每秒4~5积分的合理价格', '叙事视频和品牌内容优化'],
    },
  },
}

const commonI18n: Record<Lang, {
  breadcrumbHome: string
  breadcrumbAiTools: string
  breadcrumbVideo: string
  featuresHeading: string
  faqHeading: string
  relatedModelsHeading: string
}> = {
  ko: { breadcrumbHome: '홈', breadcrumbAiTools: 'AI 도구', breadcrumbVideo: '영상 생성', featuresHeading: '주요 기능', faqHeading: '자주 묻는 질문', relatedModelsHeading: '다른 AI 영상 생성 모델' },
  en: { breadcrumbHome: 'Home', breadcrumbAiTools: 'AI Tools', breadcrumbVideo: 'Video Generator', featuresHeading: 'Key Features', faqHeading: 'Frequently Asked Questions', relatedModelsHeading: 'Other AI Video Models' },
  ja: { breadcrumbHome: 'ホーム', breadcrumbAiTools: 'AIツール', breadcrumbVideo: '動画生成', featuresHeading: '主な機能', faqHeading: 'よくある質問', relatedModelsHeading: '他のAI動画生成モデル' },
  zh: { breadcrumbHome: '首页', breadcrumbAiTools: 'AI工具', breadcrumbVideo: '视频生成', featuresHeading: '主要功能', faqHeading: '常见问题', relatedModelsHeading: '其他AI视频生成模型' },
}

interface Props {
  params: Promise<{ language: string; model: string }>
}

export async function generateStaticParams() {
  return validLanguages.flatMap((language) =>
    VIDEO_MODEL_SLUGS.map((model) => ({ language, model }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language, model } = await params

  if (!validLanguages.includes(language as Lang)) return {}
  if (!VIDEO_MODEL_SLUGS.includes(model as ModelSlug)) return {}

  const lang = language as Lang
  const slug = model as ModelSlug
  const m = MODELS[slug]

  const alternateLanguages: Record<string, string> = {}
  validLanguages.forEach((loc) => {
    const langCode = loc === 'ko' ? 'ko-KR' : loc === 'en' ? 'en-US' : loc === 'ja' ? 'ja-JP' : 'zh-CN'
    alternateLanguages[langCode] = `${siteUrl}/dashboard/ai-tools/${loc}/video/${slug}`
  })
  alternateLanguages['x-default'] = `${siteUrl}/dashboard/ai-tools/ko/video/${slug}`

  return {
    title: { absolute: m.title[lang] },
    description: m.description[lang],
    keywords: m.keywords[lang],
    alternates: {
      canonical: `/dashboard/ai-tools/${lang}/video/${slug}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[lang],
      alternateLocale: validLanguages.filter((l) => l !== lang).map((l) => ogLocale[l]),
      title: m.title[lang],
      description: m.description[lang],
      url: `${siteUrl}/dashboard/ai-tools/${lang}/video/${slug}`,
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

export default async function VideoModelPage({ params }: Props) {
  const { language, model } = await params

  if (!validLanguages.includes(language as Lang)) notFound()
  if (!VIDEO_MODEL_SLUGS.includes(model as ModelSlug)) notFound()

  const lang = language as Lang
  const slug = model as ModelSlug
  const m = MODELS[slug]
  const common = commonI18n[lang]

  const jsonLdApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: m.name,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    description: m.jsonLdDescription[lang],
    url: `${siteUrl}/dashboard/ai-tools/${lang}/video/${slug}`,
    creator: { '@type': 'Organization', name: m.creator },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: common.breadcrumbHome, item: `${siteUrl}/dashboard` },
      { '@type': 'ListItem', position: 2, name: common.breadcrumbAiTools },
      { '@type': 'ListItem', position: 3, name: common.breadcrumbVideo, item: `${siteUrl}/dashboard/ai-tools/${lang}/video` },
      { '@type': 'ListItem', position: 4, name: m.name, item: `${siteUrl}/dashboard/ai-tools/${lang}/video/${slug}` },
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

  const seoHeadingI18n: Record<Lang, (name: string) => string> = {
    ko: (name) => `${name} AI 영상 생성 주요 기능 및 사용법`,
    en: (name) => `${name} AI Video Generator Features & Guide`,
    ja: (name) => `${name} AI動画生成の主な機能と使い方`,
    zh: (name) => `${name} AI视频生成主要功能与使用指南`,
  }

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
            <li><Link href={`/dashboard/ai-tools/${lang}/video`} className="hover:text-foreground transition-colors">{common.breadcrumbVideo}</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">{m.name}</li>
          </ol>
        </nav>
        <div>
          <h1 className="text-xl font-bold">{m.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{m.description[lang]}</p>
        </div>
      </div>

      <VideoGenerator initialModel={slug} />

      <section className="mt-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{seoHeadingI18n[lang](m.name)}</h2>
          <p className="text-sm text-muted-foreground mt-1">{m.description[lang]}</p>
        </div>

        <div>
          <h3 className="text-base font-medium text-foreground mb-2">{common.featuresHeading}</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {m.features[lang].map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-base font-medium text-foreground mb-3">{common.faqHeading}</h3>
          <dl className="space-y-4">
            {m.faq[lang].map((f, i) => (
              <div key={i}>
                <dt className="text-sm font-medium text-foreground">{f.q}</dt>
                <dd className="text-sm text-muted-foreground mt-1">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>

        <nav aria-label={common.relatedModelsHeading}>
          <h3 className="text-base font-medium text-foreground mb-2">{common.relatedModelsHeading}</h3>
          <ul className="flex flex-wrap gap-2">
            {VIDEO_MODEL_SLUGS.filter((s) => s !== slug).map((s) => (
              <li key={s}>
                <Link
                  href={`/dashboard/ai-tools/${lang}/video/${s}`}
                  className="inline-block rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  {MODELS[s].name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </>
  )
}
