/**
 * 아바타 선택 모달
 *
 * 기본 아바타와 의상 교체 아바타를 모두 보여주고 선택할 수 있습니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Check, Shirt } from 'lucide-react'

interface Avatar {
  id: string
  name: string
  image_url: string | null
}

interface AvatarOutfit {
  id: string
  name: string
  image_url: string | null
  status: string
}

interface AvatarWithOutfits extends Avatar {
  outfits: AvatarOutfit[]
}

export interface SelectedAvatarInfo {
  type: 'avatar' | 'outfit'
  avatarId: string
  avatarName: string
  outfitId?: string
  outfitName?: string
  imageUrl: string
  displayName: string
}

interface AvatarSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (avatar: SelectedAvatarInfo) => void
  selectedAvatarId?: string
  selectedOutfitId?: string
}

export function AvatarSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedAvatarId,
  selectedOutfitId,
}: AvatarSelectModalProps) {
  const [avatarsWithOutfits, setAvatarsWithOutfits] = useState<AvatarWithOutfits[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedAvatarId, setExpandedAvatarId] = useState<string | null>(null)

  // 아바타 및 의상 데이터 로드
  const fetchData = useCallback(async () => {
    if (!isOpen) return

    setIsLoading(true)
    try {
      // 아바타 목록 조회
      const avatarsRes = await fetch('/api/avatars')
      if (!avatarsRes.ok) throw new Error('Failed to fetch avatars')

      const avatarsData = await avatarsRes.json()
      const completedAvatars = avatarsData.avatars.filter(
        (a: Avatar & { status: string }) => a.status === 'COMPLETED' && a.image_url
      )

      // 각 아바타의 의상 목록 조회
      const avatarsWithOutfitsData: AvatarWithOutfits[] = await Promise.all(
        completedAvatars.map(async (avatar: Avatar) => {
          try {
            const outfitsRes = await fetch(`/api/avatars/${avatar.id}/outfits`)
            if (outfitsRes.ok) {
              const outfitsData = await outfitsRes.json()
              // COMPLETED 상태이고 image_url이 있는 의상만 필터링
              const completedOutfits = (outfitsData.outfits || []).filter(
                (o: AvatarOutfit) => o.status === 'COMPLETED' && o.image_url
              )
              return { ...avatar, outfits: completedOutfits }
            }
          } catch (err) {
            console.error(`의상 로드 실패 (avatar ${avatar.id}):`, err)
          }
          return { ...avatar, outfits: [] }
        })
      )

      setAvatarsWithOutfits(avatarsWithOutfitsData)

      // 선택된 아바타가 있으면 해당 아바타 확장
      if (selectedAvatarId) {
        setExpandedAvatarId(selectedAvatarId)
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, selectedAvatarId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 기본 아바타 선택
  const handleSelectAvatar = (avatar: AvatarWithOutfits) => {
    if (!avatar.image_url) return

    onSelect({
      type: 'avatar',
      avatarId: avatar.id,
      avatarName: avatar.name,
      imageUrl: avatar.image_url,
      displayName: avatar.name,
    })
  }

  // 의상 교체 아바타 선택
  const handleSelectOutfit = (avatar: AvatarWithOutfits, outfit: AvatarOutfit) => {
    if (!outfit.image_url) return

    onSelect({
      type: 'outfit',
      avatarId: avatar.id,
      avatarName: avatar.name,
      outfitId: outfit.id,
      outfitName: outfit.name,
      imageUrl: outfit.image_url,
      displayName: `${avatar.name} - ${outfit.name}`,
    })
  }

  // 아바타 확장/축소 토글
  const toggleAvatarExpand = (avatarId: string) => {
    setExpandedAvatarId(expandedAvatarId === avatarId ? null : avatarId)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[80vh] bg-card rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              아바타 선택
            </h2>
            <p className="text-sm text-muted-foreground">
              기본 아바타 또는 의상 교체된 아바타를 선택하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : avatarsWithOutfits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">생성된 아바타가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                먼저 아바타를 생성해주세요
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {avatarsWithOutfits.map((avatar) => {
                const isExpanded = expandedAvatarId === avatar.id
                const hasOutfits = avatar.outfits.length > 0
                const isAvatarSelected = selectedAvatarId === avatar.id && !selectedOutfitId

                return (
                  <div
                    key={avatar.id}
                    className="bg-secondary/30 border border-border rounded-xl overflow-hidden"
                  >
                    {/* 아바타 헤더 */}
                    <div className="flex items-center gap-3 p-3">
                      {/* 기본 아바타 선택 버튼 */}
                      <button
                        onClick={() => handleSelectAvatar(avatar)}
                        className={`relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          isAvatarSelected
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent hover:border-primary/50'
                        }`}
                      >
                        {avatar.image_url && (
                          <img
                            src={avatar.image_url}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isAvatarSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        {/* 기본 아바타 라벨 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                          <span className="text-[10px] text-white">기본</span>
                        </div>
                      </button>

                      {/* 아바타 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {avatar.name}
                        </h3>
                        {hasOutfits && (
                          <button
                            onClick={() => toggleAvatarExpand(avatar.id)}
                            className="flex items-center gap-1 mt-1 text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            <Shirt className="w-3 h-3" />
                            <span>의상 {avatar.outfits.length}개</span>
                            <svg
                              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        {!hasOutfits && (
                          <p className="text-xs text-muted-foreground mt-1">
                            등록된 의상이 없습니다
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 의상 목록 (확장 시) */}
                    {isExpanded && hasOutfits && (
                      <div className="border-t border-border bg-secondary/20 p-3">
                        <p className="text-xs text-muted-foreground mb-2">의상 교체 목록</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {avatar.outfits.map((outfit) => {
                            const isOutfitSelected = selectedOutfitId === outfit.id

                            return (
                              <button
                                key={outfit.id}
                                onClick={() => handleSelectOutfit(avatar, outfit)}
                                className={`relative flex-shrink-0 w-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                  isOutfitSelected
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-transparent hover:border-primary/50'
                                }`}
                              >
                                <div className="aspect-[9/16]">
                                  {outfit.image_url && (
                                    <img
                                      src={outfit.image_url}
                                      alt={outfit.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                {isOutfitSelected && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                                  <span className="text-[10px] text-white truncate block">
                                    {outfit.name}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
