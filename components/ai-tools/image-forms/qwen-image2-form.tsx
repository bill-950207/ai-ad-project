'use client'

import { useState, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import ImageDropzone from '../image-dropzone'
import { QWEN_IMAGE2_CREDIT_COST } from '@/lib/credits/constants'
import { useLanguage } from '@/contexts/language-context'

const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'] as const
const QUALITIES = ['basic', 'pro'] as const

interface QwenImage2FormProps {
  onSubmit: (data: {
    model: 'qwen-image-2'
    prompt: string
    imageUrl?: string
    aspectRatio: typeof ASPECT_RATIOS[number]
    quality: typeof QUALITIES[number]
  }) => void
  isGenerating: boolean
}

export default function QwenImage2Form({ onSubmit, isGenerating }: QwenImage2FormProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<typeof ASPECT_RATIOS[number]>('1:1')
  const [quality, setQuality] = useState<typeof QUALITIES[number]>('basic')

  const estimatedCredits = useMemo(() => {
    return QWEN_IMAGE2_CREDIT_COST[quality]
  }, [quality])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    onSubmit({
      model: 'qwen-image-2',
      prompt: prompt.trim(),
      ...(imageUrl && { imageUrl }),
      aspectRatio,
      quality,
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

      {/* 참조 이미지 (선택 → edit 모드) */}
      <ImageDropzone
        imageUrl={imageUrl}
        onImageChange={setImageUrl}
        label={aiToolsT.referenceImage || '참조 이미지 (선택)'}
      />

      {/* 화면 비율 + 품질 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {aiToolsT.aspectRatio || '화면 비율'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatio(ratio)}
                disabled={isGenerating}
                className={`px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {aiToolsT.quality || '품질'}
          </label>
          <div className="flex gap-2">
            {QUALITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                disabled={isGenerating}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  quality === q
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {q === 'basic' ? (aiToolsT.qualityBasic || 'Basic') : (aiToolsT.qualityPro || 'Pro')}
              </button>
            ))}
          </div>
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
          : `${aiToolsT.generate || '생성하기'} (${estimatedCredits} ${aiToolsT.credits || '크레딧'})`
        }
      </button>
    </form>
  )
}
