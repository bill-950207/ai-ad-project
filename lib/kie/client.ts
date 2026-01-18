/**
 * Kie.ai 클라이언트
 *
 * AI 이미지/영상 생성을 위한 Kie.ai API 클라이언트입니다.
 * fal.ai에서 마이그레이션 중입니다.
 */

// ============================================================
// 설정
// ============================================================

const KIE_API_BASE = 'https://api.kie.ai/api/v1'
const KIE_API_KEY = process.env.KIE_KEY!

// API 요청 헤더
const getHeaders = () => ({
  'Authorization': `Bearer ${KIE_API_KEY}`,
  'Content-Type': 'application/json',
})

// ============================================================
// 공통 타입
// ============================================================

/** Kie.ai API 기본 응답 */
export interface KieApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

/** Task 생성 응답 데이터 */
export interface KieTaskData {
  taskId: string
}

/** Task 상태 */
export type KieTaskStatus = 'waiting' | 'success' | 'fail'

/** Task 조회 응답 데이터 (API 실제 응답 구조) */
export interface KieTaskInfo {
  taskId: string
  model: string
  state: KieTaskStatus
  param: string
  resultJson: string | null  // JSON 문자열: {"resultUrls": ["..."]}
  failCode: string | null
  failMsg: string | null
  createdAt?: string
  updatedAt?: string
}

/** resultJson 파싱 결과 */
export interface KieResultJson {
  resultUrls: string[]
}

// ============================================================
// 배경 제거 (Recraft Remove Background)
// ============================================================

/** 배경 제거 모델 ID */
const REMBG_MODEL = 'recraft/remove-background'

/** 배경 제거 입력 타입 */
export interface KieRembgInput {
  image_url: string
}

/** 배경 제거 출력 타입 */
export interface KieRembgOutput {
  taskId: string
  image_url?: string  // 완료 시 결과 이미지 URL
}

/**
 * 배경 제거 작업 생성
 *
 * @param input - 배경 제거 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL (선택)
 * @returns Task ID
 */
export async function createRembgTask(
  input: KieRembgInput,
  callbackUrl?: string
): Promise<KieRembgOutput> {
  const body: Record<string, unknown> = {
    model: REMBG_MODEL,
    input: {
      image: input.image_url,
    },
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai API 오류: ${result.msg}`)
  }

  return {
    taskId: result.data.taskId,
  }
}

/**
 * Task 상태 조회
 *
 * @param taskId - 조회할 Task ID
 * @returns Task 정보
 */
export async function getTaskInfo(taskId: string): Promise<KieTaskInfo> {
  const response = await fetch(
    `${KIE_API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieTaskInfo> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai API 오류: ${result.msg}`)
  }

  return result.data
}

/**
 * Task 완료까지 대기 (폴링)
 *
 * @param taskId - 대기할 Task ID
 * @param options - 폴링 옵션
 * @returns 완료된 Task 정보
 */
export async function waitForTask(
  taskId: string,
  options: {
    maxAttempts?: number
    intervalMs?: number
  } = {}
): Promise<KieTaskInfo> {
  const maxAttempts = options.maxAttempts || 60  // 기본 60회 (5분)
  const intervalMs = options.intervalMs || 5000   // 기본 5초

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const taskInfo = await getTaskInfo(taskId)

    if (taskInfo.state === 'success') {
      return taskInfo
    }

    if (taskInfo.state === 'fail') {
      throw new Error(`Task 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
    }

    // 대기
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Task 완료 대기 시간 초과')
}

/**
 * resultJson 문자열을 파싱하여 결과 URL 배열 반환
 */
function parseResultJson(resultJson: string | null): string[] {
  if (!resultJson) return []
  try {
    const parsed: KieResultJson = JSON.parse(resultJson)
    return parsed.resultUrls || []
  } catch {
    return []
  }
}

/**
 * 배경 제거 동기 실행 (작업 생성 + 완료 대기)
 *
 * @param input - 배경 제거 입력 데이터
 * @returns 배경이 제거된 이미지 URL
 */
export async function removeBackground(input: KieRembgInput): Promise<string> {
  // 1. Task 생성
  const { taskId } = await createRembgTask(input)

  // 2. 완료 대기
  const taskInfo = await waitForTask(taskId)

  // 3. 결과 이미지 URL 반환
  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('배경 제거 결과 이미지가 없습니다')
  }

  return resultUrls[0]
}

// ============================================================
// fal.ai 호환 인터페이스 (마이그레이션 용이성)
// ============================================================

/** fal.ai 스타일 큐 제출 응답 */
export interface KieQueueSubmitResponse {
  request_id: string  // taskId를 request_id로 매핑
}

/** fal.ai 스타일 큐 상태 응답 */
export interface KieQueueStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'
  queue_position?: number
}

/** fal.ai 스타일 이미지 출력 */
export interface KieImageOutput {
  url: string
  width?: number
  height?: number
}

/** fal.ai 스타일 배경 제거 출력 */
export interface KieRembgResult {
  image: KieImageOutput
}

/**
 * 배경 제거 요청을 큐에 제출 (fal.ai 호환)
 *
 * @param input - 배경 제거 입력 데이터
 * @returns 큐 제출 응답
 */
export async function submitRembgToQueue(input: KieRembgInput): Promise<KieQueueSubmitResponse> {
  const { taskId } = await createRembgTask(input)

  return {
    request_id: taskId,
  }
}

/**
 * 배경 제거 큐 상태 조회 (fal.ai 호환)
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getRembgQueueStatus(requestId: string): Promise<KieQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  // 상태 매핑: Kie.ai state -> fal.ai 호환 상태
  const statusMap: Record<KieTaskStatus, KieQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'success': 'COMPLETED',
    'fail': 'COMPLETED',  // 실패도 완료로 처리, 결과 조회 시 에러 확인
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

/**
 * 배경 제거 결과 조회 (fal.ai 호환)
 *
 * @param requestId - Task ID
 * @returns 배경이 제거된 이미지 정보
 */
export async function getRembgQueueResponse(requestId: string): Promise<KieRembgResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`배경 제거 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('배경 제거 결과 이미지가 없습니다')
  }

  return {
    image: {
      url: resultUrls[0],
    },
  }
}

// ============================================================
// Z Image (이미지 생성)
// ============================================================

/** Z Image 모델 ID */
const ZIMAGE_MODEL = 'z-image'

/** Z Image 화면 비율 */
export type ZImageAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16'

/** Z Image 입력 타입 */
export interface KieZImageInput {
  prompt: string
  aspect_ratio?: ZImageAspectRatio,
}

/** Z Image 출력 타입 (fal.ai 호환) */
export interface KieZImageOutput {
  taskId: string
  image_url?: string  // 완료 시 결과 이미지 URL
}

/** fal.ai 스타일 Z Image 결과 */
export interface KieZImageResult {
  images: Array<{ url: string; width?: number; height?: number }>
  seed?: number
  prompt?: string
}

/**
 * Z Image 이미지 생성 작업 생성
 *
 * @param input - 이미지 생성 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL (선택)
 * @returns Task ID
 */
export async function createZImageTask(
  input: KieZImageInput,
  callbackUrl?: string
): Promise<KieZImageOutput> {
  const body: Record<string, unknown> = {
    model: ZIMAGE_MODEL,
    input: {
      prompt: input.prompt,
      aspect_ratio: input.aspect_ratio || '9:16',  // 아바타용 기본 세로 비율
    },
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai API 오류: ${result.msg}`)
  }

  return {
    taskId: result.data.taskId,
  }
}

/**
 * Z Image 요청을 큐에 제출 (fal.ai 호환)
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param aspectRatio - 화면 비율 (선택)
 * @returns 큐 제출 응답
 */
export async function submitZImageToQueue(
  prompt: string,
  aspectRatio?: ZImageAspectRatio
): Promise<KieQueueSubmitResponse> {
  const { taskId } = await createZImageTask({
    prompt,
    aspect_ratio: aspectRatio,
  })

  return {
    request_id: taskId,
  }
}

/**
 * Z Image 큐 상태 조회 (fal.ai 호환)
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getZImageQueueStatus(requestId: string): Promise<KieQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  // 상태 매핑: Kie.ai state -> fal.ai 호환 상태
  const statusMap: Record<KieTaskStatus, KieQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'success': 'COMPLETED',
    'fail': 'COMPLETED',  // 실패도 완료로 처리, 결과 조회 시 에러 확인
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

/**
 * Z Image 결과 조회 (fal.ai 호환)
 *
 * @param requestId - Task ID
 * @returns 생성된 이미지 정보
 */
export async function getZImageQueueResponse(requestId: string): Promise<KieZImageResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`이미지 생성 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('생성된 이미지가 없습니다')
  }

  return {
    images: resultUrls.map(url => ({ url })),
  }
}

// ============================================================
// 4.5 Edit (의상 교체)
// ============================================================

/** 4.5 Edit 모델 ID */
const EDIT_MODEL = 'seedream/4.5-edit'

/** 4.5 Edit 화면 비율 */
export type EditAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | '3:2' | '21:9'

/** 4.5 Edit 품질 */
export type EditQuality = 'basic' | 'high'

/** 4.5 Edit 입력 타입 */
export interface KieEditInput {
  prompt: string
  image_urls: string[]
  aspect_ratio?: EditAspectRatio
  quality?: EditQuality
}

/** 4.5 Edit 출력 타입 */
export interface KieEditOutput {
  taskId: string
}

/** 4.5 Edit 결과 타입 */
export interface KieEditResult {
  images: Array<{ url: string }>
}

/** 의상 교체용 프롬프트 생성 */
export function buildOutfitChangePrompt(): string {
  return '让图 1 中的模特穿上图 2 中的服装。'
  // return 'Dress the model in image 1 in the outfit in image 2.'
  // return 'Replace the clothing on the person in image 1 with the outfit shown in image 2. Maintain exactly the same face, expression, body pose, skin tone, hair, and background. Only change the clothing while preserving all other aspects of the original image.'
}

/**
 * 4.5 Edit 작업 생성
 *
 * @param input - 편집 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL (선택)
 * @returns Task ID
 */
export async function createEditTask(
  input: KieEditInput,
  callbackUrl?: string
): Promise<KieEditOutput> {
  const body: Record<string, unknown> = {
    model: EDIT_MODEL,
    input: {
      prompt: input.prompt,
      image_urls: input.image_urls,
      aspect_ratio: input.aspect_ratio || '3:4',
      quality: input.quality || 'basic',
    },
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai API 오류: ${result.msg}`)
  }

  return {
    taskId: result.data.taskId,
  }
}

/**
 * 의상 교체 요청을 큐에 제출
 *
 * @param humanImageUrl - 사람 이미지 URL
 * @param garmentImageUrl - 의상 이미지 URL
 * @param aspectRatio - 화면 비율 (선택)
 * @returns 큐 제출 응답
 */
export async function submitOutfitEditToQueue(
  humanImageUrl: string,
  garmentImageUrl: string,
  aspectRatio?: EditAspectRatio
): Promise<KieQueueSubmitResponse> {
  const { taskId } = await createEditTask({
    prompt: buildOutfitChangePrompt(),
    image_urls: [humanImageUrl, garmentImageUrl],
    aspect_ratio: aspectRatio || '9:16',
    quality: 'high',
  })

  return {
    request_id: taskId,
  }
}

/**
 * 4.5 Edit 큐 상태 조회
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getEditQueueStatus(requestId: string): Promise<KieQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  const statusMap: Record<KieTaskStatus, KieQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'success': 'COMPLETED',
    'fail': 'COMPLETED',
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

/**
 * 4.5 Edit 결과 조회
 *
 * @param requestId - Task ID
 * @returns 편집된 이미지 정보
 */
export async function getEditQueueResponse(requestId: string): Promise<KieEditResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`의상 교체 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('의상 교체 결과 이미지가 없습니다')
  }

  return {
    images: resultUrls.map(url => ({ url })),
  }
}

// ============================================================
// GPT Image 1.5 (Image-to-Image)
// ============================================================

/** GPT Image 1.5 모델 ID */
const GPT_IMAGE_MODEL = 'gpt-image/1.5-image-to-image'

/** GPT Image 1.5 화면 비율 */
export type GPTImageAspectRatio = '1:1' | '2:3' | '3:2'

/** GPT Image 1.5 품질 */
export type GPTImageQuality = 'medium' | 'high'

/** GPT Image 1.5 입력 타입 */
export interface KieGPTImageInput {
  input_urls: string[]  // 입력 이미지 URL 배열
  prompt: string
  aspect_ratio?: GPTImageAspectRatio
  quality?: GPTImageQuality
}

/** GPT Image 1.5 출력 타입 */
export interface KieGPTImageOutput {
  taskId: string
}

/** GPT Image 1.5 결과 타입 */
export interface KieGPTImageResult {
  images: Array<{ url: string }>
}

/**
 * GPT Image 1.5 작업 생성
 *
 * @param input - 이미지 생성 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL (선택)
 * @returns Task ID
 */
export async function createGPTImageTask(
  input: KieGPTImageInput,
  callbackUrl?: string
): Promise<KieGPTImageOutput> {
  const body: Record<string, unknown> = {
    model: GPT_IMAGE_MODEL,
    input: {
      input_urls: input.input_urls,
      prompt: input.prompt,
      aspect_ratio: input.aspect_ratio || '2:3',
      quality: input.quality || 'medium',
    },
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai API 오류: ${result.msg}`)
  }

  return {
    taskId: result.data.taskId,
  }
}

/**
 * 첫 프레임 이미지 생성 요청을 큐에 제출 (seedream/4.5-edit 모델 사용)
 *
 * @param imageUrls - 입력 이미지 URL 배열 (제품, 아바타 등)
 * @param prompt - 이미지 생성 프롬프트
 * @param aspectRatio - 화면 비율 (선택)
 * @returns 큐 제출 응답
 */
export async function submitFirstFrameToQueue(
  imageUrls: string[],
  prompt: string,
  aspectRatio?: EditAspectRatio
): Promise<KieQueueSubmitResponse> {
  const { taskId } = await createEditTask({
    prompt,
    image_urls: imageUrls,
    aspect_ratio: aspectRatio || '2:3',
    quality: 'high',
  })

  return {
    request_id: taskId,
  }
}

/**
 * GPT Image 1.5 큐 상태 조회
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getGPTImageQueueStatus(requestId: string): Promise<KieQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  const statusMap: Record<KieTaskStatus, KieQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'success': 'COMPLETED',
    'fail': 'COMPLETED',
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

/**
 * GPT Image 1.5 결과 조회
 *
 * @param requestId - Task ID
 * @returns 생성된 이미지 정보
 */
export async function getGPTImageQueueResponse(requestId: string): Promise<KieGPTImageResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`이미지 생성 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('생성된 이미지가 없습니다')
  }

  return {
    images: resultUrls.map(url => ({ url })),
  }
}

/**
 * GPT Image 1.5 요청을 큐에 제출 (AI 아바타용 - 참조 이미지 포함)
 *
 * @param inputUrls - 참조 이미지 URL 배열 (제품 이미지 등)
 * @param prompt - 이미지 생성 프롬프트
 * @param aspectRatio - 화면 비율 (선택)
 * @param quality - 이미지 품질 (선택)
 * @returns 큐 제출 응답
 */
export async function submitGPTImageToQueue(
  inputUrls: string[],
  prompt: string,
  aspectRatio?: GPTImageAspectRatio,
  quality?: GPTImageQuality
): Promise<KieQueueSubmitResponse> {
  const { taskId } = await createGPTImageTask({
    input_urls: inputUrls,
    prompt,
    aspect_ratio: aspectRatio || '2:3',
    quality: quality || 'high',
  })

  return {
    request_id: taskId,
  }
}

// ============================================================
// Kling V1 Avatar Standard (Lip-sync Talking Head Video)
// ============================================================

/** Kling V1 Avatar 모델 ID */
const KLING_AVATAR_MODEL = 'kling/v1-avatar-standard'

/** Kling Avatar 입력 타입 */
export interface KieKlingAvatarInput {
  image_url: string    // 아바타 이미지 URL
  audio_url: string    // 오디오 URL (TTS)
  prompt: string       // 영상 생성 프롬프트
}

/** Kling Avatar 출력 타입 */
export interface KieKlingAvatarOutput {
  taskId: string
}

/** Kling Avatar 결과 타입 */
export interface KieKlingAvatarResult {
  videos: Array<{ url: string }>
}

// 기존 호환성을 위한 타입 별칭
export type KieInfinitalkInput = KieKlingAvatarInput
export type KieInfinitalkOutput = KieKlingAvatarOutput
export type KieInfinitalkResult = KieKlingAvatarResult

/**
 * Kling Avatar 작업 생성 (립싱크 영상)
 *
 * @param input - 영상 생성 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL (선택)
 * @returns Task ID
 */
export async function createKlingAvatarTask(
  input: KieKlingAvatarInput,
  callbackUrl?: string
): Promise<KieKlingAvatarOutput> {
  const body: Record<string, unknown> = {
    model: KLING_AVATAR_MODEL,
    input: {
      image_url: input.image_url,
      audio_url: input.audio_url,
      prompt: input.prompt,
    },
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai API 오류: ${result.msg}`)
  }

  return {
    taskId: result.data.taskId,
  }
}

// 기존 호환성을 위한 함수 별칭
export const createInfinitalkTask = createKlingAvatarTask

/**
 * 토킹 영상 생성 요청을 큐에 제출 (Kling V1 Avatar)
 *
 * @param imageUrl - 아바타 이미지 URL
 * @param audioUrl - TTS 오디오 URL
 * @param prompt - 영상 생성 프롬프트
 * @returns 큐 제출 응답
 */
export async function submitTalkingVideoToQueue(
  imageUrl: string,
  audioUrl: string,
  prompt: string
): Promise<KieQueueSubmitResponse> {
  const { taskId } = await createKlingAvatarTask({
    image_url: imageUrl,
    audio_url: audioUrl,
    prompt,
  })

  return {
    request_id: taskId,
  }
}

/**
 * Kling Avatar 큐 상태 조회
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getKlingAvatarQueueStatus(requestId: string): Promise<KieQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  const statusMap: Record<KieTaskStatus, KieQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'success': 'COMPLETED',
    'fail': 'COMPLETED',
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

// 기존 호환성을 위한 함수 별칭
export const getInfinitalkQueueStatus = getKlingAvatarQueueStatus

/**
 * Kling Avatar 결과 조회
 *
 * @param requestId - Task ID
 * @returns 생성된 영상 정보
 */
export async function getKlingAvatarQueueResponse(requestId: string): Promise<KieKlingAvatarResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`영상 생성 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('생성된 영상이 없습니다')
  }

  return {
    videos: resultUrls.map(url => ({ url })),
  }
}

// 기존 호환성을 위한 함수 별칭
export const getInfinitalkQueueResponse = getKlingAvatarQueueResponse

// ============================================================
// 이미지 광고 생성 (GPT Image 1.5 우선, Seedream fallback)
// ============================================================

/** 이미지 광고 사이즈 타입 (fal.ai 호환) */
export type ImageAdSize = '1024x1024' | '1536x1024' | '1024x1536'

/** 이미지 광고 품질 타입 */
export type ImageAdQuality = 'medium' | 'high'

/** 이미지 광고 입력 타입 */
export interface KieImageAdInput {
  prompt: string
  image_urls: string[]
  image_size?: ImageAdSize
  quality?: ImageAdQuality
  num_images?: number
  background?: 'auto' | 'transparent' | 'opaque'
}

/** 이미지 광고 결과 타입 */
export interface KieImageAdResult {
  images: Array<{ url: string }>
}

/** 이미지 사이즈를 화면 비율로 변환 */
function imageSizeToAspectRatio(imageSize: ImageAdSize): GPTImageAspectRatio {
  const mapping: Record<ImageAdSize, GPTImageAspectRatio> = {
    '1024x1024': '1:1',
    '1536x1024': '3:2',
    '1024x1536': '2:3',
  }
  return mapping[imageSize] || '1:1'
}

/** 이미지 사이즈를 Seedream 화면 비율로 변환 */
function imageSizeToEditAspectRatio(imageSize: ImageAdSize): EditAspectRatio {
  const mapping: Record<ImageAdSize, EditAspectRatio> = {
    '1024x1024': '1:1',
    '1536x1024': '3:2',
    '1024x1536': '2:3',
  }
  return mapping[imageSize] || '1:1'
}

/**
 * 이미지 광고 생성 요청을 큐에 제출 (GPT Image 1.5 우선, Seedream fallback)
 *
 * @param input - 이미지 광고 생성 입력 데이터
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitImageAdToQueue(input: KieImageAdInput): Promise<KieQueueSubmitResponse> {
  const quality = input.quality || 'medium'

  // Seedream으로 먼저 시도 (항상 high 퀄리티 사용)
  try {
    const editAspectRatio = imageSizeToEditAspectRatio(input.image_size || '1024x1024')

    const { taskId } = await createEditTask({
      prompt: input.prompt,
      image_urls: input.image_urls,
      aspect_ratio: editAspectRatio,
      quality: 'high',  // 항상 high 퀄리티 사용
    })

    return {
      request_id: taskId,
    }
  } catch (seedreamError) {
    console.warn('Seedream 실패, GPT Image 1.5로 폴백:', seedreamError)

    // GPT Image 1.5 fallback
    const aspectRatio = imageSizeToAspectRatio(input.image_size || '1024x1024')

    const { taskId } = await createGPTImageTask({
      input_urls: input.image_urls,
      prompt: input.prompt,
      aspect_ratio: aspectRatio,
      quality: quality,
    })

    return {
      request_id: taskId,
    }
  }
}

/**
 * 이미지 광고 큐 상태 조회
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getImageAdQueueStatus(requestId: string): Promise<KieQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  const statusMap: Record<KieTaskStatus, KieQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'success': 'COMPLETED',
    'fail': 'COMPLETED',
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

/**
 * 이미지 광고 결과 조회
 *
 * @param requestId - Task ID
 * @returns 생성된 이미지 정보
 */
export async function getImageAdQueueResponse(requestId: string): Promise<KieImageAdResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`이미지 생성 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('생성된 이미지가 없습니다')
  }

  return {
    images: resultUrls.map(url => ({ url })),
  }
}

// ============================================================
// Suno Music Generation (광고 음악 생성)
// ============================================================

/** Suno 음악 생성 모델 */
export type SunoModel = 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5'

/** Suno 음악 생성 입력 타입 */
export interface KieMusicInput {
  prompt?: string          // 음악 설명 또는 스타일 프롬프트 (비커스텀 모드에서 필수)
  style?: string           // 장르/스타일 (customMode: true일 때)
  title?: string           // 음악 제목 (customMode: true일 때)
  customMode: boolean      // 커스텀 모드 여부
  instrumental: boolean    // Instrumental (가사 없음)
  model: SunoModel         // 사용할 모델
  negativeTags?: string    // 제외할 스타일
}

/** Suno 음악 생성 응답 데이터 */
export interface KieMusicTaskData {
  taskId: string
}

/** Suno 음악 콜백 데이터 아이템 (콜백용 - snake_case) */
export interface SunoMusicCallbackItem {
  id: string
  audio_url: string
  stream_audio_url: string
  image_url: string
  prompt: string
  model_name: string
  title: string
  tags: string
  createTime: string
  duration: number
}

/** Suno 음악 데이터 아이템 (조회용 - camelCase) */
export interface SunoMusicItem {
  id: string
  audioUrl: string
  streamAudioUrl: string
  imageUrl: string
  prompt: string
  modelName: string
  title: string
  tags: string
  createTime: string
  duration: number
}

/** 음악 상태 타입 */
export type SunoMusicStatus =
  | 'PENDING'
  | 'TEXT_SUCCESS'
  | 'FIRST_SUCCESS'
  | 'SUCCESS'
  | 'CREATE_TASK_FAILED'
  | 'GENERATE_AUDIO_FAILED'
  | 'CALLBACK_EXCEPTION'
  | 'SENSITIVE_WORD_ERROR'

/** Suno 음악 상세 조회 응답 */
export interface SunoMusicDetailResponse {
  taskId: string
  parentMusicId?: string
  param?: string
  response?: {
    taskId: string
    sunoData: SunoMusicItem[]
  }
  status: SunoMusicStatus
  type?: string
  operationType?: string
  errorCode?: number | null
  errorMessage?: string | null
}

/**
 * 음악 생성 작업 생성
 *
 * @param input - 음악 생성 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL
 * @returns Task ID
 */
export async function createMusicTask(
  input: KieMusicInput,
  callbackUrl: string
): Promise<KieMusicTaskData> {
  const body: Record<string, unknown> = {
    customMode: input.customMode,
    instrumental: input.instrumental,
    model: input.model,
    callBackUrl: callbackUrl,
  }

  if (input.customMode) {
    // 커스텀 모드: style 필수, instrumental이 false면 prompt도 필수
    body.style = input.style || ''
    body.title = input.title || 'Ad Music'
    if (!input.instrumental) {
      body.prompt = input.prompt
    }
  } else {
    // 비커스텀 모드: prompt만 필요
    body.prompt = input.prompt
  }

  if (input.negativeTags) {
    body.negativeTags = input.negativeTags
  }

  const response = await fetch(`${KIE_API_BASE}/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai Music API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieMusicTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai Music API 오류: ${result.msg}`)
  }

  return {
    taskId: result.data.taskId,
  }
}

/**
 * 음악 생성 상태 조회
 *
 * @param taskId - 조회할 Task ID
 * @returns 음악 생성 상세 정보
 */
export async function getMusicTaskInfo(taskId: string): Promise<SunoMusicDetailResponse> {
  const response = await fetch(
    `${KIE_API_BASE}/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai Music API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<SunoMusicDetailResponse> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai Music API 오류: ${result.msg}`)
  }

  return result.data
}

/**
 * 광고 음악 생성 요청 제출
 *
 * @param mood - 분위기 (bright, calm, emotional, professional, exciting)
 * @param genre - 장르 (pop, electronic, classical, jazz, rock, hiphop)
 * @param productType - 제품 유형 (cosmetics, food, tech, fashion, etc.)
 * @param callbackUrl - 콜백 URL
 * @returns Task ID
 */
export async function submitAdMusicToQueue(
  mood: string,
  genre: string,
  productType: string,
  callbackUrl: string
): Promise<{ taskId: string }> {
  // 분위기와 장르, 제품 타입을 조합하여 프롬프트 생성
  const prompt = buildMusicStylePrompt(mood, genre, productType)

  const { taskId } = await createMusicTask(
    {
      prompt,
      customMode: false,
      instrumental: true,
      model: 'V5',
    },
    callbackUrl
  )

  return { taskId }
}

// ============================================================
// Z Image Turbo (빠른 배경 이미지 생성)
// ============================================================

/** Z Image Turbo 입력 타입 */
export interface KieZImageTurboInput {
  prompt: string
  aspect_ratio?: ZImageAspectRatio
}

/** Z Image Turbo 출력 타입 */
export interface KieZImageTurboOutput {
  taskId: string
}

/** Z Image Turbo 결과 타입 */
export interface KieZImageTurboResult {
  images: Array<{ url: string }>
}

/**
 * Z Image Turbo 작업 생성
 *
 * @param input - 이미지 생성 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL (선택)
 * @returns Task ID
 */
export async function createZImageTurboTask(
  input: KieZImageTurboInput,
  callbackUrl?: string
): Promise<KieZImageTurboOutput> {
  const body: Record<string, unknown> = {
    model: ZIMAGE_MODEL,
    input: {
      prompt: input.prompt,
      aspect_ratio: input.aspect_ratio || '16:9',  // 배경용 기본 가로 비율
    },
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai API 오류: ${result.msg}`)
  }

  return {
    taskId: result.data.taskId,
  }
}

/**
 * Z Image Turbo 요청을 큐에 제출
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param aspectRatio - 화면 비율 (선택)
 * @returns 큐 제출 응답
 */
export async function submitZImageTurboToQueue(
  prompt: string,
  aspectRatio?: ZImageAspectRatio
): Promise<KieQueueSubmitResponse> {
  const { taskId } = await createZImageTurboTask({
    prompt,
    aspect_ratio: aspectRatio,
  })

  return {
    request_id: taskId,
  }
}

/**
 * Z Image Turbo 큐 상태 조회
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getZImageTurboQueueStatus(requestId: string): Promise<KieQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  const statusMap: Record<KieTaskStatus, KieQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'success': 'COMPLETED',
    'fail': 'COMPLETED',
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

/**
 * Z Image Turbo 결과 조회
 *
 * @param requestId - Task ID
 * @returns 생성된 이미지 정보
 */
export async function getZImageTurboQueueResponse(requestId: string): Promise<KieZImageTurboResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`이미지 생성 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('생성된 이미지가 없습니다')
  }

  return {
    images: resultUrls.map(url => ({ url })),
  }
}

/**
 * 광고 배경 생성 요청 제출
 *
 * @param prompt - 최적화된 프롬프트
 * @param aspectRatio - 화면 비율
 * @returns Task ID
 */
export async function submitAdBackgroundToQueue(
  prompt: string,
  aspectRatio: ZImageAspectRatio = '16:9'
): Promise<{ taskId: string }> {
  const { taskId } = await createZImageTurboTask({
    prompt,
    aspect_ratio: aspectRatio,
  })

  return { taskId }
}

/**
 * 음악 스타일 프롬프트 생성
 */
function buildMusicStylePrompt(mood: string, genre: string, productType: string): string {
  const moodStyles: Record<string, string> = {
    bright: 'uplifting, cheerful, positive energy',
    calm: 'relaxing, soothing, peaceful',
    emotional: 'touching, heartfelt, cinematic',
    professional: 'corporate, confident, sophisticated',
    exciting: 'energetic, dynamic, thrilling',
    trendy: 'modern, fresh, contemporary',
  }

  const genreStyles: Record<string, string> = {
    pop: 'pop, catchy melody',
    electronic: 'electronic, synth, modern beats',
    classical: 'orchestral, elegant, refined',
    jazz: 'jazz, smooth, sophisticated',
    rock: 'rock, guitar-driven, powerful',
    hiphop: 'hip-hop, rhythmic, urban',
    ambient: 'ambient, atmospheric, ethereal',
    acoustic: 'acoustic, warm, natural',
  }

  const productStyles: Record<string, string> = {
    cosmetics: 'luxurious, feminine, elegant',
    food: 'appetizing, warm, inviting',
    tech: 'innovative, futuristic, sleek',
    fashion: 'stylish, trendy, chic',
    health: 'fresh, clean, revitalizing',
    automobile: 'powerful, dynamic, premium',
    finance: 'trustworthy, stable, professional',
    lifestyle: 'comfortable, friendly, everyday',
  }

  const parts = [
    moodStyles[mood] || mood,
    genreStyles[genre] || genre,
    productStyles[productType] || productType,
    'advertisement background music, commercial jingle, 30 seconds',
  ]

  return parts.filter(Boolean).join(', ')
}

// ============================================================
// Seedance 1.5 Pro (Image-to-Video with Frame Interpolation)
// ============================================================

/** Seedance 1.5 Pro 모델 ID */
const SEEDANCE_MODEL = 'bytedance/seedance-1.5-pro'

/** Seedance 화면 비율 */
export type SeedanceAspectRatio = '1:1' | '21:9' | '4:3' | '3:4' | '16:9' | '9:16'

/** Seedance 해상도 */
export type SeedanceResolution = '480p' | '720p'

/** Seedance 영상 길이 (초) */
export type SeedanceDuration = '4' | '8' | '12'

/** Seedance 입력 타입 */
export interface KieSeedanceInput {
  prompt: string                      // 영상 설명 (3-2500자)
  input_urls?: string[]               // 입력 이미지 URL (0-2개, 비어있으면 텍스트만으로 생성)
  aspect_ratio?: SeedanceAspectRatio  // 화면 비율 (기본값: 9:16)
  resolution?: SeedanceResolution     // 해상도 (기본값: 720p)
  duration?: SeedanceDuration         // 영상 길이 (기본값: 8)
  fixed_lens?: boolean                // 카메라 고정 (기본값: false)
  generate_audio?: boolean            // 오디오 생성 (기본값: false)
}

/** Seedance 출력 타입 */
export interface KieSeedanceOutput {
  taskId: string
}

/** Seedance 결과 타입 */
export interface KieSeedanceResult {
  videos: Array<{ url: string }>
}

/**
 * Seedance 1.5 Pro 작업 생성
 *
 * @param input - 영상 생성 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL (선택)
 * @returns Task ID
 */
export async function createSeedanceTask(
  input: KieSeedanceInput,
  callbackUrl?: string
): Promise<KieSeedanceOutput> {
  const body: Record<string, unknown> = {
    model: SEEDANCE_MODEL,
    input: {
      prompt: input.prompt,
      aspect_ratio: input.aspect_ratio || '9:16',
      resolution: input.resolution || '720p',
      duration: input.duration || '8',
      fixed_lens: input.fixed_lens ?? false,
      generate_audio: input.generate_audio ?? false,
    },
  }

  // 입력 이미지가 있으면 추가
  if (input.input_urls && input.input_urls.length > 0) {
    (body.input as Record<string, unknown>).input_urls = input.input_urls
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kie.ai API 오류: ${response.status} - ${errorText}`)
  }

  const result: KieApiResponse<KieTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai API 오류: ${result.msg}`)
  }

  return {
    taskId: result.data.taskId,
  }
}

/**
 * Seedance 영상 생성 요청을 큐에 제출 (시작/끝 프레임 보간)
 *
 * @param startFrameUrl - 시작 프레임 이미지 URL
 * @param endFrameUrl - 끝 프레임 이미지 URL (선택)
 * @param prompt - 영상 생성 프롬프트
 * @param options - 추가 옵션
 * @returns 큐 제출 응답
 */
export async function submitSeedanceToQueue(
  startFrameUrl: string,
  endFrameUrl: string | null,
  prompt: string,
  options?: {
    aspectRatio?: SeedanceAspectRatio
    resolution?: SeedanceResolution
    duration?: SeedanceDuration
    fixedLens?: boolean
    generateAudio?: boolean
  }
): Promise<KieQueueSubmitResponse> {
  const inputUrls = endFrameUrl ? [startFrameUrl, endFrameUrl] : [startFrameUrl]

  const { taskId } = await createSeedanceTask({
    prompt,
    input_urls: inputUrls,
    aspect_ratio: options?.aspectRatio || '9:16',
    resolution: options?.resolution || '720p',
    duration: options?.duration || '8',
    fixed_lens: options?.fixedLens ?? false,
    generate_audio: options?.generateAudio ?? false,
  })

  return {
    request_id: taskId,
  }
}

/**
 * Seedance 큐 상태 조회
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getSeedanceQueueStatus(requestId: string): Promise<KieQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  const statusMap: Record<KieTaskStatus, KieQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'success': 'COMPLETED',
    'fail': 'COMPLETED',
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

/**
 * Seedance 결과 조회
 *
 * @param requestId - Task ID
 * @returns 생성된 영상 정보
 */
export async function getSeedanceQueueResponse(requestId: string): Promise<KieSeedanceResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`영상 생성 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const resultUrls = parseResultJson(taskInfo.resultJson)
  if (resultUrls.length === 0) {
    throw new Error('생성된 영상이 없습니다')
  }

  return {
    videos: resultUrls.map(url => ({ url })),
  }
}
