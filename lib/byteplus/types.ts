/**
 * BytePlus ModelArk API 타입 정의
 *
 * Seedance 2.0 (ByteDance) 영상 생성을 위한 타입 정의
 * BytePlus ModelArk Content Generation API 기반
 */

// ============================================================
// Seedance V2 설정 타입
// ============================================================

/** Seedance 2.0 지원 화면 비율 */
export type SeedanceV2AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'

/** Seedance 2.0 지원 해상도 */
export type SeedanceV2Resolution = '480p' | '720p' | '1080p'

// ============================================================
// BytePlus API 요청/응답 타입
// ============================================================

/** 영상 생성 입력 */
export interface BytePlusVideoInput {
  prompt: string
  imageUrls?: string[]
  aspectRatio?: SeedanceV2AspectRatio
  resolution?: SeedanceV2Resolution
  duration?: number
  generateAudio?: boolean
}

/** BytePlus 콘텐츠 타입 */
export type BytePlusContentItem =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

/** BytePlus 태스크 생성 요청 */
export interface BytePlusCreateTaskRequest {
  model: string
  content: BytePlusContentItem[]
}

/** BytePlus 태스크 상태 */
export type BytePlusTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed'

/** BytePlus 태스크 응답 */
export interface BytePlusTaskResponse {
  id: string
  model: string
  status: BytePlusTaskStatus
  content?: BytePlusContentItem[]
  output?: {
    video_url?: string
    audio_url?: string
  }
  error?: {
    code: string
    message: string
  }
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  created_at?: number
  updated_at?: number
}

/** BytePlus API 에러 응답 */
export interface BytePlusErrorResponse {
  error: {
    code: string
    message: string
    type?: string
  }
}

// ============================================================
// 정규화된 상태 타입 (내부 사용)
// ============================================================

/** 정규화된 태스크 상태 결과 */
export interface BytePlusTaskResult {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  videoUrl?: string
  error?: string
}

// ============================================================
// 시네마틱 광고 시나리오 타입
// ============================================================

/** 멀티샷 브레이크다운 (UI 표시용) */
export interface ShotBreakdown {
  shotNumber: number
  description: string
  estimatedDuration: string
}

/** 시네마틱 광고 시나리오 정보 */
export interface CinematicScenarioInfo {
  title: string
  description: string
  mood: string
  multiShotPrompt: string
  shotBreakdown: ShotBreakdown[]
  recommendedSettings: {
    aspectRatio: SeedanceV2AspectRatio
    duration: number
  }
}
