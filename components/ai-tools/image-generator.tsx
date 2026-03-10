'use client'

import { useState, useCallback, useMemo } from 'react'
import ModelSelector from './model-selector'
import SeedreamForm from './image-forms/seedream-form'
import ZImageForm from './image-forms/z-image-form'
import Flux2ProForm from './image-forms/flux2-pro-form'
import GrokImageForm from './image-forms/grok-image-form'
import NanoBanana2Form from './image-forms/nano-banana2-form'
import GenerationHistory from './generation-history'
import type { ActiveGeneration } from './generation-history'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'

interface ImageGeneratorProps {
  initialModel?: string
}

export default function ImageGenerator({ initialModel }: ImageGeneratorProps) {
  const { t, language } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}
  const { refreshCredits } = useCredits()

  const IMAGE_MODELS = useMemo(() => [
    {
      id: 'seedream-5',
      name: 'Seedream 5',
      description: aiToolsT.modelDescImageEdit || 'Image Edit / Text to Image',
      creator: 'ByteDance',
      creatorColor: '#0052FF',
      href: `/dashboard/ai-tools/${language}/image/seedream-5`,
    },
    {
      id: 'flux-2-pro',
      name: 'FLUX.2 Pro',
      description: aiToolsT.modelDescFlux2Pro || 'Text to Image (High Quality)',
      creator: 'BFL',
      creatorColor: '#1F2937',
      href: `/dashboard/ai-tools/${language}/image/flux-2-pro`,
    },
    {
      id: 'grok-image',
      name: 'Grok Imagine',
      description: aiToolsT.modelDescGrokImage || 'Text to Image',
      creator: 'xAI',
      creatorColor: '#000000',
      href: `/dashboard/ai-tools/${language}/image/grok-image`,
    },
    {
      id: 'z-image',
      name: 'Z-Image',
      description: aiToolsT.modelDescTextToImage || 'Text to Image',
      creator: 'gwanggo',
      creatorColor: '#8B5CF6',
      href: `/dashboard/ai-tools/${language}/image/z-image`,
    },
    {
      id: 'nano-banana-2',
      name: 'Nano Banana 2',
      description: aiToolsT.modelDescNanoBanana2 || 'Google Gemini Image (4K)',
      creator: 'Google',
      creatorColor: '#4285F4',
      href: `/dashboard/ai-tools/${language}/image/nano-banana-2`,
    },
  ], [language, aiToolsT.modelDescImageEdit, aiToolsT.modelDescFlux2Pro, aiToolsT.modelDescGrokImage, aiToolsT.modelDescTextToImage, aiToolsT.modelDescNanoBanana2])

  const [selectedModel, setSelectedModel] = useState(initialModel || 'seedream-5')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = useCallback(async (data: any) => {
    setIsGenerating(true)

    // 즉시 프로그래스 카드 표시 (API 응답 전)
    setActiveGeneration({
      id: '',
      model: data.model,
      prompt: data.prompt,
      referenceImageUrl: data.imageUrl,
    })

    try {
      const res = await fetch('/api/ai-tools/image/generate', {
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
        referenceImageUrl: data.imageUrl,
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
            ) : selectedModel === 'flux-2-pro' ? (
              <Flux2ProForm
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'grok-image' ? (
              <GrokImageForm
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
              />
            ) : selectedModel === 'nano-banana-2' ? (
              <NanoBanana2Form
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
            onRetry={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
