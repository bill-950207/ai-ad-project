'use client'

import { useState, useCallback } from 'react'
import ModelSelector from './model-selector'
import SeedreamForm from './image-forms/seedream-form'
import ZImageForm from './image-forms/z-image-form'
import GenerationHistory from './generation-history'
import type { ActiveGeneration } from './generation-history'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'

const IMAGE_MODELS = [
  {
    id: 'seedream-5',
    name: 'Seedream 5',
    description: 'Image Edit / Text to Image',
  },
  {
    id: 'z-image',
    name: 'Z-Image',
    description: 'Text to Image',
  },
]

export default function ImageGenerator() {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}
  const { refreshCredits } = useCredits()

  const [selectedModel, setSelectedModel] = useState('seedream-5')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = useCallback(async (data: any) => {
    setIsGenerating(true)
    setActiveGeneration(null)

    try {
      const res = await fetch('/api/ai-tools/image/generate', {
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
      setActiveGeneration({
        id: result.id,
        model: data.model,
        prompt: data.prompt,
        referenceImageUrl: data.imageUrl,
      })
      refreshCredits()
    } catch {
      alert('네트워크 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }, [refreshCredits])

  const handleActiveComplete = useCallback(() => {
    setRefreshTrigger((v) => v + 1)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {aiToolsT.imageTitle || 'AI 이미지 생성'}
        </h1>
        <p className="text-muted-foreground">
          {aiToolsT.imageDescription || 'AI 모델을 선택하고 이미지를 생성하세요'}
        </p>
      </div>

      {/* 2-column layout: Form (left) + History (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr] gap-6">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Model Selector */}
          <ModelSelector
            models={IMAGE_MODELS}
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />

          {/* Form */}
          <div className="bg-card border border-border/80 rounded-2xl p-5">
            {selectedModel === 'seedream-5' ? (
              <SeedreamForm
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : (
              <ZImageForm
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>

        {/* Right: History (with active generation progress) */}
        <div className="min-w-0">
          <GenerationHistory
            type="image"
            refreshTrigger={refreshTrigger}
            activeGeneration={activeGeneration}
            onActiveComplete={handleActiveComplete}
          />
        </div>
      </div>
    </div>
  )
}
