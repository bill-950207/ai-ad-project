/**
 * 이미지/영상 생성 프롬프트 정제 유틸리티
 *
 * Seedream 4.5 모델이 특정 단어를 보면 실제 카메라/촬영장비를 이미지에 생성합니다.
 * 이 유틸리티는 프롬프트에서 해당 단어들을 제거하여 이 문제를 방지합니다.
 */

/**
 * 금지 단어 목록 (대소문자 무관)
 * Seedream 4.5 모델이 이 단어들을 보면 실제 카메라/장비를 생성합니다.
 */
const FORBIDDEN_WORDS_PATTERNS = [
  // 카메라 관련
  'camera',
  'cameras',
  'tripod',
  'tripods',
  'dslr',
  'mirrorless',
  'viewfinder',
  'shutter',
  'aperture',
  // 렌즈 (단, lens flare는 제외)
  // 'lens'는 'lens flare'와 구분이 어려우므로 별도 처리
  // 촬영 관련
  'photographer',
  'photographers',
  'photography',
  'filming',
  'behind the scenes',
  'photo shoot',
  'photoshoot',
  'studio setup',
  'production setup',
  'shooting',
  // 조명 장비
  'softbox',
  'softboxes',
  'ring light',
  'ring lights',
  'lighting rig',
  'lighting rigs',
  'reflector',
  'reflectors',
  'flash',
  'strobe',
  'studio light',
  'studio lights',
  'light stand',
  'light stands',
  'umbrella light',
  // 기타 촬영 장비
  'boom arm',
  'c-stand',
  'backdrop stand',
  'lighting equipment',
  'production equipment',
]

/**
 * 프롬프트에서 카메라/촬영장비 관련 금지 단어를 제거합니다.
 *
 * @param prompt - 원본 프롬프트
 * @returns 정제된 프롬프트
 */
export function sanitizePrompt(prompt: string): string {
  let sanitized = prompt

  // 금지 단어 제거 (대소문자 무관)
  for (const word of FORBIDDEN_WORDS_PATTERNS) {
    // 단어 경계를 고려하여 교체 (대소문자 무시)
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi')
    sanitized = sanitized.replace(regex, '')
  }

  // 'lens' 단독 사용 제거 (lens flare는 유지)
  // "lens" 뒤에 "flare"가 없는 경우만 제거
  sanitized = sanitized.replace(/\blens\b(?!\s*flare)/gi, '')

  // 연속된 공백 정리
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  // 연속된 쉼표/마침표 정리
  sanitized = sanitized.replace(/,\s*,/g, ',').replace(/\.\s*\./g, '.')
  sanitized = sanitized.replace(/,\s*\./g, '.').replace(/\.\s*,/g, ',')

  // 문장 끝 쉼표 정리
  sanitized = sanitized.replace(/,\s*$/g, '.')

  // 안전 키워드 추가 (프롬프트 끝에)
  if (!sanitized.toLowerCase().includes('no visible equipment')) {
    sanitized += ' No visible studio equipment or production setup.'
  }

  return sanitized
}

/**
 * 정규식 특수문자를 이스케이프합니다.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 금지 단어 목록을 반환합니다. (디버깅/테스트용)
 */
export function getForbiddenWords(): string[] {
  return [...FORBIDDEN_WORDS_PATTERNS]
}
