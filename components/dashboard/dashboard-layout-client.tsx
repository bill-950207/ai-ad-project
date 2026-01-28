'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import { cn } from '@/lib/utils'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex -mt-16">
      <Sidebar />
      <main className={cn(
        "flex-1 p-6 min-h-screen transition-all duration-300",
        // 데스크톱: 사이드바 너비에 따라 margin 조정
        "md:ml-64",
        isCollapsed && "md:ml-[72px]",
        // 모바일: margin 없음
        "ml-0"
      )}>
        {children}
      </main>
    </div>
  )
}

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
