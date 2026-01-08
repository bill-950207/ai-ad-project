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
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.avatar.title}</h1>
          <p className="text-muted-foreground">{t.avatar.subtitle}</p>
        </div>
        {/* 새 아바타 만들기 버튼 - 항상 표시 */}
        <Link
          href="/dashboard/avatar/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.avatar.createNew}
        </Link>
      </div>

      {/* 아바타 목록 */}
      {isLoading ? (
        // 로딩 중
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
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
