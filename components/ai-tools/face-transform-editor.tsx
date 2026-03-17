'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Loader2,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Film,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { useCredits } from '@/contexts/credit-context'
import {
  KLING3_MC_STD_CREDIT_PER_SECOND,
  KLING3_MC_PRO_CREDIT_PER_SECOND,
  IMAGE_EDIT_CREDIT_COST,
} from '@/lib/credits/constants'
import VideoDropzone from './video-dropzone'
import ImageDropzone from './image-dropzone'
import Timeline, { type Segment } from './face-transform/timeline'

// ============================================================
// 상수
// ============================================================

const MIN_SEGMENT_DURATION = 3
const TIERS = ['standard', 'pro'] as const

// ============================================================
// 생성 상태 타입
// ============================================================

interface GenerationStatus {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPOSITING' | 'COMPLETED' | 'FAILED'
  progress?: string
  completedSegments?: number
  totalSegments?: number
  resultUrl?: string
  error?: string
}

// ============================================================
// 컴포넌트
// ============================================================

export default function FaceTransformEditor() {
  const { t, language } = useLanguage()
  const { credits, refreshCredits } = useCredits()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}
  const videoRef = useRef<HTMLVideoElement>(null)

  // 에디터 상태
  const [sourceVideoUrl, setSourceVideoUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [tier, setTier] = useState<typeof TIERS[number]>('standard')
  const [prompt, setPrompt] = useState('')

  // 생성 상태
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 폴링 클린업 (unmount 시)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // 선택된 세그먼트
  const selectedSegment = useMemo(
    () => segments.find((s) => s.id === selectedSegmentId) || null,
    [segments, selectedSegmentId]
  )

  // 크레딧 계산 (Kling MC + 배경 합성 Seedream Edit)
  const estimatedCredits = useMemo(() => {
    const perSecond = tier === 'pro'
      ? KLING3_MC_PRO_CREDIT_PER_SECOND['720p']
      : KLING3_MC_STD_CREDIT_PER_SECOND['720p']

    return segments.reduce((total, seg) => {
      const duration = seg.endTime - seg.startTime
      const klingCost = perSecond * Math.max(MIN_SEGMENT_DURATION, duration)
      const editCost = IMAGE_EDIT_CREDIT_COST.medium // 배경 합성 비용
      return total + klingCost + editCost
    }, 0)
  }, [segments, tier])

  // 영상 로드 핸들러
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration)
    }
  }, [])

  // 재생 위치 업데이트
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  // 시크
  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  // 세그먼트 추가
  const handleAddSegment = useCallback(() => {
    const newStart = currentTime
    const newEnd = Math.min(currentTime + 5, videoDuration)

    if (newEnd - newStart < 1) return

    // 겹침 검사
    const overlaps = segments.some(
      (seg) => newStart < seg.endTime && newEnd > seg.startTime
    )
    if (overlaps) {
      alert(aiToolsT.segmentOverlap || '다른 구간과 겹칩니다. 다른 위치를 선택하세요.')
      return
    }

    const newSegment: Segment = {
      id: `seg_${Date.now()}`,
      startTime: Math.round(newStart * 10) / 10,
      endTime: Math.round(newEnd * 10) / 10,
      targetImageUrl: null,
      targetPersonLabel: `${aiToolsT.targetPerson || '대상'} ${segments.length + 1}`,
    }

    setSegments((prev) => [...prev, newSegment])
    setSelectedSegmentId(newSegment.id)
  }, [currentTime, videoDuration, segments, aiToolsT])

  // 세그먼트 업데이트
  const updateSegment = useCallback((id: string, updates: Partial<Segment>) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg))
    )
  }, [])

  // 생성 시작
  const handleGenerate = useCallback(async () => {
    if (!sourceVideoUrl || segments.length === 0) return

    // 모든 세그먼트에 대상 이미지가 있는지 확인
    const missingImage = segments.find((s) => !s.targetImageUrl)
    if (missingImage) {
      alert(aiToolsT.targetImageRequired || '모든 변환 구간에 대상 사진이 필요합니다.')
      return
    }

    setIsGenerating(true)
    setGenerationStatus({ id: '', status: 'PENDING' })

    try {
      // 세그먼트를 시간순 정렬하고 원본 구간 자동 생성
      const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime)
      const allSegments: Array<{
        type: 'original' | 'transform'
        startTime: number
        endTime: number
        targetImageUrl?: string
      }> = []

      let lastEnd = 0
      for (const seg of sortedSegments) {
        // 이전 구간과 현재 구간 사이에 원본 구간 삽입
        if (seg.startTime > lastEnd) {
          allSegments.push({
            type: 'original',
            startTime: lastEnd,
            endTime: seg.startTime,
          })
        }
        allSegments.push({
          type: 'transform',
          startTime: seg.startTime,
          endTime: seg.endTime,
          targetImageUrl: seg.targetImageUrl!,
        })
        lastEnd = seg.endTime
      }
      // 마지막 변환 구간 이후 원본 구간
      if (lastEnd < videoDuration) {
        allSegments.push({
          type: 'original',
          startTime: lastEnd,
          endTime: videoDuration,
        })
      }

      const res = await fetch('/api/ai-tools/trending/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'face-transform',
          sourceVideoUrl,
          segments: allSegments,
          tier,
          prompt: prompt.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 402) {
          alert(aiToolsT.insufficientCredits || '크레딧이 부족합니다')
        } else {
          alert(data.error || '생성에 실패했습니다')
        }
        setIsGenerating(false)
        setGenerationStatus(null)
        return
      }

      const { id } = await res.json()
      refreshCredits()
      setGenerationStatus({ id, status: 'IN_PROGRESS', totalSegments: segments.length })

      // 폴링 시작
      startPolling(id)
    } catch (error) {
      console.error('Generation error:', error)
      setIsGenerating(false)
      setGenerationStatus(null)
    }
  }, [sourceVideoUrl, segments, tier, prompt, videoDuration, aiToolsT, refreshCredits])

  // 상태 폴링
  const startPolling = useCallback((generationId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai-tools/trending/status/${generationId}`)
        if (!res.ok) return

        const data = await res.json()
        setGenerationStatus((prev) => ({
          ...prev!,
          ...data,
          id: generationId,
        }))

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setIsGenerating(false)
          if (data.status === 'COMPLETED') {
            refreshCredits()
          }
        }
      } catch {
        // 네트워크 에러 무시, 다음 폴링에서 재시도
      }
    }, 3000)
  }, [refreshCredits])

  // 결과 다운로드
  const handleDownload = useCallback(async () => {
    if (!generationStatus?.resultUrl) return
    const a = document.createElement('a')
    a.href = generationStatus.resultUrl
    a.download = `face-transform-${Date.now()}.mp4`
    a.click()
  }, [generationStatus?.resultUrl])

  // 생성 완료/실패 시 폴링 정리
  const isComplete = generationStatus?.status === 'COMPLETED'
  const isFailed = generationStatus?.status === 'FAILED'

  return (
    <div className="flex flex-col h-full">
      {/* 상단 바 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <Link
          href={`/dashboard/ai-tools/${language}/trending`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {aiToolsT.backToList || '돌아가기'}
        </Link>

        <h1 className="text-sm font-semibold">
          {aiToolsT.faceTransform || '얼굴 변환'}
        </h1>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>{credits ?? 0}</span>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto">
        {!sourceVideoUrl ? (
          /* 영상 업로드 화면 */
          <div className="flex items-center justify-center h-full p-8">
            <div className="w-full max-w-md space-y-4">
              <div className="text-center space-y-2">
                <Film className="w-12 h-12 text-muted-foreground mx-auto" />
                <h2 className="text-lg font-semibold">
                  {aiToolsT.uploadSourceVideo || '원본 영상 업로드'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {aiToolsT.uploadSourceVideoDesc || '변환할 영상을 업로드하세요'}
                </p>
              </div>
              <VideoDropzone
                videoUrl={null}
                onVideoChange={(url) => url && setSourceVideoUrl(url)}
                label={aiToolsT.sourceVideo || '원본 영상'}
                required
              />
            </div>
          </div>
        ) : (
          /* 에디터 화면 */
          <div className="flex flex-col lg:flex-row h-full">
            {/* 좌측: 영상 프리뷰 + 타임라인 */}
            <div className="flex-1 flex flex-col p-4 min-w-0">
              {/* 영상 프리뷰 */}
              <div className="flex-1 flex items-center justify-center bg-black/50 rounded-xl overflow-hidden mb-4 min-h-[200px]">
                {isComplete && generationStatus?.resultUrl ? (
                  <video
                    src={generationStatus.resultUrl}
                    controls
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={sourceVideoUrl}
                    controls
                    onLoadedMetadata={handleVideoLoaded}
                    onTimeUpdate={handleTimeUpdate}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* 타임라인 */}
              {videoDuration > 0 && !isComplete && (
                <div className="space-y-3">
                  <Timeline
                    duration={videoDuration}
                    segments={segments}
                    currentTime={currentTime}
                    onSegmentChange={setSegments}
                    onSeek={handleSeek}
                    selectedSegmentId={selectedSegmentId}
                    onSelectSegment={setSelectedSegmentId}
                  />

                  {/* 구간 추가 버튼 */}
                  {!isGenerating && (
                    <button
                      onClick={handleAddSegment}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {aiToolsT.addTransformSegment || '변환 구간 추가'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 우측: 설정 패널 */}
            <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border/40 p-4 overflow-y-auto space-y-4">
              {/* 생성 결과 */}
              {(isComplete || isFailed) && (
                <div className={cn(
                  'p-4 rounded-xl border',
                  isComplete ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {isComplete
                        ? (aiToolsT.generationComplete || '생성 완료!')
                        : (aiToolsT.generationFailed || '생성 실패')}
                    </span>
                  </div>
                  {isComplete && (
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4" />
                      {aiToolsT.download || '다운로드'}
                    </button>
                  )}
                  {isFailed && (
                    <p className="text-xs text-red-400 mt-1">
                      {generationStatus?.error}
                    </p>
                  )}
                </div>
              )}

              {/* 생성 진행 상태 */}
              {isGenerating && generationStatus && !isComplete && !isFailed && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      {generationStatus.status === 'COMPOSITING'
                        ? (aiToolsT.compositing || '영상 합성 중...')
                        : (aiToolsT.generating || '생성 중...')}
                    </span>
                  </div>
                  {generationStatus.progress && generationStatus.status === 'IN_PROGRESS' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{aiToolsT.segmentProgress?.replace('{current}', String(generationStatus.completedSegments || 0)).replace('{total}', String(generationStatus.totalSegments || 0)) || `${generationStatus.completedSegments || 0}/${generationStatus.totalSegments || 0}`}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{
                            width: `${generationStatus.totalSegments
                              ? ((generationStatus.completedSegments || 0) / generationStatus.totalSegments) * 100
                              : 10}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 세그먼트 목록 */}
              {!isComplete && segments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {aiToolsT.transformSegments || '변환 구간'}
                  </h3>
                  {segments.map((seg, i) => (
                    <div
                      key={seg.id}
                      className={cn(
                        'p-3 rounded-xl border transition-colors cursor-pointer',
                        selectedSegmentId === seg.id
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/40 hover:border-border/60'
                      )}
                      onClick={() => setSelectedSegmentId(seg.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">
                          {seg.targetPersonLabel || `${aiToolsT.targetPerson || '대상'} ${i + 1}`}
                        </span>
                        {!isGenerating && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSegments((prev) => prev.filter((s) => s.id !== seg.id))
                              if (selectedSegmentId === seg.id) setSelectedSegmentId(null)
                            }}
                            className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* 시간 범위 */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">
                            {aiToolsT.segmentStart || '시작'}
                          </label>
                          <input
                            type="number"
                            value={seg.startTime}
                            onChange={(e) => updateSegment(seg.id, { startTime: parseFloat(e.target.value) || 0 })}
                            step={0.1}
                            min={0}
                            max={seg.endTime - 1}
                            disabled={isGenerating}
                            className="w-full px-2 py-1 text-xs bg-secondary/50 border border-border/60 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">
                            {aiToolsT.segmentEnd || '종료'}
                          </label>
                          <input
                            type="number"
                            value={seg.endTime}
                            onChange={(e) => updateSegment(seg.id, { endTime: parseFloat(e.target.value) || 0 })}
                            step={0.1}
                            min={seg.startTime + 1}
                            max={videoDuration}
                            disabled={isGenerating}
                            className="w-full px-2 py-1 text-xs bg-secondary/50 border border-border/60 rounded-md"
                          />
                        </div>
                      </div>

                      {/* 대상 사진 업로드 */}
                      <ImageDropzone
                        imageUrl={seg.targetImageUrl}
                        onImageChange={(url) => updateSegment(seg.id, { targetImageUrl: url })}
                        label={aiToolsT.targetPerson || '변환 대상 사진'}
                        required
                      />

                      {/* 최소 3초 안내 */}
                      {seg.endTime - seg.startTime < MIN_SEGMENT_DURATION && (
                        <p className="text-[10px] text-amber-500 mt-1">
                          {aiToolsT.minimumDuration || `최소 ${MIN_SEGMENT_DURATION}초 기준으로 크레딧이 소모됩니다`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 설정 */}
              {!isComplete && (
                <div className="space-y-3">
                  {/* 프롬프트 */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      {aiToolsT.prompt || '프롬프트'} ({aiToolsT.optional || '선택'})
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={aiToolsT.faceTransformPromptPlaceholder || '변환 스타일을 설명하세요...'}
                      rows={2}
                      disabled={isGenerating}
                      className="w-full mt-1 px-3 py-2 text-xs bg-secondary/50 border border-border/60 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  {/* 티어 선택 */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      {aiToolsT.tier || '모델 등급'}
                    </label>
                    <div className="flex gap-2 mt-1">
                      {TIERS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTier(t)}
                          disabled={isGenerating}
                          className={cn(
                            'flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors',
                            tier === t
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                          )}
                        >
                          {t === 'standard' ? (aiToolsT.tierStandard || 'Standard') : (aiToolsT.tierPro || 'Pro')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 생성 버튼 */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || segments.length === 0 || segments.some((s) => !s.targetImageUrl)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-purple-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {aiToolsT.generating || '생성 중...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {`${aiToolsT.generate || '생성하기'} (~${estimatedCredits} ${aiToolsT.credits || '크레딧'})`}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
