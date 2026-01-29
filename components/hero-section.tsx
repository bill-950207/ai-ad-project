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
  const { t, language } = useLanguage();
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
    <section className="relative overflow-hidden px-4 pt-32 pb-24 sm:pt-40 sm:pb-32 lg:pt-48 lg:pb-40">
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
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-in-up">
          <Sparkles className="h-4 w-4" />
          <span>{language === 'ko' ? '전문가 없이도 OK' : 'No expertise needed'}</span>
        </div>

        {/* 메인 헤드라인 - 간결하게 */}
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up animation-delay-100">
          <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {language === 'ko' ? 'AI로 단 3분' : '3 Minutes with AI'}
          </span>
          {language === 'ko' ? '만에' : ''}
          <br />
          {language === 'ko' ? '만드는 광고' : 'Create Your Ad'}
        </h1>

        {/* 서브 헤드라인 - 간결하게 */}
        <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground sm:text-xl leading-relaxed animate-fade-in-up animation-delay-200">
          {language === 'ko'
            ? '이미지, 영상, 아바타까지. 클릭 몇 번으로 전문가 수준의 광고를 만들어 보세요.'
            : 'Images, videos, avatars. Create professional ads with just a few clicks.'}
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up animation-delay-300">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="group inline-flex items-center justify-center gap-2 h-12 rounded-full px-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
          >
            {language === 'ko' ? '무료로 시작하기' : 'Start Free'}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#gallery"
            className="inline-flex items-center justify-center gap-2 h-12 rounded-full px-6 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Play className="h-4 w-4" />
            {language === 'ko' ? '샘플 보기' : 'View Samples'}
          </Link>
        </div>

        {/* 간단한 신뢰 지표 */}
        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up animation-delay-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {language === 'ko' ? '신용카드 불필요' : 'No credit card'}
          </span>
          <span className="hidden sm:block w-px h-4 bg-border"></span>
          <span>{language === 'ko' ? '무료 크레딧 제공' : 'Free credits included'}</span>
        </div>
      </div>
    </section>
  );
}
