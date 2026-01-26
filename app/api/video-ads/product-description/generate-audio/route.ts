/**
 * 제품 설명 영상 - TTS 오디오 생성 API
 *
 * POST /api/video-ads/product-description/generate-audio
 * - ElevenLabs TTS로 대본을 음성으로 변환 (Primary)
 * - WaveSpeed Minimax TTS 백업 (Fallback)
 * - R2에 오디오 파일 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { textToSpeech as minimaxTTS } from '@/lib/wavespeed/client'
import { textToSpeech as elevenLabsTTS } from '@/lib/elevenlabs/client'
import { normalizeAudioVolume } from '@/lib/video/ffmpeg'
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
 * 음성 ID가 ElevenLabs 형식인지 확인
 * ElevenLabs 음성 ID는 보통 20-24자의 alphanumeric
 */
function isElevenLabsVoiceId(voiceId: string): boolean {
  return /^[A-Za-z0-9]{20,24}$/.test(voiceId)
}

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
    let usedProvider = 'unknown'

    // ElevenLabs 음성 ID인 경우 (Primary)
    if (isElevenLabsVoiceId(voiceId)) {
      try {
        console.log('[TTS] ElevenLabs TTS 시도:', voiceId)

        const ttsResult = await elevenLabsTTS({
          text: script.trim(),
          voice_id: voiceId,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.1,
            use_speaker_boost: true,  // 볼륨 증폭
          },
        })
        audioBuffer = Buffer.from(ttsResult.audioBuffer)
        contentType = ttsResult.contentType
        usedProvider = 'elevenlabs'
        console.log('[TTS] ElevenLabs TTS 성공')
      } catch (elevenLabsError) {
        console.error('[TTS] ElevenLabs TTS 실패, Minimax 백업 시도:', elevenLabsError)

        // ElevenLabs 실패 시 Minimax 백업 (기본 한국어 음성)
        const audioUrl = await minimaxTTS(script.trim(), 'Korean_SweetGirl')
        audioBuffer = await downloadAudio(audioUrl)
        usedProvider = 'minimax_fallback'
        console.log('[TTS] Minimax 백업 TTS 성공')
      }
    }
    // Minimax 음성 ID인 경우 (레거시 지원)
    else if (isMinimaxVoiceId(voiceId)) {
      try {
        console.log('[TTS] Minimax TTS 시도 (레거시):', voiceId)

        const audioUrl = await minimaxTTS(script.trim(), voiceId)
        audioBuffer = await downloadAudio(audioUrl)
        usedProvider = 'minimax'
        console.log('[TTS] Minimax TTS 성공')
      } catch (minimaxError) {
        console.error('[TTS] Minimax TTS 실패, ElevenLabs 백업 시도:', minimaxError)

        // Minimax 실패 시 ElevenLabs 백업
        const ttsResult = await elevenLabsTTS({
          text: script.trim(),
          voice_id: 'pNInz6obpgDQGcFmaJgB',  // 기본 영어 음성 (Adam)
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.1,
            use_speaker_boost: true,  // 볼륨 증폭
          },
        })
        audioBuffer = Buffer.from(ttsResult.audioBuffer)
        contentType = ttsResult.contentType
        usedProvider = 'elevenlabs_fallback'
        console.log('[TTS] ElevenLabs 백업 TTS 성공')
      }
    }
    // 알 수 없는 형식 - ElevenLabs 시도
    else {
      console.log('[TTS] 알 수 없는 음성 ID 형식, ElevenLabs 시도:', voiceId)

      try {
        const ttsResult = await elevenLabsTTS({
          text: script.trim(),
          voice_id: voiceId,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.1,
            use_speaker_boost: true,  // 볼륨 증폭
          },
        })
        audioBuffer = Buffer.from(ttsResult.audioBuffer)
        contentType = ttsResult.contentType
        usedProvider = 'elevenlabs'
      } catch (error) {
        console.error('[TTS] ElevenLabs 실패, Minimax 백업 시도:', error)

        const audioUrl = await minimaxTTS(script.trim(), 'Korean_SweetGirl')
        audioBuffer = await downloadAudio(audioUrl)
        usedProvider = 'minimax_fallback'
      }
    }

    // 오디오 볼륨 정규화 (InfiniteTalk/Kling Avatar API에서 잘 들리도록)
    try {
      console.log('[TTS] 오디오 볼륨 정규화 시작...')
      audioBuffer = await normalizeAudioVolume(audioBuffer, 1.5)
      console.log('[TTS] 오디오 볼륨 정규화 완료')
    } catch (normalizeError) {
      console.warn('[TTS] 오디오 정규화 실패, 원본 사용:', normalizeError)
      // 정규화 실패 시 원본 오디오 그대로 사용
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

    console.log(`[TTS] 오디오 생성 완료: provider=${usedProvider}, url=${audioUrl}`)

    return NextResponse.json({
      audioUrl,
      voiceId,
      voiceName,
      provider: usedProvider,
    })
  } catch (error) {
    console.error('[TTS] 오디오 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    )
  }
}
