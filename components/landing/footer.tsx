/**
 * 랜딩 페이지 푸터 컴포넌트
 *
 * - 로고 및 브랜드 설명
 * - 주요 링크 (제품, 법적 정보)
 * - 저작권 정보
 */

'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useLanguage } from '@/contexts/language-context'
import { ArrowUpRight } from 'lucide-react'

// ============================================================
// 메인 컴포넌트
// ============================================================

export function Footer() {
  const { t } = useLanguage()

  // 푸터 링크 데이터
  const footerLinks = {
    product: {
      title: t.footer.product,
      links: [
        { label: t.footer.imageAds, href: '/login' },
        { label: t.footer.videoAds, href: '/login' },
        { label: t.footer.avatars, href: '/login' },
        { label: t.footer.pricing, href: '/pricing' },
      ],
    },
    legal: {
      title: t.footer.legal,
      links: [
        { label: t.footer.terms, href: '/legal/terms' },
        { label: t.footer.privacy, href: '/legal/privacy' },
      ],
    },
  }

  return (
    <footer className="bg-secondary/20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* 브랜드 섹션 */}
          <div className="lg:col-span-6">
            {/* 로고 */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            >
              <NextImage
                src="/logo-full-dark-lg.png"
                alt="gwanggo"
                width={100}
                height={30}
                className="h-7 w-auto"
              />
            </Link>

            {/* 설명 */}
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              {t.footer.description}
            </p>
          </div>

          {/* 링크 섹션들 */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-8">
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
        <div className="mt-10 pt-6 border-t border-border flex items-center justify-center">
          {/* 저작권 */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} gwanggo. {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
