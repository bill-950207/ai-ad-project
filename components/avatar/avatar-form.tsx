/**
 * 아바타 생성 폼 컴포넌트
 *
 * 아바타 생성을 위한 입력 폼을 제공합니다.
 * 두 가지 입력 방식 지원:
 * 1. 옵션 기반: 성별, 나이, 헤어스타일 등 선택
 * 2. 직접 프롬프트: 자유롭게 프롬프트 입력
 */

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'

// ============================================================
// 타입 정의
// ============================================================

/** 컴포넌트 Props */
interface AvatarFormProps {
  onSubmit: (data: { name: string; prompt?: string; options?: AvatarOptions }) => Promise<void>
  isLoading: boolean
}

/** 입력 방식 */
type InputMethod = 'prompt' | 'options'

// ============================================================
// 컴포넌트
// ============================================================

export function AvatarForm({ onSubmit, isLoading }: AvatarFormProps) {
  const { t } = useLanguage()

  // 폼 상태
  const [name, setName] = useState('')                           // 아바타 이름
  const [inputMethod, setInputMethod] = useState<InputMethod>('options')  // 입력 방식
  const [prompt, setPrompt] = useState('')                       // 직접 프롬프트
  const [options, setOptions] = useState<AvatarOptions>({})      // 옵션 객체

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (inputMethod === 'prompt') {
      await onSubmit({ name, prompt })
    } else {
      await onSubmit({ name, options })
    }
  }

  /**
   * 옵션 값 업데이트 헬퍼
   */
  const updateOption = <K extends keyof AvatarOptions>(key: K, value: AvatarOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  /**
   * 옵션 라벨 텍스트 가져오기
   */
  const getOptionLabel = (key: string): string => {
    return (t.avatar.options as Record<string, string>)?.[key] || key
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 아바타 이름 입력 */}
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

      {/* 입력 방식 선택 토글 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t.avatar.inputMethod}
        </label>
        <div className="flex gap-2">
          {/* 옵션 선택 방식 */}
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
          {/* 직접 입력 방식 */}
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
        /* 직접 프롬프트 입력 영역 */
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
        /* 옵션 기반 입력 영역 */
        <div className="space-y-6">
          {/* 기본 정보 섹션 */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t.avatar.basicInfo}</h3>

            {/* 성별 선택 */}
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

            {/* 나이대 선택 */}
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

            {/* 인종 선택 */}
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

          {/* 체형 섹션 */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t.avatar.bodyInfo}</h3>

            {/* 키 선택 */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.height}</label>
              <div className="flex gap-2 flex-wrap">
                {(['short', 'average', 'tall'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('height', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.height === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(`height${v.charAt(0).toUpperCase() + v.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* 체형 선택 */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.bodyType}</label>
              <div className="flex gap-2 flex-wrap">
                {(['slim', 'average', 'athletic', 'curvy'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('bodyType', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.bodyType === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(`body${v.charAt(0).toUpperCase() + v.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 외모 섹션 */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t.avatar.appearance}</h3>

            {/* 헤어스타일 선택 */}
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

            {/* 머리 색상 선택 */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.hairColor}</label>
              <div className="flex gap-2 flex-wrap items-center">
                {(['blackhair', 'brown', 'blonde', 'custom'] as const).map((v) => (
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
                {/* 커스텀 색상 입력 */}
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

            {/* 분위기/느낌 선택 */}
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

          {/* 의상 섹션 */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t.avatar.outfit}</h3>

            {/* 의상 스타일 선택 */}
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

            {/* 색상 톤 선택 */}
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
                {/* 브랜드 색상 입력 */}
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

          {/* 배경 및 포즈 섹션 */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t.avatar.backgroundPose || '배경 및 포즈'}</h3>

            {/* 배경 선택 */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.background || '배경'}</label>
              <div className="flex gap-2 flex-wrap">
                {(['studio', 'home', 'office', 'outdoor', 'cafe'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('background', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.background === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(`bg${v.charAt(0).toUpperCase() + v.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* 포즈 선택 */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t.avatar.pose || '포즈'}</label>
              <div className="flex gap-2 flex-wrap">
                {(['model', 'natural', 'casual', 'working'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateOption('pose', v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      options.pose === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getOptionLabel(`pose${v.charAt(0).toUpperCase() + v.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 제출 버튼 */}
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
