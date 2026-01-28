'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  Video,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react'

interface Showcase {
  id: string
  type: 'image' | 'video'
  title: string
  description: string | null
  thumbnail_url: string
  media_url: string | null
  ad_type: string | null
  category: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

interface FormData {
  type: 'image' | 'video'
  title: string
  description: string
  thumbnail_url: string
  media_url: string
  ad_type: string
  category: string
  is_active: boolean
  display_order: number
}

const initialFormData: FormData = {
  type: 'image',
  title: '',
  description: '',
  thumbnail_url: '',
  media_url: '',
  ad_type: '',
  category: '',
  is_active: true,
  display_order: 0
}

export function AdminContent() {
  const router = useRouter()
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShowcase, setEditingShowcase] = useState<Showcase | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Check admin role and fetch showcases
  const checkAdminAndFetch = useCallback(async () => {
    try {
      // Check if user is admin
      const meRes = await fetch('/api/me')
      if (!meRes.ok) {
        router.push('/dashboard')
        return
      }
      const meData = await meRes.json()
      if (meData.data?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      setIsAdmin(true)

      // Fetch showcases
      const res = await fetch('/api/admin/showcases')
      if (!res.ok) {
        throw new Error('Failed to fetch showcases')
      }
      const data = await res.json()
      setShowcases(data.data || [])
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAdminAndFetch()
  }, [checkAdminAndFetch])

  // Modal handlers
  const openCreateModal = () => {
    setEditingShowcase(null)
    setFormData(initialFormData)
    setIsModalOpen(true)
  }

  const openEditModal = (showcase: Showcase) => {
    setEditingShowcase(showcase)
    setFormData({
      type: showcase.type as 'image' | 'video',
      title: showcase.title,
      description: showcase.description || '',
      thumbnail_url: showcase.thumbnail_url,
      media_url: showcase.media_url || '',
      ad_type: showcase.ad_type || '',
      category: showcase.category || '',
      is_active: showcase.is_active,
      display_order: showcase.display_order
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingShowcase(null)
    setFormData(initialFormData)
  }

  // CRUD handlers
  const handleSave = async () => {
    if (!formData.title || !formData.thumbnail_url) {
      alert('제목과 썸네일 URL은 필수입니다.')
      return
    }

    setIsSaving(true)
    try {
      const url = editingShowcase
        ? `/api/admin/showcases/${editingShowcase.id}`
        : '/api/admin/showcases'
      const method = editingShowcase ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      closeModal()
      checkAdminAndFetch()
    } catch (err) {
      console.error('Save error:', err)
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (showcase: Showcase) => {
    try {
      const res = await fetch(`/api/admin/showcases/${showcase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !showcase.is_active })
      })

      if (!res.ok) throw new Error('Failed to update')
      checkAdminAndFetch()
    } catch (err) {
      console.error('Toggle error:', err)
      alert('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/showcases/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete')
      setDeleteConfirmId(null)
      checkAdminAndFetch()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete')
    }
  }

  // Loading state
  if (isLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">쇼케이스 관리</h1>
          <p className="text-muted-foreground mt-1">
            대시보드에 표시될 광고 예시를 관리합니다.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          <Plus className="w-4 h-4" />
          새 쇼케이스 추가
        </button>
      </div>

      {/* Showcase Table */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                순서
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                썸네일
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                제목
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                유형
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                상태
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {showcases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  등록된 쇼케이스가 없습니다.
                </td>
              </tr>
            ) : (
              showcases.map((showcase) => (
                <tr key={showcase.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-4 h-4 cursor-grab" />
                      <span className="text-sm">{showcase.display_order}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={showcase.thumbnail_url}
                        alt={showcase.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{showcase.title}</p>
                      {showcase.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {showcase.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                      showcase.type === 'image'
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-purple-500/10 text-purple-400"
                    )}>
                      {showcase.type === 'image' ? (
                        <Image className="w-3 h-3" />
                      ) : (
                        <Video className="w-3 h-3" />
                      )}
                      {showcase.type === 'image' ? '이미지' : '영상'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(showcase)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                        showcase.is_active
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                      )}
                    >
                      {showcase.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          활성
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          비활성
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(showcase)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === showcase.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(showcase.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(showcase.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {editingShowcase ? '쇼케이스 수정' : '새 쇼케이스 추가'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2">유형</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'image' }))}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors",
                      formData.type === 'image'
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-white/5"
                    )}
                  >
                    <Image className="w-4 h-4" />
                    이미지
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors",
                      formData.type === 'video'
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-white/5"
                    )}
                  >
                    <Video className="w-4 h-4" />
                    영상
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  제목 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="쇼케이스 제목"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="쇼케이스 설명 (선택)"
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  썸네일 URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://..."
                />
              </div>

              {/* Media URL (for video) */}
              {formData.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium mb-2">영상 URL</label>
                  <input
                    type="url"
                    value={formData.media_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Ad Type */}
              <div>
                <label className="block text-sm font-medium mb-2">광고 타입</label>
                <input
                  type="text"
                  value={formData.ad_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, ad_type: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="예: productOnly, holding, productDescription"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="예: 뷰티, 패션, 식품"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium mb-2">표시 순서</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  min="0"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">활성화</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    formData.is_active ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                      formData.is_active && "translate-x-5"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingShowcase ? '저장' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
