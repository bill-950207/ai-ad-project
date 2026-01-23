/**
 * 아바타 모션 영상용 프롬프트 모듈
 *
 * AI 아바타 생성, 프레임 이미지 생성, 시나리오 생성, 영상 생성에 사용되는 프롬프트 템플릿들
 */

// ============================================================
// AI 아바타 생성 프롬프트
// ============================================================
export {
  AI_AVATAR_SYSTEM_PROMPT,
  AI_AVATAR_GENERATION_TEMPLATE,
  CONTEXT_AWARE_AVATAR_SYSTEM_PROMPT,
  CONTEXT_AWARE_AVATAR_TEMPLATE,
  buildAvatarGenerationPrompt,
  buildContextAwareAvatarPrompt,
} from './avatar-generation'

export type { ContextAwareAvatarParams } from './avatar-generation'

// ============================================================
// 프레임 이미지 생성 프롬프트
// ============================================================
export {
  FRAME_PROMPT_SYSTEM,
  FRAME_PROMPT_IMPROVEMENT_TEMPLATE,
  END_FRAME_PROMPT_IMPROVEMENT_TEMPLATE,
  AVATAR_MOTION_NEGATIVE_PROMPT,
  buildFrameImprovementPrompt,
  buildEndFrameImprovementPrompt,
} from './frame-generation'

// ============================================================
// 시나리오 생성 프롬프트
// ============================================================
export {
  // 단일 씬 시나리오
  CINEMATIC_SCENARIO_SYSTEM,
  SCENARIO_GENERATION_TEMPLATE,
  buildScenarioGenerationPrompt,
  // 멀티 씬 시나리오
  MULTI_SCENE_SCENARIO_SYSTEM,
  MULTI_SCENE_SCENARIO_TEMPLATE,
  buildMultiSceneScenarioPrompt,
  // 완전 시나리오 (설정 포함)
  COMPLETE_SCENARIO_SYSTEM,
  COMPLETE_SCENARIO_GENERATION_TEMPLATE,
  buildCompleteScenarioPrompt,
  // 시나리오 수정
  SCENARIO_MODIFICATION_SYSTEM,
  SCENARIO_MODIFICATION_TEMPLATE,
  buildScenarioModificationPrompt,
  // Legacy aliases
  STORY_GENERATION_TEMPLATE,
  STORY_GENERATION_SYSTEM,
  buildStoryGenerationPrompt,
} from './scenario-generation'

// ============================================================
// 영상 생성 프롬프트
// ============================================================
export {
  buildVideoGenerationPrompt,
  translateActionToEnglish,
  translateMoodToEnglish,
} from './video-generation'

export type { VideoPromptParams } from './video-generation'

// ============================================================
// AI 추천 설정 프롬프트
// ============================================================
export {
  AI_RECOMMENDATION_SYSTEM,
  AI_RECOMMENDATION_TEMPLATE,
  buildAIRecommendationPrompt,
} from './recommendation'
