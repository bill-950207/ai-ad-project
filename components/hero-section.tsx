/**
 * 히어로 섹션 컴포넌트
 *
 * 랜딩 페이지의 메인 히어로 섹션을 담당합니다.
 * - 배경 그라데이션 효과
 * - 메인 헤드라인 및 서브 헤드라인
 * - CTA 버튼 (시작하기, 데모 보기)
 * - 서비스 통계 표시
 */

import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

// ============================================================
// 컴포넌트
// ============================================================

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:py-32">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* AI 배지 */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI-Powered Ad Creation</span>
        </div>

        {/* 메인 헤드라인 */}
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Create Stunning Ads with{" "}
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            AI Magic
          </span>
        </h1>

        {/* 서브 헤드라인 */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Generate professional ad content in minutes. From images to videos,
          let AI transform your marketing campaigns with just a few clicks.
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="gap-2">
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>

        {/* 서비스 통계 */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8">
          <div>
            <div className="text-3xl font-bold text-foreground">10K+</div>
            <div className="text-sm text-muted-foreground">Ads Created</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">500+</div>
            <div className="text-sm text-muted-foreground">Happy Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">98%</div>
            <div className="text-sm text-muted-foreground">Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}
