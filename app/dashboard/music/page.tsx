/**
 * 광고 음악 관리 페이지
 *
 * 광고 배경음악을 생성하고 관리합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'
import { Plus, Music, Loader2, Play, Pause, Trash2, Download, Sparkles, Package, ChevronDown, Info, Coins } from 'lucide-react'
import { GridSkeleton } from '@/components/ui/grid-skeleton'
import { ProcessingOverlay } from '@/components/ui/processing-overlay'
import Image from 'next/image'
import { SlotLimitModal } from '@/components/ui/slot-limit-modal'
import { InsufficientCreditsModal } from '@/components/ui/insufficient-credits-modal'
import { MUSIC_CREDIT_COST } from '@/lib/credits'

interface SlotInfo {
  used: number
  limit: number
  message?: string
}

interface AdProduct {
  id: string
  name: string
  description: string | null
  category: string | null
  image_url: string | null
  rembg_image_url: string | null
}

interface MusicRecommendation {
  mood: string
  genre: string
  productType: string
  reasoning: {
    mood: string
    genre: string
    productType: string
  }
  suggestedName: string
}

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
  kie_task_id: string | null
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
  { value: 'playful', labelKey: 'playful' },
  { value: 'romantic', labelKey: 'romantic' },
  { value: 'nostalgic', labelKey: 'nostalgic' },
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
  { value: 'lofi', labelKey: 'lofi' },
  { value: 'cinematic', labelKey: 'cinematic' },
  { value: 'rnb', labelKey: 'rnb' },
  { value: 'folk', labelKey: 'folk' },
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
  { value: 'sports', labelKey: 'sports' },
  { value: 'kids', labelKey: 'kids' },
  { value: 'pet', labelKey: 'pet' },
  { value: 'travel', labelKey: 'travel' },
]

export default function MusicPage() {
  const { t, language } = useLanguage()
  const { refreshCredits } = useCredits()
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

  // 제품 선택 및 AI 추천 상태
  const [products, setProducts] = useState<AdProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isRecommending, setIsRecommending] = useState(false)
  const [recommendation, setRecommendation] = useState<MusicRecommendation | null>(null)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [useAiRecommendation, setUseAiRecommendation] = useState(false)

  // 슬롯 제한 모달 상태
  const [showSlotLimitModal, setShowSlotLimitModal] = useState(false)
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null)

  // 크레딧 부족 모달 상태
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [creditsInfo, setCreditsInfo] = useState<{ required: number; available: number } | null>(null)

  // 번역 헬퍼
  const musicT = (t as Record<string, unknown>).adMusic as Record<string, unknown> | undefined
  const alertsT = musicT?.alerts as { selectProductFirst?: string; fillAllFields?: string; slotFull?: string; generationFailed?: string; confirmDelete?: string; credits?: string; aiRecommendFailed?: string } | undefined

  // 음악 목록 조회
  const fetchMusicList = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-music')
      if (res.ok) {
        const data = await res.json()
        setMusicList(data.musicList || [])
      }
    } catch (error) {
      console.error('Failed to fetch music list:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMusicList()
  }, [fetchMusicList])

  // 제품 목록 조회
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true)
    try {
      const res = await fetch('/api/ad-products?limit=50')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products?.filter((p: AdProduct & { status: string }) => p.status === 'COMPLETED') || [])
      }
    } catch (error) {
      console.error('Failed to fetch product list:', error)
    } finally {
      setIsLoadingProducts(false)
    }
  }, [])

  // 모달 열릴 때 제품 목록 조회
  useEffect(() => {
    if (showCreateModal) {
      fetchProducts()
    }
  }, [showCreateModal, fetchProducts])

  // AI 음악 설정 추천
  const handleAiRecommend = async () => {
    if (!selectedProductId) {
      alert(alertsT?.selectProductFirst || 'Please select a product first.')
      return
    }

    setIsRecommending(true)
    try {
      const res = await fetch('/api/ad-music/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, language }),
      })

      if (res.ok) {
        const data = await res.json()
        setRecommendation(data.recommendation)
        setFormData(prev => ({
          ...prev,
          name: data.recommendation.suggestedName,
          mood: data.recommendation.mood,
          genre: data.recommendation.genre,
          productType: data.recommendation.productType,
        }))
        setUseAiRecommendation(true)
      } else {
        const error = await res.json()
        alert(error.error || (alertsT?.aiRecommendFailed || 'AI recommendation failed.'))
      }
    } catch (error) {
      console.error('AI recommendation error:', error)
      alert(alertsT?.aiRecommendFailed || 'AI recommendation failed.')
    } finally {
      setIsRecommending(false)
    }
  }

  // 선택된 제품 가져오기
  const selectedProduct = products.find(p => p.id === selectedProductId)

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
      m && m.kie_task_id && ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(m.status)
    )

    if (pendingMusic.length === 0) return

    const pollStatus = async () => {
      for (const music of pendingMusic) {
        try {
          // kie_task_id로 상태 조회
          const res = await fetch(`/api/ad-music/${music.kie_task_id}/status`)
          if (res.ok) {
            const data = await res.json()
            // status API 응답 필드 매핑
            setMusicList(prev =>
              prev.map(m => m?.id === data.id ? {
                ...m,
                status: data.status,
                audio_url: data.audioUrl,
                stream_audio_url: data.streamAudioUrl,
                image_url: data.imageUrl,
                duration: data.duration,
                tracks: data.tracks,
                error_message: data.error,
                updated_at: data.updatedAt,
              } : m)
            )
          }
        } catch (error) {
          console.error('Status polling error:', error)
        }
      }
    }

    const interval = setInterval(pollStatus, 3000)
    return () => clearInterval(interval)
  }, [musicList])

  // 음악 생성
  const handleCreate = async () => {
    if (!formData.name || !formData.mood || !formData.genre || !formData.productType) {
      alert(alertsT?.fillAllFields || 'Please fill in all fields.')
      return
    }

    setIsCreating(true)
    try {
      // 크레딧 사전 확인
      const subscriptionRes = await fetch('/api/subscription')
      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json()
        const availableCredits = subscriptionData.profile?.credits ?? 0
        if (availableCredits < MUSIC_CREDIT_COST) {
          setCreditsInfo({ required: MUSIC_CREDIT_COST, available: availableCredits })
          setShowCreditsModal(true)
          setIsCreating(false)
          return
        }
      }

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

      // 슬롯 제한 초과 (403)
      if (res.status === 403) {
        const errorData = await res.json()
        if (errorData.slotInfo) {
          setSlotInfo(errorData.slotInfo)
          setShowSlotLimitModal(true)
          setShowCreateModal(false)
        } else {
          alert(errorData.error || (alertsT?.slotFull || 'Slot is full'))
        }
        return
      }

      // 크레딧 부족 (402)
      if (res.status === 402) {
        const errorData = await res.json()
        setCreditsInfo({
          required: errorData.required ?? MUSIC_CREDIT_COST,
          available: errorData.available ?? 0,
        })
        setShowCreditsModal(true)
        return
      }

      if (res.ok) {
        const data = await res.json()
        setMusicList(prev => [data.music, ...prev])
        setShowCreateModal(false)
        setFormData({ name: '', mood: '', genre: '', productType: '' })
        // 크레딧 갱신
        refreshCredits()
      } else {
        const errorData = await res.json()
        alert(errorData.error || (alertsT?.generationFailed || 'Music generation failed.'))
      }
    } catch (error) {
      console.error('Music generation error:', error)
      alert(alertsT?.generationFailed || 'Music generation failed.')
    } finally {
      setIsCreating(false)
    }
  }

  // 음악 삭제
  const handleDelete = async (id: string, music: AdMusic) => {
    if (!confirm(alertsT?.confirmDelete || 'Are you sure you want to delete this music?')) return

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
      console.error('Delete error:', error)
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
  const getCurrentTrack = (music: AdMusic | null | undefined): MusicTrack | null => {
    if (!music) return null
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
            {(musicT?.title as string) || 'Ad Music Management'}
          </h1>
          <p className="text-muted-foreground">
            {(musicT?.subtitle as string) || 'Create background music for your ads'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          {(musicT?.createNew as string) || 'Create New Music'}
        </button>
      </div>

      {/* 음악 목록 */}
      {isLoading ? (
        <GridSkeleton count={8} columns={{ default: 1, sm: 2, md: 3, lg: 4 }} />
      ) : musicList.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary/50 flex items-center justify-center">
            <Music className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {(musicT?.emptyList as string) || 'No music created yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {(musicT?.emptyDescription as string) || 'Create new music to use in your ads'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            {(musicT?.createNew as string) || 'Create New Music'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {musicList.filter((m): m is AdMusic => m != null).map(music => (
            <div
              key={music.id}
              className="group bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-glow-sm hover:border-primary/30 transition-all duration-300"
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
                      <ProcessingOverlay statusText={(musicT?.generating as string) || 'Generating...'} />
                    )}

                    {/* 재생 버튼 (완료된 경우) */}
                    {music.status === 'COMPLETED' && currentTrack && (
                      <button
                        onClick={() => handlePlayPause(currentTrack)}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300"
                      >
                        <div className={`rounded-full bg-primary p-4 shadow-lg transition-all duration-300 ${
                          playingTrackId === currentTrack.id
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'
                        }`}>
                          {playingTrackId === currentTrack.id ? (
                            <Pause className="w-8 h-8 text-white" />
                          ) : (
                            <Play className="w-8 h-8 text-white ml-1" />
                          )}
                        </div>
                      </button>
                    )}

                    {/* 트랙 선택 버튼 (여러 트랙이 있는 경우) */}
                    {music.status === 'COMPLETED' && tracks.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
                        {tracks.map((track, index) => (
                          <button
                            key={track.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              selectTrack(music.id, index)
                            }}
                            className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full text-xs font-bold transition-all ${
                              currentIndex === index
                                ? 'bg-primary text-white shadow-lg scale-110'
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
                        <p className="text-red-500 font-medium">{(musicT?.failed as string) || 'Generation Failed'}</p>
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

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {music.mood && (
                        <span className="text-xs px-2.5 py-1 bg-primary/15 text-primary rounded-lg font-medium">
                          {((musicT?.moods as Record<string, string>)?.[music.mood]) || music.mood}
                        </span>
                      )}
                      {music.genre && (
                        <span className="text-xs px-2.5 py-1 bg-accent/15 text-accent rounded-lg font-medium">
                          {((musicT?.genres as Record<string, string>)?.[music.genre]) || music.genre}
                        </span>
                      )}
                      {(music.tracks?.length || 0) > 1 && (
                        <span className="text-xs px-2.5 py-1 bg-secondary text-muted-foreground rounded-lg">
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
                          {(musicT?.download as string) || 'Download'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowCreateModal(false)
              setSelectedProductId(null)
              setRecommendation(null)
              setUseAiRecommendation(false)
            }}
          />
          <div className="relative bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-6">
              {(musicT?.createNew as string) || 'Create New Music'}
            </h2>

            <div className="space-y-4">
              {/* AI 추천 섹션 */}
              <div className="p-4 bg-gradient-to-br from-primary/15 via-primary/10 to-accent/10 border border-primary/30 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-primary/30 to-accent/30 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{(musicT?.aiAutoSetting as string) || 'AI Auto Setting'}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(musicT?.aiAutoSettingDesc as string) || 'Get optimal music recommendations for your product'}
                    </p>
                  </div>
                </div>

                {/* 제품 선택 드롭다운 */}
                <div className="relative mb-3">
                  <button
                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-secondary border border-border rounded-xl text-left hover:border-primary/50 transition-colors"
                  >
                    {selectedProduct ? (
                      <div className="flex items-center gap-3">
                        {(selectedProduct.rembg_image_url || selectedProduct.image_url) && (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary/50">
                            <Image
                              src={selectedProduct.rembg_image_url || selectedProduct.image_url || ''}
                              alt={selectedProduct.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span className="text-foreground truncate">{selectedProduct.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {(musicT?.selectProduct as string) || 'Select Product (Optional)'}
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showProductDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingProducts ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : products.length === 0 ? (
                        <div className="py-4 text-center text-muted-foreground text-sm">
                          {(musicT?.noProducts as string) || 'No products registered'}
                        </div>
                      ) : (
                        products.map(product => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setSelectedProductId(product.id)
                              setShowProductDropdown(false)
                              setRecommendation(null)
                              setUseAiRecommendation(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors ${
                              selectedProductId === product.id ? 'bg-primary/10' : ''
                            }`}
                          >
                            {(product.rembg_image_url || product.image_url) && (
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary/50 flex-shrink-0">
                                <Image
                                  src={product.rembg_image_url || product.image_url || ''}
                                  alt={product.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <div className="text-left min-w-0">
                              <div className="font-medium text-foreground truncate">{product.name}</div>
                              {product.category && (
                                <div className="text-xs text-muted-foreground truncate">{product.category}</div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* AI 추천 버튼 */}
                <button
                  onClick={handleAiRecommend}
                  disabled={!selectedProductId || isRecommending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isRecommending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {(musicT?.aiAnalyzing as string) || 'AI Analyzing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {(musicT?.getAiRecommend as string) || 'Get AI Recommendation'}
                    </>
                  )}
                </button>

                {/* AI 추천 결과 표시 */}
                {recommendation && useAiRecommendation && (
                  <div className="mt-3 p-4 bg-success/10 border border-success/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-success/20 rounded-lg">
                        <Info className="w-4 h-4 text-success" />
                      </div>
                      <span className="text-sm font-semibold text-success">{(musicT?.aiRecommendComplete as string) || 'AI Recommendation Complete'}</span>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><span className="text-foreground font-medium">{(musicT?.moodLabel as string) || 'Mood:'}</span> {recommendation.reasoning.mood}</p>
                      <p><span className="text-foreground font-medium">{(musicT?.genreLabel as string) || 'Genre:'}</span> {recommendation.reasoning.genre}</p>
                      <p><span className="text-foreground font-medium">{(musicT?.productTypeLabel as string) || 'Product Type:'}</span> {recommendation.reasoning.productType}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative px-3 bg-card text-sm text-muted-foreground">{(musicT?.orManualSetting as string) || 'or set manually'}</span>
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {(musicT?.name as string) || 'Music Name'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                    setUseAiRecommendation(false)
                  }}
                  placeholder={(musicT?.namePlaceholder as string) || 'e.g., Spring Season Ad Music'}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 분위기 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  {(musicT?.mood as string) || 'Mood'}
                  {useAiRecommendation && formData.mood && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">AI</span>
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MOOD_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, mood: option.value }))
                        setUseAiRecommendation(false)
                      }}
                      className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                        formData.mood === option.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-card border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {((musicT?.moods as Record<string, string>)?.[option.labelKey]) || option.labelKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* 장르 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  {(musicT?.genre as string) || 'Genre'}
                  {useAiRecommendation && formData.genre && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">AI</span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GENRE_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, genre: option.value }))
                        setUseAiRecommendation(false)
                      }}
                      className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                        formData.genre === option.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-card border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {((musicT?.genres as Record<string, string>)?.[option.labelKey]) || option.labelKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제품 유형 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  {(musicT?.productType as string) || 'Product Type'}
                  {useAiRecommendation && formData.productType && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">AI</span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRODUCT_TYPE_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, productType: option.value }))
                        setUseAiRecommendation(false)
                      }}
                      className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                        formData.productType === option.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-card border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/5'
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
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedProductId(null)
                  setRecommendation(null)
                  setUseAiRecommendation(false)
                }}
                className="flex-1 px-4 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors font-medium"
              >
                {(musicT?.cancel as string) || 'Cancel'}
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !formData.name || !formData.mood || !formData.genre || !formData.productType}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {(musicT?.generating as string) || 'Generating...'}
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    {(musicT?.generate as string) || 'Generate'} ({MUSIC_CREDIT_COST} {alertsT?.credits || 'credits'})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 슬롯 제한 모달 */}
      {slotInfo && (
        <SlotLimitModal
          isOpen={showSlotLimitModal}
          onClose={() => setShowSlotLimitModal(false)}
          slotType="music"
          slotInfo={slotInfo}
        />
      )}

      {/* 크레딧 부족 모달 */}
      <InsufficientCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        requiredCredits={creditsInfo?.required ?? 0}
        availableCredits={creditsInfo?.available ?? 0}
        featureName={(musicT?.featureName as string) || 'Music Generation'}
      />
    </div>
  )
}
