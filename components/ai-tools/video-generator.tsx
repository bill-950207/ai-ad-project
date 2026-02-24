'use client'

import { useState, useCallback } from 'react'
import ModelSelector from './model-selector'
import SeedanceForm from './video-forms/seedance-form'
import ViduQ3Form from './video-forms/vidu-q3-form'
import GenerationResult from './generation-result'
import GenerationHistory from './generation-history'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'

const VIDEO_MODELS = [
  {
    id: 'seedance-1.5-pro',
    name: 'Seedance 1.5 Pro',
    description: 'BytePlus | Text/Image to Video',
  },
  {
    id: 'vidu-q3',
    name: 'Vidu Q3',
    description: 'WaveSpeed | Image to Video',
  },
]

export default function VideoGenerator() {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}
  const { refreshCredits } = useCredits()

  const [selectedModel, setSelectedModel] = useState('seedance-1.5-pro')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = useCallback(async (data: any) => {
    setIsGenerating(true)
    setGenerationId(null)

    try {
      const res = await fetch('/api/ai-tools/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        if (res.status === 402) {
          alert(error.error || '크레딧이 부족합니다')
        } else {
          alert(error.error || '생성 요청에 실패했습니다')
        }
        return
      }

      const result = await res.json()
      setGenerationId(result.id)
      refreshCredits()
    } catch {
      alert('네트워크 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }, [refreshCredits])

  const handleComplete = useCallback(() => {
    setRefreshTrigger((v) => v + 1)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {aiToolsT.videoTitle || 'AI 영상 생성'}
        </h1>
        <p className="text-muted-foreground">
          {aiToolsT.videoDescription || 'AI 모델을 선택하고 영상을 생성하세요'}
        </p>
      </div>

      {/* 2-column layout: Form (left) + History (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr] gap-6">
        {/* Left: Form + Result */}
        <div className="space-y-5">
          {/* Model Selector */}
          <ModelSelector
            models={VIDEO_MODELS}
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />

          {/* Form */}
          <div className="bg-card border border-border/80 rounded-2xl p-5">
            {selectedModel === 'seedance-1.5-pro' ? (
              <SeedanceForm
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

          {/* Result */}
          <GenerationResult
            generationId={generationId}
            type="video"
            onComplete={handleComplete}
          />
        </div>

        {/* Right: History */}
        <div className="min-w-0">
          <GenerationHistory
            type="video"
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  )
}
