'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'

interface AvatarFormProps {
  onSubmit: (data: { name: string; prompt?: string; options?: AvatarOptions }) => Promise<void>
  isLoading: boolean
}

type InputMethod = 'prompt' | 'options'

export function AvatarForm({ onSubmit, isLoading }: AvatarFormProps) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [inputMethod, setInputMethod] = useState<InputMethod>('options')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<AvatarOptions>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMethod === 'prompt') {
      await onSubmit({ name, prompt })
    } else {
      await onSubmit({ name, options })
    }
  }

  const updateOption = <K extends keyof AvatarOptions>(key: K, value: AvatarOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const getOptionLabel = (key: string): string => {
    return (t.avatar.options as Record<string, string>)?.[key] || key
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t.avatar.name}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.avatar.namePlaceholder}
          required
          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Input Method Toggle */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t.avatar.inputMethod}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputMethod('options')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputMethod === 'options'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-foreground hover:bg-secondary'
            }`}
          >
            {t.avatar.useOptions}
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('prompt')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputMethod === 'prompt'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-foreground hover:bg-secondary'
            }`}
          >
            {t.avatar.directPrompt}
          </button>
        </div>
      </div>

      {inputMethod === 'prompt' ? (
        /* Direct Prompt Input */
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t.avatar.prompt}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.avatar.promptPlaceholder}
            rows={4}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
      ) : (
        /* Options-based Input */
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t.avatar.basicInfo}</h3>

            {/* Gender */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.gender}</label>
              <div className="flex gap-2 flex-wrap">
                {(['female', 'male', 'nonbinary'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('gender', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.gender === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.age}</label>
              <div className="flex gap-2 flex-wrap">
                {(['teen', 'early20s', 'late20s', '30s', '40plus'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('age', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.age === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Ethnicity */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.ethnicity}</label>
              <div className="flex gap-2 flex-wrap">
                {(['korean', 'eastAsian', 'western', 'southeastAsian', 'black', 'hispanic', 'mixed'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('ethnicity', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.ethnicity === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(v)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t.avatar.appearance}</h3>

            {/* Hair Style */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.hairStyle}</label>
              <div className="flex gap-2 flex-wrap">
                {(['longStraight', 'bob', 'wavy', 'ponytail', 'short'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('hairStyle', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.hairStyle === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.hairColor}</label>
              <div className="flex gap-2 flex-wrap items-center">
                {(['black', 'brown', 'blonde', 'custom'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('hairColor', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.hairColor === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(v)}
                  </button>
                ))}
                {options.hairColor === 'custom' && (
                  <input
                    type="text"
                    value={options.customHairColor || ''}
                    onChange={(e) => updateOption('customHairColor', e.target.value)}
                    placeholder={t.avatar.customHairColor}
                    className="px-3 py-1.5 bg-secondary/50 border border-border rounded-md text-sm w-32"
                  />
                )}
              </div>
            </div>

            {/* Vibe */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.vibe}</label>
              <div className="flex gap-2 flex-wrap">
                {(['natural', 'sophisticated', 'cute', 'professional'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('vibe', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.vibe === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(v)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Outfit Section */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t.avatar.outfit}</h3>

            {/* Outfit Style */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.outfitStyle}</label>
              <div className="flex gap-2 flex-wrap">
                {(['casual', 'office', 'sporty', 'homewear'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('outfitStyle', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.outfitStyle === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Tone */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.colorTone}</label>
              <div className="flex gap-2 flex-wrap items-center">
                {(['light', 'dark', 'neutral', 'brandColor'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('colorTone', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.colorTone === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(v)}
                  </button>
                ))}
                {options.colorTone === 'brandColor' && (
                  <input
                    type="text"
                    value={options.brandColorHex || ''}
                    onChange={(e) => updateOption('brandColorHex', e.target.value)}
                    placeholder="#FF5733"
                    className="px-3 py-1.5 bg-secondary/50 border border-border rounded-md text-sm w-28"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !name.trim() || (inputMethod === 'prompt' && !prompt.trim())}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t.avatar.generating : t.avatar.generate}
      </button>
    </form>
  )
}
