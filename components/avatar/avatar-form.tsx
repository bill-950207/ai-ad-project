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
  genderOptions,
  ageOptions,
  ethnicityOptions,
  heightOptions,
  hairColorOptions,
  outfitStyleOptions,
  backgroundOptions,
  getHairStyleOptions,
  getBodyTypeOptions,
  genderLabels,
  ageLabels,
  bodyTypeLabels,
  backgroundLabels,
  outfitStyleLabels,
  ethnicityLabels,
  hairStyleLabels,
} from '@/lib/avatar/option-labels'
import {
  User,
  Palette,
  Shirt,
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
}

function SelectedOptionsSummary({ options }: SelectedOptionsSummaryProps) {
  const selectedItems = useMemo(() => {
    const items: { key: string; label: string; value: string }[] = []

    if (options.gender) items.push({ key: 'gender', label: '성별', value: genderLabels[options.gender] || options.gender })
    if (options.age) items.push({ key: 'age', label: '나이', value: ageLabels[options.age] || options.age })
    if (options.ethnicity) items.push({ key: 'ethnicity', label: '인종', value: ethnicityLabels[options.ethnicity] || options.ethnicity })
    if (options.bodyType) items.push({ key: 'bodyType', label: '체형', value: bodyTypeLabels[options.bodyType] || options.bodyType })
    if (options.hairStyle) items.push({ key: 'hairStyle', label: '헤어', value: hairStyleLabels[options.hairStyle] || options.hairStyle })
    if (options.outfitStyle) items.push({ key: 'outfitStyle', label: '의상', value: outfitStyleLabels[options.outfitStyle] || options.outfitStyle })
    if (options.background) items.push({ key: 'background', label: '배경', value: backgroundLabels[options.background] || options.background })

    return items
  }, [options])

  if (selectedItems.length === 0) return null

  return (
    <div className="mb-6 p-4 bg-secondary/30 rounded-xl border border-border">
      <p className="text-xs text-muted-foreground mb-2 font-medium">선택된 옵션</p>
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

  const [name, setName] = useState('')
  const [inputMethod, setInputMethod] = useState<InputMethod>('options')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<AvatarOptions>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const stepLabels = ['기본 정보', '외모', '스타일']
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
    if (currentStep === 0) {
      return options.gender && options.age && options.ethnicity
    }
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

  // 성별에 따른 헤어스타일 옵션
  const hairStyleOptions = useMemo(() => getHairStyleOptions(options.gender), [options.gender])

  // 성별에 따른 체형 옵션
  const bodyTypeOptionsForGender = useMemo(() => getBodyTypeOptions(options.gender), [options.gender])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 아바타 이름 입력 (선택사항) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t.avatar.name} <span className="text-muted-foreground font-normal">(선택)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="입력하지 않으면 자동 생성됩니다"
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
            영어로 작성하면 더 정확한 결과를 얻을 수 있습니다.
          </p>
        </div>
      ) : (
        /* 옵션 기반 입력 */
        <div>
          {/* 스텝 인디케이터 */}
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} stepLabels={stepLabels} />

          {/* 선택된 옵션 요약 */}
          <SelectedOptionsSummary options={options} />

          {/* Step 1: 기본 정보 */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* 성별 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <User className="w-4 h-4 text-primary" />
                  성별 <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {genderOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.gender === item.value}
                      onClick={() => {
                        updateOption('gender', item.value as 'female' | 'male')
                        // 성별 변경 시 체형 초기화 (성별에 따라 옵션이 다르므로)
                        updateOption('bodyType', undefined)
                      }}
                    >
                      {item.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 나이대 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  나이대 <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ageOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.age === item.value}
                      onClick={() => updateOption('age', item.value as AvatarOptions['age'])}
                    >
                      {item.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 인종/외모 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  인종/외모 <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ethnicityOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.ethnicity === item.value}
                      onClick={() => updateOption('ethnicity', item.value as AvatarOptions['ethnicity'])}
                    >
                      {item.label}
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
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  체형
                </label>
                <div className="flex gap-2 flex-wrap">
                  {bodyTypeOptionsForGender.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.bodyType === item.value}
                      onClick={() => updateOption('bodyType', item.value as AvatarOptions['bodyType'])}
                    >
                      {item.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 키 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  키
                </label>
                <div className="flex gap-2 flex-wrap">
                  {heightOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.height === item.value}
                      onClick={() => updateOption('height', item.value as AvatarOptions['height'])}
                    >
                      {item.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 헤어스타일 (간소화: 단발, 중간, 장발) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  헤어스타일
                </label>
                <div className="flex gap-2 flex-wrap">
                  {hairStyleOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.hairStyle === item.value}
                      onClick={() => updateOption('hairStyle', item.value as AvatarOptions['hairStyle'])}
                    >
                      {item.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 머리 색상 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  머리 색상
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  {hairColorOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.hairColor === item.value}
                      onClick={() => updateOption('hairColor', item.value as AvatarOptions['hairColor'])}
                    >
                      {item.label}
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
                      {options.customHairColor || '색상을 선택하세요'}
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
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Shirt className="w-4 h-4 text-primary" />
                  의상 스타일
                </label>
                <div className="flex gap-2 flex-wrap">
                  {outfitStyleOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.outfitStyle === item.value}
                      onClick={() => updateOption('outfitStyle', item.value as AvatarOptions['outfitStyle'])}
                    >
                      {item.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 배경 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  배경
                </label>
                <div className="flex gap-2 flex-wrap">
                  {backgroundOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.background === item.value}
                      onClick={() => updateOption('background', item.value as AvatarOptions['background'])}
                    >
                      {item.label}
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
              이전
            </button>

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed() || isTransitioning}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isTransitioning || !options.gender || !options.age || !options.ethnicity}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    아바타 생성
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
          disabled={isLoading || !prompt.trim()}
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
