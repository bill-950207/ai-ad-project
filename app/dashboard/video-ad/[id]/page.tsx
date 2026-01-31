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
  ChevronDown,
  History,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

// 씬 버전 정보
interface SceneVersion {
  id: string
  video_ad_id: string
  scene_index: number
  version: number
  video_url: string
  prompt: string | null
  duration: number | null
  resolution: string | null
  request_id: string | null
  is_active: boolean
  created_at: string
}

// 제품 정보 파싱 (JSON 문자열에서 제품 정보 추출)
interface ParsedProductInfo {
  id?: string
  name?: string
  description?: string
  brand?: string
  image_url?: string
  rembg_image_url?: string
}

function parseProductInfo(productInfo: string | null): ParsedProductInfo | null {
  if (!productInfo) return null
  try {
    const parsed = JSON.parse(productInfo)
    return {
      id: parsed.id,
      name: parsed.name,
      description: parsed.description,
      brand: parsed.brand,
      image_url: parsed.image_url,
      rembg_image_url: parsed.rembg_image_url,
    }
  } catch {
    // JSON이 아닌 경우 일반 텍스트로 처리
    return null
  }
}

// 시나리오 정보 파싱
interface ParsedScenarioInfo {
  title?: string
  concept?: string
  scenes?: Array<{
    sceneNumber: number
    description: string
    dialogue?: string
    duration?: number
  }>
  sceneDurations?: number[]  // 씬별 영상 길이 배열
}

function parseScenarioInfo(scenarioInfo: string | null): ParsedScenarioInfo | null {
  if (!scenarioInfo) return null
  try {
    const parsed = JSON.parse(scenarioInfo)
    return {
      title: parsed.title,
      concept: parsed.concept,
      scenes: parsed.scenes,
      sceneDurations: parsed._videoSettings?.sceneDurations,  // 씬별 시간 추출
    }
  } catch {
    return null
  }
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
  first_frame_urls: string[] | null  // WebP 압축 이미지 배열
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

  // 씬 버전 관리 상태
  const [sceneVersions, setSceneVersions] = useState<Record<number, SceneVersion[]>>({})
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)
  const [switchingVersionScene, setSwitchingVersionScene] = useState<number | null>(null)

  // 어드민 상태
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRegisteringShowcase, setIsRegisteringShowcase] = useState(false)

  // 어드민 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          setIsAdmin(profile?.role === 'ADMIN')
        }
      } catch (error) {
        console.error('권한 확인 오류:', error)
      }
    }
    checkAdmin()
  }, [])

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

  // 씬 버전 조회 함수
  const fetchSceneVersions = useCallback(async () => {
    if (!params.id) return

    setIsLoadingVersions(true)
    try {
      const res = await fetch(`/api/product-ad/scene-version?videoAdId=${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setSceneVersions(data.groupedByScene || {})
      }
    } catch (error) {
      console.error('씬 버전 조회 오류:', error)
    } finally {
      setIsLoadingVersions(false)
    }
  }, [params.id])

  // 씬 버전 전환 함수
  const switchSceneVersion = async (sceneIndex: number, versionId: string) => {
    if (!videoAd) return

    setSwitchingVersionScene(sceneIndex)
    try {
      const res = await fetch(`/api/product-ad/scene-version/${versionId}/activate`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        const activatedVersion = data.version as SceneVersion

        // scene_video_urls 업데이트
        setVideoAd(prev => {
          if (!prev) return prev
          const updatedSceneVideoUrls = prev.scene_video_urls?.map(sv =>
            sv.sceneIndex === sceneIndex
              ? { ...sv, videoUrl: activatedVersion.video_url }
              : sv
          ) || []
          return { ...prev, scene_video_urls: updatedSceneVideoUrls }
        })

        // 버전 목록 갱신
        await fetchSceneVersions()
      }
    } catch (error) {
      console.error('씬 버전 전환 오류:', error)
    } finally {
      setSwitchingVersionScene(null)
    }
  }

  // 제품 광고인 경우 씬 버전 조회
  useEffect(() => {
    if (videoAd?.category === 'product-ad' && videoAd.scene_video_urls && videoAd.scene_video_urls.length > 0) {
      fetchSceneVersions()
    }
  }, [videoAd?.category, videoAd?.scene_video_urls, fetchSceneVersions])

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
        alert(error.error || t.videoAd.alerts.deleteFailed)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert(t.videoAd.alerts.deleteError)
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

  // 쇼케이스 등록 함수
  const handleRegisterShowcase = async () => {
    if (!videoAd || !videoAd.video_url) return

    // 썸네일 URL 확인 (WebP 압축본 우선 사용)
    // 1. 썸네일 URL
    // 2. WebP 압축 첫 프레임 이미지 (first_frame_urls 배열의 첫 번째)
    // 3. 첫 번째 씬 이미지
    // 4. 키프레임 이미지
    // 5. 제품 이미지
    const getFirstKeyframeImage = () => {
      if (!videoAd.scene_keyframes || videoAd.scene_keyframes.length === 0) return null
      const firstKeyframe = videoAd.scene_keyframes.find(kf => kf.imageUrl)
      return firstKeyframe?.imageUrl || null
    }

    // WebP 압축본 우선 사용
    const getWebpThumbnail = () => {
      if (videoAd.first_frame_urls && Array.isArray(videoAd.first_frame_urls) && videoAd.first_frame_urls.length > 0) {
        return videoAd.first_frame_urls[0]
      }
      return null
    }

    const thumbnailUrl =
      videoAd.thumbnail_url ||
      getWebpThumbnail() ||
      videoAd.first_scene_image_url ||
      getFirstKeyframeImage() ||
      videoAd.ad_products?.rembg_image_url ||
      videoAd.ad_products?.image_url

    if (!thumbnailUrl) {
      alert(t.videoAd.alerts.noThumbnail)
      return
    }

    setIsRegisteringShowcase(true)
    try {
      const res = await fetch('/api/admin/showcases/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          adId: videoAd.id,
          title: videoAd.ad_products?.name || '영상 광고',
          description: videoAd.product_summary || videoAd.prompt || null,
          thumbnailUrl: thumbnailUrl,
          mediaUrl: videoAd.video_url,
          adType: videoAd.category === 'product-description' ? 'productDescription' : 'productAd',
          category: videoAd.ad_products?.brand || null,
          productImageUrl: videoAd.ad_products?.rembg_image_url || videoAd.ad_products?.image_url || null,
          avatarImageUrl: videoAd.avatars?.image_url || null,
        }),
      })

      if (res.ok) {
        alert(t.videoAd.alerts.showcaseRegistered)
      } else {
        const error = await res.json()
        alert(error.error || t.videoAd.alerts.registerFailed)
      }
    } catch (error) {
      console.error('Showcase registration error:', error)
      alert(t.videoAd.alerts.registerError)
    } finally {
      setIsRegisteringShowcase(false)
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
                {isAdmin && (
                  <button
                    onClick={handleRegisterShowcase}
                    disabled={isRegisteringShowcase}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                  >
                    {isRegisteringShowcase ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                    쇼케이스 등록
                  </button>
                )}
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

          {/* 씬 구성 (영상 재생 가능한 가로 레이아웃) */}
          {(() => {
            const hasSceneVideos = videoAd.scene_video_urls && videoAd.scene_video_urls.length > 0
            const scenario = parseScenarioInfo(videoAd.scenario_info)

            // 씬 영상이 없으면 표시하지 않음
            if (!hasSceneVideos) return null

            const sceneVideos = videoAd.scene_video_urls!.sort((a, b) => a.sceneIndex - b.sceneIndex)

            return (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Film className="w-5 h-5 text-primary" />
                  씬별 영상 ({sceneVideos.length}개)
                </h3>

                {/* 가로 스크롤 레이아웃 */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {sceneVideos.map((sv) => {
                    // 씬별 시간 (sceneDurations 배열에서 가져오기)
                    const sceneDuration = scenario?.sceneDurations?.[sv.sceneIndex]
                    // 해당 씬의 버전 목록
                    const versions = sceneVersions[sv.sceneIndex] || []
                    const activeVersion = versions.find(v => v.is_active)
                    const hasMultipleVersions = versions.length > 1

                    return (
                      <div key={sv.sceneIndex} className="flex-shrink-0 w-40">
                        {/* 영상 플레이어 */}
                        <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black/20 group">
                          <video
                            src={sv.videoUrl}
                            className="w-full h-full object-contain"
                            controls
                            playsInline
                            preload="metadata"
                          />
                          {/* 버전 전환 중 로딩 오버레이 */}
                          {switchingVersionScene === sv.sceneIndex && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        {/* 씬 라벨 */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">씬 {sv.sceneIndex + 1}</span>
                          {sceneDuration && (
                            <span className="text-xs text-muted-foreground">{sceneDuration}초</span>
                          )}
                        </div>
                        {/* 버전 드롭다운 (여러 버전이 있을 때만 표시) */}
                        {hasMultipleVersions && (
                          <div className="mt-1.5 relative">
                            <select
                              value={activeVersion?.id || ''}
                              onChange={(e) => {
                                const selectedVersionId = e.target.value
                                if (selectedVersionId && selectedVersionId !== activeVersion?.id) {
                                  switchSceneVersion(sv.sceneIndex, selectedVersionId)
                                }
                              }}
                              disabled={switchingVersionScene === sv.sceneIndex || isLoadingVersions}
                              className="w-full text-xs px-2 py-1.5 pr-6 rounded-md border border-border bg-secondary/50 text-foreground appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {versions.map((version) => (
                                <option key={version.id} value={version.id}>
                                  v{version.version} {version.is_active ? '(활성)' : ''}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                          </div>
                        )}
                        {/* 단일 버전이지만 버전 정보가 있으면 표시 */}
                        {!hasMultipleVersions && versions.length === 1 && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <History className="w-3 h-3" />
                            <span>v{versions[0].version}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

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
          {/* 제품 정보 (DB에서 조회된 제품, JSON 형식 제품 정보, 또는 텍스트 제품 정보) */}
          {(() => {
            const product = videoAd.ad_products || parseProductInfo(videoAd.product_info)
            const hasTextProductInfo = videoAd.product_info && !parseProductInfo(videoAd.product_info)

            // 제품 정보가 전혀 없으면 표시하지 않음
            if (!product && !hasTextProductInfo) return null

            return (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {videoAdT?.product || '제품'} 정보
                </h3>
                {product ? (
                  // DB 제품 또는 JSON 형식 제품 정보
                  product.id ? (
                    <Link
                      href={`/dashboard/ad-products/${product.id}`}
                      className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      {(product.rembg_image_url || product.image_url) && (
                        <img
                          src={product.rembg_image_url || product.image_url || ''}
                          alt={product.name || '제품'}
                          className="w-12 h-12 object-contain rounded bg-secondary/30"
                        />
                      )}
                      <div>
                        <span className="text-foreground block">{product.name}</span>
                        {product.brand && (
                          <span className="text-xs text-muted-foreground">{product.brand}</span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      {(product.rembg_image_url || product.image_url) && (
                        <img
                          src={product.rembg_image_url || product.image_url || ''}
                          alt={product.name || '제품'}
                          className="w-12 h-12 object-contain rounded bg-secondary/30"
                        />
                      )}
                      <div>
                        <span className="text-foreground block">{product.name}</span>
                        {product.brand && (
                          <span className="text-xs text-muted-foreground">{product.brand}</span>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  // 텍스트 형식 제품 정보 (말로만 설명 모드)
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {videoAd.product_info}
                  </p>
                )}
              </div>
            )
          })()}

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
