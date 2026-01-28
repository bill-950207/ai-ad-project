/**
 * 온보딩 단계 표시기
 *
 * 현재 온보딩 진행 상태를 시각적으로 표시
 * 완료된 단계는 체크마크, 현재 단계는 강조, 미완료 단계는 흐리게 표시
 * productOnly 타입은 아바타 단계 생략
 */

'use client'

import { useMemo } from 'react'
import { Check, Package, User, Sparkles } from 'lucide-react'
import { useOnboarding, OnboardingStep } from './onboarding-context'

// 전체 메인 단계 정의
const ALL_MAIN_STEPS = [
  { key: 'product', label: '제품', icon: Package },
  { key: 'avatar', label: '아바타', icon: User },
  { key: 'complete', label: '완료', icon: Sparkles },
] as const

type MainStep = typeof ALL_MAIN_STEPS[number]['key']

// 현재 온보딩 단계를 메인 단계로 매핑
function getMainStep(step: OnboardingStep): MainStep {
  switch (step) {
    case 'video-type':
    case 'image-type':
    case 'product':
    case 'product-processing':
    case 'product-editing':
      return 'product'
    case 'avatar':
    case 'avatar-processing':
      return 'avatar'
    case 'complete':
      return 'complete'
    default:
      return 'product'
  }
}

export function OnboardingStepIndicator() {
  const { step, imageAdType } = useOnboarding()

  // productOnly 타입은 아바타 단계 제외
  const mainSteps = useMemo(() => {
    if (imageAdType === 'productOnly') {
      return ALL_MAIN_STEPS.filter(s => s.key !== 'avatar')
    }
    return [...ALL_MAIN_STEPS]
  }, [imageAdType])

  const currentMainStep = getMainStep(step)
  const currentIndex = mainSteps.findIndex(s => s.key === currentMainStep)

  return (
    <div className="flex items-center justify-center">
      {mainSteps.map((mainStep, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex
        const Icon = mainStep.icon

        return (
          <div key={mainStep.key} className="flex items-start">
            {/* 단계 아이콘 */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  relative w-11 h-11 rounded-full flex items-center justify-center
                  transition-[background-color,box-shadow,transform] duration-300 ease-out
                  ${isCompleted
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : ''
                  }
                  ${isCurrent
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-110 ring-[3px] ring-primary/20'
                    : ''
                  }
                  ${isPending
                    ? 'bg-secondary/80 text-muted-foreground/70'
                    : ''
                  }
                `}
                role="img"
                aria-label={`${mainStep.label} ${isCompleted ? '완료' : isCurrent ? '진행 중' : '대기'}`}
              >
                {/* 현재 단계 펄스 효과 */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping motion-reduce:animate-none" />
                )}
                {isCompleted ? (
                  <Check className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <Icon className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <span
                className={`
                  mt-2.5 text-xs font-semibold tracking-wide uppercase
                  transition-colors duration-300
                  ${isCurrent ? 'text-primary' : ''}
                  ${isCompleted ? 'text-foreground' : ''}
                  ${isPending ? 'text-muted-foreground/60' : ''}
                `}
              >
                {mainStep.label}
              </span>
            </div>

            {/* 연결선 (마지막 단계 제외) */}
            {index < mainSteps.length - 1 && (
              <div className="relative w-20 h-0.5 mx-4 mt-[21px]">
                {/* 배경 선 */}
                <div className="absolute inset-0 bg-border/60 rounded-full" />
                {/* 진행 선 (애니메이션) */}
                <div
                  className={`
                    absolute inset-y-0 left-0 bg-primary rounded-full
                    transition-[width] duration-500 ease-out
                    ${index < currentIndex ? 'w-full' : 'w-0'}
                  `}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
