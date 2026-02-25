'use client'

import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function VideoToolRedirect() {
  const { language } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/dashboard/ai-tools/${language}/video`)
  }, [language, router])

  return null
}
