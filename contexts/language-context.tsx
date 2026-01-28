/**
 * 언어 컨텍스트
 *
 * 애플리케이션 전역에서 다국어 지원을 위한 컨텍스트를 제공합니다.
 * - 현재 언어 상태 관리
 * - 언어 변경 기능
 * - 번역 텍스트 제공
 * - localStorage에 언어 설정 저장
 * - 브라우저 언어 자동 감지 (없으면 영어 기본값)
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslation, Translations } from '@/lib/i18n'

// ============================================================
// 타입 정의
// ============================================================

/** 언어 컨텍스트 타입 */
interface LanguageContextType {
  language: Language                      // 현재 언어
  setLanguage: (lang: Language) => void   // 언어 변경 함수
  t: Translations                          // 번역 텍스트 객체
}

// ============================================================
// 상수 정의
// ============================================================

/** localStorage 키 */
const LANGUAGE_STORAGE_KEY = 'adai-language'

/** 지원 언어 목록 */
const SUPPORTED_LANGUAGES: Language[] = ['ko', 'en', 'ja', 'zh']

/** 기본 언어 (영어) */
const DEFAULT_LANGUAGE: Language = 'en'

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 브라우저 언어 감지
 * navigator.language를 기반으로 지원 언어를 반환합니다.
 * 지원하지 않는 언어면 영어(en)를 반환합니다.
 */
function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE

  const browserLang = navigator.language.toLowerCase()

  // 정확한 매칭 (ko, en, ja, zh)
  const exactMatch = SUPPORTED_LANGUAGES.find(lang => browserLang === lang)
  if (exactMatch) return exactMatch

  // 언어 코드 접두사 매칭 (ko-KR -> ko, en-US -> en, zh-CN -> zh)
  const langPrefix = browserLang.split('-')[0] as Language
  if (SUPPORTED_LANGUAGES.includes(langPrefix)) return langPrefix

  // 중국어 변형 처리 (zh-TW, zh-HK 등)
  if (browserLang.startsWith('zh')) return 'zh'

  // 지원하지 않는 언어면 영어 기본값
  return DEFAULT_LANGUAGE
}

// ============================================================
// 컨텍스트 생성
// ============================================================

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// ============================================================
// Provider 컴포넌트
// ============================================================

/**
 * 언어 프로바이더
 * 애플리케이션 전역에서 언어 상태를 관리합니다.
 * 저장된 언어 > 브라우저 언어 > 영어 순으로 우선순위를 적용합니다.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE)
  const [isLoaded, setIsLoaded] = useState(false)

  // 컴포넌트 마운트 시 언어 설정 로드
  // 우선순위: localStorage > 브라우저 언어 > 영어 기본값
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null

    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      // localStorage에 저장된 언어가 있으면 사용
      setLanguageState(savedLanguage)
    } else {
      // 없으면 브라우저 언어 감지
      const detectedLanguage = detectBrowserLanguage()
      setLanguageState(detectedLanguage)
      // 감지된 언어를 localStorage에 저장
      localStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLanguage)
    }

    setIsLoaded(true)
  }, [])

  /**
   * 언어 변경 함수
   * 상태 업데이트 및 localStorage에 저장
   */
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }

  // 현재 언어에 맞는 번역 텍스트 가져오기
  const t = getTranslation(language)

  // 하이드레이션 불일치 방지 - 클라이언트 언어 로드 전까지 렌더링 대기
  if (!isLoaded) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// ============================================================
// 훅
// ============================================================

/**
 * 언어 컨텍스트 사용 훅
 * 컴포넌트에서 현재 언어와 번역 텍스트에 접근할 수 있습니다.
 *
 * @throws LanguageProvider 외부에서 사용 시 에러
 */
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
