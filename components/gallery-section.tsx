/**
 * 갤러리 섹션 컴포넌트
 *
 * 랜딩 페이지의 쇼케이스 갤러리
 * - /api/showcases API 연동
 * - 이미지/비디오 쇼케이스 표시
 * - 호버 시 비디오 미리보기
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { Play, ImageIcon, Film, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

export function GallerySection() {
  const { t } = useLanguage()
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')

  useEffect(() => {
    const fetchShowcases = async () => {
      try {
        const res = await fetch('/api/showcases?limit=20')
        if (res.ok) {
          const data = await res.json()
          setShowcases(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load showcases:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchShowcases()
  }, [])

  const filteredShowcases = filter === 'all'
    ? showcases
    : showcases.filter(s => s.type === filter)

  return (
    <section id="gallery" className="relative px-4 py-20 sm:py-32">
      {/* 배경 효과 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* 섹션 헤더 */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="gradient-brand-text">{t.landing.galleryTitle}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t.landing.gallerySubtitle}
          </p>
        </div>

        {/* 필터 탭 */}
        <div className="flex justify-center gap-2 mb-10">
          <FilterTab
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            icon={null}
            label={t.landing.filterAll || 'All'}
          />
          <FilterTab
            active={filter === 'video'}
            onClick={() => setFilter('video')}
            icon={<Film className="h-4 w-4" />}
            label={t.landing.filterVideo || 'Video'}
          />
          <FilterTab
            active={filter === 'image'}
            onClick={() => setFilter('image')}
            icon={<ImageIcon className="h-4 w-4" />}
            label={t.landing.filterImage || 'Image'}
          />
        </div>

        {/* 쇼케이스 그리드 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredShowcases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t.landing.noShowcases || 'No showcases available'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {filteredShowcases.map((showcase, index) => (
              <ShowcaseCard
                key={showcase.id}
                showcase={showcase}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FilterTab({ active, onClick, icon, label }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function ShowcaseCard({ showcase, index }: { showcase: Showcase; index: number }) {
  const { t } = useLanguage()
  const [isHovered, setIsHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (showcase.type === 'video' && videoRef.current && showcase.media_url) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div
      className={cn(
        'group relative aspect-[9/16] overflow-hidden rounded-2xl bg-card cursor-pointer transition-all duration-500',
        'hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 썸네일 */}
      <img
        src={showcase.thumbnail_url}
        alt={showcase.title}
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-all duration-500',
          isHovered && showcase.type === 'video' ? 'opacity-0 scale-105' : 'opacity-100'
        )}
      />

      {/* 비디오 (video 타입일 때만) */}
      {showcase.type === 'video' && showcase.media_url && (
        <video
          ref={videoRef}
          src={showcase.media_url}
          muted
          loop
          playsInline
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* 재생 아이콘 (video 타입) */}
      {showcase.type === 'video' && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
            isHovered ? 'opacity-0' : 'opacity-100'
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30">
            <Play className="h-6 w-6 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* 타입 배지 */}
      <div className="absolute top-3 left-3">
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md',
          showcase.type === 'video'
            ? 'bg-primary/80 text-white'
            : 'bg-accent/80 text-accent-foreground'
        )}>
          {showcase.type === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          {showcase.type === 'video' ? (t.landing?.filterVideo || 'Video') : (t.landing?.filterImage || 'Image')}
        </span>
      </div>

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* 제목 */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
          {showcase.title}
        </h3>
        {showcase.ad_type && (
          <span className="text-xs text-white/60">{showcase.ad_type}</span>
        )}
      </div>

      {/* 호버 글로우 효과 */}
      <div className={cn(
        'absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none',
        'bg-gradient-to-t from-primary/20 to-transparent',
        isHovered ? 'opacity-100' : 'opacity-0'
      )} />
    </div>
  )
}
