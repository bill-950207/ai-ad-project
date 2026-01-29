/**
 * 랜딩 페이지 푸터 컴포넌트
 *
 * - 로고 및 브랜드 설명
 * - 주요 링크 (제품, 회사, 법적 정보)
 * - 소셜 미디어 링크
 * - 저작권 정보
 */

'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { Sparkles, Github, Twitter, Linkedin, Mail, ArrowUpRight } from 'lucide-react'

// ============================================================
// 메인 컴포넌트
// ============================================================

export function Footer() {
  const { t, language } = useLanguage()

  // 푸터 링크 데이터
  const footerLinks = {
    product: {
      title: language === 'ko' ? '제품' : language === 'ja' ? '製品' : language === 'zh' ? '产品' : 'Product',
      links: [
        { label: t.nav?.imageAd || 'Image Ads', href: '/login' },
        { label: t.nav?.videoAd || 'Video Ads', href: '/login' },
        { label: t.nav?.avatarGeneration || 'AI Avatars', href: '/login' },
        { label: language === 'ko' ? '가격' : language === 'ja' ? '料金' : language === 'zh' ? '价格' : 'Pricing', href: '#' },
      ],
    },
    company: {
      title: language === 'ko' ? '회사' : language === 'ja' ? '会社' : language === 'zh' ? '公司' : 'Company',
      links: [
        { label: language === 'ko' ? '소개' : language === 'ja' ? '紹介' : language === 'zh' ? '介绍' : 'About', href: '#' },
        { label: language === 'ko' ? '블로그' : language === 'ja' ? 'ブログ' : language === 'zh' ? '博客' : 'Blog', href: '#' },
        { label: language === 'ko' ? '채용' : language === 'ja' ? '採用' : language === 'zh' ? '招聘' : 'Careers', href: '#' },
        { label: language === 'ko' ? '문의' : language === 'ja' ? 'お問い合わせ' : language === 'zh' ? '联系' : 'Contact', href: '#' },
      ],
    },
    legal: {
      title: language === 'ko' ? '법적 정보' : language === 'ja' ? '法的情報' : language === 'zh' ? '法律信息' : 'Legal',
      links: [
        { label: language === 'ko' ? '이용약관' : language === 'ja' ? '利用規約' : language === 'zh' ? '服务条款' : 'Terms of Service', href: '/legal/terms' },
        { label: language === 'ko' ? '개인정보처리방침' : language === 'ja' ? 'プライバシーポリシー' : language === 'zh' ? '隐私政策' : 'Privacy Policy', href: '/legal/privacy' },
        { label: language === 'ko' ? '쿠키 정책' : language === 'ja' ? 'Cookieポリシー' : language === 'zh' ? 'Cookie政策' : 'Cookie Policy', href: '#' },
      ],
    },
  }

  // 소셜 링크
  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:support@aiad.com', label: 'Email' },
  ]

  return (
    <footer className="relative bg-secondary/30 border-t border-border">
      {/* 상단 그라데이션 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* 브랜드 섹션 */}
          <div className="lg:col-span-4">
            {/* 로고 */}
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl rotate-3 group-hover:rotate-6 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-foreground">AIAD</span>
            </Link>

            {/* 설명 */}
            <p className="mt-4 text-muted-foreground max-w-xs leading-relaxed">
              {language === 'ko'
                ? 'AI 기술로 전문적인 광고 콘텐츠를 몇 분 만에 생성하세요. 이미지, 영상, 아바타까지 모두 지원합니다.'
                : language === 'ja'
                ? 'AI技術でプロフェッショナルな広告コンテンツを数分で作成。画像、動画、アバターまで全てサポート。'
                : language === 'zh'
                ? '使用AI技术在几分钟内创建专业的广告内容。支持图片、视频和虚拟形象。'
                : 'Create professional ad content in minutes with AI technology. Support for images, videos, and avatars.'}
            </p>

            {/* 소셜 링크 */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* 링크 섹션들 */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 영역 */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 저작권 */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AIAD.{' '}
            {language === 'ko'
              ? '모든 권리 보유.'
              : language === 'ja'
              ? '全著作権所有。'
              : language === 'zh'
              ? '保留所有权利。'
              : 'All rights reserved.'}
          </p>

          {/* 추가 정보 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {language === 'ko'
                ? '모든 시스템 정상'
                : language === 'ja'
                ? '全システム正常'
                : language === 'zh'
                ? '所有系统正常'
                : 'All systems operational'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
