/**
 * 대본 생성 프롬프트
 *
 * 영상 광고 대본 생성에 사용되는 프롬프트 템플릿들
 */

import { PromptTemplate } from './types'

// ============================================================
// 대본 스타일 정의
// ============================================================

/** 대본 스타일별 특성 */
export const SCRIPT_STYLES = {
  formal: {
    korean: '공식적',
    description: '전문적이고 신뢰감을 주는 톤',
    characteristics: [
      '존댓말 사용',
      '전문 용어 적절히 활용',
      '객관적인 정보 전달',
      '신뢰성 강조',
    ],
    exampleTone: '이 제품은 엄선된 성분으로 만들어졌습니다.',
  },
  casual: {
    korean: '캐주얼',
    description: '친근하고 대화하듯한 톤',
    characteristics: [
      '반말 또는 친근한 존댓말',
      '일상적인 표현',
      '공감대 형성',
      '편안한 분위기',
    ],
    exampleTone: '진짜 이거 써보고 깜짝 놀랐어요!',
  },
  energetic: {
    korean: '활기찬',
    description: '열정적이고 에너지 넘치는 톤',
    characteristics: [
      '감탄사 활용',
      '강조 표현',
      '흥분된 어조',
      '행동 유도',
    ],
    exampleTone: '와! 이건 진짜 대박이에요!',
  },
}

// ============================================================
// 비디오 타입별 대본 스타일 가이드
// ============================================================

/** 비디오 타입 */
export type VideoType = 'UGC' | 'podcast' | 'expert'

/** 비디오 타입별 대본 스타일 가이드 */
export const VIDEO_TYPE_SCRIPT_STYLES: Record<VideoType, {
  korean: string
  description: string
  scriptGuidelines: string[]
  openingExamples: string[]
}> = {
  UGC: {
    korean: 'UGC 스타일',
    description: '인플루언서처럼 자연스럽게 제품 소개',
    scriptGuidelines: [
      '개인 경험 공유',
      '캐주얼한 언어와 진정성 있는 반응',
      '일상적인 상황에서의 제품 발견 스토리',
    ],
    openingExamples: [
      '요즘 진짜 핫한 거 발견했는데요!',
      '이거 써보고 진짜 깜놀했어요!',
    ],
  },
  podcast: {
    korean: '팟캐스트',
    description: '대화하듯 친밀하게 제품 이야기',
    scriptGuidelines: [
      '스토리 중심의 내러티브',
      '대화체 전환과 생각하는 듯한 멈춤',
      '시청자 참여를 위한 수사적 질문',
      '친구에게 말하듯 친밀한 톤',
    ],
    openingExamples: [
      '오늘 얘기하고 싶은 게 있는데요...',
      '혹시 이런 경험 있으세요?',
      '제가 최근에 정말 재밌는 걸 발견했거든요.',
    ],
  },
  expert: {
    korean: '전문가 설명',
    description: '전문적으로 제품 특징 설명',
    scriptGuidelines: [
      '명확하고 구조화된 정보 전달',
      '근거 기반 설명과 이유',
      '적절한 전문 용어 사용',
      '핵심 포인트가 있는 교육적 톤',
    ],
    openingExamples: [
      '오늘은 이 제품의 핵심 기술에 대해 설명드리겠습니다.',
      '많은 분들이 궁금해하시는 부분을 자세히 알아보겠습니다.',
    ],
  },
}

// ============================================================
// TTS 설정
// ============================================================

/** TTS 속도 설정 (언어별 글자/초) */
export const TTS_SPEED_CONFIG = {
  /** 한국어 기준 글자/초 */
  korean: 5.0,
  /** 영어 기준 단어/초 */
  english: 2.5,
  /** 일본어 기준 글자/초 */
  japanese: 4.5,
  /** 중국어 기준 글자/초 */
  chinese: 4.0,
}

/** 대본 길이 계산 */
export function calculateScriptLength(durationSeconds: number, language: 'korean' | 'english' | 'japanese' | 'chinese' = 'korean'): number {
  const charsPerSecond = TTS_SPEED_CONFIG[language]
  return Math.floor(durationSeconds * charsPerSecond)
}

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 대본 스타일별 가이드라인 (추상적 특성 + Bad 예시만) */
const SCRIPT_STYLE_EXAMPLES = `
=== SCRIPT STYLE GUIDELINES ===

FORMAL (공식적) - Professional, trustworthy:
특성: 존댓말 사용, 객관적 정보 전달, 전문 용어 적절히 활용, 신뢰감 형성
구조: [정중한 인사] → [제품의 핵심 가치] → [구체적 특징/장점] → [신뢰감 있는 마무리]
톤: 차분하고 설득력 있게, 과장 없이 사실 기반으로

AVOID (피해야 할 것):
✗ "이 제품은 완벽합니다!" (근거 없는 과장)
✗ "100% 효과 보장!" (허위 광고 가능성)
✗ "업계 최초/최고" (검증 불가 주장)

CASUAL (캐주얼) - Friendly, relatable:
특성: 친근한 존댓말 또는 반말, 개인 경험 공유, 일상적 표현, 공감대 형성
구조: [친근한 시작] → [개인적 발견/경험] → [솔직한 후기] → [자연스러운 추천]
톤: 친구에게 말하듯, 진정성 있게, 억지스럽지 않게

AVOID (피해야 할 것):
✗ "대박대박대박!!!" (과도한 감탄사 남발)
✗ "이거 안 사면 후회함" (강압적 표현)
✗ 억지로 꾸민 듯한 과장된 반응

ENERGETIC (활기찬) - Enthusiastic, action-oriented:
특성: 에너지 넘치는 어조, 적절한 감탄사, 행동 유도, 흥분과 기대감 전달
구조: [임팩트 있는 오프닝] → [핵심 매력 포인트] → [열정적 설명] → [행동 유도 CTA]
톤: 밝고 긍정적으로, 진심이 느껴지게, 억지 흥분은 NO

AVOID (피해야 할 것):
✗ "지금 당장 사세요!!!" (과도한 압박)
✗ "이거 최고! 무조건 최고!" (근거 없는 반복)
✗ 소리 지르듯 과도한 느낌표 남발

=== IMPORTANT ===
- 각 스타일의 특성을 살리되, 제품의 실제 특징에 맞게 독창적으로 작성
- 위 구조는 참고용이며, 제품과 맥락에 맞게 자유롭게 변형 가능
- AVOID 항목은 반드시 피할 것
`.trim()

/** 대본 번역 Chain-of-Thought */
const SCRIPT_TRANSLATION_COT = `
=== TRANSLATION (Chain-of-Thought) ===

Step 1: ANALYZE original tone and intent
- Is it formal, casual, or energetic?
- What emotion should it evoke?

Step 2: IDENTIFY cultural adaptations needed
- Idioms that don't translate directly
- Cultural references to localize
- Formality level appropriate for target culture

Step 3: TRANSLATE with natural flow
- Prioritize spoken rhythm over literal accuracy
- Ensure TTS-friendly phrasing
- Maintain persuasive impact

Step 4: VERIFY length and timing
- Check character count matches target
- Read aloud to check natural flow
`.trim()

/** 대본 Self-Verification 체크리스트 */
const SCRIPT_SELF_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your script:
✓ No exaggerated claims (최고, 완벽, 100%, 무조건)?
✓ No false advertising language?
✓ Suitable for TTS (no complex symbols)?
✓ Character count within target range (±10%)?
✓ Natural spoken rhythm?
If any check fails, revise before responding.
`.trim()

// ============================================================
// 프롬프트 템플릿
// ============================================================

/** 제품 설명 대본 생성 시스템 프롬프트 */
export const SCRIPT_GENERATION_SYSTEM_PROMPT = `You are an expert short-form advertising scriptwriter. Create short, impactful ad scripts based on product information.

WRITING PRINCIPLES:
1. Hook the audience with the first sentence
2. Clearly communicate the product's core value
3. Write in natural spoken language (for TTS recording)
4. Minimize numbers and special characters
5. Use conversational tone that flows naturally when read aloud

IMPORTANT GUIDELINES:
- Avoid exaggerated claims
- No false or misleading advertising
- No competitor disparagement
- Comply with advertising regulations

OUTPUT LANGUAGE: Write scripts in Korean (한국어) unless otherwise specified.`

/** 대본 생성 요청 템플릿 */
export const SCRIPT_GENERATION_TEMPLATE: PromptTemplate = {
  id: 'script-generation-v1',
  name: '제품 설명 대본 생성',
  description: '3가지 스타일의 제품 설명 대본을 생성하는 템플릿',
  category: 'script',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-16',
  },
  variables: [
    'productInfo',
    'durationSeconds',
    'targetCharCount',
    'additionalInstructions',
  ],
  template: `${SCRIPT_GENERATION_SYSTEM_PROMPT}

PRODUCT INFORMATION:
{{productInfo}}

REQUIREMENTS:
- Video duration: {{durationSeconds}} seconds
- Target character count: approximately {{targetCharCount}} characters (±10%)
- Write in 3 styles: formal, casual, energetic

{{additionalInstructions}}

${SCRIPT_STYLE_EXAMPLES}

OUTPUT FORMAT (JSON):
{
  "productSummary": "One-sentence product summary in Korean",
  "scripts": [
    {
      "style": "formal",
      "styleName": "공식적",
      "content": "Korean script content",
      "estimatedDuration": estimated_seconds
    },
    {
      "style": "casual",
      "styleName": "캐주얼",
      "content": "Korean script content",
      "estimatedDuration": estimated_seconds
    },
    {
      "style": "energetic",
      "styleName": "활기찬",
      "content": "Korean script content",
      "estimatedDuration": estimated_seconds
    }
  ]
}

${SCRIPT_SELF_VERIFICATION}

Respond with valid JSON only.`,
}

/** 대본 다국어 번역 템플릿 */
export const SCRIPT_TRANSLATION_TEMPLATE: PromptTemplate = {
  id: 'script-translation-v1',
  name: '대본 번역',
  description: '대본을 다른 언어로 번역하는 템플릿',
  category: 'script',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-16',
  },
  variables: ['originalScript', 'targetLanguage', 'targetCharCount'],
  template: `You are an expert advertising script translator. Provide natural translations while preserving the tone and impact of the original script.

ORIGINAL SCRIPT:
{{originalScript}}

TARGET LANGUAGE: {{targetLanguage}}
TARGET CHARACTER COUNT: approximately {{targetCharCount}} characters

TRANSLATION PRINCIPLES:
1. Prioritize natural expression over literal translation
2. Maintain advertising impact and persuasiveness
3. Consider cultural context
4. Use expressions suitable for TTS recording

${SCRIPT_TRANSLATION_COT}

OUTPUT FORMAT (JSON):
{
  "translatedScript": "Translated script",
  "estimatedDuration": estimated_seconds,
  "notes": "Translation considerations (optional)"
}

${SCRIPT_SELF_VERIFICATION}

Respond with valid JSON only.`,
}

// ============================================================
// 대본 검증 유틸리티
// ============================================================

/** 대본 품질 검증 규칙 */
export const SCRIPT_VALIDATION_RULES = {
  /** 최소 길이 (글자) */
  minLength: 20,
  /** 최대 길이 (글자) */
  maxLength: 500,
  /** 금지 키워드 (광고법 위반 가능성) */
  forbiddenKeywords: [
    '최고',
    '최초',
    '유일',
    '완벽',
    '기적',
    '100%',
    '절대',
    '확실히',
    '무조건',
  ],
  /** 의료/건강 관련 주의 키워드 */
  healthCautionKeywords: [
    '치료',
    '치유',
    '예방',
    '효과',
    '개선',
    '완치',
  ],
}

/** 대본 검증 함수 */
export function validateScript(script: string): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  // 길이 검증
  if (script.length < SCRIPT_VALIDATION_RULES.minLength) {
    errors.push(`대본이 너무 짧습니다. (최소 ${SCRIPT_VALIDATION_RULES.minLength}자)`)
  }
  if (script.length > SCRIPT_VALIDATION_RULES.maxLength) {
    errors.push(`대본이 너무 깁니다. (최대 ${SCRIPT_VALIDATION_RULES.maxLength}자)`)
  }

  // 금지 키워드 검증
  for (const keyword of SCRIPT_VALIDATION_RULES.forbiddenKeywords) {
    if (script.includes(keyword)) {
      warnings.push(`광고법 위반 가능성: "${keyword}" 표현 사용`)
    }
  }

  // 건강 관련 키워드 경고
  for (const keyword of SCRIPT_VALIDATION_RULES.healthCautionKeywords) {
    if (script.includes(keyword)) {
      warnings.push(`의료법 주의: "${keyword}" 표현 - 제품 유형에 따라 검토 필요`)
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  }
}
