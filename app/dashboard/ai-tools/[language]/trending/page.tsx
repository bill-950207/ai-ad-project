import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import TrendingGenerator from '@/components/ai-tools/trending-generator'

const validLanguages = ['ko', 'en', 'ja', 'zh'] as const
type Lang = (typeof validLanguages)[number]

const i18n: Record<Lang, { title: string; description: string }> = {
  ko: {
    title: '트렌딩 도구 - AI 얼굴 변환 | gwanggo',
    description: 'AI 얼굴 변환 도구로 영상 속 인물을 다른 사람으로 변환하세요. Kling 3.0 Motion Control 기반.',
  },
  en: {
    title: 'Trending Tools - AI Face Transform | gwanggo',
    description: 'Transform faces in videos with AI Face Transform. Powered by Kling 3.0 Motion Control.',
  },
  ja: {
    title: 'トレンドツール - AI顔変換 | gwanggo',
    description: 'AI顔変換ツールで動画の人物を別の人に変換。Kling 3.0 Motion Control搭載。',
  },
  zh: {
    title: '热门工具 - AI换脸 | gwanggo',
    description: '使用AI换脸工具将视频中的人物转换为其他人。基于Kling 3.0 Motion Control。',
  },
}

export async function generateStaticParams() {
  return validLanguages.map((language) => ({ language }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>
}): Promise<Metadata> {
  const { language } = await params
  if (!validLanguages.includes(language as Lang)) return {}
  const lang = language as Lang
  const data = i18n[lang]

  return {
    title: data.title,
    description: data.description,
  }
}

export default async function TrendingPage({
  params,
}: {
  params: Promise<{ language: string }>
}) {
  const { language } = await params
  if (!validLanguages.includes(language as Lang)) notFound()

  return (
    <div className="space-y-6">
      <TrendingGenerator />
    </div>
  )
}
