/**
 * Gemini API 클라이언트
 *
 * @deprecated 이 파일은 하위 호환성을 위해 유지됩니다.
 * 새로운 코드에서는 '@/lib/gemini'에서 직접 import하세요.
 *
 * 모듈 구조:
 * - ./types.ts - 타입 정의
 * - ./shared.ts - 공용 클라이언트/유틸리티
 * - ./product.ts - 제품 정보 관련
 * - ./video-prompt.ts - 영상 프롬프트 생성
 * - ./avatar-prompt.ts - AI 아바타 프롬프트
 * - ./category.ts - 카테고리 추천
 * - ./image-editing.ts - 이미지 편집
 * - ./scenario.ts - 시나리오 생성
 */

// 타입 re-export
export type {
  ProductInfoInput,
  ProductSummary,
  UrlExtractResult,
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
  CameraCompositionType,
  ModelPoseType,
  OutfitPresetType,
  BackgroundGenerationMode,
  BackgroundOptions,
  BackgroundPromptInput,
  BackgroundPromptResult,
  ImageAdType,
  AvatarCharacteristics,
  ImageAdPromptInput,
  ImageAdPromptResult,
  ReferenceStyleAnalysisInput,
  AnalyzedOptionValue,
  ReferenceStyleAnalysisResult,
  FirstFramePromptInput,
  FirstFramePromptResult,
  AiAvatarBodyType,
  AiAvatarPromptInput,
  AiAvatarPromptResult,
  CategoryOptionItem,
  CategoryOptionGroup,
  AvatarInfoForScenario,
  RecommendedOptionsInput,
  RecommendedOptionsResult,
  MultipleRecommendedOptionsResult,
  MergeEditPromptInput,
  MergeEditPromptResult,
} from './types'

// 함수 re-export
export { summarizeProductInfo, extractProductFromUrl } from './product'
export { generateText, generateVideoPrompt, generateVideoAdPrompts, generateUGCPrompts, generateProductScripts, generateFirstFramePrompt } from './video-prompt'
export { generateAiAvatarPrompt } from './avatar-prompt'
export { generateRecommendedCategoryOptions, generateMultipleRecommendedOptions, generateImageAdPrompt, analyzeReferenceStyleImage, generateBackgroundPrompt } from './category'
export { mergeEditPrompt } from './image-editing'
