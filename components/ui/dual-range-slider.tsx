/**
 * 듀얼 레인지 슬라이더 컴포넌트
 *
 * 시작/끝 시간 선택용 두 개의 핸들이 있는 슬라이더
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DualRangeSliderLabels {
  selected?: string
  start?: string
  end?: string
}

interface DualRangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  step?: number
  formatLabel?: (value: number) => string
  className?: string
  disabled?: boolean
  labels?: DualRangeSliderLabels
}

export function DualRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  formatLabel = (v) => v.toString(),
  className,
  disabled = false,
  labels = {},
}: DualRangeSliderProps) {
  const { selected = 'selected', start = 'Start', end = 'End' } = labels
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

  // 시간 포맷 함수 (MM:SS)
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 값을 퍼센트로 변환
  const valueToPercent = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max]
  )

  // 퍼센트를 값으로 변환
  const percentToValue = useCallback(
    (percent: number) => {
      const rawValue = min + (percent / 100) * (max - min)
      return Math.round(rawValue / step) * step
    },
    [min, max, step]
  )

  // 마우스/터치 위치를 퍼센트로 변환
  const getPercentFromEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0
      const rect = trackRef.current.getBoundingClientRect()
      const percent = ((clientX - rect.left) / rect.width) * 100
      return Math.max(0, Math.min(100, percent))
    },
    []
  )

  // 드래그 핸들러
  const handleMove = useCallback(
    (clientX: number) => {
      if (!dragging || disabled) return

      const percent = getPercentFromEvent(clientX)
      const newValue = percentToValue(percent)

      if (dragging === 'start') {
        // 시작 핸들: 끝 값보다 작아야 함
        const clampedValue = Math.min(newValue, value[1] - step)
        if (clampedValue !== value[0]) {
          onChange([Math.max(min, clampedValue), value[1]])
        }
      } else {
        // 끝 핸들: 시작 값보다 커야 함
        const clampedValue = Math.max(newValue, value[0] + step)
        if (clampedValue !== value[1]) {
          onChange([value[0], Math.min(max, clampedValue)])
        }
      }
    },
    [dragging, disabled, getPercentFromEvent, percentToValue, value, step, min, max, onChange]
  )

  // 마우스 이벤트
  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleMouseUp = () => setDragging(null)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, handleMove])

  // 터치 이벤트
  useEffect(() => {
    if (!dragging) return

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX)
      }
    }
    const handleTouchEnd = () => setDragging(null)

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragging, handleMove])

  const startPercent = valueToPercent(value[0])
  const endPercent = valueToPercent(value[1])

  return (
    <div className={cn('w-full', className)}>
      {/* 라벨 */}
      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
        <span>{formatLabel(value[0])}</span>
        <span className="text-foreground font-medium">
          {formatTime(value[1] - value[0])} {selected}
        </span>
        <span>{formatLabel(value[1])}</span>
      </div>

      {/* 슬라이더 트랙 */}
      <div
        ref={trackRef}
        className={cn(
          'relative h-2 bg-secondary rounded-full cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={(e) => {
          if (disabled) return
          const percent = getPercentFromEvent(e.clientX)
          const clickValue = percentToValue(percent)
          // 클릭한 위치에 가까운 핸들을 이동
          const distToStart = Math.abs(clickValue - value[0])
          const distToEnd = Math.abs(clickValue - value[1])
          if (distToStart < distToEnd) {
            onChange([Math.min(clickValue, value[1] - step), value[1]])
          } else {
            onChange([value[0], Math.max(clickValue, value[0] + step)])
          }
        }}
      >
        {/* 선택된 범위 */}
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />

        {/* 시작 핸들 */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full shadow-md cursor-grab border-2 border-white',
            dragging === 'start' && 'cursor-grabbing scale-110',
            disabled && 'cursor-not-allowed'
          )}
          style={{ left: `${startPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation()
            if (!disabled) setDragging('start')
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            if (!disabled) setDragging('start')
          }}
        />

        {/* 끝 핸들 */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full shadow-md cursor-grab border-2 border-white',
            dragging === 'end' && 'cursor-grabbing scale-110',
            disabled && 'cursor-not-allowed'
          )}
          style={{ left: `${endPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation()
            if (!disabled) setDragging('end')
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            if (!disabled) setDragging('end')
          }}
        />
      </div>

      {/* 시간 입력 필드 */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">{start}</label>
          <input
            type="number"
            min={min}
            max={value[1] - step}
            step={step}
            value={value[0]}
            onChange={(e) => {
              const newStart = Math.max(min, Math.min(Number(e.target.value), value[1] - step))
              onChange([newStart, value[1]])
            }}
            disabled={disabled}
            className="w-full px-2 py-1 text-sm bg-secondary border border-border rounded text-foreground disabled:opacity-50"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">{end}</label>
          <input
            type="number"
            min={value[0] + step}
            max={max}
            step={step}
            value={value[1]}
            onChange={(e) => {
              const newEnd = Math.min(max, Math.max(Number(e.target.value), value[0] + step))
              onChange([value[0], newEnd])
            }}
            disabled={disabled}
            className="w-full px-2 py-1 text-sm bg-secondary border border-border rounded text-foreground disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}
