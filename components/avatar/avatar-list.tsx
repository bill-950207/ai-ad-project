/**
 * 아바타 목록 컴포넌트
 *
 * 사용자의 아바타 목록을 그리드 레이아웃으로 표시합니다.
 * 아바타가 없는 경우 빈 상태 UI를 표시합니다.
 */

'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { AvatarCard } from './avatar-card'
import { Plus, Sparkles } from 'lucide-react'

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

/** 컴포넌트 Props */
interface AvatarListProps {
  avatars: Avatar[]                          // 아바타 목록
  onDelete: (id: string) => void             // 아바타 삭제 핸들러
  onStatusUpdate: (avatar: Avatar) => void   // 상태 업데이트 핸들러
}

// ============================================================
// 컴포넌트
// ============================================================

export function AvatarList({ avatars, onDelete, onStatusUpdate }: AvatarListProps) {
  const { t } = useLanguage()

  // 아바타가 없는 경우 빈 상태 UI 표시
  if (avatars.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border rounded-2xl p-16 text-center">
        {/* 배경 글로우 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative">
          {/* 아이콘 */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>

          {/* 안내 텍스트 */}
          <h3 className="text-xl font-semibold text-foreground mb-3">{t.avatar.noAvatars}</h3>
          <p className="text-muted-foreground mb-8">{t.avatar.startCreating}</p>

          {/* 새 아바타 만들기 버튼 */}
          <Link
            href="/dashboard/avatar/new"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            {t.avatar.createNew}
          </Link>
        </div>
      </div>
    )
  }

  // 아바타 그리드 목록
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
