/**
 * 음성 목록 API 라우트
 *
 * GET /api/voices - Kie.ai ElevenLabs v3 음성 목록 조회
 *
 * NOTE: ElevenLabs 음성은 모든 언어를 지원하므로 언어 파라미터와 무관하게
 * 항상 전체 음성 목록을 반환합니다.
 *
 * 캐싱: unstable_cache (30분 TTL) - 정적 데이터이므로 긴 TTL 적용
 */

import { unstable_cache } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import {
  VOICES,
  LANGUAGE_LABELS,
} from '@/lib/kie/tts'

// 30분 캐시 (정적 데이터)
const CACHE_TTL = 1800

/**
 * 음성 목록 정규화 함수 (캐싱됨)
 */
const getNormalizedVoices = unstable_cache(
  async () => {
    return VOICES.map(voice => ({
      id: voice.id,
      voice_id: voice.id,
      name: voice.name,
      description: voice.description,
      gender: voice.gender,
      style: voice.style,
      preview_url: voice.previewUrl || null,
      previewUrl: voice.previewUrl || null,
      language: 'all' as const,
    }))
  },
  ['voices-normalized'],
  { revalidate: CACHE_TTL, tags: ['voices'] }
)

/**
 * 전체 음성 데이터 (all=true용) (캐싱됨)
 */
const getAllVoicesData = unstable_cache(
  async () => {
    const normalizedVoices = await getNormalizedVoices()
    return {
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
    }
  },
  ['voices-all'],
  { revalidate: CACHE_TTL, tags: ['voices'] }
)

/**
 * 단일 음성 목록 데이터 (캐싱됨)
 */
const getVoicesData = unstable_cache(
  async () => {
    const normalizedVoices = await getNormalizedVoices()
    return {
      voices: normalizedVoices,
      language: 'all',
      languageLabel: 'All Voices',
      provider: 'kie-elevenlabs-v3',
      note: 'ElevenLabs voices support all languages',
    }
  },
  ['voices-single'],
  { revalidate: CACHE_TTL, tags: ['voices'] }
)

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

    // 모든 언어별 음성 조회 (레거시 호환)
    if (all === 'true') {
      const data = await getAllVoicesData()
      return NextResponse.json(data)
    }

    // 단일 목록으로 반환 (언어 무관)
    const data = await getVoicesData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('음성 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
