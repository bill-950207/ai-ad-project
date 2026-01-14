/**
 * Minimax 음성 목록 API 라우트
 *
 * GET /api/minimax-voices - 음성 목록 조회
 * GET /api/minimax-voices?language=ko - 특정 언어의 음성 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getVoicesByLanguage,
  getAllVoices,
  LANGUAGE_LABELS,
  type VoiceLanguage,
} from '@/lib/wavespeed/client'
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
    const language = searchParams.get('language') as VoiceLanguage | null
    const all = searchParams.get('all')

    // 캐시된 프리뷰 URL 조회
    const cachedPreviews = await prisma.voice_previews.findMany()
    const previewMap = new Map(
      cachedPreviews.map((p) => [p.voice_id, p.audio_url])
    )

    // 모든 언어 음성 조회
    if (all === 'true') {
      const voicesByLanguage = getAllVoices()

      // 프리뷰 URL 추가
      const voicesWithPreviews = Object.fromEntries(
        Object.entries(voicesByLanguage).map(([lang, voices]) => [
          lang,
          voices.map((v) => ({
            ...v,
            previewUrl: previewMap.get(v.id) || null,
          })),
        ])
      )

      return NextResponse.json({
        voicesByLanguage: voicesWithPreviews,
        languages: Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({
          code,
          label,
        })),
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
      previewUrl: previewMap.get(v.id) || null,
    }))

    return NextResponse.json({
      voices: voicesWithPreviews,
      language: targetLanguage,
      languageLabel: LANGUAGE_LABELS[targetLanguage],
    })
  } catch (error) {
    console.error('음성 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
