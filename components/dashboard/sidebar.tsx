'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useLanguage } from '@/contexts/language-context'
import { languages } from '@/lib/i18n'
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Music,
  Image,
  Video,
  Workflow,
  Wand2,
  User as UserIcon,
  Settings,
  Languages,
  LogOut,
  CreditCard,
  ChevronUp
} from 'lucide-react'

interface NavItem {
  labelKey: 'adCreationTools' | 'adWorkflow'
  icon: React.ReactNode
  children: { labelKey: string; href: string; icon: React.ReactNode }[]
}

const navItems: NavItem[] = [
  {
    labelKey: 'adCreationTools',
    icon: <Wand2 className="w-4 h-4" />,
    children: [
      { labelKey: 'avatarGeneration', href: '/dashboard/avatar', icon: <Sparkles className="w-4 h-4" /> },
      { labelKey: 'musicGeneration', href: '/dashboard/music', icon: <Music className="w-4 h-4" /> },
      { labelKey: 'backgroundGeneration', href: '/dashboard/background', icon: <Image className="w-4 h-4" /> },
    ]
  },
  {
    labelKey: 'adWorkflow',
    icon: <Workflow className="w-4 h-4" />,
    children: [
      { labelKey: 'imageAd', href: '/dashboard/image-ad', icon: <Image className="w-4 h-4" /> },
      { labelKey: 'videoAd', href: '/dashboard/video-ad', icon: <Video className="w-4 h-4" /> },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const [expandedItems, setExpandedItems] = useState<string[]>(['adCreationTools', 'adWorkflow'])
  const [user, setUser] = useState<User | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [credits] = useState(5) // TODO: fetch from database
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
        setShowLanguageMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleExpand = (labelKey: string) => {
    setExpandedItems(prev =>
      prev.includes(labelKey)
        ? prev.filter(item => item !== labelKey)
        : [...prev, labelKey]
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleLanguageChange = (code: 'ko' | 'en' | 'ja') => {
    setLanguage(code)
    setShowLanguageMenu(false)
    setShowProfileMenu(false)
  }

  const getUserDisplayName = () => {
    if (!user) return 'User'
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.user_metadata?.name) return user.user_metadata.name
    return user.email?.split('@')[0] || 'User'
  }

  const getNavLabel = (key: string) => {
    return t.nav[key as keyof typeof t.nav] || key
  }

  return (
    <aside className="w-64 bg-card border-r border-border h-[calc(100vh-4rem)] fixed left-0 top-16 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.labelKey}>
            {/* Parent Item */}
            <button
              onClick={() => toggleExpand(item.labelKey)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-secondary/50 text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{getNavLabel(item.labelKey)}</span>
              </div>
              {expandedItems.includes(item.labelKey) ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* Children Items */}
            {item.children && expandedItems.includes(item.labelKey) && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      pathname === child.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    {child.icon}
                    <span>{getNavLabel(child.labelKey)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-border p-4" ref={menuRef}>
        {/* Credits Display */}
        <div className="flex items-center justify-between px-3 py-2 mb-2 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>{t.common.credits}</span>
          </div>
          <span className="text-sm font-semibold text-primary">{credits}</span>
        </div>

        {/* Profile Button */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
            </div>
            <ChevronUp className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              showProfileMenu ? "rotate-180" : ""
            )} />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{t.common.myProfile}</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>{t.common.settings}</span>
                </Link>

                {/* Language Submenu */}
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Languages className="w-4 h-4" />
                      <span>{t.common.language}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {languages.find(l => l.code === language)?.label}
                    </span>
                  </button>

                  {showLanguageMenu && (
                    <div className="border-t border-border bg-secondary/20">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={cn(
                            "w-full flex items-center gap-3 px-8 py-2 text-sm transition-colors",
                            language === lang.code
                              ? "text-primary bg-primary/10"
                              : "text-foreground hover:bg-secondary/50"
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.common.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
