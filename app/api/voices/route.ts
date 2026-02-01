/**
 * 음성 목록 API 라우트
 *
 * GET /api/voices - Kie.ai ElevenLabs v3 음성 목록 조회
 * GET /api/voices?language=ko - 특정 언어의 음성 목록 조회
 * GET /api/voices?all=true - 모든 언어의 음성 목록 조회
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  getVoicesByLanguage,
  getAllVoices,
  LANGUAGE_LABELS,
  type TTSLanguage,
} from '@/lib/kie/tts'

/**
 * GET /api/voices
 *
 * Kie.ai ElevenLabs v3 음성 목록을 조회합니다.
 * - ?language=ko|en|ja|zh: 특정 언어의 음성 목록
 * - ?all=true: 모든 언어의 음성 목록 (언어별 그룹화)
 * - 파라미터 없음: 한국어 음성 목록 (기본값)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') as TTSLanguage | null
    const all = searchParams.get('all')

    // 모든 언어별 음성 조회
    if (all === 'true') {
      const voiceGroups = getAllVoices()

      return NextResponse.json({
        voicesByLanguage: voiceGroups,
        languages: Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({
          code,
          label,
        })),
        provider: 'kie-elevenlabs-v3',
      })
    }

    // 특정 언어 음성 조회
    const targetLanguage = language && ['ko', 'en', 'ja', 'zh'].includes(language)
      ? language
      : 'ko'

    const voices = getVoicesByLanguage(targetLanguage)

    // 음성 정보 정규화 (UI 호환성)
    const normalizedVoices = voices.map(voice => ({
      id: voice.id,
      voice_id: voice.id,
      name: voice.name,
      description: voice.description,
      gender: voice.gender,
      style: voice.style,
      preview_url: voice.previewUrl || null,
      previewUrl: voice.previewUrl || null,
      language: voice.language,
    }))

    return NextResponse.json({
      voices: normalizedVoices,
      language: targetLanguage,
      languageLabel: LANGUAGE_LABELS[targetLanguage] || targetLanguage,
      provider: 'kie-elevenlabs-v3',
    })
  } catch (error) {
    console.error('음성 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
