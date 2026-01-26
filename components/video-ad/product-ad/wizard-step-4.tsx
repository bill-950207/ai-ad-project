'use client'

import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Maximize,
  Sparkles,
  Film,
  Plus,
  Minus,
  Lock,
  Unlock,
  Crown,
} from 'lucide-react'
import { useProductAdWizard, AspectRatio, VideoResolution } from './wizard-context'

// 사용자 플랜 타입
interface UserPlan {
  planType: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'
  displayName: string
}

// FREE 사용자 제한
const FREE_USER_LIMITS = {
  maxResolution: '540p' as VideoResolution,
  maxDuration: 4,
  maxSceneCount: 3,
}

// Vidu Q2 해상도 옵션
const RESOLUTION_OPTIONS: { value: VideoResolution; label: string; desc: string; creditsPerSecond: number }[] = [
  { value: '540p', label: 'SD (540p)', desc: '빠른 생성', creditsPerSecond: 5 },
  { value: '720p', label: 'HD (720p)', desc: '표준 화질', creditsPerSecond: 8 },
  { value: '1080p', label: 'FHD (1080p)', desc: '고품질', creditsPerSecond: 12 },
]

// 크레딧 계산 함수 (씬별 시간 합계 사용)
const calculateCredits = (sceneDurations: number[], resolution: VideoResolution): number => {
  const option = RESOLUTION_OPTIONS.find(o => o.value === resolution)
  if (!option) return 0
  const totalDuration = sceneDurations.reduce((sum, d) => sum + d, 0)
  return option.creditsPerSecond * totalDuration
}

// 비율 옵션
const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; icon: string; desc: string }[] = [
  { value: '16:9', label: '가로형', icon: '▬', desc: '유튜브, 웹사이트' },
  { value: '9:16', label: '세로형', icon: '▮', desc: '릴스, 숏츠, 틱톡' },
  { value: '1:1', label: '정방형', icon: '■', desc: '인스타그램 피드' },
]

export function WizardStep4() {
  const {
    aspectRatio,
    setAspectRatio,
    sceneDurations,
    updateSceneDuration,
    videoResolution,
    setVideoResolution,
    sceneCount,
    setSceneCount,
    videoModel,
    setVideoModel,
    canProceedToStep5,
    goToNextStep,
    goToPrevStep,
    saveDraft,
    isVideoSettingsFromScenario,
    unlockVideoSettings,
  } = useProductAdWizard()

  // 사용자 플랜 정보
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const isFreeUser = userPlan?.planType === 'FREE'

  // 사용자 플랜 정보 로드
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const res = await fetch('/api/user/plan')
        if (res.ok) {
          const data = await res.json()
          setUserPlan(data)
          // FREE 사용자인 경우 기본값 조정
          if (data.planType === 'FREE') {
            setVideoResolution(FREE_USER_LIMITS.maxResolution)
            if (sceneCount > FREE_USER_LIMITS.maxSceneCount) {
              setSceneCount(FREE_USER_LIMITS.maxSceneCount)
            }
          }
        }
      } catch (error) {
        console.error('플랜 정보 로드 오류:', error)
      }
    }
    fetchUserPlan()
  }, [setVideoResolution, setSceneCount, sceneCount])

  // Vidu Q2 모델 강제 설정
  useEffect(() => {
    if (videoModel !== 'vidu-q2') {
      setVideoModel('vidu-q2')
    }
  }, [videoModel, setVideoModel])

  // 스크롤 상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 총 영상 길이 계산
  const totalDuration = sceneDurations.slice(0, sceneCount).reduce((sum, d) => sum + d, 0)

  // 예상 크레딧 계산
  const estimatedCredits = calculateCredits(sceneDurations.slice(0, sceneCount), videoResolution)

  // 다음 단계로
  const handleNext = async () => {
    if (!canProceedToStep5()) return

    await saveDraft({
      wizardStep: 5,
      aspectRatio,
    })
    goToNextStep()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">영상 설정</h2>
        <p className="text-muted-foreground mt-2">
          영상 비율, 품질, 씬 개수를 설정하세요
        </p>
      </div>

      {/* AI 추천 설정 알림 */}
      {isVideoSettingsFromScenario && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI 시나리오 추천 설정</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">적용됨</span>
          </div>
          <button
            onClick={unlockVideoSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <Unlock className="w-3.5 h-3.5" />
            수정
          </button>
        </div>
      )}

      {/* 비율 선택 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Maximize className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">영상 비율</h3>
          {isVideoSettingsFromScenario && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setAspectRatio(option.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                aspectRatio === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-medium text-foreground">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 씬 개수 및 씬별 시간 설정 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">씬 구성</h3>
          {isVideoSettingsFromScenario && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            총 {totalDuration}초
          </span>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          씬 개수를 선택하고, 각 씬의 영상 길이를 조절하세요 (1~8초)
        </p>

        {/* 씬 개수 선택 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-16">씬 개수</span>
          <div className="flex gap-1.5 flex-1">
            {[2, 3, 4, 5, 6, 7, 8].map((count) => {
              const isLocked = isFreeUser && count > FREE_USER_LIMITS.maxSceneCount
              return (
                <button
                  key={count}
                  onClick={() => !isLocked && setSceneCount(count)}
                  disabled={isLocked}
                  className={`relative flex-1 h-12 rounded-xl border-2 transition-all font-bold text-lg ${
                    isLocked
                      ? 'border-border bg-secondary/30 cursor-not-allowed opacity-60 text-muted-foreground'
                      : sceneCount === count
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {count}
                  {isLocked && (
                    <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        {isFreeUser && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Crown className="w-3 h-3" />
            STARTER 이상 구독 시 최대 8개 씬까지 생성 가능
          </p>
        )}

        {/* 씬별 영상 길이 */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(sceneCount, 7)}, 1fr)` }}>
          {Array.from({ length: sceneCount }).map((_, index) => {
            const duration = sceneDurations[index] || 3
            const maxDuration = isFreeUser ? FREE_USER_LIMITS.maxDuration : 8
            return (
              <div
                key={index}
                className="flex flex-col items-center p-2 rounded-xl border-2 border-border bg-secondary/20"
              >
                <span className="text-xs text-muted-foreground mb-1">씬 {index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateSceneDuration(index, duration - 1)}
                    disabled={duration <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-lg font-bold text-foreground">{duration}</span>
                  <button
                    onClick={() => updateSceneDuration(index, duration + 1)}
                    disabled={duration >= maxDuration}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground mt-0.5">초</span>
              </div>
            )
          })}
        </div>
        {isFreeUser && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Crown className="w-3 h-3" />
            STARTER 이상 구독 시 씬당 최대 8초까지 설정 가능
          </p>
        )}
      </div>

      {/* 영상 해상도 선택 (맨 아래로 이동) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">영상 품질</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {RESOLUTION_OPTIONS.map((option) => {
            const isLocked = isFreeUser && option.value !== FREE_USER_LIMITS.maxResolution
            return (
              <button
                key={option.value}
                onClick={() => !isLocked && setVideoResolution(option.value)}
                disabled={isLocked}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isLocked
                    ? 'border-border bg-secondary/30 cursor-not-allowed opacity-60'
                    : videoResolution === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                }`}
              >
                {isLocked && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>STARTER+</span>
                  </div>
                )}
                <div className="text-center">
                  <div className={`font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                  <div className="text-xs text-primary mt-2">{option.creditsPerSecond} 크레딧/초</div>
                </div>
              </button>
            )
          })}
        </div>
        {isFreeUser && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Crown className="w-3 h-3" />
            STARTER 이상 구독 시 HD/FHD 품질 사용 가능
          </p>
        )}
      </div>

      {/* 예상 크레딧 */}
      {aspectRatio && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">예상 크레딧</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sceneCount}개 씬 × 총 {totalDuration}초 × {RESOLUTION_OPTIONS.find(o => o.value === videoResolution)?.creditsPerSecond || 0} 크레딧/초
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{estimatedCredits}</p>
              <p className="text-xs text-muted-foreground">크레딧</p>
            </div>
          </div>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={goToPrevStep}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceedToStep5()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 안내 메시지 */}
      {!aspectRatio && (
        <p className="text-center text-sm text-muted-foreground">
          영상 비율을 선택해주세요
        </p>
      )}
    </div>
  )
}
