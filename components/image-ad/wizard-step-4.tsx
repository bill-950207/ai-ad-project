'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'
import {
  ChevronLeft,
  Sparkles,
  Loader2,
  Package,
  User,
  Settings,
  Download,
  ExternalLink,
  Check,
  Coins,
  Wand2,
  Lock,
  Crown,
} from 'lucide-react'
import { ImageEditModal } from './image-edit-modal'
import { InsufficientCreditsModal } from '@/components/ui/insufficient-credits-modal'
import { buildPromptFromOptions } from '@/lib/image-ad/category-options'
import { useImageAdWizard, AspectRatio, Quality } from './wizard-context'
import { compressImage } from '@/lib/image/compress-client'
import { uploadImageAdImage } from '@/lib/client/image-upload'
import { IMAGE_AD_CREDIT_COST } from '@/lib/credits/constants'
import { useUserPlan } from '@/lib/hooks/use-user-plan'

// 가격 계산 (중앙 상수 사용)
const calculateCredits = (quality: Quality, numImages: number): number => {
  const baseCredits = IMAGE_AD_CREDIT_COST[quality]
  return baseCredits * numImages
}

// 이미지 사이즈 매핑
const getImageSize = (ratio: AspectRatio): '1024x1024' | '1536x1024' | '1024x1536' => {
  switch (ratio) {
    case '1:1': return '1024x1024'
    case '16:9': return '1536x1024'
    case '9:16': return '1024x1536'
  }
}

export function WizardStep4() {
  const router = useRouter()
  const { t } = useLanguage()
  const { credits, refreshCredits } = useCredits()
  const {
    adType,
    selectedProduct,
    localImageFile,
    localImageUrl,
    selectedAvatarInfo,
    referenceUrl,
    categoryOptions,
    customOptions,
    additionalPrompt,
    aspectRatio,
    quality,
    setQuality,
    numImages,
    setNumImages,
    isGenerating,
    setIsGenerating,
    generationProgress,
    setGenerationProgress,
    resultImages,
    setResultImages,
    resultAdIds,
    setResultAdIds,
    goToPrevStep,
    resetWizard,
    saveDraft,
    draftId,
  } = useImageAdWizard()

  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)  // 중복 요청 방지
  const currentProgressRef = useRef(0)  // 현재 진행률 추적 (역행 방지용)
  const isCancelledRef = useRef(false)  // 폴링 취소 플래그

  // 이미지 편집 모달 상태
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editImageIndex, setEditImageIndex] = useState(0)
  // 이미지 로딩 상태 추적 (스켈레톤 UI용)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  // 크레딧 부족 모달 상태
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)

  // 사용자 플랜 정보 (로딩 중에는 FREE로 가정하여 UX 개선)
  const { isFreeUser, isLoaded: isPlanLoaded } = useUserPlan()

  const isWearingType = adType === 'wearing'

  // 플랜 로드 완료 후 FREE 사용자인 경우 기본값 조정
  useEffect(() => {
    if (isPlanLoaded && isFreeUser) {
      setQuality('medium')
      if (numImages > 2) {
        setNumImages(2)
      }
    }
  }, [isPlanLoaded, isFreeUser, setQuality, setNumImages, numImages])

  // 결과 이미지가 변경되면 로딩 상태 초기화
  useEffect(() => {
    setLoadedImages(new Set())
  }, [resultImages])

  // 진행률 업데이트
  useEffect(() => {
    if (isGenerating && generationStartTime) {
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - generationStartTime) / 1000
        const baseTime = 60 // 예상 시간 60초
        const progress = Math.min((elapsed / baseTime) * 100, 99)
        // 역행 방지: 현재 저장된 진행률보다 높을 때만 업데이트
        if (progress > currentProgressRef.current) {
          currentProgressRef.current = progress
          setGenerationProgress(progress)
        }
      }, 500)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isGenerating, generationStartTime, setGenerationProgress])

  // 컴포넌트 언마운트 시 폴링 취소
  useEffect(() => {
    return () => {
      isCancelledRef.current = true
      isPollingRef.current = false
    }
  }, [])

  // 로컬 이미지 업로드
  const uploadLocalImage = async (): Promise<string | null> => {
    if (!localImageFile) return null

    try {
      const compressedFile = await compressImage(localImageFile, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.9,
      })

      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('type', 'product')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const { url } = await res.json()
      return url
    } catch (error) {
      console.error('Image upload error:', error)
      return null
    }
  }

  // 광고 생성
  const handleGenerate = async () => {
    // 크레딧 검사
    const requiredCredits = calculateCredits(quality, numImages)
    const availableCredits = credits ?? 0

    if (availableCredits < requiredCredits) {
      setShowInsufficientCreditsModal(true)
      return
    }

    setIsGenerating(true)
    setResultImages([])
    setGenerationStartTime(Date.now())
    setGenerationProgress(0)
    currentProgressRef.current = 0  // ref도 초기화

    try {
      // 로컬 이미지 업로드 (있는 경우)
      let productImageUrl: string | undefined
      if (localImageFile) {
        productImageUrl = (await uploadLocalImage()) || undefined
      }

      // 프롬프트 생성
      const productNameForPrompt = isWearingType && selectedProduct ? selectedProduct.name : undefined
      const generatedPrompt = buildPromptFromOptions(adType, categoryOptions, additionalPrompt, customOptions, productNameForPrompt)

      // options에서 __custom__ 값을 실제 커스텀 텍스트로 대체
      const resolvedOptions = { ...categoryOptions }
      for (const [key, value] of Object.entries(resolvedOptions)) {
        if (value === '__custom__' && customOptions[key]) {
          resolvedOptions[key] = customOptions[key]
        }
      }

      // API 요청 (draftId 포함 - 기존 draft 업데이트용)
      const requestBody = {
        adType,
        productId: selectedProduct?.id,
        productImageUrl,
        avatarIds: selectedAvatarInfo ? [selectedAvatarInfo.avatarId] : [],
        outfitId: selectedAvatarInfo?.outfitId,
        prompt: generatedPrompt,
        imageSize: getImageSize(aspectRatio),
        quality,
        numImages,
        referenceStyleImageUrl: referenceUrl,
        aiAvatarOptions: selectedAvatarInfo?.type === 'ai-generated' ? selectedAvatarInfo.aiOptions : undefined,
        options: resolvedOptions,  // __custom__ 값을 실제 텍스트로 대체하여 저장
        draftId,  // 기존 draft 업데이트용
      }

      const createRes = await fetch('/api/image-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!createRes.ok) {
        const error = await createRes.json()
        throw new Error(error.error || 'Generation request failed')
      }

      const { imageAdIds } = await createRes.json()

      // 생성된 광고 ID 저장
      if (imageAdIds && imageAdIds.length > 0) {
        setResultAdIds(imageAdIds)
      }

      // 배치 폴링 (단일 API로 모든 이미지 상태 확인)
      const pollInterval = 2000  // 2초 간격으로 폴링
      const pollTimeout = 3000   // 각 요청 타임아웃 3초
      const maxAttempts = 60     // 최대 60회 (2초 간격 * 60 = 2분)
      const imageAdId = imageAdIds?.[0]

      if (!imageAdId) {
        throw new Error('Image ad ID is missing')
      }

      // 폴링 시작 전 취소 플래그 초기화
      isCancelledRef.current = false

      const pollBatchStatus = async (): Promise<string[]> => {
        let attempts = 0

        while (attempts < maxAttempts) {
          // 컴포넌트 언마운트 시 폴링 중단
          if (isCancelledRef.current) {
            throw new Error('Polling was cancelled')
          }

          // 이전 요청이 진행 중이면 대기 후 재시도
          if (isPollingRef.current) {
            await new Promise(resolve => setTimeout(resolve, pollInterval))
            continue
          }

          isPollingRef.current = true

          try {
            // 3초 타임아웃 설정
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), pollTimeout)

            const statusRes = await fetch(`/api/image-ads/batch-status/${imageAdId}`, {
              signal: controller.signal,
            })
            clearTimeout(timeoutId)

            if (!statusRes.ok) {
              throw new Error('Status check failed')
            }

            const status = await statusRes.json()

            if (status.status === 'COMPLETED') {
              return status.imageUrls || []
            } else if (status.status === 'IMAGES_READY' && status.pendingImages) {
              // 클라이언트에서 R2 업로드 수행
              console.log('[wizard-step-4] IMAGES_READY 수신, R2 업로드 시작:', status.pendingImages.length, '개')

              const uploadedUrls: { index: number; compressedUrl: string; originalUrl: string }[] = []

              for (const pending of status.pendingImages as { index: number; aiServiceUrl: string }[]) {
                try {
                  const result = await uploadImageAdImage(imageAdId, pending.index, pending.aiServiceUrl)
                  uploadedUrls.push({
                    index: pending.index,
                    compressedUrl: result.compressedUrl,
                    originalUrl: result.originalUrl,
                  })
                } catch (uploadErr) {
                  console.error(`[wizard-step-4] 이미지 ${pending.index} 업로드 실패:`, uploadErr)
                  // 개별 실패 시 원본 URL 사용
                  uploadedUrls.push({
                    index: pending.index,
                    compressedUrl: pending.aiServiceUrl,
                    originalUrl: pending.aiServiceUrl,
                  })
                }
              }

              // 인덱스 순서로 정렬
              uploadedUrls.sort((a, b) => a.index - b.index)

              // PATCH API로 DB 업데이트
              const patchRes = await fetch(`/api/image-ads/${imageAdId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  updateType: 'batch-urls',
                  imageUrls: uploadedUrls.map(u => u.compressedUrl),
                  imageUrlOriginals: uploadedUrls.map(u => u.originalUrl),
                }),
              })

              if (!patchRes.ok) {
                console.error('[wizard-step-4] DB 업데이트 실패')
              } else {
                console.log('[wizard-step-4] R2 업로드 및 DB 업데이트 완료')
              }

              return uploadedUrls.map(u => u.compressedUrl)
            } else if (status.status === 'FAILED') {
              // NSFW 오류 체크
              if (status.error === 'NSFW_CONTENT_DETECTED' || status.error?.includes('NSFW')) {
                throw new Error(t.imageAd?.generate?.nsfwError || 'Generated images were blocked due to content policy (NSFW). Please try again with different options.')
              }
              throw new Error(status.error || 'Image generation failed')
            }

            // 진행률 업데이트 (batch-status API의 progress 필드 활용)
            // 기존 진행률보다 높을 때만 업데이트하여 역행 방지
            if (status.progress !== undefined) {
              const serverProgress = Math.min(status.progress, 99)
              if (serverProgress > currentProgressRef.current) {
                currentProgressRef.current = serverProgress
                setGenerationProgress(serverProgress)
              }
            }
          } catch (error) {
            // 타임아웃 오류는 무시하고 다음 폴링에서 재시도
            if (error instanceof Error && error.name === 'AbortError') {
              console.log('폴링 타임아웃, 재시도...')
            } else {
              throw error
            }
          } finally {
            isPollingRef.current = false
          }

          attempts++
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        }

        throw new Error(t.imageAd?.generate?.timeoutError || 'Image generation timed out')
      }

      const imageUrls = await pollBatchStatus()

      if (imageUrls.length === 0) {
        throw new Error(t.imageAd?.generate?.allFailedError || 'All image generations failed')
      }

      setResultImages(imageUrls)
      setGenerationProgress(100)

      // 생성 완료 시 draft는 이미 IN_QUEUE → COMPLETED로 업데이트됨
      // (별도 삭제 불필요 - draft 레코드가 실제 image_ad 레코드로 변환됨)

      // 크레딧 갱신
      refreshCredits()
    } catch (error) {
      // 폴링 취소는 사용자가 의도적으로 이탈한 것이므로 에러 표시 안함
      if (error instanceof Error && error.message === 'Polling was cancelled') {
        console.log('User left during generation')
        return
      }
      console.error('Generation error:', error)
      alert(error instanceof Error ? error.message : t.imageAd?.generate?.error || 'An error occurred during generation')
    } finally {
      setIsGenerating(false)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      // 폴링 관련 ref 정리
      isPollingRef.current = false
      isCancelledRef.current = false
    }
  }

  // 새로 만들기
  const handleCreateNew = () => {
    resetWizard()
  }

  // 퀄리티 옵션
  const qualityOptions: { quality: Quality; label: string; description: string }[] = [
    { quality: 'medium', label: t.imageAd?.generate?.normal || 'Normal', description: t.imageAd?.generate?.normalDesc || 'Fast generation' },
    { quality: 'high', label: t.imageAd?.generate?.high || 'High', description: t.imageAd?.generate?.highDesc || 'High quality' },
  ]

  // 생성 결과 화면
  if (resultImages.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t.imageAd?.generate?.complete || 'Image Ad Generation Complete!'}</h2>
          <p className="text-muted-foreground">
            {(t.imageAd?.generate?.imagesGenerated || '{count} images have been generated').replace('{count}', String(resultImages.length))}
          </p>
        </div>

        <div className={`grid gap-4 ${resultImages.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-2'}`}>
          {resultImages.map((url, index) => (
            <div key={index} className="relative group">
              <div className="bg-secondary/30 rounded-xl overflow-hidden">
                {/* 스켈레톤 UI - 이미지 로딩 전 표시 */}
                {!loadedImages.has(index) && (
                  <div className="aspect-square bg-secondary/50 animate-pulse flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      <span className="text-sm text-muted-foreground">{t.imageAd?.generate?.imageLoading || 'Loading image...'}</span>
                    </div>
                  </div>
                )}
                <img
                  src={url}
                  alt={(t.imageAd?.generate?.generatedImage || 'Generated image {index}').replace('{index}', String(index + 1))}
                  className={`w-full h-auto transition-opacity duration-300 ${loadedImages.has(index) ? 'opacity-100' : 'opacity-0 absolute'}`}
                  onLoad={() => {
                    setLoadedImages(prev => new Set(prev).add(index))
                  }}
                />
              </div>
              {/* 호버 오버레이 - 이미지 로딩 완료 후에만 표시 */}
              {loadedImages.has(index) && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setEditImageIndex(index)
                      setEditModalOpen(true)
                    }}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    title={t.common?.edit || 'Edit'}
                  >
                    <Wand2 className="w-5 h-5 text-white" />
                  </button>
                  <a
                    href={url}
                    download={`ad-image-${index + 1}.png`}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-white" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 rounded-xl font-medium border border-border hover:bg-secondary/50 transition-colors"
          >
            {t.imageAd?.generate?.createNew || 'Create New Ad'}
          </button>
          {resultAdIds.length > 0 && (
            <button
              onClick={() => router.replace(`/dashboard/image-ad/${resultAdIds[0]}`)}
              className="px-6 py-3 rounded-xl font-medium border border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              {t.imageAd?.generate?.viewDetail || 'View Ad Details'}
            </button>
          )}
          <button
            onClick={() => router.replace('/dashboard/image-ad')}
            className="px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.imageAd?.generate?.backToList || 'Back to List'}
          </button>
        </div>

        {/* 이미지 편집 모달 */}
        {resultAdIds.length > 0 && (
          <ImageEditModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            imageAdId={resultAdIds[0]}
            imageUrl={resultImages[editImageIndex] || ''}
            imageIndex={editImageIndex}
            quality={quality}
            onEditComplete={(index, newImageUrl) => {
              // 편집 완료 시 해당 인덱스의 이미지 URL 업데이트
              const updated = [...resultImages]
              updated[index] = newImageUrl
              setResultImages(updated)
            }}
          />
        )}
      </div>
    )
  }

  // 생성 중 화면
  if (isGenerating) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t.imageAd?.generate?.generating || 'Generating Image Ad'}</h2>
            <p className="text-muted-foreground">
              {(t.imageAd?.generate?.generatingDesc || 'AI is generating {count} images...').replace('{count}', String(numImages))}
            </p>
          </div>

          {/* 프로그레스 바 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.imageAd?.generate?.progress || 'Progress'}</span>
              <span className="font-medium text-foreground">{Math.round(generationProgress)}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            {generationProgress >= 99 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t.imageAd?.generate?.almostDone || 'Almost done...'}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 설정 화면
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 선택 요약 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* 제품 */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
              {(selectedProduct?.rembg_image_url || selectedProduct?.image_url || localImageUrl) ? (
                <img
                  src={selectedProduct?.rembg_image_url || selectedProduct?.image_url || localImageUrl || ''}
                  alt={t.imageAd?.generate?.product || 'Product'}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{t.imageAd?.generate?.product || 'Product'}</p>
              <p className="text-sm font-medium text-foreground truncate">
                {selectedProduct?.name || t.imageAdCreate?.directUpload || 'Direct Upload'}
              </p>
            </div>
          </div>

          {/* 아바타 */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
              {selectedAvatarInfo?.imageUrl ? (
                <img
                  src={selectedAvatarInfo.imageUrl}
                  alt={t.imageAd?.generate?.avatar || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{t.imageAd?.generate?.avatar || 'Avatar'}</p>
              <p className="text-sm font-medium text-foreground truncate">
                {selectedAvatarInfo?.displayName || t.common?.notSelected || 'Not selected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 비율 - 정방형(1:1) 고정 */}
      {/* 비율 선택 UI 숨김 - 1:1 고정 */}

      {/* 퀄리티 & 개수 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {t.imageAd?.generate?.options || 'Generation Options'}
        </h2>

        {!isPlanLoaded ? (
          // 플랜 로딩 중
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* 퀄리티 */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t.imageAd?.generate?.quality || 'Quality'}</label>
              <div className="grid grid-cols-2 gap-3">
                {qualityOptions.map(({ quality: q, label, description }) => {
                  const isLocked = isFreeUser && q === 'high'
                  return (
                    <button
                      key={q}
                      onClick={() => !isLocked && setQuality(q)}
                      disabled={isLocked}
                      className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                        isLocked
                          ? 'border-border bg-secondary/30 cursor-not-allowed opacity-60'
                          : quality === q
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
                      <p className={`font-medium ${quality === q && !isLocked ? 'text-primary' : 'text-foreground'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 생성 개수 */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.imageAd?.generate?.count || 'Number of Images'}
                {isFreeUser && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    {t.imageAd?.generate?.freeLimit || '(Free: max 2)'}
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isLocked = isFreeUser && num > 2
                  return (
                    <button
                      key={num}
                      onClick={() => !isLocked && setNumImages(num)}
                      disabled={isLocked}
                      className={`relative flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                        isLocked
                          ? 'border-border bg-secondary/30 cursor-not-allowed opacity-60 text-muted-foreground'
                          : numImages === num
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {num}
                      {isLocked && (
                        <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  )
                })}
              </div>
              {isFreeUser && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {t.imageAd?.generate?.starterLimit || 'Subscribe to STARTER or higher to generate up to 5 images'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 가격 및 생성 */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.imageAd?.generate?.credits || 'Credits to Use'}</p>
              <p className="text-2xl font-bold text-primary">
                {(t.imageAd?.generate?.creditsUnit || '{amount} credits').replace('{amount}', String(calculateCredits(quality, numImages)))}
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!isPlanLoaded}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            {t.imageAd?.generate?.generateButton || 'Generate Ad'}
          </button>
        </div>
      </div>

      {/* 이전 버튼 */}
      <div className="flex justify-start pt-4">
        <button
          onClick={goToPrevStep}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium border border-border hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t.imageAd?.wizard?.prevStep || 'Previous Step'}
        </button>
      </div>

      {/* 크레딧 부족 모달 */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        requiredCredits={calculateCredits(quality, numImages)}
        availableCredits={credits ?? 0}
        featureName={t.imageAd?.createTitle || 'Create Image Ad'}
        onSaveDraft={saveDraft}
      />
    </div>
  )
}
