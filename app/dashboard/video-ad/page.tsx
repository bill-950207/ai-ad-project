'use client'

import { useLanguage } from '@/contexts/language-context'

export default function VideoAdPage() {
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.videoAd.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.videoAd.subtitle}
      </p>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{t.common.comingSoon}</h3>
        <p className="text-muted-foreground">{t.common.comingSoon}</p>
      </div>
    </div>
  )
}
