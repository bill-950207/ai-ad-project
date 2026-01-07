'use client'

import { useEffect, useState } from 'react'
import { setSupabaseConfig } from '@/lib/supabase/client'

interface SupabaseProviderProps {
  children: React.ReactNode
  supabaseUrl: string
  supabaseAnonKey: string
}

export function SupabaseProvider({ children, supabaseUrl, supabaseAnonKey }: SupabaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    setSupabaseConfig(supabaseUrl, supabaseAnonKey)
    setIsInitialized(true)
  }, [supabaseUrl, supabaseAnonKey])

  if (!isInitialized) {
    return null
  }

  return <>{children}</>
}
