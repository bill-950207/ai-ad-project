'use client'

import { useState, useCallback, useMemo } from 'react'
import ModelSelector from './model-selector'
import SeedanceForm from './video-forms/seedance-form'
import ViduQ3Form from './video-forms/vidu-q3-form'
import Kling3Form from './video-forms/kling3-form'
import Kling3McForm from './video-forms/kling3-mc-form'
import GrokVideoForm from './video-forms/grok-video-form'
import Wan26Form from './video-forms/wan26-form'
import Veo31Form from './video-forms/veo31-form'
import Hailuo02Form from './video-forms/hailuo02-form'
import Ltx23Form from './video-forms/ltx23-form'
import GenerationHistory from './generation-history'
import type { ActiveGeneration } from './generation-history'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'

interface VideoGeneratorProps {
  initialModel?: string
}

export default function VideoGenerator({ initialModel }: VideoGeneratorProps) {
  const { t, language } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}
  const { refreshCredits } = useCredits()

  const VIDEO_MODELS = useMemo(() => [
    {
      id: 'seedance-1.5-pro',
      name: 'Seedance 1.5 Pro',
      description: aiToolsT.modelDescTextImageToVideo || 'Text/Image to Video',
      creator: 'ByteDance',
      creatorColor: '#0052FF',
      href: `/dashboard/ai-tools/${language}/video/seedance-1.5-pro`,
    },
    {
      id: 'kling-3',
      name: 'Kling 3.0',
      description: aiToolsT.modelDescKling3 || 'Text/Image to Video (Multi-shot)',
      creator: 'Kuaishou',
      creatorColor: '#FF4906',
      href: `/dashboard/ai-tools/${language}/video/kling-3`,
    },
    {
      id: 'kling-3-mc',
      name: 'Kling 3.0 Motion Control',
      description: aiToolsT.modelDescKling3Mc || 'Motion Control Video',
      creator: 'Kuaishou',
      creatorColor: '#FF4906',
      href: `/dashboard/ai-tools/${language}/video/kling-3-mc`,
    },
    {
      id: 'grok-video',
      name: 'Grok Imagine',
      description: aiToolsT.modelDescGrokVideo || 'Text/Image to Video',
      creator: 'xAI',
      creatorColor: '#000000',
      href: `/dashboard/ai-tools/${language}/video/grok-video`,
    },
    {
      id: 'wan-2.6',
      name: 'Wan 2.6',
      description: aiToolsT.modelDescWan26 || 'Text/Image to Video (Cinema)',
      creator: 'Alibaba',
      creatorColor: '#FF6A00',
      href: `/dashboard/ai-tools/${language}/video/wan-2.6`,
    },
    {
      id: 'vidu-q3',
      name: 'Vidu Q3',
      description: aiToolsT.modelDescImageToVideo || 'Image to Video',
      creator: 'Shengshu',
      creatorColor: '#7C3AED',
      href: `/dashboard/ai-tools/${language}/video/vidu-q3`,
    },
    {
      id: 'veo-3.1',
      name: 'Veo 3.1',
      description: aiToolsT.modelDescVeo31 || 'Google AI Video (Audio)',
      creator: 'Google',
      creatorColor: '#4285F4',
      href: `/dashboard/ai-tools/${language}/video/veo-3.1`,
    },
    {
      id: 'hailuo-02',
      name: 'Hailuo-02',
      description: aiToolsT.modelDescHailuo02 || 'MiniMax AI Video',
      creator: 'MiniMax',
      creatorColor: '#10B981',
      href: `/dashboard/ai-tools/${language}/video/hailuo-02`,
    },
    {
      id: 'ltx-2.3',
      name: 'LTX 2.3',
      description: aiToolsT.modelDescLtx23 || 'Lightricks Open Source Video',
      creator: 'Lightricks',
      creatorColor: '#F59E0B',
      href: `/dashboard/ai-tools/${language}/video/ltx-2.3`,
    },
    {
      id: 'seedance-2.0',
      name: 'Seedance 2.0',
      description: aiToolsT.modelDescSeedance2 || 'Multi-modal Audio+Video',
      creator: 'ByteDance',
      creatorColor: '#0052FF',
      comingSoon: true,
    },
  ], [language, aiToolsT.modelDescTextImageToVideo, aiToolsT.modelDescKling3, aiToolsT.modelDescKling3Mc, aiToolsT.modelDescGrokVideo, aiToolsT.modelDescWan26, aiToolsT.modelDescImageToVideo, aiToolsT.modelDescVeo31, aiToolsT.modelDescHailuo02, aiToolsT.modelDescLtx23, aiToolsT.modelDescSeedance2])

  const [selectedModel, setSelectedModel] = useState(initialModel || 'seedance-1.5-pro')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = useCallback(async (data: any) => {
    setIsGenerating(true)

    // 즉시 프로그래스 카드 표시 (API 응답 전)
    const referenceImageUrl = data.imageUrl || data.image || (data.imageUrls?.[0]) || undefined
    setActiveGeneration({
      id: '',
      model: data.model,
      prompt: data.prompt,
      referenceImageUrl,
    })

    try {
      const res = await fetch('/api/ai-tools/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        setActiveGeneration(null)
        if (res.status === 402) {
          alert(error.error || aiToolsT.insufficientCredits || '크레딧이 부족합니다')
        } else {
          alert(error.error || aiToolsT.generateRequestFailed || '생성 요청에 실패했습니다')
        }
        return
      }

      const result = await res.json()
      // ID가 생기면 업데이트 → 폴링 시작
      setActiveGeneration({
        id: result.id,
        model: data.model,
        prompt: data.prompt,
        referenceImageUrl,
      })
      refreshCredits()
    } catch {
      setActiveGeneration(null)
      alert(aiToolsT.networkError || '네트워크 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }, [refreshCredits])

  const handleActiveComplete = useCallback(() => {
    setActiveGeneration(null)
    setRefreshTrigger((v) => v + 1)
  }, [])

  return (
    <div className="space-y-6">
      {/* 2-column layout: Form (left) + History (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr] gap-6">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Model Selector */}
          <ModelSelector
            models={VIDEO_MODELS}
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />

          {/* Form */}
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            {selectedModel === 'seedance-1.5-pro' ? (
              <SeedanceForm
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'kling-3' ? (
              <Kling3Form
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'kling-3-mc' ? (
              <Kling3McForm
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'grok-video' ? (
              <GrokVideoForm
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'wan-2.6' ? (
              <Wan26Form
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'veo-3.1' ? (
              <Veo31Form
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'hailuo-02' ? (
              <Hailuo02Form
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'ltx-2.3' ? (
              <Ltx23Form
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : (
              <ViduQ3Form
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>

        {/* Right: History (with active generation progress) */}
        <div className="min-w-0">
          <GenerationHistory
            type="video"
            refreshTrigger={refreshTrigger}
            activeGeneration={activeGeneration}
            onActiveComplete={handleActiveComplete}
            onRetry={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
