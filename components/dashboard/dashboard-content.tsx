/**
 * 대시보드 콘텐츠 컴포넌트
 *
 * 대시보드 메인 페이지의 콘텐츠를 담당합니다.
 * - 페이지 제목 및 설명
 * - 빠른 통계 카드 (크레딧, 총 광고 수, 이번 달 광고)
 */

'use client'

import { useLanguage } from '@/contexts/language-context'

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

export function DashboardContent({ userEmail }: DashboardContentProps) {
  const { t } = useLanguage()

  return (
    <div>
      {/* 페이지 헤더 */}
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.dashboard.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.dashboard.subtitle}
      </p>

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
    </div>
  )
}
