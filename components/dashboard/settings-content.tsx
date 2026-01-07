'use client'

import { useLanguage } from '@/contexts/language-context'

export function SettingsContent() {
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.settings.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.settings.subtitle}
      </p>

      <div className="max-w-2xl space-y-6">
        {/* Notification Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t.settings.notifications}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t.settings.emailNotifications}</p>
                <p className="text-xs text-muted-foreground">{t.settings.emailNotificationsDesc}</p>
              </div>
              <div className="w-10 h-6 bg-secondary rounded-full relative cursor-not-allowed opacity-50">
                <div className="w-4 h-4 bg-muted-foreground rounded-full absolute top-1 left-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t.settings.marketingEmails}</p>
                <p className="text-xs text-muted-foreground">{t.settings.marketingEmailsDesc}</p>
              </div>
              <div className="w-10 h-6 bg-secondary rounded-full relative cursor-not-allowed opacity-50">
                <div className="w-4 h-4 bg-muted-foreground rounded-full absolute top-1 left-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t.settings.appearance}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t.settings.theme}</p>
                <p className="text-xs text-muted-foreground">{t.settings.themeDesc}</p>
              </div>
              <span className="text-sm text-muted-foreground">{t.settings.darkDefault}</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card border border-red-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-500 mb-4">{t.settings.dangerZone}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t.settings.deleteAccount}</p>
                <p className="text-xs text-muted-foreground">{t.settings.deleteAccountDesc}</p>
              </div>
              <button
                disabled
                className="px-4 py-2 text-sm bg-red-500/10 text-red-500 rounded-lg opacity-50 cursor-not-allowed"
              >
                {t.settings.delete}
              </button>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground">
            {t.settings.moreSettingsComingSoon}
          </p>
        </div>
      </div>
    </div>
  )
}
