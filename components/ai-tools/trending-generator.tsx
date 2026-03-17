'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'
import ModelSelector, { type Model } from './model-selector'
import GenerationHistory from './generation-history'

// ============================================================
// 모델 정의
// ============================================================

const TRENDING_MODELS: Model[] = [
  {
    id: 'face-transform',
    name: '얼굴 변환',
    description: 'AI Face Transform',
    creator: 'Kling',
    creatorColor: '#7C3AED',
  },
]

// ============================================================
// 컴포넌트
// ============================================================

export default function TrendingGenerator() {
  const { t, language } = useLanguage()
  const { refreshCredits } = useCredits()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}
  const [selectedModel, setSelectedModel] = useState('face-transform')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-6">
      {/* 좌측: 모델 선택 + 에디터 진입 */}
      <div className="space-y-6">
        {/* 모델 선택 */}
        <ModelSelector
          models={TRENDING_MODELS}
          selectedModel={selectedModel}
          onSelect={setSelectedModel}
        />

        {/* 도구 설명 + CTA */}
        <div className="p-6 rounded-2xl border border-border/50 bg-card/50 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                {aiToolsT.faceTransform || '얼굴 변환'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {aiToolsT.modelDescFaceTransform || '영상 속 인물을 다른 사람으로 변환'}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{aiToolsT.faceTransformDesc1 || '원본 영상을 업로드하고, 타임라인에서 변환 구간을 설정하세요.'}</p>
            <p>{aiToolsT.faceTransformDesc2 || '각 구간마다 다른 사람의 사진을 지정하여 멀티 변환도 가능합니다.'}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-secondary/50 rounded-md">Kling 3.0 Motion Control</span>
            <span className="px-2 py-1 bg-secondary/50 rounded-md">Standard 6cr/s · Pro 8cr/s</span>
            <span className="px-2 py-1 bg-secondary/50 rounded-md">{aiToolsT.minimumDuration || '최소 3초'}</span>
          </div>

          <Link
            href="/face-transform"
            className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-primary to-purple-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            {aiToolsT.openEditor || '에디터 열기'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 우측: 히스토리 */}
      <div>
        <GenerationHistory
          type="trending"
          refreshTrigger={0}
        />
      </div>
    </div>
  )
}
