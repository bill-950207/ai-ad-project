/**
 * 워크플로우 소개 섹션
 *
 * 이미지 광고와 영상 광고 생성 과정을 간략하게 소개합니다.
 * - 탭으로 이미지/영상 전환
 * - 3단계 간단한 프로세스 강조
 */

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  Image as ImageIcon,
  Video,
  Upload,
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  MousePointerClick,
  Download
} from 'lucide-react'

// ============================================================
// 타입 정의
// ============================================================

interface WorkflowStep {
  icon: React.ReactNode
  title: string
  description: string
  time: string
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function WorkflowSection() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image')

  // 이미지 광고 워크플로우
  const imageWorkflow: WorkflowStep[] = [
    {
      icon: <Upload className="w-5 h-5" />,
      title: t.workflow.imageSteps.step1Title,
      description: t.workflow.imageSteps.step1Desc,
      time: t.workflow.imageSteps.step1Time,
    },
    {
      icon: <MousePointerClick className="w-5 h-5" />,
      title: t.workflow.imageSteps.step2Title,
      description: t.workflow.imageSteps.step2Desc,
      time: t.workflow.imageSteps.step2Time,
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: t.workflow.imageSteps.step3Title,
      description: t.workflow.imageSteps.step3Desc,
      time: t.workflow.imageSteps.step3Time,
    },
  ]

  // 영상 광고 워크플로우
  const videoWorkflow: WorkflowStep[] = [
    {
      icon: <Upload className="w-5 h-5" />,
      title: t.workflow.videoSteps.step1Title,
      description: t.workflow.videoSteps.step1Desc,
      time: t.workflow.videoSteps.step1Time,
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: t.workflow.videoSteps.step2Title,
      description: t.workflow.videoSteps.step2Desc,
      time: t.workflow.videoSteps.step2Time,
    },
    {
      icon: <Video className="w-5 h-5" />,
      title: t.workflow.videoSteps.step3Title,
      description: t.workflow.videoSteps.step3Desc,
      time: t.workflow.videoSteps.step3Time,
    },
  ]

  const currentWorkflow = activeTab === 'image' ? imageWorkflow : videoWorkflow
  const totalTime = activeTab === 'image' ? t.workflow.imageTime : t.workflow.videoTime

  return (
    <section id="workflow" className="px-4 py-20 sm:py-24 bg-secondary/30">
      <div className="mx-auto max-w-5xl">
        {/* 섹션 헤더 - AI 강조 제거 */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground">
            {t.workflow.title}
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground text-lg">
            {t.workflow.subtitle}
          </p>
        </div>

        {/* 탭 전환 */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 rounded-lg bg-secondary/50 border border-border">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                activeTab === 'image'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              {t.workflow.imageAd}
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                activeTab === 'video'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Video className="w-4 h-4" />
              {t.workflow.videoAd}
            </button>
          </div>
        </div>

        {/* 워크플로우 스텝 */}
        <div className="relative">
          {/* 연결선 (데스크톱) */}
          <div className="hidden md:block absolute top-1/2 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-border -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentWorkflow.map((step, index) => (
              <div key={index} className="relative">
                {/* 스텝 카드 */}
                <div className="relative bg-card border border-border rounded-xl p-5 h-full">
                  {/* 스텝 번호 */}
                  <div className="absolute -top-3 -left-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {index + 1}
                  </div>

                  {/* 소요 시간 */}
                  <div className="absolute -top-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
                    <Clock className="w-3 h-3" />
                    {step.time}
                  </div>

                  {/* 아이콘 */}
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 mt-2">
                    {step.icon}
                  </div>

                  {/* 제목 */}
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>

                  {/* 설명 */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* 화살표 (모바일) */}
                {index < 2 && (
                  <div className="flex md:hidden justify-center my-3">
                    <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 총 소요 시간 */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              {t.workflow.totalTime}
            </span>
            <span className="text-sm font-semibold text-foreground">{totalTime}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
