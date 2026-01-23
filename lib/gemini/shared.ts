/**
 * Gemini 공용 클라이언트 및 유틸리티
 */

import { GoogleGenAI } from '@google/genai'

// Gemini 클라이언트 초기화
export const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

// 사용할 모델
export const MODEL_NAME = 'gemini-3-flash-preview'

/**
 * URL에서 이미지를 가져와 base64로 변환합니다.
 */
export async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return { base64, mimeType: contentType }
  } catch (error) {
    console.error('이미지 로드 오류:', error)
    return null
  }
}
