/**
 * 아바타 선택/생성 단계
 *
 * 탭 방식 UI로 세 가지 선택지 제공:
 * 1. 기존 아바타 선택: 아바타 카드 그리드 (의상 포함)
 * 2. AI 추천 아바타: 성별/나이/스타일/인종/체형 옵션 선택
 * 3. 나만의 아바타 생성: AvatarForm 로직 재사용
 */

'use client'

import { useState, useEffect } from 'react'
import { Sparkles, User, Plus, Check, Loader2, ChevronDown, Shirt } from 'lucide-react'
import { useOnboarding, OnboardingAvatar } from '../onboarding-context'
import { AiAvatarOptions, SelectedAvatarInfo } from '@/components/video-ad/avatar-select-modal'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'

// 탭 타입
type TabType = 'existing' | 'ai' | 'create'

// AI 아바타 옵션
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

interface AvatarWithOutfits extends OnboardingAvatar {
  outfits: Array<{
    id: string
    name: string
    image_url: string | null
    status: string
  }>
}

export function AvatarStep() {
  const {
    avatars,
    selectedAvatarInfo,
    isLoadingAvatars,
    isCreatingAvatar,
    setAvatars,
    setSelectedAvatarInfo,
    setIsLoadingAvatars,
    setAiAvatarOptions,
    setIsCreatingAvatar,
    onAvatarCreated,
    goToStep,
    setError,
  } = useOnboarding()

  // 탭 상태 (기존 아바타가 있으면 existing, 없으면 ai)
  const [activeTab, setActiveTab] = useState<TabType>('existing')
  const [avatarsWithOutfits, setAvatarsWithOutfits] = useState<AvatarWithOutfits[]>([])
  const [expandedAvatarId, setExpandedAvatarId] = useState<string | null>(null)

  // AI 옵션 상태
  const [aiGender, setAiGender] = useState<'male' | 'female' | 'any'>('any')
  const [aiAge, setAiAge] = useState<'young' | 'middle' | 'mature' | 'any'>('any')
  const [aiStyle, setAiStyle] = useState<'natural' | 'professional' | 'casual' | 'elegant' | 'any'>('any')
  const [aiEthnicity, setAiEthnicity] = useState<'korean' | 'asian' | 'western' | 'any'>('any')
  const [aiBodyType, setAiBodyType] = useState<'slim' | 'average' | 'athletic' | 'curvy' | 'any'>('any')

  // 아바타 생성 폼 상태
  const [avatarName, setAvatarName] = useState('')
  const [avatarOptions, setAvatarOptions] = useState<AvatarOptions>({})
  const [createError, setCreateError] = useState<string | null>(null)

  // 아바타 및 의상 목록 로드
  useEffect(() => {
    const fetchAvatars = async () => {
      setIsLoadingAvatars(true)
      try {
        const res = await fetch('/api/avatars?includeOutfits=true')
        if (!res.ok) throw new Error('Failed to fetch avatars')

        const data = await res.json()
        const completedAvatars = (data.avatars || [])
          .filter((a: OnboardingAvatar) => a.status === 'COMPLETED' && a.image_url)
          .map((avatar: OnboardingAvatar & { outfits?: Array<{ id: string; name: string; image_url: string | null; status: string }> }) => ({
            ...avatar,
            outfits: (avatar.outfits || []).filter(o => o.status === 'COMPLETED' && o.image_url),
          }))

        setAvatars(completedAvatars)
        setAvatarsWithOutfits(completedAvatars)

        // 아바타가 없으면 AI 탭으로 전환
        if (completedAvatars.length === 0) {
          setActiveTab('ai')
        }
      } catch (err) {
        console.error('아바타 로드 오류:', err)
        setError('아바타 목록을 불러올 수 없습니다')
      } finally {
        setIsLoadingAvatars(false)
      }
    }
    fetchAvatars()
  }, [setAvatars, setIsLoadingAvatars, setError])

  // AI 아바타 선택
  const handleSelectAiAvatar = () => {
    const aiOptions: AiAvatarOptions = {
      targetGender: aiGender,
      targetAge: aiAge,
      style: aiStyle,
      ethnicity: aiEthnicity,
      bodyType: aiBodyType,
    }

    setAiAvatarOptions(aiOptions)
    setSelectedAvatarInfo({
      type: 'ai-generated',
      avatarId: 'ai-generated',
      avatarName: 'AI 생성 모델',
      imageUrl: '',
      displayName: 'AI 자동 생성',
      aiOptions,
    })
    goToStep('complete')
  }

  // 기존 아바타 선택
  const handleSelectAvatar = (avatar: AvatarWithOutfits) => {
    if (!avatar.image_url) return

    setSelectedAvatarInfo({
      type: 'avatar',
      avatarId: avatar.id,
      avatarName: avatar.name,
      imageUrl: avatar.image_url,
      displayName: avatar.name,
    })
  }

  // 의상 선택
  const handleSelectOutfit = (avatar: AvatarWithOutfits, outfit: { id: string; name: string; image_url: string | null }) => {
    if (!outfit.image_url) return

    setSelectedAvatarInfo({
      type: 'outfit',
      avatarId: avatar.id,
      avatarName: avatar.name,
      outfitId: outfit.id,
      outfitName: outfit.name,
      imageUrl: outfit.image_url,
      displayName: `${avatar.name} - ${outfit.name}`,
    })
  }

  // 아바타 생성 제출
  const handleCreateAvatar = async () => {
    if (!avatarName.trim()) {
      setCreateError('아바타 이름을 입력해주세요')
      return
    }

    setIsCreatingAvatar(true)
    setCreateError(null)

    try {
      const res = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: avatarName.trim(),
          options: avatarOptions,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '아바타 생성에 실패했습니다')
      }

      const data = await res.json()
      onAvatarCreated(data.avatar.id)
    } catch (err) {
      console.error('아바타 생성 오류:', err)
      setCreateError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setIsCreatingAvatar(false)
    }
  }

  // 아바타 확장/축소
  const toggleAvatarExpand = (avatarId: string) => {
    setExpandedAvatarId(expandedAvatarId === avatarId ? null : avatarId)
  }

  // 옵션 업데이트 헬퍼
  const updateOption = <K extends keyof AvatarOptions>(key: K, value: AvatarOptions[K]) => {
    setAvatarOptions(prev => ({ ...prev, [key]: value }))
  }

  // 로딩 중
  if (isLoadingAvatars) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">아바타 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab('existing')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'existing'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-foreground hover:bg-secondary'
          }`}
        >
          <User className="w-4 h-4" />
          기존 아바타
          {avatarsWithOutfits.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === 'existing' ? 'bg-white/20' : 'bg-primary/20 text-primary'
            }`}>
              {avatarsWithOutfits.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'ai'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-foreground hover:bg-secondary'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 추천
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'create'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-foreground hover:bg-secondary'
          }`}
        >
          <Plus className="w-4 h-4" />
          새로 만들기
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* 기존 아바타 탭 */}
        {activeTab === 'existing' && (
          <div className="space-y-3">
            {avatarsWithOutfits.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">생성된 아바타가 없습니다</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI 추천 또는 새로 만들기 탭을 이용해주세요
                </p>
              </div>
            ) : (
              <>
                {avatarsWithOutfits.map((avatar) => {
                  const isExpanded = expandedAvatarId === avatar.id
                  const hasOutfits = avatar.outfits.length > 0
                  const isAvatarSelected = selectedAvatarInfo?.avatarId === avatar.id && selectedAvatarInfo?.type === 'avatar'

                  return (
                    <div
                      key={avatar.id}
                      className="bg-secondary/30 border border-border rounded-xl overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-3">
                        {/* 아바타 선택 버튼 */}
                        <button
                          onClick={() => handleSelectAvatar(avatar)}
                          className={`relative flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
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
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                            <span className="text-[10px] text-white">기본</span>
                          </div>
                        </button>

                        {/* 아바타 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate text-sm">
                            {avatar.name}
                          </h3>
                          {hasOutfits && (
                            <button
                              onClick={() => toggleAvatarExpand(avatar.id)}
                              className="flex items-center gap-1 mt-1 text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              <Shirt className="w-3 h-3" />
                              <span>의상 {avatar.outfits.length}개</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 의상 목록 */}
                      {isExpanded && hasOutfits && (
                        <div className="border-t border-border bg-secondary/20 p-3">
                          <p className="text-xs text-muted-foreground mb-2">의상 교체 목록</p>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {avatar.outfits.map((outfit) => {
                              const isOutfitSelected = selectedAvatarInfo?.outfitId === outfit.id

                              return (
                                <button
                                  key={outfit.id}
                                  onClick={() => handleSelectOutfit(avatar, outfit)}
                                  className={`relative flex-shrink-0 w-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
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
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
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

              </>
            )}
          </div>
        )}

        {/* AI 추천 탭 */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">AI가 제품에 맞는 아바타 생성</h3>
                  <p className="text-xs text-muted-foreground">제품 정보를 분석하여 어울리는 가상 아바타를 자동 생성</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">생성할 아바타의 특성을 선택하세요</p>

            {/* 성별 */}
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

            {/* 연령대 */}
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">연령대</label>
              <div className="flex gap-2 flex-wrap">
                {AGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAiAge(option.value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-w-[70px] ${
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

            {/* 인종 */}
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

            {/* 체형 */}
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

            {/* 스타일 */}
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

            {/* 선택 버튼 */}
            <button
              onClick={handleSelectAiAvatar}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4" />
              AI 모델로 선택하기
            </button>
          </div>
        )}

        {/* 새로 만들기 탭 */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {/* 아바타 이름 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                아바타 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={avatarName}
                onChange={(e) => setAvatarName(e.target.value)}
                placeholder="예: 밝은 모델"
                className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* 기본 정보 */}
            <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">기본 정보</h3>

              {/* 성별 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">성별</label>
                <div className="flex gap-2 flex-wrap">
                  {(['female', 'male'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateOption('gender', v)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        avatarOptions.gender === v
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-foreground hover:bg-secondary'
                      }`}
                    >
                      {v === 'female' ? '여성' : '남성'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 나이대 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">나이대</label>
                <div className="flex gap-2 flex-wrap">
                  {(['early20s', 'late20s', '30s', '40plus'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateOption('age', v)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        avatarOptions.age === v
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-foreground hover:bg-secondary'
                      }`}
                    >
                      {v === 'early20s' ? '20대 초반' : v === 'late20s' ? '20대 후반' : v === '30s' ? '30대' : '40대+'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 인종 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">인종</label>
                <div className="flex gap-2 flex-wrap">
                  {(['eastAsian', 'caucasian', 'black', 'hispanic'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateOption('ethnicity', v)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        avatarOptions.ethnicity === v
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-foreground hover:bg-secondary'
                      }`}
                    >
                      {v === 'eastAsian' ? 'East Asian' : v === 'caucasian' ? 'Caucasian' : v === 'black' ? 'Black' : 'Hispanic'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 체형 */}
            <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">체형</h3>

              <div>
                <label className="block text-xs text-muted-foreground mb-2">체형</label>
                <div className="flex gap-2 flex-wrap">
                  {(['slim', 'average', 'athletic', 'curvy'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateOption('bodyType', v)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        avatarOptions.bodyType === v
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-foreground hover:bg-secondary'
                      }`}
                    >
                      {v === 'slim' ? '날씬' : v === 'average' ? '보통' : v === 'athletic' ? '탄탄' : '글래머'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {createError && (
              <p className="text-sm text-red-500">{createError}</p>
            )}

            {/* 생성 버튼 */}
            <button
              onClick={handleCreateAvatar}
              disabled={isCreatingAvatar || !avatarName.trim()}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isCreatingAvatar ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>생성 중...</span>
                </>
              ) : (
                '아바타 생성하기'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
