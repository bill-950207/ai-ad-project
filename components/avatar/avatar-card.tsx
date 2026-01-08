/**
 * 아바타 카드 컴포넌트
 *
 * 개별 아바타를 카드 형태로 표시합니다.
 * 생성 중인 아바타는 2초 간격으로 상태를 폴링합니다.
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { Loader2, Trash2, ImageIcon, Video } from 'lucide-react'

// ============================================================
// 타입 정의
// ============================================================

/** 아바타 데이터 타입 */
interface Avatar {
  id: string                // 아바타 ID
  name: string              // 아바타 이름
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
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
  const [isPolling, setIsPolling] = useState(false)

  // 생성 중인 아바타 상태 폴링 (2초 간격)
  useEffect(() => {
    // 생성 진행 중인 상태인 경우에만 폴링
    if (['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(avatar.status)) {
      setIsPolling(true)

      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/avatars/${avatar.id}/status`)
          if (res.ok) {
            const data = await res.json()
            onStatusUpdate(data.avatar)

            // 완료/실패/취소 상태면 폴링 중지
            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.avatar.status)) {
              setIsPolling(false)
            }
          }
        } catch (error) {
          console.error('상태 폴링 오류:', error)
        }
      }

      // 2초마다 상태 확인
      const interval = setInterval(pollStatus, 2000)
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
      default:
        return 'text-yellow-500 bg-yellow-500/10'
    }
  }

  /**
   * 삭제 버튼 클릭 핸들러
   */
  const handleDelete = () => {
    if (confirm(t.avatar.confirmDelete)) {
      onDelete(avatar.id)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* 이미지 영역 또는 플레이스홀더 */}
      <div className="aspect-square relative bg-secondary/30">
        {avatar.image_url ? (
          // 생성 완료된 이미지 표시
          <Image
            src={avatar.image_url}
            alt={avatar.name}
            fill
            className="object-cover"
          />
        ) : (
          // 이미지 없음 - 로딩 또는 플레이스홀더 표시
          <div className="absolute inset-0 flex items-center justify-center">
            {isPolling ? (
              // 생성 중 - 로딩 스피너
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              // 생성 전/실패 - 플레이스홀더
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-secondary/50 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                {/* 실패 시 에러 메시지 표시 */}
                {avatar.status === 'FAILED' && avatar.error_message && (
                  <p className="text-xs text-red-500 px-4">{avatar.error_message}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-4">
        {/* 이름 및 상태 배지 */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-foreground truncate">{avatar.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor()}`}>
            {getStatusLabel()}
          </span>
        </div>

        {/* 생성 일자 */}
        <p className="text-xs text-muted-foreground mb-4">
          {new Date(avatar.created_at).toLocaleDateString()}
        </p>

        {/* 액션 버튼들 (생성 완료 시에만 표시) */}
        {avatar.status === 'COMPLETED' && (
          <div className="flex gap-2 mb-3">
            {/* 이미지 광고 만들기 */}
            <Link
              href={`/dashboard/image-ad?avatar=${avatar.id}`}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <ImageIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{t.avatar.createImageAd}</span>
              <span className="sm:hidden">이미지</span>
            </Link>
            {/* 영상 광고 만들기 */}
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

        {/* 삭제 버튼 */}
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
