/**
 * 아바타 선택/생성 단계
 *
 * 탭 방식 UI로 세 가지 선택지 제공:
 * 1. 기존 아바타 선택: 아바타 카드 그리드
 * 2. AI 추천 아바타: 성별/나이/스타일/인종/체형 옵션 선택
 * 3. 나만의 아바타 생성: AvatarForm 로직 재사용
 */

'use client'

import { useState, useEffect } from 'react'
import { Sparkles, User, Plus, Check, Loader2 } from 'lucide-react'
import { useOnboarding, OnboardingAvatar } from '../onboarding-context'
import { AiAvatarOptions, SelectedAvatarInfo } from '@/components/video-ad/avatar-select-modal'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'
import { useLanguage } from '@/contexts/language-context'

// Translation type for avatar step
type AvatarStepT = {
  loadingAvatars?: string
  existingAvatars?: string
  aiRecommend?: string
  createNew?: string
  noAvatars?: string
  noAvatarsHint?: string
  aiGenerateTitle?: string
  aiGenerateDesc?: string
  selectAvatarCharacteristics?: string
  gender?: string
  genderAny?: string
  female?: string
  male?: string
  ageGroup?: string
  ageAny?: string
  age2030?: string
  age3040?: string
  age4050?: string
  style?: string
  styleAny?: string
  styleNatural?: string
  styleProfessional?: string
  styleCasual?: string
  styleElegant?: string
  ethnicity?: string
  ethnicityAny?: string
  korean?: string
  asian?: string
  western?: string
  bodyType?: string
  bodyTypeAiRecommend?: string
  slim?: string
  average?: string
  athletic?: string
  curvy?: string
  selectAsAiModel?: string
  avatarName?: string
  avatarNamePlaceholder?: string
  basicInfo?: string
  ageRange?: string
  early20s?: string
  late20s?: string
  thirties?: string
  fortyPlus?: string
  eastAsian?: string
  caucasian?: string
  black?: string
  hispanic?: string
  creating?: string
  createAvatar?: string
  enterAvatarName?: string
  avatarCreationFailed?: string
  errorOccurred?: string
  failedToLoadAvatars?: string
  aiGeneratedModel?: string
  aiAutoGenerate?: string
}

// 탭 타입
type TabType = 'existing' | 'ai' | 'create'

interface AvatarWithOutfits extends OnboardingAvatar {
  outfits: Array<{
    id: string
    name: string
    image_url: string | null
    status: string
  }>
}

export function AvatarStep() {
  const { t } = useLanguage()
  const avatarT = t.onboarding?.avatarStep as AvatarStepT | undefined

  // Dynamic option labels
  const GENDER_OPTIONS = [
    { value: 'any', label: avatarT?.genderAny || 'Any Gender' },
    { value: 'female', label: avatarT?.female || 'Female' },
    { value: 'male', label: avatarT?.male || 'Male' },
  ] as const

  const AGE_OPTIONS = [
    { value: 'any', label: avatarT?.ageAny || 'Any Age' },
    { value: 'young', label: avatarT?.age2030 || '20-30s' },
    { value: 'middle', label: avatarT?.age3040 || '30-40s' },
    { value: 'mature', label: avatarT?.age4050 || '40-50s' },
  ] as const

  const STYLE_OPTIONS = [
    { value: 'any', label: avatarT?.styleAny || 'Any' },
    { value: 'natural', label: avatarT?.styleNatural || 'Natural' },
    { value: 'professional', label: avatarT?.styleProfessional || 'Professional' },
    { value: 'casual', label: avatarT?.styleCasual || 'Casual' },
    { value: 'elegant', label: avatarT?.styleElegant || 'Elegant' },
  ] as const

  const ETHNICITY_OPTIONS = [
    { value: 'any', label: avatarT?.ethnicityAny || 'Any' },
    { value: 'korean', label: avatarT?.korean || 'Korean' },
    { value: 'asian', label: avatarT?.asian || 'Asian' },
    { value: 'western', label: avatarT?.western || 'Western' },
  ] as const

  const BODY_TYPE_OPTIONS = [
    { value: 'any', label: avatarT?.bodyTypeAiRecommend || 'AI Recommend' },
    { value: 'slim', label: avatarT?.slim || 'Slim' },
    { value: 'average', label: avatarT?.average || 'Average' },
    { value: 'athletic', label: avatarT?.athletic || 'Athletic' },
    { value: 'curvy', label: avatarT?.curvy || 'Curvy' },
  ] as const

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
        console.error('Avatar load error:', err)
        setError(avatarT?.failedToLoadAvatars || 'Failed to load avatars')
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
      avatarName: avatarT?.aiGeneratedModel || 'AI Generated Model',
      imageUrl: '',
      displayName: avatarT?.aiAutoGenerate || 'AI Auto Generate',
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


  // 아바타 생성 제출
  const handleCreateAvatar = async () => {
    if (!avatarName.trim()) {
      setCreateError(avatarT?.enterAvatarName || 'Please enter an avatar name')
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
        throw new Error(data.error || (avatarT?.avatarCreationFailed || 'Failed to create avatar'))
      }

      const data = await res.json()
      onAvatarCreated(data.avatar.id)
    } catch (err) {
      console.error('Avatar creation error:', err)
      setCreateError(err instanceof Error ? err.message : (avatarT?.errorOccurred || 'An error occurred'))
      setIsCreatingAvatar(false)
    }
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
        <p className="text-sm text-muted-foreground">{avatarT?.loadingAvatars || 'Loading avatars...'}</p>
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
          {avatarT?.existingAvatars || 'Existing Avatars'}
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
          {avatarT?.aiRecommend || 'AI Recommend'}
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
          {avatarT?.createNew || 'Create New'}
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* 기존 아바타 탭 */}
        {activeTab === 'existing' && (
          <div>
            {avatarsWithOutfits.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{avatarT?.noAvatars || 'No avatars created'}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {avatarT?.noAvatarsHint || 'Please use AI Recommend or Create New tab'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {avatarsWithOutfits.map((avatar) => {
                  const isAvatarSelected = selectedAvatarInfo?.avatarId === avatar.id && selectedAvatarInfo?.type === 'avatar'

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
                        <span className="text-[10px] text-white truncate block">{avatar.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
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
                  <h3 className="font-medium text-foreground">{avatarT?.aiGenerateTitle || 'AI generates avatar for your product'}</h3>
                  <p className="text-xs text-muted-foreground">{avatarT?.aiGenerateDesc || 'Analyzes product info to auto-generate a matching virtual avatar'}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{avatarT?.selectAvatarCharacteristics || 'Select avatar characteristics to generate'}</p>

            {/* 성별 */}
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">{avatarT?.gender || 'Gender'}</label>
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
              <label className="text-xs font-medium text-foreground mb-2 block">{avatarT?.ageGroup || 'Age Group'}</label>
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
              <label className="text-xs font-medium text-foreground mb-2 block">{avatarT?.ethnicity || 'Ethnicity'}</label>
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
              <label className="text-xs font-medium text-foreground mb-2 block">{avatarT?.bodyType || 'Body Type'}</label>
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
              <label className="text-xs font-medium text-foreground mb-2 block">{avatarT?.style || 'Style'}</label>
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
              {avatarT?.selectAsAiModel || 'Select as AI Model'}
            </button>
          </div>
        )}

        {/* 새로 만들기 탭 */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {/* 아바타 이름 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {avatarT?.avatarName || 'Avatar Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={avatarName}
                onChange={(e) => setAvatarName(e.target.value)}
                placeholder={avatarT?.avatarNamePlaceholder || 'e.g., Bright Model'}
                className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* 기본 정보 */}
            <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{avatarT?.basicInfo || 'Basic Info'}</h3>

              {/* 성별 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">{avatarT?.gender || 'Gender'}</label>
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
                      {v === 'female' ? (avatarT?.female || 'Female') : (avatarT?.male || 'Male')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 나이대 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">{avatarT?.ageRange || 'Age Range'}</label>
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
                      {v === 'early20s' ? (avatarT?.early20s || 'Early 20s') : v === 'late20s' ? (avatarT?.late20s || 'Late 20s') : v === '30s' ? (avatarT?.thirties || '30s') : (avatarT?.fortyPlus || '40+')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 인종 */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">{avatarT?.ethnicity || 'Ethnicity'}</label>
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
                      {v === 'eastAsian' ? (avatarT?.eastAsian || 'East Asian') : v === 'caucasian' ? (avatarT?.caucasian || 'Caucasian') : v === 'black' ? (avatarT?.black || 'Black') : (avatarT?.hispanic || 'Hispanic')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 체형 */}
            <div className="bg-secondary/20 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{avatarT?.bodyType || 'Body Type'}</h3>

              <div>
                <label className="block text-xs text-muted-foreground mb-2">{avatarT?.bodyType || 'Body Type'}</label>
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
                      {v === 'slim' ? (avatarT?.slim || 'Slim') : v === 'average' ? (avatarT?.average || 'Average') : v === 'athletic' ? (avatarT?.athletic || 'Athletic') : (avatarT?.curvy || 'Curvy')}
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
                  <span>{avatarT?.creating || 'Creating...'}</span>
                </>
              ) : (
                avatarT?.createAvatar || 'Create Avatar'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
