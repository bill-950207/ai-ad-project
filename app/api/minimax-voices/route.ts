/**
 * 음성 목록 API 라우트 (레거시 호환)
 *
 * GET /api/minimax-voices - Kie.ai ElevenLabs v3 음성 목록 조회
 *
 * NOTE: 이 API는 /api/voices로 마이그레이션되었습니다.
 * 기존 코드 호환성을 위해 유지됩니다.
 * ElevenLabs 음성은 모든 언어를 지원하므로 언어 파라미터와 무관하게
 * 항상 전체 음성 목록을 반환합니다.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  VOICES,
  LANGUAGE_LABELS,
} from '@/lib/kie/tts'
import { prisma } from '@/lib/db'

/**
 * GET /api/minimax-voices
 *
 * 음성 목록을 반환합니다.
 * ElevenLabs 음성은 모든 언어를 지원하므로 언어 파라미터와 무관하게
 * 항상 전체 음성 목록을 반환합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')
    const language = searchParams.get('language') || 'ko'

    // 캐시된 프리뷰 URL 조회 (요청된 언어에 맞는 것만)
    const cachedPreviews = await prisma.voice_previews.findMany({
      where: { language },
    })
    const previewMap = new Map(
      cachedPreviews.map((p) => [p.voice_id, p.audio_url])
    )

    // 프리뷰 URL 추가
    const voicesWithPreviews = VOICES.map((v) => ({
      ...v,
      sampleText: '', // 레거시 호환
      previewUrl: previewMap.get(v.id) || v.previewUrl || null,
    }))

    // 모든 언어 음성 조회 (레거시 형식)
    if (all === 'true') {
      return NextResponse.json({
        voicesByLanguage: {
          all: voicesWithPreviews,
        },
        languages: Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({
          code,
          label,
        })),
        provider: 'kie-elevenlabs-v3',
        note: 'ElevenLabs voices support all languages',
      })
    }

    return NextResponse.json({
      voices: voicesWithPreviews,
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
