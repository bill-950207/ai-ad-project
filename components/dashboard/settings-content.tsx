'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'

interface Preferences {
  email_notifications: boolean
  marketing_emails: boolean
}

export function SettingsContent() {
  const { t } = useLanguage()
  const [preferences, setPreferences] = useState<Preferences>({
    email_notifications: true,
    marketing_emails: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  // 설정 불러오기
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('설정 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  // 설정 업데이트
  const updatePreference = async (key: keyof Preferences, value: boolean) => {
    setIsSaving(key)

    // 낙관적 업데이트
    setPreferences(prev => ({ ...prev, [key]: value }))

    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) {
        // 실패 시 롤백
        setPreferences(prev => ({ ...prev, [key]: !value }))
      }
    } catch (error) {
      console.error('설정 업데이트 실패:', error)
      // 실패 시 롤백
      setPreferences(prev => ({ ...prev, [key]: !value }))
    } finally {
      setIsSaving(null)
    }
  }

  // 토글 컴포넌트
  const Toggle = ({
    checked,
    onChange,
    disabled,
  }: {
    checked: boolean
    onChange: () => void
    disabled?: boolean
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${checked ? 'bg-primary' : 'bg-secondary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${checked ? 'translate-x-4' : 'translate-x-0'}
        `}
      />
    </button>
  )

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
              {isLoading ? (
                <div className="w-10 h-6 bg-secondary rounded-full animate-pulse" />
              ) : (
                <Toggle
                  checked={preferences.email_notifications}
                  onChange={() => updatePreference('email_notifications', !preferences.email_notifications)}
                  disabled={isSaving === 'email_notifications'}
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t.settings.marketingEmails}</p>
                <p className="text-xs text-muted-foreground">{t.settings.marketingEmailsDesc}</p>
              </div>
              {isLoading ? (
                <div className="w-10 h-6 bg-secondary rounded-full animate-pulse" />
              ) : (
                <Toggle
                  checked={preferences.marketing_emails}
                  onChange={() => updatePreference('marketing_emails', !preferences.marketing_emails)}
                  disabled={isSaving === 'marketing_emails'}
                />
              )}
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
