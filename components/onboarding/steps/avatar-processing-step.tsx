/**
 * 아바타 생성 처리 중 단계
 *
 * 아바타 생성 진행 상황 표시
 * 완료 시 완료 단계로 전환
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, User } from 'lucide-react'
import { useOnboarding } from '../onboarding-context'
import { uploadAvatarImage } from '@/lib/client/image-upload'
import { useLanguage } from '@/contexts/language-context'

export function AvatarProcessingStep() {
  const {
    newAvatarId,
    onAvatarProcessingComplete,
    setError,
    goToStep,
  } = useOnboarding()
  const { t } = useLanguage()
  const avatarProcessingT = t.onboarding?.avatarProcessing || {}

  const [statusMessage, setStatusMessage] = useState(avatarProcessingT.generating || 'Generating avatar...')
  const [isUploading, setIsUploading] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const hasUploadedRef = useRef(false)
  const isPollingRef = useRef(false)  // 중복 요청 방지

  // 상태 폴링
  useEffect(() => {
    if (!newAvatarId) return

    const pollStatus = async () => {
      // 이전 요청이 진행 중이면 스킵
      if (isPollingRef.current) return

      isPollingRef.current = true
      try {
        const res = await fetch(`/api/avatars/${newAvatarId}/status`)
        if (!res.ok) throw new Error('Failed to fetch status')

        const data = await res.json()
        const { avatar, tempImageUrl } = data

        if (avatar.status === 'FAILED') {
          setError(avatar.error_message || 'Avatar generation failed')
          goToStep('avatar')
          return
        }

        // 상태별 메시지
        switch (avatar.status) {
          case 'PENDING':
            setStatusMessage(avatarProcessingT.processing || 'Processing request...')
            break
          case 'IN_QUEUE':
            setStatusMessage(avatarProcessingT.inQueue || 'Waiting in queue...')
            break
          case 'IN_PROGRESS':
            setStatusMessage(avatarProcessingT.aiGenerating || 'AI is generating your avatar...')
            break
          case 'UPLOADING':
            if (!hasUploadedRef.current && tempImageUrl) {
              hasUploadedRef.current = true
              setIsUploading(true)
              setStatusMessage(avatarProcessingT.saving || 'Saving image...')

              try {
                // 클라이언트에서 이미지 다운로드 + 압축 + R2 업로드
                const { originalUrl, compressedUrl } = await uploadAvatarImage(newAvatarId, tempImageUrl)

                // 완료 처리
                const completeRes = await fetch(`/api/avatars/${newAvatarId}/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ originalUrl, compressedUrl }),
                })

                if (!completeRes.ok) throw new Error(avatarProcessingT.completeFailed || 'Completion failed')

                const completeData = await completeRes.json()
                onAvatarProcessingComplete(completeData.avatar)
              } catch (uploadErr) {
                console.error('Upload error:', uploadErr)
                setError(avatarProcessingT.saveFailed || 'Failed to save image')
                goToStep('avatar')
              }
            }
            break
          case 'COMPLETED':
            // 이미 완료된 경우
            const avatarRes = await fetch(`/api/avatars/${newAvatarId}`)
            if (avatarRes.ok) {
              const avatarData = await avatarRes.json()
              onAvatarProcessingComplete(avatarData.avatar)
            }
            break
        }
      } catch (err) {
        console.error('Status polling error:', err)
      } finally {
        isPollingRef.current = false
      }
    }

    // 즉시 한 번 실행
    pollStatus()

    // 1초 간격으로 폴링
    pollingRef.current = setInterval(pollStatus, 1000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      isPollingRef.current = false
    }
  }, [newAvatarId, onAvatarProcessingComplete, setError, goToStep])

  return (
    <div className="flex flex-col items-center py-8">
      {/* 아바타 아이콘 */}
      <div className="relative w-32 h-32 mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-card flex items-center justify-center">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        {/* 회전 링 */}
        <div className="absolute inset-0">
          <svg className="w-full h-full animate-spin" style={{ animationDuration: '3s' }}>
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="30 70"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* 상태 메시지 */}
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {statusMessage}
        </p>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {avatarProcessingT.pleaseWait || 'Please wait'}
      </p>

      {/* 진행 단계 표시 */}
      <div className="mt-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className={`w-2 h-2 rounded-full ${isUploading ? 'bg-primary' : 'bg-border'}`} />
        <div className="w-2 h-2 rounded-full bg-border" />
      </div>
    </div>
  )
}
