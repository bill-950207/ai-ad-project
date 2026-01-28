/**
 * 아바타 상세 페이지
 *
 * 극장형 레이아웃으로 아바타 이미지를 주인공처럼 보여주고,
 * 정보와 액션을 우아하게 배치합니다.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { uploadAvatarImage } from '@/lib/client/image-upload'
import {
  ArrowLeft,
  ImageIcon,
  Video,
  Download,
  Trash2,
  Sparkles,
  Wand2,
  Palette,
  Layers,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'
import {
  genderLabels,
  ageLabels,
  ethnicityLabels,
  heightLabels,
  bodyTypeLabels,
  hairStyleLabels,
  hairColorLabels,
  outfitStyleLabels,
  backgroundLabels,
  poseLabels,
} from '@/lib/avatar/option-labels'

// ============================================================
// 타입 정의
// ============================================================

interface Avatar {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  image_url: string | null
  image_url_original: string | null
  image_width: number | null
  image_height: number | null
  prompt: string
  prompt_expanded: string | null
  options: AvatarOptions | null
  seed: number | null
  created_at: string
  completed_at: string | null
  error_message: string | null
}

interface ImageAd {
  id: string
  image_url: string | null
  image_urls: string[] | null
  ad_type: string
  status: string
  created_at: string
  ad_products: {
    id: string
    name: string
    image_url: string | null
  } | null
}

// ============================================================
// 생성 중 애니메이션 컴포넌트
// ============================================================

interface GeneratingAnimationProps {
  isUploading?: boolean
  avatarName?: string
}

function GeneratingAnimation({ isUploading = false, avatarName }: GeneratingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const steps = [
    { icon: Sparkles, text: '프롬프트 분석 중', color: 'text-violet-400' },
    { icon: Wand2, text: 'AI 모델 준비 중', color: 'text-blue-400' },
    { icon: Palette, text: '이미지 생성 중', color: 'text-cyan-400' },
    { icon: Layers, text: '디테일 다듬는 중', color: 'text-emerald-400' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [steps.length])

  useEffect(() => {
    const maxProgress = isUploading ? 95 : 80
    const increment = isUploading ? 0.3 : 0.2
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= maxProgress) return prev
        const remaining = maxProgress - prev
        const step = Math.max(increment * (remaining / maxProgress), 0.05)
        return Math.min(prev + step, maxProgress)
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isUploading])

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="relative max-w-lg mx-auto text-center">
        {/* 배경 글로우 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* 메인 애니메이션 영역 */}
        <div className="relative w-48 h-48 mx-auto mb-10">
          {/* 외부 링 - 회전 */}
          <div className="absolute inset-0">
            <svg className="w-full h-full animate-spin" style={{ animationDuration: '8s' }}>
              <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle
                cx="96"
                cy="96"
                r="92"
                fill="none"
                stroke="url(#ring-gradient)"
                strokeWidth="2"
                strokeDasharray="120 480"
              />
            </svg>
          </div>

          {/* 중간 링 - 역회전 */}
          <div className="absolute inset-4">
            <svg className="w-full h-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
              <defs>
                <linearGradient id="ring-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle
                cx="72"
                cy="72"
                r="68"
                fill="none"
                stroke="url(#ring-gradient-2)"
                strokeWidth="1.5"
                strokeDasharray="80 360"
              />
            </svg>
          </div>

          {/* 중앙 아이콘 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className={`w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all duration-500`}>
                <CurrentIcon className={`w-10 h-10 ${steps[currentStep].color} transition-all duration-500`} />
              </div>
              {/* 글로우 효과 */}
              <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl -z-10 animate-pulse" />
            </div>
          </div>

          {/* 파티클 */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-primary rounded-full"
              style={{
                top: `${50 + 42 * Math.sin((i * Math.PI * 2) / 6)}%`,
                left: `${50 + 42 * Math.cos((i * Math.PI * 2) / 6)}%`,
                animation: `pulse 2s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* 상태 텍스트 */}
        <div className="space-y-3">
          {avatarName && (
            <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
              {avatarName}
            </p>
          )}
          <h2 className="text-2xl font-bold text-foreground">
            {isUploading ? '고품질 이미지 저장 중' : 'AI가 아바타를 생성하고 있어요'}
          </h2>
          <p className={`text-base ${steps[currentStep].color} font-medium transition-all duration-300`}>
            {isUploading ? '잠시만 기다려주세요...' : steps[currentStep].text}
          </p>
        </div>

        {/* 프로그레스 바 */}
        <div className="mt-10 px-4">
          <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {Math.round(progress)}% 완료
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 옵션 표시 컴포넌트
// ============================================================

function OptionTags({ options }: { options: AvatarOptions }) {
  const tags: { label: string; value: string }[] = []

  if (options.gender) tags.push({ label: '성별', value: genderLabels[options.gender] || options.gender })
  if (options.age) tags.push({ label: '나이', value: ageLabels[options.age] || options.age })
  if (options.ethnicity) tags.push({ label: '인종', value: ethnicityLabels[options.ethnicity] || options.ethnicity })
  if (options.height) tags.push({ label: '키', value: heightLabels[options.height] || options.height })
  if (options.bodyType) tags.push({ label: '체형', value: bodyTypeLabels[options.bodyType] || options.bodyType })
  if (options.hairStyle) tags.push({ label: '헤어', value: hairStyleLabels[options.hairStyle] || options.hairStyle })
  if (options.hairColor) {
    if (options.hairColor === 'custom' && options.customHairColor) {
      tags.push({ label: '머리색', value: options.customHairColor })
    } else {
      tags.push({ label: '머리색', value: hairColorLabels[options.hairColor] || options.hairColor })
    }
  }
  if (options.outfitStyle) tags.push({ label: '의상', value: outfitStyleLabels[options.outfitStyle] || options.outfitStyle })
  if (options.background) tags.push({ label: '배경', value: backgroundLabels[options.background] || options.background })
  if (options.pose) tags.push({ label: '포즈', value: poseLabels[options.pose] || options.pose })

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/60 hover:bg-secondary text-sm rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-200 cursor-default"
        >
          <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors">{tag.label}</span>
          <span className="text-foreground font-medium">{tag.value}</span>
        </span>
      ))}
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function AvatarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLanguage()
  const router = useRouter()
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [imageAds, setImageAds] = useState<ImageAd[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const uploadingRef = useRef(false)

  const fetchAvatar = async () => {
    try {
      const res = await fetch(`/api/avatars/${id}`)
      if (res.ok) {
        const data = await res.json()
        setAvatar(data.avatar)
      } else if (res.status === 404) {
        router.push('/dashboard/avatar')
      }
    } catch (error) {
      console.error('아바타 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchImageAds = async () => {
    try {
      const res = await fetch(`/api/image-ads?avatarId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setImageAds(data.ads || [])
      }
    } catch (error) {
      console.error('이미지 광고 조회 오류:', error)
    }
  }

  const handleClientUpload = async (avatarId: string, tempImageUrl: string) => {
    if (uploadingRef.current) return
    uploadingRef.current = true
    setIsUploading(true)

    try {
      const { originalUrl, compressedUrl } = await uploadAvatarImage(avatarId, tempImageUrl)
      const res = await fetch(`/api/avatars/${avatarId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl, compressedUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        setAvatar(data.avatar)
      }
    } catch (error) {
      console.error('클라이언트 업로드 오류:', error)
    } finally {
      setIsUploading(false)
      uploadingRef.current = false
    }
  }

  useEffect(() => {
    fetchAvatar()
    fetchImageAds()
  }, [id])

  useEffect(() => {
    if (!avatar) return
    if (!['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(avatar.status)) return

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/avatars/${id}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.avatar.status === 'UPLOADING' && data.tempImageUrl) {
            setAvatar(data.avatar)
            handleClientUpload(id, data.tempImageUrl)
            return
          }
          setAvatar(data.avatar)
        }
      } catch (error) {
        console.error('상태 폴링 오류:', error)
      }
    }

    const interval = setInterval(pollStatus, 1000)
    return () => clearInterval(interval)
  }, [avatar?.status, id])

  const handleDelete = async () => {
    if (!confirm(t.avatar.confirmDelete)) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/avatars/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/avatar')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async () => {
    if (!avatar?.image_url_original) return

    try {
      const response = await fetch(avatar.image_url_original)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${avatar.name}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('다운로드 오류:', error)
    }
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-accent/20 border-b-accent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    )
  }

  // 아바타 없음
  if (!avatar) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary/50 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">아바타를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-6">삭제되었거나 존재하지 않는 아바타입니다.</p>
          <Link
            href="/dashboard/avatar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 생성 중 / 업로드 중
  if (['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(avatar.status) || avatar.status === 'UPLOADING' || isUploading) {
    return (
      <div>
        <Link
          href="/dashboard/avatar"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t.avatar.myAvatars}</span>
        </Link>
        <GeneratingAnimation
          isUploading={avatar.status === 'UPLOADING' || isUploading}
          avatarName={avatar.name}
        />
      </div>
    )
  }

  // 실패
  if (avatar.status === 'FAILED') {
    return (
      <div>
        <Link
          href="/dashboard/avatar"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t.avatar.myAvatars}</span>
        </Link>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{avatar.name}</h2>
            <p className="text-destructive font-medium mb-2">생성에 실패했습니다</p>
            <p className="text-sm text-muted-foreground mb-8">
              {avatar.error_message || '알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard/avatar/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                다시 생성하기
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-destructive/20 hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 완료 - 상세 페이지
  return (
    <div className="max-w-6xl mx-auto">
      {/* 뒤로가기 */}
      <Link
        href="/dashboard/avatar"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>{t.avatar.myAvatars}</span>
      </Link>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 이미지 영역 - 3/5 */}
        <div className="lg:col-span-3">
          <div className="relative group">
            {/* 이미지 컨테이너 */}
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors">
              {/* 이미지 로딩 스켈레톤 */}
              {!imageLoaded && avatar.image_url && (
                <div className="absolute inset-0 bg-secondary animate-pulse" />
              )}

              {avatar.image_url && (
                <img
                  src={avatar.image_url}
                  alt={avatar.name}
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full max-h-[600px] object-contain transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              )}

              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      원본 다운로드
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-red-500/50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 정보 영역 - 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 카드 */}
          <div className="bg-card border border-border rounded-2xl p-6">
            {/* 이름 */}
            <h1 className="text-2xl font-bold text-foreground mb-4">{avatar.name}</h1>

            {/* 생성일 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(avatar.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {/* 옵션 / 프롬프트 */}
            {(avatar.options || avatar.prompt) && (
              <>
                <div className="border-t border-border pt-5">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {avatar.options ? '생성 옵션' : '프롬프트'}
                  </h3>
                  {avatar.options ? (
                    <OptionTags options={avatar.options} />
                  ) : (
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {avatar.prompt}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-3">
            <Link
              href={`/image-ad-create?avatar=${avatar.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground border border-border rounded-xl font-medium hover:bg-muted transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              이미지 광고
            </Link>
            <Link
              href={`/video-ad-create?avatar=${avatar.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground border border-border rounded-xl font-medium hover:bg-muted transition-colors"
            >
              <Video className="w-4 h-4" />
              영상 광고
            </Link>
          </div>
        </div>
      </div>

      {/* 이 아바타로 제작된 광고 */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            이 아바타로 제작된 광고
            {imageAds.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({imageAds.length}개)
              </span>
            )}
          </h2>
          {imageAds.length > 0 && (
            <Link
              href={`/dashboard/image-ad?avatar=${avatar.id}`}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              새 광고 만들기 →
            </Link>
          )}
        </div>

        {imageAds.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">아직 제작된 광고가 없어요</h3>
            <p className="text-muted-foreground mb-6">이 아바타로 첫 번째 광고를 만들어 보세요.</p>
            <Link
              href={`/dashboard/image-ad?avatar=${avatar.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              첫 광고 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {imageAds.map((ad, index) => (
              <Link
                key={ad.id}
                href={`/dashboard/image-ad/${ad.id}`}
                className="group relative aspect-square rounded-xl overflow-hidden bg-secondary/30 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-sm"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {ad.status === 'COMPLETED' && (ad.image_urls?.[0] || ad.image_url) ? (
                  <img
                    src={ad.image_urls?.[0] || ad.image_url || ''}
                    alt={ad.ad_products?.name || '광고 이미지'}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
                    {['IN_QUEUE', 'IN_PROGRESS'].includes(ad.status) ? (
                      <>
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="mt-2 text-xs text-muted-foreground">
                          {ad.status === 'IN_QUEUE' ? '대기 중' : '생성 중'}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6 text-destructive" />
                        <span className="mt-2 text-xs text-destructive">실패</span>
                      </>
                    )}
                  </div>
                )}

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm text-white font-medium truncate">
                      {ad.ad_products?.name || '제품 없음'}
                    </p>
                    <p className="text-xs text-white/60">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
