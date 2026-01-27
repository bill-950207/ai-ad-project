/**
 * 다국어 지원 (i18n) 모듈
 *
 * 애플리케이션의 다국어 지원을 위한 번역 관리 모듈입니다.
 * 지원 언어: 한국어 (ko), 영어 (en), 일본어 (ja), 중국어 (zh)
 */

import ko from './translations/ko.json'
import en from './translations/en.json'
import ja from './translations/ja.json'
import zh from './translations/zh.json'

// ============================================================
// 타입 정의
// ============================================================

/** 지원 언어 코드 */
export type Language = 'ko' | 'en' | 'ja' | 'zh'

/** 번역 텍스트 타입 (한국어 JSON 구조 기준) */
export type Translations = typeof ko

// ============================================================
// 상수 정의
// ============================================================

/** 지원 언어 목록 (언어 선택 UI에서 사용) */
export const languages: { code: Language; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
]

/** 언어별 번역 데이터 */
export const translations = {
  ko,
  en,
  ja,
  zh,
} as const

// ============================================================
// 함수
// ============================================================

/**
 * 번역 텍스트 조회
 *
 * 지정된 언어의 번역 텍스트 객체를 반환합니다.
 *
 * @param lang - 언어 코드 ('ko' | 'en' | 'ja' | 'zh')
 * @returns 해당 언어의 번역 텍스트 객체
 */
export function getTranslation(lang: Language): Translations {
  return translations[lang]
}
