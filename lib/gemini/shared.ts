/**
 * Gemini 공용 클라이언트 및 유틸리티
 */

import { GoogleGenAI } from '@google/genai'

// Gemini 클라이언트 Lazy Initialization (Cold Start 최적화)
let _genAI: GoogleGenAI | null = null

/**
 * Gemini 클라이언트를 가져옵니다.
 * 첫 호출 시에만 인스턴스를 생성합니다 (Lazy Initialization).
 */
export function getGenAI(): GoogleGenAI {
  if (!_genAI) {
    _genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY!,
    })
  }
  return _genAI
}

// 사용할 모델
export const MODEL_NAME = 'gemini-3-flash-preview'

/**
 * URL에서 이미지를 가져와 base64로 변환합니다.
 * 타임아웃 및 재시도 로직이 포함되어 있습니다.
 *
 * @param url - 이미지 URL
 * @param timeoutMs - 타임아웃 (기본 10초)
 * @param maxRetries - 최대 재시도 횟수 (기본 1회)
 */
export async function fetchImageAsBase64(
  url: string,
  timeoutMs: number = 10000,
  maxRetries: number = 1
): Promise<{ base64: string; mimeType: string } | null> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) return null

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      return { base64, mimeType: contentType }
    } catch (error) {
      lastError = error as Error
      console.error(`이미지 로드 오류 (시도 ${attempt + 1}/${maxRetries + 1}):`, error)

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  console.error('이미지 로드 최종 실패:', lastError)
  return null
}
