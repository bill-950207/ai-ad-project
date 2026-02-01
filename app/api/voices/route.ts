/**
 * 음성 목록 API 라우트
 *
 * GET /api/voices - Kie.ai ElevenLabs v3 음성 목록 조회
 *
 * NOTE: ElevenLabs 음성은 모든 언어를 지원하므로 언어 파라미터와 무관하게
 * 항상 전체 음성 목록을 반환합니다.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  VOICES,
  LANGUAGE_LABELS,
} from '@/lib/kie/tts'

/**
 * GET /api/voices
 *
 * Kie.ai ElevenLabs v3 음성 목록을 조회합니다.
 * ElevenLabs 음성은 모든 언어를 지원하므로 언어 파라미터와 무관하게
 * 항상 전체 음성 목록을 반환합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')

    // 음성 정보 정규화 (UI 호환성)
    const normalizedVoices = VOICES.map(voice => ({
      id: voice.id,
      voice_id: voice.id,
      name: voice.name,
      description: voice.description,
      gender: voice.gender,
      style: voice.style,
      preview_url: voice.previewUrl || null,
      previewUrl: voice.previewUrl || null,
      language: 'all', // 모든 언어 지원
    }))

    // 모든 언어별 음성 조회 (레거시 호환)
    if (all === 'true') {
      return NextResponse.json({
        voicesByLanguage: [{
          language: 'all',
          label: 'All Voices',
          voices: normalizedVoices,
        }],
        languages: Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({
          code,
          label,
        })),
        provider: 'kie-elevenlabs-v3',
        note: 'ElevenLabs voices support all languages',
      })
    }

    // 단일 목록으로 반환 (언어 무관)
    return NextResponse.json({
      voices: normalizedVoices,
      language: 'all',
      languageLabel: 'All Voices',
      provider: 'kie-elevenlabs-v3',
      note: 'ElevenLabs voices support all languages',
    })
  } catch (error) {
    console.error('음성 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
