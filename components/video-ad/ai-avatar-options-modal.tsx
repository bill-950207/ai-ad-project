/**
 * AI 아바타 상세 옵션 선택 모달
 *
 * 아바타 생성 폼과 동일한 2단계 UI로 AI 아바타 옵션을 선택합니다.
 * Step 1: 기본 정보 (성별, 나이, 인종)
 * Step 2: 외모 (체형, 키, 헤어)
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  X,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
} from 'lucide-react'

// ============================================================
// 타입 정의
// ============================================================

/** AI 아바타 상세 옵션 */
export interface DetailedAiAvatarOptions {
  // 기본 정보
  gender: 'male' | 'female' | 'any'
  age: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus' | 'any'
  ethnicity: 'eastAsian' | 'southeastAsian' | 'southAsian' | 'caucasian' | 'black' | 'hispanic' | 'middleEastern' | 'any'

  // 외모
  height: 'short' | 'average' | 'tall' | 'any'
  bodyType: 'slim' | 'average' | 'athletic' | 'curvy' | 'muscular' | 'any'
  hairStyle: 'short' | 'medium' | 'long' | 'any'
  hairColor: 'black' | 'brown' | 'blonde' | 'any'
}

interface AiAvatarOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (options: DetailedAiAvatarOptions) => void
  initialOptions?: Partial<DetailedAiAvatarOptions>
}

interface OptionItem {
  value: string
  labelKey: string
}

interface OptionButtonProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}

// ============================================================
// 옵션 정의
// ============================================================

const genderOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyGender' },
  { value: 'female', labelKey: 'female' },
  { value: 'male', labelKey: 'male' },
]

const ageOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyAge' },
  { value: 'teen', labelKey: 'teen' },
  { value: 'early20s', labelKey: 'early20s' },
  { value: 'late20s', labelKey: 'late20s' },
  { value: '30s', labelKey: '30s' },
  { value: '40plus', labelKey: '40plus' },
]

const ethnicityOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyEthnicity' },
  { value: 'eastAsian', labelKey: 'eastAsian' },
  { value: 'southeastAsian', labelKey: 'southeastAsian' },
  { value: 'southAsian', labelKey: 'southAsian' },
  { value: 'caucasian', labelKey: 'caucasian' },
  { value: 'black', labelKey: 'black' },
  { value: 'hispanic', labelKey: 'hispanic' },
  { value: 'middleEastern', labelKey: 'middleEastern' },
]

const heightOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyHeight' },
  { value: 'short', labelKey: 'heightShort' },
  { value: 'average', labelKey: 'heightAverage' },
  { value: 'tall', labelKey: 'heightTall' },
]

const femaleBodyTypeOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyBodyType' },
  { value: 'slim', labelKey: 'bodySlim' },
  { value: 'average', labelKey: 'bodyAverage' },
  { value: 'athletic', labelKey: 'bodyAthletic' },
  { value: 'curvy', labelKey: 'bodyCurvy' },
]

const maleBodyTypeOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyBodyType' },
  { value: 'slim', labelKey: 'bodySlim' },
  { value: 'average', labelKey: 'bodyAverage' },
  { value: 'athletic', labelKey: 'bodyAthletic' },
  { value: 'muscular', labelKey: 'bodyMuscular' },
]

const defaultBodyTypeOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyBodyType' },
  { value: 'slim', labelKey: 'bodySlim' },
  { value: 'average', labelKey: 'bodyAverage' },
  { value: 'athletic', labelKey: 'bodyAthletic' },
  { value: 'curvy', labelKey: 'bodyCurvy' },
]

const hairStyleOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyHairStyle' },
  { value: 'short', labelKey: 'hairShort' },
  { value: 'medium', labelKey: 'hairMedium' },
  { value: 'long', labelKey: 'hairLong' },
]

const hairColorOptions: OptionItem[] = [
  { value: 'any', labelKey: 'anyHairColor' },
  { value: 'black', labelKey: 'hairBlack' },
  { value: 'brown', labelKey: 'hairBrown' },
  { value: 'blonde', labelKey: 'hairBlonde' },
]

// 기본값
const defaultOptions: DetailedAiAvatarOptions = {
  gender: 'any',
  age: 'any',
  ethnicity: 'any',
  height: 'any',
  bodyType: 'any',
  hairStyle: 'any',
  hairColor: 'any',
}

// ============================================================
// 옵션 버튼 컴포넌트
// ============================================================

function OptionButton({ selected, onClick, children }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${selected
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-secondary/50 text-foreground hover:bg-secondary border border-transparent hover:border-border'
        }
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
    <div className="flex items-center justify-center mb-6">
      {stepLabels.map((label, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
                ${index < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index === currentStep
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                    : 'bg-secondary text-muted-foreground'
                }
              `}
            >
              {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`mt-1 text-[10px] font-medium ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
          {index < totalSteps - 1 && (
            <div className={`w-12 h-0.5 mx-2 mt-[-16px] ${index < currentStep ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 선택된 옵션 요약 컴포넌트
// ============================================================

interface SelectedSummaryProps {
  options: DetailedAiAvatarOptions
  labels: Record<string, string>
}

function SelectedSummary({ options, labels }: SelectedSummaryProps) {
  const selectedItems = useMemo(() => {
    const items: { key: string; label: string; value: string }[] = []

    if (options.gender !== 'any') {
      items.push({ key: 'gender', label: labels.gender || 'Gender', value: labels[options.gender] || options.gender })
    }
    if (options.age !== 'any') {
      items.push({ key: 'age', label: labels.age || 'Age', value: labels[options.age] || options.age })
    }
    if (options.ethnicity !== 'any') {
      items.push({ key: 'ethnicity', label: labels.ethnicity || 'Ethnicity', value: labels[options.ethnicity] || options.ethnicity })
    }
    if (options.height !== 'any') {
      items.push({ key: 'height', label: labels.height || 'Height', value: labels[`height${options.height.charAt(0).toUpperCase() + options.height.slice(1)}`] || options.height })
    }
    if (options.bodyType !== 'any') {
      items.push({ key: 'bodyType', label: labels.bodyType || 'Body', value: labels[`body${options.bodyType.charAt(0).toUpperCase() + options.bodyType.slice(1)}`] || options.bodyType })
    }
    if (options.hairStyle !== 'any') {
      items.push({ key: 'hairStyle', label: labels.hairStyle || 'Hair', value: labels[`hair${options.hairStyle.charAt(0).toUpperCase() + options.hairStyle.slice(1)}`] || options.hairStyle })
    }
    if (options.hairColor !== 'any') {
      items.push({ key: 'hairColor', label: labels.hairColor || 'Hair Color', value: labels[`hair${options.hairColor.charAt(0).toUpperCase() + options.hairColor.slice(1)}`] || options.hairColor })
    }

    return items
  }, [options, labels])

  // 선택된 옵션이 없으면 아무것도 표시하지 않음
  if (selectedItems.length === 0) {
    return null
  }

  return (
    <div className="mb-4 p-3 bg-secondary/30 rounded-lg border border-border">
      <p className="text-[10px] text-muted-foreground mb-2 font-medium">{labels.selectedOptions || 'Selected Options'}</p>
      <div className="flex flex-wrap gap-1.5">
        {selectedItems.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-background text-[10px] rounded border border-border"
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

export function AiAvatarOptionsModal({
  isOpen,
  onClose,
  onConfirm,
  initialOptions,
}: AiAvatarOptionsModalProps) {
  const { t } = useLanguage()
  const [options, setOptions] = useState<DetailedAiAvatarOptions>({ ...defaultOptions, ...initialOptions })
  const [currentStep, setCurrentStep] = useState(0)

  // 모달이 열릴 때 초기값 설정
  useEffect(() => {
    if (isOpen) {
      setOptions({ ...defaultOptions, ...initialOptions })
      setCurrentStep(0)
    }
  }, [isOpen, initialOptions])

  // 번역 가져오기
  const avatarT = (t as Record<string, unknown>).avatar as Record<string, unknown> | undefined
  const avatarOptions = (avatarT?.options || {}) as Record<string, string>
  const aiAvatarT = (t as Record<string, unknown>).aiAvatarOptions as Record<string, string> | undefined

  // 라벨 매핑 (번역 또는 기본값)
  const labels: Record<string, string> = {
    // 카테고리 라벨
    gender: aiAvatarT?.gender || 'Gender',
    age: aiAvatarT?.age || 'Age',
    ethnicity: aiAvatarT?.ethnicity || 'Ethnicity',
    height: aiAvatarT?.height || 'Height',
    bodyType: aiAvatarT?.bodyType || 'Body Type',
    hairStyle: aiAvatarT?.hairStyle || 'Hair Style',
    hairColor: aiAvatarT?.hairColor || 'Hair Color',
    selectedOptions: aiAvatarT?.selectedOptions || 'Selected Options',
    allAuto: aiAvatarT?.allAuto || 'All options set to auto (AI will decide)',

    // 성별
    anyGender: aiAvatarT?.anyGender || avatarOptions.anyGender || 'Any',
    female: avatarOptions.female || 'Female',
    male: avatarOptions.male || 'Male',

    // 나이
    anyAge: aiAvatarT?.anyAge || avatarOptions.anyAge || 'Any',
    teen: avatarOptions.teen || '10s',
    early20s: avatarOptions.early20s || 'Early 20s',
    late20s: avatarOptions.late20s || 'Late 20s',
    '30s': avatarOptions['30s'] || '30s',
    '40plus': avatarOptions['40plus'] || '40+',

    // 인종
    anyEthnicity: aiAvatarT?.anyEthnicity || 'Any',
    eastAsian: avatarOptions.eastAsian || 'East Asian',
    southeastAsian: avatarOptions.southeastAsian || 'Southeast Asian',
    southAsian: avatarOptions.southAsian || 'South Asian',
    caucasian: avatarOptions.caucasian || 'Caucasian',
    black: avatarOptions.black || 'Black',
    hispanic: avatarOptions.hispanic || 'Hispanic',
    middleEastern: avatarOptions.middleEastern || 'Middle Eastern',

    // 키
    anyHeight: aiAvatarT?.anyHeight || 'Any',
    heightShort: avatarOptions.heightShort || 'Short',
    heightAverage: avatarOptions.heightAverage || 'Average',
    heightTall: avatarOptions.heightTall || 'Tall',

    // 체형
    anyBodyType: aiAvatarT?.anyBodyType || 'Any',
    bodySlim: avatarOptions.bodySlim || 'Slim',
    bodyAverage: avatarOptions.bodyAverage || 'Average',
    bodyAthletic: avatarOptions.bodyAthletic || 'Athletic',
    bodyCurvy: avatarOptions.bodyCurvy || 'Curvy',
    bodyMuscular: avatarOptions.bodyMuscular || 'Muscular',

    // 헤어스타일
    anyHairStyle: aiAvatarT?.anyHairStyle || 'Any',
    hairShort: avatarOptions.hairShort || 'Short',
    hairMedium: avatarOptions.hairMedium || 'Medium',
    hairLong: avatarOptions.hairLong || 'Long',

    // 헤어컬러
    anyHairColor: aiAvatarT?.anyHairColor || 'Any',
    hairBlack: avatarOptions.blackhair || 'Black',
    hairBrown: avatarOptions.brown || 'Brown',
    hairBlonde: avatarOptions.blonde || 'Blonde',
  }

  const stepLabels = [
    aiAvatarT?.stepBasic || 'Basic',
    aiAvatarT?.stepAppearance || 'Appearance',
  ]
  const totalSteps = 2

  const updateOption = <K extends keyof DetailedAiAvatarOptions>(key: K, value: DetailedAiAvatarOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConfirm = () => {
    onConfirm(options)
    onClose()
  }

  // 성별에 따른 체형 옵션
  const bodyTypeOptions = useMemo(() => {
    if (options.gender === 'male') return maleBodyTypeOptions
    if (options.gender === 'female') return femaleBodyTypeOptions
    return defaultBodyTypeOptions
  }, [options.gender])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 컨텐츠 */}
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-xl border border-border">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {aiAvatarT?.title || 'AI Avatar Options'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4">
          {/* 스텝 인디케이터 */}
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} stepLabels={stepLabels} />

          {/* 선택된 옵션 요약 */}
          <SelectedSummary options={options} labels={labels} />

          {/* Step 1: 기본 정보 */}
          {currentStep === 0 && (
            <div className="space-y-5">
              {/* 성별 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="w-4 h-4 text-primary" />
                  {labels.gender}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {genderOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.gender === item.value}
                      onClick={() => {
                        updateOption('gender', item.value as DetailedAiAvatarOptions['gender'])
                        // 성별 변경 시 체형 초기화
                        if (item.value !== options.gender) {
                          updateOption('bodyType', 'any')
                        }
                      }}
                    >
                      {labels[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 나이대 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {labels.age}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ageOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.age === item.value}
                      onClick={() => updateOption('age', item.value as DetailedAiAvatarOptions['age'])}
                    >
                      {labels[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 인종 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {labels.ethnicity}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ethnicityOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.ethnicity === item.value}
                      onClick={() => updateOption('ethnicity', item.value as DetailedAiAvatarOptions['ethnicity'])}
                    >
                      {labels[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 외모 */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* 키 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {labels.height}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {heightOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.height === item.value}
                      onClick={() => updateOption('height', item.value as DetailedAiAvatarOptions['height'])}
                    >
                      {labels[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 체형 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {labels.bodyType}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {bodyTypeOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.bodyType === item.value}
                      onClick={() => updateOption('bodyType', item.value as DetailedAiAvatarOptions['bodyType'])}
                    >
                      {labels[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 헤어스타일 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {labels.hairStyle}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {hairStyleOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.hairStyle === item.value}
                      onClick={() => updateOption('hairStyle', item.value as DetailedAiAvatarOptions['hairStyle'])}
                    >
                      {labels[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 헤어 컬러 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {labels.hairColor}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {hairColorOptions.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={options.hairColor === item.value}
                      onClick={() => updateOption('hairColor', item.value as DetailedAiAvatarOptions['hairColor'])}
                    >
                      {labels[item.labelKey] || item.value}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {/* 설명 */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  {aiAvatarT?.description || 'Options set to "Any" will be automatically determined by AI based on the product and context.'}
                </p>
              </div>
            </div>
          )}

          {/* 네비게이션 */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              {aiAvatarT?.previous || 'Previous'}
            </button>

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
              >
                {aiAvatarT?.next || 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {aiAvatarT?.confirm || 'Confirm'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
