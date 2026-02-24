'use client'

import { useLanguage } from '@/contexts/language-context'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { Language } from '@/lib/i18n'

const validLanguages = ['ko', 'en', 'ja', 'zh']

export default function AIToolsLanguageLayout({ children }: { children: React.ReactNode }) {
  const { language: urlLanguage } = useParams<{ language: string }>()
  const { language, setLanguage } = useLanguage()

  useEffect(() => {
    if (urlLanguage && validLanguages.includes(urlLanguage) && urlLanguage !== language) {
      setLanguage(urlLanguage as Language)
    }
  }, [urlLanguage, language, setLanguage])

  return <>{children}</>
}
