'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreditContextType {
  credits: number | null
  isLoading: boolean
  refreshCredits: () => Promise<void>
}

const CreditContext = createContext<CreditContextType | undefined>(undefined)

export function CreditProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const refreshCredits = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCredits(null)
        return
      }

      const res = await fetch('/api/subscription')
      if (res.ok) {
        const data = await res.json()
        setCredits(data.profile?.credits ?? 0)
      }
    } catch (error) {
      console.error('Failed to refresh credits:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // 초기 로드
  useEffect(() => {
    refreshCredits()
  }, [refreshCredits])

  return (
    <CreditContext.Provider value={{ credits, isLoading, refreshCredits }}>
      {children}
    </CreditContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditProvider')
  }
  return context
}
