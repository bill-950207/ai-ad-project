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

/** 아바타 생성 크레딧 (Kie.ai Z-Image: ~$0.02) */
export const AVATAR_CREDIT_COST = 1

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

/** 제품 설명 영상 크레딧 (Wan/Kling + TTS: ~$0.30-0.50) */
export const PRODUCT_DESCRIPTION_VIDEO_CREDIT_COST = 10

/** 아바타 모션 영상 길이별 크레딧 (Kie.ai Kling 2.6) */
export const AVATAR_MOTION_CREDIT_COST = {
  5: 40, // 5초: ~$0.50
  10: 60, // 10초: ~$0.80
} as const

// ============================================================
// 제품 광고 영상 관련
// ============================================================

/** 제품 광고 영상 생성 크레딧 (Seedance/Wan 2.6) */
export const PRODUCT_AD_VIDEO_CREDIT_COST = {
  seedance: {
    4: 8, // 4초: ~$0.30
    8: 12, // 8초: ~$0.50
    12: 16, // 12초: ~$0.70
  },
  'wan2.6': {
    5: 10, // 5초: ~$0.40
    10: 15, // 10초: ~$0.60
    15: 20, // 15초: ~$0.80
  },
} as const

/** 키프레임 이미지 생성 크레딧 (Seedream 4.5, 이미지당) */
export const KEYFRAME_CREDIT_COST = 3 // ~$0.08/장

/** 씬 전환 영상 생성 크레딧 (Kling O1, 전환당) */
export const TRANSITION_CREDIT_COST = 12 // ~$0.50/전환

// ============================================================
// 오디오 관련
// ============================================================

/** 음악 생성 크레딧 (Kie.ai Suno V5: ~$0.10-0.15) */
export const MUSIC_CREDIT_COST = 3

/** TTS 음성 생성 크레딧 (무료 - 영상 워크플로우 포함) */
export const TTS_CREDIT_COST = 0

// ============================================================
// 무료 기능
// ============================================================

/** 배경 제거 크레딧 (무료 - Kie.ai Recraft: ~$0.01) */
export const REMBG_CREDIT_COST = 0

// ============================================================
// 타입 정의
// ============================================================

export type ImageQuality = keyof typeof IMAGE_AD_CREDIT_COST
export type AvatarMotionDuration = keyof typeof AVATAR_MOTION_CREDIT_COST
