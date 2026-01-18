/**
 * 프롬프트 관리 타입 정의
 */

/** 프롬프트 버전 정보 */
export interface PromptVersion {
  version: string
  createdAt: string
  description?: string
}

/** 프롬프트 템플릿 */
export interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  variables: string[]
  version: PromptVersion
  category: PromptCategory
  targetModel?: TargetModel
}

/** 프롬프트 카테고리 */
export type PromptCategory =
  | 'image-ad'
  | 'video-ad'
  | 'avatar-motion'
  | 'script'
  | 'background'
  | 'avatar'
  | 'analysis'
  | 'common'

/** 대상 모델 */
export type TargetModel =
  | 'gemini'
  | 'seedream-4.5'
  | 'gpt-image-1.5'
  | 'z-image-turbo'
  | 'wan-2.6'
  | 'seedance-1.5'

/** 프롬프트 변수 치환 함수 */
export function fillTemplate(template: string, variables: Record<string, string | undefined>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), value || '')
  }
  // 남은 빈 플레이스홀더 제거
  result = result.replace(/\{\{[^}]+\}\}/g, '')
  return result.trim()
}

/** 프롬프트 변수 목록 추출 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g) || []
  return matches.map(m => m.replace(/\{\{|\}\}/g, ''))
}
