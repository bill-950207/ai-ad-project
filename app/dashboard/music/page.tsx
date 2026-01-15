/**
 * 광고 음악 관리 페이지
 *
 * 광고 배경음악을 생성하고 관리합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Music, Loader2, Play, Pause, Trash2, Download } from 'lucide-react'

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
  error_message: string | null
  created_at: string
}

// 분위기 옵션
const MOOD_OPTIONS = [
  { value: 'bright', labelKey: 'bright' },
  { value: 'calm', labelKey: 'calm' },
  { value: 'emotional', labelKey: 'emotional' },
  { value: 'professional', labelKey: 'professional' },
  { value: 'exciting', labelKey: 'exciting' },
  { value: 'trendy', labelKey: 'trendy' },
]

// 장르 옵션
const GENRE_OPTIONS = [
  { value: 'pop', labelKey: 'pop' },
  { value: 'electronic', labelKey: 'electronic' },
  { value: 'classical', labelKey: 'classical' },
  { value: 'jazz', labelKey: 'jazz' },
  { value: 'rock', labelKey: 'rock' },
  { value: 'hiphop', labelKey: 'hiphop' },
  { value: 'ambient', labelKey: 'ambient' },
  { value: 'acoustic', labelKey: 'acoustic' },
]

// 제품 유형 옵션
const PRODUCT_TYPE_OPTIONS = [
  { value: 'cosmetics', labelKey: 'cosmetics' },
  { value: 'food', labelKey: 'food' },
  { value: 'tech', labelKey: 'tech' },
  { value: 'fashion', labelKey: 'fashion' },
  { value: 'health', labelKey: 'health' },
  { value: 'automobile', labelKey: 'automobile' },
  { value: 'finance', labelKey: 'finance' },
  { value: 'lifestyle', labelKey: 'lifestyle' },
]

export default function MusicPage() {
  const { t } = useLanguage()
  const [musicList, setMusicList] = useState<AdMusic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<Record<string, number>>({})

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    mood: '',
    genre: '',
    productType: '',
  })

  // 번역 헬퍼
  const musicT = (t as Record<string, unknown>).adMusic as Record<string, unknown> | undefined

  // 음악 목록 조회
  const fetchMusicList = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-music')
      if (res.ok) {
        const data = await res.json()
        setMusicList(data.musicList || [])
      }
    } catch (error) {
      console.error('음악 목록 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMusicList()
  }, [fetchMusicList])

  // 페이지 이동 시 오디오 정지 (cleanup)
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ''
      }
    }
  }, [audioElement])

  // 생성 중인 음악 폴링
  useEffect(() => {
    const pendingMusic = musicList.filter(m =>
      ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(m.status)
    )

    if (pendingMusic.length === 0) return

    const pollStatus = async () => {
      for (const music of pendingMusic) {
        try {
          const res = await fetch(`/api/ad-music/${music.id}/status`)
          if (res.ok) {
            const data = await res.json()
            setMusicList(prev =>
              prev.map(m => m.id === music.id ? data.music : m)
            )
          }
        } catch (error) {
          console.error('상태 폴링 오류:', error)
        }
      }
    }

    const interval = setInterval(pollStatus, 3000)
    return () => clearInterval(interval)
  }, [musicList])

  // 음악 생성
  const handleCreate = async () => {
    if (!formData.name || !formData.mood || !formData.genre || !formData.productType) {
      alert('모든 필드를 선택해주세요.')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/ad-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          mood: formData.mood,
          genre: formData.genre,
          productType: formData.productType,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMusicList(prev => [data.music, ...prev])
        setShowCreateModal(false)
        setFormData({ name: '', mood: '', genre: '', productType: '' })
      } else {
        const error = await res.json()
        alert(error.error || '음악 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('음악 생성 오류:', error)
      alert('음악 생성에 실패했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  // 음악 삭제
  const handleDelete = async (id: string, music: AdMusic) => {
    if (!confirm('이 음악을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/ad-music/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMusicList(prev => prev.filter(m => m.id !== id))
        // 현재 재생 중인 트랙이 삭제된 음악의 트랙인 경우 정지
        const tracks = music.tracks || []
        if (tracks.some(t => t.id === playingTrackId)) {
          audioElement?.pause()
          setPlayingTrackId(null)
        }
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    }
  }

  // 재생/일시정지
  const handlePlayPause = (track: MusicTrack) => {
    if (!track.audioUrl) return

    if (playingTrackId === track.id) {
      audioElement?.pause()
      setPlayingTrackId(null)
    } else {
      if (audioElement) {
        audioElement.pause()
      }
      const audio = new Audio(track.audioUrl)
      audio.play()
      audio.onended = () => setPlayingTrackId(null)
      setAudioElement(audio)
      setPlayingTrackId(track.id)
    }
  }

  // 트랙 선택 (트랙 변경 시 현재 재생 중인 오디오 정지)
  const selectTrack = (musicId: string, index: number) => {
    // 현재 재생 중이면 정지
    if (audioElement) {
      audioElement.pause()
      setPlayingTrackId(null)
    }
    setSelectedTrackIndex(prev => ({ ...prev, [musicId]: index }))
  }

  // 현재 선택된 트랙 가져오기
  const getCurrentTrack = (music: AdMusic): MusicTrack | null => {
    const tracks = music.tracks || []
    if (tracks.length === 0) return null
    const index = selectedTrackIndex[music.id] ?? 0
    return tracks[index] || null
  }

  // 다운로드
  const handleDownload = (track: MusicTrack, musicName: string, index: number) => {
    if (!track.audioUrl) return
    const link = document.createElement('a')
    link.href = track.audioUrl
    link.download = `${musicName}_track${index + 1}.mp3`
    link.click()
  }

  // 시간 포맷
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {(musicT?.title as string) || '광고 음악 관리'}
          </h1>
          <p className="text-muted-foreground">
            {(musicT?.subtitle as string) || '광고에 사용할 배경 음악을 생성하세요'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {(musicT?.createNew as string) || '새 음악 생성'}
        </button>
      </div>

      {/* 음악 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-secondary/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : musicList.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            {(musicT?.emptyList as string) || '생성된 음악이 없습니다'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {(musicT?.emptyDescription as string) || '새 음악을 생성하여 광고에 활용하세요'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            {(musicT?.createNew as string) || '새 음악 생성'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {musicList.map(music => (
            <div
              key={music.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              {/* 이미지/아이콘 영역 */}
              {(() => {
                const currentTrack = getCurrentTrack(music)
                const tracks = music.tracks || []
                const currentIndex = selectedTrackIndex[music.id] ?? 0

                return (
                  <div className="aspect-video relative bg-secondary/30 flex items-center justify-center">
                    {currentTrack?.imageUrl || music.image_url ? (
                      <img
                        src={currentTrack?.imageUrl || music.image_url || ''}
                        alt={music.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-16 h-16 text-muted-foreground/50" />
                    )}

                    {/* 상태 오버레이 */}
                    {['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(music.status) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">{(musicT?.generating as string) || '생성 중...'}</p>
                        </div>
                      </div>
                    )}

                    {/* 재생 버튼 (완료된 경우) */}
                    {music.status === 'COMPLETED' && currentTrack && (
                      <button
                        onClick={() => handlePlayPause(currentTrack)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                      >
                        {playingTrackId === currentTrack.id ? (
                          <Pause className="w-12 h-12 text-white" />
                        ) : (
                          <Play className="w-12 h-12 text-white" />
                        )}
                      </button>
                    )}

                    {/* 트랙 선택 버튼 (여러 트랙이 있는 경우) */}
                    {music.status === 'COMPLETED' && tracks.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/60 rounded-full px-2 py-1">
                        {tracks.map((track, index) => (
                          <button
                            key={track.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              selectTrack(music.id, index)
                            }}
                            className={`w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                              currentIndex === index
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white/20 text-white hover:bg-white/40'
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 실패 상태 */}
                    {music.status === 'FAILED' && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <p className="text-red-500 font-medium">{(musicT?.failed as string) || '생성 실패'}</p>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* 정보 영역 */}
              {(() => {
                const currentTrack = getCurrentTrack(music)
                const currentIndex = selectedTrackIndex[music.id] ?? 0

                return (
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-foreground truncate flex-1">{music.name}</h3>
                      {currentTrack && (
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatDuration(currentTrack.duration)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {music.mood && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {((musicT?.moods as Record<string, string>)?.[music.mood]) || music.mood}
                        </span>
                      )}
                      {music.genre && (
                        <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
                          {((musicT?.genres as Record<string, string>)?.[music.genre]) || music.genre}
                        </span>
                      )}
                      {(music.tracks?.length || 0) > 1 && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded">
                          Track {currentIndex + 1}/{music.tracks?.length}
                        </span>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2">
                      {music.status === 'COMPLETED' && currentTrack && (
                        <button
                          onClick={() => handleDownload(currentTrack, music.name, currentIndex)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {(musicT?.download as string) || '다운로드'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(music.id, music)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      )}

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">
              {(musicT?.createNew as string) || '새 음악 생성'}
            </h2>

            <div className="space-y-4">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {(musicT?.name as string) || '음악 이름'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={(musicT?.namePlaceholder as string) || '예: 봄 시즌 광고 음악'}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 분위기 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {(musicT?.mood as string) || '분위기'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MOOD_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, mood: option.value }))}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.mood === option.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border hover:border-primary/50'
                      }`}
                    >
                      {((musicT?.moods as Record<string, string>)?.[option.labelKey]) || option.labelKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* 장르 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {(musicT?.genre as string) || '장르'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GENRE_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, genre: option.value }))}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.genre === option.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border hover:border-primary/50'
                      }`}
                    >
                      {((musicT?.genres as Record<string, string>)?.[option.labelKey]) || option.labelKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제품 유형 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {(musicT?.productType as string) || '제품 유형'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRODUCT_TYPE_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, productType: option.value }))}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.productType === option.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border hover:border-primary/50'
                      }`}
                    >
                      {((musicT?.productTypes as Record<string, string>)?.[option.labelKey]) || option.labelKey}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
              >
                {(musicT?.cancel as string) || '취소'}
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !formData.name || !formData.mood || !formData.genre || !formData.productType}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {(musicT?.generating as string) || '생성 중...'}
                  </>
                ) : (
                  (musicT?.generate as string) || '생성하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
