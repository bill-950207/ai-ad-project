/**
 * 아바타 상세/생성중 페이지
 *
 * 아바타 상태에 따라 다른 UI를 표시합니다:
 * - 생성 중: AI 생성 애니메이션
 * - 완료: 아바타 상세 정보
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { uploadAvatarImage, uploadOutfitImage } from '@/lib/client/image-upload'
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
  MoreVertical,
  Shirt,
  Loader2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
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

interface Outfit {
  id: string
  avatar_id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  image_url: string | null
  created_at: string
  updated_at: string
}

/**
 * 이미지 URL에 캐시 타임스탬프 추가
 */
function getCachedImageUrl(url: string, timestamp: string): string {
  const t = new Date(timestamp).getTime()
  return `${url}?t=${t}`
}

// ============================================================
// 생성 중 애니메이션 컴포넌트
// ============================================================

interface GeneratingAnimationProps {
  isUploading?: boolean
}

function GeneratingAnimation({ isUploading = false }: GeneratingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const steps = [
    { icon: Sparkles, text: '프롬프트 분석 중...' },
    { icon: Wand2, text: 'AI 모델 준비 중...' },
    { icon: Palette, text: '이미지 생성 중...' },
    { icon: Layers, text: '디테일 다듬는 중...' },
  ]

  // 스텝 순환 (업로드 중에도 계속)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [steps.length])

  // 진행 바: 80%까지 천천히 증가, 업로드 완료되면 100%
  useEffect(() => {
    const maxProgress = isUploading ? 95 : 80
    const increment = isUploading ? 0.3 : 0.2
    const intervalMs = 100

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= maxProgress) return prev
        // 목표치에 가까워질수록 느려지는 이징 효과
        const remaining = maxProgress - prev
        const step = Math.max(increment * (remaining / maxProgress), 0.05)
        return Math.min(prev + step, maxProgress)
      })
    }, intervalMs)

    return () => clearInterval(interval)
  }, [isUploading])

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* 메인 애니메이션 영역 */}
      <div className="relative w-64 h-64 mb-8">
        {/* 외부 회전 링 */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-4 rounded-full border-4 border-transparent border-b-primary/50 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />

        {/* 중앙 아이콘 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <CurrentIcon className="w-12 h-12 text-primary transition-all duration-500" />
          </div>
        </div>

        {/* 파티클 효과 */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-ping"
              style={{
                top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* 상태 텍스트 */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          AI가 아바타를 생성하고 있어요
        </h2>
        <p className="text-muted-foreground animate-pulse">
          {isUploading ? '고품질 이미지를 저장하고 있어요...' : steps[currentStep].text}
        </p>
      </div>

      {/* 진행 바 */}
      <div className="mt-8 w-64">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 옵션 표시 컴포넌트
// ============================================================

function OptionTags({ options, t }: { options: AvatarOptions; t: ReturnType<typeof useLanguage>['t'] }) {
  const tags: { label: string; value: string }[] = []

  // 타입 안전하게 옵션 값 가져오기
  const getOptionLabel = (key: string): string => {
    const optionsMap = t.avatar.options as Record<string, string>
    return optionsMap[key] || key
  }

  if (options.gender) {
    tags.push({ label: t.avatar.gender, value: getOptionLabel(options.gender) })
  }
  if (options.age) {
    tags.push({ label: t.avatar.age, value: getOptionLabel(options.age) })
  }
  if (options.ethnicity) {
    tags.push({ label: t.avatar.ethnicity, value: getOptionLabel(options.ethnicity) })
  }
  if (options.height) {
    tags.push({ label: t.avatar.height, value: getOptionLabel(`height${options.height.charAt(0).toUpperCase() + options.height.slice(1)}`) })
  }
  if (options.bodyType) {
    tags.push({ label: t.avatar.bodyType, value: getOptionLabel(`body${options.bodyType.charAt(0).toUpperCase() + options.bodyType.slice(1)}`) })
  }
  if (options.hairStyle) {
    tags.push({ label: t.avatar.hairStyle, value: getOptionLabel(options.hairStyle) })
  }
  if (options.hairColor) {
    if (options.hairColor === 'custom' && options.customHairColor) {
      tags.push({ label: t.avatar.hairColor, value: options.customHairColor })
    } else {
      tags.push({ label: t.avatar.hairColor, value: getOptionLabel(options.hairColor) })
    }
  }
  if (options.vibe) {
    tags.push({ label: t.avatar.vibe, value: getOptionLabel(options.vibe) })
  }
  if (options.outfitStyle) {
    tags.push({ label: t.avatar.outfitStyle, value: getOptionLabel(options.outfitStyle) })
  }
  if (options.colorTone) {
    if (options.colorTone === 'brandColor' && options.brandColorHex) {
      tags.push({ label: t.avatar.colorTone, value: options.brandColorHex })
    } else {
      tags.push({ label: t.avatar.colorTone, value: getOptionLabel(options.colorTone) })
    }
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary/50 text-foreground text-sm rounded-full"
        >
          <span className="text-muted-foreground">{tag.label}:</span>
          <span className="font-medium">{tag.value}</span>
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
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)
  const uploadingRef = useRef(false)
  const outfitUploadingRef = useRef<Set<string>>(new Set())
  const menuRef = useRef<HTMLDivElement>(null)

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  /**
   * 아바타 정보 조회
   */
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

  /**
   * 의상 목록 조회
   */
  const fetchOutfits = async () => {
    try {
      const res = await fetch(`/api/avatars/${id}/outfits`)
      if (res.ok) {
        const data = await res.json()
        setOutfits(data.outfits)
      }
    } catch (error) {
      console.error('의상 목록 조회 오류:', error)
    }
  }

  /**
   * 의상 클라이언트 업로드 처리
   */
  const handleOutfitClientUpload = async (outfitId: string, tempImageUrl: string) => {
    if (outfitUploadingRef.current.has(outfitId)) return
    outfitUploadingRef.current.add(outfitId)

    try {
      const { originalUrl, compressedUrl } = await uploadOutfitImage(id, outfitId, tempImageUrl)
      const res = await fetch(`/api/avatars/${id}/outfits/${outfitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl, compressedUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        setOutfits(prev => prev.map(o => o.id === outfitId ? data.outfit : o))
      }
    } catch (error) {
      console.error('의상 업로드 오류:', error)
    } finally {
      outfitUploadingRef.current.delete(outfitId)
    }
  }

  /**
   * 클라이언트 업로드 처리
   */
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

  // 초기 로드 및 상태 폴링
  useEffect(() => {
    fetchAvatar()
    fetchOutfits()
  }, [id])

  // 아바타 상태 폴링
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

  // 의상 상태 폴링
  useEffect(() => {
    // 진행 중인 의상이 있는지 확인
    const pendingOutfits = outfits.filter(o =>
      ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(o.status)
    )

    if (pendingOutfits.length === 0) return

    const pollOutfitStatus = async () => {
      for (const outfit of pendingOutfits) {
        try {
          const res = await fetch(`/api/avatars/${id}/outfits/${outfit.id}/status`)
          if (res.ok) {
            const data = await res.json()

            // UPLOADING 상태이고 tempImageUrl이 있으면 클라이언트 업로드 시작
            if (data.outfit.status === 'UPLOADING' && data.tempImageUrl) {
              setOutfits(prev => prev.map(o => o.id === outfit.id ? data.outfit : o))
              handleOutfitClientUpload(outfit.id, data.tempImageUrl)
            } else {
              // 상태만 업데이트
              setOutfits(prev => prev.map(o => o.id === outfit.id ? data.outfit : o))
            }
          }
        } catch (error) {
          console.error('의상 상태 폴링 오류:', error)
        }
      }
    }

    const interval = setInterval(pollOutfitStatus, 1000)
    return () => clearInterval(interval)
  }, [outfits, id])

  /**
   * 삭제 핸들러
   */
  const handleDelete = async () => {
    if (!confirm(t.avatar.confirmDelete)) return
    setShowMenu(false)

    try {
      const res = await fetch(`/api/avatars/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/avatar')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    }
  }

  /**
   * 이미지 다운로드 핸들러
   */
  const handleDownload = async () => {
    if (!avatar?.image_url_original) return
    setShowMenu(false)

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
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // 아바타 없음
  if (!avatar) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">아바타를 찾을 수 없습니다.</p>
        <Link href="/dashboard/avatar" className="text-primary mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  // 생성 중
  if (['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(avatar.status)) {
    return (
      <div>
        <Link
          href="/dashboard/avatar"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.avatar.myAvatars}
        </Link>
        <GeneratingAnimation />
      </div>
    )
  }

  // 업로드 중
  if (avatar.status === 'UPLOADING' || isUploading) {
    return (
      <div>
        <Link
          href="/dashboard/avatar"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.avatar.myAvatars}
        </Link>
        <GeneratingAnimation isUploading />
      </div>
    )
  }

  // 실패
  if (avatar.status === 'FAILED') {
    return (
      <div>
        <Link
          href="/dashboard/avatar"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.avatar.myAvatars}
        </Link>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">생성 실패</h2>
          <p className="text-muted-foreground mb-4">{avatar.error_message || '알 수 없는 오류가 발생했습니다.'}</p>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            삭제하기
          </button>
        </div>
      </div>
    )
  }

  // 완료 - 상세 페이지
  return (
    <div>
      {/* 헤더 */}
      <Link
        href="/dashboard/avatar"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.avatar.myAvatars}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 이미지 영역 - 9:16 비율 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="aspect-[9/16] relative bg-secondary/30">
            {avatar.image_url && (
              <img
                src={avatar.image_url}
                alt={avatar.name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </div>
        </div>

        {/* 정보 영역 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-card border border-border rounded-xl p-6">
            {/* 제목과 미트볼 메뉴 */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">{avatar.name}</h1>

              {/* 미트볼 메뉴 */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      원본 다운로드
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">상태</span>
                <span className="text-green-500">{t.avatar.status.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">생성일</span>
                <span className="text-foreground">{new Date(avatar.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 선택한 옵션 또는 프롬프트 */}
          {avatar.options ? (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-3">선택한 옵션</h3>
              <OptionTags options={avatar.options} t={t} />
            </div>
          ) : avatar.prompt && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-3">프롬프트</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{avatar.prompt}</p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/dashboard/image-ad?avatar=${avatar.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              이미지 광고 만들기
            </Link>
            <Link
              href={`/dashboard/video-ad?avatar=${avatar.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Video className="w-4 h-4" />
              영상 광고 만들기
            </Link>
          </div>

          {/* 의상 목록 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Shirt className="w-5 h-5" />
                {t.avatar.outfits}
              </h3>
              <Link
                href={`/dashboard/avatar/${avatar.id}/outfit`}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t.avatar.changeOutfit}
              </Link>
            </div>

            {outfits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.avatar.noOutfits}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {outfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className="relative aspect-[9/16] rounded-lg overflow-hidden bg-secondary/30 border border-border cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => outfit.status === 'COMPLETED' && outfit.image_url && setSelectedOutfit(outfit)}
                  >
                    {outfit.status === 'COMPLETED' && outfit.image_url ? (
                      <img
                        src={getCachedImageUrl(outfit.image_url, outfit.updated_at)}
                        alt={outfit.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {['PENDING', 'IN_QUEUE', 'IN_PROGRESS', 'UPLOADING'].includes(outfit.status) ? (
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        ) : (
                          <Shirt className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate">{outfit.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 의상 전체보기 모달 */}
      {selectedOutfit && selectedOutfit.image_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedOutfit(null)}
        >
          <div
            className="relative w-auto max-h-[90vh] bg-card rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{selectedOutfit.name}</h3>
              <button
                onClick={() => setSelectedOutfit(null)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* 이미지 */}
            <div className="relative h-[70vh] aspect-[9/16] bg-secondary/30">
              <img
                src={getCachedImageUrl(selectedOutfit.image_url, selectedOutfit.updated_at)}
                alt={selectedOutfit.name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
 
            {/* 네비게이션 버튼 */}
            {outfits.filter(o => o.status === 'COMPLETED' && o.image_url).length > 1 && (
              <>
                <button
                  onClick={() => {
                    const completedOutfits = outfits.filter(o => o.status === 'COMPLETED' && o.image_url)
                    const currentIndex = completedOutfits.findIndex(o => o.id === selectedOutfit.id)
                    const prevIndex = (currentIndex - 1 + completedOutfits.length) % completedOutfits.length
                    setSelectedOutfit(completedOutfits[prevIndex])
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => {
                    const completedOutfits = outfits.filter(o => o.status === 'COMPLETED' && o.image_url)
                    const currentIndex = completedOutfits.findIndex(o => o.id === selectedOutfit.id)
                    const nextIndex = (currentIndex + 1) % completedOutfits.length
                    setSelectedOutfit(completedOutfits[nextIndex])
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
