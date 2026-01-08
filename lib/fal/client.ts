/**
 * fal.ai 클라이언트
 *
 * AI 이미지 생성을 위한 fal.ai Queue API 클라이언트입니다.
 * z-image-turbo-lora 모델을 사용하여 아바타 이미지를 생성합니다.
 */

import { fal } from "@fal-ai/client"

// 환경 변수에서 LoRA 설정 로드
const FAL_LORA_PATH = process.env.FAL_LORA_PATH!
const FAL_LORA_SCALE = parseFloat(process.env.FAL_LORA_SCALE || '0.7')

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
      width: 1152,
      height: 2048,
    },
    // LoRA 모델 설정 (필요시 활성화)
    // loras: [
    //   {
    //     path: FAL_LORA_PATH,
    //     scale: FAL_LORA_SCALE,
    //   },
    // ],
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
