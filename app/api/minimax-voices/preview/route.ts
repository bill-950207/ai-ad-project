/**
 * Minimax 음성 프리뷰 API 라우트
 *
 * GET /api/minimax-voices/preview?voiceId=Korean_SweetGirl
 * - 캐시된 프리뷰가 있으면 반환
 * - 없으면 실시간 생성 후 캐시하여 반환
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 30  // TTS 생성에 최대 30초 허용

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  findVoiceById,
  generateVoicePreview,
  type VoiceLanguage,
} from '@/lib/wavespeed/client'

/**
 * 음성 ID에서 언어 코드 추출
 */
function getLanguageFromVoiceId(voiceId: string): VoiceLanguage {
  if (voiceId.startsWith('Korean_')) return 'ko'
  if (voiceId.startsWith('English_') || voiceId.includes('_female_') || voiceId.includes('_male_')) return 'en'
  if (voiceId.startsWith('Japanese_')) return 'ja'
  if (voiceId.startsWith('Chinese (Mandarin)_') || voiceId === 'Arrogant_Miss') return 'zh'
  return 'ko'
}

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
    console.log(`[TTS Preview] 생성 시작: voiceId=${voiceId}, voiceInfo=`, voiceInfo)
    const audioUrl = await generateVoicePreview(voiceId)
    console.log(`[TTS Preview] 생성 완료: audioUrl=${audioUrl}`)

    // 캐시에 저장
    const language = getLanguageFromVoiceId(voiceId)
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
