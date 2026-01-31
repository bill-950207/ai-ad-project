/**
 * 음악 선택 모달 컴포넌트
 *
 * 영상 광고에 추가할 배경 음악을 선택하고 구간을 설정합니다.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Music,
  Loader2,
  Play,
  Pause,
  Volume2,
  Check,
  Clock,
} from 'lucide-react'
import Image from 'next/image'
import { DualRangeSlider } from '@/components/ui/dual-range-slider'
import { TrackSelectModal } from './track-select-modal'

interface MusicTrack {
  id: string
  audioUrl: string
  streamAudioUrl: string
  imageUrl: string
  title: string
  tags: string
  duration: number
}

interface AdMusic {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  mood: string | null
  genre: string | null
  product_type: string | null
  audio_url: string | null
  stream_audio_url: string | null
  image_url: string | null
  duration: number | null
  tracks: MusicTrack[] | null
  created_at: string
}

export interface MusicSelection {
  musicId: string
  musicName: string
  trackIndex: number
  audioUrl: string
  startTime: number
  endTime: number
  musicVolume: number
}

interface MusicSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (selection: MusicSelection) => void
  videoDuration: number
  videoAdId: string
}

// Mood labels (fallback)
const DEFAULT_MOOD_LABELS: Record<string, string> = {
  bright: 'Bright',
  calm: 'Calm',
  emotional: 'Emotional',
  professional: 'Professional',
  exciting: 'Exciting',
  trendy: 'Trendy',
  playful: 'Playful',
  romantic: 'Romantic',
  nostalgic: 'Nostalgic',
}

// Genre labels (fallback)
const DEFAULT_GENRE_LABELS: Record<string, string> = {
  pop: 'Pop',
  electronic: 'Electronic',
  classical: 'Classical',
  jazz: 'Jazz',
  rock: 'Rock',
  hiphop: 'Hip-hop',
  ambient: 'Ambient',
  acoustic: 'Acoustic',
  lofi: 'Lo-fi',
  cinematic: 'Cinematic',
  rnb: 'R&B',
  folk: 'Folk',
}

export function MusicSelectModal({
  isOpen,
  onClose,
  onSelect,
  videoDuration,
  videoAdId,
}: MusicSelectModalProps) {
  const router = useRouter()

  // 음악 목록 상태
  const [musicList, setMusicList] = useState<AdMusic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 트랙 선택 모달 상태
  const [trackSelectModalOpen, setTrackSelectModalOpen] = useState(false)
  const [pendingMusic, setPendingMusic] = useState<AdMusic | null>(null)

  // 선택 상태
  const [selectedMusic, setSelectedMusic] = useState<AdMusic | null>(null)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0)
  const [timeRange, setTimeRange] = useState<[number, number]>([0, Math.min(15, videoDuration)])
  const [musicVolume, setMusicVolume] = useState(40) // 기본값: 보통

  // 미리듣기 상태
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 음악 목록 조회
  const fetchMusicList = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/ad-music')
      if (res.ok) {
        const data = await res.json()
        // COMPLETED 상태만 필터링
        const completedMusic = (data.musicList || []).filter(
          (m: AdMusic) => m.status === 'COMPLETED'
        )
        setMusicList(completedMusic)
      }
    } catch (error) {
      console.error('음악 목록 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchMusicList()
    }
  }, [isOpen, fetchMusicList])

  // 모달 닫힐 때 정리 - stopPreview는 아래에서 정의됨
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen) {
      // stopPreview 대신 직접 정리
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
        previewTimeoutRef.current = null
      }
      setIsPreviewPlaying(false)
      setSelectedMusic(null)
      setSelectedTrackIndex(0)
      setTimeRange([0, Math.min(15, videoDuration)])
      setMusicVolume(40)
      setTrackSelectModalOpen(false)
      setPendingMusic(null)
    }
  }, [isOpen, videoDuration])

  // 선택된 트랙 정보
  const getSelectedTrack = useCallback((): MusicTrack | null => {
    if (!selectedMusic) return null

    if (selectedMusic.tracks && selectedMusic.tracks.length > 0) {
      return selectedMusic.tracks[selectedTrackIndex] || null
    }

    // tracks 배열이 없으면 기본 필드 사용
    if (selectedMusic.audio_url) {
      return {
        id: selectedMusic.id,
        audioUrl: selectedMusic.audio_url,
        streamAudioUrl: selectedMusic.stream_audio_url || selectedMusic.audio_url,
        imageUrl: selectedMusic.image_url || '',
        title: selectedMusic.name,
        tags: '',
        duration: selectedMusic.duration || 30,
      }
    }

    return null
  }, [selectedMusic, selectedTrackIndex])

  // 음악 선택 시 시간 범위 초기화
  useEffect(() => {
    const track = getSelectedTrack()
    if (track) {
      const maxEnd = Math.min(track.duration, videoDuration)
      setTimeRange([0, Math.min(15, maxEnd)])
    }
  }, [selectedMusic, selectedTrackIndex, videoDuration, getSelectedTrack])

  // 미리듣기 정지 (startPreview보다 먼저 정의)
  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
    setIsPreviewPlaying(false)
  }, [])

  // 미리듣기 시작
  const startPreview = useCallback(() => {
    const track = getSelectedTrack()
    if (!track) return

    stopPreview()

    const audio = new Audio(track.audioUrl)
    audio.currentTime = timeRange[0]
    audio.volume = musicVolume / 100
    audio.play().catch(() => {
      // 자동재생 정책에 의한 실패 시 무시
      setIsPreviewPlaying(false)
    })

    audioRef.current = audio

    // 선택 구간 끝나면 자동 정지
    const duration = (timeRange[1] - timeRange[0]) * 1000
    previewTimeoutRef.current = setTimeout(() => {
      stopPreview()
    }, duration)

    audio.onended = () => stopPreview()
    setIsPreviewPlaying(true)
  }, [getSelectedTrack, timeRange, musicVolume, stopPreview])

  // 미리듣기 토글
  const togglePreview = () => {
    if (isPreviewPlaying) {
      stopPreview()
    } else {
      startPreview()
    }
  }

  // 음악 선택 핸들러 (트랙이 2개 이상이면 트랙 선택 모달 열기)
  const handleMusicClick = useCallback((music: AdMusic) => {
    stopPreview()

    // 트랙이 2개 이상이면 트랙 선택 모달 열기
    if (music.tracks && music.tracks.length > 1) {
      setPendingMusic(music)
      setTrackSelectModalOpen(true)
    } else {
      // 트랙이 1개이거나 없으면 바로 선택
      setSelectedMusic(music)
      setSelectedTrackIndex(0)
    }
  }, [stopPreview])

  // 트랙 선택 완료 핸들러
  const handleTrackSelect = useCallback((trackIndex: number) => {
    if (pendingMusic) {
      setSelectedMusic(pendingMusic)
      setSelectedTrackIndex(trackIndex)
      setPendingMusic(null)
    }
    setTrackSelectModalOpen(false)
  }, [pendingMusic])

  // 트랙 선택 모달 닫기 핸들러
  const handleTrackSelectClose = useCallback(() => {
    setTrackSelectModalOpen(false)
    setPendingMusic(null)
  }, [])

  // 적용
  const handleApply = () => {
    const track = getSelectedTrack()
    if (!selectedMusic || !track) return

    stopPreview()

    // 합성 페이지로 이동 (쿼리 파라미터에 정보 전달)
    const params = new URLSearchParams({
      musicId: selectedMusic.id,
      musicName: encodeURIComponent(selectedMusic.name),
      trackIndex: String(selectedTrackIndex),
      startTime: String(timeRange[0]),
      endTime: String(timeRange[1]),
      musicVolume: String(musicVolume / 100),
      imageUrl: encodeURIComponent(track.imageUrl || ''),
    })

    onClose()
    router.push(`/dashboard/video-ad/${videoAdId}/merge-music?${params.toString()}`)

    // 레거시 콜백 지원 (필요한 경우)
    if (onSelect) {
      onSelect({
        musicId: selectedMusic.id,
        musicName: selectedMusic.name,
        trackIndex: selectedTrackIndex,
        audioUrl: track.audioUrl,
        startTime: timeRange[0],
        endTime: timeRange[1],
        musicVolume: musicVolume / 100,
      })
    }
  }

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  const selectedTrack = getSelectedTrack()
  const maxDuration = selectedTrack?.duration || 30

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Music className="w-5 h-5" />
            배경 음악 선택
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : musicList.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">생성된 음악이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                음악 페이지에서 먼저 음악을 생성해주세요
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 음악 목록 */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">음악 선택</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {musicList.map((music) => {
                    const isSelected = selectedMusic?.id === music.id
                    const trackCount = music.tracks?.length || 1
                    const firstTrack = music.tracks?.[0]
                    const imageUrl = firstTrack?.imageUrl || music.image_url

                    return (
                      <button
                        key={music.id}
                        onClick={() => handleMusicClick(music)}
                        className={`relative flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                      >
                        {/* 썸네일 */}
                        <div className="relative w-12 h-12 rounded bg-secondary/50 flex-shrink-0 overflow-hidden">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={music.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{music.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {music.mood && (
                              <span>{MOOD_LABELS[music.mood] || music.mood}</span>
                            )}
                            {music.genre && (
                              <span>• {GENRE_LABELS[music.genre] || music.genre}</span>
                            )}
                          </div>
                          {trackCount > 1 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {trackCount}개 트랙
                            </p>
                          )}
                        </div>

                        {/* 선택 표시 */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 선택된 트랙 정보 표시 (트랙이 2개 이상인 경우) */}
              {selectedMusic && selectedMusic.tracks && selectedMusic.tracks.length > 1 && (
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">선택된 트랙:</span>
                    <span className="text-sm font-medium text-foreground">
                      트랙 {selectedTrackIndex + 1}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({formatTime(selectedMusic.tracks[selectedTrackIndex]?.duration || 0)})
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      stopPreview()
                      setPendingMusic(selectedMusic)
                      setTrackSelectModalOpen(true)
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    다른 트랙 선택
                  </button>
                </div>
              )}

              {/* 구간 선택 */}
              {selectedMusic && selectedTrack && (
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      구간 선택
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        영상 길이: {formatTime(videoDuration)}
                      </span>
                      <button
                        onClick={() => {
                          const newEnd = Math.min(videoDuration, maxDuration)
                          setTimeRange([0, newEnd])
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        영상에 맞추기
                      </button>
                    </div>
                  </div>

                  <DualRangeSlider
                    min={0}
                    max={maxDuration}
                    value={timeRange}
                    onChange={setTimeRange}
                    step={1}
                    formatLabel={formatTime}
                  />

                  {/* 미리듣기 */}
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={togglePreview}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      {isPreviewPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          정지
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          미리듣기
                        </>
                      )}
                    </button>

                    {/* 볼륨 조절 */}
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">음량</span>
                      <div className="flex gap-1">
                        {[
                          { label: 'Low', value: 20 },
                          { label: 'Medium', value: 40 },
                          { label: 'High', value: 60 },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setMusicVolume(option.value)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              musicVolume === option.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedMusic || !selectedTrack}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            적용하기
          </button>
        </div>
      </div>

      {/* 트랙 선택 모달 */}
      {pendingMusic && pendingMusic.tracks && pendingMusic.tracks.length > 1 && (
        <TrackSelectModal
          isOpen={trackSelectModalOpen}
          onClose={handleTrackSelectClose}
          onSelect={handleTrackSelect}
          musicName={pendingMusic.name}
          tracks={pendingMusic.tracks}
        />
      )}
    </div>
  )
}
