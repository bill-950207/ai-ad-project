'use client'

import { useLanguage } from '@/contexts/language-context'

export default function ImageAdPage() {
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.imageAd.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.imageAd.subtitle}
      </p>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{t.common.comingSoon}</h3>
        <p className="text-muted-foreground">{t.common.comingSoon}</p>
      </div>
    </div>
  )
}
