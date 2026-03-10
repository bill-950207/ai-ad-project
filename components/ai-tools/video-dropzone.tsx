'use client'

import { useCallback, useState } from 'react'
import { Upload, X, Loader2, Film } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface VideoDropzoneProps {
  videoUrl: string | null
  onVideoChange: (url: string | null) => void
  label?: string
  required?: boolean
}

export default function VideoDropzone({
  videoUrl,
  onVideoChange,
  label,
  required = false,
}: VideoDropzoneProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}
  const displayLabel = label || aiToolsT.referenceVideo || '참조 영상'
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const validExts = ['mp4', 'webm', 'mov']
    if (!validExts.includes(ext)) {
      alert(aiToolsT.unsupportedVideoFormat || 'MP4, WebM, MOV 영상만 지원합니다.')
      return
    }

    setIsUploading(true)
    try {
      const urlRes = await fetch('/api/ai-tools/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ext }),
      })

      if (!urlRes.ok) throw new Error('업로드 URL 생성 실패')
      const { uploadUrl, publicUrl } = await urlRes.json()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) throw new Error('영상 업로드 실패')

      onVideoChange(publicUrl)
    } catch (error) {
      console.error('Video upload error:', error)
      alert(aiToolsT.videoUploadFailed || '영상 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }, [onVideoChange, aiToolsT.unsupportedVideoFormat, aiToolsT.videoUploadFailed])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
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

  if (videoUrl) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {displayLabel} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative group rounded-xl overflow-hidden border border-border/80 bg-card">
          <video
            src={videoUrl}
            className="w-full h-36 object-contain bg-black/20"
            controls
            muted
          />
          <button
            onClick={() => onVideoChange(null)}
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
        {displayLabel} {required && <span className="text-red-400">*</span>}
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
          <Film className="w-6 h-6 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isUploading ? (aiToolsT.uploading || '업로드 중...') : (aiToolsT.videoDropzoneText || '클릭하거나 영상을 드래그하세요')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            MP4, WebM, MOV
          </p>
        </div>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </label>
    </div>
  )
}
