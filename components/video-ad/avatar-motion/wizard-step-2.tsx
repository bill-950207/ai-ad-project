'use client'

import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  Video,
} from 'lucide-react'
import {
  useAvatarMotionWizard,
  StoryMethod,
} from './wizard-context'

export function WizardStep2() {
  const {
    selectedProduct,
    selectedAvatarInfo,
    storyMethod,
    setStoryMethod,
    canProceedToStep3,
    goToNextStep,
    goToPrevStep,
  } = useAvatarMotionWizard()

  // 방식 선택
  const handleSelectMethod = (method: StoryMethod) => {
    setStoryMethod(method)
  }

  // 다음 단계로
  const handleNext = () => {
    if (!canProceedToStep3()) return
    goToNextStep()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 선택된 정보 요약 */}
      <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
        {selectedAvatarInfo && (
          <div className="flex items-center gap-2">
            {selectedAvatarInfo.type === 'ai-generated' ? (
              <div className="w-8 h-10 rounded bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            ) : (
              <img
                src={selectedAvatarInfo.imageUrl}
                alt={selectedAvatarInfo.displayName}
                className="w-8 h-10 object-cover rounded"
              />
            )}
            <span className="text-sm text-foreground">{selectedAvatarInfo.displayName}</span>
          </div>
        )}
        {selectedProduct && (
          <>
            <span className="text-muted-foreground">+</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary rounded overflow-hidden">
                <img
                  src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm text-foreground">{selectedProduct.name}</span>
            </div>
          </>
        )}
      </div>

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">시나리오 설정 방식 선택</h2>
        <p className="text-muted-foreground mt-2">
          어떻게 광고 시나리오를 구성할지 선택해주세요
        </p>
      </div>

      {/* 방식 선택 카드 */}
      <div className="grid gap-4">
        {/* 직접 입력 */}
        <button
          onClick={() => handleSelectMethod('direct')}
          className={`p-5 rounded-xl border-2 text-left transition-all ${
            storyMethod === 'direct'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              storyMethod === 'direct' ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              <Edit3 className={`w-6 h-6 ${
                storyMethod === 'direct' ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-foreground">직접 입력</h3>
                {storyMethod === 'direct' && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                배경, 분위기, 카메라 앵글, 씬 구성 등을 직접 선택하여 광고를 구성합니다
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-secondary text-xs text-muted-foreground rounded">
                  세부 조정 가능
                </span>
                <span className="px-2 py-1 bg-secondary text-xs text-muted-foreground rounded">
                  자유로운 구성
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* AI 추천 */}
        <button
          onClick={() => handleSelectMethod('ai-auto')}
          className={`p-5 rounded-xl border-2 text-left transition-all ${
            storyMethod === 'ai-auto'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              storyMethod === 'ai-auto' ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              <Sparkles className={`w-6 h-6 ${
                storyMethod === 'ai-auto' ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-foreground">AI 추천</h3>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                  추천
                </span>
                {storyMethod === 'ai-auto' && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                제품과 아바타 정보를 분석하여 AI가 최적의 시나리오와 설정을 추천합니다
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-primary/10 text-xs text-primary rounded">
                  3가지 시나리오 제안
                </span>
                <span className="px-2 py-1 bg-secondary text-xs text-muted-foreground rounded">
                  자동 설정
                </span>
                <span className="px-2 py-1 bg-secondary text-xs text-muted-foreground rounded">
                  수정 요청 가능
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* 참조 영상 */}
        <button
          onClick={() => handleSelectMethod('reference')}
          className={`p-5 rounded-xl border-2 text-left transition-all ${
            storyMethod === 'reference'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              storyMethod === 'reference' ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              <Video className={`w-6 h-6 ${
                storyMethod === 'reference' ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-foreground">참조 영상 분석</h3>
                {storyMethod === 'reference' && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                기존 광고 영상을 분석하여 스타일과 구성을 추출합니다
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-secondary text-xs text-muted-foreground rounded">
                  스타일 복제
                </span>
                <span className="px-2 py-1 bg-secondary text-xs text-muted-foreground rounded">
                  YouTube 지원
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

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
          disabled={!canProceedToStep3()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 안내 메시지 */}
      {!storyMethod && (
        <p className="text-center text-sm text-muted-foreground">
          시나리오 설정 방식을 선택해주세요
        </p>
      )}
    </div>
  )
}
