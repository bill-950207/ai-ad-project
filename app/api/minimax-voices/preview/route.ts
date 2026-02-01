/**
 * 음성 프리뷰 API 라우트
 *
 * GET /api/minimax-voices/preview?voiceId=BIvP0GN1cAtSRTxNHnWS&language=ko
 * - 캐시된 프리뷰가 있으면 반환 (voice_id + language 조합)
 * - 없으면 실시간 생성 후 캐시하여 반환
 *
 * NOTE: Kie.ai ElevenLabs v3 TTS로 마이그레이션되었습니다.
 * ElevenLabs 음성은 모든 언어를 지원하므로, 같은 음성이라도 언어별로 다른 프리뷰가 생성됩니다.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 30  // TTS 생성에 최대 30초 허용

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  textToSpeech,
  type TTSLanguage,
  VOICE_IDS,
} from '@/lib/kie/tts'

/**
 * 음성 프리뷰용 샘플 텍스트
 */
const SAMPLE_TEXTS: Record<string, string> = {
  ko: '안녕하세요! 좋은 하루 되세요.',
  en: 'Hello! Have a great day.',
  ja: 'こんにちは！素敵な一日を。',
  zh: '你好！祝你有美好的一天。',
}

/**
 * GET /api/minimax-voices/preview
 *
 * 음성 프리뷰 오디오 URL을 반환합니다.
 * - voiceId: 음성 ID (필수)
 * - language: 프리뷰 언어 (선택, 기본값: ko)
 * - 캐시된 프리뷰가 있으면 바로 반환
 * - 없으면 실시간으로 TTS 생성 후 캐시하여 반환
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const voiceId = searchParams.get('voiceId')
    const language = searchParams.get('language') || 'ko'

    if (!voiceId) {
      return NextResponse.json(
        { error: 'voiceId is required' },
        { status: 400 }
      )
    }

    // 언어 유효성 검사
    const validLanguages = ['ko', 'en', 'ja', 'zh']
    const targetLanguage = validLanguages.includes(language) ? language : 'ko'

    // 음성 ID 유효성 확인 (VOICE_IDS 배열에 있는지 확인)
    const isValidVoiceId = VOICE_IDS.includes(voiceId as typeof VOICE_IDS[number])
    if (!isValidVoiceId) {
      return NextResponse.json(
        { error: 'Voice not found' },
        { status: 404 }
      )
    }

    // 캐시된 프리뷰 조회 (voice_id + language 조합)
    const cachedPreview = await prisma.voice_previews.findUnique({
      where: {
        voice_id_language: {
          voice_id: voiceId,
          language: targetLanguage,
        },
      },
    })

    if (cachedPreview) {
      return NextResponse.json({
        voiceId,
        language: targetLanguage,
        audioUrl: cachedPreview.audio_url,
        cached: true,
      })
    }

    // 캐시가 없으면 실시간 생성
    const sampleText = SAMPLE_TEXTS[targetLanguage] || SAMPLE_TEXTS['ko']

    console.log(`[TTS Preview] 생성 시작: voiceId=${voiceId}, language=${targetLanguage}`)
    const audioUrl = await textToSpeech(sampleText, voiceId, {
      stability: 0.5,
      languageCode: targetLanguage as TTSLanguage,
    })
    console.log(`[TTS Preview] 생성 완료: audioUrl=${audioUrl}`)

    // 캐시에 저장
    await prisma.voice_previews.create({
      data: {
        voice_id: voiceId,
        language: targetLanguage,
        audio_url: audioUrl,
      },
    })

    return NextResponse.json({
      voiceId,
      language: targetLanguage,
      audioUrl,
      cached: false,
    })
  } catch (error) {
    console.error('음성 프리뷰 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate voice preview' },
      { status: 500 }
    )
  }
}
