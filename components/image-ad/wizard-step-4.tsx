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
  Image as ImageIcon,
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

// 사용자 플랜 타입
interface UserPlan {
  planType: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'
  displayName: string
  hdUpscale: boolean
}

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
  const { t: _t } = useLanguage()
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
    setAspectRatio,
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

  // 사용자 플랜 정보
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const isFreeUser = userPlan?.planType === 'FREE'

  const isWearingType = adType === 'wearing'

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
            setQuality('medium')
            if (numImages > 2) {
              setNumImages(2)
            }
          }
        }
      } catch (error) {
        console.error('플랜 정보 로드 오류:', error)
      }
    }
    fetchUserPlan()
  }, [setQuality, setNumImages, numImages])

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

      if (!res.ok) throw new Error('업로드 실패')

      const { url } = await res.json()
      return url
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
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
        throw new Error(error.error || '생성 요청 실패')
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
        throw new Error('이미지 광고 ID가 없습니다')
      }

      // 폴링 시작 전 취소 플래그 초기화
      isCancelledRef.current = false

      const pollBatchStatus = async (): Promise<string[]> => {
        let attempts = 0

        while (attempts < maxAttempts) {
          // 컴포넌트 언마운트 시 폴링 중단
          if (isCancelledRef.current) {
            throw new Error('폴링이 취소되었습니다')
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
              throw new Error('상태 확인 실패')
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
                throw new Error('생성된 이미지가 콘텐츠 정책(NSFW)에 위배되어 차단되었습니다. 다른 옵션으로 다시 시도해주세요.')
              }
              throw new Error(status.error || '이미지 생성 실패')
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

        throw new Error('이미지 생성 시간 초과')
      }

      const imageUrls = await pollBatchStatus()

      if (imageUrls.length === 0) {
        throw new Error('모든 이미지 생성 실패')
      }

      setResultImages(imageUrls)
      setGenerationProgress(100)

      // 생성 완료 시 draft는 이미 IN_QUEUE → COMPLETED로 업데이트됨
      // (별도 삭제 불필요 - draft 레코드가 실제 image_ad 레코드로 변환됨)

      // 크레딧 갱신
      refreshCredits()
    } catch (error) {
      // 폴링 취소는 사용자가 의도적으로 이탈한 것이므로 에러 표시 안함
      if (error instanceof Error && error.message === '폴링이 취소되었습니다') {
        console.log('사용자가 생성 중 이탈함')
        return
      }
      console.error('생성 오류:', error)
      alert(error instanceof Error ? error.message : '생성 중 오류가 발생했습니다')
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

  // 비율 옵션
  const ratioOptions: { ratio: AspectRatio; label: string; width: string; height: string }[] = [
    { ratio: '1:1', label: '정사각형', width: 'w-8', height: 'h-8' },
    { ratio: '16:9', label: '가로형', width: 'w-10', height: 'h-6' },
    { ratio: '9:16', label: '세로형', width: 'w-6', height: 'h-10' },
  ]

  // 퀄리티 옵션
  const qualityOptions: { quality: Quality; label: string; description: string }[] = [
    { quality: 'medium', label: '보통', description: '빠른 생성' },
    { quality: 'high', label: '높음', description: '고품질' },
  ]

  // 생성 결과 화면
  if (resultImages.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">광고 이미지 생성 완료!</h2>
          <p className="text-muted-foreground">
            {resultImages.length}개의 이미지가 생성되었습니다
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
                      <span className="text-sm text-muted-foreground">이미지 로딩 중...</span>
                    </div>
                  </div>
                )}
                <img
                  src={url}
                  alt={`생성된 이미지 ${index + 1}`}
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
                    title="이미지 편집"
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
            새로운 광고 만들기
          </button>
          {resultAdIds.length > 0 && (
            <button
              onClick={() => router.replace(`/dashboard/image-ad/${resultAdIds[0]}`)}
              className="px-6 py-3 rounded-xl font-medium border border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              광고 상세 보기
            </button>
          )}
          <button
            onClick={() => router.replace('/dashboard/image-ad')}
            className="px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            광고 목록으로
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
            <h2 className="text-xl font-bold text-foreground mb-2">광고 이미지 생성 중</h2>
            <p className="text-muted-foreground">
              AI가 {numImages}개의 이미지를 생성하고 있습니다...
            </p>
          </div>

          {/* 프로그레스 바 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">진행률</span>
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
                거의 완료되었습니다...
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
      {/* 미리보기 요약 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">생성 미리보기</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* 제품 */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
              {(selectedProduct?.rembg_image_url || selectedProduct?.image_url || localImageUrl) ? (
                <img
                  src={selectedProduct?.rembg_image_url || selectedProduct?.image_url || localImageUrl || ''}
                  alt="제품"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">제품</p>
              <p className="text-sm font-medium text-foreground truncate">
                {selectedProduct?.name || '직접 업로드'}
              </p>
            </div>
          </div>

          {/* 아바타 */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
              {selectedAvatarInfo ? (
                <img
                  src={selectedAvatarInfo.imageUrl}
                  alt="아바타"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">아바타</p>
              <p className="text-sm font-medium text-foreground truncate">
                {selectedAvatarInfo?.displayName || '선택 안함'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 비율 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          이미지 비율
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {ratioOptions.map(({ ratio, label, width, height }) => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                aspectRatio === ratio
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div
                className={`border-2 rounded ${width} ${height} ${
                  aspectRatio === ratio ? 'border-primary' : 'border-muted-foreground'
                }`}
              />
              <div className="text-center">
                <p className={`text-sm font-medium ${aspectRatio === ratio ? 'text-primary' : 'text-foreground'}`}>
                  {ratio}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 퀄리티 & 개수 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          생성 옵션
        </h2>

        <div className="space-y-4">
          {/* 퀄리티 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">퀄리티</label>
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
              생성 개수
              {isFreeUser && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  (Free: 최대 2개)
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
                STARTER 이상 구독 시 최대 5개까지 생성 가능
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 가격 및 생성 */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">사용 크레딧</p>
              <p className="text-2xl font-bold text-primary">
                {calculateCredits(quality, numImages)} 크레딧
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles className="w-5 h-5" />
            광고 생성하기
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
          이전 단계
        </button>
      </div>

      {/* 크레딧 부족 모달 */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        requiredCredits={calculateCredits(quality, numImages)}
        availableCredits={credits ?? 0}
        featureName="이미지 광고 생성"
        onSaveDraft={saveDraft}
      />
    </div>
  )
}
