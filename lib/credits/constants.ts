/**
 * AIAD 크레딧 시스템 - 중앙 집중화된 크레딧 상수
 *
 * 가격 기준: AI 서비스 실제 비용 × 마진율 (2.5x)
 * 크레딧 단가: 약 100원/크레딧 ($0.07)
 *
 * API 비용 참고:
 * - Kie.ai: $0.005/크레딧
 * - WaveSpeed TTS: Minimax $0.03-0.06/1000자
 * - ElevenLabs: $0.12-0.30/1000자
 */

// ============================================================
// 이미지 생성 관련
// ============================================================

/** 아바타 생성 크레딧 (무료 - 신규 사용자 유치) */
export const AVATAR_CREDIT_COST = 0

/** 의상 교체 크레딧 (Kie.ai Seedream 4.5: ~$0.05) */
export const OUTFIT_CREDIT_COST = 2

/** 이미지 광고 품질별 크레딧 (Kie.ai Seedream 4.5) */
export const IMAGE_AD_CREDIT_COST = {
  medium: 2, // ~$0.05
  high: 3, // ~$0.08
} as const

/** 이미지 편집 품질별 크레딧 (이미지 광고와 동일) */
export const IMAGE_EDIT_CREDIT_COST = IMAGE_AD_CREDIT_COST

/** 배경 이미지 생성 크레딧 (Kie.ai Z-Image: ~$0.02) */
export const BACKGROUND_CREDIT_COST = 1

// ============================================================
// 영상 생성 관련
// ============================================================

/** 제품 설명 영상 해상도별 크레딧 (Hailuo + TTS) */
export const PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST = {
  '480p': 5, // ~$0.15/5초
  '720p': 10, // ~$0.30/5초
} as const

// ============================================================
// 제품 광고 영상 관련
// ============================================================

/** @deprecated 레거시 영상 모델 (Seedance/Wan 2.6) - Vidu Q3로 대체됨 */
export const PRODUCT_AD_VIDEO_CREDIT_COST = {
  seedance: {
    4: 8,
    8: 12,
    12: 16,
  },
  'wan2.6': {
    5: 10,
    10: 15,
    15: 20,
  },
} as const

/** 키프레임 이미지 생성 크레딧 (Seedream 4.5, 이미지당) */
export const KEYFRAME_CREDIT_COST = 1 // ~$0.03/장

/** @deprecated 씬 전환 영상 (Kling O1) - 현재 서비스에서 미사용 */
export const TRANSITION_CREDIT_COST = 12

/** Vidu Q3 영상 생성 해상도별 초당 크레딧 (WaveSpeed) */
export const VIDU_CREDIT_COST_PER_SECOND = {
  '540p': 1, // SD: ~$0.03/초
  '720p': 2, // HD: ~$0.05/초
  '1080p': 3, // FHD: ~$0.07/초
} as const

// ============================================================
// 오디오 관련
// ============================================================

/** 음악 생성 크레딧 (Kie.ai Suno V5: ~$0.10-0.15) */
export const MUSIC_CREDIT_COST = 1

/** TTS 음성 생성 크레딧 (무료 - 영상 워크플로우 포함) */
export const TTS_CREDIT_COST = 0

// ============================================================
// 무료 기능
// ============================================================

/** 배경 제거 크레딧 (무료 - Kie.ai Recraft: ~$0.01) */
export const REMBG_CREDIT_COST = 0

/** 제품 등록 크레딧 (무료 - 배경 제거 포함) */
export const PRODUCT_CREDIT_COST = 0

// ============================================================
// 회원가입 관련
// ============================================================

/** 회원가입 시 기본 크레딧 (FREE 플랜 월간 크레딧과 동일) */
export const DEFAULT_SIGNUP_CREDITS = 20

// ============================================================
// 타입 정의
// ============================================================

export type ImageQuality = keyof typeof IMAGE_AD_CREDIT_COST
export type ViduResolution = keyof typeof VIDU_CREDIT_COST_PER_SECOND
export type ProductDescriptionResolution = keyof typeof PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST
