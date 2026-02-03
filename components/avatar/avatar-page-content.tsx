/**
 * 아바타 페이지 콘텐츠 컴포넌트
 *
 * 아바타 목록을 표시하고 관리합니다.
 * 새 아바타 만들기는 별도 페이지(/dashboard/avatar/new)로 이동합니다.
 *
 * 폴링 최적화:
 * - 기존: 전체 목록 폴링 (1개라도 생성 중이면 전체 조회)
 * - 개선: 생성 중인 아바타만 개별 /api/avatars/[id]/status 폴링
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { AvatarList } from './avatar-list'
import { GridSkeleton } from '@/components/ui/grid-skeleton'
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

/** 처리 중인 상태 목록 */
const PROCESSING_STATUSES = ['PENDING', 'IN_QUEUE', 'IN_PROGRESS']

// ============================================================
// 컴포넌트
// ============================================================

export function AvatarPageContent() {
  const { t } = useLanguage()

  // 상태 관리
  const [avatars, setAvatars] = useState<Avatar[]>([])  // 아바타 목록
  const [isLoading, setIsLoading] = useState(true)      // 초기 로딩 상태
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

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
      console.error('Avatar list fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 컴포넌트 마운트 시 아바타 목록 로드
  useEffect(() => {
    fetchAvatars()
  }, [fetchAvatars])

  /**
   * 처리 중인 아바타가 있을 때 개별 폴링
   * 전체 목록 조회 대신 생성 중인 아바타만 /api/avatars/[id]/status 폴링
   */
  useEffect(() => {
    const processingAvatars = avatars.filter(a => PROCESSING_STATUSES.includes(a.status))

    if (processingAvatars.length > 0 && !isLoading) {
      // 이미 폴링 중이면 중복 생성 방지
      if (pollingRef.current) return

      pollingRef.current = setInterval(async () => {
        // 현재 처리 중인 아바타들의 ID를 기반으로 개별 폴링
        const currentAvatars = avatars.filter(a => PROCESSING_STATUSES.includes(a.status))

        for (const avatar of currentAvatars) {
          try {
            const res = await fetch(`/api/avatars/${avatar.id}/status`)
            if (res.ok) {
              const data = await res.json()
              // 상태가 변경되었으면 해당 아바타만 업데이트
              setAvatars(prev => prev.map(a =>
                a.id === avatar.id ? data.avatar : a
              ))
            }
          } catch (error) {
            console.error('Avatar status polling error:', error)
          }
        }
      }, 2000) // 2초 간격
    } else {
      // 처리 중인 아바타가 없으면 폴링 중지
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [avatars, isLoading])

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
      console.error('Avatar delete error:', err)
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
        <GridSkeleton count={8} columns={{ default: 2, sm: 2, md: 3, lg: 4 }} />
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
