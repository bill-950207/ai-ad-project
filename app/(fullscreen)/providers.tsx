'use client'

import { ReactNode } from 'react'
import { CreditProvider } from '@/contexts/credit-context'

interface FullscreenProvidersProps {
  children: ReactNode
}

export function FullscreenProviders({ children }: FullscreenProvidersProps) {
  return (
    <CreditProvider>
      {children}
    </CreditProvider>
  )
}
