/**
 * 아바타 생성 페이지
 *
 * 스텝 기반 UI로 새 아바타를 생성합니다.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { AvatarForm } from '@/components/avatar/avatar-form'
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'
import { SlotLimitModal } from '@/components/ui/slot-limit-modal'

interface SlotInfo {
  used: number
  limit: number
  message?: string
}

export default function NewAvatarPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSlotLimitModal, setShowSlotLimitModal] = useState(false)
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null)

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
        setIsSubmitting(false)
        return
      }

      // 슬롯 제한 초과 (403)
      if (res.status === 403) {
        const errorData = await res.json()
        if (errorData.slotInfo) {
          setSlotInfo(errorData.slotInfo)
          setShowSlotLimitModal(true)
        } else {
          setError(errorData.error || '슬롯이 가득 찼습니다')
        }
        setIsSubmitting(false)
        return
      }

      if (!res.ok) {
        const errorData = await res.json()
        setError(errorData.error || t.avatar.error)
        setIsSubmitting(false)
        return
      }

      // 성공 시 isSubmitting을 true로 유지하여 리다이렉트 전 중복 제출 방지
      router.push('/dashboard/avatar')
    } catch (err) {
      console.error('아바타 생성 오류:', err)
      setError(t.avatar.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <Link
          href="/dashboard/avatar"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t.avatar.myAvatars}
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.avatar.createNew}</h1>
            <p className="text-muted-foreground text-sm">{t.avatar.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">오류가 발생했습니다</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* 생성 폼 */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <AvatarForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </div>

      {/* 슬롯 제한 모달 */}
      {slotInfo && (
        <SlotLimitModal
          isOpen={showSlotLimitModal}
          onClose={() => setShowSlotLimitModal(false)}
          slotType="avatar"
          slotInfo={slotInfo}
          onManageItems={() => router.push('/dashboard/avatar')}
        />
      )}
    </div>
  )
}
