/**
 * 음성 목록 API 라우트 (레거시 호환)
 *
 * GET /api/minimax-voices - Kie.ai ElevenLabs v3 음성 목록 조회
 * GET /api/minimax-voices?language=ko - 특정 언어의 음성 목록 조회
 *
 * NOTE: 이 API는 /api/voices로 마이그레이션되었습니다.
 * 기존 코드 호환성을 위해 유지됩니다.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  getVoicesByLanguage,
  getAllVoices,
  LANGUAGE_LABELS,
} from '@/lib/kie/tts'
import { prisma } from '@/lib/db'

/**
 * GET /api/minimax-voices
 *
 * 음성 목록을 반환합니다.
 * - ?language=ko|en|ja|zh: 특정 언어의 음성 목록
 * - ?all=true: 모든 언어의 음성 목록 (언어별 그룹화)
 * - 파라미터 없음: 한국어 음성 목록 (기본값)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')
    const all = searchParams.get('all')

    // 캐시된 프리뷰 URL 조회
    const cachedPreviews = await prisma.voice_previews.findMany()
    const previewMap = new Map(
      cachedPreviews.map((p) => [p.voice_id, p.audio_url])
    )

    // 모든 언어 음성 조회
    if (all === 'true') {
      const voiceGroups = getAllVoices()

      // 프리뷰 URL 추가
      const voicesWithPreviews = voiceGroups.map(group => ({
        ...group,
        voices: group.voices.map((v) => ({
          ...v,
          sampleText: '', // 레거시 호환
          previewUrl: previewMap.get(v.id) || v.previewUrl || null,
        })),
      }))

      // 레거시 형식으로 변환
      const voicesByLanguage: Record<string, typeof voicesWithPreviews[0]['voices']> = {}
      voicesWithPreviews.forEach(group => {
        voicesByLanguage[group.language] = group.voices
      })

      return NextResponse.json({
        voicesByLanguage,
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

    // 프리뷰 URL 추가
    const voicesWithPreviews = voices.map((v) => ({
      ...v,
      sampleText: '', // 레거시 호환
      previewUrl: previewMap.get(v.id) || v.previewUrl || null,
    }))

    return NextResponse.json({
      voices: voicesWithPreviews,
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
