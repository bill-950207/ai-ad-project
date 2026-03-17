'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight, Wand2, Clock, Layers } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import GenerationHistory from './generation-history'

export default function TrendingGenerator() {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  return (
    <div className="space-y-8">
      {/* 히어로 카드 */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/40 via-background to-background">
        {/* 배경 그라디언트 장식 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl" />

        <div className="relative p-6 sm:p-8 space-y-6">
          {/* 배지 + 제목 */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/15 border border-violet-500/20 rounded-full">
              <Wand2 className="w-3 h-3 text-violet-400" />
              <span className="text-[11px] font-medium text-violet-300">AI Motion Control</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {aiToolsT.faceTransform || '모션 컨트롤'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {aiToolsT.modelDescFaceTransform || '영상 속 인물을 다른 사람으로 변환합니다. 타임라인 에디터에서 변환 구간을 자유롭게 설정하세요.'}
            </p>
          </div>

          {/* 스펙 태그 */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg">
              <Layers className="w-3 h-3 text-white/40" />
              <span className="text-[11px] text-white/50">Kling 3.0 MC</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg">
              <Sparkles className="w-3 h-3 text-white/40" />
              <span className="text-[11px] text-white/50">Standard 6cr/s · Pro 8cr/s</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg">
              <Clock className="w-3 h-3 text-white/40" />
              <span className="text-[11px] text-white/50">{aiToolsT.minimumDuration || '최소 3초'}</span>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/face-transform"
            className="group inline-flex items-center gap-2.5 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            {aiToolsT.openEditor || '에디터 열기'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* 히스토리 */}
      <GenerationHistory
        type="trending"
        refreshTrigger={0}
      />
    </div>
  )
}
