/**
 * 히어로 섹션 컴포넌트
 *
 * 랜딩 페이지의 메인 히어로 섹션을 담당합니다.
 * - 애니메이션 배경 효과
 * - 메인 헤드라인 및 서브 헤드라인
 * - CTA 버튼 (시작하기, 데모 보기)
 * - 서비스 통계 표시
 */

'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Play, Image as ImageIcon, Video, Music } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

// ============================================================
// 플로팅 아이콘 컴포넌트
// ============================================================

function FloatingIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 플로팅 아이콘들 */}
      <div className="absolute top-1/4 left-[10%] animate-float-slow opacity-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="absolute top-1/3 right-[15%] animate-float-medium opacity-20">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
          <Video className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="absolute bottom-1/3 left-[15%] animate-float-fast opacity-20">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="absolute bottom-1/4 right-[10%] animate-float-slow opacity-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
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
    <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 -z-10">
        {/* 메인 그라데이션 */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[150px] animate-pulse-slow" />
        {/* 보조 그라데이션 */}
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute right-1/4 top-1/3 h-[250px] w-[350px] rounded-full bg-rose-500/10 blur-[100px]" />
        {/* 그리드 패턴 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* 플로팅 아이콘 */}
      <FloatingIcons />

      <div className="mx-auto max-w-5xl text-center relative z-10">
        {/* AI 배지 */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-medium text-primary animate-fade-in-up">
          <Sparkles className="h-4 w-4" />
          <span>{t.landing?.badge || 'AI-Powered Ad Creation'}</span>
        </div>

        {/* 메인 헤드라인 */}
        <h1 className="mb-8 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up animation-delay-100">
          {t.landing?.headline || 'Create Stunning Ads with '}
          <span className="relative">
            <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t.landing?.headlineHighlight || 'AI Magic'}
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 10C50 4 100 2 150 6C200 10 250 8 298 4" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round" />
              <defs>
                <linearGradient id="underline-gradient" x1="0" y1="0" x2="300" y2="0">
                  <stop stopColor="hsl(var(--primary))" />
                  <stop offset="0.5" stopColor="#a855f7" />
                  <stop offset="1" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          {t.landing?.headlineEnd || ''}
        </h1>

        {/* 서브 헤드라인 */}
        <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:text-2xl leading-relaxed animate-fade-in-up animation-delay-200">
          {t.landing?.subheadline || 'Generate professional ad content in minutes. From images to videos, let AI transform your marketing campaigns.'}
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up animation-delay-300">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="group inline-flex items-center justify-center gap-2 h-14 rounded-full px-8 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
          >
            {t.landing?.ctaStart || 'Get Started Free'}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#gallery"
            className="inline-flex items-center justify-center gap-2 h-14 rounded-full px-8 text-lg font-semibold border-2 border-border bg-background/50 backdrop-blur-sm hover:bg-secondary hover:border-primary/50 transition-all duration-300"
          >
            <Play className="h-5 w-5 text-primary" />
            {t.landing?.ctaDemo || 'Watch Demo'}
          </Link>
        </div>

        {/* 서비스 통계 */}
        <div className="mt-20 grid grid-cols-3 gap-8 animate-fade-in-up animation-delay-400">
          <div className="group">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
              10K+
            </div>
            <div className="text-sm sm:text-base text-muted-foreground mt-1">
              {t.landing?.statsAds || 'Ads Created'}
            </div>
          </div>
          <div className="group">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
              500+
            </div>
            <div className="text-sm sm:text-base text-muted-foreground mt-1">
              {t.landing?.statsUsers || 'Happy Users'}
            </div>
          </div>
          <div className="group">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
              98%
            </div>
            <div className="text-sm sm:text-base text-muted-foreground mt-1">
              {t.landing?.statsSatisfaction || 'Satisfaction'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
