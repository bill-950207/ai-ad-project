'use client'

import { useState, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import ImageDropzone from '../image-dropzone'
import VideoDropzone from '../video-dropzone'
import { KLING3_MC_STD_CREDIT_PER_SECOND, KLING3_MC_PRO_CREDIT_PER_SECOND } from '@/lib/credits/constants'
import { useLanguage } from '@/contexts/language-context'

const TIERS = ['standard', 'pro'] as const
const CHARACTER_ORIENTATIONS = ['image', 'video'] as const

interface Kling3McFormProps {
  onSubmit: (data: {
    model: 'kling-3-mc'
    prompt: string
    imageUrl: string
    videoUrl: string
    tier: typeof TIERS[number]
    characterOrientation: typeof CHARACTER_ORIENTATIONS[number]
    keepOriginalSound: boolean
  }) => void
  isGenerating: boolean
}

export default function Kling3McForm({ onSubmit, isGenerating }: Kling3McFormProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [tier, setTier] = useState<typeof TIERS[number]>('standard')
  const [characterOrientation, setCharacterOrientation] = useState<typeof CHARACTER_ORIENTATIONS[number]>('video')
  const [keepOriginalSound, setKeepOriginalSound] = useState(true)

  // Motion control output is ~5 seconds (determined by reference video)
  const estimatedCredits = useMemo(() => {
    const perSecond = tier === 'pro'
      ? KLING3_MC_PRO_CREDIT_PER_SECOND['720p']
      : KLING3_MC_STD_CREDIT_PER_SECOND['720p']
    return perSecond * 5
  }, [tier])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !imageUrl || !videoUrl) return

    onSubmit({
      model: 'kling-3-mc',
      prompt: prompt.trim(),
      imageUrl,
      videoUrl,
      tier,
      characterOrientation,
      keepOriginalSound,
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
          placeholder={aiToolsT.kling3McPromptPlaceholder || '캐릭터 동작과 장면을 설명하세요...'}
          rows={3}
          className="w-full px-3 py-2.5 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* 참조 이미지 (필수) + 참조 영상 (필수) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImageDropzone
          imageUrl={imageUrl}
          onImageChange={setImageUrl}
          label={aiToolsT.referenceImageRequired || '참조 이미지 (캐릭터/배경)'}
          required
        />
        <VideoDropzone
          videoUrl={videoUrl}
          onVideoChange={setVideoUrl}
          label={aiToolsT.referenceVideoRequired || '참조 영상 (모션)'}
          required
        />
      </div>

      {/* 캐릭터 기준 (Character Orientation) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {aiToolsT.characterOrientation || '캐릭터 기준'}
        </label>
        <p className="text-xs text-muted-foreground">
          {aiToolsT.characterOrientationDesc || '생성 영상의 캐릭터 외형을 이미지/영상 중 어디에서 참조할지 선택합니다'}
        </p>
        <div className="flex gap-2">
          {CHARACTER_ORIENTATIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setCharacterOrientation(o)}
              disabled={isGenerating}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                characterOrientation === o
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {o === 'image'
                ? (aiToolsT.fromImage || '이미지 기준')
                : (aiToolsT.fromVideo || '영상 기준')
              }
            </button>
          ))}
        </div>
      </div>

      {/* 티어 선택 + 원본 오디오 유지 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 티어 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {aiToolsT.tier || '모델 등급'}
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
                {t === 'standard' ? (aiToolsT.tierStandard || 'Standard') : (aiToolsT.tierPro || 'Pro')}
              </button>
            ))}
          </div>
        </div>

        {/* 원본 오디오 유지 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {aiToolsT.keepOriginalSound || '원본 오디오 유지'}
          </label>
          <button
            type="button"
            onClick={() => setKeepOriginalSound(!keepOriginalSound)}
            disabled={isGenerating}
            className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
              keepOriginalSound
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {keepOriginalSound
              ? (aiToolsT.on || 'ON')
              : (aiToolsT.off || 'OFF')
            }
          </button>
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        type="submit"
        disabled={isGenerating || !prompt.trim() || !imageUrl || !videoUrl}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-purple-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating
          ? (aiToolsT.generating || '생성 중...')
          : `${aiToolsT.generate || '생성하기'} (~${estimatedCredits} ${aiToolsT.credits || '크레딧'})`
        }
      </button>
    </form>
  )
}
