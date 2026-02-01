/**
 * 온보딩 플로우 모달
 *
 * 광고 생성 전 제품/아바타 준비를 안내하는 온보딩 모달
 * 단계별로 다른 컨텐츠를 표시하고 전환 애니메이션 제공
 */

'use client'

import { useEffect, useState } from 'react'
import { X, ArrowRight, Package, User } from 'lucide-react'
import { useOnboarding } from './onboarding-context'
import { OnboardingStepIndicator } from './onboarding-step-indicator'
import { VideoTypeStep } from './steps/video-type-step'
import { ImageTypeStep } from './steps/image-type-step'
import { ProductStep } from './steps/product-step'
import { ProductScannerStep } from './steps/product-scanner-step'
import { ProductEditorStep } from './steps/product-editor-step'
import { AvatarStep } from './steps/avatar-step'
import { AvatarProcessingStep } from './steps/avatar-processing-step'
import { CompletionStep } from './steps/completion-step'
import { useLanguage } from '@/contexts/language-context'

export function OnboardingFlowModal() {
  const { t } = useLanguage()
  const { isOpen, step, targetType, imageAdType, closeOnboarding, error, selectedProduct, selectedAvatarInfo, goToStep, isNavigating } = useOnboarding()
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentStep, setCurrentStep] = useState(step)
  const [isReady, setIsReady] = useState(false)
  const [wasOpen, setWasOpen] = useState(false)
  const [isEntering, setIsEntering] = useState(false)

  // Translation type
  type OnboardingModalT = {
    videoTypeTitle?: string
    videoTypeSubtitle?: string
    imageTypeTitle?: string
    imageTypeSubtitle?: string
    videoAdPrepare?: string
    imageAdPrepare?: string
    productSubtitle?: string
    productProcessingSubtitle?: string
    productEditingSubtitle?: string
    avatarSubtitle?: string
    avatarProcessingSubtitle?: string
    completeSubtitle?: string
    close?: string
    nextStep?: string
  }
  const onbT = t.onboardingModal as OnboardingModalT | undefined

  // 모달 열림/닫힘 상태 변화 감지
  useEffect(() => {
    if (isOpen && !wasOpen) {
      // 모달이 열릴 때: 즉시 step 동기화 후 렌더링 준비
      setCurrentStep(step)
      setIsAnimating(false)
      setIsEntering(false)
      // 다음 프레임에서 렌더링 시작 (상태 동기화 보장)
      requestAnimationFrame(() => {
        setIsReady(true)
        // 입장 애니메이션 트리거
        requestAnimationFrame(() => {
          setIsEntering(true)
        })
      })
    } else if (!isOpen && wasOpen) {
      // 모달이 닫힐 때: 상태 초기화
      setIsReady(false)
      setIsAnimating(false)
      setIsEntering(false)
    }
    setWasOpen(isOpen)
  }, [isOpen, wasOpen, step])

  // 단계 전환 애니메이션 (모달이 열린 상태에서 step이 변경될 때만)
  useEffect(() => {
    if (isReady && isOpen && step !== currentStep) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setCurrentStep(step)
        setIsAnimating(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [step, currentStep, isReady, isOpen])

  // ESC 키로 닫기 (네비게이션 중에는 비활성화)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isNavigating) {
        closeOnboarding()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isNavigating, closeOnboarding])

  // 모달이 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !isReady) return null

  // 헤더 타이틀 결정
  const getHeaderTitle = () => {
    if (targetType === 'video') {
      if (currentStep === 'video-type') return onbT?.videoTypeTitle || 'Select Video Ad Type'
      return onbT?.videoAdPrepare || 'Prepare Video Ad'
    }
    if (currentStep === 'image-type') return onbT?.imageTypeTitle || 'Select Image Ad Type'
    return onbT?.imageAdPrepare || 'Prepare Image Ad'
  }

  // 헤더 서브타이틀 결정
  const getHeaderSubtitle = () => {
    switch (currentStep) {
      case 'video-type':
        return onbT?.videoTypeSubtitle || 'Select the type of video ad you want to create'
      case 'image-type':
        return onbT?.imageTypeSubtitle || 'Select the type of image ad you want to create'
      case 'product':
        return onbT?.productSubtitle || 'Select or register a product for your ad'
      case 'product-processing':
        return onbT?.productProcessingSubtitle || 'Analyzing product image'
      case 'product-editing':
        return onbT?.productEditingSubtitle || 'Adjust product size'
      case 'avatar':
        return onbT?.avatarSubtitle || 'Select an avatar for your ad'
      case 'avatar-processing':
        return onbT?.avatarProcessingSubtitle || 'Generating avatar'
      case 'complete':
        return onbT?.completeSubtitle || 'All preparations are complete'
      default:
        return ''
    }
  }

  // 단계 표시기에 표시할 단계 (video-type, image-type은 제외)
  const showStepIndicator = currentStep !== 'video-type' && currentStep !== 'image-type'

  // 배경 클릭 핸들러 (네비게이션 중에는 비활성화)
  const handleBackdropClick = () => {
    if (!isNavigating) {
      closeOnboarding()
    }
  }

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8
        transition-[background-color,backdrop-filter] duration-300 ease-out motion-reduce:transition-none
        ${isEntering ? 'bg-black/90 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'}
      `}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div
        className={`
          relative w-full max-w-5xl h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)]
          bg-gradient-to-b from-card to-card/95 rounded-2xl overflow-hidden flex flex-col
          shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]
          transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none
          ${isEntering ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 그라데이션 장식 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* 헤더 */}
        <div className="flex flex-col border-b border-border/50 flex-shrink-0 bg-gradient-to-b from-secondary/30 to-transparent">
          {/* 상단: 타이틀 + 닫기 버튼 */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex-1 min-w-0">
              <h2 id="onboarding-modal-title" className="text-xl font-bold text-foreground tracking-tight">
                {getHeaderTitle()}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {getHeaderSubtitle()}
              </p>
            </div>
            {!isNavigating && (
              <button
                onClick={closeOnboarding}
                aria-label={onbT?.close || 'Close'}
                className="p-2.5 rounded-xl hover:bg-secondary/80 transition-[background-color,transform] hover:scale-105 active:scale-95 flex-shrink-0"
              >
                <X className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* 단계 표시기 - 헤더 하단 중앙 */}
          {showStepIndicator && (
            <div className="flex justify-center pb-5">
              <OnboardingStepIndicator />
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* 컨텐츠 */}
        <div
          className={`flex-1 overflow-y-auto p-6 transition-[opacity,transform] duration-150 motion-reduce:transition-none ${
            isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          }`}
        >
          {currentStep === 'video-type' && <VideoTypeStep />}
          {currentStep === 'image-type' && <ImageTypeStep />}
          {currentStep === 'product' && <ProductStep />}
          {currentStep === 'product-processing' && <ProductScannerStep />}
          {currentStep === 'product-editing' && <ProductEditorStep />}
          {currentStep === 'avatar' && <AvatarStep />}
          {currentStep === 'avatar-processing' && <AvatarProcessingStep />}
          {currentStep === 'complete' && <CompletionStep />}
        </div>

        {/* 플로팅 버튼 - 제품 단계에서 제품 선택 시 */}
        {currentStep === 'product' && selectedProduct && (
          <div className="flex-shrink-0 p-4 border-t border-border/50 bg-gradient-to-t from-card via-card/98 to-card/95 backdrop-blur-sm">
            <button
              onClick={() => goToStep(imageAdType === 'productOnly' ? 'complete' : 'avatar')}
              className="group w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/90 transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                  {selectedProduct.rembg_image_url || selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-4 h-4 m-2" aria-hidden="true" />
                  )}
                </div>
                <span className="truncate max-w-[150px] font-medium">{selectedProduct.name}</span>
              </div>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              <span>{onbT?.nextStep || 'Next Step'}</span>
            </button>
          </div>
        )}

        {/* 플로팅 버튼 - 아바타 단계에서 아바타 선택 시 (AI 생성 제외) */}
        {currentStep === 'avatar' && selectedAvatarInfo && selectedAvatarInfo.type !== 'ai-generated' && (
          <div className="flex-shrink-0 p-4 border-t border-border/50 bg-gradient-to-t from-card via-card/98 to-card/95 backdrop-blur-sm">
            <button
              onClick={() => goToStep('complete')}
              className="group w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/90 transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                  {selectedAvatarInfo.imageUrl ? (
                    <img
                      src={selectedAvatarInfo.imageUrl}
                      alt={selectedAvatarInfo.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 m-2" aria-hidden="true" />
                  )}
                </div>
                <span className="truncate max-w-[150px] font-medium">{selectedAvatarInfo.displayName}</span>
              </div>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              <span>{onbT?.nextStep || 'Next Step'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
