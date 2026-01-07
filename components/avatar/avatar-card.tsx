'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { Loader2, Trash2, ImageIcon, Video } from 'lucide-react'

interface Avatar {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  imageUrl: string | null
  createdAt: string
  errorMessage?: string | null
}

interface AvatarCardProps {
  avatar: Avatar
  onDelete: (id: string) => void
  onStatusUpdate: (avatar: Avatar) => void
}

export function AvatarCard({ avatar, onDelete, onStatusUpdate }: AvatarCardProps) {
  const { t } = useLanguage()
  const [isPolling, setIsPolling] = useState(false)

  // Poll for status if avatar is generating
  useEffect(() => {
    if (['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(avatar.status)) {
      setIsPolling(true)
      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/avatars/${avatar.id}/status`)
          if (res.ok) {
            const data = await res.json()
            onStatusUpdate(data.avatar)
            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.avatar.status)) {
              setIsPolling(false)
            }
          }
        } catch (error) {
          console.error('Error polling status:', error)
        }
      }

      const interval = setInterval(pollStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [avatar.id, avatar.status, onStatusUpdate])

  const getStatusLabel = () => {
    const statusMap: Record<string, string> = {
      PENDING: t.avatar.status.pending,
      IN_QUEUE: t.avatar.status.inQueue,
      IN_PROGRESS: t.avatar.status.inProgress,
      COMPLETED: t.avatar.status.completed,
      FAILED: t.avatar.status.failed,
      CANCELLED: t.avatar.status.cancelled,
    }
    return statusMap[avatar.status] || avatar.status
  }

  const getStatusColor = () => {
    switch (avatar.status) {
      case 'COMPLETED':
        return 'text-green-500 bg-green-500/10'
      case 'FAILED':
        return 'text-red-500 bg-red-500/10'
      case 'CANCELLED':
        return 'text-gray-500 bg-gray-500/10'
      default:
        return 'text-yellow-500 bg-yellow-500/10'
    }
  }

  const handleDelete = () => {
    if (confirm(t.avatar.confirmDelete)) {
      onDelete(avatar.id)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Image or Placeholder */}
      <div className="aspect-square relative bg-secondary/30">
        {avatar.imageUrl ? (
          <Image
            src={avatar.imageUrl}
            alt={avatar.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isPolling ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-secondary/50 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                {avatar.status === 'FAILED' && avatar.errorMessage && (
                  <p className="text-xs text-red-500 px-4">{avatar.errorMessage}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-foreground truncate">{avatar.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor()}`}>
            {getStatusLabel()}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          {new Date(avatar.createdAt).toLocaleDateString()}
        </p>

        {/* Actions */}
        {avatar.status === 'COMPLETED' && (
          <div className="flex gap-2 mb-3">
            <Link
              href={`/dashboard/image-ad?avatar=${avatar.id}`}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <ImageIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{t.avatar.createImageAd}</span>
              <span className="sm:hidden">이미지</span>
            </Link>
            <Link
              href={`/dashboard/video-ad?avatar=${avatar.id}`}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Video className="w-3 h-3" />
              <span className="hidden sm:inline">{t.avatar.createVideoAd}</span>
              <span className="sm:hidden">영상</span>
            </Link>
          </div>
        )}

        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>{t.avatar.delete}</span>
        </button>
      </div>
    </div>
  )
}
