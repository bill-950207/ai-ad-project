/**
 * 아바타 선택 모달
 *
 * 기본 아바타와 의상 교체 아바타를 모두 보여주고 선택할 수 있습니다.
 * AI가 제품에 어울리는 아바타를 자동 생성하는 옵션도 제공합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Check, Shirt, Sparkles, ChevronDown } from 'lucide-react'

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

interface AvatarOutfit {
  id: string
  name: string
  image_url: string | null
  status: string
}

interface AvatarWithOutfits extends Avatar {
  outfits: AvatarOutfit[]
}

/** AI 아바타 생성 옵션 */
export interface AiAvatarOptions {
  targetGender: 'male' | 'female' | 'any'
  targetAge: 'young' | 'middle' | 'mature' | 'any'
  style: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
  ethnicity: 'korean' | 'asian' | 'western' | 'any'
  bodyType: 'slim' | 'average' | 'athletic' | 'curvy' | 'any'
}

export interface SelectedAvatarInfo {
  type: 'avatar' | 'outfit' | 'ai-generated'
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
}

interface AvatarSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (avatar: SelectedAvatarInfo) => void
  selectedAvatarId?: string
  selectedOutfitId?: string
  selectedType?: 'avatar' | 'outfit' | 'ai-generated'
}

// AI 아바타 옵션 라벨
const GENDER_OPTIONS = [
  { value: 'any', label: '성별 무관' },
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
] as const

const AGE_OPTIONS = [
  { value: 'any', label: '연령 무관' },
  { value: 'young', label: '20-30대' },
  { value: 'middle', label: '30-40대' },
  { value: 'mature', label: '40-50대' },
] as const

const STYLE_OPTIONS = [
  { value: 'any', label: '무관' },
  { value: 'natural', label: '자연스러운' },
  { value: 'professional', label: '전문적인' },
  { value: 'casual', label: '캐주얼' },
  { value: 'elegant', label: '우아한' },
] as const

const ETHNICITY_OPTIONS = [
  { value: 'any', label: '무관' },
  { value: 'korean', label: '한국인' },
  { value: 'asian', label: '아시아인' },
  { value: 'western', label: '서양인' },
] as const

const BODY_TYPE_OPTIONS = [
  { value: 'any', label: 'AI 추천' },
  { value: 'slim', label: '날씬' },
  { value: 'average', label: '보통' },
  { value: 'athletic', label: '탄탄' },
  { value: 'curvy', label: '글래머' },
] as const

export function AvatarSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedAvatarId,
  selectedOutfitId,
  selectedType,
}: AvatarSelectModalProps) {
  const [avatarsWithOutfits, setAvatarsWithOutfits] = useState<AvatarWithOutfits[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedAvatarId, setExpandedAvatarId] = useState<string | null>(null)

  // AI 아바타 옵션 상태
  const [showAiOptions, setShowAiOptions] = useState(selectedType === 'ai-generated')
  const [aiGender, setAiGender] = useState<'male' | 'female' | 'any'>('any')
  const [aiAge, setAiAge] = useState<'young' | 'middle' | 'mature' | 'any'>('any')
  const [aiStyle, setAiStyle] = useState<'natural' | 'professional' | 'casual' | 'elegant' | 'any'>('any')
  const [aiEthnicity, setAiEthnicity] = useState<'korean' | 'asian' | 'western' | 'any'>('any')
  const [aiBodyType, setAiBodyType] = useState<'slim' | 'average' | 'athletic' | 'curvy' | 'any'>('any')

  // 아바타 및 의상 데이터 로드 (N+1 문제 해결: 단일 쿼리로 의상까지 조회)
  const fetchData = useCallback(async () => {
    if (!isOpen) return

    setIsLoading(true)
    try {
      // 아바타 + 의상 목록을 한 번의 API 호출로 조회
      const avatarsRes = await fetch('/api/avatars?includeOutfits=true')
      if (!avatarsRes.ok) throw new Error('Failed to fetch avatars')

      const avatarsData = await avatarsRes.json()

      // COMPLETED 상태이고 image_url이 있는 아바타만 필터링
      const avatarsWithOutfitsData: AvatarWithOutfits[] = avatarsData.avatars
        .filter((a: Avatar & { status: string }) => a.status === 'COMPLETED' && a.image_url)
        .map((avatar: Avatar & { outfits?: AvatarOutfit[] }) => ({
          ...avatar,
          outfits: avatar.outfits || [],
        }))

      setAvatarsWithOutfits(avatarsWithOutfitsData)

      // 선택된 아바타가 있으면 해당 아바타 확장
      if (selectedAvatarId) {
        setExpandedAvatarId(selectedAvatarId)
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, selectedAvatarId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 기본 아바타 선택
  const handleSelectAvatar = (avatar: AvatarWithOutfits) => {
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

  // 의상 교체 아바타 선택
  const handleSelectOutfit = (avatar: AvatarWithOutfits, outfit: AvatarOutfit) => {
    if (!outfit.image_url) return

    onSelect({
      type: 'outfit',
      avatarId: avatar.id,
      avatarName: avatar.name,
      outfitId: outfit.id,
      outfitName: outfit.name,
      imageUrl: outfit.image_url,
      displayName: `${avatar.name} - ${outfit.name}`,
      avatarOptions: avatar.options,
    })
  }

  // 아바타 확장/축소 토글
  const toggleAvatarExpand = (avatarId: string) => {
    setExpandedAvatarId(expandedAvatarId === avatarId ? null : avatarId)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
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
              아바타 선택
            </h2>
            <p className="text-sm text-muted-foreground">
              기본 아바타 또는 의상 교체된 아바타를 선택하세요
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
          {/* AI 아바타 생성 옵션 */}
          <div className="mb-4">
            <button
              onClick={() => setShowAiOptions(!showAiOptions)}
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
                  <h3 className="font-medium text-foreground">AI가 제품에 맞는 아바타 생성</h3>
                  <p className="text-xs text-muted-foreground">제품 정보를 분석하여 어울리는 가상 아바타을 자동 생성합니다</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showAiOptions ? 'rotate-180' : ''}`} />
            </button>

            {/* AI 옵션 펼침 */}
            {showAiOptions && (
              <div className="mt-3 p-4 bg-secondary/30 rounded-xl border border-border space-y-4">
                <p className="text-sm text-muted-foreground">생성할 아바타의 특성을 선택하세요</p>

                {/* 성별 선택 */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">성별</label>
                  <div className="flex gap-2">
                    {GENDER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAiGender(option.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          aiGender === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground hover:bg-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 연령대 선택 */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">연령대</label>
                  <div className="flex gap-2">
                    {AGE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAiAge(option.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          aiAge === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground hover:bg-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 스타일 선택 */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">스타일</label>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAiStyle(option.value)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          aiStyle === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground hover:bg-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 인종 선택 */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">인종</label>
                  <div className="flex gap-2">
                    {ETHNICITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAiEthnicity(option.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          aiEthnicity === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground hover:bg-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 체형 선택 */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">체형</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BODY_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAiBodyType(option.value)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          aiBodyType === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground hover:bg-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선택 버튼 */}
                <button
                  onClick={() => {
                    onSelect({
                      type: 'ai-generated',
                      avatarId: 'ai-generated',
                      avatarName: 'AI 생성 모델',
                      imageUrl: '',  // AI 생성은 이미지 URL이 없음
                      displayName: 'AI 자동 생성',
                      aiOptions: {
                        targetGender: aiGender,
                        targetAge: aiAge,
                        style: aiStyle,
                        ethnicity: aiEthnicity,
                        bodyType: aiBodyType,
                      },
                    })
                  }}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 모델로 선택하기
                </button>
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">또는 기존 아바타 선택</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : avatarsWithOutfits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">생성된 아바타가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                먼저 아바타를 생성해주세요
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {avatarsWithOutfits.map((avatar) => {
                const isExpanded = expandedAvatarId === avatar.id
                const hasOutfits = avatar.outfits.length > 0
                const isAvatarSelected = selectedAvatarId === avatar.id && !selectedOutfitId

                return (
                  <div
                    key={avatar.id}
                    className="bg-secondary/30 border border-border rounded-xl overflow-hidden"
                  >
                    {/* 아바타 헤더 */}
                    <div className="flex items-center gap-3 p-3">
                      {/* 기본 아바타 선택 버튼 */}
                      <button
                        onClick={() => handleSelectAvatar(avatar)}
                        className={`relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          isAvatarSelected
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent hover:border-primary/50'
                        }`}
                      >
                        {avatar.image_url && (
                          <img
                            src={avatar.image_url}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isAvatarSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        {/* 기본 아바타 라벨 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                          <span className="text-[10px] text-white">기본</span>
                        </div>
                      </button>

                      {/* 아바타 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {avatar.name}
                        </h3>
                        {hasOutfits && (
                          <button
                            onClick={() => toggleAvatarExpand(avatar.id)}
                            className="flex items-center gap-1 mt-1 text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            <Shirt className="w-3 h-3" />
                            <span>의상 {avatar.outfits.length}개</span>
                            <svg
                              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        {!hasOutfits && (
                          <p className="text-xs text-muted-foreground mt-1">
                            등록된 의상이 없습니다
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 의상 목록 (확장 시) */}
                    {isExpanded && hasOutfits && (
                      <div className="border-t border-border bg-secondary/20 p-3">
                        <p className="text-xs text-muted-foreground mb-2">의상 교체 목록</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {avatar.outfits.map((outfit) => {
                            const isOutfitSelected = selectedOutfitId === outfit.id

                            return (
                              <button
                                key={outfit.id}
                                onClick={() => handleSelectOutfit(avatar, outfit)}
                                className={`relative flex-shrink-0 w-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                  isOutfitSelected
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-transparent hover:border-primary/50'
                                }`}
                              >
                                <div className="aspect-[9/16]">
                                  {outfit.image_url && (
                                    <img
                                      src={outfit.image_url}
                                      alt={outfit.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                {isOutfitSelected && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                                  <span className="text-[10px] text-white truncate block">
                                    {outfit.name}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
