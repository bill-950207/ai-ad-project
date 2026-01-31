/**
 * 트랙 선택 모달 컴포넌트
 *
 * 음악의 두 개 트랙 중 하나를 선택합니다.
 * 각 트랙별로 미리듣기 기능을 제공합니다.
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Music, Play, Pause, Check, Clock } from 'lucide-react'
import Image from 'next/image'

interface MusicTrack {
  id: string
  audioUrl: string
  streamAudioUrl: string
  imageUrl: string
  title: string
  tags: string
  duration: number
}

interface TrackSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (trackIndex: number) => void
  musicName: string
  tracks: MusicTrack[]
}

export function TrackSelectModal({
  isOpen,
  onClose,
  onSelect,
  musicName,
  tracks,
}: TrackSelectModalProps) {
  const [playingTrackIndex, setPlayingTrackIndex] = useState<number | null>(null)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 오디오 정지
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingTrackIndex(null)
  }, [])

  // 트랙 재생/정지 토글
  const togglePlayTrack = useCallback((index: number) => {
    const track = tracks[index]
    if (!track) return

    // 같은 트랙이면 정지
    if (playingTrackIndex === index) {
      stopAudio()
      return
    }

    // 다른 트랙 재생 중이면 정지 후 새 트랙 재생
    stopAudio()

    const audio = new Audio(track.audioUrl)
    audio.volume = 0.7
    audio.play().catch(() => {
      // 자동재생 정책에 의한 실패 시 무시
      setPlayingTrackIndex(null)
    })
    audio.onended = () => {
      setPlayingTrackIndex(null)
      audioRef.current = null
    }
    audioRef.current = audio
    setPlayingTrackIndex(index)
  }, [tracks, playingTrackIndex, stopAudio])

  // 트랙 선택 확정
  const handleConfirm = () => {
    if (selectedTrackIndex !== null) {
      stopAudio()
      onSelect(selectedTrackIndex)
    }
  }

  // 모달 닫힐 때 정리
  useEffect(() => {
    if (!isOpen) {
      stopAudio()
      setSelectedTrackIndex(null)
    }
  }, [isOpen, stopAudio])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Music className="w-5 h-5" />
              트랙 선택
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{musicName}</p>
          </div>
          <button
            onClick={() => {
              stopAudio()
              onClose()
            }}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            생성된 두 개의 트랙 중 하나를 선택해주세요. 각 트랙을 미리 들어볼 수 있습니다.
          </p>

          <div className="space-y-3">
            {tracks.map((track, index) => {
              const isPlaying = playingTrackIndex === index
              const isSelected = selectedTrackIndex === index

              return (
                <div
                  key={track.id}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                  }`}
                  onClick={() => setSelectedTrackIndex(index)}
                >
                  {/* 썸네일 */}
                  <div className="relative w-16 h-16 rounded-lg bg-secondary/50 flex-shrink-0 overflow-hidden">
                    {track.imageUrl ? (
                      <Image
                        src={track.imageUrl}
                        alt={`트랙 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">트랙 {index + 1}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(track.duration)}</span>
                    </div>
                    {track.tags && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {track.tags}
                      </p>
                    )}
                  </div>

                  {/* 재생 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePlayTrack(index)
                    }}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isPlaying
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>

                  {/* 선택 표시 */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={() => {
              stopAudio()
              onClose()
            }}
            className="px-4 py-2 text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedTrackIndex === null}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  )
}
