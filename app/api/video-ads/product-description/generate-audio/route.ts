/**
 * 제품 설명 영상 - TTS 오디오 생성 API
 *
 * POST /api/video-ads/product-description/generate-audio
 * - ElevenLabs TTS로 대본을 음성으로 변환
 * - R2에 오디오 파일 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { textToSpeech } from '@/lib/elevenlabs/client'
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
    const { script, voiceId, voiceName } = body

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    if (!voiceId) {
      return NextResponse.json({ error: 'Voice ID is required' }, { status: 400 })
    }

    // ElevenLabs TTS 생성
    const ttsResult = await textToSpeech({
      text: script.trim(),
      voice_id: voiceId,
      model_id: 'eleven_multilingual_v2',
    })

    // R2에 오디오 파일 업로드
    const audioId = randomUUID()
    const audioKey = `video-ads/audio/${user.id}/${audioId}.mp3`

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: audioKey,
        Body: Buffer.from(ttsResult.audioBuffer),
        ContentType: ttsResult.contentType,
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
