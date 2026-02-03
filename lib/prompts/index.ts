/**
 * 프롬프트 중앙 관리 모듈
 *
 * 이 모듈은 서비스 전체에서 사용되는 AI 프롬프트를 중앙에서 관리합니다.
 *
 * 장점:
 * - 프롬프트 버전 관리 용이
 * - A/B 테스트 지원
 * - 일관된 프롬프트 스타일 유지
 * - 다국어 지원 용이
 *
 * 사용 예시:
 * ```typescript
 * import { PROMPTS, fillTemplate } from '@/lib/prompts'
 *
 * const prompt = fillTemplate(
 *   PROMPTS.imageAd.promptRequest.template,
 *   { productName: '스킨케어 세럼', adType: 'holding' }
 * )
 * ```
 */

// 타입 및 유틸리티
export * from './types'

// 공통 프롬프트 컴포넌트
export * from './common'

// 기능별 프롬프트
export * from './image-ad'
export * from './scripts'
export * from './first-frame'
export * from './avatar-motion'

// 프롬프트 정제 유틸리티
export * from './sanitize'

// ============================================================
// 통합 프롬프트 객체
// ============================================================

import {
  IMAGE_AD_NEGATIVE_PROMPT,
} from './image-ad'

import {
  SCRIPT_GENERATION_TEMPLATE,
  SCRIPT_TRANSLATION_TEMPLATE,
  SCRIPT_GENERATION_SYSTEM_PROMPT,
  SCRIPT_STYLES,
  TTS_SPEED_CONFIG,
} from './scripts'

import {
  FIRST_FRAME_PROMPT_TEMPLATE,
  AI_AVATAR_FIRST_FRAME_TEMPLATE,
  FIRST_FRAME_SYSTEM_PROMPT,
  CAMERA_COMPOSITION_DETAILED_GUIDES,
  DEFAULT_LOCATION_OPTIONS,
  PRODUCT_CATEGORY_LOCATIONS,
} from './first-frame'

import {
  AI_AVATAR_GENERATION_TEMPLATE,
  FRAME_PROMPT_IMPROVEMENT_TEMPLATE,
  STORY_GENERATION_TEMPLATE,
  AI_AVATAR_SYSTEM_PROMPT,
  FRAME_PROMPT_SYSTEM,
  STORY_GENERATION_SYSTEM,
  AVATAR_MOTION_NEGATIVE_PROMPT,
} from './avatar-motion'

import {
  PHOTOREALISM_ESSENTIALS,
  COMMON_NEGATIVE_PROMPT,
  AVATAR_NEGATIVE_PROMPT,
  PRODUCT_NEGATIVE_PROMPT,
  BRAND_PRESERVATION_INSTRUCTION,
  CAMERA_COMPOSITION_PROMPTS,
  MOOD_LIGHTING,
  LOCATION_BACKGROUNDS,
} from './common'

/** 모든 프롬프트를 카테고리별로 정리한 객체 */
export const PROMPTS = {
  /** 이미지 광고 관련 프롬프트 */
  imageAd: {
    negativePrompt: IMAGE_AD_NEGATIVE_PROMPT,
  },

  /** 대본 생성 관련 프롬프트 */
  script: {
    generation: SCRIPT_GENERATION_TEMPLATE,
    translation: SCRIPT_TRANSLATION_TEMPLATE,
    systemPrompt: SCRIPT_GENERATION_SYSTEM_PROMPT,
    styles: SCRIPT_STYLES,
    ttsSpeed: TTS_SPEED_CONFIG,
  },

  /** 첫 프레임 이미지 관련 프롬프트 */
  firstFrame: {
    promptTemplate: FIRST_FRAME_PROMPT_TEMPLATE,
    aiAvatarTemplate: AI_AVATAR_FIRST_FRAME_TEMPLATE,
    systemPrompt: FIRST_FRAME_SYSTEM_PROMPT,
    cameraGuides: CAMERA_COMPOSITION_DETAILED_GUIDES,
    locationOptions: DEFAULT_LOCATION_OPTIONS,
    productCategoryLocations: PRODUCT_CATEGORY_LOCATIONS,
  },

  /** 공통 프롬프트 컴포넌트 */
  common: {
    photorealism: PHOTOREALISM_ESSENTIALS,
    negativePrompts: {
      common: COMMON_NEGATIVE_PROMPT,
      avatar: AVATAR_NEGATIVE_PROMPT,
      product: PRODUCT_NEGATIVE_PROMPT,
    },
    brandPreservation: BRAND_PRESERVATION_INSTRUCTION,
    cameraComposition: CAMERA_COMPOSITION_PROMPTS,
    lighting: MOOD_LIGHTING,
    backgrounds: LOCATION_BACKGROUNDS,
  },

  /** 아바타 모션 영상 관련 프롬프트 */
  avatarMotion: {
    avatarGeneration: AI_AVATAR_GENERATION_TEMPLATE,
    frameImprovement: FRAME_PROMPT_IMPROVEMENT_TEMPLATE,
    storyGeneration: STORY_GENERATION_TEMPLATE,
    avatarSystemPrompt: AI_AVATAR_SYSTEM_PROMPT,
    frameSystemPrompt: FRAME_PROMPT_SYSTEM,
    storySystemPrompt: STORY_GENERATION_SYSTEM,
    negativePrompt: AVATAR_MOTION_NEGATIVE_PROMPT,
  },
}

// ============================================================
// Fallback 프롬프트 (API 실패 시 사용)
// ============================================================

/** API 실패 시 사용할 기본 프롬프트 (UGC 스타일 - 조리개 f/11, 배경 완전 선명) */
export const FALLBACK_PROMPTS = {
  /** 이미지 광고 기본 프롬프트 (UGC 스타일) */
  imageAd: {
    holding: 'The model from Figure 1 naturally holding the product at chest level, looking at camera with calm natural expression, in lived-in interior with background details visible, natural light from window with realistic shadows, shot on 35mm lens at f/11, film grain ISO 400, candid off-center composition, entire scene from foreground to background in razor sharp focus, absolutely NO blur NO bokeh NO soft focus anywhere in the image, Hyperrealistic photograph',
    productOnly: 'Product on a real surface with everyday background details visible, natural window lighting with realistic shadows, shot on 35mm lens at f/16, entire image in perfect sharp focus including all background details, absolutely NO blur NO bokeh, crystal clear background, Hyperrealistic photograph',
    lifestyle: 'Person naturally using product in daily life scene with lived-in background, authentic candid moment, natural daylight from window, shot on 35mm lens at f/11, film grain ISO 400, every element from subject to background in razor sharp focus, absolutely NO blur NO bokeh NO soft background, Hyperrealistic photograph',
  },

  /** 첫 프레임 기본 프롬프트 (UGC 스타일) */
  firstFrame: 'The model from Figure 1 naturally holding product with calm expression, in lived-in interior with background details visible, natural light from window with realistic shadows, eye-level frontal view slightly off-center, shot on 35mm lens at f/11, film grain ISO 400, entire scene in razor sharp focus from foreground to background, absolutely NO blur NO bokeh NO soft focus, Hyperrealistic photograph',

  /** 배경 기본 프롬프트 */
  background: 'Clean minimalist background with soft natural lighting from window, neutral colors, subtle shadows, sharp in-focus details, no people or text, high resolution photograph',

  /** 네거티브 프롬프트 */
  negative: AVATAR_NEGATIVE_PROMPT,
}

// ============================================================
// 프롬프트 버전 정보
// ============================================================

/** 현재 프롬프트 버전 */
export const PROMPT_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  releaseDate: '2025-01-16',
  description: 'Initial centralized prompt management system',
}

/** 프롬프트 변경 로그 */
export const PROMPT_CHANGELOG = [
  {
    version: '1.0.0',
    date: '2025-01-16',
    changes: [
      '프롬프트 중앙 관리 시스템 도입',
      '이미지 광고, 대본, 첫 프레임 프롬프트 분리',
      '공통 컴포넌트 추출 (포토리얼리즘, 네거티브 프롬프트 등)',
      'Fallback 프롬프트 추가',
    ],
  },
]
