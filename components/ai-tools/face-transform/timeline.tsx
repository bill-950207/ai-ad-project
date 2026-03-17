'use client'

import { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

// ============================================================
// 타입
// ============================================================

export interface Segment {
  id: string
  startTime: number
  endTime: number
  targetImageUrl: string | null
  targetPersonLabel?: string
}

interface TimelineProps {
  duration: number
  segments: Segment[]
  currentTime: number
  onSegmentChange: (segments: Segment[]) => void
  onSeek: (time: number) => void
  selectedSegmentId: string | null
  onSelectSegment: (id: string | null) => void
}

const SEGMENT_COLORS = [
  { bg: 'from-violet-500/80 to-violet-600/80', ring: 'ring-violet-400', glow: 'shadow-violet-500/30' },
  { bg: 'from-rose-500/80 to-rose-600/80', ring: 'ring-rose-400', glow: 'shadow-rose-500/30' },
  { bg: 'from-amber-500/80 to-amber-600/80', ring: 'ring-amber-400', glow: 'shadow-amber-500/30' },
  { bg: 'from-emerald-500/80 to-emerald-600/80', ring: 'ring-emerald-400', glow: 'shadow-emerald-500/30' },
  { bg: 'from-cyan-500/80 to-cyan-600/80', ring: 'ring-cyan-400', glow: 'shadow-cyan-500/30' },
]

const MIN_DURATION = 1 // 최소 구간 1초

type DragMode = null | { segId: string; type: 'move' | 'resize-left' | 'resize-right'; startX: number; origStart: number; origEnd: number }

// ============================================================
// 타임라인 컴포넌트
// ============================================================

export default function Timeline({
  duration,
  segments,
  currentTime,
  onSegmentChange,
  onSeek,
  selectedSegmentId,
  onSelectSegment,
}: TimelineProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  const trackRef = useRef<HTMLDivElement>(null)
  const [dragMode, setDragMode] = useState<DragMode>(null)

  const timeToPercent = useCallback(
    (time: number) => (duration > 0 ? (time / duration) * 100 : 0),
    [duration]
  )

  const positionToTime = useCallback(
    (clientX: number) => {
      if (!trackRef.current || duration <= 0) return 0
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      return (x / rect.width) * duration
    },
    [duration]
  )

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragMode) return // 드래그 중이면 시크 무시
      onSeek(positionToTime(e.clientX))
    },
    [positionToTime, onSeek, dragMode]
  )

  const handleRemoveSegment = useCallback(
    (segId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onSegmentChange(segments.filter((s) => s.id !== segId))
      if (selectedSegmentId === segId) onSelectSegment(null)
    },
    [segments, onSegmentChange, selectedSegmentId, onSelectSegment]
  )

  // ============================================================
  // 드래그 핸들러 — 이동 + 좌우 리사이즈
  // ============================================================

  const handleDragStart = useCallback(
    (segId: string, type: 'move' | 'resize-left' | 'resize-right', e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      const seg = segments.find((s) => s.id === segId)
      if (!seg) return
      setDragMode({ segId, type, startX: e.clientX, origStart: seg.startTime, origEnd: seg.endTime })
      onSelectSegment(segId)
    },
    [segments, onSelectSegment]
  )

  useEffect(() => {
    if (!dragMode) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current || !dragMode) return
      const rect = trackRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragMode.startX
      const deltaTime = (deltaX / rect.width) * duration

      const round = (t: number) => Math.round(t * 10) / 10

      // 다른 세그먼트와의 겹침 검사용
      const others = segments.filter((s) => s.id !== dragMode.segId)

      let newStart = dragMode.origStart
      let newEnd = dragMode.origEnd

      if (dragMode.type === 'move') {
        const segDuration = dragMode.origEnd - dragMode.origStart
        newStart = round(Math.max(0, Math.min(dragMode.origStart + deltaTime, duration - segDuration)))
        newEnd = round(newStart + segDuration)
      } else if (dragMode.type === 'resize-left') {
        newStart = round(Math.max(0, Math.min(dragMode.origStart + deltaTime, dragMode.origEnd - MIN_DURATION)))
        newEnd = dragMode.origEnd
      } else if (dragMode.type === 'resize-right') {
        newStart = dragMode.origStart
        newEnd = round(Math.max(dragMode.origStart + MIN_DURATION, Math.min(dragMode.origEnd + deltaTime, duration)))
      }

      // 겹침 방지
      const overlaps = others.some((s) => newStart < s.endTime && newEnd > s.startTime)
      if (overlaps) return

      onSegmentChange(
        segments.map((s) =>
          s.id === dragMode.segId ? { ...s, startTime: newStart, endTime: newEnd } : s
        )
      )
    }

    const handleMouseUp = () => {
      setDragMode(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragMode, duration, segments, onSegmentChange])

  const ticks = useMemo(() => {
    if (duration <= 0) return []
    const step = duration <= 10 ? 1 : duration <= 30 ? 2 : duration <= 60 ? 5 : 10
    const result: number[] = []
    for (let t = 0; t <= duration; t += step) result.push(t)
    return result
  }, [duration])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (duration <= 0) return null

  return (
    <div className="space-y-1.5 select-none">
      {/* 시간 눈금 */}
      <div className="relative h-5">
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute flex flex-col items-center -translate-x-1/2"
            style={{ left: `${timeToPercent(t)}%` }}
          >
            <div className="w-px h-1.5 bg-white/20" />
            <span className="text-[9px] tabular-nums text-white/40 mt-0.5">
              {formatTime(t)}
            </span>
          </div>
        ))}
      </div>

      {/* 타임라인 트랙 */}
      <div
        ref={trackRef}
        className="relative h-16 bg-white/[0.03] rounded-lg cursor-pointer border border-white/[0.06] backdrop-blur-sm"
        onClick={handleTrackClick}
      >
        {/* 재생 진행 배경 */}
        <div
          className="absolute inset-y-0 left-0 bg-white/[0.04] rounded-l-lg transition-[width] duration-75"
          style={{ width: `${timeToPercent(currentTime)}%` }}
        />

        {/* 세그먼트 블록 */}
        {segments.map((seg, i) => {
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length]
          const left = timeToPercent(seg.startTime)
          const width = timeToPercent(seg.endTime - seg.startTime)
          const isSelected = selectedSegmentId === seg.id
          const isDragging = dragMode?.segId === seg.id

          return (
            <div
              key={seg.id}
              className={cn(
                'absolute top-1.5 bottom-1.5 rounded-md flex items-center gap-1 transition-all',
                isDragging ? 'duration-0' : 'duration-200',
                `bg-gradient-to-b ${color.bg}`,
                'border border-white/20',
                'backdrop-blur-sm',
                isSelected && `ring-1 ${color.ring} shadow-lg ${color.glow}`,
                !isDragging && 'hover:brightness-110 hover:border-white/30'
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onSelectSegment(seg.id)
              }}
            >
              {/* 좌측 리사이즈 핸들 */}
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 group"
                onMouseDown={(e) => handleDragStart(seg.id, 'resize-left', e)}
              >
                <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* 중앙 드래그 영역 (이동) */}
              <div
                className="flex-1 flex items-center gap-1 px-1.5 cursor-grab active:cursor-grabbing min-w-0"
                onMouseDown={(e) => handleDragStart(seg.id, 'move', e)}
              >
                {/* 세그먼트 인물 썸네일 */}
                {seg.targetImageUrl ? (
                  <img
                    src={seg.targetImageUrl}
                    alt=""
                    className="w-7 h-7 rounded object-cover border border-white/20 shrink-0 pointer-events-none"
                  />
                ) : (
                  <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-white/50" />
                  </div>
                )}

                {/* 라벨 */}
                {width > 8 && (
                  <span className="text-[10px] font-medium text-white/90 truncate pointer-events-none">
                    {seg.targetPersonLabel || `${aiToolsT.transformTarget || '변환'} ${i + 1}`}
                  </span>
                )}
              </div>

              {/* 우측 리사이즈 핸들 */}
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 group"
                onMouseDown={(e) => handleDragStart(seg.id, 'resize-right', e)}
              >
                <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* 삭제 */}
              {width > 4 && (
                <button
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/60 border border-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors z-20"
                  onClick={(e) => handleRemoveSegment(seg.id, e)}
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              )}
            </div>
          )
        })}

        {/* 재생 위치 인디케이터 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
          style={{ left: `${timeToPercent(currentTime)}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-white rounded-sm shadow-lg shadow-white/20" />
          <div className="absolute inset-0 bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
        </div>
      </div>

      {/* 하단 시간 */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] tabular-nums text-white/50">{formatTime(currentTime)}</span>
        <div className="flex items-center gap-1.5">
          {segments.length > 0 && (
            <span className="text-[10px] text-violet-400/80">
              {segments.length}{aiToolsT.segmentCount || '개 구간'}
            </span>
          )}
        </div>
        <span className="text-[10px] tabular-nums text-white/50">{formatTime(duration)}</span>
      </div>
    </div>
  )
}
