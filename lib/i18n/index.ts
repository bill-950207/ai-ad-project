import ko from './translations/ko.json'
import en from './translations/en.json'
import ja from './translations/ja.json'

export type Language = 'ko' | 'en' | 'ja'

export const languages: { code: Language; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
]

export const translations = {
  ko,
  en,
  ja,
} as const

export type Translations = typeof ko

export function getTranslation(lang: Language): Translations {
  return translations[lang]
}
