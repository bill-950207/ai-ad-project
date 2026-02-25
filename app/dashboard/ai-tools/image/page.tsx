'use client'

import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ImageToolRedirect() {
  const { language } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/dashboard/ai-tools/${language}/image`)
  }, [language, router])

  return null
}
