/**
 * WaveSpeed AI 클라이언트
 *
 * InfiniteTalk (토킹 아바타) 및 Vidu Q3 (영상 생성) 서비스를 위한 클라이언트 라이브러리
 * - InfiniteTalk: 립싱크 토킹 영상 생성
 * - Vidu Q3: 이미지-to-비디오 생성
 */

const WAVESPEED_API_KEY = process.env.WAVE_SPEED_AI_KEY || ''
const PREDICTION_RESULT_URL = 'https://api.wavespeed.ai/api/v3/predictions'

// ============================================================
// InfiniteTalk (토킹 아바타 영상 생성)
// ============================================================

const INFINITETALK_URL = 'https://api.wavespeed.ai/api/v3/wavespeed-ai/infinitetalk'

/**
 * InfiniteTalk 해상도 타입
 */
export type InfiniteTalkResolution = '480p' | '720p'

/**
 * InfiniteTalk 입력 타입
 */
export interface InfiniteTalkInput {
  audio: string           // 오디오 URL (TTS 결과)
  image: string           // 첫 프레임 이미지 URL
  mask_image?: string     // 마스크 이미지 (선택)
  prompt?: string         // 영상 생성 프롬프트 (선택)
  resolution?: InfiniteTalkResolution  // 해상도 (기본: 480p)
  seed?: number           // 시드 값 (기본: -1)
}

/**
 * InfiniteTalk 작업 응답
 */
interface InfiniteTalkTaskResponse {
  code: number
  message: string
  data: {
    id: string
    status: string
    model: string
    created_at: string
  }
}

/**
 * InfiniteTalk 결과 응답
 */
interface InfiniteTalkResultResponse {
  code: number
  message: string
  data: {
    id: string
    status: 'created' | 'processing' | 'completed' | 'failed'
    model: string
    outputs: string[]     // 영상 URL 배열
    created_at: string
    has_nsfw_contents?: boolean[]
    urls?: Record<string, string>
  }
}

/**
 * InfiniteTalk 작업 제출
 *
 * @param input 입력 데이터
 * @returns 작업 ID
 */
export async function submitInfiniteTalkTask(input: InfiniteTalkInput): Promise<string> {
  const response = await fetch(INFINITETALK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
    body: JSON.stringify({
      audio: input.audio,
      image: input.image,
      mask_image: input.mask_image,
      prompt: input.prompt,
      resolution: input.resolution || '480p',
      seed: input.seed ?? -1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`InfiniteTalk 작업 제출 실패: ${response.status} - ${errorText}`)
  }

  const result: InfiniteTalkTaskResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`InfiniteTalk 작업 제출 오류: ${result.message}`)
  }

  return result.data.id
}

/**
 * InfiniteTalk 작업 결과 조회
 *
 * @param requestId 작업 ID
 * @returns 결과 데이터
 */
export async function getInfiniteTalkResult(requestId: string): Promise<InfiniteTalkResultResponse['data']> {
  const response = await fetch(`${PREDICTION_RESULT_URL}/${requestId}/result`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`InfiniteTalk 결과 조회 실패: ${response.status} - ${errorText}`)
  }

  const result: InfiniteTalkResultResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`InfiniteTalk 결과 조회 오류: ${result.message}`)
  }

  return result.data
}

/**
 * InfiniteTalk 작업 완료까지 폴링
 *
 * @param requestId 작업 ID
 * @param maxAttempts 최대 시도 횟수 (기본 120, 10분)
 * @param intervalMs 폴링 간격 (기본 5000ms)
 * @returns 영상 URL
 */
export async function waitForInfiniteTalkResult(
  requestId: string,
  maxAttempts: number = 120,
  intervalMs: number = 5000
): Promise<string> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const result = await getInfiniteTalkResult(requestId)

    if (result.status === 'completed' && result.outputs && result.outputs.length > 0) {
      return result.outputs[0]
    }

    if (result.status === 'failed') {
      throw new Error('InfiniteTalk 영상 생성 실패')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('InfiniteTalk 작업 시간 초과')
}

/**
 * InfiniteTalk 토킹 영상 생성 (원스텝)
 *
 * @param imageUrl 첫 프레임 이미지 URL
 * @param audioUrl TTS 오디오 URL
 * @param prompt 영상 생성 프롬프트 (선택)
 * @param resolution 해상도 (기본: 480p)
 * @returns 영상 URL
 */
export async function generateTalkingVideo(
  imageUrl: string,
  audioUrl: string,
  prompt?: string,
  resolution: InfiniteTalkResolution = '480p'
): Promise<string> {
  const requestId = await submitInfiniteTalkTask({
    image: imageUrl,
    audio: audioUrl,
    prompt,
    resolution,
  })

  return await waitForInfiniteTalkResult(requestId)
}

/**
 * InfiniteTalk 큐 제출 (fal.ai 호환 인터페이스)
 *
 * @param imageUrl 이미지 URL
 * @param audioUrl 오디오 URL
 * @param prompt 프롬프트 (선택)
 * @param resolution 해상도 (선택)
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitInfiniteTalkToQueue(
  imageUrl: string,
  audioUrl: string,
  prompt?: string,
  resolution: InfiniteTalkResolution = '480p'
): Promise<{ request_id: string }> {
  const requestId = await submitInfiniteTalkTask({
    image: imageUrl,
    audio: audioUrl,
    prompt,
    resolution,
  })

  return { request_id: requestId }
}

/**
 * InfiniteTalk 상태 조회 (fal.ai 호환 인터페이스)
 *
 * @param requestId 작업 ID
 * @returns 상태 정보
 */
export async function getInfiniteTalkQueueStatus(
  requestId: string
): Promise<{ status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }> {
  const result = await getInfiniteTalkResult(requestId)

  const statusMap: Record<string, 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'> = {
    'created': 'IN_QUEUE',
    'processing': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'failed': 'FAILED',
  }

  return {
    status: statusMap[result.status] || 'IN_QUEUE',
  }
}

/**
 * InfiniteTalk 결과 조회 (fal.ai 호환 인터페이스)
 *
 * @param requestId 작업 ID
 * @returns 영상 정보
 */
export async function getInfiniteTalkQueueResponse(
  requestId: string
): Promise<{ videos: Array<{ url: string }> }> {
  const result = await getInfiniteTalkResult(requestId)

  if (result.status === 'failed') {
    throw new Error('InfiniteTalk 영상 생성 실패')
  }

  if (!result.outputs || result.outputs.length === 0) {
    throw new Error('생성된 영상이 없습니다')
  }

  return {
    videos: result.outputs.map((url) => ({ url })),
  }
}

// ============================================================
// Vidu Q3 Image-to-Video (영상 생성)
// ============================================================

const VIDU_Q3_URL = 'https://api.wavespeed.ai/api/v3/vidu/q3/image-to-video'

/**
 * Vidu Q3 해상도 타입
 */
export type ViduResolution = '540p' | '720p' | '1080p'

/**
 * Vidu Q3 영상 길이 타입 (1-16초)
 */
export type ViduDuration = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16

/**
 * Vidu Q3 움직임 강도 타입
 */
export type ViduMovementAmplitude = 'auto' | 'small' | 'medium' | 'large'

/**
 * Vidu Q3 입력 타입
 */
export interface ViduImageToVideoInput {
  prompt: string           // 영상 생성 프롬프트
  image: string            // 시작 이미지 URL
  duration?: ViduDuration  // 영상 길이 (1-16초, 기본 5)
  resolution?: ViduResolution  // 해상도 (기본 720p)
  bgm?: boolean            // 배경 음악 (기본 false)
  movement_amplitude?: ViduMovementAmplitude  // 움직임 강도 (기본 auto - AI가 자동 결정)
  seed?: number            // 시드 값 (-1 = 랜덤)
  generate_audio?: boolean // 오디오 자동 생성 (Q3 신규 파라미터)
}

/**
 * Vidu Q3 작업 응답
 */
interface ViduTaskResponse {
  code: number
  message: string
  data: {
    id: string
    status: string
    model: string
    created_at: string
    outputs: string[]
    has_nsfw_contents: boolean[]
    urls: Record<string, string>
  }
}

/**
 * Vidu Q3 결과 응답
 */
interface ViduResultResponse {
  code: number
  message: string
  data: {
    id: string
    status: 'created' | 'processing' | 'completed' | 'failed'
    model: string
    outputs: string[]
    created_at: string
    has_nsfw_contents?: boolean[]
    urls?: Record<string, string>
  }
}

/**
 * Vidu Q3 크레딧 계산
 *
 * 해상도와 길이에 따라 크레딧을 계산합니다:
 * - 540p: 초당 5 크레딧
 * - 720p: 초당 8 크레딧
 * - 1080p: 초당 12 크레딧
 *
 * @deprecated API에서 직접 VIDU_CREDIT_COST_PER_SECOND 상수를 사용하세요 (lib/credits)
 */
export function calculateViduCredits(
  duration: number,
  resolution: ViduResolution
): number {
  // 중앙 상수와 동일한 값 유지 (lib/credits/constants.ts의 VIDU_CREDIT_COST_PER_SECOND)
  const creditsPerSecond: Record<ViduResolution, number> = {
    '540p': 5,   // SD 화질 - VIDU_CREDIT_COST_PER_SECOND['540p']와 동일
    '720p': 8,   // HD 화질 - VIDU_CREDIT_COST_PER_SECOND['720p']와 동일
    '1080p': 12, // FHD 화질 - VIDU_CREDIT_COST_PER_SECOND['1080p']와 동일
  }

  return creditsPerSecond[resolution] * duration
}

/**
 * Vidu Q3 작업 제출
 *
 * @param input 입력 데이터
 * @returns 작업 ID
 */
export async function submitViduImageToVideoTask(input: ViduImageToVideoInput): Promise<string> {
  const response = await fetch(VIDU_Q3_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: input.prompt,
      image: input.image,
      duration: input.duration ?? 5,
      resolution: input.resolution ?? '720p',
      bgm: input.bgm ?? false,
      movement_amplitude: input.movement_amplitude ?? 'auto',  // 기본값 'auto' - AI가 콘텐츠에 맞게 자동 결정
      seed: input.seed ?? -1,
      generate_audio: input.generate_audio ?? false,  // Q3 신규 파라미터
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vidu Q3 작업 제출 실패: ${response.status} - ${errorText}`)
  }

  const result: ViduTaskResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`Vidu Q3 작업 제출 오류: ${result.message}`)
  }

  return result.data.id
}

/**
 * Vidu Q3 작업 결과 조회
 *
 * @param requestId 작업 ID
 * @returns 결과 데이터
 */
export async function getViduImageToVideoResult(requestId: string): Promise<ViduResultResponse['data']> {
  const response = await fetch(`${PREDICTION_RESULT_URL}/${requestId}/result`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vidu Q3 결과 조회 실패: ${response.status} - ${errorText}`)
  }

  const result: ViduResultResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`Vidu Q3 결과 조회 오류: ${result.message}`)
  }

  return result.data
}

/**
 * Vidu Q3 큐 제출 (fal.ai 호환 인터페이스)
 *
 * @param input 입력 데이터
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitViduToQueue(
  input: ViduImageToVideoInput
): Promise<{ request_id: string }> {
  const requestId = await submitViduImageToVideoTask(input)
  return { request_id: requestId }
}

/**
 * Vidu Q3 상태 조회 (fal.ai 호환 인터페이스)
 *
 * @param requestId 작업 ID
 * @returns 상태 정보
 */
export async function getViduQueueStatus(
  requestId: string
): Promise<{ status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }> {
  const result = await getViduImageToVideoResult(requestId)

  const statusMap: Record<string, 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'> = {
    'created': 'IN_QUEUE',
    'processing': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'failed': 'FAILED',
  }

  return {
    status: statusMap[result.status] || 'IN_QUEUE',
  }
}

/**
 * Vidu Q3 결과 조회 (fal.ai 호환 인터페이스)
 *
 * @param requestId 작업 ID
 * @returns 영상 정보
 */
export async function getViduQueueResponse(
  requestId: string
): Promise<{ videos: Array<{ url: string }> }> {
  const result = await getViduImageToVideoResult(requestId)

  if (result.status === 'failed') {
    throw new Error('Vidu Q3 영상 생성 실패')
  }

  if (!result.outputs || result.outputs.length === 0) {
    throw new Error('생성된 영상이 없습니다')
  }

  return {
    videos: result.outputs.map((url) => ({ url })),
  }
}

/**
 * Vidu Q3 영상 생성 완료까지 폴링
 *
 * @param requestId 작업 ID
 * @param maxAttempts 최대 시도 횟수 (기본 120, 10분)
 * @param intervalMs 폴링 간격 (기본 5000ms)
 * @returns 영상 URL
 */
export async function waitForViduResult(
  requestId: string,
  maxAttempts: number = 120,
  intervalMs: number = 5000
): Promise<string> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const result = await getViduImageToVideoResult(requestId)

    if (result.status === 'completed' && result.outputs && result.outputs.length > 0) {
      return result.outputs[0]
    }

    if (result.status === 'failed') {
      throw new Error('Vidu Q3 영상 생성 실패')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('Vidu Q3 작업 시간 초과')
}
