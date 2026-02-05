'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import {
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  User,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

/** 프리셋 아바타 (avatars 테이블 참조) */
interface PresetAvatar {
  id: string  // preset_avatars 테이블의 id
  avatar_id: string  // avatars 테이블의 id
  display_order: number | null
  is_active: boolean | null
  created_at: string | null
  avatar: {
    id: string
    name: string
    image_url: string | null
    image_url_original: string | null
    options: Record<string, string> | null
    status: string
    user_id: string
  }
}

export function PresetAvatarManagement() {
  const { t } = useLanguage()
  const [presets, setPresets] = useState<PresetAvatar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // 번역 타입
  type PresetAvatarT = {
    title?: string
    subtitle?: string
    name?: string
    gender?: string
    ageGroup?: string
    noPresets?: string
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
    owner?: string
    style?: string
    registrationGuide?: string
  }
  const presetT = (t.admin as { presetAvatar?: PresetAvatarT } | undefined)?.presetAvatar

  // Fetch presets
  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/preset-avatars')
      if (!res.ok) {
        throw new Error('Failed to fetch preset avatars')
      }
      const data = await res.json()
      setPresets(data.data || [])
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  // Toggle active
  const toggleActive = async (preset: PresetAvatar) => {
    setUpdatingId(preset.id)
    try {
      const res = await fetch(`/api/admin/preset-avatars/${preset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !preset.is_active })
      })

      if (!res.ok) {
        throw new Error('Failed to update')
      }

      await fetchPresets()
    } catch (err) {
      console.error('Error updating:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Update display order
  const updateOrder = async (preset: PresetAvatar, newOrder: number) => {
    setUpdatingId(preset.id)
    try {
      const res = await fetch(`/api/admin/preset-avatars/${preset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: newOrder })
      })

      if (!res.ok) {
        throw new Error('Failed to update')
      }

      await fetchPresets()
    } catch (err) {
      console.error('Error updating:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Delete preset
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/preset-avatars/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      await fetchPresets()
      setDeleteConfirmId(null)
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Failed to delete preset avatar')
    }
  }

  // Get gender display
  const getGenderDisplay = (options: Record<string, string> | null) => {
    if (!options?.gender) return '-'
    if (options.gender === 'male') return presetT?.male || 'Male'
    if (options.gender === 'female') return presetT?.female || 'Female'
    return options.gender
  }

  // Get age display
  const getAgeDisplay = (options: Record<string, string> | null) => {
    return options?.age || options?.ageGroup || '-'
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
      <div className="mb-6">
        <h2 className="text-xl font-bold">{presetT?.title || 'Preset Avatar Management'}</h2>
        <p className="text-muted-foreground mt-1">
          {presetT?.subtitle || 'Manage service default avatars.'}
        </p>
        <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-3 rounded-lg">
          {presetT?.registrationGuide || 'To register a new preset avatar, go to the avatar detail page and click the "Register as Preset" button (Admin only).'}
        </p>
      </div>

      {/* Table */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-16 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                {presetT?.style || 'Style'}
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
            {presets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  {presetT?.noPresets || 'No preset avatars registered.'}
                </td>
              </tr>
            ) : (
              presets.map((preset) => (
                <tr
                  key={preset.id}
                  className={cn(
                    "hover:bg-muted/20 transition-colors",
                    updatingId === preset.id && "opacity-50"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground w-6">
                        {preset.display_order}
                      </span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => updateOrder(preset, (preset.display_order || 0) - 1)}
                          disabled={updatingId !== null}
                          className="p-0.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                        >
                          <ArrowUp className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => updateOrder(preset, (preset.display_order || 0) + 1)}
                          disabled={updatingId !== null}
                          className="p-0.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                        >
                          <ArrowDown className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {preset.avatar.image_url ? (
                        <img
                          src={preset.avatar.image_url}
                          alt={preset.avatar.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{preset.avatar.name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getGenderDisplay(preset.avatar.options)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {preset.avatar.options?.outfitStyle || preset.avatar.options?.style || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(preset)}
                      disabled={updatingId !== null}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        preset.is_active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-gray-500/10 text-gray-500"
                      )}
                    >
                      {preset.is_active ? (
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
                      {deleteConfirmId === preset.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(preset.id)}
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
                          onClick={() => setDeleteConfirmId(preset.id)}
                          disabled={updatingId !== null}
                          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
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
    </div>
  )
}
