'use client'

import { useRef, useCallback, useMemo } from 'react'
import { X, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const trackRef = useRef<HTMLDivElement>(null)

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
      onSeek(positionToTime(e.clientX))
    },
    [positionToTime, onSeek]
  )

  const handleRemoveSegment = useCallback(
    (segId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onSegmentChange(segments.filter((s) => s.id !== segId))
      if (selectedSegmentId === segId) onSelectSegment(null)
    },
    [segments, onSegmentChange, selectedSegmentId, onSelectSegment]
  )

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
    <div className="space-y-1.5">
      {/* 시간 눈금 */}
      <div className="relative h-5 select-none">
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

          return (
            <div
              key={seg.id}
              className={cn(
                'absolute top-1.5 bottom-1.5 rounded-md flex items-center gap-1 px-1.5 transition-all duration-200',
                `bg-gradient-to-b ${color.bg}`,
                'border border-white/20',
                'backdrop-blur-sm',
                isSelected && `ring-1 ${color.ring} shadow-lg ${color.glow}`,
                'hover:brightness-110 hover:border-white/30'
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onSelectSegment(seg.id)
              }}
            >
              {/* 세그먼트 인물 썸네일 */}
              {seg.targetImageUrl ? (
                <img
                  src={seg.targetImageUrl}
                  alt=""
                  className="w-7 h-7 rounded object-cover border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-white/50" />
                </div>
              )}

              {/* 라벨 */}
              {width > 8 && (
                <span className="text-[10px] font-medium text-white/90 truncate">
                  {seg.targetPersonLabel || `변환 ${i + 1}`}
                </span>
              )}

              {/* 삭제 */}
              {width > 4 && (
                <button
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/60 border border-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors"
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
          {/* 상단 핸들 */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-white rounded-sm shadow-lg shadow-white/20" />
          {/* 라인 */}
          <div className="absolute inset-0 bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
        </div>
      </div>

      {/* 하단 시간 */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] tabular-nums text-white/50">{formatTime(currentTime)}</span>
        <div className="flex items-center gap-1.5">
          {segments.length > 0 && (
            <span className="text-[10px] text-violet-400/80">
              {segments.length}개 구간
            </span>
          )}
        </div>
        <span className="text-[10px] tabular-nums text-white/50">{formatTime(duration)}</span>
      </div>
    </div>
  )
}
