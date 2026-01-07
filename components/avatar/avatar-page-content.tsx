'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { AvatarForm } from './avatar-form'
import { AvatarList } from './avatar-list'
import { Plus, X } from 'lucide-react'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'

interface Avatar {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  imageUrl: string | null
  createdAt: string
  errorMessage?: string | null
}

export function AvatarPageContent() {
  const { t } = useLanguage()
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch avatars
  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch('/api/avatars')
      if (res.ok) {
        const data = await res.json()
        setAvatars(data.avatars)
      }
    } catch (err) {
      console.error('Error fetching avatars:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvatars()
  }, [fetchAvatars])

  // Handle form submit
  const handleSubmit = async (data: { name: string; prompt?: string; options?: AvatarOptions }) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.status === 402) {
        setError(t.avatar.insufficientCredits)
        return
      }

      if (!res.ok) {
        const errorData = await res.json()
        setError(errorData.error || t.avatar.error)
        return
      }

      const { avatar } = await res.json()
      setAvatars(prev => [avatar, ...prev])
      setShowForm(false)
    } catch (err) {
      console.error('Error creating avatar:', err)
      setError(t.avatar.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/avatars/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setAvatars(prev => prev.filter(a => a.id !== id))
      }
    } catch (err) {
      console.error('Error deleting avatar:', err)
    }
  }

  // Handle status update from polling
  const handleStatusUpdate = (updatedAvatar: Avatar) => {
    setAvatars(prev => prev.map(a => a.id === updatedAvatar.id ? updatedAvatar : a))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.avatar.title}</h1>
          <p className="text-muted-foreground">{t.avatar.subtitle}</p>
        </div>
        {avatars.length > 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.avatar.createNew}
          </button>
        )}
      </div>

      {/* Form Modal/Panel */}
      {showForm && (
        <div className="mb-6 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t.avatar.createNew}</h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <AvatarForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </div>
      )}

      {/* Avatar List */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <AvatarList
          avatars={avatars}
          onCreateNew={() => setShowForm(true)}
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}
