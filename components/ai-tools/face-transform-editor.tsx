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
  MousePointer2,
  ImagePlus,
  X,
  User,
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

  // UX: 인라인 에러 메시지 (alert 대체)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!errorMsg) return
    const timer = setTimeout(() => setErrorMsg(null), 4000)
    return () => clearTimeout(timer)
  }, [errorMsg])

  // UX: 온보딩 가이드 (세그먼트 0개 + 영상 업로드됨)
  const [showGuide, setShowGuide] = useState(true)

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

    return Math.ceil(segments.reduce((total, seg) => {
      const duration = seg.endTime - seg.startTime
      const klingCost = perSecond * Math.max(MIN_SEGMENT_DURATION, duration)
      const editCost = IMAGE_EDIT_CREDIT_COST.medium
      return total + klingCost + editCost
    }, 0))
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
    const newEnd = Math.min(currentTime + 3, videoDuration)

    if (newEnd - newStart < 1) return

    // 겹침 검사
    const overlaps = segments.some(
      (seg) => newStart < seg.endTime && newEnd > seg.startTime
    )
    if (overlaps) {
      setErrorMsg(aiToolsT.segmentOverlap || '다른 구간과 겹칩니다. 다른 위치를 선택하세요.')
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
      setErrorMsg(aiToolsT.targetImageRequired || '모든 변환 구간에 대상 사진이 필요합니다.')
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
          setErrorMsg(aiToolsT.insufficientCredits || '크레딧이 부족합니다')
        } else {
          setErrorMsg(data.error || '생성에 실패했습니다')
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

  // 초기화 (새로 만들기)
  const handleReset = useCallback(() => {
    setSourceVideoUrl(null)
    setVideoDuration(0)
    setCurrentTime(0)
    setSegments([])
    setSelectedSegmentId(null)
    setGenerationStatus(null)
    setIsGenerating(false)
    setShowGuide(true)
    setPrompt('')
    if (pollingRef.current) clearInterval(pollingRef.current)
  }, [])

  // 다시 시도 (에디터로 돌아가기)
  const handleRetry = useCallback(() => {
    setGenerationStatus(null)
    setIsGenerating(false)
  }, [])

  const isComplete = generationStatus?.status === 'COMPLETED'
  const isFailed = generationStatus?.status === 'FAILED'
  const isProcessing = isGenerating || isComplete || isFailed

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* 상단 바 — 글래스모피즘 */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <Link
          href={`/dashboard/ai-tools/${language}/trending`}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {aiToolsT.backToList || '돌아가기'}
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          <h1 className="text-xs font-semibold tracking-wide text-white/80">
            {aiToolsT.faceTransform || '얼굴 변환'}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-xs tabular-nums text-white/60">{credits ?? 0}</span>
        </div>
      </header>

      {/* 인라인 에러 토스트 */}
      {errorMsg && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-red-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-xl shadow-lg shadow-red-500/20 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="ml-1 p-0.5 hover:bg-white/20 rounded transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto">
        {!sourceVideoUrl ? (
          // ──── 업로드 화면 ────
          <div className="flex items-center justify-center h-full p-8">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Film className="w-7 h-7 text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-white/90">
                  {aiToolsT.uploadSourceVideo || '원본 영상 업로드'}
                </h2>
                <p className="text-sm text-white/40 leading-relaxed">
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
        ) : isProcessing ? (
          // ──── 생성 진행/완료/실패 화면 ────
          <div className="flex items-center justify-center h-full p-6">
            <div className="w-full max-w-lg space-y-8">
              {/* 완료 */}
              {isComplete && generationStatus?.resultUrl ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white/90">{aiToolsT.generationComplete || '변환 완료!'}</h2>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                    <video src={generationStatus.resultUrl} controls autoPlay className="w-full" />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {aiToolsT.download || '다운로드'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-sm font-medium rounded-xl border border-white/[0.08] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      새로 만들기
                    </button>
                  </div>
                </div>

              ) : isFailed ? (
                /* 실패 */
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white/90">{aiToolsT.generationFailed || '생성 실패'}</h2>
                    <p className="text-sm text-red-400/70">{generationStatus?.error}</p>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-sm font-medium rounded-xl border border-white/[0.08] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    에디터로 돌아가기
                  </button>
                </div>

              ) : (
                /* 진행 중 */
                <div className="space-y-8">
                  {/* 로딩 아이콘 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                      <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-xl" />
                    </div>
                  </div>

                  {/* 상태 텍스트 */}
                  <div className="text-center space-y-1">
                    <h2 className="text-base font-semibold text-white/90">
                      {generationStatus?.status === 'COMPOSITING'
                        ? '영상을 합성하고 있습니다'
                        : generationStatus?.status === 'IN_PROGRESS'
                        ? 'AI가 영상을 변환하고 있습니다'
                        : '생성 준비 중...'}
                    </h2>
                    <p className="text-xs text-white/30">잠시만 기다려주세요. 변환이 완료되면 바로 알려드립니다.</p>
                  </div>

                  {/* 진행률 바 */}
                  <div className="space-y-2">
                    <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-1000"
                        style={{
                          width: `${generationStatus?.status === 'COMPOSITING' ? 90
                            : generationStatus?.totalSegments
                            ? Math.max(5, ((generationStatus.completedSegments || 0) / generationStatus.totalSegments) * 80)
                            : 5}%`,
                        }}
                      />
                      {/* 쉬머 효과 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer 2s linear infinite' }} />
                    </div>
                    <div className="flex justify-end text-[11px]">
                      <span className="text-white/30">{tier === 'pro' ? 'Pro' : 'Standard'} · ~{estimatedCredits}cr</span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        ) : (
          /* ──── 에디터 — 2단 레이아웃 ──── */
          <div className="flex flex-col lg:flex-row h-full">
            {/* 좌측: 프리뷰 + 타임라인 */}
            <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">
              {/* 영상 프리뷰 */}
              <div className="flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden border border-white/[0.04] min-h-[200px]">
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

              {/* 온보딩 가이드 — 세그먼트 없을 때 */}
              {showGuide && segments.length === 0 && videoDuration > 0 && !isComplete && (
                <div className="p-4 bg-violet-500/5 border border-violet-500/15 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-white/80">사용 방법</h3>
                    <button onClick={() => setShowGuide(false)} className="p-0.5 text-white/30 hover:text-white/60 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MousePointer2 className="w-3 h-3 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/70">영상에서 변환할 시점으로 이동</p>
                        <p className="text-[11px] text-white/30">영상을 재생하거나 드래그하여 원하는 위치로 이동하세요</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Plus className="w-3 h-3 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/70">변환 구간 추가</p>
                        <p className="text-[11px] text-white/30">아래 버튼을 클릭하면 현재 위치에 3초 구간이 추가됩니다</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <ImagePlus className="w-3 h-3 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/70">변환할 사람 사진 업로드</p>
                        <p className="text-[11px] text-white/30">우측 패널에서 각 구간에 대상 사진을 업로드하세요</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 타임라인 */}
              {videoDuration > 0 && !isComplete && (
                <div className="space-y-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <Timeline
                    duration={videoDuration}
                    segments={segments}
                    currentTime={currentTime}
                    onSegmentChange={setSegments}
                    onSeek={handleSeek}
                    selectedSegmentId={selectedSegmentId}
                    onSelectSegment={setSelectedSegmentId}
                  />

                  {!isGenerating && segments.length === 0 ? (
                    /* 세그먼트 0개: 대형 CTA + 가이드 */
                    <button
                      onClick={() => { setShowGuide(false); handleAddSegment() }}
                      className="w-full flex flex-col items-center gap-2 px-4 py-5 bg-violet-500/10 hover:bg-violet-500/15 border-2 border-dashed border-violet-500/30 hover:border-violet-500/50 rounded-xl transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 group-hover:bg-violet-500/30 flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-violet-300">
                          {aiToolsT.addTransformSegment || '변환 구간 추가'}
                        </p>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          현재 재생 위치에 3초 변환 구간이 추가됩니다
                        </p>
                      </div>
                    </button>
                  ) : !isGenerating && (
                    <button
                      onClick={handleAddSegment}
                      className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-violet-300 hover:text-violet-200 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {aiToolsT.addTransformSegment || '변환 구간 추가'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 우측: 설정 패널 */}
            <div className="w-full lg:w-80 xl:w-[22rem] border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-white/[0.01] p-4 overflow-y-auto space-y-4">
              {/* 생성 결과 */}
              {(isComplete || isFailed) && (
                <div className={cn(
                  'p-4 rounded-xl border backdrop-blur-sm',
                  isComplete
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    {isComplete ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      </div>
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {aiToolsT.download || '다운로드'}
                    </button>
                  )}
                  {isFailed && (
                    <p className="text-xs text-red-400/80 mt-1">{generationStatus?.error}</p>
                  )}
                </div>
              )}

              {/* 생성 진행 상태 */}
              {isGenerating && generationStatus && !isComplete && !isFailed && (
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                      <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-md" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white/90">
                        {generationStatus.status === 'COMPOSITING'
                          ? (aiToolsT.compositing || '영상 합성 중...')
                          : (aiToolsT.generating || '생성 중...')}
                      </span>
                      {generationStatus.progress && generationStatus.status === 'IN_PROGRESS' && (
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {`${generationStatus.completedSegments || 0}/${generationStatus.totalSegments || 0} 구간 완료`}
                        </p>
                      )}
                    </div>
                  </div>
                  {generationStatus.totalSegments && (
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${generationStatus.status === 'COMPOSITING' ? 90 :
                            generationStatus.totalSegments
                              ? ((generationStatus.completedSegments || 0) / generationStatus.totalSegments) * 80
                              : 10}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 세그먼트 목록 */}
              {!isComplete && segments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
                    {aiToolsT.transformSegments || '변환 구간'}
                  </h3>
                  {segments.map((seg, i) => (
                    <div
                      key={seg.id}
                      className={cn(
                        'p-3 rounded-xl border transition-all duration-200 cursor-pointer',
                        selectedSegmentId === seg.id
                          ? 'border-violet-500/40 bg-violet-500/5 shadow-lg shadow-violet-500/5'
                          : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
                      )}
                      onClick={() => setSelectedSegmentId(seg.id)}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-300">
                            {i + 1}
                          </div>
                          <span className="text-xs font-medium text-white/80">
                            {seg.targetPersonLabel || `${aiToolsT.targetPerson || '대상'} ${i + 1}`}
                          </span>
                        </div>
                        {!isGenerating && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSegments((prev) => prev.filter((s) => s.id !== seg.id))
                              if (selectedSegmentId === seg.id) setSelectedSegmentId(null)
                            }}
                            className="p-1 text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* 시간 범위 */}
                      <div className="grid grid-cols-2 gap-2 mb-2.5">
                        <div>
                          <label className="text-[10px] text-white/30 mb-0.5 block">{aiToolsT.segmentStart || '시작'}</label>
                          <input
                            type="number"
                            value={seg.startTime}
                            onChange={(e) => updateSegment(seg.id, { startTime: parseFloat(e.target.value) || 0 })}
                            step={0.1}
                            min={0}
                            max={seg.endTime - 1}
                            disabled={isGenerating}
                            className="w-full px-2 py-1.5 text-xs tabular-nums bg-white/[0.03] border border-white/[0.08] rounded-lg text-white/80 focus:outline-none focus:border-violet-500/40"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/30 mb-0.5 block">{aiToolsT.segmentEnd || '종료'}</label>
                          <input
                            type="number"
                            value={seg.endTime}
                            onChange={(e) => updateSegment(seg.id, { endTime: parseFloat(e.target.value) || 0 })}
                            step={0.1}
                            min={seg.startTime + 1}
                            max={videoDuration}
                            disabled={isGenerating}
                            className="w-full px-2 py-1.5 text-xs tabular-nums bg-white/[0.03] border border-white/[0.08] rounded-lg text-white/80 focus:outline-none focus:border-violet-500/40"
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

                      {seg.endTime - seg.startTime < MIN_SEGMENT_DURATION && (
                        <p className="text-[10px] text-amber-400/60 mt-1.5">
                          {aiToolsT.minimumDuration || `최소 ${MIN_SEGMENT_DURATION}초 기준으로 크레딧이 소모됩니다`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 설정 */}
              {!isComplete && (
                <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                  {/* 프롬프트 */}
                  <div>
                    <label className="text-[11px] font-medium text-white/30">
                      {aiToolsT.prompt || '프롬프트'} ({aiToolsT.optional || '선택'})
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={aiToolsT.faceTransformPromptPlaceholder || '변환 스타일을 설명하세요...'}
                      rows={2}
                      disabled={isGenerating}
                      className="w-full mt-1.5 px-3 py-2 text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg resize-none text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                    />
                  </div>

                  {/* 티어 선택 */}
                  <div>
                    <label className="text-[11px] font-medium text-white/30">
                      {aiToolsT.tier || '모델 등급'}
                    </label>
                    <div className="flex gap-1.5 mt-1.5">
                      {TIERS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTier(t)}
                          disabled={isGenerating}
                          className={cn(
                            'flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200',
                            tier === t
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                              : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]'
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
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

                  {/* 생성 버튼 아래 안내 */}
                  {!isGenerating && segments.length === 0 && (
                    <p className="text-[11px] text-white/25 text-center">
                      변환 구간을 먼저 추가해주세요
                    </p>
                  )}
                  {!isGenerating && segments.length > 0 && segments.some((s) => !s.targetImageUrl) && (
                    <p className="text-[11px] text-amber-400/60 text-center">
                      모든 구간에 변환할 사람의 사진을 업로드해주세요
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 애니메이션 */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.6)); }
        }
        @keyframes dot-flow {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  )
}
