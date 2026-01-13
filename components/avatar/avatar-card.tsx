/**
 * 아바타 카드 컴포넌트
 *
 * 개별 아바타를 카드 형태로 표시합니다.
 * 클릭 시 상세 페이지로 이동합니다.
 * 생성 중인 아바타는 1초 간격으로 상태를 폴링합니다.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Loader2, MoreVertical, Trash2, ImageIcon, Video, Shirt } from 'lucide-react'
import { uploadAvatarImage } from '@/lib/client/image-upload'

// ============================================================
// 타입 정의
// ============================================================

/** 아바타 데이터 타입 */
interface Avatar {
  id: string                // 아바타 ID
  name: string              // 아바타 이름
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  image_url: string | null  // 생성된 이미지 URL
  created_at: string        // 생성 일시
  error_message?: string | null  // 에러 메시지 (실패 시)
}

/** 컴포넌트 Props */
interface AvatarCardProps {
  avatar: Avatar                           // 아바타 데이터
  onDelete: (id: string) => void          // 삭제 핸들러
  onStatusUpdate: (avatar: Avatar) => void // 상태 업데이트 핸들러
}

// ============================================================
// 컴포넌트
// ============================================================

export function AvatarCard({ avatar, onDelete, onStatusUpdate }: AvatarCardProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isPolling, setIsPolling] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const uploadingRef = useRef(false)  // 업로드 중복 방지
  const menuRef = useRef<HTMLDivElement>(null)

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  /**
   * 클라이언트에서 이미지 업로드 처리
   */
  const handleClientUpload = async (avatarId: string, tempImageUrl: string) => {
    if (uploadingRef.current) return
    uploadingRef.current = true
    setIsUploading(true)

    try {
      const { originalUrl, compressedUrl } = await uploadAvatarImage(avatarId, tempImageUrl)
      const res = await fetch(`/api/avatars/${avatarId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl, compressedUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        onStatusUpdate(data.avatar)
      }
    } catch (error) {
      console.error('클라이언트 업로드 오류:', error)
    } finally {
      setIsUploading(false)
      uploadingRef.current = false
    }
  }

  // 생성 중인 아바타 상태 폴링
  useEffect(() => {
    if (['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(avatar.status)) {
      setIsPolling(true)

      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/avatars/${avatar.id}/status`)
          if (res.ok) {
            const data = await res.json()

            if (data.avatar.status === 'UPLOADING' && data.tempImageUrl) {
              onStatusUpdate(data.avatar)
              setIsPolling(false)
              handleClientUpload(avatar.id, data.tempImageUrl)
              return
            }

            onStatusUpdate(data.avatar)

            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.avatar.status)) {
              setIsPolling(false)
            }
          }
        } catch (error) {
          console.error('상태 폴링 오류:', error)
        }
      }

      const interval = setInterval(pollStatus, 1000)
      return () => clearInterval(interval)
    }
  }, [avatar.id, avatar.status, onStatusUpdate])

  /**
   * 상태에 따른 라벨 텍스트 반환
   */
  const getStatusLabel = () => {
    const statusMap: Record<string, string> = {
      PENDING: t.avatar.status.pending,
      IN_QUEUE: t.avatar.status.inQueue,
      IN_PROGRESS: t.avatar.status.inProgress,
      UPLOADING: t.avatar.status.uploading || '업로드 중',
      COMPLETED: t.avatar.status.completed,
      FAILED: t.avatar.status.failed,
      CANCELLED: t.avatar.status.cancelled,
    }
    return statusMap[avatar.status] || avatar.status
  }

  /**
   * 상태에 따른 배지 색상 반환
   */
  const getStatusColor = () => {
    switch (avatar.status) {
      case 'COMPLETED':
        return 'text-green-500 bg-green-500/10'
      case 'FAILED':
        return 'text-red-500 bg-red-500/10'
      case 'CANCELLED':
        return 'text-gray-500 bg-gray-500/10'
      case 'UPLOADING':
        return 'text-blue-500 bg-blue-500/10'
      default:
        return 'text-yellow-500 bg-yellow-500/10'
    }
  }

  /**
   * 카드 클릭 핸들러
   */
  const handleCardClick = () => {
    router.push(`/dashboard/avatar/${avatar.id}`)
  }

  /**
   * 삭제 핸들러
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    if (confirm(t.avatar.confirmDelete)) {
      onDelete(avatar.id)
    }
  }

  /**
   * 메뉴 토글
   */
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  /**
   * 이미지 광고 클릭 핸들러
   */
  const handleImageAdClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/image-ad?avatar=${avatar.id}`)
  }

  /**
   * 영상 광고 클릭 핸들러
   */
  const handleVideoAdClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/video-ad?avatar=${avatar.id}`)
  }

  /**
   * 의상 교체 클릭 핸들러
   */
  const handleOutfitClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/avatar/${avatar.id}/outfit`)
  }

  const isProcessing = isPolling || isUploading

  return (
    <div
      onClick={handleCardClick}
      className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
    >
      {/* 이미지 영역 */}
      <div className="aspect-square relative bg-secondary/30">
        {avatar.image_url ? (
          <img
            src={avatar.image_url}
            alt={avatar.name}
            className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isProcessing ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                {isUploading && (
                  <p className="text-xs text-muted-foreground">{t.avatar.status.uploading || '업로드 중...'}</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-secondary/50 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                {avatar.status === 'FAILED' && avatar.error_message && (
                  <p className="text-xs text-red-500 px-4">{avatar.error_message}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 상태 배지 (완료 상태가 아닐 때만 이미지 우측 상단에 표시) */}
        {avatar.status !== 'COMPLETED' && (
          <div className="absolute top-2 right-2">
            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{avatar.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(avatar.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* 미트볼 메뉴 (완료 상태일 때만) */}
          {avatar.status === 'COMPLETED' && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-1 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* 드롭다운 메뉴 */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.avatar.delete}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼 영역 (완료 상태일 때만) */}
        {avatar.status === 'COMPLETED' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <button
              onClick={handleImageAdClick}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
              title={t.avatar.createImageAd}
            >
              {t.avatar.createImageAd}
            </button>
            <button
              onClick={handleVideoAdClick}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
              title={t.avatar.createVideoAd}
            >
              {t.avatar.createVideoAd}
            </button>
            <button
              onClick={handleOutfitClick}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
              title={t.avatar.changeOutfit}
            >
              {t.avatar.changeOutfit}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
