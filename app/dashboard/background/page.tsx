/**
 * 광고 배경 관리 페이지
 *
 * 광고 배경 이미지를 생성하고 관리합니다.
 * 3가지 생성 모드: 제품 기반, 옵션 선택, 프롬프트 직접 입력
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'
import { Plus, Image as ImageIcon, Loader2, Trash2, Download, Package, Sliders, Type, X } from 'lucide-react'
import { InsufficientCreditsModal } from '@/components/ui/insufficient-credits-modal'

interface AdBackground {
  id: string
  name: string
  status: 'PENDING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  mode: 'PRODUCT' | 'OPTIONS' | 'PROMPT'
  image_url: string | null
  thumbnail_url: string | null
  aspect_ratio: string | null
  optimized_prompt: string | null
  original_prompt: string | null
  options: Record<string, string> | null
  error_message: string | null
  created_at: string
}

interface AdProduct {
  id: string
  name: string
  image_url: string | null
  description: string | null
  status: string
}

type GenerationMode = 'PRODUCT' | 'OPTIONS' | 'PROMPT'

// 스타일 옵션
const STYLE_OPTIONS = [
  { value: 'modern', labelKey: 'modern' },
  { value: 'natural', labelKey: 'natural' },
  { value: 'minimal', labelKey: 'minimal' },
  { value: 'luxurious', labelKey: 'luxurious' },
  { value: 'industrial', labelKey: 'industrial' },
  { value: 'vintage', labelKey: 'vintage' },
]

// 장소 옵션
const LOCATION_OPTIONS = [
  { value: 'studio', labelKey: 'studio' },
  { value: 'outdoor', labelKey: 'outdoor' },
  { value: 'home', labelKey: 'home' },
  { value: 'cafe', labelKey: 'cafe' },
  { value: 'office', labelKey: 'office' },
  { value: 'nature', labelKey: 'nature' },
]

// 분위기 옵션
const MOOD_OPTIONS = [
  { value: 'bright', labelKey: 'bright' },
  { value: 'warm', labelKey: 'warm' },
  { value: 'cool', labelKey: 'cool' },
  { value: 'dramatic', labelKey: 'dramatic' },
  { value: 'soft', labelKey: 'soft' },
  { value: 'professional', labelKey: 'professional' },
]

// 색상 옵션
const COLOR_OPTIONS = [
  { value: 'white', labelKey: 'white' },
  { value: 'beige', labelKey: 'beige' },
  { value: 'gray', labelKey: 'gray' },
  { value: 'blue', labelKey: 'blue' },
  { value: 'green', labelKey: 'green' },
  { value: 'pink', labelKey: 'pink' },
]

// 시간대 옵션
const TIME_OPTIONS = [
  { value: 'day', labelKey: 'day' },
  { value: 'night', labelKey: 'night' },
  { value: 'sunset', labelKey: 'sunset' },
  { value: 'sunrise', labelKey: 'sunrise' },
]

// 화면 비율 옵션
const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 (가로)' },
  { value: '9:16', label: '9:16 (세로)' },
  { value: '1:1', label: '1:1 (정사각형)' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
]

export default function BackgroundPage() {
  const { t } = useLanguage()
  const { refreshCredits } = useCredits()
  const [backgroundList, setBackgroundList] = useState<AdBackground[]>([])
  const [productList, setProductList] = useState<AdProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 크게 보기 모달
  const [selectedBackground, setSelectedBackground] = useState<AdBackground | null>(null)

  // 크레딧 부족 모달 상태
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)
  const [creditsInfo, setCreditsInfo] = useState<{ required: number; available: number } | null>(null)

  // 폼 상태
  const [mode, setMode] = useState<GenerationMode>('OPTIONS')
  const [formData, setFormData] = useState({
    name: '',
    // PRODUCT 모드
    productId: '',
    // OPTIONS 모드
    style: '',
    location: '',
    mood: '',
    color: '',
    time: '',
    // PROMPT 모드
    userPrompt: '',
    // 공통
    aspectRatio: '16:9',
  })

  // 번역 헬퍼
  const bgT = (t as Record<string, unknown>).adBackground as Record<string, unknown> | undefined

  // 중첩된 번역 값 가져오기
  const getNestedT = (key: string, subKey: string): string => {
    const category = bgT?.[key] as Record<string, string> | undefined
    return category?.[subKey] || subKey
  }

  // 단일 번역 값 가져오기
  const getT = (key: string, fallback: string): string => {
    return (bgT?.[key] as string | undefined) || fallback
  }

  // 배경 목록 조회
  const fetchBackgroundList = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-backgrounds')
      if (res.ok) {
        const data = await res.json()
        setBackgroundList(data.backgrounds || [])
      }
    } catch (error) {
      console.error('배경 목록 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 제품 목록 조회
  const fetchProductList = useCallback(async () => {
    try {
      const res = await fetch('/api/ad-products?status=COMPLETED')
      if (res.ok) {
        const data = await res.json()
        setProductList(data.products || [])
      }
    } catch (error) {
      console.error('제품 목록 조회 오류:', error)
    }
  }, [])

  useEffect(() => {
    fetchBackgroundList()
    fetchProductList()
  }, [fetchBackgroundList, fetchProductList])

  // 생성 중인 배경 폴링
  useEffect(() => {
    const pendingBackgrounds = backgroundList.filter(b =>
      ['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(b.status)
    )

    if (pendingBackgrounds.length === 0) return

    const pollStatus = async () => {
      for (const bg of pendingBackgrounds) {
        try {
          const res = await fetch(`/api/ad-backgrounds/${bg.id}/status`)
          if (res.ok) {
            const data = await res.json()
            setBackgroundList(prev =>
              prev.map(b => b.id === bg.id ? data.background : b)
            )
          }
        } catch (error) {
          console.error('상태 폴링 오류:', error)
        }
      }
    }

    const interval = setInterval(pollStatus, 3000)
    return () => clearInterval(interval)
  }, [backgroundList])

  // 배경 생성
  const handleCreate = async () => {
    if (!formData.name) {
      alert('이름을 입력해주세요.')
      return
    }

    if (mode === 'PRODUCT' && !formData.productId) {
      alert('제품을 선택해주세요.')
      return
    }

    if (mode === 'PROMPT' && !formData.userPrompt) {
      alert('프롬프트를 입력해주세요.')
      return
    }

    setIsCreating(true)
    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        mode,
        aspectRatio: formData.aspectRatio,
      }

      if (mode === 'PRODUCT') {
        body.adProductId = formData.productId
      } else if (mode === 'OPTIONS') {
        body.options = {
          style: formData.style || undefined,
          location: formData.location || undefined,
          mood: formData.mood || undefined,
          color: formData.color || undefined,
          time: formData.time || undefined,
        }
      } else if (mode === 'PROMPT') {
        body.userPrompt = formData.userPrompt
      }

      const res = await fetch('/api/ad-backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      // 크레딧 부족 (402)
      if (res.status === 402) {
        const errorData = await res.json()
        setCreditsInfo({
          required: errorData.required || 1,
          available: errorData.available || 0,
        })
        setShowInsufficientCreditsModal(true)
        return
      }

      if (res.ok) {
        const data = await res.json()
        setBackgroundList(prev => [data.background, ...prev])
        setShowCreateModal(false)
        resetForm()
        refreshCredits()
      } else {
        const error = await res.json()
        alert(error.error || '배경 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('배경 생성 오류:', error)
      alert('배경 생성에 실패했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      productId: '',
      style: '',
      location: '',
      mood: '',
      color: '',
      time: '',
      userPrompt: '',
      aspectRatio: '16:9',
    })
    setMode('OPTIONS')
  }

  // 배경 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 배경을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/ad-backgrounds/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBackgroundList(prev => prev.filter(b => b.id !== id))
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    }
  }

  // 다운로드
  const handleDownload = (bg: AdBackground) => {
    if (!bg.image_url) return
    const link = document.createElement('a')
    link.href = bg.image_url
    link.download = `${bg.name}.png`
    link.click()
  }

  // 모드 아이콘
  const getModeIcon = (m: GenerationMode) => {
    switch (m) {
      case 'PRODUCT': return <Package className="w-5 h-5" />
      case 'OPTIONS': return <Sliders className="w-5 h-5" />
      case 'PROMPT': return <Type className="w-5 h-5" />
    }
  }

  // 모드 라벨
  const getModeLabel = (m: GenerationMode): string => {
    switch (m) {
      case 'PRODUCT': return getT('modeProduct', '제품 기반')
      case 'OPTIONS': return getT('modeOptions', '옵션 선택')
      case 'PROMPT': return getT('modePrompt', '프롬프트')
    }
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t.background.title}
          </h1>
          <p className="text-muted-foreground">
            {t.background.subtitle}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {getT('createNew', '새 배경 생성')}
        </button>
      </div>

      {/* 배경 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-video bg-secondary/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : backgroundList.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            {getT('emptyList', '생성된 배경이 없습니다')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {getT('emptyDescription', '새 배경을 생성하여 광고에 활용하세요')}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            {getT('createNew', '새 배경 생성')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {backgroundList.map(bg => (
            <div
              key={bg.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              {/* 이미지 영역 */}
              <div
                className={`aspect-video relative bg-secondary/30 flex items-center justify-center ${bg.image_url && bg.status === 'COMPLETED' ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                onClick={() => bg.image_url && bg.status === 'COMPLETED' && setSelectedBackground(bg)}
              >
                {bg.image_url ? (
                  <img
                    src={bg.image_url}
                    alt={bg.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                )}

                {/* 상태 오버레이 */}
                {['PENDING', 'IN_QUEUE', 'IN_PROGRESS'].includes(bg.status) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">{getT('generating', '생성 중...')}</p>
                    </div>
                  </div>
                )}

                {/* 실패 상태 */}
                {bg.status === 'FAILED' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <p className="text-red-500 font-medium">{getT('failed', '생성 실패')}</p>
                  </div>
                )}

              </div>

              {/* 정보 영역 */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-foreground truncate flex-1">{bg.name}</h3>
                  {bg.aspect_ratio && (
                    <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 bg-secondary rounded">
                      {bg.aspect_ratio}
                    </span>
                  )}
                </div>

                {/* 생성 옵션 표시 */}
                {bg.mode === 'OPTIONS' && bg.options && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(bg.options).filter(([, v]) => v).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2">
                  {bg.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleDownload(bg)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {getT('download', '다운로드')}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(bg.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">
              {getT('createNew', '새 배경 생성')}
            </h2>

            <div className="space-y-6">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {getT('name', '배경 이름')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={getT('namePlaceholder', '예: 봄 시즌 광고 배경')}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 모드 선택 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {getT('selectMode', '생성 방식')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PRODUCT', 'OPTIONS', 'PROMPT'] as GenerationMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                        mode === m
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border hover:border-primary/50'
                      }`}
                    >
                      {getModeIcon(m)}
                      <span className="text-xs">{getModeLabel(m)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 모드별 옵션 */}
              {mode === 'PRODUCT' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {getT('selectProduct', '제품 선택')}
                  </label>
                  {productList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {getT('noProducts', '등록된 제품이 없습니다. 제품을 먼저 등록해주세요.')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {productList.map(product => (
                        <button
                          key={product.id}
                          onClick={() => setFormData(prev => ({ ...prev, productId: product.id }))}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                            formData.productId === product.id
                              ? 'border-primary'
                              : 'border-transparent hover:border-primary/50'
                          }`}
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-secondary flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                          )}
                          {formData.productId === product.id && (
                            <div className="absolute inset-0 bg-primary/20" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {mode === 'OPTIONS' && (
                <div className="space-y-4">
                  {/* 스타일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {getT('style', '스타일')} <span className="text-muted-foreground text-xs">({getT('optional', '선택')})</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {STYLE_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            style: prev.style === option.value ? '' : option.value
                          }))}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.style === option.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary border-border hover:border-primary/50'
                          }`}
                        >
                          {getNestedT('styles', option.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 장소 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {getT('location', '장소')} <span className="text-muted-foreground text-xs">({getT('optional', '선택')})</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {LOCATION_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            location: prev.location === option.value ? '' : option.value
                          }))}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.location === option.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary border-border hover:border-primary/50'
                          }`}
                        >
                          {getNestedT('locations', option.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 분위기 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {getT('mood', '분위기')} <span className="text-muted-foreground text-xs">({getT('optional', '선택')})</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {MOOD_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            mood: prev.mood === option.value ? '' : option.value
                          }))}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.mood === option.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary border-border hover:border-primary/50'
                          }`}
                        >
                          {getNestedT('moods', option.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 색상 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {getT('color', '주요 색상')} <span className="text-muted-foreground text-xs">({getT('optional', '선택')})</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            color: prev.color === option.value ? '' : option.value
                          }))}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.color === option.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary border-border hover:border-primary/50'
                          }`}
                        >
                          {getNestedT('colors', option.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 시간대 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {getT('time', '시간대')} <span className="text-muted-foreground text-xs">({getT('optional', '선택')})</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {TIME_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            time: prev.time === option.value ? '' : option.value
                          }))}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.time === option.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary border-border hover:border-primary/50'
                          }`}
                        >
                          {getNestedT('times', option.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'PROMPT' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {getT('promptInput', '배경 설명')}
                  </label>
                  <textarea
                    value={formData.userPrompt}
                    onChange={e => setFormData(prev => ({ ...prev, userPrompt: e.target.value }))}
                    placeholder={getT('promptPlaceholder', '원하는 배경을 자유롭게 설명해주세요. 예: 따뜻한 조명의 카페 테이블, 대리석 바닥에 햇빛이 비치는 모습')}
                    rows={4}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {getT('promptHint', 'AI가 입력하신 내용을 분석하여 최적의 배경 이미지를 생성합니다.')}
                  </p>
                </div>
              )}

              {/* 화면 비율 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {getT('aspectRatio', '화면 비율')}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ASPECT_RATIO_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, aspectRatio: option.value }))}
                      className={`px-2 py-2 text-xs rounded-lg border transition-colors ${
                        formData.aspectRatio === option.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="flex-1 px-4 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
              >
                {getT('cancel', '취소')}
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !formData.name || (mode === 'PRODUCT' && !formData.productId) || (mode === 'PROMPT' && !formData.userPrompt)}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {getT('generating', '생성 중...')}
                  </>
                ) : (
                  getT('generate', '생성하기')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 크게 보기 모달 */}
      {selectedBackground && (
        <div
          className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black/60"
          onClick={() => setSelectedBackground(null)}
        >
          <button
            onClick={() => setSelectedBackground(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedBackground.image_url!}
              alt={selectedBackground.name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
              <h3 className="text-white font-medium text-lg">{selectedBackground.name}</h3>
              {selectedBackground.aspect_ratio && (
                <span className="text-white/70 text-sm">{selectedBackground.aspect_ratio}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 크레딧 부족 모달 */}
      {creditsInfo && (
        <InsufficientCreditsModal
          isOpen={showInsufficientCreditsModal}
          onClose={() => setShowInsufficientCreditsModal(false)}
          requiredCredits={creditsInfo.required}
          availableCredits={creditsInfo.available}
          featureName="배경 생성"
        />
      )}
    </div>
  )
}
