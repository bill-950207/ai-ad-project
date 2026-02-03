/**
 * 영상 광고 페이지 콘텐츠 컴포넌트
 *
 * 영상 광고 목록을 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Video, Play, Loader2, Edit3, ChevronLeft, ChevronRight, Music, Trash2, X } from 'lucide-react'
import { VideoAdTypeModal, VideoAdCategory } from './video-ad-type-modal'
import { GridSkeleton } from '@/components/ui/grid-skeleton'

interface AdProduct {
  id: string
  name: string
  image_url: string | null
  rembg_image_url: string | null
}

interface Avatar {
  id: string
  name: string
  image_url: string | null
}

interface VideoAd {
  id: string
  video_url: string | null
  thumbnail_url: string | null
  first_scene_image_url: string | null
  product_id: string | null
  avatar_id: string | null
  duration: number | null
  video_duration: number | null  // 실제 영상 길이 (초)
  resolution: string | null
  status: string
  category: string | null
  wizard_step: number | null
  created_at: string
  bgm_info?: {
    music_name: string
  } | null
  ad_products: AdProduct | null
  avatars: Avatar | null
}

interface PaginationInfo {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

const PAGE_SIZE = 12

export function VideoAdPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const [videoAds, setVideoAds] = useState<VideoAd[]>([])
  const [isAdsLoading, setIsAdsLoading] = useState(true)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<VideoAd | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchVideoAds = useCallback(async (page: number = 1, isPolling: boolean = false) => {
    // 폴링이 아닌 경우에만 로딩 상태 표시
    if (!isPolling) {
      setIsAdsLoading(true)
    }
    try {
      // cache: 'no-store'로 항상 최신 데이터 조회 (임시저장 후 목록 갱신 필요)
      const res = await fetch(`/api/video-ads?page=${page}&pageSize=${PAGE_SIZE}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setVideoAds(data.videos || [])
        setPagination(data.pagination || null)
      }
    } catch (error) {
      console.error('Failed to fetch video ads:', error)
    } finally {
      if (!isPolling) {
        setIsAdsLoading(false)
      }
    }
  }, [])

  // 개별 영상 상태 확인 (외부 서비스 폴링 및 DB 업데이트)
  const checkVideoStatus = useCallback(async (videoId: string) => {
    try {
      await fetch(`/api/video-ads/status/${videoId}`)
      // 응답 무시 - 상태 API가 DB를 업데이트함
    } catch (error) {
      console.error('Failed to check video status:', error)
    }
  }, [])

  useEffect(() => {
    fetchVideoAds(currentPage)
  }, [fetchVideoAds, currentPage])

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 진행 중인 상태의 영상들을 폴링 (외부 서비스 상태 확인 + DB 업데이트)
  useEffect(() => {
    // 진행 중인 상태인 영상들 필터링 (avatar motion, product ad 상태 포함)
    const inProgressStatuses = [
      // Product Description 상태
      'GENERATING_SCRIPTS', 'GENERATING_IMAGES', 'GENERATING_AUDIO', 'IN_QUEUE', 'IN_PROGRESS',
      // Avatar Motion 상태
      'GENERATING_STORY', 'GENERATING_FRAMES', 'GENERATING_AVATAR', 'FRAMES_COMPLETED',
      // Product Ad 상태
      'GENERATING_SCENARIO', 'GENERATING_SCENES', 'SCENES_COMPLETED', 'GENERATING_VIDEO', 'GENERATING_SCENE_VIDEOS'
    ]
    const inProgressVideos = videoAds.filter(v => inProgressStatuses.includes(v.status))

    if (inProgressVideos.length === 0) return

    // 5초마다 진행 중인 영상들의 상태 확인 후 목록 새로고침
    const intervalId = setInterval(async () => {
      // 각 진행 중인 영상에 대해 상태 API 호출 (병렬 처리)
      // 상태 API가 외부 서비스를 확인하고 DB를 업데이트함
      await Promise.all(
        inProgressVideos.map(video => checkVideoStatus(video.id))
      )
      // 상태 업데이트 후 목록 새로고침
      fetchVideoAds(currentPage, true)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [videoAds, fetchVideoAds, checkVideoStatus, currentPage])

  const handleCreateVideoAd = () => {
    setShowTypeModal(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, video: VideoAd) => {
    e.stopPropagation()
    setVideoToDelete(video)
    setDeleteModalOpen(true)
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setVideoToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/video-ads/${videoToDelete.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        // 현재 페이지 새로고침
        await fetchVideoAds(currentPage)
      } else {
        console.error('Failed to delete video')
      }
    } catch (error) {
      console.error('Video deletion error:', error)
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(false)
      setVideoToDelete(null)
    }
  }

  const handleContinueEdit = (e: React.MouseEvent, video: VideoAd) => {
    e.stopPropagation()
    handleVideoClick(video)
  }

  const handleSelectCategory = (category: VideoAdCategory) => {
    setShowTypeModal(false)
    router.push(`/video-ad-create?category=${category}`)
  }

  const handleVideoClick = (video: VideoAd) => {
    // avatarMotion 카테고리는 별도 라우트로 이동
    if (video.category === 'avatarMotion') {
      const avatarMotionDraftStatuses = [
        'DRAFT', 'GENERATING_STORY', 'GENERATING_FRAMES', 'GENERATING_AVATAR', 'FRAMES_COMPLETED',
        'IN_QUEUE', 'IN_PROGRESS'
      ]
      if (avatarMotionDraftStatuses.includes(video.status)) {
        router.push(`/video-ad-create?category=avatarMotion&videoAdId=${video.id}`)
        return
      }
      // 완료된 영상이면 상세 페이지로
      router.push(`/dashboard/video-ad/${video.id}`)
      return
    }

    // productAd 카테고리 처리
    if (video.category === 'productAd') {
      const productAdDraftStatuses = [
        'DRAFT', 'GENERATING_SCENARIO', 'GENERATING_SCENES', 'SCENES_COMPLETED',
        'GENERATING_VIDEO', 'IN_QUEUE', 'IN_PROGRESS'
      ]
      if (productAdDraftStatuses.includes(video.status)) {
        router.push(`/video-ad-create?category=productAd&videoAdId=${video.id}`)
        return
      }
      // 완료된 영상이면 상세 페이지로
      router.push(`/dashboard/video-ad/${video.id}`)
      return
    }

    // DRAFT 또는 생성 중 상태면 마법사로 이동하여 이어서 진행
    const draftStatuses = ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_IMAGES', 'GENERATING_AUDIO']
    if (draftStatuses.includes(video.status) && video.category) {
      router.push(`/video-ad-create?category=${video.category}&videoAdId=${video.id}`)
      return
    }

    // 영상 생성 중인 상태면 마법사의 생성 단계로 이동
    if ((video.status === 'IN_QUEUE' || video.status === 'IN_PROGRESS') && video.category) {
      router.push(`/video-ad-create?category=${video.category}&videoAdId=${video.id}`)
      return
    }

    // 완료된 영상이면 상세 페이지로 이동
    router.push(`/dashboard/video-ad/${video.id}`)
  }

  const getStatusBadge = (status: string, wizardStep?: number | null, category?: string | null) => {
    const stepName = getStepName(category, wizardStep)
    const statusConfig: Record<string, { label: string; className: string }> = {
      'DRAFT': { label: `${t.videoAd?.status?.draft || 'Draft'} (${stepName})`, className: 'bg-orange-500/80 text-white' },
      'GENERATING_SCRIPTS': { label: t.videoAd?.status?.generatingScripts || 'Generating Scripts', className: 'bg-indigo-500/80 text-white animate-pulse' },
      'GENERATING_IMAGES': { label: t.videoAd?.status?.generatingImages || 'Generating Images', className: 'bg-cyan-500/80 text-white animate-pulse' },
      'GENERATING_AUDIO': { label: t.videoAd?.status?.generatingAudio || 'Generating Audio', className: 'bg-pink-500/80 text-white animate-pulse' },
      'PENDING': { label: t.videoAd?.status?.pending || 'Pending', className: 'bg-yellow-500/80 text-white' },
      'IN_QUEUE': { label: t.videoAd?.status?.inQueue || 'In Queue', className: 'bg-blue-500/80 text-white animate-pulse' },
      'IN_PROGRESS': { label: t.videoAd?.status?.inProgress || 'In Progress', className: 'bg-purple-500/80 text-white animate-pulse' },
      'COMPLETED': { label: t.videoAd?.status?.completed || 'Completed', className: 'bg-green-500/80 text-white' },
      'FAILED': { label: t.videoAd?.status?.failed || 'Failed', className: 'bg-red-500/80 text-white' },
      // Avatar Motion statuses
      'GENERATING_STORY': { label: t.videoAd?.status?.generatingStory || 'Generating Story', className: 'bg-cyan-500/80 text-white animate-pulse' },
      'GENERATING_FRAMES': { label: t.videoAd?.status?.generatingFrames || 'Generating Frames', className: 'bg-teal-500/80 text-white animate-pulse' },
      'GENERATING_AVATAR': { label: t.videoAd?.status?.generatingAvatar || 'Generating Avatar', className: 'bg-violet-500/80 text-white animate-pulse' },
      'FRAMES_COMPLETED': { label: t.videoAd?.status?.framesCompleted || 'Frames Completed', className: 'bg-emerald-500/80 text-white' },
      // Product Ad statuses
      'GENERATING_SCENARIO': { label: t.videoAd?.status?.generatingScenario || 'Generating Scenario', className: 'bg-cyan-500/80 text-white animate-pulse' },
      'GENERATING_SCENES': { label: t.videoAd?.status?.generatingScenes || 'Generating First Scene', className: 'bg-teal-500/80 text-white animate-pulse' },
      'SCENES_COMPLETED': { label: t.videoAd?.status?.scenesCompleted || 'First Scene Completed', className: 'bg-emerald-500/80 text-white' },
      'GENERATING_VIDEO': { label: t.videoAd?.status?.generatingVideo || 'Generating Video', className: 'bg-violet-500/80 text-white animate-pulse' },
    }
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500/80 text-white' }
    return (
      <span className={`px-3 py-1.5 text-xs font-medium rounded-lg backdrop-blur-sm ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getCategoryLabel = (category: string | null) => {
    const categoryLabels: Record<string, string> = {
      'productDescription': t.videoAd?.categories?.productDescription || 'Product Description',
      'avatarMotion': t.videoAd?.categories?.avatarMotion || 'Avatar Motion',
      'productAd': t.videoAd?.categories?.productAd || 'Product Ad',
      'productShowcase': t.videoAd?.categories?.productShowcase || 'Product Showcase',
      'lifestyle': t.videoAd?.categories?.lifestyle || 'Lifestyle',
      'testimonial': t.videoAd?.categories?.testimonial || 'Testimonial',
    }
    return categoryLabels[category || ''] || (t.videoAd?.title || 'Video Ad')
  }

  // 카테고리와 단계 번호에 따른 단계 이름 반환
  const getStepName = (category: string | null | undefined, step: number | null | undefined): string => {
    const stepNumber = step || 1

    const stepNames: Record<string, string[]> = {
      // productDescription: 4 steps
      'productDescription': ['Product/Avatar', 'Video Info', 'Script/Voice', 'Generate'],
      // avatarMotion: 6 steps
      'avatarMotion': ['Avatar/Product', 'Story Mode', 'Scenario', 'Settings', 'Frame Gen', 'Video Gen'],
      // productAd: 6 steps
      'productAd': ['Product', 'Mode', 'Scenario', 'Settings', 'First Scene', 'Video Gen'],
    }

    const steps = stepNames[category || '']
    if (steps && stepNumber >= 1 && stepNumber <= steps.length) {
      return steps[stepNumber - 1]
    }

    return `Step ${stepNumber}`
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.videoAd?.title || 'Video Ad'}</h1>
          <p className="text-muted-foreground">{t.videoAd?.subtitle || 'Create video ads with AI'}</p>
        </div>
        <button
          onClick={handleCreateVideoAd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.videoAd?.createAd || 'Create Video Ad'}
        </button>
      </div>

      {/* 영상 광고 섹션 */}
      <section>
        {isAdsLoading ? (
          <GridSkeleton count={8} columns={{ default: 1, sm: 2, md: 3, lg: 4 }} />
        ) : videoAds.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">{t.videoAd?.emptyAds || 'No video ads yet'}</h3>
            <p className="text-muted-foreground mb-6">{t.videoAd?.emptyAdsDescription || 'Create your first video ad'}</p>
            <button
              onClick={handleCreateVideoAd}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              {t.videoAd?.createAd || 'Create Video Ad'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {videoAds.map(video => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video)}
                className={`relative group bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 ${
                  video.status === 'COMPLETED'
                    ? 'cursor-pointer hover:border-primary/40 hover:shadow-glow-sm'
                    : 'cursor-pointer hover:border-border/80'
                }`}
              >
                {/* 비디오 썸네일 또는 플레이스홀더 */}
                <div className="p-1">
                  <div className="aspect-square relative bg-[#1a1a2e] rounded-xl overflow-hidden">
                  {video.video_url && video.status === 'COMPLETED' ? (
                    <>
                      <video
                        src={video.video_url}
                        className="w-full h-full object-contain"
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause()
                          e.currentTarget.currentTime = 0
                        }}
                      />
                      {/* 재생 아이콘 오버레이 */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>
                    </>
                  ) : video.status === 'DRAFT' ? (
                    // 초안 상태: 첫 프레임 이미지가 있으면 표시, 없으면 편집 아이콘
                    <div className="w-full h-full relative">
                      {video.first_scene_image_url ? (
                        <>
                          <img
                            src={video.first_scene_image_url}
                            alt={t.videoAd?.firstFrame || 'First frame'}
                            className="w-full h-full object-contain"
                          />
                          {/* 호버 시 액션 버튼 표시 */}
                          <div className="absolute inset-0 flex items-center justify-center gap-2 sm:gap-3 bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleContinueEdit(e, video)}
                              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span className="hidden sm:inline">{t.videoAd?.continueEdit || 'Continue'}</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, video)}
                              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">{t.videoAd?.delete || 'Delete'}</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                          <Edit3 className="w-8 h-8 text-orange-500 mb-2" />
                          <span className="text-sm text-orange-500 font-medium">{t.videoAd?.inProgress || 'In Progress'}</span>
                          {/* 호버 시 액션 버튼 표시 */}
                          <div className="absolute inset-0 flex items-center justify-center gap-2 sm:gap-3 bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleContinueEdit(e, video)}
                              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span className="hidden sm:inline">{t.videoAd?.continueEdit || 'Continue'}</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, video)}
                              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">{t.videoAd?.delete || 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : video.status === 'GENERATING_SCRIPTS' ? (
                    // 대본 생성 중 상태
                    <div className="w-full h-full relative flex items-center justify-center bg-indigo-500/10">
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                        <span className="text-sm text-indigo-500 font-medium">{t.videoAd?.generatingScripts || 'Generating scripts...'}</span>
                      </div>
                    </div>
                  ) : video.status === 'GENERATING_AUDIO' ? (
                    // 음성 생성 중 상태
                    <div className="w-full h-full relative">
                      {video.first_scene_image_url ? (
                        <>
                          <img
                            src={video.first_scene_image_url}
                            alt={t.videoAd?.firstFrame || 'First frame'}
                            className="w-full h-full object-contain opacity-50"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                            <span className="text-sm text-pink-500 font-medium">{t.videoAd?.generatingAudio || 'Generating audio...'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-pink-500/10">
                          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                          <span className="text-sm text-pink-500 font-medium">{t.videoAd?.generatingAudio || 'Generating audio...'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {video.status === 'IN_PROGRESS' || video.status === 'IN_QUEUE' ? (
                        <>
                          {video.first_scene_image_url ? (
                            <>
                              <img
                                src={video.first_scene_image_url}
                                alt={t.videoAd?.firstFrame || 'First frame'}
                                className="w-full h-full object-contain opacity-50"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                              </div>
                            </>
                          ) : (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          )}
                        </>
                      ) : (
                        <Video className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  </div>
                </div>

                {/* 카테고리 뱃지 - 좌측 상단 */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-3 py-1.5 text-xs font-medium bg-card/80 text-foreground rounded-lg backdrop-blur-md border border-border/50">
                    {getCategoryLabel(video.category)}
                  </span>
                </div>

                {/* 상태 뱃지 - 우측 상단 */}
                {video.status !== 'COMPLETED' && (
                  <div className="absolute top-3 right-3 z-10">
                    {getStatusBadge(video.status, video.wizard_step, video.category)}
                  </div>
                )}

                {/* 제품/아바타 이미지 - 좌측 하단 (임시저장/완료 모두 표시) */}
                {(video.ad_products || video.avatars) && (
                  <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
                    {video.ad_products && (video.ad_products.rembg_image_url || video.ad_products.image_url) && (
                      <div className="w-10 h-10 rounded-lg bg-white/90 backdrop-blur-sm border border-white/50 shadow-md overflow-hidden flex items-center justify-center">
                        <img
                          src={video.ad_products.rembg_image_url || video.ad_products.image_url || ''}
                          alt={video.ad_products.name}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    )}
                    {video.avatars && video.avatars.image_url && (
                      <div className="w-10 h-10 rounded-lg bg-white/90 backdrop-blur-sm border border-white/50 shadow-md overflow-hidden flex items-center justify-center">
                        <img
                          src={video.avatars.image_url}
                          alt={video.avatars.name}
                          className="w-10 h-10 object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 시간/음악 - 우측 하단 (세로 정렬) */}
                {video.status === 'COMPLETED' && ((video.video_duration || video.duration) || video.bgm_info) && (
                  <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5">
                    {(video.video_duration || video.duration) && (
                      <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-lg backdrop-blur-sm">
                        {video.video_duration
                          ? `${Math.round(video.video_duration)}${t.videoAd?.seconds || 's'}`
                          : `${video.duration}${t.videoAd?.seconds || 's'}`}
                      </span>
                    )}
                    {video.bgm_info && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/70 rounded-lg text-white text-xs backdrop-blur-sm">
                        <Music className="w-3 h-3" />
                        <span className="max-w-[60px] truncate">{video.bgm_info.music_name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* 페이지 버튼들 */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // 첫 페이지, 마지막 페이지, 현재 페이지 주변 2페이지만 표시
                  if (page === 1 || page === pagination.totalPages) return true
                  if (Math.abs(page - currentPage) <= 1) return true
                  return false
                })
                .map((page, index, arr) => {
                  // 생략 부호(...) 표시
                  const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsisBefore && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[42px] h-10 px-3 rounded-xl font-medium transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-primary to-accent text-white shadow-glow-sm'
                            : 'bg-card border border-border hover:border-primary/30 hover:bg-muted text-foreground'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  )
                })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* 총 개수 표시 */}
            <span className="ml-4 text-sm text-muted-foreground font-medium">
              {(t.videoAd?.totalCount || 'Total {{count}}').replace('{{count}}', String(pagination.totalCount))}
            </span>
          </div>
        )}
      </section>

      {/* 영상 광고 유형 선택 모달 */}
      <VideoAdTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelect={handleSelectCategory}
      />

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleCancelDelete}
          />
          {/* 모달 콘텐츠 */}
          <div className="relative bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={handleCancelDelete}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="text-center">
              <div className="w-18 h-18 mx-auto mb-5 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <Trash2 className="w-9 h-9 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{t.videoAd?.deleteModal?.title || 'Delete Video'}</h3>
              <p className="text-muted-foreground mb-6">
                {videoToDelete?.ad_products?.name || videoToDelete?.avatars?.name
                  ? (t.videoAd?.deleteModal?.confirmWithName || 'Delete "{{name}}"?').replace('{{name}}', videoToDelete?.ad_products?.name || videoToDelete?.avatars?.name || '')
                  : (t.videoAd?.deleteModal?.confirm || 'Delete this video?')}
                <br />
                <span className="text-sm text-destructive font-medium">{t.videoAd?.deleteModal?.warning || 'Deleted videos cannot be recovered.'}</span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all duration-200 font-medium border border-border"
                >
                  {t.videoAd?.deleteModal?.cancel || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-destructive text-white rounded-xl hover:bg-destructive/90 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.videoAd?.deleteModal?.deleting || 'Deleting...'}
                    </>
                  ) : (
                    t.videoAd?.delete || 'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
