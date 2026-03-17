'use client'

import { useRef, useCallback, useMemo } from 'react'
import { X } from 'lucide-react'
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

// 세그먼트 색상 팔레트
const SEGMENT_COLORS = [
  { bg: 'bg-violet-500/70', border: 'border-violet-400', text: 'text-violet-200' },
  { bg: 'bg-rose-500/70', border: 'border-rose-400', text: 'text-rose-200' },
  { bg: 'bg-amber-500/70', border: 'border-amber-400', text: 'text-amber-200' },
  { bg: 'bg-emerald-500/70', border: 'border-emerald-400', text: 'text-emerald-200' },
  { bg: 'bg-cyan-500/70', border: 'border-cyan-400', text: 'text-cyan-200' },
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

  // 시간 → 퍼센트 변환
  const timeToPercent = useCallback(
    (time: number) => (duration > 0 ? (time / duration) * 100 : 0),
    [duration]
  )

  // 클릭 위치 → 시간 변환
  const positionToTime = useCallback(
    (clientX: number) => {
      if (!trackRef.current || duration <= 0) return 0
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      return (x / rect.width) * duration
    },
    [duration]
  )

  // 트랙 클릭 → 재생 위치 이동
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      const time = positionToTime(e.clientX)
      onSeek(time)
    },
    [positionToTime, onSeek]
  )

  // 세그먼트 삭제
  const handleRemoveSegment = useCallback(
    (segId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onSegmentChange(segments.filter((s) => s.id !== segId))
      if (selectedSegmentId === segId) onSelectSegment(null)
    },
    [segments, onSegmentChange, selectedSegmentId, onSelectSegment]
  )

  // 시간 눈금 생성
  const ticks = useMemo(() => {
    if (duration <= 0) return []
    const step = duration <= 10 ? 1 : duration <= 30 ? 2 : duration <= 60 ? 5 : 10
    const result: number[] = []
    for (let t = 0; t <= duration; t += step) {
      result.push(t)
    }
    return result
  }, [duration])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (duration <= 0) return null

  return (
    <div className="space-y-1">
      {/* 시간 눈금 */}
      <div className="relative h-4 select-none">
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
            style={{ left: `${timeToPercent(t)}%` }}
          >
            {formatTime(t)}
          </div>
        ))}
      </div>

      {/* 타임라인 트랙 */}
      <div
        ref={trackRef}
        className="relative h-14 bg-secondary/50 rounded-lg cursor-pointer overflow-hidden border border-border/40"
        onClick={handleTrackClick}
      >
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
                'absolute top-1 bottom-1 rounded-md flex items-center justify-center transition-all',
                color.bg,
                isSelected && `ring-2 ring-white/80 ${color.border}`,
                'hover:brightness-110'
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onSelectSegment(seg.id)
              }}
            >
              {/* 세그먼트 라벨 */}
              {width > 5 && (
                <span className={cn('text-[10px] font-medium truncate px-1', color.text)}>
                  {seg.targetPersonLabel || `변환 ${i + 1}`}
                </span>
              )}

              {/* 삭제 버튼 */}
              {width > 3 && (
                <button
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                  onClick={(e) => handleRemoveSegment(seg.id, e)}
                >
                  <X className="w-2.5 h-2.5 text-white/80" />
                </button>
              )}
            </div>
          )
        })}

        {/* 재생 위치 인디케이터 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)] z-10 pointer-events-none"
          style={{ left: `${timeToPercent(currentTime)}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
        </div>
      </div>

      {/* 현재 시간 표시 */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
