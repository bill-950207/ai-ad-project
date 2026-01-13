/**
 * fal.ai 클라이언트
 *
 * AI 이미지 생성을 위한 fal.ai Queue API 클라이언트입니다.
 * z-image-turbo-lora 모델을 사용하여 아바타 이미지를 생성합니다.
 */

import { fal } from "@fal-ai/client"

// 사용할 모델 ID
const MODEL_ID = 'fal-ai/z-image/turbo/lora'

// fal 클라이언트 API 키 설정
fal.config({
  credentials: process.env.FAL_KEY!,
})

// ============================================================
// 타입 정의
// ============================================================

/** 큐 제출 응답 */
export interface FalQueueSubmitResponse {
  request_id: string      // 요청 고유 ID
  response_url: string    // 결과 조회 URL
  status_url: string      // 상태 확인 URL
  cancel_url: string      // 취소 요청 URL
}

/** 큐 상태 응답 */
export interface FalQueueStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'  // 현재 상태
  queue_position?: number   // 큐에서의 대기 순서
  response_url?: string     // 결과 조회 URL
  logs?: FalLog[]           // 처리 로그
  metrics?: Record<string, number>  // 성능 지표
}

/** 로그 항목 */
export interface FalLog {
  timestamp: string   // 로그 시간
  message: string     // 로그 메시지
  level?: string      // 로그 레벨 (info, warn, error 등)
  source?: string     // 로그 출처
}

/** 생성된 이미지 정보 */
export interface FalImageOutput {
  url: string           // 이미지 URL
  content_type: string  // MIME 타입 (예: image/png)
  file_name?: string    // 파일명
  file_size?: number    // 파일 크기 (bytes)
  width: number         // 이미지 너비 (px)
  height: number        // 이미지 높이 (px)
}

/** z-image 모델 응답 */
export interface FalZImageResponse {
  images: FalImageOutput[]      // 생성된 이미지 목록
  seed: number                  // 생성에 사용된 시드값
  prompt: string                // 확장된 프롬프트
  has_nsfw_concepts: boolean[]  // NSFW 감지 여부
  timings?: Record<string, number>  // 처리 시간 정보
}

// ============================================================
// API 함수
// ============================================================

/**
 * 이미지 생성 요청을 fal.ai 큐에 제출
 *
 * @param prompt - 이미지 생성 프롬프트
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitToQueue(prompt: string): Promise<FalQueueSubmitResponse> {
  const input = {
    prompt,
    num_inference_steps: 8,        // 추론 단계 수
    enable_prompt_expansion: true, // 프롬프트 자동 확장 활성화
    image_size: {
      width: 960 * 1.5,
      height: 1704 * 1.5,
    },
  }

  // 큐에 요청 제출
  const { request_id } = await fal.queue.submit(MODEL_ID, {
    input,
  })

  // 응답 URL 생성
  return {
    request_id,
    response_url: `https://queue.fal.run/${MODEL_ID}/requests/${request_id}`,
    status_url: `https://queue.fal.run/${MODEL_ID}/requests/${request_id}/status`,
    cancel_url: `https://queue.fal.run/${MODEL_ID}/requests/${request_id}/cancel`,
  }
}

/**
 * 큐에 제출된 요청의 상태 조회
 *
 * @param requestId - 요청 ID
 * @returns 현재 상태 정보
 */
export async function getQueueStatus(requestId: string): Promise<FalQueueStatusResponse> {
  const status = await fal.queue.status(MODEL_ID, {
    requestId,
    logs: true,  // 로그 포함
  })

  // 상태 객체에서 속성 안전하게 추출 (타입이 상태에 따라 다름)
  const statusObj = status as unknown as Record<string, unknown>

  return {
    status: status.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED',
    queue_position: statusObj.queue_position as number | undefined,
    logs: statusObj.logs as FalLog[] | undefined,
  }
}

/**
 * 완료된 요청의 결과 조회
 *
 * @param requestId - 요청 ID
 * @returns 생성된 이미지 정보
 */
export async function getQueueResponse(requestId: string): Promise<FalZImageResponse> {
  const result = await fal.queue.result(MODEL_ID, {
    requestId,
  })

  return result.data as FalZImageResponse
}

/**
 * 큐에 대기 중인 요청 취소
 * (이미 처리가 시작된 경우 취소 불가)
 *
 * @param requestId - 요청 ID
 * @returns 취소 성공 여부
 */
export async function cancelQueueRequest(requestId: string): Promise<boolean> {
  try {
    await fal.queue.cancel(MODEL_ID, {
      requestId,
    })
    return true
  } catch {
    return false
  }
}

// ============================================================
// 의상 교체 관련 타입 및 함수
// ============================================================

/** 의상 교체 모델 ID (qwen-image-edit with LoRA) */
const OUTFIT_MODEL_ID = 'fal-ai/qwen-image-edit-2511/lora'

/** 의상 교체용 LoRA 설정 */
const OUTFIT_LORA = {
  path: 'https://civitai.com/api/download/models/2388664?type=Model&format=SafeTensor',
  scale: 1,
}

/** 의상 교체 입력 타입 */
export interface OutfitChangeInput {
  human_image: string        // 아바타 원본 이미지 URL
  garment_image: string      // 의상 이미지 URL
  prompt?: string            // 의상 교체 프롬프트
}

/** 의상 교체 출력 타입 */
export interface OutfitChangeOutput {
  images: FalImageOutput[]    // 생성된 이미지 목록
  seed: number
  prompt: string
  has_nsfw_concepts: boolean[]
  timings?: Record<string, number>
}

/**
 * 의상 교체 요청을 fal.ai 큐에 제출
 *
 * qwen-image-edit-2511/lora 모델을 사용하여 의상 교체 수행
 *
 * @param input - 의상 교체 입력 데이터
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitOutfitChangeToQueue(input: OutfitChangeInput): Promise<FalQueueSubmitResponse> {
  // 기본 프롬프트: 의상 이미지를 참조하여 입혀달라는 지시
  const defaultPrompt = 'Change the clothes of the person in the first image to match the outfit shown in the second image. Keep the same pose, face, and background.'

  const falInput = {
    prompt: input.prompt || defaultPrompt,
    image_urls: [input.human_image, input.garment_image],
    num_inference_steps: 28,
    guidance_scale: 4.5,
    output_format: 'png' as const,
    loras: [OUTFIT_LORA],
  }

  const { request_id } = await fal.queue.submit(OUTFIT_MODEL_ID, {
    input: falInput,
  })

  return {
    request_id,
    response_url: `https://queue.fal.run/${OUTFIT_MODEL_ID}/requests/${request_id}`,
    status_url: `https://queue.fal.run/${OUTFIT_MODEL_ID}/requests/${request_id}/status`,
    cancel_url: `https://queue.fal.run/${OUTFIT_MODEL_ID}/requests/${request_id}/cancel`,
  }
}

/**
 * 의상 교체 큐 상태 조회
 *
 * @param requestId - 요청 ID
 * @returns 현재 상태 정보
 */
export async function getOutfitQueueStatus(requestId: string): Promise<FalQueueStatusResponse> {
  const status = await fal.queue.status(OUTFIT_MODEL_ID, {
    requestId,
    logs: true,
  })

  const statusObj = status as unknown as Record<string, unknown>

  return {
    status: status.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED',
    queue_position: statusObj.queue_position as number | undefined,
    logs: statusObj.logs as FalLog[] | undefined,
  }
}

/**
 * 의상 교체 결과 조회
 *
 * @param requestId - 요청 ID
 * @returns 생성된 이미지 정보
 */
export async function getOutfitQueueResponse(requestId: string): Promise<OutfitChangeOutput> {
  const result = await fal.queue.result(OUTFIT_MODEL_ID, {
    requestId,
  })

  return result.data as OutfitChangeOutput
}

/**
 * 의상 교체 요청 취소
 *
 * @param requestId - 요청 ID
 * @returns 취소 성공 여부
 */
export async function cancelOutfitQueueRequest(requestId: string): Promise<boolean> {
  try {
    await fal.queue.cancel(OUTFIT_MODEL_ID, {
      requestId,
    })
    return true
  } catch {
    return false
  }
}

// ============================================================
// 배경 제거 (rembg) 관련 타입 및 함수
// ============================================================

/** 배경 제거 모델 ID */
const REMBG_MODEL_ID = 'smoretalk-ai/rembg-enhance'

/** 배경 제거 입력 타입 */
export interface RembgInput {
  image_url: string
}

/** 배경 제거 출력 타입 */
export interface RembgOutput {
  image: FalImageOutput
}

/**
 * 배경 제거 요청을 fal.ai 큐에 제출
 *
 * @param input - 배경 제거 입력 데이터
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitRembgToQueue(input: RembgInput): Promise<FalQueueSubmitResponse> {
  const { request_id } = await fal.queue.submit(REMBG_MODEL_ID, {
    input: {
      image_url: input.image_url,
    },
  })

  return {
    request_id,
    response_url: `https://queue.fal.run/${REMBG_MODEL_ID}/requests/${request_id}`,
    status_url: `https://queue.fal.run/${REMBG_MODEL_ID}/requests/${request_id}/status`,
    cancel_url: `https://queue.fal.run/${REMBG_MODEL_ID}/requests/${request_id}/cancel`,
  }
}

/**
 * 배경 제거 큐 상태 조회
 *
 * @param requestId - 요청 ID
 * @returns 현재 상태 정보
 */
export async function getRembgQueueStatus(requestId: string): Promise<FalQueueStatusResponse> {
  const status = await fal.queue.status(REMBG_MODEL_ID, {
    requestId,
    logs: true,
  })

  const statusObj = status as unknown as Record<string, unknown>

  return {
    status: status.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED',
    queue_position: statusObj.queue_position as number | undefined,
    logs: statusObj.logs as FalLog[] | undefined,
  }
}

/**
 * 배경 제거 결과 조회
 *
 * @param requestId - 요청 ID
 * @returns 배경이 제거된 이미지 정보
 */
export async function getRembgQueueResponse(requestId: string): Promise<RembgOutput> {
  const result = await fal.queue.result(REMBG_MODEL_ID, {
    requestId,
  })

  return result.data as RembgOutput
}

/**
 * 배경 제거 요청 취소
 *
 * @param requestId - 요청 ID
 * @returns 취소 성공 여부
 */
export async function cancelRembgQueueRequest(requestId: string): Promise<boolean> {
  try {
    await fal.queue.cancel(REMBG_MODEL_ID, {
      requestId,
    })
    return true
  } catch {
    return false
  }
}

// ============================================================
// GPT-Image 1.5 Edit (이미지 광고 생성)
// ============================================================

/** GPT-Image 1.5 Edit 모델 ID */
const GPT_IMAGE_EDIT_MODEL_ID = 'fal-ai/gpt-image-1.5/edit'

/** 이미지 크기 enum */
export type ImageAdSize = '1024x1024' | '1536x1024' | '1024x1536'

/** 이미지 광고 생성 입력 타입 */
export interface ImageAdInput {
  prompt: string                    // 생성 프롬프트
  image_urls: string[]              // 참조 이미지 URL들 (제품, 아바타 등)
  image_size?: ImageAdSize          // 이미지 크기 (기본값: 1024x1024)
  quality?: 'low' | 'medium' | 'high'  // 품질 (기본값: high)
  num_images?: number               // 생성할 이미지 수 (1-5, 기본값: 1)
  background?: 'auto' | 'transparent' | 'opaque'  // 배경 (기본값: auto)
}

/** 이미지 광고 생성 출력 타입 */
export interface ImageAdOutput {
  images: FalImageOutput[]
}

/**
 * 이미지 광고 생성 요청을 fal.ai 큐에 제출
 *
 * GPT-Image 1.5 Edit 모델을 사용하여 이미지 광고 생성
 *
 * @param input - 이미지 광고 생성 입력 데이터
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitImageAdToQueue(input: ImageAdInput): Promise<FalQueueSubmitResponse> {
  const falInput = {
    prompt: input.prompt,
    image_urls: input.image_urls,
    image_size: input.image_size || '1024x1024',
    quality: input.quality || 'medium',
    background: input.background || 'auto',
    num_images: input.num_images || 1,
    output_format: 'png' as const,
  }

  const { request_id } = await fal.queue.submit(GPT_IMAGE_EDIT_MODEL_ID, {
    input: falInput,
  })

  return {
    request_id,
    response_url: `https://queue.fal.run/${GPT_IMAGE_EDIT_MODEL_ID}/requests/${request_id}`,
    status_url: `https://queue.fal.run/${GPT_IMAGE_EDIT_MODEL_ID}/requests/${request_id}/status`,
    cancel_url: `https://queue.fal.run/${GPT_IMAGE_EDIT_MODEL_ID}/requests/${request_id}/cancel`,
  }
}

/**
 * 이미지 광고 생성 큐 상태 조회
 *
 * @param requestId - 요청 ID
 * @returns 현재 상태 정보
 */
export async function getImageAdQueueStatus(requestId: string): Promise<FalQueueStatusResponse> {
  const status = await fal.queue.status(GPT_IMAGE_EDIT_MODEL_ID, {
    requestId,
    logs: true,
  })

  const statusObj = status as unknown as Record<string, unknown>

  return {
    status: status.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED',
    queue_position: statusObj.queue_position as number | undefined,
    logs: statusObj.logs as FalLog[] | undefined,
  }
}

/**
 * 이미지 광고 생성 결과 조회
 *
 * @param requestId - 요청 ID
 * @returns 생성된 이미지 정보
 */
export async function getImageAdQueueResponse(requestId: string): Promise<ImageAdOutput> {
  const result = await fal.queue.result(GPT_IMAGE_EDIT_MODEL_ID, {
    requestId,
  })

  return result.data as ImageAdOutput
}

/**
 * 이미지 광고 생성 요청 취소
 *
 * @param requestId - 요청 ID
 * @returns 취소 성공 여부
 */
export async function cancelImageAdQueueRequest(requestId: string): Promise<boolean> {
  try {
    await fal.queue.cancel(GPT_IMAGE_EDIT_MODEL_ID, {
      requestId,
    })
    return true
  } catch {
    return false
  }
}

// ============================================================
// Wan 2.6 Image-to-Video (영상 광고 생성)
// ============================================================

/** Wan 2.6 Image-to-Video 모델 ID */
const WAN_VIDEO_MODEL_ID = 'wan/v2.6/image-to-video'

/** 영상 해상도 타입 */
export type VideoResolution = '720p' | '1080p'

/** 영상 길이 타입 (초) */
export type VideoDuration = 5 | 10 | 15

/** 영상 광고 생성 입력 타입 */
export interface VideoAdInput {
  prompt: string                    // 생성 프롬프트 (최대 800자)
  image_url: string                 // 첫 프레임으로 사용할 이미지 URL
  resolution?: VideoResolution      // 해상도 (기본값: 1080p)
  duration?: VideoDuration          // 영상 길이 (기본값: 5초)
  negative_prompt?: string          // 피해야 할 내용 (최대 500자)
  enable_prompt_expansion?: boolean // 프롬프트 확장 (기본값: true)
  seed?: number                     // 시드값 (재현성)
}

/** 영상 출력 정보 */
export interface FalVideoOutput {
  url: string           // 영상 URL
  content_type: string  // MIME 타입 (video/mp4)
  file_name?: string    // 파일명
  file_size?: number    // 파일 크기 (bytes)
  width: number         // 영상 너비 (px)
  height: number        // 영상 높이 (px)
  fps?: number          // 프레임 레이트
  duration?: number     // 영상 길이 (초)
  frame_count?: number  // 총 프레임 수
}

/** 영상 광고 생성 출력 타입 */
export interface VideoAdOutput {
  video: FalVideoOutput       // 생성된 영상
  seed: number                // 생성에 사용된 시드값
  actual_prompt?: string      // 확장된 프롬프트 (enable_prompt_expansion이 true일 때)
}

/**
 * 영상 광고 생성 요청을 fal.ai 큐에 제출
 *
 * Wan 2.6 Image-to-Video 모델을 사용하여 영상 광고 생성
 *
 * @param input - 영상 광고 생성 입력 데이터
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitVideoAdToQueue(input: VideoAdInput): Promise<FalQueueSubmitResponse> {
  const falInput = {
    prompt: input.prompt,
    image_url: input.image_url,
    resolution: input.resolution || '1080p',
    duration: input.duration || 5,
    negative_prompt: input.negative_prompt,
    enable_prompt_expansion: input.enable_prompt_expansion ?? true,
    seed: input.seed,
    enable_safety_checker: true,
  }

  const { request_id } = await fal.queue.submit(WAN_VIDEO_MODEL_ID, {
    input: falInput,
  })

  return {
    request_id,
    response_url: `https://queue.fal.run/${WAN_VIDEO_MODEL_ID}/requests/${request_id}`,
    status_url: `https://queue.fal.run/${WAN_VIDEO_MODEL_ID}/requests/${request_id}/status`,
    cancel_url: `https://queue.fal.run/${WAN_VIDEO_MODEL_ID}/requests/${request_id}/cancel`,
  }
}

/**
 * 영상 광고 생성 큐 상태 조회
 *
 * @param requestId - 요청 ID
 * @returns 현재 상태 정보
 */
export async function getVideoAdQueueStatus(requestId: string): Promise<FalQueueStatusResponse> {
  const status = await fal.queue.status(WAN_VIDEO_MODEL_ID, {
    requestId,
    logs: true,
  })

  const statusObj = status as unknown as Record<string, unknown>

  return {
    status: status.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED',
    queue_position: statusObj.queue_position as number | undefined,
    logs: statusObj.logs as FalLog[] | undefined,
  }
}

/**
 * 영상 광고 생성 결과 조회
 *
 * @param requestId - 요청 ID
 * @returns 생성된 영상 정보
 */
export async function getVideoAdQueueResponse(requestId: string): Promise<VideoAdOutput> {
  const result = await fal.queue.result(WAN_VIDEO_MODEL_ID, {
    requestId,
  })

  return result.data as VideoAdOutput
}

/**
 * 영상 광고 생성 요청 취소
 *
 * @param requestId - 요청 ID
 * @returns 취소 성공 여부
 */
export async function cancelVideoAdQueueRequest(requestId: string): Promise<boolean> {
  try {
    await fal.queue.cancel(WAN_VIDEO_MODEL_ID, {
      requestId,
    })
    return true
  } catch {
    return false
  }
}

// ============================================================
// Seedance 1.5 Pro Image-to-Video (UGC 영상 생성)
// ============================================================

/** Seedance 1.5 Pro 모델 ID */
const SEEDANCE_MODEL_ID = 'fal-ai/bytedance/seedance/v1.5/pro/image-to-video'

/** Seedance 화면 비율 타입 */
export type SeedanceAspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'

/** Seedance 해상도 타입 */
export type SeedanceResolution = '480p' | '720p'

/** Seedance 영상 길이 타입 (초) - UI에서 제공하는 옵션 */
export type SeedanceDuration = 5 | 8 | 12

/** Seedance 입력 타입 */
export interface SeedanceInput {
  prompt: string                      // 영상 설명
  image_url: string                   // 첫 프레임 이미지 URL
  aspect_ratio?: SeedanceAspectRatio  // 화면 비율 (기본값: 16:9)
  resolution?: SeedanceResolution     // 해상도 (기본값: 720p)
  duration?: number                   // 영상 길이 4-12초 (기본값: 5)
  camera_fixed?: boolean              // 카메라 고정 여부
  generate_audio?: boolean            // 오디오 자동 생성 (기본값: true)
  seed?: number                       // 시드값 (재현성)
  end_image_url?: string              // 끝 프레임 이미지 URL (선택)
}

/** Seedance 출력 타입 */
export interface SeedanceOutput {
  video: FalVideoOutput       // 생성된 영상
  seed: number                // 생성에 사용된 시드값
}

/**
 * Seedance UGC 영상 생성 요청을 fal.ai 큐에 제출
 *
 * Seedance 1.5 Pro 모델을 사용하여 UGC 스타일 영상 생성
 * 오디오 자동 생성 지원
 *
 * @param input - Seedance 입력 데이터
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitSeedanceToQueue(input: SeedanceInput): Promise<FalQueueSubmitResponse> {
  const falInput = {
    prompt: input.prompt,
    image_url: input.image_url,
    aspect_ratio: input.aspect_ratio || '9:16',
    resolution: input.resolution || '720p',
    duration: input.duration || 5,
    camera_fixed: input.camera_fixed,
    generate_audio: input.generate_audio ?? true,
    seed: input.seed,
    end_image_url: input.end_image_url,
    enable_safety_checker: true,
  }

  const { request_id } = await fal.queue.submit(SEEDANCE_MODEL_ID, {
    input: falInput,
  })

  return {
    request_id,
    response_url: `https://queue.fal.run/${SEEDANCE_MODEL_ID}/requests/${request_id}`,
    status_url: `https://queue.fal.run/${SEEDANCE_MODEL_ID}/requests/${request_id}/status`,
    cancel_url: `https://queue.fal.run/${SEEDANCE_MODEL_ID}/requests/${request_id}/cancel`,
  }
}

/**
 * Seedance 영상 생성 큐 상태 조회
 *
 * @param requestId - 요청 ID
 * @returns 현재 상태 정보
 */
export async function getSeedanceQueueStatus(requestId: string): Promise<FalQueueStatusResponse> {
  const status = await fal.queue.status(SEEDANCE_MODEL_ID, {
    requestId,
    logs: true,
  })

  const statusObj = status as unknown as Record<string, unknown>

  return {
    status: status.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED',
    queue_position: statusObj.queue_position as number | undefined,
    logs: statusObj.logs as FalLog[] | undefined,
  }
}

/**
 * Seedance 영상 생성 결과 조회
 *
 * @param requestId - 요청 ID
 * @returns 생성된 영상 정보
 */
export async function getSeedanceQueueResponse(requestId: string): Promise<SeedanceOutput> {
  const result = await fal.queue.result(SEEDANCE_MODEL_ID, {
    requestId,
  })

  return result.data as SeedanceOutput
}

/**
 * Seedance 영상 생성 요청 취소
 *
 * @param requestId - 요청 ID
 * @returns 취소 성공 여부
 */
export async function cancelSeedanceQueueRequest(requestId: string): Promise<boolean> {
  try {
    await fal.queue.cancel(SEEDANCE_MODEL_ID, {
      requestId,
    })
    return true
  } catch {
    return false
  }
}
