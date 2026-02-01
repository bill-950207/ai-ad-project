/**
 * 제품 설명 영상 - TTS 오디오 생성 API
 *
 * POST /api/video-ads/product-description/generate-audio
 * - Kie.ai ElevenLabs v3 TTS로 대본을 음성으로 변환
 * - R2에 오디오 파일 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { textToSpeech, downloadAudio } from '@/lib/kie/tts'
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
    const { script, voiceId, voiceName, languageCode } = body

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    if (!voiceId) {
      return NextResponse.json({ error: 'Voice ID is required' }, { status: 400 })
    }

    let audioBuffer: Buffer
    const contentType = 'audio/mpeg'

    console.log('[TTS] Kie.ai ElevenLabs v3 TTS 시도:', voiceId)

    // Kie.ai ElevenLabs v3 TTS 호출
    const audioUrl = await textToSpeech(script.trim(), voiceId, {
      stability: 0.5,
      languageCode: languageCode || 'auto',
    })

    // 오디오 다운로드
    audioBuffer = await downloadAudio(audioUrl)
    console.log('[TTS] Kie.ai TTS 성공')

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

    const r2AudioUrl = `${R2_PUBLIC_URL}/${audioKey}`

    console.log(`[TTS] 오디오 생성 완료: provider=kie-elevenlabs-v3, url=${r2AudioUrl}`)

    return NextResponse.json({
      audioUrl: r2AudioUrl,
      voiceId,
      voiceName,
      provider: 'kie-elevenlabs-v3',
    })
  } catch (error) {
    console.error('[TTS] 오디오 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    )
  }
}
