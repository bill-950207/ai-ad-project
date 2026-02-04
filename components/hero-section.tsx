/**
 * 히어로 섹션 컴포넌트
 *
 * 랜딩 페이지의 메인 히어로 섹션을 담당합니다.
 * - 쇼케이스 레인 배경 효과 (대각선 흐름)
 * - 메인 헤드라인 및 서브 헤드라인
 * - CTA 버튼 (시작하기, 샘플 보기)
 * - 신뢰 지표
 */

'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Play, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { ShowcaseRain } from "./landing/showcase-rain";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { ShowcaseData } from "@/types/showcase";

// ============================================================
// 메인 컴포넌트
// ============================================================

interface HeroSectionProps {
  rainShowcases?: ShowcaseData[];
}

export function HeroSection({ rainShowcases }: HeroSectionProps) {
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
    <section className="relative overflow-hidden px-4 py-20 sm:py-28 lg:py-32">
      {/* 쇼케이스 레인 배경 */}
      <ShowcaseRain showcases={rainShowcases} />

      {/* 배경 오버레이 - 텍스트 가독성 */}
      <div className="absolute inset-0 -z-10">
        {/* 메인 그라데이션 */}
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl text-center relative z-10">
        {/* 배지 - AI 대신 기능 강조 */}
        <Badge variant="outline" className="mb-6 gap-2 animate-fade-in-up">
          <CheckCircle className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          <span>{t.hero.tagline}</span>
        </Badge>

        {/* 메인 헤드라인 - 단순한 그라데이션 */}
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up animation-delay-100">
          <span className="text-foreground">
            {t.hero.headlinePart1}
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t.hero.headlinePart2}
          </span>
        </h1>

        {/* 서브 헤드라인 */}
        <p className="mx-auto mb-10 max-w-lg text-lg text-muted-foreground sm:text-xl leading-relaxed animate-fade-in-up animation-delay-200">
          {t.hero.description}
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up animation-delay-300">
          <Link href={user ? "/dashboard" : "/login"}>
            <Button size="lg" className="group gap-2">
              {t.hero.ctaStart}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="#gallery">
            <Button variant="outline" size="lg" className="gap-2">
              <Play className="h-4 w-4" aria-hidden="true" />
              {t.hero.ctaSamples}
            </Button>
          </Link>
        </div>

        {/* 신뢰 지표 */}
        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up animation-delay-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {t.hero.noCreditCard}
          </span>
          <span className="hidden sm:block w-px h-4 bg-border" />
          <span>{t.hero.freeCredits}</span>
        </div>
      </div>
    </section>
  );
}
