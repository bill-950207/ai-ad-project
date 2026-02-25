'use client'

import { useCallback, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface ImageDropzoneProps {
  imageUrl: string | null
  onImageChange: (url: string | null) => void
  label?: string
  required?: boolean
  maxImages?: number
}

export default function ImageDropzone({
  imageUrl,
  onImageChange,
  label,
  required = false,
}: ImageDropzoneProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}
  const displayLabel = label || aiToolsT.referenceImage || '참조 이미지'
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const validExts = ['png', 'jpg', 'jpeg', 'webp']
    if (!validExts.includes(ext)) {
      alert(aiToolsT.unsupportedFormat || 'PNG, JPG, WebP 이미지만 지원합니다.')
      return
    }

    setIsUploading(true)
    try {
      // Get presigned URL
      const urlRes = await fetch('/api/ai-tools/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ext }),
      })

      if (!urlRes.ok) throw new Error('업로드 URL 생성 실패')
      const { uploadUrl, publicUrl } = await urlRes.json()

      // Upload to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) throw new Error('이미지 업로드 실패')

      onImageChange(publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert(aiToolsT.uploadFailed || '이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }, [onImageChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      uploadFile(file)
    }
  }, [uploadFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    e.target.value = ''
  }, [uploadFile])

  if (imageUrl) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {displayLabel} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative group rounded-xl overflow-hidden border border-border/80 bg-card">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full h-36 object-contain bg-black/20"
          />
          <button
            onClick={() => onImageChange(null)}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border/60 hover:border-primary/50 hover:bg-secondary/30'
        } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {isUploading ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isUploading ? (aiToolsT.uploading || '업로드 중...') : (aiToolsT.dropzoneText || '클릭하거나 이미지를 드래그하세요')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WebP
          </p>
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </label>
    </div>
  )
}
