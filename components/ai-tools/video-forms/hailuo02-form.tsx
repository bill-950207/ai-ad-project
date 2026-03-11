'use client'

import { useState, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import ImageDropzone from '../image-dropzone'
import { HAILUO02_CREDIT_PER_SECOND } from '@/lib/credits/constants'
import { useLanguage } from '@/contexts/language-context'

const TIERS = ['standard', 'pro'] as const
const STANDARD_DURATIONS = [6, 10] as const

const TIER_RESOLUTION: Record<typeof TIERS[number], '768p' | '1080p'> = {
  standard: '768p',
  pro: '1080p',
}

interface Hailuo02FormProps {
  onSubmit: (data: {
    model: 'hailuo-02'
    prompt: string
    imageUrl?: string
    duration: number
    resolution: '768p' | '1080p'
  }) => void
  isGenerating: boolean
}

export default function Hailuo02Form({ onSubmit, isGenerating }: Hailuo02FormProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [tier, setTier] = useState<typeof TIERS[number]>('standard')
  const [duration, setDuration] = useState<typeof STANDARD_DURATIONS[number]>(6)

  const resolution = TIER_RESOLUTION[tier]

  const estimatedCredits = useMemo(() => {
    // Pro tier has no duration control, assume ~6s output
    const dur = tier === 'pro' ? 6 : duration
    return HAILUO02_CREDIT_PER_SECOND[resolution] * dur
  }, [resolution, duration, tier])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    onSubmit({
      model: 'hailuo-02',
      prompt: prompt.trim(),
      ...(imageUrl && { imageUrl }),
      duration: tier === 'pro' ? 6 : duration, // Pro has no duration control
      resolution,
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
          placeholder={aiToolsT.promptPlaceholder || '생성할 영상을 설명하세요...'}
          rows={3}
          className="w-full px-3 py-2.5 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* 참조 이미지 (선택) */}
      <ImageDropzone
        imageUrl={imageUrl}
        onImageChange={setImageUrl}
        label={aiToolsT.referenceImage || '참조 이미지 (선택)'}
      />

      {/* 품질 티어 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.quality || '품질'}
        </label>
        <div className="flex gap-2">
          {TIERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              disabled={isGenerating}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                tier === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {t === 'standard' ? `${aiToolsT.tierStandard || 'Standard'} (${TIER_RESOLUTION.standard})` : `${aiToolsT.tierPro || 'Pro'} (${TIER_RESOLUTION.pro})`}
            </button>
          ))}
        </div>
      </div>

      {/* 길이 (Standard only — Pro has no duration control) */}
      {tier === 'standard' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {aiToolsT.duration || '길이'}
          </label>
          <div className="flex gap-2">
            {STANDARD_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                disabled={isGenerating}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  duration === d
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      )}

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
