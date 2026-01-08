/**
 * 아바타 생성 페이지
 *
 * 새 아바타를 생성하는 전용 페이지입니다.
 * 생성 후 생성 중 상태 페이지로 이동합니다.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { AvatarForm } from '@/components/avatar/avatar-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'

export default function NewAvatarPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // 생성 중 상태 페이지로 이동
      router.push(`/dashboard/avatar/${avatar.id}`)
    } catch (err) {
      console.error('아바타 생성 오류:', err)
      setError(t.avatar.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/dashboard/avatar"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.avatar.myAvatars}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{t.avatar.createNew}</h1>
        <p className="text-muted-foreground mt-1">{t.avatar.subtitle}</p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* 생성 폼 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <AvatarForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </div>
    </div>
  )
}
