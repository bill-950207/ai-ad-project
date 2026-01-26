/**
 * 음성 목록 API 라우트
 *
 * GET /api/voices - ElevenLabs API에서 음성 목록 조회
 * GET /api/voices?language=ko - 특정 언어의 음성 목록 조회
 * GET /api/voices?all=true - 모든 언어의 음성 목록 조회
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  getVoices,
  filterVoicesByLanguage,
  LANGUAGE_LABELS,
  type VoiceLanguage,
  type Voice,
} from '@/lib/elevenlabs/client'

/**
 * GET /api/voices
 *
 * ElevenLabs API에서 음성 목록을 조회합니다.
 * - ?language=ko|en|ja|zh: 특정 언어의 음성 목록
 * - ?all=true: 모든 언어의 음성 목록 (언어별 그룹화)
 * - 파라미터 없음: 모든 음성 목록 (기본값)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') as VoiceLanguage | null
    const all = searchParams.get('all')

    // ElevenLabs API에서 모든 음성 목록 조회
    const allVoices = await getVoices()

    // 모든 언어별 음성 조회
    if (all === 'true') {
      const languages: VoiceLanguage[] = ['ko', 'en', 'ja', 'zh']
      const voicesByLanguage = languages.map(lang => ({
        language: lang,
        label: LANGUAGE_LABELS[lang],
        voices: filterVoicesByLanguage(allVoices, lang),
      }))

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
      const filteredVoices = filterVoicesByLanguage(allVoices, language)

      // 음성 정보 정규화 (UI 호환성)
      const voices = normalizeVoices(filteredVoices)

      return NextResponse.json({
        voices,
        language,
        languageLabel: LANGUAGE_LABELS[language],
      })
    }

    // 기본값: 모든 음성 (언어 필터 없음)
    const voices = normalizeVoices(allVoices)
    return NextResponse.json({
      voices,
      language: null,
      languageLabel: 'All',
    })
  } catch (error) {
    console.error('음성 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}

/**
 * 음성 정보를 UI에서 사용하기 쉬운 형태로 정규화
 */
function normalizeVoices(voices: Voice[]) {
  return voices.map(voice => ({
    id: voice.voice_id,
    voice_id: voice.voice_id,
    name: voice.name,
    description: voice.description || getVoiceDescription(voice),
    gender: voice.labels?.gender || 'unknown',
    style: voice.labels?.use_case || voice.labels?.accent || 'general',
    preview_url: voice.preview_url,
    previewUrl: voice.preview_url,
    labels: voice.labels,
    category: voice.category,
  }))
}

/**
 * labels에서 음성 설명 생성
 */
function getVoiceDescription(voice: Voice): string {
  const parts: string[] = []

  if (voice.labels?.age) {
    parts.push(voice.labels.age)
  }
  if (voice.labels?.gender) {
    parts.push(voice.labels.gender)
  }
  if (voice.labels?.accent) {
    parts.push(voice.labels.accent)
  }
  if (voice.labels?.use_case) {
    parts.push(voice.labels.use_case)
  }

  return parts.length > 0 ? parts.join(', ') : 'Premium voice'
}
