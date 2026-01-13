/**
 * 음성 목록 API 라우트
 *
 * GET /api/voices - ElevenLabs 음성 목록 조회
 */

import { NextResponse } from 'next/server'
import { getKoreanRecommendedVoices } from '@/lib/elevenlabs/client'

/**
 * GET /api/voices
 *
 * 한국어 추천 음성 목록을 반환합니다.
 */
export async function GET() {
  try {
    // 미리 정의된 한국어 추천 음성 목록 반환 (API 호출 없음)
    const voices = getKoreanRecommendedVoices()

    return NextResponse.json({ voices })
  } catch (error) {
    console.error('음성 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
