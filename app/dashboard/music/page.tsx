'use client'

import { useLanguage } from '@/contexts/language-context'

export default function MusicPage() {
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.music.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.music.subtitle}
      </p>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{t.common.comingSoon}</h3>
        <p className="text-muted-foreground">{t.common.comingSoon}</p>
      </div>
    </div>
  )
}
