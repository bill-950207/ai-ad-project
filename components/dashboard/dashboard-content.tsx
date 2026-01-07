'use client'

import { useLanguage } from '@/contexts/language-context'

interface DashboardContentProps {
  userEmail?: string
}

export function DashboardContent({ userEmail }: DashboardContentProps) {
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.dashboard.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.dashboard.subtitle}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{t.dashboard.creditsRemaining}</h3>
          <p className="text-3xl font-bold text-foreground">5</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{t.dashboard.totalAds}</h3>
          <p className="text-3xl font-bold text-foreground">0</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{t.dashboard.thisMonth}</h3>
          <p className="text-3xl font-bold text-foreground">0</p>
        </div>
      </div>
    </div>
  )
}
