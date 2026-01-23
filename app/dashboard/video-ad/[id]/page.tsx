/**
 * 영상 광고 상세 페이지
 *
 * 영상 재생, 정보 표시, 다운로드, 삭제
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import {
  ArrowLeft,
  Download,
  Trash2,
  Loader2,
  Package,
  User,
  Clock,
  Monitor,
  Calendar,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RefreshCw,
  MapPin,
  Camera,
  Mic,
  Shirt,
  Settings,
  Film,
  Music,
} from 'lucide-react'
import Image from 'next/image'
import { MusicSelectModal } from '@/components/video-ad/music-select-modal'

interface SceneKeyframe {
  sceneIndex: number
  imageUrl?: string
  status: string
}

interface SceneVideoUrl {
  sceneIndex: number
  videoUrl: string
}

interface VideoAdDetail {
  id: string
  status: string
  category: string | null
  video_url: string | null
  thumbnail_url: string | null
  prompt: string | null
  prompt_expanded: string | null
  duration: number | null
  resolution: string | null
  aspect_ratio: string | null
  video_width: number | null
  video_height: number | null
  video_fps: number | null
  video_duration: number | null
  product_info: string | null
  product_url: string | null
  product_summary: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
  // 추가 필드
  script: string | null
  script_style: string | null
  voice_id: string | null
  voice_name: string | null
  camera_composition: string | null
  location_prompt: string | null
  first_scene_image_url: string | null
  first_frame_prompt: string | null
  outfit_id: string | null
  scenario_info: string | null
  scene_keyframes: SceneKeyframe[] | null
  scene_video_urls: SceneVideoUrl[] | null
  ad_products?: {
    id: string
    name: string
    image_url: string | null
    rembg_image_url: string | null
    description: string | null
    brand: string | null
    price: string | null
  }
  avatars?: {
    id: string
    name: string
    image_url: string | null
  }
  avatar_outfits?: {
    id: string
    name: string
    image_url: string | null
  }
  bgm_info?: {
    music_id: string
    music_name: string
    track_index: number
    start_time: number
    end_time: number
    music_volume: number
    original_video_url: string
  } | null
}

export default function VideoAdDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useLanguage()

  const [videoAd, setVideoAd] = useState<VideoAdDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 음악 추가 상태
  const [showMusicModal, setShowMusicModal] = useState(false)

  // 비디오 컨트롤 상태
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 폴링을 위한 상태
  const [isPolling, setIsPolling] = useState(false)

  // 영상 메타데이터 로드 시 실제 길이 업데이트
  const handleVideoLoadedMetadata = useCallback(async () => {
    if (!videoRef.current || !videoAd) return

    const actualDuration = videoRef.current.duration
    // 실제 길이가 저장된 길이와 다르면 업데이트
    if (actualDuration > 0 && (!videoAd.video_duration || Math.abs(actualDuration - videoAd.video_duration) > 0.5)) {
      try {
        await fetch(`/api/video-ads/${videoAd.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_duration: actualDuration }),
        })
        // 로컬 상태 업데이트
        setVideoAd(prev => prev ? { ...prev, video_duration: actualDuration } : null)
      } catch (error) {
        console.error('영상 길이 업데이트 오류:', error)
      }
    }
  }, [videoAd])

  const fetchVideoAd = useCallback(async () => {
    try {
      const res = await fetch(`/api/video-ads/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setVideoAd(data.videoAd)

        // 완료되지 않은 상태면 폴링 시작
        if (data.videoAd.status !== 'COMPLETED' && data.videoAd.status !== 'FAILED') {
          setIsPolling(true)
        } else {
          setIsPolling(false)
        }
      } else if (res.status === 404) {
        router.push('/dashboard/video-ad')
      }
    } catch (error) {
      console.error('영상 광고 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchVideoAd()
  }, [fetchVideoAd])

  // 폴링으로 상태 업데이트
  useEffect(() => {
    if (!isPolling) return

    const interval = setInterval(() => {
      fetchVideoAd()
    }, 5000)

    return () => clearInterval(interval)
  }, [isPolling, fetchVideoAd])

  const handleDelete = async () => {
    if (!videoAd) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/video-ads/${videoAd.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard/video-ad')
      } else {
        const error = await res.json()
        alert(error.error || '삭제 실패')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDownload = async () => {
    if (!videoAd?.video_url) return

    try {
      const response = await fetch(videoAd.video_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `video-ad-${videoAd.id}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('다운로드 오류:', error)
      // 직접 링크로 fallback
      window.open(videoAd.video_url, '_blank')
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  // 시간 포맷 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 번역
  const videoAdT = t.videoAd as {
    title?: string
    status?: {
      pending?: string
      inQueue?: string
      inProgress?: string
      completed?: string
      failed?: string
    }
    confirmDelete?: string
    download?: string
    delete?: string
    product?: string
    avatar?: string
    duration?: string
    resolution?: string
    createdAt?: string
    prompt?: string
    productInfo?: string
    expandedPrompt?: string
    videoInfo?: string
    processing?: string
    processingDesc?: string
  } | undefined

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'PENDING': { label: videoAdT?.status?.pending || '대기 중', className: 'bg-yellow-500/20 text-yellow-500' },
      'IN_QUEUE': { label: videoAdT?.status?.inQueue || '큐 대기', className: 'bg-blue-500/20 text-blue-500' },
      'IN_PROGRESS': { label: videoAdT?.status?.inProgress || '생성 중', className: 'bg-purple-500/20 text-purple-500' },
      'COMPLETED': { label: videoAdT?.status?.completed || '완료', className: 'bg-green-500/20 text-green-500' },
      'FAILED': { label: videoAdT?.status?.failed || '실패', className: 'bg-red-500/20 text-red-500' },
    }
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500/20 text-gray-500' }
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!videoAd) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">영상 광고를 찾을 수 없습니다</p>
        <Link
          href="/dashboard/video-ad"
          className="mt-4 inline-block text-primary hover:underline"
        >
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/video-ad"
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {videoAdT?.title || '영상 광고'} 상세
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(videoAd.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(videoAd.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
        {/* 왼쪽: 비디오 플레이어 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="aspect-video bg-[#1a1a2e] relative">
              {videoAd.status === 'COMPLETED' && videoAd.video_url ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoAd.video_url}
                    className="w-full h-full object-contain"
                    controls={false}
                    muted={isMuted}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                  />
                  {/* 커스텀 컨트롤 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlay}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={handleFullscreen}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Maximize className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </>
              ) : videoAd.status === 'FAILED' ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-red-400">
                  <p className="text-lg font-medium mb-2">생성 실패</p>
                  {videoAd.error_message && (
                    <p className="text-sm text-red-400/80">{videoAd.error_message}</p>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-foreground font-medium">
                    {videoAdT?.processing || '영상을 생성하는 중입니다...'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {videoAdT?.processingDesc || '약 2-5분 소요됩니다'}
                  </p>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            {videoAd.status === 'COMPLETED' && (
              <div className="p-4 border-t border-border flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {videoAdT?.download || '다운로드'}
                </button>
                <button
                  onClick={() => setShowMusicModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Music className="w-4 h-4" />
                  {videoAd.bgm_info ? '음악 변경' : '음악 추가'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {videoAdT?.delete || '삭제'}
                </button>
              </div>
            )}
          </div>

          {/* 프롬프트 정보 */}
          {videoAd.prompt && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {videoAdT?.prompt || '프롬프트'}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {videoAd.prompt}
              </p>
            </div>
          )}

          {/* 확장 프롬프트 */}
          {videoAd.prompt_expanded && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {videoAdT?.expandedPrompt || '확장 프롬프트'}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {videoAd.prompt_expanded}
              </p>
            </div>
          )}

          {/* 씬 키프레임 (멀티씬 모드일 때 표시) */}
          {videoAd.scene_keyframes && videoAd.scene_keyframes.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Film className="w-4 h-4" />
                씬 키프레임 ({videoAd.scene_keyframes.length}개)
              </h3>
              <div className={`grid gap-3 ${
                videoAd.scene_keyframes.length <= 2 ? 'grid-cols-2' :
                videoAd.scene_keyframes.length === 3 ? 'grid-cols-3' :
                videoAd.scene_keyframes.length === 4 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
                {videoAd.scene_keyframes
                  .filter(kf => kf.status === 'completed' && kf.imageUrl)
                  .sort((a, b) => a.sceneIndex - b.sceneIndex)
                  .map((kf) => (
                    <div key={kf.sceneIndex} className="relative aspect-square rounded-lg overflow-hidden bg-secondary/30">
                      <Image
                        src={kf.imageUrl!}
                        alt={`씬 ${kf.sceneIndex + 1}`}
                        fill
                        className="object-contain"
                      />
                      <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
                        씬 {kf.sceneIndex + 1}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 대본 (제품 설명 영상용 - 왼쪽 영역에 표시) */}
          {videoAd.script && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  대본 스크립트
                </h3>
                {videoAd.script_style && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    {(() => {
                      const styleLabels: Record<string, string> = {
                        'formal': '전문적',
                        'casual': '친근함',
                        'energetic': '활기찬',
                        'professional': '전문적',
                        'friendly': '친근함',
                        'luxury': '고급스러움',
                      }
                      return styleLabels[videoAd.script_style || ''] || videoAd.script_style
                    })()}
                  </span>
                )}
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {videoAd.script}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 정보 패널 */}
        <div className="space-y-4">
          {/* 제품 정보 */}
          {videoAd.ad_products && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {videoAdT?.product || '제품'}
              </h3>
              <Link
                href={`/dashboard/ad-products/${videoAd.ad_products.id}`}
                className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                {(videoAd.ad_products.rembg_image_url || videoAd.ad_products.image_url) && (
                  <img
                    src={videoAd.ad_products.rembg_image_url || videoAd.ad_products.image_url || ''}
                    alt={videoAd.ad_products.name}
                    className="w-12 h-12 object-contain rounded bg-secondary/30"
                  />
                )}
                <div>
                  <span className="text-foreground block">{videoAd.ad_products.name}</span>
                  {videoAd.ad_products.brand && (
                    <span className="text-xs text-muted-foreground">{videoAd.ad_products.brand}</span>
                  )}
                </div>
              </Link>
            </div>
          )}

          {/* 아바타 정보 */}
          {videoAd.avatars && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {videoAdT?.avatar || '아바타'}
              </h3>
              <Link
                href={`/dashboard/avatar/${videoAd.avatars.id}`}
                className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                {videoAd.avatars.image_url && (
                  <img
                    src={videoAd.avatars.image_url}
                    alt={videoAd.avatars.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <span className="text-foreground">{videoAd.avatars.name}</span>
              </Link>
            </div>
          )}

          {/* 의상 정보 */}
          {videoAd.avatar_outfits && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Shirt className="w-4 h-4" />
                의상
              </h3>
              <div className="flex items-center gap-3">
                {videoAd.avatar_outfits.image_url && (
                  <img
                    src={videoAd.avatar_outfits.image_url}
                    alt={videoAd.avatar_outfits.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <span className="text-foreground">{videoAd.avatar_outfits.name}</span>
              </div>
            </div>
          )}

          {/* 영상 설정 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              영상 설정
            </h3>
            <div className="space-y-3 text-sm">
              {/* 실제 길이 */}
              {videoAd.video_duration && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    영상 길이
                  </span>
                  <span className="text-foreground">{videoAd.video_duration.toFixed(1)}초</span>
                </div>
              )}
              {/* 해상도 */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  해상도
                </span>
                <span className="text-foreground">
                  {videoAd.video_width && videoAd.video_height
                    ? `${videoAd.video_width}x${videoAd.video_height}`
                    : videoAd.resolution || '-'}
                </span>
              </div>
              {/* FPS */}
              {videoAd.video_fps && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">FPS</span>
                  <span className="text-foreground">{videoAd.video_fps}</span>
                </div>
              )}
              {/* 카메라 구도 */}
              {videoAd.camera_composition && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    카메라 구도
                  </span>
                  <span className="text-foreground">
                    {(() => {
                      const compositionLabels: Record<string, string> = {
                        'auto': '자동',
                        'selfie-high': '셀카 (위에서)',
                        'selfie-front': '셀카 (정면)',
                        'selfie-side': '셀카 (측면)',
                        'tripod': '삼각대',
                        'closeup': '클로즈업',
                        'fullbody': '전신',
                      }
                      return compositionLabels[videoAd.camera_composition || ''] || videoAd.camera_composition
                    })()}
                  </span>
                </div>
              )}
              {/* 음성 */}
              {videoAd.voice_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    음성
                  </span>
                  <span className="text-foreground">{videoAd.voice_name}</span>
                </div>
              )}
              {/* 대본 스타일 */}
              {videoAd.script_style && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    대본 스타일
                  </span>
                  <span className="text-foreground">
                    {(() => {
                      const styleLabels: Record<string, string> = {
                        'professional': '전문적',
                        'friendly': '친근함',
                        'luxury': '고급스러움',
                      }
                      return styleLabels[videoAd.script_style || ''] || videoAd.script_style
                    })()}
                  </span>
                </div>
              )}
              {/* 생성일 */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  생성일
                </span>
                <span className="text-foreground">
                  {new Date(videoAd.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* 배경 음악 정보 */}
          {videoAd.bgm_info && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Music className="w-4 h-4" />
                배경 음악
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">음악</span>
                  <span className="text-foreground">{videoAd.bgm_info.music_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">구간</span>
                  <span className="text-foreground">
                    {formatTime(videoAd.bgm_info.start_time)} - {formatTime(videoAd.bgm_info.end_time)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">볼륨</span>
                  <span className="text-foreground">
                    {Math.round(videoAd.bgm_info.music_volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 촬영 장소 */}
          {videoAd.location_prompt && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                촬영 장소
              </h3>
              <p className="text-sm text-muted-foreground">
                {videoAd.location_prompt}
              </p>
            </div>
          )}

          {/* 제품 정보 (입력한 내용) */}
          {videoAd.product_info && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                입력한 제품 정보
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {videoAd.product_info}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-foreground mb-2">
              {videoAdT?.confirmDelete || '이 영상 광고를 삭제하시겠습니까?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              삭제된 영상은 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  '삭제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 음악 선택 모달 */}
      <MusicSelectModal
        isOpen={showMusicModal}
        onClose={() => setShowMusicModal(false)}
        videoDuration={videoAd.video_duration || 10}
        videoAdId={videoAd.id}
      />
    </div>
  )
}
