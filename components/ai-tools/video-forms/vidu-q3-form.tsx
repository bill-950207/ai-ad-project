'use client'

import { useState, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import ImageDropzone from '../image-dropzone'
import { VIDU_CREDIT_COST_PER_SECOND } from '@/lib/credits/constants'
import { useLanguage } from '@/contexts/language-context'

const RESOLUTIONS = ['540p', '720p', '1080p'] as const
const MOVEMENT_AMPLITUDES = ['auto', 'small', 'medium', 'large'] as const

interface ViduQ3FormData {
  prompt: string
  image: string
  resolution: typeof RESOLUTIONS[number]
  duration: number
  generateAudio: boolean
  movementAmplitude: typeof MOVEMENT_AMPLITUDES[number]
}

interface ViduQ3FormProps {
  onSubmit: (data: ViduQ3FormData & { model: 'vidu-q3' }) => void
  isGenerating: boolean
}

export default function ViduQ3Form({ onSubmit, isGenerating }: ViduQ3FormProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [resolution, setResolution] = useState<typeof RESOLUTIONS[number]>('720p')
  const [duration, setDuration] = useState(5)
  const [generateAudio, setGenerateAudio] = useState(false)
  const [movementAmplitude, setMovementAmplitude] = useState<typeof MOVEMENT_AMPLITUDES[number]>('auto')

  const estimatedCredits = useMemo(() => {
    return VIDU_CREDIT_COST_PER_SECOND[resolution] * duration
  }, [resolution, duration])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !imageUrl) return

    onSubmit({
      model: 'vidu-q3',
      prompt: prompt.trim(),
      image: imageUrl,
      resolution,
      duration,
      generateAudio,
      movementAmplitude,
    })
  }

  const movementLabels: Record<string, string> = {
    auto: aiToolsT.movementAuto || 'Auto',
    small: aiToolsT.movementSmall || '작음',
    medium: aiToolsT.movementMedium || '보통',
    large: aiToolsT.movementLarge || '큼',
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

      {/* 시작 이미지 (필수) */}
      <ImageDropzone
        imageUrl={imageUrl}
        onImageChange={setImageUrl}
        label={aiToolsT.startImage || '시작 이미지'}
        required
      />

      {/* 해상도 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.resolution || '해상도'}
        </label>
        <div className="flex gap-2">
          {RESOLUTIONS.map((res) => (
            <button
              key={res}
              type="button"
              onClick={() => setResolution(res)}
              disabled={isGenerating}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                resolution === res
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* 영상 길이 슬라이더 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.duration || '길이'}: {duration}s
        </label>
        <input
          type="range"
          min={1}
          max={16}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          disabled={isGenerating}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1s</span>
          <span>16s</span>
        </div>
      </div>

      {/* 움직임 강도 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.movementAmplitude || '움직임 강도'}
        </label>
        <div className="flex gap-2">
          {MOVEMENT_AMPLITUDES.map((amp) => (
            <button
              key={amp}
              type="button"
              onClick={() => setMovementAmplitude(amp)}
              disabled={isGenerating}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                movementAmplitude === amp
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {movementLabels[amp]}
            </button>
          ))}
        </div>
      </div>

      {/* 오디오 */}
      <div className="flex items-center justify-between py-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.generateAudio || '오디오 생성'}
        </label>
        <button
          type="button"
          onClick={() => setGenerateAudio(!generateAudio)}
          disabled={isGenerating}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            generateAudio ? 'bg-primary' : 'bg-secondary'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              generateAudio ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 생성 버튼 */}
      <button
        type="submit"
        disabled={isGenerating || !prompt.trim() || !imageUrl}
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
