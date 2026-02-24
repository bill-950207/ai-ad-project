/**
 * BytePlus ModelArk Video Generation API 클라이언트
 *
 * BytePlus (ByteDance 공식 클라우드) Content Generation API를 사용하여
 * Seedance 모델로 영상을 생성합니다.
 *
 * API 패턴:
 * - POST /content_generation/tasks → 태스크 생성
 * - GET /content_generation/tasks/{task_id} → 상태 조회
 * - DELETE /content_generation/tasks/{task_id} → 태스크 취소
 */

import type {
  BytePlusVideoInput,
  BytePlusContentItem,
  BytePlusTaskResponse,
  BytePlusTaskResult,
} from './types'

// ============================================================
// 설정
// ============================================================

const BYTEPLUS_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'
const BYTEPLUS_API_KEY = process.env.BYTEPLUS_ARK_API_KEY
const SEEDANCE_MODEL_ID = process.env.SEEDANCE_MODEL_ID || 'seedance-1-5-pro-250528'

function getHeaders(): HeadersInit {
  if (!BYTEPLUS_API_KEY) {
    throw new Error('BYTEPLUS_ARK_API_KEY 환경변수가 설정되지 않았습니다')
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BYTEPLUS_API_KEY}`,
  }
}

// ============================================================
// API 메서드
// ============================================================

/**
 * 영상 생성 태스크를 생성합니다.
 *
 * @param input - 영상 생성 입력 (프롬프트, 이미지, 설정 등)
 * @returns 생성된 태스크 ID
 */
export async function createVideoTask(
  input: BytePlusVideoInput
): Promise<{ taskId: string }> {
  const content: BytePlusContentItem[] = []

  // 텍스트 프롬프트
  content.push({ type: 'text', text: input.prompt })

  // 이미지 URL 추가 (있을 경우)
  if (input.imageUrls && input.imageUrls.length > 0) {
    for (const url of input.imageUrls) {
      content.push({
        type: 'image_url',
        image_url: { url },
      })
    }
  }

  const body: Record<string, unknown> = {
    model: SEEDANCE_MODEL_ID,
    content,
  }

  if (input.aspectRatio) {
    body.aspect_ratio = input.aspectRatio
  }
  if (input.resolution) {
    body.resolution = input.resolution
  }
  if (input.duration) {
    body.duration = input.duration
  }
  if (input.generateAudio !== undefined) {
    body.generate_audio = input.generateAudio
  }

  const response = await fetch(`${BYTEPLUS_BASE_URL}/content_generation/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage: string
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error?.message || errorText
    } catch {
      errorMessage = errorText
    }
    throw new Error(`BytePlus API 오류 (${response.status}): ${errorMessage}`)
  }

  const result: BytePlusTaskResponse = await response.json()

  if (!result.id) {
    throw new Error('BytePlus API 응답에 task ID가 없습니다')
  }

  return { taskId: result.id }
}

/**
 * 영상 생성 태스크의 상태를 조회합니다.
 *
 * @param taskId - 태스크 ID
 * @returns 정규화된 상태 및 결과
 */
export async function getVideoTaskStatus(
  taskId: string
): Promise<BytePlusTaskResult> {
  const response = await fetch(
    `${BYTEPLUS_BASE_URL}/content_generation/tasks/${taskId}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`BytePlus 상태 조회 오류 (${response.status}): ${errorText}`)
  }

  const task: BytePlusTaskResponse = await response.json()

  switch (task.status) {
    case 'queued':
      return { status: 'IN_QUEUE' }

    case 'running':
      return { status: 'IN_PROGRESS' }

    case 'succeeded':
      return {
        status: 'COMPLETED',
        videoUrl: task.output?.video_url,
      }

    case 'failed':
      return {
        status: 'FAILED',
        error: task.error?.message || '영상 생성에 실패했습니다',
      }

    default:
      return { status: 'IN_PROGRESS' }
  }
}
