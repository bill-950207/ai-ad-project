/**
 * Gemini 모듈 통합 export
 */

// ============================================================
// 타입 정의
// ============================================================
export type {
  // 제품 관련
  ProductInfoInput,
  ProductSummary,
  UrlExtractResult,
  // 영상 프롬프트 관련
  VideoPromptInput,
  VideoPromptResult,
  VideoAdPromptInput,
  VideoAdPromptResult,
  UGCPromptInput,
  UGCPromptResult,
  ScriptStyle,
  Script,
  RecommendedOutfit,
  ProductScriptInput,
  ProductScriptResult,
  // 카메라/포즈/의상
  CameraCompositionType,
  ModelPoseType,
  OutfitPresetType,
  // 배경 생성
  BackgroundGenerationMode,
  BackgroundOptions,
  BackgroundPromptInput,
  BackgroundPromptResult,
  // 이미지 광고
  ImageAdType,
  AvatarCharacteristics,
  ImageAdPromptInput,
  ImageAdPromptResult,
  ReferenceStyleAnalysisInput,
  AnalyzedOptionValue,
  ReferenceStyleAnalysisResult,
  // 첫 프레임
  FirstFramePromptInput,
  FirstFramePromptResult,
  // AI 아바타
  AiAvatarPromptInput,
  AiAvatarPromptResult,
  // 카테고리 추천
  CategoryOptionItem,
  CategoryOptionGroup,
  AvatarInfoForScenario,
  RecommendedOptionsInput,
  RecommendedOptionsResult,
  MultipleRecommendedOptionsResult,
  // 이미지 편집
  MergeEditPromptInput,
  MergeEditPromptResult,
  // 시나리오 생성
  SceneInfoOutput,
  RecommendedSettingsOutput,
  ScenarioOutput,
  GenerateScenariosResult,
} from './types'

// ============================================================
// 제품 관련 함수
// ============================================================
export {
  summarizeProductInfo,
  extractProductFromUrl,
} from './product'

// ============================================================
// 영상 프롬프트 생성 함수
// ============================================================
export {
  generateText,
  generateVideoPrompt,
  generateVideoAdPrompts,
  generateUGCPrompts,
  generateProductScripts,
  generateFirstFramePrompt,
} from './video-prompt'

// ============================================================
// AI 아바타 프롬프트 생성 함수
// ============================================================
export {
  generateAiAvatarPrompt,
} from './avatar-prompt'

// ============================================================
// 카테고리 추천 함수
// ============================================================
export {
  generateRecommendedCategoryOptions,
  generateMultipleRecommendedOptions,
  generateImageAdPrompt,
  analyzeReferenceStyleImage,
  generateBackgroundPrompt,
} from './category'

// ============================================================
// 이미지 편집 함수
// ============================================================
export {
  mergeEditPrompt,
} from './image-editing'

// ============================================================
// 시나리오 생성 함수
// ============================================================
export {
  generateCompleteScenarios,
  generateMultiSceneScenarios,
  generateSingleSceneScenarios,
} from './scenario'

// ============================================================
// 공용 유틸리티 (내부용)
// ============================================================
export { getGenAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
