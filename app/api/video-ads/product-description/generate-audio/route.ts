/**
 * 제품 설명 영상 - TTS 오디오 생성 API
 *
 * POST /api/video-ads/product-description/generate-audio
 * - WaveSpeed Minimax TTS로 대본을 음성으로 변환 (우선)
 * - ElevenLabs TTS 백업
 * - R2에 오디오 파일 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { textToSpeech as minimaxTTS } from '@/lib/wavespeed/client'
import { textToSpeech as elevenLabsTTS } from '@/lib/elevenlabs/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

// R2 클라이언트 설정
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

/**
 * 음성 ID가 Minimax 형식인지 확인
 */
function isMinimaxVoiceId(voiceId: string): boolean {
  return voiceId.startsWith('Korean_') ||
    voiceId.startsWith('English_') ||
    voiceId.startsWith('Japanese_') ||
    voiceId.startsWith('Chinese_')
}

/**
 * URL에서 오디오 파일 다운로드
 */
async function downloadAudio(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`오디오 다운로드 실패: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * POST /api/video-ads/product-description/generate-audio
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { script, voiceId, voiceName } = body

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    if (!voiceId) {
      return NextResponse.json({ error: 'Voice ID is required' }, { status: 400 })
    }

    let audioBuffer: Buffer
    let contentType = 'audio/mpeg'

    // Minimax 음성 ID인 경우 WaveSpeed API 사용
    if (isMinimaxVoiceId(voiceId)) {
      try {
        // WaveSpeed Minimax TTS 생성 (URL 반환)
        const audioUrl = await minimaxTTS(script.trim(), voiceId)

        // URL에서 오디오 다운로드
        audioBuffer = await downloadAudio(audioUrl)
      } catch (minimaxError) {
        console.error('Minimax TTS 실패, ElevenLabs 백업 시도:', minimaxError)

        // Minimax 실패 시 ElevenLabs 백업
        const ttsResult = await elevenLabsTTS({
          text: script.trim(),
          voice_id: 'pNInz6obpgDQGcFmaJgB',  // 기본 한국어 음성
          model_id: 'eleven_multilingual_v2',
        })
        audioBuffer = Buffer.from(ttsResult.audioBuffer)
        contentType = ttsResult.contentType
      }
    } else {
      // ElevenLabs 음성 ID인 경우 ElevenLabs API 사용
      const ttsResult = await elevenLabsTTS({
        text: script.trim(),
        voice_id: voiceId,
        model_id: 'eleven_multilingual_v2',
      })
      audioBuffer = Buffer.from(ttsResult.audioBuffer)
      contentType = ttsResult.contentType
    }

    // R2에 오디오 파일 업로드
    const audioId = randomUUID()
    const audioKey = `video-ads/audio/${user.id}/${audioId}.mp3`

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: audioKey,
        Body: audioBuffer,
        ContentType: contentType,
      })
    )

    const audioUrl = `${R2_PUBLIC_URL}/${audioKey}`

    return NextResponse.json({
      audioUrl,
      voiceId,
      voiceName,
    })
  } catch (error) {
    console.error('TTS 오디오 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    )
  }
}
