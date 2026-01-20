'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  RefreshCw,
  Play,
  Lightbulb,
  Edit3,
  Check,
  Image,
  MapPin,
} from 'lucide-react'
import { useAvatarMotionWizard } from './wizard-context'

// API에서 받아온 스토리 템플릿 타입
interface StoryTemplate {
  id: string
  title: string
  description: string
  concept?: string        // 광고 컨셉 상세 설명
  background?: string     // 배경/장소 상세 설명
  startFrame: string      // 시작 프레임 (필수)
  endFrame?: string       // 끝 프레임 (선택 - 호환성 유지)
  mood: string
  action: string
  emotionalArc?: string   // 감정의 흐름
  motionPromptEN?: string // 영상 생성용 영어 모션 설명 (kling-2.6용)
}

interface StoryTemplateCardProps {
  template: StoryTemplate
  isSelected: boolean
  onSelect: () => void
}

function StoryTemplateCard({ template, isSelected, onSelect }: StoryTemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 bg-card'
      }`}
    >
      {/* 헤더: 제목 + 설명 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{template.title}</h4>
            {template.emotionalArc && (
              <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {template.emotionalArc}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-2">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* 컨셉 설명 (있는 경우) */}
      {template.concept && (
        <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-amber-600 font-medium">컨셉</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{template.concept}</p>
        </div>
      )}

      {/* 배경 설명 (있는 경우) */}
      {template.background && (
        <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] text-blue-600 font-medium">배경/장소</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{template.background}</p>
        </div>
      )}

      {/* 시작 프레임 */}
      <div className="p-2.5 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Play className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-green-600 font-medium">첫 프레임</span>
        </div>
        <p className="text-xs text-foreground leading-relaxed line-clamp-4">{template.startFrame}</p>
      </div>

      {/* 분위기 태그 */}
      {template.mood && (
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">분위기:</span>
          <span className="text-xs text-foreground font-medium">{template.mood}</span>
        </div>
      )}
    </button>
  )
}

export function WizardStep3() {
  const {
    storyMethod,
    storyInfo,
    setStoryInfo,
    isGeneratingStory,
    setIsGeneratingStory,
    updateStartFrame,
    selectedProduct,
    selectedAvatarInfo,
    canProceedToStep4,
    goToNextStep,
    goToPrevStep,
    // 컨텍스트에서 관리되는 스토리 템플릿 상태
    generatedStoryTemplates,
    setGeneratedStoryTemplates,
    selectedStoryTemplateId,
    setSelectedStoryTemplateId,
    // 배경/장소 프롬프트
    locationPrompt,
    setLocationPrompt,
    saveDraft,
    isSaving,
  } = useAvatarMotionWizard()

  const [generationError, setGenerationError] = useState<string | null>(null)

  // AI 스토리 생성 API 호출
  const generateStories = useCallback(async () => {
    setIsGeneratingStory(true)
    setGenerationError(null)
    setSelectedStoryTemplateId(null)
    setStoryInfo(null)
    setGeneratedStoryTemplates([])

    try {
      const response = await fetch('/api/avatar-motion/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct?.name || '',
          productDescription: selectedProduct?.description || '',
          productCategory: '',
          avatarType: selectedAvatarInfo?.type || 'ai-generated',
          avatarDescription: selectedAvatarInfo?.displayName || '',
          locationPrompt: locationPrompt || undefined,  // 빈 문자열이면 AI 자동 선택
        }),
      })

      if (!response.ok) {
        throw new Error('스토리 생성에 실패했습니다')
      }

      const data = await response.json()
      if (data.success && data.stories) {
        setGeneratedStoryTemplates(data.stories)
      } else {
        throw new Error('스토리 데이터가 없습니다')
      }
    } catch (error) {
      console.error('스토리 생성 오류:', error)
      setGenerationError('스토리 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsGeneratingStory(false)
    }
  }, [selectedProduct, selectedAvatarInfo, locationPrompt, setIsGeneratingStory, setStoryInfo, setGeneratedStoryTemplates, setSelectedStoryTemplateId])

  // AI 자동 생성 시 스토리 템플릿 로드 (기존 템플릿이 없을 때만)
  useEffect(() => {
    if (storyMethod === 'ai-auto' && generatedStoryTemplates.length === 0 && !isGeneratingStory && !generationError) {
      generateStories()
    }
  }, [storyMethod, generatedStoryTemplates.length, isGeneratingStory, generationError, generateStories])

  // 템플릿 선택 시 스토리 정보 업데이트
  const handleTemplateSelect = (template: StoryTemplate) => {
    setSelectedStoryTemplateId(template.id)
    setStoryInfo({
      title: template.title,
      description: template.description,
      concept: template.concept,
      background: template.background,
      startFrame: {
        id: 'start',
        order: 1,
        description: template.startFrame,
      },
      // endFrame은 선택적 - kling-2.6에서는 사용 안함
      mood: template.mood,
      action: template.action,
      emotionalArc: template.emotionalArc,
      motionPromptEN: template.motionPromptEN, // 영어 모션 설명 저장 (kling-2.6용)
    })
  }

  // 직접 입력 시 기본 스토리 구조 초기화
  useEffect(() => {
    if (storyMethod === 'direct' && !storyInfo) {
      setStoryInfo({
        title: '커스텀 모션',
        description: '',
        startFrame: {
          id: 'start',
          order: 1,
          description: '',
        },
        // endFrame은 선택적 - kling-2.6에서는 사용 안함
      })
    }
  }, [storyMethod, storyInfo, setStoryInfo])

  // AI 스토리 재생성
  const handleRegenerateStory = () => {
    generateStories()
  }

  // 다음 단계로 이동 (DB 저장 포함)
  const handleNext = async () => {
    if (!canProceedToStep4()) return
    await saveDraft({ wizardStep: 4, status: 'GENERATING_FRAMES' })
    goToNextStep()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 스토리보드 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">스토리보드 설정</h2>
          <p className="text-sm text-muted-foreground">
            {storyMethod === 'ai-auto'
              ? 'AI가 추천하는 스토리 중 하나를 선택하거나 수정하세요'
              : storyMethod === 'reference'
              ? '참조 미디어를 기반으로 생성된 스토리를 확인하세요'
              : '시작과 끝 프레임을 직접 설명해주세요'}
          </p>
        </div>

        {storyMethod === 'ai-auto' && !isGeneratingStory && generatedStoryTemplates.length > 0 && (
          <button
            onClick={handleRegenerateStory}
            disabled={isGeneratingStory}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 생성
          </button>
        )}
      </div>

      {/* AI 로딩 */}
      {isGeneratingStory && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-foreground font-medium">AI가 스토리를 생성하고 있어요</p>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedProduct?.name || '제품'}과 아바타에 맞는 모션을 분석 중...
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {generationError && !isGeneratingStory && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-500 mb-3">{generationError}</p>
          <button
            onClick={handleRegenerateStory}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      )}

      {/* AI 자동 생성: 템플릿 선택 */}
      {storyMethod === 'ai-auto' && !isGeneratingStory && generatedStoryTemplates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI 추천 스토리</span>
            <span className="text-xs text-muted-foreground">- 선택 후 아래에서 수정 가능</span>
          </div>

          <div className="space-y-3">
            {generatedStoryTemplates.map((template) => (
              <StoryTemplateCard
                key={template.id}
                template={template}
                isSelected={selectedStoryTemplateId === template.id}
                onSelect={() => handleTemplateSelect(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 선택된 템플릿 수정 안내 (AI 자동 생성 + 선택됨) */}
      {storyMethod === 'ai-auto' && selectedStoryTemplateId && !isGeneratingStory && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <Edit3 className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">
            선택한 스토리를 아래에서 자유롭게 수정할 수 있습니다
          </span>
        </div>
      )}

      {/* 직접 입력 또는 선택된 템플릿 편집 */}
      {(storyMethod === 'direct' || storyMethod === 'reference' || selectedStoryTemplateId) && !isGeneratingStory && (
        <div className="space-y-4">
          {/* 팁 */}
          {storyMethod === 'direct' && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium">작성 팁</p>
                <p className="text-xs text-muted-foreground mt-1">
                  아바타의 포즈, 표정, 제품의 위치 등을 구체적으로 설명하면 더 정확한 영상이 생성됩니다.
                  예: &quot;아바타가 오른손으로 제품을 들고 카메라를 향해 밝게 미소 짓고 있음&quot;
                </p>
              </div>
            </div>
          )}

          {/* 배경/장소 입력 */}
          <div className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-blue-500" />
              </div>
              <span className="font-medium text-foreground">배경/장소</span>
              <span className="text-xs text-muted-foreground">(선택사항)</span>
            </div>
            <input
              type="text"
              value={locationPrompt}
              onChange={(e) => setLocationPrompt(e.target.value)}
              placeholder="예: 밝은 카페, 현대적인 거실, 야외 공원 등 (비워두면 AI가 자동 선택)"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-2">
              원하는 배경을 입력하세요. 비워두면 AI가 제품과 아바타에 맞는 배경을 자동으로 선택합니다.
            </p>
          </div>

          {/* 첫 프레임 입력 */}
          <div className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Play className="w-3 h-3 text-green-500" />
              </div>
              <span className="font-medium text-foreground">첫 프레임</span>
            </div>
            <textarea
              value={storyInfo?.startFrame.description || ''}
              onChange={(e) => updateStartFrame(e.target.value)}
              placeholder="첫 장면을 설명해주세요..."
              rows={4}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              이 이미지가 영상의 첫 장면이 됩니다. AI가 이 이미지를 기반으로 모션 영상을 생성합니다.
            </p>
          </div>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={goToPrevStep}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceedToStep4() || isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Image className="w-4 h-4" />
              프레임 생성
            </>
          )}
        </button>
      </div>

      {/* 유효성 메시지 */}
      {!canProceedToStep4() && (
        <p className="text-center text-sm text-muted-foreground">
          {storyMethod === 'ai-auto' && !selectedStoryTemplateId
            ? '스토리를 선택해주세요'
            : '첫 프레임 설명을 입력해주세요'}
        </p>
      )}
    </div>
  )
}
