/**
 * 영상 광고 페이지 콘텐츠 컴포넌트
 *
 * 영상 광고 목록을 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Plus, Video, Play, Loader2, Edit3, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { VideoAdTypeModal, VideoAdCategory } from './video-ad-type-modal'

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

  const fetchVideoAds = useCallback(async (page: number = 1, isPolling: boolean = false) => {
    // 폴링이 아닌 경우에만 로딩 상태 표시
    if (!isPolling) {
      setIsAdsLoading(true)
    }
    try {
      const res = await fetch(`/api/video-ads?page=${page}&pageSize=${PAGE_SIZE}`)
      if (res.ok) {
        const data = await res.json()
        setVideoAds(data.videos || [])
        setPagination(data.pagination || null)
      }
    } catch (error) {
      console.error('영상 광고 목록 조회 오류:', error)
    } finally {
      if (!isPolling) {
        setIsAdsLoading(false)
      }
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

  // 진행 중인 상태의 영상들을 폴링
  useEffect(() => {
    // 진행 중인 상태인 영상들 필터링 (avatar motion 상태 포함)
    const inProgressStatuses = [
      'GENERATING_SCRIPTS', 'GENERATING_AUDIO', 'IN_QUEUE', 'IN_PROGRESS',
      // Avatar Motion 상태
      'GENERATING_STORY', 'GENERATING_FRAMES', 'GENERATING_AVATAR', 'FRAMES_COMPLETED'
    ]
    const inProgressVideos = videoAds.filter(v => inProgressStatuses.includes(v.status))

    if (inProgressVideos.length === 0) return

    // 5초마다 목록 새로고침 (폴링 모드로)
    const intervalId = setInterval(() => {
      fetchVideoAds(currentPage, true)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [videoAds, fetchVideoAds, currentPage])

  const handleCreateVideoAd = () => {
    setShowTypeModal(true)
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

    // DRAFT 또는 생성 중 상태면 마법사로 이동하여 이어서 진행
    const draftStatuses = ['DRAFT', 'GENERATING_SCRIPTS', 'GENERATING_AUDIO']
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

  const getStatusBadge = (status: string, wizardStep?: number | null) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'DRAFT': { label: `임시저장 (${wizardStep || 1}단계)`, className: 'bg-orange-500/20 text-orange-500' },
      'GENERATING_SCRIPTS': { label: '대본 생성 중', className: 'bg-indigo-500/20 text-indigo-500' },
      'GENERATING_AUDIO': { label: '음성 생성 중', className: 'bg-pink-500/20 text-pink-500' },
      'PENDING': { label: t.videoAd?.status?.pending || '대기 중', className: 'bg-yellow-500/20 text-yellow-500' },
      'IN_QUEUE': { label: t.videoAd?.status?.inQueue || '큐 대기', className: 'bg-blue-500/20 text-blue-500' },
      'IN_PROGRESS': { label: t.videoAd?.status?.inProgress || '생성 중', className: 'bg-purple-500/20 text-purple-500' },
      'COMPLETED': { label: t.videoAd?.status?.completed || '완료', className: 'bg-green-500/20 text-green-500' },
      'FAILED': { label: t.videoAd?.status?.failed || '실패', className: 'bg-red-500/20 text-red-500' },
      // Avatar Motion 상태
      'GENERATING_STORY': { label: '스토리 생성 중', className: 'bg-cyan-500/20 text-cyan-500' },
      'GENERATING_FRAMES': { label: '프레임 생성 중', className: 'bg-teal-500/20 text-teal-500' },
      'GENERATING_AVATAR': { label: '아바타 생성 중', className: 'bg-violet-500/20 text-violet-500' },
      'FRAMES_COMPLETED': { label: '프레임 완료', className: 'bg-emerald-500/20 text-emerald-500' },
    }
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500/20 text-gray-500' }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getCategoryLabel = (category: string | null) => {
    const categoryLabels: Record<string, string> = {
      'productDescription': '제품 설명',
      'avatarMotion': '아바타 모션',
      'productShowcase': '제품 쇼케이스',
      'lifestyle': '라이프스타일',
      'testimonial': '후기/추천',
    }
    return categoryLabels[category || ''] || '영상 광고'
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.videoAd?.title || '영상 광고'}</h1>
          <p className="text-muted-foreground">{t.videoAd?.subtitle || 'AI로 영상 광고를 제작하세요'}</p>
        </div>
        <button
          onClick={handleCreateVideoAd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.videoAd?.createAd || '영상 광고 생성'}
        </button>
      </div>

      {/* 영상 광고 섹션 */}
      <section>
        {isAdsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-video bg-secondary/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : videoAds.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{t.videoAd?.emptyAds || '생성된 영상 광고가 없습니다'}</h3>
            <p className="text-muted-foreground mb-4">영상 광고를 생성해보세요</p>
            <button
              onClick={handleCreateVideoAd}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.videoAd?.createAd || '영상 광고 생성'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoAds.map(video => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video)}
                className={`relative group bg-card border rounded-xl overflow-hidden cursor-pointer transition-colors ${
                  video.status === 'DRAFT'
                    ? 'border-orange-500/50 hover:border-orange-500'
                    : video.status === 'GENERATING_SCRIPTS'
                    ? 'border-indigo-500/50 hover:border-indigo-500'
                    : video.status === 'GENERATING_AUDIO'
                    ? 'border-pink-500/50 hover:border-pink-500'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {/* 비디오 썸네일 또는 플레이스홀더 */}
                <div className="aspect-video relative bg-[#1a1a2e]">
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
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-6 h-6 text-black ml-1" />
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
                            alt="첫 프레임"
                            className="w-full h-full object-contain opacity-70"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium">
                              <Edit3 className="w-4 h-4" />
                              이어서 작성
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <Edit3 className="w-8 h-8 text-orange-500 mb-2" />
                          <span className="text-sm text-orange-500 font-medium">작성 중</span>
                        </div>
                      )}
                    </div>
                  ) : video.status === 'GENERATING_SCRIPTS' ? (
                    // 대본 생성 중 상태
                    <div className="w-full h-full relative flex items-center justify-center bg-indigo-500/10">
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                        <span className="text-sm text-indigo-500 font-medium">대본 생성 중...</span>
                      </div>
                    </div>
                  ) : video.status === 'GENERATING_AUDIO' ? (
                    // 음성 생성 중 상태
                    <div className="w-full h-full relative">
                      {video.first_scene_image_url ? (
                        <>
                          <img
                            src={video.first_scene_image_url}
                            alt="첫 프레임"
                            className="w-full h-full object-contain opacity-50"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                            <span className="text-sm text-pink-500 font-medium">음성 생성 중...</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-pink-500/10">
                          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                          <span className="text-sm text-pink-500 font-medium">음성 생성 중...</span>
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
                                alt="첫 프레임"
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

                {/* 정보 */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {getCategoryLabel(video.category)}
                    </span>
                    {getStatusBadge(video.status, video.wizard_step)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {(video.video_duration || video.duration) && (
                        <span>
                          {video.video_duration
                            ? `${Math.round(video.video_duration)}초`
                            : `${video.duration}초`}
                        </span>
                      )}
                      {video.resolution && <span>{video.resolution}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
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
                        className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary text-foreground'
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
              className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* 총 개수 표시 */}
            <span className="ml-4 text-sm text-muted-foreground">
              총 {pagination.totalCount}개
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
    </div>
  )
}
