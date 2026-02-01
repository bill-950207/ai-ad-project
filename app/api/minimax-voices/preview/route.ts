/**
 * 음성 프리뷰 API 라우트
 *
 * GET /api/minimax-voices/preview?voiceId=korean_female_1
 * - 캐시된 프리뷰가 있으면 반환
 * - 없으면 실시간 생성 후 캐시하여 반환
 *
 * NOTE: Kie.ai ElevenLabs v3 TTS로 마이그레이션되었습니다.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 30  // TTS 생성에 최대 30초 허용

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  findVoiceById,
  textToSpeech,
  type TTSLanguage,
} from '@/lib/kie/tts'

/**
 * 음성 ID에서 언어 코드 추출
 */
function getLanguageFromVoiceId(voiceId: string): TTSLanguage {
  if (voiceId.startsWith('korean_')) return 'ko'
  if (voiceId.startsWith('english_')) return 'en'
  if (voiceId.startsWith('japanese_')) return 'ja'
  if (voiceId.startsWith('chinese_')) return 'zh'
  return 'ko'
}

/**
 * 음성 프리뷰용 샘플 텍스트
 */
const SAMPLE_TEXTS: Record<TTSLanguage, string> = {
  ko: '안녕하세요! 좋은 하루 되세요.',
  en: 'Hello! Have a great day.',
  ja: 'こんにちは！素敵な一日を。',
  zh: '你好！祝你有美好的一天。',
  auto: 'Hello! Have a great day.',
} as Record<TTSLanguage, string>

/**
 * GET /api/minimax-voices/preview
 *
 * 음성 프리뷰 오디오 URL을 반환합니다.
 * - 캐시된 프리뷰가 있으면 바로 반환
 * - 없으면 실시간으로 TTS 생성 후 캐시하여 반환
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const voiceId = searchParams.get('voiceId')

    if (!voiceId) {
      return NextResponse.json(
        { error: 'voiceId is required' },
        { status: 400 }
      )
    }

    // 음성 정보 확인
    const voiceInfo = findVoiceById(voiceId)
    if (!voiceInfo) {
      return NextResponse.json(
        { error: 'Voice not found' },
        { status: 404 }
      )
    }

    // 캐시된 프리뷰 조회
    const cachedPreview = await prisma.voice_previews.findUnique({
      where: { voice_id: voiceId },
    })

    if (cachedPreview) {
      return NextResponse.json({
        voiceId,
        audioUrl: cachedPreview.audio_url,
        cached: true,
      })
    }

    // 캐시가 없으면 실시간 생성
    const language = voiceInfo.language || getLanguageFromVoiceId(voiceId)
    const sampleText = SAMPLE_TEXTS[language] || SAMPLE_TEXTS['en']

    console.log(`[TTS Preview] 생성 시작: voiceId=${voiceId}, language=${language}`)
    const audioUrl = await textToSpeech(sampleText, voiceId, {
      stability: 0.5,
      languageCode: language,
    })
    console.log(`[TTS Preview] 생성 완료: audioUrl=${audioUrl}`)

    // 캐시에 저장
    await prisma.voice_previews.create({
      data: {
        voice_id: voiceId,
        language,
        audio_url: audioUrl,
      },
    })

    return NextResponse.json({
      voiceId,
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
