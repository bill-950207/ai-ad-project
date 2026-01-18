'use client'

import { useRef, useState } from 'react'
import {
  Edit3,
  Sparkles,
  Image,
  Video,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Loader2,
  Check,
} from 'lucide-react'
import { useAvatarMotionWizard, StoryMethod } from './wizard-context'

interface MethodCardProps {
  method: StoryMethod
  icon: typeof Edit3
  title: string
  description: string
  features: string[]
  isSelected: boolean
  onSelect: () => void
  recommended?: boolean
  disabled?: boolean
  disabledReason?: string
}

function MethodCard({
  method,
  icon: Icon,
  title,
  description,
  features,
  isSelected,
  onSelect,
  recommended,
  disabled,
  disabledReason,
}: MethodCardProps) {
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={`relative w-full flex flex-col p-4 rounded-xl border transition-all text-left ${
        disabled
          ? 'border-border bg-card opacity-50 cursor-not-allowed'
          : isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 bg-card'
      }`}
    >
      {recommended && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
          추천
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-primary/20' : 'bg-secondary'
        }`}>
          <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>

        <div className="flex-1">
          <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>

        {isSelected && (
          <Check className="w-5 h-5 text-primary flex-shrink-0" />
        )}
      </div>

      <ul className="mt-3 space-y-1 pl-[52px]">
        {features.map((feature, index) => (
          <li key={index} className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary/50" />
            {feature}
          </li>
        ))}
      </ul>

      {disabled && disabledReason && (
        <p className="mt-2 pl-[52px] text-xs text-amber-500">{disabledReason}</p>
      )}
    </button>
  )
}

export function WizardStep2() {
  const {
    storyMethod,
    setStoryMethod,
    referenceUrl,
    setReferenceMedia,
    isAnalyzingReference,
    setIsAnalyzingReference,
    canProceedToStep3,
    goToNextStep,
    goToPrevStep,
    selectedProduct,
    selectedAvatarInfo,
    saveDraft,
    isSaving,
  } = useAvatarMotionWizard()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (file: File) => {
    // 이미지 또는 비디오 파일만 허용
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('이미지 또는 동영상 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 제한 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('파일 크기는 50MB 이하여야 합니다.')
      return
    }

    const url = URL.createObjectURL(file)
    setReferenceMedia(file, url)

    // 참조 미디어 분석 시뮬레이션 (실제로는 API 호출)
    setIsAnalyzingReference(true)
    // TODO: API 호출로 대체
    setTimeout(() => {
      setIsAnalyzingReference(false)
    }, 2000)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const isVideoFile = referenceUrl?.includes('video') || false

  // 다음 단계로 이동 (DB 저장 포함)
  const handleNext = async () => {
    if (!canProceedToStep3()) return
    await saveDraft({ wizardStep: 3, status: 'GENERATING_STORY' })
    goToNextStep()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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

      {/* 스토리 설정 방식 선택 */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">스토리 설정 방식 선택</h2>
        <p className="text-sm text-muted-foreground">
          모션 영상의 스토리를 어떻게 설정할지 선택하세요.
        </p>

        <div className="space-y-3 mt-4">
          <MethodCard
            method="direct"
            icon={Edit3}
            title="직접 입력"
            description="시작 프레임과 끝 프레임을 직접 설명합니다"
            features={[
              '원하는 동작을 자유롭게 설명',
              '세밀한 연출 조정 가능',
            ]}
            isSelected={storyMethod === 'direct'}
            onSelect={() => setStoryMethod('direct')}
          />

          <MethodCard
            method="ai-auto"
            icon={Sparkles}
            title="AI 자동 생성"
            description="제품과 아바타에 맞는 스토리를 AI가 자동으로 제안합니다"
            features={[
              '제품 특성에 맞는 자연스러운 모션',
              '여러 스토리 옵션 중 선택 가능',
            ]}
            isSelected={storyMethod === 'ai-auto'}
            onSelect={() => setStoryMethod('ai-auto')}
            recommended={!!selectedProduct}
            disabled={!selectedProduct}
            disabledReason="제품을 선택해야 AI 자동 생성을 사용할 수 있습니다"
          />

          <MethodCard
            method="reference"
            icon={Image}
            title="참조 미디어 분석"
            description="기존 이미지나 영상을 분석하여 비슷한 스토리를 생성합니다"
            features={[
              '원하는 레퍼런스 스타일 적용',
              '이미지 또는 동영상 업로드 지원',
            ]}
            isSelected={storyMethod === 'reference'}
            onSelect={() => setStoryMethod('reference')}
          />
        </div>
      </div>

      {/* 참조 미디어 업로드 (reference 선택 시) */}
      {storyMethod === 'reference' && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">참조 미디어 업로드</h3>

          {!referenceUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">
                이미지 또는 동영상을 업로드하세요
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                드래그하거나 클릭하여 선택
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, GIF, MP4, MOV (최대 50MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-secondary/30">
              {isAnalyzingReference && (
                <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-white text-sm">미디어 분석 중...</p>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {isVideoFile ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={referenceUrl}
                        alt="참조 이미지"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">
                      {isVideoFile ? '참조 동영상' : '참조 이미지'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      이 미디어의 스타일을 분석하여 비슷한 스토리를 생성합니다
                    </p>
                    {!isAnalyzingReference && (
                      <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        분석 완료
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setReferenceMedia(null, null)}
                    className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          )}
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
          disabled={!canProceedToStep3() || isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              다음
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* 유효성 메시지 */}
      {!canProceedToStep3() && storyMethod === 'reference' && !referenceUrl && (
        <p className="text-center text-sm text-muted-foreground">
          참조 미디어를 업로드해주세요
        </p>
      )}
    </div>
  )
}
