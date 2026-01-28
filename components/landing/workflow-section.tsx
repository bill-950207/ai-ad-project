/**
 * 워크플로우 소개 섹션
 *
 * 이미지 광고와 영상 광고 생성 과정을 간략하게 소개합니다.
 * - 탭으로 이미지/영상 전환
 * - 3단계 간단한 프로세스 강조
 * - AI가 모든 것을 자동으로 처리한다는 점 강조
 */

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  Image as ImageIcon,
  Video,
  Upload,
  Wand2,
  Download,
  User,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Bot,
  MousePointerClick
} from 'lucide-react'

// ============================================================
// 타입 정의
// ============================================================

interface WorkflowStep {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  aiLabel?: string
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function WorkflowSection() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image')

  // AI 자동 처리 라벨
  const aiAutoLabel = language === 'ko' ? 'AI 자동' : language === 'ja' ? 'AI自動' : language === 'zh' ? 'AI自动' : 'AI Auto'

  // 이미지 광고 워크플로우
  const imageWorkflow: WorkflowStep[] = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: language === 'ko' ? '제품 등록' : language === 'ja' ? '商品登録' : language === 'zh' ? '产品注册' : 'Upload Product',
      description: language === 'ko'
        ? '제품 이미지나 URL만 입력하세요. 배경 제거부터 크기 조절까지 AI가 알아서 처리합니다'
        : language === 'ja'
        ? '商品画像やURLを入力するだけ。背景削除からサイズ調整までAIが自動処理'
        : language === 'zh'
        ? '只需输入产品图片或URL，AI自动处理背景去除和尺寸调整'
        : 'Just enter product image or URL. AI handles background removal and resizing automatically',
      time: language === 'ko' ? '30초' : language === 'ja' ? '30秒' : language === 'zh' ? '30秒' : '30 sec',
      aiLabel: aiAutoLabel,
    },
    {
      icon: <MousePointerClick className="w-6 h-6" />,
      title: language === 'ko' ? '스타일 선택' : language === 'ja' ? 'スタイル選択' : language === 'zh' ? '选择风格' : 'Choose Style',
      description: language === 'ko'
        ? 'AI가 제품에 맞는 스타일을 추천해드려요. 원하는 광고 스타일을 클릭하세요. 그게 전부입니다!'
        : language === 'ja'
        ? 'AIが商品に合ったスタイルをおすすめ。希望の広告スタイルをクリック。それだけです！'
        : language === 'zh'
        ? 'AI推荐适合产品的风格，点击您想要的广告风格，就这么简单！'
        : 'AI recommends styles for your product. Click your desired ad style. That\'s it!',
      time: language === 'ko' ? '10초' : language === 'ja' ? '10秒' : language === 'zh' ? '10秒' : '10 sec',
      aiLabel: aiAutoLabel,
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: language === 'ko' ? 'AI가 생성' : language === 'ja' ? 'AIが生成' : language === 'zh' ? 'AI生成' : 'AI Generates',
      description: language === 'ko'
        ? 'AI가 전문 디자이너 수준의 고품질 광고 이미지를 자동으로 생성합니다'
        : language === 'ja'
        ? 'AIがプロデザイナーレベルの高品質広告画像を自動生成'
        : language === 'zh'
        ? 'AI自动生成专业设计师水平的高质量广告图片'
        : 'AI automatically creates professional designer-level ad images',
      time: language === 'ko' ? '30초' : language === 'ja' ? '30秒' : language === 'zh' ? '30秒' : '30 sec',
      aiLabel: aiAutoLabel,
    },
  ]

  // 영상 광고 워크플로우
  const videoWorkflow: WorkflowStep[] = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: language === 'ko' ? '제품 & 아바타' : language === 'ja' ? '商品＆アバター' : language === 'zh' ? '产品和虚拟形象' : 'Product & Avatar',
      description: language === 'ko'
        ? '제품을 등록하고 AI 아바타를 선택하세요. 사진 한 장으로 나만의 아바타도 자동 생성!'
        : language === 'ja'
        ? '商品を登録しAIアバターを選択。写真1枚でオリジナルアバターも自動生成！'
        : language === 'zh'
        ? '注册产品并选择AI虚拟形象，一张照片即可自动生成专属形象！'
        : 'Register product and select AI avatar. One photo auto-generates your own avatar!',
      time: language === 'ko' ? '1분' : language === 'ja' ? '1分' : language === 'zh' ? '1分钟' : '1 min',
      aiLabel: aiAutoLabel,
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: language === 'ko' ? '대본 입력' : language === 'ja' ? '台本入力' : language === 'zh' ? '输入脚本' : 'Enter Script',
      description: language === 'ko'
        ? '광고 문구만 입력하세요. AI가 자연스러운 목소리와 립싱크를 자동으로 생성합니다'
        : language === 'ja'
        ? '広告文を入力するだけ。AIが自然な声とリップシンクを自動生成'
        : language === 'zh'
        ? '只需输入广告文案，AI自动生成自然声音和口型同步'
        : 'Just enter ad text. AI auto-generates natural voice and lip sync',
      time: language === 'ko' ? '30초' : language === 'ja' ? '30秒' : language === 'zh' ? '30秒' : '30 sec',
      aiLabel: aiAutoLabel,
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: language === 'ko' ? '영상 완성' : language === 'ja' ? '動画完成' : language === 'zh' ? '视频完成' : 'Video Ready',
      description: language === 'ko'
        ? 'AI가 아바타가 말하는 고품질 영상을 자동 생성. 편집 없이 바로 사용 가능!'
        : language === 'ja'
        ? 'AIがアバターが話す高品質動画を自動生成。編集なしですぐ使用可能！'
        : language === 'zh'
        ? 'AI自动生成虚拟形象说话的高质量视频，无需编辑即可使用！'
        : 'AI auto-generates talking avatar video. Ready to use without editing!',
      time: language === 'ko' ? '2~3분' : language === 'ja' ? '2〜3分' : language === 'zh' ? '2-3分钟' : '2-3 min',
      aiLabel: aiAutoLabel,
    },
  ]

  const currentWorkflow = activeTab === 'image' ? imageWorkflow : videoWorkflow

  // 총 소요 시간
  const totalTime = activeTab === 'image'
    ? (language === 'ko' ? '약 2분' : language === 'ja' ? '約2分' : language === 'zh' ? '约2分钟' : '~2 minutes')
    : (language === 'ko' ? '약 5분' : language === 'ja' ? '約5分' : language === 'zh' ? '约5分钟' : '~5 minutes')

  return (
    <section id="workflow" className="px-4 py-20 sm:py-28 bg-gradient-to-b from-background to-secondary/20">
      <div className="mx-auto max-w-6xl">
        {/* 섹션 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Bot className="w-4 h-4" />
            <span>
              {language === 'ko' ? 'AI가 다 해드려요' : language === 'ja' ? 'AIが全部やります' : language === 'zh' ? 'AI全自动处理' : 'AI Does Everything'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {language === 'ko' ? '클릭 몇 번이면 ' : language === 'ja' ? '数クリックで ' : language === 'zh' ? '点击几下，' : 'Just a few clicks, '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {language === 'ko' ? '끝!' : language === 'ja' ? '完了！' : language === 'zh' ? '搞定！' : 'done!'}
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            {language === 'ko'
              ? '복잡한 작업은 AI에게 맡기세요. 당신은 선택만 하면 됩니다'
              : language === 'ja'
              ? '複雑な作業はAIにお任せ。あなたは選ぶだけ'
              : language === 'zh'
              ? '复杂的工作交给AI，您只需选择'
              : 'Leave the complex work to AI. You just choose'}
          </p>
        </div>

        {/* 탭 전환 */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-secondary/50 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'image'
                  ? 'bg-background text-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              {language === 'ko' ? '이미지 광고' : language === 'ja' ? '画像広告' : language === 'zh' ? '图片广告' : 'Image Ad'}
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'video'
                  ? 'bg-background text-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Video className="w-4 h-4" />
              {language === 'ko' ? '영상 광고' : language === 'ja' ? '動画広告' : language === 'zh' ? '视频广告' : 'Video Ad'}
            </button>
          </div>
        </div>

        {/* 워크플로우 스텝 */}
        <div className="relative">
          {/* 연결선 (데스크톱) */}
          <div className="hidden md:block absolute top-1/2 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {currentWorkflow.map((step, index) => (
              <div
                key={index}
                className="relative group"
              >
                {/* 스텝 카드 */}
                <div className={`relative bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 ${
                  step.aiLabel ? 'border-primary/30 hover:border-primary/50 hover:shadow-primary/10' : 'border-border hover:border-primary/50 hover:shadow-primary/5'
                }`}>
                  {/* 스텝 번호 */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>

                  {/* 상단 배지들 */}
                  <div className="absolute -top-3 right-4 flex items-center gap-2">
                    {/* AI 자동 배지 */}
                    {step.aiLabel && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Bot className="w-3 h-3" />
                        {step.aiLabel}
                      </div>
                    )}
                    {/* 소요 시간 배지 */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      {step.time}
                    </div>
                  </div>

                  {/* 아이콘 */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${
                    step.aiLabel
                      ? 'bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary'
                      : 'bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary'
                  }`}>
                    {step.icon}
                  </div>

                  {/* 제목 */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    {step.title}
                    {step.aiLabel && (
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    )}
                  </h3>

                  {/* 설명 */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* 화살표 (모바일) */}
                {index < 2 && (
                  <div className="flex md:hidden justify-center my-4">
                    <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 총 소요 시간 & CTA */}
        <div className="mt-12 flex flex-col items-center gap-6">
          {/* 총 소요 시간 */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-foreground font-medium">
              {language === 'ko' ? '총 소요 시간:' : language === 'ja' ? '総所要時間:' : language === 'zh' ? '总耗时:' : 'Total time:'}
            </span>
            <span className="text-primary font-bold text-lg">{totalTime}</span>
          </div>

          {/* 특징 배지들 */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: <Bot className="w-3.5 h-3.5" />, text: language === 'ko' ? 'AI 완전 자동화' : language === 'ja' ? 'AI完全自動化' : language === 'zh' ? 'AI完全自动化' : 'Fully AI-automated', highlight: true },
              { icon: <Sparkles className="w-3.5 h-3.5" />, text: language === 'ko' ? '전문 지식 불필요' : language === 'ja' ? '専門知識不要' : language === 'zh' ? '无需专业知识' : 'No expertise needed', highlight: false },
              { icon: <Zap className="w-3.5 h-3.5" />, text: language === 'ko' ? '즉시 사용 가능' : language === 'ja' ? 'すぐに使用可能' : language === 'zh' ? '即可使用' : 'Ready to use', highlight: false },
            ].map((badge, i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  badge.highlight
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary/50 text-muted-foreground'
                }`}
              >
                {badge.icon}
                {badge.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
