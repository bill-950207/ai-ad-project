/**
 * 아바타 목록 컴포넌트
 *
 * 사용자의 아바타 목록을 그리드 레이아웃으로 표시합니다.
 * 아바타가 없는 경우 빈 상태 UI를 표시합니다.
 */

'use client'

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
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  image_url: string | null
  created_at: string
  error_message?: string | null
}

/** 컴포넌트 Props */
interface AvatarListProps {
  avatars: Avatar[]                          // 아바타 목록
  onCreateNew: () => void                    // 새 아바타 만들기 핸들러
  onDelete: (id: string) => void             // 아바타 삭제 핸들러
  onStatusUpdate: (avatar: Avatar) => void   // 상태 업데이트 핸들러
}

// ============================================================
// 컴포넌트
// ============================================================

export function AvatarList({ avatars, onCreateNew, onDelete, onStatusUpdate }: AvatarListProps) {
  const { t } = useLanguage()

  // 아바타가 없는 경우 빈 상태 UI 표시
  if (avatars.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        {/* 아이콘 */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>

        {/* 안내 텍스트 */}
        <h3 className="text-lg font-medium text-foreground mb-2">{t.avatar.noAvatars}</h3>
        <p className="text-muted-foreground mb-6">{t.avatar.startCreating}</p>

        {/* 새 아바타 만들기 버튼 */}
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

  // 아바타 그리드 목록
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
