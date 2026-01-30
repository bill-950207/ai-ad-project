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
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from 'lucide-react'

// ============================================================
// 메인 컴포넌트
// ============================================================

export function Footer() {
  const { t, language } = useLanguage()
  const isKo = language === 'ko'

  // 푸터 링크 데이터
  const footerLinks = {
    product: {
      title: isKo ? '제품' : 'Product',
      links: [
        { label: isKo ? '이미지 광고' : 'Image Ads', href: '/login' },
        { label: isKo ? '영상 광고' : 'Video Ads', href: '/login' },
        { label: isKo ? '아바타' : 'Avatars', href: '/login' },
        { label: isKo ? '가격' : 'Pricing', href: '#' },
      ],
    },
    company: {
      title: isKo ? '회사' : 'Company',
      links: [
        { label: isKo ? '소개' : 'About', href: '#' },
        { label: isKo ? '블로그' : 'Blog', href: '#' },
        { label: isKo ? '채용' : 'Careers', href: '#' },
        { label: isKo ? '문의' : 'Contact', href: '#' },
      ],
    },
    legal: {
      title: isKo ? '법적 정보' : 'Legal',
      links: [
        { label: isKo ? '이용약관' : 'Terms of Service', href: '/legal/terms' },
        { label: isKo ? '개인정보처리방침' : 'Privacy Policy', href: '/legal/privacy' },
        { label: isKo ? '쿠키 정책' : 'Cookie Policy', href: '#' },
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
    <footer className="bg-secondary/20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* 브랜드 섹션 */}
          <div className="lg:col-span-4">
            {/* 로고 - 단순화 */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-foreground">AIAD</span>
            </Link>

            {/* 설명 */}
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              {isKo
                ? '전문적인 광고 콘텐츠를 몇 분 만에 제작하세요. 이미지, 영상, 아바타까지 모두 지원합니다.'
                : 'Create professional ad content in minutes. Support for images, videos, and avatars.'}
            </p>

            {/* 소셜 링크 */}
            <div className="mt-5 flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* 링크 섹션들 */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h3 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 영역 */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* 저작권 */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AIAD. {isKo ? '모든 권리 보유.' : 'All rights reserved.'}
          </p>

          {/* 상태 표시 */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>{isKo ? '모든 시스템 정상' : 'All systems operational'}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
