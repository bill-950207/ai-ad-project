'use client'

import { useLanguage } from '@/contexts/language-context'
import { AvatarCard } from './avatar-card'
import { Plus, Sparkles } from 'lucide-react'

interface Avatar {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  imageUrl: string | null
  createdAt: string
  errorMessage?: string | null
}

interface AvatarListProps {
  avatars: Avatar[]
  onCreateNew: () => void
  onDelete: (id: string) => void
  onStatusUpdate: (avatar: Avatar) => void
}

export function AvatarList({ avatars, onCreateNew, onDelete, onStatusUpdate }: AvatarListProps) {
  const { t } = useLanguage()

  if (avatars.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{t.avatar.noAvatars}</h3>
        <p className="text-muted-foreground mb-6">{t.avatar.startCreating}</p>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.avatar.createNew}
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {avatars.map((avatar) => (
        <AvatarCard
          key={avatar.id}
          avatar={avatar}
          onDelete={onDelete}
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </div>
  )
}
