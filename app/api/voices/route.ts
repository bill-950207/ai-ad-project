/**
 * 음성 목록 API 라우트
 *
 * GET /api/voices - ElevenLabs 음성 목록 조회
 * GET /api/voices?language=ko - 특정 언어의 음성 목록 조회
 * GET /api/voices?all=true - 모든 언어의 음성 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getKoreanRecommendedVoices,
  getVoicesByLanguage,
  getAllVoices,
  LANGUAGE_LABELS,
  type VoiceLanguage,
} from '@/lib/elevenlabs/client'

/**
 * GET /api/voices
 *
 * 음성 목록을 반환합니다.
 * - ?language=ko|en|ja|zh: 특정 언어의 음성 목록
 * - ?all=true: 모든 언어의 음성 목록 (언어별 그룹화)
 * - 파라미터 없음: 한국어 추천 음성 목록 (기본값)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') as VoiceLanguage | null
    const all = searchParams.get('all')

    // 모든 언어 음성 조회
    if (all === 'true') {
      const voicesByLanguage = getAllVoices()
      return NextResponse.json({
        voicesByLanguage,
        languages: Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({
          code,
          label,
        })),
      })
    }

    // 특정 언어 음성 조회
    if (language && ['ko', 'en', 'ja', 'zh'].includes(language)) {
      const voices = getVoicesByLanguage(language)
      return NextResponse.json({
        voices,
        language,
        languageLabel: LANGUAGE_LABELS[language],
      })
    }

    // 기본값: 한국어 추천 음성
    const voices = getKoreanRecommendedVoices()
    return NextResponse.json({
      voices,
      language: 'ko',
      languageLabel: LANGUAGE_LABELS.ko,
    })
  } catch (error) {
    console.error('음성 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
