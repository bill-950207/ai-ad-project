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
  Star,
} from 'lucide-react'
import { AvatarOptions } from '@/lib/avatar/prompt-builder'

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
  detailT: AvatarDetailTranslation | undefined
}

interface AvatarDetailTranslation {
  notFound?: string
  notFoundDesc?: string
  backToList?: string
  generatingTitle?: string
  uploadingTitle?: string
  pleaseWait?: string
  complete?: string
  generatingSteps?: {
    analyzingPrompt?: string
    preparingModel?: string
    generatingImage?: string
    refiningDetails?: string
  }
  failedTitle?: string
  unknownError?: string
  regenerate?: string
  downloadOriginal?: string
  imageAd?: string
  videoAd?: string
  adsWithAvatar?: string
  noAdsYet?: string
  createFirstAd?: string
  createFirst?: string
  createNewAd?: string
  waiting?: string
  generating?: string
  failed?: string
  adImage?: string
  noProduct?: string
  registerAsPreset?: string
  presetRegistered?: string
  presetRegisterFailed?: string
}

function GeneratingAnimation({ isUploading = false, avatarName, detailT }: GeneratingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const stepsT = detailT?.generatingSteps
  const steps = [
    { icon: Sparkles, text: stepsT?.analyzingPrompt || 'Analyzing prompt', color: 'text-violet-400' },
    { icon: Wand2, text: stepsT?.preparingModel || 'Preparing AI model', color: 'text-blue-400' },
    { icon: Palette, text: stepsT?.generatingImage || 'Generating image', color: 'text-cyan-400' },
    { icon: Layers, text: stepsT?.refiningDetails || 'Refining details', color: 'text-emerald-400' },
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
            {isUploading ? (detailT?.uploadingTitle || 'Saving high quality image') : (detailT?.generatingTitle || 'AI is generating your avatar')}
          </h2>
          <p className={`text-base ${steps[currentStep].color} font-medium transition-all duration-300`}>
            {isUploading ? (detailT?.pleaseWait || 'Please wait...') : steps[currentStep].text}
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
            {Math.round(progress)}% {detailT?.complete || 'complete'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 옵션 표시 컴포넌트
// ============================================================

interface AvatarTranslation {
  options?: Record<string, string>
  optionLabels?: Record<string, string>
  generationOptions?: string
  prompt?: string
  myAvatars?: string
  detail?: AvatarDetailTranslation
  [key: string]: unknown
}

function OptionTags({ options, avatarT }: { options: AvatarOptions; avatarT: AvatarTranslation | undefined }) {
  const tags: { label: string; value: string }[] = []

  const optionsT = avatarT?.options || {}
  const labelsT = avatarT?.optionLabels || {}

  if (options.gender) tags.push({ label: labelsT.gender || 'Gender', value: optionsT[options.gender] || options.gender })
  if (options.age) tags.push({ label: labelsT.age || 'Age', value: optionsT[options.age] || options.age })
  if (options.ethnicity) tags.push({ label: labelsT.ethnicity || 'Ethnicity', value: optionsT[options.ethnicity] || options.ethnicity })
  if (options.height) tags.push({ label: labelsT.height || 'Height', value: optionsT[`height${options.height.charAt(0).toUpperCase() + options.height.slice(1)}`] || options.height })
  if (options.bodyType) tags.push({ label: labelsT.bodyType || 'Body Type', value: optionsT[`body${options.bodyType.charAt(0).toUpperCase() + options.bodyType.slice(1)}`] || options.bodyType })
  if (options.hairStyle) tags.push({ label: labelsT.hairStyle || 'Hair', value: optionsT[`hair${options.hairStyle.charAt(0).toUpperCase() + options.hairStyle.slice(1)}`] || options.hairStyle })
  if (options.hairColor) {
    if (options.hairColor === 'custom' && options.customHairColor) {
      tags.push({ label: labelsT.hairColor || 'Hair Color', value: options.customHairColor })
    } else {
      tags.push({ label: labelsT.hairColor || 'Hair Color', value: optionsT[options.hairColor] || options.hairColor })
    }
  }
  if (options.outfitStyle) tags.push({ label: labelsT.outfitStyle || 'Outfit', value: optionsT[`outfit${options.outfitStyle.charAt(0).toUpperCase() + options.outfitStyle.slice(1)}`] || options.outfitStyle })
  if (options.background) tags.push({ label: labelsT.background || 'Background', value: optionsT[`bg${options.background.charAt(0).toUpperCase() + options.background.slice(1)}`] || options.background })
  if (options.pose) tags.push({ label: labelsT.pose || 'Pose', value: options.pose })

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

// Language to locale mapping
const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
}

export default function AvatarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, language } = useLanguage()
  const router = useRouter()

  const avatarT = t.avatar as AvatarTranslation | undefined
  const detailT = avatarT?.detail
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [imageAds, setImageAds] = useState<ImageAd[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRegisteringPreset, setIsRegisteringPreset] = useState(false)
  const uploadingRef = useRef(false)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const data = await res.json()
        setIsAdmin(data.user?.role === 'ADMIN')
      }
    } catch (error) {
      console.error('User fetch error:', error)
    }
  }

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
      console.error('Avatar fetch error:', error)
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
      console.error('Image ads fetch error:', error)
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
      console.error('Client upload error:', error)
    } finally {
      setIsUploading(false)
      uploadingRef.current = false
    }
  }

  useEffect(() => {
    fetchUser()
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
        console.error('Status polling error:', error)
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
      console.error('Delete error:', error)
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
      console.error('Download error:', error)
    }
  }

  const handleRegisterAsPreset = async () => {
    if (!avatar) return
    setIsRegisteringPreset(true)

    try {
      const res = await fetch('/api/admin/preset-avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: avatar.id,
        }),
      })

      if (res.ok) {
        alert(detailT?.presetRegistered || 'Avatar registered as preset successfully!')
      } else {
        const data = await res.json()
        alert(data.error || (detailT?.presetRegisterFailed || 'Failed to register as preset'))
      }
    } catch (error) {
      console.error('Register preset error:', error)
      alert(detailT?.presetRegisterFailed || 'Failed to register as preset')
    } finally {
      setIsRegisteringPreset(false)
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
          <h2 className="text-xl font-semibold text-foreground mb-2">{detailT?.notFound || 'Avatar not found'}</h2>
          <p className="text-muted-foreground mb-6">{detailT?.notFoundDesc || 'This avatar has been deleted or does not exist.'}</p>
          <Link
            href="/dashboard/avatar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {detailT?.backToList || 'Back to list'}
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
          detailT={detailT}
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
            <p className="text-destructive font-medium mb-2">{detailT?.failedTitle || 'Generation failed'}</p>
            <p className="text-sm text-muted-foreground mb-8">
              {avatar.error_message || (detailT?.unknownError || 'An unknown error occurred. Please try again.')}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard/avatar/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {detailT?.regenerate || 'Regenerate'}
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-destructive/20 hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {t.common?.delete || 'Delete'}
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
                      {detailT?.downloadOriginal || 'Download Original'}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-red-500/50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t.common?.delete || 'Delete'}
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
                {new Date(avatar.created_at).toLocaleDateString(LANGUAGE_LOCALE_MAP[language] || 'en-US', {
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
                    {avatar.options ? (avatarT?.generationOptions || 'Generation Options') : (avatarT?.prompt || 'Prompt')}
                  </h3>
                  {avatar.options ? (
                    <OptionTags options={avatar.options} avatarT={avatarT} />
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
              {detailT?.imageAd || 'Image Ad'}
            </Link>
            <Link
              href={`/video-ad-create?avatar=${avatar.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground border border-border rounded-xl font-medium hover:bg-muted transition-colors"
            >
              <Video className="w-4 h-4" />
              {detailT?.videoAd || 'Video Ad'}
            </Link>
          </div>

          {/* Admin: Register as Preset */}
          {isAdmin && (
            <button
              onClick={handleRegisterAsPreset}
              disabled={isRegisteringPreset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {isRegisteringPreset ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Star className="w-4 h-4" />
              )}
              {detailT?.registerAsPreset || 'Register as Preset Avatar'}
            </button>
          )}
        </div>
      </div>

      {/* 이 아바타로 제작된 광고 */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            {detailT?.adsWithAvatar || 'Ads created with this avatar'}
            {imageAds.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({imageAds.length})
              </span>
            )}
          </h2>
          {imageAds.length > 0 && (
            <Link
              href={`/dashboard/image-ad?avatar=${avatar.id}`}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {detailT?.createNewAd || 'Create New Ad'} →
            </Link>
          )}
        </div>

        {imageAds.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{detailT?.noAdsYet || 'No ads created yet'}</h3>
            <p className="text-muted-foreground mb-6">{detailT?.createFirstAd || 'Create your first ad with this avatar.'}</p>
            <Link
              href={`/dashboard/image-ad?avatar=${avatar.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {detailT?.createFirst || 'Create First Ad'}
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
                    alt={ad.ad_products?.name || (detailT?.adImage || 'Ad image')}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
                    {['IN_QUEUE', 'IN_PROGRESS'].includes(ad.status) ? (
                      <>
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="mt-2 text-xs text-muted-foreground">
                          {ad.status === 'IN_QUEUE' ? (detailT?.waiting || 'Waiting') : (detailT?.generating || 'Generating')}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6 text-destructive" />
                        <span className="mt-2 text-xs text-destructive">{detailT?.failed || 'Failed'}</span>
                      </>
                    )}
                  </div>
                )}

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm text-white font-medium truncate">
                      {ad.ad_products?.name || (detailT?.noProduct || 'No product')}
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
