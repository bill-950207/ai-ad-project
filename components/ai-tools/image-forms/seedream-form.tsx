'use client'

import { useState, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import ImageDropzone from '../image-dropzone'
import { IMAGE_AD_CREDIT_COST, type ImageQuality } from '@/lib/credits/constants'
import { useLanguage } from '@/contexts/language-context'

const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'] as const
const QUALITIES = ['basic', 'high'] as const

interface SeedreamFormData {
  prompt: string
  imageUrl: string
  aspectRatio: typeof ASPECT_RATIOS[number]
  quality: typeof QUALITIES[number]
}

interface SeedreamFormProps {
  onSubmit: (data: SeedreamFormData & { model: 'seedream-4.5' }) => void
  isGenerating: boolean
}

export default function SeedreamForm({ onSubmit, isGenerating }: SeedreamFormProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<typeof ASPECT_RATIOS[number]>('1:1')
  const [quality, setQuality] = useState<typeof QUALITIES[number]>('basic')

  const estimatedCredits = useMemo(() => {
    const mappedQuality: ImageQuality = quality === 'high' ? 'high' : 'medium'
    return IMAGE_AD_CREDIT_COST[mappedQuality]
  }, [quality])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !imageUrl) return

    onSubmit({
      model: 'seedream-4.5',
      prompt: prompt.trim(),
      imageUrl,
      aspectRatio,
      quality,
    })
  }

  const qualityLabels: Record<string, string> = {
    basic: aiToolsT.qualityBasic || '기본',
    high: aiToolsT.qualityHigh || '고화질',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 프롬프트 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.prompt || '프롬프트'} <span className="text-red-400">*</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={aiToolsT.imagePromptPlaceholder || '이미지 편집 지시를 입력하세요...'}
          rows={3}
          className="w-full px-4 py-3 bg-secondary/50 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* 참조 이미지 (필수) */}
      <ImageDropzone
        imageUrl={imageUrl}
        onImageChange={setImageUrl}
        label={aiToolsT.referenceImageRequired || '참조 이미지'}
        required
      />

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

      {/* 화질 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.quality || '화질'}
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
              {qualityLabels[q]} ({IMAGE_AD_CREDIT_COST[q === 'high' ? 'high' : 'medium']} {aiToolsT.credits || '크레딧'})
            </button>
          ))}
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        type="submit"
        disabled={isGenerating || !prompt.trim() || !imageUrl}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
