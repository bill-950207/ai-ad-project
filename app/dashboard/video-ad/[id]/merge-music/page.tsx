/**
 * 영상 음악 합성 진행 페이지
 *
 * 영상과 배경 음악을 합성하는 과정을 시각적으로 보여줍니다.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Music, Loader2, CheckCircle, XCircle, ArrowLeft, Volume2 } from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/language-context'

interface MergeStatus {
  step: 'downloading' | 'processing' | 'uploading' | 'completed' | 'failed'
  progress: number
  message: string
}

interface MergeMusicTranslation {
  preparingFiles?: string
  downloadingFiles?: string
  processingMusic?: string
  savingVideo?: string
  completed?: string
  invalidMusicInfo?: string
  mergeFailed?: string
  unknownError?: string
  errorOccurred?: string
  music?: string
  selectedMusic?: string
  mergeCompleted?: string
  mergingMusic?: string
  redirecting?: string
  goBack?: string
  retry?: string
  doNotCloseWindow?: string
}

export default function MergeMusicPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const mergeMusicT = (t.videoAd as { mergeMusic?: MergeMusicTranslation } | undefined)?.mergeMusic

  const [status, setStatus] = useState<MergeStatus>({
    step: 'downloading',
    progress: 0,
    message: mergeMusicT?.preparingFiles || 'Preparing music and video files...',
  })
  const [error, setError] = useState<string | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const mergeStartedRef = useRef(false)

  // URL 파라미터에서 음악 정보 추출
  const musicId = searchParams.get('musicId')
  const musicName = searchParams.get('musicName')
  const trackIndex = searchParams.get('trackIndex')
  const startTime = searchParams.get('startTime')
  const endTime = searchParams.get('endTime')
  const musicVolume = searchParams.get('musicVolume')
  const imageUrl = searchParams.get('imageUrl')

  // 진행 상태 시뮬레이션 (실제 진행 중에 사용자에게 피드백)
  useEffect(() => {
    if (!isStarted || status.step === 'completed' || status.step === 'failed') return

    const interval = setInterval(() => {
      setStatus((prev) => {
        if (prev.step === 'completed' || prev.step === 'failed') return prev

        // 진행률 천천히 증가 (최대 90%까지, 완료는 API 응답 후)
        const maxProgress = prev.step === 'uploading' ? 95 : 90
        if (prev.progress >= maxProgress) return prev

        const increment = prev.step === 'processing' ? 2 : 5
        return {
          ...prev,
          progress: Math.min(prev.progress + increment, maxProgress),
        }
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isStarted, status.step])

  // 음악 합성 시작
  const startMerge = useCallback(async () => {
    if (mergeStartedRef.current) return
    mergeStartedRef.current = true
    setIsStarted(true)

    if (!musicId || !startTime || !endTime) {
      setError(mergeMusicT?.invalidMusicInfo || 'Invalid music information.')
      setStatus({ step: 'failed', progress: 0, message: mergeMusicT?.errorOccurred || 'Error occurred' })
      return
    }

    try {
      // 단계 1: 다운로드
      setStatus({
        step: 'downloading',
        progress: 10,
        message: mergeMusicT?.downloadingFiles || 'Downloading music and video files...',
      })

      await new Promise((r) => setTimeout(r, 800))

      // 단계 2: 처리
      setStatus({
        step: 'processing',
        progress: 30,
        message: mergeMusicT?.processingMusic || 'Merging music with video...',
      })

      // API 호출
      const res = await fetch(`/api/video-ads/${params.id}/add-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musicId,
          trackIndex: Number(trackIndex) || 0,
          startTime: Number(startTime),
          endTime: Number(endTime),
          musicVolume: Number(musicVolume) || 0.3,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || (mergeMusicT?.mergeFailed || 'Music merge failed.'))
      }

      // 단계 3: 업로드
      setStatus({
        step: 'uploading',
        progress: 85,
        message: mergeMusicT?.savingVideo || 'Saving merged video...',
      })

      await new Promise((r) => setTimeout(r, 500))

      // 완료
      setStatus({
        step: 'completed',
        progress: 100,
        message: mergeMusicT?.completed || 'Music merge completed!',
      })

      // 3초 후 상세 페이지로 이동
      setTimeout(() => {
        router.replace(`/dashboard/video-ad/${params.id}`)
      }, 2000)
    } catch (err) {
      console.error('Music merge error:', err)
      setError(err instanceof Error ? err.message : (mergeMusicT?.unknownError || 'An unknown error occurred.'))
      setStatus({
        step: 'failed',
        progress: 0,
        message: mergeMusicT?.errorOccurred || 'Error occurred',
      })
    }
  }, [params.id, musicId, trackIndex, startTime, endTime, musicVolume, router])

  // 컴포넌트 마운트 시 자동 시작
  useEffect(() => {
    if (!musicId) {
      router.push(`/dashboard/video-ad/${params.id}`)
      return
    }
    startMerge()
  }, [musicId, params.id, router, startMerge])

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStepIcon = () => {
    if (status.step === 'completed') {
      return <CheckCircle className="w-16 h-16 text-green-500" />
    }
    if (status.step === 'failed') {
      return <XCircle className="w-16 h-16 text-red-500" />
    }
    return <Loader2 className="w-16 h-16 text-primary animate-spin" />
  }

  const getStepColor = () => {
    if (status.step === 'completed') return 'bg-green-500'
    if (status.step === 'failed') return 'bg-red-500'
    return 'bg-primary'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* 카드 */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* 음악 정보 */}
          <div className="flex items-center gap-4 mb-8 p-4 bg-secondary/30 rounded-xl">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {imageUrl ? (
                <Image
                  src={decodeURIComponent(imageUrl)}
                  alt={musicName || (mergeMusicT?.music || 'Music')}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {musicName ? decodeURIComponent(musicName) : (mergeMusicT?.selectedMusic || 'Selected music')}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span>
                  {formatTime(Number(startTime))} - {formatTime(Number(endTime))}
                </span>
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  {Math.round(Number(musicVolume) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* 진행 상태 */}
          <div className="flex flex-col items-center text-center">
            {/* 아이콘 */}
            <div className="mb-6">{getStepIcon()}</div>

            {/* 메시지 */}
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {status.step === 'completed'
                ? (mergeMusicT?.mergeCompleted || 'Merge completed!')
                : status.step === 'failed'
                  ? (mergeMusicT?.errorOccurred || 'Error occurred')
                  : (mergeMusicT?.mergingMusic || 'Merging music...')}
            </h2>
            <p className="text-muted-foreground mb-6">{status.message}</p>

            {/* 진행 바 */}
            {status.step !== 'failed' && (
              <div className="w-full mb-6">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStepColor()} transition-all duration-300 ease-out`}
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">{status.progress}%</p>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* 완료 시 안내 */}
            {status.step === 'completed' && (
              <p className="text-sm text-muted-foreground">
                {mergeMusicT?.redirecting || 'Redirecting to video page...'}
              </p>
            )}

            {/* 실패 시 버튼 */}
            {status.step === 'failed' && (
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/dashboard/video-ad/${params.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {mergeMusicT?.goBack || 'Go back'}
                </button>
                <button
                  onClick={() => {
                    mergeStartedRef.current = false
                    setError(null)
                    startMerge()
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {mergeMusicT?.retry || 'Retry'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 하단 팁 */}
        {status.step !== 'completed' && status.step !== 'failed' && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mergeMusicT?.doNotCloseWindow || 'Do not close this window. Merge in progress.'}
          </p>
        )}
      </div>
    </div>
  )
}
