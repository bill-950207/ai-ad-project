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

export function AvatarProcessingStep() {
  const {
    newAvatarId,
    onAvatarProcessingComplete,
    setError,
    goToStep,
  } = useOnboarding()

  const [statusMessage, setStatusMessage] = useState('아바타를 생성하고 있습니다...')
  const [isUploading, setIsUploading] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const hasUploadedRef = useRef(false)

  // 상태 폴링
  useEffect(() => {
    if (!newAvatarId) return

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/avatars/${newAvatarId}/status`)
        if (!res.ok) throw new Error('Failed to fetch status')

        const data = await res.json()
        const { avatar, tempImageUrl } = data

        if (avatar.status === 'FAILED') {
          setError(avatar.error_message || '아바타 생성에 실패했습니다')
          goToStep('avatar')
          return
        }

        // 상태별 메시지
        switch (avatar.status) {
          case 'PENDING':
            setStatusMessage('요청을 처리 중입니다...')
            break
          case 'IN_QUEUE':
            setStatusMessage('대기열에서 처리를 기다리고 있습니다...')
            break
          case 'IN_PROGRESS':
            setStatusMessage('AI가 아바타를 생성하고 있습니다...')
            break
          case 'UPLOADING':
            if (!hasUploadedRef.current && tempImageUrl) {
              hasUploadedRef.current = true
              setIsUploading(true)
              setStatusMessage('이미지를 저장하고 있습니다...')

              try {
                // 클라이언트에서 이미지 다운로드 + 압축 + R2 업로드
                const { originalUrl, compressedUrl } = await uploadAvatarImage(newAvatarId, tempImageUrl)

                // 완료 처리
                const completeRes = await fetch(`/api/avatars/${newAvatarId}/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ originalUrl, compressedUrl }),
                })

                if (!completeRes.ok) throw new Error('완료 처리 실패')

                const completeData = await completeRes.json()
                onAvatarProcessingComplete(completeData.avatar)
              } catch (uploadErr) {
                console.error('업로드 오류:', uploadErr)
                setError('이미지 저장에 실패했습니다')
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
        console.error('상태 폴링 오류:', err)
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
        잠시만 기다려주세요
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
