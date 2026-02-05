'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
  User
} from 'lucide-react'

interface DefaultAvatar {
  id: string
  name: string
  description: string | null
  image_url: string
  gender: string | null
  age_group: string | null
  style: string | null
  is_active: boolean | null
  display_order: number | null
  created_at: string | null
  updated_at: string | null
}

interface FormData {
  name: string
  description: string
  image_url: string
  gender: string
  age_group: string
  style: string
  is_active: boolean
  display_order: number
}

const initialFormData: FormData = {
  name: '',
  description: '',
  image_url: '',
  gender: '',
  age_group: '',
  style: '',
  is_active: true,
  display_order: 0
}

export function PresetAvatarManagement() {
  const { t } = useLanguage()
  const [avatars, setAvatars] = useState<DefaultAvatar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 번역 타입
  type PresetAvatarT = {
    title?: string
    subtitle?: string
    addNew?: string
    name?: string
    description?: string
    gender?: string
    ageGroup?: string
    style?: string
    displayOrder?: string
    isActive?: string
    noPresets?: string
    editPreset?: string
    addPreset?: string
    male?: string
    female?: string
    order?: string
    thumbnail?: string
    status?: string
    actions?: string
    active?: string
    inactive?: string
    delete?: string
    cancel?: string
    save?: string
    validation?: {
      nameAndImageRequired?: string
    }
  }
  const presetT = (t.admin as { presetAvatar?: PresetAvatarT } | undefined)?.presetAvatar

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState<DefaultAvatar | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Fetch avatars
  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/default-avatars')
      if (!res.ok) {
        throw new Error('Failed to fetch default avatars')
      }
      const data = await res.json()
      setAvatars(data.data || [])
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvatars()
  }, [fetchAvatars])

  // Modal handlers
  const openCreateModal = () => {
    setEditingAvatar(null)
    setFormData(initialFormData)
    setIsModalOpen(true)
  }

  const openEditModal = (avatar: DefaultAvatar) => {
    setEditingAvatar(avatar)
    setFormData({
      name: avatar.name,
      description: avatar.description || '',
      image_url: avatar.image_url,
      gender: avatar.gender || '',
      age_group: avatar.age_group || '',
      style: avatar.style || '',
      is_active: avatar.is_active ?? true,
      display_order: avatar.display_order ?? 0
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAvatar(null)
    setFormData(initialFormData)
  }

  // CRUD handlers
  const handleSave = async () => {
    if (!formData.name || !formData.image_url) {
      alert(presetT?.validation?.nameAndImageRequired || 'Name and image URL are required.')
      return
    }

    setIsSaving(true)
    try {
      const url = editingAvatar
        ? `/api/admin/default-avatars/${editingAvatar.id}`
        : '/api/admin/default-avatars'
      const method = editingAvatar ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      await fetchAvatars()
      closeModal()
    } catch (err) {
      console.error('Error saving:', err)
      alert('Failed to save preset avatar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/default-avatars/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      await fetchAvatars()
      setDeleteConfirmId(null)
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Failed to delete preset avatar')
    }
  }

  const toggleActive = async (avatar: DefaultAvatar) => {
    try {
      const res = await fetch(`/api/admin/default-avatars/${avatar.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !avatar.is_active })
      })

      if (!res.ok) {
        throw new Error('Failed to update')
      }

      await fetchAvatars()
    } catch (err) {
      console.error('Error updating:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{presetT?.title || 'Preset Avatar Management'}</h2>
          <p className="text-muted-foreground mt-1">
            {presetT?.subtitle || 'Manage service default avatars.'}
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
          {presetT?.addNew || 'Add New Preset'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {presetT?.order || 'Order'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {presetT?.thumbnail || 'Image'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {presetT?.name || 'Name'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {presetT?.gender || 'Gender'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {presetT?.ageGroup || 'Age Group'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {presetT?.status || 'Status'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {presetT?.actions || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {avatars.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  {presetT?.noPresets || 'No preset avatars registered.'}
                </td>
              </tr>
            ) : (
              avatars.map((avatar) => (
                <tr key={avatar.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {avatar.display_order}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {avatar.image_url ? (
                        <img
                          src={avatar.image_url}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{avatar.name}</p>
                      {avatar.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {avatar.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {avatar.gender === 'male' ? (presetT?.male || 'Male') :
                     avatar.gender === 'female' ? (presetT?.female || 'Female') :
                     avatar.gender || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {avatar.age_group || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(avatar)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        avatar.is_active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-gray-500/10 text-gray-500"
                      )}
                    >
                      {avatar.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          {presetT?.active || 'Active'}
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          {presetT?.inactive || 'Inactive'}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(avatar)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {deleteConfirmId === avatar.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(avatar.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                          >
                            {presetT?.delete || 'Delete'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-muted rounded"
                          >
                            {presetT?.cancel || 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(avatar.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {editingAvatar ? (presetT?.editPreset || 'Edit Preset') : (presetT?.addPreset || 'Add Preset')}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {presetT?.name || 'Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Avatar name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {presetT?.description || 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Image URL *
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="https://..."
                />
                {formData.image_url && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {presetT?.gender || 'Gender'}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="">Select gender</option>
                  <option value="male">{presetT?.male || 'Male'}</option>
                  <option value="female">{presetT?.female || 'Female'}</option>
                </select>
              </div>

              {/* Age Group */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {presetT?.ageGroup || 'Age Group'}
                </label>
                <input
                  type="text"
                  value={formData.age_group}
                  onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g., 20s, 30s"
                />
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {presetT?.style || 'Style'}
                </label>
                <input
                  type="text"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g., casual, professional"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {presetT?.displayOrder || 'Display Order'}
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  min={0}
                />
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  {presetT?.isActive || 'Active'}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {presetT?.cancel || 'Cancel'}
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
                {presetT?.save || 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
