/**
 * 완료 단계
 *
 * 선택된 제품 + 아바타 + 광고 유형 정보 요약 표시
 * 광고 만들기 버튼 클릭 시 생성 페이지 2단계로 이동
 */

'use client'

import { useRouter } from 'next/navigation'
import { Check, Package, User, Sparkles, ArrowRight, Image, Video, Loader2 } from 'lucide-react'
import { useOnboarding } from '../onboarding-context'
import { useLanguage } from '@/contexts/language-context'

export function CompletionStep() {
  const router = useRouter()
  const { t } = useLanguage()
  const {
    targetType,
    videoAdType,
    imageAdType,
    selectedProduct,
    selectedAvatarInfo,
    isNavigating,
    setIsNavigating,
    proceedToAdCreation,
  } = useOnboarding()

  const handleProceed = () => {
    // context에 네비게이션 상태 설정 (모달 닫기 방지)
    setIsNavigating(true)

    const { path, params } = proceedToAdCreation()

    // 쿼리 파라미터 생성
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) searchParams.set(key, value)
    }

    const url = searchParams.toString() ? `${path}?${searchParams.toString()}` : path

    // 모달을 닫지 않고 로딩 상태로 유지 - 페이지 전환 시 자동으로 사라짐
    router.push(url)
  }

  // 이미지 광고 유형 번역 가져오기
  const getImageTypeTitle = () => {
    if (!imageAdType) return ''
    const types = t.imageAdTypes as unknown as Record<string, { title: string }>
    return types[imageAdType]?.title || imageAdType
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onbT = t.onboarding as any

  // 대상 타입 텍스트
  const videoTypeText = videoAdType === 'productDescription'
    ? (onbT?.videoTypes?.productDescription || 'Product Description Video')
    : (onbT?.videoTypes?.productAd || 'Product Ad Video')
  const imageTypeText = getImageTypeTitle()

  // productOnly 타입은 아바타가 필요 없음
  const showAvatarSection = imageAdType !== 'productOnly'

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-8">
      {/* 완료 아이콘 - 축하 애니메이션 */}
      <div className="relative animate-[bounce_0.6s_ease-out]">
        {/* 배경 링 애니메이션 */}
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping motion-reduce:animate-none" />
        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 blur-xl animate-pulse motion-reduce:animate-none" />

        <div
          className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
          role="img"
          aria-label={t.common?.complete || 'Complete'}
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} aria-hidden="true" />
        </div>
      </div>

      {/* 완료 메시지 */}
      <div className="text-center mt-6 animate-[fadeIn_0.5s_ease-out_0.2s_backwards]">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">
          {onbT?.readyToCreate || 'Ready!'}
        </h3>
        <p className="text-muted-foreground mt-2">
          {targetType === 'video'
            ? (onbT?.readyToCreateVideo || 'Ready to create {type}').replace('{type}', videoTypeText)
            : (onbT?.readyToCreateImage || 'Ready to create {type} image').replace('{type}', imageTypeText)
          }
        </p>
      </div>

      {/* 선택 요약 카드 */}
      <div className="mt-8 w-full max-w-lg animate-[fadeIn_0.5s_ease-out_0.35s_backwards]">
        <div className="bg-gradient-to-b from-secondary/40 to-secondary/20 rounded-2xl p-5 border border-border/50">
          <div className="flex items-center justify-center gap-5 flex-wrap">
            {/* 제품 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-card border border-border/60 overflow-hidden flex-shrink-0 shadow-sm">
                {selectedProduct?.rembg_image_url || selectedProduct?.image_url ? (
                  <img
                    src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                    <Package className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{onbT?.product || t.common?.product || 'Product'}</p>
                <p className="text-sm font-semibold text-foreground truncate max-w-[100px]">
                  {selectedProduct?.name || (t.common?.none || 'None')}
                </p>
              </div>
            </div>

            {/* 아바타 (productOnly 제외) */}
            {showAvatarSection && (
              <>
                <div className="w-px h-12 bg-border/60" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-card border border-border/60 overflow-hidden flex-shrink-0 shadow-sm">
                    {selectedAvatarInfo?.type === 'ai-generated' ? (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                      </div>
                    ) : selectedAvatarInfo?.imageUrl ? (
                      <img
                        src={selectedAvatarInfo.imageUrl}
                        alt={selectedAvatarInfo.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                        <User className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{onbT?.avatar || t.common?.avatar || 'Avatar'}</p>
                    <p className="text-sm font-semibold text-foreground truncate max-w-[100px]">
                      {selectedAvatarInfo?.type === 'ai-generated'
                        ? (onbT?.aiGenerated || 'AI Auto')
                        : selectedAvatarInfo?.displayName || (t.common?.none || 'None')}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 광고 유형 */}
            <div className="w-px h-12 bg-border/60" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                {targetType === 'video' ? (
                  <Video className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Image className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.common?.type || 'Type'}</p>
                <p className="text-sm font-semibold text-foreground truncate max-w-[100px]">
                  {targetType === 'video' ? videoTypeText : imageTypeText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 광고 만들기 버튼 */}
      <div className="mt-8 w-full max-w-md animate-[fadeIn_0.5s_ease-out_0.5s_backwards]">
        <button
          onClick={handleProceed}
          disabled={isNavigating}
          className="group w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-[background-color,box-shadow,transform] duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isNavigating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>{onbT?.navigating || 'Navigating...'}</span>
            </>
          ) : (
            <>
              <span>{onbT?.startCreatingAd || 'Start Creating Ad'}</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
