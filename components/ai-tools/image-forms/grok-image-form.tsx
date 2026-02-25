'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { GROK_IMAGE_CREDIT_COST } from '@/lib/credits/constants'
import { useLanguage } from '@/contexts/language-context'

const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'] as const

interface GrokImageFormProps {
  onSubmit: (data: {
    model: 'grok-image'
    prompt: string
    aspectRatio: typeof ASPECT_RATIOS[number]
  }) => void
  isGenerating: boolean
}

export const GROK_ASPECT_RATIO_SIZES: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576, height: 1024 },
}

export default function GrokImageForm({ onSubmit, isGenerating }: GrokImageFormProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<typeof ASPECT_RATIOS[number]>('1:1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    onSubmit({
      model: 'grok-image',
      prompt: prompt.trim(),
      aspectRatio,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 프롬프트 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.prompt || '프롬프트'} <span className="text-red-400">*</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={aiToolsT.textToImagePlaceholder || '생성할 이미지를 설명하세요...'}
          rows={3}
          className="w-full px-3 py-2.5 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* 화면 비율 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.aspectRatio || '화면 비율'}
        </label>
        <div className="flex flex-wrap gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => setAspectRatio(ratio)}
              disabled={isGenerating}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                aspectRatio === ratio
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        type="submit"
        disabled={isGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-purple-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating
          ? (aiToolsT.generating || '생성 중...')
          : `${aiToolsT.generate || '생성하기'} (${GROK_IMAGE_CREDIT_COST} ${aiToolsT.credits || '크레딧'})`
        }
      </button>
    </form>
  )
}
