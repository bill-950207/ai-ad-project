/**
 * 아바타 페이지 콘텐츠 컴포넌트
 *
 * 아바타 목록을 표시하고 관리합니다.
 * 새 아바타 만들기는 별도 페이지(/dashboard/avatar/new)로 이동합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { AvatarList } from './avatar-list'
import { Plus } from 'lucide-react'
import Link from 'next/link'

// ============================================================
// 타입 정의
// ============================================================

/** 아바타 데이터 타입 */
interface Avatar {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  image_url: string | null
  created_at: string
  error_message?: string | null
}

// ============================================================
// 컴포넌트
// ============================================================

export function AvatarPageContent() {
  const { t } = useLanguage()

  // 상태 관리
  const [avatars, setAvatars] = useState<Avatar[]>([])  // 아바타 목록
  const [isLoading, setIsLoading] = useState(true)      // 초기 로딩 상태

  /**
   * 아바타 목록 조회
   */
  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch('/api/avatars')
      if (res.ok) {
        const data = await res.json()
        setAvatars(data.avatars)
      }
    } catch (err) {
      console.error('아바타 목록 조회 오류:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 컴포넌트 마운트 시 아바타 목록 로드
  useEffect(() => {
    fetchAvatars()
  }, [fetchAvatars])

  /**
   * 아바타 삭제 핸들러
   */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/avatars/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setAvatars(prev => prev.filter(a => a.id !== id))
      }
    } catch (err) {
      console.error('아바타 삭제 오류:', err)
    }
  }

  /**
   * 상태 폴링에서 업데이트된 아바타 반영
   */
  const handleStatusUpdate = (updatedAvatar: Avatar) => {
    setAvatars(prev => prev.map(a => a.id === updatedAvatar.id ? updatedAvatar : a))
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-brand-text">{t.avatar.title}</span>
          </h1>
          <p className="text-muted-foreground text-lg">{t.avatar.subtitle}</p>
        </div>
        {/* 새 아바타 만들기 버튼 - 항상 표시 */}
        <Link
          href="/dashboard/avatar/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          {t.avatar.createNew}
        </Link>
      </div>

      {/* 아바타 목록 */}
      {isLoading ? (
        // 로딩 중
        <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border rounded-2xl p-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4 relative" />
          </div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : (
        // 아바타 목록 표시
        <AvatarList
          avatars={avatars}
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}
