/**
 * Gemini API 타입 정의
 */

// ============================================================
// 제품 관련 타입
// ============================================================

/** 제품 정보 요약 입력 */
export interface ProductInfoInput {
  productName?: string
  productDescription?: string
  productFeatures?: string[]
  targetAudience?: string
  brandName?: string
  price?: string
  rawText?: string
  /** 출력 언어 */
  language?: 'ko' | 'en' | 'ja' | 'zh'
}

/** 제품 정보 요약 결과 */
export interface ProductSummary {
  summary: string
  keyPoints: string[]
  suggestedTone: string
}

/** URL 추출 결과 */
export interface UrlExtractResult {
  title?: string
  description?: string
  price?: string
  brand?: string
  features?: string[]
  imageUrl?: string
  rawContent?: string
}

// ============================================================
// 영상 프롬프트 관련 타입
// ============================================================

/** 영상 프롬프트 생성 입력 */
export interface VideoPromptInput {
  productSummary: string
  productImageUrl?: string
  avatarImageUrl?: string
  duration: number
  style?: string
  additionalInstructions?: string
}

/** 영상 프롬프트 생성 결과 */
export interface VideoPromptResult {
  prompt: string
  negativePrompt: string
}

/** 통합 영상 광고 프롬프트 생성 입력 */
export interface VideoAdPromptInput {
  productInfo?: string
  productUrl?: string
  productImageUrl?: string
  avatarImageUrl?: string
  duration: number
  style?: string
  additionalInstructions?: string
}

/** 통합 영상 광고 프롬프트 생성 결과 */
export interface VideoAdPromptResult {
  productSummary: string
  firstScenePrompt: string
  videoPrompt: string
  negativePrompt: string
}

/** UGC 영상 프롬프트 생성 입력 */
export interface UGCPromptInput {
  productInfo?: string
  productUrl?: string
  productImageUrl?: string
  avatarImageUrl?: string
  script?: string
  duration: number
  mood?: 'friendly' | 'professional' | 'energetic'
  additionalInstructions?: string
  /** 출력 언어 (productSummary, suggestedScript 언어) */
  language?: 'ko' | 'en' | 'ja' | 'zh'
}

/** UGC 영상 프롬프트 생성 결과 */
export interface UGCPromptResult {
  productSummary: string
  firstScenePrompt: string
  videoPrompt: string
  suggestedScript?: string
}

/** 대본 스타일 타입 */
export type ScriptStyle = 'formal' | 'casual' | 'energetic'

/** 개별 대본 */
export interface Script {
  style: ScriptStyle
  styleName: string
  content: string
  estimatedDuration: number
}

/** AI 추천 의상 정보 */
export interface RecommendedOutfit {
  description: string
  localizedDescription: string  // 사용자 선택 언어로 표시
  reason: string
}

/** 제품 설명 대본 생성 입력 */
/** 비디오 타입 */
export type VideoType = 'UGC' | 'podcast' | 'expert'

/** 제품 설명 대본 생성 입력 */
export interface ProductScriptInput {
  productInfo: string
  productUrl?: string
  durationSeconds: number
  language?: 'ko' | 'en' | 'ja' | 'zh'
  additionalInstructions?: string
  requestOutfitRecommendation?: boolean
  avatarDescription?: string
  productImageUrl?: string
  /** 비디오 타입 (UGC, 팟캐스트, 전문가) */
  videoType?: VideoType
}

/** 제품 설명 대본 생성 결과 */
export interface ProductScriptResult {
  productSummary: string
  scripts: Script[]
  recommendedOutfit?: RecommendedOutfit
}

// ============================================================
// 카메라/포즈/의상 타입
// ============================================================

/** 카메라 구도 타입 (영상 스타일별로 다른 옵션 제공) */
export type CameraCompositionType =
  // 공통
  | 'closeup'
  // UGC용 (셀카 스타일)
  | 'selfie-high'
  | 'selfie-front'
  | 'selfie-side'
  | 'ugc-closeup'
  | 'ugc-selfie'
  // Podcast용 (웹캠/데스크 스타일)
  | 'webcam'
  | 'medium-shot'
  | 'three-quarter'
  // Expert용 (전문가 스타일)
  | 'tripod'
  | 'fullbody'
  | 'presenter'

/** 모델 포즈 타입 (영상 스타일별로 다른 옵션 제공) */
export type ModelPoseType =
  // 공통
  | 'talking-only'
  | 'showing-product'
  // UGC용
  | 'holding-product'
  | 'using-product'
  | 'reaction'
  // Podcast용
  | 'desk-presenter'
  | 'casual-chat'
  // Expert용
  | 'demonstrating'
  | 'presenting'
  | 'explaining'

/** 의상 프리셋 타입 */
export type OutfitPresetType =
  | 'casual_everyday'
  | 'formal_elegant'
  | 'professional_business'
  | 'sporty_athletic'
  | 'cozy_comfortable'
  | 'trendy_fashion'
  | 'minimal_simple'

// ============================================================
// 배경 생성 관련 타입
// ============================================================

/** 배경 생성 모드 */
export type BackgroundGenerationMode = 'PRODUCT' | 'OPTIONS' | 'PROMPT'

/** 배경 옵션 타입 */
export interface BackgroundOptions {
  style?: string
  location?: string
  mood?: string
  color?: string
  time?: string
}

/** 배경 프롬프트 생성 입력 */
export interface BackgroundPromptInput {
  mode: BackgroundGenerationMode
  productImageUrl?: string
  productName?: string
  productDescription?: string
  options?: BackgroundOptions
  userPrompt?: string
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  /** 출력 언어 (localizedDescription 언어) */
  language?: 'ko' | 'en' | 'ja' | 'zh'
}

/** 배경 프롬프트 생성 결과 */
export interface BackgroundPromptResult {
  optimizedPrompt: string
  /** 사용자 언어로 된 설명 (language 파라미터에 따라 언어가 달라짐) */
  localizedDescription: string
}

// ============================================================
// 이미지 광고 관련 타입
// ============================================================

/** 이미지 광고 유형 */
export type ImageAdType =
  | 'productOnly'
  | 'holding'
  | 'using'
  | 'wearing'
  | 'lifestyle'
  | 'unboxing'
  | 'seasonal'

/** 아바타 특성 정보 */
export interface AvatarCharacteristics {
  gender?: 'female' | 'male'
  age?: 'teen' | 'early20s' | 'late20s' | '30s' | '40plus'
  ethnicity?: 'korean' | 'eastAsian' | 'western' | 'southeastAsian' | 'black' | 'hispanic' | 'mixed'
  height?: 'short' | 'average' | 'tall'
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'plussize'
  hairStyle?: 'longStraight' | 'bob' | 'wavy' | 'ponytail' | 'short'
  hairColor?: 'blackhair' | 'brown' | 'blonde' | 'custom'
  customHairColor?: string
  vibe?: 'natural' | 'sophisticated' | 'cute' | 'professional'
}

/** 이미지 광고 프롬프트 생성 입력 */
export interface ImageAdPromptInput {
  adType: ImageAdType
  productName?: string
  productDescription?: string
  productImageUrl?: string
  avatarImageUrls?: string[]
  avatarCharacteristics?: AvatarCharacteristics
  outfitImageUrl?: string
  referenceStyleImageUrl?: string
  selectedOptions: Record<string, string>
  additionalPrompt?: string
  aiAvatarDescription?: string
  /** 출력 언어 (localizedDescription 언어) */
  language?: 'ko' | 'en' | 'ja' | 'zh'
}

/** 이미지 광고 프롬프트 생성 결과 */
export interface ImageAdPromptResult {
  optimizedPrompt: string
  /** 사용자 언어로 된 설명 (language 파라미터에 따라 언어가 달라짐) */
  localizedDescription: string
  /** 제품에 로고/텍스트가 있는지 여부 (Gemini가 이미지 분석 결과) */
  productHasLogo?: boolean
}

/** 참조 스타일 이미지 분석 입력 */
export interface ReferenceStyleAnalysisInput {
  imageUrl: string
  adType: ImageAdType
  availableOptions: {
    key: string
    options: string[]
  }[]
  // 제품 정보 (컨텍스트 추가)
  productName?: string
  productDescription?: string
  productSellingPoints?: string[]
  productImageUrl?: string
  // 아바타 정보
  hasAvatar?: boolean
  avatarInfo?: AvatarInfoForScenario
  avatarImageUrl?: string
  // using 타입 전용
  productUsageMethod?: string
  // 출력 언어
  language?: string
}

/** 분석된 옵션 값 */
export interface AnalyzedOptionValue {
  key: string
  type: 'preset' | 'custom'
  value: string
  customText?: string
  confidence: number
  reason: string
}

/** 참조 스타일 이미지 분석 결과 */
export interface ReferenceStyleAnalysisResult {
  analyzedOptions: AnalyzedOptionValue[]
  overallStyle: string
  suggestedPrompt: string
  recommendedAdType?: ImageAdType
  adTypeMatchConfidence?: number
  adTypeMatchReason?: string
  // AI 아바타 추천 스타일 (AI 아바타 선택 시)
  recommendedAvatarStyle?: RecommendedAvatarStyle
}

// ============================================================
// 첫 프레임 관련 타입
// ============================================================

/** 첫 프레임 이미지 프롬프트 생성 입력 */
export interface FirstFramePromptInput {
  productInfo: string
  avatarImageUrl: string
  locationPrompt?: string
  productImageUrl?: string
  cameraComposition?: CameraCompositionType
  modelPose?: ModelPoseType
  outfitPreset?: OutfitPresetType
  outfitCustom?: string
  /** 비디오 타입 (UGC, 팟캐스트, 전문가) */
  videoType?: VideoType
  /** 아바타 특징 설명 (이름, 성별, 연령대 등) - 더 이상 사용되지 않음 */
  avatarDescription?: string
  /** 아바타 체형 정보 (일관성 유지용) */
  bodyType?: string
  /** 아바타 성별 (체형 설명 시 성별에 맞는 표현 사용) */
  avatarGender?: 'male' | 'female'
  /** 표정 프롬프트 (프리셋에서 변환된 영문 프롬프트) */
  expressionPrompt?: string
  /** 조명 프롬프트 (프리셋에서 변환된 영문 프롬프트) */
  lightingPrompt?: string
  /** 출력 언어 (locationDescription 언어) */
  language?: 'ko' | 'en' | 'ja' | 'zh'
}

/** 첫 프레임 이미지 프롬프트 생성 결과 */
export interface FirstFramePromptResult {
  prompt: string
  locationDescription: string
}

// ============================================================
// AI 아바타 프롬프트 관련 타입
// ============================================================

/** AI 아바타 몸매 타입 */
export type AiAvatarBodyType = 'slim' | 'average' | 'athletic' | 'curvy' | 'any'

/** AI 아바타 인종 타입 */
export type AiAvatarEthnicity = 'korean' | 'asian' | 'western' | 'japanese' | 'chinese' | 'any'

/** AI 아바타 키 타입 */
export type AiAvatarHeight = 'short' | 'average' | 'tall' | 'any'

/** AI 아바타 헤어스타일 타입 */
export type AiAvatarHairStyle = 'short' | 'medium' | 'long' | 'any'

/** AI 아바타 헤어컬러 타입 */
export type AiAvatarHairColor = 'black' | 'brown' | 'blonde' | 'any'

/** AI 아바타 프롬프트 생성 입력 */
export interface AiAvatarPromptInput {
  productInfo: string
  productImageUrl?: string
  locationPrompt?: string
  cameraComposition?: CameraCompositionType
  modelPose?: ModelPoseType
  outfitPreset?: OutfitPresetType
  outfitCustom?: string
  targetGender?: 'male' | 'female' | 'any'
  targetAge?: 'young' | 'middle' | 'mature' | 'any'
  style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
  ethnicity?: AiAvatarEthnicity
  /** 몸매 타입 */
  bodyType?: AiAvatarBodyType
  /** 비디오 타입 (UGC, 팟캐스트, 전문가) */
  videoType?: VideoType
  /** 대본 언어 (인종 자동 설정용) */
  language?: 'ko' | 'en' | 'ja' | 'zh'
  /** 키 */
  height?: AiAvatarHeight
  /** 헤어스타일 */
  hairStyle?: AiAvatarHairStyle
  /** 헤어컬러 */
  hairColor?: AiAvatarHairColor
}

/** AI 아바타 프롬프트 생성 결과 */
export interface AiAvatarPromptResult {
  prompt: string
  avatarDescription: string
  locationDescription: string
}

// ============================================================
// 카테고리 추천 관련 타입
// ============================================================

/** 카테고리 옵션 항목 */
export interface CategoryOptionItem {
  key: string
  description: string
}

/** 카테고리 옵션 그룹 */
export interface CategoryOptionGroup {
  key: string
  options: CategoryOptionItem[]
}

/** 아바타 스타일 정보 */
export interface AvatarStyleInfo {
  vibe?: 'natural' | 'sophisticated' | 'cute' | 'professional'
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'plussize'
  height?: 'short' | 'average' | 'tall'
  gender?: 'female' | 'male'
}

/** 추천 아바타 스타일 (AI 추천 아바타용) */
export interface RecommendedAvatarStyle {
  /** 아바타 생성용 프롬프트 (영어, 예: "A sophisticated elegant Korean woman in her late 20s, tall with slim athletic body...") */
  avatarPrompt: string
  /** 아바타 설명 (사용자 언어, 예: "세련된 20대 후반 여성, 키가 크고 날씬한 체형") */
  avatarDescription: string
  /** 구조화된 아바타 특성 (시나리오에 맞게 LLM이 결정) */
  gender?: 'male' | 'female' | 'any'
  age?: 'young' | 'middle' | 'mature' | 'any'
  style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
  ethnicity?: 'korean' | 'asian' | 'western' | 'any'
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'any'
}

/** 아바타 정보 (시나리오 추천용) */
export interface AvatarInfoForScenario {
  type: 'avatar' | 'outfit' | 'ai-generated'
  avatarName?: string
  outfitName?: string
  aiOptions?: {
    targetGender: 'male' | 'female' | 'any'
    targetAge: 'young' | 'middle' | 'mature' | 'any'
    style: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
    ethnicity: 'korean' | 'asian' | 'western' | 'any'
    bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'any'
  }
  // 실제 아바타 선택 시 스타일 정보
  avatarStyle?: AvatarStyleInfo
}

/** AI 자동 설정 입력 */
export interface RecommendedOptionsInput {
  adType: ImageAdType
  productName?: string
  productDescription?: string
  productSellingPoints?: string[]  // 제품 셀링 포인트
  categoryGroups: CategoryOptionGroup[]
  language?: string
  hasAvatar?: boolean
  avatarInfo?: AvatarInfoForScenario
  productImageUrl?: string
  productUsageMethod?: string
}

/** AI 자동 설정 결과 */
export interface RecommendedOptionsResult {
  recommendedOptions: Record<string, {
    value: string
    customText?: string
    reason: string
  }>
  overallStrategy: string
  suggestedPrompt?: string
}

/** AI 다중 시나리오 결과 */
export interface MultipleRecommendedOptionsResult {
  scenarios: Array<{
    title: string
    description: string
    targetAudience?: string  // 타겟 오디언스 설명 (예: "20-30대 직장인 여성")
    conceptType?: string  // 시나리오 컨셉 타입 (자유 형식)
    recommendedOptions: Record<string, {
      value: string
      customText?: string
      reason: string
    }>
    overallStrategy: string
    suggestedPrompt?: string
    // AI 추천 아바타용 - 시나리오에 어울리는 아바타 스타일
    recommendedAvatarStyle?: RecommendedAvatarStyle
  }>
}

// ============================================================
// 이미지 편집 관련 타입
// ============================================================

/** 이미지 편집 프롬프트 입력 */
export interface MergeEditPromptInput {
  originalPrompt: string
  userEditRequest: string
  currentImageUrl?: string
}

/** 이미지 편집 프롬프트 결과 */
export interface MergeEditPromptResult {
  mergedPrompt: string
  editSummary: string
}

// ============================================================
// 시나리오 생성 관련 타입
// ============================================================

/** 씬 정보 타입 */
export interface SceneInfoOutput {
  sceneIndex: number
  title: string
  description: string
  imageSummary: string
  videoSummary: string
  firstFramePrompt: string
  motionPromptEN: string
  duration: number
  movementAmplitude: 'auto' | 'small' | 'medium' | 'large'
  location: string
  mood: string
}

/** 추천 설정 타입 */
export interface RecommendedSettingsOutput {
  aspectRatio: '16:9' | '9:16' | '1:1'
  sceneCount: number
}

/** 시나리오 출력 타입 */
export interface ScenarioOutput {
  id: string
  title: string
  description: string
  concept: string
  productAppearance: string
  mood: string
  location: string
  tags: string[]
  recommendedSettings: RecommendedSettingsOutput
  scenes: SceneInfoOutput[]
}

/** 시나리오 생성 결과 타입 */
export interface GenerateScenariosResult {
  scenarios: ScenarioOutput[]
}
