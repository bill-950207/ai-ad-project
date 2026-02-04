'use client'

import { useLanguage } from '@/contexts/language-context'

interface ProfileContentProps {
  user: {
    email?: string
    created_at?: string
    app_metadata?: { provider?: string }
    user_metadata?: { full_name?: string; name?: string }
  } | null
  profileName?: string | null
}

export function ProfileContent({ user, profileName }: ProfileContentProps) {
  const { t } = useLanguage()

  const getUserDisplayName = () => {
    if (!user) return 'User'
    // DB 프로필 이름 우선 사용
    if (profileName) return profileName
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.user_metadata?.name) return user.user_metadata.name
    return user.email?.split('@')[0] || 'User'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.profile.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.profile.subtitle}
      </p>

      <div className="max-w-2xl space-y-6">
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{getUserDisplayName()}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t.profile.email}
              </label>
              <p className="text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t.profile.accountCreated}
              </label>
              <p className="text-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t.profile.authProvider}
              </label>
              <p className="text-foreground capitalize">
                {user?.app_metadata?.provider || 'Email'}
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground">
            {t.profile.editComingSoon}
          </p>
        </div>
      </div>
    </div>
  )
}
