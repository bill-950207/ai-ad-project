'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import GenerationHistory from './generation-history'

export default function TrendingGenerator() {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  return (
    <div className="space-y-6">
      {/* 에디터 진입 CTA */}
      <Link
        href="/face-transform"
        className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-gradient-to-r from-primary to-purple-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
      >
        <Sparkles className="w-4 h-4" />
        {aiToolsT.faceTransform || '얼굴 변환'} — {aiToolsT.openEditor || '에디터 열기'}
        <ArrowRight className="w-4 h-4" />
      </Link>

      {/* 히스토리 */}
      <GenerationHistory
        type="trending"
        refreshTrigger={0}
      />
    </div>
  )
}
