/**
 * 대시보드 콘텐츠 컴포넌트
 *
 * 대시보드 메인 페이지의 콘텐츠를 담당합니다.
 * - 페이지 제목 및 설명
 * - 빠른 시작 버튼 (이미지 광고, 영상 광고 생성)
 * - 빠른 통계 카드 (크레딧, 총 광고 수, 이번 달 광고)
 */

'use client'

import { Image, Video, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useOnboarding } from '@/components/onboarding/onboarding-context'
import { OnboardingFlowModal } from '@/components/onboarding/onboarding-flow-modal'

// ============================================================
// 타입 정의
// ============================================================

/** 컴포넌트 Props */
interface DashboardContentProps {
  userEmail?: string  // 사용자 이메일 (선택적)
}

// ============================================================
// 컴포넌트
// ============================================================

export function DashboardContent({ userEmail: _userEmail }: DashboardContentProps) {
  const { t } = useLanguage()
  const { startOnboarding } = useOnboarding()

  return (
    <div>
      {/* 페이지 헤더 */}
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.dashboard.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.dashboard.subtitle}
      </p>

      {/* 빠른 시작 섹션 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          빠른 시작
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 이미지 광고 생성 */}
          <button
            onClick={() => startOnboarding('image')}
            className="bg-card border border-border rounded-xl p-6 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Image className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">이미지 광고 생성</h3>
            <p className="text-sm text-muted-foreground">
              제품 사진으로 다양한 스타일의 광고 이미지를 만들어보세요
            </p>
          </button>

          {/* 영상 광고 생성 */}
          <button
            onClick={() => startOnboarding('video')}
            className="bg-card border border-border rounded-xl p-6 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Video className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">영상 광고 생성</h3>
            <p className="text-sm text-muted-foreground">
              아바타가 제품을 소개하는 영상을 만들어보세요
            </p>
          </button>
        </div>
      </div>

      {/* 빠른 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 남은 크레딧 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{t.dashboard.creditsRemaining}</h3>
          <p className="text-3xl font-bold text-foreground">5</p>
        </div>
        {/* 총 광고 수 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{t.dashboard.totalAds}</h3>
          <p className="text-3xl font-bold text-foreground">0</p>
        </div>
        {/* 이번 달 광고 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{t.dashboard.thisMonth}</h3>
          <p className="text-3xl font-bold text-foreground">0</p>
        </div>
      </div>

      {/* 온보딩 플로우 모달 */}
      <OnboardingFlowModal />
    </div>
  )
}
