'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslation, Translations } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'adai-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
    if (savedLanguage && ['ko', 'en', 'ja'].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
    setIsLoaded(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }

  const t = getTranslation(language)

  // Prevent hydration mismatch by not rendering until client-side language is loaded
  if (!isLoaded) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
