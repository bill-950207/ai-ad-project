/**
 * 아바타 페이지 콘텐츠 컴포넌트
 *
 * 아바타 관리 페이지의 메인 콘텐츠를 담당합니다.
 * - 아바타 목록 조회 및 표시
 * - 새 아바타 생성 폼
 * - 아바타 삭제
 * - 생성 상태 폴링
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { AvatarForm } from './avatar-form'
import { AvatarList } from './avatar-list'
import { Plus, X } from 'lucide-react'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'

// ============================================================
// 타입 정의
// ============================================================

/** 아바타 데이터 타입 */
interface Avatar {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
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
  const [isSubmitting, setIsSubmitting] = useState(false)  // 폼 제출 중
  const [showForm, setShowForm] = useState(false)       // 폼 표시 여부
  const [error, setError] = useState<string | null>(null)  // 에러 메시지

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
   * 아바타 생성 폼 제출 핸들러
   */
  const handleSubmit = async (data: { name: string; prompt?: string; options?: AvatarOptions }) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      // 크레딧 부족 (402)
      if (res.status === 402) {
        setError(t.avatar.insufficientCredits)
        return
      }

      // 기타 에러
      if (!res.ok) {
        const errorData = await res.json()
        setError(errorData.error || t.avatar.error)
        return
      }

      // 성공 - 목록에 추가하고 폼 닫기
      const { avatar } = await res.json()
      setAvatars(prev => [avatar, ...prev])
      setShowForm(false)
    } catch (err) {
      console.error('아바타 생성 오류:', err)
      setError(t.avatar.error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
        {/* 아바타가 있고 폼이 닫혀있을 때만 생성 버튼 표시 */}
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

      {/* 아바타 생성 폼 패널 */}
      {showForm && (
        <div className="mb-6 bg-card border border-border rounded-xl p-6">
          {/* 폼 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t.avatar.createNew}</h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* 생성 폼 */}
          <AvatarForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </div>
      )}

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
          onCreateNew={() => setShowForm(true)}
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}
