/**
 * 히어로 섹션 컴포넌트
 *
 * 랜딩 페이지의 메인 히어로 섹션을 담당합니다.
 * - 배경 그라데이션 효과
 * - 메인 헤드라인 및 서브 헤드라인
 * - CTA 버튼 (시작하기, 데모 보기)
 * - 서비스 통계 표시
 */

'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

// ============================================================
// 컴포넌트
// ============================================================

export function HeroSection() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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
          <span>{t.landing.badge}</span>
        </div>

        {/* 메인 헤드라인 */}
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t.landing.headline}
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            {t.landing.headlineHighlight}
          </span>
          {t.landing.headlineEnd}
        </h1>

        {/* 서브 헤드라인 */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {t.landing.subheadline}
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="inline-flex items-center justify-center gap-2 h-12 rounded-lg px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.landing.ctaStart}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="#gallery"
            className="inline-flex items-center justify-center h-12 rounded-lg px-8 text-lg font-medium border border-border bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.landing.ctaDemo}
          </Link>
        </div>

        {/* 서비스 통계 */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8">
          <div>
            <div className="text-3xl font-bold text-foreground">10K+</div>
            <div className="text-sm text-muted-foreground">{t.landing.statsAds}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">500+</div>
            <div className="text-sm text-muted-foreground">{t.landing.statsUsers}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">98%</div>
            <div className="text-sm text-muted-foreground">{t.landing.statsSatisfaction}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
