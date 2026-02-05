/**
 * 아바타 선택 모달
 *
 * 내 아바타와 프리셋 아바타를 3열 그리드로 보여줍니다.
 * AI가 제품에 어울리는 아바타를 자동 생성하는 옵션도 제공합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { X, Loader2, Check, Sparkles, Settings2 } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { AiAvatarOptionsModal, type DetailedAiAvatarOptions } from './ai-avatar-options-modal'

/** 아바타 스타일 옵션 */
export interface AvatarStyleOptions {
  vibe?: 'natural' | 'sophisticated' | 'cute' | 'professional'
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'plussize'
  height?: 'short' | 'average' | 'tall'
  gender?: 'female' | 'male'
}

interface Avatar {
  id: string
  name: string
  image_url: string | null
  options?: AvatarStyleOptions
}


/** AI 아바타 생성 옵션 (상세 옵션 포함) */
export interface AiAvatarOptions {
  targetGender: 'male' | 'female' | 'any'
  targetAge: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus' | 'young' | 'middle' | 'mature' | 'any'
  style: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
  ethnicity: 'eastAsian' | 'southeastAsian' | 'southAsian' | 'caucasian' | 'black' | 'hispanic' | 'middleEastern' | 'korean' | 'asian' | 'western' | 'any'
  bodyType: 'slim' | 'average' | 'athletic' | 'curvy' | 'muscular' | 'any'
  // 상세 옵션 (선택사항)
  height?: 'short' | 'average' | 'tall' | 'any'
  hairStyle?: 'short' | 'medium' | 'long' | 'any'
  hairColor?: 'black' | 'brown' | 'blonde' | 'any'
}

export interface SelectedAvatarInfo {
  type: 'avatar' | 'outfit' | 'ai-generated' | 'preset'
  avatarId: string
  avatarName: string
  outfitId?: string
  outfitName?: string
  imageUrl: string
  displayName: string
  // AI 생성 옵션 (type이 'ai-generated'일 때만)
  aiOptions?: AiAvatarOptions
  // 아바타 스타일 옵션 (실제 아바타 선택 시)
  avatarOptions?: AvatarStyleOptions
  // 프리셋 여부
  isPreset?: boolean
}

/** 프리셋 아바타 (preset_avatars 테이블 - avatars 참조) */
interface PresetAvatar {
  id: string  // avatar_id (avatars 테이블의 id)
  presetId: string  // preset_avatars 테이블의 id
  name: string
  image_url: string | null
  image_url_original: string | null
  options: AvatarStyleOptions | null
  display_order: number | null
  type: 'preset'
}

interface AvatarSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (avatar: SelectedAvatarInfo) => void
  selectedAvatarId?: string
  selectedOutfitId?: string // deprecated, kept for backward compatibility
  selectedType?: 'avatar' | 'outfit' | 'ai-generated' | 'preset'
}

// AI 아바타 옵션을 AiAvatarOptions로 변환하는 헬퍼 함수
function convertToAiAvatarOptions(detailed: DetailedAiAvatarOptions): AiAvatarOptions {
  return {
    targetGender: detailed.gender,
    targetAge: detailed.age,
    style: 'any',  // 의상 스타일은 AI가 자동 결정
    ethnicity: detailed.ethnicity,
    bodyType: detailed.bodyType,
    height: detailed.height,
    hairStyle: detailed.hairStyle,
    hairColor: detailed.hairColor,
  }
}

// 선택된 옵션 요약 표시 컴포넌트
interface SelectedOptionsSummaryProps {
  options: DetailedAiAvatarOptions
  t: Record<string, unknown>
}

function SelectedOptionsSummary({ options, t }: SelectedOptionsSummaryProps) {
  const avatarT = t.avatar as Record<string, unknown> | undefined
  const optionsT = avatarT?.options as Record<string, string> | undefined
  const aiAvatarT = t.aiAvatarOptions as Record<string, string> | undefined

  // 선택된 옵션 수 계산
  const selectedCount = Object.values(options).filter(v => v !== 'any').length
  const totalOptions = Object.keys(options).length

  // 라벨 매핑
  const getLabel = (key: string, value: string): string => {
    if (value === 'any') return ''

    // 번역에서 찾기
    const labelMap: Record<string, Record<string, string>> = {
      gender: { male: optionsT?.male || 'Male', female: optionsT?.female || 'Female' },
      age: {
        teen: optionsT?.teen || '10s',
        early20s: optionsT?.early20s || 'Early 20s',
        late20s: optionsT?.late20s || 'Late 20s',
        '30s': optionsT?.['30s'] || '30s',
        '40plus': optionsT?.['40plus'] || '40+',
      },
      ethnicity: {
        eastAsian: optionsT?.eastAsian || 'East Asian',
        southeastAsian: optionsT?.southeastAsian || 'SE Asian',
        southAsian: optionsT?.southAsian || 'S Asian',
        caucasian: optionsT?.caucasian || 'Caucasian',
        black: optionsT?.black || 'Black',
        hispanic: optionsT?.hispanic || 'Hispanic',
        middleEastern: optionsT?.middleEastern || 'Middle Eastern',
      },
      height: {
        short: optionsT?.heightShort || 'Short',
        average: optionsT?.heightAverage || 'Average',
        tall: optionsT?.heightTall || 'Tall',
      },
      bodyType: {
        slim: optionsT?.bodySlim || 'Slim',
        average: optionsT?.bodyAverage || 'Average',
        athletic: optionsT?.bodyAthletic || 'Athletic',
        curvy: optionsT?.bodyCurvy || 'Curvy',
        muscular: optionsT?.bodyMuscular || 'Muscular',
      },
      hairStyle: {
        short: optionsT?.hairShort || 'Short',
        medium: optionsT?.hairMedium || 'Medium',
        long: optionsT?.hairLong || 'Long',
      },
      hairColor: {
        black: optionsT?.blackhair || 'Black',
        brown: optionsT?.brown || 'Brown',
        blonde: optionsT?.blonde || 'Blonde',
      },
    }

    return labelMap[key]?.[value] || value
  }

  // 선택된 항목들 수집
  const selectedItems: { key: string; value: string }[] = []
  if (options.gender !== 'any') selectedItems.push({ key: 'gender', value: getLabel('gender', options.gender) })
  if (options.age !== 'any') selectedItems.push({ key: 'age', value: getLabel('age', options.age) })
  if (options.ethnicity !== 'any') selectedItems.push({ key: 'ethnicity', value: getLabel('ethnicity', options.ethnicity) })
  if (options.height !== 'any') selectedItems.push({ key: 'height', value: getLabel('height', options.height) })
  if (options.bodyType !== 'any') selectedItems.push({ key: 'bodyType', value: getLabel('bodyType', options.bodyType) })
  if (options.hairStyle !== 'any') selectedItems.push({ key: 'hairStyle', value: getLabel('hairStyle', options.hairStyle) })
  if (options.hairColor !== 'any') selectedItems.push({ key: 'hairColor', value: getLabel('hairColor', options.hairColor) })

  // avatarSelect 번역 타입 캐스팅
  const avatarSelectT = (t as Record<string, unknown>).avatarSelect as Record<string, string> | undefined

  if (selectedCount === 0) {
    return (
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-muted-foreground text-center">
          {aiAvatarT?.allAuto || avatarSelectT?.allAutoDesc || 'All options set to auto - AI will choose based on product'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 bg-secondary/50 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-muted-foreground font-medium">
          {aiAvatarT?.selectedOptions || avatarSelectT?.selectedOptions || 'Selected Options'}
        </p>
        <span className="text-[10px] text-primary font-medium">{selectedCount}/{totalOptions}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {selectedItems.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-medium"
          >
            {item.value}
          </span>
        ))}
      </div>
    </div>
  )
}

export function AvatarSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedAvatarId,
  selectedType,
}: AvatarSelectModalProps) {
  const { t } = useLanguage()
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [presetAvatars, setPresetAvatars] = useState<PresetAvatar[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // AI 아바타 옵션 상태
  const [showDetailedOptionsModal, setShowDetailedOptionsModal] = useState(false)
  const [detailedAiOptions, setDetailedAiOptions] = useState<DetailedAiAvatarOptions>({
    gender: 'any',
    age: 'any',
    ethnicity: 'any',
    height: 'any',
    bodyType: 'any',
    hairStyle: 'any',
    hairColor: 'any',
  })

  // 아바타 데이터 로드
  const fetchData = useCallback(async () => {
    if (!isOpen) return

    setIsLoading(true)
    try {
      // 아바타 목록과 프리셋 아바타를 병렬로 조회
      const [avatarsRes, presetAvatarsRes] = await Promise.all([
        fetch('/api/avatars'),
        fetch('/api/preset-avatars')
      ])

      if (!avatarsRes.ok) throw new Error('Failed to fetch avatars')

      const avatarsData = await avatarsRes.json()

      // COMPLETED 상태이고 image_url이 있는 아바타만 필터링
      const filteredAvatars: Avatar[] = avatarsData.avatars
        .filter((a: Avatar & { status: string }) => a.status === 'COMPLETED' && a.image_url)

      setAvatars(filteredAvatars)

      // 프리셋 아바타 로드
      if (presetAvatarsRes.ok) {
        const presetData = await presetAvatarsRes.json()
        setPresetAvatars(presetData.data || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 아바타 선택
  const handleSelectAvatar = (avatar: Avatar) => {
    if (!avatar.image_url) return

    onSelect({
      type: 'avatar',
      avatarId: avatar.id,
      avatarName: avatar.name,
      imageUrl: avatar.image_url,
      displayName: avatar.name,
      avatarOptions: avatar.options,
    })
  }

  // 프리셋 아바타 선택
  const handleSelectPreset = (preset: PresetAvatar) => {
    if (!preset.image_url) return

    onSelect({
      type: 'preset',
      avatarId: preset.id,  // avatars 테이블의 id (FK 호환)
      avatarName: preset.name,
      imageUrl: preset.image_url,
      displayName: preset.name,
      avatarOptions: preset.options || undefined,
      isPreset: true,
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 !m-0 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[80vh] bg-card rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t.avatarSelect?.title || 'Select Avatar'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.avatarSelect?.subtitle || 'Select a base avatar or outfit-swapped avatar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* AI 아바타 생성 옵션 - 클릭 시 바로 모달 열림 */}
          <div className="mb-4">
            <button
              onClick={() => setShowDetailedOptionsModal(true)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                selectedType === 'ai-generated'
                  ? 'border-primary bg-primary/10'
                  : 'border-dashed border-primary/50 hover:border-primary hover:bg-primary/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">{t.avatarSelect?.aiGenerate || 'AI generates product-matching avatar'}</h3>
                  <p className="text-xs text-muted-foreground">{t.avatarSelect?.aiGenerateDesc || 'Analyzes product info to auto-generate a matching virtual avatar'}</p>
                </div>
              </div>
              <Settings2 className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* 선택된 옵션 요약 (AI가 선택되어 있고 옵션이 있는 경우) */}
            {selectedType === 'ai-generated' && Object.values(detailedAiOptions).some(v => v !== 'any') && (
              <div className="mt-2">
                <SelectedOptionsSummary options={detailedAiOptions} t={t} />
              </div>
            )}
          </div>

          {/* AI 아바타 상세 옵션 모달 - 확인 시 바로 선택 완료 */}
          <AiAvatarOptionsModal
            isOpen={showDetailedOptionsModal}
            onClose={() => setShowDetailedOptionsModal(false)}
            onConfirm={(options) => {
              setDetailedAiOptions(options)
              // 모달 확인 시 바로 AI 아바타 선택 완료
              onSelect({
                type: 'ai-generated',
                avatarId: 'ai-generated',
                avatarName: t.avatarSelect?.aiModel || 'AI Generated Model',
                imageUrl: '',
                displayName: t.avatarSelect?.aiAutoGenerate || 'AI Auto Generate',
                aiOptions: convertToAiAvatarOptions(options),
              })
            }}
            initialOptions={detailedAiOptions}
          />

          {/* 구분선 */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t.avatarSelect?.myOwnAvatars || 'My Avatars'}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* 내 아바타 섹션 */}
              {avatars.length === 0 ? (
                <div className="text-center py-8 bg-secondary/20 rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">{t.avatarSelect?.noUserAvatars || 'No avatars created yet'}</p>
                  <Link
                    href="/dashboard/avatar/new"
                    className="inline-flex items-center gap-2 px-4 py-2 mt-3 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t.avatarSelect?.createMyAvatar || 'Create My Avatar'}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {avatars.map((avatar) => {
                    const isAvatarSelected = selectedAvatarId === avatar.id && selectedType === 'avatar'

                    return (
                      <button
                        key={avatar.id}
                        onClick={() => handleSelectAvatar(avatar)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          isAvatarSelected
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent hover:border-primary/50'
                        }`}
                      >
                        <div className="aspect-[9/16]">
                          {avatar.image_url && (
                            <img
                              src={avatar.image_url}
                              alt={avatar.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        {isAvatarSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                          <span className="text-[10px] text-white truncate block">
                            {avatar.name}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* 프리셋 아바타 섹션 */}
              {presetAvatars.length > 0 && (
                <>
                  {/* 구분선 */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{t.avatarSelect?.presetAvatars || 'Preset Avatars'}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* 프리셋 아바타 그리드 */}
                  <div className="grid grid-cols-5 gap-3">
                    {presetAvatars.map((preset) => {
                      const isSelected = selectedAvatarId === preset.id && selectedType === 'preset'

                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-transparent hover:border-primary/50'
                          }`}
                        >
                          <div className="aspect-[9/16]">
                            <img
                              src={preset.image_url || ''}
                              alt={preset.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                            <span className="text-[10px] text-white truncate block">
                              {preset.name}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
