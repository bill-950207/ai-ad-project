/**
 * 아바타 생성 폼 컴포넌트
 *
 * 스텝 기반 UI로 아바타 생성 옵션을 선택합니다.
 * Step 1: 기본 정보 (성별, 나이, 인종)
 * Step 2: 외모 (체형, 헤어)
 * Step 3: 스타일 (의상, 배경)
 */

'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'
import {
  Palette,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react'

// ============================================================
// 타입 정의
// ============================================================

interface AvatarFormProps {
  onSubmit: (data: { name: string; prompt?: string; options?: AvatarOptions }) => Promise<void>
  isLoading: boolean
}

type InputMethod = 'prompt' | 'options'

interface OptionButtonProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

interface OptionItem {
  value: string
  labelKey: string
}

// ============================================================
// 옵션 정의 (값과 번역 키 매핑)
// ============================================================

const genderOptionKeys: OptionItem[] = [
  { value: 'female', labelKey: 'female' },
  { value: 'male', labelKey: 'male' },
]

const ageOptionKeys: OptionItem[] = [
  { value: 'teen', labelKey: 'teen' },
  { value: 'early20s', labelKey: 'early20s' },
  { value: 'late20s', labelKey: 'late20s' },
  { value: '30s', labelKey: '30s' },
  { value: '40plus', labelKey: '40plus' },
]

const ethnicityOptionKeys: OptionItem[] = [
  { value: 'caucasian', labelKey: 'caucasian' },
  { value: 'black', labelKey: 'black' },
  { value: 'eastAsian', labelKey: 'eastAsian' },
  { value: 'southeastAsian', labelKey: 'southeastAsian' },
  { value: 'southAsian', labelKey: 'southAsian' },
  { value: 'middleEastern', labelKey: 'middleEastern' },
  { value: 'hispanic', labelKey: 'hispanic' },
  { value: 'nativeAmerican', labelKey: 'nativeAmerican' },
  { value: 'multiracial', labelKey: 'multiracial' },
]

const heightOptionKeys: OptionItem[] = [
  { value: 'auto', labelKey: 'auto' },
  { value: 'short', labelKey: 'heightShort' },
  { value: 'average', labelKey: 'heightAverage' },
  { value: 'tall', labelKey: 'heightTall' },
]

const femaleBodyTypeOptionKeys: OptionItem[] = [
  { value: 'auto', labelKey: 'auto' },
  { value: 'slim', labelKey: 'bodySlim' },
  { value: 'average', labelKey: 'bodyAverage' },
  { value: 'athletic', labelKey: 'bodyAthletic' },
  { value: 'curvy', labelKey: 'bodyCurvy' },
]

const maleBodyTypeOptionKeys: OptionItem[] = [
  { value: 'auto', labelKey: 'auto' },
  { value: 'slim', labelKey: 'bodySlim' },
  { value: 'average', labelKey: 'bodyAverage' },
  { value: 'athletic', labelKey: 'bodyAthletic' },
  { value: 'muscular', labelKey: 'bodyMuscular' },
]

const hairStyleOptionKeys: OptionItem[] = [
  { value: 'auto', labelKey: 'auto' },
  { value: 'short', labelKey: 'hairShort' },
  { value: 'medium', labelKey: 'hairMedium' },
  { value: 'long', labelKey: 'hairLong' },
]

const hairColorOptionKeys: OptionItem[] = [
  { value: 'auto', labelKey: 'auto' },
  { value: 'blackhair', labelKey: 'blackhair' },
  { value: 'brown', labelKey: 'brown' },
  { value: 'blonde', labelKey: 'blonde' },
  { value: 'custom', labelKey: 'custom' },
]

const outfitStyleOptionKeys: OptionItem[] = [
  { value: 'auto', labelKey: 'auto' },
  { value: 'casual', labelKey: 'outfitCasual' },
  { value: 'formal', labelKey: 'outfitFormal' },
  { value: 'sporty', labelKey: 'outfitSporty' },
  { value: 'doctor', labelKey: 'outfitDoctor' },
  { value: 'nurse', labelKey: 'outfitNurse' },
  { value: 'chef', labelKey: 'outfitChef' },
  { value: 'worker', labelKey: 'outfitWorker' },
]

const backgroundOptionKeys: OptionItem[] = [
  { value: 'auto', labelKey: 'auto' },
  { value: 'studioWhite', labelKey: 'bgStudioWhite' },
  { value: 'studioGray', labelKey: 'bgStudioGray' },
  { value: 'home', labelKey: 'bgHome' },
  { value: 'office', labelKey: 'bgOffice' },
  { value: 'cafe', labelKey: 'bgCafe' },
  { value: 'restaurant', labelKey: 'bgRestaurant' },
  { value: 'street', labelKey: 'bgStreet' },
  { value: 'park', labelKey: 'bgPark' },
  { value: 'beach', labelKey: 'bgBeach' },
  { value: 'gym', labelKey: 'bgGym' },
]

// ============================================================
// 유틸리티 함수
// ============================================================

/** 기본 아바타 이름 생성 */
function generateDefaultAvatarName(): string {
  const randomNum = Math.floor(Math.random() * 900) + 100 // 100-999
  return `Avatar_${randomNum}`
}

// ============================================================
// 옵션 버튼 컴포넌트
// ============================================================

function OptionButton({ selected, onClick, children, className = '' }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
        ${selected
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-secondary/50 text-foreground hover:bg-secondary border border-transparent hover:border-border'
        }
        ${className}
      `}
    >
      {children}
    </button>
  )
}

// ============================================================
// 스텝 인디케이터 컴포넌트
// ============================================================

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {stepLabels.map((label, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                ${index < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index === currentStep
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-secondary text-muted-foreground'
                }
              `}
            >
              {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
            </div>
            <span className={`mt-2 text-xs font-medium ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
          {index < totalSteps - 1 && (
            <div className={`w-16 h-0.5 mx-4 mt-[-20px] ${index < currentStep ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 선택된 옵션 요약 컴포넌트
// ============================================================

interface SelectedOptionsSummaryProps {
  options: AvatarOptions
  t: Record<string, unknown>
}

function SelectedOptionsSummary({ options, t }: SelectedOptionsSummaryProps) {
  const avatarT = t.avatar as Record<string, unknown>
  const avatarOptions = avatarT.options as Record<string, string>
  const avatarLabels = avatarT as { gender?: string; age?: string; ethnicity?: string; bodyType?: string; hairStyle?: string; outfitStyle?: string; background?: string; selectedOptions?: string }

  const selectedItems = useMemo(() => {
    const items: { key: string; label: string; value: string }[] = []

    // 'auto' 값은 요약에서 제외 (사용자가 명시적으로 선택한 옵션만 표시)
    if (options.gender) items.push({ key: 'gender', label: avatarLabels.gender || 'Gender', value: avatarOptions[options.gender] || options.gender })
    if (options.age) items.push({ key: 'age', label: avatarLabels.age || 'Age', value: avatarOptions[options.age] || options.age })
    if (options.ethnicity) items.push({ key: 'ethnicity', label: avatarLabels.ethnicity || 'Ethnicity', value: avatarOptions[options.ethnicity] || options.ethnicity })
    if (options.bodyType && options.bodyType !== 'auto') {
      const bodyKey = options.bodyType === 'muscular' ? 'bodyMuscular' :
                      options.bodyType === 'curvy' ? 'bodyCurvy' :
                      options.bodyType === 'athletic' ? 'bodyAthletic' :
                      options.bodyType === 'average' ? 'bodyAverage' : 'bodySlim'
      items.push({ key: 'bodyType', label: avatarLabels.bodyType || 'Body Type', value: avatarOptions[bodyKey] || options.bodyType })
    }
    if (options.hairStyle && options.hairStyle !== 'auto') {
      const hairKey = options.hairStyle === 'short' ? 'hairShort' :
                      options.hairStyle === 'medium' ? 'hairMedium' : 'hairLong'
      items.push({ key: 'hairStyle', label: avatarLabels.hairStyle || 'Hair', value: avatarOptions[hairKey] || options.hairStyle })
    }
    if (options.outfitStyle && options.outfitStyle !== 'auto') {
      const outfitKey = `outfit${options.outfitStyle.charAt(0).toUpperCase() + options.outfitStyle.slice(1)}`
      items.push({ key: 'outfitStyle', label: avatarLabels.outfitStyle || 'Outfit', value: avatarOptions[outfitKey] || options.outfitStyle })
    }
    if (options.background && options.background !== 'auto') {
      const bgKey = options.background === 'studioWhite' ? 'bgStudioWhite' :
                    options.background === 'studioGray' ? 'bgStudioGray' :
                    `bg${options.background.charAt(0).toUpperCase() + options.background.slice(1)}`
      items.push({ key: 'background', label: avatarLabels.background || 'Background', value: avatarOptions[bgKey] || options.background })
    }

    return items
  }, [options, avatarOptions, avatarLabels])

  if (selectedItems.length === 0) return null

  return (
    <div className="mb-6 p-4 bg-secondary/30 rounded-xl border border-border">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{avatarLabels.selectedOptions || 'Selected Options'}</p>
      <div className="flex flex-wrap gap-2">
        {selectedItems.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-background text-xs rounded-lg border border-border"
          >
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function AvatarForm({ onSubmit, isLoading }: AvatarFormProps) {
  const { t } = useLanguage()
  const avatarT = t.avatar as Record<string, unknown>
  const avatarOptions = avatarT.options as Record<string, string>
  const formLabels = avatarT as {
    optional?: string
    autoGeneratePlaceholder?: string
    englishTip?: string
    selectColor?: string
    stepBasicInfo?: string
    stepAppearance?: string
    stepStyle?: string
    previous?: string
    next?: string
  }

  const [name, setName] = useState('')
  const [inputMethod, setInputMethod] = useState<InputMethod>('options')
  const [prompt, setPrompt] = useState('')
  // 성별, 연령대, 인종/외모 제외 나머지는 'auto' 기본 선택
  const [options, setOptions] = useState<AvatarOptions>({
    height: 'auto',
    bodyType: 'auto',
    hairStyle: 'auto',
    hairColor: 'auto',
    outfitStyle: 'auto',
    background: 'auto',
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const stepLabels = [
    formLabels.stepBasicInfo || 'Basic Info',
    formLabels.stepAppearance || 'Appearance',
    formLabels.stepStyle || 'Style'
  ]
  const totalSteps = 3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 스텝 전환 중에는 제출 방지
    if (isTransitioning) return

    // 이름이 비어있으면 기본 이름 생성
    const avatarName = name.trim() || generateDefaultAvatarName()

    if (inputMethod === 'prompt') {
      await onSubmit({ name: avatarName, prompt })
    } else {
      await onSubmit({ name: avatarName, options })
    }
  }

  const updateOption = <K extends keyof AvatarOptions>(key: K, value: AvatarOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    // 모든 옵션은 선택사항 - 항상 다음 단계로 진행 가능
    return true
  }

  const nextStep = () => {
    if (currentStep < totalSteps - 1 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentStep(currentStep + 1)
      // 다음 렌더 사이클까지 전환 상태 유지하여 더블클릭 방지
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 성별에 따른 체형 옵션
  const bodyTypeOptions = useMemo(() => {
    return options.gender === 'male' ? maleBodyTypeOptionKeys : femaleBodyTypeOptionKeys
  }, [options.gender])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 아바타 이름 입력 (선택사항) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t.avatar.name} <span className="text-muted-foreground font-normal">({formLabels.optional || 'optional'})</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={formLabels.autoGeneratePlaceholder || 'Leave blank to auto-generate'}
          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
        />
      </div>

      {/* 입력 방식 선택 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t.avatar.inputMethod}
        </label>
        <div className="flex gap-2 p-1 bg-secondary/30 rounded-xl">
          <button
            type="button"
            onClick={() => setInputMethod('options')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              inputMethod === 'options'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Palette className="w-4 h-4" />
            {t.avatar.useOptions}
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('prompt')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              inputMethod === 'prompt'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t.avatar.directPrompt}
          </button>
        </div>
      </div>

      {inputMethod === 'prompt' ? (
        /* 직접 프롬프트 입력 */
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t.avatar.prompt}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.avatar.promptPlaceholder}
            rows={5}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground resize-none transition-all"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {formLabels.englishTip || 'Writing in English can yield more accurate results.'}
          </p>
        </div>
      ) : (
        /* 옵션 기반 입력 */
        <div>
          {/* 스텝 인디케이터 */}
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} stepLabels={stepLabels} />

          {/* 선택된 옵션 요약 */}
          <SelectedOptionsSummary options={options} t={t as Record<string, unknown>} />

          {/* Step 1: 기본 정보 */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* 성별 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.gender}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {genderOptionKeys.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.gender === item.value}
                      onClick={() => {
                        updateOption('gender', item.value as 'female' | 'male')
                        // 성별 변경 시 체형을 auto로 초기화 (성별에 따라 옵션이 다르므로)
                        updateOption('bodyType', 'auto')
                      }}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 나이대 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.age}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ageOptionKeys.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.age === item.value}
                      onClick={() => updateOption('age', item.value as AvatarOptions['age'])}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 인종/외모 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.ethnicity}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ethnicityOptionKeys.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.ethnicity === item.value}
                      onClick={() => updateOption('ethnicity', item.value as AvatarOptions['ethnicity'])}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 외모 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* 체형 (성별에 따라 다른 옵션) */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.bodyType}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {bodyTypeOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.bodyType === item.value}
                      onClick={() => updateOption('bodyType', item.value as AvatarOptions['bodyType'])}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 키 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.height}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {heightOptionKeys.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.height === item.value}
                      onClick={() => updateOption('height', item.value as AvatarOptions['height'])}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 헤어스타일 (간소화: 단발, 중간, 장발) */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.hairStyle}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {hairStyleOptionKeys.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.hairStyle === item.value}
                      onClick={() => updateOption('hairStyle', item.value as AvatarOptions['hairStyle'])}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 머리 색상 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.hairColor}
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  {hairColorOptionKeys.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.hairColor === item.value}
                      onClick={() => updateOption('hairColor', item.value as AvatarOptions['hairColor'])}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>

                {/* 커스텀 색상 선택 UI - 컬러 피커 */}
                {options.hairColor === 'custom' && (
                  <div className="mt-4 flex items-center gap-3">
                    <label className="relative cursor-pointer group">
                      <input
                        type="color"
                        value={options.customHairColor || '#8B4513'}
                        onChange={(e) => updateOption('customHairColor', e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div
                        className="w-10 h-10 rounded-full border-2 border-white/20 group-hover:border-primary transition-colors shadow-lg"
                        style={{ backgroundColor: options.customHairColor || '#8B4513' }}
                      />
                    </label>
                    <span className="text-sm text-foreground">
                      {options.customHairColor || (formLabels.selectColor || 'Select a color')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: 스타일 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* 의상 스타일 (직업 기반) */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.outfitStyle}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {outfitStyleOptionKeys.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.outfitStyle === item.value}
                      onClick={() => updateOption('outfitStyle', item.value as AvatarOptions['outfitStyle'])}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 배경 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t.avatar.background}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {backgroundOptionKeys.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.background === item.value}
                      onClick={() => updateOption('background', item.value as AvatarOptions['background'])}
                    >
                      {avatarOptions[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 스텝 네비게이션 */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              {formLabels.previous || 'Previous'}
            </button>

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed() || isTransitioning}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {formLabels.next || 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isTransitioning}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.avatar.generating}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t.avatar.generate}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 프롬프트 모드 제출 버튼 */}
      {inputMethod === 'prompt' && (
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.avatar.generating}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t.avatar.generate}
            </>
          )}
        </button>
      )}
    </form>
  )
}
