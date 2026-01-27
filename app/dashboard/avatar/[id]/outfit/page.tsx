/**
 * 의상 교체 페이지
 *
 * 아바타의 의상을 AI로 교체합니다.
 * 전체 의상 또는 개별 아이템(상의, 하의, 신발)을 업로드할 수 있습니다.
 */

'use client'

import { useLanguage } from '@/contexts/language-context'
import {
  ArrowLeft,
  Loader2,
  Shirt,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// ============================================================
// 타입 정의
// ============================================================

interface Avatar {
  id: string
  name: string
  status: string
  image_url: string | null
  image_url_original: string | null
}

type InputType = 'combined' | 'separate'

interface ImageUploadState {
  file: File | null
  preview: string | null
  uploading: boolean
}

// ============================================================
// 이미지 업로드 컴포넌트
// ============================================================

interface ImageUploadProps {
  label: string
  state: ImageUploadState
  onUpload: (file: File) => void
  onRemove: () => void
  disabled?: boolean
}

function ImageUploadBox({ label, state, onUpload, onRemove, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove()
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div
        onClick={handleClick}
        className={`
          relative aspect-square border-2 border-dashed rounded-xl overflow-hidden
          transition-colors cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
          ${state.preview ? 'border-primary' : 'border-border'}
        `}
      >
        {state.preview ? (
          <>
            <img
              src={state.preview}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {!disabled && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-sm">{t.outfit.uploadImage}</span>
          </div>
        )}
        {state.uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function OutfitChangePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useLanguage()

  // 상태
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [inputType, setInputType] = useState<InputType>('combined')

  // 이미지 업로드 상태
  const [outfitImage, setOutfitImage] = useState<ImageUploadState>({
    file: null,
    preview: null,
    uploading: false,
  })
  const [topImage, setTopImage] = useState<ImageUploadState>({
    file: null,
    preview: null,
    uploading: false,
  })
  const [bottomImage, setBottomImage] = useState<ImageUploadState>({
    file: null,
    preview: null,
    uploading: false,
  })
  const [shoesImage, setShoesImage] = useState<ImageUploadState>({
    file: null,
    preview: null,
    uploading: false,
  })

  // 아바타 정보 조회
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await fetch(`/api/avatars/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.avatar.status !== 'COMPLETED') {
            router.push(`/dashboard/avatar/${id}`)
            return
          }
          setAvatar(data.avatar)
        } else {
          router.push('/dashboard/avatar')
        }
      } catch (error) {
        console.error('아바타 조회 오류:', error)
        router.push('/dashboard/avatar')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvatar()
  }, [id, router])

  /**
   * 파일 업로드 핸들러 생성
   */
  const createUploadHandler = (
    setState: React.Dispatch<React.SetStateAction<ImageUploadState>>
  ) => (file: File) => {
    const preview = URL.createObjectURL(file)
    setState({ file, preview, uploading: false })
  }

  /**
   * 파일 삭제 핸들러 생성
   */
  const createRemoveHandler = (
    setState: React.Dispatch<React.SetStateAction<ImageUploadState>>,
    state: ImageUploadState
  ) => () => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview)
    }
    setState({ file: null, preview: null, uploading: false })
  }

  /**
   * 제출 가능 여부 확인
   */
  const canSubmit = () => {
    if (!name.trim()) return false
    if (inputType === 'combined') {
      return !!outfitImage.file
    }
    // separate: 최소 하나 이상의 이미지 필요
    return !!topImage.file || !!bottomImage.file || !!shoesImage.file
  }

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit() || isSubmitting) return

    setIsSubmitting(true)

    try {
      // FormData 생성
      const formData = new FormData()
      formData.append('name', name)
      formData.append('outfitType', inputType)

      if (inputType === 'combined' && outfitImage.file) {
        formData.append('outfitImage', outfitImage.file)
      } else {
        if (topImage.file) formData.append('topImage', topImage.file)
        if (bottomImage.file) formData.append('bottomImage', bottomImage.file)
        if (shoesImage.file) formData.append('shoesImage', shoesImage.file)
      }

      // API 호출
      const res = await fetch(`/api/avatars/${id}/outfits`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        // 생성된 의상 상세 페이지로 이동
        router.push(`/dashboard/avatar/${id}`)
      } else {
        const error = await res.json()
        alert(error.error || t.avatar.error)
      }
    } catch (error) {
      console.error('의상 교체 오류:', error)
      alert(t.avatar.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // 아바타 없음
  if (!avatar) {
    return null
  }

  return (
    <div>
      {/* 헤더 */}
      <Link
        href={`/dashboard/avatar/${id}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {avatar.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.outfit.title}</h1>
        <p className="text-muted-foreground mt-1">{t.outfit.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 현재 아바타 이미지 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground">현재 아바타</h3>
          </div>
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

        {/* 오른쪽: 의상 업로드 폼 */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 의상 이름 */}
            <div className="bg-card border border-border rounded-xl p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t.outfit.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.outfit.namePlaceholder}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                disabled={isSubmitting}
              />
            </div>

            {/* 입력 방식 선택 */}
            <div className="bg-card border border-border rounded-xl p-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                {t.outfit.inputType}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInputType('combined')}
                  disabled={isSubmitting}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-colors
                    ${inputType === 'combined'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <Shirt className="w-6 h-6 mb-2 text-primary" />
                  <div className="font-medium text-foreground">{t.outfit.combined}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.outfit.combinedDesc}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('separate')}
                  disabled={isSubmitting}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-colors
                    ${inputType === 'separate'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-4 h-6 bg-primary/30 rounded" />
                    <div className="w-4 h-6 bg-primary/50 rounded" />
                    <div className="w-4 h-6 bg-primary/70 rounded" />
                  </div>
                  <div className="font-medium text-foreground">{t.outfit.separate}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.outfit.separateDesc}</div>
                </button>
              </div>
            </div>

            {/* 이미지 업로드 영역 */}
            <div className="bg-card border border-border rounded-xl p-6">
              {inputType === 'combined' ? (
                <ImageUploadBox
                  label={t.outfit.outfitImage}
                  state={outfitImage}
                  onUpload={createUploadHandler(setOutfitImage)}
                  onRemove={createRemoveHandler(setOutfitImage, outfitImage)}
                  disabled={isSubmitting}
                />
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <ImageUploadBox
                    label={t.outfit.topImage}
                    state={topImage}
                    onUpload={createUploadHandler(setTopImage)}
                    onRemove={createRemoveHandler(setTopImage, topImage)}
                    disabled={isSubmitting}
                  />
                  <ImageUploadBox
                    label={t.outfit.bottomImage}
                    state={bottomImage}
                    onUpload={createUploadHandler(setBottomImage)}
                    onRemove={createRemoveHandler(setBottomImage, bottomImage)}
                    disabled={isSubmitting}
                  />
                  <ImageUploadBox
                    label={t.outfit.shoesImage}
                    state={shoesImage}
                    onUpload={createUploadHandler(setShoesImage)}
                    onRemove={createRemoveHandler(setShoesImage, shoesImage)}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{t.outfit.creditsRequired}</span>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">2</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={!canSubmit() || isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.outfit.generating}
                  </>
                ) : (
                  <>
                    <Shirt className="w-5 h-5" />
                    {t.outfit.generate}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
