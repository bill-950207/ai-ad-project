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
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image')
  const isKo = language === 'ko'

  // 이미지 광고 워크플로우
  const imageWorkflow: WorkflowStep[] = [
    {
      icon: <Upload className="w-5 h-5" />,
      title: isKo ? '제품 등록' : 'Upload Product',
      description: isKo
        ? '제품 이미지나 URL을 입력하세요. 배경 제거와 크기 조절이 자동으로 처리됩니다.'
        : 'Enter product image or URL. Background removal and resizing are handled automatically.',
      time: isKo ? '30초' : '30 sec',
    },
    {
      icon: <MousePointerClick className="w-5 h-5" />,
      title: isKo ? '스타일 선택' : 'Choose Style',
      description: isKo
        ? '추천 스타일 중 원하는 광고 스타일을 선택하세요. 클릭 한 번으로 끝입니다.'
        : 'Select your desired ad style from recommendations. One click is all it takes.',
      time: isKo ? '10초' : '10 sec',
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: isKo ? '광고 완성' : 'Download',
      description: isKo
        ? '전문가 수준의 고품질 광고 이미지가 생성됩니다. 바로 다운로드하세요.'
        : 'Professional-quality ad images are generated. Download them right away.',
      time: isKo ? '30초' : '30 sec',
    },
  ]

  // 영상 광고 워크플로우
  const videoWorkflow: WorkflowStep[] = [
    {
      icon: <Upload className="w-5 h-5" />,
      title: isKo ? '제품 & 아바타' : 'Product & Avatar',
      description: isKo
        ? '제품을 등록하고 아바타를 선택하세요. 사진 한 장으로 나만의 아바타도 만들 수 있습니다.'
        : 'Register your product and select an avatar. You can also create your own avatar from a single photo.',
      time: isKo ? '1분' : '1 min',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: isKo ? '대본 입력' : 'Enter Script',
      description: isKo
        ? '광고 문구를 입력하세요. 자연스러운 목소리와 립싱크가 자동으로 생성됩니다.'
        : 'Enter your ad text. Natural voice and lip sync are generated automatically.',
      time: isKo ? '30초' : '30 sec',
    },
    {
      icon: <Video className="w-5 h-5" />,
      title: isKo ? '영상 완성' : 'Video Ready',
      description: isKo
        ? '아바타가 말하는 고품질 영상이 완성됩니다. 편집 없이 바로 사용하세요.'
        : 'High-quality video with talking avatar is ready. Use it right away without editing.',
      time: isKo ? '2-3분' : '2-3 min',
    },
  ]

  const currentWorkflow = activeTab === 'image' ? imageWorkflow : videoWorkflow
  const totalTime = activeTab === 'image'
    ? (isKo ? '약 2분' : '~2 minutes')
    : (isKo ? '약 5분' : '~5 minutes')

  return (
    <section id="workflow" className="px-4 py-20 sm:py-24 bg-secondary/30">
      <div className="mx-auto max-w-5xl">
        {/* 섹션 헤더 - AI 강조 제거 */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground">
            {isKo ? '간단한 3단계' : 'Simple 3 Steps'}
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground text-lg">
            {isKo
              ? '복잡한 작업 없이, 클릭 몇 번이면 광고가 완성됩니다'
              : 'No complicated work. Just a few clicks and your ad is ready'}
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
              {isKo ? '이미지 광고' : 'Image Ad'}
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
              {isKo ? '영상 광고' : 'Video Ad'}
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
              {isKo ? '총 소요 시간:' : 'Total time:'}
            </span>
            <span className="text-sm font-semibold text-foreground">{totalTime}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
