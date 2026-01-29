'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Menu, X } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function Navbar() {
  const { language } = useLanguage()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const navLinks = [
    { label: language === 'ko' ? '기능' : 'Features', href: '#features' },
    { label: language === 'ko' ? '사용법' : 'How it works', href: '#workflow' },
    { label: language === 'ko' ? '갤러리' : 'Gallery', href: '#gallery' },
  ]

  return (
    <header className="w-full bg-background/50 backdrop-blur-sm border-b border-border/30">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-lg rotate-3 group-hover:rotate-6 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold">AIAD</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {language === 'ko' ? '대시보드' : 'Dashboard'}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {language === 'ko' ? '로그인' : 'Login'}
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {language === 'ko' ? '무료로 시작' : 'Start Free'}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="w-full px-5 py-2.5 rounded-full text-sm font-medium text-center bg-primary text-primary-foreground"
                  >
                    {language === 'ko' ? '대시보드' : 'Dashboard'}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="w-full px-5 py-2.5 rounded-full text-sm font-medium text-center border border-border hover:bg-secondary transition-colors"
                    >
                      {language === 'ko' ? '로그인' : 'Login'}
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full px-5 py-2.5 rounded-full text-sm font-medium text-center bg-primary text-primary-foreground"
                    >
                      {language === 'ko' ? '무료로 시작' : 'Start Free'}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
